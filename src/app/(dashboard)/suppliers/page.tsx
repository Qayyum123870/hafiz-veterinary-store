"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Search,
  Plus,
  Receipt,
  CircleDollarSign,
  X,
  CreditCard,
  Phone,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Lahore");
  const [paymentTermsDays, setPaymentTermsDays] = useState("30");

  // Payment Form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) setSuppliers(data.suppliers || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenLedger = async (sup: any) => {
    setSelectedSupplier(sup);
    try {
      const res = await fetch(`/api/suppliers/${sup.id}/ledger`);
      const data = await res.json();
      if (data.success) setLedgerData(data);
    } catch {}
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || companyName,
          companyName,
          phone,
          city,
          paymentTermsDays: Number(paymentTermsDays),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create supplier");

      setShowAddModal(false);
      setCompanyName("");
      setName("");
      setPhone("");
      fetchSuppliers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisbursePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !payAmount) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/suppliers/${selectedSupplier.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentMethod: payMethod,
          referenceNumber: payRef,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Payment disbursement failed");

      setShowPaymentModal(false);
      setPayAmount("");
      setPayRef("");
      setPayNotes("");
      handleOpenLedger(selectedSupplier);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>Pharmaceutical Suppliers & Accounts Payable</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track medicine distributors, payment credit terms, and double-entry payable statements
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company name, supplier number, or phone..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
        />
      </div>

      {/* Suppliers Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Supplier #</th>
                <th className="py-3 px-4 font-semibold">Company / Name</th>
                <th className="py-3 px-4 font-semibold">Phone & City</th>
                <th className="py-3 px-4 font-semibold">Payment Terms</th>
                <th className="py-3 px-4 font-semibold text-right">Outstanding Payable</th>
                <th className="py-3 px-4 font-semibold text-center">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-400">
                      {s.supplierNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-white text-xs">{s.companyName}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{s.phone}</div>
                      <div className="text-[10px] text-slate-400">{s.city || "Lahore"}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{s.paymentTermsDays} Days Credit</td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={`font-bold ${
                          s.currentBalance > 0
                            ? "text-red-400"
                            : s.currentBalance < 0
                            ? "text-emerald-400"
                            : "text-slate-400"
                        }`}
                      >
                        {formatCurrency(s.currentBalance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenLedger(s)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition"
                      >
                        View Statement
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Ledger Statement Modal */}
      {selectedSupplier && ledgerData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-400" />
                  <span>Supplier Statement: {selectedSupplier.companyName}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ph: {selectedSupplier.phone} • Outstanding Payable:{" "}
                  <strong className="text-red-400 font-mono">
                    {formatCurrency(selectedSupplier.currentBalance)}
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <CircleDollarSign className="w-3.5 h-3.5" />
                  <span>Disburse Payment</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedSupplier(null);
                    setLedgerData(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Statement Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Ref No</th>
                    <th className="py-2.5 px-3">Transaction</th>
                    <th className="py-2.5 px-3 text-right">Debit (Disbursed)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Bill)</th>
                    <th className="py-2.5 px-3 text-right">Payable Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {ledgerData.ledgers?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                        No transactions recorded in supplier ledger.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.ledgers?.map((row: any) => (
                      <tr key={row.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-400">{formatDate(row.createdAt)}</td>
                        <td className="py-2 px-3 text-indigo-400 font-semibold">{row.referenceNumber}</td>
                        <td className="py-2 px-3 text-slate-300 font-sans text-[11px]">{row.notes}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                          {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-200">
                          {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          {formatCurrency(row.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Payment Modal */}
      {showPaymentModal && selectedSupplier && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-indigo-400" />
              <span>Disburse Supplier Payment</span>
            </h3>

            <p className="text-xs text-slate-300">
              Supplier: <strong className="text-white">{selectedSupplier.companyName}</strong> • Outstanding
              Payable:{" "}
              <strong className="text-red-400 font-mono">
                {formatCurrency(selectedSupplier.currentBalance)}
              </strong>
            </p>

            <form onSubmit={handleDisbursePayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Amount Disbursed (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base font-bold text-emerald-400 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / Online</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Cheque / Transaction Ref #</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. FT-998811"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "Processing..." : "Disburse & Deduct Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Register Pharmaceutical Supplier</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Company / Distributor Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Punjab Vet Pharma Ltd"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chaudhry Nadeem"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 03008451122"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Credit Terms (Days)</label>
                <input
                  type="number"
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "Registering..." : "Create Supplier Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
