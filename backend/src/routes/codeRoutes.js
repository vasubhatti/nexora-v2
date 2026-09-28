import express from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
import {
  createProject, getProjects, getProject,
  renameProject, deleteProject,
  upsertFile, deleteFile, uploadFile,
  sendCodeMessage, clearMessages,
} from "../controllers/codeController.js";

const router = express.Router();
router.use(protect);

// Projects
router.get("/projects", getProjects);
router.post("/projects", createProject);
router.get("/projects/:id", getProject);
router.patch("/projects/:id/rename", renameProject);
router.delete("/projects/:id", deleteProject);

// Files
router.post("/projects/:id/files", upsertFile);
router.delete("/projects/:id/files/:fileId", deleteFile);
router.post("/projects/:id/upload", upload.single("file"), uploadFile);

// AI Chat
router.post("/projects/:id/message", sendCodeMessage);
router.delete("/projects/:id/messages", clearMessages);

export default router;