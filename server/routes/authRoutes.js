import { Router } from "express";
import { register, login ,logout} from "../controllers/authController.js";
import {  autMiddleware } from "../controllers/authController.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/logout", logout);
authRouter.get("/me", autMiddleware,me);

export default authRouter;
