"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PassportEntryModule from "@/components/PassportEntryModule";
import DailyEntryModule from "@/components/DailyEntryModule";
import ReportModule from "@/components/ReportModule";
import HRMModule from "@/components/HRMModule";
import ProfileView from "@/components/ProfileView";
import {
  VISA_GENERAL_STATUSES,
  VISA_MEDICAL_STATUSES,
  ALL_VISA_STATUSES,
  isMedicalPatient,
  getAvailableVisaStatuses,
  getVisaStatusBadge,
} from "@/constants/visaStatuses";
import {
  INDIAN_VISA_TYPES,
  STRUCTURED_INDIAN_VISA_TYPES,
  formatVisaTypeDisplay,
} from "@/constants/visaTypes";
import {
  Plane,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
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
  Wallet,
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
  visaType?: string;
  serviceType: string;
  status: string;
  applicationDate: string;
  estimatedDelivery?: string;
  feeAmount: number;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  feeStatus: "paid" | "partial" | "pending";
  receivedDate?: string;
  receivedBy?: string;
  receivedByEmployeeId?: string;
  notes?: string;
  applicationCategory?: "individual" | "family_group";
  isFamilyHead?: boolean;
  familyGroupId?: string;
  familyHeadTrackingId?: string;
  familyHeadName?: string;
  familyRelation?: string;
  familyMemberCount?: number;
  groupMembersSummary?: string;
  createdBy?: { _id: string; name: string; email?: string } | string;
  createdByName?: string;
  updatedBy?: { _id: string; name: string; email?: string } | string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Module-level in-memory cache to provide instant 0ms rendering when switching to visa_applications tab
let memoryVisaCache: {
  applications: VisaApplicationItem[];
  stats: {
    total: number;
    totalContractAmount: number;
    totalCollectedAmount: number;
    totalDueAmount: number;
    approved: number;
    processing: number;
    ready: number;
  };
  pagination: {
    page: number;
    totalPages: number;
    totalEntries: number;
  };
  filterKey: string;
  cachedAt: number;
} | null = null;

let memoryEmployeesCache: Array<{ _id: string; name: string; employeeId?: string; designation?: string; department?: string }> | null = null;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab") as
    | "passport_entry"
    | "overview"
    | "visa_applications"
    | "accounts_visa_passport"
    | "accounts"
    | "daily_entry"
    | "reports"
    | "passport_reports"
    | "visa_reports"
    | "hrm"
    | "hrm_employees"
    | "hrm_departments"
    | "hrm_designations"
    | null;

  // Active navigation tab
  // Options: 'passport_entry' | 'overview' | 'visa_applications' | 'accounts_visa_passport' | 'accounts' | 'daily_entry' | 'reports' | 'passport_reports' | 'visa_reports' | 'hrm' | 'hrm_employees' | 'hrm_departments' | 'hrm_designations' | 'profile'
  const [activeTab, setActiveTabState] = useState<
    | "passport_entry"
    | "overview"
    | "visa_applications"
    | "accounts_visa_passport"
    | "accounts"
    | "daily_entry"
    | "reports"
    | "passport_reports"
    | "visa_reports"
    | "hrm"
    | "hrm_employees"
    | "hrm_departments"
    | "hrm_designations"
    | "profile"
  >(
    (tabFromUrl === "daily_entry" || tabFromUrl === "accounts" || tabFromUrl === "accounts_visa_passport"
      ? "accounts_visa_passport"
      : (tabFromUrl as any)) || "passport_entry"
  );

  // Sync tab with URL
  useEffect(() => {
    if (tabFromUrl) {
      const resolvedTab =
        tabFromUrl === "daily_entry" || tabFromUrl === "accounts"
          ? "accounts_visa_passport"
          : tabFromUrl;
      if (resolvedTab !== activeTab) {
        setActiveTabState(resolvedTab as any);
      }
    }
  }, [tabFromUrl]);

  const setActiveTab = (
    tab:
      | "passport_entry"
      | "overview"
      | "visa_applications"
      | "accounts_visa_passport"
      | "accounts"
      | "daily_entry"
      | "reports"
      | "passport_reports"
      | "visa_reports"
      | "hrm"
      | "hrm_employees"
      | "hrm_departments"
      | "hrm_designations"
      | "profile"
  ) => {
    const targetTab =
      tab === "daily_entry" || tab === "accounts" ? "accounts_visa_passport" : tab;
    setActiveTabState(targetTab);
    router.push(`/admin?tab=${targetTab}`, { scroll: false });
  };

  // Sidebar accordions state
  const [passportOpen, setPassportOpen] = useState(true);
  const [visaOpen, setVisaOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);
  const [hrmOpen, setHrmOpen] = useState(true);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Visa applications state (hydrated instantly from in-memory cache if available)
  const [applications, setApplications] = useState<VisaApplicationItem[]>(() => memoryVisaCache?.applications || []);
  const [visaStats, setVisaStats] = useState(() => memoryVisaCache?.stats || {
    total: 0,
    totalContractAmount: 0,
    totalCollectedAmount: 0,
    totalDueAmount: 0,
    approved: 0,
    processing: 0,
    ready: 0,
  });
  const [loadingVisa, setLoadingVisa] = useState(() => !memoryVisaCache);
  const [isSyncingVisa, setIsSyncingVisa] = useState(false);
  const [searchVisa, setSearchVisa] = useState("");
  const [filterVisaStatus, setFilterVisaStatus] = useState("all");
  const [filterVisaCategory, setFilterVisaCategory] = useState<"all" | "individual" | "family_group">("all");
  const [showAddVisaModal, setShowAddVisaModal] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState<VisaApplicationItem | null>(null);

  // Visa pagination state
  const [visaCurrentPage, setVisaCurrentPage] = useState(() => memoryVisaCache?.pagination.page || 1);
  const [visaPageSize, setVisaPageSize] = useState(10);
  const [visaTotalPages, setVisaTotalPages] = useState(() => memoryVisaCache?.pagination.totalPages || 1);
  const [visaTotalMatching, setVisaTotalMatching] = useState(() => memoryVisaCache?.pagination.totalEntries || 0);

  // New Visa form state
  const [applicantName, setApplicantName] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("India");
  const [serviceType, setServiceType] = useState("tourist_visa");
  const [visaType, setVisaType] = useState("");
  const [visaReceivedDate, setVisaReceivedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [employeesList, setEmployeesList] = useState<
    Array<{ _id: string; name: string; employeeId?: string; designation?: string; department?: string }>
  >([]);
  const [visaReceivedBy, setVisaReceivedBy] = useState("");
  const [status, setStatus] = useState("submitted");
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [feeStatus, setFeeStatus] = useState<"paid" | "partial" | "pending">("pending");
  const [notes, setNotes] = useState("");
  const [creatingVisa, setCreatingVisa] = useState(false);

  // Family / Group application states
  const [appCategory, setAppCategory] = useState<"individual" | "family_group">("individual");
  const [familyMembers, setFamilyMembers] = useState<
    Array<{
      id: string;
      applicantName: string;
      passportNumber: string;
      relation: string;
      serviceType: string;
      visaType: string;
    }>
  >([]);

  const handleAddFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        applicantName: "",
        passportNumber: "",
        relation: prev.length === 0 ? "স্ত্রী" : "সন্তান",
        serviceType: serviceType || "tourist_visa",
        visaType: visaType || "",
      },
    ]);
  };

  const handleUpdateFamilyMember = (
    id: string,
    field: "applicantName" | "passportNumber" | "relation" | "serviceType" | "visaType",
    val: string
  ) => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Edit Visa modal state
  const [editingVisa, setEditingVisa] = useState<VisaApplicationItem | null>(null);
  const [editApplicantName, setEditApplicantName] = useState("");
  const [editPassportNumber, setEditPassportNumber] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDestinationCountry, setEditDestinationCountry] = useState("India");
  const [editServiceType, setEditServiceType] = useState("tourist_visa");
  const [editVisaType, setEditVisaType] = useState("");
  const [editVisaReceivedDate, setEditVisaReceivedDate] = useState("");
  const [editVisaReceivedBy, setEditVisaReceivedBy] = useState("");
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

  // Fetch Visa Applications with in-memory caching and background revalidation
  const fetchVisaApplications = async (
    page = visaCurrentPage,
    limit = visaPageSize,
    search = searchVisa,
    statusFilter = filterVisaStatus,
    categoryFilter = filterVisaCategory,
    isBackgroundSync = false
  ) => {
    const filterKey = `${page}_${limit}_${search.trim()}_${statusFilter}_${categoryFilter}`;

    // Only show full loading spinner if we don't have cached data for this filter
    if (!isBackgroundSync && (!memoryVisaCache || memoryVisaCache.filterKey !== filterKey)) {
      setLoadingVisa(true);
    } else {
      setIsSyncingVisa(true);
    }

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/visa-applications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const apps = data.applications || [];
        const stats = data.stats || {
          total: 0,
          totalContractAmount: 0,
          totalCollectedAmount: 0,
          totalDueAmount: 0,
          approved: 0,
          processing: 0,
          ready: 0,
        };
        const pageData = {
          page: data.pagination?.page || page,
          totalPages: data.pagination?.totalPages || 1,
          totalEntries: data.pagination?.totalEntries || 0,
        };

        setApplications(apps);
        setVisaStats(stats);
        setVisaCurrentPage(pageData.page);
        setVisaTotalPages(pageData.totalPages);
        setVisaTotalMatching(pageData.totalEntries);

        memoryVisaCache = {
          applications: apps,
          stats,
          pagination: pageData,
          filterKey,
          cachedAt: Date.now(),
        };
      }
    } catch (err) {
      console.error("Error fetching visa applications:", err);
    } finally {
      setLoadingVisa(false);
      setIsSyncingVisa(false);
    }
  };

  // Fetch employees list for receiver select box (cached in memory)
  const fetchEmployeesList = async () => {
    if (memoryEmployeesCache && memoryEmployeesCache.length > 0) {
      setEmployeesList(memoryEmployeesCache);
      return;
    }
    try {
      const res = await fetch("/api/employees?limit=100");
      if (res.ok) {
        const data = await res.json();
        const emps = data.employees || [];
        memoryEmployeesCache = emps;
        setEmployeesList(emps);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  useEffect(() => {
    if (user?.name && !visaReceivedBy) {
      setVisaReceivedBy(user.name);
    }
  }, [user, visaReceivedBy]);

  useEffect(() => {
    if (activeTab === "visa_applications") {
      const filterKey = `1_${visaPageSize}_${searchVisa.trim()}_${filterVisaStatus}_${filterVisaCategory}`;
      if (memoryVisaCache && memoryVisaCache.filterKey === filterKey) {
        // Immediate restore from cache - 0ms delay!
        setApplications(memoryVisaCache.applications);
        setVisaStats(memoryVisaCache.stats);
        setVisaCurrentPage(memoryVisaCache.pagination.page);
        setVisaTotalPages(memoryVisaCache.pagination.totalPages);
        setVisaTotalMatching(memoryVisaCache.pagination.totalEntries);
        setLoadingVisa(false);
        // Background sync to ensure fresh data without blocking UI
        fetchVisaApplications(1, visaPageSize, searchVisa, filterVisaStatus, filterVisaCategory, true);
      } else {
        fetchVisaApplications(1, visaPageSize, searchVisa, filterVisaStatus, filterVisaCategory, !!memoryVisaCache);
      }
      if (!memoryEmployeesCache || memoryEmployeesCache.length === 0) {
        fetchEmployeesList();
      }
    }
  }, [filterVisaStatus, filterVisaCategory, visaPageSize, activeTab]);

  const handleVisaPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > visaTotalPages || newPage === visaCurrentPage) return;
    setVisaCurrentPage(newPage);
    fetchVisaApplications(newPage, visaPageSize, searchVisa, filterVisaStatus, filterVisaCategory);
  };

  // Create Visa Application
  const handleCreateVisa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingVisa(true);
      const res = await fetch("/api/visa-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationCategory: appCategory,
          isFamilyGroup: appCategory === "family_group",
          applicantName,
          passportNumber,
          phone,
          email,
          destinationCountry,
          serviceType,
          visaType: visaType.trim(),
          receivedDate: visaReceivedDate || new Date().toISOString().split("T")[0],
          receivedBy: visaReceivedBy.trim() || user?.name || "",
          status,
          feeAmount: numVisaTotal,
          totalAmount: numVisaTotal,
          paidAmount: numVisaPaid,
          feeStatus,
          notes,
          members:
            appCategory === "family_group"
              ? familyMembers.filter((m) => m.applicantName.trim() && m.passportNumber.trim())
              : [],
        }),
      });
      if (res.ok) {
        setShowAddVisaModal(false);
        setAppCategory("individual");
        setFamilyMembers([]);
        setApplicantName("");
        setPassportNumber("");
        setPhone("");
        setEmail("");
        setVisaType("");
        setVisaReceivedDate(new Date().toISOString().split("T")[0]);
        setVisaReceivedBy(user?.name || "");
        setTotalAmount("");
        setPaidAmount("");
        setNotes("");
        memoryVisaCache = null;
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
        memoryVisaCache = null;
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
    setEditVisaType(app.visaType || "");
    setEditVisaReceivedDate(app.receivedDate || (app.createdAt ? app.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]));
    setEditVisaReceivedBy(
      app.receivedBy ||
      (typeof app.createdBy === "object" && app.createdBy?.name ? app.createdBy.name : app.createdByName) ||
      user?.name ||
      ""
    );
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
          visaType: editVisaType.trim(),
          receivedDate: editVisaReceivedDate,
          receivedBy: editVisaReceivedBy.trim(),
          status: editStatus,
          totalAmount: numEditVisaTotal,
          paidAmount: numEditVisaPaid,
          notes: editNotes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        memoryVisaCache = null;
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
        memoryVisaCache = null;
        fetchVisaApplications();
      }
    } catch (err) {
      console.error("Visa status update error:", err);
    }
  };

  const getStatusBadge = (s: string) => {
    const raw = getVisaStatusBadge(s);
    switch (s) {
      case "submitted":
        return { label: raw.label, bg: "rgba(99, 102, 241, 0.12)", color: "#4f46e5", border: "rgba(99, 102, 241, 0.3)" };
      case "approved":
      case "delivery_completed":
      case "dr_ayush_done":
        return { label: raw.label, bg: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "rgba(16, 185, 129, 0.3)" };
      case "document_verification":
      case "appointment_slot_pending":
      case "ready_for_appointment":
        return { label: raw.label, bg: "rgba(245, 158, 11, 0.12)", color: "#b45309", border: "rgba(245, 158, 11, 0.3)" };
      case "visa_processing":
      case "embassy_processing":
        return { label: raw.label, bg: "rgba(14, 165, 233, 0.12)", color: "#0284c7", border: "rgba(14, 165, 233, 0.3)" };
      case "ready_for_delivery":
      case "ready_for_pickup":
        return { label: raw.label, bg: "rgba(16, 185, 129, 0.15)", color: "#047857", border: "rgba(16, 185, 129, 0.35)" };
      default:
        return { label: raw.label, bg: raw.bg || "rgba(100, 116, 139, 0.1)", color: raw.color || "#475569", border: "rgba(100, 116, 139, 0.25)" };
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
                  {/* Passport Entry */}
                  <button
                    onClick={() => setActiveTab("passport_entry")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
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
                    <FileText size={15} />
                    <span>Passport Entry</span>
                  </button>
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
                      <span>Visa Entry</span>
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

            {/* 3. ACCOUNT MODULE ACCORDION */}
            <div style={{ marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setAccountOpen(!accountOpen)}
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
                  <Wallet size={18} style={{ color: "#34d399" }} />
                  <span>Accounts</span>
                </div>
                {accountOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {accountOpen && (
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
                  <button
                    onClick={() => setActiveTab("accounts_visa_passport")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background:
                        activeTab === "accounts_visa_passport" ||
                        activeTab === "accounts" ||
                        activeTab === "daily_entry"
                          ? "var(--primary-gradient)"
                          : "transparent",
                      color:
                        activeTab === "accounts_visa_passport" ||
                        activeTab === "accounts" ||
                        activeTab === "daily_entry"
                          ? "#ffffff"
                          : "var(--text-secondary)",
                      fontWeight:
                        activeTab === "accounts_visa_passport" ||
                        activeTab === "accounts" ||
                        activeTab === "daily_entry"
                          ? 700
                          : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <CreditCard size={15} />
                      <span>Visa & Passport</span>
                    </div>
                    {(activeTab === "accounts_visa_passport" ||
                      activeTab === "accounts" ||
                      activeTab === "daily_entry") && (
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

            {/* 4. HRM MODULE ACCORDION (Department, Designation, Employee) */}
            <div style={{ marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setHrmOpen(!hrmOpen)}
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
                  <Users size={18} style={{ color: "#c084fc" }} />
                  <span>HRM</span>
                </div>
                {hrmOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {hrmOpen && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    paddingLeft: "16px",
                    marginTop: "4px",
                    borderLeft: "2px solid rgba(168, 85, 247, 0.3)",
                    marginLeft: "18px",
                  }}
                >
                  {/* Sub-item 1: Employee */}
                  <button
                    onClick={() => setActiveTab("hrm_employees")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background:
                        activeTab === "hrm_employees" || activeTab === "hrm"
                          ? "var(--primary-gradient)"
                          : "transparent",
                      color:
                        activeTab === "hrm_employees" || activeTab === "hrm"
                          ? "#ffffff"
                          : "var(--text-secondary)",
                      fontWeight:
                        activeTab === "hrm_employees" || activeTab === "hrm" ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <UserIcon size={15} />
                      <span>Employee Entry</span>
                    </div>
                    {(activeTab === "hrm_employees" || activeTab === "hrm") && (
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

                  {/* Sub-item 2: Department */}
                  <button
                    onClick={() => setActiveTab("hrm_departments")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background:
                        activeTab === "hrm_departments"
                          ? "var(--primary-gradient)"
                          : "transparent",
                      color:
                        activeTab === "hrm_departments"
                          ? "#ffffff"
                          : "var(--text-secondary)",
                      fontWeight: activeTab === "hrm_departments" ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Building2 size={15} />
                      <span>Department</span>
                    </div>
                    {activeTab === "hrm_departments" && (
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

                  {/* Sub-item 3: Designation */}
                  <button
                    onClick={() => setActiveTab("hrm_designations")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background:
                        activeTab === "hrm_designations"
                          ? "var(--primary-gradient)"
                          : "transparent",
                      color:
                        activeTab === "hrm_designations"
                          ? "#ffffff"
                          : "var(--text-secondary)",
                      fontWeight: activeTab === "hrm_designations" ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Briefcase size={15} />
                      <span>Designation</span>
                    </div>
                    {activeTab === "hrm_designations" && (
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

        {/* Sidebar Footer: User / Employee Profile & Logout */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            onClick={() => setActiveTab("profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              padding: "6px 8px",
              borderRadius: "var(--radius-md)",
              background: activeTab === "profile" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              transition: "all 0.15s ease",
            }}
            title="আপনার প্রোফাইল দেখতে ক্লিক করুন"
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                flexShrink: 0,
              }}
            >
              {(user?.employee?.name || user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.25, overflow: "hidden", flex: 1 }}>
              <div
                style={{
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  color: "var(--text-main)",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {user?.employee?.name || user?.name || "ব্যবহারকারী"}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#38bdf8",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  fontWeight: 600,
                }}
              >
                {user?.employee?.designation || (user?.role === "admin" ? "অ্যাডমিন" : "এমপ্লয়ি")} &bull; প্রোফাইল
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

        {/* VIEW 1.5: DAILY ENTRY SUB-MODULE (ACCOUNT MODULE) */}
        {(activeTab === "accounts_visa_passport" ||
          activeTab === "accounts" ||
          activeTab === "daily_entry") && <DailyEntryModule />}

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

              {/* Daily Accounting Ledger Quick Jump Card */}
              <div
                onClick={() => setActiveTab("accounts_visa_passport")}
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
                  <Wallet size={24} />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "6px" }}>
                  Accounts (Visa & Passport) ➔
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  পাসপোর্ট ও ভিসা এন্ট্রির নগদ জমা, মোট চুক্তি এবং বকেয়া টাকার দৈনিক ক্যাশবুক ও রিসিট।
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
                  onClick={() => fetchVisaApplications(visaCurrentPage, visaPageSize, searchVisa, filterVisaStatus, filterVisaCategory, false)}
                  className="btn-secondary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  title="রিফ্রেশ করুন"
                >
                  <RefreshCw size={14} className={loadingVisa || isSyncingVisa ? "spin" : ""} />
                  <span>{isSyncingVisa ? "আপডেট হচ্ছে..." : "রিফ্রেশ"}</span>
                </button>
                <button
                  onClick={() => {
                    setVisaReceivedBy(user?.name || "");
                    setShowAddVisaModal(true);
                  }}
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
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "14px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              }}
            >
              {/* Row 1: Category Segmented Switcher & Quick Counter */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    background: "var(--bg-subtle-box, #f1f5f9)",
                    borderRadius: "10px",
                    padding: "4px",
                    border: "1px solid var(--border-subtle)",
                    gap: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setFilterVisaCategory("all")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: filterVisaCategory === "all" ? "var(--primary-gradient)" : "transparent",
                      color: filterVisaCategory === "all" ? "#fff" : "var(--text-secondary)",
                      fontWeight: filterVisaCategory === "all" ? 800 : 600,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      boxShadow: filterVisaCategory === "all" ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>সকল আবেদন</span>
                    <span
                      style={{
                        padding: "1px 6px",
                        borderRadius: "10px",
                        background: filterVisaCategory === "all" ? "rgba(255, 255, 255, 0.25)" : "rgba(0,0,0,0.06)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      {visaStats.total}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterVisaCategory("individual")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: filterVisaCategory === "individual" ? "#10b981" : "transparent",
                      color: filterVisaCategory === "individual" ? "#fff" : "var(--text-secondary)",
                      fontWeight: filterVisaCategory === "individual" ? 800 : 600,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      boxShadow: filterVisaCategory === "individual" ? "0 2px 8px rgba(16, 185, 129, 0.3)" : "none",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <UserIcon size={14} />
                    <span>একক আবেদন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterVisaCategory("family_group")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: filterVisaCategory === "family_group" ? "#0284c7" : "transparent",
                      color: filterVisaCategory === "family_group" ? "#fff" : "var(--text-secondary)",
                      fontWeight: filterVisaCategory === "family_group" ? 800 : 600,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      boxShadow: filterVisaCategory === "family_group" ? "0 2px 8px rgba(2, 132, 199, 0.3)" : "none",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Users size={14} />
                    <span>ফ্যামিলি / গ্রুপ আবেদন</span>
                  </button>
                </div>

                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  মোট ফলাফল: <strong style={{ color: "var(--text-main)" }}>{visaTotalMatching}</strong> টি রেকর্ড
                </div>
              </div>

              {/* Row 2: Search, Status Filter & Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchVisaApplications(1, visaPageSize, searchVisa, filterVisaStatus, filterVisaCategory);
                  }}
                  style={{ display: "flex", gap: "10px", flex: 1, minWidth: "280px" }}
                >
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search
                      size={16}
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
                      value={searchVisa}
                      onChange={(e) => setSearchVisa(e.target.value)}
                      placeholder="আবেদনকারীর নাম, পাসপোর্ট নং, মোবাইল নম্বর, বা ট্র্যাকিং আইডি..."
                      className="input-field"
                      style={{ paddingLeft: "38px", height: "42px", fontSize: "0.88rem", borderRadius: "8px" }}
                    />
                    {searchVisa && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchVisa("");
                          fetchVisaApplications(1, visaPageSize, "", filterVisaStatus, filterVisaCategory);
                        }}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button type="submit" className="btn-secondary" style={{ height: "42px", padding: "0 20px", fontWeight: 700 }}>
                    খুঁজুন
                  </button>
                </form>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      স্ট্যাটাস ফিল্টার:
                    </span>
                    <select
                      value={filterVisaStatus}
                      onChange={(e) => setFilterVisaStatus(e.target.value)}
                      className="input-field"
                      style={{ width: "auto", height: "42px", fontSize: "0.85rem", padding: "0 12px", borderRadius: "8px" }}
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
                </div>
              </div>
            </div>

            {/* Visa Applications Table Card */}
            <div
              className="glass-panel"
              style={{
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                  <thead>
                    <tr
                      style={{
                        background: "var(--table-head-bg, #f8fafc)",
                        borderBottom: "2px solid var(--border-subtle)",
                      }}
                    >
                      <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>ট্র্যাকিং ও তারিখ</th>
                      <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", minWidth: "190px" }}>আবেদনকারী ও ধরন</th>
                      <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>পাসপোর্ট ও যোগাযোগ</th>
                      <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", minWidth: "140px" }}>সার্ভিস ধরন</th>
                      <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>চুক্তি ও বকেয়া</th>
                      <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap", width: "160px" }}>স্ট্যাটাস</th>
                      <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>রিসিভকারী / তৈরি</th>
                      <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", textAlign: "right", whiteSpace: "nowrap" }}>একশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingVisa ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "60px 20px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                border: "3px solid rgba(99, 102, 241, 0.2)",
                                borderTopColor: "var(--primary, #6366f1)",
                                animation: "spin 0.8s linear infinite",
                              }}
                            />
                            <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.95rem" }}>
                              ভিসা আবেদন তালিকা লোড হচ্ছে...
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                              অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : applications.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "50px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                          <div style={{ marginBottom: "12px", fontSize: "1.05rem" }}>কোনো ভিসা আবেদন পাওয়া যায়নি।</div>
                          <button
                            onClick={() => {
                              setVisaReceivedBy(user?.name || "");
                              setShowAddVisaModal(true);
                            }}
                            className="btn-primary btn-sm"
                          >
                            + নতুন ভিসা আবেদন যুক্ত করুন
                          </button>
                        </td>
                      </tr>
                    ) : (
                      applications.map((app) => {
                        const total = app.totalAmount ?? app.feeAmount ?? 0;
                        const paid = app.paidAmount ?? (app.feeStatus === "paid" ? total : 0);
                        const due = app.dueAmount ?? Math.max(0, total - paid);
                        const serviceLabel =
                          app.serviceType === "tourist_visa"
                            ? "ট্যুরিস্ট ভিসা"
                            : app.serviceType === "medical_visa"
                            ? "মেডিকেল ভিসা"
                            : app.serviceType === "medical_attendant"
                            ? "মেডিকেল এটেন্ডেন্ট"
                            : app.serviceType === "student_visa"
                            ? "স্টুডেন্ট ভিসা"
                            : app.serviceType === "work_permit"
                            ? "ওয়ার্ক পারমিট"
                            : app.serviceType === "business_visa"
                            ? "বিজনেস ভিসা"
                            : app.serviceType;

                        const creator =
                          typeof app.createdBy === "object" && app.createdBy?.name
                            ? app.createdBy.name
                            : app.createdByName || "সিস্টেম";
                        const createDate = app.createdAt
                          ? new Date(app.createdAt).toLocaleDateString("bn-BD", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—";

                        const updater =
                          typeof app.updatedBy === "object" && app.updatedBy?.name
                            ? app.updatedBy.name
                            : app.updatedByName;

                        return (
                          <tr
                            key={app._id}
                            style={{
                              borderBottom: "1px solid var(--border-subtle)",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--bg-card-hover, rgba(99, 102, 241, 0.02))";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            {/* Col 1: Tracking ID & Received Date */}
                            <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 9px",
                                  borderRadius: "6px",
                                  background: "rgba(14, 165, 233, 0.08)",
                                  border: "1px solid rgba(14, 165, 233, 0.25)",
                                  color: "#0284c7",
                                  fontWeight: 800,
                                  fontFamily: "var(--font-mono, monospace)",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {app.trackingId}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.74rem",
                                  color: "var(--text-muted)",
                                  marginTop: "5px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Calendar size={12} style={{ opacity: 0.7 }} />
                                <span>রিসিভ: {app.receivedDate || createDate}</span>
                              </div>
                            </td>

                            {/* Col 2: Applicant Name & Category Badges */}
                            <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                              <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.92rem", lineHeight: 1.35 }}>
                                {app.applicantName}
                              </div>
                              {app.applicationCategory === "family_group" ? (
                                <div style={{ marginTop: "5px" }}>
                                  {app.isFamilyHead ? (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "0.72rem",
                                        padding: "3px 9px",
                                        borderRadius: "9999px",
                                        background: "rgba(99, 102, 241, 0.1)",
                                        color: "#4f46e5",
                                        border: "1px solid rgba(99, 102, 241, 0.25)",
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      👨‍👩‍👧‍👦 ফ্যামিলি প্যাকেজ ({app.familyMemberCount || 1} জন)
                                    </span>
                                  ) : (
                                    <div>
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          fontSize: "0.72rem",
                                          padding: "3px 9px",
                                          borderRadius: "9999px",
                                          background: "rgba(14, 165, 233, 0.1)",
                                          color: "#0284c7",
                                          border: "1px solid rgba(14, 165, 233, 0.25)",
                                          fontWeight: 600,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        🔗 {app.familyRelation || "ফ্যামিলি সদস্য"}
                                      </span>
                                      {app.familyHeadName && (
                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px" }}>
                                          বিল প্রধান: <strong>{app.familyHeadName}</strong> ({app.familyHeadTrackingId})
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{ marginTop: "5px" }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "0.72rem",
                                      padding: "3px 9px",
                                      borderRadius: "9999px",
                                      background: "rgba(16, 185, 129, 0.1)",
                                      color: "#059669",
                                      border: "1px solid rgba(16, 185, 129, 0.25)",
                                      fontWeight: 700,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    👤 একক আবেদন (Single)
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Col 3: Passport & Contact */}
                            <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                              <div
                                style={{
                                  display: "inline-flex",
                                  fontFamily: "var(--font-mono, monospace)",
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                  color: "var(--text-main)",
                                  background: "var(--bg-subtle-box, #f1f5f9)",
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  border: "1px solid var(--border-subtle)",
                                  letterSpacing: "0.04em",
                                }}
                              >
                                {app.passportNumber}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.78rem",
                                  color: "var(--text-secondary)",
                                  marginTop: "5px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Phone size={12} style={{ opacity: 0.6 }} />
                                <span>{app.phone}</span>
                              </div>
                            </td>

                            {/* Col 4: Service & Details */}
                            <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                              <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.86rem" }}>
                                {serviceLabel}
                              </div>
                              {app.visaType && (
                                <div
                                  style={{
                                    fontSize: "0.74rem",
                                    color: "var(--text-muted)",
                                    maxWidth: "200px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    marginTop: "3px",
                                  }}
                                  title={app.visaType}
                                >
                                  {formatVisaTypeDisplay(app.visaType)}
                                </div>
                              )}
                            </td>

                            {/* Col 5: Financials & Due */}
                            <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                              {app.applicationCategory === "family_group" && !app.isFamilyHead ? (
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    background: "rgba(14, 165, 233, 0.08)",
                                    color: "#0284c7",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  🤝 যৌথ বিলে
                                </div>
                              ) : due === 0 ? (
                                <div>
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#059669", fontWeight: 800, fontSize: "0.86rem" }}>
                                    <CheckCircle2 size={14} />
                                    <span>পরিশোধিত</span>
                                  </div>
                                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                    মোট: ৳ {total.toLocaleString("en-IN")}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#d97706" }}>
                                    ৳ {due.toLocaleString("en-IN")}
                                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#b45309", marginLeft: "4px" }}>বকেয়া</span>
                                  </div>
                                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                    মোট ৳{total.toLocaleString("en-IN")} • জমা ৳{paid.toLocaleString("en-IN")}
                                  </div>
                                  <div
                                    style={{
                                      width: "100%",
                                      maxWidth: "110px",
                                      height: "4px",
                                      background: "rgba(0,0,0,0.06)",
                                      borderRadius: "2px",
                                      marginTop: "4px",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${Math.min(100, Math.round((paid / (total || 1)) * 100))}%`,
                                        height: "100%",
                                        background: "#10b981",
                                        borderRadius: "2px",
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Col 6: Status Select (Uniform Width) */}
                            <td style={{ padding: "12px 14px", verticalAlign: "middle", width: "160px" }}>
                              {(() => {
                                const badgeStyle = getStatusBadge(app.status);
                                return (
                                  <div style={{ position: "relative", width: "148px", maxWidth: "148px" }}>
                                    <select
                                      value={app.status}
                                      onChange={(e) => handleVisaStatusChange(app._id, e.target.value)}
                                      title="স্ট্যাটাস পরিবর্তন করুন"
                                      style={{
                                        width: "148px",
                                        background: badgeStyle.bg,
                                        color: badgeStyle.color,
                                        border: `1px solid ${badgeStyle.border || "rgba(0,0,0,0.1)"}`,
                                        padding: "6px 26px 6px 12px",
                                        borderRadius: "20px",
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        appearance: "none",
                                        WebkitAppearance: "none",
                                        MozAppearance: "none",
                                        outline: "none",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                        display: "block",
                                        boxSizing: "border-box",
                                      }}
                                    >
                                      {getAvailableVisaStatuses(app.serviceType, app.visaType, app.status).map((st) => (
                                        <option key={st.value} value={st.value} style={{ background: "var(--bg-surface, #ffffff)", color: "var(--text-main, #0f172a)" }}>
                                          {st.label}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown
                                      size={13}
                                      style={{
                                        position: "absolute",
                                        right: "9px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: badgeStyle.color,
                                        pointerEvents: "none",
                                      }}
                                    />
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Col 7: Created By & Audit */}
                            <td style={{ padding: "12px 14px", fontSize: "0.8rem", verticalAlign: "middle" }}>
                              <div style={{ fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <UserIcon size={12} style={{ color: "#6366f1" }} />
                                <span>{app.receivedBy || creator}</span>
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                {createDate}
                              </div>
                              {updater && (
                                <div style={{ fontSize: "0.68rem", color: "#8b5cf6", marginTop: "2px" }}>
                                  এডিট: {updater}
                                </div>
                              )}
                            </td>

                            {/* Col 8: Action Buttons */}
                            <td style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "middle" }}>
                              <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                                <button
                                  onClick={() => setSelectedVisa(app)}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "7px",
                                    border: "1px solid var(--border-subtle)",
                                    background: "var(--bg-subtle-box, rgba(0,0,0,0.02))",
                                    color: "#0284c7",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  title="বিস্তারিত দেখুন"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  onClick={() => handleOpenEditVisa(app)}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "7px",
                                    border: "1px solid var(--border-subtle)",
                                    background: "var(--bg-subtle-box, rgba(0,0,0,0.02))",
                                    color: "#6366f1",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  title="এডিট করুন"
                                >
                                  <Edit size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteVisa(app._id)}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "7px",
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                    background: "rgba(239, 68, 68, 0.05)",
                                    color: "#ef4444",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* VISA PAGINATION CONTROLS */}
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  background: "rgba(255, 255, 255, 0.015)",
                }}
              >
                {/* Left: Total Records & Page Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  <span>
                    মোট <strong style={{ color: "var(--text-main)" }}>{visaTotalMatching}</strong> টি আবেদন
                    {visaTotalMatching > 0 && (
                      <> (পৃষ্ঠা <strong style={{ color: "#818cf8" }}>{visaCurrentPage}</strong> / <strong>{visaTotalPages}</strong>)</>
                    )}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem" }}>প্রতি পৃষ্ঠায়:</span>
                    <select
                      value={visaPageSize}
                      onChange={(e) => {
                        const newLimit = parseInt(e.target.value, 10);
                        setVisaPageSize(newLimit);
                        setVisaCurrentPage(1);
                        fetchVisaApplications(1, newLimit, searchVisa, filterVisaStatus, filterVisaCategory);
                      }}
                      className="input-field"
                      style={{
                        height: "32px",
                        padding: "0 8px",
                        fontSize: "0.8rem",
                        width: "auto",
                        minWidth: "70px",
                      }}
                    >
                      <option value="10">১০</option>
                      <option value="20">২০</option>
                      <option value="50">৫০</option>
                      <option value="100">১০০</option>
                    </select>
                  </div>
                </div>

                {/* Right: Page Navigation Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {/* First Page */}
                  <button
                    onClick={() => handleVisaPageChange(1)}
                    disabled={visaCurrentPage <= 1 || loadingVisa}
                    className="btn-secondary btn-sm"
                    style={{
                      padding: "6px 10px",
                      height: "34px",
                      opacity: visaCurrentPage <= 1 ? 0.4 : 1,
                      cursor: visaCurrentPage <= 1 ? "not-allowed" : "pointer",
                    }}
                    title="প্রথম পৃষ্ঠা"
                  >
                    <ChevronsLeft size={16} />
                  </button>

                  {/* Prev Page */}
                  <button
                    onClick={() => handleVisaPageChange(visaCurrentPage - 1)}
                    disabled={visaCurrentPage <= 1 || loadingVisa}
                    className="btn-secondary btn-sm"
                    style={{
                      padding: "6px 10px",
                      height: "34px",
                      opacity: visaCurrentPage <= 1 ? 0.4 : 1,
                      cursor: visaCurrentPage <= 1 ? "not-allowed" : "pointer",
                    }}
                    title="পূর্ববর্তী পৃষ্ঠা"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page Number Pills */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    {Array.from({ length: visaTotalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        return (
                          p === 1 ||
                          p === visaTotalPages ||
                          Math.abs(p - visaCurrentPage) <= 1
                        );
                      })
                      .reduce<(number | string)[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                          acc.push("...");
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) => {
                        if (item === "...") {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              style={{
                                padding: "6px 8px",
                                fontSize: "0.82rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              ...
                            </span>
                          );
                        }

                        const pNum = Number(item);
                        const isActive = pNum === visaCurrentPage;
                        return (
                          <button
                            key={pNum}
                            onClick={() => handleVisaPageChange(pNum)}
                            disabled={loadingVisa}
                            style={{
                              minWidth: "34px",
                              height: "34px",
                              borderRadius: "6px",
                              border: isActive ? "none" : "1px solid var(--border-subtle)",
                              background: isActive ? "var(--primary-gradient)" : "rgba(255, 255, 255, 0.04)",
                              color: isActive ? "#ffffff" : "var(--text-main)",
                              fontWeight: isActive ? 800 : 500,
                              fontSize: "0.82rem",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {pNum}
                          </button>
                        );
                      })}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => handleVisaPageChange(visaCurrentPage + 1)}
                    disabled={visaCurrentPage >= visaTotalPages || loadingVisa}
                    className="btn-secondary btn-sm"
                    style={{
                      padding: "6px 10px",
                      height: "34px",
                      opacity: visaCurrentPage >= visaTotalPages ? 0.4 : 1,
                      cursor: visaCurrentPage >= visaTotalPages ? "not-allowed" : "pointer",
                    }}
                    title="পরবর্তী পৃষ্ঠা"
                  >
                    <ChevronRight size={16} />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => handleVisaPageChange(visaTotalPages)}
                    disabled={visaCurrentPage >= visaTotalPages || loadingVisa}
                    className="btn-secondary btn-sm"
                    style={{
                      padding: "6px 10px",
                      height: "34px",
                      opacity: visaCurrentPage >= visaTotalPages ? 0.4 : 1,
                      cursor: visaCurrentPage >= visaTotalPages ? "not-allowed" : "pointer",
                    }}
                    title="শেষ পৃষ্ঠা"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: REPORT & ANALYTICS MODULE (COMBINED / PASSPORT / VISA) */}
        {activeTab === "reports" && <ReportModule initialSection="all" />}
        {activeTab === "passport_reports" && <ReportModule initialSection="passport" />}
        {activeTab === "visa_reports" && <ReportModule initialSection="visa" />}

        {/* VIEW 5: HRM MODULE (EMPLOYEE, DEPARTMENT, DESIGNATION) */}
        {(activeTab === "hrm" || activeTab === "hrm_employees") && (
          <HRMModule initialSection="employees" />
        )}
        {activeTab === "hrm_departments" && (
          <HRMModule initialSection="departments" />
        )}
        {activeTab === "hrm_designations" && (
          <HRMModule initialSection="designations" />
        )}

        {/* VIEW 6: USER & EMPLOYEE PROFILE VIEW */}
        {activeTab === "profile" && <ProfileView />}
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
              maxWidth: "680px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "28px",
              background: "var(--bg-modal)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>নতুন ভিসা ফাইল যোগ করুন</h2>
                {appCategory === "family_group" && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "rgba(56, 189, 248, 0.15)",
                      color: "#38bdf8",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                    }}
                  >
                    👨‍👩‍👧‍👦 মোট {1 + familyMembers.length} জন সদস্যের প্যাকেজ
                  </span>
                )}
              </div>
              <button onClick={() => setShowAddVisaModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            {/* Application Category Toggle: Single vs Family / Group */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              <button
                type="button"
                onClick={() => setAppCategory("individual")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: appCategory === "individual" ? "2px solid #818cf8" : "1px solid var(--border-subtle)",
                  background: appCategory === "individual" ? "rgba(99, 102, 241, 0.18)" : "rgba(255, 255, 255, 0.03)",
                  color: appCategory === "individual" ? "#a5b4fc" : "var(--text-secondary)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <UserIcon size={16} />
                <span>একক আবেদন (Single)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppCategory("family_group");
                  if (familyMembers.length === 0) {
                    handleAddFamilyMember();
                  }
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: appCategory === "family_group" ? "2px solid #38bdf8" : "1px solid var(--border-subtle)",
                  background: appCategory === "family_group" ? "rgba(56, 189, 248, 0.18)" : "rgba(255, 255, 255, 0.03)",
                  color: appCategory === "family_group" ? "#38bdf8" : "var(--text-secondary)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <Users size={16} />
                <span>ফ্যামিলি / গ্রুপ আবেদন</span>
              </button>
            </div>

            {/* Family Info Notice Banner */}
            {appCategory === "family_group" && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(56, 189, 248, 0.08)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.45,
                  marginBottom: "12px",
                }}
              >
                💡 <strong style={{ color: "#38bdf8" }}>ফ্যামিলি প্যাকেজ মোড:</strong> পরিবার প্রধান ও অন্যান্য সদস্যদের পাসপোর্ট এখানে একত্রে এন্ট্রি করুন। আলাদা আলাদা টাকা ভাগ না করে নিচে পুরো পরিবারের জন্য <strong>একত্রে যৌথ চুক্তি টাকা ও জমা</strong> লিখুন। প্রত্যেকের জন্য আলাদা ট্র্যাকিং আইডি স্বয়ংক্রিয়ভাবে তৈরি হবে।
              </div>
            )}

            <form onSubmit={handleCreateVisa} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Primary Applicant Section */}
              <div
                style={{
                  background: appCategory === "family_group" ? "rgba(99, 102, 241, 0.05)" : "transparent",
                  border: appCategory === "family_group" ? "1px solid rgba(99, 102, 241, 0.25)" : "none",
                  borderRadius: "8px",
                  padding: appCategory === "family_group" ? "14px" : "0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {appCategory === "family_group" && (
                  <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#818cf8" }}>
                    ১. পরিবার প্রধানের তথ্য (Family Head / বিল ও যোগাযোগ প্রধান):
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    {appCategory === "family_group" ? "পরিবার প্রধানের নাম *" : "আবেদনকারীর নাম *"}
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
              </div>

              {/* Additional Family Members (Dynamic Rows) */}
              {appCategory === "family_group" && (
                <div
                  style={{
                    background: "rgba(56, 189, 248, 0.04)",
                    border: "1px dashed rgba(56, 189, 248, 0.35)",
                    borderRadius: "10px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "#38bdf8", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users size={16} />
                      ২. পরিবারের অন্যান্য সদস্যবৃন্দ ({familyMembers.length} জন):
                    </span>
                    <button
                      type="button"
                      onClick={handleAddFamilyMember}
                      style={{
                        background: "rgba(56, 189, 248, 0.15)",
                        border: "1px solid rgba(56, 189, 248, 0.35)",
                        color: "#38bdf8",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Plus size={14} />
                      <span>+ আরও সদস্য যোগ করুন</span>
                    </button>
                  </div>

                  {familyMembers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      অন্যান্য সদস্যদের পাসপোর্ট যুক্ত করতে উপরের <strong>"+ আরও সদস্য যোগ করুন"</strong> বাটনে চাপ দিন।
                    </div>
                  ) : (
                    familyMembers.map((m, idx) => (
                      <div
                        key={m.id}
                        style={{
                          background: "rgba(0, 0, 0, 0.25)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "8px",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#a5b4fc" }}>
                            সদস্য #{idx + 2} (পাসপোর্ট #{idx + 2})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFamilyMember(m.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#f87171",
                              cursor: "pointer",
                              fontSize: "0.76rem",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            <Trash2 size={13} />
                            <span>মুছুন</span>
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                              সদস্যের নাম *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="যেমন: ফাতেমা বেগম"
                              value={m.applicantName}
                              onChange={(e) => handleUpdateFamilyMember(m.id, "applicantName", e.target.value)}
                              className="input-field"
                              style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                              পাসপোর্ট নম্বর *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="AXXXXXXXX"
                              value={m.passportNumber}
                              onChange={(e) => handleUpdateFamilyMember(m.id, "passportNumber", e.target.value.toUpperCase())}
                              className="input-field"
                              style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                              সম্পর্ক
                            </label>
                            <select
                              value={m.relation}
                              onChange={(e) => handleUpdateFamilyMember(m.id, "relation", e.target.value)}
                              className="input-field"
                              style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                            >
                              <option value="স্ত্রী">স্ত্রী</option>
                              <option value="স্বামী">স্বামী</option>
                              <option value="সন্তান">সন্তান</option>
                              <option value="পিতা">পিতা</option>
                              <option value="মাতা">মাতা</option>
                              <option value="ভাই">ভাই</option>
                              <option value="বোন">বোন</option>
                              <option value="অন্যান্য">অন্যান্য</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    রিসিভ তারিখ (Received Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={visaReceivedDate}
                    onChange={(e) => setVisaReceivedDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    রিসিভ করেছেন যিনি (Received By) *
                  </label>
                  <select
                    value={visaReceivedBy}
                    onChange={(e) => setVisaReceivedBy(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">-- কর্মচারী নির্বাচন করুন --</option>
                    {user?.name && !employeesList.some(emp => emp.name.trim().toLowerCase() === user.name.trim().toLowerCase()) && (
                      <option value={user.name}>
                        {user.name} (বর্তমান ইউজার)
                      </option>
                    )}
                    {employeesList.map((emp) => (
                      <option key={emp._id} value={emp.name}>
                        {emp.name} {emp.designation ? `(${emp.designation})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    সার্ভিস ধরন
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => {
                      const newService = e.target.value;
                      setServiceType(newService);
                      if (newService === "medical_visa" && (!visaType || visaType.includes("ট্যুরিস্ট") || visaType.includes("Tourist"))) {
                        setVisaType("মেডিকেল পেশেন্ট (Medical Patient)");
                      } else if (newService === "medical_attendant") {
                        setVisaType("মেডিকেল এটেন্ডেন্ট (Medical Attendant)");
                      } else if (newService === "tourist_visa" && (visaType.includes("মেডিকেল") || visaType.includes("Medical"))) {
                        setVisaType("ট্যুরিস্ট ভিসা (Tourist Visa)");
                      }
                      if (!isMedicalPatient(newService, visaType)) {
                        const isCurrentMedStatus = VISA_MEDICAL_STATUSES.some((m) => m.value === status);
                        if (isCurrentMedStatus) {
                          setStatus("submitted");
                        }
                      }
                    }}
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
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    ভিসা টাইপ (Visa Type)
                  </label>
                  <select
                    value={visaType}
                    onChange={(e) => {
                      const newVType = e.target.value;
                      setVisaType(newVType);
                      if (!isMedicalPatient(serviceType, newVType)) {
                        const isCurrentMedStatus = VISA_MEDICAL_STATUSES.some((m) => m.value === status);
                        if (isCurrentMedStatus) {
                          setStatus("submitted");
                        }
                      }
                    }}
                    className="input-field"
                    style={{
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    <option value="">-- ভিসা টাইপ নির্বাচন করুন --</option>
                    <optgroup label="জনপ্রিয় ও নিয়মিত ক্যাটাগরি">
                      <option value="ট্যুরিস্ট ভিসা (Tourist Visa)">ট্যুরিস্ট ভিসা (Tourist Visa - T1)</option>
                      <option value="মেডিকেল পেশেন্ট (Medical Patient)">মেডিকেল পেশেন্ট (Medical Patient - M1/M3)</option>
                      <option value="মেডিকেল এটেন্ডেন্ট (Medical Attendant)">মেডিকেল এটেন্ডেন্ট (Medical Attendant - M2/M4)</option>
                      <option value="স্টুডেন্ট ভিসা (Student Visa)">স্টুডেন্ট ভিসা (Student Visa - S1)</option>
                      <option value="বিজনেস ভিসা (Business Visa)">বিজনেস ভিসা (Business Visa - B1)</option>
                      <option value="ওয়ার্ক পারমিট (Work Permit)">ওয়ার্ক পারমিট (Work Permit - E1)</option>
                    </optgroup>
                    <optgroup label="অফিশিয়াল ভিসা কোড তালিকা">
                      {STRUCTURED_INDIAN_VISA_TYPES.map((item) => (
                        <option key={item.code} value={item.value}>
                          {item.title}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Financial Breakdown (যৌথ লেনদেন ও টাকার হিসাব) */}
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
                  {appCategory === "family_group"
                    ? `যৌথ প্যাকেজ লেনদেন ও টাকার হিসাব (মোট ${1 + familyMembers.length} জনের বিল):`
                    : "লেনদেন ও টাকার হিসাব (Payment & Financials):"}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      {appCategory === "family_group"
                        ? `পুরো পরিবারের মোট প্যাকেজ টাকা (Total Agreement) *`
                        : "কত টাকা নিবে তার কাছে (Total Amount) *"}
                    </label>
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder={appCategory === "family_group" ? "যেমন: 50000" : "যেমন: 25000"}
                      required
                      min={0}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      {appCategory === "family_group"
                        ? "পরিবার প্রধান কত টাকা জমা দিছে (Paid Amount) *"
                        : "সে কত টাকা দিছে (Paid Amount) *"}
                    </label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder={appCategory === "family_group" ? "যেমন: 30000" : "যেমন: 15000"}
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
                    {appCategory === "family_group" ? "পুরো পরিবারের বকেয়া টাকা (Family Due - অটো হিসাব):" : "বকেয়া টাকা (Due Amount - অটো হিসাব):"}
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: liveVisaDue > 0 ? "#fbbf24" : "#34d399" }}>
                    ৳ {liveVisaDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    স্ট্যাটাস
                  </label>
                  {isMedicalPatient(serviceType, visaType) && (
                    <span style={{ fontSize: "0.72rem", color: "#34d399", background: "rgba(16, 185, 129, 0.15)", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                      ✓ মেডিকেল পেশেন্ট: ৭টি আয়ুষ/ডাক্তার স্ট্যাটাস সক্রিয়
                    </span>
                  )}
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                >
                  <optgroup label="সাধারণ স্ট্যাটাস">
                    {VISA_GENERAL_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </optgroup>
                  {isMedicalPatient(serviceType, visaType) && (
                    <optgroup label="শুধু মেডিক্যাল ও আয়ুষ স্পেশাল স্ট্যাটাস">
                      {VISA_MEDICAL_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Note / মন্তব্য Field */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  নোট / মন্তব্য (Note)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="প্রয়োজনীয় কোনো বিশেষ নোট বা রেফারেন্স লিখে রাখুন..."
                  rows={2}
                  className="input-field"
                  style={{ resize: "vertical" }}
                />
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
                  <div style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text-main)" }}>
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

              {/* Received Date, Received By & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>রিসিভ তারিখ (Received Date)</div>
                  <div style={{ fontWeight: 700, color: "#38bdf8", fontSize: "0.95rem" }}>
                    {selectedVisa.receivedDate || (selectedVisa.createdAt ? selectedVisa.createdAt.split("T")[0] : "—")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>রিসিভ করেছেন যিনি (Received By)</div>
                  <div style={{ fontWeight: 700, color: "#818cf8", fontSize: "0.95rem" }}>
                    {selectedVisa.receivedBy || (typeof selectedVisa.createdBy === "object" && selectedVisa.createdBy?.name ? selectedVisa.createdBy.name : selectedVisa.createdByName) || "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>ইমেইল</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{selectedVisa.email || "দেওয়া নেই"}</div>
                </div>
              </div>

              {/* Service, Visa Type & Status */}
              <div style={{ display: "grid", gridTemplateColumns: selectedVisa.visaType ? "1fr 1fr 1fr" : "1fr 1fr", gap: "12px" }}>
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
                {selectedVisa.visaType && (
                  <div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>ভিসা টাইপ</div>
                    <div style={{ fontWeight: 600, color: "var(--primary-light, #818cf8)", fontSize: "0.85rem" }}>
                      {formatVisaTypeDisplay(selectedVisa.visaType)}
                    </div>
                  </div>
                )}
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

              {/* Audit Info: Created by & Updated by */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  padding: "12px 14px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                }}
              >
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>ফাইল তৈরি করেছেন:</div>
                  <div style={{ fontWeight: 600, color: "#38bdf8", marginTop: "2px" }}>
                    {typeof selectedVisa.createdBy === "object" && selectedVisa.createdBy?.name
                      ? selectedVisa.createdBy.name
                      : selectedVisa.createdByName || "সিস্টেম"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {selectedVisa.createdAt
                      ? new Date(selectedVisa.createdAt).toLocaleString("bn-BD", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>

                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>সর্বশেষ আপডেট:</div>
                  <div style={{ fontWeight: 600, color: "#a78bfa", marginTop: "2px" }}>
                    {typeof selectedVisa.updatedBy === "object" && selectedVisa.updatedBy?.name
                      ? selectedVisa.updatedBy.name
                      : selectedVisa.updatedByName || "—"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {selectedVisa.updatedAt
                      ? new Date(selectedVisa.updatedAt).toLocaleString("bn-BD", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>
              </div>

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

              {/* Received Date & Received By */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="label-text">
                    রিসিভ তারিখ (Received Date) <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editVisaReceivedDate}
                    onChange={(e) => setEditVisaReceivedDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">
                    রিসিভ করেছেন যিনি (Received By) <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <select
                    value={editVisaReceivedBy}
                    onChange={(e) => setEditVisaReceivedBy(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">-- কর্মচারী নির্বাচন করুন --</option>
                    {user?.name && !employeesList.some(emp => emp.name.trim().toLowerCase() === user.name.trim().toLowerCase()) && (
                      <option value={user.name}>
                        {user.name} (বর্তমান ইউজার)
                      </option>
                    )}
                    {employeesList.map((emp) => (
                      <option key={emp._id} value={emp.name}>
                        {emp.name} {emp.designation ? `(${emp.designation})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Type & Visa Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="label-text">সার্ভিস ধরন</label>
                  <select
                    value={editServiceType}
                    onChange={(e) => {
                      const newService = e.target.value;
                      setEditServiceType(newService);
                      if (newService === "medical_visa" && (!editVisaType || editVisaType.includes("ট্যুরিস্ট") || editVisaType.includes("Tourist"))) {
                        setEditVisaType("মেডিকেল পেশেন্ট (Medical Patient)");
                      } else if (newService === "medical_attendant") {
                        setEditVisaType("মেডিকেল এটেন্ডেন্ট (Medical Attendant)");
                      }
                      if (!isMedicalPatient(newService, editVisaType)) {
                        const isCurrentMedStatus = VISA_MEDICAL_STATUSES.some((m) => m.value === editStatus);
                        if (isCurrentMedStatus) {
                          setEditStatus("submitted");
                        }
                      }
                    }}
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
                  <label className="label-text">ভিসা টাইপ</label>
                  <select
                    value={editVisaType}
                    onChange={(e) => {
                      const newVType = e.target.value;
                      setEditVisaType(newVType);
                      if (!isMedicalPatient(editServiceType, newVType)) {
                        const isCurrentMedStatus = VISA_MEDICAL_STATUSES.some((m) => m.value === editStatus);
                        if (isCurrentMedStatus) {
                          setEditStatus("submitted");
                        }
                      }
                    }}
                    className="input-field"
                    style={{
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    <option value="">-- ভিসা টাইপ নির্বাচন করুন --</option>
                    <optgroup label="জনপ্রিয় ও নিয়মিত ক্যাটাগরি">
                      <option value="ট্যুরিস্ট ভিসা (Tourist Visa)">ট্যুরিস্ট ভিসা (Tourist Visa - T1)</option>
                      <option value="মেডিকেল পেশেন্ট (Medical Patient)">মেডিকেল পেশেন্ট (Medical Patient - M1/M3)</option>
                    <option value="মেডিকেল এটেন্ডেন্ট (Medical Attendant)">মেডিকেল এটেন্ডেন্ট (Medical Attendant - M2/M4)</option>
                    <option value="স্টুডেন্ট ভিসা (Student Visa)">স্টুডেন্ট ভিসা (Student Visa - S1)</option>
                    <option value="বিজনেস ভিসা (Business Visa)">বিজনেস ভিসা (Business Visa - B1)</option>
                    <option value="ওয়ার্ক পারমিট (Work Permit)">ওয়ার্ক পারমিট (Work Permit - E1)</option>
                  </optgroup>
                  <optgroup label="অফিশিয়াল ভিসা কোড তালিকা">
                    {STRUCTURED_INDIAN_VISA_TYPES.map((item) => (
                      <option key={item.code} value={item.value}>
                        {item.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

              {/* Status */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label className="label-text">বর্তমান স্ট্যাটাস</label>
                  {isMedicalPatient(editServiceType, editVisaType) && (
                    <span style={{ fontSize: "0.72rem", color: "#34d399", background: "rgba(16, 185, 129, 0.15)", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                      ✓ মেডিকেল পেশেন্ট: ৭টি আয়ুষ/ডাক্তার স্ট্যাটাস সক্রিয়
                    </span>
                  )}
                </div>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="input-field"
                >
                  <optgroup label="সাধারণ স্ট্যাটাস">
                    {VISA_GENERAL_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </optgroup>
                  {isMedicalPatient(editServiceType, editVisaType) && (
                    <optgroup label="শুধু মেডিক্যাল ও আয়ুষ স্পেশাল স্ট্যাটাস">
                      {VISA_MEDICAL_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
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
