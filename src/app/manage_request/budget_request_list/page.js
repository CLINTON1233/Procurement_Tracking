"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  FileSpreadsheet,
  ChevronDown,
  Grid,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Eye,
  FileText,
  Calendar,
  Package,
  DollarSign,
  Wallet,
  ArrowUp,
  ArrowDown,
  List as ListIcon,
  RotateCcw,
  Server,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";
import { showRequestDetailsModal } from "@/components/modals/BudgetRequestModals";
import { formatTableCurrency } from "@/utils/currencyFormatter";
import Link from "next/link";
import { formatIDR } from "@/utils/currency";
import { convertCurrency } from "@/utils/currency";
// ─── Generate tahun dari 2020 sampai 5 tahun ke depan ─────────────────────
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2020; year <= currentYear + 5; year++) {
    years.push(year.toString());
  }
  return years;
};

// ─── Inline Donut ─────────────────────────────────────────────────────────────
const InlineDonut = ({
  pct = 0,
  color = "#2563eb",
  size = 100,
  stroke = 11,
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="text-2xl font-bold text-gray-900 z-10">
        {isNaN(pct) ? 0 : pct.toFixed(0)}%
      </span>
    </div>
  );
};

// ─── Stacked Bar ─────────────────────────────────────────────────────────────
const StackedBar = ({ segments }) => (
  <div className="flex rounded-full overflow-hidden h-7 w-full">
    {segments.map((s, i) => (
      <div
        key={i}
        style={{ width: `${s.pct}%`, background: s.color }}
        className="flex items-center justify-center text-xs font-bold text-white transition-all"
      >
        {s.pct > 12 ? `${s.pct.toFixed(0)}%` : ""}
      </div>
    ))}
  </div>
);

const fmtCompact = (n) => {
  if (!n) return "0";
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
};

export default function BudgetRequestListPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [headerTypeFilter, setHeaderTypeFilter] = useState("all");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [yearFilter, setYearFilter] = useState("all");
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState("IDR");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const availableYears = generateYears();

  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    waiting: 0,
    totalAmount: 0,
    CAPEX: 0,
    SERVICE: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const formatRequestAmount = (amountInIDR) => {
    if (displayCurrency === "IDR") {
      return formatIDR(amountInIDR);
    } else {
      const amountInUSD = convertCurrency(amountInIDR, "IDR", "USD");
      return `$ ${amountInUSD.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsData, budgetsData, deptsData] = await Promise.all([
        budgetService.getAllRequests(),
        budgetService.getAllBudgets(),
        departmentService.getAllDepartments(),
      ]);
      setRequests(requestsData);
      setBudgets(budgetsData);
      setDepartments(deptsData);
      calculateStats(requestsData);
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to fetch request data",
        icon: "error",
        confirmButtonColor: "#1e40af",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      draft: data.filter((r) => r.status === "DRAFT").length,
      submitted: data.filter((r) => r.status === "SUBMITTED").length,
      approved: data.filter((r) => r.status === "BUDGET_APPROVED").length,
      rejected: data.filter((r) => r.status === "BUDGET_REJECTED").length,
      waiting: data.filter((r) => r.status === "WAITING_SR_MR").length,
      CAPEX: data.filter((r) => r.budget_type === "CAPEX").length,
      SERVICE: data.filter((r) => r.request_type === "SERVICE").length,
      totalAmount: data.reduce(
        (s, r) => s + Number(r.estimated_total_idr || 0),
        0,
      ),
    });
  };

  const handleViewDetails = (request) => showRequestDetailsModal(request);
  const handleRevision = (request) =>
    router.push(`/manage_revision/revision/${request.id}`);

  const handleDeleteRequest = async (request) => {
    const result = await Swal.fire({
      title: "Delete Request?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
    });
    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Deleting...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        await budgetService.deleteRequest(request.id);
        Swal.fire({
          title: "Deleted!",
          icon: "success",
          timer: 1500,
          confirmButtonColor: "#1e40af",
        });
        fetchData();
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: error.message || "Failed to delete",
          icon: "error",
          confirmButtonColor: "#1e40af",
        });
      }
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedRequests([]);
    setSelectAll(false);
  };
  const handleSelectRequest = (id) =>
    setSelectedRequests((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const handleSelectAll = () => {
    if (selectAll) setSelectedRequests([]);
    else setSelectedRequests(filteredRequests.map((r) => r.id));
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async () => {
    if (!selectedRequests.length)
      return Swal.fire({
        title: "No Selection",
        text: "Please select at least one request",
        icon: "warning",
        confirmButtonColor: "#1e40af",
      });
    const result = await Swal.fire({
      title: `Delete ${selectedRequests.length} Requests?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete All!",
      buttonsStyling: false,
      customClass: {
        actions: "flex gap-3 justify-center",
        confirmButton:
          "px-6 py-2 rounded-lg bg-red-600 text-white font-medium min-w-[140px]",
        cancelButton:
          "px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium min-w-[140px]",
      },
    });
    if (result.isConfirmed) {
      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      let success = 0;
      for (const id of selectedRequests) {
        try {
          await budgetService.deleteRequest(id);
          success++;
        } catch {}
      }
      Swal.fire({
        title: "Deleted!",
        text: `${success} Requests deleted`,
        icon: "success",
        confirmButtonColor: "#1e40af",
      });
      fetchData();
      setSelectMode(false);
      setSelectedRequests([]);
      setSelectAll(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getBudgetName = (id) => {
    if (!id) return "-";
    const b = budgets.find((b) => b.id === id);
    return b ? b.budget_name : `ID: ${id}`;
  };

  const formatBudgetCurrency = (amount, currencyCode) =>
    formatTableCurrency(amount, currencyCode);

  const getStatusConfig = (status) => {
    const map = {
      DRAFT: {
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "#9ca3af",
        label: "Draft",
        icon: FileText,
      },
      SUBMITTED: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        dot: "#2563eb",
        label: "Submitted",
        icon: Send,
      },
      BUDGET_APPROVED: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        dot: "#10b981",
        label: "Approved",
        icon: CheckCircle,
      },
      BUDGET_REJECTED: {
        bg: "bg-red-100",
        text: "text-red-700",
        dot: "#ef4444",
        label: "Rejected",
        icon: XCircle,
      },
      WAITING_SR_MR: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        dot: "#8b5cf6",
        label: "Waiting SR/MR",
        icon: Clock,
      },
    };
    return (
      map[status] || {
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "#9ca3af",
        label: status,
        icon: AlertCircle,
      }
    );
  };

  const uniqueDepartments = useMemo(
    () => [...new Set(requests.map((r) => r.department))].filter(Boolean),
    [requests],
  );

  // Filter berdasarkan header (type dan year)
  const filteredRequestsByHeader = useMemo(() => {
    let filtered = requests;

    // Filter by budget type (CAPEX/OPEX)
    if (headerTypeFilter !== "all") {
      filtered = filtered.filter((r) => r.budget_type === headerTypeFilter);
    }

    // Filter by year (dari created_at)
    if (yearFilter !== "all") {
      filtered = filtered.filter((r) => {
        if (!r.created_at) return false;
        const year = new Date(r.created_at).getFullYear().toString();
        return year === yearFilter;
      });
    }

    return filtered;
  }, [requests, headerTypeFilter, yearFilter]);

  // Hitung ulang stats berdasarkan filter header
  const filteredStats = useMemo(() => {
    const filtered = filteredRequestsByHeader;
    return {
      total: filtered.length,
      draft: filtered.filter((r) => r.status === "DRAFT").length,
      submitted: filtered.filter((r) => r.status === "SUBMITTED").length,
      approved: filtered.filter((r) => r.status === "BUDGET_APPROVED").length,
      rejected: filtered.filter((r) => r.status === "BUDGET_REJECTED").length,
      waiting: filtered.filter((r) => r.status === "WAITING_SR_MR").length,
      CAPEX: filtered.filter((r) => r.budget_type === "CAPEX").length,
      SERVICE: filtered.filter((r) => r.request_type === "SERVICE").length,
      totalAmount: filtered.reduce(
        (s, r) => s + Number(r.estimated_total_idr || 0),
        0,
      ),
    };
  }, [filteredRequestsByHeader]);

  const filteredRequests = useMemo(() => {
    let filtered = filteredRequestsByHeader.filter((r) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        [r.request_no, r.requester_name, r.item_name, r.department].some((v) =>
          (v || "").toLowerCase().includes(q),
        );
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchType = typeFilter === "all" || r.request_type === typeFilter;
      const matchDept =
        departmentFilter === "all" || r.department === departmentFilter;
      return matchSearch && matchStatus && matchType && matchDept;
    });
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      filtered.sort((a, b) => {
        let av = a[id],
          bv = b[id];
        if (id === "estimated_total") {
          av = Number(av || 0);
          bv = Number(bv || 0);
        }
        if (id === "created_at") {
          av = new Date(av).getTime();
          bv = new Date(bv).getTime();
        }
        return av < bv ? (desc ? 1 : -1) : av > bv ? (desc ? -1 : 1) : 0;
      });
    }
    return filtered;
  }, [
    filteredRequestsByHeader,
    searchTerm,
    statusFilter,
    typeFilter,
    departmentFilter,
    sorting,
  ]);

  const exportToExcel = (exportType = "current") => {
    try {
      const data = (
        exportType === "current" ? filteredRequests : filteredRequestsByHeader
      ).map((r) => ({
        "Request No": r.request_no,
        Date: formatDate(r.created_at),
        Requester: r.requester_name,
        Badge: r.requester_badge,
        Department: r.department,
        "Budget Type": r.budget_type,
        "Request Type": r.request_type,
        "Item Name": r.item_name,
        Quantity: r.quantity,
        "Estimated Total": r.estimated_total,
        Budget: getBudgetName(r.budget_id),
        Status: r.status,
        Notes: r.notes || "",
      }));
      if (!data.length)
        return Swal.fire({
          title: "No Data",
          icon: "info",
          confirmButtonColor: "#1e40af",
        });
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [15, 12, 15, 10, 15, 10, 8, 25, 8, 18, 25, 15, 25].map(
        (wch) => ({ wch }),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Budget Requests");
      XLSX.writeFile(
        wb,
        `budget_requests_${exportType}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.xlsx`,
      );
      setShowExportDropdown(false);
    } catch {
      Swal.fire({
        title: "Error",
        text: "Failed to export data",
        icon: "error",
        confirmButtonColor: "#1e40af",
      });
    }
  };

  // ── Chart data ──────────────────────────────────────────────────────────────
  const approvalRate =
    filteredStats.total > 0
      ? (filteredStats.approved / filteredStats.total) * 100
      : 0;
  const submittedPct =
    filteredStats.total > 0
      ? (filteredStats.submitted / filteredStats.total) * 100
      : 0;
  const draftPct =
    filteredStats.total > 0
      ? (filteredStats.draft / filteredStats.total) * 100
      : 0;
  const capexPct =
    filteredStats.total > 0
      ? (filteredStats.CAPEX / filteredStats.total) * 100
      : 0;
  const rejectedPct =
    filteredStats.total > 0
      ? (filteredStats.rejected / filteredStats.total) * 100
      : 0;
  const waitingPct =
    filteredStats.total > 0
      ? (filteredStats.waiting / filteredStats.total) * 100
      : 0;

  // Dept bar chart
  const deptChartData = useMemo(() => {
    const map = new Map();

    filteredRequestsByHeader.forEach((r) => {
      const d = r.department;
      const amount = Number(r.estimated_total_idr || 0);

      if (d) {
        map.set(d, (map.get(d) || 0) + amount);
      }
    });

    if (map.size === 0) {
      return [];
    }

    const chartData = Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value / 1e6),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);

    return chartData;
  }, [filteredRequestsByHeader]);

  const pieData = [
    { name: "CAPEX", value: filteredStats.CAPEX },
    { name: "SERVICE", value: filteredStats.SERVICE },
  ];
  const PIE_COLORS = ["#1e3a5f", "#2563eb"];

  if (loading) {
    return (
      <LayoutDashboard activeMenu={2}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={2}>
      <style>{`
        .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04); }
        .section-title { font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
        .period-badge { background: #1e3a5f; color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .period-badge:hover { background: #2c4a7a; }
        .donut-card { display: flex; flex-direction: column; align-items: center; padding: 20px 12px; }
        .donut-card h4 { font-size: 12px; font-weight: 600; color: #374151; text-align: center; margin-bottom: 12px; }
        .bullet-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <div className="space-y-5">
        {/* ── Header with clickable badge for type and year ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                Budget Request List
              </h1>

              {/* Type Filter Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="period-badge flex items-center gap-2"
                >
                  {headerTypeFilter === "all" ? "CAPEX/OPEX" : headerTypeFilter}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showTypeDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowTypeDropdown(false)}
                    />
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-1">
                      <button
                        onClick={() => {
                          setHeaderTypeFilter("all");
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg ${
                          headerTypeFilter === "all"
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        ALL (CAPEX & OPEX)
                      </button>
                      <button
                        onClick={() => {
                          setHeaderTypeFilter("CAPEX");
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg ${
                          headerTypeFilter === "CAPEX"
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        CAPEX
                      </button>
                      <button
                        onClick={() => {
                          setHeaderTypeFilter("OPEX");
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg ${
                          headerTypeFilter === "OPEX"
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        OPEX
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Year Filter Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="period-badge flex items-center gap-2"
                >
                  {yearFilter === "all" ? "All Years" : yearFilter}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showYearDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowYearDropdown(false)}
                    />
                    <div className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-1 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          setYearFilter("all");
                          setShowYearDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg ${
                          yearFilter === "all"
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        All Years
                      </button>
                      {availableYears.map((year) => (
                        <button
                          key={year}
                          onClick={() => {
                            setYearFilter(year);
                            setShowYearDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg ${
                            yearFilter === year
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {headerTypeFilter === "all"
                ? "Showing all CAPEX and OPEX requests"
                : `Showing ${headerTypeFilter} requests only`}
              {yearFilter !== "all" && ` for year ${yearFilter}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/manage_request/request_budget_form"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Request
            </Link>
          </div>
        </div>

        {/* ── Row 1: 4 Donut KPIs ── */}
        {/* ── Row 1: 4 Donut KPIs with currency filter ── */}
        <div className="card p-5">
          <div className="flex justify-end mb-2">
            <div className="relative">
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                {displayCurrency === "IDR" ? "Rp IDR" : "$ USD"}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showCurrencyDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCurrencyDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-1">
                    <button
                      onClick={() => {
                        setDisplayCurrency("IDR");
                        setShowCurrencyDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      Rp IDR
                    </button>
                    <button
                      onClick={() => {
                        setDisplayCurrency("USD");
                        setShowCurrencyDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      $ USD
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-gray-100">
            {/* Total Request Amount Card (menggantikan Approval Rate) */}
            <div className="donut-card">
              <h4>Total Amount Requested</h4>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {formatRequestAmount(filteredStats.totalAmount)}
              </div>
              <p className="text-xs text-gray-500">
                from {filteredStats.total} requests
              </p>
            </div>

            {/* CAPEX Ratio Card */}
            <div className="donut-card">
              <h4>CAPEX Ratio</h4>
              <InlineDonut
                pct={capexPct}
                color="#1e3a5f"
                size={110}
                stroke={13}
              />
              <p className="text-xs text-gray-500 mt-3 text-center">
                {filteredStats.CAPEX} CAPEX • {filteredStats.SERVICE} Service
              </p>
            </div>

            {/* Pending Rate Card */}
            <div className="donut-card">
              <h4>Pending Rate</h4>
              <InlineDonut
                pct={submittedPct + draftPct}
                color="#f59e0b"
                size={110}
                stroke={13}
              />
              <p className="text-xs text-gray-500 mt-3 text-center">
                {filteredStats.draft} Draft • {filteredStats.submitted}{" "}
                Submitted
              </p>
            </div>

            {/* Rejected Rate Card */}
            <div className="donut-card">
              <h4>Rejected Rate</h4>
              <InlineDonut
                pct={rejectedPct}
                color="#ef4444"
                size={110}
                stroke={13}
              />
              <p className="text-xs text-gray-500 mt-3 text-center">
                {filteredStats.rejected} rejected of {filteredStats.total}
              </p>
            </div>
          </div>
        </div>
        {/* ── Row 2: Charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Bar chart by dept */}
          <div className="card p-5 md:col-span-3">
            <p className="section-title flex items-center gap-2">
              <span className="bullet-dot bg-blue-800" />
              Request Amount by Department (IDR Jt)
            </p>
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={deptChartData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v && v.length > 8 ? v.slice(0, 8) + "…" : v || ""
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(v) => [`${v} Juta IDR`, "Total"]}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#fff",
                      color: "#111827",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#1e3a5f"
                    radius={[4, 4, 0, 0]}
                    barSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-gray-400 text-sm">
                No data available for chart
              </div>
            )}
          </div>

          {/* Distribution panel */}
          <div className="card p-5 md:col-span-2 space-y-4">
            <p className="section-title">Request Distribution</p>

            {/* Type pie */}
            <div className="flex items-center gap-4">
              <PieChart width={80} height={80}>
                <Pie
                  data={pieData}
                  cx={35}
                  cy={35}
                  innerRadius={22}
                  outerRadius={36}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
              <div className="text-xs text-gray-500 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#1e3a5f] inline-block" />{" "}
                  CAPEX: {filteredStats.CAPEX}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />{" "}
                  Service: {filteredStats.SERVICE}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />{" "}
                  Approved: {filteredStats.approved}
                </div>
              </div>
            </div>

            {/* Status bars */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">
                  By Status
                </p>
                <StackedBar
                  segments={[
                    {
                      pct: Math.max(Math.round(draftPct), 1),
                      color: "#9ca3af",
                    },
                    {
                      pct: Math.max(Math.round(submittedPct), 1),
                      color: "#2563eb",
                    },
                    {
                      pct: Math.max(Math.round(approvalRate), 1),
                      color: "#10b981",
                    },
                    {
                      pct: Math.max(Math.round(rejectedPct), 0),
                      color: "#ef4444",
                    },
                  ]}
                />
                <div className="grid grid-cols-2 mt-1.5 gap-1 text-xs text-gray-500">
                  <span>● Draft ({filteredStats.draft})</span>
                  <span>● Submitted ({filteredStats.submitted})</span>
                  <span>● Approved ({filteredStats.approved})</span>
                  <span>● Rejected ({filteredStats.rejected})</span>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-emerald-700">
                    {filteredStats.approved}
                  </div>
                  <div className="text-xs text-emerald-500">Approved</div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-red-600">
                    {filteredStats.rejected}
                  </div>
                  <div className="text-xs text-red-400">Rejected</div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-blue-700">
                    {filteredStats.submitted}
                  </div>
                  <div className="text-xs text-blue-500">Submitted</div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-purple-700">
                    {filteredStats.waiting}
                  </div>
                  <div className="text-xs text-purple-400">Waiting</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Request List ── */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  <ListIcon className="w-4 h-4 text-blue-600" />
                  List Budget Requests
                  <span className="ml-2 px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                    {filteredRequestsByHeader.length}
                  </span>
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Export */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Export Excel
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {showExportDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowExportDropdown(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-1">
                          <button
                            onClick={() => exportToExcel("current")}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            Current View ({filteredRequests.length})
                          </button>
                          <button
                            onClick={() => exportToExcel("all")}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                            All Requests ({filteredRequestsByHeader.length})
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Select */}
                  <button
                    onClick={toggleSelectMode}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${selectMode ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {selectMode ? "Cancel Select" : "Select Multiple"}
                  </button>

                  {/* Bulk actions */}
                  {selectMode && (
                    <>
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-xs font-medium"
                      >
                        {selectAll ? "Unselect All" : "Select All"}
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete ({selectedRequests.length})
                      </button>
                    </>
                  )}

                  {/* View toggle */}
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 transition-colors ${viewMode === "list" ? "bg-gray-100 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      <ListIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 border-l border-gray-200 transition-colors ${viewMode === "grid" ? "bg-gray-100 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search + Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search request no, requester, item, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>

                {/* Status filter chips */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { val: "all", label: "All" },
                    { val: "DRAFT", label: "Draft" },
                    { val: "SUBMITTED", label: "Submitted" },
                    { val: "BUDGET_APPROVED", label: "Approved" },
                    { val: "BUDGET_REJECTED", label: "Rejected" },
                    { val: "WAITING_SR_MR", label: "Waiting" },
                  ].map((s) => (
                    <button
                      key={s.val}
                      onClick={() => setStatusFilter(s.val)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        statusFilter === s.val
                          ? s.val === "BUDGET_APPROVED"
                            ? "bg-emerald-600 text-white"
                            : s.val === "BUDGET_REJECTED"
                              ? "bg-red-600 text-white"
                              : s.val === "SUBMITTED"
                                ? "bg-blue-600 text-white"
                                : s.val === "WAITING_SR_MR"
                                  ? "bg-purple-600 text-white"
                                  : s.val === "DRAFT"
                                    ? "bg-gray-500 text-white"
                                    : "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Request Type filter */}
                <div className="flex gap-1.5">
                  {["all", "ITEM", "SERVICE"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        typeFilter === type
                          ? type === "ITEM"
                            ? "bg-[#1e3a5f] text-white"
                            : type === "SERVICE"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {type === "all" ? "All Types" : type}
                    </button>
                  ))}
                </div>

                {/* Dept filter */}
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {(departments.length > 0
                    ? departments.map((d) => ({ id: d.id, name: d.name }))
                    : uniqueDepartments.map((n, i) => ({ id: i, name: n }))
                  ).map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {requests.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-gray-700 font-medium mb-1">
                  No requests available
                </h3>
                <p className="text-gray-400 text-sm">
                  Requests will appear here when created
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-16 text-center">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-gray-700 font-medium mb-1">
                  No matching requests
                </h3>
                <p className="text-gray-400 text-sm mb-5">
                  Try adjusting your filters
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setDepartmentFilter("all");
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs inline-flex items-center gap-2 hover:bg-gray-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Clear Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredRequests.map((request) => {
                  const s = getStatusConfig(request.status);
                  const Icon = s.icon;
                  return (
                    <div
                      key={request.id}
                      className="border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all bg-white relative"
                    >
                      {selectMode && (
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(request.id)}
                          onChange={() => handleSelectRequest(request.id)}
                          className="absolute top-3 left-3 w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                      )}
                      <div
                        className={`flex items-center gap-2 mb-3 ${selectMode ? "ml-6" : ""}`}
                      >
                        <div className="p-2 rounded-lg bg-blue-50">
                          {request.budget_type === "CAPEX" ? (
                            <Calendar className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Server className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate text-sm">
                            {request.request_no}
                          </div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                            {request.requester_badge}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Requester</span>
                          <span className="font-medium text-gray-700">
                            {request.requester_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Department</span>
                          <span className="font-medium text-gray-700">
                            {request.department}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Budget Type</span>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              request.budget_type === "CAPEX"
                                ? "bg-[#1e3a5f] text-white"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {request.budget_type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Item</span>
                          <span
                            className="font-medium text-gray-700 truncate max-w-[120px]"
                            title={request.item_name}
                          >
                            {request.item_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Qty</span>
                          <span className="font-medium text-gray-700">
                            {request.quantity}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total</span>
                          <span className="font-bold text-blue-600">
                            {formatBudgetCurrency(
                              request.estimated_total,
                              request.currency || "IDR",
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Budget</span>
                          <span
                            className="font-medium text-gray-700 truncate max-w-[120px]"
                            title={getBudgetName(request.budget_id)}
                          >
                            {getBudgetName(request.budget_id)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
                        >
                          <Icon className="w-3 h-3" />
                          {s.label}
                        </span>
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRevision(request)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(request)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {selectMode && (
                        <th className="px-4 py-3 text-center w-10">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Request No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Requester
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Badge
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Budget Type
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Req Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => {
                      const s = getStatusConfig(request.status);
                      const Icon = s.icon;
                      return (
                        <tr
                          key={request.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          {selectMode && (
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedRequests.includes(request.id)}
                                onChange={() => handleSelectRequest(request.id)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                              />
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                {request.budget_type === "CAPEX" ? (
                                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                ) : (
                                  <Server className="w-3.5 h-3.5 text-blue-600" />
                                )}
                              </div>
                              <span className="font-medium text-gray-900">
                                {request.request_no}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {request.requester_name}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {request.requester_badge}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {request.department}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">
                            {request.item_name}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {request.quantity}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                request.budget_type === "CAPEX"
                                  ? "bg-[#1e3a5f] text-white"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {request.budget_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                request.request_type === "ITEM"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {request.request_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">
                            {formatBudgetCurrency(
                              request.estimated_total,
                              request.currency || "IDR",
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">
                            {getBudgetName(request.budget_id)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${s.bg} ${s.text}`}
                            >
                              <Icon className="w-3 h-3" />
                              {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewDetails(request)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRevision(request)}
                                className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(request)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer - Only show when there are filtered results */}
            {filteredRequests.length > 0 && (
              <div className="mt-4 px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Showing {filteredRequests.length} of{" "}
                  {filteredRequestsByHeader.length} requests
                </span>
                {selectMode && (
                  <span className="text-xs font-medium text-gray-500">
                    {selectedRequests.length} selected
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutDashboard>
  );
}
