import React, { useState, useEffect } from "react";
import { api } from "../api";
import { getStatusStyle, formatDateTime, isSLABreached } from "../utils";
import { 
  Search, 
  X,
  User,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Send,
  Sparkles,
  Inbox,
  RotateCw,
} from "lucide-react";

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    department: "",
    priority: "",
  });

  // Search state
  const [searchType, setSearchType] = useState("q"); // "q" | "location"
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Selected complaint for modal details
  const [selectedId, setSelectedId] = useState(null);

  // Dashboard States
  const [toast, setToast] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadAnalyticsData = async () => {
    try {
      const data = await api.fetchAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Failed to load filter counts:", err);
    }
  };

  const getStatusCount = (statusValue) => {
    if (!analyticsData || !analyticsData.by_status) return 0;
    const key = Object.keys(analyticsData.by_status).find(
      k => k.toLowerCase() === statusValue.toLowerCase()
    );
    return key ? analyticsData.by_status[key] : 0;
  };

  const getCategoryCount = (catValue) => {
    if (!analyticsData || !analyticsData.by_category) return 0;
    const key = Object.keys(analyticsData.by_category).find(
      k => k.toLowerCase() === catValue.toLowerCase()
    );
    return key ? analyticsData.by_category[key] : 0;
  };

  const getDeptCount = (deptValue) => {
    if (!analyticsData || !analyticsData.by_department) return 0;
    const key = Object.keys(analyticsData.by_department).find(
      k => k.toLowerCase() === deptValue.toLowerCase()
    );
    return key ? analyticsData.by_department[key] : 0;
  };

  const getPriorityCount = (prioValue) => {
    if (!analyticsData || !analyticsData.by_priority) return 0;
    const key = Object.keys(analyticsData.by_priority).find(
      k => k.toLowerCase() === prioValue.toLowerCase()
    );
    return key ? analyticsData.by_priority[key] : 0;
  };

  const loadComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      let data;
      if (isSearchActive && searchQuery.trim()) {
        const searchParams = { [searchType]: searchQuery.trim() };
        const result = await api.searchComplaints(searchParams);
        data = result.results;
      } else {
        const result = await api.fetchAdminComplaints(filters);
        data = result.complaints;
      }
      setComplaints(data || []);
    } catch (err) {
      setError(err.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([loadComplaints(), loadAnalyticsData()]);
    showToast("Dashboard data refreshed");
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [filters, isSearchActive]);

  const sortedComplaints = React.useMemo(() => {
    let sortableItems = [...complaints];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "priority") {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[(a.priority || "").toLowerCase()] || 0;
          bVal = priorityOrder[(b.priority || "").toLowerCase()] || 0;
        } else if (sortConfig.key === "created_at" || sortConfig.key === "sla_deadline") {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        } else {
          aVal = aVal ? aVal.toString().toLowerCase() : "";
          bVal = bVal ? bVal.toString().toLowerCase() : "";
        }

        if (aVal < bVal) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [complaints, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setIsSearchActive(false); 
    setSearchQuery("");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchActive(true);
      loadComplaints();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        <div>
          <h1 className="page-title">Admin Operations Console</h1>
          <p className="page-subtitle">Manage filed grievances, verify AI categorizations, and view platform performance insights.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="filters-card">
        <form onSubmit={handleSearchSubmit} className="search-wrapper" style={{ marginBottom: "1.5rem" }} id="admin-search-form">
          <select
            className="form-input"
            style={{ width: "130px", flexShrink: 0, paddingRight: "1.5rem" }}
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            id="select-search-type"
          >
            <option value="q">Keyword</option>
            <option value="location">Location</option>
          </select>
          <div style={{ position: "relative", flex: 1, display: "flex" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-light)" }} />
            <input
              type="text"
              className="form-input"
              placeholder={searchType === "location" ? "Search by location..." : "Search complaints..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-admin-search"
              style={{ paddingLeft: "42px" }}
            />
          </div>
          <button type="submit" className="btn btn-primary" id="btn-admin-search-submit">Search</button>
          {isSearchActive && (
            <button type="button" className="btn btn-outline" onClick={handleClearSearch} id="btn-admin-search-clear">
              Clear
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRefresh}
            id="btn-admin-refresh"
            title="Refresh complaints list"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RotateCw size={14} className={loading ? "spin" : ""} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            <span>Refresh</span>
          </button>
        </form>

        <div className="filters-grid" id="admin-filters-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-status" style={{ fontSize: "0.8rem" }}>
              Status
            </label>
            <select
              id="filter-status"
              name="status"
              className="form-input"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses ({analyticsData?.total_complaints || 0})</option>
              <option value="Submitted">Submitted ({getStatusCount("Submitted")})</option>
              <option value="Categorized">Categorized ({getStatusCount("Categorized")})</option>
              <option value="Assigned">Assigned ({getStatusCount("Assigned")})</option>
              <option value="In Progress">In Progress ({getStatusCount("In Progress")})</option>
              <option value="Waiting for citizen response">Waiting for citizen response ({getStatusCount("Waiting for citizen response")})</option>
              <option value="Resolved">Resolved ({getStatusCount("Resolved")})</option>
              <option value="Closed">Closed ({getStatusCount("Closed")})</option>
              <option value="Escalated">Escalated ({getStatusCount("Escalated")})</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-category" style={{ fontSize: "0.8rem" }}>
              Category
            </label>
            <select
              id="filter-category"
              name="category"
              className="form-input"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories ({analyticsData?.total_complaints || 0})</option>
              <option value="Water">Water ({getCategoryCount("Water")})</option>
              <option value="Road">Road ({getCategoryCount("Road")})</option>
              <option value="Sanitation">Sanitation ({getCategoryCount("Sanitation")})</option>
              <option value="Electricity">Electricity ({getCategoryCount("Electricity")})</option>
              <option value="Other">Other ({getCategoryCount("Other")})</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-department" style={{ fontSize: "0.8rem" }}>
              Department
            </label>
            <select
              id="filter-department"
              name="department"
              className="form-input"
              value={filters.department}
              onChange={handleFilterChange}
            >
              <option value="">All Departments ({analyticsData?.total_complaints || 0})</option>
              <option value="Water Board">Water Board ({getDeptCount("Water Board")})</option>
              <option value="Roads Department">Roads Department ({getDeptCount("Roads Department")})</option>
              <option value="Sanitation Department">Sanitation Department ({getDeptCount("Sanitation Department")})</option>
              <option value="Electricity Board">Electricity Board ({getDeptCount("Electricity Board")})</option>
              <option value="General">General ({getDeptCount("General")})</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-priority" style={{ fontSize: "0.8rem" }}>
              Priority
            </label>
            <select
              id="filter-priority"
              name="priority"
              className="form-input"
              value={filters.priority}
              onChange={handleFilterChange}
            >
              <option value="">All Priorities ({analyticsData?.total_complaints || 0})</option>
              <option value="High">High ({getPriorityCount("High")})</option>
              <option value="Medium">Medium ({getPriorityCount("Medium")})</option>
              <option value="Low">Low ({getPriorityCount("Low")})</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="duplicate-alert" style={{ backgroundColor: "var(--danger-light)", borderLeft: "4px solid var(--danger)", color: "var(--danger)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="table-responsive">
        {loading ? (
          <div className="skeleton-card" style={{ border: "none" }}>
            <div className="skeleton-row" style={{ width: "100%", height: "2.5rem" }}></div>
            <div className="skeleton-row" style={{ width: "100%", height: "2rem" }}></div>
            <div className="skeleton-row" style={{ width: "100%", height: "2rem" }}></div>
            <div className="skeleton-row" style={{ width: "100%", height: "2rem" }}></div>
          </div>
        ) : complaints.length > 0 ? (
          <>
            <table className="admin-table" id="admin-complaints-table">
              <thead>
                <tr>
                  <th>Grievance ID</th>
                  <th>Citizen</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Department</th>
                  <th>Officer</th>
                  <th>Status</th>
                  <th>Filed Date</th>
                  <th>SLA Target</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => {
                  const style = getStatusStyle(item.status);
                  const isBreached = isSLABreached(item.sla_deadline, item.status);
                  return (
                    <tr
                      key={item.complaint_id}
                      className={isBreached ? "row-breached" : ""}
                      onClick={() => setSelectedId(item.complaint_id)}
                      title="Click to view details and AI actions"
                    >
                      <td className="strong">{item.complaint_id}</td>
                      <td>{item.citizen_name}</td>
                      <td>{item.category || "N/A"}</td>
                      <td>{item.priority || "N/A"}</td>
                      <td>{item.department || "N/A"}</td>
                      <td>{item.assigned_officer_name || "Unassigned"}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            border: `1px solid ${style.border}`,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>{formatDateTime(item.created_at)}</td>
                      <td style={{ color: isBreached ? "var(--danger)" : "inherit", fontWeight: isBreached ? 700 : "inherit" }}>
                        {formatDateTime(item.sla_deadline)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="admin-mobile-cards" id="admin-complaints-mobile-cards">
              {complaints.map((item) => {
                const style = getStatusStyle(item.status);
                const isBreached = isSLABreached(item.sla_deadline, item.status);
                return (
                  <div
                    key={item.complaint_id}
                    className={`admin-card-item ${isBreached ? "row-breached" : ""}`}
                    onClick={() => setSelectedId(item.complaint_id)}
                    title="Click to view details and AI actions"
                  >
                    <div className="admin-card-header">
                      <span className="admin-card-title">{item.complaint_id}</span>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">Citizen</span>
                      <span className="admin-card-value">{item.citizen_name}</span>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">Category</span>
                      <span className="admin-card-value">{item.category || "N/A"}</span>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">Priority</span>
                      <span className="admin-card-value">{item.priority || "N/A"}</span>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">Department</span>
                      <span className="admin-card-value">{item.department || "N/A"}</span>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">Officer</span>
                      <span className="admin-card-value">{item.assigned_officer_name || "Unassigned"}</span>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">Filed Date</span>
                      <span className="admin-card-value">{formatDateTime(item.created_at)}</span>
                    </div>
                    <div className="admin-card-row">
                      <span className="admin-card-label">SLA Target</span>
                      <span
                        className="admin-card-value"
                        style={{ color: isBreached ? "var(--danger)" : "inherit", fontWeight: isBreached ? 700 : "inherit" }}
                      >
                        {formatDateTime(item.sla_deadline)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* EMPTY STATE */
          <div className="empty-state">
            <Inbox size={48} className="empty-state-icon" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>No Grievances Found</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", maxWidth: "320px", margin: "0 auto" }}>
              We couldn't find any complaints matching your criteria. Try adjusting the search text or filtering categories.
            </p>
          </div>
        )}
      </div>

      {/* Drawer details */}
      {selectedId && (
        <DetailDrawer
          complaintId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdateSuccess={() => {
            loadComplaints(); 
          }}
        />
      )}
    </div>
  );
}

function DetailDrawer({ complaintId, onClose, onUpdateSuccess }) {
  const [complaint, setComplaint] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  const loadDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const [detailData, logData] = await Promise.all([
        api.fetchComplaint(complaintId),
        api.fetchAgentLog(complaintId).catch(() => ({ agent_logs: [] })), 
      ]);
      setComplaint(detailData);
      setNewStatus(detailData.status);
      setAgentLogs(logData.agent_logs || []);
    } catch (err) {
      setError(err.message || "Failed to load complaint details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [complaintId]);

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      await api.updateComplaintStatus(complaintId, newStatus, remarks, "admin");
      setRemarks("");
      onUpdateSuccess();
      await loadDetails(); 
    } catch (err) {
      alert(err.message || "Failed to update complaint status.");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Loading Details...</h3>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="modal-body skeleton-card" style={{ border: "none" }}>
            <div className="skeleton-row" style={{ width: "40%", height: "1.5rem" }}></div>
            <div className="skeleton-row" style={{ width: "100%", height: "4rem" }}></div>
            <div className="skeleton-row" style={{ width: "60%", height: "2rem" }}></div>
          </div>
        </div>
      </div>
    );
  }

  const isBreached = complaint ? isSLABreached(complaint.sla_deadline, complaint.status) : false;

  return (
    <div className="modal-overlay" onClick={onClose} id="complaint-detail-modal">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontFamily: "Outfit", color: "var(--text-dark)", fontSize: "1.35rem" }}>{complaintId}</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Operations details drawer</span>
          </div>
          <button className="btn-icon" onClick={onClose} id="btn-close-modal"><X size={22} /></button>
        </div>

        <div className="modal-body">
          {error ? (
            <div className="duplicate-alert" style={{ backgroundColor: "var(--danger-light)", borderLeft: "4px solid var(--danger)", color: "var(--danger)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Metadata details */}
              <div className="track-summary-grid" style={{ marginBottom: "1.5rem", gridTemplateColumns: "repeat(2, 1fr)" }}>
                <div className="summary-item">
                  <span className="summary-label" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><User size={12} /> Citizen</span>
                  <span className="summary-value">{complaint.citizen_name}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Phone size={12} /> Contact</span>
                  <span className="summary-value">{complaint.contact_info}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Category</span>
                  <span className="summary-value">{complaint.category || "N/A"}</span>
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
                  <span className="summary-label" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><MapPin size={12} /> Location</span>
                  <span className="summary-value">{complaint.location || "N/A"}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Status</span>
                  <span
                    className="badge"
                    style={{
                      alignSelf: "flex-start",
                      ...getStatusStyle(complaint.status)
                    }}
                  >
                    {complaint.status}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Clock size={12} /> SLA Target</span>
                  <span className="summary-value" style={{ color: isBreached ? "var(--danger)" : "inherit", fontWeight: isBreached ? 700 : "inherit" }}>
                    {formatDateTime(complaint.sla_deadline)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: "2rem" }}>
                <h4 className="modal-section-title">Complaint Description</h4>
                <div
                  style={{
                    backgroundColor: "var(--bg-main)",
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.95rem",
                    border: "1px solid var(--border)",
                    whiteSpace: "pre-line",
                    color: "var(--text-main)",
                    lineHeight: "1.5"
                  }}
                >
                  {complaint.complaint_text || "No description provided."}
                </div>
              </div>

              {/* AI Agent Insights */}
              <div className="agent-insights-panel" id="modal-agent-insights">
                <div className="agent-insight-title">
                  <Sparkles size={18} style={{ color: "#166534" }} />
                  AI Auto-routing Insights
                </div>

                {agentLogs && agentLogs.length > 0 ? (
                  agentLogs.map((log, index) => {
                    const confidenceLower = (log.confidence || "").toLowerCase();
                    return (
                      <div key={index} className="agent-log-card">
                        <div className="agent-log-header">
                          <span className="agent-log-action">⚡ Recommendation: {log.recommended_action}</span>
                          <span className={`agent-confidence-pill ${confidenceLower}`}>
                            {log.confidence} Conf.
                          </span>
                        </div>
                        <div className="agent-log-reasoning">{log.reasoning}</div>
                        {log.hours_overdue > 0 && (
                          <div style={{ color: "var(--danger)", fontSize: "0.8rem", fontWeight: 700, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <AlertTriangle size={14} />
                            Overdue by {log.hours_overdue} hour(s)
                          </div>
                        )}
                        <div className="agent-log-time">{formatDateTime(log.evaluated_at)}</div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: "#166534", fontSize: "0.9rem", fontStyle: "italic", padding: "4px" }}>
                    No AI evaluation reports generated yet for this complaint.
                  </p>
                )}
              </div>

              {/* Status Update Form */}
              <div className="update-status-form" id="modal-status-update-box">
                <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  Update Grievance lifecycle
                </h4>
                <form onSubmit={handleUpdateStatusSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-status-select" style={{ fontSize: "0.8rem" }}>
                      New Status
                    </label>
                    <select
                      id="modal-status-select"
                      className="form-input"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={updateLoading}
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Categorized">Categorized</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Waiting for citizen response">Waiting for citizen response</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                      <option value="Escalated">Escalated</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-remarks-textarea" style={{ fontSize: "0.8rem" }}>
                      Remarks / Action Taken
                    </label>
                    <textarea
                      id="modal-remarks-textarea"
                      className="form-input"
                      rows="3"
                      placeholder="Explain action taken or reasons for transition..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      disabled={updateLoading}
                      style={{ resize: "vertical", fontFamily: "inherit" }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updateLoading}
                    id="btn-modal-update-status"
                  >
                    {updateLoading ? (
                      <div className="spinner" style={{ width: "1.25rem", height: "1.25rem", borderWidth: "2px", borderColor: "rgba(255, 255, 255, 0.3)", borderTopColor: "#fff" }}></div>
                    ) : (
                      <>
                        <Send size={16} />
                        Update Life Status
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Progress timeline logs */}
              <h4 className="modal-section-title">Status Logs Timeline</h4>
              {complaint.timeline && complaint.timeline.length > 0 ? (
                <div className="timeline" style={{ paddingLeft: "1.5rem" }}>
                  {complaint.timeline.map((log, idx) => {
                    const itemStyle = getStatusStyle(log.new_status);
                    return (
                      <div key={idx} className="timeline-item" style={{ paddingBottom: "1.25rem" }}>
                        <div className="timeline-dot" style={{ left: "-1.5rem", width: "18px", height: "18px", top: "4px" }}></div>
                        <div className="timeline-card" style={{ padding: "10px 14px" }}>
                          <div className="timeline-header" style={{ marginBottom: "2px" }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: itemStyle.bg,
                                color: itemStyle.text,
                                border: `1px solid ${itemStyle.border}`,
                                fontSize: "0.7rem",
                                padding: "2px 8px"
                              }}
                            >
                              {log.new_status}
                            </span>
                            <span className="timeline-meta" style={{ fontSize: "0.75rem" }}>
                              {formatDateTime(log.timestamp)}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            By: <strong>{log.updated_by || "System"}</strong>
                          </span>
                          {log.remarks && (
                            <div className="timeline-remarks" style={{ fontSize: "0.85rem", padding: "8px", marginTop: "4px" }}>
                              {log.remarks}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem", padding: "4px" }}>
                  No history logs captured.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
