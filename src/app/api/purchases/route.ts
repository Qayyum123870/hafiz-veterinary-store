import { NextRequest, NextResponse } from "next/server";
import { getPurchases, createPurchase } from "@/services/purchase.service";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const data = await getPurchases({ page, limit });
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "purchases.create_receive")) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const purchase = await createPurchase({
      branchId: session.branchId,
      createdById: session.id,
      supplierId: body.supplierId,
      supplierInvoiceNumber: body.supplierInvoiceNumber,
      purchaseDate: body.purchaseDate,
      dueDate: body.dueDate,
      items: body.items,
      paidAmount: Number(body.paidAmount || 0),
      notes: body.notes,
    });

    return NextResponse.json({ success: true, purchase }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
