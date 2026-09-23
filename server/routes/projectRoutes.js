import { Router } from "express";
import {
  createProject,
  listProjects,
  getProjectDetails,
  deleteProject,
  updateProjectFiles,
  publishProject,
  getPublicProject,
} from "../controllers/projectController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { chat } from "../controllers/chatContoller.js";

const projectRouter = Router();

//public route
projectRouter.get("/public/:id", getPublicProject);

//protect all following routes with auth middleware
projectRouter.use(authMiddleware);

projectRouter.post("/", createProject);
projectRouter.get("/", listProjects);
projectRouter.get("/:id", getProjectDetails);
projectRouter.delete("/:id", deleteProject);
projectRouter.put("/:id/files", updateProjectFiles);
projectRouter.post("/:id/publish", publishProject);

//chat
projectRouter.post("/:id/chat", chat);

export default projectRouter;
