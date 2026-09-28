import express from "express";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import CodeProject from "../models/CodeProject.js";
import CreditTransaction from "../models/CreditTransaction.js";
import { adminOnly } from "../middleware/adminAuth.js";
import { addCredits, deductCredits } from "../services/creditService.js";
import { PLAN_LIMITS } from "../config/creditCosts.js";

const router = express.Router();

// ── Stats ─────────────────────────────────────────────────
router.get("/stats", adminOnly, async (req, res, next) => {
  try {
    const [
      totalUsers,
      bannedUsers,
      totalConversations,
      totalMessages,
      totalProjects,
      newUsersToday,
      messagestoday,
      subscriptionCounts,
      totalCreditsUsed,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      Conversation.countDocuments(),
      Message.countDocuments(),
      CodeProject.countDocuments(),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Message.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      User.aggregate([
        { $group: { _id: "$subscription", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $group: { _id: null, total: { $sum: "$creditsUsed" } } },
      ]),
    ]);

    const subs = { free: 0, pro: 0, enterprise: 0 };
    subscriptionCounts.forEach(s => { subs[s._id] = s.count; });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers: totalUsers - bannedUsers,
        bannedUsers,
        totalConversations,
        totalMessages,
        totalProjects,
        newUsersToday,
        messagestoday,
        subscriptions: subs,
        totalCreditsUsed: totalCreditsUsed[0]?.total || 0,
      },
    });
  } catch (error) { next(error); }
});

// ── Users ─────────────────────────────────────────────────
router.get("/users", adminOnly, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const subscription = req.query.subscription || "";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (subscription) query.subscription = subscription;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
});

// Ban/Unban
router.patch("/users/:id/ban", adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.role === "admin") return res.status(400).json({ success: false, message: "Cannot ban an admin." });

    user.isBanned = !user.isBanned;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: user.isBanned ? "User banned." : "User unbanned.", data: { isBanned: user.isBanned } });
  } catch (error) { next(error); }
});

// Delete
router.delete("/users/:id", adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.role === "admin") return res.status(400).json({ success: false, message: "Cannot delete an admin." });

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Conversation.deleteMany({ user: req.params.id }),
      Message.deleteMany({ user: req.params.id }),
      CodeProject.deleteMany({ user: req.params.id }),
    ]);

    res.json({ success: true, message: "User and all their data deleted." });
  } catch (error) { next(error); }
});

// Credits
router.post("/users/:id/credits", adminOnly, async (req, res, next) => {
  try {
    const { amount, type, reason } = req.body;
    const parsed = Number(amount);
    if (!parsed || isNaN(parsed)) return res.status(400).json({ success: false, message: "Valid amount required." });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    let newBalance;
    if (type === "deduct") {
      newBalance = await deductCredits(req.params.id, parsed, reason || "Admin deduction", "ADMIN_DEDUCT");
    } else {
      newBalance = await addCredits(req.params.id, parsed, reason || "Admin credit grant", "bonus");
    }

    res.json({ success: true, message: `${parsed} credits ${type === "deduct" ? "deducted" : "added"}.`, data: { newBalance } });
  } catch (error) { next(error); }
});

// Role
router.patch("/users/:id/role", adminOnly, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role." });

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password -refreshToken");
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

export default router;