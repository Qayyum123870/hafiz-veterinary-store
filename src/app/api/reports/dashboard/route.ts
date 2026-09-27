import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/services/report.service";

export async function GET() {
  try {
    const data = await getDashboardMetrics();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
