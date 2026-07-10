const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    
    // If we're on localhost, target port 8001
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:8001`;
    }
    
    // Support port forwarding environments
    if (origin.includes("5173")) {
      return origin.replace("5173", "8001");
    }
    
    // Fallback to same hostname on port 8001
    if (window.location.port) {
      return `${window.location.protocol}//${hostname}:8001`;
    }
  }
  return "http://127.0.0.1:8001";
};

const BASE_URL = getBaseUrl();

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
  // Page 1: Home (GET /analytics)
  fetchHomeAnalytics: () => request("/analytics"),

  // Page 2: Submit Complaint (POST /complaints)
  submitComplaint: (data) =>
    request("/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Page 3: Track Complaint details (GET /complaints/{id})
  fetchComplaint: (id) => request(`/complaints/${encodeURIComponent(id)}`),

  // Page 4: AI Assistant (POST /citizen/ask)
  askAssistant: (query, complaintId = null) =>
    request("/citizen/ask", {
      method: "POST",
      body: JSON.stringify({
        query,
        complaint_id: complaintId,
      }),
    }),
};
