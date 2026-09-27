import { NextRequest, NextResponse } from "next/server";
import { createStockAdjustment } from "@/services/inventory.service";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "inventory.adjust")) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const adjustment = await createStockAdjustment({
      branchId: session.branchId,
      createdById: session.id,
      reason: body.reason,
      notes: body.notes,
      items: body.items,
    });

    return NextResponse.json({ success: true, adjustment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
