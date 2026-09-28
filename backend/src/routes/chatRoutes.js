import express from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
import {
  createConversation,
  getConversations,
  getConversation,
  renameConversation,
  deleteConversation,
  sendMessage,
  exportConversationPDF,
} from "../controllers/chatController.js";

const router = express.Router();

// All routes protected
router.use(protect);

// Conversations
router.post("/conversations", createConversation);
router.get("/conversations", getConversations);
router.get("/conversations/:id", getConversation);
router.patch("/conversations/:id/rename", renameConversation);
router.delete("/conversations/:id", deleteConversation);
router.get("/conversations/:id/export", exportConversationPDF);

// Messages
router.post("/message", upload.single("file"), sendMessage);

export default router;