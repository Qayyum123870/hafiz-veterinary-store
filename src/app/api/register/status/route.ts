import { NextResponse } from "next/server";
import { getActiveCashRegister } from "@/services/register.service";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const register = await getActiveCashRegister(session.branchId, session.id);
    return NextResponse.json({ success: true, register });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
