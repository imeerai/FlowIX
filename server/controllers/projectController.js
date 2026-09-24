import Project from "../models/Project.js";
import crypto from "crypto";
import { generateProject } from "../services/ai.js";
import { getProjectLimitError } from "../services/projectLimits.js";
import { rejectInvalidProjectId } from "../utils/projectRequest.js";

function hashContent(content) {
  // Simple hash function for demonstration purposes
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 12);
}

// POST /api/projects
// Create a new project from an AI prompt

export async function createProject(req, res) {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Create project in DB immediately with "pending" status
  const project = await Project.create({
    name: "Planning Project........",
    description: prompt,
    files: {},
    messages: [
      { role: "user", content: prompt },
      {
        role: "assistant",
        content: "Planning project structure...",
      },
    ],
    version: 0,
    owner: req.user.userId,
    status: "pending",
    filesPlanned: [],
    filesGenerated: [],
    currentFile: null,
    error: null,
  });

  // Start background generation
  runBackgroundGeneration(project._id.toString(), prompt).catch(async (err) => {
    console.error(
      `[BACKGROUND AI] fatal generation error for project ${project._id}:`,
      err,
    );

    // Update project status if background generation fails
    await Project.findByIdAndUpdate(project._id, {
      status: "failed",
      error: err.message,
      currentFile: null,
    });
  });

  res.status(201).json({
    _id: project._id,
    name: project.name,
    description: project.description,
    files: {},
    messages: project.messages,
    version: project.version,
    status: project.status,
    filesPlanned: project.filesPlanned,
    filesGenerated: project.filesGenerated,
    currentFile: project.currentFile,
    error: project.error,
    createdAt: project.createdAt,
  });
}

// Background worker to progressively generate files
// and update database in realtime
async function runBackgroundGeneration(projectId, prompt) {
  let fileUpdateQueue = Promise.resolve();
  try {
    console.log(
      `[BACKGROUND AI] Starting generation for project ${projectId}...`,
    );
    const result = await generateProject(prompt, {
      onPlan: async (plan) => {
        console.log(
          `[BACKGROUND AI] Plan created for project ${projectId}. Planned files: ${plan.files.length} files`,
        );
        const fileList = plan.files
          .map((f) => `- \` ${f.path}\`: ${f.description}`)
          .join("\n");
        await Project.findByIdAndUpdate(projectId, {
          name: plan.projectName || "Generated Project",
          status: "generating",
          filesPlanned: plan.files,
          $push: {
            messages: {
              role: "assistant",
              content: `Project website structure:\n${fileList}`,
              timestamp: new Date(),
            },
          },
        });
      },
      onFileStart: async (path) => {
        console.log(
          `[BACKGROUND AI] Starting generation of file ${path} for project ${projectId}`,
        );
        await Project.findByIdAndUpdate(projectId, {
          currentFile: path,
        });
      },
      onFileComplete: async (path, code) => {
        console.log(
          `[BACKGROUND AI] Completed generation of file ${path} for project ${projectId}`,
        );
        const update = fileUpdateQueue.then(async () => {
          const project = await Project.findById(projectId);
          if (project) {
            project.files = project.files || {};
            project.files[path] = { content: code, hash: hashContent(code) };
            project.filesGenerated = [...(project.filesGenerated || []), path];
            project.messages.push({
              role: "assistant",
              content: `File generated: \`${path}\``,
              timestamp: new Date(),
            });
            project.currentFile = null;
            project.markModified("files");
            await project.save();
          }
        });
        fileUpdateQueue = update.catch(() => {});
        await update;
      },
    });
    console.log(
      `[BACKGROUND AI] Generation completed for project ${projectId}`,
    );

    const project = await Project.findById(projectId);
    if (project) {
      project.status = "completed";
      project.version = 1;
      if (result.description) {
        project.description = result.description;
      }
      project.messages.push({
        role: "assistant",
        content:
          "website generation completed! you can now edit the files or publish your website.",
        timestamp: new Date(),
      });
      await project.save();
    }
  } catch (error) {
    console.error(
      `[BACKGROUND AI] Error in background generation for project ${projectId}:`,
      error,
    );
    await Project.findByIdAndUpdate(projectId, {
      status: "failed",
      error: error.message,
      $push: {
        messages: {
          role: "assistant",
          content: `Error during generation: ${error.message}`,
          timestamp: new Date(),
        },
      },
    });
  }
}

// GET /api/projects/
// List all projects owned by the user (summary only, no file content)

export async function listProjects(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const projects = await Project.find(
    { owner: req.user.userId },
    {
      name: 1,
      description: 1,
      version: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  ).sort({ updatedAt: -1 });

  res.json(projects);
}

// GET /api/projects/:id
// Get full project details

export async function getProjectDetails(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (rejectInvalidProjectId(req, res)) return;

  const project = await Project.findOne({
    _id: req.params.id,
    owner: req.user.userId,
  });
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

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
    filesPlanned: project.filesPlanned,
    filesGenerated: project.filesGenerated,
    currentFile: project.currentFile,
    error: project.error,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}

// DELETE /api/projects/:id
// Delete a project

export async function deleteProject(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (rejectInvalidProjectId(req, res)) return;

  const result = await Project.findOneAndDelete({
    _id: req.params.id,
    owner: req.user.userId,
  });

  if (!result) {
    return res.status(404).json({ error: "Project not found" });
  }

  res.json({ message: true });
}

// PUT /api/projects/:id/files
// Update a project (manual edit)

export async function updateProjectFiles(req, res) {
  const { files } = req.body;

  if (!files || typeof files !== "object") {
    return res.status(400).json({ error: "files object is required" });
  }

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (rejectInvalidProjectId(req, res)) return;

  const limitError = getProjectLimitError(files);
  if (limitError) {
    return res.status(413).json({
      error: limitError,
      code: "PROJECT_LIMIT_REACHED",
    });
  }

  const project = await Project.findOne({
    _id: req.params.id,
    owner: req.user.userId,
  });

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  // Rebuild project files map with content and hashes
  const newFiles = {};

  for (const [path, content] of Object.entries(files)) {
    if (typeof content === "string") {
      newFiles[path] = {
        content,
        hash: hashContent(content),
      };
    }
  }

  project.files = newFiles;

  await project.save();

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
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}

// { ReturnDocument: "after" },
// POST /api/projects/:id/publish
// Mark a project as publicly published

export async function publishProject(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (rejectInvalidProjectId(req, res)) return;

  const project = await Project.findOneAndUpdate(
    {
      _id: req.params.id,
      owner: req.user.userId,
    },
    {
      published: true,
    },
    {
      new: true,
    },
  );

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  res.json({
    message: true,
    published: project.published,
  });
}

// GET /api/projects/public/:id
// Get a publicly published project details (without auth)

export async function getPublicProject(req, res) {
  if (rejectInvalidProjectId(req, res)) return;

  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  if (!project.published) {
    return res.status(403).json({
      error: "Project is not published yet",
    });
  }

  const filesObj = {};

  for (const [path, entry] of Object.entries(project.files)) {
    filesObj[path] = entry.content;
  }

  res.json({
    _id: project._id,
    name: project.name,
    description: project.description,
    published: project.published,
    files: filesObj,
    version: project.version,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}
