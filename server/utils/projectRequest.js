import mongoose from "mongoose";

export function isValidProjectId(value) {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

export function rejectInvalidProjectId(req, res) {
  if (isValidProjectId(req.params.id)) return false;

  res.status(400).json({ error: "Invalid project id" });
  return true;
}
