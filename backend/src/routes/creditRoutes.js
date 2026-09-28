import express from "express";
import { protect } from "../middleware/auth.js";
import { getCreditBalance } from "../services/creditService.js";
import CreditTransaction from "../models/CreditTransaction.js";

const router = express.Router();

// GET /api/credits/balance
router.get("/balance", protect, async (req, res, next) => {
  try {
    const balance = await getCreditBalance(req.user.id);
    res.json({ success: true, data: balance });
  } catch (error) {
    next(error);
  }
});

// GET /api/credits/history
router.get("/history", protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const transactions = await CreditTransaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await CreditTransaction.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;