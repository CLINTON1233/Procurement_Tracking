"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  ArrowLeft,
  Save,
  Wallet,
  FileText,
  DollarSign,
  Building,
  Calendar,
  Info,
  RefreshCw,
  ChevronDown,
  RotateCcw,
  TrendingUp,
  Edit3,
  Check,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";
import { CURRENCIES, formatCurrency, getCurrencySymbol, convertCurrency, formatIDR } from "@/utils/currency";

// Data kurs dari CURRENCIES
const getInitialExchangeRates = () => {
  const rates = { IDR: 1 };
  CURRENCIES.forEach(currency => {
    if (currency.code !== 'IDR') {
      rates[currency.code] = currency.rate;
    }
  });
  return rates;
};

export default function EditBudgetPage() {
  const router = useRouter();
  const params = useParams();
  const budgetId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showConverted, setShowConverted] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(getInitialExchangeRates());
  const [editingRate, setEditingRate] = useState(null);
  const [tempRateValue, setTempRateValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [customRate, setCustomRate] = useState("");
  const [amountError, setAmountError] = useState(""); // State untuk error message
  
  const [formData, setFormData] = useState({
    fiscal_year: "",
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
    reserved_amount: 0,
    used_amount: 0,
    remaining_amount: 0,
  });

  useEffect(() => {
    setMounted(true);
    if (!budgetId) { router.push("/manage_budget/budget_management"); return; }
    fetchData();
    
    // Coba load rates dari localStorage jika ada
    const savedRates = localStorage.getItem("customExchangeRates");
    if (savedRates) {
      setExchangeRates(JSON.parse(savedRates));
    }
  }, [budgetId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budgetData, depts] = await Promise.all([
        budgetService.getBudgetById(budgetId),
        departmentService.getAllDepartments(),
      ]);
      setFormData({
        fiscal_year: budgetData.fiscal_year || "",
        budget_code: budgetData.budget_code || "",
        department_name: budgetData.department_name || "",
        budget_type: budgetData.budget_type || "CAPEX",
        currency: budgetData.currency || "IDR",
        budget_name: budgetData.budget_name || "",
        total_amount: budgetData.total_amount || "",
        convert_to: budgetData.convert_to || "USD",
        exchange_rate: budgetData.exchange_rate || "",
        converted_amount: budgetData.converted_amount || "",
        budget_owner: budgetData.budget_owner || "",
        period_start: budgetData.period_start ? budgetData.period_start.split("T")[0] : "",
        period_end: budgetData.period_end ? budgetData.period_end.split("T")[0] : "",
        description: budgetData.description || "",
        reserved_amount: budgetData.reserved_amount || 0,
        used_amount: budgetData.used_amount || 0,
        remaining_amount: budgetData.remaining_amount || 0,
      });
      
      // Set showConvert jika ada data konversi
      if (budgetData.convert_to && budgetData.converted_amount) {
        setShowConvert(true);
        setUseCustomRate(false);
      }
      
      setDepartments(depts);
    } catch (error) {
      Swal.fire({ 
        title: "Error!", 
        text: "Failed to fetch budget data", 
        icon: "error", 
        confirmButtonColor: "#1e40af" 
      }).then(() => router.push("/manage_budget"));
    } finally {
      setLoading(false);
    }
  };

  // Fungsi validasi amount berdasarkan tipe budget
  const validateAmountByType = (budgetType, amount, currency) => {
    if (budgetType === "OPEX" && amount) {
      const amountValue = parseFloat(amount);
      const amountInIDR = currency === "IDR" 
        ? amountValue 
        : amountValue * (exchangeRates[currency] || 1);

      if (amountInIDR > 16000000) {
        return {
          isValid: false,
          message: `OPEX budget cannot exceed IDR 16,000,000 (Current: ${formatIDR(amountInIDR)})`,
        };
      }
    }
    return { isValid: true };
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
        
        // Recalculate conversion if needed
        if (showConvert && formData.currency && formData.convert_to) {
          recalculateConversion(newRates);
        }

        // Revalidate amount jika currency berubah
        const validation = validateAmountByType(formData.budget_type, formData.total_amount, formData.currency);
        if (!validation.isValid) {
          setAmountError(validation.message);
        } else {
          setAmountError("");
        }
        
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

  // Fungsi untuk menghitung ulang konversi
  const recalculateConversion = (rates = exchangeRates) => {
    if (!showConvert || !formData.total_amount || !formData.currency || !formData.convert_to) {
      return;
    }

    if (formData.currency === formData.convert_to) {
      setFormData(prev => ({ 
        ...prev, 
        exchange_rate: "1.0000", 
        converted_amount: prev.total_amount 
      }));
      return;
    }

    let convertedAmount, exchangeRateValue;
    
    if (useCustomRate && customRate) {
      // Gunakan rate kustom
      exchangeRateValue = customRate;
      convertedAmount = (parseFloat(formData.total_amount) / parseFloat(customRate)).toFixed(2);
    } else {
      // Gunakan rate dari sistem
      const fromRate = rates[formData.currency] || 1;
      const toRate = rates[formData.convert_to] || 1;
      
      const amountInIDR = parseFloat(formData.total_amount) * fromRate;
      convertedAmount = (amountInIDR / toRate).toFixed(2);
      exchangeRateValue = (fromRate / toRate).toFixed(4);
    }

    setFormData(prev => ({
      ...prev,
      exchange_rate: exchangeRateValue,
      converted_amount: convertedAmount,
    }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Validasi amount jika field yang berubah adalah total_amount, currency, atau budget_type
      if (["total_amount", "currency", "budget_type"].includes(field)) {
        const validation = validateAmountByType(
          field === "budget_type" ? value : updated.budget_type,
          field === "total_amount" ? value : updated.total_amount,
          field === "currency" ? value : updated.currency
        );
        
        if (!validation.isValid) {
          setAmountError(validation.message);
        } else {
          setAmountError("");
        }
      }
      
      // Auto calculate conversion jika perlu
      if (["total_amount", "convert_to", "currency"].includes(field) || 
          (field === "total_amount" && showConvert)) {
        setTimeout(() => recalculateConversion(), 0);
      }
      
      return updated;
    });
  };

  const toggleConvert = () => {
    const newShowConvert = !showConvert;
    setShowConvert(newShowConvert);
    if (!newShowConvert) {
      setUseCustomRate(false);
      setCustomRate("");
      setFormData(prev => ({ 
        ...prev, 
        convert_to: "USD", 
        exchange_rate: "", 
        converted_amount: "" 
      }));
    } else {
      setTimeout(() => recalculateConversion(), 0);
    }
  };

  const toggleCustomRate = (value) => {
    setUseCustomRate(value);
    if (!value) {
      setCustomRate("");
    }
    setTimeout(() => recalculateConversion(), 0);
  };

  const handleCustomRateChange = (value) => {
    setCustomRate(value);
    setTimeout(() => recalculateConversion(), 0);
  };

  const getExchangeRate = () => {
    if (showConvert && formData.currency && formData.convert_to && formData.currency !== formData.convert_to) {
      if (useCustomRate && customRate) {
        return customRate;
      }
      const fromRate = exchangeRates[formData.currency] || 1;
      const toRate = exchangeRates[formData.convert_to] || 1;
      return (fromRate / toRate).toFixed(4);
    }
    return "1.0000";
  };

  const getConvertedAmount = () => {
    if (showConvert && formData.total_amount && formData.currency && formData.convert_to && formData.currency !== formData.convert_to) {
      let fromRate, toRate;
      
      if (useCustomRate && customRate) {
        fromRate = 1;
        toRate = parseFloat(customRate);
      } else {
        fromRate = exchangeRates[formData.currency] || 1;
        toRate = exchangeRates[formData.convert_to] || 1;
      }
      
      const amountInIDR = parseFloat(formData.total_amount) * fromRate;
      return (amountInIDR / toRate).toFixed(2);
    }
    return "0";
  };

  const formatIDR = (amount) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount || 0);

  const getAmountInIDR = () => {
    if (!formData.total_amount) return 0;
    return parseFloat(formData.total_amount) * (exchangeRates[formData.currency] || 1);
  };

  const getCurrencyName = (code) => {
    const currency = CURRENCIES.find(c => c.code === code);
    return currency ? currency.name : code;
  };

  const handleSubmit = async () => {
    const errors = [];
    if (!formData.fiscal_year) errors.push("Fiscal year is required");
    if (!formData.department_name) errors.push("Department is required");
    if (!formData.budget_name) errors.push("Budget name is required");
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) errors.push("Total amount must be greater than 0");
    
    // Validasi khusus OPEX
    const validation = validateAmountByType(formData.budget_type, formData.total_amount, formData.currency);
    if (!validation.isValid) {
      errors.push(validation.message);
    }
    
    if (showConvert && useCustomRate && (!customRate || parseFloat(customRate) <= 0)) {
      errors.push("Custom exchange rate must be greater than 0");
    }
    
    if (errors.length > 0) {
      Swal.fire({ 
        title: "Validation Error", 
        html: errors.map((e) => `• ${e}`).join("<br>"), 
        icon: "warning", 
        confirmButtonColor: "#1e40af" 
      });
      return;
    }
    
    const result = await Swal.fire({
      title: "Update Budget?",
      html: `<div class="text-left text-sm"><p><strong>Budget:</strong> ${formData.budget_name}</p><p><strong>Total Amount:</strong> ${formatCurrency(formData.total_amount, formData.currency)}</p></div>`,
      icon: "question", showCancelButton: true, confirmButtonText: "Yes, Update", cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb", cancelButtonColor: "#6b7280",
    });
    
    if (!result.isConfirmed) return;
    
    setSaving(true);
    try {
      const budgetData = {
        fiscal_year: formData.fiscal_year, 
        budget_code: formData.budget_code || null,
        department_name: formData.department_name, 
        budget_type: formData.budget_type,
        currency: formData.currency,
        budget_name: formData.budget_name,
        total_amount: parseFloat(formData.total_amount), 
        budget_owner: formData.budget_owner || null,
        period_start: formData.period_start || null, 
        period_end: formData.period_end || null,
        description: formData.description || null,
      };
      
      if (showConvert && formData.convert_to) {
        budgetData.convert_to = formData.convert_to;
        budgetData.exchange_rate = useCustomRate 
          ? parseFloat(customRate)
          : parseFloat(formData.exchange_rate || getExchangeRate() || 1);
        budgetData.converted_amount = parseFloat(formData.converted_amount || getConvertedAmount() || 0);
        budgetData.used_custom_rate = useCustomRate || false;
      }
      
      await budgetService.updateBudget(budgetId, budgetData);
      
      await Swal.fire({ 
        title: "Success!", 
        text: "Budget updated successfully", 
        icon: "success", 
        timer: 1500, 
        confirmButtonColor: "#1e40af" 
      });
      
      router.push("/manage_budget/budget_management");
    } catch {
      Swal.fire({ 
        title: "Error!", 
        text: "Failed to update budget", 
        icon: "error", 
        confirmButtonColor: "#1e40af" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Swal.fire({
      title: "Reset Form?", 
      text: "All changes will be lost", 
      icon: "warning",
      showCancelButton: true, 
      confirmButtonText: "Yes, Reset", 
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33", 
      cancelButtonColor: "#6b7280",
    }).then((r) => { if (r.isConfirmed) fetchData(); });
  };

  if (loading || !mounted) {
    return (
      <LayoutDashboard activeMenu={1}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </LayoutDashboard>
    );
  }

  // ─── Shared style tokens ────────────────────────────────────────────────────
  const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
  const selectCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition";
  const readonlyCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed";

  const Label = ({ children, required }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
  const Hint = ({ children }) => <p className="text-xs text-gray-400 mt-1">{children}</p>;

  return (
    <LayoutDashboard activeMenu={1}>
      <div className="min-h-screen bg-gray-50">
        {/* ── Breadcrumb — full width ───── */}
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
            <span className="text-gray-800 font-semibold">Edit Budget</span>
          </div>
        </div>

        {/* ── Content area with single card ─── */}
        <div className="px-6 py-5 pb-10">
          {/* Single Main Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Blue top stripe */}
            <div className="h-1 w-full bg-blue-600" />

            {/* Card Header - Edit Budget */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-gray-800 leading-tight">Edit Budget</h1>
                    <p className="text-xs text-gray-400 leading-tight">Update budget information</p>
                  </div>
                </div>
                {formData.budget_code && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-600">
                    {formData.budget_code}
                  </span>
                )}
              </div>
            </div>

            {/* Form Body */}
            <div className="px-6 py-6">
              {/* ▸ BUDGET INFORMATION ─────────────────────────────────── */}
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Budget Information</h3>
              </div>

              {/* Budget Name — spans full width */}
              <div className="mb-4">
                <Label required>Budget Name</Label>
                <input
                  type="text"
                  value={formData.budget_name}
                  onChange={(e) => handleChange("budget_name", e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Capex IT Infrastructure 2026"
                />
              </div>

              {/* Budget Code + Fiscal Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Budget Code</Label>
                  <input
                    type="text"
                    value={formData.budget_code}
                    onChange={(e) => handleChange("budget_code", e.target.value)}
                    className={inputCls}
                    placeholder="BUD-2026-001"
                  />
                  <Hint>Optional internal budget code</Hint>
                </div>
                <div>
                  <Label required>Fiscal Year</Label>
                  <input
                    type="text"
                    value={formData.fiscal_year}
                    onChange={(e) => handleChange("fiscal_year", e.target.value)}
                    className={inputCls}
                    placeholder="2026"
                  />
                  <Hint>Budget allocation year</Hint>
                </div>
              </div>

              {/* Budget Type */}
              <div className="mb-4">
                <Label required>Budget Type</Label>
                <div className="flex gap-6 mt-1">
                  {["CAPEX", "OPEX"].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="budget_type"
                        checked={formData.budget_type === type}
                        onChange={() => handleChange("budget_type", type)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
                {formData.budget_type === "OPEX" && (
                  <p className="text-xs text-amber-600 mt-2">
                    Note: OPEX budget maximum is IDR 16,000,000
                  </p>
                )}
              </div>

              {/* ▸ DEPARTMENT & OWNER ─────────────────────────────────── */}
              <div className="flex items-center gap-2 pt-6 pb-4 border-t border-gray-100 mt-2">
                <Building className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Department & Owner</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label required>Department</Label>
                  <div className="relative">
                    <select
                      value={formData.department_name}
                      onChange={(e) => handleChange("department_name", e.target.value)}
                      className={selectCls}
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label>Budget Owner</Label>
                  <input
                    type="text"
                    value={formData.budget_owner}
                    onChange={(e) => handleChange("budget_owner", e.target.value)}
                    className={inputCls}
                    placeholder="Person responsible"
                  />
                  <Hint>Person responsible for this budget</Hint>
                </div>
              </div>

              {/* ▸ BUDGET AMOUNT ──────────────────────────────────────── */}
              <div className="flex items-center gap-2 pt-6 pb-4 border-t border-gray-100 mt-2">
                <DollarSign className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Budget Amount</h3>
              </div>

              {/* Exchange Rate Panel */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-700">Exchange Rates (1 IDR = ?)</h3>
                  </div>
                  <p className="text-xs text-gray-500">Click on rate to edit</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.entries(exchangeRates)
                    .filter(([code]) => code !== 'IDR')
                    .map(([code, rate]) => (
                      <div key={code} className="bg-white rounded-lg border border-gray-200 p-2">
                        <div className="text-xs font-semibold text-gray-500 mb-1">1 {code}</div>
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
                  * Rates are saved locally. Update them manually based on current market rates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <Label required>Currency</Label>
                  <div className="relative">
                    <select
                      value={formData.currency}
                      onChange={(e) => handleChange("currency", e.target.value)}
                      className={selectCls}
                    >
                      {Object.keys(exchangeRates).map((code) => (
                        <option key={code} value={code}>
                          {code} — {getCurrencyName(code)} ({getCurrencySymbol(code)})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {formData.currency !== "IDR" && (
                    <p className="text-xs text-blue-600 mt-1">
                      1 {formData.currency} = {exchangeRates[formData.currency]?.toLocaleString()} IDR
                    </p>
                  )}
                </div>
                <div>
                  <Label required>Total Amount ({getCurrencySymbol(formData.currency)})</Label>
                  <input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => handleChange("total_amount", e.target.value)}
                    className={`${inputCls} ${amountError ? "border-red-500 focus:ring-red-500" : ""}`}
                    placeholder="Enter total budget amount"
                    min="0"
                  />
                  {amountError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {amountError}
                    </p>
                  )}
                </div>
              </div>

              {/* Financial Status - Minimalist Gray Design */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Financial Status</p>
                <div className="grid grid-cols-3 gap-4">
                  {/* Reserved */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Reserved</p>
                    <p className="text-sm font-semibold text-gray-700">{formatIDR(formData.reserved_amount)}</p>
                  </div>

                  {/* Vertical Divider */}
                  <div className="relative">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Used</p>
                      <p className="text-sm font-semibold text-gray-700">{formatIDR(formData.used_amount)}</p>
                    </div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-gray-200 hidden sm:block"></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-gray-200 hidden sm:block"></div>
                  </div>

                  {/* Remaining */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Remaining</p>
                    <p className="text-sm font-semibold text-gray-700">{formatIDR(formData.remaining_amount)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-3 pt-2 border-t border-gray-100">
                  Auto-calculated based on transactions
                </p>
              </div>

              {/* Show IDR Equivalent */}
              {formData.total_amount > 0 && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowConverted(!showConverted)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {showConverted ? "Hide" : "Show"} IDR Equivalent
                  </button>
                  {showConverted && (
                    <div className="mt-2 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Equivalent in IDR</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          1 {formData.currency} = {exchangeRates[formData.currency]?.toLocaleString() || 1} IDR
                        </p>
                      </div>
                      <span className="text-sm font-bold text-blue-700">{formatIDR(getAmountInIDR())}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Convert to another currency */}
              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer w-fit mb-4">
                  <input
                    type="checkbox"
                    checked={showConvert}
                    onChange={toggleConvert}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Convert to another currency for reference</span>
                </label>
                
                {showConvert && (
                  <div className="pl-6 border-l-2 border-blue-300 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Convert to Currency</Label>
                        <div className="relative">
                          <select
                            value={formData.convert_to}
                            onChange={(e) => handleChange("convert_to", e.target.value)}
                            className={selectCls}
                          >
                            <option value="">Select Currency</option>
                            {Object.keys(exchangeRates)
                              .filter((code) => code !== formData.currency)
                              .map((code) => (
                                <option key={code} value={code}>
                                  {code} — {getCurrencyName(code)} ({getCurrencySymbol(code)})
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
                              name="rate_option"
                              checked={!useCustomRate}
                              onChange={() => toggleCustomRate(false)}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-sm text-gray-700">Use system rate</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="rate_option"
                              checked={useCustomRate}
                              onChange={() => toggleCustomRate(true)}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-sm text-gray-700">Use custom rate</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {useCustomRate && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Custom Exchange Rate</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">1 {formData.currency} =</span>
                            <input
                              type="number"
                              value={customRate}
                              onChange={(e) => handleCustomRateChange(e.target.value)}
                              className={`${inputCls} w-32`}
                              placeholder="Rate"
                              step="0.0001"
                              min="0"
                            />
                            <span className="text-sm text-gray-600">{formData.convert_to}</span>
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
                          <Hint>1 {formData.currency} = {getExchangeRate()} {formData.convert_to}</Hint>
                        </div>
                      </div>
                    )}

                    {!useCustomRate && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Exchange Rate</Label>
                          <input
                            type="number"
                            value={getExchangeRate()}
                            readOnly
                            className={readonlyCls}
                          />
                          <Hint>1 {formData.currency} = {getExchangeRate()} {formData.convert_to}</Hint>
                        </div>
                        <div>
                          <Label>Converted Amount ({formData.convert_to})</Label>
                          <input
                            type="number"
                            value={formData.converted_amount || getConvertedAmount()}
                            readOnly
                            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-md bg-blue-50 text-blue-800 font-medium cursor-not-allowed"
                          />
                          <Hint>Amount in {formData.convert_to} for reference only</Hint>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ▸ BUDGET PERIOD ──────────────────────────────────────── */}
              <div className="flex items-center gap-2 pt-6 pb-4 border-t border-gray-100 mt-2">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Budget Period (Optional)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Period Start</Label>
                  <input
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => handleChange("period_start", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label>Period End</Label>
                  <input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => handleChange("period_end", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* ▸ ADDITIONAL INFORMATION ─────────────────────────────── */}
              <div className="flex items-center gap-2 pt-6 pb-4 border-t border-gray-100 mt-2">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Additional Information</h3>
              </div>

              <div>
                <Label>Description</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows="3"
                  className={inputCls}
                  placeholder="Additional notes, purpose of budget, scope, etc..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
              {/* Info notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-5">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 space-y-0.5">
                  <p className="font-semibold mb-1">Budget Update Process</p>
                  <p>• Modify the fields you want to update</p>
                  <p>• Currency can be changed</p>
                  <p>• For OPEX budgets: maximum amount is IDR 16,000,000 (in IDR equivalent)</p>
                  <p>• Update exchange rates in the Budget Amount section if needed</p>
                  <p>• Financial status is automatically calculated from transactions</p>
                  <p>• Changes will be applied immediately after saving</p>
                </div>
              </div>

              {/* Actions */}
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
                    Reset
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !!amountError}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-lg transition shadow-sm ${
                      saving || amountError
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
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