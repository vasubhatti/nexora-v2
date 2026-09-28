import User from "../models/User.js";
import CreditTransaction from "../models/CreditTransaction.js";
import { PLAN_LIMITS } from "../config/creditCosts.js";

export const checkAndResetCredits = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  const resetDate = new Date(user.creditsResetDate);

  if (now >= resetDate) {
    const newCredits = PLAN_LIMITS[user.subscription]?.credits || 100;
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);

    user.creditBalance = newCredits;
    user.creditsUsed = 0;
    user.creditsResetDate = nextReset;
    await user.save({ validateBeforeSave: false });

    await CreditTransaction.create({
      user: userId,
      type: "reset",
      amount: newCredits,
      balanceAfter: newCredits,
      description: `Monthly reset — ${user.subscription} plan`,
      action: "MONTHLY_RESET",
    });
  }

  return user;
};

export const deductCredits = async (userId, amount, description, action) => {
  await checkAndResetCredits(userId);

  const safeAmount = Number(amount);
  if (isNaN(safeAmount) || safeAmount <= 0) {
    throw new Error("Invalid credit amount");
  }

  const updated = await User.findOneAndUpdate(
    {
      _id: userId,
      creditBalance: { $gte: safeAmount },
    },
    {
      $inc: {
        creditBalance: -safeAmount,
        creditsUsed: safeAmount,
      },
    },
    { new: true }
  );

  if (!updated) {
    const err = new Error("Insufficient credits");
    err.statusCode = 402;
    throw err;
  }

  await CreditTransaction.create({
    user: userId,
    type: "deduction",
    amount: safeAmount,
    balanceAfter: updated.creditBalance,
    description: description || "Credit deduction",
    action: action || "UNKNOWN",
  });

  return updated.creditBalance;
};

export const addCredits = async (userId, amount, description, type = "topup") => {
  const safeAmount = Number(amount);
  if (isNaN(safeAmount) || safeAmount <= 0) {
    throw new Error("Invalid credit amount");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { creditBalance: safeAmount } },
    { new: true }
  );

  if (!user) throw new Error("User not found");

  await CreditTransaction.create({
    user: userId,
    type,
    amount: safeAmount,
    balanceAfter: user.creditBalance,
    description,
    action: type.toUpperCase(),
  });

  return user.creditBalance;
};

export const getCreditBalance = async (userId) => {
  await checkAndResetCredits(userId);
  const user = await User.findById(userId);
  return {
    creditBalance: user.creditBalance,
    creditsUsed: user.creditsUsed,
    creditsResetDate: user.creditsResetDate,
    subscription: user.subscription,
  };
};