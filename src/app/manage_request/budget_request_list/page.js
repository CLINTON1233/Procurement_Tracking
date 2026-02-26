"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
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
  Building,
  User,
  Package,
  DollarSign,
  Wallet,
  ArrowUp,
  ArrowDown,
  List as ListIcon,
  BarChart3,
  RotateCcw,
  Server,
} from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";
import { showRequestDetailsModal } from "@/components/modals/BudgetRequestModals";
import { showRevisionModal } from "@/components/modals/BudgetRevisionModals";
import {
  CURRENCIES,
  getCurrencySymbol,
  formatCurrency,
  formatIDR,
} from "@/utils/currency";
import { formatTableCurrency } from "@/utils/currencyFormatter";
import Link from "next/link";

export default function BudgetRequestListPage() {
  const [requests, setRequests] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const router = useRouter();

  // ============ STATE UNTUK SELECT MULTIPLE ============
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    waiting: 0,
    totalAmount: 0,
    itemRequests: 0,
    serviceRequests: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch requests
      const requestsData = await budgetService.getAllRequests();
      setRequests(requestsData);

      // Fetch budgets untuk referensi
      const budgetsData = await budgetService.getAllBudgets();
      setBudgets(budgetsData);

      // Fetch departments
      const deptsData = await departmentService.getAllDepartments();
      setDepartments(deptsData);

      calculateStats(requestsData);
    } catch (error) {
      console.error("Error:", error);
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
    const total = data.length;
    const draft = data.filter((r) => r.status === "DRAFT").length;
    const submitted = data.filter((r) => r.status === "SUBMITTED").length;
    const approved = data.filter((r) => r.status === "BUDGET_APPROVED").length;
    const rejected = data.filter((r) => r.status === "BUDGET_REJECTED").length;
    const waiting = data.filter((r) => r.status === "WAITING_SR_MR").length;
    const itemRequests = data.filter((r) => r.request_type === "ITEM").length;
    const serviceRequests = data.filter((r) => r.request_type === "SERVICE").length;
    const totalAmount = data.reduce(
      (sum, r) => sum + Number(r.estimated_total_idr || 0),
      0,
    );

    setStats({
      total,
      draft,
      submitted,
      approved,
      rejected,
      waiting,
      itemRequests,
      serviceRequests,
      totalAmount,
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleViewDetails = (request) => {
    showRequestDetailsModal(request);
  };

  const handleRevision = (request) => {
    router.push(`/manage_revision/revision/${request.id}`);
  };

  const handleDeleteRequest = async (request) => {
    const result = await Swal.fire({
      title: `Delete Request?`,
      text: `Are you sure you want to delete this request? This action cannot be undone!`,
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
          text: "Please wait",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await budgetService.deleteRequest(request.id);

        Swal.fire({
          title: "Deleted!",
          text: "Request deleted successfully",
          icon: "success",
          timer: 1500,
          confirmButtonColor: "#1e40af",
        });

        fetchData();
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: error.message || "Failed to delete request",
          icon: "error",
          confirmButtonColor: "#1e40af",
        });
      }
    }
  };

  // ============ FUNGSI UNTUK SELECT MULTIPLE ============
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedRequests([]);
    setSelectAll(false);
  };

  const handleSelectRequest = (requestId) => {
    setSelectedRequests((prev) => {
      if (prev.includes(requestId)) {
        return prev.filter((id) => id !== requestId);
      } else {
        return [...prev, requestId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map((r) => r.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async () => {
    if (selectedRequests.length === 0) {
      Swal.fire({
        title: "No Selection",
        text: "Please select at least one request to delete",
        icon: "warning",
        confirmButtonColor: "#1e40af",
      });
      return;
    }

    const result = await Swal.fire({
      title: `Delete ${selectedRequests.length} Requests?`,
      text: `Are you sure you want to delete ${selectedRequests.length} selected requests? This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete All!",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        actions: "flex gap-3 justify-center",
        confirmButton:
          "px-6 py-2 rounded-lg bg-red-600 text-white font-medium min-w-[140px] hover:bg-red-700 transition",
        cancelButton:
          "px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium min-w-[140px] hover:bg-gray-300 transition",
      },
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Deleting...",
          text: "Please wait",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        let successCount = 0;
        let errorCount = 0;

        for (const requestId of selectedRequests) {
          try {
            await budgetService.deleteRequest(requestId);
            successCount++;
          } catch (error) {
            errorCount++;
          }
        }

        Swal.fire({
          title: "Deleted!",
          text: `${successCount} Requests deleted successfully`,
          icon: "success",
          confirmButtonColor: "#1e40af",
        });

        fetchData();
        setSelectMode(false);
        setSelectedRequests([]);
        setSelectAll(false);
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to delete requests",
          icon: "error",
          confirmButtonColor: "#1e40af",
        });
      }
    }
  };

  // Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);
  };

  // Format Date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "DRAFT":
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          icon: <FileText className="w-3 h-3 mr-1" />,
          label: "Draft",
        };
      case "SUBMITTED":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          icon: <Send className="w-3 h-3 mr-1" />,
          label: "Submitted",
        };
      case "BUDGET_APPROVED":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          icon: <CheckCircle className="w-3 h-3 mr-1" />,
          label: "Approved",
        };
      case "BUDGET_REJECTED":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          icon: <XCircle className="w-3 h-3 mr-1" />,
          label: "Rejected",
        };
      case "WAITING_SR_MR":
        return {
          bg: "bg-purple-100",
          text: "text-purple-700",
          icon: <Clock className="w-3 h-3 mr-1" />,
          label: "Waiting SR/MR",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          icon: <AlertCircle className="w-3 h-3 mr-1" />,
          label: status,
        };
    }
  };

  // Get budget name by id
  const getBudgetName = (budgetId) => {
    if (!budgetId) return "-";
    const budget = budgets.find((b) => b.id === budgetId);
    return budget ? budget.budget_name : `ID: ${budgetId}`;
  };

  // Format currency for table
  const formatBudgetCurrency = (amount, currencyCode) => {
    return formatTableCurrency(amount, currencyCode);
  };

  // Get icon by request type
  const getRequestIcon = (type) => {
    if (type === "ITEM") {
      return <Package className="w-4 h-4 text-blue-600" />;
    } else {
      return <Server className="w-4 h-4 text-blue-600" />;
    }
  };

  // Filter & Search
  const filteredRequests = useMemo(() => {
    let filtered = requests.filter((request) => {
      const matchesSearch =
        searchTerm === "" ||
        (request.request_no || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (request.requester_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (request.item_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (request.department || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;
      const matchesType =
        typeFilter === "all" || request.request_type === typeFilter;
      const matchesDepartment =
        departmentFilter === "all" || request.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesType && matchesDepartment;
    });

    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      filtered.sort((a, b) => {
        let aValue = a[id];
        let bValue = b[id];

        if (id === "estimated_total") {
          aValue = Number(aValue || 0);
          bValue = Number(bValue || 0);
        }

        if (id === "created_at") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return desc ? 1 : -1;
        if (aValue > bValue) return desc ? -1 : 1;
        return 0;
      });
    }

    return filtered;
  }, [
    requests,
    searchTerm,
    statusFilter,
    typeFilter,
    departmentFilter,
    sorting,
  ]);

  // Unique departments for filter
  const uniqueDepartments = useMemo(() => {
    const depts = [...new Set(requests.map((r) => r.department))];
    return depts.filter(Boolean);
  }, [requests]);

  // Export to Excel
  const exportToExcel = (exportType = "current") => {
    try {
      let dataToExport = [];

      if (exportType === "current") {
        dataToExport = filteredRequests.map((req) => ({
          "Request No": req.request_no,
          Date: formatDate(req.created_at),
          Requester: req.requester_name,
          Badge: req.requester_badge,
          Department: req.department,
          Type: req.request_type,
          "Item Name": req.item_name,
          Quantity: req.quantity,
          "Estimated Total": req.estimated_total,
          Budget: getBudgetName(req.budget_id),
          Status: req.status,
          Notes: req.notes || "",
        }));
      } else {
        dataToExport = requests.map((req) => ({
          "Request No": req.request_no,
          Date: formatDate(req.created_at),
          Requester: req.requester_name,
          Badge: req.requester_badge,
          Department: req.department,
          Type: req.request_type,
          "Item Name": req.item_name,
          Quantity: req.quantity,
          "Estimated Total": req.estimated_total,
          Budget: getBudgetName(req.budget_id),
          Status: req.status,
          Notes: req.notes || "",
        }));
      }

      if (dataToExport.length === 0) {
        Swal.fire({
          title: "No Data",
          text: "No data available to export",
          icon: "info",
          confirmButtonColor: "#1e40af",
        });
        return;
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wscols = [
        { wch: 15 }, // Request No
        { wch: 12 }, // Date
        { wch: 15 }, // Requester
        { wch: 10 }, // Badge
        { wch: 15 }, // Department
        { wch: 8 }, // Type
        { wch: 25 }, // Item Name
        { wch: 8 }, // Quantity
        { wch: 18 }, // Estimated Total
        { wch: 25 }, // Budget
        { wch: 15 }, // Status
        { wch: 25 }, // Notes
      ];
      ws["!cols"] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Budget Requests");

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");
      const filename = `budget_requests_${exportType}_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);
      setShowExportDropdown(false);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to export data",
        icon: "error",
        confirmButtonColor: "#1e40af",
      });
    }
  };

  if (loading) {
    return (
      <LayoutDashboard activeMenu={2}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={2}>
      <div className="space-y-6 p-3 md:p-6 bg-gray-50 min-h-screen">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                Budget Request List
              </h1>
              <Link
                href="/manage_request/request_budget_form"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Request</span>
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              View and manage all budget requests, track their status and approvals
            </p>
          </div>
        </div>

        {/* STATS CARDS - Sama persis dengan Budget Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b px-4 md:px-6 py-3 md:py-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm md:text-base">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              Request Overview
            </h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              Summary of all budget requests
            </p>
          </div>

          <div className="p-4 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {/* Total Requests */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px]">
              <div className="flex justify-between items-center min-h-[48px]">
                <FileText className="w-6 h-6 opacity-90" />
                <span className="text-xl md:text-3xl font-bold">{stats.total}</span>
              </div>
              <div>
                <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                  Total Requests
                </p>
                <div className="text-[10px] md:text-xs opacity-80 mt-1">
                  {stats.itemRequests} ITEM • {stats.serviceRequests} SERVICE
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px]">
              <div className="flex justify-between items-center min-h-[48px]">
                <DollarSign className="w-6 h-6 opacity-90" />
                <span className="text-xl md:text-3xl font-bold">
                  {formatBudgetCurrency(stats.totalAmount, "IDR")}
                </span>
              </div>
              <div>
                <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                  Total Amount
                </p>
                <div className="text-[10px] md:text-xs opacity-80 mt-1">
                  Overall requests
                </div>
              </div>
            </div>

            {/* Draft + Submitted */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px]">
              <div className="flex justify-between items-center min-h-[48px]">
                <FileText className="w-6 h-6 opacity-90" />
                <div className="text-right leading-tight">
                  <span className="text-xl md:text-2xl font-bold text-yellow-300 block">
                    {stats.draft}
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-blue-300 block">
                    {stats.submitted}
                  </span>
                </div>
              </div>
              <div>
                <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                  Draft / Submitted
                </p>
                <div className="text-[10px] md:text-xs opacity-80 mt-1">
                  Pending requests
                </div>
              </div>
            </div>

            {/* Approved / Rejected */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px]">
              <div className="flex justify-between items-center min-h-[48px]">
                <CheckCircle className="w-6 h-6 opacity-90" />
                <div className="text-right leading-tight">
                  <span className="text-xl md:text-2xl font-bold text-green-300 block">
                    {stats.approved}
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-red-300 block">
                    {stats.rejected}
                  </span>
                </div>
              </div>
              <div>
                <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                  Approved / Rejected
                </p>
                <div className="text-[10px] md:text-xs opacity-80 mt-1">
                  Final status
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REQUEST LIST SECTION - Sama persis dengan Budget Management */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ListIcon className="w-5 h-5 text-blue-600" />
                  List Budget Requests
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {requests.length} Requests available • {uniqueDepartments.length} Departments
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search request no, requester, item, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Mobile Filter Toggle */}
              <div className="flex items-center justify-between md:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""
                      }`}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${viewMode === "grid"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600"
                      }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${viewMode === "list"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600"
                      }`}
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Filter Menu */}
              {showFilters && (
                <div className="md:hidden space-y-3 p-3 border rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setShowFilters(false);
                      }}
                      className="w-full border rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="DRAFT">Draft</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="BUDGET_APPROVED">Approved</option>
                      <option value="BUDGET_REJECTED">Rejected</option>
                      <option value="WAITING_SR_MR">Waiting SR/MR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Request Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setShowFilters(false);
                      }}
                      className="w-full border rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="ITEM">Item</option>
                      <option value="SERVICE">Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => {
                        setDepartmentFilter(e.target.value);
                        setShowFilters(false);
                      }}
                      className="w-full border rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white"
                    >
                      <option value="all">All Departments</option>
                      {departments.length > 0
                        ? departments.map((dept) => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name}
                          </option>
                        ))
                        : uniqueDepartments.map((dept, index) => (
                          <option key={index} value={dept}>
                            {dept}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Desktop Action Buttons - Sama persis dengan Budget Management */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Export Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showExportDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowExportDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                        <div className="p-2">
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                            Export Options
                          </div>
                          <button
                            onClick={() => exportToExcel("current")}
                            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <div className="text-left">
                              <div className="font-medium">
                                Export Current View
                              </div>
                              <div className="text-xs text-gray-500">
                                {filteredRequests.length} requests
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => exportToExcel("all")}
                            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                            <div className="text-left">
                              <div className="font-medium">
                                Export All Requests
                              </div>
                              <div className="text-xs text-gray-500">
                                {requests.length} total requests
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* TOMBOL SELECT */}
                <button
                  onClick={toggleSelectMode}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${selectMode
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-gray-600 text-white hover:bg-gray-600"
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    {selectMode && <line x1="3" y1="9" x2="21" y2="9"></line>}
                    {selectMode && <line x1="3" y1="15" x2="21" y2="15"></line>}
                    {selectMode && <line x1="9" y1="21" x2="9" y2="3"></line>}
                    {selectMode && <line x1="15" y1="21" x2="15" y2="3"></line>}
                  </svg>
                  <span className="hidden sm:inline">
                    {selectMode ? "Cancel Select" : "Select Multiple"}
                  </span>
                  <span className="sm:hidden">{selectMode ? "Cancel" : "Select"}</span>
                </button>

                {/* TOMBOL GRID/LIST UNTUK DESKTOP */}
                <div className="hidden md:flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 ${viewMode === "list"
                      ? "bg-gray-100 text-blue-600"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                      } transition-colors`}
                    title="List View"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2.5 ${viewMode === "grid"
                      ? "bg-gray-100 text-blue-600"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                      } transition-colors border-l border-gray-300`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>

                {/* TOMBOL ACTION BULK */}
                {selectMode && (
                  <>
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-gray-700 transition-all"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        {!selectAll && (
                          <line x1="3" y1="9" x2="21" y2="9"></line>
                        )}
                        {!selectAll && (
                          <line x1="3" y1="15" x2="21" y2="15"></line>
                        )}
                        {!selectAll && (
                          <line x1="9" y1="21" x2="9" y2="3"></line>
                        )}
                        {!selectAll && (
                          <line x1="15" y1="21" x2="15" y2="3"></line>
                        )}
                        {selectAll && (
                          <polyline points="20 6 9 17 4 12"></polyline>
                        )}
                      </svg>
                      <span className="hidden sm:inline">{selectAll ? "Unselect All" : "Select All"}</span>
                      <span className="sm:hidden">{selectAll ? "Unselect" : "All"}</span>
                    </button>

                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-red-700 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete Selected ({selectedRequests.length})</span>
                      <span className="sm:hidden">Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CONTENT - GRID/LIST VIEW dengan desain Budget Management */}
          <div className="p-3 md:p-6">
            {requests.length === 0 ? (
              <div className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-gray-700 font-medium text-base mb-1">
                    No requests available
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Start by creating a new budget request
                  </p>
                  <Link
                    href="/request_budget_form"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Request
                  </Link>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-gray-700 font-medium text-base mb-1">
                    No matching requests found
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Try adjusting your search criteria
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setTypeFilter("all");
                      setDepartmentFilter("all");
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2 text-xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID VIEW - Desain seperti Budget Management */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filteredRequests.map((request) => {
                  const status = getStatusBadge(request.status);
                  return (
                    <div
                      key={request.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 hover:shadow-sm transition-shadow"
                    >
                      {/* HEADER dengan checkbox jika select mode */}
                      <div className="flex justify-between items-start mb-3">
                        {selectMode && (
                          <div className="mr-2">
                            <input
                              type="checkbox"
                              checked={selectedRequests.includes(request.id)}
                              onChange={() => handleSelectRequest(request.id)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-1">
                          <div className="p-1.5 md:p-2 rounded-lg bg-blue-100">
                            {getRequestIcon(request.request_type)}
                          </div>
                          <div className="max-w-[140px] md:max-w-[160px] flex-1">
                            <h4 className="font-medium text-gray-900 truncate text-sm">
                              {request.request_no}
                            </h4>
                            <span
                              className={`inline-flex items-center mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${status.bg} ${status.text}`}
                            >
                              {status.icon}
                              {status.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="space-y-2">
                        {/* Requester */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Requester</span>
                          <span className="text-xs font-medium text-gray-900">
                            {request.requester_name}
                          </span>
                        </div>

                        {/* Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Badge</span>
                          <span className="text-xs font-medium text-gray-900">
                            {request.requester_badge}
                          </span>
                        </div>

                        {/* Department */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Department</span>
                          <span className="text-xs font-medium text-gray-900">
                            {request.department}
                          </span>
                        </div>

                        {/* Item Name */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Item</span>
                          <span className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
                            {request.item_name}
                          </span>
                        </div>

                        {/* Quantity & Type */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Qty/Type</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-gray-900">
                              {request.quantity}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${request.request_type === "ITEM"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                                }`}
                            >
                              {request.request_type}
                            </span>
                          </div>
                        </div>

                        {/* Budget */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Budget</span>
                          <span className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
                            {getBudgetName(request.budget_id)}
                          </span>
                        </div>

                        {/* Estimated Total */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Total</span>
                          <span className="text-xs font-bold text-blue-600">
                            {formatBudgetCurrency(request.estimated_total, request.currency || "IDR")}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-gray-500">Date</span>
                          <span className="text-xs font-medium text-gray-900">
                            {formatDate(request.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex justify-end items-center gap-1 mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRevision(request)}
                          className="p-1 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Revision"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request)}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW - Tabel dengan desain Budget Management */
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectMode && (
                        <th className="px-2 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "request_no", desc: false }])}>
                        <div className="flex items-center">
                          Request No
                          {sorting[0]?.id === "request_no" &&
                            (sorting[0]?.desc ? (
                              <ArrowDown className="w-3 h-3 ml-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Requester
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Badge
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "estimated_total", desc: false }])}
                      >
                        <div className="flex items-center justify-end">
                          Total
                          {sorting[0]?.id === "estimated_total" &&
                            (sorting[0]?.desc ? (
                              <ArrowDown className="w-3 h-3 ml-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "created_at", desc: true }])}
                      >
                        <div className="flex items-center justify-center">
                          Date
                          {sorting[0]?.id === "created_at" &&
                            (sorting[0]?.desc ? (
                              <ArrowDown className="w-3 h-3 ml-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => {
                      const status = getStatusBadge(request.status);
                      return (
                        <tr key={request.id} className="hover:bg-gray-50">
                          {selectMode && (
                            <td className="px-2 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedRequests.includes(request.id)}
                                onChange={() => handleSelectRequest(request.id)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {request.request_no}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {request.requester_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                            {request.requester_badge}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                            {request.department}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 max-w-[150px] truncate">
                            {request.item_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                            {request.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${request.request_type === "ITEM"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                                }`}
                            >
                              {request.request_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600 text-right">
                            {formatBudgetCurrency(request.estimated_total, request.currency || "IDR")}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 max-w-[120px] truncate">
                            {getBudgetName(request.budget_id)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}
                            >
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewDetails(request)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRevision(request)}
                                className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Revision"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(request)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
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
          </div>

          {/* Footer Stats */}
          {filteredRequests.length > 0 && (
            <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-xs md:text-sm text-gray-500 text-center sm:text-left">
                  Showing {filteredRequests.length} of {requests.length} Requests
                </div>
                {selectMode && (
                  <div className="text-xs font-medium text-gray-500">
                    {selectedRequests.length} Requests Selected
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .swal2-popup {
          font-family:
            system-ui,
            -apple-system,
            sans-serif;
          background: white;
        }
        .swal2-title {
          color: #111827;
          font-size: 1.1rem;
          font-weight: 600;
          background: white;
        }
        .swal2-input,
        .swal2-select {
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          box-shadow: none;
          font-size: 0.875rem;
          background: white;
          color: #374151;
          padding: 0.625rem 0.75rem;
        }
        .swal2-input:focus,
        .swal2-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
        .swal2-validation-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 0.75rem;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        @media (max-width: 640px) {
          .swal2-popup {
            max-width: 95vw !important;
          }
          .swal2-actions {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .swal2-confirm,
          .swal2-cancel {
            flex: 1 !important;
            min-width: 120px !important;
          }
        }
      `}</style>
    </LayoutDashboard>
  );
}