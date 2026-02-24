import Swal from "sweetalert2";
import { CURRENCIES, getCurrencySymbol } from "@/utils/currency";

export const showRequestDetailsModal = (request) => {
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "DRAFT":
        return { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" };
      case "SUBMITTED":
        return { bg: "bg-blue-100", text: "text-blue-700", label: "Submitted" };
      case "BUDGET_APPROVED":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          label: "Approved",
        };
      case "BUDGET_REJECTED":
        return { bg: "bg-red-100", text: "text-red-700", label: "Rejected" };
      case "WAITING_SR_MR":
        return {
          bg: "bg-purple-100",
          text: "text-purple-700",
          label: "Waiting SR/MR",
        };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", label: status };
    }
  };

  const status = getStatusBadge(request.status);
  const label = "text-[11px] text-gray-500 leading-tight";
  const value = "text-[15px] font-semibold text-gray-900 leading-tight";

  Swal.fire({
    title: `
      <h2 class="text-[17px] font-semibold text-gray-900 text-center !m-0 !p-0">
        Request Details
      </h2>
    `,
    html: `
      <div class="grid grid-cols-2 gap-y-3 gap-x-6 text-left mt-1">
        <!-- Baris 1: Request No & Status -->
        <div>
          <div class="${label}">Request No</div>
          <div class="${value}">${request.request_no || "N/A"}</div>
        </div>
        <div>
          <div class="${label}">Status</div>
          <div>
            <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}">
              ${status.label}
            </span>
          </div>
        </div>

        <!-- Baris 2: Requester Name & Badge -->
        <div>
          <div class="${label}">Requester Name</div>
          <div class="${value}">${request.requester_name || "-"}</div>
        </div>
        <div>
          <div class="${label}">Badge</div>
          <div class="${value}">${request.requester_badge || "-"}</div>
        </div>

        <!-- Baris 3: Department & Request Type -->
        <div>
          <div class="${label}">Department</div>
          <div class="${value}">${request.department || "-"}</div>
        </div>
        <div>
          <div class="${label}">Request Type</div>
          <div class="${value}">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${
              request.request_type === "ITEM"
                ? "bg-blue-100 text-blue-800"
                : "bg-purple-100 text-purple-800"
            }">
              ${request.request_type || "N/A"}
            </span>
          </div>
        </div>

        <!-- Baris 4: Item Name & Quantity -->
        <div>
          <div class="${label}">Item Name</div>
          <div class="${value}">${request.item_name || "-"}</div>
        </div>
        <div>
          <div class="${label}">Quantity</div>
          <div class="${value}">${request.quantity || "-"}</div>
        </div>

        <!-- Baris 5: Unit Price & Estimated Total -->
        <div>
          <div class="${label}">Unit Price</div>
          <div class="${value}">${formatRupiah(request.estimated_unit_price)}</div>
        </div>
        <div>
          <div class="${label}">Estimated Total</div>
          <div class="text-[15px] font-semibold text-blue-600 leading-tight">${formatRupiah(request.estimated_total)}</div>
        </div>

        <!-- Baris 6: Budget & Budget Type -->
        <div>
          <div class="${label}">Budget</div>
          <div class="${value}">${request.budget?.budget_name || `ID: ${request.budget_id}` || "-"}</div>
        </div>
        <div>
          <div class="${label}">Budget Type</div>
          <div class="${value}">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${
              request.budget_type === "CAPEX"
                ? "bg-purple-100 text-purple-800"
                : "bg-green-100 text-green-800"
            }">
              ${request.budget_type || "N/A"}
            </span>
          </div>
        </div>

        <!-- Baris 7: Specification (full width) -->
        <div class="col-span-2">
          <div class="${label}">Specification</div>
          <div class="${value}">${request.specification || "-"}</div>
        </div>

        <!-- Baris 8: Notes (full width) -->
        ${
          request.notes
            ? `
        <div class="col-span-2">
          <div class="${label}">Notes</div>
          <div class="${value}">${request.notes}</div>
        </div>
        `
            : ""
        }

        <!-- Baris Currency (baru) -->
        <div>
          <div class="${label}">Currency</div>
          <div class="${value}">${request.currency || "IDR"} (${getCurrencySymbol(request.currency || "IDR")})</div>
        </div>
        <div>
          <div class="${label}">Exchange Rate</div>
          <div class="${value}">1 ${request.currency || "IDR"} = ${(request.exchange_rate || 1).toLocaleString()} IDR</div>
        </div>

        <!-- Baris 9: Created At & Updated At -->
        <div>
          <div class="${label}">Created At</div>
          <div class="${value}">${formatDate(request.created_at)}</div>
        </div>
        <div>
          <div class="${label}">Updated At</div>
          <div class="${value}">${formatDate(request.updated_at)}</div>
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
