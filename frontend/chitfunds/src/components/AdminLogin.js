import React, { useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { adminLogin } from "../services/authService";

const AdminLogin = () => {
  const { setAuthData, setLoading } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError("Please enter username and password");
      setLoading(false);
      return;
    }

    try {
      const response = await adminLogin({ username, password });
      setAuthData(response.data);
      window.location.href = "/admin-dashboard";
    } catch (err) {
      setError(err.response?.data?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

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
        width: "100%",
        maxWidth: "400px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ color: "#333", marginBottom: "5px" }}>Admin Portal</h2>
          <p style={{ color: "#666", fontSize: "14px" }}>Chit Fund Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              style={{ 
                width: "100%", 
                padding: "12px", 
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={{ 
                width: "100%", 
                padding: "12px", 
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>

          {error && (
            <div style={{ 
              color: "#dc3545", 
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
              fontSize: "14px"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={setLoading}
            style={{ 
              width: "100%", 
              padding: "12px", 
              backgroundColor: "#dc3545", 
              color: "white", 
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              opacity: setLoading ? 0.7 : 1
            }}
          >
            {setLoading ? "Signing in..." : "Sign In as Admin"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a 
            href="/login" 
            style={{ 
              color: "#007bff", 
              textDecoration: "none",
              fontSize: "14px"
            }}
          >
            Member Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;