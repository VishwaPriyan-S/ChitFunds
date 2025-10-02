import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// Auth API
const AuthAPI = axios.create({
  baseURL: `${BASE_URL}/auth`,
});

// Admin API
const AdminAPI = axios.create({
  baseURL: `${BASE_URL}/admin`,
});

// Token interceptor (shared)
const attachToken = (config) => {
  const authData = JSON.parse(localStorage.getItem("authData"));
  if (authData?.token) {
    config.headers.Authorization = `Bearer ${authData.token}`;
  }
  return config;
};

[AuthAPI, AdminAPI].forEach((api) => {
  api.interceptors.request.use(attachToken, (error) => Promise.reject(error));
  api.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("authData");
        window.location.href = "/";
      }
      return Promise.reject(error);
    }
  );
});

// =======================
// Auth endpoints
// =======================
export const loginUser = (credentials) => AuthAPI.post("/login", credentials);
export const adminLogin = (credentials) => AuthAPI.post("/admin/login", credentials);
export const registerMember = (data) => AuthAPI.post("/register", data);
export const verifyToken = () => AuthAPI.post("/verify-token");

// =======================
// Admin endpoints
// =======================
export const getAllMembers = () => AdminAPI.get("/members");
export const getMember = (id) => AdminAPI.get(`/members/${id}`);
export const updateMember = (id, data) => AdminAPI.put(`/members/${id}`, data);
export const deleteMember = (id) => AdminAPI.delete(`/members/${id}`);
export const approveMember = (id) => AdminAPI.put(`/members/${id}/approve`);
export const rejectMember = (id) => AdminAPI.put(`/members/${id}/reject`);
export const getAdminStats = () => AdminAPI.get("/dashboard-stats");
// authService.js
export const createChitGroup = (data) => AuthAPI.post("/admin/chit-groups", data);

export default { AuthAPI, AdminAPI };
