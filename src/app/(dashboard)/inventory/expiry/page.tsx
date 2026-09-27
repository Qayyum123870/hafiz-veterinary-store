"use client";

import { useEffect, useState } from "react";
import {
  ClockAlert,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Undo2,
  Building2,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatDate, getExpiryBadgeStatus } from "@/lib/formatters";

export default function ExpiryPage() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"EXPIRED" | "30" | "60" | "90">("EXPIRED");
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchExpiry = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/expiry");
      const json = await res.json();
      if (json.success) setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiry();
  }, []);

  const handleWriteOff = async (batch: any) => {
    if (!confirm(`Are you sure you want to write off ${batch.currentQuantity} units of batch ${batch.batchNumber}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "EXPIRED",
          notes: `Expired batch write-off: ${batch.batchNumber}`,
          items: [
            {
              productId: batch.productId,
              batchId: batch.id,
              physicalQuantity: 0,
            },
          ],
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        setActionSuccess(`Batch ${batch.batchNumber} successfully written off.`);
        fetchExpiry();
      }
    } catch {}
  };

  const summary = data?.summary || {};
  let currentList = [];
  if (activeTab === "EXPIRED") currentList = data?.expired || [];
  if (activeTab === "30") currentList = data?.expiring30 || [];
  if (activeTab === "60") currentList = data?.expiring60 || [];
  if (activeTab === "90") currentList = data?.expiring90 || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ClockAlert className="w-5 h-5 text-amber-400" />
          <span>Medicine Expiry & Cold-Chain Quarantine Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated FEFO expiry surveillance preventing the sale of expired drugs and reducing pharmaceutical waste
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Expiry Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab("EXPIRED")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "EXPIRED"
              ? "bg-red-500/10 border-red-500 text-red-300 shadow-glow"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Expired Drugs</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-400">{summary.expiredCount || 0} Batches</div>
          <div className="text-[10px] text-red-300/80 mt-1">Dispensing strictly blocked</div>
        </button>

        <button
          onClick={() => setActiveTab("30")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "30"
              ? "bg-amber-500/10 border-amber-500 text-amber-300 shadow-glow"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Expiring in &le; 30 Days</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">{summary.expiring30Count || 0} Batches</div>
          <div className="text-[10px] text-amber-300/80 mt-1">High priority return/dispense</div>
        </button>

        <button
          onClick={() => setActiveTab("60")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "60"
              ? "bg-yellow-500/10 border-yellow-500 text-yellow-300 shadow-glow"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Expiring in 31 - 60 Days</span>
            <ClockAlert className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-xl font-bold text-yellow-400">{summary.expiring60Count || 0} Batches</div>
          <div className="text-[10px] text-yellow-300/80 mt-1">Auto-prioritized by FEFO</div>
        </button>

        <button
          onClick={() => setActiveTab("90")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "90"
              ? "bg-blue-500/10 border-blue-500 text-blue-300 shadow-glow"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Expiring in 61 - 90 Days</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400">{summary.expiring90Count || 0} Batches</div>
          <div className="text-[10px] text-blue-300/80 mt-1">Quarterly watch window</div>
        </button>
      </div>

      {/* Batches Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Product & SKU</th>
                <th className="py-3 px-4 font-semibold">Batch Number</th>
                <th className="py-3 px-4 font-semibold">Expiry Date</th>
                <th className="py-3 px-4 font-semibold text-center">Days Left</th>
                <th className="py-3 px-4 font-semibold text-center">Remaining Quantity</th>
                <th className="py-3 px-4 font-semibold text-right">Batch Valuation</th>
                <th className="py-3 px-4 font-semibold">Supplier Source</th>
                <th className="py-3 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading expiry records...
                  </td>
                </tr>
              ) : currentList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-emerald-400/80">
                    ✓ No batches found in this category. Inventory is clean.
                  </td>
                </tr>
              ) : (
                currentList.map((batch: any) => {
                  const badge = getExpiryBadgeStatus(batch.expiryDate);
                  const valuation = batch.currentQuantity * batch.costPrice;

                  return (
                    <tr key={batch.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{batch.product?.name}</div>
                        <div className="text-[10px] font-mono text-emerald-400">{batch.product?.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                        {batch.batchNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-300">
                        {formatDate(batch.expiryDate)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            badge.color === "danger"
                              ? "bg-red-500/20 text-red-300"
                              : badge.color === "warning"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">
                        {batch.currentQuantity} units
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(valuation)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {batch.supplier?.companyName || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleWriteOff(batch)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-semibold transition"
                        >
                          Write Off (Dispose)
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
