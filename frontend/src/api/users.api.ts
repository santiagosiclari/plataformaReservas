// src/api/users.api.ts
// Thin client for User endpoints. Uses the same axios http client as the rest of the API layer.

import type { AxiosResponse } from "axios";
import http from "./http";

// ---------- Types ----------
export type Role = "PLAYER" | "OWNER" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  created_at: string; // ISO8601
  // relations are omitted by default; add if your API embeds them
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ListUsersParams {
  q?: string; // optional search by name/email
  role?: Role | string;
  page?: number;
  page_size?: number;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string; // plain text, server hashes it
  phone?: string | null;
  role?: Role; // default is PLAYER on the backend
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string | null;
  role?: Role; // Only admins/owners depending on policy
  password?: string; // optional; if provided, backend should update hash
}

// Normalize either array or {items, total, ...}
function normalizePaginated<T>(data: any, fallbackPage = 1, fallbackSize = 50): Paginated<T> {
  if (Array.isArray(data)) {
    return { items: data as T[], total: (data as T[]).length, page: fallbackPage, page_size: fallbackSize };
  }
  if (data && Array.isArray(data.items)) return data as Paginated<T>;
  return { items: [], total: 0, page: fallbackPage, page_size: fallbackSize };
}

// ---------- API Calls ----------

// Current session user
export async function getMe(): Promise<User> {
  const { data } = await http.get("/me");
  return data as User;
}

export async function updateMe(body: UpdateUserDTO): Promise<User> {
  const { data } = await http.put("/me", body);
  return data as User;
}

// Admin/OWNER endpoints
export async function listUsers(params: ListUsersParams = {}): Promise<Paginated<User>> {
  const res: AxiosResponse = await http.get("/users", { params });
  return normalizePaginated<User>(res.data, params.page ?? 1, params.page_size ?? 50);
}

export async function getUser(userId: number): Promise<User> {
  const { data } = await http.get(`/users/${userId}`);
  return data as User;
}

export async function createUser(body: CreateUserDTO): Promise<User> {
  const { data } = await http.post("/users", body);
  return data as User;
}

export async function updateUser(userId: number, body: UpdateUserDTO): Promise<User> {
  const { data } = await http.put(`/users/${userId}`, body);
  return data as User;
}

export async function deleteUser(userId: number): Promise<void> {
  await http.delete(`/users/${userId}`);
}

// Convenience helpers
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const head = user.slice(0, 2);
  const tail = user.slice(-1);
  return `${head}${"*".repeat(Math.max(1, user.length - 3))}${tail}@${domain}`;
}
