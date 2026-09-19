// src/api/client.ts
//
// One shared place for talking to the real backend. Every *Api.ts file
// (authApi, and later patientsApi, dentistsApi, appointmentsApi...) should
// call apiRequest() instead of using fetch() directly, so the base URL,
// headers, and error handling stay consistent everywhere.

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  message: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  // A 401 on an authenticated request means the token expired or is invalid.
  // Clear the dead session and send the user back to login, rather than
  // leaving them on a page where every action silently fails.
  if (response.status === 401 && token) {
    // Must match STORAGE_KEY in context/AuthContext.tsx.
    sessionStorage.removeItem("dental_clinic_auth");
    window.location.assign("/login");
    throw new Error("Your session has expired. Please log in again.");
  }

  // The backend always returns JSON, even for errors, but we guard against
  // a completely unreachable server (network error, wrong URL, etc.).
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !body || body.success === false) {
    const message = body && "message" in body ? body.message : "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return body.data;
}
