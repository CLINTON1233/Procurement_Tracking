"use client";

import { useState, useEffect } from "react";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  Wallet,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  FileText,
  ChevronDown,
  Calendar,
  Building,
  BarChart3,
  PieChart,
  Eye,
  AlertTriangle,
  Home,
  Plus,
  RefreshCw,
  Users,
  Briefcase,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total_budgets: 0,
    total_amount: 0,
    total_remaining: 0,
    total_reserved: 0,
    total_used: 0,
    capex_count: 0,
    opex_count: 0,
    pending_requests: 0,
    approved_requests: 0,
    budget_used_percentage: 0,
  });

  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [recentBudgets, setRecentBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departmentChartData, setDepartmentChartData] = useState([]);

  const activityData = [
    { name: "Jan", Budget: 85, Used: 65 },
    { name: "Feb", Budget: 90, Used: 70 },
    { name: "Mar", Budget: 95, Used: 75 },
    { name: "Apr", Budget: 88, Used: 68 },
    { name: "May", Budget: 92, Used: 72 },
    { name: "Jun", Budget: 96, Used: 78 },
  ];

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#6366f1", "#ec4899"];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const budgetsData = await budgetService.getAllBudgets();
      setBudgets(budgetsData);

      const deptsData = await departmentService.getAllDepartments();
      setDepartments(deptsData);

      const statsData = await budgetService.getDashboardStats();
      const totalAmount = budgetsData.reduce(
        (sum, b) => sum + Number(b.total_amount || 0),
        0,
      );
      const totalRemaining = budgetsData.reduce(
        (sum, b) => sum + Number(b.remaining_amount || 0),
        0,
      );
      const totalReserved = budgetsData.reduce(
        (sum, b) => sum + Number(b.reserved_amount || 0),
        0,
      );
      const totalUsed = budgetsData.reduce(
        (sum, b) => sum + Number(b.used_amount || 0),
        0,
      );
      const capexCount = budgetsData.filter(
        (b) => b.budget_type === "CAPEX",
      ).length;
      const opexCount = budgetsData.filter(
        (b) => b.budget_type === "OPEX",
      ).length;

      const budgetUsedPercentage =
        totalAmount > 0 ? (totalUsed / totalAmount) * 100 : 0;

      setStats({
        total_budgets: budgetsData.length,
        total_amount: totalAmount,
        total_remaining: totalRemaining,
        total_reserved: totalReserved,
        total_used: totalUsed,
        capex_count: capexCount,
        opex_count: opexCount,
        pending_requests: statsData?.pending_requests || 0,
        approved_requests: statsData?.approved_requests || 0,
        budget_used_percentage: budgetUsedPercentage,
      });

      const sorted = [...budgetsData]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentBudgets(sorted);

      const deptMap = new Map();
      budgetsData.forEach((budget) => {
        const dept = budget.department_name;
        const amount = Number(budget.total_amount || 0);
        if (deptMap.has(dept)) {
          deptMap.set(dept, deptMap.get(dept) + amount);
        } else {
          deptMap.set(dept, amount);
        }
      });

      const deptChartData = Array.from(deptMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setDepartmentChartData(deptChartData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);
  };

  const formatCompactNumber = (number) => {
    if (number >= 1000000000) {
      return (number / 1000000000).toFixed(1) + "B";
    }
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    }
    if (number >= 1000) {
      return (number / 1000).toFixed(1) + "K";
    }
    return number.toString();
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    bgColor,
    trend,
    trendValue,
    subtitle,
  }) => (
    <div
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-5 flex flex-col border-l-4"
      style={{ borderColor: color.replace("text-", "").replace("600", "600") }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <div className="text-2xl font-bold text-gray-800">{value}</div>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-3 text-xs font-semibold">
          {trend === "up" ? (
            <>
              <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              <span className="text-green-600">
                {trendValue} dari bulan lalu
              </span>
            </>
          ) : trend === "down" ? (
            <>
              <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
              <span className="text-red-600">{trendValue} dari bulan lalu</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );

  const QuickAction = ({ title, href, icon: Icon, color, description }) => (
    <Link href={href}>
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-5 cursor-pointer border border-gray-100 hover:border-blue-200">
        <div className="flex items-center space-x-4">
          <div className={`${color} p-3 rounded-xl`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <LayoutDashboard activeMenu={0}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={0}>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Home className="w-6 h-6 text-blue-600" />
              Home
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Monitor and manage Capex/Opex budgets across all departments
            </p>
          </div>
        </div>

        {/* Statistik Cepat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Budgets"
            value={stats.total_budgets}
            icon={Layers}
            color="text-blue-600"
            bgColor="bg-blue-50"
            trend="up"
            trendValue="+2"
            subtitle={`${stats.capex_count} CAPEX • ${stats.opex_count} OPEX`}
          />
          <StatCard
            title="Total Amount"
            value={formatRupiah(stats.total_amount).replace("Rp", "")}
            icon={DollarSign}
            color="text-green-600"
            bgColor="bg-green-50"
            subtitle="Overall budget allocation"
          />
          <StatCard
            title="Remaining"
            value={formatRupiah(stats.total_remaining).replace("Rp", "")}
            icon={Wallet}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            subtitle="Available to use"
          />
          <StatCard
            title="Reserved / Used"
            value={
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">
                  {formatCompactNumber(stats.total_reserved)}
                </span>
                <span className="text-gray-400">/</span>
                <span className="text-blue-600">
                  {formatCompactNumber(stats.total_used)}
                </span>
              </div>
            }
            icon={BarChart3}
            color="text-purple-600"
            bgColor="bg-purple-50"
            subtitle="Allocated vs Spent"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            title="Add Budget"
            href="/budget_management"
            icon={Plus}
            color="bg-blue-600"
            description="Create new CAPEX/OPEX budget"
          />
          <QuickAction
            title="Budget List"
            href="/budget_management"
            icon={Wallet}
            color="bg-green-600"
            description="View and manage all budgets"
          />
          <QuickAction
            title="Approval Queue"
            href="/approval"
            icon={Clock}
            color="bg-yellow-600"
            description={`${stats.pending_requests} pending requests`}
          />
          <QuickAction
            title="SR/MR Selection"
            href="/selection"
            icon={CheckCircle}
            color="bg-purple-600"
            description={`${stats.approved_requests} ready for selection`}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
              Budget Usage
            </h2>
            <div className="flex flex-col items-center justify-center h-[200px]">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />

                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.budget_used_percentage / 100)}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-800">
                    {stats.budget_used_percentage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">Used</span>
                </div>
              </div>
              <div className="flex gap-4 mt-4 text-sm font-normal">
                <div className="flex items-center text-blue-600">
                  <span className="w-3 h-3 rounded-full bg-blue-600 mr-2"></span>
                  <span>Used: {formatCompactNumber(stats.total_used)}</span>
                </div>

                <div className="flex items-center text-green-600">
                  <span className="w-3 h-3 rounded-full bg-green-600 mr-2"></span>
                  <span>
                    Remaining: {formatCompactNumber(stats.total_remaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Department Budget Distribution */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              Top 5 Departments by Budget
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={departmentChartData}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCompactNumber(value)}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                />
                <Tooltip formatter={(value) => formatRupiah(value)} />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Budgets Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              Recent Budgets
            </h2>
            <Link
              href="/budget_management"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All &rarr;
            </Link>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentBudgets.map((budget) => (
                  <tr key={budget.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-1.5 rounded-lg bg-blue-100 mr-3">
                          {budget.budget_type === "CAPEX" ? (
                            <Building className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Calendar className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {budget.budget_name}
                          </div>
                          {budget.budget_code && (
                            <div className="text-xs text-gray-500">
                              {budget.budget_code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          budget.budget_type === "CAPEX"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {budget.budget_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {budget.department_name}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatRupiah(budget.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={
                          budget.remaining_amount < budget.total_amount * 0.2
                            ? "text-red-600 font-medium"
                            : "text-green-600 font-medium"
                        }
                      >
                        {formatRupiah(budget.remaining_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {budget.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => router.push(`/budget_management/`)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-3 p-4">
            {recentBudgets.map((budget) => (
              <div
                key={budget.id}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-lg bg-blue-100 mr-2">
                      {budget.budget_type === "CAPEX" ? (
                        <Building className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Calendar className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {budget.budget_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {budget.department_name}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      budget.budget_type === "CAPEX"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {budget.budget_type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {formatRupiah(budget.total_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Remaining:</span>
                    <span
                      className={`ml-2 font-medium ${
                        budget.remaining_amount < budget.total_amount * 0.2
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatRupiah(budget.remaining_amount)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                  {budget.is_active ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Inactive
                    </span>
                  )}
                  <button
                    onClick={() => router.push(`/budget_management`)}
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
            Budget Management System Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition">
              <div className="text-sm font-semibold text-blue-700">
                Total Departments
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Active Departments
              </div>
              <div className="text-2xl font-bold text-gray-800 mt-2">
                {departments.length}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition">
              <div className="text-sm font-semibold text-green-700">
                Budget Health
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Remaining vs Total
              </div>
              <div className="text-2xl font-bold text-gray-800 mt-2">
                {stats.total_amount > 0
                  ? (
                      (stats.total_remaining / stats.total_amount) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition">
              <div className="text-sm font-semibold text-purple-700">
                CAPEX / OPEX
              </div>
              <div className="text-xs text-gray-600 mt-1">Budget Types</div>
              <div className="text-2xl font-bold text-gray-800 mt-2">
                {stats.capex_count} / {stats.opex_count}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition">
              <div className="text-sm font-semibold text-yellow-700">
                Active Budgets
              </div>
              <div className="text-xs text-gray-600 mt-1">Currently Active</div>
              <div className="text-2xl font-bold text-gray-800 mt-2">
                {budgets.filter((b) => b.is_active).length}
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>System Overview:</strong> Total budget allocation of{" "}
              {formatRupiah(stats.total_amount)} across {stats.total_budgets}{" "}
              budgets in {departments.length} departments. Current usage is at{" "}
              {stats.budget_used_percentage.toFixed(1)}% with{" "}
              {formatRupiah(stats.total_remaining)} remaining.
            </p>
          </div>
        </div>
      </div>
    </LayoutDashboard>
  );
}
