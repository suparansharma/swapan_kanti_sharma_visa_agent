"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PassportEntryModule from "@/components/PassportEntryModule";
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
} from "lucide-react";

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
  feeStatus: "paid" | "partial" | "pending";
  notes?: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Active navigation tab
  // Options: 'passport_entry' | 'overview' | 'visa_applications'
  const [activeTab, setActiveTab] = useState<
    "passport_entry" | "overview" | "visa_applications"
  >("passport_entry");

  // Sidebar accordions state
  const [passportOpen, setPassportOpen] = useState(true);
  const [visaOpen, setVisaOpen] = useState(true);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Visa applications state
  const [applications, setApplications] = useState<VisaApplicationItem[]>([]);
  const [visaStats, setVisaStats] = useState({ total: 0, approved: 0, processing: 0, ready: 0 });
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
  const [feeAmount, setFeeAmount] = useState<number>(25000);
  const [feeStatus, setFeeStatus] = useState<"paid" | "partial" | "pending">("pending");
  const [notes, setNotes] = useState("");
  const [creatingVisa, setCreatingVisa] = useState(false);

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
          feeAmount,
          feeStatus,
          notes,
        }),
      });
      if (res.ok) {
        setShowAddVisaModal(false);
        setApplicantName("");
        setPassportNumber("");
        setPhone("");
        fetchVisaApplications();
      }
    } catch (err) {
      console.error("Visa create error:", err);
    } finally {
      setCreatingVisa(false);
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
          background: "rgba(11, 15, 25, 0.95)",
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
                      gap: "8px",
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
                    <Briefcase size={15} />
                    <span>ভিসা আবেদন তালিকা</span>
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
            </div>
          </div>
        )}

        {/* VIEW 3: VISA APPLICATIONS MANAGER */}
        {activeTab === "visa_applications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>ভিসা আবেদন রেজিস্টার</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
                  এম্বাসি ফাইল, ভিসা অনুমোদন ও ডেলিভারি তালিকা
                </p>
              </div>

              <button
                onClick={() => setShowAddVisaModal(true)}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Plus size={16} />
                <span>নতুন ভিসা ফাইল যোগ করুন</span>
              </button>
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
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>সার্ভিস ফি</th>
                      <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app._id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "14px 18px", fontWeight: 700, color: "#38bdf8" }}>{app.trackingId}</td>
                        <td style={{ padding: "14px 18px", fontWeight: 600 }}>{app.applicantName}</td>
                        <td style={{ padding: "14px 18px", fontFamily: "monospace", color: "#cbd5e1" }}>{app.passportNumber}</td>
                        <td style={{ padding: "14px 18px", fontWeight: 600, color: "#34d399" }}>{app.destinationCountry}</td>
                        <td style={{ padding: "14px 18px" }}>৳ {app.feeAmount?.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "var(--radius-full)",
                              background: getStatusBadge(app.status).bg,
                              color: getStatusBadge(app.status).color,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            {getStatusBadge(app.status).label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
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
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "560px",
              padding: "30px",
              background: "rgba(16, 22, 38, 0.98)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>নতুন ভিসা ফাইল যোগ করুন</h2>
              <button onClick={() => setShowAddVisaModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleCreateVisa} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input type="text" placeholder="আবেদনকারীর নাম" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required className="input-field" />
              <input type="text" placeholder="পাসপোর্ট নম্বর" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value.toUpperCase())} required className="input-field" />
              <input type="text" placeholder="মোবাইল নম্বর" value={phone} onChange={(e) => setPhone(e.target.value)} required className="input-field" />
              <input type="text" placeholder="গন্তব্য দেশ (যেমন: Canada, UK)" value={destinationCountry} onChange={(e) => setDestinationCountry(e.target.value)} required className="input-field" />
              <input type="number" placeholder="মোট ফি (টাকা)" value={feeAmount} onChange={(e) => setFeeAmount(Number(e.target.value))} required className="input-field" />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddVisaModal(false)} className="btn-secondary" style={{ flex: 1 }}>বাতিল</button>
                <button type="submit" disabled={creatingVisa} className="btn-primary" style={{ flex: 1 }}>{creatingVisa ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
