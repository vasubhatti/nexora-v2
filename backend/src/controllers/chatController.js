import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import AppError from "../utils/AppError.js";
import {
  chatText,
  chatWithWebSearch,
  chatWithImage,
  chatWithDocument,
  generateImage,
} from "../services/geminiService.js";
import { deductCredits } from "../services/creditService.js";
import { CREDIT_COSTS } from "../config/creditCosts.js";

// ── Helper: auto generate title ───────────────────────────
const generateTitle = (message) => {
  const cleaned = message.replace(/[^\w\s]/gi, "").trim();
  return cleaned.length > 50 ? cleaned.substring(0, 50) + "..." : cleaned;
};

// ── Helper: get conversation history ─────────────────────
const getHistory = async (conversationId, limit = 20) => {
  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse().map((m) => ({
    role: m.role,
    content: m.content,
  }));
};

// ── Create Conversation ───────────────────────────────────
export const createConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.create({
      user: req.user.id,
      title: "New Chat",
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// ── Get All Conversations ─────────────────────────────────
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select("title lastMessage updatedAt createdAt messageCount");

    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

// ── Get Single Conversation with Messages ─────────────────
export const getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!conversation) {
      return next(new AppError("Conversation not found.", 404));
    }

    const messages = await Message.find({
      conversation: req.params.id,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: { conversation, messages },
    });
  } catch (error) {
    next(error);
  }
};

// ── Rename Conversation ───────────────────────────────────
export const renameConversation = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return next(new AppError("Title is required.", 400));

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, isAutoTitle: false },
      { new: true }
    );

    if (!conversation) return next(new AppError("Conversation not found.", 404));

    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

// ── Delete Conversation ───────────────────────────────────
export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!conversation) return next(new AppError("Conversation not found.", 404));

    await Message.deleteMany({ conversation: req.params.id });

    res.json({ success: true, message: "Conversation deleted." });
  } catch (error) {
    next(error);
  }
};

// ── Send Message ──────────────────────────────────────────
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, message, mode = "text" } = req.body;
    const file = req.file;

    // Validate
    if (!conversationId) {
      return next(new AppError("Conversation ID required.", 400));
    }

    // mode: text | thinking | web_search | image_generate
    // file present: image_upload | document_upload

    // Determine credit action
    let creditAction = "CHAT_TEXT";
    if (file) {
      const isImage = file.mimetype.startsWith("image/");
      creditAction = isImage ? "CHAT_IMAGE_UPLOAD" : "CHAT_DOCUMENT_UPLOAD";
    } else if (mode === "thinking") {
      creditAction = "CHAT_THINKING";
    } else if (mode === "web_search") {
      creditAction = "CHAT_WEB_SEARCH";
    } else if (mode === "image_generate") {
      creditAction = "CHAT_IMAGE_GENERATE";
    } else if (mode === "voice") {
      creditAction = "CHAT_VOICE";
    }

    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.id,
    });

    if (!conversation) {
      return next(new AppError("Conversation not found.", 404));
    }

    // Deduct credits
    const creditCost = CREDIT_COSTS[creditAction];
    const remainingCredits = await deductCredits(
      req.user.id,
      creditCost,
      `Chat: ${creditAction}`,
      creditAction
    );

    // Get conversation history for context
    const history = await getHistory(conversationId);

    // Save user message
    const userMessage = await Message.create({
      conversation: conversationId,
      role: "user",
      content: message || "",
      type: file
        ? file.mimetype.startsWith("image/")
          ? "image"
          : "document"
        : mode === "image_generate"
        ? "image_generated"
        : "text",
      file: file
        ? {
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          }
        : undefined,
      creditsUsed: creditCost,
    });

    // Call appropriate AI function
    let aiResponse = { answer: "" };

    if (file) {
      const isImage = file.mimetype.startsWith("image/");
      if (isImage) {
        aiResponse = await chatWithImage(
          message || "Describe this image.",
          file.buffer,
          file.mimetype,
          history
        );
      } else {
        aiResponse = await chatWithDocument(
          message || "Summarize this document.",
          file.buffer,
          file.mimetype,
          history
        );
      }
    } else if (mode === "thinking") {
      aiResponse = await chatText(message, history, true);
    } else if (mode === "web_search") {
      aiResponse = await chatWithWebSearch(message, history);
    } else if (mode === "image_generate") {
        const width = parseInt(req.body.width) || 1024;
        const height = parseInt(req.body.height) || 1024;
        const imageUrl = await generateImage(message, width, height);
        aiResponse = {
          answer: message,
          imageUrl,
        };
      } else if (mode === "voice") {
        aiResponse = await chatText(message, history, false);
      }else {
      aiResponse = await chatText(message, history, false);
    }

    // Save AI message
    const assistantMessage = await Message.create({
      conversation: conversationId,
      role: "assistant",
      content: aiResponse.answer,
      type: mode === "image_generate" ? "image_generated" : "text",
      imageUrl: aiResponse.imageUrl || null,
      creditsUsed: 0,
    });

    // Update conversation metadata
    const updateData = {
      lastMessage: aiResponse.answer.substring(0, 100),
      $inc: { messageCount: 2 },
      updatedAt: new Date(),
    };

    // Auto set title from first message
    if (conversation.isAutoTitle && conversation.messageCount === 0) {
      updateData.title = generateTitle(message || "New Chat");
      updateData.isAutoTitle = false;
    }

    await Conversation.findByIdAndUpdate(conversationId, updateData);

    res.json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
        thinking: aiResponse.thinking || null,
        sources: aiResponse.sources || null,
        remainingCredits,
        creditCost,
      },
    });
  } catch (error) {
    if (error.statusCode === 402) {
      return res.status(402).json({
        success: false,
        message: "Insufficient credits. Please upgrade your plan.",
      });
    }
    next(error);
  }
};

// ── Export Conversation as PDF ────────────────────────────
export const exportConversationPDF = async (req, res, next) => {
  try {
    const { default: PDFDocument } = await import("pdfkit");

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!conversation) return next(new AppError("Conversation not found.", 404));

    const messages = await Message.find({
      conversation: req.params.id,
    }).sort({ createdAt: 1 });

    // Deduct credits
    await deductCredits(
      req.user.id,
      CREDIT_COSTS.CHAT_PDF_EXPORT,
      "PDF Export",
      "CHAT_PDF_EXPORT"
    );

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="nexora-chat-${Date.now()}.pdf"`
    );
    doc.pipe(res);

    // Title
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Nexora AI — Chat Export", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#666666")
      .text(`Conversation: ${conversation.title}`, { align: "center" });
    doc
      .fontSize(10)
      .text(`Exported: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#cccccc");
    doc.moveDown(1);

    // Messages
    messages.forEach((msg) => {
      const isUser = msg.role === "user";

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(isUser ? "#000000" : "#333333")
        .text(isUser ? "YOU" : "NEXORA AI", { continued: false });

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#111111")
        .text(msg.content || "[File uploaded]", {
          width: 500,
          align: "left",
        });

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#eeeeee");
      doc.moveDown(0.8);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};