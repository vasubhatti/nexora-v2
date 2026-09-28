import { deductCredits } from "../services/creditService.js";
import { CREDIT_COSTS } from "../config/creditCosts.js";
import AppError from "../utils/AppError.js";

const checkCredits = (action) => async (req, res, next) => {
  try {
    const cost = CREDIT_COSTS[action];

    if (cost === undefined || cost === null || isNaN(cost)) {
      return next(new AppError(`Credit cost not defined for: ${action}`, 500));
    }

    const remainingCredits = await deductCredits(
      req.user.id,
      cost,
      `Used ${action}`,
      action
    );

    req.creditCost = cost;
    req.remainingCredits = remainingCredits;
    next();
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

export default checkCredits;