import React, { useState, useEffect } from "react";
import { api } from "../api";
import { PlusCircle, Search, Activity, Sparkles, TrendingUp } from "lucide-react";

export default function Home({ onNavigate }) {
  const [totalComplaints, setTotalComplaints] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fetchHomeAnalytics()
      .then((data) => {
        setTotalComplaints(data.total_complaints);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading home page statistics:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home-hero">
      <h1 className="home-title" id="home-main-title">CivicFlow</h1>
      <p className="home-subtitle">
        Report civic issues and track their resolution with AI-powered automation.
      </p>

      <div className="home-actions" style={{ marginBottom: "2rem" }}>
        <button
          id="btn-home-submit"
          className="btn btn-primary home-btn"
          onClick={() => onNavigate("submit")}
          style={{ border: "1px solid var(--primary)" }}
        >
          <PlusCircle size={20} />
          Submit a Complaint
        </button>
        <button
          id="btn-home-track"
          className="btn btn-outline home-btn"
          onClick={() => onNavigate("track")}
          style={{ border: "1.5px solid var(--border)", color: "var(--text-main)", fontWeight: 600 }}
        >
          <Search size={20} />
          Track a Complaint
        </button>
      </div>

      {loading ? (
        <div className="home-stats-strip" style={{ justifyContent: "center" }}>
          <div className="skeleton-row" style={{ width: "60%", height: "1.5rem" }}></div>
        </div>
      ) : totalComplaints !== null ? (
        <div className="home-stats-strip" id="home-stats-display" style={{ margin: "2rem auto" }}>
          <Activity size={32} className="stats-icon" style={{ color: "var(--primary)" }} />
          <div>
            <span className="stats-number" style={{ display: "block", textAlign: "left" }}>{totalComplaints}</span>
            <span className="stats-label">
              Civic grievances resolved or routed by AI.
            </span>
          </div>
        </div>
      ) : null}

      {/* How it Works Section */}
      <div className="how-it-works" style={{ marginTop: "4rem", width: "100%" }}>
        <h2 className="how-it-works-title">
          How it works
        </h2>
        <div className="steps-grid">
          <div className="step-card card">
            <div className="step-icon" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-dark)" }}>
              <PlusCircle size={20} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "8px", fontWeight: 700 }}>1. Submit</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
              Report the grievance with details and location of the issue.
            </p>
          </div>

          <div className="step-card card">
            <div className="step-icon" style={{ backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#6b21a8" }}>
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "8px", fontWeight: 700 }}>2. AI Dispatch</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
              AI classifies the issue, sets priority, and assigns the correct officer.
            </p>
          </div>

          <div className="step-card card">
            <div className="step-icon" style={{ backgroundColor: "rgba(14, 165, 233, 0.15)", color: "#0369a1" }}>
              <TrendingUp size={20} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "8px", fontWeight: 700 }}>3. Track</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
              Monitor live updates and resolution logs with automated SLA triggers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
