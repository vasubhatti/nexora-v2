import express from "express";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import { addCredits } from "../services/creditService.js";
import { PLAN_LIMITS } from "../config/creditCosts.js";

const router = express.Router();

const PLANS = {
  free:       { credits: 100,   label: "Free" },
  pro:        { credits: 1000,  label: "Pro" },
  enterprise: { credits: 10000, label: "Enterprise" },
};

const PROMO_CODES = {
  "NEXORA100":  { credits: 100, description: "100 bonus credits" },
  "NEXORA500":  { credits: 500, description: "500 bonus credits" },
  "WELCOME200": { credits: 200, description: "Welcome bonus 200 credits" },
  "DEVTEST999": { credits: 999, description: "Developer test credits" },
  "LAUNCH50":   { credits: 50,  description: "Launch special 50 credits" },
};

const redeemedCodes = new Map();

router.get("/plans", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "free", label: "Free", price: "$0/month", credits: 100,
        codeProjects: 2,
        features: ["100 credits/month", "All AI tools", "2 code projects", "Chat history", "Basic support"],
      },
      {
        id: "pro", label: "Pro", price: "$9/month", credits: 1000,
        codeProjects: 10,
        features: ["1,000 credits/month", "All AI tools", "10 code projects", "Chat history", "Priority support", "Faster responses"],
      },
      {
        id: "enterprise", label: "Enterprise", price: "$29/month", credits: 10000,
        codeProjects: "Unlimited",
        features: ["10,000 credits/month", "All AI tools", "Unlimited projects", "Chat history", "Dedicated support", "API access"],
      },
    ],
  });
});

router.post("/upgrade", protect, async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ success: false, message: "Invalid plan." });
    if (req.user.subscription === plan) return res.status(400).json({ success: false, message: `Already on ${plan} plan.` });

    const user = await User.findById(req.user.id);
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);

    user.subscription = plan;
    user.creditBalance = PLANS[plan].credits;
    user.creditsUsed = 0;
    user.creditsResetDate = nextReset;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Upgraded to ${PLANS[plan].label} plan.`,
      data: { subscription: user.subscription, creditBalance: user.creditBalance },
    });
  } catch (error) { next(error); }
});

router.post("/redeem", protect, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code required." });

    const upper = code.toUpperCase().trim();
    const promo = PROMO_CODES[upper];
    if (!promo) return res.status(400).json({ success: false, message: "Invalid promo code." });

    const userRedeemed = redeemedCodes.get(req.user.id.toString()) || [];
    if (userRedeemed.includes(upper)) return res.status(400).json({ success: false, message: "Code already redeemed." });

    const newBalance = await addCredits(req.user.id, promo.credits, `Promo: ${upper}`, "bonus");
    redeemedCodes.set(req.user.id.toString(), [...userRedeemed, upper]);

    res.json({
      success: true,
      message: `🎉 ${promo.description} added!`,
      data: { creditsAdded: promo.credits, newBalance },
    });
  } catch (error) { next(error); }
});

export default router;