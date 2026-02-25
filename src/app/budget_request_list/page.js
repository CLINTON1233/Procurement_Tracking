"use client";

import { useState, useEffect, useMemo } from "react";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  Plus,
  Edit,
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
  Trash2,
  DollarSign,
  Wallet,
  ArrowUp,
  ArrowDown,
  List as ListIcon,
  BarChart3,
  RotateCcw,
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

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    waiting: 0,
    totalAmount: 0,
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
    const totalAmount = data.reduce(
      (sum, r) => sum + Number(r.estimated_total || 0),
      0,
    );

    setStats({
      total,
      draft,
      submitted,
      approved,
      rejected,
      waiting,
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
    showRevisionModal({
      request,
      budgets,
      onSave: async (revisionData) => {
        try {
          await budgetService.createRevision(revisionData);

          // Refresh data
          await fetchData();

          Swal.fire({
            title: "Success!",
            text: "Budget revision has been created",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: error.message || "Failed to create revision",
            icon: "error",
            confirmButtonColor: "#1e40af",
          });
        }
      },
    });
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
          icon: <FileText className="w-3.5 h-3.5 mr-1" />,
          label: "Draft",
        };
      case "SUBMITTED":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          icon: <Send className="w-3.5 h-3.5 mr-1" />,
          label: "Submitted",
        };
      case "BUDGET_APPROVED":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
          label: "Approved",
        };
      case "BUDGET_REJECTED":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
          label: "Rejected",
        };
      case "WAITING_SR_MR":
        return {
          bg: "bg-purple-100",
          text: "text-purple-700",
          icon: <Clock className="w-3.5 h-3.5 mr-1" />,
          label: "Waiting SR/MR",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
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

  // Unique departments for filter
  const uniqueDepartments = useMemo(() => {
    const depts = [...new Set(requests.map((r) => r.department))];
    return depts.filter(Boolean);
  }, [requests]);

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
                <Wallet className="w-6 h-6 text-blue-600" />
                Budget Request List
              </h1>
              <Link
                href="/request_budget_form"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Request</span>
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              View and manage all budget requests, track their status and
              approvals
            </p>
          </div>
        </div>

        {/* STATS CARDS */}
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

          <div className="p-4 md:p-6 grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
            {/* Total Requests - Abu-abu gelap */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <FileText className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">
                  {stats.total}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-90">Total Requests</p>
            </div>

            {/* Draft - Abu-abu gelap */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <FileText className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">
                  {stats.draft}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-90">Draft</p>
            </div>

            {/* Submitted - Abu-abu gelap */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <Send className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">
                  {stats.submitted}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-90">Submitted</p>
            </div>

            {/* Approved - Abu-abu gelap */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <CheckCircle className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">
                  {stats.approved}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-90">Approved</p>
            </div>

            {/* Rejected - Abu-abu gelap */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <XCircle className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">
                  {stats.rejected}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-90">Rejected</p>
            </div>

            {/* Waiting SR/MR - Abu-abu gelap */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <Clock className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">
                  {stats.waiting}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-90">Waiting SR/MR</p>
            </div>
          </div>

          {/* Total Amount Card - Tanpa background biru, hanya teks */}
          <div className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Total Request Amount:
                </span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {formatRupiah(stats.totalAmount)}
              </span>
            </div>
          </div>
        </div>
        {/* FILTER SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by request no, requester, item, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className={`w-4 h-4 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* TOMBOL GRID/LIST UNTUK MOBILE */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg ${
                    viewMode === "list"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${
                    viewMode === "grid"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  <Grid className="w-4 h-4" />
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
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Desktop Filters & Actions */}
            <div className="hidden md:flex items-center gap-3">
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

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm bg-white min-w-[130px]"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="BUDGET_APPROVED">Approved</option>
                <option value="BUDGET_REJECTED">Rejected</option>
                <option value="WAITING_SR_MR">Waiting SR/MR</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm bg-white min-w-[110px]"
              >
                <option value="all">All Types</option>
                <option value="ITEM">Item</option>
                <option value="SERVICE">Service</option>
              </select>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden mr-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 ${
                    viewMode === "list"
                      ? "bg-gray-100 text-blue-600"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  } transition-colors`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 ${
                    viewMode === "grid"
                      ? "bg-gray-100 text-blue-600"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  } transition-colors border-l border-gray-300`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD VIEW */}
        {/* CONTENT - GRID/LIST VIEW */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="max-w-md mx-auto">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-gray-700 font-medium text-base mb-1">
                  No requests found
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
          ) : viewMode === "grid" ? (
            /* GRID VIEW - Menggunakan card style yang sudah ada */
            filteredRequests.map((request) => {
              const status = getStatusBadge(request.status);
              return (
                <div
                  key={request.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header dengan background abu-abu muda */}
                  <div className="bg-gray-50 px-4 md:px-5 py-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-800">
                        Request #{request.request_no}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  {/* Content dengan padding yang konsisten */}
                  <div className="p-4 md:p-5">
                    {/* Grid 2 kolom untuk desktop, 1 kolom untuk mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Kolom Kiri */}
                      <div className="space-y-3">
                        {/* Requester */}
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Requester Name
                            </p>
                            <p className="text-sm font-medium text-gray-800 break-words">
                              {request.requester_name}
                            </p>
                          </div>
                        </div>

                        {/* Badge */}
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
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
                              className="text-blue-600"
                            >
                              <rect
                                x="2"
                                y="7"
                                width="20"
                                height="14"
                                rx="2"
                                ry="2"
                              ></rect>
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Badge
                            </p>
                            <p className="text-sm font-medium text-gray-800 break-words">
                              {request.requester_badge}
                            </p>
                          </div>
                        </div>

                        {/* Department */}
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                            <Building className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Department
                            </p>
                            <p className="text-sm font-medium text-gray-800 break-words">
                              {request.department}
                            </p>
                          </div>
                        </div>

                        {/* Request Date */}
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Request Date
                            </p>
                            <p className="text-sm font-medium text-gray-800 break-words">
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Kolom Kanan */}
                      <div className="space-y-3">
                        {/* Item Name */}
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Item/Service Name
                            </p>
                            <p className="text-sm font-medium text-gray-800 break-words">
                              {request.item_name}
                            </p>
                          </div>
                        </div>

                        {/* Quantity & Type */}
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
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
                              className="text-blue-600"
                            >
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Quantity / Type
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">
                                {request.quantity} x
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                                  request.request_type === "ITEM"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {request.request_type}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Budget */}
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Budget
                            </p>
                            <p className="text-sm font-medium text-gray-800 break-words">
                              {getBudgetName(request.budget_id)}
                            </p>
                          </div>
                        </div>

                        {/* Estimated Total */}
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Estimated Total
                            </p>
                            <p className="text-base font-bold text-blue-600">
                              {formatCurrency(
                                request.estimated_total,
                                request.currency || "IDR",
                              )}
                            </p>
                            {request.currency !== "IDR" && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                ≈ {formatIDR(request.estimated_total_idr)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specification (full width) */}
                    {request.specification && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Specification
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {request.specification}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes (full width) */}
                    {request.notes && (
                      <div className="mt-3">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Notes
                            </p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                              {request.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => handleRevision(request)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
                        title="Revision Budget"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Revision</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRequest(request)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* LIST VIEW */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Request No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Requester
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Badge
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {request.request_no}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {request.requester_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {request.requester_badge}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {request.department}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 max-w-[200px] truncate">
                            {request.item_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                            {request.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                                request.request_type === "ITEM"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {request.request_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600 text-right">
                            {formatCurrency(
                              request.estimated_total,
                              request.currency || "IDR",
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 max-w-[150px] truncate">
                            {getBudgetName(request.budget_id)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}
                            >
                              {status.icon}
                              {status.label}
                            </span>
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
                                title="Revision Budget"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(request)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Request"
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
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {filteredRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="text-xs md:text-sm text-gray-500 text-center sm:text-left">
                Showing {filteredRequests.length} of {requests.length} requests
              </div>
              <div className="text-xs font-medium text-blue-600">
                Total Amount: {formatRupiah(stats.totalAmount)}
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutDashboard>
  );
}
