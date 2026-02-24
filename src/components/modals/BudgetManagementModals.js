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

  // Generate currency options HTML
  const generateCurrencyOptions = (selectedCurrency = "IDR") => {
    const currencies = [
      { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "EUR", name: "Euro", symbol: "€" },
      { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
      { code: "GBP", name: "British Pound", symbol: "£" },
      { code: "JPY", name: "Japanese Yen", symbol: "¥" },
      { code: "AUD", name: "Australian Dollar", symbol: "A$" },
      { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
      { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
      { code: "THB", name: "Thai Baht", symbol: "฿" },
      { code: "KRW", name: "South Korean Won", symbol: "₩" },
      { code: "INR", name: "Indian Rupee", symbol: "₹" },
      { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
      { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
      { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
      { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
      { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
      { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
      { code: "RUB", name: "Russian Ruble", symbol: "₽" },
      { code: "BRL", name: "Brazilian Real", symbol: "R$" },
      { code: "ZAR", name: "South African Rand", symbol: "R" },
      { code: "TRY", name: "Turkish Lira", symbol: "₺" },
      { code: "MXN", name: "Mexican Peso", symbol: "$" },
      { code: "PHP", name: "Philippine Peso", symbol: "₱" },
      { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
      { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
      { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
      { code: "LKR", name: "Sri Lankan Rupee", symbol: "₨" },
      { code: "NPR", name: "Nepalese Rupee", symbol: "₨" },
      { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د" },
      { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا" },
      { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك" },
      { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب" },
      { code: "OMR", name: "Omani Rial", symbol: "﷼" },
      { code: "QAR", name: "Qatari Rial", symbol: "﷼" },
      { code: "EGP", name: "Egyptian Pound", symbol: "£" },
      { code: "MAD", name: "Moroccan Dirham", symbol: "د.م." },
      { code: "TND", name: "Tunisian Dinar", symbol: "د.ت" },
      { code: "DZD", name: "Algerian Dinar", symbol: "د.ج" },
      { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
      { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
      { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
      { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
      { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
      { code: "ETB", name: "Ethiopian Birr", symbol: "Br" },
      { code: "MUR", name: "Mauritian Rupee", symbol: "₨" },
      { code: "SCR", name: "Seychellois Rupee", symbol: "₨" },
      { code: "MVR", name: "Maldivian Rufiyaa", symbol: "Rf" },
      { code: "AFN", name: "Afghan Afghani", symbol: "؋" },
      { code: "IRR", name: "Iranian Rial", symbol: "﷼" },
    ];

    let options = "";
    currencies.forEach((currency) => {
      const selected = currency.code === selectedCurrency ? "selected" : "";
      options += `<option value="${currency.code}" ${selected}>${currency.code} - ${currency.name} (${currency.symbol})</option>`;
    });
    return options;
  };

  // Perbaiki fungsi setupConvertCheckboxes
  const setupConvertCheckboxes = (container) => {
    const checkboxes = container.querySelectorAll(".entry-convert-checkbox");

    checkboxes.forEach((checkbox) => {
      const entry = checkbox.closest(".budget-entry");
      const convertFields = entry.querySelector(".convert-fields");
      const totalAmount = entry.querySelector(".entry-total_amount");
      const currencySelect = entry.querySelector(".entry-currency");
      const convertToSelect = entry.querySelector(".entry-convert-to");
      const exchangeRateInput = entry.querySelector(".entry-exchange-rate");
      const convertedAmount = entry.querySelector(".entry-converted-amount");

      // Fungsi untuk menghitung amount yang dikonversi menggunakan rate dari CURRENCIES
      const calculateConvertedAmount = () => {
        if (!checkbox.checked) return;

        const amount = parseFloat(totalAmount.value) || 0;
        const fromCurrency = currencySelect.value;
        const toCurrency = convertToSelect.value;

        if (amount && fromCurrency && toCurrency) {
          // Gunakan fungsi convertCurrency dari currency.js
          import("@/utils/currency").then(({ convertCurrency }) => {
            const result = convertCurrency(amount, fromCurrency, toCurrency);
            convertedAmount.value = result.toFixed(2);

            // Set exchange rate berdasarkan perhitungan (untuk referensi)
            if (fromCurrency !== toCurrency) {
              const fromRate =
                CURRENCIES.find((c) => c.code === fromCurrency)?.rate || 1;
              const toRate =
                CURRENCIES.find((c) => c.code === toCurrency)?.rate || 1;
              const calculatedRate = fromRate / toRate;
              exchangeRateInput.value = calculatedRate.toFixed(4);
            } else {
              exchangeRateInput.value = "1";
            }
          });
        } else {
          convertedAmount.value = "";
        }
      };

      // Event listener untuk checkbox
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          convertFields.classList.remove("hidden");
          calculateConvertedAmount();
        } else {
          convertFields.classList.add("hidden");
          convertedAmount.value = "";
          exchangeRateInput.value = "1";
        }
      });

      // Event listeners untuk perhitungan
      totalAmount.addEventListener("input", calculateConvertedAmount);
      currencySelect.addEventListener("change", calculateConvertedAmount);
      convertToSelect.addEventListener("change", calculateConvertedAmount);

      // Exchange rate input bisa diubah manual tapi akan mempengaruhi hasil konversi
      exchangeRateInput.addEventListener("input", () => {
        if (!checkbox.checked) return;

        const amount = parseFloat(totalAmount.value) || 0;
        const rate = parseFloat(exchangeRateInput.value) || 1;

        if (amount && rate) {
          const result = amount * rate;
          convertedAmount.value = result.toFixed(2);
        }
      });
    });
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
            placeholder="Capex/Opex IT 2026"
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
            placeholder="BUD-2026-001"
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

        <!-- 4. CURRENCY -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Currency *
          </label>
          <select
            class="entry-currency w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            ${generateCurrencyOptions("IDR")}
          </select>
        </div>

        <!-- 5. TOTAL AMOUNT -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Total Amount *
          </label>
          <input
            type="number"
            class="entry-total_amount w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Enter total budget amount"
            min="0"
            required
          >
        </div>

        <!-- CONVERT TO ANOTHER CURRENCY SECTION -->
        <div class="border-t border-gray-200 my-4 pt-4">
          <div class="flex items-center mb-3">
            <input
              type="checkbox"
              class="entry-convert-checkbox w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
              id="convert-checkbox-${index}"
            >
            <label for="convert-checkbox-${index}" class="text-sm font-medium text-gray-700">
              Convert to another currency
            </label>
          </div>
          
          <div class="convert-fields hidden space-y-3 ml-6 border-l-2 border-blue-200 pl-4" id="convert-fields-${index}">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Convert to Currency
              </label>
              <select
                class="entry-convert-to w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                ${generateCurrencyOptions("USD")}
              </select>
            </div>
            
          <div>
  <label class="block text-xs font-medium text-gray-700 mb-1">
    Exchange Rate
  </label>
  <input
    type="number"
    class="entry-exchange-rate w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
    placeholder="Auto-calculated"
    step="0.0001"
    min="0"
    value="1"
    readonly
  >
  <p class="text-xs text-gray-500 mt-1">Calculated automatically based on currency rates</p>
</div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Converted Amount
              </label>
              <input
                type="number"
                class="entry-converted-amount w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-blue-50 text-gray-900 font-medium"
                readonly
                placeholder="Calculated automatically"
              >
            </div>

            <div class="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <span class="font-medium">Info:</span> Converted amount will be saved for reference
            </div>
          </div>
        </div>

        <!-- 6. DEPARTMENT -->
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

        <!-- 7. BUDGET OWNER (Optional) -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Budget Owner
          </label>
          <input
            type="text"
            class="entry-budget_owner w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Enter owner name"
          >
          <p class="text-xs text-gray-500 mt-1">Person responsible for this budget</p>
        </div>

        <!-- 8. FISCAL YEAR -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Fiscal Year *
          </label>
          <input
            type="text"
            class="entry-fiscal_year w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            value="${currentYear}"
            placeholder="2026"
            required
          >
          <p class="text-xs text-gray-500 mt-1">Budget allocation year</p>
        </div>

        <!-- 9. PERIOD (Optional) -->
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

        <!-- 10. DESCRIPTION (Optional) -->
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
      // Fungsi untuk setup tombol jenis budget
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

      // Fungsi untuk setup checkbox convert
      const setupConvertCheckboxes = (container) => {
        const currencies = [
          { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", rate: 1 },
          { code: "USD", name: "US Dollar", symbol: "$", rate: 15700 },
          { code: "EUR", name: "Euro", symbol: "€", rate: 17000 },
          { code: "SGD", name: "Singapore Dollar", symbol: "S$", rate: 11600 },
          { code: "GBP", name: "British Pound", symbol: "£", rate: 19800 },
          { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 105 },
          { code: "AUD", name: "Australian Dollar", symbol: "A$", rate: 10200 },
          { code: "CNY", name: "Chinese Yuan", symbol: "¥", rate: 2170 },
          { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", rate: 3350 },
          { code: "THB", name: "Thai Baht", symbol: "฿", rate: 435 },
          { code: "KRW", name: "South Korean Won", symbol: "₩", rate: 11.5 },
          { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 188 },
          { code: "SAR", name: "Saudi Riyal", symbol: "﷼", rate: 4180 },
          { code: "AED", name: "UAE Dirham", symbol: "د.إ", rate: 4270 },
          { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", rate: 2000 },
          { code: "CHF", name: "Swiss Franc", symbol: "Fr", rate: 17500 },
          { code: "CAD", name: "Canadian Dollar", symbol: "C$", rate: 11500 },
          {
            code: "NZD",
            name: "New Zealand Dollar",
            symbol: "NZ$",
            rate: 9500,
          },
          { code: "RUB", name: "Russian Ruble", symbol: "₽", rate: 170 },
          { code: "BRL", name: "Brazilian Real", symbol: "R$", rate: 3100 },
          { code: "ZAR", name: "South African Rand", symbol: "R", rate: 850 },
          { code: "TRY", name: "Turkish Lira", symbol: "₺", rate: 480 },
          { code: "MXN", name: "Mexican Peso", symbol: "$", rate: 870 },
          { code: "PHP", name: "Philippine Peso", symbol: "₱", rate: 280 },
          { code: "VND", name: "Vietnamese Dong", symbol: "₫", rate: 0.64 },
          { code: "PKR", name: "Pakistani Rupee", symbol: "₨", rate: 56 },
          { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", rate: 142 },
          { code: "LKR", name: "Sri Lankan Rupee", symbol: "₨", rate: 51 },
          { code: "NPR", name: "Nepalese Rupee", symbol: "₨", rate: 117 },
          { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د", rate: 12 },
          { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا", rate: 22100 },
          { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", rate: 51200 },
          { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب", rate: 41600 },
          { code: "OMR", name: "Omani Rial", symbol: "﷼", rate: 40800 },
          { code: "QAR", name: "Qatari Rial", symbol: "﷼", rate: 4310 },
          { code: "EGP", name: "Egyptian Pound", symbol: "£", rate: 510 },
          { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", rate: 1560 },
          { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", rate: 5050 },
          { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", rate: 117 },
          { code: "NGN", name: "Nigerian Naira", symbol: "₦", rate: 38 },
          { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", rate: 1280 },
          { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rate: 118 },
          { code: "UGX", name: "Ugandan Shilling", symbol: "USh", rate: 4.2 },
          { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", rate: 6.1 },
          { code: "ETB", name: "Ethiopian Birr", symbol: "Br", rate: 275 },
          { code: "MUR", name: "Mauritian Rupee", symbol: "₨", rate: 350 },
          { code: "SCR", name: "Seychellois Rupee", symbol: "₨", rate: 1150 },
          { code: "MVR", name: "Maldivian Rufiyaa", symbol: "Rf", rate: 1015 },
          { code: "AFN", name: "Afghan Afghani", symbol: "؋", rate: 180 },
          { code: "IRR", name: "Iranian Rial", symbol: "﷼", rate: 0.37 },
        ];

        const checkboxes = container.querySelectorAll(
          ".entry-convert-checkbox",
        );

        checkboxes.forEach((checkbox) => {
          const entry = checkbox.closest(".budget-entry");
          const convertFields = entry.querySelector(".convert-fields");
          const totalAmount = entry.querySelector(".entry-total_amount");
          const currencySelect = entry.querySelector(".entry-currency");
          const convertToSelect = entry.querySelector(".entry-convert-to");
          const exchangeRateInput = entry.querySelector(".entry-exchange-rate");
          const convertedAmount = entry.querySelector(
            ".entry-converted-amount",
          );

          // Fungsi untuk menghitung amount yang dikonversi secara OTOMATIS
          const calculateConvertedAmount = () => {
            if (!checkbox.checked) return;

            const amount = parseFloat(totalAmount.value) || 0;
            const fromCurrency = currencySelect.value;
            const toCurrency = convertToSelect.value;

            if (
              amount &&
              fromCurrency &&
              toCurrency &&
              fromCurrency !== toCurrency
            ) {
              // Cari rate dari kedua mata uang
              const fromRate =
                currencies.find((c) => c.code === fromCurrency)?.rate || 1;
              const toRate =
                currencies.find((c) => c.code === toCurrency)?.rate || 1;

              // Konversi via IDR sebagai base currency
              // amount in IDR = amount * fromRate
              // then convert to toCurrency = (amount * fromRate) / toRate
              const amountInIDR = amount * fromRate;
              const result = amountInIDR / toRate;

              // Update converted amount
              convertedAmount.value = result.toFixed(2);

              // Hitung dan update exchange rate untuk referensi (1 fromCurrency = ? toCurrency)
              const calculatedRate = fromRate / toRate;
              exchangeRateInput.value = calculatedRate.toFixed(4);
              exchangeRateInput.readOnly = true; // Bikin readonly karena otomatis
              exchangeRateInput.classList.add("bg-gray-50");
            } else if (fromCurrency === toCurrency) {
              convertedAmount.value = amount.toFixed(2);
              exchangeRateInput.value = "1";
            } else {
              convertedAmount.value = "";
              exchangeRateInput.value = "";
            }
          };

          // Event listener untuk checkbox
          checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
              convertFields.classList.remove("hidden");
              calculateConvertedAmount();
            } else {
              convertFields.classList.add("hidden");
              convertedAmount.value = "";
              exchangeRateInput.value = "1";
              exchangeRateInput.readOnly = false;
              exchangeRateInput.classList.remove("bg-gray-50");
            }
          });

          // Event listeners untuk perubahan yang memicu konversi ulang
          totalAmount.addEventListener("input", calculateConvertedAmount);
          currencySelect.addEventListener("change", () => {
            calculateConvertedAmount();
          });
          convertToSelect.addEventListener("change", calculateConvertedAmount);

          // Exchange rate input dibuat readonly agar tidak bisa diubah manual
          exchangeRateInput.readOnly = true;
          exchangeRateInput.classList.add("bg-gray-50");
        });
      };
      // Fungsi untuk setup tombol remove
      const setupRemoveButtons = () => {
        const removeButtons = document.querySelectorAll(".remove-entry-btn");
        removeButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            const entry = btn.closest(".budget-entry");
            if (entry) {
              entry.remove();
            }
          });
        });
      };

      // Panggil semua fungsi setup
      setupJenisButtons(document);
      setupConvertCheckboxes(document);
      setupRemoveButtons();

      // Event listener untuk tombol "Add Another"
      document
        .getElementById("add-more-entries")
        ?.addEventListener("click", () => {
          const container = document.getElementById("budget-entries-container");
          const currentCount = container.children.length;

          const newEntry = document.createElement("div");
          newEntry.innerHTML = generateEntryHTML(currentCount);

          container.appendChild(newEntry.firstElementChild);
          const lastEntry = container.lastElementChild;

          // Setup ulang untuk entry baru
          setupJenisButtons(lastEntry);
          setupConvertCheckboxes(lastEntry);
          setupRemoveButtons();

          lastEntry.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
    },
    preConfirm: () => {
      const entries = document.querySelectorAll(".budget-entry");
      const budgets = [];
      const errors = [];

      entries.forEach((entry, index) => {
        const currency = entry.querySelector(".entry-currency")?.value || "IDR";
        const convertCheckbox = entry.querySelector(".entry-convert-checkbox");
        const convertTo = entry.querySelector(".entry-convert-to")?.value;
        const exchangeRate = entry.querySelector(".entry-exchange-rate")?.value;
        const convertedAmount = entry.querySelector(
          ".entry-converted-amount",
        )?.value;
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
        if (!total_amount || parseFloat(total_amount) <= 0)
          entryErrors.push("Total amount must be greater than 0");

        if (entryErrors.length > 0) {
          errors.push(`Entry #${index + 1}: ${entryErrors.join(", ")}`);
        } else {
          const budgetData = {
            fiscal_year,
            budget_code,
            department_name,
            budget_type,
            budget_name,
            currency,
            total_amount: parseFloat(total_amount),
            budget_owner,
            period_start,
            period_end,
            description,
          };

          if (
            convertCheckbox?.checked &&
            convertTo &&
            exchangeRate &&
            convertedAmount
          ) {
            budgetData.convert_to = convertTo;
            budgetData.exchange_rate = parseFloat(exchangeRate);
            budgetData.converted_amount = parseFloat(convertedAmount);
          }

          budgets.push(budgetData);
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

  // Helper untuk mendapatkan nama mata uang
  const getCurrencyName = (currencyCode) => {
    const currencies = {
      IDR: "IDR - Indonesian Rupiah (Rp)",
      USD: "USD - US Dollar ($)",
      EUR: "EUR - Euro (€)",
      SGD: "SGD - Singapore Dollar (S$)",
      GBP: "GBP - British Pound (£)",
      JPY: "JPY - Japanese Yen (¥)",
      AUD: "AUD - Australian Dollar (A$)",
      CNY: "CNY - Chinese Yuan (¥)",
      MYR: "MYR - Malaysian Ringgit (RM)",
      THB: "THB - Thai Baht (฿)",
      KRW: "KRW - South Korean Won (₩)",
      INR: "INR - Indian Rupee (₹)",
      SAR: "SAR - Saudi Riyal (﷼)",
      AED: "AED - UAE Dirham (د.إ)",
      HKD: "HKD - Hong Kong Dollar (HK$)",
    };
    return currencies[currencyCode] || `${currencyCode} - Unknown Currency`;
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
              placeholder="BUD-2026-001"
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

          <!-- 4. CURRENCY (Read-only) -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Currency
            </label>
            <div class="relative">
              <input
                type="text"
                id="edit-currency_display"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 pr-10"
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
            <input type="hidden" id="edit-currency" value="${budget.currency || "IDR"}">
            <p class="text-xs text-gray-500 mt-1">Currency is fixed and cannot be changed</p>
          </div>

          <!-- 5. TOTAL AMOUNT -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Total Amount *
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

          <!-- 6. FINANCIAL STATUS (Read-only) -->
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

          <!-- 7. DEPARTMENT -->
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

          <!-- 8. BUDGET OWNER (Optional) -->
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

          <!-- 9. FISCAL YEAR -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Fiscal Year *
            </label>
            <input
              type="text"
              id="edit-fiscal_year"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value="${budget.fiscal_year || ""}"
              placeholder="2026"
              required
            >
            <p class="text-xs text-gray-500 mt-1">Budget allocation year</p>
            <div id="year-error" class="text-xs text-red-600 mt-1 hidden"></div>
          </div>

          <!-- 10. PERIOD (Optional) -->
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

          <!-- 11. DESCRIPTION (Optional) -->
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
        currency: document.getElementById("edit-currency")?.value || "IDR", // INI YANG PENTING!
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

// Bulk Edit Budget Modal
// Bulk Edit Budget Modal
export const showBulkEditBudgetModal = async ({ budgets, onSave }) => {
  const currentYear = new Date().getFullYear().toString();
  const depts = await fetchDepartments();
  departmentsList = depts;

  const generateDepartmentOptions = (selectedDept = "") => {
    let options = '<option value="">Select Department</option>';
    departmentsList.forEach((dept) => {
      options += `<option value="${dept.name}">${dept.name}</option>`;
    });
    return options;
  };

  // Helper untuk mendapatkan nama mata uang
  const getCurrencyName = (currencyCode) => {
    const currencies = {
      IDR: "IDR - Indonesian Rupiah (Rp)",
      USD: "USD - US Dollar ($)",
      EUR: "EUR - Euro (€)",
      SGD: "SGD - Singapore Dollar (S$)",
      GBP: "GBP - British Pound (£)",
      JPY: "JPY - Japanese Yen (¥)",
      AUD: "AUD - Australian Dollar (A$)",
      CNY: "CNY - Chinese Yuan (¥)",
      MYR: "MYR - Malaysian Ringgit (RM)",
      THB: "THB - Thai Baht (฿)",
      KRW: "KRW - South Korean Won (₩)",
      INR: "INR - Indian Rupee (₹)",
      SAR: "SAR - Saudi Riyal (﷼)",
      AED: "AED - UAE Dirham (د.إ)",
      HKD: "HKD - Hong Kong Dollar (HK$)",
    };
    return currencies[currencyCode] || `${currencyCode} - Unknown Currency`;
  };

  const generateBudgetEntries = () => {
    let entriesHtml = "";

    budgets.forEach((budget, index) => {
      entriesHtml += `
        <div class="budget-entry border border-gray-200 rounded-lg p-4 mb-4 relative" data-id="${budget.id}" data-index="${index}">
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-sm font-semibold text-gray-700">Edit Budget #${index + 1}: ${budget.budget_name}</h4>
            <input type="hidden" class="entry-id" value="${budget.id}">
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
                value="${budget.budget_name || ""}"
                placeholder="Capex/Opex IT 2026"
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
                value="${budget.budget_code || ""}"
                placeholder="BUD-2026-001"
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
              <input type="hidden" class="entry-budget_type" value="${budget.budget_type || "CAPEX"}">
            </div>

            <!-- 4. CURRENCY (Read-only) -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Currency
              </label>
              <div class="relative">
                <input
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 pr-10"
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
              <p class="text-xs text-gray-500 mt-1">Currency is fixed and cannot be changed</p>
            </div>

            <!-- 5. TOTAL AMOUNT -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Total Amount *
              </label>
              <input
                type="number"
                class="entry-total_amount w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                value="${budget.total_amount || ""}"
                placeholder="Enter total budget amount"
                min="0"
                required
              >
            </div>

            <!-- 6. FINANCIAL STATUS (Read-only) -->
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Reserved</label>
                <input
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                  value="${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(budget.reserved_amount || 0)}"
                  readonly
                  disabled
                >
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Used</label>
                <input
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                  value="${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(budget.used_amount || 0)}"
                  readonly
                  disabled
                >
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Remaining</label>
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

            <!-- 7. DEPARTMENT -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                class="entry-department_name w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              >
                ${generateDepartmentOptions()}
              </select>
            </div>

            <!-- 8. BUDGET OWNER (Optional) -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Budget Owner
              </label>
              <input
                type="text"
                class="entry-budget_owner w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                value="${budget.budget_owner || ""}"
                placeholder="Enter owner name"
              >
              <p class="text-xs text-gray-500 mt-1">Person responsible for this budget</p>
            </div>

            <!-- 9. FISCAL YEAR -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Fiscal Year *
              </label>
              <input
                type="text"
                class="entry-fiscal_year w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                value="${budget.fiscal_year || currentYear}"
                placeholder="2026"
                required
              >
              <p class="text-xs text-gray-500 mt-1">Budget allocation year</p>
            </div>

            <!-- 10. PERIOD (Optional) -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Period Start
                </label>
                <input
                  type="date"
                  class="entry-period_start w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  value="${budget.period_start ? budget.period_start.split("T")[0] : ""}"
                >
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Period End
                </label>
                <input
                  type="date"
                  class="entry-period_end w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  value="${budget.period_end ? budget.period_end.split("T")[0] : ""}"
                >
              </div>
            </div>

            <!-- 11. DESCRIPTION (Optional) -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                class="entry-description w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                rows="2"
                placeholder="Additional notes, purpose of budget, etc..."
              >${budget.description || ""}</textarea>
            </div>
          </div>
        </div>
      `;
    });

    return entriesHtml;
  };

  let html = `
    <div class="text-left space-y-4 max-h-[70vh] overflow-y-auto px-3">
      <div class="sticky top-0 bg-white py-2 z-10 border-b border-gray-200 mb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="text-blue-600">
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14"/>
              <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span class="text-base font-semibold text-gray-900">
              Edit ${budgets.length} Selected Budgets
            </span>
          </div>
        </div>
      </div>
      
      <div id="budget-entries-container">
        ${generateBudgetEntries()}
      </div>

      <div class="text-xs text-gray-500 pt-2 border-t">
        * Required fields
      </div>
    </div>
  `;

  Swal.fire({
    title: "",
    html: html,
    width: window.innerWidth > 768 ? "800px" : "95vw",
    padding: "0",
    showCancelButton: true,
    confirmButtonText: "Update All",
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

      setupJenisButtons(document);
    },
    preConfirm: () => {
      const entries = document.querySelectorAll(".budget-entry");
      const updatedBudgets = [];
      const errors = [];

      entries.forEach((entry, index) => {
        const id = entry.querySelector(".entry-id")?.value;
        const fiscal_year =
          entry.querySelector(".entry-fiscal_year")?.value?.trim() || "";
        const budget_code =
          entry.querySelector(".entry-budget_code")?.value?.trim() || null;
        const department_name =
          entry.querySelector(".entry-department_name")?.value || "";
        const budget_type =
          entry.querySelector(".entry-budget_type")?.value || "CAPEX";
        const currency = entry.querySelector(".entry-currency")?.value || "IDR"; // TAMBAHKAN INI!
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
