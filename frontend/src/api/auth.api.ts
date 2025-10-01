// src/api/auth.api.ts

import http, { setAuthTokens, clearAuthTokens, getAccessToken } from "./http";
import type { User } from "./users.api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
}

export async function login(body: LoginRequest): Promise<TokenResponse> {
  const { data } = await http.post<TokenResponse>("/auth/login", body);
  // Persist only access token (backend doesn't expose refresh)
  setAuthTokens(data.access_token, undefined);
  return data;
}

export async function getMe(): Promise<User> {
    const { data } = await http.get<User>("/auth/me");
    return data;
  }

export function logout(): void {
  clearAuthTokens();
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

// Optional: decode role/email from JWT without hitting /auth/me (best-effort)
export function decodeJwtClaims(token?: string): Record<string, unknown> | null {
  const t = token || getAccessToken();
  if (!t) return null;
  try {
    const payload = t.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Convenience: full login flow returning both token and user
export async function loginAndFetchMe(body: LoginRequest): Promise<{ token: TokenResponse; me: User }> {
  const token = await login(body);
  const me = await getMe();
  return { token, me };
}
export async function registerUser(body: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const { data } = await http.post("/auth/register", body);
  return data;
}

