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
} from "lucide-react";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";
import { CURRENCIES, formatCurrency, getCurrencySymbol } from "@/utils/currency";

export default function EditBudgetPage() {
  const router = useRouter();
  const params = useParams();
  const budgetId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showConverted, setShowConverted] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
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
    if (!budgetId) { router.push("/manage_budget/budget_management"); return; }
    fetchData();
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
      if (budgetData.convert_to && budgetData.converted_amount) setShowConvert(true);
      setDepartments(depts);
    } catch (error) {
      Swal.fire({ title: "Error!", text: "Failed to fetch budget data", icon: "error", confirmButtonColor: "#1e40af" })
        .then(() => router.push("/manage_budget"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (["total_amount", "currency", "convert_to"].includes(field)) {
        if (showConvert && updated.total_amount && updated.currency && updated.convert_to && updated.currency !== updated.convert_to) {
          const fr = CURRENCIES.find((c) => c.code === updated.currency)?.rate || 1;
          const tr = CURRENCIES.find((c) => c.code === updated.convert_to)?.rate || 1;
          updated.converted_amount = ((parseFloat(updated.total_amount) * fr) / tr).toFixed(2);
          updated.exchange_rate = (fr / tr).toFixed(4);
        } else {
          updated.converted_amount = "";
          updated.exchange_rate = "";
        }
      }
      return updated;
    });
  };

  const toggleConvert = () => {
    setShowConvert((prev) => !prev);
    setFormData((prev) => ({ ...prev, convert_to: !prev ? "USD" : "", exchange_rate: "", converted_amount: "" }));
  };

  const getExchangeRate = () => {
    if (showConvert && formData.currency && formData.convert_to && formData.currency !== formData.convert_to) {
      const fr = CURRENCIES.find((c) => c.code === formData.currency)?.rate || 1;
      const tr = CURRENCIES.find((c) => c.code === formData.convert_to)?.rate || 1;
      return (fr / tr).toFixed(4);
    }
    return "1.0000";
  };

  const getConvertedAmount = () => {
    if (showConvert && formData.total_amount && formData.currency && formData.convert_to && formData.currency !== formData.convert_to) {
      const fr = CURRENCIES.find((c) => c.code === formData.currency)?.rate || 1;
      const tr = CURRENCIES.find((c) => c.code === formData.convert_to)?.rate || 1;
      return ((parseFloat(formData.total_amount) * fr) / tr).toFixed(2);
    }
    return "0";
  };

  const formatIDR = (amount) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount || 0);

  const getAmountInIDR = () => {
    if (!formData.total_amount) return 0;
    return parseFloat(formData.total_amount) * (CURRENCIES.find((c) => c.code === formData.currency)?.rate || 1);
  };

  const handleSubmit = async () => {
    const errors = [];
    if (!formData.fiscal_year) errors.push("Fiscal year is required");
    if (!formData.department_name) errors.push("Department is required");
    if (!formData.budget_name) errors.push("Budget name is required");
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) errors.push("Total amount must be greater than 0");
    if (errors.length > 0) {
      Swal.fire({ title: "Validation Error", html: errors.map((e) => `• ${e}`).join("<br>"), icon: "warning", confirmButtonColor: "#1e40af" });
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
        fiscal_year: formData.fiscal_year, budget_code: formData.budget_code || null,
        department_name: formData.department_name, budget_type: formData.budget_type,
        currency: formData.currency, budget_name: formData.budget_name,
        total_amount: parseFloat(formData.total_amount), budget_owner: formData.budget_owner || null,
        period_start: formData.period_start || null, period_end: formData.period_end || null,
        description: formData.description || null,
      };
      if (showConvert && formData.convert_to) {
        budgetData.convert_to = formData.convert_to;
        budgetData.exchange_rate = parseFloat(formData.exchange_rate || getExchangeRate() || 1);
        budgetData.converted_amount = parseFloat(formData.converted_amount || getConvertedAmount() || 0);
      }
      await budgetService.updateBudget(budgetId, budgetData);
      await Swal.fire({ title: "Success!", text: "Budget updated successfully", icon: "success", timer: 1500, confirmButtonColor: "#1e40af" });
      router.push("/manage_budget/budget_management");
    } catch {
      Swal.fire({ title: "Error!", text: "Failed to update budget", icon: "error", confirmButtonColor: "#1e40af" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Swal.fire({
      title: "Reset Form?", text: "All changes will be lost", icon: "warning",
      showCancelButton: true, confirmButtonText: "Yes, Reset", cancelButtonText: "Cancel",
      confirmButtonColor: "#d33", cancelButtonColor: "#6b7280",
    }).then((r) => { if (r.isConfirmed) fetchData(); });
  };

  if (loading) {
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <Label required>Currency</Label>
                  <div className="relative">
                    <select
                      value={formData.currency}
                      onChange={(e) => handleChange("currency", e.target.value)}
                      className={selectCls}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label required>Total Amount ({getCurrencySymbol(formData.currency)})</Label>
                  <input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => handleChange("total_amount", e.target.value)}
                    className={inputCls}
                    placeholder="Enter total budget amount"
                    min="0"
                  />
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
                          1 {formData.currency} = {CURRENCIES.find((c) => c.code === formData.currency)?.rate?.toLocaleString() || 1} IDR
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
                            {CURRENCIES.filter((c) => c.code !== formData.currency).map((c) => (
                              <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <Label>Exchange Rate</Label>
                        <input
                          type="number"
                          value={formData.exchange_rate || getExchangeRate()}
                          readOnly
                          className={readonlyCls}
                        />
                        <Hint>1 {formData.currency} = {getExchangeRate()} {formData.convert_to}</Hint>
                      </div>
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
                  <p>• Currency cannot be changed after creation</p>
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
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
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