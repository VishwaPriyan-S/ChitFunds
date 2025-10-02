import React from "react";
import "../css/LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <h1 className="logo">ChitFund Manager</h1>
          <nav>
            <a href="/login" className="btn-outline">Member Login</a>
            <a href="/admin" className="btn-danger">Admin Login</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Chit Fund Management System</h1>
          <p>
            Manage your chit fund operations efficiently with our comprehensive
            platform. Track members, manage contributions, and organize auctions
            seamlessly.
          </p>
          <div className="hero-buttons">
            <a href="/register" className="btn-success">Join as Member</a>
            <a href="/login" className="btn-white-outline">Member Login</a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="icon blue">👥</div>
              <h3>Member Management</h3>
              <p>
                Easily manage member registrations, track contributions, and
                maintain member profiles with comprehensive details.
              </p>
            </div>

            <div className="feature-card">
              <div className="icon green">💰</div>
              <h3>Payment Tracking</h3>
              <p>
                Track all payments, contributions, and payouts with detailed
                transaction history and automated calculations.
              </p>
            </div>

            <div className="feature-card">
              <div className="icon red">🔨</div>
              <h3>Auction Management</h3>
              <p>
                Conduct transparent auctions with automated bid processing and
                winner selection for fair chit distribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <h3>ChitFund Manager</h3>
          <p>
            Streamline your chit fund operations with our comprehensive
            management system.
          </p>
          <div className="footer-links">
            <a href="/register">Register</a>
            <a href="/login">Login</a>
            <a href="/admin">Admin</a>
          </div>
          <hr />
          <p className="copy">
            © 2024 ChitFund Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
