import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const SECRET = process.env.NEXTAUTH_SECRET || "hafiz-vet-store-super-secure-production-ready-jwt-key-2026";
const COOKIE_NAME = "hafiz_vet_session";

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  branchId: string;
  roles: string[];
  permissions: string[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken<T>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = signToken({
    ...user,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken<SessionUser & { exp: number }>(token);
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      fullName: payload.fullName,
      branchId: payload.branchId,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

type UserWithRolesAndPermissions = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
    branch: true;
  };
}>;

export async function getUserWithPermissions(userId: string) {
  const user: UserWithRolesAndPermissions | null = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      branch: true,
    },
  });

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    return null;
  }

  const roles = user.userRoles.map((ur) => ur.role.name);
  const permissionsSet = new Set<string>();

  user.userRoles.forEach((ur) => {
    ur.role.rolePermissions.forEach((rp) => {
      permissionsSet.add(rp.permission.code);
    });
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    branchId: user.branchId,
    branchName: user.branch.name,
    roles,
    permissions: Array.from(permissionsSet),
  };
}
