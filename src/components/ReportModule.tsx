"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  Printer,
  FileText,
  Plane,
  BookOpen,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Check,
} from "lucide-react";
import { PASSPORT_TYPE_OPTIONS } from "@/components/PassportEntryModule";
import {
  getVisaStatusBadge,
  VISA_GENERAL_STATUSES,
  VISA_MEDICAL_STATUSES,
} from "@/constants/visaStatuses";

interface ReportSummary {
  totalApplications: number;
  totalBilling: number;
  totalCollected: number;
  totalDue: number;
  passport: {
    count: number;
    billing: number;
    collected: number;
    due: number;
  };
  visa: {
    count: number;
    billing: number;
    collected: number;
    due: number;
  };
}

interface ReportModuleProps {
  initialSection?: "all" | "passport" | "visa";
}

export default function ReportModule({ initialSection = "all" }: ReportModuleProps) {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"all" | "due" | "paid">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Passport specific filters
  const [passportStatus, setPassportStatus] = useState("all");
  const [passportType, setPassportType] = useState("all");

  // Visa specific filters
  const [visaStatus, setVisaStatus] = useState("all");
  const [destinationCountry, setDestinationCountry] = useState("all");
  const [serviceType, setServiceType] = useState("all");

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [passportList, setPassportList] = useState<any[]>([]);
  const [visaList, setVisaList] = useState<any[]>([]);

  // Pre-set date ranges
  const setQuickRange = (range: "today" | "this_month" | "all") => {
    const today = new Date();
    if (range === "today") {
      const formatted = today.toISOString().split("T")[0];
      setStartDate(formatted);
      setEndDate(formatted);
    } else if (range === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const formatted = today.toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(formatted);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("moduleType", initialSection);
      if (paymentStatus !== "all") params.append("paymentStatus", paymentStatus);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      if (initialSection === "passport") {
        if (passportStatus !== "all") params.append("status", passportStatus);
        if (passportType !== "all") params.append("passportType", passportType);
      } else if (initialSection === "visa") {
        if (visaStatus !== "all") params.append("status", visaStatus);
        if (destinationCountry !== "all") params.append("destinationCountry", destinationCountry);
        if (serviceType !== "all") params.append("serviceType", serviceType);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setPassportList(data.passportList || []);
        setVisaList(data.visaList || []);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [
    initialSection,
    paymentStatus,
    startDate,
    endDate,
    passportStatus,
    passportType,
    visaStatus,
    destinationCountry,
    serviceType,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handlePrint = () => {
    window.print();
  };

  // CSV Export
  const handleExportCSV = () => {
    let rows: string[][] = [];
    if (initialSection === "passport" || initialSection === "all") {
      rows.push(["--- PASSPORT ENTRIES REPORT ---"]);
      rows.push(["Entry No", "Name", "Mobile", "NID", "Online Track ID", "Passport Type", "Total (BDT)", "Paid (BDT)", "Due (BDT)", "Status", "Date"]);
      passportList.forEach((p) => {
        rows.push([
          p.entryNumber,
          `"${p.name}"`,
          p.mobile,
          p.nid,
          p.onlineTrackId || "N/A",
          `"${p.passportType}"`,
          String(p.totalAmount || 0),
          String(p.paidAmount || 0),
          String(p.dueAmount || 0),
          p.status,
          new Date(p.createdAt).toLocaleDateString(),
        ]);
      });
    }

    if (initialSection === "visa" || initialSection === "all") {
      if (initialSection === "all") rows.push([]);
      rows.push(["--- VISA APPLICATIONS REPORT ---"]);
      rows.push(["Tracking ID", "Applicant", "Passport No", "Phone", "Country", "Service Type", "Total (BDT)", "Paid (BDT)", "Due (BDT)", "Status", "Date"]);
      visaList.forEach((v) => {
        const total = Number(v.totalAmount ?? v.feeAmount) || 0;
        const paid = Number(v.paidAmount ?? (v.feeStatus === "paid" ? total : 0)) || 0;
        const due = Number(v.dueAmount ?? Math.max(0, total - paid)) || 0;
        rows.push([
          v.trackingId,
          `"${v.applicantName}"`,
          v.passportNumber,
          v.phone,
          v.destinationCountry,
          v.serviceType,
          String(total),
          String(paid),
          String(due),
          v.status,
          new Date(v.createdAt).toLocaleDateString(),
        ]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const prefix = initialSection === "passport" ? "Passport_Report" : initialSection === "visa" ? "Visa_Report" : "Agency_All_Report";
    link.setAttribute("download", `${prefix}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPassportTypeLabel = (val: string) => {
    const found = PASSPORT_TYPE_OPTIONS.find((o) => o.value === val);
    const raw = found ? found.label : val;
    return raw ? raw.replace(/^[০-৯\d]+\.\s*/, "") : "";
  };

  const getStatusBadge = (s: string) => {
    if (s === "police_verification") {
      return { label: "পুলিশ ভেরিফিকেশন", bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" };
    }
    return getVisaStatusBadge(s);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* OFFICIAL LETTERHEAD FOR PRINT ONLY */}
      <div
        className="print-header"
        style={{
          display: "none",
          paddingBottom: "16px",
          borderBottom: "2px solid #0f172a",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "20pt", fontWeight: 900, color: "#0f172a", margin: 0, textTransform: "uppercase" }}>
              SHARMA TRAVELS & VISA AGENCY
            </h1>
            <p style={{ fontSize: "10pt", color: "#334155", margin: "4px 0 0 0" }}>
              সরকারি ও আন্তর্জাতিক ভিসা প্রসেসিং, পাসপোর্ট এন্ট্রি ও এম্বাসি কনসালটেন্সি সার্ভিস
            </p>
            <p style={{ fontSize: "9pt", color: "#64748b", margin: "2px 0 0 0" }}>
              ফোন: +880 1700-000000 | ওয়েবসাইট: sharmavisa.com | ঢাকা, বাংলাদেশ
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 10px",
                border: "1.5px solid #0f172a",
                fontWeight: 800,
                fontSize: "10pt",
                textTransform: "uppercase",
              }}
            >
              {initialSection === "passport" && "PASSPORT OFFICIAL STATEMENT"}
              {initialSection === "visa" && "VISA OFFICIAL STATEMENT"}
              {initialSection === "all" && "AGENCY FINANCIAL STATEMENT"}
            </div>
            <div style={{ fontSize: "8.5pt", color: "#475569", marginTop: "6px" }}>
              প্রিন্টের তারিখ: {new Date().toLocaleDateString("bn-BD")}
            </div>
            {startDate || endDate ? (
              <div style={{ fontSize: "8pt", color: "#475569" }}>
                মেয়াদ: {startDate || "শুরু"} হতে {endDate || "বর্তমান"}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* HEADER SECTION (SCREEN VIEW) */}
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
              {initialSection === "passport" && "পাসপোর্ট হিসাব ও স্টেটমেন্ট রিপোর্ট"}
              {initialSection === "visa" && "ভিসা ফাইল ও আর্থিক লেনদেন রিপোর্ট"}
              {initialSection === "all" && "সকল মডিউলের সমন্বিত রিপোর্ট (All Reports)"}
            </h1>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background:
                  initialSection === "passport"
                    ? "rgba(56, 189, 248, 0.15)"
                    : initialSection === "visa"
                    ? "rgba(129, 140, 248, 0.15)"
                    : "rgba(16, 185, 129, 0.15)",
                color:
                  initialSection === "passport"
                    ? "#38bdf8"
                    : initialSection === "visa"
                    ? "#818cf8"
                    : "#34d399",
                fontSize: "0.76rem",
                fontWeight: 700,
              }}
            >
              {initialSection === "passport" && "Passport Specific"}
              {initialSection === "visa" && "Visa Specific"}
              {initialSection === "all" && "Combined Report"}
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
            {initialSection === "passport" &&
              "শুধুমাত্র পাসপোর্ট এন্ট্রি, ধরনভিত্তিক আবেদন, মোট চুক্তি, আদায় ও বকেয়া হিসাব"}
            {initialSection === "visa" &&
              "শুধুমাত্র ভিসা ফাইল, দেশ ও সার্ভিসভিত্তিক আবেদন, মোট চুক্তি, আদায় ও বকেয়া হিসাব"}
            {initialSection === "all" &&
              "পাসপোর্ট ও ভিসা উভয় মডিউলের সার্বিক সামারি ও আর্থিক স্টেটমেন্ট"}
          </p>
        </div>

        {/* Top Actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => fetchReports()}
            className="btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>রিফ্রেশ</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title="CSV এক্সপোর্ট করুন"
          >
            <Download size={14} />
            <span>CSV এক্সপোর্ট</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px" }}
            title="প্রিন্ট করুন"
          >
            <Printer size={15} />
            <span>প্রিন্ট রিপোর্ট</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR: CUSTOMIZED SPECIFICALLY FOR THE ACTIVE MODULE */}
      <div
        className="glass-panel no-print"
        style={{
          padding: "18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>
            <Filter size={16} color="#818cf8" />
            <span>
              {initialSection === "passport" && "পাসপোর্ট ফর্ম ফিল্টারসমূহ:"}
              {initialSection === "visa" && "ভিসা ফর্ম ফিল্টারসমূহ:"}
              {initialSection === "all" && "রিপোর্ট ফিল্টারিং অপশন:"}
            </span>
          </div>

          {/* Quick Date Range Buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setQuickRange("today")}
              className="btn-secondary btn-sm"
              style={{ fontSize: "0.76rem", padding: "5px 10px" }}
            >
              আজকের হিসাব
            </button>
            <button
              onClick={() => setQuickRange("this_month")}
              className="btn-secondary btn-sm"
              style={{ fontSize: "0.76rem", padding: "5px 10px" }}
            >
              চলতি মাস
            </button>
            <button
              onClick={() => setQuickRange("all")}
              className="btn-secondary btn-sm"
              style={{ fontSize: "0.76rem", padding: "5px 10px" }}
            >
              সব সময়
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              নাম / মোবাইল / আইডি অনুসন্ধান
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  initialSection === "passport"
                    ? "নাম, মোবাইল, NID বা Online Track ID"
                    : initialSection === "visa"
                    ? "নাম, পাসপোর্ট নম্বর, ফোন বা ট্র্যাকিং আইডি"
                    : "অনুসন্ধান করুন..."
                }
                className="input-field"
                style={{ height: "38px", fontSize: "0.85rem" }}
              />
              <button type="submit" className="btn-secondary" style={{ height: "38px", padding: "0 12px" }}>
                <Search size={14} />
              </button>
            </div>
          </form>

          {/* PASSPORT SPECIFIC FILTERS */}
          {initialSection === "passport" && (
            <>
              {/* Passport Type Filter */}
              <div style={{ flex: "1 1 220px" }}>
                <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  পাসপোর্ট ধরন (Passport Type)
                </label>
                <select
                  value={passportType}
                  onChange={(e) => setPassportType(e.target.value)}
                  className="input-field"
                  style={{ height: "38px", fontSize: "0.82rem", padding: "0 10px" }}
                >
                  <option value="all">সকল ধরন (১২টি ক্যাটাগরি)</option>
                  {PASSPORT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Passport Status Filter */}
              <div style={{ flex: "1 1 160px" }}>
                <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  পাসপোর্ট স্ট্যাটাস
                </label>
                <select
                  value={passportStatus}
                  onChange={(e) => setPassportStatus(e.target.value)}
                  className="input-field"
                  style={{ height: "38px", fontSize: "0.85rem", padding: "0 10px" }}
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <option value="submitted">আবেদন জমা</option>
                  <option value="biometric_pending">বায়োমেট্রিক বাকি</option>
                  <option value="police_verification">পুলিশ ভেরিফিকেশন</option>
                  <option value="ready_for_pickup">পাসপোর্ট রেডি</option>
                  <option value="delivered">ডেলিভারি সম্পন্ন</option>
                </select>
              </div>
            </>
          )}

          {/* VISA SPECIFIC FILTERS */}
          {initialSection === "visa" && (
            <>
              {/* Country Filter */}
              <div style={{ flex: "1 1 160px" }}>
                <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  গন্তব্য দেশ
                </label>
                <select
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                  className="input-field"
                  style={{ height: "38px", fontSize: "0.85rem", padding: "0 10px" }}
                >
                  <option value="all">সকল দেশ</option>
                  <option value="India">ভারত (India)</option>
                  <option value="Saudi Arabia">সৌদি আরব</option>
                  <option value="UAE">সংযুক্ত আরব আমিরাত</option>
                  <option value="Malaysia">মালয়েশিয়া</option>
                  <option value="Singapore">সিঙ্গাপুর</option>
                  <option value="Thailand">থাইল্যান্ড</option>
                  <option value="Canada">কানাডা</option>
                  <option value="UK">যুক্তরাজ্য</option>
                  <option value="USA">যুক্তরাষ্ট্র</option>
                  <option value="Schengen">ইউরোপ/শেঞ্জেন</option>
                </select>
              </div>

              {/* Service Type Filter */}
              <div style={{ flex: "1 1 180px" }}>
                <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  সার্ভিস ধরন
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="input-field"
                  style={{ height: "38px", fontSize: "0.85rem", padding: "0 10px" }}
                >
                  <option value="all">সকল সার্ভিস</option>
                  <option value="tourist_visa">ট্যুরিস্ট ভিসা</option>
                  <option value="medical_visa">মেডিকেল ভিসা</option>
                  <option value="medical_attendant">মেডিকেল এটেন্ডেন্ট</option>
                  <option value="student_visa">স্টুডেন্ট ভিসা</option>
                  <option value="work_permit">ওয়ার্ক পারমিট</option>
                  <option value="business_visa">বিজনেস ভিসা</option>
                </select>
              </div>

              {/* Visa Status Filter */}
              <div style={{ flex: "1 1 160px" }}>
                <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  ভিসা স্ট্যাটাস
                </label>
                <select
                  value={visaStatus}
                  onChange={(e) => setVisaStatus(e.target.value)}
                  className="input-field"
                  style={{ height: "38px", fontSize: "0.85rem", padding: "0 10px" }}
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <optgroup label="সাধারণ স্ট্যাটাস">
                    {VISA_GENERAL_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="মেডিকেল / আয়ুষ স্পেশাল">
                    {VISA_MEDICAL_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </>
          )}

          {/* Payment Status Filter */}
          <div style={{ flex: "1 1 150px" }}>
            <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              লেনদেন / বকেয়া
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as any)}
              className="input-field"
              style={{ height: "38px", fontSize: "0.85rem", padding: "0 10px" }}
            >
              <option value="all">সকল লেনদেন</option>
              <option value="due">বকেয়া আছে (Due Only)</option>
              <option value="paid">পরিশোধ সম্পন্ন (Fully Paid)</option>
            </select>
          </div>

          {/* Date Start */}
          <div style={{ flex: "1 1 130px" }}>
            <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              শুরুর তারিখ
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
              style={{ height: "38px", fontSize: "0.82rem", padding: "0 8px" }}
            />
          </div>

          {/* Date End */}
          <div style={{ flex: "1 1 130px" }}>
            <label style={{ display: "block", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              শেষের তারিখ
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
              style={{ height: "38px", fontSize: "0.82rem", padding: "0 8px" }}
            />
          </div>
        </div>
      </div>

      {/* SUMMARY STAT CARDS */}
      {summary && (
        <div
          className="print-summary-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
          }}
        >
          {/* Card 1: Count */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.84rem", color: "var(--text-muted)", fontWeight: 600 }}>
                {initialSection === "passport" && "মোট পাসপোর্ট এন্ট্রি"}
                {initialSection === "visa" && "মোট ভিসা ফাইল"}
                {initialSection === "all" && "মোট আবেদন সংখ্যা"}
              </span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background:
                    initialSection === "passport"
                      ? "rgba(56, 189, 248, 0.15)"
                      : initialSection === "visa"
                      ? "rgba(129, 140, 248, 0.15)"
                      : "rgba(99, 102, 241, 0.15)",
                  color:
                    initialSection === "passport"
                      ? "#38bdf8"
                      : initialSection === "visa"
                      ? "#818cf8"
                      : "#818cf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {initialSection === "passport" ? (
                  <BookOpen size={18} />
                ) : initialSection === "visa" ? (
                  <Plane size={18} />
                ) : (
                  <FileText size={18} />
                )}
              </div>
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-main)", marginTop: "10px" }}>
              {initialSection === "passport" && `${summary.passport.count.toLocaleString("bn-BD")} টি`}
              {initialSection === "visa" && `${summary.visa.count.toLocaleString("bn-BD")} টি`}
              {initialSection === "all" && `${summary.totalApplications.toLocaleString("bn-BD")} টি`}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              ফিল্টার অনুযায়ী মোট রেকর্ড
            </div>
          </div>

          {/* Card 2: Total Billing */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.84rem", color: "var(--text-muted)", fontWeight: 600 }}>
                মোট চুক্তি বিল (Total Billing)
              </span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-main)", marginTop: "10px" }}>
              ৳{" "}
              {initialSection === "passport"
                ? summary.passport.billing.toLocaleString("en-IN")
                : initialSection === "visa"
                ? summary.visa.billing.toLocaleString("en-IN")
                : summary.totalBilling.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              ধার্যকৃত সর্বমোট বিল
            </div>
          </div>

          {/* Card 3: Collected */}
          <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #34d399" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.84rem", color: "#34d399", fontWeight: 700 }}>
                মোট আদায়কৃত টাকা (Collected)
              </span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#34d399", marginTop: "10px" }}>
              ৳{" "}
              {initialSection === "passport"
                ? summary.passport.collected.toLocaleString("en-IN")
                : initialSection === "visa"
                ? summary.visa.collected.toLocaleString("en-IN")
                : summary.totalCollected.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              নগদ ও ব্যাংক পরিশোধিত
            </div>
          </div>

          {/* Card 4: Due */}
          <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #fbbf24" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.84rem", color: "#fbbf24", fontWeight: 700 }}>
                মোট বকেয়া পাওনা (Due Amount)
              </span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertCircle size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fbbf24", marginTop: "10px" }}>
              ৳{" "}
              {initialSection === "passport"
                ? summary.passport.due.toLocaleString("en-IN")
                : initialSection === "visa"
                ? summary.visa.due.toLocaleString("en-IN")
                : summary.totalDue.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              গ্রাহকদের কাছে বর্তমান বকেয়া
            </div>
          </div>
        </div>
      )}

      {/* TABLE SECTION 1: PASSPORT ONLY (ONLY WHEN initialSection is 'passport' OR 'all') */}
      {(initialSection === "passport" || initialSection === "all") && (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <BookOpen size={18} color="#38bdf8" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                পাসপোর্ট এন্ট্রি রিপোর্ট তালিকা ({passportList.length} টি)
              </h3>
            </div>
            {summary && (
              <div style={{ fontSize: "0.84rem", display: "flex", gap: "14px" }}>
                <span>বিল: <b>৳ {summary.passport.billing.toLocaleString("en-IN")}</b></span>
                <span style={{ color: "#34d399" }}>জমা: <b>৳ {summary.passport.collected.toLocaleString("en-IN")}</b></span>
                <span style={{ color: "#fbbf24" }}>বকেয়া: <b>৳ {summary.passport.due.toLocaleString("en-IN")}</b></span>
              </div>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>এন্ট্রি নং</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>গ্রাহকের নাম</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>মোবাইল</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>NID ও জন্মতারিখ</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>পাসপোর্ট ধরন</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Online Track ID</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>চুক্তি টাকা</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>জমা টাকা</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>বকেয়া টাকা</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>স্ট্যাটাস</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>তারিখ</th>
                </tr>
              </thead>
              <tbody>
                {passportList.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                      কোনো পাসপোর্ট রেকর্ড পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  passportList.map((p) => (
                    <tr key={p._id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#38bdf8" }}>{p.entryNumber}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{p.mobile}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontFamily: "monospace", color: "#a5b4fc", fontSize: "0.8rem" }}>{p.nid}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.birthDate}</div>
                      </td>
                      <td style={{ padding: "12px 16px", maxWidth: "220px" }}>
                        <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                          {getPassportTypeLabel(p.passportType)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {p.onlineTrackId ? (
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 700,
                              color: "#38bdf8",
                              background: "rgba(56, 189, 248, 0.1)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {p.onlineTrackId}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>৳ {Number(p.totalAmount).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#34d399" }}>৳ {Number(p.paidAmount).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: p.dueAmount > 0 ? "#fbbf24" : "#34d399" }}>
                        ৳ {Number(p.dueAmount).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            background: getStatusBadge(p.status).bg,
                            color: getStatusBadge(p.status).color,
                          }}
                        >
                          {getStatusBadge(p.status).label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(p.createdAt).toLocaleDateString("bn-BD")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE SECTION 2: VISA ONLY (ONLY WHEN initialSection is 'visa' OR 'all') */}
      {(initialSection === "visa" || initialSection === "all") && (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Plane size={18} color="#818cf8" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                ভিসা আবেদন রিপোর্ট তালিকা ({visaList.length} টি)
              </h3>
            </div>
            {summary && (
              <div style={{ fontSize: "0.84rem", display: "flex", gap: "14px" }}>
                <span>বিল: <b>৳ {summary.visa.billing.toLocaleString("en-IN")}</b></span>
                <span style={{ color: "#34d399" }}>জমা: <b>৳ {summary.visa.collected.toLocaleString("en-IN")}</b></span>
                <span style={{ color: "#fbbf24" }}>বকেয়া: <b>৳ {summary.visa.due.toLocaleString("en-IN")}</b></span>
              </div>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>ট্র্যাকিং আইডি</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>আবেদনকারীর নাম</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>পাসপোর্ট নং</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>মোবাইল</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>গন্তব্য দেশ</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>সার্ভিস ধরন</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>চুক্তি টাকা</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>জমা টাকা</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>বকেয়া টাকা</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>স্ট্যাটাস</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>তারিখ</th>
                </tr>
              </thead>
              <tbody>
                {visaList.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                      কোনো ভিসা রেকর্ড পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  visaList.map((v) => {
                    const total = Number(v.totalAmount ?? v.feeAmount) || 0;
                    const paid = Number(v.paidAmount ?? (v.feeStatus === "paid" ? total : 0)) || 0;
                    const due = Number(v.dueAmount ?? Math.max(0, total - paid)) || 0;
                    return (
                      <tr key={v._id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#38bdf8" }}>{v.trackingId}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{v.applicantName}</td>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "var(--text-main)" }}>{v.passportNumber}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{v.phone}</td>
                        <td style={{ padding: "12px 16px", color: "#34d399", fontWeight: 600 }}>{v.destinationCountry}</td>
                        <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {v.serviceType === "tourist_visa"
                            ? "ট্যুরিস্ট ভিসা"
                            : v.serviceType === "medical_visa"
                            ? "মেডিকেল ভিসা"
                            : v.serviceType === "medical_attendant"
                            ? "মেডিকেল এটেন্ডেন্ট"
                            : v.serviceType === "student_visa"
                            ? "স্টুডেন্ট ভিসা"
                            : v.serviceType === "work_permit"
                            ? "ওয়ার্ক পারমিট"
                            : v.serviceType}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>৳ {total.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#34d399" }}>৳ {paid.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: due > 0 ? "#fbbf24" : "#34d399" }}>
                          ৳ {due.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              background: getStatusBadge(v.status).bg,
                              color: getStatusBadge(v.status).color,
                            }}
                          >
                            {getStatusBadge(v.status).label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(v.createdAt).toLocaleDateString("bn-BD")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINT FOOTER WITH SIGNATURE BOXES (PRINT ONLY) */}
      <div
        className="print-footer"
        style={{
          display: "none",
          marginTop: "40px",
          paddingTop: "15px",
        }}
      >
        <div className="print-signature-box">
          <div style={{ fontWeight: 700 }}>প্রস্তুতকারক (Prepared By)</div>
          <div style={{ fontSize: "8pt", color: "#64748b" }}>শর্মা ট্রাভেলস & ভিসা এজেন্সি</div>
        </div>

        <div className="print-signature-box">
          <div style={{ fontWeight: 700 }}>অ্যাকাউন্টস অফিসার (Accounts)</div>
          <div style={{ fontSize: "8pt", color: "#64748b" }}>হিসাব বিভাগ</div>
        </div>

        <div className="print-signature-box">
          <div style={{ fontWeight: 700 }}>অনুমোদনকারী (Authorized Signature)</div>
          <div style={{ fontSize: "8pt", color: "#64748b" }}>ম্যানেজিং ডিরেক্টর / স্বত্বাধিকারী</div>
        </div>
      </div>
    </div>
  );
}
