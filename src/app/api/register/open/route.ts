import { NextRequest, NextResponse } from "next/server";
import { openCashRegister } from "@/services/register.service";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { openingCash } = await req.json();
    const register = await openCashRegister({
      branchId: session.branchId,
      userId: session.id,
      openingCash: Number(openingCash || 0),
    });

    return NextResponse.json({ success: true, register }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
