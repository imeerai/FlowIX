import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import projectRouter from "./routes/projectRoutes.js";

const app = express();
await connectDB();

app.use(cors({ origin: process.env.ORIGINS.split(","), credentials: true }));
app.use(cookieParser());
app.put("/api/projects/:id/files", express.json({ limit: "5mb" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is live!!!");
});
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);

//centralized error handling middleware
app.use((err, _req, res, _next) => {
  console.error("[ERROR]:", err);
  const status = err.status ?? err.statusCode;
  const httpStatus =
    Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  res.status(httpStatus).json({
    error: httpStatus < 500 ? "Invalid request" : "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port https://localhost:${PORT}`);
});
