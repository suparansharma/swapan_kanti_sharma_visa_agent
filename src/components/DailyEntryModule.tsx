"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  ArrowUpRight,
  User,
  Phone,
  Hash,
  X,
  Wallet,
} from "lucide-react";

export interface DailyEntryItem {
  id: string;
  referenceId: string;
  moduleType: "passport" | "visa";
  moduleLabel: string;
  applicantName: string;
  phone: string;
  nidOrPassportNo: string;
  serviceTitle: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: "paid" | "partial" | "due";
  status: string;
  createdAt: string;
  createdByName: string;
  notes?: string;
}

interface SummaryData {
  today: {
    contract: number;
    paid: number;
    due: number;
    passportCount: number;
    visaCount: number;
    totalCount: number;
  };
  filtered: {
    contract: number;
    paid: number;
    due: number;
    totalCount: number;
  };
}

export default function DailyEntryModule() {
  const [entries, setEntries] = useState<DailyEntryItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilterType, setDateFilterType] = useState<
    "today" | "yesterday" | "this_week" | "this_month" | "all" | "custom"
  >("today");
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [moduleFilter, setModuleFilter] = useState<"all" | "passport" | "visa">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "partial" | "due">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal: View Money Receipt / Voucher
  const [selectedEntry, setSelectedEntry] = useState<DailyEntryItem | null>(null);

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
  }, [startDate, endDate, moduleFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDailyEntries();
  };

  const handlePrintDailySheet = () => {
    window.print();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
              দৈনিক হিসাব খাতা (Daily Entry Ledger)
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
            পাসপোর্ট ও ভিসা এন্ট্রির নগদ জমা, মোট চুক্তি এবং বকেয়া টাকার দৈনিক ক্যাশবুক
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={fetchDailyEntries}
            className="btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              fontSize: "0.85rem",
            }}
            title="তথ্য রিফ্রেশ করুন"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            onClick={handlePrintDailySheet}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              fontWeight: 700,
              fontSize: "0.88rem",
            }}
          >
            <Printer size={16} />
            <span>দৈনিক হিসাব প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div
        className="print-summary-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* 1. Today's Total Contract */}
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
              আজকের মোট বিল / চুক্তি
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
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "#818cf8", marginTop: "10px" }}>
            ৳ {(summary?.today.contract || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
            আজ সম্পন্ন হওয়া মোট কাজের মূল্য
          </div>
        </div>

        {/* 2. Today's Collected Amount (Cash In) */}
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
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "#34d399", marginTop: "10px" }}>
            ৳ {(summary?.today.paid || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "#34d399", marginTop: "4px", fontWeight: 600 }}>
            আজ ক্যাশে বা একাউন্টে জমা হয়েছে
          </div>
        </div>

        {/* 3. Today's Due Amount */}
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
              আজকের বকেয়া টাকা (Due)
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
              <AlertCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "#fbbf24", marginTop: "10px" }}>
            ৳ {(summary?.today.due || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
            আজকের ফাইলের মধ্যে পাওনা টাকা
          </div>
        </div>

        {/* 4. Today's Count */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            borderLeft: "4px solid #38bdf8",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              আজকের মোট ফাইল এন্ট্রি
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(56, 189, 248, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
              }}
            >
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "var(--text-main)", marginTop: "10px" }}>
            {summary?.today.totalCount || 0} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>টি</span>
          </div>
          <div style={{ fontSize: "0.74rem", color: "#38bdf8", marginTop: "4px", fontWeight: 600 }}>
            পাসপোর্ট: {summary?.today.passportCount || 0} &bull; ভিসা: {summary?.today.visaCount || 0}
          </div>
        </div>
      </div>

      {/* FILTER & DATE CONTROLS BAR */}
      <div
        className="glass-panel no-print"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Top Filter Row: Presets & Module Tabs */}
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
              তারিখ নির্বাচন:
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
                transition: "all 0.15s ease",
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
                transition: "all 0.15s ease",
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
                transition: "all 0.15s ease",
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
                transition: "all 0.15s ease",
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
                transition: "all 0.15s ease",
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
                transition: "all 0.15s ease",
              }}
            >
              কাস্টম রেঞ্জ
            </button>
          </div>

          {/* Module Filter Pills */}
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
              onClick={() => setModuleFilter("all")}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "none",
                background: moduleFilter === "all" ? "rgba(99, 102, 241, 0.25)" : "transparent",
                color: moduleFilter === "all" ? "#818cf8" : "var(--text-secondary)",
                fontWeight: moduleFilter === "all" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              সকল এন্ট্রি
            </button>
            <button
              onClick={() => setModuleFilter("passport")}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "none",
                background: moduleFilter === "passport" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                color: moduleFilter === "passport" ? "#34d399" : "var(--text-secondary)",
                fontWeight: moduleFilter === "passport" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              📘 শুধু পাসপোর্ট
            </button>
            <button
              onClick={() => setModuleFilter("visa")}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "none",
                background: moduleFilter === "visa" ? "rgba(99, 102, 241, 0.25)" : "transparent",
                color: moduleFilter === "visa" ? "#818cf8" : "var(--text-secondary)",
                fontWeight: moduleFilter === "visa" ? 700 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              ✈️ শুধু ভিসা
            </button>
          </div>
        </div>

        {/* Bottom Filter Row: Custom Dates & Search */}
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
          {/* Custom Date Pickers (visible if custom or specific range) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
              <option value="paid">✅ সম্পূর্ণ পরিশোধিত</option>
              <option value="partial">⚠️ আংশিক জমা (বকেয়া আছে)</option>
              <option value="due">❌ সম্পূর্ণ বকেয়া</option>
            </select>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: "1", maxWidth: "360px" }}>
            <div style={{ position: "relative", width: "100%" }}>
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
                placeholder="নাম, মোবাইল, আইডি দিয়ে খুঁজুন..."
                className="input-field"
                style={{ paddingLeft: "36px", height: "38px", fontSize: "0.82rem" }}
              />
            </div>
            <button type="submit" className="btn-secondary" style={{ height: "38px", padding: "0 14px", fontSize: "0.8rem" }}>
              সার্চ
            </button>
          </form>
        </div>
      </div>

      {/* FILTERED STATEMENT SUMMARY BAR */}
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
            বর্তমান তালিকায় মোট এন্ট্রি: <strong style={{ color: "var(--text-main)" }}>{summary?.filtered.totalCount || entries.length} টি</strong>
          </span>
          <span style={{ color: "var(--border-subtle)" }}>|</span>
          <span style={{ color: "var(--text-secondary)" }}>
            মোট চুক্তি: <strong style={{ color: "#818cf8" }}>৳ {(summary?.filtered.contract || 0).toLocaleString("en-IN")}</strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div>
            মোট জমা (নগদ): <strong style={{ color: "#34d399" }}>৳ {(summary?.filtered.paid || 0).toLocaleString("en-IN")}</strong>
          </div>
          <div>
            মোট বকেয়া: <strong style={{ color: "#fbbf24" }}>৳ {(summary?.filtered.due || 0).toLocaleString("en-IN")}</strong>
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
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>রেফারেন্স আইডি</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>মডিউল</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>আবেদনকারীর নাম ও মোবাইল</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>কাজের বিবরণ</th>
                <th style={{ padding: "14px 18px", color: "#818cf8", fontWeight: 700 }}>মোট চুক্তি (বিল)</th>
                <th style={{ padding: "14px 18px", color: "#34d399", fontWeight: 700 }}>জমা টাকা (নগদ)</th>
                <th style={{ padding: "14px 18px", color: "#fbbf24", fontWeight: 700 }}>বকেয়া টাকা</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>পেমেন্ট অবস্থা</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600 }}>এন্ট্রি করেছেন</th>
                <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }} className="no-print">
                  রিসিট
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>দৈনিক হিসাব লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: "50px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ maxWidth: "340px", margin: "0 auto" }}>
                      <Wallet size={36} style={{ color: "var(--text-muted)", marginBottom: "12px", opacity: 0.5 }} />
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                        কোনো লেনদেন পাওয়া যায়নি
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "6px" }}>
                        নির্বাচিত তারিখ বা ফিল্টারে কোনো পাসপোর্ট বা ভিসা লেনদেন এন্ট্রি নেই।
                      </p>
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

                      {/* Reference ID */}
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
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

                      {/* Service Title */}
                      <td style={{ padding: "14px 18px" }}>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-main)",
                            maxWidth: "240px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={item.serviceTitle}
                        >
                          {item.serviceTitle}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          NID/পাসপোর্ট: {item.nidOrPassportNo}
                        </div>
                      </td>

                      {/* Total Billing */}
                      <td style={{ padding: "14px 18px", fontWeight: 800, color: "#818cf8", fontSize: "0.95rem" }}>
                        ৳ {item.totalAmount.toLocaleString("en-IN")}
                      </td>

                      {/* Paid Amount */}
                      <td style={{ padding: "14px 18px", fontWeight: 800, color: "#34d399", fontSize: "0.95rem" }}>
                        ৳ {item.paidAmount.toLocaleString("en-IN")}
                      </td>

                      {/* Due Amount */}
                      <td style={{ padding: "14px 18px" }}>
                        <div
                          style={{
                            fontWeight: 800,
                            color: item.dueAmount > 0 ? "#fbbf24" : "#34d399",
                            fontSize: "0.95rem",
                          }}
                        >
                          ৳ {item.dueAmount.toLocaleString("en-IN")}
                        </div>
                      </td>

                      {/* Payment Status Badge */}
                      <td style={{ padding: "14px 18px" }}>
                        {item.paymentStatus === "paid" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "#34d399",
                              background: "rgba(16, 185, 129, 0.12)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            <CheckCircle2 size={11} />
                            পরিশোধিত
                          </span>
                        ) : item.paymentStatus === "partial" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "#fbbf24",
                              background: "rgba(245, 158, 11, 0.12)",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            <Clock size={11} />
                            আংশিক জমা
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "#f87171",
                              background: "rgba(239, 68, 68, 0.12)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            <AlertCircle size={11} />
                            বকেয়া রয়েছে
                          </span>
                        )}
                      </td>

                      {/* Created By */}
                      <td style={{ padding: "14px 18px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{item.createdByName}</div>
                      </td>

                      {/* Action: Voucher */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }} className="no-print">
                        <button
                          onClick={() => setSelectedEntry(item)}
                          className="btn-secondary btn-sm"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 10px",
                            fontSize: "0.78rem",
                          }}
                          title="মানি রিসিট ভাউচার দেখুন"
                        >
                          <Eye size={13} />
                          <span>রিসিট</span>
                        </button>
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
        <div className="print-signature-box">
          ক্যাশিয়ার / হিসাবরক্ষক স্বাক্ষর
        </div>
        <div className="print-signature-box">
          ম্যানেজার / অনুমোদিত স্বাক্ষর
        </div>
      </div>

      {/* MODAL: MONEY RECEIPT VOUCHER */}
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
                  গ্লোবাল ভিসা ও পাসপোর্ট ম্যানেজমেন্ট এজেন্সি &bull; মানি রিসিট
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
                <span style={{ color: "var(--text-muted)" }}>ভাউচার / রেফারেন্স নং:</span>
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

            {/* Client Info */}
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
                <span style={{ color: "var(--text-secondary)" }}>NID / পাসপোর্ট নং:</span>
                <span style={{ fontFamily: "monospace", color: "var(--text-main)" }}>
                  {selectedEntry.nidOrPassportNo}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>সেবার ধরন:</span>
                <span style={{ color: "#818cf8", fontWeight: 600, textAlign: "right" }}>
                  {selectedEntry.serviceTitle}
                </span>
              </div>
            </div>

            {/* Financial Breakdown */}
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
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>মোট চুক্তি ফি (Contract Bill):</span>
                <span style={{ fontWeight: 800, color: "var(--text-main)" }}>
                  ৳ {selectedEntry.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                <span style={{ color: "#34d399", fontWeight: 700 }}>জমা দেওয়া টাকা (Paid Cash):</span>
                <span style={{ fontWeight: 800, color: "#34d399" }}>
                  ৳ {selectedEntry.paidAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                <span style={{ color: selectedEntry.dueAmount > 0 ? "#fbbf24" : "#34d399", fontWeight: 700 }}>
                  অবশিষ্ট বকেয়া (Due Amount):
                </span>
                <span style={{ fontWeight: 900, color: selectedEntry.dueAmount > 0 ? "#fbbf24" : "#34d399" }}>
                  ৳ {selectedEntry.dueAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

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
                <span>রিসিট প্রিন্ট করুন</span>
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
