"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
  Send,
  Save,
  X,
  ChevronDown,
  Calendar,
  Building,
  DollarSign,
  Package,
  FileText,
  User,
  Badge,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Wallet,
  Info,
  IdCard,
  RefreshCw,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";
import {
  CURRENCIES,
  getCurrencySymbol,
  formatCurrency,
  formatIDR,
} from "@/utils/currency";

export default function RequestBudgetForm() {
  const router = useRouter();
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [budgetDetails, setBudgetDetails] = useState(null);

  // Currency states
  const [selectedCurrency, setSelectedCurrency] = useState("IDR");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [showConverted, setShowConverted] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    requester_name: "",
    requester_badge: "",
    department: "",
    request_type: "ITEM",
    item_name: "",
    specification: "",
    quantity: 1,
    estimated_unit_price: "",
    estimated_total: 0,
    estimated_total_idr: 0,
    budget_type: "CAPEX",
    budget_id: "",
    notes: "",
  });

  // Shared style tokens (sama dengan Create Budget)
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

  // Section Divider (sama dengan Create Budget)
  const SectionDivider = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 pt-6 pb-4 border-t border-gray-100 mt-2">
      <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</h3>
    </div>
  );

  // Fetch data on load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const budgetsData = await budgetService.getAllBudgets();
      setBudgets(budgetsData);

      const deptsData = await departmentService.getAllDepartments();
      setDepartments(deptsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to load required data",
        icon: "error",
        confirmButtonColor: "#1e40af",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle currency change
  const handleCurrencyChange = (e) => {
    const currency = e.target.value;
    setSelectedCurrency(currency);

    const curr = CURRENCIES.find((c) => c.code === currency);
    const newRate = curr?.rate || 1;
    setExchangeRate(newRate);

    calculateTotals(formData.quantity, formData.estimated_unit_price, newRate);
  };

  // Calculate totals
  const calculateTotals = (qty, unitPrice, rate = exchangeRate) => {
    const quantity = parseInt(qty) || 0;
    const price = parseFloat(unitPrice) || 0;

    const totalInSelectedCurrency = quantity * price;
    const totalInIDR = totalInSelectedCurrency * rate;

    setFormData((prev) => ({
      ...prev,
      estimated_total: totalInSelectedCurrency,
      estimated_total_idr: totalInIDR,
    }));
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      if (name === "quantity" || name === "estimated_unit_price") {
        const qty =
          name === "quantity"
            ? parseInt(value) || 0
            : parseInt(prev.quantity) || 0;
        const price =
          name === "estimated_unit_price"
            ? parseFloat(value) || 0
            : parseFloat(prev.estimated_unit_price) || 0;

        const totalInSelectedCurrency = qty * price;
        const totalInIDR = totalInSelectedCurrency * exchangeRate;

        newData.estimated_total = totalInSelectedCurrency;
        newData.estimated_total_idr = totalInIDR;
      }

      return newData;
    });
  };

  // Handle budget selection
  const handleBudgetSelect = (e) => {
    const budgetId = e.target.value;
    setFormData((prev) => ({ ...prev, budget_id: budgetId }));

    if (budgetId) {
      const budget = budgets.find((b) => b.id === parseInt(budgetId));
      setSelectedBudget(budget);
      setBudgetDetails(budget);

      setFormData((prev) => ({
        ...prev,
        budget_type: budget?.budget_type || "CAPEX",
      }));
    } else {
      setSelectedBudget(null);
      setBudgetDetails(null);
    }
  };

  // Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.requester_name.trim())
      errors.push("Requester name is required");
    if (!formData.requester_badge.trim())
      errors.push("Requester badge is required");
    if (!formData.department) errors.push("Department is required");
    if (!formData.item_name.trim())
      errors.push("Item/Service name is required");
    if (!formData.specification.trim())
      errors.push("Specification is required");
    if (formData.quantity < 1) errors.push("Quantity must be at least 1");
    if (formData.estimated_unit_price <= 0)
      errors.push("Estimated unit price must be greater than 0");
    if (!formData.budget_id) errors.push("Please select a budget");

    return errors;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      Swal.fire({
        title: "Validation Error",
        html: errors.map((err) => `• ${err}`).join("<br>"),
        icon: "warning",
        confirmButtonColor: "#1e40af",
      });
      return;
    }

    if (
      budgetDetails &&
      formData.estimated_total_idr > budgetDetails.remaining_amount
    ) {
      Swal.fire({
        title: "Insufficient Budget",
        html: `Request amount ${formatCurrency(formData.estimated_total, selectedCurrency)} (${formatRupiah(formData.estimated_total_idr)}) exceeds remaining budget ${formatRupiah(budgetDetails.remaining_amount)}`,
        icon: "error",
        confirmButtonColor: "#1e40af",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Submit Budget Request?",
      html: `
      <div class="text-left text-sm">
        <p><strong>Item:</strong> ${formData.item_name}</p>
        <p><strong>Quantity:</strong> ${formData.quantity}</p>
        <p><strong>Unit Price:</strong> ${formatCurrency(formData.estimated_unit_price, selectedCurrency)}</p>
        <p><strong>Total:</strong> ${formatCurrency(formData.estimated_total, selectedCurrency)}</p>
        <p><strong>Total (IDR):</strong> ${formatRupiah(formData.estimated_total_idr)}</p>
        <p><strong>Budget:</strong> ${budgetDetails?.budget_name}</p>
      </div>
    `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);
    try {
      const requestData = {
        requester_name: formData.requester_name,
        requester_badge: formData.requester_badge,
        department: formData.department,
        request_type: formData.request_type,
        item_name: formData.item_name,
        specification: formData.specification,
        quantity: parseInt(formData.quantity),
        currency: selectedCurrency,
        exchange_rate: exchangeRate,
        estimated_unit_price: parseFloat(formData.estimated_unit_price),
        estimated_total: formData.estimated_total,
        estimated_total_idr: formData.estimated_total_idr,
        budget_type: formData.budget_type,
        budget_id: parseInt(formData.budget_id),
        notes: formData.notes,
      };

      await budgetService.createRequest(requestData);

      await Swal.fire({
        title: "Request Submitted Successfully",
        text: "Your budget request has been submitted for approval",
        icon: "success",
        confirmButtonColor: "#1e40af",
        timer: 3000,
        showConfirmButton: true,
      });

      router.push("/manage_request/budget_request_list");
    } catch (error) {
      console.error("Error submitting request:", error);
      Swal.fire({
        title: "Error!",
        text: error.message || "Failed to submit request",
        icon: "error",
        confirmButtonColor: "#1e40af",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle save as draft
  const handleSaveDraft = async () => {
    Swal.fire({
      title: "Info",
      text: "Draft feature coming soon",
      icon: "info",
      confirmButtonColor: "#1e40af",
    });
  };

  // Handle reset form
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
        setFormData({
          requester_name: "",
          requester_badge: "",
          department: "",
          request_type: "ITEM",
          item_name: "",
          specification: "",
          quantity: 1,
          estimated_unit_price: "",
          estimated_total: 0,
          estimated_total_idr: 0,
          budget_type: "CAPEX",
          budget_id: "",
          notes: "",
        });
        setSelectedBudget(null);
        setBudgetDetails(null);
        setSelectedCurrency("IDR");
        setExchangeRate(1);
      }
    });
  };

  if (loading) {
    return (
      <LayoutDashboard activeMenu={2}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard activeMenu={2}>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-1.5 text-sm">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Request List
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-800 font-semibold">Budget Request</span>
          </div>
        </div>

        {/* Content area */}
        <div className="px-6 py-5 pb-10">
          {/* Single Main Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Blue top stripe */}
            <div className="h-1 w-full bg-blue-600" />

            {/* Card Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-gray-800 leading-tight">Budget Request</h1>
                    <p className="text-xs text-gray-400 leading-tight">Submit a new budget request for Capex/Opex items or services</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-600">
                  New Request
                </span>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6">
                {/* Requester Information Section */}
                <div className="flex items-center gap-2 mb-5">
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Requester Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Requester Name */}
                  <div>
                    <Label required>Requester Name</Label>
                    <input
                      type="text"
                      name="requester_name"
                      value={formData.requester_name}
                      onChange={handleInputChange}
                      className={inputCls}
                      placeholder="Enter Requester Name"
                      required
                    />
                  </div>

                  {/* Requester Badge */}
                  <div>
                    <Label required>Requester Badge</Label>
                    <input
                      type="text"
                      name="requester_badge"
                      value={formData.requester_badge}
                      onChange={handleInputChange}
                      className={inputCls}
                      placeholder="9090223"
                      required
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <Label required>Department</Label>
                    <div className="relative">
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
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

                  {/* Request Type */}
                  <div>
                    <Label required>Request Type</Label>
                    <div className="flex gap-6 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="request_type"
                          value="ITEM"
                          checked={formData.request_type === "ITEM"}
                          onChange={handleInputChange}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">Item</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="request_type"
                          value="SERVICE"
                          checked={formData.request_type === "SERVICE"}
                          onChange={handleInputChange}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">Service</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Item Details Section */}
                <SectionDivider icon={Package} label="Item/Service Details" />

                {/* Item Name */}
                <div className="mb-4">
                  <Label required>Item/Service Name</Label>
                  <input
                    type="text"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleInputChange}
                    className={inputCls}
                    placeholder="Dell PowerEdge Server, Microsoft License, etc."
                    required
                  />
                </div>

                {/* Specification */}
                <div className="mb-4">
                  <Label required>Specification</Label>
                  <textarea
                    name="specification"
                    value={formData.specification}
                    onChange={handleInputChange}
                    rows="3"
                    className={inputCls}
                    placeholder="Enter detailed specifications..."
                    required
                  />
                </div>

                {/* Currency, Quantity, Unit Price */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  {/* Currency */}
                  <div>
                    <Label required>Currency</Label>
                    <div className="relative">
                      <select
                        value={selectedCurrency}
                        onChange={handleCurrencyChange}
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
                    <Hint>Rate: 1 {selectedCurrency} = {exchangeRate.toLocaleString()} IDR</Hint>
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label required>Quantity</Label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="1"
                      className={inputCls}
                      required
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <Label required>Unit Price ({getCurrencySymbol(selectedCurrency)})</Label>
                    <input
                      type="number"
                      name="estimated_unit_price"
                      value={formData.estimated_unit_price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={inputCls}
                      placeholder="Enter unit price"
                      required
                    />
                  </div>
                </div>

                {/* Estimated Total */}
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Estimated Total</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">In {selectedCurrency}:</span>
                    <span className="text-sm font-bold text-blue-600">
                      {formatCurrency(formData.estimated_total, selectedCurrency)}
                    </span>
                  </div>
                </div>

                {/* Show IDR Conversion */}
                {formData.estimated_total > 0 && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setShowConverted(!showConverted)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {showConverted ? "Hide" : "Show"} IDR Conversion
                    </button>
                    {showConverted && (
                      <div className="mt-2 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
                        <div>
                          <p className="text-xs text-gray-600 font-medium">In IDR</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            1 {selectedCurrency} = {exchangeRate.toLocaleString()} IDR
                          </p>
                        </div>
                        <span className="text-sm font-bold text-blue-700">{formatIDR(formData.estimated_total_idr)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Budget Allocation Section */}
                <SectionDivider icon={DollarSign} label="Budget Allocation" />

                {/* Budget Selection */}
                <div className="mb-4">
                  <Label required>Select Budget</Label>
                  <div className="relative">
                    <select
                      name="budget_id"
                      value={formData.budget_id}
                      onChange={handleBudgetSelect}
                      className={selectCls}
                      required
                    >
                      <option value="">-- Select Budget --</option>
                      {budgets
                        .filter((b) => b.is_active)
                        .map((budget) => (
                          <option key={budget.id} value={budget.id}>
                            {budget.budget_name} - {formatRupiah(budget.remaining_amount)} remaining
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Budget Details */}
                {budgetDetails && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Budget Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Budget Name</p>
                        <p className="text-sm font-medium text-gray-900">{budgetDetails.budget_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          budgetDetails.budget_type === "CAPEX"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {budgetDetails.budget_type}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                        <p className="text-sm font-medium text-gray-900">{formatRupiah(budgetDetails.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Remaining</p>
                        <p className={`text-sm font-medium ${
                          budgetDetails.remaining_amount < formData.estimated_total_idr
                            ? "text-red-600"
                            : "text-green-600"
                        }`}>
                          {formatRupiah(budgetDetails.remaining_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Fiscal Year</p>
                        <p className="text-sm font-medium text-gray-900">{budgetDetails.fiscal_year}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Department</p>
                        <p className="text-sm font-medium text-gray-900">{budgetDetails.department_name}</p>
                      </div>
                    </div>

                    {/* Warning if insufficient budget */}
                    {budgetDetails.remaining_amount < formData.estimated_total_idr && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-700">
                          Warning: Request amount exceeds remaining budget by {formatRupiah(formData.estimated_total_idr - budgetDetails.remaining_amount)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Budget Type (Auto-filled) */}
                <div className="mb-4">
                  <Label>Budget Type</Label>
                  <input
                    type="text"
                    value={formData.budget_type}
                    readOnly
                    className={readonlyCls}
                  />
                  <Hint>Auto-filled based on selected budget</Hint>
                </div>

                {/* Additional Notes Section */}
                <SectionDivider icon={FileText} label="Additional Notes" />

                <div>
                  <Label>Notes (Optional)</Label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className={inputCls}
                    placeholder="Any additional information or special requirements..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
                {/* Info notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-5">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 space-y-0.5">
                    <p className="font-semibold mb-1">Request Process:</p>
                    <p>• Fill in all required fields marked with *</p>
                    <p>• Select currency for your request</p>
                    <p>• Enter quantity and unit price - total will auto-calculate</p>
                    <p>• Select the appropriate budget from available list</p>
                    <p>• System will automatically check budget availability in IDR</p>
                    <p>• Submit for approval once all details are correct</p>
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
                      type="button"
                      onClick={handleSaveDraft}
                      className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save Draft
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </LayoutDashboard>
  );
}