import React, { useState, useEffect } from "react";
import { api } from "../api";
import { getStatusStyle, formatDateTime, isSLABreached, formatRelativeTime } from "../utils";
import { 
  Search, 
  AlertCircle, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  User,
  Shield,
  Clock,
  CheckCircle2,
  FileText,
  Activity,
  Copy,
  Check
} from "lucide-react";

export default function TrackComplaint({ params }) {
  const [copied, setCopied] = useState(false);
  const [complaintId, setComplaintId] = useState(params?.complaint_id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complaint, setComplaint] = useState(null);

  useEffect(() => {
    if (params?.complaint_id) {
      setComplaintId(params.complaint_id);
      trackId(params.complaint_id);
    }
  }, [params]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!complaintId.trim()) {
      setError("Please enter a valid Complaint ID.");
      return;
    }
    trackId(complaintId);
  };

  const trackId = async (id) => {
    setLoading(true);
    setError("");
    setComplaint(null);
    try {
      const data = await api.fetchComplaint(id.trim());
      setComplaint(data);
    } catch (err) {
      if (err.status === 404) {
        setError("Complaint ID not found. Please check and try again.");
      } else {
        setError(err.message || "An error occurred while tracking the complaint.");
      }
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = complaint ? getStatusStyle(complaint.status) : {};
  const isBreached = complaint ? isSLABreached(complaint.sla_deadline, complaint.status) : false;

  const getTimelineIcon = (newStatus, isLast) => {
    const statusLower = (newStatus || "").toLowerCase();
    if (statusLower === "resolved") {
      return <CheckCircle2 size={14} />;
    }
    if (statusLower === "escalated") {
      return <AlertTriangle size={14} />;
    }
    if (isLast) {
      return <Activity size={14} />;
    }
    return <CheckCircle2 size={14} />;
  };

  return (
    <div className="track-container">
      <div className="page-header">
        <h1 className="page-title">Track Grievance</h1>
        <p className="page-subtitle">
          Monitor your complaint resolution status, SLA targets, and updates history.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleTrackSubmit} className="track-search-bar" id="complaint-tracking-form">
          <div style={{ position: "relative", flex: 1, display: "flex" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-light)" }} />
            <input
              type="text"
              className="form-input track-input"
              placeholder="Enter Complaint ID (e.g. CF-20260706-001)"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              disabled={loading}
              id="input-tracking-id"
              style={{ paddingLeft: "42px" }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} id="btn-tracking-submit" style={{ minWidth: "110px" }}>
            {loading ? (
              <div className="spinner" style={{ width: "1.25rem", height: "1.25rem", borderWidth: "2px", borderColor: "rgba(255, 255, 255, 0.3)", borderTopColor: "#fff" }}></div>
            ) : (
              "Track"
            )}
          </button>
        </form>

        {error && (
          <div className="error-message" style={{ fontSize: "0.95rem", marginTop: "1rem" }} id="tracking-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="card skeleton-card">
          <div className="skeleton-row" style={{ width: "40%", height: "1.5rem" }}></div>
          <div className="skeleton-row" style={{ width: "100%", height: "4rem" }}></div>
          <div className="skeleton-row" style={{ width: "70%", height: "2rem" }}></div>
        </div>
      )}

      {complaint && (
        <div id="tracking-result-details">
          {/* Summary Card */}
          <div className="card" style={{ borderLeft: isBreached ? "5px solid var(--danger)" : "1px solid var(--border)" }}>
            <div className="summary-card-header">
              <div>
                <h3 style={{ fontSize: "1.35rem", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText size={20} style={{ color: "var(--primary)" }} />
                  {complaint.complaint_id}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(complaint.complaint_id);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "inline-flex",
                      alignItems: "center",
                      color: "var(--text-light)",
                      transition: "color var(--transition-normal)"
                    }}
                    title="Copy Complaint ID"
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-light)"}
                  >
                    {copied ? <Check size={14} style={{ color: "var(--primary)" }} /> : <Copy size={14} />}
                  </button>
                </h3>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                  <User size={14} />
                  Citizen: {complaint.citizen_name}
                </span>
              </div>
              <span
                className="badge"
                style={{
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text,
                  border: `1px solid ${statusStyle.border}`,
                  fontSize: "0.85rem",
                  padding: "6px 14px"
                }}
                id="tracking-status-badge"
              >
                {complaint.status}
              </span>
            </div>

            {isBreached && (
              <div className="duplicate-alert" style={{ backgroundColor: "var(--danger-light)", borderLeft: "4px solid var(--danger)", color: "var(--danger)", padding: "12px", margin: "0 0 1.5rem", borderRadius: "var(--radius-md)" }} id="tracking-sla-breach-warning">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                  <AlertTriangle size={18} />
                  <span>SLA Target Breached: Target resolution timeline exceeded.</span>
                </div>
              </div>
            )}

            <div className="track-summary-grid">
              <div className="summary-item">
                <span className="summary-label">Category</span>
                <span className="summary-value">{complaint.category || "General"}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Priority</span>
                <span className="summary-value">{complaint.priority}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Department</span>
                <span className="summary-value">{complaint.department}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={12} /> Location
                </span>
                <span className="summary-value">{complaint.location || "Not specified"}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={12} /> Filed Date
                </span>
                <span className="summary-value">{formatDateTime(complaint.created_at)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={12} /> SLA Target
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="summary-value" style={{ color: isBreached ? "var(--danger)" : "inherit", fontWeight: isBreached ? 700 : "inherit" }}>
                    {formatDateTime(complaint.sla_deadline)}
                  </span>
                  {isBreached && (
                    <span className="badge" style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", border: "1px solid var(--danger)", fontSize: "0.75rem", padding: "2px 6px" }}>
                      SLA Overdue
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <h3 className="timeline-section-title">Resolution History Logs</h3>
          {complaint.timeline && complaint.timeline.length > 0 ? (
            <div className="timeline" id="tracking-timeline-list">
              {complaint.timeline.map((log, index) => {
                const itemStatusStyle = getStatusStyle(log.new_status);
                const isLast = index === complaint.timeline.length - 1;

                return (
                  <div
                    key={index}
                    className={`timeline-item ${isLast ? "active" : "completed"}`}
                  >
                    <div className="timeline-dot">
                      {getTimelineIcon(log.new_status, isLast)}
                    </div>
                    <div className="timeline-card">
                      <div className="timeline-header">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: itemStatusStyle.bg,
                            color: itemStatusStyle.text,
                            border: `1px solid ${itemStatusStyle.border}`
                          }}
                        >
                          {log.new_status}
                        </span>
                        <span className="timeline-meta" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={12} />
                          <span>{formatDateTime(log.timestamp)}</span>
                          <span style={{ color: "var(--text-light)", fontSize: "0.8rem" }}>({formatRelativeTime(log.timestamp)})</span>
                        </span>
                      </div>
                      <div className="timeline-meta" style={{ marginBottom: "4px" }}>
                        Assigned Actor: <span className="timeline-by">{log.updated_by || "System"}</span>
                        {log.old_status && (
                          <span> (Status moved from {log.old_status})</span>
                        )}
                      </div>
                      {log.remarks && (
                        <div className="timeline-remarks">
                          {log.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-timeline-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", backgroundColor: "white", marginTop: "1rem" }}>
              <Clock size={36} style={{ marginBottom: "8px", opacity: 0.5 }} />
              <p style={{ fontSize: "0.95rem" }}>No history logs recorded for this complaint yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
