import axios, { AxiosError } from "axios";

// Base URL for the Node/Express/MongoDB backend.
// Set VITE_API_URL in your .env file to override (defaults to local dev server).
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// The backend always responds with { success, message, data }.
// This type describes that envelope so callers can unwrap `.data.data`.
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// Centralized error handling: on 401 (expired/invalid token), clear auth
// state so the app falls back to the login screen instead of looping on
// authenticated requests that will keep failing.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: unknown }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    const message =
      error.response?.data?.message || error.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

// Resolve a relative /uploads/... path returned by the backend into a full URL.
export const resolveUploadUrl = (path?: string | null) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const origin = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${origin}${path}`;
};
