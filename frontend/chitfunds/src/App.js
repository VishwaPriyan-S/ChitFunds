import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Components
import MemberLogin from "./components/MemberLogin";
import AdminLogin from "./components/AdminLogin";
import MemberRegister from "./components/MemberRegister";

// Dashboard Components (you'll need to create these)
import AdminDashboard from "./components/AdminDashboard";
import MemberDashboard from "./components/MemberDashboard";
import LandingPage from "./components/LandingPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<MemberLogin />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/register" element={<MemberRegister />} />

            {/* Protected Admin Routes */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Member Routes */}
            <Route 
              path="/member-dashboard" 
              element={
                <ProtectedRoute requiredRole="member">
                  <MemberDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;