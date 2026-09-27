import { NextRequest, NextResponse } from "next/server";
import { recordSupplierPayment } from "@/services/ledger.service";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const payment = await recordSupplierPayment({
      supplierId: id,
      branchId: session.branchId,
      amount: Number(body.amount),
      paymentMethod: body.paymentMethod || "BANK_TRANSFER",
      referenceNumber: body.referenceNumber,
      notes: body.notes,
      paidById: session.id,
    });

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
