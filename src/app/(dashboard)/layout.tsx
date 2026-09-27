"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  ClockAlert,
  FileText,
  Truck,
  Users,
  Building2,
  Receipt,
  PiggyBank,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  ChevronRight,
  CircleDollarSign,
  AlertTriangle,
} from "lucide-react";

interface UserSession {
  id: string;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expiryAlertCount, setExpiryAlertCount] = useState<number>(0);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);

  useEffect(() => {
    // Fetch active session
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.user) {
          router.push("/login");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push("/login"));

    // Fetch expiry alerts
    fetch("/api/inventory/expiry")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.summary) {
          setExpiryAlertCount(data.summary.expiredCount + data.summary.expiring30Count);
        }
      })
      .catch(() => {});

    // Fetch cash register status
    fetch("/api/register/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.register) {
          setIsRegisterOpen(true);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "POS Checkout", href: "/pos", icon: ShoppingCart, highlight: true },
    { name: "Products & Drugs", href: "/products", icon: Pill },
    { name: "Expiry Watch", href: "/inventory/expiry", icon: ClockAlert, alert: expiryAlertCount },
    { name: "Sales & Invoices", href: "/sales", icon: FileText },
    { name: "Purchases", href: "/purchases", icon: Truck },
    { name: "Customers & Pets", href: "/customers", icon: Users },
    { name: "Suppliers", href: "/suppliers", icon: Building2 },
    { name: "Cash Register", href: "/register", icon: CircleDollarSign },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Profit & Reports", href: "/reports", icon: BarChart3 },
    { name: "Audit Trail", href: "/audit-logs", icon: ShieldAlert },
    { name: "Store Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm">Hafiz Vet Store</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-slate-900/90 border-r border-slate-800 flex-shrink-0 z-40`}
      >
        {/* Brand Area */}
        <div className="hidden md:flex items-center gap-3 p-5 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-glow">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight text-white leading-tight">Hafiz Vet Store</h2>
            <p className="text-[11px] text-emerald-400 font-medium">Pharmacy & Pet Care</p>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="px-4 py-3 mx-3 my-3 bg-slate-800/40 rounded-xl border border-slate-700/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white truncate max-w-[140px]">{user.fullName}</div>
              <div className="text-[10px] text-emerald-400 font-medium">{user.roles[0] || "STAFF"}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? "bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-950/40"
                    : item.highlight
                    ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
                  <span>{item.name}</span>
                </div>
                {item.alert !== undefined && item.alert > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {item.alert}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                    HOT
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Status Footer */}
        <div className="p-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-950/40">
            <span className="text-[11px] text-slate-400">Cash Drawer:</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                isRegisterOpen ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              }`}
            >
              {isRegisterOpen ? "SHIFT OPEN" : "CLOSED"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3.5 bg-slate-900/40 border-b border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Main Branch: Sahiwal Veterinary Complex</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">FEFO Stock Allocation Active</span>
          </div>

          <div className="flex items-center gap-3">
            {expiryAlertCount > 0 && (
              <Link
                href="/inventory/expiry"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{expiryAlertCount} Near-Expiry / Expired Drugs</span>
              </Link>
            )}

            <Link
              href="/pos"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Open POS (F2)</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
