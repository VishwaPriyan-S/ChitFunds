import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/authContext";
import { getAllMembers, approveMember, deleteMember } from "../services/authService";

const AdminDashboard = () => {
  const { authData, logout } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [chitGroups, setChitGroups] = useState([]);
const [loadingChits, setLoadingChits] = useState(true);

  console.log("API URL:", process.env.REACT_APP_API_URL);

  useEffect(() => {
    fetchMembers();
    fetchChitGroups();
  }, []); 
const fetchChitGroups = async () => {
  try {
    setLoadingChits(true);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/admin/chit-groups`, {
      headers: {
        Authorization: `Bearer ${authData?.token}`,
      },
    });
    const data = await response.json();
    setChitGroups(data.data || []);
  } catch (err) {
    console.error("Fetch chit groups error:", err);
    setError("Failed to fetch chit groups");
  } finally {
    setLoadingChits(false);
  }
};

const fetchMembers = async () => {
  try {
    console.log("Fetching members from:", `${process.env.REACT_APP_API_URL}/api/admin/members`);
    const response = await getAllMembers();
    console.log("Members response:", response);
    setMembers(response.data.data);
  } catch (err) {
    console.error("Fetch members error:", err.message, err.response?.data);
    setError("Failed to fetch members");
  } finally {
    setLoading(false);
  }
};

  const handleApproveMember = async (memberId) => {
    try {
      await approveMember(memberId);
      fetchMembers(); // Refresh the list
    } catch (err) {
      setError("Failed to approve member");
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        await deleteMember(memberId);
        fetchMembers(); // Refresh the list
      } catch (err) {
        setError("Failed to delete member");
      }
    }
  };

  const pendingMembers = members.filter(member => member.status === "pending");
  const approvedMembers = members.filter(member => member.status === "approved");

  // Handle Chit Group Creation
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    durationMonths: "",
    membersLimit: "",
    status: "active",
  });
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleCreateChitGroup = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (!formData.name || !formData.amount || !formData.durationMonths || !formData.membersLimit) {
    setError("All fields are required.");
    return;
  }

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  console.log("API URL:", apiUrl); // Debug
  console.log("Full Request URL:", `${apiUrl}/admin/chit-groups`); // Debug full URL
  console.log("Request Data:", formData); // Debug sent data

  try {
    const response = await fetch(`${apiUrl}/admin/chit-groups`, { // Remove extra /api
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authData?.token}`,
      },
      body: JSON.stringify(formData),
    });
    const responseData = await response.text(); // Capture raw response
    console.log("Raw Response:", responseData); // Debug raw response
    const jsonData = responseData ? JSON.parse(responseData) : {};
    if (!response.ok) throw new Error(jsonData.message || `HTTP error! Status: ${response.status}`);
    setSuccess("Chit group created successfully!");
    setFormData({ name: "", description: "", amount: "", durationMonths: "", membersLimit: "", status: "active" });
    setCreateGroupOpen(false);
  } catch (err) {
    console.error("Create chit group error:", err);
    setError(err.message.includes("<!DOCTYPE") ? "Server returned an invalid response. Check the URL or server status." : err.message);
  }
};

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <header style={{
        backgroundColor: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        padding: "1rem 0"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h1 style={{ color: "#333", margin: 0 }}>Admin Dashboard</h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ color: "#666" }}>
              Welcome, {authData?.data?.firstName || "Admin"}
            </span>
            <button
              onClick={logout}
              style={{
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: "white",
        borderBottom: "1px solid #ddd"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px"
        }}>
          <nav style={{ display: "flex", gap: "30px" }}>
            {[
              { key: "overview", label: "Overview" },
              { key: "members", label: "Members" },
              { key: "pending", label: `Pending Approval (${pendingMembers.length})` },
              { key: "chits", label: "Chit Groups" },
              { key: "transactions", label: "Transactions" }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "15px 0",
                  border: "none",
                  backgroundColor: "transparent",
                  color: activeTab === tab.key ? "#007bff" : "#666",
                  borderBottom: activeTab === tab.key ? "2px solid #007bff" : "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "30px 20px"
      }}>
        {error && (
          <div style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "20px"
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            backgroundColor: "#d4edda",
            color: "#155724",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "20px"
          }}>
            {success}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <h2 style={{ marginBottom: "30px", color: "#333" }}>Dashboard Overview</h2>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "30px"
            }}>
              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ color: "#007bff", marginBottom: "10px" }}>Total Members</h3>
                <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#333" }}>
                  {members.length}
                </p>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ color: "#28a745", marginBottom: "10px" }}>Approved Members</h3>
                <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#333" }}>
                  {approvedMembers.length}
                </p>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ color: "#ffc107", marginBottom: "10px" }}>Pending Approval</h3>
                <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#333" }}>
                  {pendingMembers.length}
                </p>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ color: "#dc3545", marginBottom: "10px" }}>Active Chits</h3>
                <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#333" }}>
                  0
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approval Tab */}
        {activeTab === "pending" && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>Pending Member Approvals</h2>
            
            {loading ? (
              <p>Loading members...</p>
            ) : pendingMembers.length === 0 ? (
              <div style={{
                backgroundColor: "white",
                padding: "40px",
                borderRadius: "8px",
                textAlign: "center",
                color: "#666"
              }}>
                No pending approvals
              </div>
            ) : (
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                overflow: "hidden"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
                      <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Name</th>
                      <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Email</th>
                      <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Phone</th>
                      <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd" }}>ID Type</th>
                      <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMembers.map(member => (
                      <tr key={member.id}>
                        <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                          {member.firstName} {member.lastName}
                        </td>
                        <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                          {member.email}
                        </td>
                        <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                          {member.phone}
                        </td>
                        <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                          {member.idType?.toUpperCase()} - {member.idNumber}
                        </td>
                        <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                          <button
                            onClick={() => handleApproveMember(member.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#28a745",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              marginRight: "8px",
                              fontSize: "12px"
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>All Members</h2>
            
            {loading ? (
              <p>Loading members...</p>
            ) : (
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                overflow: "hidden"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
                      <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Name</th>
                      <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Email</th>
                      <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Status</th>
                      <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.id}>
                        <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                          {member.firstName} {member.lastName}
                        </td>
                        <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                          {member.email}
                        </td>
                        <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor: member.status === "approved" ? "#d4edda" : "#fff3cd",
                            color: member.status === "approved" ? "#155724" : "#856404"
                          }}>
                            {member.status}
                          </span>
                        </td>
                        <td style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Chit Groups Tab */}
        {activeTab === "chits" && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>Chit Groups Management</h2>
            <button
              onClick={() => setCreateGroupOpen(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "20px"
              }}
            >
              Create New Chit Group
            </button>

            {createGroupOpen && (
              <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                marginBottom: "20px"
              }}>
                <h3 style={{ marginBottom: "15px", color: "#333" }}>Create Chit Group</h3>
                {error && <div style={{ color: "#dc3545", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px", marginBottom: "10px" }}>{error}</div>}
                {success && <div style={{ color: "#155724", backgroundColor: "#d4edda", padding: "10px", borderRadius: "4px", marginBottom: "10px" }}>{success}</div>}
                <form onSubmit={handleCreateChitGroup}>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>Group Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                      placeholder="Enter group name"
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", minHeight: "100px" }}
                      placeholder="Enter group description"
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>Chit Amount (₹)</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>Duration (Months)</label>
                    <input
                      type="number"
                      name="durationMonths"
                      value={formData.durationMonths}
                      onChange={handleInputChange}
                      style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                      placeholder="Enter duration in months"
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>Members Limit</label>
                    <input
                      type="number"
                      name="membersLimit"
                      value={formData.membersLimit}
                      onChange={handleInputChange}
                      style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                      placeholder="Enter maximum members"
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "10px" }}
                    >
                      Create Group
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateGroupOpen(false)}
                      style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <h2>Transaction Management</h2>
            <p style={{ color: "#666" }}>Feature coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;