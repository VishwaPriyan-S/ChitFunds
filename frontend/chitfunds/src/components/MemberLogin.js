import React, { useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { loginMember } from "../services/authService";

const MemberLogin = () => {
  const { setAuthData, loading, setLoading } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }

    try {
      const response = await loginUser({ email, password });
      console.log("Login response:", response); // Debug response
      setAuthData({
        ...response.data,
        role: response.data.data.role,
      });
      console.log("Auth data set:", { ...response.data, role: response.data.data.role }); // Debug authData

      if (response.data.data.role === "member") {
        navigate("/member-dashboard", { replace: true });
      } else {
        setError("Invalid member credentials");
      }
    } catch (err) {
      console.error("Login error:", err); // Debug error
      setError(err.response?.data?.message || "Login failed");
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
          <h2 style={{ color: "#333", marginBottom: "5px" }}>Member Login</h2>
          <p style={{ color: "#666", fontSize: "14px" }}>Chit Fund Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
              placeholder="Enter your password"
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
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "12px", 
              backgroundColor: "#007bff", 
              color: "white", 
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginTop: "20px",
          fontSize: "14px"
        }}>
          <a 
            href="/register" 
            style={{ 
              color: "#007bff", 
              textDecoration: "none"
            }}
          >
            New Member? Register
          </a>
          <a 
            href="/admin" 
            style={{ 
              color: "#dc3545", 
              textDecoration: "none"
            }}
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default MemberLogin;