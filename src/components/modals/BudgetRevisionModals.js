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

  Swal.fire({
    title: `
      <h2 class="text-[17px] font-semibold text-gray-900 text-center !m-0 !p-0">
        Budget Revision
      </h2>
    `,
    html: `
      <div class="text-left space-y-4 max-h-[70vh] overflow-y-auto px-3">
        <!-- Original Request Info -->
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 class="text-sm font-semibold text-blue-800 mb-2">Original Request</h3>
          <p class="text-xs text-gray-600">Request #: ${request.request_no}</p>
          <p class="text-xs text-gray-600">Item: ${request.item_name}</p>
          <p class="text-xs text-gray-600">Quantity: ${request.quantity}</p>
          <p class="text-xs font-medium text-blue-700 mt-1">
            Original Amount: ${formatAmount(request.estimated_total, request.currency)}
          </p>
        </div>

        <!-- Budget Info -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 class="text-sm font-semibold text-gray-800 mb-2">Budget Information</h3>
          <p class="text-xs text-gray-600">Budget: ${budget.budget_name}</p>
          <p class="text-xs text-gray-600">Type: ${budget.budget_type}</p>
          <p class="text-xs text-gray-600">Remaining: ${formatAmount(budget.remaining_amount, budget.currency)}</p>
        </div>

        <!-- Revision Options -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-800">Revision Options</h3>
          
          <!-- Percentage Reduction -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Reduce by percentage:
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" class="revision-percent-btn px-3 py-2 text-xs rounded-lg bg-blue-600 text-white" data-percent="30">30%</button>
              <button type="button" class="revision-percent-btn px-3 py-2 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200" data-percent="40">40%</button>
              <button type="button" class="revision-percent-btn px-3 py-2 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200" data-percent="50">50%</button>
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

          <!-- Preview Result -->
          <div class="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div class="flex justify-between items-center">
              <span class="text-xs font-medium text-gray-700">Original Amount:</span>
              <span class="text-sm font-semibold text-gray-900" id="preview-original">
                ${formatAmount(request.estimated_total, request.currency)}
              </span>
            </div>
            <div class="flex justify-between items-center mt-1">
              <span class="text-xs font-medium text-gray-700">Reduction:</span>
              <span class="text-sm font-semibold text-red-600" id="preview-reduction">0%</span>
            </div>
            <div class="flex justify-between items-center mt-2 pt-2 border-t border-green-200">
              <span class="text-xs font-medium text-gray-700">New Amount:</span>
              <span class="text-base font-bold text-blue-600" id="preview-new">
                ${formatAmount(request.estimated_total, request.currency)}
              </span>
            </div>
          </div>

          <!-- Revision Reason -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Revision Reason *
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

        <div class="text-xs text-gray-500 pt-2 border-t">
          * Revision will create a new version of this budget request
        </div>
      </div>
    `,
    width: window.innerWidth > 768 ? "550px" : "95vw",
    padding: "0",
    showCancelButton: true,
    confirmButtonText: "Create Revision",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
    customClass: {
      popup: "rounded-xl overflow-hidden bg-white mx-4",
      htmlContainer: "!p-4 !m-0 !bg-white",
      actions: "!p-4 !m-0 !bg-gray-50 !border-t !border-gray-200 !flex !justify-end !gap-3",
      confirmButton: "!px-4 !py-2.5 !text-sm !font-medium !text-white !bg-blue-600 !rounded-lg hover:!bg-blue-700",
      cancelButton: "!px-4 !py-2.5 !text-sm !font-medium !text-gray-700 !bg-white !border !border-gray-300 !rounded-lg hover:!bg-gray-50",
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
          newAmount.value = newAmountValue.toFixed(0);
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