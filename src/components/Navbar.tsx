"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Database,
  Plane,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  Globe,
  Briefcase,
} from "lucide-react";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    latencyMs?: number;
    host?: string;
  } | null>(null);

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          setDbStatus({
            connected: data.database?.connected || false,
            latencyMs: data.database?.latencyMs,
            host: data.database?.host,
          });
        } else {
          setDbStatus({ connected: false });
        }
      } catch (err) {
        setDbStatus({ connected: false });
      }
    };

    checkDb();
    const interval = setInterval(checkDb, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        backgroundColor: "rgba(7, 9, 14, 0.85)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Logo and Brand */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.45)",
            }}
          >
            <Plane size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                background: "linear-gradient(to right, #ffffff, #cbd5e1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Sharma Visa & Passport
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--accent-cyan)",
                letterSpacing: "0.06em",
                fontWeight: 600,
                marginTop: "-1px",
              }}
            >
              গ্লোবাল ভিসা ও পাসপোর্ট ম্যানেজমেন্ট
            </div>
          </div>
        </Link>

        {/* Navigation Quick Links */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
          className="desktop-only"
        >
          <a
            href="#tracking"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s",
            }}
          >
            <FileSearch size={14} style={{ color: "#38bdf8" }} />
            <span>ফাইল ট্র্যাকিং</span>
          </a>
          <a
            href="#services"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s",
            }}
          >
            <Briefcase size={14} style={{ color: "#818cf8" }} />
            <span>ভিসা সার্ভিসেস</span>
          </a>
          <a
            href="#countries"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s",
            }}
          >
            <Globe size={14} style={{ color: "#34d399" }} />
            <span>জনপ্রিয় দেশসমূহ</span>
          </a>
        </nav>

        {/* Status & Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Live DB indicator */}
          <div
            title={
              dbStatus?.connected
                ? `MongoDB Atlas Live (${dbStatus.host || "connected"})`
                : "Checking database..."
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "5px 12px",
              borderRadius: "var(--radius-full)",
              background: "rgba(16, 22, 38, 0.7)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.76rem",
              color: "var(--text-secondary)",
            }}
          >
            <Database size={13} style={{ color: "#34d399" }} />
            {dbStatus?.connected ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "#34d399",
                  fontWeight: 600,
                }}
              >
                <span className="pulse-indicator" />
                Live DB
              </span>
            ) : (
              <span style={{ color: "#f87171" }}>Offline</span>
            )}
          </div>

          {/* User actions */}
          {!loading && (
            <div>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "4px 12px",
                      background: "rgba(99, 102, 241, 0.12)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ lineHeight: 1.2 }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "var(--text-main)",
                        }}
                      >
                        {user.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "#34d399",
                          fontWeight: 600,
                        }}
                      >
                        Admin Portal
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => logout()}
                    className="btn-secondary btn-sm btn-danger"
                    title="Log out of session"
                    style={{ cursor: "pointer", padding: "6px 12px" }}
                  >
                    <LogOut size={13} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link href="/login" className="btn-primary btn-sm" style={{ padding: "8px 18px" }}>
                  <UserIcon size={14} />
                  <span>Admin Sign In</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
