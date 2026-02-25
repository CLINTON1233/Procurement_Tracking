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
} from "lucide-react";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";
import { CURRENCIES, formatCurrency, getCurrencySymbol } from "@/utils/currency";

export default function CreateBudgetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [budgetEntries, setBudgetEntries] = useState([
    {
      id: Date.now(),
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
    },
  ]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const addNewEntry = () => {
    setBudgetEntries([
      ...budgetEntries,
      {
        id: Date.now() + Math.random(),
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
      },
    ]);
  };

  const removeEntry = (id) => {
    if (budgetEntries.length > 1) {
      setBudgetEntries(budgetEntries.filter((entry) => entry.id !== id));
    }
  };

  const updateEntry = (id, field, value) => {
    setBudgetEntries(
      budgetEntries.map((entry) => {
        if (entry.id === id) {
          const updatedEntry = { ...entry, [field]: value };

          // Auto calculate conversion if needed
          if (
            field === "total_amount" ||
            field === "currency" ||
            field === "convert_to"
          ) {
            if (
              updatedEntry.showConvert &&
              updatedEntry.total_amount &&
              updatedEntry.currency &&
              updatedEntry.convert_to &&
              updatedEntry.currency !== updatedEntry.convert_to
            ) {
              const fromRate =
                CURRENCIES.find((c) => c.code === updatedEntry.currency)
                  ?.rate || 1;
              const toRate =
                CURRENCIES.find((c) => c.code === updatedEntry.convert_to)
                  ?.rate || 1;
              const amountInIDR = parseFloat(updatedEntry.total_amount) * fromRate;
              const result = amountInIDR / toRate;
              updatedEntry.converted_amount = result.toFixed(2);
              updatedEntry.exchange_rate = (fromRate / toRate).toFixed(4);
            } else {
              updatedEntry.converted_amount = "";
              updatedEntry.exchange_rate = "";
            }
          }

          return updatedEntry;
        }
        return entry;
      })
    );
  };

  const toggleConvert = (id) => {
    setBudgetEntries(
      budgetEntries.map((entry) => {
        if (entry.id === id) {
          const newShowConvert = !entry.showConvert;
          return {
            ...entry,
            showConvert: newShowConvert,
            convert_to: newShowConvert ? "USD" : "",
            exchange_rate: "",
            converted_amount: "",
          };
        }
        return entry;
      })
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
      })
    );
  };

  const validateEntries = () => {
    const errors = [];

    budgetEntries.forEach((entry, index) => {
      const entryErrors = [];

      if (!entry.fiscal_year) entryErrors.push("Fiscal year is required");
      if (!entry.department_name) entryErrors.push("Department is required");
      if (!entry.budget_name) entryErrors.push("Budget name is required");
      if (!entry.total_amount || parseFloat(entry.total_amount) <= 0)
        entryErrors.push("Total amount must be greater than 0");

      if (entryErrors.length > 0) {
        errors.push(`Entry #${index + 1}: ${entryErrors.join(", ")}`);
      }
    });

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateEntries();
    if (errors.length > 0) {
      Swal.fire({
        title: "Validation Error",
        html: errors.map((err) => `• ${err}`).join("<br>"),
        icon: "warning",
        confirmButtonColor: "#1e40af",
      });
      return;
    }

    // Confirm submission
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
          budgetData.exchange_rate = parseFloat(entry.exchange_rate || 1);
          budgetData.converted_amount = parseFloat(entry.converted_amount || 0);
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

      router.push("/budget");
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
            id: Date.now(),
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
          },
        ]);
      }
    });
  };

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
        {/* ── Breadcrumb — full width, same px-6 as everything below ───── */}
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

        {/* ── Page header — same px-6 ──────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-800 leading-tight">Create New Budget</h1>
                <p className="text-xs text-gray-400 leading-tight">Add one or multiple Capex/Opex budget entries</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-600">
              Multiple Entries
            </span>
          </div>
        </div>

        {/* ── Content area — same px-6 so card edge aligns with header ─── */}
        <div className="px-6 py-5 pb-10 space-y-4">
          {budgetEntries.map((entry, index) => (
            <BudgetEntryForm
              key={entry.id}
              entry={entry}
              index={index}
              departments={departments}
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
            />
          ))}

          {/* Add Entry Button */}
          <div className="flex justify-center">
            <button
              onClick={addNewEntry}
              className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              Add Another Budget Entry
            </button>
          </div>

          {/* Form Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
              {/* Info notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-5">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 space-y-0.5">
                  <p className="font-semibold mb-1">Budget Creation Process:</p>
                  <p>• Fill in all required fields marked with *</p>
                  <p>• Select currency for each budget entry</p>
                  <p>• Enter total budget amount</p>
                  <p>• Optionally convert to another currency for reference</p>
                  <p>• Add budget owner and period if needed</p>
                  <p>• Click "Add Another Budget Entry" to create multiple budgets at once</p>
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
                    Reset All
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : `Save ${budgetEntries.length} Budget(s)`}
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
}) {
  const getExchangeRate = () => {
    if (entry.currency && entry.convert_to && entry.currency !== entry.convert_to) {
      const fromRate = CURRENCIES.find((c) => c.code === entry.currency)?.rate || 1;
      const toRate = CURRENCIES.find((c) => c.code === entry.convert_to)?.rate || 1;
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
      const fromRate = CURRENCIES.find((c) => c.code === entry.currency)?.rate || 1;
      const toRate = CURRENCIES.find((c) => c.code === entry.convert_to)?.rate || 1;
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
    const rate = CURRENCIES.find((c) => c.code === entry.currency)?.rate || 1;
    return parseFloat(entry.total_amount) * rate;
  };

  // Divider between sections inside the card
  const SectionDivider = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 pt-6 pb-4 border-t border-gray-100 mt-2">
      <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</h3>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* blue top stripe with entry number */}
      <div className="h-1 w-full bg-blue-600" />
      
      {/* Form Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
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
              onChange={(e) => onUpdate(entry.id, "budget_code", e.target.value)}
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
              onChange={(e) => onUpdate(entry.id, "fiscal_year", e.target.value)}
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
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`budget_type_${entry.id}`}
                  checked={entry.budget_type === type}
                  onChange={() => onUpdate(entry.id, "budget_type", type)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ▸ DEPARTMENT & OWNER ─────────────────────────────────── */}
        <SectionDivider icon={Building} label="Department & Owner" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Department</Label>
            <div className="relative">
              <select
                value={entry.department_name}
                onChange={(e) => onUpdate(entry.id, "department_name", e.target.value)}
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
              onChange={(e) => onUpdate(entry.id, "budget_owner", e.target.value)}
              className={inputCls}
              placeholder="Person responsible"
            />
            <Hint>Person responsible for this budget</Hint>
          </div>
        </div>

        {/* ▸ BUDGET AMOUNT ──────────────────────────────────────── */}
        <SectionDivider icon={DollarSign} label="Budget Amount" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <Label required>Currency</Label>
            <div className="relative">
              <select
                value={entry.currency}
                onChange={(e) => onUpdate(entry.id, "currency", e.target.value)}
                className={selectCls}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} — {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <Label required>Total Amount ({getCurrencySymbol(entry.currency)})</Label>
            <input
              type="number"
              value={entry.total_amount}
              onChange={(e) => onUpdate(entry.id, "total_amount", e.target.value)}
              className={inputCls}
              placeholder="Enter total budget amount"
              min="0"
              required
            />
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
                  <p className="text-xs text-gray-600 font-medium">Equivalent in IDR</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    1 {entry.currency} = {CURRENCIES.find((c) => c.code === entry.currency)?.rate?.toLocaleString() || 1} IDR
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
              checked={entry.showConvert}
              onChange={() => onToggleConvert(entry.id)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Convert to another currency for reference</span>
          </label>
          {entry.showConvert && (
            <div className="pl-6 border-l-2 border-blue-300 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Convert to Currency</Label>
                  <div className="relative">
                    <select
                      value={entry.convert_to}
                      onChange={(e) => onUpdate(entry.id, "convert_to", e.target.value)}
                      className={selectCls}
                    >
                      <option value="">Select Currency</option>
                      {CURRENCIES.filter((c) => c.code !== entry.currency).map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} — {currency.name} ({currency.symbol})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label>Exchange Rate</Label>
                  <input
                    type="number"
                    value={entry.exchange_rate || getExchangeRate()}
                    readOnly
                    className={readonlyCls}
                  />
                  <Hint>1 {entry.currency} = {getExchangeRate()} {entry.convert_to}</Hint>
                </div>
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

        {/* ▸ BUDGET PERIOD ──────────────────────────────────────── */}
        <SectionDivider icon={Calendar} label="Budget Period (Optional)" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Period Start</Label>
            <input
              type="date"
              value={entry.period_start}
              onChange={(e) => onUpdate(entry.id, "period_start", e.target.value)}
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

        {/* ▸ ADDITIONAL INFORMATION ─────────────────────────────── */}
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