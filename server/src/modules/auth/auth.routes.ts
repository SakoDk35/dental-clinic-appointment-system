// server/src/modules/auth/auth.routes.ts

import { Router } from "express";
import { login, register } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", login);
authRoutes.post("/register", register);
