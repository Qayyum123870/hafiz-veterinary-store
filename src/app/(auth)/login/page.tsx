"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, ShieldCheck, Lock, User, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-glow">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Hafiz Veterinary Store</h1>
          <p className="text-sm text-slate-400 mt-1">Veterinary Pharmacy & Pet Care ERP</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Secure Enterprise Access
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  className="w-full bg-slate-950/60 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full bg-slate-950/60 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>1-Click Switch:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin", "admin123")}
                className="bg-slate-800/80 hover:bg-slate-700/80 text-xs py-2 px-2.5 rounded-lg border border-slate-700/60 text-slate-200 transition text-center"
              >
                <div className="font-semibold text-emerald-400">Admin</div>
                <div className="text-[10px] text-slate-400">Full Access</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("pharmacist", "staff123")}
                className="bg-slate-800/80 hover:bg-slate-700/80 text-xs py-2 px-2.5 rounded-lg border border-slate-700/60 text-slate-200 transition text-center"
              >
                <div className="font-semibold text-cyan-400">Pharmacist</div>
                <div className="text-[10px] text-slate-400">Batches & Drugs</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("cashier", "staff123")}
                className="bg-slate-800/80 hover:bg-slate-700/80 text-xs py-2 px-2.5 rounded-lg border border-slate-700/60 text-slate-200 transition text-center"
              >
                <div className="font-semibold text-amber-400">Cashier</div>
                <div className="text-[10px] text-slate-400">POS & Drawer</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Hafiz Veterinary Store Enterprise Edition • Sahiwal, PK
        </div>
      </div>
    </div>
  );
}
