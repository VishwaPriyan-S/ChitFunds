import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create API instances
const AuthAPI = axios.create({
  baseURL: `${BASE_URL}/auth`,
});

const AdminAPI = axios.create({
  baseURL: `${BASE_URL}/admin`,
});

const MemberAPI = axios.create({
  baseURL: `${BASE_URL}/members`,
});

// Token interceptor (shared)
const attachToken = (config) => {
  const authData = JSON.parse(localStorage.getItem("authData"));
  if (authData?.token) {
    config.headers.Authorization = `Bearer ${authData.token}`;
  }
  return config;
};

// Apply interceptors to all API instances
[AuthAPI, AdminAPI, MemberAPI].forEach((api) => {
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
// Admin - Member Management
// =======================
export const getAllMembers = (params) => AdminAPI.get("/members", { params });
export const getMember = (id) => AdminAPI.get(`/members/${id}`);
export const approveMember = (id) => AdminAPI.put(`/members/${id}/approve`);
export const deleteMember = (id) => AdminAPI.delete(`/members/${id}`);
export const rejectMember = (id) => AdminAPI.delete(`/members/${id}?action=reject`);
export const getAdminStats = () => AdminAPI.get("/dashboard-stats");

// =======================
// Admin - Chit Group Management
// =======================
export const getChitGroups = () => AdminAPI.get("/chit-groups");
export const getChitGroup = (id) => AdminAPI.get(`/chit-groups/${id}`);
export const createChitGroup = (data) => AdminAPI.post("/chit-groups", data);
export const updateChitGroup = (id, data) => AdminAPI.put(`/chit-groups/${id}`, data);

// =======================
// Admin - Member-to-Group Assignment
// =======================
export const getAvailableMembers = (chitGroupId) => 
  AdminAPI.get(`/chit-groups/${chitGroupId}/available-members`);
export const addMemberToGroup = (chitGroupId, userId) => 
  AdminAPI.post(`/chit-groups/${chitGroupId}/add-member`, { userId });
export const removeMemberFromGroup = (chitGroupId, memberId) => 
  AdminAPI.delete(`/chit-groups/${chitGroupId}/members/${memberId}`);

// =======================
// Admin - Auction Management
// =======================
export const getAuctions = (params) => AdminAPI.get("/auctions", { params });
export const createAuction = (data) => AdminAPI.post("/auctions", data);
export const closeAuction = (id, data) => AdminAPI.put(`/auctions/${id}/close`, data);
export const getAuctionBids = (id) => AdminAPI.get(`/auctions/${id}/bids`);

// =======================
// Admin - Transaction Management
// =======================
export const getTransactions = (params) => AdminAPI.get("/transactions", { params });
export const createTransaction = (data) => AdminAPI.post("/transactions", data);
export const updateTransaction = (id, data) => AdminAPI.put(`/transactions/${id}`, data);

// =======================
// Member - Profile & Dashboard
// =======================
export const getMemberProfile = () => MemberAPI.get("/profile");
export const updateMemberProfile = (data) => MemberAPI.put("/profile", data);
export const getMemberDashboardStats = () => MemberAPI.get("/dashboard-stats");

// =======================
// Member - Chit Groups
// =======================
export const getMemberChitGroups = () => MemberAPI.get("/chit-groups");
export const getMemberTransactions = (params) => MemberAPI.get("/transactions", { params });

// =======================
// Member - Auctions & Bidding
// =======================
export const getAvailableAuctions = () => MemberAPI.get("/available-auctions");
export const placeBid = (data) => MemberAPI.post("/place-bid", data);
export const getMyBids = () => MemberAPI.get("/my-bids");

export default { 
  AuthAPI, 
  AdminAPI, 
  MemberAPI,
  // Re-export all functions
  loginUser,
  adminLogin,
  registerMember,
  verifyToken,
  getAllMembers,
  getMember,
  approveMember,
  deleteMember,
  rejectMember,
  getAdminStats,
  getChitGroups,
  getChitGroup,
  createChitGroup,
  updateChitGroup,
  getAvailableMembers,
  addMemberToGroup,
  removeMemberFromGroup,
  getAuctions,
  createAuction,
  closeAuction,
  getAuctionBids,
  getTransactions,
  createTransaction,
  updateTransaction,
  getMemberProfile,
  updateMemberProfile,
  getMemberDashboardStats,
  getMemberChitGroups,
  getMemberTransactions,
  getAvailableAuctions,
  placeBid,
  getMyBids
};