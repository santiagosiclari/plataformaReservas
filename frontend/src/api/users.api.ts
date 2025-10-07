// src/api/users.api.ts
// Thin client for User endpoints. Uses the same axios http client as the rest of the API layer.

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
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string; // plain; server hashes it
  phone?: string | null;
  role?: Role; // backend default: PLAYER
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string | null;
  role?: Role;      // solo si tu policy lo permite en otro endpoint
  password?: string; // si implementás cambio de password
}

// ---------- API Calls ----------

/** Crea usuario (usa POST /users del backend) */
export async function createUser(body: CreateUserDTO): Promise<User> {
  const { data } = await http.post("/users", body);
  return data as User;
}

/** Lista usuarios (tu backend devuelve array plano, sin paginación) */
export async function listUsers(): Promise<User[]> {
  const { data } = await http.get("/users");
  return Array.isArray(data) ? (data as User[]) : [];
}

/** Obtiene 1 usuario (si implementás GET /users/:id en el backend) */
export async function getUser(userId: number): Promise<User> {
  const { data } = await http.get(`/users/${userId}`);
  return data as User;
}

/** Actualiza nombre/teléfono del user logueado (usa PATCH /users/:id) */
export async function updateUser(userId: number, body: UpdateUserDTO): Promise<User> {
  const { data } = await http.patch(`/users/${userId}`, body);
  return data as User;
}

/** Eliminar usuario: NO está implementado en tu backend actual */
// export async function deleteUser(userId: number): Promise<void> {
//   await http.delete(`/users/${userId}`);
// }

/** Utils */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const head = user.slice(0, 2);
  const tail = user.slice(-1);
  return `${head}${"*".repeat(Math.max(1, user.length - 3))}${tail}@${domain}`;
}

// ---------- Role request (nuevo) ----------
export type RoleRequestStatus = "pending" | "approved" | "rejected";

export interface RoleRequest {
  id: number;
  user_id: number;
  role: Role;                 // "OWNER" | "ADMIN"
  status: RoleRequestStatus;  // "pending" | "approved" | "rejected"
  created_at: string;         // ISO8601
  resolved_at?: string | null;
}

/**
 * Crea una solicitud para elevar el rol del usuario.
 * Backend recomendado: POST /admin/role-requests
 * Body: { user_id, role }    -> 202 { id, user_id, role, status:"pending", created_at }
 * (El backend envía el mail a santisiclari@gmail.com con el link de aprobación)
 */
export async function createRoleRequest(user_id: number, role: Role): Promise<RoleRequest> {
  const { data } = await http.post("/admin/role-requests", { user_id, role });
  return data as RoleRequest;
}

/** (opcional) Traer mis solicitudes previas */
export async function listMyRoleRequests(): Promise<RoleRequest[]> {
  const { data } = await http.get("/admin/role-requests/mine");
  return Array.isArray(data) ? (data as RoleRequest[]) : [];
}