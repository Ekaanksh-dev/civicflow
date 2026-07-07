import React, { useState, useEffect } from "react";
import Home from "./components/Home";
import SubmitComplaint from "./components/SubmitComplaint";
import TrackComplaint from "./components/TrackComplaint";
import AdminDashboard from "./components/AdminDashboard";
import { api } from "./api";
import { 
  Home as HomeIcon, 
  PlusCircle, 
  Search, 
  ShieldAlert, 
  AlertTriangle, 
  Menu, 
  X,
  Building,
  HelpCircle
} from "lucide-react";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [pageParams, setPageParams] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServerOffline, setIsServerOffline] = useState(false);

  // Parse URL hash for clean SPA routing & back button support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#home";
      const [pagePath, queryStr] = hash.substring(1).split("?");
      const page = pagePath || "home";
      
      const params = {};
      if (queryStr) {
        const urlParams = new URLSearchParams(queryStr);
        for (const [key, value] of urlParams.entries()) {
          params[key] = value;
        }
      }
      setCurrentPage(page);
      setPageParams(params);
      setIsMenuOpen(false); // Close mobile menu on navigate
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Run on mount

    // Daemon checking connection status
    const checkServerHealth = () => {
      api.fetchHomeAnalytics()
        .then(() => setIsServerOffline(false))
        .catch((err) => {
          if (err.status === 0) {
            setIsServerOffline(true);
          }
        });
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const titles = {
      home: "CivicFlow - Grievance Resolution & Tracking",
      submit: "Submit Grievance - CivicFlow",
      track: "Track Grievance - CivicFlow",
      admin: "Admin Dashboard - CivicFlow",
      help: "Help & FAQ - CivicFlow",
    };
    document.title = titles[currentPage] || "CivicFlow";
  }, [currentPage]);

  const navigate = (page, params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const hash = `#${page}${searchParams ? "?" + searchParams : ""}`;
    window.location.hash = hash;
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onNavigate={navigate} />;
      case "submit":
        return <SubmitComplaint onNavigate={navigate} />;
      case "track":
        return <TrackComplaint params={pageParams} />;
      case "admin":
        return <AdminDashboard />;
      case "help":
        return <HelpPage />;
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-container">
      {/* Offline Status Warning Bar */}
      {isServerOffline && (
        <div className="offline-banner" id="global-offline-banner">
          <AlertTriangle size={18} />
          <span>Unable to connect to server — is it running?</span>
        </div>
      )}

      {/* Header and Top Nav */}
      <header className="header" role="banner">
        <div className="nav-container">
          <div className="logo-section" onClick={() => navigate("home")} id="logo-branding-link">
            <div className="logo-icon">
              <Building size={20} />
            </div>
            <span className="logo-text">CivicFlow</span>
          </div>

          <nav role="navigation" className="desktop-nav">
            <ul className="nav-links" id="navigation-list">
              <li>
                <span
                  className={`nav-item ${currentPage === "home" ? "active" : ""}`}
                  onClick={() => navigate("home")}
                  id="nav-link-home"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <HomeIcon size={16} />
                  Home
                </span>
              </li>
              <li>
                <span
                  className={`nav-item ${currentPage === "submit" ? "active" : ""}`}
                  onClick={() => navigate("submit")}
                  id="nav-link-submit"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <PlusCircle size={16} />
                  Submit Complaint
                </span>
              </li>
              <li>
                <span
                  className={`nav-item ${currentPage === "track" ? "active" : ""}`}
                  onClick={() => navigate("track")}
                  id="nav-link-track"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Search size={16} />
                  Track Complaint
                </span>
              </li>
              <li>
                <span
                  className={`nav-item ${currentPage === "admin" ? "active" : ""}`}
                  onClick={() => navigate("admin")}
                  id="nav-link-admin"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <ShieldAlert size={16} />
                  Admin Dashboard
                </span>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="main-content" role="main">
        {renderPage()}
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <nav className="mobile-bottom-nav" role="navigation">
        <div className="bottom-nav-container">
          <div
            className={`bottom-nav-item ${currentPage === "home" ? "active" : ""}`}
            onClick={() => navigate("home")}
            id="mobile-nav-link-home"
          >
            <HomeIcon size={20} />
            <span className="bottom-nav-label">Home</span>
          </div>

          <div
            className={`bottom-nav-item ${currentPage === "track" ? "active" : ""}`}
            onClick={() => navigate("track")}
            id="mobile-nav-link-track"
          >
            <Search size={20} />
            <span className="bottom-nav-label">Track</span>
          </div>

          <div
            className="bottom-nav-center-btn-wrapper"
            onClick={() => navigate("submit")}
            id="mobile-nav-link-submit"
          >
            <div className={`bottom-nav-center-btn ${currentPage === "submit" ? "active" : ""}`}>
              <PlusCircle size={28} />
            </div>
            <span className="bottom-nav-label">Submit</span>
          </div>

          <div
            className={`bottom-nav-item ${currentPage === "admin" ? "active" : ""}`}
            onClick={() => navigate("admin")}
            id="mobile-nav-link-admin"
          >
            <ShieldAlert size={20} />
            <span className="bottom-nav-label">Admin</span>
          </div>

          <div
            className={`bottom-nav-item ${currentPage === "help" ? "active" : ""}`}
            onClick={() => navigate("help")}
            id="mobile-nav-link-help"
          >
            <HelpCircle size={20} />
            <span className="bottom-nav-label">Help</span>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <footer className="footer" role="contentinfo">
        <p>© 2026 CivicFlow. Official Civic Grievance Resolution & Tracking Portal.</p>
        <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "var(--text-light)" }}>
          Powered by AI classification and automated dispatch systems.
        </p>
      </footer>
    </div>
  );
}

function HelpPage() {
  return (
    <div className="help-container card" id="help-page-view" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
        <HelpCircle size={28} style={{ color: "var(--primary)" }} />
        Help & Information
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Welcome to CivicFlow. This portal allows you to report civic issues and track their resolution in real time.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <div className="logo-icon" style={{ flexShrink: 0, width: "32px", height: "32px", fontSize: "1rem" }}>1</div>
          <div>
            <h4 style={{ fontWeight: 600, color: "var(--text-dark)" }}>Submit a Grievance</h4>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              File details of the civic issue. Our AI engine automatically classifies the category, priority, and routes it to the correct department.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div className="logo-icon" style={{ flexShrink: 0, width: "32px", height: "32px", fontSize: "1rem" }}>2</div>
          <div>
            <h4 style={{ fontWeight: 600, color: "var(--text-dark)" }}>Track Status</h4>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Use your unique Reference ID to track the real-time status of your complaint, including assigned officers and resolution steps.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div className="logo-icon" style={{ flexShrink: 0, width: "32px", height: "32px", fontSize: "1rem" }}>3</div>
          <div>
            <h4 style={{ fontWeight: 600, color: "var(--text-dark)" }}>Automated SLA & AI Agent Reviews</h4>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              The system monitors SLA deadlines. If a deadline is missed, the complaint is auto-escalated. An AI agent also reviews at-risk cases to suggest actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
