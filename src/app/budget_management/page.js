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
  Wallet,
  DollarSign,
  Calendar,
  Building,
  List as ListIcon,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Eye,
} from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import {
  showAddBudgetModal,
  showEditBudgetModal,
  showDeleteBudgetModal,
} from "@/components/modals/BudgetManagementModals";
import { departmentService } from "@/services/departmentService";

export default function BudgetManagementPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [showFilters, setShowFilters] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    CAPEX: 0,
    OPEX: 0,
    totalAmount: 0,
    totalRemaining: 0,
    totalReserved: 0,
    totalUsed: 0,
  });

  useEffect(() => {
    fetchBudgets();
    fetchDepartments();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await budgetService.getAllBudgets();
      setBudgets(data);
      calculateStats(data);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to fetch budget data",
        icon: "error",
        confirmButtonColor: "#1e40af",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      if (uniqueDepartments.length > 0) {
        const fallbackDepts = uniqueDepartments.map((name, index) => ({
          id: `temp-${index}`,
          name: name,
        }));
        setDepartments(fallbackDepts);
      }
    } finally {
      setLoadingDepartments(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const CAPEX = data.filter((b) => b.budget_type === "CAPEX").length;
    const OPEX = data.filter((b) => b.budget_type === "OPEX").length;
    const totalAmount = data.reduce(
      (sum, b) => sum + Number(b.total_amount || 0),
      0,
    );
    const totalRemaining = data.reduce(
      (sum, b) => sum + Number(b.remaining_amount || 0),
      0,
    );
    const totalReserved = data.reduce(
      (sum, b) => sum + Number(b.reserved_amount || 0),
      0,
    );
    const totalUsed = data.reduce(
      (sum, b) => sum + Number(b.used_amount || 0),
      0,
    );

    setStats({
      total,
      CAPEX,
      OPEX,
      totalAmount,
      totalRemaining,
      totalReserved,
      totalUsed,
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBudgets();
  };

  const handleAddClick = () => {
    showAddBudgetModal({
      onSave: async (formData) => {
        try {
          await budgetService.createBudget(formData);
          Swal.fire({
            title: "Success!",
            text: "Budget added successfully",
            icon: "success",
            timer: 1500,
            confirmButtonColor: "#1e40af",
          });
          fetchBudgets();
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: "Failed to add budget",
            icon: "error",
            confirmButtonColor: "#1e40af",
          });
        }
      },
    });
  };

  const handleEditClick = (budget) => {
    showEditBudgetModal({
      budget,
      onSave: async (formData) => {
        try {
          await budgetService.updateBudget(budget.id, formData);
          Swal.fire({
            title: "Success!",
            text: "Budget updated successfully",
            icon: "success",
            timer: 1500,
            confirmButtonColor: "#1e40af",
          });
          fetchBudgets();
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: "Failed to update budget",
            icon: "error",
            confirmButtonColor: "#1e40af",
          });
        }
      },
    });
  };

  const handleDeleteClick = (budget) => {
    showDeleteBudgetModal({
      budget,
      onConfirm: async () => {
        try {
          const result = await budgetService.deleteBudget(budget.id);
          Swal.fire({
            title: "Deleted!",
            text: result.message || "Budget deleted successfully",
            icon: "success",
            timer: 1500,
            confirmButtonColor: "#1e40af",
          });
          fetchBudgets();
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: error.message || "Failed to delete budget",
            icon: "error",
            confirmButtonColor: "#1e40af",
          });
        }
      },
    });
  };

  // ============ FILTER & SEARCH ============
  const uniqueDepartments = useMemo(() => {
    const depts = [...new Set(budgets.map((b) => b.department_name))];
    return depts.filter(Boolean);
  }, [budgets]);

  const filteredBudgets = useMemo(() => {
    let filtered = budgets.filter((budget) => {
      const matchesSearch =
        searchTerm === "" ||
        (budget.budget_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget.department_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget.budget_owner || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || budget.budget_type === typeFilter;
      const matchesDepartment = departmentFilter === "all" || budget.department_name === departmentFilter;

      return matchesSearch && matchesType && matchesDepartment;
    });

    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      filtered.sort((a, b) => {
        let aValue = a[id];
        let bValue = b[id];

        if (["total_amount", "remaining_amount", "reserved_amount", "used_amount"].includes(id)) {
          aValue = Number(aValue || 0);
          bValue = Number(bValue || 0);
        }

        if (aValue < bValue) return desc ? 1 : -1;
        if (aValue > bValue) return desc ? -1 : 1;
        return 0;
      });
    }

    return filtered;
  }, [budgets, searchTerm, typeFilter, departmentFilter, sorting]);

  // ============ EXPORT EXCEL ============
  const exportToExcel = (exportType = "current") => {
    try {
      let dataToExport = [];

      if (exportType === "current") {
        dataToExport = filteredBudgets.map((budget) => ({
          "Fiscal Year": budget.fiscal_year,
          Department: budget.department_name,
          "Budget Name": budget.budget_name,
          Type: budget.budget_type,
          "Total Amount": budget.total_amount,
          "Remaining Amount": budget.remaining_amount,
          "Reserved Amount": budget.reserved_amount,
          "Used Amount": budget.used_amount,
          "Budget Owner": budget.budget_owner || "",
          Description: budget.description || "",
          Status: budget.is_active ? "Active" : "Inactive",
        }));
      } else {
        dataToExport = budgets.map((budget) => ({
          "Fiscal Year": budget.fiscal_year,
          Department: budget.department_name,
          "Budget Name": budget.budget_name,
          Type: budget.budget_type,
          "Total Amount": budget.total_amount,
          "Remaining Amount": budget.remaining_amount,
          "Reserved Amount": budget.reserved_amount,
          "Used Amount": budget.used_amount,
          "Budget Owner": budget.budget_owner || "",
          Description: budget.description || "",
          Status: budget.is_active ? "Active" : "Inactive",
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
        { wch: 8 }, // Fiscal Year
        { wch: 15 }, // Department
        { wch: 30 }, // Budget Name
        { wch: 10 }, // Type
        { wch: 18 }, // Total Amount
        { wch: 18 }, // Remaining Amount
        { wch: 18 }, // Reserved Amount
        { wch: 18 }, // Used Amount
        { wch: 20 }, // Budget Owner
        { wch: 25 }, // Description
        { wch: 10 }, // Status
      ];
      ws["!cols"] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Budget");

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");
      const filename = `budget_${exportType}_${timestamp}.xlsx`;

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

  // ============ FORMAT RUPIAH ============
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);
  };

  // ============ GET ICON BY BUDGET TYPE ============
  const getBudgetIcon = (type) => {
    if (type === "CAPEX") {
      return <Building className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />;
    } else {
      return <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600" />;
    }
  };

  const getIconBackground = (type) => {
    return type === "CAPEX" ? "bg-purple-100" : "bg-green-100";
  };

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <LayoutDashboard activeMenu={1}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={1}>
      <div className="space-y-6 p-3 md:p-6 bg-gray-50">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                Budget Management
              </h1>
            </div>
            <p className="text-gray-500 text-sm">
              Manage CAPEX/OPEX budgets, track allocations, and monitor remaining funds
            </p>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b px-4 md:px-6 py-3 md:py-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm md:text-base">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              Budget Overview
            </h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              Summary of all budgets
            </p>
          </div>

          <div className="p-4 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {/* Total Budgets Count */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <Wallet className="w-6 h-6 opacity-90" />
                <span className="text-xl md:text-3xl font-bold">
                  {stats.total}
                </span>
              </div>
              <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                Total Budgets
              </p>
              <div className="text-[10px] md:text-xs opacity-80 mt-1">
                {stats.CAPEX} CAPEX • {stats.OPEX} OPEX
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <DollarSign className="w-6 h-6 opacity-90" />
                <span className="text-xl md:text-3xl font-bold">
                  {formatRupiah(stats.totalAmount).replace('Rp', '')}
                </span>
              </div>
              <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                Total Amount
              </p>
              <div className="text-[10px] md:text-xs opacity-80 mt-1">
                Overall budget
              </div>
            </div>

            {/* Remaining Amount */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <DollarSign className="w-6 h-6 opacity-90" />
                <span className="text-xl md:text-3xl font-bold text-green-300">
                  {formatRupiah(stats.totalRemaining).replace('Rp', '')}
                </span>
              </div>
              <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                Remaining
              </p>
              <div className="text-[10px] md:text-xs opacity-80 mt-1">
                Available to use
              </div>
            </div>

            {/* Reserved + Used */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <DollarSign className="w-6 h-6 opacity-90" />
                <div className="text-right">
                  <span className="text-xl md:text-2xl font-bold text-yellow-300 block">
                    {formatRupiah(stats.totalReserved).replace('Rp', '')}
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-blue-300 block">
                    {formatRupiah(stats.totalUsed).replace('Rp', '')}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs md:text-sm opacity-90 uppercase">
                Reserved / Used
              </p>
              <div className="text-[10px] md:text-xs opacity-80 mt-1">
                Allocated vs Spent
              </div>
            </div>
          </div>
        </div>

        {/* BUDGET LIST SECTION */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ListIcon className="w-5 h-5 text-blue-600" />
                  Budget List
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {budgets.length} Budgets available • {uniqueDepartments.length} Departments
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search budget name, department, description, owner..."
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
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${
                      viewMode === "grid"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
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
                          className={`px-3 py-1.5 text-xs rounded-lg ${
                            typeFilter === type
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

              {/* Desktop Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
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
                                {filteredBudgets.length} budgets
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
                                Export All Budgets
                              </div>
                              <div className="text-xs text-gray-500">
                                {budgets.length} total budgets
                              </div>
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
                  <RefreshCw
                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                {/* Add Budget Button */}
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-600 hover:to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Budget</span>
                </button>

                {/* Desktop Filters */}
                <div className="hidden md:flex items-center gap-2 ml-auto">
                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm bg-white min-w-[120px]"
                  >
                    <option value="all">All Types</option>
                    <option value="CAPEX">CAPEX</option>
                    <option value="OPEX">OPEX</option>
                  </select>

                  {/* Department Filter */}
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm bg-white min-w-[180px]"
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

                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${
                        viewMode === "list"
                          ? "bg-gray-100 text-gray-900"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${
                        viewMode === "grid"
                          ? "bg-gray-100 text-gray-900"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-3 md:p-6">
            {budgets.length === 0 ? (
              <div className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-gray-700 font-medium text-base mb-1">
                    No budget available
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Start by adding CAPEX/OPEX budget
                  </p>
                  <button
                    onClick={handleAddClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add First Budget
                  </button>
                </div>
              </div>
            ) : filteredBudgets.length === 0 ? (
              <div className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-gray-700 font-medium text-base mb-1">
                    No matching budgets found
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
                {filteredBudgets.map((budget) => (
                  <div
                    key={budget.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 hover:shadow-sm transition-shadow"
                  >
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="p-1.5 md:p-2 rounded-lg bg-blue-100">
                          {budget.budget_type === "CAPEX" ? (
                            <Building className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Calendar className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="max-w-[140px] md:max-w-[160px] flex-1">
                          <h4 className="font-medium text-gray-900 truncate text-sm">
                            {budget.budget_name}
                          </h4>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                            {budget.budget_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="space-y-2">
                      {/* Department */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Department</span>
                        <span className="text-xs font-medium text-gray-900">
                          {budget.department_name}
                        </span>
                      </div>

                      {/* Budget Code */}
                      {budget.budget_code && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Code</span>
                          <span className="text-xs font-medium text-gray-900">
                            {budget.budget_code}
                          </span>
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="text-xs font-bold text-gray-900">
                          {formatRupiah(budget.total_amount)}
                        </span>
                      </div>

                      {/* Reserved */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Reserved</span>
                        <span className="text-xs font-medium text-yellow-600">
                          {formatRupiah(budget.reserved_amount)}
                        </span>
                      </div>

                      {/* Used */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Used</span>
                        <span className="text-xs font-medium text-blue-600">
                          {formatRupiah(budget.used_amount)}
                        </span>
                      </div>

                      {/* Remaining */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Remaining</span>
                        <span className="text-xs font-medium text-green-600">
                          {formatRupiah(budget.remaining_amount)}
                        </span>
                      </div>

                      {/* Budget Owner */}
                      {budget.budget_owner && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Owner</span>
                          <span className="text-xs font-medium text-gray-900">
                            {budget.budget_owner}
                          </span>
                        </div>
                      )}

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                            budget.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {budget.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </div>

                      {/* Fiscal Year */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-gray-500">Fiscal Year</span>
                        <span className="text-xs font-medium text-gray-900">
                          {budget.fiscal_year}
                        </span>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex justify-end items-center gap-1 mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleEditClick(budget)}
                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Budget"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(budget)}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Budget Name
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Code
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "total_amount", desc: false }])}
                      >
                        <div className="flex items-center justify-center">
                          Total
                          {sorting[0]?.id === "total_amount" &&
                            (sorting[0]?.desc ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />)}
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "reserved_amount", desc: false }])}
                      >
                        <div className="flex items-center justify-center">
                          Reserved
                          {sorting[0]?.id === "reserved_amount" &&
                            (sorting[0]?.desc ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />)}
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "used_amount", desc: false }])}
                      >
                        <div className="flex items-center justify-center">
                          Used
                          {sorting[0]?.id === "used_amount" &&
                            (sorting[0]?.desc ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />)}
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "remaining_amount", desc: false }])}
                      >
                        <div className="flex items-center justify-center">
                          Remaining
                          {sorting[0]?.id === "remaining_amount" &&
                            (sorting[0]?.desc ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />)}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Owner
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSorting([{ id: "fiscal_year", desc: false }])}
                      >
                        <div className="flex items-center justify-center">
                          Fiscal Year
                          {sorting[0]?.id === "fiscal_year" &&
                            (sorting[0]?.desc ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />)}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-center">
                    {filteredBudgets.map((budget) => (
                      <tr key={budget.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-left">
                          <div className="flex items-center">
                            <div className="p-1.5 rounded-lg mr-2 bg-blue-100">
                              {budget.budget_type === "CAPEX" ? (
                                <Building className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Calendar className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                {budget.budget_name}
                              </div>
                              {budget.description && (
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {budget.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {budget.budget_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {budget.budget_code || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatRupiah(budget.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-yellow-600">
                          {formatRupiah(budget.reserved_amount)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">
                          {formatRupiah(budget.used_amount)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">
                          {formatRupiah(budget.remaining_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {budget.department_name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {budget.budget_owner || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {budget.fiscal_year}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {budget.is_active ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditClick(budget)}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(budget)}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          {filteredBudgets.length > 0 && (
            <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-xs md:text-sm text-gray-500 text-center sm:text-left">
                  Showing {filteredBudgets.length} of {budgets.length} budgets
                </div>
                <div className="text-xs text-gray-500">
                  Total: {formatRupiah(stats.totalAmount)} • Remaining: {formatRupiah(stats.totalRemaining)}
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