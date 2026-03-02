// app/revision/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import LayoutDashboard from "@/components/LayoutDashboard";
import {
    Save,
    ArrowLeft,
    Wallet,
    FileText,
    Package,
    DollarSign,
    Building,
    Calendar,
    Info,
    RotateCcw,
    User,
    AlertCircle,
    Percent,
    TrendingDown,
} from "lucide-react";
import Swal from "sweetalert2";
import { budgetService } from "@/services/budgetService";
import { CURRENCIES, formatCurrency, getCurrencySymbol } from "@/utils/currency";

export default function BudgetRevisionPage() {
    const router = useRouter();
    const params = useParams();
    const requestId = params.id;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [originalRequest, setOriginalRequest] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const [revisionData, setRevisionData] = useState({
        request_id: requestId,
        budget_id: "",
        original_amount: 0,
        new_amount: "",
        reduction_percentage: 0,
        currency: "IDR",
        reason: "",
        notes: "",
        revised_by: "",
    });

    useEffect(() => {
        fetchData();
    }, [requestId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch semua requests
            const allRequests = await budgetService.getAllRequests();

            // Cari request berdasarkan ID
            const request = allRequests.find(r => r.id === parseInt(requestId));

            if (!request) {
                Swal.fire({
                    title: "Error!",
                    text: "Request not found",
                    icon: "error",
                    confirmButtonColor: "#1e40af",
                }).then(() => {
                    router.push("/budget_request_list");
                });
                return;
            }

            setOriginalRequest(request);

            // Set initial revision data
            setRevisionData({
                request_id: requestId,
                budget_id: request.budget_id || "",
                original_amount: request.estimated_total || 0,
                new_amount: request.estimated_total || "",
                reduction_percentage: 0,
                currency: request.currency || "IDR",
                reason: "",
                notes: request.notes || "",
                revised_by: "",
            });

            // Fetch budgets untuk referensi
            const budgetsData = await budgetService.getAllBudgets();
            setBudgets(budgetsData);

        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                title: "Error!",
                text: "Failed to fetch request data",
                icon: "error",
                confirmButtonColor: "#1e40af",
            }).then(() => {
                router.push("/budget_request_list");
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setRevisionData(prev => {
            const updated = { ...prev, [field]: value };

            // Auto calculate reduction percentage when new_amount changes
            if (field === "new_amount") {
                const original = parseFloat(prev.original_amount) || 0;
                const newAmount = parseFloat(value) || 0;

                if (original > 0 && newAmount > 0 && newAmount < original) {
                    const reduction = ((original - newAmount) / original) * 100;
                    updated.reduction_percentage = parseFloat(reduction.toFixed(2));
                } else if (newAmount >= original) {
                    updated.reduction_percentage = 0;
                }
            }

            // Auto calculate new_amount when reduction_percentage changes
            if (field === "reduction_percentage") {
                const original = parseFloat(prev.original_amount) || 0;
                const percentage = parseFloat(value) || 0;

                if (original > 0 && percentage > 0 && percentage < 100) {
                    const reduction = (original * percentage) / 100;
                    const newAmount = original - reduction;
                    updated.new_amount = parseFloat(newAmount.toFixed(2));
                } else if (percentage >= 100) {
                    updated.new_amount = 0;
                    updated.reduction_percentage = 100;
                } else {
                    updated.new_amount = original;
                }
            }

            return updated;
        });
    };

    const validateForm = () => {
        const errors = [];

        if (!revisionData.budget_id) {
            errors.push("Budget is required");
        }

        if (!revisionData.new_amount || parseFloat(revisionData.new_amount) <= 0) {
            errors.push("New amount must be greater than 0");
        }

        const original = parseFloat(revisionData.original_amount);
        const newAmount = parseFloat(revisionData.new_amount);

        if (newAmount > original) {
            errors.push("New amount cannot be greater than original amount (revision is for reduction only)");
        }

        if (newAmount === original) {
            errors.push("New amount must be different from original amount");
        }

        if (!revisionData.reason) {
            errors.push("Reason for revision is required");
        }

        if (revisionData.reason && revisionData.reason.length < 10) {
            errors.push("Reason must be at least 10 characters");
        }

        return errors;
    };

    const handleSubmit = async () => {
        const errors = validateForm();

        if (errors.length > 0) {
            Swal.fire({
                title: "Validation Error",
                html: errors.map(err => `• ${err}`).join("<br>"),
                icon: "warning",
                confirmButtonColor: "#1e40af",
            });
            return;
        }

        // Confirm submission
        const result = await Swal.fire({
            title: "Create Revision?",
            html: `
        <div class="text-left text-sm">
          <p><strong>Original Amount:</strong> ${formatCurrency(revisionData.original_amount, revisionData.currency)}</p>
          <p><strong>New Amount:</strong> ${formatCurrency(revisionData.new_amount, revisionData.currency)}</p>
          <p><strong>Reduction:</strong> ${formatCurrency(revisionData.original_amount - revisionData.new_amount, revisionData.currency)} (${revisionData.reduction_percentage}%)</p>
          <p class="mt-2 text-xs text-gray-500">This revision will permanently update the budget request amount</p>
        </div>
      `,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Create Revision",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#6b7280",
        });

        if (!result.isConfirmed) return;

        setSubmitting(true);
        try {
            const revisionPayload = {
                request_id: parseInt(requestId),
                budget_id: parseInt(revisionData.budget_id),
                original_amount: parseFloat(revisionData.original_amount),
                new_amount: parseFloat(revisionData.new_amount),
                reduction_percentage: parseFloat(revisionData.reduction_percentage),
                currency: revisionData.currency,
                reason: revisionData.reason,
                notes: revisionData.notes,
                revised_by: "system", // Bisa diganti dengan user login
            };

            await budgetService.createRevision(revisionPayload);

            await Swal.fire({
                title: "Success!",
                text: "Budget revision has been created successfully",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });

            router.push("/manage_revision/budget_revision");
        } catch (error) {
            console.error("Error creating revision:", error);
            Swal.fire({
                title: "Error!",
                text: error.message || "Failed to create revision",
                icon: "error",
                confirmButtonColor: "#1e40af",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        if (!originalRequest) return;

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
                setRevisionData({
                    request_id: requestId,
                    budget_id: originalRequest.budget_id || "",
                    original_amount: originalRequest.estimated_total || 0,
                    new_amount: originalRequest.estimated_total || "",
                    reduction_percentage: 0,
                    currency: originalRequest.currency || "IDR",
                    reason: "",
                    notes: originalRequest.notes || "",
                    revised_by: "",
                });
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
    const textareaCls =
        "w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none";

    const Label = ({ children, required }) => (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {children}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
    const Hint = ({ children }) => <p className="text-xs text-gray-400 mt-1">{children}</p>;

    if (loading) {
        return (
            <LayoutDashboard activeMenu={2}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </LayoutDashboard>
        );
    }

    if (!originalRequest) {
        return (
            <LayoutDashboard activeMenu={2}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-gray-600">Request not found</p>
                    </div>
                </div>
            </LayoutDashboard>
        );
    }

    const reductionAmount = revisionData.original_amount - revisionData.new_amount;
    const isReductionValid = reductionAmount > 0;

    return (
        <LayoutDashboard activeMenu={2}>
            <div className="min-h-screen bg-gray-50">
                {/* ── Breadcrumb — full width ───── */}
                <div className="bg-white border-b border-gray-200 px-6 py-3">
                    <div className="flex items-center gap-1.5 text-sm">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Budget Request List
                        </button>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-800 font-semibold">Budget Revision</span>
                    </div>
                </div>

                {/* ── Content area ─── */}
                <div className="px-6 py-5 pb-10">
                    {/* Single Main Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Blue top stripe */}
                        <div className="h-1 w-full bg-blue-600" />

                        {/* Card Header */}
                        <div className="px-6 py-5 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center flex-shrink-0">
                                        <RotateCcw className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-base font-bold text-gray-800 leading-tight">Budget Revision</h1>
                                        <p className="text-xs text-gray-400 leading-tight">
                                            Request #{originalRequest.request_no} • {originalRequest.item_name}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    Revision Form
                                </span>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="px-6 py-5">
                            {/* Original Request Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" />
                                    Original Request Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-blue-600">Request No</p>
                                        <p className="font-medium text-blue-800">{originalRequest.request_no}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600">Item Name</p>
                                        <p className="font-medium text-blue-800">{originalRequest.item_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600">Requester</p>
                                        <p className="font-medium text-blue-800">{originalRequest.requester_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600">Department</p>
                                        <p className="font-medium text-blue-800">{originalRequest.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600">Original Amount</p>
                                        <p className="font-bold text-blue-800">
                                            {formatCurrency(originalRequest.estimated_total, originalRequest.currency)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600">Currency</p>
                                        <p className="font-medium text-blue-800">{originalRequest.currency}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ▸ REVISION DETAILS ─────────────────────────────────── */}
                            <div className="flex items-center gap-2 mb-5">
                                <TrendingDown className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Revision Details</h3>
                            </div>

                            {/* Budget Selection */}
                            <div className="mb-6">
                                <Label required>Select Budget</Label>
                                <select
                                    value={revisionData.budget_id}
                                    onChange={(e) => handleInputChange("budget_id", e.target.value)}
                                    className={selectCls}
                                    required
                                >
                                    <option value="">-- Choose Budget --</option>
                                    {budgets.map((budget) => (
                                        <option key={budget.id} value={budget.id}>
                                            {budget.budget_name} ({budget.budget_type}) - {budget.currency} {formatCurrency(budget.total_amount, budget.currency)}
                                        </option>
                                    ))}
                                </select>
                                <Hint>Select the budget that will be affected by this revision</Hint>
                            </div>

                            {/* Amount Revision */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <Label required>Original Amount ({getCurrencySymbol(revisionData.currency)})</Label>
                                    <input
                                        type="number"
                                        value={revisionData.original_amount}
                                        readOnly
                                        className={readonlyCls}
                                    />
                                </div>
                                <div>
                                    <Label required>New Amount ({getCurrencySymbol(revisionData.currency)})</Label>
                                    <input
                                        type="number"
                                        value={revisionData.new_amount}
                                        onChange={(e) => handleInputChange("new_amount", e.target.value)}
                                        className={inputCls}
                                        placeholder="Enter new amount"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Reduction Percentage */}
                            <div className="mb-6">
                                <Label>Reduction Percentage (%)</Label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            value={revisionData.reduction_percentage}
                                            onChange={(e) => handleInputChange("reduction_percentage", e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="0"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2">
                                            <p className="text-xs text-gray-500">Reduction Amount</p>
                                            <p className={`text-sm font-bold ${isReductionValid ? 'text-green-600' : 'text-gray-400'}`}>
                                                {formatCurrency(reductionAmount, revisionData.currency)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Hint>Enter percentage reduction or new amount above</Hint>
                            </div>

                            {/* Reason for Revision */}
                            <div className="mb-6">
                                <Label required>Reason for Revision</Label>
                                <textarea
                                    value={revisionData.reason}
                                    onChange={(e) => handleInputChange("reason", e.target.value)}
                                    rows="4"
                                    className={textareaCls}
                                    placeholder="Explain why this revision is needed (minimum 10 characters)"
                                    required
                                />
                                <Hint>Provide clear explanation for the revision</Hint>
                            </div>

                            {/* Additional Notes */}
                            <div className="mb-6">
                                <Label>Additional Notes (Optional)</Label>
                                <textarea
                                    value={revisionData.notes}
                                    onChange={(e) => handleInputChange("notes", e.target.value)}
                                    rows="3"
                                    className={textareaCls}
                                    placeholder="Any additional information..."
                                />
                            </div>

                            {/* Revision Summary */}
                            {revisionData.new_amount && revisionData.original_amount > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5" />
                                        Revision Summary
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-amber-600">Original Amount</p>
                                            <p className="font-medium text-amber-800 line-through">
                                                {formatCurrency(revisionData.original_amount, revisionData.currency)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600">New Amount</p>
                                            <p className="font-bold text-amber-800">
                                                {formatCurrency(revisionData.new_amount, revisionData.currency)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600">Reduction</p>
                                            <p className="font-bold text-green-600">
                                                {formatCurrency(reductionAmount, revisionData.currency)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600">Percentage</p>
                                            <p className="font-bold text-amber-800">
                                                {revisionData.reduction_percentage}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
                            {/* Info notice */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-5">
                                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-700 space-y-0.5">
                                    <p className="font-semibold mb-1">Revision Process:</p>
                                    <p>• Revision can only reduce the budget amount (cannot increase)</p>
                                    <p>• Original amount will be recorded in revision history</p>
                                    <p>• Budget remaining amount will be automatically updated</p>
                                    <p>• Provide clear reason for the revision</p>
                                    <p>• This action cannot be undone</p>
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
                                        disabled={submitting}
                                        className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                    >
                                        <Save className="w-4 h-4" />
                                        {submitting ? "Creating..." : "Create Revision"}
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