"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  PawPrint,
  Receipt,
  CircleDollarSign,
  CheckCircle2,
  X,
  CreditCard,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form State Customer
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("Sahiwal");
  const [creditLimit, setCreditLimit] = useState("50000");

  // Pet Registration (optional with customer)
  const [petName, setPetName] = useState("");
  const [petSpeciesId, setPetSpeciesId] = useState("");
  const [petBreed, setPetBreed] = useState("");

  // Payment Form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNotes, setPayNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) setCustomers(data.customers || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetch("/api/species")
      .then((r) => r.json())
      .then((d) => setSpeciesList(d.species || []));
  }, []);

  const handleOpenLedger = async (cust: any) => {
    setSelectedCustomer(cust);
    try {
      const res = await fetch(`/api/customers/${cust.id}/ledger`);
      const data = await res.json();
      if (data.success) setLedgerData(data);
    } catch {}
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      // 1. Create Customer
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          whatsapp,
          city,
          creditLimit: Number(creditLimit),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create customer");

      // 2. If Pet Name provided, create Pet
      if (petName && petSpeciesId) {
        await fetch("/api/pets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: data.customer.id,
            name: petName,
            speciesId: petSpeciesId,
            breed: petBreed,
          }),
        });
      }

      setShowAddModal(false);
      setName("");
      setPhone("");
      setWhatsapp("");
      setPetName("");
      setPetBreed("");
      fetchCustomers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !payAmount) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentMethod: payMethod,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Payment recording failed");

      setShowPaymentModal(false);
      setPayAmount("");
      setPayNotes("");
      handleOpenLedger(selectedCustomer);
      fetchCustomers();
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
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Customer Accounts & Pet Patient Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain pet medical profiles, farm herd credit balances, and double-entry transaction ledgers
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Register Customer & Pet</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, phone number, or ID..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Account #</th>
                <th className="py-3 px-4 font-semibold">Customer Name</th>
                <th className="py-3 px-4 font-semibold">Contact / City</th>
                <th className="py-3 px-4 font-semibold">Registered Pets / Animals</th>
                <th className="py-3 px-4 font-semibold text-right">Credit Limit</th>
                <th className="py-3 px-4 font-semibold text-right">Outstanding Balance</th>
                <th className="py-3 px-4 font-semibold text-center">Account Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading customer accounts...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                      {c.customerNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-white text-xs">{c.name}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{c.phone}</div>
                      <div className="text-[10px] text-slate-400">{c.city || "Sahiwal"}</div>
                    </td>
                    <td className="py-3 px-4">
                      {c.pets?.length === 0 ? (
                        <span className="text-[10px] text-slate-500">No pets linked</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {c.pets?.map((pet: any) => (
                            <span
                              key={pet.id}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center gap-1"
                            >
                              <PawPrint className="w-2.5 h-2.5" />
                              <span>
                                {pet.name} ({pet.species?.name})
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {formatCurrency(c.creditLimit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={`font-bold ${
                          c.currentBalance > 0
                            ? "text-amber-400"
                            : c.currentBalance < 0
                            ? "text-emerald-400"
                            : "text-slate-400"
                        }`}
                      >
                        {formatCurrency(c.currentBalance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenLedger(c)}
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

      {/* Customer Ledger Statement Drawer / Modal */}
      {selectedCustomer && ledgerData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Customer Ledger: {selectedCustomer.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ph: {selectedCustomer.phone} • Current Balance:{" "}
                  <strong className="text-amber-400 font-mono">
                    {formatCurrency(selectedCustomer.currentBalance)}
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <CircleDollarSign className="w-3.5 h-3.5" />
                  <span>Receive Payment</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
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
                    <th className="py-2.5 px-3 text-right">Debit (Sale)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {ledgerData.ledgers?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                        No transactions recorded in customer ledger.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.ledgers?.map((row: any) => (
                      <tr key={row.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-400">{formatDate(row.createdAt)}</td>
                        <td className="py-2 px-3 text-emerald-400 font-semibold">{row.referenceNumber}</td>
                        <td className="py-2 px-3 text-slate-300 font-sans text-[11px]">{row.notes}</td>
                        <td className="py-2 px-3 text-right text-slate-200">
                          {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-bold">
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

      {/* Record Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-emerald-400" />
              <span>Receive Customer Dues Payment</span>
            </h3>

            <p className="text-xs text-slate-300">
              Customer: <strong className="text-white">{selectedCustomer.name}</strong> • Outstanding Due:{" "}
              <strong className="text-amber-400 font-mono">
                {formatCurrency(selectedCustomer.currentBalance)}
              </strong>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Amount Received (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base font-bold text-emerald-400 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="EASYPAISA">Easypaisa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Notes / Ref</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional receipt notes..."
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "Posting..." : "Confirm & Update Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer & Pet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Register Customer & Pet Profile</span>
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

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mian Muhammad Ali"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 03001234567"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Sahiwal"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Credit Limit (Rs.)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              {/* Optional Pet Details */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="font-semibold text-teal-400 block flex items-center gap-1.5">
                  <PawPrint className="w-3.5 h-3.5" />
                  <span>Pet Patient Registration (Optional)</span>
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1">Pet Name</label>
                    <input
                      type="text"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      placeholder="e.g. Tommy"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Species</label>
                    <select
                      value={petSpeciesId}
                      onChange={(e) => setPetSpeciesId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    >
                      <option value="">Select Species</option>
                      {speciesList.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Breed</label>
                    <input
                      type="text"
                      value={petBreed}
                      onChange={(e) => setPetBreed(e.target.value)}
                      placeholder="e.g. German Shepherd"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    />
                  </div>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "Registering..." : "Create Customer Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
