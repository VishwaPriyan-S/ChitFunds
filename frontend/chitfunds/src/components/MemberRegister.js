import React, { useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { registerMember } from "../services/authService";

const MemberRegister = () => {
  const { setLoading } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    idNumber: "",
    idType: "aadhaar",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      setError("First name and last name are required");
      return false;
    }
    
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    
    if (!formData.phone || formData.phone.length < 10) {
      setError("Please enter a valid phone number");
      return false;
    }
    
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    
    if (!formData.idNumber) {
      setError("ID number is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        idNumber: formData.idNumber,
        idType: formData.idType,
        password: formData.password
      };

      await registerMember(registrationData);
      setSuccess("Registration successful! Please wait for admin approval before logging in.");
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        idNumber: "",
        idType: "aadhaar",
        password: "",
        confirmPassword: ""
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      padding: "20px",
      backgroundColor: "#f8f9fa"
    }}>
      <div style={{ 
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "white", 
        padding: "40px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ color: "#333", marginBottom: "5px" }}>Member Registration</h2>
          <p style={{ color: "#666", fontSize: "14px" }}>Join our Chit Fund Community</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
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
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter phone number"
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
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter full address"
              rows="3"
              style={{ 
                width: "100%", 
                padding: "12px", 
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                ID Type *
              </label>
              <select
                name="idType"
                value={formData.idType}
                onChange={handleInputChange}
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN</option>
                <option value="voter">Voter ID</option>
                <option value="passport">Passport</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                ID Number *
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                placeholder="Enter ID number"
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm password"
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>
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

          {success && (
            <div style={{ 
              color: "#155724", 
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
              fontSize: "14px"
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={setLoading}
            style={{ 
              width: "100%", 
              padding: "12px", 
              backgroundColor: "#28a745", 
              color: "white", 
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              opacity: setLoading ? 0.7 : 1
            }}
          >
            {setLoading ? "Registering..." : "Register"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
          Already have an account?{" "}
          <a 
            href="/login" 
            style={{ 
              color: "#007bff", 
              textDecoration: "none"
            }}
          >
            Login here
          </a>
        </div>
      </div>
    </div>
  );
};

export default MemberRegister;