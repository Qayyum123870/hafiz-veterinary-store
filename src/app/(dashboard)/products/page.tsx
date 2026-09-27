"use client";

import { useEffect, useState, useRef } from "react";
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  Trash2,
  X,
  UploadCloud,
  ImageIcon,
  Eye,
  Edit3,
  PackagePlus,
  Clock,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { formatCurrency, formatDate, getExpiryBadgeStatus } from "@/lib/formatters";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // Success / Alert message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productType, setProductType] = useState("MEDICINE");
  const [unit, setUnit] = useState("VIAL");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [minStock, setMinStock] = useState("10");
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [strength, setStrength] = useState("");
  const [dosageForm, setDosageForm] = useState("INJECTION");
  const [withdrawalPeriod, setWithdrawalPeriod] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [initialStock, setInitialStock] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. View Product Modal State
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);

  // 3. Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editGenericName, setEditGenericName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editUnit, setEditUnit] = useState("PIECE");
  const [editPurchasePrice, setEditPurchasePrice] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");
  const [editMinStock, setEditMinStock] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editStrength, setEditStrength] = useState("");
  const [editDosageForm, setEditDosageForm] = useState("INJECTION");
  const [editWithdrawalPeriod, setEditWithdrawalPeriod] = useState("");
  const [editUploading, setEditUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // 4. Add Stock / Batch Modal State
  const [stockProduct, setStockProduct] = useState<any | null>(null);
  const [stockBatchNumber, setStockBatchNumber] = useState("");
  const [stockExpiryDate, setStockExpiryDate] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockCostPrice, setStockCostPrice] = useState("");
  const [stockSalePrice, setStockSalePrice] = useState("");
  const [stockSaving, setStockSaving] = useState(false);

  // File Upload Handler (for Add Modal)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setImageUrl(data.url);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  // File Upload Handler (for Edit Modal)
  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setEditImageUrl(data.url);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setEditUploading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(search)}&categoryId=${selectedCategory}`
      );
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // Load categories & species
    fetch("/api/categories")
      .then((res) => res.json())
      .then((d) => setCategories(d.categories || []));

    fetch("/api/species")
      .then((res) => res.json())
      .then((d) => setSpeciesList(d.species || []));
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Create Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        name,
        genericName,
        sku,
        barcode,
        categoryId,
        productType,
        unit,
        imageUrl: imageUrl.trim() || undefined,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        minStockThreshold: Number(minStock),
        prescriptionRequired,
        speciesIds: selectedSpecies,
        initialBatch:
          batchNumber.trim() && expiryDate && Number(initialStock) > 0
            ? {
                batchNumber: batchNumber.trim(),
                expiryDate,
                quantity: Number(initialStock),
              }
            : undefined,
        medicineDetails:
          productType === "MEDICINE" || productType === "VACCINE"
            ? {
                strength,
                dosageForm,
                withdrawalPeriod,
              }
            : undefined,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create product");

      setShowAddModal(false);
      // Reset form
      setName("");
      setGenericName("");
      setSku("");
      setBarcode("");
      setImageUrl("");
      setBatchNumber("");
      setExpiryDate("");
      setInitialStock("");
      setPurchasePrice("");
      setSalePrice("");
      setWithdrawalPeriod("");
      setStatusMessage(`Product "${name}" was created successfully!`);
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setEditName(p.name || "");
    setEditGenericName(p.genericName || "");
    setEditCategoryId(p.categoryId || "");
    setEditUnit(p.unit || "PIECE");
    setEditPurchasePrice(p.purchasePrice ? String(p.purchasePrice) : "");
    setEditSalePrice(p.salePrice ? String(p.salePrice) : "");
    setEditMinStock(p.minStockThreshold ? String(p.minStockThreshold) : "10");
    setEditImageUrl(p.imageUrl || "");
    setEditStrength(p.medicineDetail?.strength || "");
    setEditDosageForm(p.medicineDetail?.dosageForm || "INJECTION");
    setEditWithdrawalPeriod(p.medicineDetail?.withdrawalPeriod || "");
    setErrorMsg(null);
  };

  // Update Product Submit
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        name: editName,
        genericName: editGenericName,
        categoryId: editCategoryId,
        unit: editUnit,
        purchasePrice: Number(editPurchasePrice),
        salePrice: Number(editSalePrice),
        minStockThreshold: Number(editMinStock),
        imageUrl: editImageUrl.trim() || null,
        medicineDetails: {
          strength: editStrength,
          dosageForm: editDosageForm,
          withdrawalPeriod: editWithdrawalPeriod,
        },
      };

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update product");

      setEditingProduct(null);
      setStatusMessage(`Product "${editName}" updated successfully!`);
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Add Stock / Batch Modal
  const openStockModal = (p: any) => {
    setStockProduct(p);
    setStockBatchNumber("");
    setStockExpiryDate("");
    setStockQuantity("");
    setStockCostPrice(p.purchasePrice ? String(p.purchasePrice) : "");
    setStockSalePrice(p.salePrice ? String(p.salePrice) : "");
    setErrorMsg(null);
  };

  // Add Stock / Batch Submit
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProduct) return;
    setStockSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        productId: stockProduct.id,
        batchNumber: stockBatchNumber.trim(),
        expiryDate: stockExpiryDate,
        quantity: Number(stockQuantity),
        costPrice: stockCostPrice ? Number(stockCostPrice) : undefined,
        salePrice: stockSalePrice ? Number(stockSalePrice) : undefined,
      };

      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to add stock");

      const addedQty = stockQuantity;
      const addedBatch = stockBatchNumber;
      const prodName = stockProduct.name;

      setStockProduct(null);
      setStatusMessage(`Added ${addedQty} units to Batch ${addedBatch} for "${prodName}".`);
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setStockSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (p: any) => {
    if (!confirm(`Are you sure you want to delete "${p.name}"? This will deactivate the product.`)) return;

    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete product");

      setStatusMessage(`Product "${p.name}" was successfully deleted.`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleSpecies = (id: string) => {
    if (selectedSpecies.includes(id)) {
      setSelectedSpecies(selectedSpecies.filter((s) => s !== id));
    } else {
      setSelectedSpecies([...selectedSpecies, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-400" />
            <span>Veterinary Medicines & Supplies Catalog</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage animal formulations, batch expiration dates, stock entries, and product profiles
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medicine / Product</span>
        </button>
      </div>

      {/* Status Success Banner */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
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
            placeholder="Search by brand name, generic formulation, SKU, or barcode..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
          />
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table with Dedicated Internal Scroll and Sticky Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
        {/* Table Sub-header bar */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-200">Products Catalog</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/60 text-[11px] text-emerald-400 font-mono font-medium">
              {products.length} Products Loaded
            </span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
            <span>↕ Scroll inside table to browse all medicines</span>
          </span>
        </div>

        {/* Scrollable Container with max-height & custom scroll */}
        <div className="overflow-x-auto overflow-y-auto max-h-[580px] md:max-h-[calc(100vh-19rem)] min-h-[380px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 shadow-md">
              <tr className="bg-slate-950">
                <th className="py-3.5 px-4 font-semibold text-slate-300 bg-slate-950 whitespace-nowrap">SKU / Barcode</th>
                <th className="py-3.5 px-4 font-semibold text-slate-300 bg-slate-950 whitespace-nowrap">Product & Generic Name</th>
                <th className="py-3.5 px-4 font-semibold text-slate-300 bg-slate-950 whitespace-nowrap">Species & Category</th>
                <th className="py-3.5 px-4 font-semibold text-slate-300 bg-slate-950 whitespace-nowrap">Active Batches (FEFO)</th>
                <th className="py-3.5 px-4 font-semibold text-right text-slate-300 bg-slate-950 whitespace-nowrap">Cost Price</th>
                <th className="py-3.5 px-4 font-semibold text-right text-slate-300 bg-slate-950 whitespace-nowrap">Sale Price</th>
                <th className="py-3.5 px-4 font-semibold text-center text-slate-300 bg-slate-950 whitespace-nowrap">Total Stock</th>
                <th className="py-3.5 px-4 font-semibold text-center text-slate-300 bg-slate-950 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading medicine catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const totalStock = (p.stocks || []).reduce((acc: number, s: any) => acc + s.currentStock, 0);
                  const isLow = totalStock <= p.minStockThreshold;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-400">
                        <div className="text-emerald-400 font-semibold">{p.sku}</div>
                        {p.barcode && <div className="text-[10px] text-slate-500">{p.barcode}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700/80 flex-shrink-0 cursor-pointer hover:opacity-90"
                              onClick={() => setViewingProduct(p)}
                              onError={(e) => {
                                (e.target as any).style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              onClick={() => setViewingProduct(p)}
                              className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center flex-shrink-0 text-slate-500 cursor-pointer"
                            >
                              <Pill className="w-5 h-5 text-emerald-400/70" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div
                              onClick={() => setViewingProduct(p)}
                              className="font-bold text-white text-xs hover:text-emerald-400 cursor-pointer transition"
                            >
                              {p.name}
                            </div>
                            {p.genericName && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5">{p.genericName}</div>
                            )}
                            {p.medicineDetail?.withdrawalPeriod && (
                              <div className="text-[10px] text-amber-400/90 font-medium mt-1">
                                Withdrawal: {p.medicineDetail.withdrawalPeriod}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-300 font-medium">{p.category?.name}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.productSpecies?.map((ps: any) => (
                            <span
                              key={ps.species.id}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700/50"
                            >
                              {ps.species.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {p.batches?.length === 0 ? (
                            <span className="text-[10px] text-slate-500">No active batches</span>
                          ) : (
                            p.batches?.map((b: any) => {
                              const badge = getExpiryBadgeStatus(b.expiryDate);
                              return (
                                <div key={b.id} className="flex items-center gap-1.5 text-[10px]">
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono font-semibold border border-emerald-500/20">
                                    🏷️ {b.batchNumber}
                                  </span>
                                  <span className="text-slate-400">({b.currentQuantity} units)</span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-medium ${
                                      badge.color === "danger"
                                        ? "bg-red-500/20 text-red-300"
                                        : badge.color === "warning"
                                        ? "bg-amber-500/20 text-amber-300"
                                        : "bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    {badge.label}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatCurrency(p.purchasePrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(p.salePrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            totalStock === 0
                              ? "bg-red-500/20 text-red-300"
                              : isLow
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {totalStock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. View Button */}
                          <button
                            onClick={() => setViewingProduct(p)}
                            title="View Product Details"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Add Stock / Batch Button */}
                          <button
                            onClick={() => openStockModal(p)}
                            title="Add Stock & New Batch"
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>+ Stock</span>
                          </button>

                          {/* 3. Edit Button */}
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-blue-400 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Delete Button */}
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600/30 text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: VIEW PRODUCT DETAILS */}
      {/* ======================================================== */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <Pill className="w-5 h-5" />
                <span>Product Specifications</span>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {viewingProduct.imageUrl ? (
                <img
                  src={viewingProduct.imageUrl}
                  alt={viewingProduct.name}
                  className="w-28 h-28 rounded-xl object-cover border border-slate-700 bg-slate-950 flex-shrink-0 shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500">
                  <Pill className="w-10 h-10 text-emerald-400/50" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    {viewingProduct.sku}
                  </span>
                  {viewingProduct.barcode && (
                    <span className="text-[10px] text-slate-400 font-mono">Barcode: {viewingProduct.barcode}</span>
                  )}
                </div>
                <h2 className="text-base font-bold text-white">{viewingProduct.name}</h2>
                {viewingProduct.genericName && (
                  <p className="text-xs text-slate-400 italic">{viewingProduct.genericName}</p>
                )}
                <div className="text-xs text-slate-300 pt-1">
                  Category: <strong className="text-white">{viewingProduct.category?.name || "General"}</strong>
                </div>
                {viewingProduct.productSpecies && viewingProduct.productSpecies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {viewingProduct.productSpecies.map((ps: any) => (
                      <span
                        key={ps.species?.id}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {ps.species?.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Financial & Stock Metrics */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Purchase Cost</span>
                <span className="text-slate-200 font-bold font-mono">{formatCurrency(viewingProduct.purchasePrice)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Retail Price</span>
                <span className="text-emerald-400 font-bold font-mono">{formatCurrency(viewingProduct.salePrice)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Current Stock</span>
                <span className="text-white font-bold">
                  {(viewingProduct.stocks || []).reduce((acc: number, s: any) => acc + s.currentStock, 0)}{" "}
                  {viewingProduct.unit}
                </span>
              </div>
            </div>

            {/* Veterinary Medicine Attributes */}
            {viewingProduct.medicineDetail && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <span className="font-semibold text-emerald-400 block text-[11px]">Medicine Clinical Details</span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-400 text-[10px]">Dosage Form:</span>{" "}
                    <strong>{viewingProduct.medicineDetail.dosageForm}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Strength:</span>{" "}
                    <strong>{viewingProduct.medicineDetail.strength || "N/A"}</strong>
                  </div>
                  {viewingProduct.medicineDetail.withdrawalPeriod && (
                    <div className="col-span-2 text-amber-300">
                      <span className="text-slate-400 text-[10px]">Withdrawal Period:</span>{" "}
                      <strong>{viewingProduct.medicineDetail.withdrawalPeriod}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Batches Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Batch Inventory & Expiry Records</span>
                </span>
                <button
                  onClick={() => {
                    const p = viewingProduct;
                    setViewingProduct(null);
                    openStockModal(p);
                  }}
                  className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Batch / Stock</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {viewingProduct.batches?.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-950 text-center text-slate-500 text-xs">
                    No active batches found for this product. Click "+ Add Batch / Stock" to replenish.
                  </div>
                ) : (
                  viewingProduct.batches?.map((b: any) => {
                    const badge = getExpiryBadgeStatus(b.expiryDate);
                    return (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono font-bold border border-emerald-500/20">
                            🏷️ {b.batchNumber}
                          </span>
                          <span className="text-slate-400">
                            Expiry: <strong>{formatDate(b.expiryDate)}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{b.currentQuantity} units</span>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                              badge.color === "danger"
                                ? "bg-red-500/20 text-red-300"
                                : badge.color === "warning"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewingProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT PRODUCT */}
      {/* ======================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Edit Product: {editingProduct.name}</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
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

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Product Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Generic Name / Composition</label>
                  <input
                    type="text"
                    value={editGenericName}
                    onChange={(e) => setEditGenericName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category *</label>
                  <select
                    required
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
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
                  <label className="block text-slate-300 font-medium mb-1">Unit</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="VIAL">Vial</option>
                    <option value="BOTTLE">Bottle</option>
                    <option value="STRIP">Strip</option>
                    <option value="BOX">Box</option>
                    <option value="BAG">Bag</option>
                    <option value="PIECE">Piece</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cost Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editPurchasePrice}
                    onChange={(e) => setEditPurchasePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sale Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Edit Image Upload */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-blue-400" />
                    <span>Product Image</span>
                  </span>
                  {editImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditImageUrl("")}
                      className="text-[11px] text-red-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </label>

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleEditFileUpload}
                  className="hidden"
                />

                {editImageUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-blue-500/40">
                    <img
                      src={editImageUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-700 bg-slate-900 shadow-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Image attached
                      </p>
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="mt-1 text-[11px] text-blue-400 hover:underline font-medium block"
                      >
                        Choose different image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                      editUploading
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-blue-500/70 hover:bg-slate-950/60 bg-slate-950/40"
                    }`}
                  >
                    {editUploading ? (
                      <div className="flex items-center gap-2 text-blue-400 text-xs py-2">
                        <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                        <span>Uploading image...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-blue-400" />
                        <span className="text-xs text-slate-300 font-medium">Upload new image from your system</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Medicine Formulations */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="font-semibold text-blue-400 block">Veterinary Formulation Specs</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Dosage Form</label>
                    <select
                      value={editDosageForm}
                      onChange={(e) => setEditDosageForm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    >
                      <option value="INJECTION">Injection</option>
                      <option value="TABLET">Tablet</option>
                      <option value="SYRUP">Syrup</option>
                      <option value="POWDER">Powder</option>
                      <option value="VACCINE">Vaccine</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Strength</label>
                    <input
                      type="text"
                      value={editStrength}
                      onChange={(e) => setEditStrength(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Withdrawal Period</label>
                    <input
                      type="text"
                      value={editWithdrawalPeriod}
                      onChange={(e) => setEditWithdrawalPeriod(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD STOCK / BATCH */}
      {/* ======================================================== */}
      {stockProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <PackagePlus className="w-5 h-5" />
                <span>Add Stock & Batch</span>
              </div>
              <button
                onClick={() => setStockProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Product Summary */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              {stockProduct.imageUrl ? (
                <img
                  src={stockProduct.imageUrl}
                  alt={stockProduct.name}
                  className="w-11 h-11 rounded-lg object-cover border border-slate-700"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Pill className="w-5 h-5 text-emerald-400/60" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{stockProduct.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">SKU: {stockProduct.sku}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">
                  Current Total Stock: {(stockProduct.stocks || []).reduce((a: any, b: any) => a + b.currentStock, 0)}{" "}
                  {stockProduct.unit}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddStock} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Batch Number (Badge No) *
                </label>
                <input
                  type="text"
                  required
                  value={stockBatchNumber}
                  onChange={(e) => setStockBatchNumber(e.target.value)}
                  placeholder="e.g. B-2026-02 or BATCH-09"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500 text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Tip: If batch already exists, stock quantity will be added to it.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={stockExpiryDate}
                    onChange={(e) => setStockExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Quantity to Add *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 text-xs font-bold text-emerald-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Cost Price (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stockCostPrice}
                    onChange={(e) => setStockCostPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Sale Price (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stockSalePrice}
                    onChange={(e) => setStockSalePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white outline-none focus:border-emerald-500 text-xs font-semibold text-emerald-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStockProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-emerald-950"
                >
                  {stockSaving ? "Adding..." : "Add Stock to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ADD NEW PRODUCT */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Register Veterinary Medicine / Pet Product</span>
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

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Product Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amoxicillin LA 15% 100ml"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Generic Name / Composition</label>
                  <input
                    type="text"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    placeholder="e.g. Amoxicillin Trihydrate BP"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">SKU / Item Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. VET-AMX-01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Barcode</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan or enter barcode"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Product Type</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="MEDICINE">Medicine</option>
                    <option value="VACCINE">Vaccine</option>
                    <option value="FEED">Pet Food / Feed</option>
                    <option value="SUPPLEMENT">Supplement</option>
                    <option value="EQUIPMENT">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="VIAL">Vial</option>
                    <option value="BOTTLE">Bottle</option>
                    <option value="STRIP">Strip</option>
                    <option value="BOX">Box</option>
                    <option value="BAG">Bag</option>
                    <option value="PIECE">Piece</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cost Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="Rs. Cost"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sale Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="Rs. Retail"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Product Image Upload from Computer */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span>Product Image (Upload from Computer)</span>
                  </span>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-[11px] text-red-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-emerald-500/40">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-700 bg-slate-900 shadow-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Image successfully uploaded
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{imageUrl}</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 text-[11px] text-emerald-400 hover:underline font-medium block"
                      >
                        Choose different image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                      uploading
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-700 hover:border-emerald-500/70 hover:bg-slate-950/60 bg-slate-950/40"
                    }`}
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
                        <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        <span>Uploading image from your computer...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
                          <UploadCloud className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            Click to select product image from your system
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, JPEG, WEBP (from your local drive)</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Initial Batch & Stock Setup */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-400 block text-xs">
                    🏷️ Initial Batch & Stock Setup (Badge / Batch No)
                  </span>
                  <span className="text-[10px] text-slate-500">(Optional - adds initial batch immediately)</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Batch Number (Badge No)</label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g. BATCH-2026-01"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Opening Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Veterinary Specific Fields */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="font-semibold text-emerald-400 block">Veterinary Medicine Formulations</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Dosage Form</label>
                    <select
                      value={dosageForm}
                      onChange={(e) => setDosageForm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    >
                      <option value="INJECTION">Injection</option>
                      <option value="TABLET">Tablet</option>
                      <option value="SYRUP">Syrup</option>
                      <option value="POWDER">Powder</option>
                      <option value="VACCINE">Vaccine</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Strength</label>
                    <input
                      type="text"
                      value={strength}
                      onChange={(e) => setStrength(e.target.value)}
                      placeholder="e.g. 150 mg/ml"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Withdrawal Period (Meat / Milk)</label>
                    <input
                      type="text"
                      value={withdrawalPeriod}
                      onChange={(e) => setWithdrawalPeriod(e.target.value)}
                      placeholder="Meat: 21d | Milk: 3d"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    />
                  </div>
                </div>

                {/* Target Animal Species Multi-Select */}
                <div>
                  <label className="block text-slate-400 mb-1.5">Applicable Animal Species</label>
                  <div className="flex flex-wrap gap-1.5">
                    {speciesList.map((sp) => {
                      const isSelected = selectedSpecies.includes(sp.id);
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => toggleSpecies(sp.id)}
                          className={`px-2.5 py-1 rounded-lg border transition ${
                            isSelected
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500 font-semibold"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                          }`}
                        >
                          {sp.name}
                        </button>
                      );
                    })}
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
