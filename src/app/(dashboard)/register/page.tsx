"use client";

import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default function RegisterPage() {
  const [register, setRegister] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingCash, setOpeningCash] = useState("20000");
  const [actualClosingCash, setActualClosingCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/register/status");
      const data = await res.json();
      if (data.success) setRegister(data.register);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegister();
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/register/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingCash: Number(openingCash) }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to open register");

      setMsg("Cash register shift opened successfully!");
      fetchRegister();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!register || !actualClosingCash) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/register/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registerId: register.id,
          actualClosingCash: Number(actualClosingCash),
          closingNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to close register");

      setShowCloseModal(false);
      setActualClosingCash("");
      setClosingNotes("");
      setMsg("Cash register shift reconciled and closed.");
      fetchRegister();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-emerald-400" />
            <span>Cash Register Shift & Drawer Reconciliation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track daily drawer opening float, cash intake, expenses, and shift-end discrepancy audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              register ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
          >
            {register ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{register ? "ACTIVE SHIFT OPEN" : "DRAWER CLOSED"}</span>
          </span>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* When Shift is CLOSED: Prompt to open */}
      {!loading && !register && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Start New Cash Register Shift</h3>
          <p className="text-xs text-slate-400">
            Enter the starting cash float present in your cash drawer to begin POS billing for your shift.
          </p>

          <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1 text-left">Opening Float Cash (Rs.) *</label>
              <input
                type="number"
                required
                min="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="20000"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-base font-bold text-emerald-400 outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition disabled:opacity-50"
            >
              {actionLoading ? "Opening Shift..." : "Open Cash Register Shift"}
            </button>
          </form>
        </div>
      )}

      {/* When Shift is OPEN */}
      {register && (
        <div className="space-y-6">
          {/* Shift KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Opening Cash Float</span>
              <div className="text-xl font-bold text-white mt-1">{formatCurrency(register.openingCash)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Opened: {formatDateTime(register.openedAt)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Cash Intake During Shift</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {formatCurrency(
                  register.transactions
                    ?.filter((t: any) => t.transactionType === "CASH_SALE" || t.transactionType === "CUSTOMER_PAYMENT")
                    ?.reduce((s: number, t: any) => s + t.amount, 0)
                )}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">From cash sales & dues</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 col-span-2 md:col-span-1 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Shift Actions</span>
                <p className="text-[11px] text-slate-300 mt-1">End shift & count cash</p>
              </div>
              <button
                onClick={() => setShowCloseModal(true)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition"
              >
                Close Shift
              </button>
            </div>
          </div>

          {/* Shift Transactions Ledger */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Shift Drawer Activity Stream</span>
            </h3>

            <div className="divide-y divide-slate-800">
              {register.transactions?.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No cash transactions recorded during this shift yet.
                </div>
              ) : (
                register.transactions?.map((t: any) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{t.transactionType}</div>
                        <div className="text-[10px] text-slate-500">{t.notes}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">+{formatCurrency(t.amount)}</div>
                      <div className="text-[10px] text-slate-500">{formatDateTime(t.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && register && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400" />
              <span>Reconcile & Close Cash Register Shift</span>
            </h3>

            <p className="text-xs text-slate-300">
              Count all physical cash, notes, and coins currently inside the cash drawer.
            </p>

            <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Physical Cash Counted (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={actualClosingCash}
                  onChange={(e) => setActualClosingCash(e.target.value)}
                  placeholder="e.g. 38500"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-base font-bold text-emerald-400 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Closing Notes / Discrepancy Reason</label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Optional shift handover or counting remarks..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition disabled:opacity-50"
                >
                  {actionLoading ? "Closing..." : "Close Register Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
