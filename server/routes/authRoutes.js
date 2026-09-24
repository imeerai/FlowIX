import { Router } from "express";
import {
  register,
  login,
  logout,
  me,
  deleteAccount,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", authMiddleware, me);
authRouter.delete("/me", authMiddleware, deleteAccount);

export default authRouter;
