"use client";

import { useEffect, useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  X,
  PackageCheck,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [productId, setProductId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [unitCost, setUnitCost] = useState("");
  const [proposedSalePrice, setProposedSalePrice] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/purchases");
      const data = await res.json();
      if (data.success) setPurchases(data.purchases || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    // Load suppliers & products
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers || []));
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, []);

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        supplierId,
        supplierInvoiceNumber,
        items: [
          {
            productId,
            batchNumber,
            expiryDate: new Date(expiryDate).toISOString(),
            quantity: Number(quantity),
            unitCost: Number(unitCost),
            proposedSalePrice: proposedSalePrice ? Number(proposedSalePrice) : undefined,
          },
        ],
        paidAmount: Number(paidAmount),
        notes,
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to record purchase receiving");

      setSuccessMsg(`Purchase bill ${data.purchase.purchaseNumber} recorded. Batches and stock updated!`);
      setShowAddModal(false);
      setSupplierInvoiceNumber("");
      setBatchNumber("");
      setExpiryDate("");
      setQuantity("10");
      setUnitCost("");
      setProposedSalePrice("");
      setPaidAmount("0");
      fetchPurchases();
    } catch (err: any) {
      setErrorMsg(err.message);
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
            <Truck className="w-5 h-5 text-teal-400" />
            <span>Procurement & Supplier Inbound Receiving</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Log supplier delivery bills, assign batch numbers with manufacturer expiry dates, and update accounts
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-teal-950 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Receive Inbound Purchase</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Purchases Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Purchase No</th>
                <th className="py-3 px-4 font-semibold">Supplier & Invoice #</th>
                <th className="py-3 px-4 font-semibold">Receiving Date</th>
                <th className="py-3 px-4 font-semibold">Batches Ingested</th>
                <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                <th className="py-3 px-4 font-semibold text-right">Paid / Due</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading procurement history...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No purchase records found.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-400">
                      {p.purchaseNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{p.supplier?.companyName}</div>
                      {p.supplierInvoiceNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ref: #{p.supplierInvoiceNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatDate(p.purchaseDate)}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {p.items?.map((item: any, idx: number) => (
                          <div key={idx} className="text-[11px] text-slate-300">
                            {item.product?.name} ({item.quantity} units, Batch: {item.batch?.batchNumber})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(p.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px]">
                      <div className="text-emerald-400">Paid: {formatCurrency(p.paidAmount)}</div>
                      {p.dueAmount > 0 && (
                        <div className="text-amber-400 font-bold">Due: {formatCurrency(p.dueAmount)}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.paymentStatus === "PAID"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : p.paymentStatus === "PARTIAL"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inbound PO Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-teal-400" />
                <span>Receive Inbound Purchase & Create Batches</span>
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

            <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Supplier / Distributor *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Supplier Bill # / DC Ref</label>
                  <input
                    type="text"
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    placeholder="e.g. DC-99824"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Medicine Item Receiving Section */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="font-semibold text-teal-400 block">Item Receiving & Batch Expiry</span>
                <div>
                  <label className="block text-slate-400 mb-1">Select Product *</label>
                  <select
                    required
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value);
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) {
                        setUnitCost(String(prod.purchasePrice));
                        setProposedSalePrice(String(prod.salePrice));
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                  >
                    <option value="">Select Product from Catalog</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Manufacturer Batch Number *</label>
                    <input
                      type="text"
                      required
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g. BATCH-2026-X"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Expiry Date (FEFO Target) *</label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Quantity Received *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Unit Cost (Rs.) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Proposed Retail Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={proposedSalePrice}
                      onChange={(e) => setProposedSalePrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none font-mono text-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Amount Paid Immediately</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500 font-mono text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimated Total</label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm">
                    {formatCurrency(Number(quantity || 0) * Number(unitCost || 0))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? "Ingesting..." : "Confirm Inbound Receiving"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
