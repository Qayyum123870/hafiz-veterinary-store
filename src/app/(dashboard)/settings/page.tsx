"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  Building,
  ShieldAlert,
  Sliders,
  DollarSign,
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    shopName: "Hafiz Veterinary Store",
    tagline: "Complete Veterinary Medicine & Pet Care",
    phone: "+92 300 8765432",
    whatsapp: "+92 300 8765432",
    email: "info@hafizvetstore.com",
    taxNumber: "NTN-7849302-1",
    address: "Shop # 12-14, Ghalla Mandi Veterinary Complex, Sahiwal",
    currencySymbol: "Rs. ",
    invoicePrefix: "INV",
    invoiceFooterNotes:
      "Goods once sold can only be returned within 7 days in original packaging with batch verification. Expired cold-chain vaccines are strictly non-returnable.",
    stockAllocationStrategy: "FEFO",
    lowStockAlertDays: 60,
    maxDiscountCashierPercent: 5.0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update settings");

      setSuccessMsg("Business & POS settings saved successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Store Configuration & Governance Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Customize invoice layout, currency, inventory FEFO algorithms, and cashier discount limits
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition self-start disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Identity */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>Store Identity & Thermal Invoice Headers</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Shop / Clinic Name</label>
              <input
                type="text"
                value={settings.shopName || ""}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline || ""}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={settings.phone || ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">WhatsApp</label>
              <input
                type="text"
                value={settings.whatsapp || ""}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tax / NTN Number</label>
              <input
                type="text"
                value={settings.taxNumber || ""}
                onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Commercial Physical Address</label>
            <input
              type="text"
              value={settings.address || ""}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Receipt Footer Legal Terms</label>
            <textarea
              rows={2}
              value={settings.invoiceFooterNotes || ""}
              onChange={(e) => setSettings({ ...settings, invoiceFooterNotes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none"
            />
          </div>
        </div>

        {/* Inventory & POS Governance */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>POS & Inventory Governance Rules</span>
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Stock Dispensing Strategy</label>
              <select
                value={settings.stockAllocationStrategy || "FEFO"}
                onChange={(e) => setSettings({ ...settings, stockAllocationStrategy: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              >
                <option value="FEFO">FEFO (First Expiry, First Out) - Recommended for Drugs</option>
                <option value="FIFO">FIFO (First In, First Out)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Expiry Warning Threshold (Days)</label>
              <input
                type="number"
                value={settings.lowStockAlertDays || 60}
                onChange={(e) => setSettings({ ...settings, lowStockAlertDays: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Cashier Max Discount Limit (%)</label>
              <input
                type="number"
                step="0.5"
                value={settings.maxDiscountCashierPercent || 5.0}
                onChange={(e) =>
                  setSettings({ ...settings, maxDiscountCashierPercent: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
