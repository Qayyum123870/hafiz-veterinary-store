import { NextRequest, NextResponse } from "next/server";
import { cancelSale } from "@/services/sale.service";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "sales.cancel_void")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Voiding invoices requires Manager or Admin authorization." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    if (!body.reason) {
      return NextResponse.json({ success: false, error: "Cancellation reason is mandatory." }, { status: 400 });
    }

    const result = await cancelSale(id, body.reason, session.id);
    return NextResponse.json({ success: true, sale: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
