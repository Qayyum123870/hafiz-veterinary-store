"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  User,
  PawPrint,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Pill,
  LayoutGrid,
  List,
  X,
  Banknote,
  Boxes,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatDate, getExpiryBadgeStatus } from "@/lib/formatters";

interface CartItem {
  productId: string;
  name: string;
  genericName?: string;
  sku: string;
  imageUrl?: string;
  batchId?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  availableStock: number;
  unitPrice: number;
  discount: number;
  petId?: string;
}

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedPet, setSelectedPet] = useState<any | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [activeRegister, setActiveRegister] = useState<any | null>(null);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load Initial Data (Customers, Register status, Categories, Catalog)
  useEffect(() => {
    // Customers
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCustomers(data.customers || []);
      })
      .catch(() => {});

    // Active Cash Register
    fetch("/api/register/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setActiveRegister(data.register || null);
      })
      .catch(() => {});

    // Categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.categories || []);
      })
      .catch(() => {});

    // Initial Catalog
    fetchProducts("", "");
  }, []);

  const fetchProducts = async (term: string, catId: string) => {
    setCatalogLoading(true);
    try {
      let url = `/api/products?limit=50`;
      if (term) url += `&search=${encodeURIComponent(term)}`;
      if (catId) url += `&categoryId=${encodeURIComponent(catId)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch {
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    fetchProducts(val, selectedCategory);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    fetchProducts(searchQuery, catId);
  };

  // Add Product to Cart with Auto-FEFO
  const addToCart = (product: any) => {
    setErrorMsg(null);
    const existingIndex = cart.findIndex((i) => i.productId === product.id);

    // Filter available active, non-expired batches
    const activeBatches = (product.batches || []).filter(
      (b: any) => b.status === "ACTIVE" && b.currentQuantity > 0 && new Date(b.expiryDate) > new Date()
    );

    const totalStock = activeBatches.reduce((acc: number, b: any) => acc + b.currentQuantity, 0);

    if (totalStock === 0) {
      setErrorMsg(`Cannot add ${product.name}: No active, non-expired stock available.`);
      return;
    }

    if (existingIndex > -1) {
      const item = cart[existingIndex];
      if (item.quantity + 1 > totalStock) {
        setErrorMsg(`Cannot exceed available batch stock (${totalStock} units).`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      // Prioritize closest expiry batch for visual presentation
      const bestBatch = activeBatches[0];
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          genericName: product.genericName,
          sku: product.sku,
          imageUrl: product.imageUrl,
          batchId: bestBatch?.id,
          batchNumber: bestBatch?.batchNumber,
          expiryDate: bestBatch?.expiryDate,
          quantity: 1,
          availableStock: totalStock,
          unitPrice: product.salePrice,
          discount: 0,
          petId: selectedPet?.id,
        },
      ]);
    }
  };

  // Barcode / Enter key in search box
  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const term = searchQuery.trim();
      if (!term) return;

      // Check if term matches exact barcode
      try {
        const res = await fetch(`/api/products?barcode=${encodeURIComponent(term)}`);
        const data = await res.json();
        if (data.success && data.product) {
          addToCart(data.product);
          setSearchQuery("");
          fetchProducts("", selectedCategory);
          return;
        }
      } catch {}

      // If only 1 product in filtered list
      if (products.length === 1) {
        addToCart(products[0]);
        setSearchQuery("");
        fetchProducts("", selectedCategory);
      }
    }
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.availableStock) {
      setErrorMsg(`Maximum available stock is ${item.availableStock}.`);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Are you sure you want to clear all items in the cart?")) {
      setCart([]);
      setPaidAmount(0);
      setDiscountValue(0);
    }
  };

  // Totals Calculation
  const subTotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  let discountTotal = 0;
  if (discountValue > 0) {
    if (discountType === "PERCENTAGE") {
      discountTotal = (subTotal * discountValue) / 100;
    } else {
      discountTotal = discountValue;
    }
  }
  const grandTotal = Math.max(0, subTotal - discountTotal);
  const dueAmount = Math.max(0, grandTotal - paidAmount);
  const changeAmount = paidAmount > grandTotal ? paidAmount - grandTotal : 0;

  // Auto-fill paidAmount on full payment
  const handleQuickPayFull = () => {
    setPaidAmount(grandTotal);
  };

  const handleAddCash = (increment: number) => {
    setPaidAmount((prev) => (Number(prev) || 0) + increment);
  };

  // Submit Sale Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        customerId: selectedCustomer?.id || undefined,
        petId: selectedPet?.id || undefined,
        cashRegisterId: activeRegister?.id || undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          batchId: i.batchId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
          petId: selectedPet?.id,
        })),
        discountType,
        discountValue,
        paymentMethod,
        paidAmount: Number(paidAmount),
        notes,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Checkout failed");
      }

      setCompletedSale(data.sale);
      setCart([]);
      setPaidAmount(0);
      setDiscountValue(0);
      setNotes("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard Shortcuts (F2: Search focus, F10: Complete Sale)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "F10") {
        e.preventDefault();
        if (cart.length > 0 && !loading) {
          handleCheckout();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, loading, selectedCustomer, selectedPet, discountType, discountValue, paymentMethod, paidAmount, notes, activeRegister]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7.5rem)] overflow-hidden">
      {/* ======================================================== */}
      {/* LEFT PANEL: Fast Catalog, Search, Filters & Product List */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden space-y-3">
        {/* Top Control Bar: Search & View Toggle */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3 shadow-md flex-shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Scan barcode or type medicine/pet product name... (F2)"
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Barcode className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-medium">Barcode Scanner Ready</span>
          </div>

          {/* Grid vs Table View Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("GRID")}
              title="Grid View"
              className={`p-1.5 rounded-lg transition ${
                viewMode === "GRID"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              title="Table View"
              className={`p-1.5 rounded-lg transition ${
                viewMode === "TABLE"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-shrink-0 text-xs scrollbar-none">
          <button
            onClick={() => handleCategorySelect("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === ""
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategorySelect(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === c.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Product Catalog Display Area (Internal Smooth Scroll) */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {catalogLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span>Loading medicines & products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
              <Pill className="w-8 h-8 text-slate-600" />
              <span>No products match "{searchQuery}"</span>
            </div>
          ) : viewMode === "GRID" ? (
            /* =================== GRID VIEW =================== */
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5">
              {products.map((p) => {
                const activeStock = (p.batches || [])
                  .filter((b: any) => b.status === "ACTIVE" && new Date(b.expiryDate) > new Date())
                  .reduce((sum: number, b: any) => sum + b.currentQuantity, 0);

                const nearestBatch = p.batches?.[0];
                const expiryInfo = nearestBatch ? getExpiryBadgeStatus(nearestBatch.expiryDate) : null;

                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 cursor-pointer transition flex flex-col justify-between group shadow-sm hover:shadow-emerald-950/20 ${
                      activeStock === 0 ? "opacity-45 pointer-events-none" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">{p.sku}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            activeStock > 10
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : activeStock > 0
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {activeStock} in stock
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-700/80 flex-shrink-0"
                            onError={(e) => {
                              (e.target as any).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500">
                            <Pill className="w-5 h-5 text-emerald-400/60" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition line-clamp-2">
                            {p.name}
                          </h4>
                          {p.genericName && (
                            <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">{p.genericName}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black text-emerald-400 font-mono">
                          {formatCurrency(p.salePrice)}
                        </div>
                        {nearestBatch && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[9px] font-semibold border border-slate-800">
                            🏷️ {nearestBatch.batchNumber}
                          </span>
                        )}
                      </div>
                      {expiryInfo && (
                        <div className="flex justify-end">
                          <span
                            className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${
                              expiryInfo.color === "danger"
                                ? "bg-red-500/20 text-red-300"
                                : expiryInfo.color === "warning"
                                ? "bg-amber-500/20 text-amber-300"
                                : "text-slate-500"
                            }`}
                          >
                            Exp: {expiryInfo.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* =================== TABLE VIEW =================== */
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-300 border-b border-slate-800 z-10">
                  <tr className="bg-slate-950">
                    <th className="py-2.5 px-3 font-semibold bg-slate-950">Product</th>
                    <th className="py-2.5 px-3 font-semibold bg-slate-950">SKU</th>
                    <th className="py-2.5 px-3 font-semibold bg-slate-950">Active Batch</th>
                    <th className="py-2.5 px-3 font-semibold text-center bg-slate-950">Stock</th>
                    <th className="py-2.5 px-3 font-semibold text-right bg-slate-950">Price</th>
                    <th className="py-2.5 px-3 font-semibold text-center bg-slate-950">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map((p) => {
                    const activeStock = (p.batches || [])
                      .filter((b: any) => b.status === "ACTIVE" && new Date(b.expiryDate) > new Date())
                      .reduce((sum: number, b: any) => sum + b.currentQuantity, 0);

                    const nearestBatch = p.batches?.[0];

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-800/40 transition cursor-pointer ${
                          activeStock === 0 ? "opacity-40 pointer-events-none" : ""
                        }`}
                        onClick={() => addToCart(p)}
                      >
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-8 h-8 rounded-lg object-cover bg-slate-950 border border-slate-800 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500">
                                <Pill className="w-3.5 h-3.5 text-emerald-400/60" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white text-xs">{p.name}</div>
                              {p.genericName && (
                                <div className="text-[10px] text-slate-400 italic line-clamp-1">
                                  {p.genericName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{p.sku}</td>
                        <td className="py-2 px-3">
                          {nearestBatch ? (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                              {nearestBatch.batchNumber}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              activeStock > 10
                                ? "bg-emerald-500/10 text-emerald-400"
                                : activeStock > 0
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {activeStock}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 text-xs">
                          {formatCurrency(p.salePrice)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-[10px] font-semibold transition"
                          >
                            + Add
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT PANEL: PINNED POS Checkout Drawer & Cart Manager   */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[430px] xl:w-[460px] h-full flex flex-col justify-between rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex-shrink-0">
        {/* Drawer Header: Customer & Pet Selection */}
        <div className="p-3.5 bg-slate-950/70 border-b border-slate-800 space-y-2.5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer / Patient</span>
            </span>
            {selectedCustomer && (
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setSelectedPet(null);
                }}
                className="text-[11px] text-amber-400 hover:underline font-medium"
              >
                Reset (Walk-In)
              </button>
            )}
          </div>

          <select
            value={selectedCustomer?.id || ""}
            onChange={(e) => {
              const cust = customers.find((c) => c.id === e.target.value);
              setSelectedCustomer(cust || null);
              setSelectedPet(null);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
          >
            <option value="">👤 Walk-In Customer (Cash)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone || "No phone"}) - Ledg: Rs. {c.currentBalance}
              </option>
            ))}
          </select>

          {/* Pet Selector (if customer has registered animals) */}
          {selectedCustomer && selectedCustomer.pets && selectedCustomer.pets.length > 0 && (
            <div className="flex items-center gap-2">
              <PawPrint className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
              <select
                value={selectedPet?.id || ""}
                onChange={(e) => {
                  const p = selectedCustomer.pets.find((pet: any) => pet.id === e.target.value);
                  setSelectedPet(p || null);
                }}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="">No Specific Pet Patient Selected</option>
                {selectedCustomer.pets.map((pet: any) => (
                  <option key={pet.id} value={pet.id}>
                    Patient: {pet.name} ({pet.species?.name} - {pet.breed || "Local"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cart Header Stats */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cart Items</span>
              </span>
              <span className="px-2 py-0.2 rounded-full bg-slate-800 text-[11px] font-mono text-emerald-300">
                {cart.length}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Drawer Middle: Scrollable Cart Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2 py-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-slate-600" />
              </div>
              <p className="font-medium text-slate-400">Cart is empty</p>
              <p className="text-[11px] text-slate-600 text-center max-w-[200px]">
                Scan a barcode or click items from catalog to dispense
              </p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-2.5 hover:border-slate-700/80 transition shadow-sm"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-800 flex-shrink-0"
                      onError={(e) => {
                        (e.target as any).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500">
                      <Pill className="w-4 h-4 text-emerald-400/60" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-100 truncate">{item.name}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      {item.batchNumber && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-900 text-emerald-300 font-mono text-[9px] font-semibold border border-slate-800">
                          🏷️ {item.batchNumber}
                        </span>
                      )}
                      <span>•</span>
                      <span className="font-mono text-slate-300">{formatCurrency(item.unitPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
                    <button
                      onClick={() => updateQuantity(idx, item.quantity - 1)}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-7 text-center text-white font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(idx, item.quantity + 1)}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[55px]">
                    <div className="text-xs font-bold font-mono text-emerald-400">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(idx)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ======================================================== */}
        {/* Drawer Bottom: PINNED CHECKOUT FOOTER (NEVER SCROLLS)   */}
        {/* ======================================================== */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5 shadow-2xl flex-shrink-0">
          {/* Subtotal & Discount Row */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold font-mono text-slate-200">{formatCurrency(subTotal)}</span>
            </div>

            {/* Discount Row */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span>Discount</span>
                <button
                  type="button"
                  onClick={() => setDiscountType(discountType === "FIXED" ? "PERCENTAGE" : "FIXED")}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700"
                >
                  {discountType === "PERCENTAGE" ? "% Percent" : "Rs Fixed"}
                </button>
              </span>
              <div className="flex items-center gap-1.5">
                {discountTotal > 0 && (
                  <span className="text-[11px] text-emerald-400 font-mono">
                    -{formatCurrency(discountTotal)}
                  </span>
                )}
                <input
                  type="number"
                  min="0"
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="0"
                  className="w-20 bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-right text-xs font-mono text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Grand Total Row */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Net Total</span>
              <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Pills */}
          <div className="grid grid-cols-5 gap-1 pt-0.5">
            {[
              { id: "CASH", label: "Cash" },
              { id: "CREDIT", label: "Udhaar" },
              { id: "JAZZCASH", label: "JazzCash" },
              { id: "EASYPAISA", label: "Easypaisa" },
              { id: "CARD", label: "Card" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setPaymentMethod(m.id);
                  if (m.id === "CASH" || m.id === "CARD") {
                    setPaidAmount(grandTotal);
                  } else if (m.id === "CREDIT") {
                    setPaidAmount(0);
                  }
                }}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition text-center truncate ${
                  paymentMethod === m.id
                    ? m.id === "CREDIT"
                      ? "bg-amber-600 text-white border-amber-500 shadow-sm"
                      : "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Amount Tendered & Quick Denominations */}
          <div className="space-y-1.5 pt-0.5">
            {/* Quick Cash Chips */}
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Quick Cash:</span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={handleQuickPayFull}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 font-bold border border-slate-700/60"
                >
                  Exact
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCash(500)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCash(1000)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                >
                  +1k
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCash(5000)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                >
                  +5k
                </button>
              </div>
            </div>

            {/* Paid Amount Input & Return Change Indicator */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <input
                  type="number"
                  min="0"
                  value={paidAmount || ""}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  placeholder="Cash Given..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-emerald-300 outline-none focus:border-emerald-500"
                />
              </div>

              <div
                className={`py-1.5 px-3 rounded-xl border flex items-center justify-between text-xs font-bold font-mono ${
                  paidAmount >= grandTotal
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                    : "text-amber-400 bg-amber-500/10 border-amber-500/30"
                }`}
              >
                <span className="text-[10px] font-sans font-medium text-slate-400">
                  {paidAmount >= grandTotal ? "Change:" : "Due:"}
                </span>
                <span>
                  {paidAmount >= grandTotal ? formatCurrency(changeAmount) : formatCurrency(dueAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout Submit Button (Always Pinned!) */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition disabled:opacity-40"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Sale & Print Bill</span>
                <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px] font-mono font-medium">
                  F10
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SALE SUCCESS & RECEIPT PRINT MODAL                       */}
      {/* ======================================================== */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Invoice Completed!</h3>
              <p className="text-xs text-slate-400 mt-0.5">{completedSale.invoiceNumber}</p>
            </div>

            {/* Printable Receipt Preview */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
              <div className="text-center font-bold text-white text-sm">Hafiz Veterinary Store</div>
              <div className="text-[10px] text-center text-slate-400">Sahiwal Veterinary Complex • PK</div>
              <div className="border-b border-dashed border-slate-800 my-2" />
              <div className="flex justify-between text-[11px]">
                <span>Invoice: {completedSale.invoiceNumber}</span>
                <span>{formatDate(completedSale.createdAt)}</span>
              </div>
              {completedSale.customer && (
                <div className="text-[11px] text-emerald-400 font-bold">
                  Customer: {completedSale.customer.name}
                </div>
              )}
              {completedSale.pet && (
                <div className="text-[11px] text-teal-400">
                  Pet Patient: {completedSale.pet.name} ({completedSale.pet.species?.name})
                </div>
              )}
              <div className="border-b border-dashed border-slate-800 my-2" />
              {completedSale.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>
                    {item.product?.name} x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
              <div className="border-b border-dashed border-slate-800 my-2" />
              <div className="flex justify-between font-bold text-white">
                <span>Grand Total:</span>
                <span>{formatCurrency(completedSale.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Paid: {formatCurrency(completedSale.paidAmount)}</span>
                <span>Due: {formatCurrency(completedSale.dueAmount)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
