"use client";

import { useState, useEffect, useMemo } from "react";
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
  ArrowUp,
  ArrowDown,
  List as ListIcon,
  BarChart3,
} from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";
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
  const [viewMode, setViewMode] = useState("list");
  const [showFilters, setShowFilters] = useState(false);
  const [sorting, setSorting] = useState([]);

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
    // Implement view details modal
    Swal.fire({
      title: "Request Details",
      html: `
        <div class="text-left">
          <p><strong>Request No:</strong> ${request.request_no}</p>
          <p><strong>Requester:</strong> ${request.requester_name} (${request.requester_badge})</p>
          <p><strong>Item:</strong> ${request.item_name}</p>
          <p><strong>Quantity:</strong> ${request.quantity}</p>
          <p><strong>Total:</strong> ${formatRupiah(request.estimated_total)}</p>
          <p><strong>Status:</strong> ${request.status}</p>
        </div>
      `,
      icon: "info",
      confirmButtonColor: "#1e40af",
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

  // Get status badge
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

  // Filter & Search
  const filteredRequests = useMemo(() => {
    let filtered = requests.filter((request) => {
      const matchesSearch =
        searchTerm === "" ||
        (request.request_no || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.requester_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.item_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.department || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesType = typeFilter === "all" || request.request_type === typeFilter;
      const matchesDepartment = departmentFilter === "all" || request.department === departmentFilter;

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
  }, [requests, searchTerm, statusFilter, typeFilter, departmentFilter, sorting]);

  // Export to Excel
  const exportToExcel = (exportType = "current") => {
    try {
      let dataToExport = [];

      if (exportType === "current") {
        dataToExport = filteredRequests.map((req) => ({
          "Request No": req.request_no,
          "Date": formatDate(req.created_at),
          "Requester": req.requester_name,
          "Badge": req.requester_badge,
          "Department": req.department,
          "Type": req.request_type,
          "Item Name": req.item_name,
          "Quantity": req.quantity,
          "Estimated Total": req.estimated_total,
          "Budget": getBudgetName(req.budget_id),
          "Status": req.status,
          "Notes": req.notes || "",
        }));
      } else {
        dataToExport = requests.map((req) => ({
          "Request No": req.request_no,
          "Date": formatDate(req.created_at),
          "Requester": req.requester_name,
          "Badge": req.requester_badge,
          "Department": req.department,
          "Type": req.request_type,
          "Item Name": req.item_name,
          "Quantity": req.quantity,
          "Estimated Total": req.estimated_total,
          "Budget": getBudgetName(req.budget_id),
          "Status": req.status,
          "Notes": req.notes || "",
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
                <FileText className="w-6 h-6 text-blue-600" />
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
              View and manage all budget requests, track their status and approvals
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
            {/* Total Requests */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <FileText className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="mt-1 text-xs opacity-90">Total Requests</p>
            </div>

            {/* Draft */}
            <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <FileText className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">{stats.draft}</span>
              </div>
              <p className="mt-1 text-xs opacity-90">Draft</p>
            </div>

            {/* Submitted */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <Send className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">{stats.submitted}</span>
              </div>
              <p className="mt-1 text-xs opacity-90">Submitted</p>
            </div>

            {/* Approved */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <CheckCircle className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">{stats.approved}</span>
              </div>
              <p className="mt-1 text-xs opacity-90">Approved</p>
            </div>

            {/* Rejected */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <XCircle className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">{stats.rejected}</span>
              </div>
              <p className="mt-1 text-xs opacity-90">Rejected</p>
            </div>

            {/* Waiting SR/MR */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <Clock className="w-5 h-5 opacity-90" />
                <span className="text-xl md:text-2xl font-bold">{stats.waiting}</span>
              </div>
              <p className="mt-1 text-xs opacity-90">Waiting SR/MR</p>
            </div>
          </div>

          {/* Total Amount Card */}
          <div className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Request Amount:</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {formatRupiah(stats.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* REQUESTS LIST SECTION */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ListIcon className="w-5 h-5 text-blue-600" />
                  Budget Requests
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {requests.length} requests found
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by request no, requester, item, department..."
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
                    className={`w-4 h-4 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${
                      viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-600"
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
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Desktop Action Buttons */}
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
                              <div className="font-medium">Export Current View</div>
                              <div className="text-xs text-gray-500">{filteredRequests.length} requests</div>
                            </div>
                          </button>
                          <button
                            onClick={() => exportToExcel("all")}
                            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                            <div className="text-left">
                              <div className="font-medium">Export All Requests</div>
                              <div className="text-xs text-gray-500">{requests.length} total requests</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                {/* Desktop Filters */}
                <div className="hidden md:flex items-center gap-2 ml-auto">
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
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-3 md:p-6">
            {requests.length === 0 ? (
              <div className="py-16 text-center">
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
            ) : filteredRequests.length === 0 ? (
              <div className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-gray-700 font-medium text-base mb-1">
                    No matching requests
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Try adjusting your filters
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
            ) : (
              /* LIST VIEW */
              <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                        Item/Service
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "estimated_total", desc: false }])}
                      >
                        <div className="flex items-center justify-end">
                          Amount
                          {sorting[0]?.id === "estimated_total" &&
                            (sorting[0]?.desc ? (
                              <ArrowDown className="w-3 h-3 ml-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Department
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
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.request_no}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(request.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {request.requester_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {request.requester_badge}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">{request.item_name}</div>
                            <div className="text-xs text-gray-500">
                              Qty: {request.quantity}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              request.request_type === "ITEM"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}>
                              {request.request_type}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-gray-900">
                            {formatRupiah(request.estimated_total)}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-600">
                              {request.department}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
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
                  Showing {filteredRequests.length} of {requests.length} requests
                </div>
                <div className="text-xs text-gray-500">
                  Total Amount: {formatRupiah(stats.totalAmount)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .swal2-popup {
          font-family: system-ui, -apple-system, sans-serif;
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
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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