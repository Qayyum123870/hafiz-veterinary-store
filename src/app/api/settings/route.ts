import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const settings = await prisma.businessSetting.findFirst();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "settings.update")) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const existing = await prisma.businessSetting.findFirst();

    const updated = await prisma.businessSetting.upsert({
      where: { id: existing?.id || "default-settings" },
      update: body,
      create: {
        id: "default-settings",
        ...body,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
