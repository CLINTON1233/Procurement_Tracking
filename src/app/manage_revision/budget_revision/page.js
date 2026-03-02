"use client";

import { useState, useEffect, useMemo } from "react";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  Search, RefreshCw, RotateCcw, Eye, Calendar, DollarSign,
  ArrowUp, ArrowDown, FileText, Clock, Layers,
  Grid, List as ListIcon, Server, Trash2, TrendingDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { formatTableCurrency } from "@/utils/currencyFormatter";
import { showDeleteRevisionModal, showDeleteMultipleRevisionsModal } from "@/components/modals/BudgetRevisionModals";
import Link from "next/link";

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
  return String(n);
};

export default function BudgetRevisionPage() {
  const [revisions, setRevisions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sorting, setSorting] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [selectedRevisions, setSelectedRevisions] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const [stats, setStats] = useState({
    total: 0, totalReduction: 0, averageReduction: 0,
    capexRevisions: 0, opexRevisions: 0,
  });

  useEffect(() => { fetchData(); fetchDepartments(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revisionsData, requestsData, budgetsData] = await Promise.all([
        budgetService.getAllRevisions(),
        budgetService.getAllRequests(),
        budgetService.getAllBudgets(),
      ]);
      setRevisions(revisionsData);
      setRequests(requestsData);
      setBudgets(budgetsData);
      calculateStats(revisionsData, budgetsData);
    } catch (error) {
      Swal.fire({ title: "Error!", text: "Failed to fetch revision data", icon: "error", confirmButtonColor: "#1e40af" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await budgetService.getAllDepartments();
      setDepartments(data);
    } catch {}
  };

  const calculateStats = (revisionsData, budgetsData) => {
    const total = revisionsData.length;
    const totalReduction = revisionsData.reduce((s, r) => s + (Number(r.original_amount) - Number(r.new_amount)), 0);
    setStats({
      total,
      totalReduction,
      averageReduction: total > 0 ? totalReduction / total : 0,
      capexRevisions: revisionsData.filter(r => budgetsData.find(b => b.id === r.budget_id)?.budget_type === "CAPEX").length,
      opexRevisions: revisionsData.filter(r => budgetsData.find(b => b.id === r.budget_id)?.budget_type === "OPEX").length,
    });
  };

  const handleDeleteRevision = (revision) => {
    showDeleteRevisionModal({
      revision,
      requestNo: getRequestNo(revision.request_id),
      budgetName: getBudgetName(revision.budget_id),
      onConfirm: async () => {
        try {
          const newRevisions = revisions.filter(r => r.id !== revision.id);
          setRevisions(newRevisions);
          calculateStats(newRevisions, budgets);
          Swal.fire({ title: "Deleted!", text: "Revision deleted successfully", icon: "success", timer: 1500, showConfirmButton: false });
        } catch (error) {
          Swal.fire({ title: "Error!", text: error.message || "Failed to delete", icon: "error", confirmButtonColor: "#1e40af" });
        }
      },
    });
  };

  const toggleSelectMode = () => { setSelectMode(!selectMode); setSelectedRevisions([]); setSelectAll(false); };
  const handleSelectRevision = (id) => setSelectedRevisions(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const handleSelectAll = () => { if (selectAll) setSelectedRevisions([]); else setSelectedRevisions(filteredRevisions.map(r => r.id)); setSelectAll(!selectAll); };

  const handleBulkDelete = () => {
    if (!selectedRevisions.length) return Swal.fire({ title: "No Selection", text: "Please select at least one revision", icon: "warning", confirmButtonColor: "#1e40af" });
    const selectedData = revisions.filter(r => selectedRevisions.includes(r.id));
    showDeleteMultipleRevisionsModal({
      revisions: selectedData,
      requestNos: selectedData.map(r => getRequestNo(r.request_id)),
      budgetNames: selectedData.map(r => getBudgetName(r.budget_id)),
      onConfirm: async () => {
        setDeleting(true);
        try {
          const newRevisions = revisions.filter(r => !selectedRevisions.includes(r.id));
          setRevisions(newRevisions);
          calculateStats(newRevisions, budgets);
          setSelectedRevisions([]); setSelectAll(false); setSelectMode(false);
          Swal.fire({ title: "Deleted!", text: `${selectedRevisions.length} revision(s) deleted`, icon: "success", timer: 1500, showConfirmButton: false });
        } catch {
          Swal.fire({ title: "Error!", text: "Failed to delete revisions", icon: "error", confirmButtonColor: "#1e40af" });
        } finally { setDeleting(false); }
      },
    });
  };

  const formatDate = (d) => {
    if (!d) return "-";
    try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return "-"; }
  };

  const getRequestNo = (id) => requests.find(r => r.id === id)?.request_no || `ID: ${id}`;
  const getBudgetName = (id) => budgets.find(b => b.id === id)?.budget_name || `ID: ${id}`;
  const getBudgetType = (id) => budgets.find(b => b.id === id)?.budget_type || "Unknown";
  const getBudgetDepartment = (id) => budgets.find(b => b.id === id)?.department_name || "Unknown";
  const getBudgetCurrency = (id) => budgets.find(b => b.id === id)?.currency || "IDR";
  const formatBudgetCurrency = (amount, code) => formatTableCurrency(amount, code);

  const uniqueDepartments = useMemo(() => [...new Set(budgets.map(b => b.department_name))].filter(Boolean), [budgets]);

  const filteredRevisions = useMemo(() => {
    let filtered = revisions.filter(revision => {
      const req = requests.find(r => r.id === revision.request_id);
      const bud = budgets.find(b => b.id === revision.budget_id);
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm ||
        (req?.request_no || "").toLowerCase().includes(q) ||
        (bud?.budget_name || "").toLowerCase().includes(q) ||
        (revision.reason || "").toLowerCase().includes(q) ||
        (bud?.budget_owner || "").toLowerCase().includes(q);
      const matchType = typeFilter === "all" || bud?.budget_type === typeFilter;
      const matchDept = departmentFilter === "all" || bud?.department_name === departmentFilter;
      return matchSearch && matchType && matchDept;
    });
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      filtered.sort((a, b) => {
        let av = a[id], bv = b[id];
        if (["original_amount", "new_amount"].includes(id)) { av = Number(av || 0); bv = Number(bv || 0); }
        if (id === "created_at") { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
        if (id === "budget_name") { av = getBudgetName(a.budget_id); bv = getBudgetName(b.budget_id); }
        if (id === "budget_type") { av = getBudgetType(a.budget_id); bv = getBudgetType(b.budget_id); }
        if (id === "department") { av = getBudgetDepartment(a.budget_id); bv = getBudgetDepartment(b.budget_id); }
        return av < bv ? (desc ? 1 : -1) : av > bv ? (desc ? -1 : 1) : 0;
      });
    }
    return filtered;
  }, [revisions, requests, budgets, searchTerm, sorting, typeFilter, departmentFilter]);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const capexPct = stats.total > 0 ? (stats.capexRevisions / stats.total) * 100 : 0;
  const opexPct = stats.total > 0 ? (stats.opexRevisions / stats.total) * 100 : 0;

  const deptChartData = useMemo(() => {
    const map = new Map();
    revisions.forEach(r => {
      const d = getBudgetDepartment(r.budget_id);
      const reduction = Number(r.original_amount) - Number(r.new_amount);
      map.set(d, (map.get(d) || 0) + reduction);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value / 1e6) }))
      .sort((a, b) => b.value - a.value).slice(0, 7);
  }, [revisions, budgets]);

  const pieData = [
    { name: "CAPEX", value: stats.capexRevisions },
    { name: "OPEX", value: stats.opexRevisions },
  ];
  const PIE_COLORS = ["#1e3a5f", "#2563eb"];

  // Avg reduction pct across all revisions
  const avgReductionPct = useMemo(() => {
    if (!revisions.length) return 0;
    const total = revisions.reduce((s, r) => {
      const orig = Number(r.original_amount);
      if (!orig) return s;
      return s + ((Number(r.original_amount) - Number(r.new_amount)) / orig) * 100;
    }, 0);
    return total / revisions.length;
  }, [revisions]);

  const showDetailModal = (revision) => {
    const reductionAmount = Number(revision.original_amount) - Number(revision.new_amount);
    const reductionPercent = ((reductionAmount / Number(revision.original_amount)) * 100).toFixed(1);
    const budgetType = getBudgetType(revision.budget_id);
    const currency = getBudgetCurrency(revision.budget_id);
    Swal.fire({
      title: "Revision Details",
      html: `
        <div class="text-left space-y-3">
          <p><strong>Request:</strong> ${getRequestNo(revision.request_id)}</p>
          <p><strong>Budget:</strong> ${getBudgetName(revision.budget_id)}</p>
          <p><strong>Department:</strong> ${getBudgetDepartment(revision.budget_id)}</p>
          <p><strong>Type:</strong> ${budgetType}</p>
          <p style="background-color:#dbeafe;padding:8px;border-radius:6px;border-left:4px solid #3b82f6"><strong style="color:#1e40af">Original Amount:</strong> <span style="color:#1e40af;font-weight:bold">${formatBudgetCurrency(revision.original_amount, currency)}</span></p>
          <p style="background-color:#dcfce7;padding:8px;border-radius:6px;border-left:4px solid #22c55e"><strong style="color:#166534">New Amount:</strong> <span style="color:#166534;font-weight:bold">${formatBudgetCurrency(revision.new_amount, currency)}</span></p>
          <p style="background-color:#fed7aa;padding:8px;border-radius:6px;border-left:4px solid #f97316"><strong style="color:#92400e">Reduction:</strong> <span style="color:#92400e;font-weight:bold">${reductionPercent}% (${formatBudgetCurrency(reductionAmount, currency)})</span></p>
          <p><strong>Reason:</strong> ${revision.reason}</p>
          <p><strong>Date:</strong> ${formatDate(revision.created_at)}</p>
        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: "#2563eb",
    });
  };

  if (loading) {
    return (
      <LayoutDashboard activeMenu={4}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={4}>
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
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
                   <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Budget Revision History</h1>
              <span className="period-badge">CAPEX / OPEX — {new Date().getFullYear()}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Track all budget revisions and amount changes</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <Link href="/manage_request/budget_request_list"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
              <FileText className="w-4 h-4" />New Request
            </Link>
          </div>
        </div>

        {/* ── Row 1: 4 Donut KPIs ── */}
        <div className="card p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-gray-100">
            <div className="donut-card">
              <h4>CAPEX Revisions</h4>
              <InlineDonut pct={capexPct} color="#1e3a5f" size={110} stroke={13} />
              <p className="text-xs text-gray-500 mt-3 text-center">{stats.capexRevisions} of {stats.total} total</p>
            </div>
            <div className="donut-card">
              <h4>OPEX Revisions</h4>
              <InlineDonut pct={opexPct} color="#2563eb" size={110} stroke={13} />
              <p className="text-xs text-gray-500 mt-3 text-center">{stats.opexRevisions} of {stats.total} total</p>
            </div>
            <div className="donut-card">
              <h4>Avg Reduction %</h4>
              <InlineDonut pct={Math.min(avgReductionPct, 100)} color="#ef4444" size={110} stroke={13} />
              <p className="text-xs text-gray-500 mt-3 text-center">Avg per revision</p>
            </div>
            <div className="donut-card">
              <h4>Total Revisions</h4>
              <div className="relative inline-flex items-center justify-center" style={{ width: 110, height: 110 }}>
                <svg width={110} height={110} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                  <circle cx={55} cy={55} r={42} fill="none" stroke="#E5E7EB" strokeWidth={13} />
                  <circle cx={55} cy={55} r={42} fill="none" stroke="#10b981" strokeWidth={13}
                    strokeDasharray={2 * Math.PI * 42} strokeDashoffset={0} strokeLinecap="round" />
                </svg>
                <span className="text-2xl font-bold text-gray-800 z-10">{stats.total}</span>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">{stats.capexRevisions} CAPEX • {stats.opexRevisions} OPEX</p>
            </div>
          </div>
        </div>

        {/* ── Row 2: Charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Bar chart: reduction by dept */}
          <div className="card p-5 md:col-span-3">
            <p className="section-title flex items-center gap-2">
              <span className="bullet-dot bg-red-600" />Budget Reduction by Department (IDR Jt)
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                  tickFormatter={v => v.length > 8 ? v.slice(0, 8) + "…" : v} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`${v}M IDR`, "Reduction"]} />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution panel */}
          <div className="card p-5 md:col-span-2 space-y-4">
            <p className="section-title">Revision Distribution</p>

            {/* Type pie */}
            <div className="flex items-center gap-4">
              <PieChart width={80} height={80}>
                <Pie data={pieData} cx={35} cy={35} innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
              </PieChart>
              <div className="text-xs text-gray-500 space-y-1.5">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1e3a5f] inline-block" /> CAPEX: {stats.capexRevisions}</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> OPEX: {stats.opexRevisions}</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Total: {stats.total}</div>
              </div>
            </div>

            {/* CAPEX vs OPEX bar */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">CAPEX vs OPEX Split</p>
                <StackedBar segments={[
                  { pct: Math.max(Math.round(capexPct), 1), color: "#1e3a5f" },
                  { pct: Math.max(Math.round(opexPct), 1), color: "#2563eb" },
                ]} />
                <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                  <span>● CAPEX</span><span>● OPEX</span>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-red-600">{fmtCompact(stats.totalReduction)}</div>
                  <div className="text-xs text-red-400">Total Reduction</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">{fmtCompact(stats.averageReduction)}</div>
                  <div className="text-xs text-orange-400">Avg Reduction</div>
                </div>
                <div className="bg-[#1e3a5f]/10 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-[#1e3a5f]">{stats.capexRevisions}</div>
                  <div className="text-xs text-[#1e3a5f]/60">CAPEX Rev.</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-blue-700">{stats.opexRevisions}</div>
                  <div className="text-xs text-blue-400">OPEX Rev.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Revision List ── */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  <ListIcon className="w-4 h-4 text-blue-600" />
                  Revision List
                  <span className="ml-2 px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">{revisions.length}</span>
                </h3>

                <div className="flex flex-wrap items-center gap-2">
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
                      {selectedRevisions.length > 0 && (
                        <button onClick={handleBulkDelete} disabled={deleting}
                          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50">
                          <Trash2 className="w-3.5 h-3.5" />Delete ({selectedRevisions.length})
                        </button>
                      )}
                    </>
                  )}

                  {/* View toggle */}
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
                  <input type="text" placeholder="Search request no, budget name, reason, owner..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                </div>

                {/* Type filter chips */}
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
            {revisions.length === 0 ? (
              <div className="py-16 text-center">
                <RotateCcw className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-gray-700 font-medium mb-1">No revisions available</h3>
                <p className="text-gray-400 text-sm">Revisions will appear here when budgets are revised</p>
              </div>
            ) : filteredRevisions.length === 0 ? (
              <div className="py-16 text-center">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-gray-700 font-medium mb-1">No matching revisions</h3>
                <p className="text-gray-400 text-sm mb-5">Try adjusting your filters</p>
                <button onClick={() => { setSearchTerm(""); setTypeFilter("all"); setDepartmentFilter("all"); }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs inline-flex items-center gap-2 hover:bg-gray-200">
                  <RefreshCw className="w-3.5 h-3.5" />Clear Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredRevisions.map(revision => {
                  const reductionAmount = Number(revision.original_amount) - Number(revision.new_amount);
                  const reductionPercent = ((reductionAmount / Number(revision.original_amount)) * 100).toFixed(1);
                  const budgetType = getBudgetType(revision.budget_id);
                  const currency = getBudgetCurrency(revision.budget_id);
                  return (
                    <div key={revision.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all bg-white relative">
                      {selectMode && (
                        <input type="checkbox" checked={selectedRevisions.includes(revision.id)} onChange={() => handleSelectRevision(revision.id)}
                          className="absolute top-3 left-3 w-4 h-4 text-blue-600 rounded border-gray-300" />
                      )}
                      <div className={`flex items-center gap-2 mb-3 ${selectMode ? "ml-6" : ""}`}>
                        <div className="p-2 rounded-lg bg-blue-50">
                          {budgetType === "CAPEX" ? <Calendar className="w-4 h-4 text-blue-600" /> : <Server className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate text-sm">{getBudgetName(revision.budget_id)}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                            {getRequestNo(revision.request_id)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-gray-400">Department</span><span className="font-medium text-gray-700">{getBudgetDepartment(revision.budget_id)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Type</span>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${budgetType === "CAPEX" ? "bg-[#1e3a5f] text-white" : "bg-blue-100 text-blue-700"}`}>{budgetType}</span>
                        </div>
                        <div className="flex justify-between"><span className="text-gray-400">Original</span><span className="font-medium text-gray-900">{formatBudgetCurrency(revision.original_amount, currency)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">New Amount</span><span className="font-medium text-blue-600">{formatBudgetCurrency(revision.new_amount, currency)}</span></div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Reduction</span>
                          <div className="text-right">
                            <span className="font-semibold text-red-600">{reductionPercent}%</span>
                            <span className="text-gray-400 ml-1">({fmtCompact(reductionAmount)})</span>
                          </div>
                        </div>
                        <div className="pt-1.5 border-t border-gray-100">
                          <p className="text-gray-400 mb-1">Reason</p>
                          <p className="text-gray-700 line-clamp-2">{revision.reason}</p>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-100">
                          <span className="text-gray-400">Date</span>
                          <span className="font-medium text-gray-700">{formatDate(revision.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-0.5 mt-3 pt-2 border-t border-gray-100">
                        <button onClick={() => showDetailModal(revision)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteRevision(revision)} disabled={deleting} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
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
                        <th className="px-4 py-3 text-center">
                          <input type="checkbox" checked={selectAll} onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                        </th>
                      )}
                      {[
                        { label: "Date", id: "created_at", align: "left" },
                        { label: "Request No", id: "budget_name", align: "left" },
                        { label: "Budget", id: null, align: "left" },
                        { label: "Type", id: "budget_type", align: "center" },
                        { label: "Department", id: "department", align: "center" },
                        { label: "Original", id: "original_amount", align: "center" },
                        { label: "New Amount", id: "new_amount", align: "center" },
                        { label: "Reduction", id: null, align: "center" },
                        { label: "Reason", id: null, align: "left" },
                        { label: "Actions", id: null, align: "center" },
                      ].map((col, i) => (
                        <th key={i}
                          onClick={col.id ? () => setSorting([{ id: col.id, desc: sorting[0]?.id === col.id ? !sorting[0].desc : false }]) : undefined}
                          className={`px-4 py-3 text-${col.align} text-xs font-semibold text-gray-500 uppercase tracking-wide ${col.id ? "cursor-pointer hover:text-gray-700" : ""}`}>
                          <div className={`flex items-center ${col.align === "center" ? "justify-center" : ""} gap-1`}>
                            {col.label}
                            {col.id && sorting[0]?.id === col.id ? (sorting[0].desc ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />) : null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRevisions.map(revision => {
                      const reductionAmount = Number(revision.original_amount) - Number(revision.new_amount);
                      const reductionPercent = ((reductionAmount / Number(revision.original_amount)) * 100).toFixed(1);
                      const budgetType = getBudgetType(revision.budget_id);
                      const currency = getBudgetCurrency(revision.budget_id);
                      return (
                        <tr key={revision.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          {selectMode && (
                            <td className="px-4 py-3 text-center">
                              <input type="checkbox" checked={selectedRevisions.includes(revision.id)} onChange={() => handleSelectRevision(revision.id)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {formatDate(revision.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900 text-sm">{getRequestNo(revision.request_id)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                {budgetType === "CAPEX" ? <Calendar className="w-3.5 h-3.5 text-blue-600" /> : <Server className="w-3.5 h-3.5 text-blue-600" />}
                              </div>
                              <span className="text-sm text-gray-700 max-w-[150px] truncate">{getBudgetName(revision.budget_id)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${budgetType === "CAPEX" ? "bg-[#1e3a5f] text-white" : "bg-blue-100 text-blue-700"}`}>
                              {budgetType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">{getBudgetDepartment(revision.budget_id)}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{formatBudgetCurrency(revision.original_amount, currency)}</td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-blue-600">{formatBudgetCurrency(revision.new_amount, currency)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                              <TrendingDown className="w-2.5 h-2.5" />{reductionPercent}%
                            </span>
                            <div className="text-xs text-gray-400 mt-0.5">({fmtCompact(reductionAmount)})</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate" title={revision.reason}>{revision.reason}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => showDetailModal(revision)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteRevision(revision)} disabled={deleting} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
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

          {/* Footer */}
          {filteredRevisions.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs text-gray-500">Showing {filteredRevisions.length} of {revisions.length} revisions</span>
              <span className="text-xs font-semibold text-red-600">Total Reduction: {formatBudgetCurrency(stats.totalReduction, "IDR")}</span>
              {selectMode && <span className="text-xs font-medium text-gray-500">{selectedRevisions.length} selected</span>}
            </div>
          )}
        </div>
      </div>
    </LayoutDashboard>
  );
}