import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import hpp from "hpp";

import passport from "./src/config/passport.js";

import { generalLimiter, authLimiter, aiLimiter } from "./src/middleware/rateLimiter.js";
import authRoutes from "./src/routes/authRoutes.js";
import creditRoutes from "./src/routes/creditRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import codeRoutes from "./src/routes/codeRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js"; 
import subscriptionRoutes from "./src/routes/subscriptionRoutes.js";

import connectDB from "./src/config/db.js";

const app = express();

// Trust proxy for Render
app.set("trust proxy",1);

//connect DB
connectDB();

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: {policy: "cross-origin"}}));
app.use(hpp());

// CORS
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Body parsing
app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({extended:true,limit:"10mb"}));

// Logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Passport
app.use(passport.initialize());

// Rate limiting
app.use("/api/auth",authLimiter);
app.use("/api/chat",aiLimiter);
app.use("/api/code",aiLimiter);
app.use("/api",generalLimiter);

// Health check
app.get("/api/health",(req,res)=> {
    res.json({
        success: true,
        message: "Nexora API running.",
        services:{
            database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
            Gemini: process.env.GEMINI_API_KEY ? "configured" : "missing",
        },
        timestamps: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// Routes 
app.use("/api/auth", authRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
// -----------------------------------------------------

// 404
app.all("/{*splat}", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`
    });
});

// Global error handler
app.use((err,req,res,next)=>{
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack}),
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Nexora is running on port ${PORT}`));

