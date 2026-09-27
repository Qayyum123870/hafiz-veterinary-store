"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  ShoppingCart,
  Printer,
  Ban,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/sales?search=${encodeURIComponent(search)}&paymentStatus=${paymentStatus}`
      );
      const data = await res.json();
      if (data.success) setSales(data.sales || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [paymentStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSales();
  };

  const handleVoidInvoice = async () => {
    if (!selectedSale || !voidReason) return;
    setVoiding(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/sales/${selectedSale.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: voidReason }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to void invoice");

      setStatusMsg(`Invoice ${selectedSale.invoiceNumber} has been successfully cancelled and stock restored.`);
      setShowVoidModal(false);
      setSelectedSale(null);
      setVoidReason("");
      fetchSales();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVoiding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Sales Invoices & Billing Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse point-of-sale invoices, customer credit records, and handle cancellations or returns
          </p>
        </div>

        <Link
          href="/pos"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition self-start"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>New Sale (POS)</span>
        </Link>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number (e.g. INV-2026-000001), customer name or phone..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
          />
        </form>

        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
        >
          <option value="">All Payment Statuses</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="UNPAID">Unpaid (Credit)</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice No</th>
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Customer / Pet</th>
                <th className="py-3 px-4 font-semibold">Items Dispensed</th>
                <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                <th className="py-3 px-4 font-semibold text-right">Paid / Due</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">
                        {sale.customer?.name || "Walk-In Cash Customer"}
                      </div>
                      {sale.pet && (
                        <div className="text-[10px] text-teal-400">
                          Pet: {sale.pet.name} ({sale.pet.breed || "Animal"})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {sale.items?.length} items ({sale.items?.reduce((s: number, i: any) => s + i.quantity, 0)} units)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(sale.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px]">
                      <div className="text-emerald-400">Paid: {formatCurrency(sale.paidAmount)}</div>
                      {sale.dueAmount > 0 && (
                        <div className="text-amber-400 font-bold">Due: {formatCurrency(sale.dueAmount)}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sale.paymentStatus === "PAID"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : sale.paymentStatus === "PARTIAL"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                        {sale.saleStatus === "CANCELLED" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950 text-red-400 border border-red-800">
                            VOID
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          title="View Details & Receipt"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details & Actions Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Invoice: {selectedSale.invoiceNumber}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(selectedSale.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area */}
            <div className="printable-area p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-3 text-slate-300">
              <div className="text-center font-bold text-white text-base">Hafiz Veterinary Store</div>
              <div className="text-[10px] text-center text-slate-400">
                Sahiwal Veterinary Complex, Ghalla Mandi • +92 300 8765432
              </div>
              <div className="border-b border-dashed border-slate-800" />
              <div className="flex justify-between">
                <span>Cashier: {selectedSale.cashier?.fullName || "Staff"}</span>
                <span>Payment: {selectedSale.paymentMethod}</span>
              </div>
              {selectedSale.customer && (
                <div className="flex justify-between text-emerald-300">
                  <span>Customer: {selectedSale.customer.name}</span>
                  <span>Ph: {selectedSale.customer.phone}</span>
                </div>
              )}
              {selectedSale.pet && (
                <div className="text-teal-300">
                  Pet Patient: {selectedSale.pet.name} ({selectedSale.pet.breed || "Animal"})
                </div>
              )}
              <div className="border-b border-dashed border-slate-800" />

              {/* Items List */}
              <div className="space-y-1.5">
                {selectedSale.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div>
                      <div className="font-semibold text-white">{item.product?.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Batch: {item.batch?.batchNumber} • x{item.quantity} @ {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <div className="font-bold text-slate-200">{formatCurrency(item.lineTotal)}</div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-slate-800" />
              <div className="flex justify-between font-bold text-white text-sm">
                <span>Grand Total:</span>
                <span>{formatCurrency(selectedSale.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount Paid:</span>
                <span>{formatCurrency(selectedSale.paidAmount)}</span>
              </div>
              {selectedSale.dueAmount > 0 && (
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>Outstanding Balance Due:</span>
                  <span>{formatCurrency(selectedSale.dueAmount)}</span>
                </div>
              )}
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              {selectedSale.saleStatus !== "CANCELLED" && (
                <button
                  onClick={() => setShowVoidModal(true)}
                  className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Void / Cancel Invoice</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Void Invoice Confirmation Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-red-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Void Invoice Confirmation</h3>
            </div>

            <p className="text-xs text-slate-300">
              Cancelling invoice <strong className="text-white">{selectedSale?.invoiceNumber}</strong> will
              immediately:
            </p>
            <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
              <li>Restore all dispensed medicines back into their exact batches.</li>
              <li>Revert customer debt ledger and outstanding balances.</li>
              <li>Record an immutable void audit trail with your user ID.</li>
            </ul>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reason for Cancellation (Required) *
              </label>
              <textarea
                rows={3}
                required
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Customer cancelled order / Wrong drug scanned / Entry mistake"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={!voidReason || voiding}
                onClick={handleVoidInvoice}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {voiding ? "Cancelling..." : "Confirm Void & Restore Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
