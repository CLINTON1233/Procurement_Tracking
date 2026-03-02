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
  ResponsiveContainer, LineChart, Line,
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
      <span style={{ fontSize: 22, fontWeight: 700, color: "#111827", zIndex: 1 }}>{pct.toFixed(0)}%</span>
    </div>
  );
};

// ─── Horizontal Stacked Bar ───────────────────────────────────────────────────
const StackedBar = ({ segments }) => (
  <div style={{ display: "flex", borderRadius: 99, overflow: "hidden", height: 28, width: "100%" }}>
    {segments.map((s, i) => (
      <div key={i} style={{ width: `${s.pct}%`, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", transition: "all 0.3s" }}>
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
      Array.from(deptMap.entries()).map(([name, value]) => ({ name, value }))
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

  if (loading) {
    return (
      <LayoutDashboard activeMenu={0}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
        </div>
      </LayoutDashboard>
    );
  }

  /* ── shared inline styles ── */
  const card = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" };
  const sectionTitle = { fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 };
  const tblTh = { padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", background: "#f9fafb", whiteSpace: "nowrap" };
  const tblTd = { padding: "14px 20px", fontSize: 14, color: "#374151", borderBottom: "1px solid #f3f4f6" };
  const badge = (bg, color) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color });

  return (
    <LayoutDashboard activeMenu={0}>
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 14 }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Budget Management Dashboard</h1>
              <span style={{ background: "#1e3a5f", color: "#fff", padding: "4px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                Period — {new Date().getFullYear()}
              </span>
            </div>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Monitor CAPEX/OPEX budgets, requests & revisions</p>
          </div>
          <button
            onClick={() => { setRefreshing(true); fetchAllDashboardData(); }}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#374151", cursor: "pointer" }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ── Main Layout ── */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

          {/* ══ LEFT COLUMN ══ */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── Row 1: 4 Donut KPIs ── */}
            <div style={card}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                {[
                  { title: "Budget Used", pct: usedPct, color: "#2563eb", sub: `${fmtCompact(stats.total_used)} / ${fmtCompact(stats.total_amount)}` },
                  { title: "CAPEX Ratio", pct: capexRatio, color: "#1e3a5f", sub: `${stats.capex_count} CAPEX • ${stats.opex_count} OPEX` },
                  { title: "Approval Rate", pct: approvalRate, color: "#10b981", sub: `${stats.approved_requests} of ${stats.total_requests} requests` },
                  { title: "Budget Health", pct: remainingPct, color: "#f59e0b", sub: `${fmtCompact(stats.total_remaining)} remaining` },
                ].map((d, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 12px 16px", borderRight: i < 3 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", textAlign: "center", marginBottom: 12 }}>{d.title}</div>
                    <InlineDonut pct={d.pct} color={d.color} size={115} stroke={13} />
                    <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 10, textAlign: "center" }}>{d.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Row 2: Bar Chart + Distribution ── */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>

              {/* Bar Chart */}
              <div style={{ ...card, padding: 20 }}>
                <div style={sectionTitle}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1e3a5f", display: "inline-block", flexShrink: 0 }} />
                  Budget by Department
                </div>
                <ResponsiveContainer width="100%" height={195}>
                  <BarChart data={departmentChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                      tickFormatter={v => v.length > 9 ? v.slice(0, 9) + "…" : v} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                      tickFormatter={v => fmtCompact(v)} />
                    <Tooltip formatter={(v) => [fmtCompact(v), "Amount"]} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Bar dataKey="value" fill="#1e3a5f" radius={[5, 5, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stacked Distribution */}
              <div style={{ ...card, padding: 20 }}>
                <div style={sectionTitle}>Request Distribution</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    {
                      label: "By Type",
                      bar: [
                        { pct: stats.total_requests > 0 ? Math.round((stats.item_requests / stats.total_requests) * 100) : 50, color: "#1e3a5f" },
                        { pct: stats.total_requests > 0 ? Math.round((stats.service_requests / stats.total_requests) * 100) : 50, color: "#60a5fa" },
                      ],
                      legend: [{ label: `Item (${stats.item_requests})` }, { label: `Service (${stats.service_requests})` }],
                    },
                    {
                      label: "By Status",
                      bar: [
                        { pct: Math.max(draftPct, 1), color: "#9ca3af" },
                        { pct: Math.max(submittedPct, 1), color: "#2563eb" },
                        { pct: Math.max(approvedPct, 1), color: "#10b981" },
                        { pct: Math.max(rejectedPct, 0), color: "#ef4444" },
                      ],
                      legend: [{ label: `Draft (${stats.draft_requests})` }, { label: `Submitted (${stats.submitted_requests})` }, { label: `Approved (${stats.approved_requests})` }, { label: `Rejected (${stats.rejected_requests})` }],
                      grid: true,
                    },
                    {
                      label: "Budget Allocation",
                      bar: [
                        { pct: Math.max(Math.round(usedPct), 1), color: "#2563eb" },
                        { pct: Math.max(Math.round(reservedPct), 1), color: "#f59e0b" },
                        { pct: Math.max(Math.round(remainingPct), 1), color: "#10b981" },
                      ],
                      legend: [{ label: "Used" }, { label: "Reserved" }, { label: "Free" }],
                    },
                  ].map((section, si) => (
                    <div key={si}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>{section.label}</div>
                      <StackedBar segments={section.bar} />
                      <div style={{ display: section.grid ? "grid" : "flex", gridTemplateColumns: section.grid ? "1fr 1fr" : undefined, justifyContent: !section.grid ? "space-between" : undefined, marginTop: 8, gap: 4, fontSize: 12, color: "#6b7280" }}>
                        {section.legend.map((l, li) => <span key={li}>● {l.label}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Row 3: Monthly Trend + Revision Stats ── */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>

              {/* Monthly Trend */}
              <div style={{ ...card, padding: 20 }}>
                <div style={sectionTitle}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", display: "inline-block", flexShrink: 0 }} />
                  Monthly Request Trend (IDR Jt)
                </div>
                <ResponsiveContainer width="100%" height={185}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => [`${v}M IDR`, ""]} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Line type="monotone" dataKey="Total" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
                    <Line type="monotone" dataKey="Approved" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: "#2563eb" }} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 10 }}>
                  {[["#1e3a5f", "Total"], ["#2563eb", "Approved"]].map(([c, l]) => (
                    <span key={l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280" }}>
                      <span style={{ width: 20, height: 2, background: c, display: "inline-block" }} />{l}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Revision & System Stats — CLEAN, no colorful cards ── */}
              <div style={{ ...card, padding: 20 }}>
                <div style={sectionTitle}>Revision & System Stats</div>

                {/* 4 neutral stat boxes — same style as BudgetManagement overview */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Total Revisions", value: stats.total_revisions, sub: `${stats.capex_revisions} CAPEX • ${stats.opex_revisions} OPEX` },
                    { label: "Departments", value: departments.length, sub: "Active departments" },
                    { label: "Active Budgets", value: stats.active_budgets, sub: `of ${stats.total_budgets} total` },
                    { label: "Approval Rate", value: `${approvalRate.toFixed(0)}%`, sub: `${stats.approved_requests} approved` },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 13, color: "#374151", fontWeight: 600, marginTop: 5 }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Budget Reduction Summary — simple row list */}
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Budget Reduction Summary</div>
                  {[
                    { label: "Total Reduction", value: fmt(stats.total_reduction), highlight: true },
                    { label: "Avg per Revision", value: fmt(stats.total_revisions > 0 ? stats.total_reduction / stats.total_revisions : 0) },
                    { label: "CAPEX Revisions", value: stats.capex_revisions },
                    { label: "OPEX Revisions", value: stats.opex_revisions },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 3 ? "1px solid #f3f4f6" : "none", fontSize: 14 }}>
                      <span style={{ color: "#6b7280" }}>{row.label}</span>
                      <span style={{ fontWeight: 700, color: row.highlight ? "#dc2626" : "#111827" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Recent Budgets Table ── */}
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                  <Wallet style={{ width: 16, height: 16, color: "#2563eb" }} /> Recent Budgets
                </h3>
                <Link href="/budget_management" style={{ fontSize: 14, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>View All →</Link>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Budget Name", "Type", "Department", "Total Amount", "Remaining", "Status"].map(h => (
                        <th key={h} style={tblTh}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentBudgets.map(b => (
                      <tr key={b.id} onClick={() => router.push("/budget_management")} style={{ cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td style={tblTd}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {b.budget_type === "CAPEX" ? <Building style={{ width: 16, height: 16, color: "#2563eb" }} /> : <Calendar style={{ width: 16, height: 16, color: "#2563eb" }} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{b.budget_name}</div>
                              {b.budget_code && <div style={{ fontSize: 12, color: "#9ca3af" }}>{b.budget_code}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={tblTd}>
                          <span style={badge(b.budget_type === "CAPEX" ? "#f3e8ff" : "#d1fae5", b.budget_type === "CAPEX" ? "#7c3aed" : "#065f46")}>
                            {b.budget_type}
                          </span>
                        </td>
                        <td style={{ ...tblTd, color: "#6b7280" }}>{b.department_name}</td>
                        <td style={{ ...tblTd, fontWeight: 700, color: "#111827" }}>{fmt(b.total_amount)}</td>
                        <td style={{ ...tblTd, fontWeight: 700, color: b.remaining_amount < b.total_amount * 0.2 ? "#dc2626" : "#059669" }}>
                          {fmt(b.remaining_amount)}
                        </td>
                        <td style={tblTd}>
                          {b.is_active
                            ? <span style={badge("#d1fae5", "#065f46")}><CheckCircle style={{ width: 12, height: 12 }} />Active</span>
                            : <span style={badge("#f3f4f6", "#6b7280")}><AlertTriangle style={{ width: 12, height: 12 }} />Inactive</span>}
                        </td>
                      </tr>
                    ))}
                    {recentBudgets.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No budgets found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Recent Requests Table ── */}
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                  <FileText style={{ width: 16, height: 16, color: "#2563eb" }} /> Recent Requests
                </h3>
                <Link href="/request_budget_list" style={{ fontSize: 14, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>View All →</Link>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Request No", "Requester", "Item", "Type", "Amount", "Status", "Date"].map(h => (
                        <th key={h} style={tblTh}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map(req => {
                      const s = getStatusBadge(req.status);
                      return (
                        <tr key={req.id} onClick={() => router.push("/request_budget_list")} style={{ cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                          onMouseLeave={e => e.currentTarget.style.background = ""}>
                          <td style={{ ...tblTd, fontWeight: 700, color: "#111827" }}>{req.request_no}</td>
                          <td style={{ ...tblTd, color: "#6b7280" }}>{req.requester_name}</td>
                          <td style={{ ...tblTd, color: "#6b7280", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.item_name}</td>
                          <td style={tblTd}>
                            <span style={badge(req.request_type === "ITEM" ? "#dbeafe" : "#ede9fe", req.request_type === "ITEM" ? "#1d4ed8" : "#6d28d9")}>
                              {req.request_type === "ITEM" ? <Package style={{ width: 12, height: 12 }} /> : <Server style={{ width: 12, height: 12 }} />}
                              {req.request_type}
                            </span>
                          </td>
                          <td style={{ ...tblTd, fontWeight: 700, color: "#1d4ed8" }}>{fmt(req.estimated_total)}</td>
                          <td style={tblTd}>
                            <span style={badge(s.bg, s.text)}>{s.label}</span>
                          </td>
                          <td style={{ ...tblTd, color: "#9ca3af" }}>{fmtDate(req.created_at)}</td>
                        </tr>
                      );
                    })}
                    {recentRequests.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No requests found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Recent Revisions Table ── */}
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                  <RotateCcw style={{ width: 16, height: 16, color: "#2563eb" }} /> Recent Revisions
                </h3>
                <Link href="/revision_list" style={{ fontSize: 14, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>View All →</Link>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Budget", "Request", "Original", "New Amount", "Reduction", "Reason", "Date"].map(h => (
                        <th key={h} style={tblTh}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentRevisions.map(rv => {
                      const bd = budgets.find(b => b.id === rv.budget_id);
                      const rq = requests.find(r => r.id === rv.request_id);
                      const reduction = Number(rv.original_amount) - Number(rv.new_amount);
                      const pct = Number(rv.original_amount) > 0
                        ? ((reduction / Number(rv.original_amount)) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={rv.id} onClick={() => router.push("/revision_list")} style={{ cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                          onMouseLeave={e => e.currentTarget.style.background = ""}>
                          <td style={tblTd}>
                            <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{bd?.budget_name || `ID: ${rv.budget_id}`}</div>
                            <div style={{ fontSize: 12, color: "#9ca3af" }}>{bd?.budget_type}</div>
                          </td>
                          <td style={{ ...tblTd, color: "#6b7280" }}>{rq?.request_no || `ID: ${rv.request_id}`}</td>
                          <td style={{ ...tblTd, fontWeight: 600, color: "#111827" }}>{fmt(rv.original_amount)}</td>
                          <td style={{ ...tblTd, fontWeight: 700, color: "#1d4ed8" }}>{fmt(rv.new_amount)}</td>
                          <td style={tblTd}>
                            <span style={badge("#fee2e2", "#b91c1c")}>
                              <TrendingDown style={{ width: 12, height: 12 }} />{pct}%
                            </span>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>({fmtCompact(reduction)})</div>
                          </td>
                          <td style={{ ...tblTd, color: "#6b7280", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rv.reason}</td>
                          <td style={{ ...tblTd, color: "#9ca3af" }}>{fmtDate(rv.created_at)}</td>
                        </tr>
                      );
                    })}
                    {recentRevisions.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No revisions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* ══ RIGHT COLUMN — Budget Statement ══ */}
          <div style={{ width: 285, flexShrink: 0, position: "sticky", top: 16 }}>
            <div style={{ ...card, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: "#1e3a5f", color: "#fff", textAlign: "center", padding: "13px 16px", fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>
                Budget Statement
              </div>

              {/* Rows */}
              <div style={{ padding: "4px 16px 10px" }}>
                {incomeRows.map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < incomeRows.length - 1 ? "1px solid #f3f4f6" : "none", fontSize: 13 }}>
                    <span style={{ fontWeight: row.bold ? 700 : 400, color: row.bold ? "#111827" : "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
                      {row.isCount && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d1d5db", display: "inline-block", flexShrink: 0 }} />}
                      {row.label}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: row.color || "#111827" }}>
                      {row.isCount ? row.value : fmtCompact(row.value)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{ borderTop: "1px solid #e5e7eb", padding: "14px 16px 16px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, margin: "0 0 10px 0" }}>
                  Quick Actions
                </p>
                {[
                  { label: "Add Budget", href: "/manage_budget/create_budget", icon: Plus, color: "#2563eb", bg: "#dbeafe" },
                  { label: "View Budgets", href: "/budget_management", icon: Wallet, color: "#059669", bg: "#d1fae5" },
                  { label: "New Request", href: "/manage_request/request_budget_form", icon: FileText, color: "#7c3aed", bg: "#ede9fe" },
                  { label: "Request List", href: "/request_budget_list", icon: Send, color: "#d97706", bg: "#fef3c7" },
                ].map((a, i) => (
                  <Link key={i} href={a.href} style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <a.icon style={{ width: 15, height: 15, color: a.color }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{a.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </LayoutDashboard>
  );
}