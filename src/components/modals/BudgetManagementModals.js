import Swal from "sweetalert2";

export const showAddBudgetModal = ({ onSave }) => {
  const currentYear = new Date().getFullYear();

  Swal.fire({
title: `<span class="text-gray-900 font-semibold">Add New Budget</span>`,
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
              value="${currentYear}"
              placeholder="2024"
              required
            >
            <div id="tahun-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Department *
            </label>
            <input
              type="text"
              id="swal-department"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="IT, Finance, HR"
              required
            >
            <div id="department-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Budget Type *
            </label>
            <div class="flex flex-wrap gap-2" id="swal-jenis-container">
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
            <input type="hidden" id="swal-jenis" value="CAPEX">
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
              placeholder="Server Purchase, Software License"
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
              placeholder="10000000"
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
              placeholder="Additional notes..."
            ></textarea>
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
    confirmButtonText: "Save",
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
        tahun: document.getElementById("swal-tahun")?.value?.trim() || "",
        department:
          document.getElementById("swal-department")?.value?.trim() || "",
        jenis: document.getElementById("swal-jenis")?.value || "CAPEX",
        nama_budget:
          document.getElementById("swal-nama_budget")?.value?.trim() || "",
        total_budget: document.getElementById("swal-total_budget")?.value || "",
        keterangan:
          document.getElementById("swal-keterangan")?.value?.trim() || "",
      };

      const errors = {};

      if (!formData.tahun) {
        errors.tahun = "Year is required";
        document.getElementById("tahun-error").textContent = errors.tahun;
        document.getElementById("tahun-error").classList.remove("hidden");
      } else {
        document.getElementById("tahun-error").classList.add("hidden");
      }

      if (!formData.department) {
        errors.department = "Department is required";
        document.getElementById("department-error").textContent =
          errors.department;
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

export const showEditBudgetModal = ({ budget, onSave }) => {
  Swal.fire({
    title: `<strong class="text-gray-900">Edit Budget</strong>`,
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
            <input
              type="text"
              id="swal-department"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value="${budget.department || ""}"
              required
            >
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
        tahun: document.getElementById("swal-tahun")?.value?.trim() || "",
        department:
          document.getElementById("swal-department")?.value?.trim() || "",
        jenis: document.getElementById("swal-jenis")?.value || "CAPEX",
        nama_budget:
          document.getElementById("swal-nama_budget")?.value?.trim() || "",
        total_budget: document.getElementById("swal-total_budget")?.value || "",
        keterangan:
          document.getElementById("swal-keterangan")?.value?.trim() || "",
      };

      const errors = {};

      if (!formData.tahun) {
        errors.tahun = "Year is required";
        document.getElementById("tahun-error").textContent = errors.tahun;
        document.getElementById("tahun-error").classList.remove("hidden");
      } else {
        document.getElementById("tahun-error").classList.add("hidden");
      }

      if (!formData.department) {
        errors.department = "Department is required";
        document.getElementById("department-error").textContent =
          errors.department;
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
