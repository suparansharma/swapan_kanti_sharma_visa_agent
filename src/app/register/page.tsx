"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        minHeight: "70vh",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary-light)",
            margin: "0 auto 20px auto",
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--text-main)",
            marginBottom: "10px",
          }}
        >
          Registration Disabled
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.92rem",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          Public account creation is disabled. Please sign in with your administrative credentials. Redirecting to Sign In...
        </p>

        <Link
          href="/login"
          className="btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
          }}
        >
          <span>Go to Sign In</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
