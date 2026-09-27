import { NextRequest, NextResponse } from "next/server";
import { getProfitAndLossReport } from "@/services/report.service";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : startOfMonth(now);
    const endDate = endDateParam ? new Date(endDateParam) : endOfMonth(now);

    const report = await getProfitAndLossReport({ startDate, endDate });
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
