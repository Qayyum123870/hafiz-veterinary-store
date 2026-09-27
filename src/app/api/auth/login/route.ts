import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, getUserWithPermissions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        deletedAt: null,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please verify your username and password." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Account is suspended or inactive. Please contact store management." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please verify your username and password." },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const fullUser = await getUserWithPermissions(user.id);
    if (!fullUser) {
      return NextResponse.json({ success: false, error: "Unable to retrieve permissions." }, { status: 500 });
    }

    await createSession({
      id: fullUser.id,
      username: fullUser.username,
      email: fullUser.email,
      fullName: fullUser.fullName,
      branchId: fullUser.branchId,
      roles: fullUser.roles,
      permissions: fullUser.permissions,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: fullUser,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Authentication failed." },
      { status: 500 }
    );
  }
}
