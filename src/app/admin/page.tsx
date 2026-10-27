"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Dashboard from "@/components/Dashboard";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Plane,
  Sparkles,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
          minHeight: "75vh",
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
          অ্যাডমিন পোর্টাল লোড হচ্ছে...
        </p>
      </div>
    );
  }

  // If already authenticated (admin or employee), render the management Dashboard!
  if (user) {
    return (
      <Suspense
        fallback={
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            ড্যাশবোর্ড লোড হচ্ছে...
          </div>
        }
      >
        <Dashboard />
      </Suspense>
    );
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);

    const res = await login(email, password);
    if (!res.success) {
      setAuthError(res.error || "লগইন ব্যর্থ হয়েছে। সঠিক ইউজার আইডি ও পাসওয়ার্ড দিন।");
    }
    setSubmitting(false);
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        minHeight: "80vh",
        position: "relative",
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "20%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "20%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.14) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "40px 32px",
          background: "var(--bg-modal)",
          border: "1px solid var(--border-subtle)",
          position: "relative",
          zIndex: 10,
          boxShadow: "var(--card-shadow)",
          borderRadius: "var(--radius-lg, 16px)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              margin: "0 auto 16px auto",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Plane size={26} />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 14px",
              borderRadius: "var(--radius-full)",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399",
              fontSize: "0.78rem",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            <ShieldCheck size={14} />
            <span>অ্যাডমিন ও এমপ্লয়ি পোর্টাল</span>
          </div>

          <h1
            style={{
              fontSize: "1.7rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--text-main)",
              marginBottom: "8px",
            }}
          >
            অ্যাডমিন সাইন-ইন
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0 }}>
            ভিসা ও পাসপোর্ট ক্লায়েন্ট ডাটাবেস এক্সেস করতে লগইন করুন
          </p>
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
              fontSize: "0.84rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Email */}
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

          {/* Password */}
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
              <span>পোর্টালে কানেক্ট হচ্ছে...</span>
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
            marginTop: "22px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          <span>শুধুমাত্র অনুমোদিত কর্মীদের জন্য</span>
          <Link
            href="/"
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            মূল ওয়েবসাইটে ফিরুন &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
