"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  Receipt,
  Users,
  Building2,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const recentSales = data?.recentSales || [];
  const recentPurchases = data?.recentPurchases || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Sparkles className="w-4 h-4" /> Live Veterinary ERP Status
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Executive Business Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time inventory, sales margins, and patient ledger monitoring</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/pos"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Launch POS (F2)</span>
          </Link>
          <Link
            href="/purchases"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition"
          >
            Receive PO Bill
          </Link>
          <Link
            href="/inventory/expiry"
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30 transition flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Expiry Watch</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Today&apos;s Sales</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold text-white">{formatCurrency(kpis.todaySales)}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Real-time POS revenue</span>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Gross Profit Today</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold text-teal-300">{formatCurrency(kpis.todayProfit)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Based on exact batch COGS</div>
        </div>

        {/* Total Inventory Value */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Stock Valuation</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold text-white">{formatCurrency(kpis.totalInventoryValue)}</div>
          <div className="text-[11px] text-slate-400 mt-1">At batch cost value</div>
        </div>

        {/* Today's Expenses */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Today&apos;s Expenses</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold text-white">{formatCurrency(kpis.todayExpenses)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Operating costs & fuel</div>
        </div>
      </div>

      {/* Secondary KPI Bar: Receivables, Payables, Expiry & Low Stock */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Customer Receivables */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
            <span>Customer Receivables</span>
            <Users className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-bold text-amber-300">{formatCurrency(kpis.customerReceivables)}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Owed by pet owners & farms</p>
        </div>

        {/* Supplier Payables */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
            <span>Supplier Payables</span>
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-base font-bold text-indigo-300">{formatCurrency(kpis.supplierPayables)}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Owed to pharma distributors</p>
        </div>

        {/* Near Expiry / Expired Alert */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
            <span>Expiry Alerts (60d)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-base font-bold text-red-400">
            {kpis.nearExpiryCount} Near Expiry / {kpis.expiredCount} Expired
          </div>
          <Link href="/inventory/expiry" className="text-[10px] text-emerald-400 hover:underline mt-0.5 inline-block">
            Inspect batches & quarantine →
          </Link>
        </div>

        {/* Low Stock Threshold */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
            <span>Low Stock Items</span>
            <Package className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="text-base font-bold text-yellow-300">{kpis.lowStockCount} Products</div>
          <Link href="/products" className="text-[10px] text-emerald-400 hover:underline mt-0.5 inline-block">
            View reorder list →
          </Link>
        </div>
      </div>

      {/* 7-Day Revenue Trend Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">7-Day Sales & Profit Trajectory</h3>
            <p className="text-xs text-slate-400">Daily gross revenue compared against batch cost of goods sold</p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {charts.salesTrend?.map((item: any, i: number) => {
            const heightPercent = Math.min(100, Math.max(12, (item.sales / 50000) * 100));
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="text-[11px] font-semibold text-slate-300">{formatCurrency(item.sales, "")}</div>
                <div className="w-full bg-slate-800/80 rounded-xl h-36 flex items-end p-1.5 relative overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-lg transition-all duration-500 shadow-sm"
                  />
                </div>
                <div className="text-[11px] font-medium text-slate-400">{item.dayName}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity: Sales & Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Recent Sales Invoices</span>
            </h3>
            <Link href="/sales" className="text-xs text-emerald-400 hover:underline">
              View all →
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentSales.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No sales recorded yet.</div>
            ) : (
              recentSales.map((sale: any) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/70 transition"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{sale.invoiceNumber}</div>
                    <div className="text-[11px] text-slate-400">
                      {sale.customer?.name || "Walk-In Customer"} • {formatDateTime(sale.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">{formatCurrency(sale.grandTotal)}</div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        sale.paymentStatus === "PAID"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {sale.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-400" />
              <span>Recent Supplier Receiving Bills</span>
            </h3>
            <Link href="/purchases" className="text-xs text-emerald-400 hover:underline">
              View all →
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentPurchases.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No purchases recorded yet.</div>
            ) : (
              recentPurchases.map((pur: any) => (
                <div
                  key={pur.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/70 transition"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{pur.purchaseNumber}</div>
                    <div className="text-[11px] text-slate-400">
                      {pur.supplier?.companyName || "Supplier"} • {formatDate(pur.purchaseDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-100">{formatCurrency(pur.grandTotal)}</div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        pur.paymentStatus === "PAID"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {pur.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
