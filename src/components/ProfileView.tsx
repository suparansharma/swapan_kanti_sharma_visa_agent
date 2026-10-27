"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User as UserIcon,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  ShieldCheck,
  CreditCard,
  FileText,
  Edit,
  Save,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  X,
} from "lucide-react";

export default function ProfileView() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [phone, setPhone] = useState(user?.employee?.phone || "");
  const [address, setAddress] = useState(user?.employee?.address || "");
  const [emergencyContact, setEmergencyContact] = useState(
    user?.employee?.emergencyContact || ""
  );
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Password Change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  if (!user) {
    return (
      <div className="glass-panel" style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>ব্যবহারকারীর তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  const emp = user.employee;
  const initial = (emp?.name || user.name || "U").charAt(0).toUpperCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          phone,
          address,
          emergencyContact,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "আপডেট ব্যর্থ হয়েছে");
      }

      await refreshUser();
      setSuccessMsg("প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!");
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "সমস্যা হয়েছে";
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!currentPassword) {
      setPassError("বর্তমান পাসওয়ার্ড প্রদান করুন");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না");
      return;
    }

    try {
      setUpdatingPass(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে");
      }

      setPassSuccess("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPassSuccess("");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে";
      setPassError(msg);
    } finally {
      setUpdatingPass(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1000px" }}>
      {/* HEADER BANNER */}
      <div
        className="glass-panel"
        style={{
          padding: "32px",
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--radius-lg)",
          background:
            "linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "74px",
                height: "74px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: "2rem",
                boxShadow: "0 8px 24px rgba(79, 70, 229, 0.35)",
                border: "3px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {initial}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 800,
                    color: "var(--text-main)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {emp?.name || user.name}
                </h1>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background:
                      user.role === "admin"
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(16, 185, 129, 0.15)",
                    color: user.role === "admin" ? "#f87171" : "#34d399",
                    border: `1px solid ${
                      user.role === "admin"
                        ? "rgba(239, 68, 68, 0.3)"
                        : "rgba(16, 185, 129, 0.3)"
                    }`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <ShieldCheck size={13} />
                  {user.role === "admin" ? "অ্যাডমিন (Admin)" : "কর্মচারী (Employee)"}
                </span>
                {emp?.status && (
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: "rgba(56, 189, 248, 0.15)",
                      color: "#38bdf8",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                    }}
                  >
                    সক্রিয় আইডি
                  </span>
                )}
              </div>

              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.92rem",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  <strong style={{ color: "var(--text-main)" }}>পদবি:</strong>{" "}
                  {emp?.designation || "সিস্টেম ইউজার"}
                </span>
                <span>&bull;</span>
                <span>
                  <strong style={{ color: "var(--text-main)" }}>বিভাগ:</strong>{" "}
                  {emp?.department || user.department || "সাধারণ"}
                </span>
                {emp?.employeeId && (
                  <>
                    <span>&bull;</span>
                    <span>
                      <strong style={{ color: "var(--text-main)" }}>এমপ্লয়ি আইডি:</strong>{" "}
                      <code
                        style={{
                          background: "rgba(255, 255, 255, 0.1)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          color: "#38bdf8",
                        }}
                      >
                        {emp.employeeId}
                      </code>
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setShowPasswordModal(true);
                setPassError("");
                setPassSuccess("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                fontWeight: 600,
                color: "#f59e0b",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                background: "rgba(245, 158, 11, 0.1)",
              }}
            >
              <KeyRound size={16} />
              <span>পাসওয়ার্ড পরিবর্তন</span>
            </button>

            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setName(emp?.name || user.name);
                setBio(user.bio || "");
                setPhone(emp?.phone || "");
                setAddress(emp?.address || "");
                setEmergencyContact(emp?.emergencyContact || "");
              }}
              className="btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                fontWeight: 600,
              }}
            >
              <Edit size={16} />
              <span>{isEditing ? "বাতিল করুন" : "প্রোফাইল এডিট"}</span>
            </button>
          </div>
        </div>

        {successMsg && (
          <div
            style={{
              marginTop: "16px",
              padding: "10px 16px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.88rem",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              marginTop: "16px",
              padding: "10px 16px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              fontSize: "0.88rem",
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>

      {/* EDIT FORM (TOGGLEABLE) */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="glass-panel"
          style={{ padding: "28px", borderRadius: "var(--radius-md)" }}
        >
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--text-main)",
              marginBottom: "18px",
            }}
          >
            ব্যক্তিগত তথ্য আপডেট করুন
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "18px",
            }}
          >
            <div>
              <label className="form-label">পূর্ণ নাম *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">মোবাইল নম্বর</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX"
              />
            </div>

            <div>
              <label className="form-label">জরুরি যোগাযোগ (Emergency Contact)</label>
              <input
                type="text"
                className="form-input"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="নম্বর বা নাম"
              />
            </div>

            <div>
              <label className="form-label">ঠিকানা (Address)</label>
              <input
                type="text"
                className="form-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="বর্তমান ঠিকানা"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">বায়ো / নোট (Bio)</label>
              <textarea
                className="form-input"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="আপনার সংক্ষিপ্ত পরিচয়..."
              />
            </div>
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Save size={16} />
              <span>{saving ? "সংরক্ষণ হচ্ছে..." : "তথ্য সংরক্ষণ করুন"}</span>
            </button>
          </div>
        </form>
      )}

      {/* DETAILS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {/* CARD 1: OFFICIAL / EMPLOYMENT DETAILS */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <Building2 size={20} style={{ color: "#38bdf8" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
              অফিসিয়াল কর্মসংস্থান তথ্য
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Briefcase size={15} /> এমপ্লয়ি আইডি:
              </span>
              <span style={{ fontWeight: 700, color: "#38bdf8" }}>
                {emp?.employeeId || "—"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={15} /> বিভাগ (Department):
              </span>
              <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                {emp?.department || user.department || "General"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={15} /> পদবি (Designation):
              </span>
              <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                {emp?.designation || (user.role === "admin" ? "Super Admin" : "Employee")}
              </span>
            </div>

            {emp?.joiningDate && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={15} /> যোগদানের তারিখ:
                </span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                  {emp.joiningDate}
                </span>
              </div>
            )}

            {emp?.salary !== undefined && emp?.salary > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CreditCard size={15} /> নির্ধারিত মাসিক বেতন:
                </span>
                <span style={{ fontWeight: 700, color: "#34d399" }}>
                  ৳ {emp.salary.toLocaleString("bn-BD")}
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={15} /> চাকরির স্ট্যাটাস:
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: emp?.status === "active" ? "#34d399" : "#fbbf24",
                  textTransform: "capitalize",
                }}
              >
                {emp?.status === "active" ? "সক্রিয় (Active)" : emp?.status || "সক্রিয়"}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: CONTACT & ACCESS DETAILS */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <UserIcon size={20} style={{ color: "#818cf8" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
              যোগাযোগ ও লগইন তথ্য
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={15} /> লগইন ইমেইল:
              </span>
              <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                {user.email}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Phone size={15} /> ফোন নম্বর:
              </span>
              <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                {emp?.phone || "সংরক্ষিত নেই"}
              </span>
            </div>

            {emp?.emergencyContact && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Phone size={15} /> জরুরি যোগাযোগ:
                </span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                  {emp.emergencyContact}
                </span>
              </div>
            )}

            {emp?.address && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={15} /> ঠিকানা:
                </span>
                <span style={{ fontWeight: 600, color: "var(--text-main)", textAlign: "right", maxWidth: "180px" }}>
                  {emp.address}
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={15} /> অ্যাকাউন্ট রোল:
              </span>
              <span style={{ fontWeight: 700, color: user.role === "admin" ? "#f87171" : "#38bdf8" }}>
                {user.role === "admin" ? "Super Admin" : "Employee Portal"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <KeyRound size={15} /> পাসওয়ার্ড:
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(true);
                  setPassError("");
                  setPassSuccess("");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f59e0b",
                  fontWeight: 600,
                  fontSize: "0.84rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                পাসওয়ার্ড পরিবর্তন করুন
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={15} /> অ্যাকাউন্ট তৈরি:
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("bn-BD", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BIO / NOTES SECTION */}
      {user.bio && (
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <h4
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--text-main)",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FileText size={16} style={{ color: "#38bdf8" }} />
            বায়ো / বিবরণ
          </h4>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
            {user.bio}
          </p>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !updatingPass) setShowPasswordModal(false);
          }}
        >
          <div
            className="glass-panel modal-container"
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "30px",
              borderRadius: "20px",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.25)",
              position: "relative",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f59e0b",
                    flexShrink: 0,
                  }}
                >
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.3 }}>
                    পাসওয়ার্ড পরিবর্তন করুন
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    সুরক্ষার জন্য নিয়মিত পাসওয়ার্ড পরিবর্তন করুন
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                disabled={updatingPass}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <X size={18} />
              </button>
            </div>

            {passSuccess && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#e11d48",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                }}
              >
                <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Current Password */}
              <div>
                <label className="form-label">
                  বর্তমান পাসওয়ার্ড <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Lock size={16} />
                  </div>
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                    required
                    style={{
                      paddingLeft: "42px",
                      paddingRight: "44px",
                      borderRadius: "12px",
                      fontSize: "0.92rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "6px",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "6px",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    aria-label={showCurrentPass ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                  >
                    {showCurrentPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="form-label">
                  নতুন পাসওয়ার্ড <span style={{ color: "#ef4444" }}>*</span>{" "}
                  <span style={{ fontSize: "0.78rem", fontWeight: 400, color: "var(--text-muted)" }}>
                    (কমপক্ষে ৬ অক্ষর)
                  </span>
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <KeyRound size={16} />
                  </div>
                  <input
                    type={showNewPass ? "text" : "password"}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="নতুন শক্তিশালী পাসওয়ার্ড লিখুন"
                    required
                    minLength={6}
                    style={{
                      paddingLeft: "42px",
                      paddingRight: "44px",
                      borderRadius: "12px",
                      fontSize: "0.92rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "6px",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "6px",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    aria-label={showNewPass ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                  >
                    {showNewPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="form-label">
                  নতুন পাসওয়ার্ড নিশ্চিত করুন <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Lock size={16} />
                  </div>
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
                    required
                    minLength={6}
                    style={{
                      paddingLeft: "42px",
                      paddingRight: "44px",
                      borderRadius: "12px",
                      fontSize: "0.92rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "6px",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "6px",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    aria-label={showConfirmPass ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                  >
                    {showConfirmPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn-secondary"
                  disabled={updatingPass}
                  style={{
                    borderRadius: "12px",
                    padding: "10px 20px",
                    fontSize: "0.92rem",
                  }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={updatingPass}
                  className="btn-primary"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35)",
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 22px",
                    fontSize: "0.92rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <KeyRound size={16} />
                  <span>{updatingPass ? "আপডেট হচ্ছে..." : "পাসওয়ার্ড আপডেট করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
