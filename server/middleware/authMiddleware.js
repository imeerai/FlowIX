import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/auth.js";

export function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Access denied: No session token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "session expired or invalid" });
  }
}
