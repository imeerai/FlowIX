import mongoose from "mongoose";

export async function connectDB() {
  const mongoUrl = process.env.MONGO_URL || process.env.MANGO_URL;
  if (!mongoUrl) throw new Error("MONGO_URL is required");
  await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 10000,
  });
}
