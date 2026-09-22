// src/api/authApi.ts
//
// Calls the real backend (POST /api/v1/auth/login, /register).

import { apiRequest } from "./client";
import type { User } from "../types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth?: string;
}

// No token/auto-login in the response — registration and login stay two
// separate, simple steps in this MVP.
export async function register(payload: RegisterPayload): Promise<{ user: User }> {
  return apiRequest<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
