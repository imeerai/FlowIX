import { Project } from "../models/Project.js";
import { reviseProject } from "../services/ai.js";
import { applyOperations } from "../services/diff.js";
import { getProjectLimitError } from "../services/projectLimits.js";
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

  const currentLimitError = getProjectLimitError(project.files);
  if (currentLimitError) {
    project.status = "completed";
    await project.save();
    return res
      .status(413)
      .json({ error: currentLimitError, code: "PROJECT_LIMIT_REACHED" });
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
    );
    //apply operations to files map
    const {
      files: updatedFiles,
      applied,
      errors,
    } = applyOperations(project.files, result.operations);
    const limitError = getProjectLimitError(updatedFiles);
    if (limitError) {
      project.status = "completed";
      await project.save();
      return res
        .status(413)
        .json({ error: limitError, code: "PROJECT_LIMIT_REACHED" });
    }
    if (errors.length > 0) {
    }

    //update project in DB
    project.files = updatedFiles;
    project.markModified("files");
    project.version += 1;
    project.status = "completed";
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
