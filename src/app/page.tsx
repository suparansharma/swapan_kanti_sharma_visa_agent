"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Dashboard from "@/components/Dashboard";
import {
  Plane,
  FileText,
  CheckCircle2,
  Clock,
  Search,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
  Building2,
  ShieldCheck,
  Award,
  Sparkles,
  Calendar,
  BadgeCheck,
  FileSearch,
  MapPin,
  PhoneCall,
  RefreshCw,
  ChevronRight,
  UserCheck,
} from "lucide-react";

interface TrackedApplication {
  trackingId: string;
  applicantName: string;
  passportNumber: string;
  phone: string;
  destinationCountry: string;
  serviceType: string;
  status: string;
  applicationDate: string;
  estimatedDelivery?: string;
  notes?: string;
}

export default function HomePage() {
  const { user, loading, login } = useAuth();

  // Admin login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Live Tracking widget state
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedApp, setTrackedApp] = useState<TrackedApplication | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Fast Fill Admin Credentials
  const handleFillAdmin = () => {
    setEmail("admin@sharma.com");
    setPassword("232578");
    setAuthError(null);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);

    const res = await login(email, password);
    if (!res.success) {
      setAuthError(res.error || "লগইন ব্যর্থ হয়েছে। সঠিক ইমেইল ও পাসওয়ার্ড দিন।");
    }

    setSubmitting(false);
  };

  // Tracking query handler
  const handleTrackSubmit = async (queryToSearch?: string) => {
    const query = (queryToSearch || trackingInput).trim();
    if (!query) {
      setTrackingError("অনুগ্রহ করে ট্র্যাকিং আইডি অথবা পাসপোর্ট নম্বর লিখুন।");
      return;
    }

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackedApp(null);

    try {
      const res = await fetch(`/api/tracking?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTrackedApp(data.application);
      } else {
        setTrackingError(
          data.error || "কোনো ফাইল খুঁজে পাওয়া যায়নি। নম্বরটি আবার চেক করুন।"
        );
      }
    } catch (err) {
      setTrackingError("সার্ভারের সাথে সংযোগ করা যাচ্ছে না। একটু পর চেষ্টা করুন।");
    } finally {
      setTrackingLoading(false);
    }
  };

  // Helper for status progress steps
  const getStatusStep = (status: string) => {
    switch (status) {
      case "submitted":
        return 1;
      case "document_verification":
        return 2;
      case "embassy_processing":
      case "biometric_pending":
        return 3;
      case "approved":
      case "ready_for_pickup":
      case "delivered":
        return 4;
      default:
        return 1;
    }
  };

  const getServiceLabel = (type: string) => {
    switch (type) {
      case "passport_new":
        return "নতুন ই-পাসপোর্ট আবেদন";
      case "passport_renewal":
        return "পাসপোর্ট নবায়ন (Renewal)";
      case "tourist_visa":
        return "ট্যুরিস্ট / ভিজিট ভিসা";
      case "medical_visa":
        return "মেডিকেল ভিসা (Medical Visa)";
      case "medical_attendant":
        return "মেডিকেল এটেন্ডেন্ট (Medical Attendant)";
      case "student_visa":
        return "স্টুডেন্ট ভিসা";
      case "work_permit":
        return "ওয়ার্ক পারমিট ভিসা";
      case "business_visa":
        return "বিজনেস ভিসা";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return { label: "আবেদন জমা হয়েছে", bg: "rgba(99, 102, 241, 0.15)", color: "#818cf8" };
      case "document_verification":
        return { label: "ডকুমেন্ট যাচাই চলছে", bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" };
      case "embassy_processing":
        return { label: "এম্বাসিতে প্রসেসিং চলছে", bg: "rgba(14, 165, 233, 0.15)", color: "#38bdf8" };
      case "biometric_pending":
        return { label: "বায়োমেট্রিক শিডিউলড", bg: "rgba(236, 72, 153, 0.15)", color: "#f472b6" };
      case "approved":
        return { label: "ভিসা অনুমোদিত (Approved)", bg: "rgba(16, 185, 129, 0.2)", color: "#34d399" };
      case "ready_for_pickup":
        return { label: "পাসপোর্ট ডেলিভারির জন্য প্রস্তুত", bg: "rgba(16, 185, 129, 0.25)", color: "#10b981" };
      case "delivered":
        return { label: "ক্লায়েন্টকে ডেলিভারি সম্পন্ন", bg: "rgba(59, 130, 246, 0.2)", color: "#60a5fa" };
      default:
        return { label: status, bg: "rgba(255, 255, 255, 0.1)", color: "#ffffff" };
    }
  };

  // If loading session, show sleek spinner
  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          minHeight: "70vh",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "3px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "var(--primary)",
            animation: "spin 1s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          শর্মা ভিসা ও পাসপোর্ট পোর্টাল লোড হচ্ছে...
        </p>
      </div>
    );
  }

  // If user is logged in, show the interactive Visa Operations Dashboard
  if (user) {
    return (
      <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>ড্যাশবোর্ড লোড হচ্ছে...</div>}>
        <Dashboard />
      </Suspense>
    );
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* HERO SECTION */}
      <section
        style={{
          position: "relative",
          padding: "50px 24px 70px",
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Background ambient lighting */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "15%",
            width: "360px",
            height: "360px",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "100px",
            right: "10%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)",
            filter: "blur(70px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "48px",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Left Column: Hero Proposition */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 16px",
                borderRadius: "var(--radius-full)",
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#818cf8",
                fontSize: "0.82rem",
                fontWeight: 600,
                marginBottom: "20px",
              }}
            >
              <Plane size={15} />
              <span>গ্লোবাল ভিসা ও পাসপোর্ট ম্যানেজমেন্ট প্ল্যাটফর্ম</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2.1rem, 4vw, 3.2rem)",
                fontWeight: 900,
                lineHeight: 1.2,
                letterSpacing: "-0.03em",
                color: "var(--text-main)",
                marginBottom: "20px",
              }}
            >
              ভিসা ও পাসপোর্ট সার্ভিসেস <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #34d399 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                স্মার্ট প্রসেসিং ও ফাইল ট্র্যাকিং
              </span>
            </h1>

            <p
              style={{
                fontSize: "1.05rem",
                lineHeight: 1.65,
                color: "var(--text-secondary)",
                marginBottom: "32px",
                maxWidth: "540px",
              }}
            >
              ই-পাসপোর্ট আবেদন, নবায়ন, কানাডা-ইউকে-ইউএসএ-ইউরোপ ভিজিট ও স্টুডেন্ট ভিসা, 
              মধ্যপ্রাচ্য ওয়ার্ক পারমিট এবং এম্বাসি ডকুমেন্ট পরিচালনার বিশ্বস্ত ডিজিটাল সমাধান।
            </p>

            {/* Quick Action Buttons */}
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "36px" }}>
              <a href="#tracking" className="btn-primary" style={{ padding: "14px 28px" }}>
                <Search size={18} />
                <span>ফাইল স্ট্যাটাস ট্র্যাক করুন</span>
              </a>
              <a href="#services" className="btn-secondary" style={{ padding: "14px 26px" }}>
                <FileText size={16} />
                <span>আমাদের সার্ভিসেস</span>
              </a>
            </div>

            {/* Trust feature pills */}
            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                paddingTop: "24px",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <CheckCircle2 size={16} style={{ color: "#34d399" }} />
                <span>ই-পাসপোর্ট সহায়তা</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <CheckCircle2 size={16} style={{ color: "#34d399" }} />
                <span>গ্লোবাল এম্বাসি সাবমিশন</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <CheckCircle2 size={16} style={{ color: "#34d399" }} />
                <span>নিরাপদ ক্লায়েন্ট ডাটাবেস</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dedicated Admin Sign In Card */}
          <div>
            <div
              className="glass-panel"
              style={{
                padding: "36px",
                background: "rgba(16, 22, 38, 0.92)",
                border: "1px solid rgba(99, 102, 241, 0.35)",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
              }}
            >
              {/* Decorative accent glow */}
              <div
                style={{
                  position: "absolute",
                  top: "-50px",
                  right: "-50px",
                  width: "160px",
                  height: "160px",
                  background: "rgba(99, 102, 241, 0.25)",
                  borderRadius: "50%",
                  filter: "blur(40px)",
                  pointerEvents: "none",
                }}
              />

              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "var(--text-main)",
                      marginBottom: "4px",
                    }}
                  >
                    অ্যাডমিন সাইন-ইন
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                    ভিসা ও পাসপোর্ট ক্লায়েন্ট ডাটাবেস এক্সেস
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    borderRadius: "var(--radius-full)",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#34d399",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Authorized</span>
                </div>
              </div>

              {/* Quick Admin ID banner with 1-click Auto Fill */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  অ্যাডমিন আইডি: <strong style={{ color: "#a5b4fc" }}>admin@sharma.com</strong>
                </div>
                <button
                  type="button"
                  onClick={handleFillAdmin}
                  style={{
                    background: "rgba(99, 102, 241, 0.28)",
                    border: "1px solid rgba(99, 102, 241, 0.5)",
                    color: "#ffffff",
                    fontSize: "0.74rem",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  Auto Fill
                </button>
              </div>

              {/* Error Banner */}
              {authError && (
                <div
                  style={{
                    background: "rgba(244, 63, 94, 0.12)",
                    border: "1px solid rgba(244, 63, 94, 0.35)",
                    color: "#f87171",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    ইউজার আইডি (ইমেইল অ্যাড্রেস)
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={17}
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@sharma.com"
                      required
                      className="input-field"
                      style={{ paddingLeft: "42px" }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    পাসওয়ার্ড
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={17}
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="input-field"
                      style={{ paddingLeft: "42px", paddingRight: "42px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ width: "100%", marginTop: "8px", padding: "13px" }}
                >
                  {submitting ? (
                    <span>ভিসা ডাটাবেসে কানেক্ট হচ্ছে...</span>
                  ) : (
                    <>
                      <span>পোর্টালে প্রবেশ করুন</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              <div
                style={{
                  marginTop: "18px",
                  textAlign: "center",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                }}
              >
                নিরাপদ এনক্রিপশন ও সেশন প্রটেকশন সক্রিয় রয়েছে
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS COUNTER STRIP */}
      <section
        style={{
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(16, 22, 38, 0.4)",
          padding: "36px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#818cf8" }}>৫,৪২০+</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
              সফল পাসপোর্ট ও ভিসা প্রসেস
            </div>
          </div>
          <div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#34d399" }}>৯৯.৪%</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
              ভিসা ফাইল অনুমোদন হার
            </div>
          </div>
          <div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#38bdf8" }}>৪০+</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
              গ্লোবাল কান্ট্রি পার্টনার্স
            </div>
          </div>
          <div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#f472b6" }}>২৪/৭</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
              অনলাইন ফাইল স্ট্যাটাস ট্র্যাকিং
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE VISA & PASSPORT TRACKER SECTION */}
      <section
        id="tracking"
        style={{
          padding: "70px 24px",
          maxWidth: "1000px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 14px",
              borderRadius: "var(--radius-full)",
              background: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              color: "#38bdf8",
              fontSize: "0.8rem",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            <FileSearch size={14} />
            <span>অনলাইন ফাইল ট্র্যাকিং</span>
          </div>
          <h2
            style={{
              fontSize: "2.1rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--text-main)",
              marginBottom: "10px",
            }}
          >
            আপনার পাসপোর্ট ও ভিসা স্ট্যাটাস চেক করুন
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            আপনার ট্র্যাকিং আইডি অথবা পাসপোর্ট নম্বর দিয়ে যেকোনো সময় ফাইলের বর্তমান অবস্থান জানুন।
          </p>
        </div>

        {/* Search Box Card */}
        <div
          className="glass-panel"
          style={{
            padding: "32px",
            background: "rgba(16, 22, 38, 0.8)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
          }}
        >
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTrackSubmit();
                }}
                placeholder="যেমন: VS-001 অথবা পাসপোর্ট নং A08492014"
                className="input-field"
                style={{ paddingLeft: "42px", height: "48px", fontSize: "0.95rem" }}
              />
            </div>
            <button
              onClick={() => handleTrackSubmit()}
              disabled={trackingLoading}
              className="btn-primary"
              style={{ padding: "0 28px", height: "48px", whiteSpace: "nowrap" }}
            >
              {trackingLoading ? (
                <span>যাচাই হচ্ছে...</span>
              ) : (
                <>
                  <Search size={16} />
                  <span>ট্র্যাক করুন</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Search Pills */}
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            <span>ডেমো ফাইল দিয়ে ট্র্যাকিং দেখুন:</span>
            {[
              { id: "VS-001", label: "ইন্ডিয়ান ভিসা" },
              { id: "PS-001", label: "পাসপোর্ট সার্ভিস" },
              { id: "SH-VISA-3042", label: "কানাডা স্টুডেন্ট ভিসা" },
              { id: "SH-VISA-5089", label: "ইউকে ট্যুরিস্ট ভিসা" },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setTrackingInput(pill.id);
                  handleTrackSubmit(pill.id);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.76rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {pill.id} ({pill.label})
              </button>
            ))}
          </div>

          {/* Tracking Error */}
          {trackingError && (
            <div
              style={{
                marginTop: "20px",
                padding: "12px 16px",
                background: "rgba(244, 63, 94, 0.12)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                color: "#f87171",
                borderRadius: "var(--radius-md)",
                fontSize: "0.88rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{trackingError}</span>
            </div>
          )}

          {/* Tracking Result Card */}
          {trackedApp && (
            <div
              style={{
                marginTop: "24px",
                padding: "24px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {/* Result Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "14px",
                  paddingBottom: "18px",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>
                      {trackedApp.applicantName}
                    </h3>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        background: getStatusBadge(trackedApp.status).bg,
                        color: getStatusBadge(trackedApp.status).color,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {getStatusBadge(trackedApp.status).label}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    ট্র্যাকিং আইডি: <strong style={{ color: "#38bdf8" }}>{trackedApp.trackingId}</strong> &bull; পাসপোর্ট নম্বর:{" "}
                    <strong style={{ color: "var(--text-main)" }}>{trackedApp.passportNumber}</strong>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>গন্তব্য দেশ / বিভাগ:</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#34d399" }}>
                    {trackedApp.destinationCountry}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    সার্ভিস: {getServiceLabel(trackedApp.serviceType)}
                  </div>
                </div>
              </div>

              {/* 4-Step Progress Visualizer */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "16px" }}>
                  ফাইলের বর্তমান অগ্রগতি (Progress Timeline):
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                    position: "relative",
                  }}
                >
                  {[
                    { step: 1, title: "১. ফাইল জমা", desc: "আবেদনপত্র গৃহীত" },
                    { step: 2, title: "২. ডকুমেন্ট ভেরিফিকেশন", desc: "কাগজপত্র যাচাই সম্পন্ন" },
                    { step: 3, title: "৩. এম্বাসি প্রসেসিং", desc: "বায়োমেট্রিক ও ভিসা ফাইল" },
                    { step: 4, title: "৪. ডেলিভারি প্রস্তুত", desc: "পাসপোর্ট হ্যান্ডওভার" },
                  ].map((s) => {
                    const currentStep = getStatusStep(trackedApp.status);
                    const isDone = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;

                    return (
                      <div
                        key={s.step}
                        style={{
                          padding: "12px",
                          borderRadius: "var(--radius-sm)",
                          background: isCurrent
                            ? "rgba(99, 102, 241, 0.15)"
                            : isDone
                            ? "rgba(16, 185, 129, 0.08)"
                            : "rgba(255, 255, 255, 0.02)",
                          border: isCurrent
                            ? "1px solid rgba(99, 102, 241, 0.5)"
                            : isDone
                            ? "1px solid rgba(16, 185, 129, 0.3)"
                            : "1px solid var(--border-subtle)",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            margin: "0 auto 6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: isDone ? "#10b981" : "rgba(255, 255, 255, 0.1)",
                            color: "#fff",
                          }}
                        >
                          {isDone ? "✓" : s.step}
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: isDone ? "var(--text-main)" : "var(--text-muted)",
                          }}
                        >
                          {s.title}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {s.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Note / Details */}
              {trackedApp.notes && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(99, 102, 241, 0.06)",
                    borderLeft: "3px solid #6366f1",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <strong style={{ color: "#a5b4fc" }}>অফিসিয়াল আপডেট নোট:</strong> {trackedApp.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CORE SERVICES SECTION */}
      <section
        id="services"
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "70px 24px",
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 14px",
              borderRadius: "var(--radius-full)",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "#818cf8",
              fontSize: "0.8rem",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            <Sparkles size={14} />
            <span>আমাদের সেবা সমূহ</span>
          </div>
          <h2 style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "12px" }}>
            ভিসা ও পাসপোর্ট সেবা সমূহ
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto", fontSize: "0.96rem" }}>
            বিশ্বের যেকোনো দেশের ভিসা ও পাসপোর্ট প্রসেসিংয়ে অভিজ্ঞ কনসালটেন্সি ও পূর্ণাঙ্গ সহায়তা।
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Service 1 */}
          <div className="glass-panel" style={{ padding: "28px", transition: "transform 0.2s" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
                marginBottom: "18px",
              }}
            >
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "10px" }}>
              ১. ই-পাসপোর্ট নতুন ও দ্রুত রিনিউয়াল
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
              অনলাইন ই-পাসপোর্ট আবেদনপত্র পূরণ, জরুরি ১০-বছর ও ৫-বছরের পাসপোর্ট নবায়ন, 
              পাসপোর্ট সংশোধন এবং বায়োমেট্রিক অ্যাপয়েন্টমেন্ট প্রসেসিং।
            </p>
          </div>

          {/* Service 2 */}
          <div className="glass-panel" style={{ padding: "28px", transition: "transform 0.2s" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(56, 189, 248, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
                marginBottom: "18px",
              }}
            >
              <Plane size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "10px" }}>
              ২. স্টুডেন্ট ভিসা ও স্কলারশিপ প্রসেসিং
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
              কানাডা, যুক্তরাজ্য, অস্ট্রেলিয়া, জার্মানি ও ফিনল্যান্ডের স্বনামধন্য বিশ্ববিদ্যালয়ে 
              অফার লেটার, SOP ও ফাইনান্সিয়াল ফাইল প্রস্তুতকরণ।
            </p>
          </div>

          {/* Service 3 */}
          <div className="glass-panel" style={{ padding: "28px", transition: "transform 0.2s" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#34d399",
                marginBottom: "18px",
              }}
            >
              <Globe size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "10px" }}>
              ৩. ভিজিট ও ট্যুরিস্ট ভিসা প্রসেসিং
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
              ইউরোপীয় সেনজেনভুক্ত ২৭টি দেশ, ইউএসএ B1/B2, দুবাই ও থাইল্যান্ড ভিজিট ভিসা 
              প্রসেসিং ও হোটেল বুকিং সাপোর্ট।
            </p>
          </div>

          {/* Service 4 */}
          <div className="glass-panel" style={{ padding: "28px", transition: "transform 0.2s" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fbbf24",
                marginBottom: "18px",
              }}
            >
              <Building2 size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "10px" }}>
              ৪. স্কিলড ওয়ার্ক পারমিট ও বিজনেস ভিসা
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
              সৌদি আরব, কাতার, সংযুক্ত আরব আমিরাত ও ইউরোপিয়ান নিয়োগকর্তার ওয়ার্ক পারমিট 
              যাচাই, তাসহীর অ্যাপয়েন্টমেন্ট ও ভিসা স্ট্যাম্পিং।
            </p>
          </div>

          {/* Service 5 */}
          <div className="glass-panel" style={{ padding: "28px", transition: "transform 0.2s" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(236, 72, 153, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f472b6",
                marginBottom: "18px",
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "10px" }}>
              ৫. পুলিশ ক্লিয়ারেন্স ও মিনিস্ট্রি নোটারি
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
              পররাষ্ট্র মন্ত্রণালয় সত্যায়ন, নোটারি পাবলিক, পেশাগত সনদ অনুবাদ ও 
              এম্বাসি লিগ্যালাইজেশন সম্পূর্ণ দ্রুততম সময়ে।
            </p>
          </div>

          {/* Service 6 */}
          <div className="glass-panel" style={{ padding: "28px", transition: "transform 0.2s" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(168, 85, 247, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c084fc",
                marginBottom: "18px",
              }}
            >
              <Calendar size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "10px" }}>
              ৬. VFS বায়োমেট্রিক ও মেডিকেল বুকিং
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
              VFS Global ও এম্বাসি বায়োমেট্রিক স্লট বুকিং, গামকা অনুমোদিত মেডিকেল সেন্টার শিডিউলিং 
              ও ভিসা ইন্টারভিউ ওরিয়েন্টেশন।
            </p>
          </div>
        </div>
      </section>

      {/* POPULAR COUNTRIES SECTION */}
      <section
        id="countries"
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "70px 24px",
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <h2 style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "10px" }}>
            শীর্ষ জনপ্রিয় গন্তব্য দেশসমূহ
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            আমাদের কনসালটেন্সির মাধ্যমে সর্বোচ্চ ভিসা সাকসেস রেট পাওয়া দেশসমূহ
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            {
              flag: "🇨🇦",
              name: "কানাডা (Canada)",
              types: "স্টুডেন্ট পারমিট, সুপার ভিসা, এক্সপ্রেস এন্ট্রি",
              time: "৩-৭ সপ্তাহ",
            },
            {
              flag: "🇬🇧",
              name: "যুক্তরাজ্য (UK)",
              types: "স্কিলড ওয়ার্কার, স্টুডেন্ট ভিসা, ভিজিটর",
              time: "৩-৪ সপ্তাহ",
            },
            {
              flag: "🇺🇸",
              name: "যুক্তরাষ্ট্র (USA)",
              types: "B1/B2 ট্যুরিস্ট, F1 স্টুডেন্ট ভিসা",
              time: "জরুরি অ্যাপয়েন্টমেন্ট",
            },
            {
              flag: "🇪🇺",
              name: "সেনজেন / ইউরোপ",
              types: "ইতালি, জার্মানি, ফ্রান্স, পর্তুগাল",
              time: "১৫-২৫ দিন",
            },
            {
              flag: "🇦🇪",
              name: "দুবাই / সংযুক্ত আরব আমিরাত",
              types: "২ বছরের এমপ্লয়মেন্ট ও ভিজিট ভিসা",
              time: "৩-৫ কার্যদিবস",
            },
            {
              flag: "🇸🇦",
              name: "সৌদি আরব (Saudi Arabia)",
              types: "ওয়ার্ক ভিসা ও উমরাহ ভিসা প্রসেসিং",
              time: "৭-১০ কার্যদিবস",
            },
          ].map((country, idx) => (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: "24px",
                border: "1px solid var(--border-subtle)",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "2.4rem", marginBottom: "12px" }}>{country.flag}</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}>
                {country.name}
              </h3>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "12px", minHeight: "40px" }}>
                {country.types}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.76rem",
                  paddingTop: "10px",
                  borderTop: "1px solid var(--border-subtle)",
                  color: "#34d399",
                  fontWeight: 600,
                }}
              >
                <span>প্রসেসিং সময়:</span>
                <span>{country.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <section
        style={{
          borderTop: "1px solid var(--border-subtle)",
          background: "linear-gradient(180deg, rgba(16, 22, 38, 0.4) 0%, rgba(7, 9, 14, 0.9) 100%)",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 800, marginBottom: "14px" }}>
            ভিসা ও পাসপোর্ট সংক্রান্ত পরামর্শ প্রয়োজন?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "28px" }}>
            শর্মা ভিসা ও পাসপোর্ট সার্ভিসেস আপনার ফাইল প্রসেসিং এবং এম্বাসি সংক্রান্ত যেকোনো সহায়তায় প্রস্তুত।
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 22px", borderRadius: "var(--radius-full)", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "#818cf8", fontWeight: 600 }}>
            <PhoneCall size={16} />
            <span>সরাসরি যোগাযোগ ও হটলাইন: +880 1715-144329</span>
          </div>
        </div>
      </section>
    </div>
  );
}
