import React, { useState } from "react";
import AdminDashboard from "./components/AdminDashboard";
import Analytics from "./components/Analytics";
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  FolderOpen,
  Sparkles,
  Building
} from "lucide-react";

export default function App() {
  // Password Gate state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [shouldShake, setShouldShake] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError("");
    setShouldShake(false);
    
    if (password === "civicflow2026admin") {
      setIsAdminAuthenticated(true);
    } else {
      setPasswordError("Incorrect password");
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setPassword("");
    setActiveTab("dashboard");
  };

  // PASSWORD GATE RENDER
  if (!isAdminAuthenticated) {
    return (
      <div className="app-container">
        <header className="header" role="banner">
          <div className="nav-container">
            <div className="logo-section" id="logo-branding-link">
              <div className="logo-icon">
                <Building size={20} />
              </div>
              <span className="logo-text">CivicFlow Admin</span>
            </div>
          </div>
        </header>

        <main className="main-content" role="main">
          <div className="password-gate-overlay">
            <div className={`password-gate-card ${shouldShake ? "card-shake" : ""}`} id="admin-password-gate-card">
              <div className="password-gate-icon-wrapper">
                <Lock size={28} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Admin Access</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "24px" }}>
                Enter password to continue
              </p>

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`form-input ${passwordError ? "error" : ""}`}
                      placeholder="Enter Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError("");
                      }}
                      id="admin-password-input"
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      id="btn-password-toggle"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {passwordError && (
                    <span className="error-message" id="password-error-message">
                      <AlertTriangle size={14} />
                      {passwordError}
                    </span>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" id="btn-password-enter">
                  <Unlock size={16} style={{ marginRight: "4px" }} />
                  Enter Console
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header" role="banner">
        <div className="nav-container">
          <div className="logo-section" onClick={() => setActiveTab("dashboard")} id="logo-branding-link">
            <div className="logo-icon">
              <Building size={20} />
            </div>
            <span className="logo-text">CivicFlow Admin</span>
          </div>

          <nav role="navigation" className="desktop-nav">
            <ul className="nav-links" id="navigation-list">
              <li>
                <span
                  className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
                  onClick={() => setActiveTab("dashboard")}
                  id="nav-link-dashboard"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <FolderOpen size={16} />
                  Dashboard
                </span>
              </li>
              <li>
                <span
                  className={`nav-item ${activeTab === "analytics" ? "active" : ""}`}
                  onClick={() => setActiveTab("analytics")}
                  id="nav-link-analytics"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Sparkles size={16} />
                  Analytics
                </span>
              </li>
              <li>
                <span
                  className="nav-item"
                  onClick={handleLogout}
                  id="nav-link-logout"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#f87171" }}
                >
                  <Lock size={16} />
                  Logout
                </span>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="main-content" role="main">
        {activeTab === "analytics" ? <Analytics /> : <AdminDashboard />}
      </main>

      <footer className="footer" role="contentinfo">
        <p>© 2026 CivicFlow. Admin Operations Console.</p>
        <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "var(--text-light)" }}>
          Powered by AI classification and automated dispatch systems.
        </p>
      </footer>
    </div>
  );
}
