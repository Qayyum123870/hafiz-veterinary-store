"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  DollarSign,
  Fuel,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paidTo, setPaidTo] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      if (data.success) setExpenses(data.expenses || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetch("/api/expense-categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          categoryId,
          amount: Number(amount),
          paymentMethod,
          paidTo,
          description,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to record expense");

      setShowAddModal(false);
      setTitle("");
      setAmount("");
      setPaidTo("");
      setDescription("");
      fetchExpenses();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalExpensesSum = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-400" />
            <span>Store Operating Expenses & Overhead Tracking</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Log rent, electricity, generator diesel fuel for vaccine refrigeration, salaries, and packaging
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Expenses Summary Card */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400">Total Recorded Overhead Expenses</span>
          <div className="text-xl font-bold text-white mt-0.5">{formatCurrency(totalExpensesSum)}</div>
        </div>
        <div className="text-xs text-slate-400">
          <span>{expenses.length} Expense Vouchers</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Expense #</th>
                <th className="py-3 px-4 font-semibold">Title / Description</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Date Paid</th>
                <th className="py-3 px-4 font-semibold">Paid To</th>
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No operating expenses recorded.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-purple-400">
                      {e.expenseNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{e.title}</div>
                      {e.description && <div className="text-[10px] text-slate-400">{e.description}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-purple-300 font-medium">
                        {e.category?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatDate(e.paidDate)}</td>
                    <td className="py-3 px-4 text-slate-300">{e.paidTo || "N/A"}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-300">
                      {formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Record Store Expense</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Generator Diesel for Vaccine Fridge"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Amount (Rs.) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-emerald-400 font-bold outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="CASH">Cash Drawer</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="JAZZCASH">JazzCash</option>
                    <option value="EASYPAISA">Easypaisa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Paid To / Recipient</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="e.g. Shell Petrol Pump"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description / Remarks</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or receipt reference..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "Recording..." : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
