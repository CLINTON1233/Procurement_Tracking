"use client";

import { useState, useEffect } from "react";
import LayoutDashboard from "@/components/LayoutDashboard";
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  DollarSign,
  Plus
} from "lucide-react";
import Link from "next/link";
import { budgetService } from "@/services/budgetService";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_budget: 0,
    total_sisa: 0,
    pending_requests: 0,
    approved_requests: 0,
    budget_used: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await budgetService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, href, icon: Icon, color }) => (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition cursor-pointer">
        <div className="flex items-center space-x-3">
          <div className={`${color} p-2 rounded-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-700">{title}</span>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <LayoutDashboard activeMenu={0}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={0}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Procurement</h1>
        <p className="text-gray-500">Kelola budget CAPEX/OPEX dan tracking request</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <QuickAction title="Setting Budget" href="/budget" icon={Wallet} color="bg-blue-600" />
        <QuickAction title="Buat Request" href="/request" icon={Plus} color="bg-green-600" />
        <QuickAction title="Approval Queue" href="/approval" icon={Clock} color="bg-yellow-600" />
        <QuickAction title="Pilih SR/MR" href="/selection" icon={CheckCircle} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Budget" 
          value={formatRupiah(stats.total_budget)}
          icon={DollarSign}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard 
          title="Sisa Budget" 
          value={formatRupiah(stats.total_sisa)}
          icon={Wallet}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard 
          title="Pending Request" 
          value={stats.pending_requests}
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
          subtitle="Menunggu approval"
        />
        <StatCard 
          title="Approved Request" 
          value={stats.approved_requests}
          icon={CheckCircle}
          color="text-purple-600"
          bgColor="bg-purple-50"
          subtitle="Siap pilih SR/MR"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Penggunaan Budget</h2>
          <span className="text-sm text-gray-500">
            {formatRupiah(stats.budget_used)} / {formatRupiah(stats.total_budget)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ 
              width: stats.total_budget > 0 
                ? `${(stats.budget_used / stats.total_budget) * 100}%` 
                : '0%' 
            }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Tersedia: {formatRupiah(stats.total_sisa)}</span>
          <span>Terpakai: {formatRupiah(stats.budget_used)}</span>
        </div>
      </div>
    </LayoutDashboard>
  );
}