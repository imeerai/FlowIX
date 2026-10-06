import mongoose from "mongoose";
import dns from "node:dns";

// Set reliable DNS servers (Google / Cloudflare) to prevent querySrv ECONNREFUSED errors on Windows / ISP DNS
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Could not set custom DNS servers:", e.message);
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const mongoUrl = process.env.MONGO_URL || process.env.MANGO_URL;
  if (!mongoUrl) throw new Error("MONGO_URL is required");
  await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log("MongoDB connected successfully");
}

