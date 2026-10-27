"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Plane,
  FileText,
  CheckCircle2,
  Globe,
  Building2,
  ShieldCheck,
  Sparkles,
  Calendar,
  PhoneCall,
  ArrowRight,
  Headphones,
} from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();

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
                স্মার্ট ও নির্ভরযোগ্য কনসালটেন্সি
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
              <a href="#services" className="btn-primary" style={{ padding: "14px 28px" }}>
                <FileText size={18} />
                <span>আমাদের সার্ভিসেস দেখুন</span>
              </a>
              <a href="#contact" className="btn-secondary" style={{ padding: "14px 26px" }}>
                <PhoneCall size={16} />
                <span>সরাসরি যোগাযোগ করুন</span>
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
                <span>অভিজ্ঞ কনসালটেন্সি</span>
              </div>
            </div>
          </div>

          {/* Right Column: Agency Highlights & Fast Processing Card */}
          <div>
            <div
              className="glass-panel"
              style={{
                padding: "36px",
                background: "var(--bg-modal)",
                border: "1px solid var(--border-subtle)",
                position: "relative",
                overflow: "hidden",
                boxShadow: "var(--card-shadow)",
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
                  background: "rgba(56, 189, 248, 0.15)",
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
                    শর্মা ভিসা ও পাসপোর্ট সার্ভিসেস
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                    গ্লোবাল ভিসা ও এম্বাসি ডকুমেন্ট ম্যানেজমেন্ট
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
                  <span>বিশ্বস্ত সেবা</span>
                </div>
              </div>

              {/* Service Highlights List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  {
                    title: "ই-পাসপোর্ট জরুরি আবেদন ও নবায়ন",
                    desc: "১০-বছর ও ৫-বছরের ই-পাসপোর্ট ফরম ফিলাপ ও অ্যাপয়েন্টমেন্ট সাপোর্ট।",
                    icon: "📄",
                  },
                  {
                    title: "কানাডা, ইউকে ও ইউরোপ ভিসা ফাইল",
                    desc: "স্টুডেন্ট, ভিজিট ও ওয়ার্ক পারমিটের জন্য নির্ভুল ডকুমেন্ট প্রিপারেশন।",
                    icon: "✈️",
                  },
                  {
                    title: "পররাষ্ট্র মন্ত্রণালয় সত্যায়ন ও নোটারি",
                    desc: "সনদপত্র অনুবাদ, নোটারি ও এম্বাসি লিগ্যালাইজেশন পূর্ণ সহায়তা।",
                    icon: "🏛️",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      gap: "14px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "3px" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Call to action at bottom of card */}
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>হটলাইন পরামর্শ:</span>
                <a
                  href="tel:+8801715144329"
                  style={{
                    color: "var(--primary)",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <PhoneCall size={14} />
                  <span>+880 1715-144329</span>
                </a>
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
          background: "var(--bg-subtle-box)",
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
              অভিজ্ঞ কনসালটেন্সি ও ফাইল সাপোর্ট
            </div>
          </div>
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
        id="contact"
        style={{
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-subtle-box)",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "14px" }}>
            ভিসা ও পাসপোর্ট সংক্রান্ত পরামর্শ প্রয়োজন?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "28px" }}>
            শর্মা ভিসা ও পাসপোর্ট সার্ভিসেস আপনার ফাইল প্রসেসিং এবং এম্বাসি সংক্রান্ত যেকোনো সহায়তায় প্রস্তুত।
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 26px",
              borderRadius: "var(--radius-full)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-highlight)",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: "0.95rem",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <PhoneCall size={18} />
            <span>সরাসরি যোগাযোগ ও হটলাইন: +880 1715-144329</span>
          </div>
        </div>
      </section>
    </div>
  );
}
