import React, { useContext } from "react";
import { AuthContext } from "../context/authContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { authData, isAuthenticated, isAdmin, isMember } = useContext(AuthContext);

  // Check if user is authenticated
  if (!isAuthenticated()) {
    window.location.href = "/";
    return null;
  }

  // Check role-based access
  if (requiredRole === "admin" && !isAdmin()) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f9fa"
      }}>
        <div style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h2 style={{ color: "#dc3545", marginBottom: "20px" }}>Access Denied</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            You don't have permission to access this area.
          </p>
          <button
            onClick={() => window.location.href = "/"}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (requiredRole === "member" && !isMember()) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f9fa"
      }}>
        <div style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h2 style={{ color: "#dc3545", marginBottom: "20px" }}>Access Denied</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            This area is for members only.
          </p>
          <button
            onClick={() => window.location.href = "/"}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;