import { NextResponse } from "next/server";
import { getExpiryAnalytics } from "@/services/inventory.service";

export async function GET() {
  try {
    const data = await getExpiryAnalytics();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
