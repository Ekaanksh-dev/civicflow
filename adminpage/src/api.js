const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 422) {
      const data = await response.json();
      const errors = {};
      if (data.detail && Array.isArray(data.detail)) {
        data.detail.forEach((err) => {
          const field = err.loc[err.loc.length - 1];
          // Strip FastAPI internal prefix like "Value error, " if present
          let msg = err.msg || "Invalid value";
          if (msg.startsWith("Value error, ")) {
            msg = msg.substring("Value error, ".length);
          }
          errors[field] = msg;
        });
      }
      throw { status: 422, validationErrors: errors };
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      
      let message = "";
      if (errorData && typeof errorData.detail === "string") {
        message = errorData.detail;
      } else if (errorData && Array.isArray(errorData.detail)) {
        message = errorData.detail.map(e => e.msg || JSON.stringify(e)).join(", ");
      } else if (errorData && typeof errorData.detail === "object" && errorData.detail !== null) {
        message = JSON.stringify(errorData.detail);
      } else {
        message = errorText || `Server returned ${response.status}`;
      }

      throw {
        status: response.status,
        message: message,
      };
    }

    return await response.json();
  } catch (err) {
    if (err.status) {
      throw err; // Re-throw structured API errors
    }
    throw {
      status: 0,
      message: "Unable to connect to server — is it running?",
    };
  }
}

export const api = {
  // Complaint details (GET /complaints/{id}) — used by DetailDrawer
  fetchComplaint: (id) => request(`/complaints/${encodeURIComponent(id)}`),

  // Admin list (GET /admin/complaints)
  fetchAdminComplaints: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.category) params.append("category", filters.category);
    if (filters.department) params.append("department", filters.department);
    if (filters.priority) params.append("priority", filters.priority);
    
    return request(`/admin/complaints?${params.toString()}`);
  },

  // Search complaints (GET /search)
  searchComplaints: (searchParams = {}) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.append("q", searchParams.q);
    if (searchParams.location) params.append("location", searchParams.location);
    
    return request(`/search?${params.toString()}`);
  },

  // AI Agent logs (GET /complaints/{id}/agent-log)
  fetchAgentLog: (id) => request(`/complaints/${encodeURIComponent(id)}/agent-log`),

  // Update status (PATCH /complaints/{id})
  updateComplaintStatus: (id, newStatus, remarks = "", updatedBy = "admin") =>
    request(`/complaints/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        new_status: newStatus,
        remarks,
        updated_by: updatedBy,
      }),
    }),

  // Full Analytics (GET /analytics)
  fetchAnalytics: () => request("/analytics"),
};
