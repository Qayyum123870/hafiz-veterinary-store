import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "audit.view")) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const where: any = {};
    if (entity) where.entity = entity;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
