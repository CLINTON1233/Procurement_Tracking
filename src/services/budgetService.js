import { API_ENDPOINTS, apiFetch } from './api';

export const budgetService = {
  // ===== BUDGET CRUD =====
  getAllBudgets: async () => {
    return await apiFetch(API_ENDPOINTS.BUDGET_LIST);
  },

  createBudget: async (budgetData) => {
    return await apiFetch(API_ENDPOINTS.BUDGET_CREATE, {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  },

  updateBudget: async (id, budgetData) => {
    return await apiFetch(API_ENDPOINTS.BUDGET_UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
  },

  deleteBudget: async (id) => {
    return await apiFetch(API_ENDPOINTS.BUDGET_DELETE(id), {
      method: 'DELETE',
    });
  },

  // ===== REQUESTS =====
  getAllRequests: async () => {
    return await apiFetch(API_ENDPOINTS.REQUESTS_LIST);
  },

  createRequest: async (requestData) => {
    return await apiFetch(API_ENDPOINTS.REQUEST_CREATE, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  submitRequest: async (id) => {
    return await apiFetch(API_ENDPOINTS.REQUEST_SUBMIT(id), {
      method: 'PUT',
    });
  },

  chooseSRMR: async (id, type) => {
    return await apiFetch(API_ENDPOINTS.REQUEST_CHOOSE_SRMR(id, type), {
      method: 'PUT',
    });
  },

  // ===== DASHBOARD =====
  getDashboardStats: async () => {
    return await apiFetch(API_ENDPOINTS.DASHBOARD_STATS);
  },
};