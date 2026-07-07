import React, { useState } from "react";
import { api } from "../api";
import { getStatusStyle } from "../utils";
import { 
  CheckCircle, 
  Copy, 
  Check, 
  AlertCircle, 
  AlertTriangle,
  Send,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  ArrowRight
} from "lucide-react";

export default function SubmitComplaint({ onNavigate }) {
  const [formData, setFormData] = useState({
    citizen_name: "",
    contact_info: "",
    email: "",
    complaint_text: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [submittedData, setSubmittedData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setFieldErrors({});
    setGlobalError("");
    setSubmittedData(null);

    const errors = {};
    if (!formData.citizen_name.trim()) errors.citizen_name = "Full name is required";
    
    if (!formData.contact_info.trim()) {
      errors.contact_info = "Phone number is required";
    } else {
      const cleanPhone = formData.contact_info.trim();
      if (!/^\d{10}$/.test(cleanPhone)) {
        errors.contact_info = "Phone number must be exactly 10 digits (numbers only)";
      }
    }

    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email format";
      }
    }
    if (!formData.complaint_text.trim()) errors.complaint_text = "Complaint details are required";
    if (!formData.location.trim()) errors.location = "Location is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const result = await api.submitComplaint(formData);
      setSubmittedData(result);
      setFormData({
        citizen_name: "",
        contact_info: "",
        email: "",
        complaint_text: "",
        location: "",
      });
    } catch (err) {
      if (err.status === 422 && err.validationErrors) {
        setFieldErrors(err.validationErrors);
      } else {
        setGlobalError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (submittedData?.complaint_id) {
      navigator.clipboard.writeText(submittedData.complaint_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPriorityStyle = (priority) => {
    switch ((priority || "").toLowerCase()) {
      case "high":
        return { bg: "rgba(225, 29, 72, 0.12)", color: "#e11d48", border: "rgba(225, 29, 72, 0.2)" };
      case "medium":
        return { bg: "rgba(217, 119, 6, 0.12)", color: "#d97706", border: "rgba(217, 119, 6, 0.2)" };
      case "low":
        return { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "rgba(16, 185, 129, 0.2)" };
      default:
        return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b", border: "rgba(100, 116, 139, 0.15)" };
    }
  };

  if (submittedData) {
    const statusStyle = getStatusStyle(submittedData.status);
    const priorityStyle = getPriorityStyle(submittedData.priority);

    return (
      <div className="success-container card" id="submit-success-view" style={{ maxWidth: "600px" }}>
        <div className="success-icon-wrapper">
          <CheckCircle size={36} />
        </div>

        <h2>Grievance Registered</h2>
        <p className="page-subtitle" style={{ marginTop: "4px" }}>
          Your complaint has been parsed and cataloged by the AI system.
        </p>

        <div className="id-card" style={{ borderStyle: "dashed", borderWidth: "1px" }}>
          <span className="id-label">Reference ID</span>
          <span className="id-value" id="success-complaint-id">{submittedData.complaint_id}</span>
          <div className="id-actions">
            <button className="btn btn-outline" onClick={handleCopy} title="Copy ID" id="btn-copy-id" style={{ padding: "8px 16px", display: "inline-flex", gap: "6px", fontSize: "0.9rem" }}>
              {copied ? (
                <>
                  <Check size={16} style={{ color: "var(--primary)" }} />
                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="badge-row">
          <span
            className="badge"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
          >
            {submittedData.status}
          </span>
          <span
            className="badge"
            style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.color, border: `1px solid ${priorityStyle.border}` }}
          >
            Priority: {submittedData.priority}
          </span>
          <span
            className="badge"
            style={{ backgroundColor: "rgba(15, 118, 110, 0.08)", color: "var(--primary-dark)", border: "1px solid rgba(15, 118, 110, 0.15)" }}
          >
            Dept: {submittedData.department}
          </span>
          <span
            className="badge"
            style={{ backgroundColor: "rgba(100, 116, 139, 0.08)", color: "var(--text-main)", border: "1px solid rgba(100, 116, 139, 0.15)" }}
          >
            Category: {submittedData.category}
          </span>
        </div>

        {submittedData.assigned_officer && (
          <p className="officer-text" id="success-assigned-officer">
            Assigned Officer: <strong>{submittedData.assigned_officer}</strong>
          </p>
        )}

        {submittedData.email_sent && (
          <div>
            <span className="email-success" id="success-email-status">
              <Check size={14} /> Confirmation email sent
            </span>
          </div>
        )}

        {submittedData.duplicate_of && (
          <div className="duplicate-alert" id="success-duplicate-warning">
            <div className="duplicate-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle size={18} style={{ color: "var(--warning)" }} />
              Potential Duplicate Detected
            </div>
            This appears closely related to an existing complaint (ID:{" "}
            <strong>{submittedData.duplicate_of}</strong>). Your submission is logged but marked as a duplicate and auto-closed.
          </div>
        )}

        <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate("track", { complaint_id: submittedData.complaint_id })}
            id="btn-success-track"
          >
            Track Status
            <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary" onClick={() => setSubmittedData(null)} id="btn-success-new">
            File New Complaint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-container">
      <div className="page-header">
        <h1 className="page-title">Submit a Grievance</h1>
        <p className="page-subtitle">
          File details of the civic issue. Our AI engine will run classifications and dispatch reports.
        </p>
      </div>

      <form className="card" onSubmit={handleSubmit} id="complaint-submission-form">
        {globalError && (
          <div className="duplicate-alert" style={{ backgroundColor: "var(--danger-light)", borderLeft: "4px solid var(--danger)", color: "var(--danger)", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={18} />
              <span>{globalError}</span>
            </div>
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label required" htmlFor="citizen_name">
              Citizen Name
            </label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--text-light)" }} />
              <input
                type="text"
                id="citizen_name"
                name="citizen_name"
                className={`form-input ${fieldErrors.citizen_name ? "error" : ""}`}
                value={formData.citizen_name}
                onChange={handleChange}
                placeholder="E.g. Jane Doe"
                disabled={loading}
                style={{ paddingLeft: "40px" }}
              />
            </div>
            {fieldErrors.citizen_name && (
              <span className="error-message">
                <AlertCircle size={14} />
                {fieldErrors.citizen_name}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required" htmlFor="contact_info">
              Phone Number
            </label>
            <div style={{ position: "relative" }}>
              <Phone size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--text-light)" }} />
              <input
                type="text"
                id="contact_info"
                name="contact_info"
                className={`form-input ${fieldErrors.contact_info ? "error" : ""}`}
                value={formData.contact_info}
                onChange={handleChange}
                placeholder="10-digit number"
                disabled={loading}
                style={{ paddingLeft: "40px" }}
              />
            </div>
            {fieldErrors.contact_info && (
              <span className="error-message">
                <AlertCircle size={14} />
                {fieldErrors.contact_info}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required" htmlFor="email">
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--text-light)" }} />
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${fieldErrors.email ? "error" : ""}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@domain.com"
                disabled={loading}
                style={{ paddingLeft: "40px" }}
              />
            </div>
            {fieldErrors.email && (
              <span className="error-message">
                <AlertCircle size={14} />
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required" htmlFor="location">
              Grievance Location
            </label>
            <div style={{ position: "relative" }}>
              <MapPin size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--text-light)" }} />
              <input
                type="text"
                id="location"
                name="location"
                className={`form-input ${fieldErrors.location ? "error" : ""}`}
                value={formData.location}
                onChange={handleChange}
                placeholder="E.g. Sector 4, Cross Road, Central Park"
                disabled={loading}
                style={{ paddingLeft: "40px" }}
              />
            </div>
            {fieldErrors.location && (
              <span className="error-message">
                <AlertCircle size={14} />
                {fieldErrors.location}
              </span>
            )}
          </div>

          <div className="form-group full-width">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label required" htmlFor="complaint_text" style={{ marginBottom: 0 }}>
                Describe your complaint
              </label>
              <span style={{ fontSize: "0.8rem", color: formData.complaint_text.length < 30 ? "var(--text-light)" : "var(--primary)", fontWeight: 500 }}>
                {formData.complaint_text.length} characters {formData.complaint_text.length < 30 && "(30+ recommended)"}
              </span>
            </div>
            <div style={{ position: "relative", display: "flex", marginTop: "8px" }}>
              <FileText size={16} style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-light)" }} />
              <textarea
                id="complaint_text"
                name="complaint_text"
                className={`form-input ${fieldErrors.complaint_text ? "error" : ""}`}
                value={formData.complaint_text}
                onChange={handleChange}
                placeholder="Provide a detailed description of the issue..."
                rows="5"
                disabled={loading}
                style={{ resize: "vertical", fontFamily: "inherit", paddingLeft: "40px" }}
              />
            </div>
            {fieldErrors.complaint_text && (
              <span className="error-message">
                <AlertCircle size={14} />
                {fieldErrors.complaint_text}
              </span>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }} disabled={loading} id="btn-submit-complaint">
          {loading ? (
            <>
              <div className="spinner" style={{ width: "1.25rem", height: "1.25rem", borderWidth: "2px", borderColor: "rgba(255, 255, 255, 0.3)", borderTopColor: "#fff", display: "inline-block", borderRadius: "50%", verticalAlign: "middle", animation: "spin 1s linear infinite" }}></div>
              Classifying your complaint with AI...
            </>
          ) : (
            <>
              <Send size={18} />
              File Complaint
            </>
          )}
        </button>
      </form>
    </div>
  );
}

