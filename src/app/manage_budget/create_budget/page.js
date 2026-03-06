"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Wallet,
  FileText,
  Package,
  DollarSign,
  Building,
  Calendar,
  Server,
  Info,
  RefreshCw,
  X,
  User,
  Badge,
  ChevronDown,
  RotateCcw,
  TrendingUp,
  Edit3,
  XCircle,
  Check,
} from "lucide-react";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";
import {
  CURRENCIES,
  formatCurrency,
  getCurrencySymbol,
  convertCurrency,
  formatIDR,
} from "@/utils/currency";

// Filter hanya 3 mata uang yang diperlukan
const ALLOWED_CURRENCIES = ['IDR', 'USD', 'SGD'];
const FILTERED_CURRENCIES = CURRENCIES.filter(c => ALLOWED_CURRENCIES.includes(c.code));

// Data kurs dari CURRENCIES yang sudah difilter
const getInitialExchangeRates = () => {
  const rates = { IDR: 1 };
  FILTERED_CURRENCIES.forEach((currency) => {
    if (currency.code !== "IDR") {
      rates[currency.code] = currency.rate;
    }
  });
  return rates;
};

// Fungsi untuk generate ID yang stabil
const generateStableId = (prefix = "") => {
  return `${prefix}${Math.random().toString(36).substring(2, 9)}`;
};

export default function CreateBudgetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [exchangeRates, setExchangeRates] = useState(getInitialExchangeRates());
  const [editingRate, setEditingRate] = useState(null);
  const [tempRateValue, setTempRateValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const [entryErrors, setEntryErrors] = useState({});

  const validateAmountByType = (entry) => {
    if (entry.budget_type === "OPEX" && entry.total_amount) {
      const amount = parseFloat(entry.total_amount);
      const amountInIDR =
        entry.currency === "IDR"
          ? amount
          : amount * (exchangeRates[entry.currency] || 1);

      if (amountInIDR > 16000000) {
        return {
          isValid: false,
          message: `OPEX budget cannot exceed IDR 16,000,000 (Current: ${formatIDR(amountInIDR)})`,
        };
      }
    }
    return { isValid: true };
  };

  const [budgetEntries, setBudgetEntries] = useState([
    {
      id: "entry-1", // ID statis untuk entry pertama
      fiscal_year: new Date().getFullYear().toString(),
      budget_code: "",
      department_name: "",
      budget_type: "CAPEX",
      currency: "IDR",
      budget_name: "",
      total_amount: "",
      convert_to: "USD",
      exchange_rate: "",
      converted_amount: "",
      budget_owner: "",
      period_start: "",
      period_end: "",
      description: "",
      showConvert: false,
      showConverted: false,
      useCustomRate: false,
      customRate: "",
    },
  ]);

  useEffect(() => {
    setMounted(true);
    fetchDepartments();
    // Coba load rates dari localStorage jika ada
    const savedRates = localStorage.getItem("customExchangeRates");
    if (savedRates) {
      setExchangeRates(JSON.parse(savedRates));
    }
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Fungsi untuk menyimpan rates ke localStorage
  const saveRatesToStorage = (newRates) => {
    localStorage.setItem("customExchangeRates", JSON.stringify(newRates));
    setExchangeRates(newRates);
  };

  // Fungsi untuk mengupdate rate
  const handleUpdateRate = (currencyCode) => {
    if (editingRate === currencyCode) {
      // Simpan rate baru
      const newRate = parseFloat(tempRateValue);
      if (newRate > 0) {
        const newRates = { ...exchangeRates, [currencyCode]: newRate };
        saveRatesToStorage(newRates);

        // Recalculate all entries that use this currency
        setBudgetEntries((prev) =>
          prev.map((entry) => {
            if (entry.showConvert && entry.currency && entry.convert_to) {
              return recalculateEntry(entry, newRates);
            }
            return entry;
          }),
        );

        Swal.fire({
          title: "Success!",
          text: `Exchange rate for ${currencyCode} updated to ${newRate.toLocaleString()} IDR`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setEditingRate(null);
      setTempRateValue("");
    } else {
      // Mulai edit
      setEditingRate(currencyCode);
      setTempRateValue(exchangeRates[currencyCode].toString());
    }
  };

  const addNewEntry = () => {
    setBudgetEntries([
      ...budgetEntries,
      {
        id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // ID lebih stabil
        fiscal_year: new Date().getFullYear().toString(),
        budget_code: "",
        department_name: "",
        budget_type: "CAPEX",
        currency: "IDR",
        budget_name: "",
        total_amount: "",
        convert_to: "USD",
        exchange_rate: "",
        converted_amount: "",
        budget_owner: "",
        period_start: "",
        period_end: "",
        description: "",
        showConvert: false,
        showConverted: false,
        useCustomRate: false,
        customRate: "",
      },
    ]);
  };

  const removeEntry = (id) => {
    if (budgetEntries.length > 1) {
      setBudgetEntries(budgetEntries.filter((entry) => entry.id !== id));
    }
  };

  // Fungsi untuk menghitung ulang entry berdasarkan rates terbaru
  const recalculateEntry = (entry, rates = exchangeRates) => {
    if (
      !entry.showConvert ||
      !entry.total_amount ||
      !entry.currency ||
      !entry.convert_to
    ) {
      return entry;
    }

    if (entry.currency === entry.convert_to) {
      return {
        ...entry,
        exchange_rate: "1.0000",
        converted_amount: entry.total_amount,
      };
    }

    let convertedAmount, exchangeRateValue;

    if (entry.useCustomRate && entry.customRate) {
      // Gunakan rate kustom yang dimasukkan user
      exchangeRateValue = entry.customRate;
      convertedAmount = (
        parseFloat(entry.total_amount) / parseFloat(entry.customRate)
      ).toFixed(2);
    } else {
      // Gunakan rate dari database
      const fromRate = rates[entry.currency] || 1;
      const toRate = rates[entry.convert_to] || 1;

      // Hitung amount dalam IDR dulu, lalu konversi ke target
      const amountInIDR = parseFloat(entry.total_amount) * fromRate;
      convertedAmount = (amountInIDR / toRate).toFixed(2);
      exchangeRateValue = (fromRate / toRate).toFixed(4);
    }

    return {
      ...entry,
      exchange_rate: exchangeRateValue,
      converted_amount: convertedAmount,
    };
  };

  const updateEntry = (id, field, value) => {
    setBudgetEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          let updatedEntry = { ...entry, [field]: value };

          if (
            [
              "total_amount",
              "currency",
              "convert_to",
              "useCustomRate",
              "customRate",
            ].includes(field) ||
            (field === "showConvert" && value === true)
          ) {
            updatedEntry = recalculateEntry(updatedEntry);
          }

          if (
            field === "total_amount" ||
            field === "currency" ||
            field === "budget_type"
          ) {
            const validation = validateAmountByType(updatedEntry);
            if (!validation.isValid) {
              setEntryErrors((prev) => ({ ...prev, [id]: validation.message }));
            } else {
              setEntryErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
              });
            }
          }

          return updatedEntry;
        }
        return entry;
      }),
    );
  };

  const toggleConvert = (id) => {
    setBudgetEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          const newShowConvert = !entry.showConvert;
          const updatedEntry = {
            ...entry,
            showConvert: newShowConvert,
            convert_to: newShowConvert ? "USD" : "",
            useCustomRate: false,
            customRate: "",
          };
          return newShowConvert ? recalculateEntry(updatedEntry) : updatedEntry;
        }
        return entry;
      }),
    );
  };

  const toggleShowConverted = (id) => {
    setBudgetEntries(
      budgetEntries.map((entry) => {
        if (entry.id === id) {
          return {
            ...entry,
            showConverted: !entry.showConverted,
          };
        }
        return entry;
      }),
    );
  };

  const validateEntries = () => {
    const errors = [];
    const newEntryErrors = {};

    budgetEntries.forEach((entry, index) => {
      const entryErrors = [];

      if (!entry.fiscal_year) entryErrors.push("Fiscal year is required");
      if (!entry.department_name) entryErrors.push("Department is required");
      if (!entry.budget_name) entryErrors.push("Budget name is required");
      if (!entry.total_amount || parseFloat(entry.total_amount) <= 0)
        entryErrors.push("Total amount must be greater than 0");

      // Validasi khusus OPEX
      const validation = validateAmountByType(entry);
      if (!validation.isValid) {
        entryErrors.push(validation.message);
        newEntryErrors[entry.id] = validation.message;
      }

      if (
        entry.showConvert &&
        entry.useCustomRate &&
        (!entry.customRate || parseFloat(entry.customRate) <= 0)
      ) {
        entryErrors.push("Custom exchange rate must be greater than 0");
      }

      if (entryErrors.length > 0) {
        errors.push(`Entry #${index + 1}: ${entryErrors.join(", ")}`);
      }
    });

    setEntryErrors(newEntryErrors);
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateEntries();
    if (errors.length > 0) {
      Swal.fire({
        title: "Cannot Create Budget",
        html: errors.map((err) => `• ${err}`).join("<br>"),
        icon: "warning",
        confirmButtonColor: "#1e40af",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Create Budget?",
      html: `
        <div class="text-left text-sm">
          <p><strong>Total entries:</strong> ${budgetEntries.length}</p>
          <p class="mt-2 text-xs text-gray-500">Budget data will be saved to the system</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Create",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      for (const entry of budgetEntries) {
        const budgetData = {
          fiscal_year: entry.fiscal_year,
          budget_code: entry.budget_code || null,
          department_name: entry.department_name,
          budget_type: entry.budget_type,
          currency: entry.currency,
          budget_name: entry.budget_name,
          total_amount: parseFloat(entry.total_amount),
          budget_owner: entry.budget_owner || null,
          period_start: entry.period_start || null,
          period_end: entry.period_end || null,
          description: entry.description || null,
        };

        if (entry.showConvert && entry.convert_to) {
          budgetData.convert_to = entry.convert_to;
          budgetData.exchange_rate = entry.useCustomRate
            ? parseFloat(entry.customRate)
            : parseFloat(entry.exchange_rate || 1);
          budgetData.converted_amount = parseFloat(entry.converted_amount || 0);
          budgetData.used_custom_rate = entry.useCustomRate || false;
        }

        await budgetService.createBudget(budgetData);
      }

      await Swal.fire({
        title: "Success!",
        text: `${budgetEntries.length} budget(s) added successfully`,
        icon: "success",
        timer: 1500,
        confirmButtonColor: "#1e40af",
      });

      router.push("/manage_budget/budget_management");
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to add budget",
        icon: "error",
        confirmButtonColor: "#1e40af",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    Swal.fire({
      title: "Reset Form?",
      text: "All entered data will be lost",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Reset",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        setBudgetEntries([
          {
            id: "entry-1",
            fiscal_year: new Date().getFullYear().toString(),
            budget_code: "",
            department_name: "",
            budget_type: "CAPEX",
            currency: "IDR",
            budget_name: "",
            total_amount: "",
            convert_to: "USD",
            exchange_rate: "",
            converted_amount: "",
            budget_owner: "",
            period_start: "",
            period_end: "",
            description: "",
            showConvert: false,
            showConverted: false,
            useCustomRate: false,
            customRate: "",
          },
        ]);
      }
    });
  };

  const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
  const selectCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition";
  const readonlyCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed";

  const Label = ({ children, required }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
  const Hint = ({ children }) => (
    <p className="text-xs text-gray-400 mt-1">{children}</p>
  );

  // Prevent hydration mismatch dengan tidak merender konten sampai mounted
  if (!mounted) {
    return (
      <LayoutDashboard activeMenu={1}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={1}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .bm-root { font-family: 'DM Sans', sans-serif; }
        .bm-root .mono { font-family: 'DM Mono', monospace; }
        .card { 
          background: #ffffff; 
          border-radius: 16px; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: box-shadow 0.2s ease;
        }
        .card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
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
        
        /* Grey background for stat boxes */
        .stat-box-grey {
          background-color: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 12px;
          padding: 12px;
        }
        .stat-box-grey .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }
        .stat-box-grey .stat-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          margin-top: 4px;
        }
        .stat-box-grey .stat-sub {
          font-size: 0.7rem;
          color: #9ca3af;
          margin-top: 2px;
        }
      `}</style>

      <div className="bm-root min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-1.5 text-sm">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Budget List
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-800 font-semibold">Create Budget</span>
          </div>
        </div>

        <div className="px-6 py-5 pb-10">
          {/* Main Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-gray-800 leading-tight">
                      Create New Budget
                    </h1>
                    <p className="text-xs text-gray-400 leading-tight">
                      Add one or multiple Capex/Opex budget entries
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-600">
                  Multiple Entries
                </span>
              </div>
            </div>

            {/* Budget Entries */}
            <div className="divide-y divide-gray-100">
              {budgetEntries.map((entry, index) => (
                <BudgetEntryForm
                  key={entry.id}
                  entry={entry}
                  index={index}
                  departments={departments}
                  exchangeRates={exchangeRates}
                  onUpdate={updateEntry}
                  onRemove={removeEntry}
                  onToggleConvert={toggleConvert}
                  onToggleShowConverted={toggleShowConverted}
                  showRemove={budgetEntries.length > 1}
                  inputCls={inputCls}
                  selectCls={selectCls}
                  readonlyCls={readonlyCls}
                  Label={Label}
                  Hint={Hint}
                  isLast={index === budgetEntries.length - 1}
                  editingRate={editingRate}
                  setEditingRate={setEditingRate}
                  tempRateValue={tempRateValue}
                  setTempRateValue={setTempRateValue}
                  handleUpdateRate={handleUpdateRate}
                  entryErrors={entryErrors}
                  setEntryErrors={setEntryErrors}
                  validateAmountByType={validateAmountByType}
                />
              ))}
            </div>

            {/* Add Entry Button */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={addNewEntry}
                className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Add Another Budget Entry
              </button>
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-5">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 space-y-0.5">
                  <p className="font-semibold mb-1">Budget Creation Process:</p>
                  <p>• Fill in all required fields marked with *</p>
                  <p>• Select currency (IDR, USD, SGD) for each budget entry</p>
                  <p>
                    • Update exchange rates in the Budget Amount section if
                    needed (based on current market)
                  </p>
                  <p>• Use "Custom Rate" option for special exchange rates</p>
                  <p>• Enter total budget amount</p>
                  <p>• Optionally convert to another currency for reference</p>
                  <p>
                    • Click "Add Another Budget Entry" to create multiple
                    budgets at once
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  <span className="text-red-500">*</span> Required fields
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset All
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {loading
                      ? "Saving..."
                      : `Save ${budgetEntries.length} Budgets`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutDashboard>
  );
}

// Budget Entry Form Component
function BudgetEntryForm({
  entry,
  index,
  departments,
  exchangeRates,
  onUpdate,
  onRemove,
  onToggleConvert,
  onToggleShowConverted,
  showRemove,
  inputCls,
  selectCls,
  readonlyCls,
  Label,
  Hint,
  isLast,
  editingRate,
  setEditingRate,
  tempRateValue,
  setTempRateValue,
  handleUpdateRate,
  entryErrors,
  setEntryErrors,
  validateAmountByType,
}) {
  // Filter hanya 3 mata uang yang diperlukan untuk ditampilkan
  const ALLOWED_CURRENCIES = ['IDR', 'USD', 'SGD'];
  const FILTERED_CURRENCIES = CURRENCIES.filter(c => ALLOWED_CURRENCIES.includes(c.code));

  const getExchangeRate = () => {
    if (
      entry.currency &&
      entry.convert_to &&
      entry.currency !== entry.convert_to
    ) {
      if (entry.useCustomRate && entry.customRate) {
        return entry.customRate;
      }
      const fromRate = exchangeRates[entry.currency] || 1;
      const toRate = exchangeRates[entry.convert_to] || 1;
      return (fromRate / toRate).toFixed(4);
    }
    return "1.0000";
  };

  const getConvertedAmount = () => {
    if (
      entry.showConvert &&
      entry.total_amount &&
      entry.currency &&
      entry.convert_to &&
      entry.currency !== entry.convert_to
    ) {
      let fromRate, toRate;

      if (entry.useCustomRate && entry.customRate) {
        fromRate = 1;
        toRate = parseFloat(entry.customRate);
      } else {
        fromRate = exchangeRates[entry.currency] || 1;
        toRate = exchangeRates[entry.convert_to] || 1;
      }

      const amountInIDR = parseFloat(entry.total_amount) * fromRate;
      return (amountInIDR / toRate).toFixed(2);
    }
    return "0";
  };

  const formatIDR = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getAmountInIDR = () => {
    if (!entry.total_amount) return 0;
    const rate = exchangeRates[entry.currency] || 1;
    return parseFloat(entry.total_amount) * rate;
  };

  const getCurrencyName = (code) => {
    const currency = CURRENCIES.find((c) => c.code === code);
    return currency ? currency.name : code;
  };

  const SectionDivider = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 pt-6 pb-4 border-t border-gray-100 mt-2">
      <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
        {label}
      </h3>
    </div>
  );

  return (
    <div className={!isLast ? "border-b border-gray-100" : ""}>
      {/* Form Header */}
      <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
            {index + 1}
          </div>
          <h2 className="text-sm font-semibold text-gray-800">
            Budget Entry #{index + 1}
          </h2>
          {entry.budget_code && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {entry.budget_code}
            </span>
          )}
        </div>
        {showRemove && (
          <button
            onClick={() => onRemove(entry.id)}
            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove Entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Form Body */}
      <div className="px-6 py-5">
        {/* BUDGET INFORMATION */}
        <div className="flex items-center gap-2 mb-5">
          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Budget Information
          </h3>
        </div>

        {/* Budget Name */}
        <div className="mb-4">
          <Label required>Budget Name</Label>
          <input
            type="text"
            value={entry.budget_name || ""}
            onChange={(e) => onUpdate(entry.id, "budget_name", e.target.value)}
            className={inputCls}
            placeholder="e.g. Capex IT Infrastructure 2026"
            required
          />
        </div>

        {/* Budget Code + Fiscal Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Budget Code</Label>
            <input
              type="text"
              value={entry.budget_code || ""}
              onChange={(e) =>
                onUpdate(entry.id, "budget_code", e.target.value)
              }
              className={inputCls}
              placeholder="BUD-2026-001"
            />
            <Hint>Optional internal budget code</Hint>
          </div>
          <div>
            <Label required>Fiscal Year</Label>
            <input
              type="text"
              value={entry.fiscal_year}
              onChange={(e) =>
                onUpdate(entry.id, "fiscal_year", e.target.value)
              }
              className={inputCls}
              placeholder="2026"
              required
            />
            <Hint>Budget allocation year</Hint>
          </div>
        </div>

        {/* Budget Type */}
        <div>
          <Label required>Budget Type</Label>
          <div className="flex gap-6 mt-1">
            {["CAPEX", "OPEX"].map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`budget_type_${entry.id}`}
                  checked={entry.budget_type === type}
                  onChange={() => {
                    onUpdate(entry.id, "budget_type", type);
                    const validation = validateAmountByType({
                      ...entry,
                      budget_type: type,
                    });
                    if (!validation.isValid) {
                    }
                  }}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* DEPARTMENT & OWNER */}
        <SectionDivider icon={Building} label="Department & Owner" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Department</Label>
            <div className="relative">
              <select
                value={entry.department_name}
                onChange={(e) =>
                  onUpdate(entry.id, "department_name", e.target.value)
                }
                className={selectCls}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <Label>Budget Owner</Label>
            <input
              type="text"
              value={entry.budget_owner || ""}
              onChange={(e) =>
                onUpdate(entry.id, "budget_owner", e.target.value)
              }
              className={inputCls}
              placeholder="Person responsible"
            />
            <Hint>Person responsible for this budget</Hint>
          </div>
        </div>

        {/* BUDGET AMOUNT */}
        <SectionDivider icon={DollarSign} label="Budget Amount" />

        {/* Exchange Rate Panel */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">
                Exchange Rates (1 IDR = ?)
              </h3>
            </div>
            <p className="text-xs text-gray-500">Click on rate to edit</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(exchangeRates)
              .filter(([code]) => code !== "IDR")
              .map(([code, rate]) => (
                <div
                  key={code}
                  className="bg-white rounded-lg border border-gray-200 p-2"
                >
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    1 {code}
                  </div>
                  {editingRate === code ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={tempRateValue}
                        onChange={(e) => setTempRateValue(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateRate(code)}
                        className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-800">
                        {rate.toLocaleString()} IDR
                      </span>
                      <button
                        onClick={() => handleUpdateRate(code)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit rate"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            * Rates are saved locally. Update them manually based on current
            market rates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <Label required>Currency</Label>
            <div className="relative">
              <select
                value={entry.currency}
                onChange={(e) => onUpdate(entry.id, "currency", e.target.value)}
                className={selectCls}
              >
                {FILTERED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} — {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {entry.currency !== "IDR" && (
              <p className="text-xs text-blue-600 mt-1">
                1 {entry.currency} ={" "}
                {exchangeRates[entry.currency]?.toLocaleString()} IDR
              </p>
            )}
          </div>
          <div>
            <Label required>
              Total Amount ({getCurrencySymbol(entry.currency)})
            </Label>
            <input
              type="number"
              value={entry.total_amount}
              onChange={(e) =>
                onUpdate(entry.id, "total_amount", e.target.value)
              }
              className={`${inputCls} ${entryErrors && entryErrors[entry.id] ? "border-red-500 focus:ring-red-500" : ""}`}
              placeholder="Enter total budget amount"
              min="0"
              required
            />
            {entry.budget_type === "OPEX" && (
              <p className="text-xs text-amber-600 mt-1">
                Max: Rp 16,000,000 for OPEX
              </p>
            )}
            {entryErrors && entryErrors[entry.id] && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {entryErrors[entry.id]}
              </p>
            )}
          </div>
        </div>

        {/* Show IDR Equivalent */}
        {entry.total_amount > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => onToggleShowConverted(entry.id)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition"
            >
              <RefreshCw className="w-3 h-3" />
              {entry.showConverted ? "Hide" : "Show"} IDR Equivalent
            </button>
            {entry.showConverted && (
              <div className="mt-2 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    Equivalent in IDR
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    1 {entry.currency} ={" "}
                    {exchangeRates[entry.currency]?.toLocaleString() || 1} IDR
                  </p>
                </div>
                <span className="text-sm font-bold text-blue-700 mono">
                  {formatIDR(getAmountInIDR())}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Convert to another currency */}
        <div className="pt-4 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer w-fit mb-4">
            <input
              type="checkbox"
              checked={entry.showConvert}
              onChange={() => onToggleConvert(entry.id)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Convert to another currency for reference
            </span>
          </label>

          {entry.showConvert && (
            <div className="pl-6 border-l-2 border-blue-300 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Convert to Currency</Label>
                  <div className="relative">
                    <select
                      value={entry.convert_to}
                      onChange={(e) =>
                        onUpdate(entry.id, "convert_to", e.target.value)
                      }
                      className={selectCls}
                    >
                      <option value="">Select Currency</option>
                      {FILTERED_CURRENCIES
                        .filter((currency) => currency.code !== entry.currency)
                        .map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} — {currency.name} ({currency.symbol})
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label>Exchange Rate Option</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`rate_option_${entry.id}`}
                        checked={!entry.useCustomRate}
                        onChange={() => {
                          onUpdate(entry.id, "useCustomRate", false);
                          onUpdate(entry.id, "customRate", "");
                        }}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        Use system rate
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`rate_option_${entry.id}`}
                        checked={entry.useCustomRate}
                        onChange={() =>
                          onUpdate(entry.id, "useCustomRate", true)
                        }
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        Use custom rate
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {entry.useCustomRate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Custom Exchange Rate</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        1 {entry.currency} =
                      </span>
                      <input
                        type="number"
                        value={entry.customRate || ""}
                        onChange={(e) =>
                          onUpdate(entry.id, "customRate", e.target.value)
                        }
                        className={`${inputCls} w-32`}
                        placeholder="Rate"
                        step="0.0001"
                        min="0"
                      />
                      <span className="text-sm text-gray-600">
                        {entry.convert_to}
                      </span>
                    </div>
                    <Hint>Enter current market rate manually</Hint>
                  </div>
                  <div>
                    <Label>Exchange Rate (Display)</Label>
                    <input
                      type="number"
                      value={getExchangeRate()}
                      readOnly
                      className={readonlyCls}
                    />
                    <Hint>
                      1 {entry.currency} = {getExchangeRate()}{" "}
                      {entry.convert_to}
                    </Hint>
                  </div>
                </div>
              )}

              {!entry.useCustomRate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Exchange Rate</Label>
                    <input
                      type="number"
                      value={getExchangeRate()}
                      readOnly
                      className={readonlyCls}
                    />
                    <Hint>
                      1 {entry.currency} = {getExchangeRate()}{" "}
                      {entry.convert_to}
                    </Hint>
                  </div>
                  <div>
                    <Label>Converted Amount ({entry.convert_to})</Label>
                    <input
                      type="number"
                      value={entry.converted_amount || getConvertedAmount()}
                      readOnly
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-md bg-blue-50 text-blue-800 font-medium cursor-not-allowed"
                    />
                    <Hint>Amount in {entry.convert_to} for reference only</Hint>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BUDGET PERIOD */}
        <SectionDivider icon={Calendar} label="Budget Period (Optional)" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Period Start</Label>
            <input
              type="date"
              value={entry.period_start}
              onChange={(e) =>
                onUpdate(entry.id, "period_start", e.target.value)
              }
              className={inputCls}
            />
          </div>
          <div>
            <Label>Period End</Label>
            <input
              type="date"
              value={entry.period_end}
              onChange={(e) => onUpdate(entry.id, "period_end", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* ADDITIONAL INFORMATION */}
        <SectionDivider icon={FileText} label="Additional Information" />

        <div>
          <Label>Description</Label>
          <textarea
            value={entry.description || ""}
            onChange={(e) => onUpdate(entry.id, "description", e.target.value)}
            rows="3"
            className={inputCls}
            placeholder="Additional notes, purpose of budget, scope, etc..."
          />
        </div>
      </div>
    </div>
  );
}