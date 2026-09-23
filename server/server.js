import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";

const app = express();
connectDB();

app.use(cors({ origin: process.env.ORIGINS.split(","), credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is live!!!");
});
app.use("/api/auth", authRouter);

//centralized error handling middleware
app.use((err, _req, res, _next) => {
  console.error(`[ERROR]: ${err.message}`);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port https://localhost:${PORT}`);
});
