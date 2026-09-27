import { NextRequest, NextResponse } from "next/server";
import { closeCashRegister } from "@/services/register.service";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { registerId, actualClosingCash, closingNotes } = await req.json();
    const register = await closeCashRegister({
      registerId,
      actualClosingCash: Number(actualClosingCash),
      closingNotes,
    });

    return NextResponse.json({ success: true, register });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
