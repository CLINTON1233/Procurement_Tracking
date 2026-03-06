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
  Plus,
  Trash2,
  TrendingUp,
  Edit3,
  Check,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { departmentService } from "@/services/departmentService";
import {
  CURRENCIES,
  getCurrencySymbol,
  formatCurrency,
  formatIDR,
  convertCurrency,
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

export default function RequestBudgetForm() {
  const router = useRouter();
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Exchange rates states
  const [exchangeRates, setExchangeRates] = useState(getInitialExchangeRates());
  const [editingRate, setEditingRate] = useState(null);
  const [tempRateValue, setTempRateValue] = useState("");

  // Requester info (shared for all items)
  const [requesterInfo, setRequesterInfo] = useState({
    requester_name: "",
    requester_badge: "",
    department: "",
  });

  // Multiple items state
  const [requestItems, setRequestItems] = useState([
    {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      request_type: "ITEM",
      item_name: "",
      specification: "",
      quantity: 1,
      currency: "IDR",
      estimated_unit_price: "",
      estimated_total: 0,
      estimated_total_idr: 0,
      budget_id: "",
      budget_type: "CAPEX",
      notes: "",
      showConverted: false,
      budgetRemainingWarning: false,
    },
  ]);

  // Selected budget details for each item
  const [selectedBudgets, setSelectedBudgets] = useState({});

  useEffect(() => {
    setMounted(true);
    fetchData();
    // Load saved rates from localStorage if available
    const savedRates = localStorage.getItem("customExchangeRates");
    if (savedRates) {
      setExchangeRates(JSON.parse(savedRates));
    }
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

  // Fungsi untuk menyimpan rates ke localStorage
  const saveRatesToStorage = (newRates) => {
    localStorage.setItem("customExchangeRates", JSON.stringify(newRates));
    setExchangeRates(newRates);
  };

  // Fungsi untuk mengupdate rate
  const handleUpdateRate = (currencyCode) => {
    if (editingRate === currencyCode) {
      const newRate = parseFloat(tempRateValue);
      if (newRate > 0) {
        const newRates = { ...exchangeRates, [currencyCode]: newRate };
        saveRatesToStorage(newRates);

        // Recalculate all items
        setRequestItems((prev) =>
          prev.map((item) => recalculateItem(item, newRates))
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
      setEditingRate(currencyCode);
      setTempRateValue(exchangeRates[currencyCode].toString());
    }
  };

  // Add new item
  const addNewItem = () => {
    setRequestItems([
      ...requestItems,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        request_type: "ITEM",
        item_name: "",
        specification: "",
        quantity: 1,
        currency: "IDR",
        estimated_unit_price: "",
        estimated_total: 0,
        estimated_total_idr: 0,
        budget_id: "",
        budget_type: "CAPEX",
        notes: "",
        showConverted: false,
        budgetRemainingWarning: false,
      },
    ]);
  };

  // Remove item
  const removeItem = (id) => {
    if (requestItems.length > 1) {
      setRequestItems(requestItems.filter((item) => item.id !== id));
      // Clean up selected budget for this item
      const newSelectedBudgets = { ...selectedBudgets };
      delete newSelectedBudgets[id];
      setSelectedBudgets(newSelectedBudgets);
    }
  };

  // Calculate totals for an item - FIXED: Menggunakan konversi yang benar
  const calculateItemTotals = (item, rates = exchangeRates) => {
    const quantity = parseInt(item.quantity) || 0;
    const price = parseFloat(item.estimated_unit_price) || 0;

    const totalInSelectedCurrency = quantity * price;
    
    // Hitung IDR equivalent dengan benar
    let totalInIDR = totalInSelectedCurrency;
    if (item.currency !== "IDR") {
      totalInIDR = convertCurrency(totalInSelectedCurrency, item.currency, "IDR");
    }

    return {
      ...item,
      estimated_total: totalInSelectedCurrency,
      estimated_total_idr: totalInIDR,
    };
  };

  // Recalculate item with new rates
  const recalculateItem = (item, rates = exchangeRates) => {
    return calculateItemTotals(item, rates);
  };

  // Handle item field change
  const handleItemChange = (id, field, value) => {
    setRequestItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let updatedItem = { ...item, [field]: value };
          
          // Recalculate if quantity, price, or currency changes
          if (["quantity", "estimated_unit_price", "currency"].includes(field)) {
            updatedItem = calculateItemTotals(updatedItem);
          }

          // Check budget sufficiency if budget is selected
          if (updatedItem.budget_id && updatedItem.estimated_total_idr > 0) {
            const budget = selectedBudgets[id];
            if (budget && updatedItem.estimated_total_idr > budget.remaining_amount) {
              updatedItem.budgetRemainingWarning = true;
            } else {
              updatedItem.budgetRemainingWarning = false;
            }
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Handle budget selection for an item
  const handleBudgetSelect = (itemId, budgetId) => {
    setRequestItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, budget_id: budgetId };
        }
        return item;
      })
    );

    if (budgetId) {
      const budget = budgets.find((b) => b.id === parseInt(budgetId));
      setSelectedBudgets((prev) => ({
        ...prev,
        [itemId]: budget,
      }));

      // Auto-fill budget type dan cek budget sufficiency
      setRequestItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const updatedItem = { 
              ...item, 
              budget_type: budget?.budget_type || "CAPEX" 
            };
            
            // Cek apakah request melebihi remaining budget
            if (updatedItem.estimated_total_idr > (budget?.remaining_amount || 0)) {
              updatedItem.budgetRemainingWarning = true;
            } else {
              updatedItem.budgetRemainingWarning = false;
            }
            
            return updatedItem;
          }
          return item;
        })
      );
    } else {
      setSelectedBudgets((prev) => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      
      setRequestItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            return { ...item, budgetRemainingWarning: false };
          }
          return item;
        })
      );
    }
  };

  // Toggle show converted for an item
  const toggleShowConverted = (id) => {
    setRequestItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, showConverted: !item.showConverted };
        }
        return item;
      })
    );
  };

  // Validate all items
  const validateItems = () => {
    const errors = [];

    // Validate requester info
    if (!requesterInfo.requester_name.trim()) {
      errors.push("Requester name is required");
    }
    if (!requesterInfo.requester_badge.trim()) {
      errors.push("Requester badge is required");
    }
    if (!requesterInfo.department) {
      errors.push("Department is required");
    }

    // Validate each item
    requestItems.forEach((item, index) => {
      const itemErrors = [];

      if (!item.item_name.trim()) {
        itemErrors.push("Item/Service name is required");
      }
      if (!item.specification.trim()) {
        itemErrors.push("Specification is required");
      }
      if (item.quantity < 1) {
        itemErrors.push("Quantity must be at least 1");
      }
      if (!item.estimated_unit_price || parseFloat(item.estimated_unit_price) <= 0) {
        itemErrors.push("Estimated unit price must be greater than 0");
      }
      if (!item.budget_id) {
        itemErrors.push("Please select a budget");
      }

      // Check budget sufficiency
      const budget = selectedBudgets[item.id];
      if (budget && item.estimated_total_idr > budget.remaining_amount) {
        itemErrors.push(
          `Request amount (${formatIDR(item.estimated_total_idr)}) exceeds remaining budget (${formatIDR(budget.remaining_amount)})`
        );
      }

      if (itemErrors.length > 0) {
        errors.push(`Item #${index + 1} (${item.item_name || "Unnamed"}): ${itemErrors.join(", ")}`);
      }
    });

    return errors;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateItems();
    if (errors.length > 0) {
      Swal.fire({
        title: "Validation Error",
        html: errors.map((err) => `• ${err}`).join("<br>"),
        icon: "warning",
        confirmButtonColor: "#1e40af",
      });
      return;
    }

    // Show summary
    const totalAmount = requestItems.reduce((sum, item) => sum + item.estimated_total_idr, 0);
    
    const result = await Swal.fire({
      title: "Submit Budget Requests?",
      html: `
        <div class="text-left text-sm">
          <p><strong>Total Items:</strong> ${requestItems.length}</p>
          <p><strong>Total Amount (IDR):</strong> ${formatIDR(totalAmount)}</p>
          <p class="mt-2 text-xs text-gray-500">All requests will be submitted for approval</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit All",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);
    try {
      // Submit each request
      for (const item of requestItems) {
        const requestData = {
          requester_name: requesterInfo.requester_name,
          requester_badge: requesterInfo.requester_badge,
          department: requesterInfo.department,
          request_type: item.request_type,
          item_name: item.item_name,
          specification: item.specification,
          quantity: parseInt(item.quantity),
          currency: item.currency,
          exchange_rate: exchangeRates[item.currency] || 1,
          estimated_unit_price: parseFloat(item.estimated_unit_price),
          estimated_total: item.estimated_total,
          estimated_total_idr: item.estimated_total_idr,
          budget_type: item.budget_type,
          budget_id: parseInt(item.budget_id),
          notes: item.notes,
        };

        await budgetService.createRequest(requestData);
      }

      await Swal.fire({
        title: "Requests Submitted Successfully",
        text: `${requestItems.length} budget request(s) have been submitted for approval`,
        icon: "success",
        confirmButtonColor: "#1e40af",
        timer: 3000,
        showConfirmButton: true,
      });

      router.push("/manage_request/budget_request_list");
    } catch (error) {
      console.error("Error submitting requests:", error);
      Swal.fire({
        title: "Error!",
        text: error.message || "Failed to submit requests",
        icon: "error",
        confirmButtonColor: "#1e40af",
      });
    } finally {
      setSubmitting(false);
    }
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
        setRequesterInfo({
          requester_name: "",
          requester_badge: "",
          department: "",
        });
        setRequestItems([
          {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            request_type: "ITEM",
            item_name: "",
            specification: "",
            quantity: 1,
            currency: "IDR",
            estimated_unit_price: "",
            estimated_total: 0,
            estimated_total_idr: 0,
            budget_id: "",
            budget_type: "CAPEX",
            notes: "",
            showConverted: false,
            budgetRemainingWarning: false,
          },
        ]);
        setSelectedBudgets({});
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

  const SectionDivider = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 pt-6 pb-4 border-t border-gray-100 mt-2">
      <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</h3>
    </div>
  );

  const getCurrencyName = (code) => {
    const currency = CURRENCIES.find((c) => c.code === code);
    return currency ? currency.name : code;
  };

  // Prevent hydration mismatch
  if (!mounted || loading) {
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
                    <h1 className="text-base font-bold text-gray-800 leading-tight">
                      Multiple Budget Request
                    </h1>
                    <p className="text-xs text-gray-400 leading-tight">
                      Submit multiple budget requests for Capex/Opex items or services
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-600">
                  Multiple Items
                </span>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6">
                {/* Requester Information Section */}
                <div className="flex items-center gap-2 mb-5">
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Requester Information (Shared for All Items)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Requester Name */}
                  <div>
                    <Label required>Requester Name</Label>
                    <input
                      type="text"
                      value={requesterInfo.requester_name}
                      onChange={(e) =>
                        setRequesterInfo({ ...requesterInfo, requester_name: e.target.value })
                      }
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
                      value={requesterInfo.requester_badge}
                      onChange={(e) =>
                        setRequesterInfo({ ...requesterInfo, requester_badge: e.target.value })
                      }
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
                        value={requesterInfo.department}
                        onChange={(e) =>
                          setRequesterInfo({ ...requesterInfo, department: e.target.value })
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
                </div>

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
                    * Rates are saved locally. Update them manually based on current market rates.
                  </p>
                </div>

                {/* Request Items */}
                <div className="space-y-6">
                  {requestItems.map((item, index) => (
                    <RequestItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      budgets={budgets}
                      exchangeRates={exchangeRates}
                      selectedBudget={selectedBudgets[item.id]}
                      onUpdate={handleItemChange}
                      onBudgetSelect={handleBudgetSelect}
                      onRemove={removeItem}
                      onToggleShowConverted={toggleShowConverted}
                      showRemove={requestItems.length > 1}
                      inputCls={inputCls}
                      selectCls={selectCls}
                      readonlyCls={readonlyCls}
                      Label={Label}
                      Hint={Hint}
                    />
                  ))}
                </div>

                {/* Add Item Button */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={addNewItem}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all w-full justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Request Item
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
                {/* Info notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-5">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 space-y-0.5">
                    <p className="font-semibold mb-1">Request Process:</p>
                    <p>• Fill in requester information (shared for all items)</p>
                    <p>• Add multiple request items using the "Add Another" button</p>
                    <p>• Select currency (IDR, USD, SGD) and enter quantity/price for each item</p>
                    <p>• Choose appropriate budget for each item</p>
                    <p>• System will automatically check budget availability</p>
                    <p>• All items will be submitted together for approval</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Total Items:</span>
                    <span className="text-sm font-bold text-blue-600">{requestItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-600">Total Amount (IDR):</span>
                    <span className="text-sm font-bold text-blue-600 ">
                      {formatIDR(requestItems.reduce((sum, item) => sum + item.estimated_total_idr, 0))}
                    </span>
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
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? "Submitting..." : `Submit ${requestItems.length} Request(s)`}
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

// Request Item Card Component - FIXED
function RequestItemCard({
  item,
  index,
  budgets,
  exchangeRates,
  selectedBudget,
  onUpdate,
  onBudgetSelect,
  onRemove,
  onToggleShowConverted,
  showRemove,
  inputCls,
  selectCls,
  readonlyCls,
  Label,
  Hint,
}) {
  // Filter hanya 3 mata uang yang diperlukan untuk ditampilkan
  const ALLOWED_CURRENCIES = ['IDR', 'USD', 'SGD'];
  const FILTERED_CURRENCIES = CURRENCIES.filter(c => ALLOWED_CURRENCIES.includes(c.code));

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);
  };

  const formatCurrencyWithSymbol = (amount, currencyCode) => {
    const symbol = getCurrencySymbol(currencyCode);
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
    return `${symbol} ${formatted}`;
  };

  const getAmountInIDR = () => {
    if (!item.estimated_total) return 0;
    return item.estimated_total_idr;
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${item.budgetRemainingWarning ? 'border-red-300 bg-red-50/30' : ''}`}>
      {/* Card Header */}
      <div className="px-4 py-3 bg-gray-50/50 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
            {index + 1}
          </div>
          <h3 className="text-sm font-semibold text-gray-800">
            Request Item #{index + 1}
          </h3>
          {item.item_name && (
            <span className="text-xs text-gray-500 max-w-[200px] truncate">
              {item.item_name}
            </span>
          )}
        </div>
        {showRemove && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Request Type */}
        <div className="mb-4">
          <Label required>Request Type</Label>
          <div className="flex gap-6 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`request_type_${item.id}`}
                value="ITEM"
                checked={item.request_type === "ITEM"}
                onChange={(e) => onUpdate(item.id, "request_type", e.target.value)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">Item</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`request_type_${item.id}`}
                value="SERVICE"
                checked={item.request_type === "SERVICE"}
                onChange={(e) => onUpdate(item.id, "request_type", e.target.value)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">Service</span>
            </label>
          </div>
        </div>

        {/* Item Name */}
        <div className="mb-4">
          <Label required>Item/Service Name</Label>
          <input
            type="text"
            value={item.item_name}
            onChange={(e) => onUpdate(item.id, "item_name", e.target.value)}
            className={inputCls}
            placeholder="Dell PowerEdge Server, Microsoft License, etc."
            required
          />
        </div>

        {/* Specification */}
        <div className="mb-4">
          <Label required>Specification</Label>
          <textarea
            value={item.specification}
            onChange={(e) => onUpdate(item.id, "specification", e.target.value)}
            rows="2"
            className={inputCls}
            placeholder="Enter detailed specifications..."
            required
          />
        </div>

        {/* Currency, Quantity, Unit Price */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Currency */}
          <div>
            <Label required>Currency</Label>
            <div className="relative">
              <select
                value={item.currency}
                onChange={(e) => onUpdate(item.id, "currency", e.target.value)}
                className={selectCls}
              >
                {FILTERED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {item.currency !== "IDR" && (
              <p className="text-xs text-blue-600 mt-1">
                1 {item.currency} = {exchangeRates[item.currency]?.toLocaleString()} IDR
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <Label required>Quantity</Label>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdate(item.id, "quantity", e.target.value)}
              min="1"
              className={inputCls}
              required
            />
          </div>

          {/* Unit Price */}
          <div>
            <Label required>Unit Price ({getCurrencySymbol(item.currency)})</Label>
            <input
              type="number"
              value={item.estimated_unit_price}
              onChange={(e) => onUpdate(item.id, "estimated_unit_price", e.target.value)}
              min="0"
              step="0.01"
              className={inputCls}
              placeholder="Enter unit price"
              required
            />
          </div>
        </div>

        {/* Estimated Total - FIXED: Menampilkan dalam mata uang asli */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Total in {item.currency}:</span>
            <span className="text-sm font-bold text-blue-600 ">
              {formatCurrencyWithSymbol(item.estimated_total, item.currency)}
            </span>
          </div>
          {item.currency !== "IDR" && (
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-200">
              <span className="text-xs font-medium text-gray-500">IDR Equivalent:</span>
              <span className="text-sm font-semibold text-green-600 ">
                {formatRupiah(item.estimated_total_idr)}
              </span>
            </div>
          )}
        </div>

        {/* Show IDR Conversion - untuk toggle detail */}
        {item.estimated_total > 0 && item.currency !== "IDR" && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => onToggleShowConverted(item.id)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition"
            >
              <RefreshCw className="w-3 h-3" />
              {item.showConverted ? "Hide" : "Show"} Conversion Details
            </button>
            {item.showConverted && (
              <div className="mt-2 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Conversion Details</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    1 {item.currency} = {exchangeRates[item.currency]?.toLocaleString()} IDR
                  </p>
                </div>
                <span className="text-sm font-bold text-blue-700 ">
                  {formatRupiah(item.estimated_total_idr)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Budget Selection - FIXED: Menampilkan remaining budget dalam format yang benar */}
        <div className="mb-4">
          <Label required>Select Budget</Label>
          <div className="relative">
            <select
              value={item.budget_id}
              onChange={(e) => onBudgetSelect(item.id, e.target.value)}
              className={selectCls}
              required
            >
              <option value="">-- Select Budget --</option>
              {budgets
                .filter((b) => b.is_active)
                .map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.budget_name} - {budget.currency === 'USD' ? '$' : budget.currency === 'SGD' ? 'S$' : 'Rp'} {budget.remaining_amount?.toLocaleString()} remaining
                  </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Budget Details - FIXED: Menampilkan remaining budget dengan mata uang yang benar */}
        {selectedBudget && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Budget Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Budget Name</p>
                <p className="text-sm font-medium text-gray-900">{selectedBudget.budget_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  selectedBudget.budget_type === "CAPEX"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-green-100 text-green-800"
                }`}>
                  {selectedBudget.budget_type}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Remaining</p>
                <p className={`text-sm font-medium ${
                  selectedBudget.remaining_amount < item.estimated_total_idr
                    ? "text-red-600"
                    : "text-green-600"
                } mono`}>
                  {selectedBudget.currency === 'USD' 
                    ? formatCurrencyWithSymbol(selectedBudget.remaining_amount, 'USD')
                    : selectedBudget.currency === 'SGD'
                      ? formatCurrencyWithSymbol(selectedBudget.remaining_amount, 'SGD')
                      : formatRupiah(selectedBudget.remaining_amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Department</p>
                <p className="text-sm font-medium text-gray-900">{selectedBudget.department_name}</p>
              </div>
            </div>

            {/* Warning if insufficient budget */}
            {selectedBudget.remaining_amount < item.estimated_total_idr && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">
                  Warning: Request amount exceeds remaining budget by {formatRupiah(item.estimated_total_idr - selectedBudget.remaining_amount)}
                </p>
              </div>
            )}

            {/* Success if sufficient budget */}
            {selectedBudget.remaining_amount >= item.estimated_total_idr && item.estimated_total_idr > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-700">
                  Sufficient budget available
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
            value={item.budget_type}
            readOnly
            className={readonlyCls}
          />
          <Hint>Auto-filled based on selected budget</Hint>
        </div>

        {/* Notes */}
        <div>
          <Label>Notes (Optional)</Label>
          <textarea
            value={item.notes}
            onChange={(e) => onUpdate(item.id, "notes", e.target.value)}
            rows="2"
            className={inputCls}
            placeholder="Additional notes or special requirements for this item..."
          />
        </div>
      </div>
    </div>
  );
}