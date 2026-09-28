import crypto from "crypto";
import User from "../models/User.js";
import {
  generateAccessToken, generateRefreshToken, verifyRefreshToken,
} from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
import {
  sendOTPEmail, sendForgotPasswordEmail, sendWelcomeEmail,
} from "../services/emailService.js";

// In-memory stores (resets on server restart — fine for portfolio)
const otpStore = new Map();     // email -> { otp, expiry, userId }
const resetStore = new Map();   // token -> { userId, expiry }

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return next(new AppError("Name, email and password are required.", 400));
    }

    const existing = await User.findOne({ email });
    if (existing) return next(new AppError("Email already registered.", 400));

    const user = await User.create({ name, email, password, isVerified: false });

    // Generate OTP
    const otp = generateOTP();
    const expiry = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiry, userId: user._id.toString(), type: "register" });

    try {
      await sendOTPEmail(email, name, otp);
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.log(`\n🔐 DEV REGISTER OTP for ${email}: ${otp}\n`);
      }
    }

    res.status(201).json({
      success: true,
      requiresOTP: true,
      email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
      message: "Account created. Verification code sent to your email.",
    });
  } catch (error) { next(error); }
};  
// ── Login Step 1: verify credentials → send OTP ──────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(new AppError("Email and password required.", 400));

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) return next(new AppError("Invalid email or password.", 401));
    if (user.isBanned) return next(new AppError("Your account has been suspended.", 403));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new AppError("Invalid email or password.", 401));

    // Generate and store OTP
    const otp = generateOTP();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email, { otp, expiry, userId: user._id.toString() });

    // Send OTP email
    try {
      await sendOTPEmail(email, user.name, otp);
    } catch (emailErr) {
      console.error("Email send failed:", emailErr.message);
      // Fallback: log OTP in development
      if (process.env.NODE_ENV === "development") {
        console.log(`\n🔐 DEV OTP for ${email}: ${otp}\n`);
      }
    }

    res.json({
      success: true,
      requiresOTP: true,
      email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
      message: "Verification code sent to your email.",
    });
  } catch (error) { next(error); }
};

// ── Login Step 2: verify OTP → return tokens ─────────────
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new AppError("Email and OTP required.", 400));

    const stored = otpStore.get(email);
    if (!stored) return next(new AppError("OTP expired or not found. Please login again.", 400));
    if (Date.now() > stored.expiry) {
      otpStore.delete(email);
      return next(new AppError("OTP expired. Please login again.", 400));
    }
    if (stored.otp !== otp.toString()) {
      return next(new AppError("Invalid verification code.", 400));
    }

    otpStore.delete(email);

    const user = await User.findById(stored.userId);
    if (!user) return next(new AppError("User not found.", 404));

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: "Login successful.",
      accessToken,
      refreshToken,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, subscription: user.subscription,
        creditBalance: user.creditBalance, avatar: user.avatar,
        codeProjectsCount: user.codeProjectsCount,
      },
    });
  } catch (error) { next(error); }
};

// ── Resend OTP ────────────────────────────────────────────
export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new AppError("User not found.", 404));

    const otp = generateOTP();
    const expiry = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiry, userId: user._id.toString() });

    try {
      await sendOTPEmail(email, user.name, otp);
    } catch {
      if (process.env.NODE_ENV === "development") console.log(`DEV OTP: ${otp}`);
    }

    res.json({ success: true, message: "New verification code sent." });
  } catch (error) { next(error); }
};

// ── Forgot Password ───────────────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError("Email required.", 400));

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: "If that email exists, a reset link was sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
    resetStore.set(token, { userId: user._id.toString(), expiry });

    try {
      await sendForgotPasswordEmail(email, user.name, token);
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.log(`DEV reset token: ${token}`);
      }
    }

    res.json({ success: true, message: "If that email exists, a reset link was sent." });
  } catch (error) { next(error); }
};

// ── Reset Password ────────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return next(new AppError("Token and password required.", 400));
    if (password.length < 6) return next(new AppError("Password must be at least 6 characters.", 400));

    const stored = resetStore.get(token);
    if (!stored) return next(new AppError("Invalid or expired reset link.", 400));
    if (Date.now() > stored.expiry) {
      resetStore.delete(token);
      return next(new AppError("Reset link expired. Please request a new one.", 400));
    }

    const user = await User.findById(stored.userId);
    if (!user) return next(new AppError("User not found.", 404));

    user.password = password;
    user.refreshToken = null;
    await user.save();

    resetStore.delete(token);

    res.json({ success: true, message: "Password reset successfully. Please log in." });
  } catch (error) { next(error); }
};

// ── Change Password (authenticated) ──────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new AppError("Current and new password required.", 400));
    }
    if (newPassword.length < 6) {
      return next(new AppError("New password must be at least 6 characters.", 400));
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return next(new AppError("User not found.", 404));

    if (!user.password) {
      return next(new AppError("This account uses Google login. No password to change.", 400));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return next(new AppError("Current password is incorrect.", 400));

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully." });
  } catch (error) { next(error); }
};

// ── Refresh Token ─────────────────────────────────────────
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError("Refresh token required.", 401));

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError("Invalid refresh token.", 401));
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) { next(new AppError("Invalid refresh token.", 401)); }
};

// ── Logout ────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.json({ success: true, message: "Logged out." });
  } catch (error) { next(error); }
};

// ── Get Me ────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("+password");
    res.json({
      success: true,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, subscription: user.subscription,
        creditBalance: user.creditBalance, creditsUsed: user.creditsUsed,
        creditsResetDate: user.creditsResetDate, avatar: user.avatar,
        codeProjectsCount: user.codeProjectsCount, createdAt: user.createdAt,
        hasPassword: !!user.password,
        googleId: !!user.googleId,
      },
    });
  } catch (error) { next(error); }
};
// ── Google Callback ───────────────────────────────────────
export const googleCallback = async (req, res, next) => {
  try {
    const user = req.user;
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) { next(error); }
};

// ── Delete Account ────────────────────────────────────────
export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return next(new AppError("User not found.", 404));

    // If email/password user, verify password first
    if (user.password) {
      if (!password) return next(new AppError("Password required to delete account.", 400));
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return next(new AppError("Incorrect password.", 400));
    }

    // Import models needed
    const { default: Conversation } = await import("../models/Conversation.js");
    const { default: Message } = await import("../models/Message.js");
    const { default: CodeProject } = await import("../models/CodeProject.js");
    const { default: CreditTransaction } = await import("../models/CreditTransaction.js");

    await Promise.all([
      Conversation.deleteMany({ user: req.user.id }),
      Message.deleteMany({ conversation: { $in: (await Conversation.find({ user: req.user.id })).map(c => c._id) } }),
      CodeProject.deleteMany({ user: req.user.id }),
      CreditTransaction.deleteMany({ user: req.user.id }),
      User.findByIdAndDelete(req.user.id),
    ]);

    res.json({ success: true, message: "Account permanently deleted." });
  } catch (error) { next(error); }
};



