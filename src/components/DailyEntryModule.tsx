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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  transactions?: DailyLedgerItem[];
}

interface SummaryData {
  today: {
    inAmount: number;
    outAmount: number;
    netCash: number;
    profit?: number;
    dueAmount: number;
    totalCount: number;
    passportCount: number;
    visaCount: number;
  };
  filtered: {
    inAmount: number;
    outAmount: number;
    netCash: number;
    profit?: number;
    dueAmount: number;
    totalCount: number;
  };
  allTime?: {
    inAmount: number;
    outAmount: number;
    profit: number;
    dueAmount: number;
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

// Module-level memory cache for instant tab navigation (zero-delay tab switching)
let memoryAccountsCache: {
  entries: DailyLedgerItem[];
  summary: SummaryData | null;
  page: number;
  totalPages: number;
  totalMatching: number;
} | null = null;

export default function DailyEntryModule() {
  const [entries, setEntries] = useState<DailyLedgerItem[]>(() => memoryAccountsCache?.entries || []);
  const [summary, setSummary] = useState<SummaryData | null>(() => memoryAccountsCache?.summary || null);
  const [loading, setLoading] = useState(() => !memoryAccountsCache);

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

  // Modal: View Transactions History for Tracking Number
  const [viewingTransactionsItem, setViewingTransactionsItem] = useState<DailyLedgerItem | null>(null);

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(() => memoryAccountsCache?.page || 1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(() => memoryAccountsCache?.totalPages || 1);
  const [totalMatching, setTotalMatching] = useState(() => memoryAccountsCache?.totalMatching || 0);

  const fetchDailyEntries = async (
    page = currentPage,
    limit = pageSize,
    sDate = startDate,
    eDate = endDate,
    modFilter = moduleFilter,
    tFilter = txTypeFilter,
    pFilter = paymentFilter,
    query = searchQuery
  ) => {
    try {
      if (!memoryAccountsCache && entries.length === 0) {
        setLoading(true);
      }
      const params = new URLSearchParams();
      if (sDate) params.append("startDate", sDate);
      if (eDate) params.append("endDate", eDate);
      if (modFilter !== "all") params.append("moduleType", modFilter);
      if (tFilter !== "all") params.append("transactionType", tFilter);
      if (pFilter !== "all") params.append("paymentStatus", pFilter);
      if (query.trim()) params.append("search", query.trim());
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/accounts/daily-entries?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        if (data.summary) setSummary(data.summary);
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages || 1);
          setTotalMatching(data.pagination.totalEntries || 0);
        }

        // Update memory cache
        memoryAccountsCache = {
          entries: data.entries || [],
          summary: data.summary || null,
          page: data.pagination?.page || 1,
          totalPages: data.pagination?.totalPages || 1,
          totalMatching: data.pagination?.totalEntries || 0,
        };
      }
    } catch (err) {
      console.error("Error loading daily account entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyEntries(1, pageSize, startDate, endDate, moduleFilter, txTypeFilter, paymentFilter, searchQuery);
  }, [startDate, endDate, moduleFilter, txTypeFilter, paymentFilter, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchDailyEntries(newPage, pageSize, startDate, endDate, moduleFilter, txTypeFilter, paymentFilter, searchQuery);
  };

  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const handlePrintSheet = async () => {
    // If there are more matching entries than currently displayed on this page,
    // fetch all (up to 1000) so the printed sheet contains the full accounts statement.
    if (totalMatching > entries.length && totalMatching <= 1000) {
      try {
        setIsPreparingPrint(true);
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (moduleFilter !== "all") params.append("moduleType", moduleFilter);
        if (txTypeFilter !== "all") params.append("transactionType", txTypeFilter);
        if (paymentFilter !== "all") params.append("paymentStatus", paymentFilter);
        if (searchQuery.trim()) params.append("search", searchQuery.trim());
        params.append("page", "1");
        params.append("limit", "1000");

        const res = await fetch(`/api/accounts/daily-entries?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries || []);
        }
      } catch (e) {
        console.error("Error fetching all entries for print:", e);
      } finally {
        setIsPreparingPrint(false);
        setTimeout(() => {
          window.print();
        }, 250);
      }
    } else {
      window.print();
    }
  };

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
        setViewingTransactionsItem(null);
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

      {/* 1. OFFICIAL LETTERHEAD FOR PRINT ONLY (FIRST PAGE ONLY) */}
      <div className="print-first-page-header">
        <h1 className="print-org-title">Sharma Pharmacy</h1>
        <div className="print-org-name">Swapan Kanti Sharma</div>
        <div className="print-org-address">Amlapara, Kushtia</div>
        <div className="print-org-contact">01715144329 | swapankantisharma7@gmail.com</div>
        <h2 className="print-doc-title" style={{ margin: "4px 0 2px 0", fontSize: "13pt" }}>
          {moduleFilter === "passport"
            ? "পাসপোর্ট ফাইল দৈনিক ক্যাশ ও একাউন্টস লেজার স্টেটমেন্ট"
            : moduleFilter === "visa"
            ? "ভিসা ফাইল দৈনিক ক্যাশ ও একাউন্টস লেজার স্টেটমেন্ট"
            : "পাসপোর্ট ও ভিসা দৈনিক ক্যাশ ও একাউন্টস লেজার স্টেটমেন্ট"}
        </h2>
        <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "#000000", marginBottom: "6px", textAlign: "center" }}>
          (Visa & Passport Daily Accounts Statement &bull; শুধুমাত্র পাসপোর্ট ও ভিসা ফাইলের আর্থিক হিসাব)
        </div>

        {/* Print Metadata: Dates, Filter type, Print Time */}
        <div
          className="print-only"
          style={{
            fontSize: "7.5pt",
            color: "#000000",
            marginBottom: "6px",
            borderBottom: "1px solid #000000",
            paddingBottom: "4px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div>
              <strong>তারিখ: </strong>
              {startDate && endDate
                ? startDate === endDate
                  ? `${startDate} (আজকের হিসাব)`
                  : `${startDate} হতে ${endDate}`
                : "সকল তারিখের রেকর্ড"}
              {" | "}
              <strong>লেনদেনের ধরন: </strong>
              {txTypeFilter === "collection"
                ? "শুধু জমা (Cash In)"
                : txTypeFilter === "expense"
                ? "শুধু খরচ (Expense Out)"
                : "সকল হিসাব (জমা ও খরচ)"}
              {" | "}
              <strong>মডিউল: </strong>
              {moduleFilter === "passport"
                ? "পাসপোর্ট"
                : moduleFilter === "visa"
                ? "ভিসা"
                : "সকল মডিউল"}
            </div>
            <div>
              <strong>মুদ্রণ সময়: </strong>
              {new Date().toLocaleString("bn-BD", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* Print-Only Financial Summary Mini-Table */}
        <div
          className="print-only"
          style={{
            width: "100%",
            marginBottom: "8px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #000000",
              fontSize: "7.5pt",
              textAlign: "center",
              marginBottom: "4px",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 700 }}>মোট লেনদেন</th>
                <th style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 700 }}>মোট নগদ আদায় (In)</th>
                <th style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 700 }}>মোট ফাইল খরচ (Out)</th>
                <th style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 700 }}>নিট ক্যাশ ব্যালেন্স</th>
                <th style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 700 }}>নিট লাভ (Profit)</th>
                <th style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 700 }}>অবশিষ্ট বকেয়া</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 800 }}>
                  {summary?.filtered.totalCount || entries.length} টি
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 800 }}>
                  ৳ {(summary?.filtered.inAmount || 0).toLocaleString("en-IN")}
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 800 }}>
                  ৳ {(summary?.filtered.outAmount || 0).toLocaleString("en-IN")}
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 800 }}>
                  ৳ {(summary?.filtered.netCash || 0).toLocaleString("en-IN")}
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 800 }}>
                  {(summary?.filtered.profit ?? summary?.filtered.netCash ?? 0) >= 0 ? "+" : ""}৳{" "}
                  {(summary?.filtered.profit ?? summary?.filtered.netCash ?? 0).toLocaleString("en-IN")}
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px 3px", fontWeight: 800 }}>
                  ৳ {(summary?.filtered.dueAmount || 0).toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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
              পাসপোর্ট ও ভিসা দৈনিক হিসাব ও লেজার (Visa & Passport Accounts)
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
              Visa & Passport Accounts
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
            শুধুমাত্র পাসপোর্ট ও ভিসা প্রসেসিং ফাইলের নগদ আদায়, এম্বাসি/মেডিকেল খরচ ও বকেয়া আদায়ের লেজার স্টেটমেন্ট
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
            onClick={() => fetchDailyEntries()}
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
            onClick={handlePrintSheet}
            disabled={isPreparingPrint || loading}
            className="btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: isPreparingPrint || loading ? "not-allowed" : "pointer",
            }}
          >
            <Printer size={16} className={isPreparingPrint ? "animate-spin" : ""} />
            <span>{isPreparingPrint ? "প্রিন্ট প্রস্তুত হচ্ছে..." : "প্রিন্ট শিট"}</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS (TODAY'S CASH FLOW) */}
      <div
        className="print-summary-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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

        {/* 4. Today's Profit (Net Profit) */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            borderLeft: "4px solid #0ea5e9",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              আজকের নিট লাভ (Profit)
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(14, 165, 233, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
              }}
            >
              <TrendingUp size={20} />
            </div>
          </div>
          <div
            style={{
              fontSize: "1.9rem",
              fontWeight: 900,
              color: ((summary?.today.profit ?? summary?.today.netCash ?? 0) >= 0) ? "#38bdf8" : "#f87171",
              marginTop: "10px",
            }}
          >
            {(summary?.today.profit ?? summary?.today.netCash ?? 0) >= 0 ? "+" : ""}
            ৳ {(summary?.today.profit ?? summary?.today.netCash ?? 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "#38bdf8", marginTop: "4px", fontWeight: 600 }}>
            খরচ বাদ দেওয়ার পর আজকের লাভ
          </div>
        </div>

        {/* 5. Today's Total Due */}
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
          <span style={{ color: "var(--border-subtle)" }}>|</span>
          <div>
            নিট লাভ (Profit):{" "}
            <strong style={{ color: (summary?.filtered.profit ?? summary?.filtered.netCash ?? 0) >= 0 ? "#38bdf8" : "#f87171", fontSize: "0.95rem" }}>
              {(summary?.filtered.profit ?? summary?.filtered.netCash ?? 0) >= 0 ? "+" : ""}
              ৳ {(summary?.filtered.profit ?? summary?.filtered.netCash ?? 0).toLocaleString("en-IN")}
            </strong>
          </div>
          <span style={{ color: "var(--border-subtle)" }}>|</span>
          <div>
            অবশিষ্ট মোট বকেয়া: <strong style={{ color: "#fbbf24" }}>৳ {(summary?.filtered.dueAmount || 0).toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div
        className="glass-panel report-table-wrapper"
        style={{
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            className="report-print-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.86rem",
            }}
          >
            <colgroup className="print-only">
              <col className="print-col-acc-date" />
              <col className="print-col-acc-track" />
              <col className="print-col-acc-module" />
              <col className="print-col-acc-name" />
              <col className="print-col-acc-in" />
              <col className="print-col-acc-out" />
              <col className="print-col-acc-profit" />
              <col className="print-col-acc-due" />
              <col className="print-col-acc-user" />
            </colgroup>
            <thead>
              <tr
                style={{
                  background: "var(--table-head-bg, rgba(255, 255, 255, 0.04))",
                  borderBottom: "2px solid var(--border-subtle)",
                }}
              >
                <th
                  className="print-col-acc-date"
                  style={{
                    padding: "13px 14px",
                    color: "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    minWidth: "125px",
                  }}
                >
                  তারিখ ও সময়
                </th>
                <th
                  className="print-col-acc-track"
                  style={{
                    padding: "13px 12px",
                    color: "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    minWidth: "115px",
                  }}
                >
                  ট্র্যাকিং নম্বর
                </th>
                <th
                  className="print-col-acc-module"
                  style={{
                    padding: "13px 10px",
                    color: "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    minWidth: "95px",
                  }}
                >
                  মডিউল
                </th>
                <th
                  className="print-col-acc-name"
                  style={{
                    padding: "13px 14px",
                    color: "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "left",
                    minWidth: "190px",
                  }}
                >
                  গ্রাহকের নাম ও বিবরণ
                </th>
                <th
                  className="print-col-acc-in"
                  style={{
                    padding: "13px 14px",
                    color: "#10b981",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    minWidth: "125px",
                  }}
                >
                  <span className="no-print">জমা (Cash In)</span>
                  <span className="print-only">জমা টাকা</span>
                </th>
                <th
                  className="print-col-acc-out"
                  style={{
                    padding: "13px 14px",
                    color: "#f87171",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    minWidth: "125px",
                  }}
                >
                  <span className="no-print">খরচ (Expense)</span>
                  <span className="print-only">খরচ টাকা</span>
                </th>
                <th
                  className="print-col-acc-profit"
                  style={{
                    padding: "13px 14px",
                    color: "#38bdf8",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    minWidth: "125px",
                  }}
                >
                  <span className="no-print">নিট লাভ (Profit)</span>
                  <span className="print-only">নিট লাভ</span>
                </th>
                <th
                  className="print-col-acc-due"
                  style={{
                    padding: "13px 14px",
                    color: "#fbbf24",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    minWidth: "115px",
                  }}
                >
                  বকেয়া টাকা
                </th>
                <th
                  className="print-col-acc-user"
                  style={{
                    padding: "13px 12px",
                    color: "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    minWidth: "140px",
                  }}
                >
                  এন্ট্রি করেছেন
                </th>
                <th
                  className="no-print"
                  style={{
                    padding: "13px 16px",
                    color: "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    minWidth: "210px",
                  }}
                >
                  একশন
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "60px 20px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          border: "3px solid rgba(16, 185, 129, 0.2)",
                          borderTopColor: "#10b981",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      <style jsx>{`
                        @keyframes spin {
                          to {
                            transform: rotate(360deg);
                          }
                        }
                      `}</style>
                      <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.95rem" }}>
                        দৈনিক হিসাব ও লেজার লোড হচ্ছে...
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন
                      </div>
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
                  const entryDate = item.createdAt ? new Date(item.createdAt) : new Date();
                  const d = isNaN(entryDate.getTime()) ? "--" : String(entryDate.getDate()).padStart(2, "0");
                  const m = isNaN(entryDate.getTime()) ? "--" : String(entryDate.getMonth() + 1).padStart(2, "0");
                  const y = isNaN(entryDate.getTime()) ? "----" : entryDate.getFullYear();
                  const formattedDate = isNaN(entryDate.getTime()) ? "—" : `${d}/${m}/${y}`;
                  const formattedTime = isNaN(entryDate.getTime())
                    ? ""
                    : entryDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background 0.15s ease",
                      }}
                      className="table-row-hover"
                    >
                      {/* 1. Date & Time */}
                      <td
                        className="print-col-acc-date print-td-date"
                        style={{
                          padding: "13px 14px",
                          verticalAlign: "middle",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.84rem", whiteSpace: "nowrap" }}>
                          {formattedDate}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            marginTop: "2px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                          className="print-note"
                        >
                          <Clock size={11} className="no-print" style={{ opacity: 0.6 }} />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      {/* 2. Reference / Tracking ID */}
                      <td
                        className="print-col-acc-track print-td-mono"
                        style={{
                          padding: "13px 12px",
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        <span
                          className="print-td-mono"
                          style={{
                            display: "inline-block",
                            fontWeight: 800,
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            color: item.moduleType === "passport" ? "#10b981" : "#6366f1",
                            fontSize: "0.82rem",
                            padding: "3px 9px",
                            borderRadius: "6px",
                            background: item.moduleType === "passport" ? "rgba(16, 185, 129, 0.1)" : "rgba(99, 102, 241, 0.1)",
                            border: `1px solid ${item.moduleType === "passport" ? "rgba(16, 185, 129, 0.25)" : "rgba(99, 102, 241, 0.25)"}`,
                            whiteSpace: "nowrap",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {item.referenceId}
                        </span>
                      </td>

                      {/* 3. Module Badge */}
                      <td
                        className="print-col-acc-module"
                        style={{
                          padding: "13px 10px",
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        <span
                          className="no-print"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background:
                              item.moduleType === "passport"
                                ? "rgba(16, 185, 129, 0.12)"
                                : "rgba(99, 102, 241, 0.12)",
                            color: item.moduleType === "passport" ? "#34d399" : "#818cf8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.moduleType === "passport" ? <BookOpen size={11} /> : <Plane size={11} />}
                          <span>{item.moduleLabel}</span>
                        </span>
                        <span className="print-only print-status-text">
                          {item.moduleLabel}
                        </span>
                      </td>

                      {/* 4. Applicant & Phone */}
                      <td
                        className="print-col-acc-name print-td-name"
                        style={{
                          padding: "13px 14px",
                          verticalAlign: "middle",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.88rem" }}>
                          {item.applicantName}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-secondary)",
                            marginTop: "2px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          className="print-note"
                        >
                          <span className="no-print">
                            <Phone size={11} style={{ color: "var(--text-muted)" }} />
                          </span>
                          <span>{item.phone || "—"}</span>
                        </div>
                      </td>

                      {/* 5. Cash In */}
                      <td
                        className="print-col-acc-in print-td-num"
                        style={{
                          padding: "13px 14px",
                          verticalAlign: "middle",
                          textAlign: "right",
                        }}
                      >
                        {item.inAmount > 0 ? (
                          <span style={{ fontWeight: 800, color: "#10b981", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                            +৳ {item.inAmount.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>

                      {/* 6. Cash Out / Expense */}
                      <td
                        className="print-col-acc-out print-td-num"
                        style={{
                          padding: "13px 14px",
                          verticalAlign: "middle",
                          textAlign: "right",
                        }}
                      >
                        {item.outAmount > 0 ? (
                          <span style={{ fontWeight: 800, color: "#f87171", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                            -৳ {item.outAmount.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>

                      {/* 7. Profit (নিট লাভ) */}
                      <td
                        className="print-col-acc-profit print-td-num"
                        style={{
                          padding: "13px 14px",
                          verticalAlign: "middle",
                          textAlign: "right",
                        }}
                      >
                        {(() => {
                          const profitVal = item.profit !== undefined ? item.profit : item.inAmount - item.outAmount;
                          const isPositive = profitVal > 0;
                          const isNegative = profitVal < 0;
                          return (
                            <div>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: isPositive ? "#38bdf8" : isNegative ? "#f87171" : "var(--text-muted)",
                                  fontSize: "0.9rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {isPositive ? "+" : ""}
                                ৳ {profitVal.toLocaleString("en-IN")}
                              </span>
                              {item.fileExpense !== undefined && item.fileExpense > 0 && (
                                <div className="no-print" style={{ fontSize: "0.71rem", color: "var(--text-muted)", marginTop: "2px", whiteSpace: "nowrap" }}>
                                  খরচ: -৳ {item.fileExpense.toLocaleString("en-IN")}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 8. Due Amount */}
                      <td
                        className="print-col-acc-due print-td-num"
                        style={{
                          padding: "13px 14px",
                          verticalAlign: "middle",
                          textAlign: "right",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            color: item.dueAmount > 0 ? "#fbbf24" : "#10b981",
                            fontSize: "0.9rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ৳ {item.dueAmount.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* 9. Created By */}
                      <td
                        className="print-col-acc-user"
                        style={{
                          padding: "13px 12px",
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        <span
                          className="no-print"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid var(--border-subtle)",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "var(--text-main)",
                            whiteSpace: "nowrap",
                          }}
                          title={item.createdByName || "এডমিন"}
                        >
                          <User size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                          <span>{item.createdByName || "এডমিন"}</span>
                        </span>
                        <span
                          className="print-only"
                          style={{
                            fontSize: "7.2pt",
                            fontWeight: 600,
                            color: "#000000",
                            wordBreak: "break-word",
                            lineHeight: 1.25,
                            display: "block",
                          }}
                        >
                          {item.createdByName || "এডমিন"}
                        </span>
                      </td>

                      {/* 10. Action: View Transactions & Voucher */}
                      <td
                        style={{
                          padding: "13px 16px",
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                        className="no-print"
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            gap: "6px",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            onClick={() => setViewingTransactionsItem(item)}
                            className="btn-primary btn-sm"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "6px 11px",
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              borderRadius: "7px",
                              background: "linear-gradient(135deg, #0284c7, #2563eb)",
                              color: "#ffffff",
                              border: "none",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              boxShadow: "0 2px 5px rgba(2, 132, 199, 0.25)",
                              transition: "all 0.15s ease",
                            }}
                            title="এই ট্র্যাকিং নম্বরের সকল লেনদেন হিস্ট্রি দেখুন"
                          >
                            <FileText size={13} />
                            <span>লেনদেন সমূহ</span>
                            {item.transactions && item.transactions.length > 0 && (
                              <span
                                style={{
                                  background: "rgba(255, 255, 255, 0.3)",
                                  borderRadius: "10px",
                                  padding: "1px 6px",
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  marginLeft: "2px",
                                }}
                              >
                                {item.transactions.length}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => setSelectedEntry(item.transactions?.[0] || item)}
                            className="btn-secondary btn-sm"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 10px",
                              fontSize: "0.76rem",
                              fontWeight: 600,
                              borderRadius: "7px",
                              whiteSpace: "nowrap",
                              cursor: "pointer",
                            }}
                            title="মানি রিসিট ভাউচার দেখুন"
                          >
                            <Receipt size={13} />
                            <span>রিসিট</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="print-only-tfoot">
              <tr>
                <td colSpan={9} style={{ height: "25mm", border: "none", padding: 0, background: "transparent" }}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ACCOUNTS PAGINATION CONTROLS */}
        <div
          className="no-print"
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "rgba(255, 255, 255, 0.015)",
          }}
        >
          {/* Left: Total Records & Page Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>
              মোট <strong style={{ color: "var(--text-main)" }}>{totalMatching}</strong> টি লেনদেন
              {totalMatching > 0 && (
                <> (পৃষ্ঠা <strong style={{ color: "#10b981" }}>{currentPage}</strong> / <strong>{totalPages}</strong>)</>
              )}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.8rem" }}>প্রতি পৃষ্ঠায়:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10);
                  setPageSize(newLimit);
                  setCurrentPage(1);
                  fetchDailyEntries(1, newLimit, startDate, endDate, moduleFilter, txTypeFilter, paymentFilter, searchQuery);
                }}
                className="input-field"
                style={{
                  height: "32px",
                  padding: "0 8px",
                  fontSize: "0.8rem",
                  width: "auto",
                  minWidth: "70px",
                }}
              >
                <option value="10">১০</option>
                <option value="20">২০</option>
                <option value="50">৫০</option>
                <option value="100">১০০</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* First Page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1 || loading}
              className="btn-secondary btn-sm"
              style={{
                padding: "6px 10px",
                height: "34px",
                opacity: currentPage <= 1 ? 0.4 : 1,
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              }}
              title="প্রথম পৃষ্ঠা"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="btn-secondary btn-sm"
              style={{
                padding: "6px 10px",
                height: "34px",
                opacity: currentPage <= 1 ? 0.4 : 1,
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              }}
              title="পূর্ববর্তী পৃষ্ঠা"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Number Pills */}
            <div style={{ display: "flex", gap: "4px" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                  );
                })
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push("...");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) => {
                  if (item === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        style={{
                          padding: "6px 8px",
                          fontSize: "0.82rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        ...
                      </span>
                    );
                  }

                  const pNum = Number(item);
                  const isActive = pNum === currentPage;
                  return (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      disabled={loading}
                      style={{
                        minWidth: "34px",
                        height: "34px",
                        borderRadius: "6px",
                        border: isActive ? "none" : "1px solid var(--border-subtle)",
                        background: isActive ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255, 255, 255, 0.04)",
                        color: isActive ? "#ffffff" : "var(--text-main)",
                        fontWeight: isActive ? 800 : 500,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {pNum}
                    </button>
                  );
                })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="btn-secondary btn-sm"
              style={{
                padding: "6px 10px",
                height: "34px",
                opacity: currentPage >= totalPages ? 0.4 : 1,
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              }}
              title="পরবর্তী পৃষ্ঠা"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages || loading}
              className="btn-secondary btn-sm"
              style={{
                padding: "6px 10px",
                height: "34px",
                opacity: currentPage >= totalPages ? 0.4 : 1,
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              }}
              title="শেষ পৃষ্ঠা"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* FIXED PRINT FOOTER: APPEARS ON EVERY PAGE */}
      <div className="print-footer-fixed" style={{ width: "100%", left: 0, right: 0 }}>
        <div className="print-footer-divider" style={{ borderTop: "1.5px solid #000000", width: "100%", marginBottom: "14px" }}></div>
        <div className="print-footer-grid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
          <div className="print-sig-box print-sig-box-left" style={{ width: "220px", textAlign: "left" }}>
            <div className="print-sig-line" style={{ borderTop: "1px dashed #333333", width: "200px", height: "1px", marginBottom: "6px" }}></div>
            <div className="print-sig-label">হিসাবরক্ষক / ক্যাশিয়ার স্বাক্ষর</div>
            <div className="print-sig-note">Sharma Pharmacy - Visa & Passport Accounts</div>
          </div>
          <div className="print-sig-box print-sig-box-right" style={{ width: "220px", textAlign: "right", marginLeft: "auto" }}>
            <div className="print-sig-line" style={{ borderTop: "1px dashed #333333", width: "200px", height: "1px", marginBottom: "6px", marginLeft: "auto" }}></div>
            <div className="print-sig-label">ম্যানেজার / স্বত্বাধিকারী অনুমোদন</div>
            <div className="print-sig-note">ভিসা ও পাসপোর্ট অনুমোদিত হিসাব বিবরণী</div>
          </div>
        </div>
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

      {/* MODAL 3: VIEW TRANSACTIONS HISTORY FOR TRACKING NUMBER */}
      {viewingTransactionsItem && (
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
          onClick={() => setViewingTransactionsItem(null)}
        >
          <div
            className="modal-container"
            style={{
              background: "var(--bg-modal)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: "880px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              position: "relative",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                    লেনদেন হিস্ট্রি ও লেজার (Transaction History)
                  </h2>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 800,
                      color: viewingTransactionsItem.moduleType === "passport" ? "#10b981" : "#6366f1",
                      background: viewingTransactionsItem.moduleType === "passport" ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                      padding: "3px 10px",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                    }}
                  >
                    {viewingTransactionsItem.referenceId}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: viewingTransactionsItem.moduleType === "passport" ? "rgba(16, 185, 129, 0.12)" : "rgba(99, 102, 241, 0.12)",
                      color: viewingTransactionsItem.moduleType === "passport" ? "#34d399" : "#818cf8",
                    }}
                  >
                    {viewingTransactionsItem.moduleType === "passport" ? <BookOpen size={11} /> : <Plane size={11} />}
                    <span>{viewingTransactionsItem.moduleLabel}</span>
                  </span>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                  আবেদনকারী: <strong style={{ color: "var(--text-main)" }}>{viewingTransactionsItem.applicantName}</strong>
                  {viewingTransactionsItem.phone && viewingTransactionsItem.phone !== "—" && (
                    <span style={{ marginLeft: "12px", color: "var(--text-muted)" }}>
                      📞 {viewingTransactionsItem.phone}
                    </span>
                  )}
                  {viewingTransactionsItem.serviceTitle && (
                    <span style={{ marginLeft: "12px", color: "var(--text-muted)" }}>
                      • {viewingTransactionsItem.serviceTitle}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingTransactionsItem(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Financial Summary Badges inside Modal */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>মোট ফাইল চুক্তি</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>
                  ৳ {(viewingTransactionsItem.totalAmount || 0).toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{ padding: "10px 12px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                <div style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: 600 }}>মোট আদায় / জমা (In)</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#34d399", marginTop: "2px" }}>
                  +৳ {(viewingTransactionsItem.inAmount || 0).toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{ padding: "10px 12px", background: "rgba(239, 68, 68, 0.08)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                <div style={{ fontSize: "0.72rem", color: "#f87171", fontWeight: 600 }}>মোট ফাইল খরচ (Out)</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f87171", marginTop: "2px" }}>
                  -৳ {(viewingTransactionsItem.outAmount || 0).toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{ padding: "10px 12px", background: "rgba(14, 165, 233, 0.08)", borderRadius: "8px", border: "1px solid rgba(14, 165, 233, 0.25)" }}>
                <div style={{ fontSize: "0.72rem", color: "#38bdf8", fontWeight: 600 }}>নিট লাভ (Profit)</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#38bdf8", marginTop: "2px" }}>
                  {((viewingTransactionsItem.profit ?? (viewingTransactionsItem.inAmount - viewingTransactionsItem.outAmount)) >= 0 ? "+" : "")}
                  ৳ {((viewingTransactionsItem.profit ?? (viewingTransactionsItem.inAmount - viewingTransactionsItem.outAmount))).toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{ padding: "10px 12px", background: "rgba(245, 158, 11, 0.08)", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                <div style={{ fontSize: "0.72rem", color: "#fbbf24", fontWeight: 600 }}>অবশিষ্ট বকেয়া (Due)</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: viewingTransactionsItem.dueAmount > 0 ? "#fbbf24" : "#34d399", marginTop: "2px" }}>
                  ৳ {(viewingTransactionsItem.dueAmount || 0).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Transactions History Table */}
            <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--border-subtle)", borderRadius: "8px", background: "var(--bg-card)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--border-subtle)", position: "sticky", top: 0, zIndex: 1 }}>
                    <th style={{ padding: "9px 10px", color: "var(--text-muted)", fontWeight: 600 }}>#</th>
                    <th style={{ padding: "9px 10px", color: "var(--text-muted)", fontWeight: 600 }}>তারিখ ও সময়</th>
                    <th style={{ padding: "9px 10px", color: "var(--text-muted)", fontWeight: 600 }}>ভাউচার / আইডি</th>
                    <th style={{ padding: "9px 10px", color: "var(--text-muted)", fontWeight: 600 }}>ধরন</th>
                    <th style={{ padding: "9px 10px", color: "var(--text-muted)", fontWeight: 600 }}>খাত ও বিবরণ</th>
                    <th style={{ padding: "9px 10px", color: "var(--text-muted)", fontWeight: 600 }}>মাধ্যম</th>
                    <th style={{ padding: "9px 10px", color: "#34d399", fontWeight: 700, textAlign: "right" }}>জমা (Cash In)</th>
                    <th style={{ padding: "9px 10px", color: "#f87171", fontWeight: 700, textAlign: "right" }}>খরচ (Expense)</th>
                    <th style={{ padding: "9px 10px", color: "var(--text-muted)", fontWeight: 600 }}>মন্তব্য / নোট</th>
                    <th style={{ padding: "9px 10px", color: "var(--text-muted)", fontWeight: 600 }}>লিপিবদ্ধকারী</th>
                    <th style={{ padding: "9px 10px", color: "var(--text-muted)", fontWeight: 600, textAlign: "center" }}>একশন</th>
                  </tr>
                </thead>
                <tbody>
                  {(!viewingTransactionsItem.transactions || viewingTransactionsItem.transactions.length === 0) ? (
                    <tr>
                      <td colSpan={11} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                        কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    viewingTransactionsItem.transactions.map((tx, idx) => {
                      const tDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
                      const td = isNaN(tDate.getTime()) ? "--" : String(tDate.getDate()).padStart(2, "0");
                      const tm = isNaN(tDate.getTime()) ? "--" : String(tDate.getMonth() + 1).padStart(2, "0");
                      const ty = isNaN(tDate.getTime()) ? "----" : tDate.getFullYear();
                      const fDate = isNaN(tDate.getTime()) ? "—" : `${td}/${tm}/${ty}`;
                      const fTime = isNaN(tDate.getTime())
                        ? ""
                        : tDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
                      const isCol = tx.entryType === "collection" || tx.inAmount > 0;

                      return (
                        <tr
                          key={tx.id || idx}
                          style={{
                            borderBottom: "1px solid var(--border-subtle)",
                            background: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)",
                          }}
                        >
                          <td style={{ padding: "9px 10px", color: "var(--text-muted)", fontWeight: 700 }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                            <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{fDate}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{fTime}</div>
                          </td>
                          <td style={{ padding: "9px 10px", fontFamily: "var(--font-mono, monospace)", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                            {tx.transactionNumber || tx.referenceId || "—"}
                          </td>
                          <td style={{ padding: "9px 10px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                padding: "2px 8px",
                                borderRadius: "999px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                background: isCol ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                color: isCol ? "#34d399" : "#f87171",
                              }}
                            >
                              {isCol ? "জমা (In)" : "খরচ (Out)"}
                            </span>
                          </td>
                          <td style={{ padding: "9px 10px", color: "var(--text-main)", fontWeight: 600 }}>
                            {tx.category || (isCol ? "কিস্তি / জমা" : "ফাইল খরচ")}
                          </td>
                          <td style={{ padding: "9px 10px", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "capitalize" }}>
                            {tx.paymentMethod === "cash" ? "ক্যাশ" : tx.paymentMethod === "bank" ? "ব্যাংক" : tx.paymentMethod === "bkash" ? "বিকাশ" : tx.paymentMethod || "ক্যাশ"}
                          </td>
                          <td style={{ padding: "9px 10px", textAlign: "right" }}>
                            {tx.inAmount > 0 ? (
                              <span style={{ fontWeight: 800, color: "#34d399" }}>
                                +৳ {tx.inAmount.toLocaleString("en-IN")}
                              </span>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "9px 10px", textAlign: "right" }}>
                            {tx.outAmount > 0 ? (
                              <span style={{ fontWeight: 800, color: "#f87171" }}>
                                -৳ {tx.outAmount.toLocaleString("en-IN")}
                              </span>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "9px 10px", color: "var(--text-muted)", fontSize: "0.75rem", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.notes || ""}>
                            {tx.notes || "—"}
                          </td>
                          <td style={{ padding: "9px 10px", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                            {tx.createdByName || "সিস্টেম"}
                          </td>
                          <td style={{ padding: "9px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", gap: "5px", alignItems: "center" }}>
                              <button
                                onClick={() => setSelectedEntry(tx)}
                                className="btn-secondary btn-sm"
                                style={{
                                  padding: "3px 7px",
                                  fontSize: "0.72rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                                title="এই লেনদেনের মানি রিসিট দেখুন"
                              >
                                <Eye size={12} />
                                <span>রিসিট</span>
                              </button>
                              {tx.isTransactionRecord && (
                                <button
                                  onClick={() => handleDeleteTransaction(tx.id, tx.referenceId)}
                                  style={{
                                    background: "rgba(239, 68, 68, 0.12)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    color: "#f87171",
                                    padding: "3px 6px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "0.72rem",
                                  }}
                                  title="এই লেনদেন মুছুন"
                                >
                                  <Trash2 size={12} />
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

            {/* Modal Footer Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                মোট লেনদেন সংখ্যা: <strong style={{ color: "var(--text-main)" }}>{viewingTransactionsItem.transactions?.length || 0} টি</strong>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    // Prepopulate Add Modal with this file's referenceId
                    setFormRefId(viewingTransactionsItem.referenceId);
                    setFormApplicantName(viewingTransactionsItem.applicantName);
                    setFormPhone(viewingTransactionsItem.phone !== "—" ? viewingTransactionsItem.phone : "");
                    setFormServiceTitle(viewingTransactionsItem.serviceTitle);
                    setFormModuleType(viewingTransactionsItem.moduleType);
                    setViewingTransactionsItem(null);
                    setShowAddModal(true);
                  }}
                  className="btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", padding: "6px 14px" }}
                >
                  <Plus size={14} />
                  <span>+ নতুন লেনদেন এন্ট্রি দিন</span>
                </button>
                <button
                  onClick={() => setViewingTransactionsItem(null)}
                  className="btn-secondary btn-sm"
                  style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
