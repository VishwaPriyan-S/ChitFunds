import React, { useContext, useState, useEffect } from "react";

import { AuthContext } from "../context/authContext";
import { 
  getAllMembers, 
  approveMember, 
  deleteMember,
  getChitGroups,
  getChitGroup,
  createChitGroup,
  getAvailableMembers,
  addMemberToGroup,
  removeMemberFromGroup,
  getAuctions,
  createAuction,
  closeAuction,
  getAuctionBids,
  getTransactions
} from "../services/authService";

const AdminDashboard = () => {
  const { authData, logout } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [activeTab, setActiveTab] = useState("overview");
  
  // Chit Group states
  const [chitGroups, setChitGroups] = useState([]);
  const [loadingChits, setLoadingChits] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  
  // Auction states
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [auctionBids, setAuctionBids] = useState([]);
  
  // Transaction states
  const [transactions, setTransactions] = useState([]);

  // Form states
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createAuctionOpen, setCreateAuctionOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    durationMonths: "",
    membersLimit: "",
    status: "active",
  });

  useEffect(() => {
    fetchMembers();
    fetchChitGroups();
  }, []);

  useEffect(() => {
    if (activeTab === "auctions") {
      fetchAuctions();
    } else if (activeTab === "transactions") {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchMembers = async () => {
    try {
      const response = await getAllMembers();
      setMembers(response.data.data);
    } catch (err) {
      setError("Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  const fetchChitGroups = async () => {
    try {
      setLoadingChits(true);
      const response = await getChitGroups();
      setChitGroups(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch chit groups");
    } finally {
      setLoadingChits(false);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    try {
      const response = await getChitGroup(groupId);
      setSelectedGroup(response.data.data);
    } catch (err) {
      setError("Failed to fetch group details");
    }
  };

  const fetchAvailableMembers = async (groupId) => {
    try {
      const response = await getAvailableMembers(groupId);
      setAvailableMembers(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch available members");
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await getAuctions();
      setAuctions(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch auctions");
    }
  };

  const fetchAuctionBids = async (auctionId) => {
    try {
      const response = await getAuctionBids(auctionId);
      setAuctionBids(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch auction bids");
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await getTransactions();
      setTransactions(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch transactions");
    }
  };

  const handleApproveMember = async (memberId) => {
    try {
      await approveMember(memberId);
      setSuccess("Member approved successfully");
      fetchMembers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to approve member");
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        await deleteMember(memberId);
        setSuccess("Member deleted successfully");
        fetchMembers();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Failed to delete member");
      }
    }
  };

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

    try {
      await createChitGroup(formData);
      setSuccess("Chit group created successfully!");
      setFormData({ 
        name: "", 
        description: "", 
        amount: "", 
        durationMonths: "", 
        membersLimit: "", 
        status: "active" 
      });
      setCreateGroupOpen(false);
      fetchChitGroups();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create chit group");
    }
  };

  const handleAddMemberToGroup = async (userId) => {
    try {
      await addMemberToGroup(selectedGroup.id, userId);
      setSuccess("Member added to group successfully!");
      setShowAddMemberModal(false);
      fetchGroupDetails(selectedGroup.id);
      fetchChitGroups();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMemberFromGroup = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member from the group?")) {
      try {
        await removeMemberFromGroup(selectedGroup.id, memberId);
        setSuccess("Member removed successfully!");
        fetchGroupDetails(selectedGroup.id);
        fetchChitGroups();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to remove member");
      }
    }
  };

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    const { chitGroupId, month, year, auctionDate } = e.target.elements;
    
    try {
      await createAuction({
        chitGroupId: chitGroupId.value,
        month: parseInt(month.value),
        year: parseInt(year.value),
        auctionDate: auctionDate.value
      });
      setSuccess("Auction created successfully!");
      setCreateAuctionOpen(false);
      fetchAuctions();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create auction");
    }
  };

  const handleViewAuctionBids = async (auction) => {
    setSelectedAuction(auction);
    await fetchAuctionBids(auction.id);
  };

  const handleCloseAuction = async () => {
    if (!selectedAuction || auctionBids.length === 0) {
      setError("No bids to process");
      return;
    }

    const highestBid = auctionBids[0];
    
    if (window.confirm(`Close auction and award to ${highestBid.memberName} with bid of ₹${highestBid.bidAmount}?`)) {
      try {
        await closeAuction(selectedAuction.id, {
          winnerId: highestBid.userId,
          winningBidAmount: highestBid.bidAmount
        });
        setSuccess("Auction closed successfully!");
        setSelectedAuction(null);
        setAuctionBids([]);
        fetchAuctions();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to close auction");
      }
    }
  };

  const pendingMembers = members.filter(m => m.status === "pending");
  const approvedMembers = members.filter(m => m.status === "approved");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <header style={{
        backgroundColor: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        padding: "1rem 0"
      }}>
        <div style={{
          maxWidth: "1400px",
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
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 20px"
        }}>
          <nav style={{ display: "flex", gap: "30px", overflowX: "auto" }}>
            {[
              { key: "overview", label: "Overview" },
              { key: "members", label: "Members" },
              { key: "pending", label: `Pending (${pendingMembers.length})` },
              { key: "chits", label: "Chit Groups" },
              { key: "auctions", label: "Auctions" },
              { key: "transactions", label: "Transactions" }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "15px 5px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: activeTab === tab.key ? "#007bff" : "#666",
                  borderBottom: activeTab === tab.key ? "2px solid #007bff" : "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  whiteSpace: "nowrap"
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
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "30px 20px"
      }}>
        {/* Alerts */}
        {error && (
          <div style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "20px"
          }}>
            {error}
            <button 
              onClick={() => setError("")}
              style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}
            >
              ×
            </button>
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
            <button 
              onClick={() => setSuccess("")}
              style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}
            >
              ×
            </button>
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
              <StatCard title="Total Members" value={members.length} color="#007bff" />
              <StatCard title="Approved Members" value={approvedMembers.length} color="#28a745" />
              <StatCard title="Pending Approval" value={pendingMembers.length} color="#ffc107" />
              <StatCard title="Active Chit Groups" value={chitGroups.length} color="#17a2b8" />
            </div>
          </div>
        )}

        {/* Pending Approval Tab */}
        {activeTab === "pending" && (
          <MemberApprovalSection 
            members={pendingMembers}
            loading={loading}
            onApprove={handleApproveMember}
            onDelete={handleDeleteMember}
          />
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <MembersListSection members={members} loading={loading} />
        )}

        {/* Chit Groups Tab */}
        {activeTab === "chits" && (
          <ChitGroupsSection
            chitGroups={chitGroups}
            loading={loadingChits}
            createGroupOpen={createGroupOpen}
            setCreateGroupOpen={setCreateGroupOpen}
            formData={formData}
            handleInputChange={handleInputChange}
            handleCreateChitGroup={handleCreateChitGroup}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            fetchGroupDetails={fetchGroupDetails}
            showAddMemberModal={showAddMemberModal}
            setShowAddMemberModal={setShowAddMemberModal}
            availableMembers={availableMembers}
            fetchAvailableMembers={fetchAvailableMembers}
            handleAddMemberToGroup={handleAddMemberToGroup}
            handleRemoveMemberFromGroup={handleRemoveMemberFromGroup}
          />
        )}

        {/* Auctions Tab */}
        {activeTab === "auctions" && (
          <AuctionsSection
            auctions={auctions}
            chitGroups={chitGroups}
            createAuctionOpen={createAuctionOpen}
            setCreateAuctionOpen={setCreateAuctionOpen}
            handleCreateAuction={handleCreateAuction}
            handleViewAuctionBids={handleViewAuctionBids}
            selectedAuction={selectedAuction}
            setSelectedAuction={setSelectedAuction}
            auctionBids={auctionBids}
            setAuctionBids={setAuctionBids}
            handleCloseAuction={handleCloseAuction}
          />
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <TransactionsSection transactions={transactions} />
        )}
      </main>
    </div>
  );
};

// Reusable Components
const StatCard = ({ title, value, color }) => (
  <div style={{
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  }}>
    <h3 style={{ color, marginBottom: "10px", fontSize: "16px" }}>{title}</h3>
    <p style={{
      fontSize: "32px",
      fontWeight: "bold",
      margin: 0,
      color: "#333"
    }}>
      {value}
    </p>
  </div>
);

const MemberApprovalSection = ({ members, loading, onApprove, onDelete }) => (
  <div>
    <h2 style={{ marginBottom: "20px", color: "#333" }}>Pending Member Approvals</h2>
    
    {loading ? (
      <p>Loading members...</p>
    ) : members.length === 0 ? (
      <EmptyState message="No pending approvals" />
    ) : (
      <TableContainer>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>ID Type</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <Td>{member.firstName} {member.lastName}</Td>
                <Td>{member.email}</Td>
                <Td>{member.phone}</Td>
                <Td>{member.idType?.toUpperCase()} - {member.idNumber}</Td>
                <Td>
                  <Button color="#28a745" onClick={() => onApprove(member.id)}>Approve</Button>
                  <Button color="#dc3545" onClick={() => onDelete(member.id)} style={{ marginLeft: "8px" }}>Reject</Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    )}
  </div>
);

const MembersListSection = ({ members, loading }) => (
  <div>
    <h2 style={{ marginBottom: "20px", color: "#333" }}>All Members</h2>
    
    {loading ? (
      <p>Loading members...</p>
    ) : (
      <TableContainer>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <Td>{member.firstName} {member.lastName}</Td>
                <Td>{member.email}</Td>
                <Td>{member.phone}</Td>
                <Td>
                  <StatusBadge status={member.status}>{member.status}</StatusBadge>
                </Td>
                <Td>{new Date(member.createdAt).toLocaleDateString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    )}
  </div>
);

const ChitGroupsSection = ({
  chitGroups,
  loading,
  createGroupOpen,
  setCreateGroupOpen,
  formData,
  handleInputChange,
  handleCreateChitGroup,
  selectedGroup,
  setSelectedGroup,
  fetchGroupDetails,
  showAddMemberModal,
  setShowAddMemberModal,
  availableMembers,
  fetchAvailableMembers,
  handleAddMemberToGroup,
  handleRemoveMemberFromGroup
}) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
      <h2 style={{ margin: 0, color: "#333" }}>Chit Groups Management</h2>
      <Button color="#007bff" onClick={() => setCreateGroupOpen(true)}>
        + Create New Group
      </Button>
    </div>

    {/* Create Group Form */}
    {createGroupOpen && (
      <FormCard title="Create Chit Group" onClose={() => setCreateGroupOpen(false)}>
        <form onSubmit={handleCreateChitGroup}>
          <FormField label="Group Name" name="name" value={formData.name} onChange={handleInputChange} required />
          <FormField label="Description" name="description" value={formData.description} onChange={handleInputChange} type="textarea" />
          <FormField label="Chit Amount (₹)" name="amount" value={formData.amount} onChange={handleInputChange} type="number" required />
          <FormField label="Duration (Months)" name="durationMonths" value={formData.durationMonths} onChange={handleInputChange} type="number" required />
          <FormField label="Members Limit" name="membersLimit" value={formData.membersLimit} onChange={handleInputChange} type="number" required />
          
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <Button type="submit" color="#007bff">Create Group</Button>
            <Button type="button" color="#6c757d" onClick={() => setCreateGroupOpen(false)}>Cancel</Button>
          </div>
        </form>
      </FormCard>
    )}

    {/* Groups List */}
    {loading ? (
      <p>Loading chit groups...</p>
    ) : chitGroups.length === 0 ? (
      <EmptyState message="No chit groups created yet" />
    ) : (
      <div style={{ display: "grid", gap: "20px" }}>
        {chitGroups.map(group => (
          <div key={group.id} style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>{group.name}</h3>
                <p style={{ color: "#666", margin: "0 0 15px 0" }}>{group.description}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
                  <InfoItem label="Amount" value={`₹${group.amount}`} />
                  <InfoItem label="Duration" value={`${group.durationMonths} months`} />
                  <InfoItem label="Monthly" value={`₹${group.monthlyContribution}`} />
                  <InfoItem label="Members" value={`${group.currentMembers}/${group.membersLimit}`} />
                  <InfoItem label="Status" value={<StatusBadge status={group.status}>{group.status}</StatusBadge>} />
                </div>
              </div>
              <Button 
                color="#007bff" 
                onClick={() => {
                  fetchGroupDetails(group.id);
                  setSelectedGroup(group);
                }}
              >
                Manage
              </Button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Group Details Modal */}
    {selectedGroup && (
      <Modal title={`Manage: ${selectedGroup.name}`} onClose={() => setSelectedGroup(null)}>
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ marginBottom: "10px" }}>Group Information</h4>
          <InfoItem label="Total Amount" value={`₹${selectedGroup.amount}`} />
          <InfoItem label="Monthly Contribution" value={`₹${selectedGroup.monthlyContribution}`} />
          <InfoItem label="Current Members" value={`${selectedGroup.currentMembers || 0}/${selectedGroup.membersLimit}`} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ margin: 0 }}>Members in Group</h4>
          {(selectedGroup.currentMembers || 0) < selectedGroup.membersLimit && (
            <Button 
              color="#28a745" 
              onClick={() => {
                fetchAvailableMembers(selectedGroup.id);
                setShowAddMemberModal(true);
              }}
            >
              + Add Member
            </Button>
          )}
        </div>

        {selectedGroup.members && selectedGroup.members.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {selectedGroup.members.map(member => (
                <tr key={member.id}>
                  <Td>{member.firstName} {member.lastName}</Td>
                  <Td>{member.email}</Td>
                  <Td>{new Date(member.joinedDate).toLocaleDateString()}</Td>
                  <Td><StatusBadge status={member.status}>{member.status}</StatusBadge></Td>
                  <Td>
                    <Button 
                      color="#dc3545" 
                      onClick={() => handleRemoveMemberFromGroup(member.userId)}
                      style={{ fontSize: "12px", padding: "4px 8px" }}
                    >
                      Remove
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="No members in this group yet" />
        )}
      </Modal>
    )}

    {/* Add Member Modal */}
    {showAddMemberModal && (
      <Modal title="Add Member to Group" onClose={() => setShowAddMemberModal(false)}>
        {availableMembers.length === 0 ? (
          <EmptyState message="No available members to add" />
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {availableMembers.map(member => (
              <div key={member.id} style={{
                padding: "15px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <strong>{member.firstName} {member.lastName}</strong>
                  <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>{member.email}</p>
                </div>
                <Button color="#28a745" onClick={() => handleAddMemberToGroup(member.id)}>
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    )}
  </div>
);

const AuctionsSection = ({
  auctions,
  chitGroups,
  createAuctionOpen,
  setCreateAuctionOpen,
  handleCreateAuction,
  handleViewAuctionBids,
  selectedAuction,
  setSelectedAuction,
  auctionBids,
  setAuctionBids,
  handleCloseAuction
}) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
      <h2 style={{ margin: 0, color: "#333" }}>Auction Management</h2>
      <Button color="#007bff" onClick={() => setCreateAuctionOpen(true)}>
        + Create Auction
      </Button>
    </div>

    {/* Create Auction Form */}
    {createAuctionOpen && (
      <FormCard title="Create New Auction" onClose={() => setCreateAuctionOpen(false)}>
        <form onSubmit={handleCreateAuction}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Chit Group</label>
            <select 
              name="chitGroupId" 
              required
              style={{ 
                width: "100%", 
                padding: "10px", 
                border: "1px solid #ddd", 
                borderRadius: "4px" 
              }}
            >
              <option value="">Select a chit group</option>
              {chitGroups.filter(g => g.status === 'active').map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} (₹{group.amount})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Month</label>
              <select 
                name="month" 
                required
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  border: "1px solid #ddd", 
                  borderRadius: "4px" 
                }}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Year</label>
              <input 
                type="number" 
                name="year" 
                defaultValue={new Date().getFullYear()}
                required
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  border: "1px solid #ddd", 
                  borderRadius: "4px" 
                }}
              />
            </div>
          </div>

          <FormField 
            label="Auction Date" 
            name="auctionDate" 
            type="date" 
            defaultValue={new Date().toISOString().split('T')[0]}
            required 
          />
          
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <Button type="submit" color="#007bff">Create Auction</Button>
            <Button type="button" color="#6c757d" onClick={() => setCreateAuctionOpen(false)}>Cancel</Button>
          </div>
        </form>
      </FormCard>
    )}

    {/* Auctions List */}
    {auctions.length === 0 ? (
      <EmptyState message="No auctions created yet" />
    ) : (
      <TableContainer>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Chit Group</Th>
              <Th>Month/Year</Th>
              <Th>Auction Date</Th>
              <Th>Status</Th>
              <Th>Total Bids</Th>
              <Th>Winner</Th>
              <Th>Winning Bid</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {auctions.map(auction => (
              <tr key={auction.id}>
                <Td>{auction.chitGroupName}</Td>
                <Td>{`${new Date(2000, auction.month - 1).toLocaleString('default', { month: 'long' })} ${auction.year}`}</Td>
                <Td>{new Date(auction.auctionDate).toLocaleDateString()}</Td>
                <Td><StatusBadge status={auction.status}>{auction.status}</StatusBadge></Td>
                <Td>{auction.totalBids || 0}</Td>
                <Td>{auction.winnerName || '-'}</Td>
                <Td>{auction.winningBidAmount ? `₹${auction.winningBidAmount}` : '-'}</Td>
                <Td>
                  <Button 
                    color="#007bff" 
                    onClick={() => handleViewAuctionBids(auction)}
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                  >
                    View Bids
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    )}

    {/* Auction Bids Modal */}
    {selectedAuction && (
      <Modal 
        title={`Bids for ${selectedAuction.chitGroupName} - ${new Date(2000, selectedAuction.month - 1).toLocaleString('default', { month: 'long' })} ${selectedAuction.year}`}
        onClose={() => {
          setSelectedAuction(null);
          setAuctionBids([]);
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <InfoItem label="Chit Amount" value={`₹${selectedAuction.chitAmount}`} />
          <InfoItem label="Auction Status" value={<StatusBadge status={selectedAuction.status}>{selectedAuction.status}</StatusBadge>} />
        </div>

        {auctionBids.length === 0 ? (
          <EmptyState message="No bids placed yet" />
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr>
                  <Th>Rank</Th>
                  <Th>Member</Th>
                  <Th>Bid Amount</Th>
                  <Th>Bid Time</Th>
                </tr>
              </thead>
              <tbody>
                {auctionBids.map((bid, index) => (
                  <tr key={bid.id} style={{ 
                    backgroundColor: index === 0 ? '#d4edda' : 'transparent' 
                  }}>
                    <Td><strong>{index + 1}</strong></Td>
                    <Td>
                      {bid.memberName}
                      {index === 0 && <span style={{ 
                        marginLeft: "10px", 
                        color: "#28a745", 
                        fontWeight: "bold" 
                      }}>🏆 Highest</span>}
                    </Td>
                    <Td><strong>₹{bid.bidAmount}</strong></Td>
                    <Td>{new Date(bid.bidTime).toLocaleString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedAuction.status === 'active' && auctionBids.length > 0 && (
              <Button color="#28a745" onClick={handleCloseAuction}>
                Close Auction & Award to Winner
              </Button>
            )}
          </>
        )}
      </Modal>
    )}
  </div>
);

const TransactionsSection = ({ transactions }) => (
  <div>
    <h2 style={{ marginBottom: "20px", color: "#333" }}>Transaction History</h2>
    
    {transactions.length === 0 ? (
      <EmptyState message="No transactions yet" />
    ) : (
      <TableContainer>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Member</Th>
              <Th>Chit Group</Th>
              <Th>Type</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(txn => (
              <tr key={txn.id}>
                <Td>#{txn.id}</Td>
                <Td>{txn.memberName}</Td>
                <Td>{txn.chitGroupName}</Td>
                <Td>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: txn.type === 'payout' ? '#d4edda' : '#fff3cd',
                    color: txn.type === 'payout' ? '#155724' : '#856404'
                  }}>
                    {txn.type}
                  </span>
                </Td>
                <Td><strong>₹{txn.amount}</strong></Td>
                <Td><StatusBadge status={txn.status}>{txn.status}</StatusBadge></Td>
                <Td>{new Date(txn.transactionDate || txn.createdAt).toLocaleDateString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    )}
  </div>
);

// Utility Components
const EmptyState = ({ message }) => (
  <div style={{
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "8px",
    textAlign: "center",
    color: "#666"
  }}>
    {message}
  </div>
);

const TableContainer = ({ children }) => (
  <div style={{
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    overflow: "hidden"
  }}>
    {children}
  </div>
);

const Th = ({ children }) => (
  <th style={{ 
    padding: "15px", 
    textAlign: "left", 
    borderBottom: "1px solid #ddd",
    backgroundColor: "#f8f9fa",
    fontWeight: "600",
    fontSize: "14px"
  }}>
    {children}
  </th>
);

const Td = ({ children }) => (
  <td style={{ 
    padding: "15px", 
    borderBottom: "1px solid #eee",
    fontSize: "14px"
  }}>
    {children}
  </td>
);

const Button = ({ children, onClick, color, type = "button", style = {} }) => (
  <button
    type={type}
    onClick={onClick}
    style={{
      padding: "8px 16px",
      backgroundColor: color,
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      ...style
    }}
  >
    {children}
  </button>
);

const StatusBadge = ({ status, children }) => {
  const colors = {
    active: { bg: '#d4edda', color: '#155724' },
    pending: { bg: '#fff3cd', color: '#856404' },
    approved: { bg: '#d4edda', color: '#155724' },
    completed: { bg: '#cfe2ff', color: '#084298' },
    suspended: { bg: '#f8d7da', color: '#721c24' },
    rejected: { bg: '#f8d7da', color: '#721c24' }
  };

  const style = colors[status] || { bg: '#e9ecef', color: '#495057' };

  return (
    <span style={{
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "500",
      backgroundColor: style.bg,
      color: style.color
    }}>
      {children}
    </span>
  );
};

const InfoItem = ({ label, value }) => (
  <div style={{ marginBottom: "10px" }}>
    <span style={{ color: "#666", fontSize: "14px" }}>{label}: </span>
    <span style={{ fontWeight: "500", fontSize: "14px" }}>{value}</span>
  </div>
);

const FormCard = ({ title, onClose, children }) => (
  <div style={{
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    marginBottom: "20px"
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
      <h3 style={{ margin: 0, color: "#333" }}>{title}</h3>
      <button 
        onClick={onClose}
        style={{ 
          background: "none", 
          border: "none", 
          fontSize: "24px", 
          cursor: "pointer",
          color: "#666"
        }}
      >
        ×
      </button>
    </div>
    {children}
  </div>
);

const FormField = ({ label, name, value, onChange, type = "text", required = false, defaultValue }) => (
  <div style={{ marginBottom: "15px" }}>
    <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", color: "#555" }}>
      {label}
    </label>
    {type === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        style={{ 
          width: "100%", 
          padding: "10px", 
          border: "1px solid #ddd", 
          borderRadius: "4px", 
          fontSize: "14px",
          minHeight: "80px",
          fontFamily: "inherit"
        }}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        required={required}
        style={{ 
          width: "100%", 
          padding: "10px", 
          border: "1px solid #ddd", 
          borderRadius: "4px", 
          fontSize: "14px" 
        }}
      />
    )}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "20px",
      maxWidth: "800px",
      width: "90%",
      maxHeight: "90vh",
      overflowY: "auto"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px",
        borderBottom: "1px solid #eee",
        paddingBottom: "15px"
      }}>
        <h3 style={{ margin: 0, color: "#333" }}>{title}</h3>
        <button 
          onClick={onClose}
          style={{ 
            background: "none", 
            border: "none", 
            fontSize: "24px", 
            cursor: "pointer",
            color: "#666"
          }}
        >
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default AdminDashboard;