import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import projectRouter from "./routes/projectRoutes.js";

const app = express();
await connectDB();

const allowedOrigins = (process.env.ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Origin not allowed"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  }),
);
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Too many authentication attempts. Please try again later.",
    },
  }),
);

app.get("/", (req, res) => {
  res.send("server is live!!!");
});
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);

//centralized error handling middleware
app.use((err, _req, res, _next) => {
  const status = err.status ?? err.statusCode;
  const httpStatus =
    Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  res.status(httpStatus).json({
    error: httpStatus < 500 ? "Invalid request" : "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT);
}

export default app;
