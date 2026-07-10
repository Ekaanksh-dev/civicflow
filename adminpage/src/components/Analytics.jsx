import React, { useState, useEffect } from "react";
import { api } from "../api";
import { getStatusStyle } from "../utils";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  MapPin, 
  Grid 
} from "lucide-react";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.fetchAnalytics();
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load analytics statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="skeleton-card" style={{ height: "400px", border: "none" }}>
        <div className="skeleton-row" style={{ width: "40%", height: "2rem", marginBottom: "2rem" }}></div>
        <div className="skeleton-row" style={{ width: "100%", height: "4rem" }}></div>
        <div className="skeleton-row" style={{ width: "100%", height: "8rem" }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <AlertTriangle size={36} style={{ color: "var(--danger)", marginBottom: "1rem" }} />
        <p style={{ color: "var(--danger)", fontWeight: 600, marginBottom: "1rem" }}>{error}</p>
        <button className="btn btn-primary" onClick={loadAnalytics}>Retry Load</button>
      </div>
    );
  }

  const { total_complaints, sla_breached_active, by_category, by_status, by_department } = data;

  // Donut calculations
  const categoryEntries = Object.entries(by_category || {});
  const categoryTotal = categoryEntries.reduce((sum, [_, count]) => sum + count, 0);
  const donutColors = ["#0f766e", "#0284c7", "#3b82f6", "#6366f1", "#d97706", "#db2777", "#10b981", "#64748b"];
  
  let accumulatedPercent = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.159

  const donutSlices = categoryEntries.map(([category, count], idx) => {
    const fraction = categoryTotal > 0 ? count / categoryTotal : 0;
    const strokeDash = fraction * circumference;
    const offset = circumference - strokeDash + (accumulatedPercent * circumference);
    accumulatedPercent -= fraction;
    
    return {
      category,
      count,
      percent: (fraction * 100).toFixed(1),
      strokeDasharray: `${strokeDash} ${circumference}`,
      strokeDashoffset: offset,
      color: donutColors[idx % donutColors.length]
    };
  });

  // Bar calculations
  const statusEntries = Object.entries(by_status || {});
  const maxStatusCount = Math.max(...statusEntries.map(([_, count]) => count), 1);

  const deptEntries = Object.entries(by_department || {}).sort((a, b) => b[1] - a[1]);
  const maxDeptCount = Math.max(...deptEntries.map(([_, count]) => count), 1);

  return (
    <div id="analytics-section">
      <div className="stats-grid">
        <div className="stat-card" id="card-total-complaints">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="stat-card-title">Total Complaints</span>
            <TrendingUp size={20} style={{ color: "var(--primary)" }} />
          </div>
          <span className="stat-card-value">{total_complaints}</span>
        </div>
        <div className={`stat-card ${sla_breached_active > 0 ? "breach" : ""}`} id="card-sla-breached">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="stat-card-title">SLA Breached (Active)</span>
            <AlertTriangle size={20} style={{ color: sla_breached_active > 0 ? "var(--danger)" : "var(--text-light)" }} />
          </div>
          <span className="stat-card-value">{sla_breached_active}</span>
        </div>
      </div>

      <div className="charts-grid">
        {/* Category donut chart */}
        <div className="chart-card" id="chart-by-category">
          <h3 className="chart-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Layers size={18} style={{ color: "var(--primary)" }} />
            Category Distribution
          </h3>
          <div className="chart-content">
            {categoryTotal > 0 ? (
              <div className="donut-chart-wrapper">
                <div className="donut-svg-wrapper">
                  <svg width="150" height="150" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                    {donutSlices.map((slice, idx) => (
                      <circle
                        key={idx}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="12"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                      />
                    ))}
                    <circle cx="60" cy="60" r="38" fill="white" />
                    <g style={{ transform: "rotate(90deg) translate(58px, -58px)", textAnchor: "middle" }}>
                      <text dy="-2" style={{ fontFamily: "Outfit", fontSize: "14px", fontWeight: 800, fill: "var(--text-dark)" }}>
                        {categoryTotal}
                      </text>
                      <text dy="10" style={{ fontSize: "6px", fontWeight: 700, fill: "var(--text-light)", letterSpacing: "0.8px" }}>
                        TOTAL
                      </text>
                    </g>
                  </svg>
                </div>
                <div className="donut-legend">
                  {donutSlices.map((slice, idx) => (
                    <div key={idx} className="legend-item" title={`${slice.category}: ${slice.count} (${slice.percent}%)`}>
                      <span className="legend-color" style={{ backgroundColor: slice.color }}></span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {slice.category} ({slice.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>No category metrics logged.</p>
            )}
          </div>
        </div>

        {/* Status bar chart */}
        <div className="chart-card" id="chart-by-status">
          <h3 className="chart-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <BarChart3 size={18} style={{ color: "var(--primary)" }} />
            Lifecycle Statuses
          </h3>
          <div className="chart-content" style={{ alignItems: "flex-start", justifyContent: "stretch", padding: "0.5rem 0" }}>
            {statusEntries.length > 0 ? (
              <div className="chart-bar-group">
                {statusEntries.map(([status, count]) => {
                  const style = getStatusStyle(status);
                  const widthPct = (count / maxStatusCount) * 100;
                  return (
                    <div key={status} className="chart-bar-row">
                      <span className="chart-bar-label" title={status}>
                        {status}
                      </span>
                      <div className="chart-bar-track">
                        <div
                          className="chart-bar-fill"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: style.text || "var(--primary)"
                          }}
                        ></div>
                      </div>
                      <span className="chart-bar-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>No status metrics logged.</p>
            )}
          </div>
        </div>

        {/* Department chart */}
        <div className="chart-card" id="chart-by-department">
          <h3 className="chart-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Grid size={18} style={{ color: "var(--primary)" }} />
            Routed Departments
          </h3>
          <div className="chart-content" style={{ alignItems: "flex-start", justifyContent: "stretch", padding: "0.5rem 0" }}>
            {deptEntries.length > 0 ? (
              <div className="chart-bar-group">
                {deptEntries.map(([department, count]) => {
                  const widthPct = (count / maxDeptCount) * 100;
                  return (
                    <div key={department} className="chart-bar-row">
                      <span className="chart-bar-label" title={department} style={{ width: "120px" }}>
                        {department}
                      </span>
                      <div className="chart-bar-track">
                        <div
                          className="chart-bar-fill"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: "var(--primary-dark)"
                          }}
                        ></div>
                      </div>
                      <span className="chart-bar-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>No department metrics logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
