// budgetRevisionModal.js
import Swal from "sweetalert2";
import { CURRENCIES, convertCurrency, formatCurrency } from "@/utils/currency";

export const showRevisionModal = async ({ request, budgets, onSave }) => {
  // Cari budget terkait
  const budget = budgets.find(b => b.id === request.budget_id);

  if (!budget) {
    Swal.fire({
      title: "Error!",
      text: "Budget not found",
      icon: "error",
      confirmButtonColor: "#1e40af",
    });
    return;
  }

  const currentYear = new Date().getFullYear().toString();

  // Format mata uang
  const formatAmount = (amount, currency) => {
    return formatCurrency(amount, currency);
  };

  const calculateNewAmount = (originalAmount, percentage) => {
    return originalAmount * (percentage / 100);
  };

  // Style untuk label dan value (sama dengan modal details)
  const label = "text-[11px] text-gray-500 leading-tight";
  const value = "text-[15px] font-semibold text-gray-900 leading-tight";

  Swal.fire({
    title: `
      <h2 class="text-[17px] font-semibold text-gray-900 text-center !m-0 !p-0">
        Budget Revision
      </h2>
    `,
    html: `
      <div class="text-left space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <!-- Original Request Info - Dengan warna-warna pada angka -->
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Original Request
          </h3>
          
          <div class="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <div class="${label}">Request No.</div>
              <div class="${value}">${request.request_no || "-"}</div>
            </div>
            <div>
              <div class="${label}">Item Name</div>
              <div class="${value}">${request.item_name || "-"}</div>
            </div>
            <div>
              <div class="${label}">Quantity</div>
              <div class="${value} text-purple-600">${request.quantity || "0"}</div>
            </div>
            <div>
              <div class="${label}">Original Amount</div>
              <div class="${value} text-blue-600">${formatAmount(request.estimated_total, request.currency)}</div>
            </div>
          </div>
        </div>

        <!-- Budget Info - Dengan warna-warna pada angka -->
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Budget Information
          </h3>
          
          <div class="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <div class="${label}">Budget Name</div>
              <div class="${value}">${budget.budget_name || "-"}</div>
            </div>
            <div>
              <div class="${label}">Type</div>
              <div class="${value}">${budget.budget_type || "N/A"}</div>
            </div>
            <div>
              <div class="${label}">Total Budget</div>
              <div class="${value} text-gray-900">${formatAmount(budget.total_amount, budget.currency)}</div>
            </div>
            <div>
              <div class="${label}">Remaining</div>
              <div class="${value} text-green-600">${formatAmount(budget.remaining_amount, budget.currency)}</div>
            </div>
          </div>
        </div>

        <!-- Revision Options -->
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
              <path d="M16 16h5v5"></path>
            </svg>
            Revision Options
          </h3>
          
          <div class="space-y-4">
            <!-- Percentage Reduction -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">
                Reduce by percentage:
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" class="revision-percent-btn px-3 py-2 text-xs rounded-lg bg-blue-600 text-white font-medium" data-percent="30">30%</button>
                <button type="button" class="revision-percent-btn px-3 py-2 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium" data-percent="40">40%</button>
                <button type="button" class="revision-percent-btn px-3 py-2 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium" data-percent="50">50%</button>
              </div>
            </div>

            <!-- Custom Percentage -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Custom percentage (%)
              </label>
              <input
                type="number"
                id="custom-percentage"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Enter percentage (1-99)"
                min="1"
                max="99"
                step="1"
              >
            </div>

            <!-- Manual Amount Input -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Or enter new amount directly
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  ${budget.currency === 'IDR' ? 'Rp' : budget.currency}
                </span>
                <input
                  type="number"
                  id="new-amount"
                  class="w-full pl-12 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="0"
                  min="0"
                  step="1000"
                >
              </div>
            </div>

            <!-- Preview Result - Dengan warna text saja -->
            <div class="mt-4 bg-white border border-gray-200 rounded-lg p-4">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Preview Result
              </p>
              <div class="space-y-3">
                <div class="flex justify-between items-center bg-white p-2 rounded-lg">
                  <span class="text-xs text-gray-600 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                    Original Amount:
                  </span>
                  <span class="text-sm font-bold text-blue-600" id="preview-original">
                    ${formatAmount(request.estimated_total, request.currency)}
                  </span>
                </div>
                <div class="flex justify-between items-center bg-white p-2 rounded-lg">
                  <span class="text-xs text-gray-600 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                      <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                    Reduction:
                  </span>
                  <span class="text-sm font-bold text-orange-600" id="preview-reduction">0%</span>
                </div>
                <div class="flex justify-between items-center bg-white p-2 rounded-lg">
                  <span class="text-xs text-gray-600 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
                    </svg>
                    New Amount:
                  </span>
                  <span class="text-sm font-bold text-green-600" id="preview-new">
                    ${formatAmount(request.estimated_total, request.currency)}
                  </span>
                </div>
              </div>
            </div>

            <!-- Revision Reason -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Revision Reason <span class="text-red-500">*</span>
              </label>
              <textarea
                id="revision-reason"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                rows="2"
                placeholder="Explain why this revision is needed..."
                required
              ></textarea>
            </div>
          </div>
        </div>

        <div class="text-xs text-gray-500 pt-2 border-t border-gray-200">
          <span class="text-red-500">*</span> Required fields • Revision will create a new version of this budget request
        </div>
      </div>
    `,
    width: window.innerWidth > 768 ? "600px" : "95vw",
    padding: "0",
    showCancelButton: true,
    confirmButtonText: "Create Revision",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
    customClass: {
      popup: "rounded-xl overflow-hidden bg-white mx-4",
      title: "!pb-1 !pt-4 !px-4 !border-b !border-gray-100",
      htmlContainer: "!p-4 !m-0 !bg-white",
      actions: "!p-4 !m-0 !bg-gray-50 !border-t !border-gray-200 !flex !justify-end !gap-3",
      confirmButton: "!px-5 !py-2.5 !text-sm !font-medium !text-white !bg-blue-600 !rounded-lg hover:!bg-blue-700 !shadow-sm !min-w-[130px]",
      cancelButton: "!px-5 !py-2.5 !text-sm !font-medium !text-gray-700 !bg-white !border !border-gray-300 !rounded-lg hover:!bg-gray-50 !shadow-sm !min-w-[130px]",
    },
    didOpen: () => {
      const originalAmount = request.estimated_total;
      const currency = request.currency;

      const previewOriginal = document.getElementById('preview-original');
      const previewReduction = document.getElementById('preview-reduction');
      const previewNew = document.getElementById('preview-new');

      const customPercentage = document.getElementById('custom-percentage');
      const newAmount = document.getElementById('new-amount');

      const percentButtons = document.querySelectorAll('.revision-percent-btn');

      // Fungsi update preview
      const updatePreview = (percentage) => {
        const reductionPercent = parseFloat(percentage) || 0;
        const newAmountValue = originalAmount * ((100 - reductionPercent) / 100);

        previewReduction.textContent = `${reductionPercent}%`;
        previewNew.textContent = formatAmount(newAmountValue, currency);

        // Update custom percentage input jika perlu
        if (customPercentage && document.activeElement !== customPercentage) {
          customPercentage.value = reductionPercent;
        }

        // Update new amount input jika perlu
        if (newAmount && document.activeElement !== newAmount) {
          newAmount.value = Math.round(newAmountValue);
        }
      };

      // Event listener untuk percent buttons
      percentButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          // Update active state
          percentButtons.forEach(b => {
            b.classList.remove('bg-blue-600', 'text-white');
            b.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
          });
          btn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
          btn.classList.add('bg-blue-600', 'text-white');

          const percent = btn.getAttribute('data-percent');
          updatePreview(percent);
        });
      });

      // Event listener untuk custom percentage
      customPercentage.addEventListener('input', (e) => {
        const percent = e.target.value;
        if (percent && percent > 0 && percent < 100) {
          updatePreview(percent);
        }
      });

      // Event listener untuk new amount
      newAmount.addEventListener('input', (e) => {
        const newVal = parseFloat(e.target.value);
        if (newVal && newVal > 0 && newVal < originalAmount) {
          const reductionPercent = ((originalAmount - newVal) / originalAmount * 100).toFixed(1);

          previewReduction.textContent = `${reductionPercent}%`;
          previewNew.textContent = formatAmount(newVal, currency);

          // Update custom percentage
          customPercentage.value = reductionPercent;
        }
      });
    },
    preConfirm: () => {
      const reason = document.getElementById('revision-reason')?.value?.trim();
      const customPercent = document.getElementById('custom-percentage')?.value;
      const newAmount = document.getElementById('new-amount')?.value;

      if (!reason) {
        Swal.showValidationMessage('Revision reason is required');
        return false;
      }

      let newAmountValue;
      let reductionPercent;

      if (newAmount && parseFloat(newAmount) > 0) {
        newAmountValue = parseFloat(newAmount);
        reductionPercent = ((request.estimated_total - newAmountValue) / request.estimated_total * 100).toFixed(1);
      } else if (customPercent && parseFloat(customPercent) > 0) {
        reductionPercent = parseFloat(customPercent);
        newAmountValue = request.estimated_total * ((100 - reductionPercent) / 100);
      } else {
        Swal.showValidationMessage('Please select reduction percentage or enter new amount');
        return false;
      }

      if (newAmountValue >= request.estimated_total) {
        Swal.showValidationMessage('New amount must be less than original amount');
        return false;
      }

      if (newAmountValue <= 0) {
        Swal.showValidationMessage('New amount must be greater than 0');
        return false;
      }

      return {
        request_id: request.id,
        budget_id: request.budget_id,
        original_amount: request.estimated_total,
        new_amount: newAmountValue,
        reduction_percentage: parseFloat(reductionPercent),
        reason: reason,
        currency: request.currency,
        notes: `Revision: Reduced by ${reductionPercent}% from ${formatAmount(request.estimated_total, request.currency)} to ${formatAmount(newAmountValue, request.currency)}`,
      };
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      onSave(result.value);
    }
  });
};

// Delete Revision Modal
export const showDeleteRevisionModal = ({ revision, requestNo, budgetName, onConfirm }) => {
  Swal.fire({
    title: `Delete Revision?`,
    text: `Are you sure you want to delete this revision? This data cannot be recovered!`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, Delete!",
    cancelButtonText: "Cancel",
    customClass: {
      popup: "rounded-xl",
      confirmButton:
        "!bg-red-600 hover:!bg-red-700 !px-6 !py-2.5 !min-w-[120px] !text-sm !font-medium",
      cancelButton:
        "!bg-gray-500 hover:!bg-gray-600 !px-6 !py-2.5 !min-w-[120px] !text-sm !font-medium",
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Deleting...",
          text: "Please wait",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await onConfirm();
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: error.message || "Failed to delete revision",
          icon: "error",
          confirmButtonColor: "#1e40af",
        });
      }
    }
  });
};

// Delete Multiple Revisions Modal - SEDERHANAKAN SEPERTI SINGLE DELETE
export const showDeleteMultipleRevisionsModal = ({ revisions, requestNos, budgetNames, onConfirm }) => {
  Swal.fire({
    title: `Delete ${revisions.length} Revisions?`,
    text: `Are you sure you want to delete ${revisions.length} selected revisions? This data cannot be recovered!`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: `Yes, Delete All!`,
    cancelButtonText: "Cancel",
    customClass: {
      popup: "rounded-xl",
      confirmButton:
        "!bg-red-600 hover:!bg-red-700 !px-6 !py-2.5 !min-w-[120px] !text-sm !font-medium",
      cancelButton:
        "!bg-gray-500 hover:!bg-gray-600 !px-6 !py-2.5 !min-w-[120px] !text-sm !font-medium",
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Deleting...",
          text: "Please wait",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await onConfirm();
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: error.message || "Failed to delete revisions",
          icon: "error",
          confirmButtonColor: "#1e40af",
        });
      }
    }
  });
};