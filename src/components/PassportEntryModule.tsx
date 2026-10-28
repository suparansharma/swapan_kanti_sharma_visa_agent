"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Edit,
  User,
  ShieldCheck,
  Check,
  FileCheck,
} from "lucide-react";

export interface PassportEntryItem {
  _id: string;
  entryNumber: string;
  name: string;
  mobile: string;
  email?: string;
  nid: string;
  birthDate: string;
  passportType: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  onlineTrackId?: string;
  status: string;
  deliveryDate?: string;
  notes?: string;
  createdBy?: { _id: string; name: string; email?: string } | string;
  createdByName?: string;
  updatedBy?: { _id: string; name: string; email?: string } | string;
  updatedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export const PASSPORT_TYPE_OPTIONS = [
  { value: "5y_regular_21d", label: "১. ৫ বছর মেয়াদী সাধারণ পাসপোর্ট (২১ কর্ম দিবস)" },
  { value: "10y_regular_21d", label: "২. ১০ বছর মেয়াদী সাধারণ পাসপোর্ট (২১ কর্ম দিবস)" },
  { value: "5y_urgent_7d", label: "৩. ৫ বছর মেয়াদী জরুরি পাসপোর্ট (৭ কর্ম দিবস)" },
  { value: "10y_urgent_7d", label: "৪. ১০ বছর মেয়াদী জরুরি পাসপোর্ট (৭ কর্ম দিবস)" },
  { value: "5y_very_urgent_3d", label: "৫. ৫ বছর মেয়াদী অতীব জরুরি পাসপোর্ট (৩ কর্ম দিবস)" },
  { value: "10y_very_urgent_3d", label: "৬. ১০ বছর মেয়াদী অতীব জরুরি পাসপোর্ট (৩ কর্ম দিবস)" },
  { value: "5y_noc_3d", label: "৭. ৫ বছর মেয়াদী অতীব জরুরি অনাপত্তি সনদ (NOC) এর ভিত্তিতে (৩ কর্ম দিবস)" },
  { value: "10y_noc_3d", label: "৮. ১০ বছর মেয়াদী অতীব জরুরি অনাপত্তি সনদ (NOC) এর ভিত্তিতে (৩ কর্ম দিবস)" },
  { value: "5y_go_medical_hajj_3d", label: "৯. ৫ বছর মেয়াদী অতীব জরুরি সরকারি আদেশ (GO) এর ভিত্তিতে চিকিৎসা, হজ্জ পালন,তীর্থস্থান ভ্রমনের ক্ষেত্রে (৩ কর্ম দিবস)" },
  { value: "10y_go_medical_hajj_3d", label: "১০. ১০ বছর মেয়াদী অতীব জরুরি সরকারি আদেশ (GO) এর ভিত্তিতে চিকিৎসা, হজ্জ পালন,তীর্থস্থান ভ্রমনের ক্ষেত্রে (৩ কর্ম দিবস)" },
  { value: "5y_go_govt_work_3d", label: "১১. ৫ বছর মেয়াদী অতীব জরুরি সরকারি আদেশ (GO) এর ভিত্তিতে সরকারী কাজের ক্ষেত্রে (৩ কর্ম দিবস)" },
  { value: "10y_go_govt_work_3d", label: "১২. ১০ বছর মেয়াদী অতীব জরুরি সরকারি আদেশ (GO) এর ভিত্তিতে সরকারী কাজের ক্ষেত্রে (৩ কর্ম দিবস)" },
];

export default function PassportEntryModule() {
  const [entries, setEntries] = useState<PassportEntryItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    totalContractAmount: 0,
    totalCollectedAmount: 0,
    totalDueAmount: 0,
    readyCount: 0,
    deliveredCount: 0,
    processingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal: Add New Passport Entry Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [nid, setNid] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [passportType, setPassportType] = useState(PASSPORT_TYPE_OPTIONS[0].value);
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [onlineTrackId, setOnlineTrackId] = useState("");
  const [status, setStatus] = useState("submitted");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Inline Online Track ID Edit
  const [editingTrackIdRow, setEditingTrackIdRow] = useState<string | null>(null);
  const [tempTrackId, setTempTrackId] = useState<string>("");
  const [savingTrackId, setSavingTrackId] = useState<string | null>(null);

  // Modal: View Details
  const [selectedEntry, setSelectedEntry] = useState<PassportEntryItem | null>(null);
  const [editPaymentModal, setEditPaymentModal] = useState(false);
  const [newPaidInput, setNewPaidInput] = useState<number | "">("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Modal: Edit Full Entry
  const [editingEntry, setEditingEntry] = useState<PassportEntryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNid, setEditNid] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editPassportType, setEditPassportType] = useState(PASSPORT_TYPE_OPTIONS[0].value);
  const [editTotalAmount, setEditTotalAmount] = useState<number | "">("");
  const [editPaidAmount, setEditPaidAmount] = useState<number | "">("");
  const [editOnlineTrackId, setEditOnlineTrackId] = useState("");
  const [editStatus, setEditStatus] = useState("submitted");
  const [editNotes, setEditNotes] = useState("");
  const [updatingEntry, setUpdatingEntry] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const numEditTotal = Number(editTotalAmount) || 0;
  const numEditPaid = Number(editPaidAmount) || 0;
  const liveEditDue = Math.max(0, numEditTotal - numEditPaid);

  // Live calculation of Due Amount in Add Form
  const numTotal = Number(totalAmount) || 0;
  const numPaid = Number(paidAmount) || 0;
  const liveDue = Math.max(0, numTotal - numPaid);

  // Fetch entries
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (filterStatus !== "all") params.append("status", filterStatus);

      const res = await fetch(`/api/passport-entries?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching passport entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntries();
  };

  // Submit Add Entry Form
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("আবেদনকারীর পুরো নাম লিখুন।");
      return;
    }
    if (!mobile.trim()) {
      setFormError("মোবাইল নম্বর লিখুন।");
      return;
    }
    if (!nid.trim()) {
      setFormError("জাতীয় পরিচয়পত্র (NID) নম্বর দিন।");
      return;
    }
    if (!birthDate.trim()) {
      setFormError("জন্মতারিখ নির্বাচন করুন।");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/passport-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          nid: nid.trim(),
          birthDate: birthDate.trim(),
          passportType,
          totalAmount: numTotal,
          paidAmount: numPaid,
          onlineTrackId: onlineTrackId.trim(),
          status,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        // Reset form
        setName("");
        setMobile("");
        setEmail("");
        setNid("");
        setBirthDate("");
        setTotalAmount("");
        setPaidAmount("");
        setOnlineTrackId("");
        setPassportType(PASSPORT_TYPE_OPTIONS[0].value);
        setNotes("");
        fetchEntries();
      } else {
        setFormError(data.error || "পাসপোর্ট এন্ট্রি সংরক্ষণ করা সম্ভব হয়নি।");
      }
    } catch (err) {
      setFormError("সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Status directly from table
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/passport-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchEntries();
        if (selectedEntry && selectedEntry._id === id) {
          setSelectedEntry({ ...selectedEntry, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // Update Paid Amount (Payment collection)
  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    try {
      setUpdatingPayment(true);
      const res = await fetch("/api/passport-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEntry._id,
          paidAmount: Number(newPaidInput) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditPaymentModal(false);
        setSelectedEntry(data.entry);
        fetchEntries();
      }
    } catch (err) {
      console.error("Payment update error:", err);
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Inline quick save of Online Track ID
  const handleQuickTrackIdSave = async (id: string, trackIdValue: string) => {
    try {
      setSavingTrackId(id);
      const res = await fetch("/api/passport-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          onlineTrackId: trackIdValue.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingTrackIdRow(null);
        setEntries((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, onlineTrackId: trackIdValue.trim() } : item
          )
        );
        if (selectedEntry && selectedEntry._id === id) {
          setSelectedEntry({ ...selectedEntry, onlineTrackId: trackIdValue.trim() });
        }
      } else {
        alert(data.error || "Online Track ID সংরক্ষণ করা সম্ভব হয়নি।");
      }
    } catch (err) {
      console.error("Save onlineTrackId error:", err);
      alert("সার্ভার সমস্যা, আবার চেষ্টা করুন।");
    } finally {
      setSavingTrackId(null);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PassportEntryItem) => {
    setEditingEntry(item);
    setEditName(item.name);
    setEditMobile(item.mobile);
    setEditEmail(item.email || "");
    setEditNid(item.nid);
    setEditBirthDate(item.birthDate);
    setEditPassportType(item.passportType || PASSPORT_TYPE_OPTIONS[0].value);
    setEditTotalAmount(item.totalAmount);
    setEditPaidAmount(item.paidAmount);
    setEditOnlineTrackId(item.onlineTrackId || "");
    setEditStatus(item.status);
    setEditNotes(item.notes || "");
    setEditFormError(null);
  };

  // Submit Update Entry
  const handleUpdateEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    if (!editName.trim() || !editMobile.trim() || !editNid.trim() || !editBirthDate.trim()) {
      setEditFormError("দয়া করে নাম, মোবাইল, NID এবং জন্মতারিখ পূরণ করুন।");
      return;
    }

    try {
      setUpdatingEntry(true);
      const res = await fetch("/api/passport-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEntry._id,
          name: editName.trim(),
          mobile: editMobile.trim(),
          email: editEmail.trim(),
          nid: editNid.trim(),
          birthDate: editBirthDate.trim(),
          passportType: editPassportType,
          totalAmount: numEditTotal,
          paidAmount: numEditPaid,
          onlineTrackId: editOnlineTrackId.trim(),
          status: editStatus,
          notes: editNotes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingEntry(null);
        fetchEntries();
      } else {
        setEditFormError(data.error || "আপডেট ব্যর্থ হয়েছে");
      }
    } catch (err) {
      setEditFormError("সার্ভার সমস্যা, আবার চেষ্টা করুন।");
    } finally {
      setUpdatingEntry(false);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই পাসপোর্ট এন্ট্রিটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/passport-entries?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedEntry?._id === id) setSelectedEntry(null);
        if (editingEntry?._id === id) setEditingEntry(null);
        fetchEntries();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const getPassportTypeLabel = (t: string) => {
    const found = PASSPORT_TYPE_OPTIONS.find((item) => item.value === t);
    if (found) return found.label;

    switch (t) {
      case "e_passport_10y_48p":
        return "১০ বছর (৪৮ পাতা)";
      case "e_passport_5y_48p":
        return "৫ বছর (৪৮ পাতা)";
      case "e_passport_10y_64p":
        return "১০ বছর (৬৪ পাতা)";
      case "urgent":
        return "জরুরি / এক্সপ্রেস";
      case "regular":
        return "সাধারণ রি-ইস্যু";
      default:
        return t;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "submitted":
        return { label: "আবেদন জমা", bg: "rgba(99, 102, 241, 0.15)", color: "#818cf8" };
      case "biometric_pending":
        return { label: "বায়োমেট্রিক বাকি", bg: "rgba(236, 72, 153, 0.15)", color: "#f472b6" };
      case "police_verification":
        return { label: "পুলিশ ভেরিফিকেশন", bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" };
      case "ready_for_pickup":
        return { label: "পাসপোর্ট রেডি", bg: "rgba(16, 185, 129, 0.2)", color: "#34d399" };
      case "delivered":
        return { label: "ডেলিভারি সম্পন্ন", bg: "rgba(59, 130, 246, 0.2)", color: "#60a5fa" };
      default:
        return { label: s, bg: "rgba(255, 255, 255, 0.1)", color: "#ffffff" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header with Title and Add Button */}
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
              পাসপোর্ট এন্ট্রি (Passport Entry)
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
              Passport Module
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
            নতুন পাসপোর্ট আবেদনকারী তথ্য, এনআইডি ও লেনদেন হিসাব রেজিস্টার
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => fetchEntries()}
            className="btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>রিফ্রেশ</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              fontWeight: 700,
              boxShadow: "0 4px 18px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Plus size={18} />
            <span>Add Passport Entry</span>
          </button>
        </div>
      </div>

      {/* FINANCIAL & OPERATIONS COUNTERS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Total Contract Amount */}
        <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #6366f1" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
            মোট চুক্তি টাকা (Total Amount)
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#818cf8" }}>
            ৳ {stats.totalContractAmount.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
            ক্লায়েন্টদের সাথে মোট চুক্তি
          </div>
        </div>

        {/* Collected Amount */}
        <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
            আদায়কৃত টাকা (Collected)
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#34d399" }}>
            ৳ {stats.totalCollectedAmount.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "#34d399", marginTop: "4px" }}>
            জমা পাওয়া টাকা
          </div>
        </div>

        {/* Total Due Amount */}
        <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
            মোট বকেয়া টাকা (Due Amount)
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#fbbf24" }}>
            ৳ {stats.totalDueAmount.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
            পাওনা টাকা
          </div>
        </div>

        {/* Total Passport Entries */}
        <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #38bdf8" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
            মোট পাসপোর্ট এন্ট্রি
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--text-main)" }}>
            {stats.total} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>টি</span>
          </div>
          <div style={{ fontSize: "0.74rem", color: "#38bdf8", marginTop: "4px" }}>
            রেডি: {stats.readyCount} &bull; ডেলিভার্ড: {stats.deliveredCount}
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", flex: 1 }}>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="আবেদনকারীর নাম, মোবাইল নম্বর, NID, বা এন্ট্রি নং দিয়ে খুঁজুন..."
              className="input-field"
              style={{ paddingLeft: "36px", height: "42px", fontSize: "0.88rem" }}
            />
          </div>
          <button type="submit" className="btn-secondary btn-sm" style={{ height: "42px", padding: "0 18px" }}>
            খুঁজুন
          </button>
        </form>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>স্ট্যাটাস:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
            style={{ height: "42px", fontSize: "0.85rem", width: "auto", padding: "0 14px" }}
          >
            <option value="all">সকল এন্ট্রি</option>
            <option value="submitted">আবেদন জমা</option>
            <option value="biometric_pending">বায়োমেট্রিক বাকি</option>
            <option value="police_verification">পুলিশ ভেরিফিকেশন</option>
            <option value="ready_for_pickup">পাসপোর্ট রেডি</option>
            <option value="delivered">ডেলিভারি সম্পন্ন</option>
          </select>
        </div>
      </div>

      {/* PASSPORT ENTRIES DATA TABLE */}
      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>এন্ট্রি নং</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>আবেদনকারীর নাম</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>মোবাইল ও ইমেইল</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>NID ও জন্মতারিখ</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>পাসপোর্ট ধরন</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>Online Track ID</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>বকেয়া টাকা</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>স্ট্যাটাস</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>তৈরি করেছেন</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>সর্বশেষ আপডেট</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>একশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    পাসপোর্ট এন্ট্রি লোড হচ্ছে...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: "50px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ marginBottom: "12px", fontSize: "1.1rem" }}>কোনো পাসপোর্ট এন্ট্রি পাওয়া যায়নি।</div>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                      + প্রথম এন্ট্রি যুক্ত করুন
                    </button>
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr
                    key={item._id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Entry Number */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 800, color: "#38bdf8" }}>{item.entryNumber}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {new Date(item.createdAt).toLocaleDateString("bn-BD")}
                      </div>
                    </td>

                    {/* Name */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.92rem" }}>
                        {item.name}
                      </div>
                    </td>

                    {/* Mobile & Email */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{item.mobile}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.email || "—"}</div>
                    </td>

                    {/* NID & Birthdate */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#a5b4fc" }}>
                        {item.nid}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        জন্ম: {item.birthDate}
                      </div>
                    </td>

                    {/* Passport Type */}
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.78rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {getPassportTypeLabel(item.passportType)}
                      </span>
                    </td>

                    {/* Online Track ID (Inline Add / Edit) */}
                    <td style={{ padding: "12px 16px", minWidth: "160px" }}>
                      {editingTrackIdRow === item._id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="text"
                            value={tempTrackId}
                            onChange={(e) => setTempTrackId(e.target.value)}
                            placeholder="Track ID লিখুন"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleQuickTrackIdSave(item._id, tempTrackId);
                              } else if (e.key === "Escape") {
                                setEditingTrackIdRow(null);
                              }
                            }}
                            className="input-field"
                            style={{
                              height: "32px",
                              padding: "4px 8px",
                              fontSize: "0.8rem",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              width: "120px",
                            }}
                          />
                          <button
                            onClick={() => handleQuickTrackIdSave(item._id, tempTrackId)}
                            disabled={savingTrackId === item._id}
                            className="btn-primary btn-sm"
                            style={{ padding: "4px 7px", height: "32px" }}
                            title="সংরক্ষণ করুন"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingTrackIdRow(null)}
                            className="btn-secondary btn-sm"
                            style={{ padding: "4px 7px", height: "32px" }}
                            title="বাতিল"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingTrackIdRow(item._id);
                            setTempTrackId(item.onlineTrackId || "");
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: item.onlineTrackId
                              ? "rgba(56, 189, 248, 0.1)"
                              : "rgba(255, 255, 255, 0.04)",
                            border: item.onlineTrackId
                              ? "1px solid rgba(56, 189, 248, 0.25)"
                              : "1px dashed var(--border-subtle)",
                            transition: "all 0.15s ease",
                          }}
                          title="Online Track ID যোগ বা পরিবর্তন করতে ক্লিক করুন"
                        >
                          {item.onlineTrackId ? (
                            <>
                              <span
                                style={{
                                  fontFamily: "monospace",
                                  fontWeight: 700,
                                  color: "#38bdf8",
                                  fontSize: "0.82rem",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {item.onlineTrackId}
                              </span>
                              <Edit size={12} color="#38bdf8" style={{ opacity: 0.7 }} />
                            </>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.76rem",
                                color: "var(--text-muted)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Plus size={12} /> ID যোগ করুন
                            </span>
                          )}
                        </div>
                      )}
                    </td>



                    {/* Due Amount */}
                    <td style={{ padding: "14px 18px" }}>
                      <div
                        style={{
                          fontWeight: 800,
                          color: item.dueAmount > 0 ? "#fbbf24" : "#34d399",
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: item.dueAmount > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        }}
                      >
                        ৳ {item.dueAmount.toLocaleString("en-IN")}
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td style={{ padding: "14px 18px" }}>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                        style={{
                          background: getStatusBadge(item.status).bg,
                          color: getStatusBadge(item.status).color,
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          padding: "5px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <option value="submitted">আবেদন জমা</option>
                        <option value="biometric_pending">বায়োমেট্রিক বাকি</option>
                        <option value="police_verification">পুলিশ ভেরিফিকেশন</option>
                        <option value="ready_for_pickup">পাসপোর্ট রেডি</option>
                        <option value="delivered">ডেলিভারি সম্পন্ন</option>
                      </select>
                    </td>

                    {/* Created By Column */}
                    <td style={{ padding: "14px 18px", fontSize: "0.82rem" }}>
                      <div style={{ fontWeight: 600, color: "#38bdf8" }}>
                        {typeof item.createdBy === "object" && item.createdBy?.name
                          ? item.createdBy.name
                          : item.createdByName || "সিস্টেম"}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("bn-BD", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                    </td>

                    {/* Updated By Column */}
                    <td style={{ padding: "14px 18px", fontSize: "0.82rem" }}>
                      {(typeof item.updatedBy === "object" && item.updatedBy?.name) || item.updatedByName ? (
                        <>
                          <div style={{ fontWeight: 600, color: "#a78bfa" }}>
                            {typeof item.updatedBy === "object" && item.updatedBy?.name
                              ? item.updatedBy.name
                              : item.updatedByName}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {item.updatedAt
                              ? new Date(item.updatedAt).toLocaleDateString("bn-BD", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => {
                            setSelectedEntry(item);
                            setNewPaidInput(item.paidAmount);
                          }}
                          className="btn-secondary btn-sm"
                          style={{ padding: "5px 8px" }}
                          title="বিস্তারিত ও লেনদেন আপডেট"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="btn-secondary btn-sm"
                          style={{ padding: "5px 8px", color: "#38bdf8" }}
                          title="এডিট করুন"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(item._id)}
                          className="btn-secondary btn-sm btn-danger"
                          style={{ padding: "5px 8px" }}
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
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

      {/* MODAL: ADD NEW PASSPORT ENTRY */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--modal-backdrop)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel modal-container"
            style={{
              width: "100%",
              maxWidth: "640px",
              padding: "32px",
              background: "var(--bg-modal)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--card-shadow)",
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
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)" }}>
                  নতুন পাসপোর্ট এন্ট্রি ফর্ম (New Passport Entry)
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  আবেদনকারীর ব্যক্তিগত তথ্য ও টাকার হিসাব পূরণ করুন
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "1.3rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: "rgba(244, 63, 94, 0.12)",
                  border: "1px solid rgba(244, 63, 94, 0.35)",
                  color: "#f87171",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Field 1: Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  আবেদনকারীর নাম (Full Name) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: আব্দুর রহিম"
                  required
                  className="input-field"
                />
              </div>

              {/* Field 2 & 3: Mobile & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    মোবাইল নম্বর (Mobile Number) *
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="017xxxxxxxx"
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    ইমেইল (Email Address)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Field 4 & 5: NID & Birthdate */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    জাতীয় পরিচয়পত্র নম্বর (NID) *
                  </label>
                  <input
                    type="text"
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    placeholder="১০, ১৩ বা ১৭ ডিজিটের এনআইডি নং"
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    জন্মতারিখ (Birthdate) *
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              {/* Field 6: Passport Type */}
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  পাসপোর্ট ধরন (Passport Type)
                </label>
                <select
                  value={passportType}
                  onChange={(e) => setPassportType(e.target.value)}
                  className="input-field"
                >
                  {PASSPORT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Online Track ID */}
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Online Track ID (অনলাইন ট্র্যাকিং আইডি / OID - ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={onlineTrackId}
                  onChange={(e) => setOnlineTrackId(e.target.value.toUpperCase())}
                  placeholder="যেমন: OID-10023456"
                  className="input-field"
                  style={{ fontFamily: "monospace", textTransform: "uppercase" }}
                />
              </div>

              {/* Financial Breakdown (কত টাকা নিবে / কত দিছে / বকেয়া) */}
              <div
                className="financial-box"
                style={{
                  background: "var(--bg-subtle-box)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div className="title" style={{ fontSize: "0.86rem", fontWeight: 700, color: "#818cf8" }}>
                  লেনদেন ও টাকার হিসাব (Payment & Financials):
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      কত টাকা নিবে তার কাছে (Total Amount) *
                    </label>
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="যেমন: 6500"
                      required
                      min={0}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      সে কত টাকা দিছে (Paid Amount) *
                    </label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="যেমন: 4000"
                      required
                      min={0}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Live Due Amount Calculation Card */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    background: liveDue > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    border: liveDue > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: liveDue > 0 ? "#fbbf24" : "#34d399" }}>
                    বকেয়া টাকা (Due Amount - অটো হিসাব):
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: liveDue > 0 ? "#fbbf24" : "#34d399" }}>
                    ৳ {liveDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Status and Notes */}
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  বর্তমান স্ট্যাটাস (Status)
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="submitted">আবেদন জমা (Submitted)</option>
                  <option value="biometric_pending">বায়োমেট্রিক বাকি (Biometric Pending)</option>
                  <option value="police_verification">পুলিশ ভেরিফিকেশন (Police Verification)</option>
                  <option value="ready_for_pickup">পাসপোর্ট রেডি (Ready for Pickup)</option>
                  <option value="delivered">ডেলিভারি সম্পন্ন (Delivered)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  নোট বা জরুরি মন্তব্য (Optional Notes)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="পাসপোর্ট অফিস, ডেলিভারি তারিখ বা অন্যান্য মন্তব্য..."
                  rows={2}
                  className="input-field"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ flex: 1, padding: "12px" }}
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "পাসপোর্ট এন্ট্রি সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILS & PAYMENT RECEIPT */}
      {selectedEntry && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--modal-backdrop)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel modal-container"
            style={{
              width: "100%",
              maxWidth: "540px",
              padding: "30px",
              background: "var(--bg-modal)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
            }}
          >
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
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>{selectedEntry.name}</h3>
                <div style={{ fontSize: "0.82rem", color: "#38bdf8", fontWeight: 700 }}>
                  এন্ট্রি নম্বর: {selectedEntry.entryNumber}
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>মোবাইল নম্বর:</span>
                <span style={{ fontWeight: 600 }}>{selectedEntry.mobile}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>ইমেইল:</span>
                <span>{selectedEntry.email || "দেওয়া নেই"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>জাতীয় পরিচয়পত্র (NID):</span>
                <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#a5b4fc" }}>
                  {selectedEntry.nid}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>জন্মতারিখ:</span>
                <span>{selectedEntry.birthDate}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>পাসপোর্ট ধরন:</span>
                <span>{getPassportTypeLabel(selectedEntry.passportType)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>Online Track ID:</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: selectedEntry.onlineTrackId ? "#38bdf8" : "var(--text-muted)",
                    background: selectedEntry.onlineTrackId ? "rgba(56, 189, 248, 0.1)" : "transparent",
                    padding: selectedEntry.onlineTrackId ? "2px 8px" : "0",
                    borderRadius: "4px",
                  }}
                >
                  {selectedEntry.onlineTrackId || "যুক্ত করা হয়নি"}
                </span>
              </div>

              {/* Financial Box */}
              <div
                style={{
                  marginTop: "8px",
                  padding: "14px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>মোট চুক্তি টাকা:</span>
                  <span style={{ fontWeight: 700 }}>৳ {selectedEntry.totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>জমা দেওয়া টাকা:</span>
                  <span style={{ fontWeight: 700, color: "#34d399" }}>
                    ৳ {selectedEntry.paidAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontWeight: 700, color: selectedEntry.dueAmount > 0 ? "#fbbf24" : "#34d399" }}>
                    বকেয়া টাকা (Due):
                  </span>
                  <span style={{ fontWeight: 800, fontSize: "1.05rem", color: selectedEntry.dueAmount > 0 ? "#fbbf24" : "#34d399" }}>
                    ৳ {selectedEntry.dueAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                <button
                  onClick={() => setEditPaymentModal(!editPaymentModal)}
                  className="btn-secondary btn-sm"
                  style={{ marginTop: "6px" }}
                >
                  {editPaymentModal ? "পেমেন্ট বক্স লুকান" : "নতুন জমা টাকা আপডেট করুন"}
                </button>

                {editPaymentModal && (
                  <form onSubmit={handleUpdatePayment} style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                    <input
                      type="number"
                      value={newPaidInput}
                      onChange={(e) => setNewPaidInput(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="বর্তমান মোট জমা টাকা"
                      min={0}
                      className="input-field"
                      style={{ height: "36px", fontSize: "0.85rem" }}
                    />
                    <button
                      type="submit"
                      disabled={updatingPayment}
                      className="btn-primary btn-sm"
                      style={{ height: "36px", whiteSpace: "nowrap" }}
                    >
                      {updatingPayment ? "আপডেট..." : "সংরক্ষণ"}
                    </button>
                  </form>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginTop: "6px", padding: "12px", background: "rgba(99, 102, 241, 0.06)", borderRadius: "6px", borderLeft: "3px solid #6366f1" }}>
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "4px" }}>নোট / মন্তব্য:</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  {selectedEntry.notes || "কোনো নোট যোগ করা নেই।"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEntry(null)}
              className="btn-primary"
              style={{ width: "100%", marginTop: "20px" }}
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PASSPORT ENTRY */}
      {editingEntry && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--modal-backdrop)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setEditingEntry(null)}
        >
          <div
            className="modal-container"
            style={{
              background: "var(--bg-modal)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)" }}>
                  পাসপোর্ট এন্ট্রি এডিট করুন
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  এন্ট্রি নম্বর: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{editingEntry.entryNumber}</span>
                </p>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            {editFormError && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  color: "#f87171",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateEntrySubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Name */}
              <div>
                <label className="label-text">
                  গ্রাহকের পুরো নাম <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="উদাঃ মোঃ রফিকুল ইসলাম"
                  className="input-field"
                />
              </div>

              {/* Mobile & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="label-text">
                    মোবাইল নম্বর <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">ইমেইল (ঐচ্ছিক)</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="input-field"
                  />
                </div>
              </div>

              {/* NID & Birthdate */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="label-text">
                    জাতীয় পরিচয়পত্র (NID) নম্বর <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNid}
                    onChange={(e) => setEditNid(e.target.value)}
                    placeholder="১০ অথবা ১৭ সংখ্যার NID"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">
                    জন্ম তারিখ <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Passport Type */}
              <div>
                <label className="label-text">
                  পাসপোর্ট ধরন <span style={{ color: "#f87171" }}>*</span>
                </label>
                <select
                  value={editPassportType}
                  onChange={(e) => setEditPassportType(e.target.value)}
                  className="input-field"
                  style={{
                    color: "var(--text-main)",
                    backgroundColor: "var(--bg-card)",
                    lineHeight: "1.5",
                  }}
                >
                  {PASSPORT_TYPE_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      style={{
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-main)",
                        padding: "6px",
                      }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Online Track ID */}
              <div>
                <label className="label-text">Online Track ID (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={editOnlineTrackId}
                  onChange={(e) => setEditOnlineTrackId(e.target.value.toUpperCase())}
                  placeholder="যেমন: OID-10023456"
                  className="input-field"
                  style={{ fontFamily: "monospace", textTransform: "uppercase" }}
                />
              </div>

              {/* Status */}
              <div>
                <label className="label-text">বর্তমান স্ট্যাটাস</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="input-field"
                  style={{
                    color: "var(--text-main)",
                    backgroundColor: "var(--bg-card)",
                  }}
                >
                  <option value="submitted">আবেদন জমা (Submitted)</option>
                  <option value="biometric_pending">বায়োমেট্রিক বাকি (Biometric Pending)</option>
                  <option value="police_verification">পুলিশ ভেরিফিকেশন (Police Verification)</option>
                  <option value="ready_for_pickup">পাসপোর্ট রেডি (Ready for Pickup)</option>
                  <option value="delivered">ডেলিভারি সম্পন্ন (Delivered)</option>
                </select>
              </div>

              {/* Financial Box */}
              <div
                className="financial-box"
                style={{
                  background: "rgba(15, 23, 42, 0.4)",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    fontSize: "0.92rem",
                    marginBottom: "12px",
                  }}
                >
                  <DollarSign size={16} color="#38bdf8" />
                  <span>লেনদেন ও টাকার হিসাব (Payment & Financials)</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label className="label-text">কত টাকা নিবে তার কাছে (মোট বিল)</label>
                    <input
                      type="number"
                      min={0}
                      value={editTotalAmount}
                      onChange={(e) => setEditTotalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="৳ 0"
                      className="input-field"
                      style={{ fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label className="label-text">সে কত টাকা দিছে (জমা)</label>
                    <input
                      type="number"
                      min={0}
                      value={editPaidAmount}
                      onChange={(e) => setEditPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="৳ 0"
                      className="input-field"
                      style={{ fontWeight: 700, color: "#34d399" }}
                    />
                  </div>
                </div>

                {/* Due display */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    background: liveEditDue > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    border: liveEditDue > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: liveEditDue > 0 ? "#fbbf24" : "#34d399" }}>
                    বকেয়া টাকা (Due Amount):
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: liveEditDue > 0 ? "#fbbf24" : "#34d399" }}>
                    ৳ {liveEditDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label-text">বিশেষ নোট / মন্তব্য (ঐচ্ছিক)</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="প্রয়োজনীয় কোনো তথ্য বা রেফারেন্স লিখে রাখুন..."
                  rows={2}
                  className="input-field"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={updatingEntry}
                  className="btn-primary"
                  style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  {updatingEntry ? "আপডেট হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
