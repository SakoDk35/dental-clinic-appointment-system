// server/src/modules/auth/auth.routes.ts

import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login, register } from "./auth.controller";

export const authRoutes = Router();

const rateLimitResponse = {
  success: false,
  message: "Too many attempts. Please wait a few minutes and try again.",
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: rateLimitResponse,
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: rateLimitResponse,
});

authRoutes.post("/login", loginLimiter, login);
authRoutes.post("/register", registrationLimiter, register);
