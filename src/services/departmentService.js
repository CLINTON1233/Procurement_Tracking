import { API_ENDPOINTS, apiFetch } from './api';

export const departmentService = {
  getAllDepartments: async () => {
    return await apiFetch(API_ENDPOINTS.DEPARTMENTS_LIST);
  },

  seedDepartments: async () => {
    return await apiFetch(API_ENDPOINTS.DEPARTMENTS_SEED, {
      method: 'POST',
    });
  },
};