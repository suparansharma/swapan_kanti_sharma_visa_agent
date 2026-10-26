"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  Briefcase,
  UserPlus,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  X,
  FileSpreadsheet,
} from "lucide-react";

interface DepartmentItem {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  employeeCount?: number;
}

interface DesignationItem {
  _id: string;
  title: string;
  department?: string;
  description?: string;
  employeeCount?: number;
}

interface EmployeeItem {
  _id: string;
  employeeId: string;
  name: string;
  phone: string;
  email?: string;
  department: string;
  designation: string;
  joiningDate?: string;
  salary?: number;
  status: "active" | "inactive" | "on_leave";
  address?: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
}

interface HRMModuleProps {
  initialSection?: "employees" | "departments" | "designations";
}

export default function HRMModule({ initialSection = "employees" }: HRMModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"employees" | "departments" | "designations">(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSubTab(initialSection);
    }
  }, [initialSection]);

  // State: Employees
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [empStats, setEmpStats] = useState({ total: 0, active: 0, inactive: 0, onLeave: 0 });
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // State: Departments & Designations
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [designations, setDesignations] = useState<DesignationItem[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingDesigs, setLoadingDesigs] = useState(true);

  // Modals
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showViewEmployeeModal, setShowViewEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeItem | null>(null);

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddDesigModal, setShowAddDesigModal] = useState(false);

  // Form states - Employee
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dept, setDept] = useState("");
  const [desig, setDesig] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [salary, setSalary] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "on_leave">("active");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingEmp, setSubmittingEmp] = useState(false);

  // Form states - Department
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [submittingDept, setSubmittingDept] = useState(false);

  // Form states - Designation
  const [desigTitle, setDesigTitle] = useState("");
  const [desigDept, setDesigDept] = useState("");
  const [desigDesc, setDesigDesc] = useState("");
  const [submittingDesig, setSubmittingDesig] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch Departments
  const fetchDepartments = async () => {
    try {
      setLoadingDepts(true);
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.departments) {
        setDepartments(data.departments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDepts(false);
    }
  };

  // Fetch Designations
  const fetchDesignations = async () => {
    try {
      setLoadingDesigs(true);
      const res = await fetch("/api/designations");
      const data = await res.json();
      if (data.designations) {
        setDesignations(data.designations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDesigs(false);
    }
  };

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const params = new URLSearchParams();
      if (searchEmployee.trim()) params.append("search", searchEmployee.trim());
      if (filterDepartment !== "all") params.append("department", filterDepartment);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const res = await fetch(`/api/employees?${params.toString()}`);
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
        if (data.stats) setEmpStats(data.stats);
      }
    } catch (e) {
      console.error(e);
      showNotification("error", "কর্মীদের তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
    fetchEmployees();
  }, []);

  // Filtered designations based on chosen department in modal
  const availableDesignations = dept
    ? designations.filter((d) => !d.department || d.department === dept)
    : designations;

  // Handle Add Department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) {
      showNotification("error", "ডিপার্টমেন্ট নাম প্রদান করুন");
      return;
    }
    setSubmittingDept(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName, code: deptCode, description: deptDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ডিপার্টমেন্ট তৈরিতে ব্যর্থ");

      showNotification("success", "ডিপার্টমেন্ট সফলভাবে তৈরি হয়েছে");
      setDeptName("");
      setDeptCode("");
      setDeptDesc("");
      setShowAddDeptModal(false);
      fetchDepartments();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "সমস্যা হয়েছে");
    } finally {
      setSubmittingDept(false);
    }
  };

  // Handle Delete Department
  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই ডিপার্টমেন্টটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/departments?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "মুছতে ব্যর্থ হয়েছে");
      showNotification("success", "ডিপার্টমেন্ট মুছে ফেলা হয়েছে");
      fetchDepartments();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "মুছতে ব্যর্থ হয়েছে");
    }
  };

  // Handle Add Designation
  const handleAddDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desigTitle.trim()) {
      showNotification("error", "পদবী/পদবী নাম প্রদান করুন");
      return;
    }
    setSubmittingDesig(true);
    try {
      const res = await fetch("/api/designations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: desigTitle, department: desigDept, description: desigDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "পদবী তৈরিতে ব্যর্থ");

      showNotification("success", "পদবী সফলভাবে তৈরি হয়েছে");
      setDesigTitle("");
      setDesigDept("");
      setDesigDesc("");
      setShowAddDesigModal(false);
      fetchDesignations();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "সমস্যা হয়েছে");
    } finally {
      setSubmittingDesig(false);
    }
  };

  // Handle Delete Designation
  const handleDeleteDesignation = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই পদবীটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/designations?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "মুছতে ব্যর্থ হয়েছে");
      showNotification("success", "পদবী মুছে ফেলা হয়েছে");
      fetchDesignations();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "মুছতে ব্যর্থ হয়েছে");
    }
  };

  // Handle Add Employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !dept.trim() || !desig.trim()) {
      showNotification("error", "নাম, মোবাইল নম্বর, ডিপার্টমেন্ট ও পদবী বাধ্যতামূলক");
      return;
    }
    if (password && password.trim()) {
      if (!email.trim()) {
        showNotification("error", "লগইন অ্যাকাউন্ট তৈরির জন্য ইমেইল প্রদান করুন");
        return;
      }
      if (password.trim().length < 6) {
        showNotification("error", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
        return;
      }
    }
    setSubmittingEmp(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          password: password.trim(),
          department: dept,
          designation: desig,
          joiningDate,
          salary: Number(salary) || 0,
          status,
          address,
          emergencyContact,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "কর্মী তৈরি করতে ব্যর্থ");

      showNotification("success", `কর্মী সফলভাবে তৈরি হয়েছে (আইডি: ${data.employee?.employeeId})`);
      setShowAddEmployeeModal(false);
      resetEmployeeForm();
      fetchEmployees();
      fetchDepartments();
      fetchDesignations();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "ত্রুটি হয়েছে");
    } finally {
      setSubmittingEmp(false);
    }
  };

  // Open Edit Employee
  const handleOpenEdit = (emp: EmployeeItem) => {
    setSelectedEmployee(emp);
    setName(emp.name);
    setPhone(emp.phone);
    setEmail(emp.email || "");
    setDept(emp.department);
    setDesig(emp.designation);
    setJoiningDate(emp.joiningDate || "");
    setSalary(emp.salary ? String(emp.salary) : "");
    setStatus(emp.status);
    setAddress(emp.address || "");
    setEmergencyContact(emp.emergencyContact || "");
    setNotes(emp.notes || "");
    setShowEditEmployeeModal(true);
  };

  // Handle Update Employee
  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setSubmittingEmp(true);
    try {
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEmployee._id,
          name,
          phone,
          email,
          department: dept,
          designation: desig,
          joiningDate,
          salary: Number(salary) || 0,
          status,
          address,
          emergencyContact,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "আপডেট ব্যর্থ হয়েছে");

      showNotification("success", "কর্মীর তথ্য সফলভাবে আপডেট হয়েছে");
      setShowEditEmployeeModal(false);
      resetEmployeeForm();
      fetchEmployees();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "ত্রুটি হয়েছে");
    } finally {
      setSubmittingEmp(false);
    }
  };

  // Handle Delete Employee
  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই কর্মীকে মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "মুছতে ব্যর্থ হয়েছে");
      showNotification("success", "কর্মী মুছে ফেলা হয়েছে");
      fetchEmployees();
      fetchDepartments();
      fetchDesignations();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "মুছতে ব্যর্থ হয়েছে");
    }
  };

  const resetEmployeeForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setDept(departments.length > 0 ? departments[0].name : "");
    setDesig("");
    setJoiningDate("");
    setSalary("");
    setStatus("active");
    setAddress("");
    setEmergencyContact("");
    setNotes("");
    setSelectedEmployee(null);
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "active":
        return { label: "সক্রিয়", bg: "rgba(16, 185, 129, 0.15)", color: "#34d399" };
      case "inactive":
        return { label: "নিষ্ক্রিয়", bg: "rgba(239, 68, 68, 0.15)", color: "#f87171" };
      case "on_leave":
        return { label: "ছুটিতে", bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" };
      default:
        return { label: s, bg: "rgba(255, 255, 255, 0.08)", color: "var(--text-secondary)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Toast Notification */}
      {feedback && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "14px 20px",
            borderRadius: "var(--radius-md)",
            background: feedback.type === "success" ? "#065f46" : "#991b1b",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.9rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "slideIn 0.3s ease",
          }}
        >
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
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
              এইচআরএম মডিউল (HRM & Employee Management)
            </h1>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background: "rgba(168, 85, 247, 0.15)",
                color: "#c084fc",
                fontSize: "0.76rem",
                fontWeight: 700,
              }}
            >
              HR Module
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
            কর্মী তালিকা, নতুন কর্মী এন্ট্রি, ডিপার্টমেন্ট এবং পদবী (Designation) ব্যবস্থাপনা
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (departments.length === 0) {
                showNotification("error", "প্রথমে একটি ডিপার্টমেন্ট ও পদবী তৈরি করুন");
                setShowAddDeptModal(true);
                return;
              }
              resetEmployeeForm();
              setShowAddEmployeeModal(true);
            }}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <UserPlus size={16} />
            <span>নতুন কর্মী যোগ করুন</span>
          </button>
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Building2 size={16} />
            <span>+ ডিপার্টমেন্ট</span>
          </button>
          <button
            onClick={() => setShowAddDesigModal(true)}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Briefcase size={16} />
            <span>+ পদবী (Designation)</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <div className="glass-panel" style={{ padding: "18px 20px", borderLeft: "4px solid #818cf8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>মোট কর্মী</span>
            <Users size={18} style={{ color: "#818cf8" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginTop: "6px" }}>
            {empStats.total} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>জন</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "18px 20px", borderLeft: "4px solid #34d399" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>সক্রিয় কর্মী (Active)</span>
            <CheckCircle2 size={18} style={{ color: "#34d399" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#34d399", marginTop: "6px" }}>
            {empStats.active} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>জন</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "18px 20px", borderLeft: "4px solid #a855f7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>ডিপার্টমেন্ট সংখ্যা</span>
            <Building2 size={18} style={{ color: "#a855f7" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginTop: "6px" }}>
            {departments.length} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>টি</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "18px 20px", borderLeft: "4px solid #38bdf8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>পদবী সংখ্যা (Designations)</span>
            <Briefcase size={18} style={{ color: "#38bdf8" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginTop: "6px" }}>
            {designations.length} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>টি</span>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION: Employees / Departments / Designations */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "8px",
        }}
      >
        <button
          onClick={() => setActiveSubTab("employees")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: activeSubTab === "employees" ? "var(--primary-gradient)" : "transparent",
            color: activeSubTab === "employees" ? "#ffffff" : "var(--text-secondary)",
            fontWeight: activeSubTab === "employees" ? 700 : 500,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Users size={16} />
          <span>কর্মীদের তালিকা ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("departments")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: activeSubTab === "departments" ? "var(--primary-gradient)" : "transparent",
            color: activeSubTab === "departments" ? "#ffffff" : "var(--text-secondary)",
            fontWeight: activeSubTab === "departments" ? 700 : 500,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Building2 size={16} />
          <span>ডিপার্টমেন্ট তালিকা ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("designations")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: activeSubTab === "designations" ? "var(--primary-gradient)" : "transparent",
            color: activeSubTab === "designations" ? "#ffffff" : "var(--text-secondary)",
            fontWeight: activeSubTab === "designations" ? 700 : 500,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Briefcase size={16} />
          <span>পদবী তালিকা ({designations.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: EMPLOYEES */}
      {activeSubTab === "employees" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* SEARCH & FILTERS */}
          <div
            className="glass-panel"
            style={{
              padding: "16px 20px",
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchEmployees();
              }}
              style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px" }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  placeholder="কর্মী আইডি, নাম, পদবী বা মোবাইল দিয়ে খুঁজুন..."
                  className="input-field"
                  style={{ paddingLeft: "36px", height: "42px", fontSize: "0.88rem" }}
                />
              </div>
              <button type="submit" className="btn-secondary" style={{ height: "42px", padding: "0 18px" }}>
                খুঁজুন
              </button>
            </form>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Department filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  ডিপার্টমেন্ট:
                </span>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="input-field"
                  style={{ width: "auto", height: "42px", fontSize: "0.85rem", padding: "0 10px" }}
                >
                  <option value="all">সকল ডিপার্টমেন্ট</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  স্ট্যাটাস:
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field"
                  style={{ width: "auto", height: "42px", fontSize: "0.85rem", padding: "0 10px" }}
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <option value="active">সক্রিয় (Active)</option>
                  <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                  <option value="on_leave">ছুটিতে (On Leave)</option>
                </select>
              </div>

              <button
                onClick={() => fetchEmployees()}
                className="btn-secondary"
                style={{ height: "42px", padding: "0 12px" }}
                title="রিফ্রেশ"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* EMPLOYEES TABLE */}
          <div className="glass-panel" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>কর্মী আইডি</th>
                    <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>নাম</th>
                    <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>মোবাইল নম্বর</th>
                    <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>ডিপার্টমেন্ট</th>
                    <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>পদবী (Designation)</th>
                    <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>বেতন</th>
                    <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>স্ট্যাটাস</th>
                    <th style={{ padding: "14px 18px", color: "var(--text-muted)", textAlign: "right" }}>একশন</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingEmployees ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                        কর্মী তথ্য লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                        কোনো কর্মীর রেকর্ড পাওয়া যায়নি। &quot;নতুন কর্মী যোগ করুন&quot; বাটনে ক্লিক করে কর্মী যোগ করুন।
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => {
                      const badge = getStatusBadge(emp.status);
                      return (
                        <tr key={emp._id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#38bdf8" }}>
                            {emp.employeeId}
                          </td>
                          <td style={{ padding: "14px 18px", fontWeight: 700, color: "var(--text-main)" }}>
                            {emp.name}
                            {emp.email && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>
                                {emp.email}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "14px 18px", fontWeight: 600, color: "var(--text-main)" }}>
                            {emp.phone}
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                background: "rgba(168, 85, 247, 0.12)",
                                color: "#c084fc",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                              }}
                            >
                              {emp.department}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", fontWeight: 600, color: "var(--text-secondary)" }}>
                            {emp.designation}
                          </td>
                          <td style={{ padding: "14px 18px", fontWeight: 700, color: "#34d399" }}>
                            {emp.salary ? `৳ ${emp.salary.toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "var(--radius-full)",
                                background: badge.bg,
                                color: badge.color,
                                fontSize: "0.74rem",
                                fontWeight: 700,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                onClick={() => {
                                  setSelectedEmployee(emp);
                                  setShowViewEmployeeModal(true);
                                }}
                                className="btn-secondary btn-sm"
                                style={{ padding: "5px 8px" }}
                                title="বিস্তারিত দেখুন"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                className="btn-secondary btn-sm"
                                style={{ padding: "5px 8px", color: "#38bdf8" }}
                                title="এডিট করুন"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(emp._id)}
                                className="btn-secondary btn-sm btn-danger"
                                style={{ padding: "5px 8px" }}
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
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DEPARTMENTS */}
      {activeSubTab === "departments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
              ডিপার্টমেন্ট তালিকা ({departments.length})
            </h3>
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
            >
              <Plus size={15} />
              <span>নতুন ডিপার্টমেন্ট যোগ করুন</span>
            </button>
          </div>

          <div className="glass-panel" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>ডিপার্টমেন্ট নাম</th>
                  <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>কোড</th>
                  <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>বিবরণ</th>
                  <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>কর্মী সংখ্যা</th>
                  <th style={{ padding: "14px 18px", color: "var(--text-muted)", textAlign: "right" }}>একশন</th>
                </tr>
              </thead>
              <tbody>
                {loadingDepts ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                      ডিপার্টমেন্ট লোড হচ্ছে...
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                      কোনো ডিপার্টমেন্ট যোগ করা হয়নি।
                    </td>
                  </tr>
                ) : (
                  departments.map((d) => (
                    <tr key={d._id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 700, color: "var(--text-main)" }}>
                        {d.name}
                      </td>
                      <td style={{ padding: "14px 18px", fontFamily: "monospace", color: "#818cf8" }}>
                        {d.code || "—"}
                      </td>
                      <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>
                        {d.description || "—"}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "var(--radius-full)",
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#34d399",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                          }}
                        >
                          {d.employeeCount || 0} জন
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteDepartment(d._id)}
                          className="btn-secondary btn-sm btn-danger"
                          style={{ padding: "5px 8px" }}
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DESIGNATIONS */}
      {activeSubTab === "designations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
              পদবী (Designation) তালিকা ({designations.length})
            </h3>
            <button
              onClick={() => setShowAddDesigModal(true)}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
            >
              <Plus size={15} />
              <span>নতুন পদবী যোগ করুন</span>
            </button>
          </div>

          <div className="glass-panel" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>পদবী নাম</th>
                  <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>সংযুক্ত ডিপার্টমেন্ট</th>
                  <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>বিবরণ</th>
                  <th style={{ padding: "14px 18px", color: "var(--text-muted)" }}>কর্মী সংখ্যা</th>
                  <th style={{ padding: "14px 18px", color: "var(--text-muted)", textAlign: "right" }}>একশন</th>
                </tr>
              </thead>
              <tbody>
                {loadingDesigs ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                      পদবী লোড হচ্ছে...
                    </td>
                  </tr>
                ) : designations.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                      কোনো পদবী যোগ করা হয়নি।
                    </td>
                  </tr>
                ) : (
                  designations.map((d) => (
                    <tr key={d._id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 700, color: "var(--text-main)" }}>
                        {d.title}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        {d.department ? (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "rgba(168, 85, 247, 0.12)",
                              color: "#c084fc",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                            }}
                          >
                            {d.department}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>সকল ডিপার্টমেন্ট</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>
                        {d.description || "—"}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "var(--radius-full)",
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#34d399",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                          }}
                        >
                          {d.employeeCount || 0} জন
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteDesignation(d._id)}
                          className="btn-secondary btn-sm btn-danger"
                          style={{ padding: "5px 8px" }}
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {(showAddEmployeeModal || showEditEmployeeModal) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "26px",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "rgba(168, 85, 247, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#c084fc",
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>
                    {showEditEmployeeModal ? "কর্মী তথ্য এডিট করুন" : "নতুন কর্মী যোগ করুন"}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {showEditEmployeeModal
                      ? `আইডি: ${selectedEmployee?.employeeId}`
                      : "কর্মীর প্রয়োজনীয় তথ্য পূরণ করে সংরক্ষণ করুন"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setShowEditEmployeeModal(false);
                  resetEmployeeForm();
                }}
                className="btn-secondary btn-sm"
                style={{ padding: "6px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={showEditEmployeeModal ? handleUpdateEmployee : handleAddEmployee}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {/* Name */}
                <div style={{ gridColumn: "span 2" }}>
                  <label className="input-label">কর্মীর পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                    className="input-field"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="input-label">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="যেমন: 01712345678"
                    className="input-field"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="input-label">ইমেইল (লগইন ইউজারনেম হিসেবে ব্যবহার হবে)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rafiq@sharma.com"
                    className="input-field"
                  />
                </div>

                {/* Password for Login */}
                {showAddEmployeeModal && (
                  <div>
                    <label className="input-label">লগইন পাসওয়ার্ড (ঐচ্ছিক)</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ সংখ্যার পাসওয়ার্ড দিন"
                      className="input-field"
                      autoComplete="new-password"
                    />
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px" }}>
                      পাসওয়ার্ড দিলে কর্মী এই ইমেইল ও পাসওয়ার্ড দিয়ে সিস্টেমে লগইন করতে পারবে
                    </div>
                  </div>
                )}

                {/* Department */}
                <div>
                  <label className="input-label">ডিপার্টমেন্ট *</label>
                  <select
                    required
                    value={dept}
                    onChange={(e) => {
                      setDept(e.target.value);
                      setDesig("");
                    }}
                    className="input-field"
                  >
                    <option value="">ডিপার্টমেন্ট নির্বাচন করুন</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d.name}>
                        {d.name} {d.code ? `(${d.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="input-label">পদবী (Designation) *</label>
                  <select
                    required
                    value={desig}
                    onChange={(e) => setDesig(e.target.value)}
                    className="input-field"
                  >
                    <option value="">পদবী নির্বাচন করুন</option>
                    {availableDesignations.map((d) => (
                      <option key={d._id} value={d.title}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Joining Date */}
                <div>
                  <label className="input-label">যোগদানের তারিখ</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                {/* Salary */}
                <div>
                  <label className="input-label">মাসিক বেতন (টাকা)</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="যেমন: 25000"
                    className="input-field"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="input-label">কর্মীর স্ট্যাটাস</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "on_leave")}
                    className="input-field"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                    <option value="on_leave">ছুটিতে (On Leave)</option>
                  </select>
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="input-label">জরুরি যোগাযোগ নম্বর</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="01812345678 (পিতা/স্ত্রী)"
                    className="input-field"
                  />
                </div>

                {/* Address */}
                <div style={{ gridColumn: "span 2" }}>
                  <label className="input-label">ঠিকানা</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="বর্তমান ঠিকানা বা স্থায়ী ঠিকানা"
                    className="input-field"
                  />
                </div>

                {/* Notes */}
                <div style={{ gridColumn: "span 2" }}>
                  <label className="input-label">মন্তব্য / বিশেষ নোট</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="কর্মীর শিক্ষাগত যোগ্যতা বা প্রাসঙ্গিক মন্তব্য..."
                    className="input-field"
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "24px",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "16px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEmployeeModal(false);
                    setShowEditEmployeeModal(false);
                    resetEmployeeForm();
                  }}
                  className="btn-secondary"
                >
                  বাতিল
                </button>
                <button type="submit" disabled={submittingEmp} className="btn-primary">
                  {submittingEmp
                    ? "সংরক্ষণ হচ্ছে..."
                    : showEditEmployeeModal
                    ? "আপডেট নিশ্চিত করুন"
                    : "কর্মী তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEPARTMENT */}
      {showAddDeptModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Building2 size={20} style={{ color: "#a855f7" }} />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>
                  নতুন ডিপার্টমেন্ট যোগ করুন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="btn-secondary btn-sm"
                style={{ padding: "6px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDepartment}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label className="input-label">ডিপার্টমেন্ট নাম *</label>
                  <input
                    type="text"
                    required
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="যেমন: Visa Processing বা HR"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">ডিপার্টমেন্ট কোড (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    placeholder="যেমন: VISA বা ACC"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">বিবরণ</label>
                  <textarea
                    rows={2}
                    value={deptDesc}
                    onChange={(e) => setDeptDesc(e.target.value)}
                    placeholder="ডিপার্টমেন্টের দায়িত্ব বা বিবরণ..."
                    className="input-field"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "14px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="btn-secondary"
                >
                  বাতিল
                </button>
                <button type="submit" disabled={submittingDept} className="btn-primary">
                  {submittingDept ? "যোগ হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DESIGNATION */}
      {showAddDesigModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Briefcase size={20} style={{ color: "#38bdf8" }} />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>
                  নতুন পদবী (Designation) যোগ করুন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDesigModal(false)}
                className="btn-secondary btn-sm"
                style={{ padding: "6px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDesignation}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label className="input-label">পদবী নাম (Designation Title) *</label>
                  <input
                    type="text"
                    required
                    value={desigTitle}
                    onChange={(e) => setDesigTitle(e.target.value)}
                    placeholder="যেমন: Visa Consultant, Manager বা Officer"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">সংযুক্ত ডিপার্টমেন্ট (ঐচ্ছিক)</label>
                  <select
                    value={desigDept}
                    onChange={(e) => setDesigDept(e.target.value)}
                    className="input-field"
                  >
                    <option value="">সকল ডিপার্টমেন্টের জন্য প্রযোজ্য</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">বিবরণ</label>
                  <textarea
                    rows={2}
                    value={desigDesc}
                    onChange={(e) => setDesigDesc(e.target.value)}
                    placeholder="পদবীর দায়িত্ব বা বিবরণ..."
                    className="input-field"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "14px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddDesigModal(false)}
                  className="btn-secondary"
                >
                  বাতিল
                </button>
                <button type="submit" disabled={submittingDesig} className="btn-primary">
                  {submittingDesig ? "যোগ হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW EMPLOYEE DETAILS */}
      {showViewEmployeeModal && selectedEmployee && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "26px",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
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
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>
                  {selectedEmployee.name}
                </h3>
                <div style={{ fontSize: "0.85rem", color: "#38bdf8", fontWeight: 700, fontFamily: "monospace" }}>
                  আইডি: {selectedEmployee.employeeId}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowViewEmployeeModal(false)}
                className="btn-secondary btn-sm"
                style={{ padding: "6px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>ডিপার্টমেন্ট</div>
                  <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    {selectedEmployee.department}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>পদবী (Designation)</div>
                  <div style={{ fontWeight: 700, color: "#818cf8" }}>
                    {selectedEmployee.designation}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>মোবাইল নম্বর</div>
                  <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                    {selectedEmployee.phone}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>ইমেইল</div>
                  <div style={{ fontWeight: 500, color: "var(--text-secondary)" }}>
                    {selectedEmployee.email || "—"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>মাসিক বেতন</div>
                  <div style={{ fontWeight: 700, color: "#34d399", fontSize: "1.1rem" }}>
                    {selectedEmployee.salary ? `৳ ${selectedEmployee.salary.toLocaleString("en-IN")}` : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>স্ট্যাটাস</div>
                  <div style={{ marginTop: "4px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "var(--radius-full)",
                        background: getStatusBadge(selectedEmployee.status).bg,
                        color: getStatusBadge(selectedEmployee.status).color,
                        fontSize: "0.76rem",
                        fontWeight: 700,
                      }}
                    >
                      {getStatusBadge(selectedEmployee.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {selectedEmployee.joiningDate && (
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>যোগদানের তারিখ</div>
                  <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                    {selectedEmployee.joiningDate}
                  </div>
                </div>
              )}

              {selectedEmployee.address && (
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>ঠিকানা</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                    {selectedEmployee.address}
                  </div>
                </div>
              )}

              {selectedEmployee.emergencyContact && (
                <div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>জরুরি যোগাযোগ</div>
                  <div style={{ fontWeight: 600, color: "#fbbf24" }}>
                    {selectedEmployee.emergencyContact}
                  </div>
                </div>
              )}

              {selectedEmployee.notes && (
                <div style={{ padding: "10px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "4px" }}>মন্তব্য:</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {selectedEmployee.notes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                type="button"
                onClick={() => setShowViewEmployeeModal(false)}
                className="btn-primary"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
