"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plane,
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
  Globe,
  Coins,
  ShieldCheck,
  ArrowUpRight,
  Briefcase,
} from "lucide-react";

export interface VisaCostItem {
  _id: string;
  country: string;
  visaType: string;
  title: string;
  embassyFee: number;
  vfsCharge: number;
  processingFee: number;
  otherFee: number;
  totalCost: number;
  clientFee?: number;
  estimatedProfit?: number;
  duration?: string;
  validity?: string;
  entryType?: string;
  description?: string;
  isActive: boolean;
  createdByName?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export const COUNTRY_PRESETS = [
  { value: "India", label: "ভারত (India)", flag: "🇮🇳" },
  { value: "Saudi Arabia", label: "সৌদি আরব (Saudi Arabia)", flag: "🇸🇦" },
  { value: "UAE", label: "সংযুক্ত আরব আমিরাত / দুবাই (UAE)", flag: "🇦🇪" },
  { value: "Malaysia", label: "মালয়েশিয়া (Malaysia)", flag: "🇲🇾" },
  { value: "Singapore", label: "সিঙ্গাপুর (Singapore)", flag: "🇸🇬" },
  { value: "Thailand", label: "থাইল্যান্ড (Thailand)", flag: "🇹🇭" },
  { value: "Canada", label: "কানাডা (Canada)", flag: "🇨🇦" },
  { value: "UK", label: "যুক্তরাজ্য (UK)", flag: "🇬🇧" },
  { value: "USA", label: "যুক্তরাষ্ট্র (USA)", flag: "🇺🇸" },
  { value: "Schengen", label: "ইউরোপ / শেঞ্জেন (Schengen)", flag: "🇪🇺" },
  { value: "Other", label: "অন্যান্য দেশ (Other Country)", flag: "🌐" },
];

export const VISA_TYPE_PRESETS = [
  { value: "tourist_visa", label: "ট্যুরিস্ট ভিসা (Tourist Visa)" },
  { value: "medical_visa", label: "মেডিকেল ভিসা (Medical Visa)" },
  { value: "medical_attendant", label: "মেডিকেল এটেন্ডেন্ট (Medical Attendant)" },
  { value: "student_visa", label: "স্টুডেন্ট ভিসা (Student Visa)" },
  { value: "work_permit", label: "ওয়ার্ক পারমিট (Work Permit)" },
  { value: "business_visa", label: "বিজনেস ভিসা (Business Visa)" },
  { value: "passport_new", label: "নতুন পাসপোর্ট (Passport New)" },
  { value: "passport_renewal", label: "পাসপোর্ট নবায়ন (Passport Renewal)" },
];

export default function VisaCostModule() {
  const [costs, setCosts] = useState<VisaCostItem[]>([]);
  const [stats, setStats] = useState({
    totalTypes: 0,
    minCost: 0,
    maxCost: 0,
    avgCost: 0,
    totalEstimatedProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [seeding, setSeeding] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Active / Selected Cost items
  const [selectedCost, setSelectedCost] = useState<VisaCostItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<VisaCostItem | null>(null);

  // Form State (Add / Edit)
  const [country, setCountry] = useState("India");
  const [customCountry, setCustomCountry] = useState("");
  const [visaType, setVisaType] = useState("tourist_visa");
  const [formTitle, setFormTitle] = useState("");
  const [embassyFee, setEmbassyFee] = useState<number | "">("");
  const [vfsCharge, setVfsCharge] = useState<number | "">("");
  const [processingFee, setProcessingFee] = useState<number | "">(1000);
  const [otherFee, setOtherFee] = useState<number | "">("");
  const [clientFee, setClientFee] = useState<number | "">("");
  const [duration, setDuration] = useState("৭-১০ কর্মদিবস");
  const [validity, setValidity] = useState("১ বছর");
  const [entryType, setEntryType] = useState("Multiple Entry");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch list of visa costs
  const fetchCosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/visa-costs");
      const data = await res.json();
      if (data.success) {
        setCosts(data.costs || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching visa costs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  // Quick seed standard defaults (India Service Types)
  const handleSeedDefaults = async () => {
    if (!confirm("আপনি কি ভারত ভিসা সার্ভিস খরচের স্ট্যান্ডার্ড রেট তালিকা লোড করতে চান?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/visa-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_defaults" }),
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
    const e = Number(embassyFee) || 0;
    const v = Number(vfsCharge) || 0;
    const p = Number(processingFee) || 0;
    const o = Number(otherFee) || 0;
    return e + v + p + o;
  }, [embassyFee, vfsCharge, processingFee, otherFee]);

  const calculatedProfit = useMemo(() => {
    const c = Number(clientFee) || 0;
    if (c <= 0) return 0;
    return c - calculatedTotal;
  }, [clientFee, calculatedTotal]);

  // Open Add Modal
  const openAddModal = () => {
    setEditId(null);
    setCountry("India");
    setCustomCountry("");
    setVisaType("tourist_visa");
    setFormTitle("ভারত ট্যুরিস্ট ভিসা (IVAC প্রসেসিং)");
    setEmbassyFee(0);
    setVfsCharge(840);
    setProcessingFee(700);
    setOtherFee(460);
    setClientFee(3000);
    setDuration("৭-১০ কর্মদিবস");
    setValidity("১ বছর");
    setEntryType("Multiple Entry");
    setDescription("আইভিএসি (IVAC) অনলাইন ফর্ম ও ফাইল প্রসেসিং সহ");
    setActionError(null);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (item: VisaCostItem) => {
    setEditId(item._id);
    const isPresetCountry = COUNTRY_PRESETS.some((c) => c.value === item.country);
    if (isPresetCountry) {
      setCountry(item.country);
      setCustomCountry("");
    } else {
      setCountry("Other");
      setCustomCountry(item.country);
    }
    setVisaType(item.visaType);
    setFormTitle(item.title);
    setEmbassyFee(item.embassyFee);
    setVfsCharge(item.vfsCharge);
    setProcessingFee(item.processingFee);
    setOtherFee(item.otherFee);
    setClientFee(item.clientFee || "");
    setDuration(item.duration || "৭-১০ কর্মদিবস");
    setValidity(item.validity || "১ বছর");
    setEntryType(item.entryType || "Multiple Entry");
    setDescription(item.description || "");
    setActionError(null);
    setShowEditModal(true);
  };

  // Open View Modal
  const openViewModal = (item: VisaCostItem) => {
    setSelectedCost(item);
    setShowViewModal(true);
  };

  // Open Delete Modal
  const openDeleteModal = (item: VisaCostItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Submit Add
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const finalCountry = country === "Other" ? customCountry.trim() : country;
    if (!finalCountry) {
      setActionError("গন্তব্য দেশ নির্বাচন বা নাম লিখুন।");
      return;
    }
    if (!formTitle.trim()) {
      setActionError("ভিসা টাইটেল বা শিরোনাম আবশ্যক।");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/visa-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: finalCountry,
          visaType,
          title: formTitle.trim(),
          embassyFee: Number(embassyFee) || 0,
          vfsCharge: Number(vfsCharge) || 0,
          processingFee: Number(processingFee) || 0,
          otherFee: Number(otherFee) || 0,
          clientFee: Number(clientFee) || 0,
          duration: duration.trim(),
          validity: validity.trim(),
          entryType: entryType.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "সংরক্ষণ করতে ব্যর্থ হয়েছে");
      }

      setShowAddModal(false);
      setActionSuccess("নতুন ভিসা খরচের তথ্য সফলভাবে যুক্ত হয়েছে।");
      setTimeout(() => setActionSuccess(null), 4000);
      fetchCosts();
    } catch (err: any) {
      setActionError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setActionError(null);

    const finalCountry = country === "Other" ? customCountry.trim() : country;
    if (!finalCountry || !formTitle.trim()) {
      setActionError("দেশ এবং শিরোনাম পূরণ করুন।");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/visa-costs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          country: finalCountry,
          visaType,
          title: formTitle.trim(),
          embassyFee: Number(embassyFee) || 0,
          vfsCharge: Number(vfsCharge) || 0,
          processingFee: Number(processingFee) || 0,
          otherFee: Number(otherFee) || 0,
          clientFee: Number(clientFee) || 0,
          duration: duration.trim(),
          validity: validity.trim(),
          entryType: entryType.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "আপডেট করতে ব্যর্থ হয়েছে");
      }

      setShowEditModal(false);
      setActionSuccess("ভিসা খরচের তথ্য সফলভাবে আপডেট হয়েছে।");
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
      const res = await fetch(`/api/visa-costs?id=${itemToDelete._id}`, {
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
        c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.visaType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCountry = filterCountry === "all" || c.country === filterCountry;

      return matchSearch && matchCountry;
    });
  }, [costs, searchQuery, filterCountry]);

  // Find country flag helper
  const getCountryFlag = (cName: string) => {
    const found = COUNTRY_PRESETS.find((p) => p.value.toLowerCase() === cName.toLowerCase());
    return found ? found.flag : "🌐";
  };

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
              ভিসা খরচের তালিকা (Visa Cost & Rate List)
            </h1>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#818cf8",
                fontSize: "0.76rem",
                fontWeight: 700,
              }}
            >
              ভিসা রেট ও খরচ
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
            দেশভিত্তিক এম্বাসি ফি, VFS/IVAC চার্জ, ফাইল প্রসেসিং ও প্যাকেজ রেটের ডায়নামিক তালিকা
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
              title="আদর্শ ভিসা রেট প্রিসেট লোড করুন"
            >
              <Sparkles size={14} className={seeding ? "spin" : ""} />
              <span>{seeding ? "লোড হচ্ছে..." : "স্ট্যান্ডার্ড ভিসা রেট লোড করুন"}</span>
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
            title="ভিসা খরচের তালিকা প্রিন্ট করুন"
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
            <span>নতুন ভিসা খরচ যোগ করুন</span>
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
        {/* Total Configured Types */}
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
            <Plane size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              তালিকাভুক্ত দেশ/ধরন
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
              সর্বনিম্ন ভিসা খরচ
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#34d399" }}>
              ৳{stats.minCost ? stats.minCost.toLocaleString("en-IN") : "০"}
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
              গড় ভিসা খরচ
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#38bdf8" }}>
              ৳{stats.avgCost ? stats.avgCost.toLocaleString("en-IN") : "০"}
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
              সর্বোচ্চ ভিসা খরচ
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#fb7185" }}>
              ৳{stats.maxCost ? stats.maxCost.toLocaleString("en-IN") : "০"}
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
              ৳{stats.totalEstimatedProfit ? stats.totalEstimatedProfit.toLocaleString("en-IN") : "০"}
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 300px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
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
              placeholder="দেশ, ভিসা ধরন বা বিবরণ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: "36px", height: "38px", fontSize: "0.85rem" }}
            />
          </div>

          {/* Country Filter */}
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="input-field"
            style={{ height: "38px", fontSize: "0.82rem", width: "auto", minWidth: "160px" }}
          >
            <option value="all">সকল দেশ (All Countries)</option>
            {COUNTRY_PRESETS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.flag} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
          মোট প্রদর্শিত: <strong>{filteredCosts.length}</strong> টি ভিসা রেট
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
                  দেশ ও ভিসা বিবরণ (Destination & Visa)
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  সময়সীমা ও মেয়াদ
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  এম্বাসি ফি
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  VFS / এপয়েন্টমেন্ট
                </th>
                <th style={{ padding: "14px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                  ফাইল প্রসেসিং
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
                  সম্ভাব্য লাভ
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
                    ভিসা খরচের তথ্য লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ marginBottom: "12px", fontSize: "1.1rem", fontWeight: 600 }}>
                      কোনো ভিসা খরচের তথ্য পাওয়া যায়নি
                    </div>
                    <p style={{ fontSize: "0.85rem", marginBottom: "16px" }}>
                      নতুন ভিসা খরচ যোগ করতে উপরের বোতামে ক্লিক করুন অথবা স্ট্যান্ডার্ড রেট লোড করুন।
                    </p>
                    <button onClick={openAddModal} className="btn-primary btn-sm">
                      <Plus size={14} style={{ marginRight: "4px" }} />
                      নতুন ভিসা খরচ যোগ করুন
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
                    {/* Country & Title */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "1.1rem" }}>{getCountryFlag(item.country)}</span>
                        <span style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.92rem" }}>
                          {item.country}
                        </span>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "#818cf8",
                            fontWeight: 600,
                          }}
                        >
                          {item.entryType || "Multiple Entry"}
                        </span>
                      </div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.84rem", marginTop: "4px", fontWeight: 600 }}>
                        {item.title}
                      </div>
                    </td>

                    {/* Duration & Validity */}
                    <td style={{ padding: "14px 16px", fontSize: "0.84rem" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#38bdf8", fontWeight: 600 }}>
                        <Clock size={12} />
                        {item.duration || "৭-১০ কর্মদিবস"}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        মেয়াদ: {item.validity || "১ বছর"}
                      </div>
                    </td>

                    {/* Embassy Fee */}
                    <td style={{ padding: "14px 16px", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>
                      ৳{item.embassyFee ? item.embassyFee.toLocaleString("en-IN") : "০"}
                    </td>

                    {/* VFS / Appointment */}
                    <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      ৳{item.vfsCharge ? item.vfsCharge.toLocaleString("en-IN") : "০"}
                    </td>

                    {/* Processing Fee */}
                    <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      ৳{item.processingFee ? item.processingFee.toLocaleString("en-IN") : "০"}
                    </td>

                    {/* Other Fee */}
                    <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      ৳{item.otherFee ? item.otherFee.toLocaleString("en-IN") : "০"}
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
                        ৳{item.totalCost ? item.totalCost.toLocaleString("en-IN") : "০"}
                      </span>
                    </td>

                    {/* Client Fee */}
                    <td style={{ padding: "14px 16px", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>
                      {item.clientFee ? `৳${item.clientFee.toLocaleString("en-IN")}` : <span style={{ color: "var(--text-muted)" }}>-</span>}
                    </td>

                    {/* Est. Profit */}
                    <td style={{ padding: "14px 16px", fontSize: "0.88rem", fontWeight: 700, color: "#fbbf24" }}>
                      {item.estimatedProfit && item.estimatedProfit > 0 ? (
                        <span style={{ color: "#34d399" }}>
                          +৳{item.estimatedProfit.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>-</span>
                      )}
                    </td>

                    {/* Actions: View, Edit, Delete */}
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <button
                          onClick={() => openViewModal(item)}
                          className="btn-secondary btn-sm"
                          style={{
                            padding: "6px 8px",
                            color: "#38bdf8",
                            background: "rgba(56, 189, 248, 0.1)",
                            borderColor: "rgba(56, 189, 248, 0.25)",
                          }}
                          title="বিস্তারিত দেখুন"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => openEditModal(item)}
                          className="btn-secondary btn-sm"
                          style={{
                            padding: "6px 8px",
                            color: "#818cf8",
                            background: "rgba(99, 102, 241, 0.1)",
                            borderColor: "rgba(99, 102, 241, 0.25)",
                          }}
                          title="সম্পাদনা করুন"
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          onClick={() => openDeleteModal(item)}
                          className="btn-secondary btn-sm"
                          style={{
                            padding: "6px 8px",
                            color: "#fb7185",
                            background: "rgba(244, 63, 94, 0.1)",
                            borderColor: "rgba(244, 63, 94, 0.25)",
                          }}
                          title="মুছে ফেলুন"
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
      {/* MODAL 1: ADD NEW VISA COST                                   */}
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
            {/* Header */}
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
                  নতুন ভিসা খরচ ও রেট যোগ করুন
                </h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  দেশ ও ভিসার ব্যয়ের খাতসমূহ ইনপুট দিন, মোট খরচ স্বয়ংক্রিয়ভাবে হিসাব হবে
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
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
              {/* Country & Visa Type Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    গন্তব্য দেশ (Country) *
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="input-field"
                    required
                  >
                    {COUNTRY_PRESETS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.flag} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    ভিসার ধরন (Visa Type) *
                  </label>
                  <select
                    value={visaType}
                    onChange={(e) => setVisaType(e.target.value)}
                    className="input-field"
                    required
                  >
                    {VISA_TYPE_PRESETS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {country === "Other" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    দেশের নাম লিখুন *
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: Turkey / Australia"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  ভিসা প্যাকেজ / টাইটেল *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ভারত ট্যুরিস্ট ভিসা (IVAC প্রসেসিং)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              {/* Validity, Duration, Entry Type */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    সম্ভাব্য সময়সীমা
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="৭-১০ কর্মদিবস"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    ভিসার মেয়াদ
                  </label>
                  <input
                    type="text"
                    value={validity}
                    onChange={(e) => setValidity(e.target.value)}
                    placeholder="১ বছর / ৬ মাস"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    এন্ট্রি টাইপ
                  </label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value)}
                    className="input-field"
                  >
                    <option value="Single Entry">Single Entry (একবার প্রবেশ)</option>
                    <option value="Multiple Entry">Multiple Entry (একাধিক প্রবেশ)</option>
                    <option value="Double Entry">Double Entry (দুইবার প্রবেশ)</option>
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
                      ১. সরকারি / এম্বাসি ফি (Embassy Fee)
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ৮৫০০"
                      value={embassyFee}
                      onChange={(e) => setEmbassyFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ২. VFS / IVAC / বায়োমেট্রিক চার্জ
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ৮৪০"
                      value={vfsCharge}
                      onChange={(e) => setVfsCharge(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ৩. অফিস ও ফাইল প্রসেসিং খরচ
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ১২০০"
                      value={processingFee}
                      onChange={(e) => setProcessingFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ৪. অন্যান্য / ইনস্যুরেন্স / নোটারি
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ৫০০"
                      value={otherFee}
                      onChange={(e) => setOtherFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Realtime Live Total */}
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
                      সর্বমোট ভিসা খরচ (অটো হিসাব)
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      এম্বাসি + VFS + প্রসেসিং + অন্যান্য
                    </div>
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#34d399" }}>
                    ৳{calculatedTotal.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Client Charge & Profit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    গ্রাহকের থেকে চার্জ / প্যাকেজ রেট (ঐচ্ছিক)
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: ৩৫০০০"
                    value={clientFee}
                    onChange={(e) => setClientFee(e.target.value === "" ? "" : Number(e.target.value))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    আনুমানিক এজেন্সি লাভ (Profit)
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
                    {calculatedProfit > 0 ? `+৳${calculatedProfit.toLocaleString("en-IN")}` : "৳০"}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  নোট বা খরচের শর্তাবলি (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="যেমন: মেডিকেল ইনস্যুরেন্স ও আইভিএসি স্লট বুকিং অন্তর্ভুক্ত"
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
                  <span>{submitting ? "সংরক্ষণ হচ্ছে..." : "ভিসা খরচ সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDIT VISA COST                                      */}
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
            {/* Header */}
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
                  ভিসা খরচের তথ্য সম্পাদনা করুন
                </h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  দেশ, এম্বাসি ফি বা প্রসেসিং চার্জ আপডেট করুন
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
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
              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  ভিসা প্যাকেজ / টাইটেল *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              {/* Duration & Validity */}
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
                    ভিসার মেয়াদ
                  </label>
                  <input
                    type="text"
                    value={validity}
                    onChange={(e) => setValidity(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    এন্ট্রি টাইপ
                  </label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value)}
                    className="input-field"
                  >
                    <option value="Single Entry">Single Entry (একবার)</option>
                    <option value="Multiple Entry">Multiple Entry (একাধিক)</option>
                    <option value="Double Entry">Double Entry (দুইবার)</option>
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
                      ১. সরকারি / এম্বাসি ফি
                    </label>
                    <input
                      type="number"
                      value={embassyFee}
                      onChange={(e) => setEmbassyFee(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ২. VFS / IVAC / বায়োমেট্রিক চার্জ
                    </label>
                    <input
                      type="number"
                      value={vfsCharge}
                      onChange={(e) => setVfsCharge(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      ৩. অফিস ও ফাইল প্রসেসিং খরচ
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
                      ৪. অন্যান্য / ইনস্যুরেন্স / নোটারি
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
                    সর্বমোট ভিসা খরচ (অটো হিসাব)
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#34d399" }}>
                    ৳{calculatedTotal.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Client Fee & Profit */}
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
                    {calculatedProfit > 0 ? `+৳${calculatedProfit.toLocaleString("en-IN")}` : "৳০"}
                  </div>
                </div>
              </div>

              {/* Description */}
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
      {/* MODAL 3: VIEW VISA COST DETAILS                              */}
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
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1.2rem" }}>{getCountryFlag(selectedCost.country)}</span>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "#818cf8",
                      fontWeight: 700,
                    }}
                  >
                    {selectedCost.country}
                  </span>
                </div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", marginTop: "6px" }}>
                  {selectedCost.title}
                </h2>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
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
                  ভিসা তৈরির মোট খরচ (Total Cost)
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  সময়সীমা: {selectedCost.duration || "৭-১০ কর্মদিবস"} | মেয়াদ: {selectedCost.validity || "১ বছর"}
                </div>
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#34d399" }}>
                ৳{selectedCost.totalCost ? selectedCost.totalCost.toLocaleString("en-IN") : "০"}
              </div>
            </div>

            {/* Detailed Expense Breakdown */}
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
                  <span style={{ color: "var(--text-secondary)" }}>১. সরকারি / এম্বাসি ফি</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    ৳{selectedCost.embassyFee ? selectedCost.embassyFee.toLocaleString("en-IN") : "০"}
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
                  <span style={{ color: "var(--text-secondary)" }}>২. VFS / IVAC / বায়োমেট্রিক চার্জ</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    ৳{selectedCost.vfsCharge ? selectedCost.vfsCharge.toLocaleString("en-IN") : "০"}
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
                  <span style={{ color: "var(--text-secondary)" }}>৩. ফাইল প্রসেসিং ও অফিস সার্ভিস চার্জ</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    ৳{selectedCost.processingFee ? selectedCost.processingFee.toLocaleString("en-IN") : "০"}
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
                  <span style={{ color: "var(--text-secondary)" }}>৪. অন্যান্য / ইনস্যুরেন্স / নোটারি</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    ৳{selectedCost.otherFee ? selectedCost.otherFee.toLocaleString("en-IN") : "০"}
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
                      <span style={{ color: "var(--text-secondary)" }}>ক্লায়েন্ট প্যাকেজ রেট</span>
                      <span style={{ fontWeight: 700, color: "#38bdf8" }}>
                        ৳{selectedCost.clientFee.toLocaleString("en-IN")}
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
                        +৳{(selectedCost.estimatedProfit || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

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
                  ভিসা খরচের তথ্য নিশ্চিতভাবে মুছবেন?
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  এই পদক্ষেপটি পরিবর্তনযোগ্য নয়
                </p>
              </div>
            </div>

            <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: "1.5" }}>
              আপনি কি <strong>&quot;{itemToDelete.title}&quot;</strong> ({itemToDelete.country}) এর নির্ধারিত খরচের হার মুছে ফেলতে চান?
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
