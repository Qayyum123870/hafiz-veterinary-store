import { getSession, SessionUser } from "./auth";

export function hasPermission(user: SessionUser | null, permissionCode: string): boolean {
  if (!user) return false;
  // SUPER_ADMIN and ADMIN_OWNER have root override
  if (user.roles.includes("SUPER_ADMIN") || user.roles.includes("ADMIN_OWNER")) {
    return true;
  }
  return user.permissions.includes(permissionCode);
}

export function hasAnyPermission(user: SessionUser | null, permissionCodes: string[]): boolean {
  if (!user) return false;
  if (user.roles.includes("SUPER_ADMIN") || user.roles.includes("ADMIN_OWNER")) {
    return true;
  }
  return permissionCodes.some((code) => user.permissions.includes(code));
}

export function hasRole(user: SessionUser | null, roleName: string): boolean {
  if (!user) return false;
  if (user.roles.includes("SUPER_ADMIN")) return true;
  return user.roles.includes(roleName);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: Authentication required.");
  }
  return session;
}

export async function requirePermission(permissionCode: string): Promise<SessionUser> {
  const user = await requireAuth();
  if (!hasPermission(user, permissionCode)) {
    throw new Error(`FORBIDDEN: Missing required permission [${permissionCode}].`);
  }
  return user;
}
