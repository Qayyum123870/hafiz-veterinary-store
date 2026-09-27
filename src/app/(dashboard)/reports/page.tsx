"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function ReportsPage() {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"MONTH" | "YEAR">("MONTH");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let start: Date;
      let end = new Date();

      if (timeframe === "MONTH") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        start = new Date(now.getFullYear(), 0, 1);
      }

      const res = await fetch(
        `/api/reports/profit-loss?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      const data = await res.json();
      if (data.success) setReport(data.report);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [timeframe]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Executive Profit & Loss Statement (P&L)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time financial performance calculated from batch-specific acquisition costs and shop overheads
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setTimeframe("MONTH")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === "MONTH" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe("YEAR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === "YEAR" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Year to Date
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Computing real-time ledger aggregates...</div>
      ) : report ? (
        <div className="space-y-6">
          {/* Top Profitability Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Net Sales Revenue</span>
              <div className="text-xl font-bold text-white mt-1">{formatCurrency(report.netSales)}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">After customer discounts</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Cost of Goods Sold (COGS)</span>
              <div className="text-xl font-bold text-slate-300 mt-1">{formatCurrency(report.cogs)}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Exact batch acquisition costs</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Gross Trading Profit</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(report.grossProfit)}</div>
              <p className="text-[10px] text-emerald-400/80 mt-0.5 font-semibold">
                Gross Margin: {report.grossMarginPercent.toFixed(1)}%
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Net Business Profit</span>
              <div
                className={`text-xl font-bold mt-1 ${
                  report.netProfit >= 0 ? "text-emerald-300" : "text-red-400"
                }`}
              >
                {formatCurrency(report.netProfit)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Net Margin: {report.netMarginPercent.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Detailed Statement Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Financial Statement Breakdown</h3>

            <div className="divide-y divide-slate-800 text-xs font-mono">
              <div className="py-2.5 flex justify-between text-slate-300">
                <span>Gross Billing Sales</span>
                <span>{formatCurrency(report.grossSales)}</span>
              </div>
              <div className="py-2.5 flex justify-between text-amber-400">
                <span>Less: In-store Cashier Discounts Given</span>
                <span>({formatCurrency(report.discountsGiven)})</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold text-white text-sm bg-slate-950/40 px-2 rounded">
                <span>Net Trading Sales</span>
                <span className="text-emerald-400">{formatCurrency(report.netSales)}</span>
              </div>
              <div className="py-2.5 flex justify-between text-slate-400">
                <span>Less: Cost of Goods Sold (Exact Batches)</span>
                <span>({formatCurrency(report.cogs)})</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold text-emerald-300 text-sm bg-slate-950/40 px-2 rounded">
                <span>Gross Trading Profit</span>
                <span>{formatCurrency(report.grossProfit)}</span>
              </div>
              <div className="py-2.5 flex justify-between text-purple-400">
                <span>Less: Operating Overhead Expenses</span>
                <span>({formatCurrency(report.totalExpenses)})</span>
              </div>
              <div className="py-3 flex justify-between font-bold text-base text-white bg-slate-950 px-3 rounded-xl border border-slate-800">
                <span>NET FINAL SHOP PROFIT</span>
                <span className="text-emerald-400">{formatCurrency(report.netProfit)}</span>
              </div>
            </div>

            {/* Operating Expenses Breakdown */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 mb-3">Operating Overheads by Category</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(report.expensesByCategory || {}).map(([cat, amount]: any) => (
                  <div key={cat} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">{cat}</span>
                    <span className="text-sm font-bold text-purple-300 font-mono mt-0.5 block">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
