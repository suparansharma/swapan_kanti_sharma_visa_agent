"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  CreditCard,
  DollarSign,
  Calendar,
  Search,
  RefreshCw,
  Printer,
  FileText,
  Plane,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  User,
  Phone,
  Hash,
  X,
  Wallet,
  Plus,
  Trash2,
  FileCheck,
  TrendingUp,
  Receipt,
  HelpCircle,
} from "lucide-react";

export interface DailyLedgerItem {
  id: string;
  isTransactionRecord: boolean;
  transactionNumber: string;
  entryType: "collection" | "expense";
  referenceId: string;
  moduleType: "passport" | "visa" | "other";
  moduleLabel: string;
  applicantName: string;
  phone: string;
  serviceTitle: string;
  category: string;
  totalAmount?: number;
  inAmount: number;
  outAmount: number;
  profit?: number;
  fileExpense?: number;
  dueAmount: number;
  paymentStatus: "paid" | "partial" | "due";
  paymentMethod: string;
  notes: string;
  createdAt: string;
  createdByName: string;
}

interface SummaryData {
  today: {
    inAmount: number;
    outAmount: number;
    netCash: number;
    dueAmount: number;
    totalCount: number;
    passportCount: number;
    visaCount: number;
  };
  filtered: {
    inAmount: number;
    outAmount: number;
    netCash: number;
    dueAmount: number;
    totalCount: number;
  };
}

interface FileSearchResult {
  id: string;
  referenceId: string;
  moduleType: "passport" | "visa";
  moduleLabel: string;
  applicantName: string;
  phone: string;
  nidOrPassport: string;
  serviceTitle: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

export default function DailyEntryModule() {
  const [entries, setEntries] = useState<DailyLedgerItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilterType, setDateFilterType] = useState<
    "today" | "yesterday" | "this_week" | "this_month" | "all" | "custom"
  >("today");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [moduleFilter, setModuleFilter] = useState<"all" | "passport" | "visa">("all");
  const [txTypeFilter, setTxTypeFilter] = useState<"all" | "collection" | "expense">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "due">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal: View Money Receipt / Voucher
  const [selectedEntry, setSelectedEntry] = useState<DailyLedgerItem | null>(null);

  // Modal: Add New Transaction
  const [showAddModal, setShowAddModal] = useState(false);
  const [formType, setFormType] = useState<"collection" | "expense">("collection");
  const [formRefId, setFormRefId] = useState("");
  const [formApplicantName, setFormApplicantName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formServiceTitle, setFormServiceTitle] = useState("");
  const [formModuleType, setFormModuleType] = useState<"passport" | "visa" | "other">("passport");
  const [formCategory, setFormCategory] = useState("বকেয়া আদায় / কিস্তি জমা");
  const [formAmount, setFormAmount] = useState<number | "">("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("cash");
  const [formNotes, setFormNotes] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Autocomplete tracking ID state
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FileSearchResult[]>([]);
  const [searchingFiles, setSearchingFiles] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFileInfo, setSelectedFileInfo] = useState<FileSearchResult | null>(null);

  const [savingTransaction, setSavingTransaction] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Quick Date Selectors
  const handleDatePreset = (preset: "today" | "yesterday" | "this_week" | "this_month" | "all" | "custom") => {
    setDateFilterType(preset);
    const now = new Date();

    if (preset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      const yestStr = yest.toISOString().split("T")[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === "this_week") {
      const day = now.getDay();
      const diffToSunday = now.getDate() - day;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(diffToSunday);
      setStartDate(startOfWeek.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  const fetchDailyEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (moduleFilter !== "all") params.append("moduleType", moduleFilter);
      if (txTypeFilter !== "all") params.append("transactionType", txTypeFilter);
      if (paymentFilter !== "all") params.append("paymentStatus", paymentFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/accounts/daily-entries?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Error loading daily account entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyEntries();
  }, [startDate, endDate, moduleFilter, txTypeFilter, paymentFilter]);

  // Search files for autocomplete when adding a transaction
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (fileSearchQuery.trim().length >= 1) {
        try {
          setSearchingFiles(true);
          const res = await fetch(`/api/accounts/search-files?query=${encodeURIComponent(fileSearchQuery.trim())}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.files || []);
            setShowDropdown(true);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setSearchingFiles(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [fileSearchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFile = (file: FileSearchResult) => {
    setSelectedFileInfo(file);
    setFormRefId(file.referenceId);
    setFormApplicantName(file.applicantName);
    setFormPhone(file.phone);
    setFormServiceTitle(file.serviceTitle);
    setFormModuleType(file.moduleType);
    setFileSearchQuery(file.referenceId);
    setShowDropdown(false);

    if (formType === "collection") {
      setFormCategory("বকেয়া আদায় / কিস্তি জমা");
      if (file.dueAmount > 0) {
        setFormAmount(file.dueAmount);
      }
    } else {
      setFormCategory("এম্বাসি ড্রাফট ও ভিসা ফি");
    }
  };

  const handleOpenAddModal = (presetType: "collection" | "expense" = "collection") => {
    setFormType(presetType);
    setFormRefId("");
    setFormApplicantName("");
    setFormPhone("");
    setFormServiceTitle("");
    setFormModuleType("passport");
    setFormCategory(presetType === "collection" ? "বকেয়া আদায় / কিস্তি জমা" : "এম্বাসি ড্রাফট ও ভিসা ফি");
    setFormAmount("");
    setFormNotes("");
    setFormPaymentMethod("cash");
    setFileSearchQuery("");
    setSelectedFileInfo(null);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleFormTypeChange = (newType: "collection" | "expense") => {
    setFormType(newType);
    if (newType === "collection") {
      setFormCategory("বকেয়া আদায় / কিস্তি জমা");
    } else {
      setFormCategory("এম্বাসি ড্রাফট ও ভিসা ফি");
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const ref = (formRefId || fileSearchQuery).trim();
    if (!ref) {
      setFormError("পাসপোর্ট বা ভিসার ট্র্যাকিং নম্বর (Reference ID) প্রদান করুন বা তালিকা থেকে নির্বাচন করুন।");
      return;
    }

    if (!formAmount || Number(formAmount) <= 0) {
      setFormError("সঠিক টাকার পরিমাণ দিন (০ এর বেশি হতে হবে)।");
      return;
    }

    try {
      setSavingTransaction(true);
      const res = await fetch("/api/accounts/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          referenceId: ref,
          moduleType: formModuleType,
          applicantName: formApplicantName || "গ্রাহক",
          phone: formPhone,
          serviceTitle: formServiceTitle,
          category: formType === "collection" ? (formCategory || "বকেয়া আদায় / কিস্তি জমা") : formCategory,
          amount: Number(formAmount),
          paymentMethod: formPaymentMethod,
          notes: formNotes,
          date: formDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "হিসাব এন্ট্রি সংরক্ষণ করা যায়নি।");
        return;
      }

      setShowAddModal(false);
      setSuccessToast(data.message || "লেনদেন সফলভাবে সংরক্ষণ করা হয়েছে।");
      setTimeout(() => setSuccessToast(null), 4000);
      fetchDailyEntries();
    } catch (err: any) {
      console.error(err);
      setFormError("সার্ভার সমস্যা, অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setSavingTransaction(false);
    }
  };

  const handleDeleteTransaction = async (id: string, refId: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে ${refId} এর এই লেনদেন এন্ট্রিটি মুছে ফেলতে চান?`)) return;

    try {
      const res = await fetch(`/api/accounts/transactions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessToast("লেনদেনটি মুছে ফেলা হয়েছে।");
        setTimeout(() => setSuccessToast(null), 3000);
        fetchDailyEntries();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* SUCCESS TOAST */}
      {successToast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#10b981",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            zIndex: 9999,
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <CheckCircle2 size={20} />
          <span>{successToast}</span>
        </div>
      )}

      {/* MODULE HEADER */}
      <div
        className="no-print"
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
              দৈনিক হিসাব ও লেনদেন খাতা (Daily Entry Ledger)
            </h1>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                fontSize: "0.76rem",
                fontWeight: 700,
              }}
            >
              Account Module
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
            পাসপোর্ট ও ভিসা ট্র্যাকিং আইডি অনুযায়ী খরচ এবং টাকা জমার পুঙ্খানুপুঙ্খ ক্যাশবুক ও নোট
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Add New Transaction Entry Button */}
          <button
            onClick={() => handleOpenAddModal("collection")}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              fontWeight: 800,
              fontSize: "0.88rem",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
            }}
          >
            <Plus size={18} />
            <span>+ নতুন হিসাব এন্ট্রি (জমা / খরচ)</span>
          </button>

          <button
            onClick={fetchDailyEntries}
            className="btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              fontSize: "0.85rem",
            }}
            title="তথ্য রিফ্রেশ করুন"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            <Printer size={16} />
            <span>প্রিন্ট শিট</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS (TODAY'S CASH FLOW) */}
      <div
        className="print-summary-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* 1. Today's Collections (Cash In) */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            borderLeft: "4px solid #10b981",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              আজকের নগদ আদায় (Cash In)
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#34d399",
              }}
            >
              <ArrowDownLeft size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "#34d399", marginTop: "10px" }}>
            ৳ {(summary?.today.inAmount || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "#34d399", marginTop: "4px", fontWeight: 600 }}>
            আজ ক্লায়েন্টদের থেকে জমা হয়েছে
          </div>
        </div>

        {/* 2. Today's File Expenses (Cash Out) */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            borderLeft: "4px solid #f43f5e",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              আজকের ফাইল খরচ (Cash Out)
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(244, 63, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f87171",
              }}
            >
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "#f87171", marginTop: "10px" }}>
            ৳ {(summary?.today.outAmount || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "#f87171", marginTop: "4px", fontWeight: 600 }}>
            এম্বাসি, মেডিকেল ও প্রসেসিং খরচ
          </div>
        </div>

        {/* 3. Today's Net Balance (In - Out) */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            borderLeft: "4px solid #6366f1",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              আজকের নিট ক্যাশ ব্যালেন্স
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
              <Wallet size={20} />
            </div>
          </div>
          <div
            style={{
              fontSize: "1.9rem",
              fontWeight: 900,
              color: (summary?.today.netCash || 0) >= 0 ? "#818cf8" : "#f87171",
              marginTop: "10px",
            }}
          >
            ৳ {(summary?.today.netCash || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
            জমা টাকা বিয়োগ আজকের মোট খরচ
          </div>
        </div>

        {/* 4. Today's Total Due */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            borderLeft: "4px solid #f59e0b",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              আজকের বকেয়া টাকা
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fbbf24",
              }}
            >
              <AlertCircle size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "#fbbf24", marginTop: "10px" }}>
            ৳ {(summary?.today.dueAmount || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
            আজকের মোট লেনদেন: {summary?.today.totalCount || 0} টি
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div
        className="glass-panel no-print"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Row 1: Date presets & Transaction Type Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* Date Presets */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginRight: "4px", fontWeight: 600 }}>
              তারিখ:
            </span>
            <button
              onClick={() => handleDatePreset("today")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: dateFilterType === "today" ? "var(--primary-gradient)" : "rgba(255,255,255,0.05)",
                color: dateFilterType === "today" ? "#fff" : "var(--text-secondary)",
                fontWeight: dateFilterType === "today" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              আজ (Today)
            </button>
            <button
              onClick={() => handleDatePreset("yesterday")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: dateFilterType === "yesterday" ? "var(--primary-gradient)" : "rgba(255,255,255,0.05)",
                color: dateFilterType === "yesterday" ? "#fff" : "var(--text-secondary)",
                fontWeight: dateFilterType === "yesterday" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              গতকাল (Yesterday)
            </button>
            <button
              onClick={() => handleDatePreset("this_week")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: dateFilterType === "this_week" ? "var(--primary-gradient)" : "rgba(255,255,255,0.05)",
                color: dateFilterType === "this_week" ? "#fff" : "var(--text-secondary)",
                fontWeight: dateFilterType === "this_week" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              চলতি সপ্তাহ
            </button>
            <button
              onClick={() => handleDatePreset("this_month")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: dateFilterType === "this_month" ? "var(--primary-gradient)" : "rgba(255,255,255,0.05)",
                color: dateFilterType === "this_month" ? "#fff" : "var(--text-secondary)",
                fontWeight: dateFilterType === "this_month" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              চলতি মাস
            </button>
            <button
              onClick={() => handleDatePreset("all")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: dateFilterType === "all" ? "var(--primary-gradient)" : "rgba(255,255,255,0.05)",
                color: dateFilterType === "all" ? "#fff" : "var(--text-secondary)",
                fontWeight: dateFilterType === "all" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              সব রেকর্ড
            </button>
            <button
              onClick={() => setDateFilterType("custom")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: dateFilterType === "custom" ? "var(--primary-gradient)" : "rgba(255,255,255,0.05)",
                color: dateFilterType === "custom" ? "#fff" : "var(--text-secondary)",
                fontWeight: dateFilterType === "custom" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              কাস্টম তারিখ
            </button>
          </div>

          {/* Type Filter: Collection vs Expense */}
          <div
            style={{
              display: "flex",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: "8px",
              padding: "3px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={() => setTxTypeFilter("all")}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "none",
                background: txTypeFilter === "all" ? "rgba(99, 102, 241, 0.25)" : "transparent",
                color: txTypeFilter === "all" ? "#818cf8" : "var(--text-secondary)",
                fontWeight: txTypeFilter === "all" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              সকল হিসাব
            </button>
            <button
              onClick={() => setTxTypeFilter("collection")}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "none",
                background: txTypeFilter === "collection" ? "rgba(16, 185, 129, 0.25)" : "transparent",
                color: txTypeFilter === "collection" ? "#34d399" : "var(--text-secondary)",
                fontWeight: txTypeFilter === "collection" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              🟢 শুধু জমা (Collections)
            </button>
            <button
              onClick={() => setTxTypeFilter("expense")}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "none",
                background: txTypeFilter === "expense" ? "rgba(244, 63, 94, 0.25)" : "transparent",
                color: txTypeFilter === "expense" ? "#f87171" : "var(--text-secondary)",
                fontWeight: txTypeFilter === "expense" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              🔴 শুধু খরচ (Expenses)
            </button>
          </div>
        </div>

        {/* Row 2: Module pills, date pickers, search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            paddingTop: "10px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Module Filter */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value as any)}
              className="input-field"
              style={{ width: "auto", height: "36px", fontSize: "0.8rem", padding: "0 10px" }}
            >
              <option value="all">মডিউল: সকল</option>
              <option value="passport">📘 পাসপোর্ট এন্ট্রি</option>
              <option value="visa">✈️ ভিসা আবেদন</option>
            </select>

            {/* Custom Date Pickers */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>হতে:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateFilterType("custom");
                }}
                className="input-field"
                style={{ width: "auto", height: "36px", fontSize: "0.8rem", padding: "0 8px" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>পর্যন্ত:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateFilterType("custom");
                }}
                className="input-field"
                style={{ width: "auto", height: "36px", fontSize: "0.8rem", padding: "0 8px" }}
              />
            </div>

            {/* Payment status filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="input-field"
              style={{ width: "auto", height: "36px", fontSize: "0.8rem", padding: "0 10px" }}
            >
              <option value="all">পেমেন্ট: সকল</option>
              <option value="paid">✅ পরিশোধিত</option>
              <option value="due">⚠️ বকেয়া আছে</option>
            </select>
          </div>

          {/* Search bar */}
          <div style={{ position: "relative", minWidth: "280px", flex: 1, maxWidth: "380px" }}>
            <Search
              size={15}
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
              placeholder="ট্র্যাকিং আইডি (PS/VS), নাম বা নোট দিয়ে খুঁজুন..."
              className="input-field"
              style={{ paddingLeft: "36px", height: "38px", fontSize: "0.82rem" }}
            />
          </div>
        </div>
      </div>

      {/* FILTERED SUMMARY ROW */}
      <div
        className="glass-panel"
        style={{
          padding: "12px 20px",
          background: "rgba(255, 255, 255, 0.02)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "0.84rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            মোট প্রদর্শিত লেনদেন: <strong style={{ color: "var(--text-main)" }}>{summary?.filtered.totalCount || entries.length} টি</strong>
          </span>
          <span style={{ color: "var(--border-subtle)" }}>|</span>
          <span style={{ color: "var(--text-secondary)" }}>
            মোট নগদ আদায়: <strong style={{ color: "#34d399" }}>+৳ {(summary?.filtered.inAmount || 0).toLocaleString("en-IN")}</strong>
          </span>
          <span style={{ color: "var(--border-subtle)" }}>|</span>
          <span style={{ color: "var(--text-secondary)" }}>
            মোট ফাইল খরচ: <strong style={{ color: "#f87171" }}>-৳ {(summary?.filtered.outAmount || 0).toLocaleString("en-IN")}</strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div>
            নিট ক্যাশ ব্যালেন্স:{" "}
            <strong style={{ color: (summary?.filtered.netCash || 0) >= 0 ? "#818cf8" : "#f87171", fontSize: "0.95rem" }}>
              ৳ {(summary?.filtered.netCash || 0).toLocaleString("en-IN")}
            </strong>
          </div>
          <div>
            অবশিষ্ট মোট বকেয়া: <strong style={{ color: "#fbbf24" }}>৳ {(summary?.filtered.dueAmount || 0).toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>তারিখ ও সময়</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>ট্র্যাকিং নম্বর</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>মডিউল</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>গ্রাহকের নাম ও মোবাইল</th>
                <th style={{ padding: "14px 18px", color: "#34d399", fontWeight: 700 }}>জমা (Cash In)</th>
                <th style={{ padding: "14px 18px", color: "#f87171", fontWeight: 700 }}>খরচ (Expense)</th>
                <th style={{ padding: "14px 18px", color: "#38bdf8", fontWeight: 700 }}>নিট লাভ (Profit)</th>
                <th style={{ padding: "14px 18px", color: "#fbbf24", fontWeight: 700 }}>বকেয়া টাকা</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>এন্ট্রি করেছেন</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }} className="no-print">
                  একশন
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>দৈনিক হিসাব লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "50px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ maxWidth: "340px", margin: "0 auto" }}>
                      <Wallet size={36} style={{ color: "var(--text-muted)", marginBottom: "12px", opacity: 0.5 }} />
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                        কোনো লেনদেন পাওয়া যায়নি
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "6px" }}>
                        নির্বাচিত তারিখ বা ফিল্টারে কোনো জমা বা খরচের হিসাব পাওয়া যায়নি।
                      </p>
                      <button
                        onClick={() => handleOpenAddModal("collection")}
                        className="btn-primary"
                        style={{ marginTop: "14px", fontSize: "0.82rem", padding: "8px 16px" }}
                      >
                        + নতুন হিসাব এন্ট্রি দিন
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((item) => {
                  const entryDate = new Date(item.createdAt);
                  const formattedDate = entryDate.toLocaleDateString("bn-BD", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedTime = entryDate.toLocaleTimeString("bn-BD", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const isExpense = item.entryType === "expense";

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background 0.15s ease",
                      }}
                      className="table-row-hover"
                    >
                      {/* Date & Time */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{formattedDate}</div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {formattedTime}
                        </div>
                      </td>

                      {/* Reference / Tracking ID */}
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 800,
                            color: item.moduleType === "passport" ? "#34d399" : "#818cf8",
                            background:
                              item.moduleType === "passport"
                                ? "rgba(16, 185, 129, 0.1)"
                                : "rgba(99, 102, 241, 0.1)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {item.referenceId}
                        </span>
                      </td>

                      {/* Module Badge */}
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background:
                              item.moduleType === "passport"
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(99, 102, 241, 0.15)",
                            color: item.moduleType === "passport" ? "#34d399" : "#818cf8",
                          }}
                        >
                          {item.moduleType === "passport" ? <BookOpen size={12} /> : <Plane size={12} />}
                          <span>{item.moduleLabel}</span>
                        </span>
                      </td>

                      {/* Applicant & Phone */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{item.applicantName}</div>
                        <div
                          style={{
                            fontSize: "0.76rem",
                            color: "var(--text-secondary)",
                            marginTop: "2px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Phone size={11} style={{ color: "var(--text-muted)" }} />
                          <span>{item.phone}</span>
                        </div>
                      </td>

                      {/* Cash In */}
                      <td style={{ padding: "14px 18px" }}>
                        {item.inAmount > 0 ? (
                          <span style={{ fontWeight: 800, color: "#34d399", fontSize: "0.95rem" }}>
                            +৳ {item.inAmount.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>

                      {/* Cash Out / Expense */}
                      <td style={{ padding: "14px 18px" }}>
                        {item.outAmount > 0 ? (
                          <span style={{ fontWeight: 800, color: "#f87171", fontSize: "0.95rem" }}>
                            -৳ {item.outAmount.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>

                      {/* Profit (নিট লাভ) */}
                      <td style={{ padding: "14px 18px" }}>
                        {(() => {
                          const profitVal = item.profit !== undefined ? item.profit : item.inAmount - item.outAmount;
                          const isPositive = profitVal > 0;
                          const isNegative = profitVal < 0;
                          return (
                            <div>
                              <div
                                style={{
                                  fontWeight: 800,
                                  color: isPositive ? "#38bdf8" : isNegative ? "#f87171" : "var(--text-muted)",
                                  fontSize: "0.95rem",
                                }}
                              >
                                {isPositive ? "+" : ""}
                                ৳ {profitVal.toLocaleString("en-IN")}
                              </div>
                              {item.fileExpense !== undefined && item.fileExpense > 0 && (
                                <div style={{ fontSize: "0.71rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                  খরচ: -৳ {item.fileExpense.toLocaleString("en-IN")}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Due Amount */}
                      <td style={{ padding: "14px 18px" }}>
                        <div
                          style={{
                            fontWeight: 800,
                            color: item.dueAmount > 0 ? "#fbbf24" : "#34d399",
                            fontSize: "0.9rem",
                          }}
                        >
                          ৳ {item.dueAmount.toLocaleString("en-IN")}
                        </div>
                      </td>

                      {/* Created By */}
                      <td style={{ padding: "14px 18px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{item.createdByName}</div>
                      </td>

                      {/* Action: Voucher / Delete */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }} className="no-print">
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          <button
                            onClick={() => setSelectedEntry(item)}
                            className="btn-secondary btn-sm"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 8px",
                              fontSize: "0.76rem",
                            }}
                            title="মানি রিসিট ভাউচার দেখুন"
                          >
                            <Eye size={13} />
                            <span>রিসিট</span>
                          </button>

                          {item.isTransactionRecord && (
                            <button
                              onClick={() => handleDeleteTransaction(item.id, item.referenceId)}
                              style={{
                                background: "rgba(239, 68, 68, 0.12)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#f87171",
                                padding: "5px 6px",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                              title="লেনদেন মুছুন"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
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

      {/* PRINT-ONLY OFFICIAL FOOTER */}
      <div className="print-footer" style={{ display: "none" }}>
        <div className="print-signature-box">ক্যাশিয়ার / হিসাবরক্ষক স্বাক্ষর</div>
        <div className="print-signature-box">ম্যানেজার / অনুমোদিত স্বাক্ষর</div>
      </div>

      {/* MODAL 1: ADD NEW TRANSACTION (COLLECTION OR FILE EXPENSE) */}
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
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="modal-container"
            style={{
              background: "var(--bg-modal)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: "580px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "26px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "14px",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)" }}>
                  নতুন হিসাব এন্ট্রি (জমা / খরচ)
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  পাসপোর্ট বা ভিসার ট্র্যাকিং নম্বর দিয়ে লেনদেন ও খরচ লিপিবদ্ধ করুন
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  marginBottom: "14px",
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTransaction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Type Toggle: Collection vs Expense */}
              <div>
                <label className="label-text" style={{ marginBottom: "8px", display: "block" }}>
                  লেনদেনের ধরন নির্বাচন করুন *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => handleFormTypeChange("collection")}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      border: formType === "collection" ? "2px solid #10b981" : "1px solid var(--border-subtle)",
                      background: formType === "collection" ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.03)",
                      color: formType === "collection" ? "#34d399" : "var(--text-secondary)",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontSize: "0.9rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ArrowDownLeft size={18} />
                    <span>টাকা জমা / আদায় (Cash In)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormTypeChange("expense")}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      border: formType === "expense" ? "2px solid #f43f5e" : "1px solid var(--border-subtle)",
                      background: formType === "expense" ? "rgba(244, 63, 94, 0.15)" : "rgba(255, 255, 255, 0.03)",
                      color: formType === "expense" ? "#f87171" : "var(--text-secondary)",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontSize: "0.9rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ArrowUpRight size={18} />
                    <span>ফাইল বাবদ খরচ (Expense Out)</span>
                  </button>
                </div>
              </div>

              {/* Autocomplete / Search by Tracking ID */}
              <div ref={searchBoxRef} style={{ position: "relative" }}>
                <label className="label-text">
                  পাসপোর্ট বা ভিসা ট্র্যাকিং আইডি / রেফারেন্স নম্বর *
                </label>
                <div style={{ position: "relative" }}>
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
                    value={fileSearchQuery}
                    onChange={(e) => {
                      setFileSearchQuery(e.target.value);
                      setFormRefId(e.target.value);
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowDropdown(true);
                    }}
                    placeholder="ট্র্যাকিং আইডি লিখুন (যেমন: PS-001 বা VS-001 বা নাম)"
                    className="input-field"
                    style={{ paddingLeft: "36px", fontWeight: 700, textTransform: "uppercase" }}
                    required
                  />
                  {searchingFiles && (
                    <RefreshCw
                      size={14}
                      className="animate-spin"
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}
                    />
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-active)",
                      borderRadius: "8px",
                      marginTop: "4px",
                      maxHeight: "220px",
                      overflowY: "auto",
                      zIndex: 1100,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    }}
                  >
                    {searchResults.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleSelectFile(f)}
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--border-subtle)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.82rem",
                          transition: "background 0.15s",
                        }}
                        className="table-row-hover"
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                fontWeight: 800,
                                color: f.moduleType === "passport" ? "#34d399" : "#818cf8",
                                fontFamily: "monospace",
                              }}
                            >
                              {f.referenceId}
                            </span>
                            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                              {f.applicantName}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {f.phone} &bull; {f.serviceTitle}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "#fbbf24", fontWeight: 700 }}>
                            বকেয়া: ৳ {f.dueAmount.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            চুক্তি: ৳ {f.totalAmount.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected File Summary Banner */}
                {selectedFileInfo && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      background:
                        selectedFileInfo.moduleType === "passport"
                          ? "rgba(16, 185, 129, 0.08)"
                          : "rgba(99, 102, 241, 0.08)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "0.8rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ color: "var(--text-main)" }}>{selectedFileInfo.applicantName}</strong> (
                      {selectedFileInfo.phone})
                      <div style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>
                        সেবা: {selectedFileInfo.serviceTitle}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ color: "var(--text-secondary)" }}>বর্তমান বকেয়া: </span>
                      <strong style={{ color: selectedFileInfo.dueAmount > 0 ? "#fbbf24" : "#34d399" }}>
                        ৳ {selectedFileInfo.dueAmount.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Category (খাত) & Amount */}
              {formType === "expense" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="label-text">খরচের খাত / বিষয় *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="এম্বাসি ড্রাফট ও ভিসা ফি">এম্বাসি ড্রাফট ও ভিসা ফি</option>
                      <option value="মেডিকেল টেস্ট ফি">মেডিকেল টেস্ট ফি (Medical)</option>
                      <option value="বায়োমেট্রিক / VFS / IVAC চার্জ">বায়োমেট্রিক / VFS / IVAC ফি</option>
                      <option value="পুলিশ ভেরিফিকেশন চার্জ">পুলিশ ভেরিফিকেশন চার্জ</option>
                      <option value="নোটারি ও ডকুমেন্টস সত্যায়ন">নোটারি ও ডকুমেন্টস সত্যায়ন</option>
                      <option value="যাতায়াত ও কুরিয়ার খরচ">যাতায়াত ও কুরিয়ার খরচ</option>
                      <option value="বিবিধ অফিস ও ফাইল খরচ">বিবিধ অফিস ও ফাইল খরচ</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-text">টাকার পরিমাণ (Amount) *</label>
                    <input
                      type="number"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="যেমন: 2500"
                      min={1}
                      required
                      className="input-field"
                      style={{ fontWeight: 800, fontSize: "1.05rem" }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="label-text">টাকার পরিমাণ (Amount) *</label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="যেমন: 2500"
                    min={1}
                    required
                    className="input-field"
                    style={{ fontWeight: 800, fontSize: "1.05rem" }}
                  />
                </div>
              )}

              {/* Payment Method & Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="label-text">পেমেন্ট মাধ্যম *</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="input-field"
                  >
                    <option value="cash">নগদ (Cash)</option>
                    <option value="bank">ব্যাংক একাউন্ট (Bank)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="label-text">লেনদেনের তারিখ *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* NOTE FIELD (CRITICAL USER REQUEST) */}
              <div>
                <label className="label-text" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>নোট / বিস্তারিত মন্তব্য (Note & Reason) *</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>
                    কেন খরচ হলো বা কোন কিস্তির টাকা
                  </span>
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="যেমন: আজকে দিল্লী এম্বাসি ড্রাফট ফি ব্যাংকে জমা দেওয়া হয়েছে / গ্রাহক এসে ২য় কিস্তির টাকা পরিশোধ করেছেন..."
                  rows={3}
                  className="input-field"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  disabled={savingTransaction}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontWeight: 800,
                  }}
                >
                  {savingTransaction ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{formType === "collection" ? "টাকা জমা সংরক্ষণ করুন" : "খরচ সংরক্ষণ করুন"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  style={{ flex: 0.6 }}
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MONEY RECEIPT / VOUCHER VIEW */}
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
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="modal-container"
            style={{
              background: "var(--bg-modal)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: "540px",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px dashed var(--border-subtle)",
                paddingBottom: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Sharma Visa & Passport
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  গ্লোবাল ভিসা ও পাসপোর্ট ম্যানেজমেন্ট এজেন্সি &bull; ট্রানজ্যাকশন ভাউচার
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Voucher Metadata */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "0.82rem",
              }}
            >
              <div>
                <span style={{ color: "var(--text-muted)" }}>ট্র্যাকিং / রেফারেন্স আইডি:</span>
                <div style={{ fontWeight: 800, color: "#38bdf8", marginTop: "2px", fontFamily: "monospace" }}>
                  {selectedEntry.referenceId}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>তারিখ ও সময়:</span>
                <div style={{ fontWeight: 600, color: "var(--text-main)", marginTop: "2px" }}>
                  {new Date(selectedEntry.createdAt).toLocaleString("bn-BD", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            {/* Client & Service Info */}
            <div style={{ marginBottom: "16px", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>গ্রাহকের নাম:</span>
                <strong style={{ color: "var(--text-main)" }}>{selectedEntry.applicantName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>মোবাইল নম্বর:</span>
                <strong style={{ color: "var(--text-main)" }}>{selectedEntry.phone}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>সেবার নাম:</span>
                <span style={{ color: "#818cf8", fontWeight: 600, textAlign: "right" }}>
                  {selectedEntry.serviceTitle}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>লেনদেনের খাত / বিষয়:</span>
                <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                  {selectedEntry.category}
                </span>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div
              style={{
                borderTop: "1px dashed var(--border-subtle)",
                borderBottom: "1px dashed var(--border-subtle)",
                padding: "14px 0",
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {selectedEntry.inAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem" }}>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>জমা টাকা (Cash In):</span>
                  <span style={{ fontWeight: 900, color: "#34d399", fontSize: "1.1rem" }}>
                    +৳ {selectedEntry.inAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {selectedEntry.outAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem" }}>
                  <span style={{ color: "#f87171", fontWeight: 700 }}>ফাইল খরচ (Expense Out):</span>
                  <span style={{ fontWeight: 900, color: "#f87171", fontSize: "1.1rem" }}>
                    -৳ {selectedEntry.outAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                <span style={{ color: selectedEntry.dueAmount > 0 ? "#fbbf24" : "#34d399", fontWeight: 700 }}>
                  অবশিষ্ট ফাইলের বকেয়া:
                </span>
                <span style={{ fontWeight: 900, color: selectedEntry.dueAmount > 0 ? "#fbbf24" : "#34d399" }}>
                  ৳ {selectedEntry.dueAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                  এখন পর্যন্ত নিট লাভ (Profit):
                </span>
                <span
                  style={{
                    fontWeight: 900,
                    color:
                      (selectedEntry.profit ?? selectedEntry.inAmount - selectedEntry.outAmount) >= 0
                        ? "#38bdf8"
                        : "#f87171",
                  }}
                >
                  {(selectedEntry.profit ?? selectedEntry.inAmount - selectedEntry.outAmount) >= 0 ? "+" : ""}
                  ৳ {(selectedEntry.profit ?? selectedEntry.inAmount - selectedEntry.outAmount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Notes Display in Voucher */}
            {selectedEntry.notes && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "6px",
                  borderLeft: "3px solid #6366f1",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "2px" }}>
                  নোট / মন্তব্য:
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {selectedEntry.notes}
                </div>
              </div>
            )}

            {/* Audit / Operator */}
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "20px" }}>
              লেনদেন লিপিবদ্ধকারী: <strong style={{ color: "var(--text-secondary)" }}>{selectedEntry.createdByName}</strong>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => window.print()}
                className="btn-primary"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Printer size={16} />
                <span>ভাউচার প্রিন্ট করুন</span>
              </button>
              <button
                onClick={() => setSelectedEntry(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
