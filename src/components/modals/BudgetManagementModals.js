import Swal from "sweetalert2";
import { departmentService } from "@/services/departmentService";

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

// Create Budget Modal
export const showAddBudgetModal = async ({ onSave }) => {
  const currentYear = new Date().getFullYear().toString();
  const depts = await fetchDepartments();
  departmentsList = depts;

  const generateDepartmentOptions = (selectedDept = "") => {
    let options = '<option value="">Select Department</option>';
    departmentsList.forEach((dept) => {
      const selected = dept.name === selectedDept ? "selected" : "";
      options += `<option value="${dept.name}" ${selected}>${dept.name}</option>`;
    });
    return options;
  };

  const generateEntryHTML = (index, selectedDept = "") => `
    <div class="budget-entry border border-gray-200 rounded-lg p-4 mb-4 relative" data-index="${index}">
      <div class="flex justify-between items-center mb-3">
        <h4 class="text-sm font-semibold text-gray-700">Budget Entry #${index + 1}</h4>
        ${
          index > 0
            ? `
          <button type="button" class="remove-entry-btn text-red-500 hover:text-red-700 p-1" data-index="${index}">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 4V2h8v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        `
            : ""
        }
      </div>

      <div class="space-y-3">
        <!-- 1. BUDGET NAME -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Budget Name *
          </label>
          <input
            type="text"
            class="entry-budget_name w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="e.g., Server Procurement 2026"
            required
          >
        </div>

        <!-- 2. BUDGET CODE (Optional) -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Budget Code
          </label>
          <input
            type="text"
            class="entry-budget_code w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="e.g., BUD-2026-001"
          >
          <p class="text-xs text-gray-500 mt-1">Optional internal budget code</p>
        </div>

        <!-- 3. BUDGET TYPE -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">
            Budget Type *
          </label>
          <div class="flex flex-wrap gap-2 jenis-container">
            <button
              type="button"
              class="jenis-btn px-3 py-2 text-xs rounded-lg bg-blue-600 text-white"
              data-jenis="CAPEX"
            >
              CAPEX
            </button>
            <button
              type="button"
              class="jenis-btn px-3 py-2 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              data-jenis="OPEX"
            >
              OPEX
            </button>
          </div>
          <input type="hidden" class="entry-budget_type" value="CAPEX">
        </div>

        <!-- 4. TOTAL AMOUNT -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Total Amount (Rp) *
          </label>
          <input
            type="number"
            class="entry-total_amount w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Enter total budget amount"
            min="0"
            required
          >
        </div>

        <!-- 5. DEPARTMENT -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Department *
          </label>
          <select
            class="entry-department_name w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            required
          >
            ${generateDepartmentOptions(selectedDept)}
          </select>
        </div>

        <!-- 6. BUDGET OWNER (Optional) -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Budget Owner
          </label>
          <input
            type="text"
            class="entry-budget_owner w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="e.g., John Doe"
          >
          <p class="text-xs text-gray-500 mt-1">Person responsible for this budget</p>
        </div>

        <!-- 7. FISCAL YEAR -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Fiscal Year *
          </label>
          <input
            type="text"
            class="entry-fiscal_year w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            value="${currentYear}"
            placeholder="e.g., 2026"
            required
          >
          <p class="text-xs text-gray-500 mt-1">Budget allocation year</p>
        </div>

        <!-- 8. PERIOD (Optional) -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Period Start
            </label>
            <input
              type="date"
              class="entry-period_start w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Period End
            </label>
            <input
              type="date"
              class="entry-period_end w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
          </div>
        </div>

        <!-- 9. DESCRIPTION (Optional) -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            class="entry-description w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            rows="2"
            placeholder="Additional notes, purpose of budget, etc..."
          ></textarea>
        </div>
      </div>
    </div>
  `;

  let html = `
    <div class="text-left space-y-4 max-h-[70vh] overflow-y-auto px-3">
      <div class="sticky top-0 bg-white py-2 z-10 border-b border-gray-200 mb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span class="text-base font-semibold text-gray-900">Add New Budget</span>
          </div>
          <button
            type="button"
            id="add-more-entries"
            class="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Another
          </button>
        </div>
      </div>
      
      <div id="budget-entries-container">
        ${generateEntryHTML(0)}
      </div>

      <div class="text-xs text-gray-500 pt-2 border-t">
        * Required fields
      </div>
    </div>
  `;

  Swal.fire({
    title: "",
    html: html,
    width: window.innerWidth > 768 ? "650px" : "95vw",
    padding: "0",
    showCancelButton: true,
    confirmButtonText: "Save All",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
    customClass: {
      popup: "rounded-xl overflow-hidden bg-white mx-4",
      htmlContainer: "!p-4 !m-0 !bg-white",
      actions:
        "!p-4 !m-0 !bg-gray-50 !border-t !border-gray-200 !flex !justify-end !gap-3",
      confirmButton:
        "!px-4 !py-2.5 !text-sm !font-medium !text-white !bg-blue-600 !rounded-lg hover:!bg-blue-700",
      cancelButton:
        "!px-4 !py-2.5 !text-sm !font-medium !text-gray-700 !bg-white !border !border-gray-300 !rounded-lg hover:!bg-gray-50",
    },
    didOpen: () => {
      const setupJenisButtons = (container) => {
        const jenisButtons = container.querySelectorAll(".jenis-btn");
        jenisButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const parentContainer = e.target.closest(".budget-entry");
            const buttons = parentContainer.querySelectorAll(".jenis-btn");

            buttons.forEach((b) => {
              b.classList.remove("bg-blue-600", "text-white");
              b.classList.add(
                "bg-gray-100",
                "text-gray-700",
                "hover:bg-gray-200",
              );
            });

            btn.classList.remove(
              "bg-gray-100",
              "text-gray-700",
              "hover:bg-gray-200",
            );
            btn.classList.add("bg-blue-600", "text-white");

            const jenis = btn.getAttribute("data-jenis");
            parentContainer.querySelector(".entry-budget_type").value = jenis;
          });
        });
      };
      const setupRemoveButtons = () => {
        document.querySelectorAll(".remove-entry-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            const entry = btn.closest(".budget-entry");
            if (entry) {
              entry.remove();
            }
          });
        });
      };

      setupJenisButtons(document);
      setupRemoveButtons();

      document
        .getElementById("add-more-entries")
        ?.addEventListener("click", () => {
          const container = document.getElementById("budget-entries-container");
          const currentCount = container.children.length;

          const newEntry = document.createElement("div");
          newEntry.innerHTML = generateEntryHTML(currentCount);

          container.appendChild(newEntry.firstElementChild);
          const lastEntry = container.lastElementChild;
          setupJenisButtons(lastEntry);
          setupRemoveButtons();

          lastEntry.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
    },
    preConfirm: () => {
      const entries = document.querySelectorAll(".budget-entry");
      const budgets = [];
      const errors = [];

      entries.forEach((entry, index) => {
        const fiscal_year =
          entry.querySelector(".entry-fiscal_year")?.value?.trim() || "";
        const budget_code =
          entry.querySelector(".entry-budget_code")?.value?.trim() || null;
        const department_name =
          entry.querySelector(".entry-department_name")?.value || "";
        const budget_type =
          entry.querySelector(".entry-budget_type")?.value || "CAPEX";
        const budget_name =
          entry.querySelector(".entry-budget_name")?.value?.trim() || "";
        const total_amount =
          entry.querySelector(".entry-total_amount")?.value || "";
        const budget_owner =
          entry.querySelector(".entry-budget_owner")?.value?.trim() || null;
        const period_start =
          entry.querySelector(".entry-period_start")?.value || null;
        const period_end =
          entry.querySelector(".entry-period_end")?.value || null;
        const description =
          entry.querySelector(".entry-description")?.value?.trim() || "";

        const entryErrors = [];

        if (!fiscal_year) entryErrors.push("Fiscal year is required");
        if (!department_name) entryErrors.push("Department is required");
        if (!budget_name) entryErrors.push("Budget name is required");
        if (!total_amount || total_amount <= 0)
          entryErrors.push("Total amount must be greater than 0");

        if (entryErrors.length > 0) {
          errors.push(`Entry #${index + 1}: ${entryErrors.join(", ")}`);
        } else {
          budgets.push({
            fiscal_year,
            budget_code,
            department_name,
            budget_type,
            budget_name,
            total_amount,
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

      if (budgets.length === 0) {
        Swal.showValidationMessage("At least one budget entry is required");
        return false;
      }

      return budgets;
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const saveAll = async () => {
        for (const budget of result.value) {
          await onSave(budget);
        }
      };
      saveAll();
    }
  });
};

// Edit Budget Modal
export const showEditBudgetModal = async ({ budget, onSave }) => {
  const depts = await fetchDepartments();
  departmentsList = depts;

  const generateDepartmentOptions = () => {
    let options = '<option value="">Select Department</option>';
    departmentsList.forEach((dept) => {
      const selected = dept.name === budget.department_name ? "selected" : "";
      options += `<option value="${dept.name}" ${selected}>${dept.name}</option>`;
    });
    return options;
  };

  Swal.fire({
    title: "",
    html: `
      <div class="text-left space-y-4 max-h-[70vh] overflow-y-auto px-3">
        <div class="sticky top-0 bg-white py-2 z-10 border-b border-gray-200 mb-3">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="text-blue-600">
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14"/>
              <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>

            <span class="text-base font-semibold text-gray-900">
              Edit Budget
            </span>
          </div>
        </div>
        <div class="space-y-3">
          <!-- 1. BUDGET NAME -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Budget Name *
            </label>
            <input
              type="text"
              id="edit-budget_name"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value="${budget.budget_name || ""}"
              placeholder="Enter budget name"
              required
            >
            <div id="name-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <!-- 2. BUDGET CODE (Optional) -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Budget Code
            </label>
            <input
              type="text"
              id="edit-budget_code"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value="${budget.budget_code || ""}"
              placeholder="e.g., BUD-2026-001"
            >
          </div>

          <!-- 3. BUDGET TYPE -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Budget Type *
            </label>
            <div class="flex flex-wrap gap-2" id="edit-jenis-container">
              <button
                type="button"
                class="jenis-btn px-3 py-2 text-xs rounded-lg ${budget.budget_type === "CAPEX" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}"
                data-jenis="CAPEX"
              >
                CAPEX
              </button>
              <button
                type="button"
                class="jenis-btn px-3 py-2 text-xs rounded-lg ${budget.budget_type === "OPEX" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}"
                data-jenis="OPEX"
              >
                OPEX
              </button>
            </div>
            <input type="hidden" id="edit-budget_type" value="${budget.budget_type || "CAPEX"}">
            <div id="type-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <!-- 4. TOTAL AMOUNT -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Total Amount (Rp) *
            </label>
            <input
              type="number"
              id="edit-total_amount"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value="${budget.total_amount || ""}"
              min="0"
              required
            >
            <div id="total-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <!-- 5. FINANCIAL STATUS (Read-only) -->
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Reserved
              </label>
              <input
                type="text"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                value="${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(budget.reserved_amount || 0)}"
                readonly
                disabled
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Used
              </label>
              <input
                type="text"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                value="${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(budget.used_amount || 0)}"
                readonly
                disabled
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Remaining
              </label>
              <input
                type="text"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                value="${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(budget.remaining_amount || 0)}"
                readonly
                disabled
              >
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-1">Financial status is auto-calculated</p>

          <!-- 6. DEPARTMENT -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Department *
            </label>
            <select
              id="edit-department_name"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            >
              ${generateDepartmentOptions()}
            </select>
            <div id="department-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <!-- 7. BUDGET OWNER (Optional) -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Budget Owner
            </label>
            <input
              type="text"
              id="edit-budget_owner"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value="${budget.budget_owner || ""}"
              placeholder="Person responsible"
            >
          </div>

          <!-- 8. FISCAL YEAR -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Fiscal Year *
            </label>
            <input
              type="text"
              id="edit-fiscal_year"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value="${budget.fiscal_year || ""}"
              placeholder="e.g., 2026"
              required
            >
            <p class="text-xs text-gray-500 mt-1">Budget allocation year</p>
            <div id="year-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <!-- 9. PERIOD (Optional) -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Period Start
              </label>
              <input
                type="date"
                id="edit-period_start"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                value="${budget.period_start ? budget.period_start.split("T")[0] : ""}"
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Period End
              </label>
              <input
                type="date"
                id="edit-period_end"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                value="${budget.period_end ? budget.period_end.split("T")[0] : ""}"
              >
            </div>
          </div>

          <!-- 10. DESCRIPTION (Optional) -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="edit-description"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows="2"
              placeholder="Additional notes, purpose of budget, etc..."
            >${budget.description || ""}</textarea>
          </div>
        </div>

        <div class="text-xs text-gray-500 pt-2 border-t">
          * Required fields
        </div>
      </div>
    `,
    width: window.innerWidth > 768 ? "650px" : "95vw",
    padding: "0",
    showCancelButton: true,
    confirmButtonText: "Update",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
    customClass: {
      popup: "rounded-xl overflow-hidden bg-white mx-4",
      title:
        "!text-left !p-4 !m-0 !bg-white !border-b !border-gray-200 !text-gray-900",
      htmlContainer: "!p-4 !m-0 !bg-white",
      actions:
        "!p-4 !m-0 !bg-gray-50 !border-t !border-gray-200 !flex !justify-end !gap-3",
      confirmButton:
        "!px-4 !py-2.5 !text-sm !font-medium !text-white !bg-blue-600 !rounded-lg hover:!bg-blue-700",
      cancelButton:
        "!px-4 !py-2.5 !text-sm !font-medium !text-gray-700 !bg-white !border !border-gray-300 !rounded-lg hover:!bg-gray-50",
    },
    preConfirm: () => {
      const formData = {
        fiscal_year:
          document.getElementById("edit-fiscal_year")?.value?.trim() || "",
        budget_code:
          document.getElementById("edit-budget_code")?.value?.trim() || null,
        department_name:
          document.getElementById("edit-department_name")?.value || "",
        budget_type:
          document.getElementById("edit-budget_type")?.value || "CAPEX",
        budget_name:
          document.getElementById("edit-budget_name")?.value?.trim() || "",
        total_amount: document.getElementById("edit-total_amount")?.value || "",
        budget_owner:
          document.getElementById("edit-budget_owner")?.value?.trim() || null,
        period_start:
          document.getElementById("edit-period_start")?.value || null,
        period_end: document.getElementById("edit-period_end")?.value || null,
        description:
          document.getElementById("edit-description")?.value?.trim() || "",
      };

      const errors = {};

      if (!formData.fiscal_year) {
        errors.year = "Fiscal year is required";
        document.getElementById("year-error").textContent = errors.year;
        document.getElementById("year-error").classList.remove("hidden");
      } else {
        document.getElementById("year-error").classList.add("hidden");
      }

      if (!formData.department_name) {
        errors.department = "Department is required";
        document.getElementById("department-error").textContent =
          errors.department;
        document.getElementById("department-error").classList.remove("hidden");
      } else {
        document.getElementById("department-error").classList.add("hidden");
      }

      if (!formData.budget_name) {
        errors.name = "Budget name is required";
        document.getElementById("name-error").textContent = errors.name;
        document.getElementById("name-error").classList.remove("hidden");
      } else {
        document.getElementById("name-error").classList.add("hidden");
      }

      if (!formData.total_amount || formData.total_amount <= 0) {
        errors.total = "Total amount must be greater than 0";
        document.getElementById("total-error").textContent = errors.total;
        document.getElementById("total-error").classList.remove("hidden");
      } else {
        document.getElementById("total-error").classList.add("hidden");
      }

      if (Object.keys(errors).length > 0) {
        Swal.showValidationMessage("Please fix the errors above");
        return false;
      }

      return formData;
    },
    didOpen: () => {
      const jenisButtons = document.querySelectorAll(
        "#edit-jenis-container .jenis-btn",
      );
      jenisButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          jenisButtons.forEach((b) => {
            b.classList.remove("bg-blue-600", "text-white");
            b.classList.add(
              "bg-gray-100",
              "text-gray-700",
              "hover:bg-gray-200",
            );
          });
          btn.classList.remove(
            "bg-gray-100",
            "text-gray-700",
            "hover:bg-gray-200",
          );
          btn.classList.add("bg-blue-600", "text-white");

          const jenis = btn.getAttribute("data-jenis");
          document.getElementById("edit-budget_type").value = jenis;
        });
      });
      document.getElementById("edit-budget_name")?.focus();
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

        <!-- Baris 10: Budget ID (full width) -->
        <div class="col-span-2 border-t mt-1 pt-2">
          <div class="${label}">Budget ID</div>
          <div class="${value} font-mono text-xs">${budget.id}</div>
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
