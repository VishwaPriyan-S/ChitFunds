import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/authContext";
import {
  getMemberDashboardStats,
  getMemberChitGroups,
  getMemberTransactions,
  getAvailableAuctions,
  placeBid,
  getMyBids
} from "../services/authService";

const MemberDashboard = () => {
  const { authData, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [chitGroups, setChitGroups] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Bid modal state
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "chits") {
      fetchChitGroups();
    } else if (activeTab === "payments") {
      fetchTransactions();
    } else if (activeTab === "auctions") {
      fetchAuctions();
      fetchMyBids();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const response = await getMemberDashboardStats();
      setStats(response.data.data);
    } catch (err) {
      setError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchChitGroups = async () => {
    try {
      const response = await getMemberChitGroups();
      setChitGroups(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch chit groups");
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await getMemberTransactions();
      setTransactions(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch transactions");
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await getAvailableAuctions();
      setAuctions(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch auctions");
    }
  };

  const fetchMyBids = async () => {
    try {
      const response = await getMyBids();
      setMyBids(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch bids:", err);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!bidAmount || bidAmount <= 0) {
      setError("Please enter a valid bid amount");
      return;
    }

    if (bidAmount > selectedAuction.totalAmount) {
      setError("Bid amount cannot exceed chit total amount");
      return;
    }

    try {
      await placeBid({
        auctionId: selectedAuction.id,
        bidAmount: parseFloat(bidAmount)
      });
      setSuccess("Bid placed successfully!");
      setShowBidModal(false);
      setBidAmount("");
      setSelectedAuction(null);
      fetchAuctions();
      fetchMyBids();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place bid");
    }
  };

  const isApproved = authData?.user?.status === "approved";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <header style={{
        backgroundColor: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        padding: "1rem 0",
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h1 style={{ color: "#333", margin: 0 }}>Member Dashboard</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ color: "#666" }}>
              Welcome, {authData?.user?.firstName} {authData?.user?.lastName}
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
      <div style={{
        backgroundColor: "white",
        borderBottom: "1px solid #ddd",
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
        }}>
          <nav style={{ display: "flex", gap: "30px" }}>
            {[
              { key: "overview", label: "Overview" },
              { key: "chits", label: "My Chits" },
              { key: "auctions", label: "Auctions" },
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
                  color: activeTab === tab.key ? "#007bff" : "#666",
                  borderBottom: activeTab === tab.key ? "2px solid #007bff" : "none",
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
      <main style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "30px 20px",
      }}>
        {/* Alerts */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess("")} />
        )}

        {/* Account Status Banner */}
        {!isApproved && (
          <div style={{
            backgroundColor: "#fff3cd",
            color: "#856404",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "30px",
            border: "1px solid #ffeaa7",
          }}>
            <strong>⏳ Account Status: </strong>
            Your account is pending approval. Some features are restricted until admin approves your account.
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <OverviewSection 
            stats={stats} 
            loading={loading} 
            isApproved={isApproved}
          />
        )}

        {/* My Chits Tab */}
        {activeTab === "chits" && (
          <ChitsSection 
            chitGroups={chitGroups} 
            isApproved={isApproved}
          />
        )}

        {/* Auctions Tab */}
        {activeTab === "auctions" && (
          <AuctionsSection
            auctions={auctions}
            myBids={myBids}
            isApproved={isApproved}
            onPlaceBid={(auction) => {
              setSelectedAuction(auction);
              setShowBidModal(true);
            }}
          />
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <PaymentsSection transactions={transactions} />
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <ProfileSection user={authData?.user} />
        )}
      </main>

      {/* Bid Modal */}
      {showBidModal && selectedAuction && (
        <Modal
          title={`Place Bid - ${selectedAuction.chitGroupName}`}
          onClose={() => {
            setShowBidModal(false);
            setSelectedAuction(null);
            setBidAmount("");
          }}
        >
          <form onSubmit={handlePlaceBid}>
            <InfoItem label="Chit Amount" value={`₹${selectedAuction.totalAmount}`} />
            <InfoItem 
              label="Month/Year" 
              value={`${new Date(2000, selectedAuction.month - 1).toLocaleString('default', { month: 'long' })} ${selectedAuction.year}`} 
            />
            
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Your Bid Amount (₹)
              </label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min="0"
                max={selectedAuction.totalAmount}
                step="100"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
                placeholder="Enter bid amount"
              />
              <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
                Higher bid amount = Lower chance of winning (members prefer lower bids)
              </small>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Button type="submit" color="#28a745">Place Bid</Button>
              <Button 
                type="button" 
                color="#6c757d" 
                onClick={() => {
                  setShowBidModal(false);
                  setSelectedAuction(null);
                  setBidAmount("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Section Components
const OverviewSection = ({ stats, loading, isApproved }) => {
  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: "30px", color: "#333" }}>Dashboard Overview</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginBottom: "30px",
      }}>
        <StatCard 
          title="Active Chit Groups" 
          value={stats?.activeChitGroups || 0}
          color="#007bff"
          icon="📋"
        />
        <StatCard 
          title="Total Contributed" 
          value={`₹${stats?.totalContributed || 0}`}
          color="#28a745"
          icon="💰"
        />
        <StatCard 
          title="Total Received" 
          value={`₹${stats?.totalReceived || 0}`}
          color="#17a2b8"
          icon="💵"
        />
        <StatCard 
          title="Pending Payments" 
          value={`₹${stats?.pendingPayments || 0}`}
          color="#ffc107"
          icon="⏳"
        />
      </div>

      {!isApproved && (
        <Card>
          <h3 style={{ marginBottom: "15px" }}>Getting Started</h3>
          <ol style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
            <li>Wait for admin to approve your account</li>
            <li>Once approved, you'll be added to chit groups by admin</li>
            <li>Participate in monthly auctions</li>
            <li>Make monthly contributions</li>
            <li>Track your payments and winnings</li>
          </ol>
        </Card>
      )}
    </div>
  );
};

const ChitsSection = ({ chitGroups, isApproved }) => (
  <div>
    <h2 style={{ marginBottom: "20px", color: "#333" }}>My Chit Groups</h2>

    {!isApproved ? (
      <Card>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>🔒</div>
          <h3>Account Not Approved</h3>
          <p style={{ color: "#666" }}>
            Your account needs to be approved before you can join chit groups.
          </p>
        </div>
      </Card>
    ) : chitGroups.length === 0 ? (
      <Card>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>📋</div>
          <h3>No Chit Groups Yet</h3>
          <p style={{ color: "#666" }}>
            You haven't been added to any chit groups yet. Contact admin to join available groups.
          </p>
        </div>
      </Card>
    ) : (
      <div style={{ display: "grid", gap: "20px" }}>
        {chitGroups.map(group => (
          <Card key={group.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>{group.name}</h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                  gap: "15px",
                  marginTop: "15px"
                }}>
                  <InfoItem label="Total Amount" value={`₹${group.amount}`} />
                  <InfoItem label="Monthly Contribution" value={`₹${group.monthlyContribution}`} />
                  <InfoItem label="Duration" value={`${group.durationMonths} months`} />
                  <InfoItem label="Status" value={<StatusBadge status={group.memberStatus}>{group.memberStatus}</StatusBadge>} />
                  <InfoItem 
                    label="Received" 
                    value={group.hasReceived ? `✅ Yes (₹${group.receivedAmount})` : "❌ No"} 
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )}
  </div>
);

const AuctionsSection = ({ auctions, myBids, isApproved, onPlaceBid }) => (
  <div>
    <h2 style={{ marginBottom: "20px", color: "#333" }}>Auction Center</h2>

    {!isApproved ? (
      <Card>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>🔒</div>
          <h3>Account Not Approved</h3>
          <p style={{ color: "#666" }}>
            Your account needs to be approved before you can participate in auctions.
          </p>
        </div>
      </Card>
    ) : (
      <>
        {/* Available Auctions */}
        <Card style={{ marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "15px" }}>Available Auctions</h3>
          {auctions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              No active auctions available at the moment
            </div>
          ) : (
            <div style={{ display: "grid", gap: "15px" }}>
              {auctions.map(auction => (
                <div key={auction.id} style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f8f9fa"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 10px 0" }}>{auction.chitGroupName}</h4>
                      <div style={{ display: "flex", gap: "20px", fontSize: "14px", color: "#666" }}>
                        <span>💰 Amount: ₹{auction.totalAmount}</span>
                        <span>📅 {new Date(2000, auction.month - 1).toLocaleString('default', { month: 'long' })} {auction.year}</span>
                        <span>📆 {new Date(auction.auctionDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button color="#007bff" onClick={() => onPlaceBid(auction)}>
                      Place Bid
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Bids */}
        <Card>
          <h3 style={{ marginBottom: "15px" }}>My Bid History</h3>
          {myBids.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              You haven't placed any bids yet
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <Th>Chit Group</Th>
                  <Th>Month/Year</Th>
                  <Th>My Bid</Th>
                  <Th>Auction Status</Th>
                  <Th>Result</Th>
                  <Th>Bid Time</Th>
                </tr>
              </thead>
              <tbody>
                {myBids.map(bid => (
                  <tr key={bid.id}>
                    <Td>{bid.chitGroupName}</Td>
                    <Td>{new Date(2000, bid.month - 1).toLocaleString('default', { month: 'short' })} {bid.year}</Td>
                    <Td><strong>₹{bid.bidAmount}</strong></Td>
                    <Td><StatusBadge status={bid.auctionStatus}>{bid.auctionStatus}</StatusBadge></Td>
                    <Td>
                      {bid.auctionStatus === 'completed' ? (
                        bid.winnerId === bid.userId ? (
                          <span style={{ color: "#28a745", fontWeight: "bold" }}>🏆 Won</span>
                        ) : (
                          <span style={{ color: "#dc3545" }}>❌ Lost</span>
                        )
                      ) : (
                        <span style={{ color: "#666" }}>⏳ Pending</span>
                      )}
                    </Td>
                    <Td>{new Date(bid.bidTime).toLocaleString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </>
    )}
  </div>
);

const PaymentsSection = ({ transactions }) => (
  <div>
    <h2 style={{ marginBottom: "20px", color: "#333" }}>Payment History</h2>

    {transactions.length === 0 ? (
      <Card>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>💳</div>
          <h3>No Payment History</h3>
          <p style={{ color: "#666" }}>
            Your payment transactions will appear here once you start participating in chit groups.
          </p>
        </div>
      </Card>
    ) : (
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Transaction ID</Th>
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
                <Td>
                  <strong style={{ color: txn.type === 'payout' ? '#28a745' : '#333' }}>
                    ₹{txn.amount}
                  </strong>
                </Td>
                <Td><StatusBadge status={txn.status}>{txn.status}</StatusBadge></Td>
                <Td>{new Date(txn.transactionDate || txn.createdAt).toLocaleDateString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    )}
  </div>
);

const ProfileSection = ({ user }) => (
  <div>
    <h2 style={{ marginBottom: "20px", color: "#333" }}>My Profile</h2>

    <Card>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "30px",
      }}>
        <div>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>Personal Information</h3>
          <ProfileField label="Full Name" value={`${user?.firstName} ${user?.lastName}`} />
          <ProfileField label="Email Address" value={user?.email} />
          <ProfileField label="Phone Number" value={user?.phone || "Not provided"} />
          <ProfileField label="Address" value={user?.address || "Not provided"} />
        </div>

        <div>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>Account Details</h3>
          <ProfileField label="Member ID" value={user?.id || "Not assigned"} />
          <ProfileField 
            label="Account Status" 
            value={<StatusBadge status={user?.status}>{user?.status}</StatusBadge>} 
          />
          <ProfileField label="ID Type" value={user?.idType?.toUpperCase()} />
          <ProfileField label="ID Number" value={user?.idNumber} />
          <ProfileField 
            label="Member Since" 
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"} 
          />
        </div>
      </div>
    </Card>
  </div>
);

// Utility Components
const Card = ({ children, style = {} }) => (
  <div style={{
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    ...style
  }}>
    {children}
  </div>
);

const StatCard = ({ title, value, color, icon }) => (
  <div style={{
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  }}>
    <div style={{ fontSize: "32px", marginBottom: "10px" }}>{icon}</div>
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

const InfoItem = ({ label, value }) => (
  <div style={{ marginBottom: "10px" }}>
    <span style={{ color: "#666", fontSize: "14px", display: "block" }}>{label}</span>
    <span style={{ fontWeight: "500", fontSize: "14px" }}>{value}</span>
  </div>
);

const ProfileField = ({ label, value }) => (
  <div style={{ marginBottom: "15px" }}>
    <label style={{
      display: "block",
      marginBottom: "5px",
      fontWeight: "500",
      color: "#555",
      fontSize: "14px"
    }}>
      {label}
    </label>
    <div style={{
      padding: "10px",
      backgroundColor: "#f8f9fa",
      borderRadius: "4px",
      color: "#333"
    }}>
      {value}
    </div>
  </div>
);

const StatusBadge = ({ status, children }) => {
  const colors = {
    active: { bg: '#d4edda', color: '#155724' },
    pending: { bg: '#fff3cd', color: '#856404' },
    approved: { bg: '#d4edda', color: '#155724' },
    completed: { bg: '#cfe2ff', color: '#084298' },
    suspended: { bg: '#f8d7da', color: '#721c24' },
    rejected: { bg: '#f8d7da', color: '#721c24' },
    failed: { bg: '#f8d7da', color: '#721c24' }
  };

  const style = colors[status] || { bg: '#e9ecef', color: '#495057' };

  return (
    <span style={{
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "500",
      backgroundColor: style.bg,
      color: style.color,
      display: "inline-block"
    }}>
      {children}
    </span>
  );
};

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

const Th = ({ children }) => (
  <th style={{ 
    padding: "12px", 
    textAlign: "left", 
    borderBottom: "2px solid #ddd",
    backgroundColor: "#f8f9fa",
    fontWeight: "600",
    fontSize: "14px"
  }}>
    {children}
  </th>
);

const Td = ({ children }) => (
  <td style={{ 
    padding: "12px", 
    borderBottom: "1px solid #eee",
    fontSize: "14px"
  }}>
    {children}
  </td>
);

const Alert = ({ type, message, onClose }) => {
  const colors = {
    error: { bg: '#f8d7da', color: '#721c24' },
    success: { bg: '#d4edda', color: '#155724' }
  };

  const style = colors[type] || colors.error;

  return (
    <div style={{
      backgroundColor: style.bg,
      color: style.color,
      padding: "12px",
      borderRadius: "4px",
      marginBottom: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <span>{message}</span>
      <button 
        onClick={onClose}
        style={{ 
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          fontSize: "18px",
          color: style.color
        }}
      >
        ×
      </button>
    </div>
  );
};

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
      padding: "25px",
      maxWidth: "500px",
      width: "90%"
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

export default MemberDashboard;