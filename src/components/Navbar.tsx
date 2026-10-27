"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Plane,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        backgroundColor: "var(--bg-surface)",
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
            <div className="brand-title">
              Sharma Visa & Passport
            </div>
            <div className="brand-subtitle" style={{ marginTop: "-1px" }}>
              গ্লোবাল ভিসা ও পাসপোর্ট ম্যানেজমেন্ট
            </div>
          </div>
        </Link>

        {/* Dark / Light Mode Toggle Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-main)",
            }}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <>
                <Sun size={15} style={{ color: "#f59e0b" }} />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={15} style={{ color: "#6366f1" }} />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* User actions: Only show user info and logout when authenticated */}
          {!loading && user && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link
                href="/admin?tab=profile"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "5px 12px",
                  background: "rgba(99, 102, 241, 0.12)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
                title="প্রোফাইল দেখতে ক্লিক করুন"
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                  }}
                >
                  {(user.employee?.name || user.name || "U").charAt(0).toUpperCase()}
                </div>
                <div style={{ lineHeight: 1.25, maxWidth: "160px" }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-main)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.employee?.name || user.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "#38bdf8",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.employee?.designation || (user.role === "admin" ? "অ্যাডমিন" : "এমপ্লয়ি")} &bull; প্রোফাইল
                  </div>
                </div>
              </Link>

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
          )}
        </div>
      </div>
    </header>
  );
}
