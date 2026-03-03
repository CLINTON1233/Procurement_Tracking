import Swal from "sweetalert2";
import { departmentService } from "@/services/departmentService";
import { CURRENCIES, getCurrencySymbol } from "@/utils/currency";

let departmentsList = [];

const fetchDepartments = async () => {
  try {
    const data = await departmentService.getAllDepartments();
    departmentsList = data;
    return data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
};

// Format IDR
const formatIDR = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

// Get currency name
const getCurrencyName = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? `${currency.code} — ${currency.name} (${currency.symbol})` : currencyCode;
};

// Bulk Edit Budget Modal - Persis seperti halaman edit per ID
export const showBulkEditBudgetModal = async ({ budgets, onSave }) => {
  const currentYear = new Date().getFullYear().toString();
  const depts = await fetchDepartments();
  departmentsList = depts;

  const generateDepartmentOptions = (selectedDept = "") => {
    let options = '<option value="">Select Department</option>';
    departmentsList.forEach((dept) => {
      const selected = dept.name === selectedDept ? 'selected' : '';
      options += `<option value="${dept.name}" ${selected}>${dept.name}</option>`;
    });
    return options;
  };

  const generateBudgetEntries = () => {
    let entriesHtml = "";

    budgets.forEach((budget, index) => {
      // Hitung amount dalam IDR untuk validasi OPEX
      const amountInIDR = budget.total_amount * (budget.currency === 'IDR' ? 1 : 15700); // Asumsi rate USD 15700
      const isOpexExceed = budget.budget_type === "OPEX" && amountInIDR > 16000000;

      entriesHtml += `
        <div class="budget-entry border border-gray-200 rounded-lg p-5 mb-6 relative bg-white shadow-sm" data-id="${budget.id}" data-index="${index}">
          <!-- Header dengan nomor dan nama budget -->
          <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold">
                ${index + 1}
              </div>
              <h4 class="text-sm font-semibold text-gray-800">${budget.budget_name || "Budget Entry"}</h4>
            </div>
            ${budget.budget_code ? `<span class="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">${budget.budget_code}</span>` : ''}
            <input type="hidden" class="entry-id" value="${budget.id}">
          </div>

          <div class="space-y-4">
            <!-- 1. BUDGET NAME & CODE -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1.5">
                  Budget Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  class="entry-budget_name w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value="${budget.budget_name || ""}"
                  placeholder="e.g. Capex IT Infrastructure 2026"
                >
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1.5">
                  Budget Code
                </label>
                <input
                  type="text"
                  class="entry-budget_code w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value="${budget.budget_code || ""}"
                  placeholder="BUD-2026-001"
                >
                <p class="text-xs text-gray-400 mt-1">Optional internal budget code</p>
              </div>
            </div>

            <!-- 2. BUDGET TYPE (Radio) -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                Budget Type <span class="text-red-500">*</span>
              </label>
              <div class="flex gap-6 mt-1 jenis-container">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="budget_type_${budget.id}"
                    class="entry-budget_type-radio w-4 h-4 accent-blue-600"
                    data-jenis="CAPEX"
                    ${budget.budget_type === "CAPEX" ? 'checked' : ''}
                  >
                  <span class="text-sm text-gray-700">CAPEX</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="budget_type_${budget.id}"
                    class="entry-budget_type-radio w-4 h-4 accent-blue-600"
                    data-jenis="OPEX"
                    ${budget.budget_type === "OPEX" ? 'checked' : ''}
                  >
                  <span class="text-sm text-gray-700">OPEX</span>
                </label>
              </div>
              <input type="hidden" class="entry-budget_type" value="${budget.budget_type || "CAPEX"}">
              ${budget.budget_type === "OPEX" ? `
                <p class="text-xs text-amber-600 mt-2">
                  Note: OPEX budget maximum is IDR 16,000,000
                </p>
              ` : ''}
            </div>

            <!-- 3. CURRENCY (Read-only) -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                Currency
              </label>
              <div class="relative">
                <input
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  value="${getCurrencyName(budget.currency || "IDR")}"
                  readonly
                  disabled
                >
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                    <line x1="17" y1="6" x2="5" y2="18"></line>
                  </svg>
                </div>
              </div>
              <input type="hidden" class="entry-currency" value="${budget.currency || "IDR"}">
              <p class="text-xs text-gray-400 mt-1">Currency is fixed and cannot be changed</p>
            </div>

            <!-- 4. TOTAL AMOUNT -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                Total Amount <span class="text-red-500">*</span>
              </label>
              <input
                type="number"
                class="entry-total_amount w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${isOpexExceed ? 'border-red-500' : ''}"
                value="${budget.total_amount || ""}"
                placeholder="Enter total budget amount"
                min="0"
              >
              ${isOpexExceed ? `
                <p class="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  OPEX budget exceeds IDR 16,000,000 limit
                </p>
              ` : ''}
            </div>

            <!-- 5. FINANCIAL STATUS - Minimalist Gray Design -->
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Financial Status</p>
              <div class="grid grid-cols-3 gap-4">
                <!-- Reserved -->
                <div class="text-center">
                  <p class="text-xs text-gray-500 mb-1">Reserved</p>
                  <p class="text-sm font-semibold text-gray-700">${formatIDR(budget.reserved_amount || 0)}</p>
                </div>

                <!-- Vertical Divider -->
                <div class="relative">
                  <div class="text-center">
                    <p class="text-xs text-gray-500 mb-1">Used</p>
                    <p class="text-sm font-semibold text-gray-700">${formatIDR(budget.used_amount || 0)}</p>
                  </div>
                  <div class="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-gray-200 hidden sm:block"></div>
                  <div class="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-gray-200 hidden sm:block"></div>
                </div>

                <!-- Remaining -->
                <div class="text-center">
                  <p class="text-xs text-gray-500 mb-1">Remaining</p>
                  <p class="text-sm font-semibold text-gray-700">${formatIDR(budget.remaining_amount || 0)}</p>
                </div>
              </div>
              <p class="text-xs text-gray-400 text-center mt-3 pt-2 border-t border-gray-100">
                Auto-calculated based on transactions
              </p>
            </div>

            <!-- 6. DEPARTMENT -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                Department <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <select
                  class="entry-department_name w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition"
                >
                  ${generateDepartmentOptions(budget.department_name)}
                </select>
                <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <!-- 7. BUDGET OWNER -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                Budget Owner
              </label>
              <input
                type="text"
                class="entry-budget_owner w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value="${budget.budget_owner || ""}"
                placeholder="Person responsible"
              >
              <p class="text-xs text-gray-400 mt-1">Person responsible for this budget</p>
            </div>

            <!-- 8. FISCAL YEAR -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                Fiscal Year <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                class="entry-fiscal_year w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value="${budget.fiscal_year || currentYear}"
                placeholder="2026"
              >
              <p class="text-xs text-gray-400 mt-1">Budget allocation year</p>
            </div>

            <!-- 9. BUDGET PERIOD (Optional) -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1.5">
                  Period Start
                </label>
                <input
                  type="date"
                  class="entry-period_start w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value="${budget.period_start ? budget.period_start.split("T")[0] : ""}"
                >
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1.5">
                  Period End
                </label>
                <input
                  type="date"
                  class="entry-period_end w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value="${budget.period_end ? budget.period_end.split("T")[0] : ""}"
                >
              </div>
            </div>

            <!-- 10. DESCRIPTION -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                Description
              </label>
              <textarea
                class="entry-description w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                rows="2"
                placeholder="Additional notes, purpose of budget, scope, etc..."
              >${budget.description || ""}</textarea>
            </div>
          </div>
        </div>
      `;
    });

    return entriesHtml;
  };

  let html = `
    <div class="text-left space-y-4 max-h-[70vh] overflow-y-auto px-3 py-2">
      <div class="sticky top-0 bg-white py-3 z-10 border-b border-gray-200 mb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14"/>
                <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <span class="text-base font-semibold text-gray-900">
              Edit ${budgets.length} Selected Budgets
            </span>
          </div>
          <span class="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600">
            Multiple Entries
          </span>
        </div>
        <p class="text-xs text-gray-500 mt-1">Update multiple budgets at once</p>
      </div>
      
      <div id="budget-entries-container">
        ${generateBudgetEntries()}
      </div>

      <div class="text-xs text-gray-500 pt-3 border-t border-gray-200">
        <span class="text-red-500">*</span> Required fields
      </div>
    </div>
  `;

  Swal.fire({
    title: "",
    html: html,
    width: window.innerWidth > 768 ? "800px" : "95vw",
    padding: "0",
    showCancelButton: true,
    confirmButtonText: `Update ${budgets.length} Budgets`,
    cancelButtonText: "Cancel",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
    customClass: {
      popup: "rounded-xl overflow-hidden bg-white mx-4",
      htmlContainer: "!p-0 !m-0 !bg-white",
      actions: "!p-4 !m-0 !bg-gray-50 !border-t !border-gray-200 !flex !justify-end !gap-3",
      confirmButton: "!px-6 !py-2.5 !text-sm !font-medium !text-white !bg-blue-600 !rounded-lg hover:!bg-blue-700 !shadow-sm",
      cancelButton: "!px-6 !py-2.5 !text-sm !font-medium !text-gray-700 !bg-white !border !border-gray-300 !rounded-lg hover:!bg-gray-50 !shadow-sm",
    },
    didOpen: () => {
      // Setup radio buttons untuk budget type
      const radioButtons = document.querySelectorAll(".entry-budget_type-radio");
      radioButtons.forEach((radio) => {
        radio.addEventListener("change", (e) => {
          const parentContainer = e.target.closest(".budget-entry");
          const jenis = e.target.getAttribute("data-jenis");
          parentContainer.querySelector(".entry-budget_type").value = jenis;
          
          // Tampilkan pesan untuk OPEX jika perlu
          const opexNote = parentContainer.querySelector(".text-amber-600");
          if (opexNote) {
            opexNote.style.display = jenis === "OPEX" ? "block" : "none";
          }
        });
      });

      // Setup untuk total amount validation (optional, bisa ditambahkan real-time validation)
      const totalAmountInputs = document.querySelectorAll(".entry-total_amount");
      totalAmountInputs.forEach((input) => {
        input.addEventListener("input", (e) => {
          const parentContainer = e.target.closest(".budget-entry");
          const budgetType = parentContainer.querySelector(".entry-budget_type").value;
          const currency = parentContainer.querySelector(".entry-currency").value;
          const amount = parseFloat(e.target.value) || 0;
          
          // Simple validation untuk OPEX (asumsi rate USD 15700)
          if (budgetType === "OPEX") {
            const amountInIDR = currency === "IDR" ? amount : amount * 15700;
            if (amountInIDR > 16000000) {
              e.target.classList.add("border-red-500");
              if (!parentContainer.querySelector(".opex-error")) {
                const errorMsg = document.createElement("p");
                errorMsg.className = "text-xs text-red-500 mt-1 flex items-center gap-1 opex-error";
                errorMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> OPEX budget exceeds IDR 16,000,000 limit';
                e.target.parentNode.appendChild(errorMsg);
              }
            } else {
              e.target.classList.remove("border-red-500");
              const errorMsg = parentContainer.querySelector(".opex-error");
              if (errorMsg) errorMsg.remove();
            }
          }
        });
      });
    },
    preConfirm: () => {
      const entries = document.querySelectorAll(".budget-entry");
      const updatedBudgets = [];
      const errors = [];

      entries.forEach((entry, index) => {
        const id = entry.querySelector(".entry-id")?.value;
        const fiscal_year = entry.querySelector(".entry-fiscal_year")?.value?.trim() || "";
        const budget_code = entry.querySelector(".entry-budget_code")?.value?.trim() || null;
        const department_name = entry.querySelector(".entry-department_name")?.value || "";
        const budget_type = entry.querySelector(".entry-budget_type")?.value || "CAPEX";
        const currency = entry.querySelector(".entry-currency")?.value || "IDR";
        const budget_name = entry.querySelector(".entry-budget_name")?.value?.trim() || "";
        const total_amount = entry.querySelector(".entry-total_amount")?.value || "";
        const budget_owner = entry.querySelector(".entry-budget_owner")?.value?.trim() || null;
        const period_start = entry.querySelector(".entry-period_start")?.value || null;
        const period_end = entry.querySelector(".entry-period_end")?.value || null;
        const description = entry.querySelector(".entry-description")?.value?.trim() || "";

        const entryErrors = [];

        if (!fiscal_year) entryErrors.push("Fiscal year is required");
        if (!department_name) entryErrors.push("Department is required");
        if (!budget_name) entryErrors.push("Budget name is required");
        if (!total_amount || parseFloat(total_amount) <= 0) entryErrors.push("Total amount must be greater than 0");

        // Validasi OPEX
        if (budget_type === "OPEX" && total_amount) {
          const amount = parseFloat(total_amount);
          const amountInIDR = currency === "IDR" ? amount : amount * 15700; // Asumsi rate USD 15700
          if (amountInIDR > 16000000) {
            entryErrors.push("OPEX budget cannot exceed IDR 16,000,000");
          }
        }

        if (entryErrors.length > 0) {
          errors.push(`Budget #${index + 1}: ${entryErrors.join(", ")}`);
        } else {
          updatedBudgets.push({
            id: Number(id),
            fiscal_year,
            budget_code,
            department_name,
            budget_type,
            currency,
            budget_name,
            total_amount: parseFloat(total_amount),
            budget_owner,
            period_start,
            period_end,
            description,
          });
        }
      });

      if (errors.length > 0) {
        Swal.showValidationMessage(errors.join("<br>"));
        return false;
      }

      if (updatedBudgets.length === 0) {
        Swal.showValidationMessage("No valid budgets to update");
        return false;
      }

      return updatedBudgets;
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      onSave(result.value);
    }
  });
};

// Delete Budget Modal
export const showDeleteBudgetModal = ({ budget, onConfirm }) => {
  Swal.fire({
    title: `Delete ${budget.budget_name || "Budget"}?`,
    text: "This data cannot be recovered!",
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
          text: error.message || "Failed to delete budget",
          icon: "error",
          confirmButtonColor: "#1e40af",
        });
      }
    }
  });
};

export const showBudgetDetailsModal = (budget) => {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const label = "text-[11px] text-gray-500 leading-tight";
  const value = "text-[15px] font-semibold text-gray-900 leading-tight";

  Swal.fire({
    title: `
      <h2 class="text-[17px] font-semibold text-gray-900 text-center !m-0 !p-0">
        ${budget.budget_name || "Budget Details"}
      </h2>
    `,
    html: `
      <div class="grid grid-cols-2 gap-y-3 gap-x-6 text-left mt-1">
        <!-- Baris 1: Type & Budget Code -->
        <div>
          <div class="${label}">Type</div>
          <div class="${value}">${budget.budget_type || "N/A"}</div>
        </div>
        <div>
          <div class="${label}">Budget Code</div>
          <div class="${value}">${budget.budget_code || "-"}</div>
        </div>

        <!-- Baris 2: Total Amount & Remaining -->
        <div>
          <div class="${label}">Total Amount</div>
          <div class="${value}">${formatRupiah(budget.total_amount)}</div>
        </div>
        <div>
          <div class="${label}">Remaining</div>
          <div class="text-[15px] font-semibold text-green-600 leading-tight">${formatRupiah(budget.remaining_amount)}</div>
        </div>

        <!-- Baris 3: Reserved & Used -->
        <div>
          <div class="${label}">Reserved</div>
          <div class="text-[15px] font-semibold text-yellow-600 leading-tight">${formatRupiah(budget.reserved_amount)}</div>
        </div>
        <div>
          <div class="${label}">Used</div>
          <div class="text-[15px] font-semibold text-blue-600 leading-tight">${formatRupiah(budget.used_amount)}</div>
        </div>

        <!-- Baris 4: Department & Budget Owner -->
        <div>
          <div class="${label}">Department</div>
          <div class="${value}">${budget.department_name || "-"}</div>
        </div>
        <div>
          <div class="${label}">Budget Owner</div>
          <div class="${value}">${budget.budget_owner || "-"}</div>
        </div>

        <!-- Baris 5: Fiscal Year & Status -->
        <div>
          <div class="${label}">Fiscal Year</div>
          <div class="${value}">${budget.fiscal_year || "-"}</div>
        </div>
        <div>
          <div class="${label}">Status</div>
          <div class="text-[15px] font-semibold ${budget.is_active ? "text-green-600" : "text-gray-500"} leading-tight">
            ${budget.is_active ? "Active" : "Inactive"}
          </div>
        </div>

        <!-- Baris 6: Period Start & Period End (jika ada) -->
        ${
          budget.period_start
            ? `
        <div>
          <div class="${label}">Period Start</div>
          <div class="${value}">${formatDate(budget.period_start)}</div>
        </div>
        `
            : ""
        }
        ${
          budget.period_end
            ? `
        <div>
          <div class="${label}">Period End</div>
          <div class="${value}">${formatDate(budget.period_end)}</div>
        </div>
        `
            : ""
        }

        <!-- Baris 7: Description (full width jika ada) -->
        ${
          budget.description
            ? `
        <div class="col-span-2">
          <div class="${label}">Description</div>
          <div class="${value}">${budget.description}</div>
        </div>
        `
            : ""
        }

        <!-- Baris 8: Revision Info (jika ada) -->
        ${
          budget.revision_no > 0
            ? `
        <div>
          <div class="${label}">Revision No.</div>
          <div class="${value}">${budget.revision_no}</div>
        </div>
        `
            : ""
        }
        ${
          budget.last_revision_at
            ? `
        <div>
          <div class="${label}">Last Revision</div>
          <div class="${value}">${formatDate(budget.last_revision_at)}</div>
        </div>
        `
            : ""
        }

        <!-- Baris 9: Created At & Updated At -->
        <div>
          <div class="${label}">Created At</div>
          <div class="${value}">${formatDate(budget.created_at)}</div>
        </div>
        <div>
          <div class="${label}">Updated At</div>
          <div class="${value}">${formatDate(budget.updated_at)}</div>
        </div>
      </div>
    `,
    width: 550,
    showConfirmButton: true,
    showCancelButton: false,
    confirmButtonText: "Close",
    confirmButtonColor: "#2563eb",
    customClass: {
      popup: "rounded-lg bg-white p-4",
      title: "!pb-1 !pt-0",
      htmlContainer: "!pb-1 !pt-1",
      confirmButton:
        "!flex !items-center !justify-center w-[110px] h-[38px] bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium !leading-none mx-auto",
    },
  });
};