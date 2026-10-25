"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PassportEntryModule from "@/components/PassportEntryModule";
import ReportModule from "@/components/ReportModule";
import {
  Plane,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Search,
  User as UserIcon,
  ShieldCheck,
  RefreshCw,
  Globe,
  Building2,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Phone,
  Eye,
  Edit,
  Check,
  FileCheck,
  ChevronDown,
  ChevronRight,
  BookOpen,
  LayoutDashboard,
  LogOut,
  FolderPlus,
  Settings,
  Menu,
  X,
  CreditCard,
  Briefcase,
  Users,
  BarChart3,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface VisaApplicationItem {
  _id: string;
  trackingId: string;
  applicantName: string;
  passportNumber: string;
  phone: string;
  email?: string;
  destinationCountry: string;
  serviceType: string;
  status: string;
  applicationDate: string;
  estimatedDelivery?: string;
  feeAmount: number;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  feeStatus: "paid" | "partial" | "pending";
  notes?: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab") as
    | "passport_entry"
    | "overview"
    | "visa_applications"
    | "reports"
    | "passport_reports"
    | "visa_reports"
    | null;

  // Active navigation tab
  // Options: 'passport_entry' | 'overview' | 'visa_applications' | 'reports' | 'passport_reports' | 'visa_reports'
  const [activeTab, setActiveTabState] = useState<
    "passport_entry" | "overview" | "visa_applications" | "reports" | "passport_reports" | "visa_reports"
  >(tabFromUrl || "passport_entry");

  // Sync tab with URL
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [tabFromUrl]);

  const setActiveTab = (
    tab:
      | "passport_entry"
      | "overview"
      | "visa_applications"
      | "reports"
      | "passport_reports"
      | "visa_reports"
  ) => {
    setActiveTabState(tab);
    router.push(`/?tab=${tab}`, { scroll: false });
  };

  // Sidebar accordions state
  const [passportOpen, setPassportOpen] = useState(true);
  const [visaOpen, setVisaOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Visa applications state
  const [applications, setApplications] = useState<VisaApplicationItem[]>([]);
  const [visaStats, setVisaStats] = useState({
    total: 0,
    totalContractAmount: 0,
    totalCollectedAmount: 0,
    totalDueAmount: 0,
    approved: 0,
    processing: 0,
    ready: 0,
  });
  const [loadingVisa, setLoadingVisa] = useState(true);
  const [searchVisa, setSearchVisa] = useState("");
  const [filterVisaStatus, setFilterVisaStatus] = useState("all");
  const [showAddVisaModal, setShowAddVisaModal] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState<VisaApplicationItem | null>(null);

  // New Visa form state
  const [applicantName, setApplicantName] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("Canada");
  const [serviceType, setServiceType] = useState("tourist_visa");
  const [status, setStatus] = useState("submitted");
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [feeStatus, setFeeStatus] = useState<"paid" | "partial" | "pending">("pending");
  const [notes, setNotes] = useState("");
  const [creatingVisa, setCreatingVisa] = useState(false);

  // Edit Visa modal state
  const [editingVisa, setEditingVisa] = useState<VisaApplicationItem | null>(null);
  const [editApplicantName, setEditApplicantName] = useState("");
  const [editPassportNumber, setEditPassportNumber] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDestinationCountry, setEditDestinationCountry] = useState("Canada");
  const [editServiceType, setEditServiceType] = useState("tourist_visa");
  const [editStatus, setEditStatus] = useState("submitted");
  const [editTotalAmount, setEditTotalAmount] = useState<number | "">("");
  const [editPaidAmount, setEditPaidAmount] = useState<number | "">("");
  const [editNotes, setEditNotes] = useState("");
  const [updatingVisa, setUpdatingVisa] = useState(false);
  const [editVisaError, setEditVisaError] = useState<string | null>(null);

  // Live calculation of Due Amount in Visa Edit Form
  const numEditVisaTotal = Number(editTotalAmount) || 0;
  const numEditVisaPaid = Number(editPaidAmount) || 0;
  const liveEditVisaDue = Math.max(0, numEditVisaTotal - numEditVisaPaid);

  // Live calculation of Due Amount in Visa Add Form
  const numVisaTotal = Number(totalAmount) || 0;
  const numVisaPaid = Number(paidAmount) || 0;
  const liveVisaDue = Math.max(0, numVisaTotal - numVisaPaid);

  // Fetch Visa Applications
  const fetchVisaApplications = async () => {
    try {
      setLoadingVisa(true);
      const params = new URLSearchParams();
      if (searchVisa.trim()) params.append("search", searchVisa.trim());
      if (filterVisaStatus !== "all") params.append("status", filterVisaStatus);

      const res = await fetch(`/api/visa-applications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        if (data.stats) setVisaStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching visa applications:", err);
    } finally {
      setLoadingVisa(false);
    }
  };

  useEffect(() => {
    fetchVisaApplications();
  }, [filterVisaStatus]);

  // Create Visa Application
  const handleCreateVisa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingVisa(true);
      const res = await fetch("/api/visa-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName,
          passportNumber,
          phone,
          email,
          destinationCountry,
          serviceType,
          status,
          feeAmount: numVisaTotal,
          totalAmount: numVisaTotal,
          paidAmount: numVisaPaid,
          feeStatus,
          notes,
        }),
      });
      if (res.ok) {
        setShowAddVisaModal(false);
        setApplicantName("");
        setPassportNumber("");
        setPhone("");
        setEmail("");
        setTotalAmount("");
        setPaidAmount("");
        setNotes("");
        fetchVisaApplications();
      }
    } catch (err) {
      console.error("Visa create error:", err);
    } finally {
      setCreatingVisa(false);
    }
  };

  // Delete Visa Application
  const handleDeleteVisa = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই ভিসা আবেদনটি মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।")) {
      return;
    }

    try {
      const res = await fetch(`/api/visa-applications?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchVisaApplications();
        if (selectedVisa && selectedVisa._id === id) {
          setSelectedVisa(null);
        }
      } else {
        alert("ভিসা আবেদন মুছে ফেলা সম্ভব হয়নি।");
      }
    } catch (err) {
      console.error("Delete visa error:", err);
      alert("সার্ভার ত্রুটি। আবার চেষ্টা করুন।");
    }
  };

  // Open Edit Visa modal
  const handleOpenEditVisa = (app: VisaApplicationItem) => {
    setEditingVisa(app);
    setEditApplicantName(app.applicantName);
    setEditPassportNumber(app.passportNumber);
    setEditPhone(app.phone);
    setEditEmail(app.email || "");
    setEditDestinationCountry(app.destinationCountry);
    setEditServiceType(app.serviceType);
    setEditStatus(app.status);
    const total = app.totalAmount ?? app.feeAmount ?? 0;
    const paid = app.paidAmount ?? (app.feeStatus === "paid" ? total : 0);
    setEditTotalAmount(total);
    setEditPaidAmount(paid);
    setEditNotes(app.notes || "");
    setEditVisaError(null);
  };

  // Submit Visa Update
  const handleUpdateVisaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisa) return;

    if (!editApplicantName.trim() || !editPassportNumber.trim() || !editPhone.trim() || !editDestinationCountry.trim()) {
      setEditVisaError("দয়া করে নাম, পাসপোর্ট নম্বর, ফোন নম্বর এবং দেশ পূরণ করুন।");
      return;
    }

    try {
      setUpdatingVisa(true);
      const res = await fetch("/api/visa-applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingVisa._id,
          applicantName: editApplicantName.trim(),
          passportNumber: editPassportNumber.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          destinationCountry: editDestinationCountry.trim(),
          serviceType: editServiceType,
          status: editStatus,
          totalAmount: numEditVisaTotal,
          paidAmount: numEditVisaPaid,
          notes: editNotes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingVisa(null);
        fetchVisaApplications();
      } else {
        setEditVisaError(data.error || "আপডেট ব্যর্থ হয়েছে");
      }
    } catch (err) {
      setEditVisaError("সার্ভার সমস্যা, আবার চেষ্টা করুন।");
    } finally {
      setUpdatingVisa(false);
    }
  };

  // Update Visa Status directly from table
  const handleVisaStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/visa-applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchVisaApplications();
      }
    } catch (err) {
      console.error("Visa status update error:", err);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "submitted":
        return { label: "আবেদন জমা", bg: "rgba(99, 102, 241, 0.15)", color: "#818cf8" };
      case "document_verification":
        return { label: "ডকুমেন্ট যাচাই", bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" };
      case "embassy_processing":
        return { label: "এম্বাসি প্রসেসিং", bg: "rgba(14, 165, 233, 0.15)", color: "#38bdf8" };
      case "biometric_pending":
        return { label: "বায়োমেট্রিক স্লট", bg: "rgba(236, 72, 153, 0.15)", color: "#f472b6" };
      case "approved":
        return { label: "ভিসা অনুমোদিত", bg: "rgba(16, 185, 129, 0.2)", color: "#34d399" };
      case "ready_for_pickup":
        return { label: "ডেলিভারি প্রস্তুত", bg: "rgba(16, 185, 129, 0.25)", color: "#10b981" };
      case "delivered":
        return { label: "ডেলিভারি সম্পন্ন", bg: "rgba(59, 130, 246, 0.2)", color: "#60a5fa" };
      default:
        return { label: s, bg: "rgba(255, 255, 255, 0.1)", color: "#ffffff" };
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "calc(100vh - 70px)",
        width: "100%",
        position: "relative",
      }}
    >
      {/* LEFT SIDEBAR */}
      <aside
        style={{
          width: "270px",
          flexShrink: 0,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "24px 16px",
          backdropFilter: "blur(20px)",
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Agency Badge Header in Sidebar */}
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-main)" }}>
                Sharma Agency
              </div>
              <div style={{ fontSize: "0.7rem", color: "#34d399", fontWeight: 600 }}>
                ● Admin Authorized
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Overview Button */}
            <button
              onClick={() => setActiveTab("overview")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: activeTab === "overview" ? "rgba(99, 102, 241, 0.18)" : "transparent",
                color: activeTab === "overview" ? "#a5b4fc" : "var(--text-secondary)",
                fontWeight: activeTab === "overview" ? 700 : 500,
                cursor: "pointer",
                textAlign: "left",
                fontSize: "0.88rem",
                transition: "all 0.15s ease",
              }}
            >
              <LayoutDashboard size={18} style={{ color: activeTab === "overview" ? "#818cf8" : "inherit" }} />
              <span>ড্যাশবোর্ড ওভারভিউ</span>
            </button>

            {/* PASSPORT MODULE ACCORDION */}
            <div style={{ marginTop: "10px" }}>
              {/* Module Header / Toggle */}
              <button
                type="button"
                onClick={() => setPassportOpen(!passportOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "var(--text-main)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <BookOpen size={18} style={{ color: "#38bdf8" }} />
                  <span>পাসপোর্ট মডিউল</span>
                </div>
                {passportOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Sub-modules list */}
              {passportOpen && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    paddingLeft: "16px",
                    marginTop: "4px",
                    borderLeft: "2px solid rgba(56, 189, 248, 0.3)",
                    marginLeft: "18px",
                  }}
                >
                  {/* Passport Entry (ACTIVE PRIMARY SUB-MODULE) */}
                  <button
                    onClick={() => setActiveTab("passport_entry")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background:
                        activeTab === "passport_entry" ? "var(--primary-gradient)" : "transparent",
                      color: activeTab === "passport_entry" ? "#ffffff" : "var(--text-secondary)",
                      fontWeight: activeTab === "passport_entry" ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={15} />
                      <span>Passport Entry</span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: activeTab === "passport_entry" ? "rgba(255, 255, 255, 0.2)" : "rgba(16, 185, 129, 0.15)",
                        color: activeTab === "passport_entry" ? "#fff" : "#34d399",
                        fontWeight: 700,
                      }}
                    >
                      Active
                    </span>
                  </button>

                  {/* Future Passport Submodules (Placeholders to expand easily) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      cursor: "not-allowed",
                    }}
                    title="পরবর্তী ধাপে যুক্ত হবে"
                  >
                    <span>পাসপোর্ট ডেলিভারি</span>
                    <span style={{ fontSize: "0.68rem", color: "#64748b" }}>শীঘ্রই</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      cursor: "not-allowed",
                    }}
                    title="পরবর্তী ধাপে যুক্ত হবে"
                  >
                    <span>পুলিশ ভেরিফিকেশন</span>
                    <span style={{ fontSize: "0.68rem", color: "#64748b" }}>শীঘ্রই</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      cursor: "not-allowed",
                    }}
                    title="পরবর্তী ধাপে যুক্ত হবে"
                  >
                    <span>পাসপোর্ট রিনিউয়াল</span>
                    <span style={{ fontSize: "0.68rem", color: "#64748b" }}>শীঘ্রই</span>
                  </div>
                </div>
              )}
            </div>

            {/* VISA MODULE ACCORDION */}
            <div style={{ marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setVisaOpen(!visaOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "var(--text-main)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Plane size={18} style={{ color: "#818cf8" }} />
                  <span>ভিসা মডিউল</span>
                </div>
                {visaOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {visaOpen && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    paddingLeft: "16px",
                    marginTop: "4px",
                    borderLeft: "2px solid rgba(99, 102, 241, 0.3)",
                    marginLeft: "18px",
                  }}
                >
                  <button
                    onClick={() => setActiveTab("visa_applications")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background:
                        activeTab === "visa_applications" ? "var(--primary-gradient)" : "transparent",
                      color: activeTab === "visa_applications" ? "#ffffff" : "var(--text-secondary)",
                      fontWeight: activeTab === "visa_applications" ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Briefcase size={15} />
                      <span>ভিসা আবেদন তালিকা</span>
                    </div>
                    {activeTab === "visa_applications" && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.2)",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
                        Active
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* REPORT & ANALYTICS MODULE ACCORDION */}
            <div style={{ marginTop: "10px" }}>
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => setReportsOpen(!reportsOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "var(--text-main)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <BarChart3 size={18} style={{ color: "#10b981" }} />
                  <span>রিপোর্ট মডিউল</span>
                </div>
                {reportsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Sub-modules list */}
              {reportsOpen && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    paddingLeft: "16px",
                    marginTop: "4px",
                    borderLeft: "2px solid rgba(16, 185, 129, 0.3)",
                    marginLeft: "18px",
                  }}
                >
                  {/* 1. All Reports / Main Combined Report */}
                  <button
                    onClick={() => setActiveTab("reports")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background:
                        activeTab === "reports" ? "var(--primary-gradient)" : "transparent",
                      color: activeTab === "reports" ? "#ffffff" : "var(--text-secondary)",
                      fontWeight: activeTab === "reports" ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <BarChart3 size={15} />
                      <span>সকল রিপোর্ট (সমন্বিত)</span>
                    </div>
                    {activeTab === "reports" && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.2)",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
                        Active
                      </span>
                    )}
                  </button>

                  {/* 2. Passport Specific Report */}
                  <button
                    onClick={() => setActiveTab("passport_reports")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background:
                        activeTab === "passport_reports" ? "var(--primary-gradient)" : "transparent",
                      color: activeTab === "passport_reports" ? "#ffffff" : "var(--text-secondary)",
                      fontWeight: activeTab === "passport_reports" ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <BookOpen size={15} />
                      <span>পাসপোর্ট রিপোর্ট</span>
                    </div>
                    {activeTab === "passport_reports" && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.2)",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
                        Active
                      </span>
                    )}
                  </button>

                  {/* 3. Visa Specific Report */}
                  <button
                    onClick={() => setActiveTab("visa_reports")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background:
                        activeTab === "visa_reports" ? "var(--primary-gradient)" : "transparent",
                      color: activeTab === "visa_reports" ? "#ffffff" : "var(--text-secondary)",
                      fontWeight: activeTab === "visa_reports" ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Plane size={15} />
                      <span>ভিসা রিপোর্ট</span>
                    </div>
                    {activeTab === "visa_reports" && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.2)",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
                        Active
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Sidebar Footer: Admin Profile & Logout */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div style={{ lineHeight: 1.2, overflow: "hidden" }}>
              <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-main)", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name || "Admin Sharma"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email || "admin@sharma.com"}
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="btn-secondary btn-sm btn-danger"
            style={{ width: "100%", justifyContent: "center", gap: "8px" }}
          >
            <LogOut size={14} />
            <span>লগআউট করুন</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main
        style={{
          flex: 1,
          padding: "32px 32px",
          overflowY: "auto",
          maxWidth: "calc(100vw - 270px)",
        }}
      >
        {/* VIEW 1: PASSPORT ENTRY SUB-MODULE (PRIMARY REQUEST) */}
        {activeTab === "passport_entry" && <PassportEntryModule />}

        {/* VIEW 2: OVERVIEW SUMMARY */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-main)" }}>
                শর্মা এজেন্সি ড্যাশবোর্ড ওভারভিউ
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "4px" }}>
                পাসপোর্ট ও ভিসা প্রসেসিংয়ের সার্বিক সামারি ও দ্রুত কন্ট্রোল প্যানেল
              </p>
            </div>

            {/* Quick Navigation Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {/* Passport Entry Quick Jump Card */}
              <div
                onClick={() => setActiveTab("passport_entry")}
                className="glass-panel"
                style={{
                  padding: "24px",
                  cursor: "pointer",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(56, 189, 248, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#38bdf8",
                    marginBottom: "14px",
                  }}
                >
                  <BookOpen size={24} />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "6px" }}>
                  পাসপোর্ট এন্ট্রি মডিউল ➔
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  আবেদনকারীর নাম, মোবাইল নম্বর, NID, জন্মতারিখ এবং টাকার লেনদেন হিসাব এন্ট্রি করুন।
                </p>
              </div>

              {/* Visa Applications Quick Jump Card */}
              <div
                onClick={() => setActiveTab("visa_applications")}
                className="glass-panel"
                style={{
                  padding: "24px",
                  cursor: "pointer",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#818cf8",
                    marginBottom: "14px",
                  }}
                >
                  <Plane size={24} />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "6px" }}>
                  ভিসা আবেদন রেজিস্টার ➔
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  কানাডা, যুক্তরাজ্য, যুক্তরাষ্ট্র ও মধ্যপ্রাচ্যের ভিসা ফাইল অগ্রগতি ও স্ট্যাটাস ট্র্যাকিং।
                </p>
              </div>

              {/* Reports & Analytics Quick Jump Card */}
              <div
                onClick={() => setActiveTab("reports")}
                className="glass-panel"
                style={{
                  padding: "24px",
                  cursor: "pointer",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#34d399",
                    marginBottom: "14px",
                  }}
                >
                  <BarChart3 size={24} />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "6px" }}>
                  রিপোর্ট ও আর্থিক হিসাব ➔
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  পাসপোর্ট ও ভিসা মোট চুক্তি, আদায়কৃত টাকা, বকেয়া রিপোর্ট ও প্রিন্ট স্টেটমেন্ট।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: VISA APPLICATIONS MANAGER */}
        {activeTab === "visa_applications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* TOP HEADER */}
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
                    ভিসা আবেদন রেজিস্টার (Visa Applications)
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
                    Visa Module
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
                  নতুন ভিসা আবেদনকারী তথ্য, এম্বাসি ফাইল ও লেনদেন হিসাব রেজিস্টার
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  onClick={() => fetchVisaApplications()}
                  className="btn-secondary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  title="রিফ্রেশ করুন"
                >
                  <RefreshCw size={14} className={loadingVisa ? "spin" : ""} />
                  <span>রিফ্রেশ</span>
                </button>
                <button
                  onClick={() => setShowAddVisaModal(true)}
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
                  <span>+ Add Visa Application</span>
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
                  ৳ {visaStats.totalContractAmount.toLocaleString("en-IN")}
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
                  ৳ {visaStats.totalCollectedAmount.toLocaleString("en-IN")}
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
                  ৳ {visaStats.totalDueAmount.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  পাওনা টাকা
                </div>
              </div>

              {/* Total Visa Applications */}
              <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #38bdf8" }}>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  মোট ভিসা আবেদন
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--text-main)" }}>
                  {visaStats.total} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>টি</span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "#38bdf8", marginTop: "4px" }}>
                  অনুমোদিত: {visaStats.approved} &bull; প্রসেসিং: {visaStats.processing}
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchVisaApplications();
                }}
                style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px" }}
              >
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
                    value={searchVisa}
                    onChange={(e) => setSearchVisa(e.target.value)}
                    placeholder="আবেদনকারীর নাম, পাসপোর্ট নং, মোবাইল, বা ট্র্যাকিং আইডি দিয়ে খুঁজুন..."
                    className="input-field"
                    style={{ paddingLeft: "36px", height: "42px", fontSize: "0.88rem" }}
                  />
                </div>
                <button type="submit" className="btn-secondary" style={{ height: "42px", padding: "0 18px" }}>
                  খুঁজুন
                </button>
              </form>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  স্ট্যাটাস:
                </span>
                <select
                  value={filterVisaStatus}
                  onChange={(e) => setFilterVisaStatus(e.target.value)}
                  className="input-field"
                  style={{ width: "auto", height: "42px", fontSize: "0.85rem", padding: "0 12px" }}
                >
                  <option value="all">সকল আবেদন</option>
                  <option value="submitted">আবেদন জমা</option>
                  <option value="document_verification">ডকুমেন্ট যাচাই</option>
                  <option value="embassy_processing">এম্বাসি প্রসেসিং</option>
                  <option value="biometric_pending">বায়োমেট্রিক স্লট</option>
                  <option value="approved">ভিসা অনুমোদিত</option>
                  <option value="ready_for_pickup">ডেলিভারি প্রস্তুত</option>
                  <option value="delivered">ডেলিভারি সম্পন্ন</option>
                </select>
              </div>
            </div>

            {/* Visa Applications Table */}
            <div className="glass-panel" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>ট্র্যাকিং আইডি</th>
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>আবেদনকারীর নাম</th>
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>পাসপোর্ট নং</th>
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>গন্তব্য দেশ</th>
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>চুক্তি টাকা</th>
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>জমা টাকা</th>
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>বকেয়া টাকা</th>
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>স্ট্যাটাস</th>
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)", textAlign: "right" }}>একশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const total = app.totalAmount ?? app.feeAmount ?? 0;
                      const paid = app.paidAmount ?? (app.feeStatus === "paid" ? total : 0);
                      const due = app.dueAmount ?? Math.max(0, total - paid);
                      return (
                        <tr key={app._id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "14px 18px", fontWeight: 700, color: "#38bdf8" }}>{app.trackingId}</td>
                          <td style={{ padding: "14px 18px", fontWeight: 600 }}>{app.applicantName}</td>
                          <td style={{ padding: "14px 18px", fontFamily: "monospace", color: "#cbd5e1" }}>{app.passportNumber}</td>
                          <td style={{ padding: "14px 18px", fontWeight: 600, color: "#34d399" }}>{app.destinationCountry}</td>
                          <td style={{ padding: "14px 18px", fontWeight: 700 }}>৳ {total.toLocaleString("en-IN")}</td>
                          <td style={{ padding: "14px 18px", fontWeight: 700, color: "#34d399" }}>৳ {paid.toLocaleString("en-IN")}</td>
                          <td style={{ padding: "14px 18px", fontWeight: 700, color: due > 0 ? "#fbbf24" : "#34d399" }}>
                            ৳ {due.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <select
                              value={app.status}
                              onChange={(e) => handleVisaStatusChange(app._id, e.target.value)}
                              style={{
                                background: getStatusBadge(app.status).bg,
                                color: getStatusBadge(app.status).color,
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                padding: "5px 10px",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "0.76rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <option value="submitted">আবেদন জমা</option>
                              <option value="document_verification">ডকুমেন্ট যাচাই</option>
                              <option value="embassy_processing">এম্বাসি প্রসেসিং</option>
                              <option value="biometric_pending">বায়োমেট্রিক স্লট</option>
                              <option value="approved">ভিসা অনুমোদিত</option>
                              <option value="ready_for_pickup">ডেলিভারি প্রস্তুত</option>
                              <option value="delivered">ডেলিভারি সম্পন্ন</option>
                            </select>
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                onClick={() => setSelectedVisa(app)}
                                className="btn-secondary btn-sm"
                                style={{ padding: "5px 8px" }}
                                title="বিস্তারিত দেখুন"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenEditVisa(app)}
                                className="btn-secondary btn-sm"
                                style={{ padding: "5px 8px", color: "#38bdf8" }}
                                title="এডিট করুন"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteVisa(app._id)}
                                className="btn-secondary btn-sm btn-danger"
                                style={{ padding: "5px 8px" }}
                                title="মুছে ফেলুন"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: REPORT & ANALYTICS MODULE (COMBINED / PASSPORT / VISA) */}
        {activeTab === "reports" && <ReportModule initialSection="all" />}
        {activeTab === "passport_reports" && <ReportModule initialSection="passport" />}
        {activeTab === "visa_reports" && <ReportModule initialSection="visa" />}
      </main>

      {/* MODAL: ADD VISA APPLICATION */}
      {showAddVisaModal && (
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
              maxWidth: "560px",
              padding: "30px",
              background: "var(--bg-modal)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>নতুন ভিসা ফাইল যোগ করুন</h2>
              <button onClick={() => setShowAddVisaModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleCreateVisa} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  আবেদনকারীর নাম *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মোঃ কামরুল হাসান"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    পাসপোর্ট নম্বর *
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: A12345678"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    গন্তব্য দেশ *
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: Canada, UK, Saudi Arabia"
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    সার্ভিস ধরন
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="input-field"
                  >
                    <option value="tourist_visa">ট্যুরিস্ট ভিসা (Tourist Visa)</option>
                    <option value="medical_visa">মেডিকেল ভিসা (Medical Visa)</option>
                    <option value="medical_attendant">মেডিকেল এটেন্ডেন্ট (Medical Attendant)</option>
                    <option value="student_visa">স্টুডেন্ট ভিসা (Student Visa)</option>
                    <option value="work_permit">ওয়ার্ক পারমিট (Work Permit)</option>
                    <option value="business_visa">বিজনেস ভিসা (Business Visa)</option>
                    <option value="passport_new">নতুন পাসপোর্ট (Passport New)</option>
                    <option value="passport_renewal">পাসপোর্ট নবায়ন (Passport Renewal)</option>
                  </select>
                </div>
              </div>

              {/* Financial Breakdown (লেনদেন ও টাকার হিসাব) */}
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
                  marginTop: "4px",
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
                      placeholder="যেমন: 25000"
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
                      placeholder="যেমন: 15000"
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
                    background: liveVisaDue > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    border: liveVisaDue > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: liveVisaDue > 0 ? "#fbbf24" : "#34d399" }}>
                    বকেয়া টাকা (Due Amount - অটো হিসাব):
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: liveVisaDue > 0 ? "#fbbf24" : "#34d399" }}>
                    ৳ {liveVisaDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  স্ট্যাটাস
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="submitted">আবেদন জমা (Submitted)</option>
                  <option value="document_verification">ডকুমেন্ট যাচাই (Document Verification)</option>
                  <option value="embassy_processing">এম্বাসি প্রসেসিং (Embassy Processing)</option>
                  <option value="biometric_pending">বায়োমেট্রিক স্লট (Biometric Pending)</option>
                  <option value="approved">ভিসা অনুমোদিত (Approved)</option>
                  <option value="ready_for_pickup">ডেলিভারি প্রস্তুত (Ready for Pickup)</option>
                  <option value="delivered">ডেলিভারি সম্পন্ন (Delivered)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddVisaModal(false)} className="btn-secondary" style={{ flex: 1 }}>বাতিল</button>
                <button type="submit" disabled={creatingVisa} className="btn-primary" style={{ flex: 1 }}>{creatingVisa ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW VISA APPLICATION DETAILS */}
      {selectedVisa && (
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
          onClick={() => setSelectedVisa(null)}
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
                  ভিসা আবেদন বিবরণী (Visa Details)
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  ট্র্যাকিং আইডি: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{selectedVisa.trackingId}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedVisa(null)}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Applicant Name & Country */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>আবেদনকারীর নাম</div>
                  <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "1rem" }}>
                    {selectedVisa.applicantName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>গন্তব্য দেশ</div>
                  <div style={{ fontWeight: 700, color: "#34d399", fontSize: "1rem" }}>
                    {selectedVisa.destinationCountry}
                  </div>
                </div>
              </div>

              {/* Passport & Contact */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>পাসপোর্ট নম্বর</div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#cbd5e1" }}>
                    {selectedVisa.passportNumber}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>মোবাইল নম্বর</div>
                  <div style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                    {selectedVisa.phone}
                  </div>
                </div>
              </div>

              {selectedVisa.email && (
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>ইমেইল</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{selectedVisa.email}</div>
                </div>
              )}

              {/* Service & Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>সার্ভিস ধরন</div>
                  <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.9rem" }}>
                    {selectedVisa.serviceType === "tourist_visa"
                      ? "ট্যুরিস্ট ভিসা"
                      : selectedVisa.serviceType === "medical_visa"
                      ? "মেডিকেল ভিসা"
                      : selectedVisa.serviceType === "medical_attendant"
                      ? "মেডিকেল এটেন্ডেন্ট"
                      : selectedVisa.serviceType === "student_visa"
                      ? "স্টুডেন্ট ভিসা"
                      : selectedVisa.serviceType === "work_permit"
                      ? "ওয়ার্ক পারমিট"
                      : selectedVisa.serviceType === "business_visa"
                      ? "বিজনেস ভিসা"
                      : selectedVisa.serviceType}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>বর্তমান স্ট্যাটাস</div>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "4px",
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      background: getStatusBadge(selectedVisa.status).bg,
                      color: getStatusBadge(selectedVisa.status).color,
                    }}
                  >
                    {getStatusBadge(selectedVisa.status).label}
                  </span>
                </div>
              </div>

              {/* Financial Box */}
              {(() => {
                const total = selectedVisa.totalAmount ?? selectedVisa.feeAmount ?? 0;
                const paid = selectedVisa.paidAmount ?? (selectedVisa.feeStatus === "paid" ? total : 0);
                const due = selectedVisa.dueAmount ?? Math.max(0, total - paid);
                return (
                  <div
                    className="financial-box"
                    style={{
                      background: "var(--bg-subtle-box)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      marginTop: "6px",
                    }}
                  >
                    <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#818cf8", marginBottom: "12px" }}>
                      লেনদেন ও হিসাব বিবরণী:
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "6px" }}>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>মোট চুক্তি বিল</div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-main)", marginTop: "4px" }}>
                          ৳ {total.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "10px", borderRadius: "6px" }}>
                        <div style={{ fontSize: "0.72rem", color: "#34d399" }}>পরিশোধিত টাকা</div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#34d399", marginTop: "4px" }}>
                          ৳ {paid.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div style={{ background: due > 0 ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.08)", padding: "10px", borderRadius: "6px" }}>
                        <div style={{ fontSize: "0.72rem", color: due > 0 ? "#fbbf24" : "#34d399" }}>বকেয়া টাকা</div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: due > 0 ? "#fbbf24" : "#34d399", marginTop: "4px" }}>
                          ৳ {due.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Notes */}
              {selectedVisa.notes && (
                <div style={{ padding: "12px", background: "rgba(99, 102, 241, 0.06)", borderRadius: "6px", borderLeft: "3px solid #6366f1" }}>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "4px" }}>নোট / মন্তব্য:</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                    {selectedVisa.notes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => {
                  const appToEdit = selectedVisa;
                  setSelectedVisa(null);
                  handleOpenEditVisa(appToEdit);
                }}
                className="btn-primary"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Edit size={16} />
                <span>এডিট করুন</span>
              </button>
              <button
                onClick={() => setSelectedVisa(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT VISA APPLICATION */}
      {editingVisa && (
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
          onClick={() => setEditingVisa(null)}
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
                  ভিসা আবেদন এডিট করুন
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  ট্র্যাকিং আইডি: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{editingVisa.trackingId}</span>
                </p>
              </div>
              <button
                onClick={() => setEditingVisa(null)}
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

            {editVisaError && (
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
                <span>{editVisaError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateVisaSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Applicant Name */}
              <div>
                <label className="label-text">
                  আবেদনকারীর নাম <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editApplicantName}
                  onChange={(e) => setEditApplicantName(e.target.value)}
                  placeholder="উদাঃ মোঃ রফিকুল ইসলাম"
                  className="input-field"
                />
              </div>

              {/* Passport & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="label-text">
                    পাসপোর্ট নম্বর <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPassportNumber}
                    onChange={(e) => setEditPassportNumber(e.target.value.toUpperCase())}
                    placeholder="A01234567"
                    className="input-field"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div>
                  <label className="label-text">
                    ফোন নম্বর <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Email & Country */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="label-text">ইমেইল ঠিকানা (ঐচ্ছিক)</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="applicant@email.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">
                    গন্তব্য দেশ <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <select
                    value={editDestinationCountry}
                    onChange={(e) => setEditDestinationCountry(e.target.value)}
                    className="input-field"
                  >
                    <option value="India">ভারত (India)</option>
                    <option value="Saudi Arabia">সৌদি আরব (Saudi Arabia)</option>
                    <option value="UAE">সংযুক্ত আরব আমিরাত (UAE)</option>
                    <option value="Malaysia">মালয়েশিয়া (Malaysia)</option>
                    <option value="Singapore">সিঙ্গাপুর (Singapore)</option>
                    <option value="Thailand">থাইল্যান্ড (Thailand)</option>
                    <option value="Canada">কানাডা (Canada)</option>
                    <option value="UK">যুক্তরাজ্য (UK)</option>
                    <option value="USA">যুক্তরাষ্ট্র (USA)</option>
                    <option value="Schengen">ইউরোপ/শেঞ্জেন (Schengen)</option>
                    <option value="Other">অন্যান্য (Other)</option>
                  </select>
                </div>
              </div>

              {/* Service Type & Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="label-text">সার্ভিস ধরন</label>
                  <select
                    value={editServiceType}
                    onChange={(e) => setEditServiceType(e.target.value)}
                    className="input-field"
                  >
                    <option value="tourist_visa">ট্যুরিস্ট ভিসা (Tourist Visa)</option>
                    <option value="medical_visa">মেডিকেল ভিসা (Medical Visa)</option>
                    <option value="medical_attendant">মেডিকেল এটেন্ডেন্ট (Medical Attendant)</option>
                    <option value="student_visa">স্টুডেন্ট ভিসা (Student Visa)</option>
                    <option value="work_permit">ওয়ার্ক পারমিট (Work Permit)</option>
                    <option value="business_visa">বিজনেস ভিসা (Business Visa)</option>
                    <option value="passport_new">নতুন পাসপোর্ট (Passport New)</option>
                    <option value="passport_renewal">পাসপোর্ট নবায়ন (Passport Renewal)</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">বর্তমান স্ট্যাটাস</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="submitted">আবেদন জমা (Submitted)</option>
                    <option value="document_verification">ডকুমেন্ট যাচাই (Document Verification)</option>
                    <option value="embassy_processing">এম্বাসি প্রসেসিং (Embassy Processing)</option>
                    <option value="biometric_pending">বায়োমেট্রিক স্লট (Biometric Pending)</option>
                    <option value="approved">ভিসা অনুমোদিত (Approved)</option>
                    <option value="ready_for_pickup">ডেলিভারি প্রস্তুত (Ready for Pickup)</option>
                    <option value="delivered">ডেলিভারি সম্পন্ন (Delivered)</option>
                  </select>
                </div>
              </div>

              {/* Financial Box */}
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
                    <label className="label-text">কত টাকা নিবে তার কাছে (Total Amount)</label>
                    <input
                      type="number"
                      value={editTotalAmount}
                      onChange={(e) => setEditTotalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="যেমন: 25000"
                      min={0}
                      className="input-field"
                      style={{ fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label className="label-text">সে কত টাকা দিছে (Paid Amount)</label>
                    <input
                      type="number"
                      value={editPaidAmount}
                      onChange={(e) => setEditPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="যেমন: 15000"
                      min={0}
                      className="input-field"
                      style={{ fontWeight: 700, color: "#34d399" }}
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
                    background: liveEditVisaDue > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    border: liveEditVisaDue > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: liveEditVisaDue > 0 ? "#fbbf24" : "#34d399" }}>
                    বকেয়া টাকা (Due Amount - অটো হিসাব):
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: liveEditVisaDue > 0 ? "#fbbf24" : "#34d399" }}>
                    ৳ {liveEditVisaDue.toLocaleString("en-IN")}
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
                  onClick={() => setEditingVisa(null)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={updatingVisa}
                  className="btn-primary"
                  style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  {updatingVisa ? "আপডেট হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
