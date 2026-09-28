import CodeProject from "../models/CodeProject.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { codeChat } from "../services/geminiService.js";
import { deductCredits } from "../services/creditService.js";
import { CREDIT_COSTS, PLAN_LIMITS } from "../config/creditCosts.js";

// ── Create Project ────────────────────────────────────────
export const createProject = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const user = await User.findById(req.user.id);

    const limit = PLAN_LIMITS[user.subscription]?.codeProjects ?? 2;
    const count = await CodeProject.countDocuments({ user: req.user.id });

    if (count >= limit) {
      return res.status(403).json({
        success: false,
        message: `Your ${user.subscription} plan allows ${limit === Infinity ? "unlimited" : limit} projects. Upgrade to create more.`,
      });
    }

    const project = await CodeProject.create({
      user: req.user.id,
      title: title || "New Project",
      description: description || "",
      files: [],
      messages: [],
    });

    await User.findByIdAndUpdate(req.user.id, { $inc: { codeProjectsCount: 1 } });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// ── Get All Projects ──────────────────────────────────────
export const getProjects = async (req, res, next) => {
  try {
    const projects = await CodeProject.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .select("title description files updatedAt createdAt")
      .lean();

    const user = await User.findById(req.user.id);
    const limit = PLAN_LIMITS[user.subscription]?.codeProjects ?? 2;

    res.json({
      success: true,
      data: projects,
      meta: {
        count: projects.length,
        limit: limit === Infinity ? null : limit,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Get Single Project ────────────────────────────────────
export const getProject = async (req, res, next) => {
  try {
    const project = await CodeProject.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!project) return next(new AppError("Project not found.", 404));

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// ── Rename Project ────────────────────────────────────────
export const renameProject = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) return next(new AppError("Title required.", 400));

    const project = await CodeProject.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title: title.trim() },
      { new: true }
    );

    if (!project) return next(new AppError("Project not found.", 404));
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// ── Delete Project ────────────────────────────────────────
export const deleteProject = async (req, res, next) => {
  try {
    const project = await CodeProject.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!project) return next(new AppError("Project not found.", 404));
    await User.findByIdAndUpdate(req.user.id, { $inc: { codeProjectsCount: -1 } });

    res.json({ success: true, message: "Project deleted." });
  } catch (error) {
    next(error);
  }
};

// ── Add / Update File ─────────────────────────────────────
export const upsertFile = async (req, res, next) => {
  try {
    const { name, content, language, path: filePath } = req.body;
    if (!name?.trim()) return next(new AppError("File name required.", 400));

    const project = await CodeProject.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) return next(new AppError("Project not found.", 404));

    const fullPath = filePath || name;
    const existingIndex = project.files.findIndex(
      f => (f.path || f.name) === fullPath
    );

    const langMap = {
      js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
      py: "python", java: "java", cpp: "cpp", c: "c", cs: "csharp",
      go: "go", rs: "rust", php: "php", rb: "ruby", html: "html",
      css: "css", scss: "scss", json: "json", md: "markdown",
      sh: "shell", xml: "xml", yaml: "yaml", yml: "yaml", sql: "sql",
    };
    const ext = name.split(".").pop()?.toLowerCase();
    const detectedLang = langMap[ext] || "plaintext";

    if (existingIndex > -1) {
      project.files[existingIndex].content = content ?? project.files[existingIndex].content;
      project.files[existingIndex].language = language || detectedLang;
      project.files[existingIndex].path = fullPath;
    } else {
      project.files.push({
        name,
        path: fullPath,
        content: content || "",
        language: language || detectedLang,
      });
    }

    project.updatedAt = new Date();
    await project.save();
    res.json({ success: true, data: project.files });
  } catch (error) {
    next(error);
  }
};

// ── Delete File ───────────────────────────────────────────
export const deleteFile = async (req, res, next) => {
  try {
    const project = await CodeProject.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!project) return next(new AppError("Project not found.", 404));

    project.files = project.files.filter(f => f._id.toString() !== req.params.fileId);
    await project.save();

    res.json({ success: true, data: project.files });
  } catch (error) {
    next(error);
  }
};

// ── Upload File into Project ──────────────────────────────
export const uploadFile = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return next(new AppError("No file uploaded.", 400));

    const project = await CodeProject.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!project) return next(new AppError("Project not found.", 404));

    // Deduct credits
    await deductCredits(
      req.user.id,
      CREDIT_COSTS.CODE_FILE_UPLOAD,
      `Code file upload: ${file.originalname}`,
      "CODE_FILE_UPLOAD"
    );

    const content = file.buffer.toString("utf-8");
    const ext = file.originalname.split(".").pop()?.toLowerCase();

    const langMap = {
      js: "javascript", ts: "typescript", jsx: "javascript",
      tsx: "typescript", py: "python", java: "java",
      cpp: "cpp", cs: "csharp", go: "go", rs: "rust",
      php: "php", rb: "ruby", html: "html", css: "css",
      json: "json", md: "markdown", txt: "text",
    };

    const language = langMap[ext] || "text";

    // In uploadFile, replace the push logic:
    const filePath = req.body.folder
      ? `${req.body.folder}/${file.originalname}`
      : file.originalname;

    const existingIndex = project.files.findIndex(
      f => (f.path || f.name) === filePath
    );

    if (existingIndex > -1) {
      project.files[existingIndex].content = content;
      project.files[existingIndex].language = language;
      project.files[existingIndex].path = filePath;
    } else {
      project.files.push({ name: file.originalname, path: filePath, content, language });
    }

    await project.save();

    res.json({
      success: true,
      message: `${file.originalname} uploaded.`,
      data: project.files,
      remainingCredits: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── Send Message to AI ────────────────────────────────────
export const sendCodeMessage = async (req, res, next) => {
  try {
    const { message, includeFiles = true } = req.body;

    if (!message?.trim()) return next(new AppError("Message required.", 400));

    const project = await CodeProject.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!project) return next(new AppError("Project not found.", 404));

    // Deduct credits
    const remainingCredits = await deductCredits(
      req.user.id,
      CREDIT_COSTS.CODE_REQUEST,
      `Code AI: ${project.title}`,
      "CODE_REQUEST"
    );

    // Prepare history (last 20 messages)
    const history = project.messages.slice(-20).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Optionally include project files as context
    const files = includeFiles ? project.files.map(f => ({
      name: f.name,
      path: f.path || f.name,
      content: f.content,
      language: f.language,
    })) : [];

    // Call AI
    const response = await codeChat(message, history, files);

    // Save both messages to project
    project.messages.push({ role: "user", content: message });
    project.messages.push({ role: "assistant", content: response.answer });
    project.updatedAt = new Date();
    await project.save();

    res.json({
      success: true,
      data: {
        answer: response.answer,
        remainingCredits,
        creditCost: CREDIT_COSTS.CODE_REQUEST,
      },
    });
  } catch (error) {
    if (error.statusCode === 402) {
      return res.status(402).json({
        success: false,
        message: "Insufficient credits.",
      });
    }
    next(error);
  }
};

// ── Clear Chat History ────────────────────────────────────
export const clearMessages = async (req, res, next) => {
  try {
    const project = await CodeProject.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { messages: [] },
      { new: true }
    );
    if (!project) return next(new AppError("Project not found.", 404));
    res.json({ success: true, message: "Chat cleared." });
  } catch (error) {
    next(error);
  }
};

