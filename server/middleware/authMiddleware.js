import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/auth.js";

export function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Authentication required" });
  }
}
