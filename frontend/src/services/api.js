import axios from "axios";

export const API_BASE_URL = "http://localhost:8080/api";
export const BACKEND_URL = "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || "";
      const isAuthRequest = url.includes("/auth/login") || url.includes("/auth/signup");
      const isPublicEndpoint =
        url.includes("/reports/statistics") ||
        url.includes("/stats/public") ||
        url.includes("/notifications") ||
        (url.includes("/adoptions") && !url.includes("/request") && !url.includes("/my-requests"));

      const currentPath = window.location.pathname;
      const isPublicPage =
        currentPath === "/" ||
        currentPath === "/adoptions" ||
        currentPath.startsWith("/adoptions/") ||
        currentPath === "/login" ||
        currentPath === "/signup";

      // Only force redirect to /login if it's a protected page or an authenticated action
      if (!isAuthRequest && !isPublicEndpoint && !isPublicPage) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: (data) => api.post("/auth/login", data),
  signup: (data) => api.post("/auth/signup", data),
  getMe: () => api.get("/auth/me"),
};

// Reports endpoints
export const reportService = {
  createMultipart: (formData) =>
    api.post("/reports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  createJson: (data) => api.post("/reports", data),
  getMyReports: () => api.get("/reports/my"),
  getAll: (params) => api.get("/reports", { params }),
  getById: (id) => api.get(`/reports/${id}`),
  updateStatus: (id, data) => api.put(`/reports/${id}/status`, data),
  patchStatus: (id, data) => api.patch(`/reports/${id}/status`, data),
  assignVolunteer: (id, data) => api.post(`/reports/${id}/assign`, data),
  unassignVolunteer: (id) => api.delete(`/reports/${id}/assign`),
  uploadImage: (id, formData) =>
    api.post(`/reports/${id}/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getStats: () => api.get("/reports/statistics"),
};

// Volunteer endpoints
export const volunteerService = {
  getCases: () => api.get("/volunteer/cases"),
  getAvailableReports: () => api.get("/volunteer/available-reports"),
  claimCase: (id) => api.post(`/volunteer/cases/${id}/claim`),
  updateCaseStatus: (id, data) => api.put(`/volunteer/cases/${id}/status`, data),
  addCasePhoto: (id, formData) =>
    api.post(`/volunteer/cases/${id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Adoption endpoints
export const adoptionService = {
  getAdoptable: (params) => api.get("/adoptions", { params }),
  getAllAdmin: () => api.get("/adoptions?all=true"),
  getById: (id) => api.get(`/adoptions/${id}`),
  publish: (data) => api.post("/adoptions", data),
  update: (id, data) => api.put(`/adoptions/${id}`, data),
  delete: (id) => api.delete(`/adoptions/${id}`),
  requestAdoption: (id, data) => api.post(`/adoptions/${id}/request`, data),
  getMyRequests: () => api.get("/adoptions/my-requests"),
  getAllRequests: (params) => api.get("/adoptions/requests", { params }),
  updateRequestStatus: (id, data) => api.put(`/adoptions/requests/${id}/status`, data),
  getAdoptedReport: (params) => api.get("/adoptions/adopted-report", { params }),
};

// Admin endpoints
export const adminService = {
  getStats: () => api.get("/admin/stats"),
  getUsers: () => api.get("/admin/users"),
  getVolunteers: () => api.get("/admin/volunteers"),
  approveVolunteer: (id) => api.put(`/admin/volunteers/${id}/approve`),
  disableUser: (id, disabled = true) => api.put(`/admin/users/${id}/disable`, { disabled }),
  getRecoveredReports: () => api.get("/admin/recovered-reports"),
};

// Notification endpoints
export const notificationService = {
  getAll: () => api.get("/notifications"),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

export default api;
