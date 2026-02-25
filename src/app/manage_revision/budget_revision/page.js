"use client";

import { useState, useEffect, useMemo } from "react";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  Search,
  RefreshCw,
  RotateCcw,
  Eye,
  Calendar,
  User,
  DollarSign,
  Wallet,
  ArrowUp,
  ArrowDown,
  FileText,
  Clock,
  BarChart3,
  Filter,
  ChevronDown,
  Grid,
  List as ListIcon,
  CheckCircle,
  XCircle,
  Server,
  Building,
} from "lucide-react";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { formatCurrency, formatIDR } from "@/utils/currency";
import Link from "next/link";
import { formatTableCurrency } from "@/utils/currencyFormatter";

export default function BudgetRevisionPage() {
  const [revisions, setRevisions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState([]);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    totalReduction: 0,
    averageReduction: 0,
    capexRevisions: 0,
    opexRevisions: 0,
  });

  useEffect(() => {
    fetchData();
    fetchDepartments();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch revisions
      const revisionsData = await budgetService.getAllRevisions();
      setRevisions(revisionsData);

      // Fetch requests for reference
      const requestsData = await budgetService.getAllRequests();
      setRequests(requestsData);

      // Fetch budgets for reference
      const budgetsData = await budgetService.getAllBudgets();
      setBudgets(budgetsData);

      calculateStats(revisionsData, budgetsData);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to fetch revision data",
        icon: "error",
        confirmButtonColor: "#1e40af",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await budgetService.getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const calculateStats = (revisionsData, budgetsData) => {
    const total = revisionsData.length;
    const totalReduction = revisionsData.reduce((sum, r) => sum + (Number(r.original_amount) - Number(r.new_amount)), 0);
    const averageReduction = total > 0 ? totalReduction / total : 0;

    // Hitung berdasarkan tipe budget
    const capexRevisions = revisionsData.filter(r => {
      const budget = budgetsData.find(b => b.id === r.budget_id);
      return budget?.budget_type === "CAPEX";
    }).length;

    const opexRevisions = revisionsData.filter(r => {
      const budget = budgetsData.find(b => b.id === r.budget_id);
      return budget?.budget_type === "OPEX";
    }).length;

    setStats({
      total,
      totalReduction,
      averageReduction,
      capexRevisions,
      opexRevisions,
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  // Get request by id
  const getRequestNo = (requestId) => {
    const request = requests.find(r => r.id === requestId);
    return request ? request.request_no : `ID: ${requestId}`;
  };

  // Get budget name by id
  const getBudgetName = (budgetId) => {
    const budget = budgets.find(b => b.id === budgetId);
    return budget ? budget.budget_name : `ID: ${budgetId}`;
  };

  // Get budget type by id
  const getBudgetType = (budgetId) => {
    const budget = budgets.find(b => b.id === budgetId);
    return budget?.budget_type || "Unknown";
  };

  // Get budget department by id
  const getBudgetDepartment = (budgetId) => {
    const budget = budgets.find(b => b.id === budgetId);
    return budget?.department_name || "Unknown";
  };

  // Get budget currency by id
  const getBudgetCurrency = (budgetId) => {
    const budget = budgets.find(b => b.id === budgetId);
    return budget?.currency || "IDR";
  };

  // Format currency for table
  const formatBudgetCurrency = (amount, currencyCode) => {
    return formatTableCurrency(amount, currencyCode);
  };

  // Filter & Search
  const filteredRevisions = useMemo(() => {
    let filtered = revisions.filter((revision) => {
      const request = requests.find(r => r.id === revision.request_id);
      const budget = budgets.find(b => b.id === revision.budget_id);

      const matchesSearch =
        searchTerm === "" ||
        (request?.request_no || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget?.budget_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (revision.reason || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget?.budget_owner || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || budget?.budget_type === typeFilter;
      const matchesDepartment = departmentFilter === "all" || budget?.department_name === departmentFilter;

      return matchesSearch && matchesType && matchesDepartment;
    });

    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      filtered.sort((a, b) => {
        let aValue = a[id];
        let bValue = b[id];

        if (id === "original_amount" || id === "new_amount" || id === "reduction_percentage") {
          aValue = Number(aValue || 0);
          bValue = Number(bValue || 0);
        }

        if (id === "created_at") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (id === "budget_name") {
          aValue = getBudgetName(a.budget_id);
          bValue = getBudgetName(b.budget_id);
        }

        if (id === "budget_type") {
          aValue = getBudgetType(a.budget_id);
          bValue = getBudgetType(b.budget_id);
        }

        if (id === "department") {
          aValue = getBudgetDepartment(a.budget_id);
          bValue = getBudgetDepartment(b.budget_id);
        }

        if (aValue < bValue) return desc ? 1 : -1;
        if (aValue > bValue) return desc ? -1 : 1;
        return 0;
      });
    }

    return filtered;
  }, [revisions, requests, budgets, searchTerm, sorting, typeFilter, departmentFilter]);

  // Unique departments for filter
  const uniqueDepartments = useMemo(() => {
    const depts = [...new Set(budgets.map((b) => b.department_name))];
    return depts.filter(Boolean);
  }, [budgets]);

  // Get icon by budget type
  const getBudgetIcon = (type) => {
    if (type === "CAPEX") {
      return <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />;
    } else {
      return <Server className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <LayoutDashboard activeMenu={4}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={4}>
      <div className="space-y-6 p-3 md:p-6 bg-gray-50 min-h-screen">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                Budget Revision History
              </h1>
              <Link
                href="/request_budget_list"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
              >
                <FileText className="w-4 h-4" />
                <span>Back to Requests</span>
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              Track all budget revisions and changes
            </p>
          </div>
        </div>

        {/* STATS CARDS - Menggunakan desain seperti Budget Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b px-4 md:px-6 py-3 md:py-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm md:text-base">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              Revision Overview
            </h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              Summary of all budget revisions
            </p>
          </div>

          <div className="p-4 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {/* Total Revisions */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px]">
              <div className="flex justify-between items-center min-h-[48px]">
                <RotateCcw className="w-6 h-6 opacity-90" />
                <span className="text-xl md:text-3xl font-bold">{stats.total}</span>
              </div>
              <div>
                <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                  Total Revisions
                </p>
                <div className="text-[10px] md:text-xs opacity-80 mt-1">
                  {stats.capexRevisions} CAPEX • {stats.opexRevisions} OPEX
                </div>
              </div>
            </div>

            {/* Total Reduction */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px]">
              <div className="flex justify-between items-center min-h-[48px]">
                <DollarSign className="w-6 h-6 opacity-90" />
                <span className="text-xl md:text-3xl font-bold">
                  {formatBudgetCurrency(stats.totalReduction, "IDR")}
                </span>
              </div>
              <div>
                <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                  Total Reduction
                </p>
                <div className="text-[10px] md:text-xs opacity-80 mt-1">
                  Overall budget reduction
                </div>
              </div>
            </div>

            {/* Average Reduction */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px]">
              <div className="flex justify-between items-center min-h-[48px]">
                <ArrowDown className="w-6 h-6 opacity-90" />
                <span className="text-xl md:text-3xl font-bold text-green-300">
                  {formatBudgetCurrency(stats.averageReduction, "IDR")}
                </span>
              </div>
              <div>
                <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                  Average Reduction
                </p>
                <div className="text-[10px] md:text-xs opacity-80 mt-1">
                  Per revision
                </div>
              </div>
            </div>

            {/* Revision Rate */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[130px]">
              <div className="flex justify-between items-center min-h-[48px]">
                <BarChart3 className="w-6 h-6 opacity-90" />
                <span className="text-xl md:text-3xl font-bold text-yellow-300">
                  {stats.total > 0 ? ((stats.totalReduction / stats.total) / 1000000).toFixed(1) : 0}M
                </span>
              </div>
              <div>
                <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                  Reduction Rate
                </p>
                <div className="text-[10px] md:text-xs opacity-80 mt-1">
                  Average per revision
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER SECTION - Menggunakan desain seperti Budget Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ListIcon className="w-5 h-5 text-blue-600" />
                  Revision List
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {revisions.length} Revisions found • {uniqueDepartments.length} Departments
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by request no, budget name, reason, owner..."
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
                      Budget Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["all", "CAPEX", "OPEX"].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setTypeFilter(type);
                            setShowFilters(false);
                          }}
                          className={`px-3 py-1.5 text-xs rounded-lg ${typeFilter === type
                            ? type === "CAPEX"
                              ? "bg-purple-600 text-white"
                              : type === "OPEX"
                                ? "bg-green-600 text-white"
                                : "bg-blue-600 text-white"
                            : "bg-white border text-gray-700"
                            }`}
                        >
                          {type === "all" ? "All" : type}
                        </button>
                      ))}
                    </div>
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

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-3">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="CAPEX">CAPEX</option>
                  <option value="OPEX">OPEX</option>
                </select>

                {/* Department Filter */}
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
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

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-all"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden">
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
              </div>
            </div>
          </div>

          {/* CONTENT - Revisions Table/Grid */}
          <div className="p-3 md:p-6">
            {revisions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-gray-700 font-medium text-base mb-1">
                    No revisions available
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Revisions will appear here when budgets are revised
                  </p>
                </div>
              </div>
            ) : filteredRevisions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-gray-700 font-medium text-base mb-1">
                    No matching revisions found
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Try adjusting your search criteria
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
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
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filteredRevisions.map((revision) => {
                  const reductionAmount = Number(revision.original_amount) - Number(revision.new_amount);
                  const reductionPercent = ((reductionAmount / Number(revision.original_amount)) * 100).toFixed(1);
                  const budgetType = getBudgetType(revision.budget_id);
                  const currency = getBudgetCurrency(revision.budget_id);

                  return (
                    <div
                      key={revision.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 hover:shadow-sm transition-shadow"
                    >
                      {/* HEADER */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="p-1.5 md:p-2 rounded-lg bg-blue-100">
                            {getBudgetIcon(budgetType)}
                          </div>
                          <div className="max-w-[140px] md:max-w-[160px] flex-1">
                            <h4 className="font-medium text-gray-900 truncate text-sm">
                              {getBudgetName(revision.budget_id)}
                            </h4>
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                              {getRequestNo(revision.request_id)}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(revision.created_at)}
                        </span>
                      </div>

                      {/* CONTENT */}
                      <div className="space-y-2">
                        {/* Department */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Department
                          </span>
                          <span className="text-xs font-medium text-gray-900">
                            {getBudgetDepartment(revision.budget_id)}
                          </span>
                        </div>

                        {/* Budget Type */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Type</span>
                          <span className="text-xs font-medium text-gray-900">
                            {budgetType}
                          </span>
                        </div>

                        {/* Original Amount */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Original</span>
                          <span className="text-xs font-medium text-gray-900">
                            {formatBudgetCurrency(revision.original_amount, currency)}
                          </span>
                        </div>

                        {/* New Amount */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">New</span>
                          <span className="text-xs font-medium text-blue-600">
                            {formatBudgetCurrency(revision.new_amount, currency)}
                          </span>
                        </div>

                        {/* Reduction */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Reduction</span>
                          <div className="text-right">
                            <span className="text-xs font-medium text-red-600">
                              {reductionPercent}%
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({formatBudgetCurrency(reductionAmount, currency)})
                            </span>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-1">Reason</p>
                          <p className="text-xs text-gray-700 line-clamp-2">
                            {revision.reason}
                          </p>
                        </div>
                      </div>

                      {/* ACTION BUTTON */}
                      <div className="flex justify-end items-center mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: "Revision Details",
                              html: `
                                <div class="text-left space-y-3">
                                  <p><strong>Request:</strong> ${getRequestNo(revision.request_id)}</p>
                                  <p><strong>Budget:</strong> ${getBudgetName(revision.budget_id)}</p>
                                  <p><strong>Department:</strong> ${getBudgetDepartment(revision.budget_id)}</p>
                                  <p><strong>Type:</strong> ${budgetType}</p>
                                  <p><strong style="color: #1e40af;">Original Amount:</strong> <span style="color: #1e40af; font-weight: bold;">${formatBudgetCurrency(revision.original_amount, currency)}</span></p>
                                  <p><strong style="color: #166534;">New Amount:</strong> <span style="color: #166534; font-weight: bold;">${formatBudgetCurrency(revision.new_amount, currency)}</span></p>
                                  <p><strong style="color: #92400e;">Reduction:</strong> <span style="color: #92400e; font-weight: bold;">${reductionPercent}% (${formatBudgetCurrency(reductionAmount, currency)})</span></p>
                                  <p><strong>Reason:</strong> ${revision.reason}</p>
                                  <p><strong>Date:</strong> ${formatDate(revision.created_at)}</p>
                                </div>
                              `,
                              confirmButtonText: "Close",
                              confirmButtonColor: "#2563eb",
                            });
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "created_at", desc: true }])}>
                        <div className="flex items-center">
                          Date
                          {sorting[0]?.id === "created_at" &&
                            (sorting[0]?.desc ? (
                              <ArrowDown className="w-3 h-3 ml-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "budget_name", desc: false }])}>
                        <div className="flex items-center">
                          Request No
                          {sorting[0]?.id === "budget_name" &&
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
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "budget_type", desc: false }])}>
                        <div className="flex items-center justify-center">
                          Type
                          {sorting[0]?.id === "budget_type" &&
                            (sorting[0]?.desc ? (
                              <ArrowDown className="w-3 h-3 ml-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "department", desc: false }])}>
                        <div className="flex items-center justify-center">
                          Department
                          {sorting[0]?.id === "department" &&
                            (sorting[0]?.desc ? (
                              <ArrowDown className="w-3 h-3 ml-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "original_amount", desc: false }])}>
                        <div className="flex items-center justify-end">
                          Original
                          {sorting[0]?.id === "original_amount" &&
                            (sorting[0]?.desc ? (
                              <ArrowDown className="w-3 h-3 ml-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "new_amount", desc: false }])}>
                        <div className="flex items-center justify-end">
                          New
                          {sorting[0]?.id === "new_amount" &&
                            (sorting[0]?.desc ? (
                              <ArrowDown className="w-3 h-3 ml-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "reduction_percentage", desc: false }])}>
                        <div className="flex items-center justify-center">
                          Reduction
                          {sorting[0]?.id === "reduction_percentage" &&
                            (sorting[0]?.desc ? (
                              <ArrowDown className="w-3 h-3 ml-1" />
                            ) : (
                              <ArrowUp className="w-3 h-3 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRevisions.map((revision) => {
                      const reductionAmount = Number(revision.original_amount) - Number(revision.new_amount);
                      const reductionPercent = ((reductionAmount / Number(revision.original_amount)) * 100).toFixed(1);
                      const budgetType = getBudgetType(revision.budget_id);
                      const currency = getBudgetCurrency(revision.budget_id);

                      return (
                        <tr key={revision.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                              {formatDate(revision.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {getRequestNo(revision.request_id)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="p-1.5 rounded-lg mr-2 bg-blue-100">
                                {getBudgetIcon(budgetType)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                  {getBudgetName(revision.budget_id)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-600">
                              {budgetType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-600">
                              {getBudgetDepartment(revision.budget_id)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatBudgetCurrency(revision.original_amount, currency)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-blue-600">
                            {formatBudgetCurrency(revision.new_amount, currency)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <ArrowDown className="w-3 h-3 mr-1" />
                              {reductionPercent}%
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              ({formatBudgetCurrency(reductionAmount, currency)})
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-600 max-w-[200px] truncate" title={revision.reason}>
                              {revision.reason}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: "Revision Details",
                                  html: `
                                    <div class="text-left space-y-3">
                                      <p><strong>Request:</strong> ${getRequestNo(revision.request_id)}</p>
                                      <p><strong>Budget:</strong> ${getBudgetName(revision.budget_id)}</p>
                                      <p><strong>Department:</strong> ${getBudgetDepartment(revision.budget_id)}</p>
                                      <p><strong>Type:</strong> ${budgetType}</p>
                                      <p style="background-color: #dbeafe; padding: 8px; border-radius: 6px; border-left: 4px solid #3b82f6;"><strong style="color: #1e40af;">Original Amount:</strong> <span style="color: #1e40af; font-weight: bold;">${formatBudgetCurrency(revision.original_amount, currency)}</span></p>
                                      <p style="background-color: #dcfce7; padding: 8px; border-radius: 6px; border-left: 4px solid #22c55e;"><strong style="color: #166534;">New Amount:</strong> <span style="color: #166534; font-weight: bold;">${formatBudgetCurrency(revision.new_amount, currency)}</span></p>
                                      <p style="background-color: #fed7aa; padding: 8px; border-radius: 6px; border-left: 4px solid #f97316;"><strong style="color: #92400e;">Reduction:</strong> <span style="color: #92400e; font-weight: bold;">${reductionPercent}% (${formatBudgetCurrency(reductionAmount, currency)})</span></p>
                                      <p><strong>Reason:</strong> ${revision.reason}</p>
                                      <p><strong>Date:</strong> ${formatDate(revision.created_at)}</p>
                                    </div>
                                  `,
                                  confirmButtonText: "Close",
                                  confirmButtonColor: "#2563eb",
                                });
                              }}
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
          {filteredRevisions.length > 0 && (
            <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-xs md:text-sm text-gray-500 text-center sm:text-left">
                  Showing {filteredRevisions.length} of {revisions.length} Revisions
                </div>
                <div className="text-xs font-medium text-blue-600">
                  Total Reduction: {formatBudgetCurrency(stats.totalReduction, "IDR")}
                </div>
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
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