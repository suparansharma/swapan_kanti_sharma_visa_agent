"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Printer,
  Calendar,
  Layers,
  Check,
  X,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { PASSPORT_TYPE_OPTIONS } from "@/components/PassportEntryModule";

export interface PassportCostItem {
  _id: string;
  passportType: string;
  title: string;
  govtFee: number;
  bankFee: number;
  processingFee: number;
  otherFee: number;
  totalCost: number;
  clientFee?: number;
  estimatedProfit?: number;
  duration?: string;
  validityYears?: number;
  pageCount?: number;
  description?: string;
  isActive: boolean;
  createdByName?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function PassportCostModule() {
  const [costs, setCosts] = useState<PassportCostItem[]>([]);
  const [stats, setStats] = useState({
    totalTypes: 0,
    minCost: 0,
    maxCost: 0,
    avgCost: 0,
    totalEstimatedProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValidity, setFilterValidity] = useState<"all" | "5" | "10">("all");
  const [seeding, setSeeding] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Active / Selected Cost items
  const [selectedCost, setSelectedCost] = useState<PassportCostItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PassportCostItem | null>(null);

  // Form State (Add / Edit)
  const [formType, setFormType] = useState<string>(PASSPORT_TYPE_OPTIONS[0]?.value || "");
  const [isCustomType, setIsCustomType] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [formTitle, setFormTitle] = useState(PASSPORT_TYPE_OPTIONS[0]?.label || "");
  const [govtFee, setGovtFee] = useState<number | "">("");
  const [bankFee, setBankFee] = useState<number | "">(150);
  const [processingFee, setProcessingFee] = useState<number | "">("");
  const [otherFee, setOtherFee] = useState<number | "">("");
  const [clientFee, setClientFee] = useState<number | "">("");
  const [duration, setDuration] = useState("২১ কর্মদিবস");
  const [validityYears, setValidityYears] = useState<number>(5);
  const [pageCount, setPageCount] = useState<number>(48);
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch list of costs
  const fetchCosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/passport-costs");
      const data = await res.json();
      if (data.success) {
        setCosts(data.costs || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching passport costs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  // Quick seed standard rates
  const handleSeedDefaults = async () => {
    if (!confirm("আপনি কি আদর্শ সরকারি ও প্রসেসিং খরচের প্রিসেট লোড করতে চান?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/passport-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_defaults" }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        setTimeout(() => setActionSuccess(null), 4000);
        await fetchCosts();
      } else {
        alert(data.error || "লোড করতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error(err);
      alert("সার্ভার ত্রুটি");
    } finally {
      setSeeding(false);
    }
  };

  // Realtime Live Calculated Total for Form
  const calculatedTotal = useMemo(() => {
    const g = Number(govtFee) || 0;
    const b = Number(bankFee) || 0;
    const p = Number(processingFee) || 0;
    const o = Number(otherFee) || 0;
    return g + b + p + o;
  }, [govtFee, bankFee, processingFee, otherFee]);

  const calculatedProfit = useMemo(() => {
    const c = Number(clientFee) || 0;
    if (c <= 0) return 0;
    return c - calculatedTotal;
  }, [clientFee, calculatedTotal]);

  // Handle Preset Selection Change in Add Form
  const handleTypeSelectChange = (val: string) => {
    setFormType(val);
    if (val === "__custom__") {
      setIsCustomType(true);
      setFormTitle("");
    } else {
      setIsCustomType(false);
      const opt = PASSPORT_TYPE_OPTIONS.find((o) => o.value === val);
      if (opt) {
        setFormTitle(opt.label);
        // Smart prefill duration based on label
        if (opt.label.includes("২১ কর্ম দিবস") || opt.label.includes("২১")) {
          setDuration("২১ কর্মদিবস");
        } else if (opt.label.includes("৭ কর্ম দিবস") || opt.label.includes("৭")) {
          setDuration("৭ কর্মদিবস");
        } else if (opt.label.includes("৩ কর্ম দিবস") || opt.label.includes("৩")) {
          setDuration("৩ কর্মদিবস");
        }

        // Validity
        if (opt.label.includes("১০ বছর")) {
          setValidityYears(10);
        } else {
          setValidityYears(5);
        }

        // Standard government fee suggestion
        if (opt.label.includes("৫ বছর") && opt.label.includes("২১")) {
          setGovtFee(4025);
        } else if (opt.label.includes("১০ বছর") && opt.label.includes("২১")) {
          setGovtFee(5750);
        } else if (opt.label.includes("৫ বছর") && opt.label.includes("৭")) {
          setGovtFee(6325);
        } else if (opt.label.includes("১০ বছর") && opt.label.includes("৭")) {
          setGovtFee(8050);
        } else if (opt.label.includes("৫ বছর") && opt.label.includes("৩")) {
          setGovtFee(8625);
        } else if (opt.label.includes("১০ বছর") && opt.label.includes("৩")) {
          setGovtFee(10350);
        }
      }
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    // Find first passport type option that is NOT yet added
    const existingKeys = new Set(costs.map((c) => c.passportType));
    const available = PASSPORT_TYPE_OPTIONS.find((o) => !existingKeys.has(o.value));
    const initialKey = available ? available.value : PASSPORT_TYPE_OPTIONS[0]?.value || "";

    setEditId(null);
    setIsCustomType(false);
    setCustomKey("");
    handleTypeSelectChange(initialKey);
    setProcessingFee(500);
    setOtherFee(300);
    setClientFee("");
    setDescription("");
    setActionError(null);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (item: PassportCostItem) => {
    setEditId(item._id);
    setFormType(item.passportType);
    setIsCustomType(false);
    setFormTitle(item.title);
    setGovtFee(item.govtFee);
    setBankFee(item.bankFee);
    setProcessingFee(item.processingFee);
    setOtherFee(item.otherFee);
    setClientFee(item.clientFee || "");
    setDuration(item.duration || "২১ কর্মদিবস");
    setValidityYears(item.validityYears || 5);
    setPageCount(item.pageCount || 48);
    setDescription(item.description || "");
    setActionError(null);
    setShowEditModal(true);
  };

  // Open View Modal
  const openViewModal = (item: PassportCostItem) => {
    setSelectedCost(item);
    setShowViewModal(true);
  };

  // Open Delete Modal
  const openDeleteModal = (item: PassportCostItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Submit Add New Cost
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const typeKey = isCustomType ? customKey.trim().toLowerCase().replace(/\s+/g, "_") : formType;
    if (!typeKey) {
      setActionError("পাসপোর্ট ধরনের কোড আবশ্যক।");
      return;
    }
    if (!formTitle.trim()) {
      setActionError("পাসপোর্ট ধরন বা শিরোনাম আবশ্যক।");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/passport-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passportType: typeKey,
          title: formTitle.trim(),
          govtFee: Number(govtFee) || 0,
          bankFee: Number(bankFee) || 0,
          processingFee: Number(processingFee) || 0,
          otherFee: Number(otherFee) || 0,
          clientFee: Number(clientFee) || 0,
          duration: duration.trim(),
          validityYears,
          pageCount,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "সংরক্ষণ করতে ব্যর্থ হয়েছে");
      }

      setShowAddModal(false);
      setActionSuccess("নতুন পাসপোর্ট খরচের তথ্য সফলভাবে যুক্ত হয়েছে।");
      setTimeout(() => setActionSuccess(null), 4000);
      fetchCosts();
    } catch (err: any) {
      setActionError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Cost
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setActionError(null);

    setSubmitting(true);
    try {
      const res = await fetch("/api/passport-costs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          passportType: formType,
          title: formTitle.trim(),
          govtFee: Number(govtFee) || 0,
          bankFee: Number(bankFee) || 0,
          processingFee: Number(processingFee) || 0,
          otherFee: Number(otherFee) || 0,
          clientFee: Number(clientFee) || 0,
          duration: duration.trim(),
          validityYears,
          pageCount,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "আপডেট করতে ব্যর্থ হয়েছে");
      }

      setShowEditModal(false);
      setActionSuccess("পাসপোর্ট খরচের তথ্য সফলভাবে আপডেট হয়েছে।");
      setTimeout(() => setActionSuccess(null), 4000);
      fetchCosts();
    } catch (err: any) {
      setActionError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/passport-costs?id=${itemToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ডিলিট করতে ব্যর্থ হয়েছে");
      }

      setShowDeleteModal(false);
      setItemToDelete(null);
      setActionSuccess(data.message || "খরচের তথ্য মুছে ফেলা হয়েছে।");
      setTimeout(() => setActionSuccess(null), 4000);
      fetchCosts();
    } catch (err: any) {
      alert(err.message || "ডিলিট করতে সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Costs
  const filteredCosts = useMemo(() => {
    return costs.filter((c) => {
      const matchSearch =
        !searchQuery.trim() ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.passportType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.duration && c.duration.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchValidity =
        filterValidity === "all" ||
        (filterValidity === "5" && c.validityYears === 5) ||
        (filterValidity === "10" && c.validityYears === 10);

      return matchSearch && matchValidity;
    });
  }, [costs, searchQuery, filterValidity]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* HEADER SECTION */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)" }}>
              পাসপোর্ট খরচের তালিকা (Passport Cost & Rate List)
            </h1>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                fontSize: "0.76rem",
                fontWeight: 700,
              }}
            >
              খরচ ও রেট কন্ট্রোল
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
            প্রতিটি পাসপোর্ট ধরনের সরকারি ফি, ব্যাংক চার্জ, অফিস প্রসেসিং ও মোট ব্যয়ের ডায়নামিক তালিকা
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {costs.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="btn-secondary btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(245, 158, 11, 0.15)",
                color: "#fbbf24",
                borderColor: "rgba(245, 158, 11, 0.3)",
              }}
              title="আদর্শ সরকারি প্রিসেট লোড করুন"
            >
              <Sparkles size={14} className={seeding ? "spin" : ""} />
              <span>{seeding ? "লোড হচ্ছে..." : "স্ট্যান্ডার্ড সরকারি রেট লোড করুন"}</span>
            </button>
          )}

          <button
            onClick={fetchCosts}
            className="btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title="খরচের তালিকা প্রিন্ট করুন"
          >
            <Printer size={14} />
            <span>প্রিন্ট</span>
          </button>

          <button
            onClick={openAddModal}
            className="btn-primary btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.35)",
            }}
          >
            <Plus size={16} />
            <span>নতুন খরচ যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION TOAST */}
      {actionSuccess && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            color: "#34d399",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.88rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 5 SUMMARY METRICS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Total Passport Types */}
        <div
          className="glass-panel"
          style={{
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            borderLeft: "4px solid #6366f1",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(99, 102, 241, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8",
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              তালিকাভুক্ত ধরন
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-main)" }}>
              {costs.length} টি
            </div>
          </div>
        </div>

        {/* Minimum Cost */}
        <div
          className="glass-panel"
          style={{
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            borderLeft: "4px solid #10b981",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#34d399",
            }}
          >
            <Coins size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              সর্বনিম্ন খরচ
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#34d399" }}>
              ৳{stats.minCost ? stats.minCost.toLocaleString() : "০"}
            </div>
          </div>
        </div>

        {/* Average Cost */}
        <div
          className="glass-panel"
          style={{
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            borderLeft: "4px solid #38bdf8",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(56, 189, 248, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8",
            }}
          >
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              গড় খরচ
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#38bdf8" }}>
              ৳{stats.avgCost ? stats.avgCost.toLocaleString() : "০"}
            </div>
          </div>
        </div>

        {/* Maximum Cost */}
        <div
          className="glass-panel"
          style={{
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            borderLeft: "4px solid #f43f5e",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(244, 63, 94, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fb7185",
            }}
          >
            <ArrowUpRight size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              সর্বোচ্চ খরচ
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#fb7185" }}>
              ৳{stats.maxCost ? stats.maxCost.toLocaleString() : "০"}
            </div>
          </div>
        </div>

        {/* Total Est. Profit Margin */}
        <div
          className="glass-panel"
          style={{
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            borderLeft: "4px solid #f59e0b",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fbbf24",
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              মোট লাভ মার্জিন
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#fbbf24" }}>
              ৳{stats.totalEstimatedProfit ? stats.totalEstimatedProfit.toLocaleString() : "০"}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 300px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="পাসপোর্ট ধরন বা বিবরণ দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: "36px", height: "38px", fontSize: "0.85rem" }}
            />
          </div>

          {/* Validity Filter */}
          <div style={{ display: "flex", gap: "4px", background: "var(--bg-subtle-box)", padding: "3px", borderRadius: "8px" }}>
            <button
              onClick={() => setFilterValidity("all")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: filterValidity === "all" ? "var(--primary)" : "transparent",
                color: filterValidity === "all" ? "#fff" : "var(--text-secondary)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              সকল
            </button>
            <button
              onClick={() => setFilterValidity("5")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: filterValidity === "5" ? "var(--primary)" : "transparent",
                color: filterValidity === "5" ? "#fff" : "var(--text-secondary)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ৫ বছর
            </button>
            <button
              onClick={() => setFilterValidity("10")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: filterValidity === "10" ? "var(--primary)" : "transparent",
                color: filterValidity === "10" ? "#fff" : "var(--text-secondary)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ১০ বছর
            </button>
          </div>
        </div>

        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
          মোট প্রদর্শিত: <strong>{filteredCosts.length}</strong> টি ধরন
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="glass-panel" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr
                style={{
                  background: "var(--table-head-bg)",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <th style={{ padding: "14px 18px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  পাসপোর্ট ধরন (Passport Type)
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  সময়কাল
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  সরকারি ফি
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  ব্যাংক ও ভ্যাট
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  প্রসেসিং / অফিস
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  অন্যান্য
                </th>
                <th style={{ padding: "14px 18px", fontSize: "0.82rem", fontWeight: 700, color: "#34d399", background: "rgba(16, 185, 129, 0.05)" }}>
                  মোট খরচ (Total Cost)
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  ক্লায়েন্ট চার্জ
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "#fbbf24" }}>
                  আনুমানিক লাভ
                </th>
                <th style={{ padding: "14px 18px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>
                  অ্যাকশন
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
                    <RefreshCw size={24} className="spin" style={{ margin: "0 auto 10px", display: "block" }} />
                    তথ্য লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ marginBottom: "12px", fontSize: "1.1rem", fontWeight: 600 }}>
                      কোনো পাসপোর্ট খরচের তথ্য পাওয়া যায়নি
                    </div>
                    <p style={{ fontSize: "0.85rem", marginBottom: "16px" }}>
                      নতুন খরচ যোগ করতে উপরের বোতামে ক্লিক করুন অথবা স্ট্যান্ডার্ড রেট লোড করুন।
                    </p>
                    <button onClick={openAddModal} className="btn-primary btn-sm">
                      <Plus size={14} style={{ marginRight: "4px" }} />
                      নতুন খরচ যোগ করুন
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCosts.map((item) => (
                  <tr
                    key={item._id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Passport Type & Validity */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.9rem" }}>
                        {item.title}
                      </div>
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "#818cf8",
                            fontWeight: 600,
                          }}
                        >
                          {item.validityYears || 5} বছর মেয়াদী
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "rgba(255, 255, 255, 0.06)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {item.pageCount || 48} পাতা
                        </span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td style={{ padding: "14px 16px", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: item.duration?.includes("৩")
                            ? "rgba(244, 63, 94, 0.15)"
                            : item.duration?.includes("৭")
                            ? "rgba(245, 158, 11, 0.15)"
                            : "rgba(56, 189, 248, 0.15)",
                          color: item.duration?.includes("৩")
                            ? "#fb7185"
                            : item.duration?.includes("৭")
                            ? "#fbbf24"
                            : "#38bdf8",
                          fontWeight: 600,
                          fontSize: "0.74rem",
                        }}
                      >
                        <Clock size={12} />
                        {item.duration || "২১ কর্মদিবস"}
                      </span>
                    </td>

                    {/* Govt Fee */}
                    <td style={{ padding: "14px 16px", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>
                      ৳{item.govtFee ? item.govtFee.toLocaleString() : "০"}
                    </td>

                    {/* Bank Fee */}
                    <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      ৳{item.bankFee ? item.bankFee.toLocaleString() : "০"}
                    </td>

                    {/* Processing Fee */}
                    <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      ৳{item.processingFee ? item.processingFee.toLocaleString() : "০"}
                    </td>

                    {/* Other Fee */}
                    <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      ৳{item.otherFee ? item.otherFee.toLocaleString() : "০"}
                    </td>

                    {/* Total Cost Highlight */}
                    <td
                      style={{
                        padding: "14px 18px",
                        fontSize: "0.94rem",
                        fontWeight: 800,
                        color: "#34d399",
                        background: "rgba(16, 185, 129, 0.05)",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 9px",
                          borderRadius: "6px",
                          background: "rgba(16, 185, 129, 0.15)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        ৳{item.totalCost ? item.totalCost.toLocaleString() : "০"}
                      </span>
                    </td>

                    {/* Client Fee */}
                    <td style={{ padding: "14px 16px", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>
                      {item.clientFee ? `৳${item.clientFee.toLocaleString()}` : <span style={{ color: "var(--text-muted)" }}>-</span>}
                    </td>

                    {/* Est. Profit */}
                    <td style={{ padding: "14px 16px", fontSize: "0.88rem", fontWeight: 700, color: "#fbbf24" }}>
                      {item.estimatedProfit && item.estimatedProfit > 0 ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "2px",
                            color: "#34d399",
                          }}
                        >
                          +৳{item.estimatedProfit.toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>-</span>
                      )}
                    </td>

                    {/* Action Buttons: View, Edit, Delete */}
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        {/* View Button */}
                        <button
                          onClick={() => openViewModal(item)}
                          className="btn-secondary btn-sm"
                          style={{
                            padding: "6px 8px",
                            color: "#38bdf8",
                            background: "rgba(56, 189, 248, 0.1)",
                            borderColor: "rgba(56, 189, 248, 0.25)",
                          }}
                          title="বিস্তারিত দেখুন (View)"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(item)}
                          className="btn-secondary btn-sm"
                          style={{
                            padding: "6px 8px",
                            color: "#818cf8",
                            background: "rgba(99, 102, 241, 0.1)",
                            borderColor: "rgba(99, 102, 241, 0.25)",
                          }}
                          title="সম্পাদনা করুন (Edit)"
                        >
                          <Edit size={15} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => openDeleteModal(item)}
                          className="btn-secondary btn-sm"
                          style={{
                            padding: "6px 8px",
                            color: "#fb7185",
                            background: "rgba(244, 63, 94, 0.1)",
                            borderColor: "rgba(244, 63, 94, 0.25)",
                          }}
                          title="মুছে ফেলুন (Delete)"
                        >
                          <Trash2 size={15} />
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

      {/* ============================================================ */}
      {/* MODAL 1: ADD NEW PASSPORT COST                               */}
      {/* ============================================================ */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--modal-backdrop)",
            padding: "20px",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              border: "1px solid var(--border-highlight)",
              background: "var(--bg-modal)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "14px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)" }}>
                  নতুন পাসপোর্ট খরচ ও রেট যোগ করুন
                </h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  পাসপোর্ট ধরনের ব্যয়ের খাতগুলো পূরণ করুন, মোট খরচ স্বয়ংক্রিয়ভাবে হিসাব হবে
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: "rgba(244, 63, 94, 0.15)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  color: "#fb7185",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Passport Type Selection */}
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  পাসপোর্ট ধরন নির্বাচন করুন *
                </label>
                <select
                  value={isCustomType ? "__custom__" : formType}
                  onChange={(e) => handleTypeSelectChange(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", height: "42px" }}
                  required
                >
                  <optgroup label="প্রিসেট পাসপোর্ট ক্যাটাগরি">
                    {PASSPORT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__custom__">+ অন্যান্য / নতুন কাস্টম ধরন যুক্ত করুন</option>
                </select>
              </div>

              {/* Custom type fields if selected */}
              {isCustomType && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ধরন কোড (Unique Key) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5y_special_express"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      পাসপোর্ট টাইটেল / নাম *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ৫ বছর মেয়াদী স্পেশাল পাসপোর্ট"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Validity and Duration Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    সম্ভাব্য সময়সীমা
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="২১ কর্মদিবস"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    মেয়াদকাল
                  </label>
                  <select
                    value={validityYears}
                    onChange={(e) => setValidityYears(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value={5}>৫ বছর মেয়াদী</option>
                    <option value={10}>১০ বছর মেয়াদী</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    পৃষ্ঠা সংখ্যা
                  </label>
                  <select
                    value={pageCount}
                    onChange={(e) => setPageCount(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value={48}>৪৮ পাতা</option>
                    <option value={64}>৬৪ পাতা</option>
                  </select>
                </div>
              </div>

              {/* EXPENSE BREAKDOWN INPUTS */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  background: "var(--bg-subtle-box)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                  ব্যয়ের খাতসমূহ (টাকা)
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ১. সরকারি পাসপোর্ট ফি (Govt Fee) *
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ৪০২৫"
                      value={govtFee}
                      onChange={(e) => setGovtFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ২. ব্যাংক ও ভ্যাট ফি (Bank / VAT)
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ১৫০"
                      value={bankFee}
                      onChange={(e) => setBankFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ৩. অফিস ও প্রসেসিং খরচ (Processing Fee)
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ৫০০"
                      value={processingFee}
                      onChange={(e) => setProcessingFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ৪. অন্যান্য আনুষঙ্গিক খরচ (Other Fee)
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ৩০০"
                      value={otherFee}
                      onChange={(e) => setOtherFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* REALTIME LIVE TOTAL CALCULATION PREVIEW */}
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#34d399", fontWeight: 700 }}>
                      সর্বমোট খরচ (অটোমেটিক ক্যালকুলেশন)
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      সরকারি ফি + ব্যাংক + অফিস + অন্যান্য
                    </div>
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#34d399" }}>
                    ৳{calculatedTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* AGENCY CLIENT FEE & PROFIT PREVIEW */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    গ্রাহকের থেকে চার্জ / স্ট্যান্ডার্ড রেট (ঐচ্ছিক)
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: ৬০০০"
                    value={clientFee}
                    onChange={(e) => setClientFee(e.target.value === "" ? "" : Number(e.target.value))}
                    className="input-field"
                  />
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    এজেন্সির প্যাকেজ মূল্য
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    আনুমানিক এজেন্সির লাভ (Profit)
                  </label>
                  <div
                    style={{
                      height: "42px",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 12px",
                      borderRadius: "var(--radius-sm)",
                      background: calculatedProfit > 0 ? "rgba(245, 158, 11, 0.12)" : "var(--bg-subtle-box)",
                      border: "1px solid var(--border-subtle)",
                      fontWeight: 700,
                      color: calculatedProfit > 0 ? "#fbbf24" : "var(--text-muted)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {calculatedProfit > 0 ? `+৳${calculatedProfit.toLocaleString()}` : "৳০"}
                  </div>
                </div>
              </div>

              {/* Notes / Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  নোট বা খরচের শর্তাবলি (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="যেমন: জরুরি পুলিশ ক্লিয়ারেন্স ও চালানের কপি অন্তর্ভুক্ত"
                  className="input-field"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "8px",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "16px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Check size={16} />
                  <span>{submitting ? "সংরক্ষণ হচ্ছে..." : "খরচ সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDIT PASSPORT COST                                  */}
      {/* ============================================================ */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--modal-backdrop)",
            padding: "20px",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              border: "1px solid var(--border-highlight)",
              background: "var(--bg-modal)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "14px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)" }}>
                  পাসপোর্ট খরচের তথ্য সম্পাদনা করুন
                </h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  রেট বা ব্যয়ের খাত আপডেট করতে নতুন মান ইনপুট দিন
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: "rgba(244, 63, 94, 0.15)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  color: "#fb7185",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Title Input */}
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  পাসপোর্ট ধরন বা শিরোনাম *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              {/* Validity and Duration Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    সম্ভাব্য সময়সীমা
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    মেয়াদকাল
                  </label>
                  <select
                    value={validityYears}
                    onChange={(e) => setValidityYears(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value={5}>৫ বছর মেয়াদী</option>
                    <option value={10}>১০ বছর মেয়াদী</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    পৃষ্ঠা সংখ্যা
                  </label>
                  <select
                    value={pageCount}
                    onChange={(e) => setPageCount(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value={48}>৪৮ পাতা</option>
                    <option value={64}>৬৪ পাতা</option>
                  </select>
                </div>
              </div>

              {/* Expense Breakdown */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  background: "var(--bg-subtle-box)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                  ব্যয়ের খাতসমূহ (টাকা)
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ১. সরকারি পাসপোর্ট ফি (Govt Fee) *
                    </label>
                    <input
                      type="number"
                      value={govtFee}
                      onChange={(e) => setGovtFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ২. ব্যাংক ও ভ্যাট ফি (Bank / VAT)
                    </label>
                    <input
                      type="number"
                      value={bankFee}
                      onChange={(e) => setBankFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ৩. অফিস ও প্রসেসিং খরচ (Processing Fee)
                    </label>
                    <input
                      type="number"
                      value={processingFee}
                      onChange={(e) => setProcessingFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ৪. অন্যান্য আনুষঙ্গিক খরচ (Other Fee)
                    </label>
                    <input
                      type="number"
                      value={otherFee}
                      onChange={(e) => setOtherFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Recalculated Total Preview */}
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "0.82rem", color: "#34d399", fontWeight: 700 }}>
                    সর্বমোট খরচ (অটোমেটিক হিসাব)
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#34d399" }}>
                    ৳{calculatedTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Agency Client Fee */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    গ্রাহকের থেকে চার্জ / রেট
                  </label>
                  <input
                    type="number"
                    value={clientFee}
                    onChange={(e) => setClientFee(e.target.value === "" ? "" : Number(e.target.value))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    আনুমানিক লাভ (Profit)
                  </label>
                  <div
                    style={{
                      height: "42px",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 12px",
                      borderRadius: "var(--radius-sm)",
                      background: calculatedProfit > 0 ? "rgba(245, 158, 11, 0.12)" : "var(--bg-subtle-box)",
                      border: "1px solid var(--border-subtle)",
                      fontWeight: 700,
                      color: calculatedProfit > 0 ? "#fbbf24" : "var(--text-muted)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {calculatedProfit > 0 ? `+৳${calculatedProfit.toLocaleString()}` : "৳০"}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  নোট বা বিবরণ
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "8px",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "16px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Check size={16} />
                  <span>{submitting ? "আপডেট হচ্ছে..." : "আপডেট নিশ্চিত করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: VIEW PASSPORT COST BREAKDOWN DETAILS                */}
      {/* ============================================================ */}
      {showViewModal && selectedCost && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--modal-backdrop)",
            padding: "20px",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "600px",
              padding: "28px",
              border: "1px solid var(--border-highlight)",
              background: "var(--bg-modal)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "14px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    fontWeight: 700,
                  }}
                >
                  খরচের পূর্ণাঙ্গ বিবরণী
                </span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", marginTop: "6px" }}>
                  {selectedCost.title}
                </h2>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Total Cost Highlight Card */}
            <div
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <div style={{ fontSize: "0.82rem", color: "#34d399", fontWeight: 700 }}>
                  পাসপোর্ট তৈরির মোট খরচ (Total Cost)
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  সময়সীমা: {selectedCost.duration || "২১ কর্মদিবস"} | {selectedCost.validityYears || 5} বছর ({selectedCost.pageCount || 48} পাতা)
                </div>
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#34d399" }}>
                ৳{selectedCost.totalCost ? selectedCost.totalCost.toLocaleString() : "০"}
              </div>
            </div>

            {/* Detailed Expense Breakdown Table */}
            <div
              style={{
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--table-head-bg)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                ব্যয়ের খাতভিত্তিক ব্রেকডাউন
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>১. সরকারি পাসপোর্ট ফি</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    ৳{selectedCost.govtFee ? selectedCost.govtFee.toLocaleString() : "০"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>২. ব্যাংক ড্রাফট ও ভ্যাট চার্জ</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    ৳{selectedCost.bankFee ? selectedCost.bankFee.toLocaleString() : "০"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>৩. ফাইল প্রসেসিং ও অফিস খরচ</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    ৳{selectedCost.processingFee ? selectedCost.processingFee.toLocaleString() : "০"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>৪. অন্যান্য আনুষঙ্গিক খরচ</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    ৳{selectedCost.otherFee ? selectedCost.otherFee.toLocaleString() : "০"}
                  </span>
                </div>

                {selectedCost.clientFee ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--border-subtle)",
                        background: "rgba(255, 255, 255, 0.02)",
                        fontSize: "0.85rem",
                      }}
                    >
                      <span style={{ color: "var(--text-secondary)" }}>ক্লায়েন্ট চার্জ (Agency Selling Price)</span>
                      <span style={{ fontWeight: 700, color: "#38bdf8" }}>
                        ৳{selectedCost.clientFee.toLocaleString()}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "rgba(245, 158, 11, 0.08)",
                        fontSize: "0.85rem",
                      }}
                    >
                      <span style={{ color: "#fbbf24", fontWeight: 700 }}>এজেন্সির সম্ভাব্য নিট লাভ</span>
                      <span style={{ fontWeight: 800, color: "#fbbf24" }}>
                        +৳{(selectedCost.estimatedProfit || 0).toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Description / Notes */}
            {selectedCost.description && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "6px",
                  background: "var(--bg-subtle-box)",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  marginBottom: "20px",
                }}
              >
                <strong style={{ color: "var(--text-main)" }}>নোট: </strong>
                {selectedCost.description}
              </div>
            )}

            {/* Footer Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedCost);
                }}
                className="btn-secondary btn-sm"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Edit size={14} />
                <span>এডিট করুন</span>
              </button>

              <button onClick={() => setShowViewModal(false)} className="btn-primary btn-sm">
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: DELETE CONFIRMATION                                 */}
      {/* ============================================================ */}
      {showDeleteModal && itemToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--modal-backdrop)",
            padding: "20px",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "24px",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              background: "var(--bg-modal)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "rgba(244, 63, 94, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fb7185",
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                  খরচের তথ্য নিশ্চিতভাবে মুছবেন?
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  এই পদক্ষেপটি পরিবর্তনযোগ্য নয়
                </p>
              </div>
            </div>

            <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: "1.5" }}>
              আপনি কি <strong>&quot;{itemToDelete.title}&quot;</strong> এর নির্ধারিত খরচের হার মুছে ফেলতে চান?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary btn-sm"
                disabled={submitting}
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn-danger btn-sm"
                disabled={submitting}
                style={{
                  background: "rgba(244, 63, 94, 0.85)",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {submitting ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
