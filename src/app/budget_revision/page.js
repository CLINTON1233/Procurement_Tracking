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
} from "lucide-react";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { formatCurrency, formatIDR } from "@/utils/currency";
import Link from "next/link";

export default function BudgetRevisionPage() {
  const [revisions, setRevisions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sorting, setSorting] = useState([]);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    totalReduction: 0,
    averageReduction: 0,
  });

  useEffect(() => {
    fetchData();
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
      
      calculateStats(revisionsData);
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

  const calculateStats = (data) => {
    const total = data.length;
    const totalReduction = data.reduce((sum, r) => sum + (Number(r.original_amount) - Number(r.new_amount)), 0);
    const averageReduction = total > 0 ? totalReduction / total : 0;

    setStats({
      total,
      totalReduction,
      averageReduction,
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

  // Filter & Search
  const filteredRevisions = useMemo(() => {
    let filtered = revisions.filter((revision) => {
      const request = requests.find(r => r.id === revision.request_id);
      const budget = budgets.find(b => b.id === revision.budget_id);
      
      const matchesSearch =
        searchTerm === "" ||
        (request?.request_no || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget?.budget_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (revision.reason || "").toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
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

        if (aValue < bValue) return desc ? 1 : -1;
        if (aValue > bValue) return desc ? -1 : 1;
        return 0;
      });
    }

    return filtered;
  }, [revisions, requests, budgets, searchTerm, sorting]);

  if (loading) {
    return (
      <LayoutDashboard activeMenu={4}> {/* Sesuaikan activeMenu dengan menu revision */}
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
                <RotateCcw className="w-6 h-6 text-amber-600" />
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

        {/* STATS CARDS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b px-4 md:px-6 py-3 md:py-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm md:text-base">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
              Revision Overview
            </h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              Summary of all budget revisions
            </p>
          </div>

          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* Total Revisions */}
            <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-xl p-4 md:p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <RotateCcw className="w-6 h-6 opacity-90" />
                <span className="text-2xl md:text-3xl font-bold">{stats.total}</span>
              </div>
              <p className="mt-2 text-xs md:text-sm opacity-90">Total Revisions</p>
            </div>

            {/* Total Reduction */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl p-4 md:p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <DollarSign className="w-6 h-6 opacity-90" />
                <span className="text-2xl md:text-3xl font-bold">{formatCurrency(stats.totalReduction, 'IDR')}</span>
              </div>
              <p className="mt-2 text-xs md:text-sm opacity-90">Total Budget Reduction</p>
            </div>

            {/* Average Reduction */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-4 md:p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <ArrowDown className="w-6 h-6 opacity-90" />
                <span className="text-2xl md:text-3xl font-bold">{formatCurrency(stats.averageReduction, 'IDR')}</span>
              </div>
              <p className="mt-2 text-xs md:text-sm opacity-90">Average Reduction</p>
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
                placeholder="Search by request no, budget name, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
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
            </div>
          </div>
        </div>

        {/* REVISIONS TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Request No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Original Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    New Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reduction
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
                {filteredRevisions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No revisions found</p>
                    </td>
                  </tr>
                ) : (
                  filteredRevisions.map((revision) => {
                    const reductionAmount = Number(revision.original_amount) - Number(revision.new_amount);
                    const reductionPercent = ((reductionAmount / Number(revision.original_amount)) * 100).toFixed(1);
                    
                    return (
                      <tr key={revision.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                            {formatDate(revision.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getRequestNo(revision.request_id)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {getBudgetName(revision.budget_id)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(revision.original_amount, revision.currency)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600 text-right">
                          {formatCurrency(revision.new_amount, revision.currency)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <ArrowDown className="w-3 h-3 mr-1" />
                            {reductionPercent}%
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            ({formatCurrency(reductionAmount, revision.currency)})
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">
                          <div className="truncate" title={revision.reason}>
                            {revision.reason}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => {
                              // Show revision details
                              Swal.fire({
                                title: "Revision Details",
                                html: `
                                  <div class="text-left space-y-3">
                                    <p><strong>Request:</strong> ${getRequestNo(revision.request_id)}</p>
                                    <p><strong>Budget:</strong> ${getBudgetName(revision.budget_id)}</p>
                                    <p><strong>Original Amount:</strong> ${formatCurrency(revision.original_amount, revision.currency)}</p>
                                    <p><strong>New Amount:</strong> ${formatCurrency(revision.new_amount, revision.currency)}</p>
                                    <p><strong>Reduction:</strong> ${reductionPercent}% (${formatCurrency(reductionAmount, revision.currency)})</p>
                                    <p><strong>Reason:</strong> ${revision.reason}</p>
                                    <p><strong>Date:</strong> ${formatDate(revision.created_at)}</p>
                                  </div>
                                `,
                                confirmButtonText: "Close",
                                confirmButtonColor: "#2563eb",
                              });
                            }}
                            className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          {filteredRevisions.length > 0 && (
            <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-xs md:text-sm text-gray-500">
                  Showing {filteredRevisions.length} of {revisions.length} revisions
                </div>
                <div className="text-xs font-medium text-amber-600">
                  Total Reduction: {formatCurrency(stats.totalReduction, 'IDR')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutDashboard>
  );
}