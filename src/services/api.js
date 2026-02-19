const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4003";

export const API_ENDPOINTS = {
  // Budget Management
  BUDGET_LIST: `${API_BASE_URL}/api/budget/list`,
  BUDGET_CREATE: `${API_BASE_URL}/api/budget/create`,
  BUDGET_UPDATE: (id) => `${API_BASE_URL}/api/budget/update/${id}`,
  BUDGET_DELETE: (id) => `${API_BASE_URL}/api/budget/delete/${id}`,
  
  // Budget Requests
  REQUESTS_LIST: `${API_BASE_URL}/api/budget/requests`,
  REQUEST_CREATE: `${API_BASE_URL}/api/budget/request/create`,
  REQUEST_SUBMIT: (id) => `${API_BASE_URL}/api/budget/request/submit/${id}`,
  REQUEST_CHOOSE_SRMR: (id, tipe) => `${API_BASE_URL}/api/budget/request/choose/${id}/${tipe}`,
  
  // Dashboard
  DASHBOARD_STATS: `${API_BASE_URL}/api/budget/dashboard/stats`,

  // Departments
  DEPARTMENTS_LIST: `${API_BASE_URL}/api/departments/list`,
  DEPARTMENTS_SEED: `${API_BASE_URL}/api/departments/seed`,
};

export const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};

export default API_BASE_URL;