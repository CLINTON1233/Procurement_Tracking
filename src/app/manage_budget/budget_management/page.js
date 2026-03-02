"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  Plus, Edit, Trash2, Search, Filter, RefreshCw, FileSpreadsheet,
  ChevronDown, Grid, CheckCircle, XCircle, Wallet, DollarSign,
  Calendar, Building, List as ListIcon, ArrowUp, ArrowDown, BarChart3,
  Eye, Server, TrendingUp, TrendingDown, Layers,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import {
  showDeleteBudgetModal,
  showBudgetDetailsModal,
  showBulkEditBudgetModal,
} from "@/components/modals/BudgetManagementModals";
import { departmentService } from "@/services/departmentService";
import { formatTableCurrency } from "@/utils/currencyFormatter";

// ─── Inline Donut ─────────────────────────────────────────────────────────────
const InlineDonut = ({ pct = 0, color = "#2563eb", size = 100, stroke = 11 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <span className="text-xl font-bold text-gray-800 z-10">{isNaN(pct) ? 0 : pct.toFixed(0)}%</span>
    </div>
  );
};

// ─── Stacked Bar ─────────────────────────────────────────────────────────────
const StackedBar = ({ segments }) => (
  <div className="flex rounded-full overflow-hidden h-6 w-full">
    {segments.map((s, i) => (
      <div key={i} style={{ width: `${s.pct}%`, background: s.color }}
        className="flex items-center justify-center text-xs font-bold text-white transition-all">
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
  return n.toString();
};

export default function BudgetManagementPage() {
  const router = useRouter();
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
  const [selectedBudgets, setSelectedBudgets] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const [stats, setStats] = useState({
    total: 0, CAPEX: 0, OPEX: 0, totalAmount: 0,
    totalRemaining: 0, totalReserved: 0, totalUsed: 0, active: 0,
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
      Swal.fire({ title: "Error!", text: "Failed to fetch budget data", icon: "error", confirmButtonColor: "#1e40af" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      CAPEX: data.filter((b) => b.budget_type === "CAPEX").length,
      OPEX: data.filter((b) => b.budget_type === "OPEX").length,
      active: data.filter((b) => b.is_active).length,
      totalAmount: data.reduce((s, b) => s + Number(b.total_amount_idr || 0), 0),
      totalRemaining: data.reduce((s, b) => s + Number(b.remaining_amount_idr || 0), 0),
      totalReserved: data.reduce((s, b) => s + Number(b.reserved_amount_idr || 0), 0),
      totalUsed: data.reduce((s, b) => s + Number(b.used_amount_idr || 0), 0),
    });
  };

  const handleRefresh = () => { setRefreshing(true); fetchBudgets(); };
  const handleAddClick = () => router.push("/manage_budget/create_budget");
  const handleEditClick = (budgetId) => router.push(`/manage_budget/edit_budget/${budgetId}`);

  const handleDeleteClick = (budget) => {
    showDeleteBudgetModal({
      budget,
      onConfirm: async () => {
        try {
          const result = await budgetService.deleteBudget(budget.id);
          Swal.fire({ title: "Deleted!", text: result.message || "Budget deleted successfully", icon: "success", timer: 1500, confirmButtonColor: "#1e40af" });
          fetchBudgets();
        } catch (error) {
          Swal.fire({ title: "Error!", text: error.message || "Failed to delete budget", icon: "error", confirmButtonColor: "#1e40af" });
        }
      },
    });
  };

  const handleViewDetails = (budget) => showBudgetDetailsModal(budget);

  const toggleSelectMode = () => { setSelectMode(!selectMode); setSelectedBudgets([]); setSelectAll(false); };
  const handleSelectBudget = (id) => setSelectedBudgets(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const handleSelectAll = () => { if (selectAll) setSelectedBudgets([]); else setSelectedBudgets(filteredBudgets.map(b => b.id)); setSelectAll(!selectAll); };

  const handleBulkEdit = () => {
    if (!selectedBudgets.length) return Swal.fire({ title: "No Selection", text: "Please select at least one budget", icon: "warning", confirmButtonColor: "#1e40af" });
    const selectedData = budgets.filter(b => selectedBudgets.includes(b.id));
    showBulkEditBudgetModal({
      budgets: selectedData,
      onSave: async (updatedBudgets) => {
        try {
          Swal.fire({ title: "Updating...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
          let success = 0;
          for (const b of updatedBudgets) { try { await budgetService.updateBudget(b.id, b); success++; } catch {} }
          Swal.fire({ title: "Updated!", text: `${success} Budgets updated`, icon: "success", confirmButtonColor: "#1e40af" });
          fetchBudgets(); setSelectMode(false); setSelectedBudgets([]); setSelectAll(false);
        } catch { Swal.fire({ title: "Error!", text: "Failed to update budgets", icon: "error", confirmButtonColor: "#1e40af" }); }
      },
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedBudgets.length) return Swal.fire({ title: "No Selection", text: "Please select at least one budget", icon: "warning", confirmButtonColor: "#1e40af" });
    const r = await Swal.fire({
      title: `Delete ${selectedBudgets.length} Budgets?`, icon: "warning", showCancelButton: true,
      confirmButtonText: "Yes, Delete All!", cancelButtonText: "Cancel", buttonsStyling: false,
      customClass: { actions: "flex gap-3 justify-center", confirmButton: "px-6 py-2 rounded-lg bg-red-600 text-white font-medium min-w-[140px]", cancelButton: "px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium min-w-[140px]" },
    });
    if (r.isConfirmed) {
      Swal.fire({ title: "Deleting...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      let success = 0;
      for (const id of selectedBudgets) { try { await budgetService.deleteBudget(id); success++; } catch {} }
      Swal.fire({ title: "Deleted!", text: `${success} Budgets deleted`, icon: "success", confirmButtonColor: "#1e40af" });
      fetchBudgets(); setSelectMode(false); setSelectedBudgets([]); setSelectAll(false);
    }
  };

  const uniqueDepartments = useMemo(() => [...new Set(budgets.map(b => b.department_name))].filter(Boolean), [budgets]);

  const filteredBudgets = useMemo(() => {
    let filtered = budgets.filter(budget => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || [budget.budget_name, budget.department_name, budget.description, budget.budget_owner].some(v => (v || "").toLowerCase().includes(q));
      const matchesType = typeFilter === "all" || budget.budget_type === typeFilter;
      const matchesDept = departmentFilter === "all" || budget.department_name === departmentFilter;
      return matchesSearch && matchesType && matchesDept;
    });
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      filtered.sort((a, b) => {
        let av = a[id], bv = b[id];
        if (["total_amount", "remaining_amount", "reserved_amount", "used_amount"].includes(id)) { av = Number(av || 0); bv = Number(bv || 0); }
        return av < bv ? (desc ? 1 : -1) : av > bv ? (desc ? -1 : 1) : 0;
      });
    }
    return filtered;
  }, [budgets, searchTerm, typeFilter, departmentFilter, sorting]);

  const exportToExcel = (exportType = "current") => {
    try {
      const data = (exportType === "current" ? filteredBudgets : budgets).map(b => ({
        "Fiscal Year": b.fiscal_year, Department: b.department_name, "Budget Name": b.budget_name,
        Type: b.budget_type, "Total Amount": b.total_amount, "Remaining Amount": b.remaining_amount,
        "Reserved Amount": b.reserved_amount, "Used Amount": b.used_amount,
        "Budget Owner": b.budget_owner || "", Description: b.description || "",
        Status: b.is_active ? "Active" : "Inactive",
      }));
      if (!data.length) return Swal.fire({ title: "No Data", icon: "info", confirmButtonColor: "#1e40af" });
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [8, 15, 30, 10, 18, 18, 18, 18, 20, 25, 10].map(wch => ({ wch }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Budget");
      XLSX.writeFile(wb, `budget_${exportType}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.xlsx`);
      setShowExportDropdown(false);
    } catch {
      Swal.fire({ title: "Error", text: "Failed to export data", icon: "error", confirmButtonColor: "#1e40af" });
    }
  };

  const formatBudgetCurrency = (amount, currencyCode) => formatTableCurrency(amount, currencyCode);

  // Computed chart data
  const usedPct = stats.totalAmount > 0 ? (stats.totalUsed / stats.totalAmount) * 100 : 0;
  const remainingPct = stats.totalAmount > 0 ? (stats.totalRemaining / stats.totalAmount) * 100 : 0;
  const reservedPct = stats.totalAmount > 0 ? (stats.totalReserved / stats.totalAmount) * 100 : 0;
  const capexPct = stats.total > 0 ? (stats.CAPEX / stats.total) * 100 : 0;
  const activePct = stats.total > 0 ? (stats.active / stats.total) * 100 : 0;

  // Dept bar chart data
  const deptChartData = useMemo(() => {
    const map = new Map();
    budgets.forEach(b => {
      const d = b.department_name;
      map.set(d, (map.get(d) || 0) + Number(b.total_amount || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value / 1e6) }))
      .sort((a, b) => b.value - a.value).slice(0, 7);
  }, [budgets]);

  // Budget type pie data
  const pieData = [
    { name: "CAPEX", value: stats.CAPEX },
    { name: "OPEX", value: stats.OPEX },
  ];
  const PIE_COLORS = ["#1e3a5f", "#2563eb"];

  if (loading) {
    return (
      <LayoutDashboard activeMenu={1}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={1}>
      <style>{`
        .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04); }
        .section-title { font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
        .period-badge { background: #1e3a5f; color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .donut-card { display: flex; flex-direction: column; align-items: center; padding: 20px 12px; }
        .donut-card h4 { font-size: 12px; font-weight: 600; color: #374151; text-align: center; margin-bottom: 12px; }
        .bullet-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
      `}</style>

      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">Manage Budget</h1>
              <span className="period-badge">CAPEX / OPEX — {new Date().getFullYear()}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Manage budgets, track allocations, and monitor remaining funds</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ── Row 1: 4 Donut KPIs ── */}
        <div className="card p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-gray-100">
            <div className="donut-card">
              <h4>Budget Used</h4>
              <InlineDonut pct={usedPct} color="#2563eb" size={110} stroke={13} />
              <p className="text-xs text-gray-500 mt-3 text-center">{fmtCompact(stats.totalUsed)} / {fmtCompact(stats.totalAmount)}</p>
            </div>
            <div className="donut-card">
              <h4>CAPEX Ratio</h4>
              <InlineDonut pct={capexPct} color="#1e3a5f" size={110} stroke={13} />
              <p className="text-xs text-gray-500 mt-3 text-center">{stats.CAPEX} CAPEX • {stats.OPEX} OPEX</p>
            </div>
            <div className="donut-card">
              <h4>Budget Health</h4>
              <InlineDonut pct={remainingPct} color="#10b981" size={110} stroke={13} />
              <p className="text-xs text-gray-500 mt-3 text-center">{fmtCompact(stats.totalRemaining)} remaining</p>
            </div>
            <div className="donut-card">
              <h4>Active Budgets</h4>
              <InlineDonut pct={activePct} color="#f59e0b" size={110} stroke={13} />
              <p className="text-xs text-gray-500 mt-3 text-center">{stats.active} of {stats.total} active</p>
            </div>
          </div>
        </div>

        {/* ── Row 2: Charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Bar Chart by Department - FIXED VISIBILITY */}
          <div className="card p-5 md:col-span-3">
            <p className="section-title flex items-center gap-2">
              <span className="bullet-dot bg-blue-800" />Budget by Department (IDR Jt)
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={v => v.length > 8 ? v.slice(0, 8) + "…" : v} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  formatter={(v) => [`${v}M IDR`, "Total"]} 
                  contentStyle={{ 
                    fontSize: 12, 
                    borderRadius: 8, 
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#fff",
                    color: "#111827"
                  }} 
                />
                <Bar dataKey="value" fill="#1e3a5f" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget Allocation Stacked + Pie */}
          <div className="card p-5 md:col-span-2 space-y-4">
            <p className="section-title">Budget Distribution</p>

            {/* Type split pie */}
            <div className="flex items-center gap-4">
              <PieChart width={80} height={80}>
                <Pie data={pieData} cx={35} cy={35} innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
              </PieChart>
              <div className="text-xs text-gray-500 space-y-1.5">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1e3a5f] inline-block" /> CAPEX: {stats.CAPEX}</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> OPEX: {stats.OPEX}</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" /> Active: {stats.active}</div>
              </div>
            </div>

            {/* Budget allocation bars */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Allocation Breakdown</p>
                <StackedBar segments={[
                  { pct: Math.max(Math.round(usedPct), 1), color: "#2563eb" },
                  { pct: Math.max(Math.round(reservedPct), 1), color: "#f59e0b" },
                  { pct: Math.max(Math.round(remainingPct), 1), color: "#10b981" },
                ]} />
                <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                  <span>● Used</span><span>● Reserved</span><span>● Free</span>
                </div>
              </div>

              {/* Quick summary */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-blue-700">{fmtCompact(stats.totalUsed)}</div>
                  <div className="text-xs text-blue-500">Used</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-emerald-700">{fmtCompact(stats.totalRemaining)}</div>
                  <div className="text-xs text-emerald-500">Remaining</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-yellow-700">{fmtCompact(stats.totalReserved)}</div>
                  <div className="text-xs text-yellow-600">Reserved</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-gray-700">{fmtCompact(stats.totalAmount)}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Budget List Section ── */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  <ListIcon className="w-4 h-4 text-blue-600" />
                  List Budget for Procurement
                  <span className="ml-2 px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">{budgets.length}</span>
                </h3>

                {/* Desktop Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Export */}
                  <div className="relative">
                    <button onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all">
                      <FileSpreadsheet className="w-3.5 h-3.5" />Export Excel<ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {showExportDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowExportDropdown(false)} />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-1">
                          <button onClick={() => exportToExcel("current")} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />Current View ({filteredBudgets.length})
                          </button>
                          <button onClick={() => exportToExcel("all")} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                            <FileSpreadsheet className="w-4 h-4 text-blue-600" />All Budgets ({budgets.length})
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Add */}
                  <button onClick={handleAddClick}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all">
                    <Plus className="w-3.5 h-3.5" />Add Budget
                  </button>

                  {/* Select */}
                  <button onClick={toggleSelectMode}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${selectMode ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    <Layers className="w-3.5 h-3.5" />{selectMode ? "Cancel Select" : "Select Multiple"}
                  </button>

                  {/* Bulk actions */}
                  {selectMode && (
                    <>
                      <button onClick={handleSelectAll}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-xs font-medium">
                        {selectAll ? "Unselect All" : "Select All"}
                      </button>
                      <button onClick={handleBulkEdit}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700">
                        <Edit className="w-3.5 h-3.5" />Edit ({selectedBudgets.length})
                      </button>
                      <button onClick={handleBulkDelete}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-700">
                        <Trash2 className="w-3.5 h-3.5" />Delete ({selectedBudgets.length})
                      </button>
                    </>
                  )}

                  {/* View Toggle */}
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode("list")}
                      className={`p-2 transition-colors ${viewMode === "list" ? "bg-gray-100 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
                      <ListIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setViewMode("grid")}
                      className={`p-2 border-l border-gray-200 transition-colors ${viewMode === "grid" ? "bg-gray-100 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search + Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="text" placeholder="Search budget name, department, owner..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
                </div>

                {/* Type filter */}
                <div className="flex gap-1.5">
                  {["all", "CAPEX", "OPEX"].map(type => (
                    <button key={type} onClick={() => setTypeFilter(type)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${typeFilter === type
                        ? type === "CAPEX" ? "bg-[#1e3a5f] text-white" : type === "OPEX" ? "bg-blue-600 text-white" : "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {type === "all" ? "All Types" : type}
                    </button>
                  ))}
                </div>

                {/* Department filter */}
                <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Departments</option>
                  {(departments.length > 0 ? departments.map(d => ({ id: d.id, name: d.name })) : uniqueDepartments.map((n, i) => ({ id: i, name: n }))).map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {budgets.length === 0 ? (
              <div className="py-16 text-center">
                <Wallet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-gray-700 font-medium mb-1">No budget available</h3>
                <p className="text-gray-400 text-sm mb-5">Start by adding CAPEX/OPEX budget</p>
                <button onClick={handleAddClick} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs inline-flex items-center gap-2 hover:bg-blue-700">
                  <Plus className="w-3.5 h-3.5" />Add First Budget
                </button>
              </div>
            ) : filteredBudgets.length === 0 ? (
              <div className="py-16 text-center">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-gray-700 font-medium mb-1">No matching budgets</h3>
                <p className="text-gray-400 text-sm mb-5">Try adjusting your search criteria</p>
                <button onClick={() => { setSearchTerm(""); setTypeFilter("all"); setDepartmentFilter("all"); }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs inline-flex items-center gap-2 hover:bg-gray-200">
                  <RefreshCw className="w-3.5 h-3.5" />Clear Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredBudgets.map(budget => (
                  <div key={budget.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all bg-white">
                    <div className="flex justify-between items-start mb-3">
                      {selectMode && (
                        <input type="checkbox" checked={selectedBudgets.includes(budget.id)} onChange={() => handleSelectBudget(budget.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 mr-2 mt-0.5" />
                      )}
                      <div className="flex items-center gap-2 flex-1">
                        <div className="p-2 rounded-lg bg-blue-50">
                          {budget.budget_type === "CAPEX" ? <Calendar className="w-4 h-4 text-blue-600" /> : <Server className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate text-sm">{budget.budget_name}</div>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold rounded-full ${budget.budget_type === "CAPEX" ? "bg-[#1e3a5f] text-white" : "bg-blue-100 text-blue-700"}`}>
                            {budget.budget_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-gray-400">Department</span><span className="font-medium text-gray-700">{budget.department_name}</span></div>
                      {budget.budget_code && <div className="flex justify-between"><span className="text-gray-400">Code</span><span className="font-medium text-gray-700">{budget.budget_code}</span></div>}
                      <div className="flex justify-between"><span className="text-gray-400">Total</span><span className="font-bold text-gray-900">{formatBudgetCurrency(budget.total_amount, budget.currency)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Reserved</span><span className="font-medium text-yellow-600">{formatBudgetCurrency(budget.reserved_amount, budget.currency)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Used</span><span className="font-medium text-blue-600">{formatBudgetCurrency(budget.used_amount, budget.currency)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Remaining</span><span className="font-medium text-emerald-600">{formatBudgetCurrency(budget.remaining_amount, budget.currency)}</span></div>
                      {budget.budget_owner && <div className="flex justify-between"><span className="text-gray-400">Owner</span><span className="font-medium text-gray-700">{budget.budget_owner}</span></div>}
                      <div className="flex justify-between pt-1.5 border-t border-gray-100">
                        <span className="text-gray-400">Fiscal Year</span>
                        <span className="font-medium text-gray-700">{budget.fiscal_year}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${budget.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {budget.is_active ? <><CheckCircle className="w-3 h-3" />Active</> : <><XCircle className="w-3 h-3" />Inactive</>}
                      </span>
                      <div className="flex gap-0.5">
                        <button onClick={() => handleViewDetails(budget)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleEditClick(budget.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteClick(budget)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {selectMode && (
                        <th className="px-4 py-3 text-center">
                          <input type="checkbox" checked={selectAll} onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                        </th>
                      )}
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget Name</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                      {[
                        { label: "Total", id: "total_amount" },
                        { label: "Reserved", id: "reserved_amount" },
                        { label: "Used", id: "used_amount" },
                        { label: "Remaining", id: "remaining_amount" },
                      ].map(col => (
                        <th key={col.id} onClick={() => setSorting([{ id: col.id, desc: sorting[0]?.id === col.id ? !sorting[0].desc : false }])}
                          className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700">
                          <div className="flex items-center justify-center gap-1">
                            {col.label}
                            {sorting[0]?.id === col.id ? (sorting[0].desc ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />) : null}
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                      <th onClick={() => setSorting([{ id: "fiscal_year", desc: sorting[0]?.id === "fiscal_year" ? !sorting[0].desc : false }])}
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700">
                        <div className="flex items-center justify-center gap-1">
                          Fiscal Year
                          {sorting[0]?.id === "fiscal_year" ? (sorting[0].desc ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />) : null}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgets.map(budget => (
                      <tr key={budget.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        {selectMode && (
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox" checked={selectedBudgets.includes(budget.id)} onChange={() => handleSelectBudget(budget.id)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                          </td>
                        )}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                              {budget.budget_type === "CAPEX" ? <Calendar className="w-3.5 h-3.5 text-blue-600" /> : <Server className="w-3.5 h-3.5 text-blue-600" />}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm max-w-[180px] truncate">{budget.budget_name}</div>
                              {budget.description && <div className="text-xs text-gray-400 max-w-[180px] truncate">{budget.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${budget.budget_type === "CAPEX" ? "bg-[#1e3a5f] text-white" : "bg-blue-100 text-blue-700"}`}>
                            {budget.budget_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{budget.budget_code || "—"}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{formatBudgetCurrency(budget.total_amount, budget.currency)}</td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-yellow-600">{formatBudgetCurrency(budget.reserved_amount, budget.currency)}</td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-blue-600">{formatBudgetCurrency(budget.used_amount, budget.currency)}</td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-emerald-600">{formatBudgetCurrency(budget.remaining_amount, budget.currency)}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-600">{budget.department_name}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{budget.budget_owner || "—"}</td>
                        <td className="px-4 py-3 text-center text-xs font-medium text-gray-700">{budget.fiscal_year}</td>
                        <td className="px-4 py-3 text-center">
                          {budget.is_active
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full"><CheckCircle className="w-3 h-3" />Active</span>
                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full"><XCircle className="w-3 h-3" />Inactive</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleViewDetails(budget)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleEditClick(budget.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteClick(budget)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredBudgets.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">Showing {filteredBudgets.length} of {budgets.length} budgets</span>
              {selectMode && <span className="text-xs font-medium text-gray-500">{selectedBudgets.length} selected</span>}
            </div>
          )}
        </div>
      </div>
    </LayoutDashboard>
  );
}