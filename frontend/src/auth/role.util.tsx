// src/auth/role.util.ts
import { decodeJwtClaims } from "../api/auth.api";
import type { Role } from "../api/users.api";

const KNOWN_ROLE_KEYS = ["role", "roles", "realm_access", "resource_access", "permissions", "scope"];

export function extractRolesFromClaims(claims: Record<string, unknown> | null): Role[] {
  if (!claims) return [];
  // 1) roles directos
  if (typeof claims.role === "string") return [claims.role as Role];
  if (Array.isArray(claims.roles)) return (claims.roles as string[]).map(r => r as Role);

  // 2) Keycloak-like
  if (claims.realm_access && typeof claims.realm_access === "object") {
    const ra = claims.realm_access as any;
    if (Array.isArray(ra.roles)) return ra.roles as Role[];
  }

  // 3) scopes space-separated
  if (typeof claims.scope === "string") {
    return (claims.scope as string).split(" ").filter(Boolean) as Role[];
  }

  // 4) último recurso: inspección superficial
  for (const k of KNOWN_ROLE_KEYS) {
    const v = (claims as any)[k];
    if (typeof v === "string") return [v as Role];
    if (Array.isArray(v)) return v as Role[];
  }

  return [];
}

export function isOwnerOrAdmin(roles: Role[] = []): boolean {
  return roles.includes("OWNER") || roles.includes("ADMIN");
}
