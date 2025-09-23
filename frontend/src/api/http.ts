// src/api/http.ts
// Axios singleton with JWT auth, automatic refresh, and sane defaults.
// Backend defaults assumed:
// - Access token: Bearer JWT (short-lived)
// - Refresh token: long-lived (HTTP-only cookie or returned once). Here we store it optionally in localStorage
//   for simplicity; if your backend sets it as cookie, you can remove REFRESH handling from storage.

import axios, { AxiosError, AxiosRequestConfig } from "axios";

// ------------------------------
// Env & constants
// ------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TIMEOUT_MS = 15000;
const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token"; // optional, depending on your backend

// Optional: centralize login route for 401 fallbacks
const LOGIN_ROUTE = "/login";

// ------------------------------
// Token utils
// ------------------------------
export function getAccessToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
export function setAuthTokens(access?: string | null, refresh?: string | null) {
  try {
    if (typeof access !== "undefined") {
      access ? localStorage.setItem(TOKEN_KEY, access) : localStorage.removeItem(TOKEN_KEY);
    }
    if (typeof refresh !== "undefined") {
      refresh ? localStorage.setItem(REFRESH_KEY, refresh) : localStorage.removeItem(REFRESH_KEY);
    }
  } catch { /* ignore quota/private mode */ }
}
export function clearAuthTokens() { setAuthTokens(null, null); }

// ------------------------------
// Axios instance
// ------------------------------
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  // If your backend uses cookies for refresh endpoints:
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ------------------------------
// Request: attach Authorization
// ------------------------------
http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ------------------------------
// Refresh flow
// ------------------------------
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Avoid duplicate refresh calls
  if (refreshPromise) return refreshPromise;

  const doRefresh = async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      // Adjust if your backend expects cookie-based refresh (GET) or a different path/body
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" }, withCredentials: false }
      );

      const newAccess: string | undefined = data?.access_token || data?.access || data?.token;
      const newRefresh: string | undefined = data?.refresh_token || data?.refresh;
      if (newAccess) setAuthTokens(newAccess, typeof newRefresh === "string" ? newRefresh : undefined);
      return newAccess ?? null;
    } catch (e) {
      return null;
    } finally {
      refreshPromise = null;
    }
  };

  refreshPromise = doRefresh();
  return refreshPromise;
}

function redirectToLogin() {
  try {
    if (typeof window !== "undefined") {
      // preserve current path to return after login
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.assign(`${LOGIN_ROUTE}?next=${next}`);
    }
  } catch { /* noop */ }
}

// ------------------------------
// Response: auto-refresh on 401
// ------------------------------
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry401?: boolean }) | undefined;
    const status = error.response?.status;

    // Network or CORS errors: bubble up
    if (!status || !original) {
      return Promise.reject(error);
    }

    if (status === 401 && !original._retry401) {
      original._retry401 = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        // retry original request with new token
        original.headers = original.headers || {};
        (original.headers as Record<string, string>)["Authorization"] = `Bearer ${newToken}`;
        return http(original);
      }
      // Refresh failed → clear and redirect
      clearAuthTokens();
      redirectToLogin();
    }

    // 403/404/422 etc: let the caller handle it
    return Promise.reject(error);
  }
);

export default http;
