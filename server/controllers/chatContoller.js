import { Project } from "../models/Project.js";
import { reviseProject } from "../services/ai.js";
import { applyOperations } from "../services/diff.js";
import { rejectInvalidProjectId } from "../utils/projectRequest.js";
import { validatePrompt } from "../utils/validation.js";

export function buildManifest(files) {
  const manifest = [];
  for (const [path, entry] of Object.entries(files)) {
    manifest.push({ path, hash: entry.hash, size: entry.content.length });
  }
  return manifest;
}

//POST /api/project/:id/chat
//send a revision prompt and return updated project.

export async function chat(req, res) {
  const prompt = validatePrompt(req.body?.prompt);

  if (!prompt) {
    return res.status(400).json({ error: "Prompt must be 3-12000 characters" });
  }
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (rejectInvalidProjectId(req, res)) return;
  const project = await Project.findOneAndUpdate(
    {
      _id: req.params.id,
      owner: req.user.userId,
      status: { $in: ["completed", "failed"] },
    },
    { $set: { status: "revising" } },
    { new: true },
  );

  if (!project) {
    return res.status(409).json({ error: "Project is not ready for revision" });
  }

  // save user prompt after claiming the revision
  project.messages.push({
    role: "user",
    content: prompt,
    timestamp: new Date(),
  });
  await project.save();

  try {
    //build compact manifest (path + hash+ size) instead of sending all code
    const manifest = buildManifest(project.files);
    //include all file contents so the ai can do accurate search/ replace
    const relevantFiles = {};
    for (const [path, entry] of Object.entries(project.files)) {
      relevantFiles[path] = entry.content;
    }

    //recent messages for context (last 4 max)
    const recentMessages = project.messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    //Call AI with manifest + relevant files
    const result = await reviseProject(
      prompt,
      manifest,
      relevantFiles,
      recentMessages,
      {
        onPlan: async ({ files }) => {
          await Project.findByIdAndUpdate(project._id, {
            filesPlanned: files,
            filesGenerated: [],
            currentFile: null,
            currentOperation: null,
          });
        },
      },
    );
    //apply operations to files map
    let updatedFiles = { ...project.files };
    const applied = [];
    const errors = [];
    for (const operation of result.operations) {
      await Project.findByIdAndUpdate(project._id, {
        currentFile: operation.path,
        currentOperation: operation.op,
      });

      const resultForFile = applyOperations(updatedFiles, [operation]);
      updatedFiles = resultForFile.files;
      applied.push(...resultForFile.applied);
      errors.push(...resultForFile.errors);

      await Project.findByIdAndUpdate(project._id, {
        $addToSet: { filesGenerated: operation.path },
      });
    }
    if (errors.length > 0) {
    }

    //update project in DB
    project.files = updatedFiles;
    project.filesPlanned = result.operations.map((operation) => ({
      path: operation.path,
      description: `${operation.op} operation`,
    }));
    project.filesGenerated = result.operations.map(
      (operation) => operation.path,
    );
    project.markModified("files");
    project.version += 1;
    project.status = "completed";
    project.currentFile = null;
    project.currentOperation = null;
    project.messages.push({
      role: "assistant",
      content:
        result.description +
        (errors.length > 0
          ? `\n\n Some operations failed: ${errors.join(", ")}`
          : ""),
    });
    await project.save();
    //return updated project to client
    const filesObj = {};
    for (const [path, entry] of Object.entries(project.files)) {
      filesObj[path] = entry.content;
    }
    res.json({
      _id: project._id,
      name: project.name,
      description: project.description,
      files: filesObj,
      messages: project.messages,
      version: project.version,
      status: project.status,
      applied,
      errors,
      aiDescription: result.description,
    });
  } catch (error) {
    project.status = "failed";
    await project.save();
    res.status(500).json({ error: "Revision failed. Please try again." });
  }
}
