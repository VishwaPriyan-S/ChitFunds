import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(
    JSON.parse(localStorage.getItem("authData")) || null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("Saving authData to localStorage:", authData); // Debug
    if (authData) {
      localStorage.setItem("authData", JSON.stringify(authData));
    } else {
      localStorage.removeItem("authData");
    }
  }, [authData]);

  const logout = () => {
    console.log("Logging out, clearing authData"); // Debug
    setAuthData(null);
    localStorage.removeItem("authData");
    window.location.href = "/";
  };

  const isAuthenticated = () => {
    const result = authData && authData.token;
    console.log("isAuthenticated check:", result, authData); // Debug
    return result;
  };

  const isAdmin = () => {
    const result = authData && authData.role === "admin";
    console.log("isAdmin check:", result, authData); // Debug
    return result;
  };

  const isMember = () => {
    const result = authData && authData.role === "member";
    console.log("isMember check:", result, authData); // Debug
    return result;
  };

  const value = {
    authData,
    setAuthData,
    loading,
    setLoading,
    logout,
    isAuthenticated,
    isAdmin,
    isMember  
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};