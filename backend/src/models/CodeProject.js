import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, default: "" }, // full path: src/components/App.jsx
  content: { type: String, default: "" },
  language: { type: String, default: "javascript" },
});

const codeMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const codeProjectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New Project", maxlength: 100 },
    description: { type: String, default: "" },
    files: [fileSchema],
    messages: [codeMessageSchema],
  },
  { timestamps: true }
);

codeProjectSchema.index({ user: 1, updatedAt: -1 });
const CodeProject = mongoose.model("CodeProject", codeProjectSchema);
export default CodeProject;