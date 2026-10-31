"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Edit,
  User as UserIcon,
  Users,
  ShieldCheck,
  Check,
  FileCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  X,
} from "lucide-react";

export interface PassportEntryItem {
  _id: string;
  entryNumber: string;
  name: string;
  mobile: string;
  email?: string;
  nid: string;
  birthDate: string;
  passportType: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  onlineTrackId?: string;
  receivedDate?: string;
  receivedBy?: string;
  receivedByEmployeeId?: string;
  status: string;
  deliveryDate?: string;
  notes?: string;
  applicationCategory?: "individual" | "family_group";
  isFamilyHead?: boolean;
  familyGroupId?: string;
  familyHeadEntryNumber?: string;
  familyHeadName?: string;
  familyRelation?: string;
  familyMemberCount?: number;
  groupMembersSummary?: string;
  createdBy?: { _id: string; name: string; email?: string } | string;
  createdByName?: string;
  updatedBy?: { _id: string; name: string; email?: string } | string;
  updatedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export const PASSPORT_TYPE_OPTIONS = [
  { value: "5y_regular_21d", label: "৫ বছর মেয়াদী সাধারণ পাসপোর্ট (২১ কর্ম দিবস)" },
  { value: "10y_regular_21d", label: "১০ বছর মেয়াদী সাধারণ পাসপোর্ট (২১ কর্ম দিবস)" },
  { value: "5y_urgent_7d", label: "৫ বছর মেয়াদী জরুরি পাসপোর্ট (৭ কর্ম দিবস)" },
  { value: "10y_urgent_7d", label: "১০ বছর মেয়াদী জরুরি পাসপোর্ট (৭ কর্ম দিবস)" },
  { value: "5y_very_urgent_3d", label: "৫ বছর মেয়াদী অতীব জরুরি পাসপোর্ট (৩ কর্ম দিবস)" },
  { value: "10y_very_urgent_3d", label: "১০ বছর মেয়াদী অতীব জরুরি পাসপোর্ট (৩ কর্ম দিবস)" },
  { value: "5y_noc_3d", label: "৫ বছর মেয়াদী অতীব জরুরি অনাপত্তি সনদ (NOC) এর ভিত্তিতে (৩ কর্ম দিবস)" },
  { value: "10y_noc_3d", label: "১০ বছর মেয়াদী অতীব জরুরি অনাপত্তি সনদ (NOC) এর ভিত্তিতে (৩ কর্ম দিবস)" },
  { value: "5y_go_medical_hajj_3d", label: "৫ বছর মেয়াদী অতীব জরুরি সরকারি আদেশ (GO) এর ভিত্তিতে চিকিৎসা, হজ্জ পালন,তীর্থস্থান ভ্রমনের ক্ষেত্রে (৩ কর্ম দিবস)" },
  { value: "10y_go_medical_hajj_3d", label: "১০ বছর মেয়াদী অতীব জরুরি সরকারি আদেশ (GO) এর ভিত্তিতে চিকিৎসা, হজ্জ পালন,তীর্থস্থান ভ্রমনের ক্ষেত্রে (৩ কর্ম দিবস)" },
  { value: "5y_go_govt_work_3d", label: "৫ বছর মেয়াদী অতীব জরুরি সরকারি আদেশ (GO) এর ভিত্তিতে সরকারী কাজের ক্ষেত্রে (৩ কর্ম দিবস)" },
  { value: "10y_go_govt_work_3d", label: "১০ বছর মেয়াদী অতীব জরুরি সরকারি আদেশ (GO) এর ভিত্তিতে সরকারী কাজের ক্ষেত্রে (৩ কর্ম দিবস)" },
];

// Module-level in-memory cache to provide instant 0ms rendering when switching to passport_entry tab
let memoryPassportCache: {
  entries: PassportEntryItem[];
  stats: {
    total: number;
    totalContractAmount: number;
    totalCollectedAmount: number;
    totalDueAmount: number;
    readyCount: number;
    deliveredCount: number;
    processingCount: number;
  };
  pagination: {
    page: number;
    totalPages: number;
    totalEntries: number;
  };
  filterKey: string;
  cachedAt: number;
} | null = null;

let memoryPassportEmployeesCache: Array<{ _id: string; name: string; employeeId?: string; designation?: string }> | null = null;

export default function PassportEntryModule() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PassportEntryItem[]>(() => memoryPassportCache?.entries || []);
  const [employeesList, setEmployeesList] = useState<
    Array<{ _id: string; name: string; employeeId?: string; designation?: string }>
  >(() => memoryPassportEmployeesCache || []);
  const [stats, setStats] = useState(() => memoryPassportCache?.stats || {
    total: 0,
    totalContractAmount: 0,
    totalCollectedAmount: 0,
    totalDueAmount: 0,
    readyCount: 0,
    deliveredCount: 0,
    processingCount: 0,
  });
  const [loading, setLoading] = useState(() => !memoryPassportCache);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState<"all" | "individual" | "family_group">("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(() => memoryPassportCache?.pagination.page || 1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(() => memoryPassportCache?.pagination.totalPages || 1);
  const [totalMatching, setTotalMatching] = useState(() => memoryPassportCache?.pagination.totalEntries || 0);

  // Modal: Add New Passport Entry Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [nid, setNid] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [passportType, setPassportType] = useState(PASSPORT_TYPE_OPTIONS[0].value);
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [receivedBy, setReceivedBy] = useState("");
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [onlineTrackId, setOnlineTrackId] = useState("");
  const [status, setStatus] = useState("submitted");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Family / Group Application Package State
  const [appCategory, setAppCategory] = useState<"individual" | "family_group">("individual");
  const [familyMembers, setFamilyMembers] = useState<
    Array<{
      id: string;
      name: string;
      mobile: string;
      nid: string;
      birthDate: string;
      relation: string;
      passportType: string;
      onlineTrackId: string;
    }>
  >([]);

  const handleAddFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: "",
        mobile: "",
        nid: "",
        birthDate: "",
        relation: "স্ত্রী",
        passportType: passportType || PASSPORT_TYPE_OPTIONS[0].value,
        onlineTrackId: "",
      },
    ]);
  };

  const handleUpdateFamilyMember = (
    id: string,
    field: "name" | "mobile" | "nid" | "birthDate" | "relation" | "passportType" | "onlineTrackId",
    value: string
  ) => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Quick Inline Online Track ID Edit
  const [editingTrackIdRow, setEditingTrackIdRow] = useState<string | null>(null);
  const [tempTrackId, setTempTrackId] = useState<string>("");
  const [savingTrackId, setSavingTrackId] = useState<string | null>(null);

  // Modal: View Details
  const [selectedEntry, setSelectedEntry] = useState<PassportEntryItem | null>(null);
  const [editPaymentModal, setEditPaymentModal] = useState(false);
  const [newPaidInput, setNewPaidInput] = useState<number | "">("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Modal: Edit Full Entry
  const [editingEntry, setEditingEntry] = useState<PassportEntryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNid, setEditNid] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editPassportType, setEditPassportType] = useState(PASSPORT_TYPE_OPTIONS[0].value);
  const [editReceivedDate, setEditReceivedDate] = useState("");
  const [editReceivedBy, setEditReceivedBy] = useState("");
  const [editTotalAmount, setEditTotalAmount] = useState<number | "">("");
  const [editPaidAmount, setEditPaidAmount] = useState<number | "">("");
  const [editOnlineTrackId, setEditOnlineTrackId] = useState("");
  const [editStatus, setEditStatus] = useState("submitted");
  const [editNotes, setEditNotes] = useState("");
  const [updatingEntry, setUpdatingEntry] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const numEditTotal = Number(editTotalAmount) || 0;
  const numEditPaid = Number(editPaidAmount) || 0;
  const liveEditDue = Math.max(0, numEditTotal - numEditPaid);

  // Live calculation of Due Amount in Add Form
  const numTotal = Number(totalAmount) || 0;
  const numPaid = Number(paidAmount) || 0;
  const liveDue = Math.max(0, numTotal - numPaid);

  // Fetch entries with pagination and in-memory caching
  const fetchEntries = async (
    page = currentPage,
    limit = pageSize,
    search = searchQuery,
    statusFilter = filterStatus,
    categoryFilter = filterCategory,
    isBackgroundSync = false
  ) => {
    const filterKey = `${page}_${limit}_${search.trim()}_${statusFilter}_${categoryFilter}`;

    if (!isBackgroundSync && (!memoryPassportCache || memoryPassportCache.filterKey !== filterKey)) {
      setLoading(true);
    } else {
      setIsSyncing(true);
    }

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/passport-entries?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.entries || [];
        const statsData = data.stats || {
          total: 0,
          totalContractAmount: 0,
          totalCollectedAmount: 0,
          totalDueAmount: 0,
          readyCount: 0,
          deliveredCount: 0,
          processingCount: 0,
        };
        const pageData = {
          page: data.pagination?.page || page,
          totalPages: data.pagination?.totalPages || 1,
          totalEntries: data.pagination?.totalEntries || 0,
        };

        setEntries(items);
        setStats(statsData);
        setCurrentPage(pageData.page);
        setTotalPages(pageData.totalPages);
        setTotalMatching(pageData.totalEntries);

        memoryPassportCache = {
          entries: items,
          stats: statsData,
          pagination: pageData,
          filterKey,
          cachedAt: Date.now(),
        };
      }
    } catch (err) {
      console.error("Error fetching passport entries:", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  // Fetch employees list for receiver select box (cached)
  const fetchEmployeesList = async () => {
    if (memoryPassportEmployeesCache && memoryPassportEmployeesCache.length > 0) {
      setEmployeesList(memoryPassportEmployeesCache);
      return;
    }
    try {
      const res = await fetch("/api/employees?limit=100");
      if (res.ok) {
        const data = await res.json();
        const emps = data.employees || [];
        memoryPassportEmployeesCache = emps;
        setEmployeesList(emps);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    if (!memoryPassportEmployeesCache || memoryPassportEmployeesCache.length === 0) {
      fetchEmployeesList();
    }
  }, []);

  useEffect(() => {
    if (user?.name && !receivedBy) {
      setReceivedBy(user.name);
    }
  }, [user, receivedBy]);

  useEffect(() => {
    const filterKey = `1_${pageSize}_${searchQuery.trim()}_${filterStatus}_${filterCategory}`;
    if (memoryPassportCache && memoryPassportCache.filterKey === filterKey) {
      // Instant render from cache - 0ms delay!
      setEntries(memoryPassportCache.entries);
      setStats(memoryPassportCache.stats);
      setCurrentPage(memoryPassportCache.pagination.page);
      setTotalPages(memoryPassportCache.pagination.totalPages);
      setTotalMatching(memoryPassportCache.pagination.totalEntries);
      setLoading(false);
      // Background revalidation
      fetchEntries(1, pageSize, searchQuery, filterStatus, filterCategory, true);
    } else {
      fetchEntries(1, pageSize, searchQuery, filterStatus, filterCategory, !!memoryPassportCache);
    }
  }, [filterStatus, filterCategory, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntries(1, pageSize, searchQuery, filterStatus, filterCategory);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchEntries(newPage, pageSize, searchQuery, filterStatus, filterCategory);
  };

  // Submit Add Entry Form
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError(appCategory === "family_group" ? "পরিবার প্রধানের পুরো নাম লিখুন।" : "আবেদনকারীর পুরো নাম লিখুন।");
      return;
    }
    if (!mobile.trim()) {
      setFormError("মোবাইল নম্বর লিখুন।");
      return;
    }
    if (!nid.trim()) {
      setFormError("জাতীয় পরিচয়পত্র (NID) নম্বর দিন।");
      return;
    }
    if (!birthDate.trim()) {
      setFormError("জন্মতারিখ নির্বাচন করুন।");
      return;
    }

    if (appCategory === "family_group") {
      if (familyMembers.length === 0) {
        setFormError("কমপক্ষে একজন অতিরিক্ত পরিবারের সদস্য যুক্ত করুন অথবা 'একক আবেদন' মোড ব্যবহার করুন।");
        return;
      }
      const emptyNameIndex = familyMembers.findIndex((m) => !m.name.trim());
      if (emptyNameIndex !== -1) {
        setFormError(`সদস্য #${emptyNameIndex + 2} এর নাম পূরণ করুন।`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/passport-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          nid: nid.trim(),
          birthDate: birthDate.trim(),
          passportType,
          receivedDate: receivedDate || new Date().toISOString().split("T")[0],
          receivedBy: receivedBy.trim() || user?.name || "",
          totalAmount: numTotal,
          paidAmount: numPaid,
          onlineTrackId: onlineTrackId.trim(),
          status,
          notes: notes.trim(),
          applicationCategory: appCategory,
          isFamilyGroup: appCategory === "family_group",
          members: appCategory === "family_group" ? familyMembers : [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        // Reset form
        setName("");
        setMobile("");
        setEmail("");
        setNid("");
        setBirthDate("");
        setReceivedDate(new Date().toISOString().split("T")[0]);
        setReceivedBy(user?.name || "");
        setTotalAmount("");
        setPaidAmount("");
        setOnlineTrackId("");
        setPassportType(PASSPORT_TYPE_OPTIONS[0].value);
        setNotes("");
        setAppCategory("individual");
        setFamilyMembers([]);
        memoryPassportCache = null;
        fetchEntries();
      } else {
        setFormError(data.error || "পাসপোর্ট এন্ট্রি সংরক্ষণ করা সম্ভব হয়নি।");
      }
    } catch (err) {
      setFormError("সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Status directly from table
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/passport-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        memoryPassportCache = null;
        fetchEntries();
        if (selectedEntry && selectedEntry._id === id) {
          setSelectedEntry({ ...selectedEntry, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // Update Paid Amount (Payment collection)
  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    try {
      setUpdatingPayment(true);
      const res = await fetch("/api/passport-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEntry._id,
          paidAmount: Number(newPaidInput) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditPaymentModal(false);
        setSelectedEntry(data.entry);
        memoryPassportCache = null;
        fetchEntries();
      }
    } catch (err) {
      console.error("Payment update error:", err);
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Inline quick save of Online Track ID
  const handleQuickTrackIdSave = async (id: string, trackIdValue: string) => {
    try {
      setSavingTrackId(id);
      const res = await fetch("/api/passport-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          onlineTrackId: trackIdValue.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingTrackIdRow(null);
        setEntries((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, onlineTrackId: trackIdValue.trim() } : item
          )
        );
        if (selectedEntry && selectedEntry._id === id) {
          setSelectedEntry({ ...selectedEntry, onlineTrackId: trackIdValue.trim() });
        }
      } else {
        alert(data.error || "Online Track ID সংরক্ষণ করা সম্ভব হয়নি।");
      }
    } catch (err) {
      console.error("Save onlineTrackId error:", err);
      alert("সার্ভার সমস্যা, আবার চেষ্টা করুন।");
    } finally {
      setSavingTrackId(null);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PassportEntryItem) => {
    setEditingEntry(item);
    setEditName(item.name);
    setEditMobile(item.mobile);
    setEditEmail(item.email || "");
    setEditNid(item.nid);
    setEditBirthDate(item.birthDate);
    setEditPassportType(item.passportType || PASSPORT_TYPE_OPTIONS[0].value);
    setEditReceivedDate(item.receivedDate || (item.createdAt ? item.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]));
    setEditReceivedBy(
      item.receivedBy ||
      (typeof item.createdBy === "object" && item.createdBy?.name ? item.createdBy.name : item.createdByName) ||
      user?.name ||
      ""
    );
    setEditTotalAmount(item.totalAmount);
    setEditPaidAmount(item.paidAmount);
    setEditOnlineTrackId(item.onlineTrackId || "");
    setEditStatus(item.status);
    setEditNotes(item.notes || "");
    setEditFormError(null);
  };

  // Submit Update Entry
  const handleUpdateEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    if (!editName.trim() || !editMobile.trim() || !editNid.trim() || !editBirthDate.trim()) {
      setEditFormError("দয়া করে নাম, মোবাইল, NID এবং জন্মতারিখ পূরণ করুন।");
      return;
    }

    try {
      setUpdatingEntry(true);
      const res = await fetch("/api/passport-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEntry._id,
          name: editName.trim(),
          mobile: editMobile.trim(),
          email: editEmail.trim(),
          nid: editNid.trim(),
          birthDate: editBirthDate.trim(),
          passportType: editPassportType,
          receivedDate: editReceivedDate,
          receivedBy: editReceivedBy.trim(),
          totalAmount: numEditTotal,
          paidAmount: numEditPaid,
          onlineTrackId: editOnlineTrackId.trim(),
          status: editStatus,
          notes: editNotes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        memoryPassportCache = null;
        setEditingEntry(null);
        fetchEntries();
      } else {
        setEditFormError(data.error || "আপডেট ব্যর্থ হয়েছে");
      }
    } catch (err) {
      setEditFormError("সার্ভার সমস্যা, আবার চেষ্টা করুন।");
    } finally {
      setUpdatingEntry(false);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই পাসপোর্ট এন্ট্রিটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/passport-entries?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedEntry?._id === id) setSelectedEntry(null);
        if (editingEntry?._id === id) setEditingEntry(null);
        memoryPassportCache = null;
        fetchEntries();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const getPassportTypeLabel = (t: string) => {
    const found = PASSPORT_TYPE_OPTIONS.find((item) => item.value === t);
    if (found) return found.label;

    switch (t) {
      case "e_passport_10y_48p":
        return "১০ বছর (৪৮ পাতা)";
      case "e_passport_5y_48p":
        return "৫ বছর (৪৮ পাতা)";
      case "e_passport_10y_64p":
        return "১০ বছর (৬৪ পাতা)";
      case "urgent":
        return "জরুরি / এক্সপ্রেস";
      case "regular":
        return "সাধারণ রি-ইস্যু";
      default:
        return t ? t.replace(/^[০-৯\d]+\.\s*/, "") : "";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "submitted":
        return { label: "আবেদন জমা", bg: "rgba(99, 102, 241, 0.1)", color: "#4f46e5", border: "rgba(99, 102, 241, 0.3)" };
      case "biometric_pending":
        return { label: "বায়োমেট্রিক বাকি", bg: "rgba(236, 72, 153, 0.1)", color: "#db2777", border: "rgba(236, 72, 153, 0.3)" };
      case "police_verification":
        return { label: "পুলিশ ভেরিফিকেশন", bg: "rgba(245, 158, 11, 0.12)", color: "#d97706", border: "rgba(245, 158, 11, 0.35)" };
      case "ready_for_pickup":
        return { label: "পাসপোর্ট রেডি", bg: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "rgba(16, 185, 129, 0.35)" };
      case "delivered":
        return { label: "ডেলিভারি সম্পন্ন", bg: "rgba(59, 130, 246, 0.12)", color: "#2563eb", border: "rgba(59, 130, 246, 0.35)" };
      default:
        return { label: s, bg: "rgba(100, 116, 139, 0.1)", color: "#475569", border: "rgba(100, 116, 139, 0.25)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header with Title and Add Button */}
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
              পাসপোর্ট এন্ট্রি (Passport Entry)
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
              Passport Module
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
            নতুন পাসপোর্ট আবেদনকারী তথ্য, এনআইডি ও লেনদেন হিসাব রেজিস্টার
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => fetchEntries(currentPage, pageSize, searchQuery, filterStatus, filterCategory, false)}
            className="btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={14} className={loading || isSyncing ? "spin" : ""} />
            <span>{isSyncing ? "আপডেট হচ্ছে..." : "রিফ্রেশ"}</span>
          </button>
          <button
            onClick={() => {
              setReceivedBy(user?.name || "");
              setShowAddModal(true);
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
            <span>Add Passport Entry</span>
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
            ৳ {stats.totalContractAmount.toLocaleString("en-IN")}
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
            ৳ {stats.totalCollectedAmount.toLocaleString("en-IN")}
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
            ৳ {stats.totalDueAmount.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
            পাওনা টাকা
          </div>
        </div>

        {/* Total Passport Entries */}
        <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #38bdf8" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
            মোট পাসপোর্ট এন্ট্রি
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--text-main)" }}>
            {stats.total} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>টি</span>
          </div>
          <div style={{ fontSize: "0.74rem", color: "#38bdf8", marginTop: "4px" }}>
            রেডি: {stats.readyCount} &bull; ডেলিভার্ড: {stats.deliveredCount}
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
              onClick={() => {
                setFilterCategory("all");
                setCurrentPage(1);
                fetchEntries(1, pageSize, searchQuery, filterStatus, "all");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: filterCategory === "all" ? "var(--primary-gradient)" : "transparent",
                color: filterCategory === "all" ? "#fff" : "var(--text-secondary)",
                fontWeight: filterCategory === "all" ? 800 : 600,
                cursor: "pointer",
                fontSize: "0.85rem",
                boxShadow: filterCategory === "all" ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>সকল এন্ট্রি</span>
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: "10px",
                  background: filterCategory === "all" ? "rgba(255, 255, 255, 0.25)" : "rgba(0,0,0,0.06)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
              >
                {stats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterCategory("individual");
                setCurrentPage(1);
                fetchEntries(1, pageSize, searchQuery, filterStatus, "individual");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: filterCategory === "individual" ? "#10b981" : "transparent",
                color: filterCategory === "individual" ? "#fff" : "var(--text-secondary)",
                fontWeight: filterCategory === "individual" ? 800 : 600,
                cursor: "pointer",
                fontSize: "0.85rem",
                boxShadow: filterCategory === "individual" ? "0 2px 8px rgba(16, 185, 129, 0.3)" : "none",
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
              onClick={() => {
                setFilterCategory("family_group");
                setCurrentPage(1);
                fetchEntries(1, pageSize, searchQuery, filterStatus, "family_group");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: filterCategory === "family_group" ? "#0284c7" : "transparent",
                color: filterCategory === "family_group" ? "#fff" : "var(--text-secondary)",
                fontWeight: filterCategory === "family_group" ? 800 : 600,
                cursor: "pointer",
                fontSize: "0.85rem",
                boxShadow: filterCategory === "family_group" ? "0 2px 8px rgba(2, 132, 199, 0.3)" : "none",
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
            মোট ফলাফল: <strong style={{ color: "var(--text-main)" }}>{totalMatching}</strong> টি রেকর্ড
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
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", flex: 1, minWidth: "280px" }}>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="আবেদনকারীর নাম, মোবাইল নম্বর, NID, বা এন্ট্রি নং দিয়ে খুঁজুন..."
                className="input-field"
                style={{ paddingLeft: "38px", height: "42px", fontSize: "0.88rem", borderRadius: "8px" }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                    fetchEntries(1, pageSize, "", filterStatus, filterCategory);
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
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field"
                style={{ width: "auto", height: "42px", fontSize: "0.85rem", padding: "0 12px", borderRadius: "8px" }}
              >
                <option value="all">সকল স্ট্যাটাস</option>
                <option value="submitted">আবেদন জমা</option>
                <option value="biometric_pending">বায়োমেট্রিক বাকি</option>
                <option value="police_verification">পুলিশ ভেরিফিকেশন</option>
                <option value="ready_for_pickup">পাসপোর্ট রেডি</option>
                <option value="delivered">ডেলিভারি সম্পন্ন</option>
              </select>
            </div>
            <button
              onClick={() => fetchEntries(currentPage, pageSize, searchQuery, filterStatus, filterCategory)}
              disabled={loading}
              className="btn-secondary"
              style={{ height: "42px", padding: "0 16px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              title="রিফ্রেশ করুন"
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>
      </div>

      {/* PASSPORT ENTRIES DATA TABLE */}
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
                <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>এন্ট্রি ও তারিখ</th>
                <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", minWidth: "180px" }}>আবেদনকারী ও ধরন</th>
                <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>মোবাইল ও ইমেইল</th>
                <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>NID ও জন্মতারিখ</th>
                <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", minWidth: "160px" }}>পাসপোর্ট ধরন</th>
                <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>Online Track ID</th>
                <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>চুক্তি ও বকেয়া</th>
                <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap", width: "160px" }}>স্ট্যাটাস</th>
                <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>রিসিভ / তৈরি</th>
                <th style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", textAlign: "right", whiteSpace: "nowrap" }}>একশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "60px 20px", textAlign: "center" }}>
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
                      <style jsx>{`
                        @keyframes spin {
                          to {
                            transform: rotate(360deg);
                          }
                        }
                      `}</style>
                      <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.95rem" }}>
                        পাসপোর্ট এন্ট্রি লোড হচ্ছে...
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন
                      </div>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "50px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ marginBottom: "12px", fontSize: "1.05rem" }}>কোনো পাসপোর্ট এন্ট্রি পাওয়া যায়নি।</div>
                    <button
                      onClick={() => {
                        setReceivedBy(user?.name || "");
                        setShowAddModal(true);
                      }}
                      className="btn-primary btn-sm"
                    >
                      + প্রথম এন্ট্রি যুক্ত করুন
                    </button>
                  </td>
                </tr>
              ) : (
                entries.map((item) => {
                  const creator =
                    typeof item.createdBy === "object" && item.createdBy?.name
                      ? item.createdBy.name
                      : item.createdByName || "সিস্টেম";
                  const createDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("bn-BD", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  const updater =
                    typeof item.updatedBy === "object" && item.updatedBy?.name
                      ? item.updatedBy.name
                      : item.updatedByName;

                  return (
                    <tr
                      key={item._id}
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
                      {/* Col 1: Entry Number & Received Date */}
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
                          {item.entryNumber}
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
                          <span>{item.receivedDate ? `রিসিভ: ${item.receivedDate}` : new Date(item.createdAt).toLocaleDateString("bn-BD")}</span>
                        </div>
                      </td>

                      {/* Col 2: Applicant Name & Category Badges */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.92rem", lineHeight: 1.35 }}>
                          {item.name}
                        </div>
                        {item.applicationCategory === "family_group" ? (
                          <div style={{ marginTop: "5px" }}>
                            {item.isFamilyHead ? (
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
                                title={`ফ্যামিলি গ্রুপ: ${item.familyGroupId || ""}`}
                              >
                                👨‍👩‍👧‍👦 ফ্যামিলি প্যাকেজ ({item.familyMemberCount || 1} জন)
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
                                  🔗 {item.familyRelation || "ফ্যামিলি সদস্য"}
                                </span>
                                {item.familyHeadName && (
                                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px" }}>
                                    বিল প্রধান: <strong>{item.familyHeadName}</strong> ({item.familyHeadEntryNumber})
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

                      {/* Col 3: Mobile & Email */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "var(--text-main)",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.85rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Phone size={13} style={{ opacity: 0.65, color: "#6366f1" }} />
                          <span>{item.mobile}</span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            marginTop: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                            maxWidth: "180px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={item.email || ""}
                        >
                          {item.email ? (
                            <>
                              <Mail size={11} style={{ opacity: 0.6 }} />
                              <span>{item.email}</span>
                            </>
                          ) : (
                            <span style={{ opacity: 0.5 }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Col 4: NID & Birth Date */}
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
                          {item.nid}
                        </div>
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-muted)",
                            marginTop: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Calendar size={11} style={{ opacity: 0.6 }} />
                          <span>জন্ম: {item.birthDate}</span>
                        </div>
                      </td>

                      {/* Col 5: Passport Type */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            display: "inline-block",
                            background: "rgba(99, 102, 241, 0.08)",
                            border: "1px solid rgba(99, 102, 241, 0.2)",
                            color: "#4f46e5",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            maxWidth: "180px",
                            lineHeight: 1.35,
                          }}
                          title={getPassportTypeLabel(item.passportType)}
                        >
                          {getPassportTypeLabel(item.passportType)}
                        </span>
                      </td>

                      {/* Col 6: Online Track ID Inline Edit */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle", minWidth: "150px" }}>
                        {editingTrackIdRow === item._id ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                              type="text"
                              value={tempTrackId}
                              onChange={(e) => setTempTrackId(e.target.value)}
                              placeholder="Track ID লিখুন"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleQuickTrackIdSave(item._id, tempTrackId);
                                } else if (e.key === "Escape") {
                                  setEditingTrackIdRow(null);
                                }
                              }}
                              className="input-field"
                              style={{
                                height: "32px",
                                padding: "4px 8px",
                                fontSize: "0.8rem",
                                fontFamily: "var(--font-mono, monospace)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                width: "115px",
                              }}
                            />
                            <button
                              onClick={() => handleQuickTrackIdSave(item._id, tempTrackId)}
                              disabled={savingTrackId === item._id}
                              className="btn-primary btn-sm"
                              style={{ padding: "4px 7px", height: "32px" }}
                              title="সংরক্ষণ করুন"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditingTrackIdRow(null)}
                              className="btn-secondary btn-sm"
                              style={{ padding: "4px 7px", height: "32px" }}
                              title="বাতিল"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingTrackIdRow(item._id);
                              setTempTrackId(item.onlineTrackId || "");
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                              padding: "4px 9px",
                              borderRadius: "6px",
                              background: item.onlineTrackId ? "rgba(14, 165, 233, 0.08)" : "rgba(0,0,0,0.02)",
                              border: item.onlineTrackId ? "1px solid rgba(14, 165, 233, 0.25)" : "1px dashed var(--border-subtle)",
                              transition: "all 0.15s ease",
                            }}
                            title="Online Track ID যোগ বা পরিবর্তন করতে ক্লিক করুন"
                          >
                            {item.onlineTrackId ? (
                              <>
                                <span
                                  style={{
                                    fontFamily: "var(--font-mono, monospace)",
                                    fontWeight: 800,
                                    color: "#0284c7",
                                    fontSize: "0.82rem",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  {item.onlineTrackId}
                                </span>
                                <Edit size={11} color="#0284c7" style={{ opacity: 0.7 }} />
                              </>
                            ) : (
                              <span
                                style={{
                                  fontSize: "0.76rem",
                                  color: "var(--text-muted)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontWeight: 600,
                                }}
                              >
                                <Plus size={12} /> ID যোগ করুন
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Col 7: Financials & Due */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        {item.applicationCategory === "family_group" && !item.isFamilyHead ? (
                          <div>
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
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                              প্রধান: {item.familyHeadEntryNumber || ""}
                            </div>
                          </div>
                        ) : item.dueAmount === 0 ? (
                          <div>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#059669", fontWeight: 800, fontSize: "0.86rem" }}>
                              <CheckCircle2 size={14} />
                              <span>পরিশোধিত</span>
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                              মোট: ৳ {(item.totalAmount || 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#d97706" }}>
                              ৳ {(item.dueAmount || 0).toLocaleString("en-IN")}
                              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#b45309", marginLeft: "4px" }}>বকেয়া</span>
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                              মোট ৳{(item.totalAmount || 0).toLocaleString("en-IN")} • জমা ৳{(item.paidAmount || 0).toLocaleString("en-IN")}
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
                                  width: `${Math.min(100, Math.round(((item.paidAmount || 0) / (item.totalAmount || 1)) * 100))}%`,
                                  height: "100%",
                                  background: "#10b981",
                                  borderRadius: "2px",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Col 8: Status Dropdown (Uniform Width 148px) */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle", width: "160px" }}>
                        {(() => {
                          const badgeStyle = getStatusBadge(item.status);
                          return (
                            <div style={{ position: "relative", width: "148px", maxWidth: "148px" }}>
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item._id, e.target.value)}
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
                                <option value="submitted" style={{ background: "var(--bg-surface, #ffffff)", color: "var(--text-main, #0f172a)" }}>আবেদন জমা</option>
                                <option value="biometric_pending" style={{ background: "var(--bg-surface, #ffffff)", color: "var(--text-main, #0f172a)" }}>বায়োমেট্রিক বাকি</option>
                                <option value="police_verification" style={{ background: "var(--bg-surface, #ffffff)", color: "var(--text-main, #0f172a)" }}>পুলিশ ভেরিফিকেশন</option>
                                <option value="ready_for_pickup" style={{ background: "var(--bg-surface, #ffffff)", color: "var(--text-main, #0f172a)" }}>পাসপোর্ট রেডি</option>
                                <option value="delivered" style={{ background: "var(--bg-surface, #ffffff)", color: "var(--text-main, #0f172a)" }}>ডেলিভারি সম্পন্ন</option>
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

                      {/* Col 9: Created By & Audit */}
                      <td style={{ padding: "12px 14px", fontSize: "0.8rem", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <UserIcon size={12} style={{ color: "#6366f1" }} />
                          <span>{item.receivedBy || creator}</span>
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

                      {/* Col 10: Action Buttons */}
                      <td style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          <button
                            onClick={() => {
                              setSelectedEntry(item);
                              setNewPaidInput(item.paidAmount);
                            }}
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
                            title="বিস্তারিত ও লেনদেন আপডেট"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
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
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(item._id)}
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
                            <Trash2 size={14} />
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

        {/* PAGINATION CONTROLS */}
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
          {/* Left: Total records & Page info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>
              মোট <strong style={{ color: "var(--text-main)" }}>{totalMatching}</strong> টি এন্ট্রি
              {totalMatching > 0 && (
                <> (পৃষ্ঠা <strong style={{ color: "#38bdf8" }}>{currentPage}</strong> / <strong>{totalPages}</strong>)</>
              )}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.8rem" }}>প্রতি পৃষ্ঠায়:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10);
                  setPageSize(newLimit);
                  setCurrentPage(1);
                  fetchEntries(1, newLimit, searchQuery, filterStatus, filterCategory);
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
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1 || loading}
              className="btn-secondary btn-sm"
              style={{
                padding: "6px 10px",
                height: "34px",
                opacity: currentPage <= 1 ? 0.4 : 1,
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              }}
              title="প্রথম পৃষ্ঠা"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="btn-secondary btn-sm"
              style={{
                padding: "6px 10px",
                height: "34px",
                opacity: currentPage <= 1 ? 0.4 : 1,
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              }}
              title="পূর্ববর্তী পৃষ্ঠা"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Number Pills */}
            <div style={{ display: "flex", gap: "4px" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show current page, edges, and adjacent pages
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
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
                  const isActive = pNum === currentPage;
                  return (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      disabled={loading}
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
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="btn-secondary btn-sm"
              style={{
                padding: "6px 10px",
                height: "34px",
                opacity: currentPage >= totalPages ? 0.4 : 1,
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              }}
              title="পরবর্তী পৃষ্ঠা"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages || loading}
              className="btn-secondary btn-sm"
              style={{
                padding: "6px 10px",
                height: "34px",
                opacity: currentPage >= totalPages ? 0.4 : 1,
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              }}
              title="শেষ পৃষ্ঠা"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: ADD NEW PASSPORT ENTRY */}
      {showAddModal && (
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
              maxWidth: "640px",
              padding: "32px",
              background: "var(--bg-modal)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--card-shadow)",
            }}
          >
            {/* Modal Header */}
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
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)" }}>
                  নতুন পাসপোর্ট এন্ট্রি ফর্ম (New Passport Entry)
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  আবেদনকারীর ব্যক্তিগত তথ্য ও টাকার হিসাব পূরণ করুন
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "1.3rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: "rgba(244, 63, 94, 0.12)",
                  border: "1px solid rgba(244, 63, 94, 0.35)",
                  color: "#f87171",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Application Category Toggle: Single vs Family/Group */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
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
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "rgba(56, 189, 248, 0.08)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  marginBottom: "16px",
                }}
              >
                💡 <strong style={{ color: "#38bdf8" }}>ফ্যামিলি পাসপোর্ট প্যাকেজ মোড:</strong> পরিবার প্রধান ও অন্যান্য সদস্যদের পাসপোর্ট তথ্য এখানে একত্রে এন্ট্রি করুন। আলাদা আলাদা টাকা ভাগ না করে নিচে পুরো পরিবারের জন্য <strong>একত্রে যৌথ চুক্তি টাকা ও জমা</strong> লিখুন। প্রত্যেকের জন্য আলাদা পাসপোর্ট এন্ট্রি নং (PS-XXX) স্বয়ংক্রিয়ভাবে তৈরি হবে।
              </div>
            )}

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Primary Applicant Section */}
              <div
                style={{
                  background: appCategory === "family_group" ? "rgba(99, 102, 241, 0.05)" : "transparent",
                  border: appCategory === "family_group" ? "1px solid rgba(99, 102, 241, 0.25)" : "none",
                  borderRadius: "8px",
                  padding: appCategory === "family_group" ? "14px" : "0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {appCategory === "family_group" && (
                  <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#818cf8" }}>
                    ১. পরিবার প্রধানের পাসপোর্ট তথ্য (Family Head / বিল ও যোগাযোগ প্রধান):
                  </div>
                )}

                {/* Field 1: Name */}
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    {appCategory === "family_group" ? "পরিবার প্রধানের নাম *" : "আবেদনকারীর নাম (Full Name) *"}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="যেমন: আব্দুর রহিম"
                    required
                    className="input-field"
                  />
                </div>

                {/* Field 2 & 3: Mobile & Email */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      মোবাইল নম্বর (Mobile Number) *
                    </label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="017xxxxxxxx"
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      ইমেইল (ঐচ্ছিক)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Field 4 & 5: NID & Birthdate */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      জাতীয় পরিচয়পত্র নম্বর (NID) *
                    </label>
                    <input
                      type="text"
                      value={nid}
                      onChange={(e) => setNid(e.target.value)}
                      placeholder="১০, ১৩ বা ১৭ ডিজিটের এনআইডি নং"
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      জন্মতারিখ (Birthdate) *
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Passport Type */}
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    পাসপোর্ট ধরন (Passport Type)
                  </label>
                  <select
                    value={passportType}
                    onChange={(e) => setPassportType(e.target.value)}
                    className="input-field"
                  >
                    {PASSPORT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Received Date & Received By */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      রিসিভ তারিখ (Received Date) *
                    </label>
                    <input
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      রিসিভ করেছেন যিনি (Received By) *
                    </label>
                    <select
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
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

                {/* Online Track ID */}
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Online Track ID (অনলাইন ট্র্যাকিং আইডি / OID - ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={onlineTrackId}
                    onChange={(e) => setOnlineTrackId(e.target.value.toUpperCase())}
                    placeholder="যেমন: OID-10023456"
                    className="input-field"
                    style={{ fontFamily: "monospace", textTransform: "uppercase" }}
                  />
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
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#a5b4fc" }}>
                            সদস্য #{idx + 2} (পাসপোর্ট এন্ট্রি #{idx + 2})
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

                        {/* Member Name and Relation */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                              সদস্যের পুরো নাম *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="যেমন: ফাতেমা বেগম"
                              value={m.name}
                              onChange={(e) => handleUpdateFamilyMember(m.id, "name", e.target.value)}
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

                        {/* NID / BRC and Birthdate */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                              NID / জন্মনিবন্ধন নং (BRC)
                            </label>
                            <input
                              type="text"
                              placeholder="এনআইডি বা ১৭ ডিজিটের জন্মনিবন্ধন"
                              value={m.nid}
                              onChange={(e) => handleUpdateFamilyMember(m.id, "nid", e.target.value)}
                              className="input-field"
                              style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                              জন্মতারিখ
                            </label>
                            <input
                              type="date"
                              value={m.birthDate}
                              onChange={(e) => handleUpdateFamilyMember(m.id, "birthDate", e.target.value)}
                              className="input-field"
                              style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                            />
                          </div>
                        </div>

                        {/* Passport Type and Track ID */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                              পাসপোর্ট ধরন
                            </label>
                            <select
                              value={m.passportType}
                              onChange={(e) => handleUpdateFamilyMember(m.id, "passportType", e.target.value)}
                              className="input-field"
                              style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                            >
                              {PASSPORT_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                              Online Track ID (ঐচ্ছিক)
                            </label>
                            <input
                              type="text"
                              placeholder="OID-XXXXXXXX"
                              value={m.onlineTrackId}
                              onChange={(e) => handleUpdateFamilyMember(m.id, "onlineTrackId", e.target.value.toUpperCase())}
                              className="input-field"
                              style={{ fontSize: "0.82rem", padding: "8px 10px", fontFamily: "monospace", textTransform: "uppercase" }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Financial Breakdown (কত টাকা নিবে / কত দিছে / বকেয়া) */}
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
                  {appCategory === "family_group"
                    ? `পুরো পরিবারের যৌথ টাকার হিসাব (${1 + familyMembers.length} জনের মোট প্যাকেজ বিল):`
                    : "লেনদেন ও টাকার হিসাব (Payment & Financials):"}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      {appCategory === "family_group"
                        ? "পুরো পরিবারের যৌথ চুক্তি টাকা (Total Amount) *"
                        : "কত টাকা নিবে তার কাছে (Total Amount) *"}
                    </label>
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder={appCategory === "family_group" ? "যেমন: 35000" : "যেমন: 6500"}
                      required
                      min={0}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      {appCategory === "family_group"
                        ? "সে কত টাকা দিছে / জমা টাকা (Paid Amount) *"
                        : "সে কত টাকা দিছে (Paid Amount) *"}
                    </label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder={appCategory === "family_group" ? "যেমন: 20000" : "যেমন: 4000"}
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
                    background: liveDue > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    border: liveDue > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: liveDue > 0 ? "#fbbf24" : "#34d399" }}>
                    {appCategory === "family_group"
                      ? "পুরো পরিবারের বকেয়া টাকা (Family Due - অটো হিসাব):"
                      : "বকেয়া টাকা (Due Amount - অটো হিসাব):"}
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: liveDue > 0 ? "#fbbf24" : "#34d399" }}>
                    ৳ {liveDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Status and Notes */}
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  বর্তমান স্ট্যাটাস (Status)
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="submitted">আবেদন জমা (Submitted)</option>
                  <option value="biometric_pending">বায়োমেট্রিক বাকি (Biometric Pending)</option>
                  <option value="police_verification">পুলিশ ভেরিফিকেশন (Police Verification)</option>
                  <option value="ready_for_pickup">পাসপোর্ট রেডি (Ready for Pickup)</option>
                  <option value="delivered">ডেলিভারি সম্পন্ন (Delivered)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  নোট / মন্তব্য (Note)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="পাসপোর্ট অফিস, ডেলিভারি তারিখ বা অন্যান্য নোট / মন্তব্য..."
                  rows={2}
                  className="input-field"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ flex: 1, padding: "12px" }}
                >
                  {submitting
                    ? "সংরক্ষণ হচ্ছে..."
                    : appCategory === "family_group"
                    ? `ফ্যামিলি প্যাকেজ সেভ করুন (${1 + familyMembers.length} জন)`
                    : "পাসপোর্ট এন্ট্রি সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILS & PAYMENT RECEIPT */}
      {selectedEntry && (
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
              maxWidth: "540px",
              padding: "30px",
              background: "var(--bg-modal)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
            }}
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
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>{selectedEntry.name}</h3>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                  <div style={{ fontSize: "0.82rem", color: "#38bdf8", fontWeight: 700 }}>
                    এন্ট্রি নম্বর: {selectedEntry.entryNumber}
                  </div>
                  {selectedEntry.applicationCategory === "family_group" && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: selectedEntry.isFamilyHead ? "rgba(56, 189, 248, 0.15)" : "rgba(168, 85, 247, 0.15)",
                        color: selectedEntry.isFamilyHead ? "#38bdf8" : "#c084fc",
                      }}
                    >
                      {selectedEntry.isFamilyHead
                        ? `👨‍👩‍👧‍👦 ফ্যামিলি প্যাকেজ প্রধান (${selectedEntry.familyMemberCount || 1} জন)`
                        : `🔗 ফ্যামিলি সদস্য (${selectedEntry.familyRelation || "সদস্য"})`}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>মোবাইল নম্বর:</span>
                <span style={{ fontWeight: 600 }}>{selectedEntry.mobile}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>ইমেইল:</span>
                <span>{selectedEntry.email || "দেওয়া নেই"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>জাতীয় পরিচয়পত্র (NID):</span>
                <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#a5b4fc" }}>
                  {selectedEntry.nid}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>জন্মতারিখ:</span>
                <span>{selectedEntry.birthDate}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>রিসিভ তারিখ (Received Date):</span>
                <span style={{ fontWeight: 600, color: "#38bdf8" }}>
                  {selectedEntry.receivedDate || (selectedEntry.createdAt ? selectedEntry.createdAt.split("T")[0] : "—")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>রিসিভ করেছেন যিনি (Received By):</span>
                <span style={{ fontWeight: 600, color: "#a5b4fc" }}>
                  {selectedEntry.receivedBy || (typeof selectedEntry.createdBy === "object" && selectedEntry.createdBy?.name ? selectedEntry.createdBy.name : selectedEntry.createdByName) || "—"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>পাসপোর্ট ধরন:</span>
                <span>{getPassportTypeLabel(selectedEntry.passportType)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>Online Track ID:</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: selectedEntry.onlineTrackId ? "#38bdf8" : "var(--text-muted)",
                    background: selectedEntry.onlineTrackId ? "rgba(56, 189, 248, 0.1)" : "transparent",
                    padding: selectedEntry.onlineTrackId ? "2px 8px" : "0",
                    borderRadius: "4px",
                  }}
                >
                  {selectedEntry.onlineTrackId || "যুক্ত করা হয়নি"}
                </span>
              </div>

              {/* Financial Box */}
              <div
                style={{
                  marginTop: "8px",
                  padding: "14px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>মোট চুক্তি টাকা:</span>
                  <span style={{ fontWeight: 700 }}>৳ {selectedEntry.totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>জমা দেওয়া টাকা:</span>
                  <span style={{ fontWeight: 700, color: "#34d399" }}>
                    ৳ {selectedEntry.paidAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontWeight: 700, color: selectedEntry.dueAmount > 0 ? "#fbbf24" : "#34d399" }}>
                    বকেয়া টাকা (Due):
                  </span>
                  <span style={{ fontWeight: 800, fontSize: "1.05rem", color: selectedEntry.dueAmount > 0 ? "#fbbf24" : "#34d399" }}>
                    ৳ {selectedEntry.dueAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                <button
                  onClick={() => setEditPaymentModal(!editPaymentModal)}
                  className="btn-secondary btn-sm"
                  style={{ marginTop: "6px" }}
                >
                  {editPaymentModal ? "পেমেন্ট বক্স লুকান" : "নতুন জমা টাকা আপডেট করুন"}
                </button>

                {editPaymentModal && (
                  <form onSubmit={handleUpdatePayment} style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                    <input
                      type="number"
                      value={newPaidInput}
                      onChange={(e) => setNewPaidInput(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="বর্তমান মোট জমা টাকা"
                      min={0}
                      className="input-field"
                      style={{ height: "36px", fontSize: "0.85rem" }}
                    />
                    <button
                      type="submit"
                      disabled={updatingPayment}
                      className="btn-primary btn-sm"
                      style={{ height: "36px", whiteSpace: "nowrap" }}
                    >
                      {updatingPayment ? "আপডেট..." : "সংরক্ষণ"}
                    </button>
                  </form>
                )}
              </div>

              {/* Family Package Information Card */}
              {selectedEntry.applicationCategory === "family_group" && (
                selectedEntry.isFamilyHead ? (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                      color: "#bae6fd",
                      lineHeight: 1.5,
                    }}
                  >
                    👨‍👩‍👧‍👦 <strong>ফ্যামিলি প্যাকেজ প্রধান:</strong> মোট সদস্য {selectedEntry.familyMemberCount || 1} জন। গ্রুপ আইডি: <code>{selectedEntry.familyGroupId}</code>
                    {selectedEntry.groupMembersSummary && (
                      <div style={{ marginTop: "4px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        প্যাকেজ সদস্যগণ: {selectedEntry.groupMembersSummary}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(168, 85, 247, 0.08)",
                      border: "1px solid rgba(168, 85, 247, 0.25)",
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                      color: "#d8b4fe",
                      lineHeight: 1.5,
                    }}
                  >
                    🔗 <strong>ফ্যামিলি প্যাকেজ সদস্য:</strong> সম্পর্ক: {selectedEntry.familyRelation || "সদস্য"}।
                    <div style={{ marginTop: "3px" }}>
                      বিল ও পরিবার প্রধান: <strong>{selectedEntry.familyHeadName} ({selectedEntry.familyHeadEntryNumber})</strong>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      এই সদস্যের সকল খরচ ও লেনদেন পরিবার প্রধানের যৌথ প্যাকেজে অন্তর্ভুক্ত রয়েছে।
                    </div>
                  </div>
                )
              )}

              {/* Notes */}
              <div style={{ marginTop: "6px", padding: "12px", background: "rgba(99, 102, 241, 0.06)", borderRadius: "6px", borderLeft: "3px solid #6366f1" }}>
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "4px" }}>নোট / মন্তব্য:</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  {selectedEntry.notes || "কোনো নোট যোগ করা নেই।"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEntry(null)}
              className="btn-primary"
              style={{ width: "100%", marginTop: "20px" }}
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PASSPORT ENTRY */}
      {editingEntry && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--modal-backdrop)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setEditingEntry(null)}
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
                  পাসপোর্ট এন্ট্রি এডিট করুন
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  এন্ট্রি নম্বর: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{editingEntry.entryNumber}</span>
                </p>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
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

            {editFormError && (
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
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateEntrySubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Name */}
              <div>
                <label className="label-text">
                  গ্রাহকের পুরো নাম <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="উদাঃ মোঃ রফিকুল ইসলাম"
                  className="input-field"
                />
              </div>

              {/* Mobile & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="label-text">
                    মোবাইল নম্বর <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">ইমেইল (ঐচ্ছিক)</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="input-field"
                  />
                </div>
              </div>

              {/* NID & Birthdate */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="label-text">
                    জাতীয় পরিচয়পত্র (NID) নম্বর <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNid}
                    onChange={(e) => setEditNid(e.target.value)}
                    placeholder="১০ অথবা ১৭ সংখ্যার NID"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">
                    জন্ম তারিখ <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Passport Type */}
              <div>
                <label className="label-text">
                  পাসপোর্ট ধরন <span style={{ color: "#f87171" }}>*</span>
                </label>
                <select
                  value={editPassportType}
                  onChange={(e) => setEditPassportType(e.target.value)}
                  className="input-field"
                  style={{
                    color: "var(--text-main)",
                    backgroundColor: "var(--bg-card)",
                    lineHeight: "1.5",
                  }}
                >
                  {PASSPORT_TYPE_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      style={{
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-main)",
                        padding: "6px",
                      }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                    value={editReceivedDate}
                    onChange={(e) => setEditReceivedDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-text">
                    রিসিভ করেছেন যিনি (Received By) <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <select
                    value={editReceivedBy}
                    onChange={(e) => setEditReceivedBy(e.target.value)}
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

              {/* Online Track ID */}
              <div>
                <label className="label-text">Online Track ID (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={editOnlineTrackId}
                  onChange={(e) => setEditOnlineTrackId(e.target.value.toUpperCase())}
                  placeholder="যেমন: OID-10023456"
                  className="input-field"
                  style={{ fontFamily: "monospace", textTransform: "uppercase" }}
                />
              </div>

              {/* Status */}
              <div>
                <label className="label-text">বর্তমান স্ট্যাটাস</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="input-field"
                  style={{
                    color: "var(--text-main)",
                    backgroundColor: "var(--bg-card)",
                  }}
                >
                  <option value="submitted">আবেদন জমা (Submitted)</option>
                  <option value="biometric_pending">বায়োমেট্রিক বাকি (Biometric Pending)</option>
                  <option value="police_verification">পুলিশ ভেরিফিকেশন (Police Verification)</option>
                  <option value="ready_for_pickup">পাসপোর্ট রেডি (Ready for Pickup)</option>
                  <option value="delivered">ডেলিভারি সম্পন্ন (Delivered)</option>
                </select>
              </div>

              {/* Financial Box */}
              <div
                className="financial-box"
                style={{
                  background: "rgba(15, 23, 42, 0.4)",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    fontSize: "0.92rem",
                    marginBottom: "12px",
                  }}
                >
                  <DollarSign size={16} color="#38bdf8" />
                  <span>লেনদেন ও টাকার হিসাব (Payment & Financials)</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label className="label-text">কত টাকা নিবে তার কাছে (মোট বিল)</label>
                    <input
                      type="number"
                      min={0}
                      value={editTotalAmount}
                      onChange={(e) => setEditTotalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="৳ 0"
                      className="input-field"
                      style={{ fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label className="label-text">সে কত টাকা দিছে (জমা)</label>
                    <input
                      type="number"
                      min={0}
                      value={editPaidAmount}
                      onChange={(e) => setEditPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="৳ 0"
                      className="input-field"
                      style={{ fontWeight: 700, color: "#34d399" }}
                    />
                  </div>
                </div>

                {/* Due display */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    background: liveEditDue > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    border: liveEditDue > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: liveEditDue > 0 ? "#fbbf24" : "#34d399" }}>
                    বকেয়া টাকা (Due Amount):
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: liveEditDue > 0 ? "#fbbf24" : "#34d399" }}>
                    ৳ {liveEditDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label-text">নোট / মন্তব্য (Note)</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="পাসপোর্ট অফিস, ডেলিভারি তারিখ বা অন্যান্য নোট / মন্তব্য..."
                  rows={2}
                  className="input-field"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={updatingEntry}
                  className="btn-primary"
                  style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  {updatingEntry ? "আপডেট হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
