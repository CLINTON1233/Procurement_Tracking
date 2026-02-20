import Swal from "sweetalert2";
import { Plus, Trash2 } from "lucide-react";
import { departmentService } from "@/services/departmentService";

let departmentsList = [];

const fetchDepartments = async () => {
  try {
    const data = await departmentService.getAllDepartments();
    departmentsList = data;
    return data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
};

  const handleAddClick = () => {
    showAddBudgetModal({
      onSave: async (formData) => {
        try {
          await budgetService.createBudget(formData);
          Swal.fire({
            title: "Success!",
            text: "Budget added successfully",
            icon: "success",
            timer: 1500,
            confirmButtonColor: "#1e40af",
          });
          fetchBudgets();
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: "Failed to add budget",
            icon: "error",
            confirmButtonColor: "#1e40af",
          });
        }
      },
    });
  };

  const handleEditClick = (budget) => {
    showEditBudgetModal({
      budget,
      onSave: async (formData) => {
        try {
          await budgetService.updateBudget(budget.id, formData);
          Swal.fire({
            title: "Success!",
            text: "Budget updated successfully",
            icon: "success",
            timer: 1500,
            confirmButtonColor: "#1e40af",
          });
          fetchBudgets();
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: "Failed to update budget",
            icon: "error",
            confirmButtonColor: "#1e40af",
          });
        }
      },
    });
  };

  const handleDeleteClick = (budget) => {
    showDeleteBudgetModal({
      budget,
      onConfirm: async () => {
        try {
          await budgetService.deleteBudget(budget.id);
          Swal.fire({
            title: "Deleted!",
            text: "Budget deleted successfully",
            icon: "success",
            confirmButtonColor: "#1e40af",
          });
          fetchBudgets();
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: "Failed to delete budget",
            icon: "error",
            confirmButtonColor: "#1e40af",
          });
        }
      },
    });
  };


export const showAddBudgetModal = ({ onSave }) => {
  const currentYear = new Date().getFullYear();
  fetchDepartments().then((depts) => {
    departmentsList = depts;
  });

  const generateDepartmentOptions = (selectedDept = '') => {
    let options = '<option value="">Select Department</option>';
    departmentsList.forEach(dept => {
      const selected = dept.name === selectedDept ? 'selected' : '';
      options += `<option value="${dept.name}" ${selected}>${dept.name}</option>`;
    });
    return options;
  };

  const generateEntryHTML = (index, selectedDept = '') => `
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
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Year *
          </label>
          <input
            type="text"
            class="entry-tahun w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            value="${currentYear}"
            placeholder="2024"
            required
          >
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Department *
          </label>
          <select
            class="entry-department w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            required
          >
            ${generateDepartmentOptions(selectedDept)}
          </select>
        </div>

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
          <input type="hidden" class="entry-jenis" value="CAPEX">
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Budget Name *
          </label>
          <input
            type="text"
            class="entry-nama_budget w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Server Purchase, Software License"
            required
          >
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Total Budget (Rp) *
          </label>
          <input
            type="number"
            class="entry-total_budget w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="10000000"
            min="0"
            required
          >
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            class="entry-keterangan w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            rows="1"
            placeholder="Additional notes..."
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
    width: window.innerWidth > 768 ? "600px" : "95vw",
    padding: "0",
    showCancelButton: true,
    confirmButtonText: "Save All",
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
      const setupJenisButtons = (container) => {
        const jenisButtons = container.querySelectorAll(".jenis-btn");
        jenisButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const parentContainer = e.target.closest(".budget-entry");
            const buttons = parentContainer.querySelectorAll(".jenis-btn");

            buttons.forEach((b) => {
              b.classList.remove("bg-blue-600", "text-white");
              b.classList.add("bg-gray-100", "text-gray-700", "hover:bg-gray-200");
            });

            btn.classList.remove("bg-gray-100", "text-gray-700", "hover:bg-gray-200");
            btn.classList.add("bg-blue-600", "text-white");

            const jenis = btn.getAttribute("data-jenis");
            parentContainer.querySelector(".entry-jenis").value = jenis;
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

      document.getElementById("add-more-entries")?.addEventListener("click", () => {
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
        const tahun = entry.querySelector(".entry-tahun")?.value?.trim() || "";
        const department = entry.querySelector(".entry-department")?.value || "";
        const jenis = entry.querySelector(".entry-jenis")?.value || "CAPEX";
        const nama_budget = entry.querySelector(".entry-nama_budget")?.value?.trim() || "";
        const total_budget = entry.querySelector(".entry-total_budget")?.value || "";
        const keterangan = entry.querySelector(".entry-keterangan")?.value?.trim() || "";

        const entryErrors = [];

        if (!tahun) entryErrors.push("Year is required");
        if (!department) entryErrors.push("Department is required");
        if (!nama_budget) entryErrors.push("Budget name is required");
        if (!total_budget || total_budget <= 0)
          entryErrors.push("Total budget must be greater than 0");

        if (entryErrors.length > 0) {
          errors.push(`Entry #${index + 1}: ${entryErrors.join(", ")}`);
        } else {
          budgets.push({
            tahun,
            department_name: department,
            jenis,
            nama_budget,
            total_budget,
            keterangan,
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

export const showEditBudgetModal = ({ budget, onSave }) => {
  fetchDepartments().then((depts) => {
    departmentsList = depts;
  });

  const generateDepartmentOptions = () => {
    let options = '<option value="">Select Department</option>';
    departmentsList.forEach(dept => {
      const selected = dept.name === budget.department ? 'selected' : '';
      options += `<option value="${dept.name}" ${selected}>${dept.name}</option>`;
    });
    return options;
  };

  Swal.fire({
    title: `<span class="text-gray-900 font-semibold">Edit Budget</span>`,
    html: `
      <div class="text-left space-y-4 max-h-[70vh] overflow-y-auto px-3">
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Year *
            </label>
            <input
              type="text"
              id="swal-tahun"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value="${budget.tahun || ""}"
              required
            >
            <div id="tahun-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Department *
            </label>
            <select
              id="swal-department"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            >
              ${generateDepartmentOptions()}
            </select>
            <div id="department-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Budget Type *
            </label>
            <div class="flex flex-wrap gap-2" id="swal-jenis-container">
              <button
                type="button"
                class="jenis-btn px-3 py-2 text-xs rounded-lg ${budget.jenis === "CAPEX" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}"
                data-jenis="CAPEX"
              >
                CAPEX
              </button>
              <button
                type="button"
                class="jenis-btn px-3 py-2 text-xs rounded-lg ${budget.jenis === "OPEX" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}"
                data-jenis="OPEX"
              >
                OPEX
              </button>
            </div>
            <input type="hidden" id="swal-jenis" value="${budget.jenis || "CAPEX"}">
            <div id="jenis-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Budget Name *
            </label>
            <input
              type="text"
              id="swal-nama_budget"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value="${budget.nama_budget || ""}"
              required
            >
            <div id="nama-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Total Budget (Rp) *
            </label>
            <input
              type="number"
              id="swal-total_budget"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value="${budget.total_budget || ""}"
              min="0"
              required
            >
            <div id="total-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="swal-keterangan"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows="2"
            >${budget.keterangan || ""}</textarea>
          </div>
        </div>

        <div class="text-xs text-gray-500 pt-2 border-t">
          * Required fields
        </div>
      </div>
    `,
    width: window.innerWidth > 768 ? "500px" : "95vw",
    padding: "0",
    showCancelButton: true,
    confirmButtonText: "Update",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
    customClass: {
      popup: "rounded-xl overflow-hidden bg-white mx-4",
      title: "!text-left !p-4 !m-0 !bg-white !border-b !border-gray-200 !text-gray-900",
      htmlContainer: "!p-4 !m-0 !bg-white",
      actions: "!p-4 !m-0 !bg-gray-50 !border-t !border-gray-200 !flex !justify-end !gap-3",
      confirmButton: "!px-4 !py-2.5 !text-sm !font-medium !text-white !bg-blue-600 !rounded-lg hover:!bg-blue-700",
      cancelButton: "!px-4 !py-2.5 !text-sm !font-medium !text-gray-700 !bg-white !border !border-gray-300 !rounded-lg hover:!bg-gray-50",
    },
    preConfirm: () => {
      const formData = {
        tahun: document.getElementById("swal-tahun")?.value?.trim() || "",
        department_name: document.getElementById("swal-department")?.value || "", 
        jenis: document.getElementById("swal-jenis")?.value || "CAPEX",
        nama_budget: document.getElementById("swal-nama_budget")?.value?.trim() || "",
        total_budget: document.getElementById("swal-total_budget")?.value || "",
        keterangan: document.getElementById("swal-keterangan")?.value?.trim() || "",
      };

      const errors = {};

      if (!formData.tahun) {
        errors.tahun = "Year is required";
        document.getElementById("tahun-error").textContent = errors.tahun;
        document.getElementById("tahun-error").classList.remove("hidden");
      } else {
        document.getElementById("tahun-error").classList.add("hidden");
      }

      if (!formData.department_name) {
        errors.department = "Department is required";
        document.getElementById("department-error").textContent = errors.department;
        document.getElementById("department-error").classList.remove("hidden");
      } else {
        document.getElementById("department-error").classList.add("hidden");
      }

      if (!formData.nama_budget) {
        errors.nama = "Budget name is required";
        document.getElementById("nama-error").textContent = errors.nama;
        document.getElementById("nama-error").classList.remove("hidden");
      } else {
        document.getElementById("nama-error").classList.add("hidden");
      }

      if (!formData.total_budget || formData.total_budget <= 0) {
        errors.total = "Total budget must be greater than 0";
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
      const jenisButtons = document.querySelectorAll(".jenis-btn");
      jenisButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          jenisButtons.forEach((b) => {
            b.classList.remove("bg-blue-600", "text-white");
            b.classList.add("bg-gray-100", "text-gray-700", "hover:bg-gray-200");
          });
          btn.classList.remove("bg-gray-100", "text-gray-700", "hover:bg-gray-200");
          btn.classList.add("bg-blue-600", "text-white");

          const jenis = btn.getAttribute("data-jenis");
          document.getElementById("swal-jenis").value = jenis;
        });
      });
      document.getElementById("swal-tahun")?.focus();
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      onSave(result.value);
    }
  });
};
export const showDeleteBudgetModal = ({ budget, onConfirm }) => {
  Swal.fire({
    title: `Delete ${budget.nama_budget || "Budget"}?`,
    text: "This data cannot be recovered!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, Delete!",
    cancelButtonText: "Cancel",
    customClass: {
      popup: "rounded-xl",
      confirmButton: "!bg-red-600 hover:!bg-red-700",
      cancelButton: "!bg-gray-500 hover:!bg-gray-600",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
    }
  });
};
