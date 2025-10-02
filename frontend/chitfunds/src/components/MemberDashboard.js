import React, { useContext, useState } from "react";
import { AuthContext } from "../context/authContext";

const MemberDashboard = () => {
  const { authData, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          padding: "1rem 0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ color: "#333", margin: 0 }}>Member Dashboard</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ color: "#666" }}>
              Welcome, {authData?.data?.firstName} {authData?.data?.lastName}
            </span>
            <button
              onClick={logout}
              style={{
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #ddd",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          <nav style={{ display: "flex", gap: "30px" }}>
            {[
              { key: "overview", label: "Overview" },
              { key: "chits", label: "My Chits" },
              { key: "payments", label: "Payments" },
              { key: "profile", label: "Profile" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "15px 0",
                  border: "none",
                  backgroundColor: "transparent",
                  color:
                    activeTab === tab.key ? "#007bff" : "#666",
                  borderBottom:
                    activeTab === tab.key
                      ? "2px solid #007bff"
                      : "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "30px 20px",
        }}
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <h2 style={{ marginBottom: "30px", color: "#333" }}>
              Dashboard Overview
            </h2>

            {/* Account Status */}
            <div
              style={{
                backgroundColor:
                  authData?.data?.status === "approved"
                    ? "#d4edda"
                    : "#fff3cd",
                color:
                  authData?.data?.status === "approved"
                    ? "#155724"
                    : "#856404",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "30px",
                border: `1px solid ${
                  authData?.data?.status === "approved"
                    ? "#c3e6cb"
                    : "#ffeaa7"
                }`,
              }}
            >
              <strong>Account Status: </strong>
              {authData?.data?.status === "approved"
                ? "Your account is approved and active!"
                : "Your account is pending approval. Please wait for admin confirmation."}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  padding: "25px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <h3
                  style={{ color: "#ffc107", marginBottom: "10px" }}
                >
                  Pending Payments
                </h3>
                <p
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    margin: 0,
                    color: "#333",
                  }}
                >
                  ₹0
                </p>
                <p
                  style={{
                    color: "#666",
                    fontSize: "14px",
                    margin: "5px 0 0 0",
                  }}
                >
                  Outstanding payment amount
                </p>
              </div>

              <div
                style={{
                  backgroundColor: "white",
                  padding: "25px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <h3
                  style={{ color: "#dc3545", marginBottom: "10px" }}
                >
                  Received Amount
                </h3>
                <p
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    margin: 0,
                    color: "#333",
                  }}
                >
                  ₹0
                </p>
                <p
                  style={{
                    color: "#666",
                    fontSize: "14px",
                    margin: "5px 0 0 0",
                  }}
                >
                  Total amount received
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginBottom: "20px", color: "#333" }}>
                Recent Activity
              </h3>
              <div
                style={{
                  textAlign: "center",
                  color: "#666",
                  padding: "20px",
                }}
              >
                <p>No recent activity to display.</p>
                <p style={{ fontSize: "14px" }}>
                  Your chit participations and transactions will appear here.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* My Chits Tab */}
        {activeTab === "chits" && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>
              My Chit Groups
            </h2>

            <div
              style={{
                backgroundColor: "white",
                padding: "40px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "20px",
                  color: "#ddd",
                }}
              >
                📋
              </div>
              <h3 style={{ color: "#333", marginBottom: "10px" }}>
                No Chit Groups Yet
              </h3>
              <p style={{ color: "#666", marginBottom: "20px" }}>
                You haven't joined any chit groups yet. Contact the admin to join available groups.
              </p>
              {authData?.data?.status !== "approved" && (
                <p
                  style={{
                    color: "#856404",
                    backgroundColor: "#fff3cd",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ffeaa7",
                  }}
                >
                  Your account needs to be approved before you can join chit groups.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>
              Payment History
            </h2>

            <div
              style={{
                backgroundColor: "white",
                padding: "40px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "20px",
                  color: "#ddd",
                }}
              >
                💳
              </div>
              <h3 style={{ color: "#333", marginBottom: "10px" }}>
                No Payment History
              </h3>
              <p style={{ color: "#666" }}>
                Your payment transactions will appear here once you start participating in chit groups.
              </p>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>My Profile</h2>

            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "30px",
                }}
              >
                <div>
                  <h3 style={{ marginBottom: "20px", color: "#333" }}>
                    Personal Information
                  </h3>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                        color: "#555",
                      }}
                    >
                      Full Name
                    </label>
                    <p
                      style={{
                        margin: 0,
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        color: "#333",
                      }}
                    >
                      {authData?.data?.firstName} {authData?.data?.lastName}
                    </p>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                        color: "#555",
                      }}
                    >
                      Email Address
                    </label>
                    <p
                      style={{
                        margin: 0,
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        color: "#333",
                      }}
                    >
                      {authData?.data?.email}
                    </p>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                        color: "#555",
                      }}
                    >
                      Phone Number
                    </label>
                    <p
                      style={{
                        margin: 0,
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        color: "#333",
                      }}
                    >
                      {authData?.data?.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 style={{ marginBottom: "20px", color: "#333" }}>
                    Account Details
                  </h3>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                        color: "#555",
                      }}
                    >
                      Member ID
                    </label>
                    <p
                      style={{
                        margin: 0,
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        color: "#333",
                      }}
                    >
                      {authData?.data?.id || "Not assigned"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                        color: "#555",
                      }}
                    >
                      Account Status
                    </label>
                    <p
                      style={{
                        margin: 0,
                        padding: "10px",
                        backgroundColor:
                          authData?.data?.status === "approved"
                            ? "#d4edda"
                            : "#fff3cd",
                        color:
                          authData?.data?.status === "approved"
                            ? "#155724"
                            : "#856404",
                        borderRadius: "4px",
                        fontWeight: "500",
                      }}
                    >
                      {authData?.data?.status === "approved"
                        ? "✓ Approved"
                        : "⏳ Pending Approval"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                        color: "#555",
                      }}
                    >
                      Member Since
                    </label>
                    <p
                      style={{
                        margin: 0,
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        color: "#333",
                      }}
                    >
                      {authData?.data?.createdAt
                        ? new Date(authData.data.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "30px",
                  paddingTop: "20px",
                  borderTop: "1px solid #eee",
                  textAlign: "center",
                }}
              >
                <button
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  Edit Profile
                </button>
                <button
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MemberDashboard;
