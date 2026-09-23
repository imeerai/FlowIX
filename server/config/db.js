import mongoose from "mongoose";

export async function connectDB() {
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });
  await mongoose.connect(process.env.MANGO_URL);
}
