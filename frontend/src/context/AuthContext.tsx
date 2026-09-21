// src/context/AuthContext.tsx
import { createContext, useState, useMemo, type ReactNode } from "react";
import type { User } from "../types";
import { login as loginRequest, type LoginPayload } from "../api/authApi";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "dental_clinic_auth";

interface StoredAuth {
  user: User;
  token: string;
}

function readStoredAuth(): StoredAuth | null {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<StoredAuth>;
    if (
      typeof parsed.token !== "string" ||
      !parsed.token ||
      !parsed.user ||
      typeof parsed.user.id !== "number" ||
      typeof parsed.user.role !== "string"
    ) {
      throw new Error("Invalid stored session shape.");
    }
    return parsed as StoredAuth;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    return readStoredAuth()?.user ?? null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return readStoredAuth()?.token ?? null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(payload: LoginPayload): Promise<User> {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginRequest(payload);
      setUser(response.user);
      setToken(response.token);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(response));
      return response.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      error,
      login,
      logout,
    }),
    [user, token, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
