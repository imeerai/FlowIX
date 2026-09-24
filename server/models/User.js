import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Project from "./Project.js";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

//hash password before saving to database

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (password) {
  //await
  return await bcrypt.compare(password, this.password);
};

const deleteOwnedProjects = async function () {
  const user = await this.model.findOne(this.getFilter()).select("_id");
  if (user) {
    await Project.deleteMany({ owner: user._id });
  }
};

UserSchema.pre("findOneAndDelete", deleteOwnedProjects);
UserSchema.pre(
  "deleteOne",
  { document: false, query: true },
  deleteOwnedProjects,
);

export const User = mongoose.model("User", UserSchema);
export default User;
