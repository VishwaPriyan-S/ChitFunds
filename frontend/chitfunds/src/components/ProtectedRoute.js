import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { authData, loading } = useContext(AuthContext);  // Add loading from context

  useEffect(() => {
    console.log("=== ProtectedRoute Check ===");
    console.log("authData:", authData);
    console.log("requiredRole:", requiredRole);
    console.log("localStorage authData:", localStorage.getItem("authData"));
  }, [authData, requiredRole]);

  // If loading (e.g., during auth state update), show spinner instead of redirect
  if (loading) {
    return <div>Loading...</div>;  // Or a proper spinner component
  }

  const effectiveAuthData = authData || JSON.parse(localStorage.getItem("authData") || "null");
  
  console.log("effectiveAuthData:", effectiveAuthData);

  if (!effectiveAuthData || !effectiveAuthData.token) {
    console.log("No auth data or token, redirecting to /");
    return <Navigate to="/" replace />;
  }

  if (requiredRole) {
    const userRole = effectiveAuthData.role;
    console.log("User role:", userRole, "Required role:", requiredRole);
    
    if (userRole !== requiredRole) {
      console.log("Role mismatch!");
      if (userRole === "admin") {
        console.log("User is admin, redirecting to admin dashboard");
        return <Navigate to="/admin-dashboard" replace />;
      } else if (userRole === "member") {
        console.log("User is member, redirecting to member dashboard");
        return <Navigate to="/member-dashboard" replace />;
      } else {
        console.log("Unknown role, redirecting to /");
        return <Navigate to="/" replace />;
      }
    }
  }

  console.log("Auth check passed, rendering protected content");
  return children;
};

export default ProtectedRoute;