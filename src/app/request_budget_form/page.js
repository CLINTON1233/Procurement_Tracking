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
  Info,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";
import { CURRENCIES, getCurrencySymbol, formatCurrency, formatIDR } from "@/utils/currency";

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
    estimated_total_idr: 0, // Tambahkan untuk menyimpan nilai dalam IDR
    budget_type: "CAPEX",
    budget_id: "",
    notes: "",
  });

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
    
    // Cari rate dari CURRENCIES
    const curr = CURRENCIES.find((c) => c.code === currency);
    const newRate = curr?.rate || 1;
    setExchangeRate(newRate);
    
    // Recalculate totals with new currency
    calculateTotals(formData.quantity, formData.estimated_unit_price, newRate);
  };

  // Calculate totals
  const calculateTotals = (qty, unitPrice, rate = exchangeRate) => {
    const quantity = parseInt(qty) || 0;
    const price = parseFloat(unitPrice) || 0;
    
    // Total dalam mata uang yang dipilih
    const totalInSelectedCurrency = quantity * price;
    
    // Total dalam IDR (untuk pengecekan budget)
    const totalInIDR = totalInSelectedCurrency * rate;
    
    setFormData(prev => ({
      ...prev,
      estimated_total: totalInSelectedCurrency,
      estimated_total_idr: totalInIDR
    }));
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Calculate totals when quantity or unit price changes
      if (name === "quantity" || name === "estimated_unit_price") {
        const qty = name === "quantity" ? parseInt(value) || 0 : parseInt(prev.quantity) || 0;
        const price = name === "estimated_unit_price" ? parseFloat(value) || 0 : parseFloat(prev.estimated_unit_price) || 0;
        
        // Hitung total dalam mata uang yang dipilih
        const totalInSelectedCurrency = qty * price;
        
        // Konversi ke IDR
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

    // Check budget remaining (gunakan estimated_total_idr untuk pengecekan)
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

    // Confirm submission
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
        estimated_total_idr: formData.estimated_total_idr, // Kirim juga nilai IDR
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

      // Reset form
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

      router.push("/budget_request_list");
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
      <div className="space-y-6 p-3 md:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Budget Request
          </h1>
          <p className="text-gray-500 text-sm">
            Submit a new budget request for CAPEX/OPEX items or services
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Form Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Request Budget
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Please fill all required fields marked with{" "}
              <span className="text-red-500">*</span>
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Requester Information Section */}
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Requester Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Requester Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Requester Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="requester_name"
                        value={formData.requester_name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter Requester Name"
                        required
                      />
                    </div>
                  </div>

                  {/* Requester Badge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Requester Badge <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Badge className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="requester_badge"
                        value={formData.requester_badge}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="EMP-001"
                        required
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        required
                      >
                        <option value="" className="text-gray-500">
                          Select Department
                        </option>
                        {departments.map((dept) => (
                          <option
                            key={dept.id}
                            value={dept.name}
                            className="text-gray-800"
                          >
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Request Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Request Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-6 pt-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="request_type"
                          value="ITEM"
                          checked={formData.request_type === "ITEM"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Item</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="request_type"
                          value="SERVICE"
                          checked={formData.request_type === "SERVICE"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Service
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Details Section */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Item/Service Details
                </h3>
                <div className="space-y-4">
                  {/* Item Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Item/Service Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="item_name"
                      value={formData.item_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Dell PowerEdge Server, Microsoft License, etc."
                      required
                    />
                  </div>

                  {/* Specification */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Specification <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="specification"
                      value={formData.specification}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter detailed specifications..."
                      required
                    />
                  </div>

                  {/* Currency, Quantity, and Unit Price in one row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Currency Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Currency <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={selectedCurrency}
                          onChange={handleCurrencyChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          {CURRENCIES.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.code} - {currency.name} ({currency.symbol})
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        Rate: 1 {selectedCurrency} = {exchangeRate.toLocaleString()} IDR
                      </p>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Unit Price ({getCurrencySymbol(selectedCurrency)}) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          name="estimated_unit_price"
                          value={formData.estimated_unit_price}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter unit price"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estimated Total in Selected Currency */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Estimated Total ({selectedCurrency}):
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(formData.estimated_total, selectedCurrency)}
                      </span>
                    </div>
                  </div>

                  {/* IDR Conversion (optional) */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowConverted(!showConverted)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {showConverted ? "Hide" : "Show"} IDR Conversion
                    </button>
                  </div>

                  {showConverted && formData.estimated_total > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">In IDR:</p>
                          <p className="text-base font-bold text-blue-600">
                            {formatIDR(formData.estimated_total_idr)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Exchange Rate:</p>
                          <p className="text-sm font-medium text-gray-800">
                            1 {selectedCurrency} = {exchangeRate.toLocaleString()} IDR
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Budget Selection Section */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Budget Allocation
                </h3>
                <div className="space-y-4">
                  {/* Budget Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Select Budget <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="budget_id"
                        value={formData.budget_id}
                        onChange={handleBudgetSelect}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        required
                      >
                        <option value="" className="text-gray-500">
                          -- Select Budget --
                        </option>
                        {budgets
                          .filter((b) => b.is_active)
                          .map((budget) => (
                            <option
                              key={budget.id}
                              value={budget.id}
                              className="text-gray-800"
                            >
                              {budget.budget_name} - {formatRupiah(budget.remaining_amount)} remaining
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Budget Details */}
                  {budgetDetails && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4">
                        Budget Details
                      </h4>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Budget Name</p>
                          <p className="text-sm font-medium text-gray-800">{budgetDetails.budget_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Type</p>
                          <p className="text-sm font-medium">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              budgetDetails.budget_type === "CAPEX"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}>
                              {budgetDetails.budget_type}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                          <p className="text-sm font-medium text-gray-800">{formatRupiah(budgetDetails.total_amount)}</p>
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
                          <p className="text-sm font-medium text-gray-800">{budgetDetails.fiscal_year}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Department</p>
                          <p className="text-sm font-medium text-gray-800">{budgetDetails.department_name}</p>
                        </div>
                      </div>

                      {/* Warning if insufficient budget */}
                      {budgetDetails.remaining_amount < formData.estimated_total_idr && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-700">
                            Warning: Request amount {formatCurrency(formData.estimated_total, selectedCurrency)} 
                            ({formatRupiah(formData.estimated_total_idr)}) exceeds remaining budget by{" "}
                            {formatRupiah(formData.estimated_total_idr - budgetDetails.remaining_amount)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Budget Type (Auto-filled) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Budget Type
                    </label>
                    <input
                      type="text"
                      value={formData.budget_type}
                      readOnly
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Auto-filled based on selected budget
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Additional Notes
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional information or special requirements..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <X className="w-4 h-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>

              {/* Form Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Request Process:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Fill in all required fields marked with *</li>
                    <li>Select currency for your request</li>
                    <li>Enter quantity and unit price - total will auto-calculate</li>
                    <li>Select the appropriate budget from available list</li>
                    <li>System will automatically check budget availability in IDR</li>
                    <li>Submit for approval once all details are correct</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </LayoutDashboard>
  );
}