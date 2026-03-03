"use client";

import { useState, useEffect } from "react";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  Wallet, Clock, CheckCircle, DollarSign, TrendingUp, TrendingDown,
  FileText, Calendar, Building, BarChart3, Eye, AlertTriangle, Home,
  Plus, Users, Briefcase, Layers, RotateCcw, Package, Server, Send,
  XCircle, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";

// ─── Inline Donut ─────────────────────────────────────────────────────────────
const InlineDonut = ({ pct, color, size = 110, stroke = 12 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="text-xl font-bold text-gray-800 z-10">{pct.toFixed(0)}%</span>
    </div>
  );
};

// ─── Horizontal Stacked Bar ───────────────────────────────────────────────────
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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [recentBudgets, setRecentBudgets] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentRevisions, setRecentRevisions] = useState([]);
  const [departmentChartData, setDepartmentChartData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  const [stats, setStats] = useState({
    total_budgets: 0, total_amount: 0, total_remaining: 0, total_reserved: 0, total_used: 0,
    capex_count: 0, opex_count: 0, active_budgets: 0, budget_used_percentage: 0,
    total_requests: 0, draft_requests: 0, submitted_requests: 0, approved_requests: 0,
    rejected_requests: 0, waiting_requests: 0, item_requests: 0, service_requests: 0,
    total_request_amount: 0, total_revisions: 0, total_reduction: 0,
    capex_revisions: 0, opex_revisions: 0,
  });

  useEffect(() => { fetchAllDashboardData(); }, []);

  const fetchAllDashboardData = async () => {
    setLoading(true);
    try {
      const [budgetsData, requestsData, revisionsData, deptsData] = await Promise.all([
        budgetService.getAllBudgets(),
        budgetService.getAllRequests(),
        budgetService.getAllRevisions(),
        departmentService.getAllDepartments(),
      ]);
      setBudgets(budgetsData); setRequests(requestsData);
      setRevisions(revisionsData); setDepartments(deptsData);
      calculateAllStats(budgetsData, requestsData, revisionsData);
      setRecentItems(budgetsData, requestsData, revisionsData);
      prepareChartData(budgetsData, requestsData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const calculateAllStats = (b, r, rv) => {
    const totalAmount = b.reduce((s, x) => s + Number(x.total_amount || 0), 0);
    const totalRemaining = b.reduce((s, x) => s + Number(x.remaining_amount || 0), 0);
    const totalReserved = b.reduce((s, x) => s + Number(x.reserved_amount || 0), 0);
    const totalUsed = b.reduce((s, x) => s + Number(x.used_amount || 0), 0);
    const totalRequestAmount = r.reduce((s, x) => s + Number(x.estimated_total_idr || 0), 0);
    const totalReduction = rv.reduce((s, x) => s + (Number(x.original_amount) - Number(x.new_amount)), 0);
    setStats({
      total_budgets: b.length, total_amount: totalAmount, total_remaining: totalRemaining,
      total_reserved: totalReserved, total_used: totalUsed,
      capex_count: b.filter(x => x.budget_type === "CAPEX").length,
      opex_count: b.filter(x => x.budget_type === "OPEX").length,
      active_budgets: b.filter(x => x.is_active).length,
      budget_used_percentage: totalAmount > 0 ? (totalUsed / totalAmount) * 100 : 0,
      total_requests: r.length,
      draft_requests: r.filter(x => x.status === "DRAFT").length,
      submitted_requests: r.filter(x => x.status === "SUBMITTED").length,
      approved_requests: r.filter(x => x.status === "BUDGET_APPROVED").length,
      rejected_requests: r.filter(x => x.status === "BUDGET_REJECTED").length,
      waiting_requests: r.filter(x => x.status === "WAITING_SR_MR").length,
      item_requests: r.filter(x => x.request_type === "ITEM").length,
      service_requests: r.filter(x => x.request_type === "SERVICE").length,
      total_request_amount: totalRequestAmount,
      total_revisions: rv.length,
      total_reduction: totalReduction,
      capex_revisions: rv.filter(x => b.find(bd => bd.id === x.budget_id)?.budget_type === "CAPEX").length,
      opex_revisions: rv.filter(x => b.find(bd => bd.id === x.budget_id)?.budget_type === "OPEX").length,
    });
  };

  const setRecentItems = (b, r, rv) => {
    setRecentBudgets([...b].sort((a, x) => new Date(x.created_at) - new Date(a.created_at)).slice(0, 5));
    setRecentRequests([...r].sort((a, x) => new Date(x.created_at) - new Date(a.created_at)).slice(0, 5));
    setRecentRevisions([...rv].sort((a, x) => new Date(x.created_at) - new Date(a.created_at)).slice(0, 5));
  };

  const prepareChartData = (b, r) => {
    const deptMap = new Map();
    b.forEach(bd => {
      const d = bd.department_name; const v = Number(bd.total_amount || 0);
      deptMap.set(d, (deptMap.get(d) || 0) + v);
    });
    setDepartmentChartData(
      Array.from(deptMap.entries()).map(([name, value]) => ({ name, value: Math.round(value / 1e6) }))
        .sort((a, x) => x.value - a.value).slice(0, 6)
    );
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthly = months.map((m, i) => {
      const monthReqs = r.filter(rq => new Date(rq.created_at).getMonth() === i);
      const approved = monthReqs.filter(rq => rq.status === "BUDGET_APPROVED")
        .reduce((s, rq) => s + Number(rq.estimated_total_idr || 0), 0);
      const total = monthReqs.reduce((s, rq) => s + Number(rq.estimated_total_idr || 0), 0);
      return { month: m, Total: Math.round(total / 1e6), Approved: Math.round(approved / 1e6) };
    });
    setMonthlyData(monthly);
  };

  const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
  const fmtCompact = (n) => {
    if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return (n || 0).toString();
  };
  const fmtDate = (d) => {
    if (!d) return "-";
    try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return "-"; }
  };

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: { bg: "#f3f4f6", text: "#6b7280", label: "Draft" },
      SUBMITTED: { bg: "#dbeafe", text: "#1d4ed8", label: "Submitted" },
      BUDGET_APPROVED: { bg: "#d1fae5", text: "#065f46", label: "Approved" },
      BUDGET_REJECTED: { bg: "#fee2e2", text: "#b91c1c", label: "Rejected" },
      WAITING_SR_MR: { bg: "#ede9fe", text: "#6d28d9", label: "Waiting SR/MR" },
    };
    return map[status] || { bg: "#f3f4f6", text: "#6b7280", label: status };
  };

  const opexTotal = stats.total_requests > 0 ? stats.total_requests : 1;
  const draftPct = Math.round((stats.draft_requests / opexTotal) * 100);
  const submittedPct = Math.round((stats.submitted_requests / opexTotal) * 100);
  const approvedPct = Math.round((stats.approved_requests / opexTotal) * 100);
  const rejectedPct = Math.max(0, 100 - draftPct - submittedPct - approvedPct);

  const remainingPct = stats.total_amount > 0 ? (stats.total_remaining / stats.total_amount) * 100 : 0;
  const usedPct = stats.budget_used_percentage;
  const reservedPct = stats.total_amount > 0 ? (stats.total_reserved / stats.total_amount) * 100 : 0;
  const approvalRate = stats.total_requests > 0 ? (stats.approved_requests / stats.total_requests) * 100 : 0;
  const capexRatio = stats.total_budgets > 0 ? (stats.capex_count / stats.total_budgets) * 100 : 0;

  const incomeRows = [
    { label: "Total Budget", value: stats.total_amount },
    { label: "Used Amount", value: stats.total_used },
    { label: "Reserved Amount", value: stats.total_reserved },
    { label: "Remaining Budget", value: stats.total_remaining, bold: true, color: "#059669" },
    { label: "Total Requests", value: stats.total_request_amount },
    { label: "  • Draft", value: stats.draft_requests, isCount: true },
    { label: "  • Submitted", value: stats.submitted_requests, isCount: true },
    { label: "  • Approved", value: stats.approved_requests, isCount: true, color: "#059669" },
    { label: "  • Rejected", value: stats.rejected_requests, isCount: true, color: "#dc2626" },
    { label: "  • Waiting", value: stats.waiting_requests, isCount: true, color: "#7c3aed" },
    { label: "Total Revisions", value: stats.total_revisions, isCount: true },
    { label: "Budget Reduction", value: stats.total_reduction, bold: true, color: "#dc2626" },
    { label: "Active Budgets", value: stats.active_budgets, isCount: true, bold: true, color: "#1d4ed8" },
  ];

  // Pie data for budget distribution
  const pieData = [
    { name: "CAPEX", value: stats.capex_count },
    { name: "OPEX", value: stats.opex_count },
  ];
  const PIE_COLORS = ["#1e3a5f", "#2563eb"];

  if (loading) {
    return (
      <LayoutDashboard activeMenu={0}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={0}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .bm-root { font-family: 'DM Sans', sans-serif; }
        .bm-root .mono { font-family: 'DM Mono', monospace; }
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

      <div className="bm-root space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Budget Management Dashboard</h1>
              <span className="period-badge">Period — {new Date().getFullYear()}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Monitor CAPEX/OPEX budgets, requests & revisions</p>
          </div>
          {/* <button
            onClick={() => { setRefreshing(true); fetchAllDashboardData(); }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button> */}
        </div>

        {/* ── Main Layout ── */}
        <div className="flex flex-col xl:flex-row gap-5">

          {/* ══ LEFT COLUMN ══ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── Row 1: 4 Donut KPIs ── */}
            <div className="card">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
                {[
                  { title: "Budget Used", pct: usedPct, color: "#2563eb", sub: `${fmtCompact(stats.total_used)} / ${fmtCompact(stats.total_amount)}` },
                  { title: "CAPEX Ratio", pct: capexRatio, color: "#1e3a5f", sub: `${stats.capex_count} CAPEX • ${stats.opex_count} OPEX` },
                  { title: "Approval Rate", pct: approvalRate, color: "#10b981", sub: `${stats.approved_requests} of ${stats.total_requests} requests` },
                  { title: "Budget Health", pct: remainingPct, color: "#f59e0b", sub: `${fmtCompact(stats.total_remaining)} remaining` },
                ].map((d, i) => (
                  <div key={i} className="donut-card">
                    <h4>{d.title}</h4>
                    <InlineDonut pct={d.pct} color={d.color} size={window.innerWidth < 640 ? 90 : 110} stroke={13} />
                    <p className="text-xs text-gray-500 mt-3 text-center">{d.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Row 2: Bar Chart + Distribution ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* Bar Chart */}
              <div className="card p-5 lg:col-span-3">
                <p className="section-title flex items-center gap-2">
                  <span className="bullet-dot bg-blue-800" />Budget by Department (IDR Jt)
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={departmentChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                      tickFormatter={v => v?.length > 8 ? v.slice(0, 8) + "…" : v} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                      tickFormatter={v => fmtCompact(v * 1e6)} />
                    <Tooltip formatter={(v) => [fmtCompact(v * 1e6), "Amount"]} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Bar dataKey="value" fill="#1e3a5f" radius={[5, 5, 0, 0]} barSize={window.innerWidth < 640 ? 18 : 28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stacked Distribution */}
              <div className="card p-5 lg:col-span-2 space-y-4">
                <p className="section-title">Budget Distribution</p>

                {/* Type split pie */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <PieChart width={80} height={80}>
                    <Pie data={pieData} cx={35} cy={35} innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                  <div className="text-xs text-gray-500 space-y-1.5">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1e3a5f]" /> CAPEX: {stats.capex_count}</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> OPEX: {stats.opex_count}</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-400" /> Active: {stats.active_budgets}</div>
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
                    <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-gray-500">
                      <span>● Used</span><span>● Reserved</span><span>● Free</span>
                    </div>
                  </div>

                  {/* Quick summary */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="text-base sm:text-lg font-bold text-blue-700 mono">{fmtCompact(stats.total_used)}</div>
                      <div className="text-xs text-blue-500">Used</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <div className="text-base sm:text-lg font-bold text-emerald-700 mono">{fmtCompact(stats.total_remaining)}</div>
                      <div className="text-xs text-emerald-500">Remaining</div>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-3 text-center">
                      <div className="text-base sm:text-lg font-bold text-yellow-700 mono">{fmtCompact(stats.total_reserved)}</div>
                      <div className="text-xs text-yellow-600">Reserved</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-base sm:text-lg font-bold text-gray-700 mono">{fmtCompact(stats.total_amount)}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Row 3: Monthly Trend + Revision Stats ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* Monthly Trend */}
              <div className="card p-5 lg:col-span-3">
                <p className="section-title flex items-center gap-2">
                  <span className="bullet-dot bg-blue-600" />Monthly Request Trend (IDR Jt)
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => [`${v}M IDR`, ""]} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Line type="monotone" dataKey="Total" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
                    <Line type="monotone" dataKey="Approved" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: "#2563eb" }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 justify-center mt-3">
                  {[["#1e3a5f", "Total"], ["#2563eb", "Approved"]].map(([c, l]) => (
                    <span key={l} className="flex items-center gap-2 text-xs text-gray-500">
                      <span style={{ width: 20, height: 2, background: c }} />{l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Revision & System Stats */}
              <div className="card p-5 lg:col-span-2 space-y-4">
                <p className="section-title">Revision & System Stats</p>

                {/* 4 neutral stat boxes */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Total Revisions", value: stats.total_revisions, sub: `${stats.capex_revisions} CAPEX • ${stats.opex_revisions} OPEX` },
                    { label: "Departments", value: departments.length, sub: "Active departments" },
                    { label: "Active Budgets", value: stats.active_budgets, sub: `of ${stats.total_budgets} total` },
                    { label: "Approval Rate", value: `${approvalRate.toFixed(0)}%`, sub: `${stats.approved_requests} approved` },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                      <div className="text-xl sm:text-2xl font-bold text-gray-800 mono">{s.value}</div>
                      <div className="text-xs font-medium text-gray-600 mt-1">{s.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Budget Reduction Summary */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Budget Reduction Summary</p>
                  {[
                    { label: "Total Reduction", value: fmt(stats.total_reduction), highlight: true },
                    { label: "Avg per Revision", value: fmt(stats.total_revisions > 0 ? stats.total_reduction / stats.total_revisions : 0) },
                    { label: "CAPEX Revisions", value: stats.capex_revisions },
                    { label: "OPEX Revisions", value: stats.opex_revisions },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-2 text-sm border-b border-gray-50 last:border-0">
                      <span className="text-gray-500">{row.label}</span>
                      <span className={`font-bold ${row.highlight ? "text-red-600" : "text-gray-800"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Recent Budgets Table ── */}
            <div className="card overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600" /> Recent Budgets
                </h3>
                <Link href="/manage_budget/budget_management" className="text-sm text-blue-600 font-medium hover:text-blue-700">
                  View All →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Budget Name", "Type", "Department", "Total", "Remaining", "Status"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentBudgets.map(b => (
                      <tr key={b.id} onClick={() => router.push("/manage_budget/budget_management")} 
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                              {b.budget_type === "CAPEX" ? <Building className="w-4 h-4 text-blue-600" /> : <Calendar className="w-4 h-4 text-blue-600" />}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{b.budget_name}</div>
                              {b.budget_code && <div className="text-xs text-gray-400">{b.budget_code}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${b.budget_type === "CAPEX" ? "bg-[#1e3a5f] text-white" : "bg-blue-100 text-blue-700"}`}>
                            {b.budget_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{b.department_name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 mono">{fmt(b.total_amount)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-600 mono">{fmt(b.remaining_amount)}</td>
                        <td className="px-4 py-3">
                          {b.is_active
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full"><CheckCircle className="w-3 h-3" />Active</span>
                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full"><AlertTriangle className="w-3 h-3" />Inactive</span>}
                        </td>
                      </tr>
                    ))}
                    {recentBudgets.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">No budgets found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Recent Requests Table ── */}
            <div className="card overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Recent Requests
                </h3>
                <Link href="/manage_request/budget_request_list" className="text-sm text-blue-600 font-medium hover:text-blue-700">
                  View All →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Request No", "Requester", "Item", "Type", "Amount", "Status", "Date"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map(req => {
                      const s = getStatusBadge(req.status);
                      return (
                        <tr key={req.id} onClick={() => router.push("/manage_request/budget_request_list")} 
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{req.request_no}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{req.requester_name}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 max-w-[150px] truncate">{req.item_name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${req.request_type === "ITEM" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                              {req.request_type === "ITEM" ? <Package className="w-3 h-3" /> : <Server className="w-3 h-3" />}
                              {req.request_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-blue-600 mono">{fmt(req.estimated_total)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(req.created_at)}</td>
                        </tr>
                      );
                    })}
                    {recentRequests.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-sm">No requests found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Recent Revisions Table ── */}
            <div className="card overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-600" /> Recent Revisions
                </h3>
                <Link href="/manage_revision/budget_revision" className="text-sm text-blue-600 font-medium hover:text-blue-700">
                  View All →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Budget", "Request", "Original", "New", "Reduction", "Reason", "Date"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentRevisions.map(rv => {
                      const bd = budgets.find(b => b.id === rv.budget_id);
                      const rq = requests.find(r => r.id === rv.request_id);
                      const reduction = Number(rv.original_amount) - Number(rv.new_amount);
                      const pct = Number(rv.original_amount) > 0 ? ((reduction / Number(rv.original_amount)) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={rv.id} onClick={() => router.push("/manage_revision/budget_revision")} 
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900 text-sm">{bd?.budget_name || `ID: ${rv.budget_id}`}</div>
                            <div className="text-xs text-gray-400">{bd?.budget_type}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">{rq?.request_no || `ID: ${rv.request_id}`}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 mono">{fmt(rv.original_amount)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-blue-600 mono">{fmt(rv.new_amount)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-50 rounded-full">
                              <TrendingDown className="w-3 h-3" />{pct}%
                            </span>
                            <div className="text-xs text-gray-400 mt-0.5">{fmtCompact(reduction)}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 max-w-[150px] truncate">{rv.reason}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(rv.created_at)}</td>
                        </tr>
                      );
                    })}
                    {recentRevisions.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-sm">No revisions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ══ RIGHT COLUMN — Budget Statement ══ */}
          <div className="w-full xl:w-80 flex-shrink-0">
            <div className="card sticky top-4 overflow-hidden">
              {/* Header */}
              <div className="bg-[#1e3a5f] text-white text-center py-3 px-4 font-bold text-sm uppercase tracking-wide">
                Budget Statement
              </div>

              {/* Rows */}
              <div className="p-4">
                {incomeRows.map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2 text-sm border-b border-gray-50 last:border-0">
                    <span className={`${row.bold ? "font-semibold text-gray-900" : "text-gray-500"} flex items-center gap-1.5`}>
                      {row.isCount && <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                      {row.label}
                    </span>
                    <span className={`font-bold ${row.color || "text-gray-900"}`}>
                      {row.isCount ? row.value : fmtCompact(row.value)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</p>
                <div className="space-y-1">
                  {[
                    { label: "Add Budget", href: "/manage_budget/create_budget", icon: Plus, color: "#2563eb", bg: "#dbeafe" },
                    { label: "View Budgets", href: "/budget_management", icon: Wallet, color: "#059669", bg: "#d1fae5" },
                    { label: "New Request", href: "/manage_request/request_budget_form", icon: FileText, color: "#7c3aed", bg: "#ede9fe" },
                    { label: "Request List", href: "/request_budget_list", icon: Send, color: "#d97706", bg: "#fef3c7" },
                  ].map((a, i) => (
                    <Link key={i} href={a.href} className="block">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: a.bg }}>
                          <a.icon className="w-4 h-4" style={{ color: a.color }} />
                        </div>
                        <span className="text-sm font-medium text-gray-600">{a.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutDashboard>
  );
}