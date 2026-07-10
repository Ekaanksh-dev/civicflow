export const STATUS_STYLING = {
  "submitted": { bg: "rgba(14, 165, 233, 0.15)", text: "#0369a1", border: "rgba(14, 165, 233, 0.3)" },
  "categorized": { bg: "rgba(168, 85, 247, 0.15)", text: "#6b21a8", border: "rgba(168, 85, 247, 0.3)" },
  "assigned": { bg: "rgba(168, 85, 247, 0.15)", text: "#6b21a8", border: "rgba(168, 85, 247, 0.3)" },
  "in progress": { bg: "rgba(249, 115, 22, 0.15)", text: "#c2410c", border: "rgba(249, 115, 22, 0.3)" },
  "waiting for citizen response": { bg: "rgba(234, 179, 8, 0.15)", text: "#b45309", border: "rgba(234, 179, 8, 0.3)" },
  "resolved": { bg: "rgba(16, 185, 129, 0.15)", text: "#047857", border: "rgba(16, 185, 129, 0.3)" },
  "closed": { bg: "rgba(107, 114, 128, 0.15)", text: "#374151", border: "rgba(107, 114, 128, 0.3)" },
  "escalated": { bg: "rgba(239, 68, 68, 0.15)", text: "#b91c1c", border: "rgba(239, 68, 68, 0.3)" }
};

export function getStatusStyle(status = "") {
  const norm = status.toLowerCase().trim();
  return STATUS_STYLING[norm] || { bg: "rgba(107, 114, 128, 0.1)", text: "#4b5563", border: "rgba(107, 114, 128, 0.2)" };
}

/**
 * Ensures an ISO timestamp string from the backend is correctly parsed as UTC.
 * The backend uses datetime.utcnow() which produces naive datetimes serialized
 * without a 'Z' suffix (e.g. "2026-07-07T06:01:34"). JavaScript's new Date()
 * treats such strings as local time, causing a timezone offset error.
 * This helper appends 'Z' when no timezone indicator is present.
 */
function parseUTCDate(isoString) {
  if (typeof isoString === "string" && !isoString.endsWith("Z") && !isoString.includes("+") && !/\d{2}:\d{2}$/.test(isoString.slice(-6).replace(/T.*/, ""))) {
    return new Date(isoString + "Z");
  }
  return new Date(isoString);
}

export function formatDateTime(isoString) {
  if (!isoString) return "N/A";
  const date = parseUTCDate(isoString);
  if (isNaN(date.getTime())) return isoString;

  // Format the absolute display string in IST (Asia/Kolkata)
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function isSLABreached(slaDeadline, status) {
  if (!slaDeadline) return false;
  const deadline = parseUTCDate(slaDeadline);
  const now = new Date();
  const activeStatuses = [
    "submitted", "categorized", "assigned", "in progress", "waiting for citizen response", "escalated"
  ];
  const isStatusActive = activeStatuses.includes((status || "").toLowerCase().trim());
  return isStatusActive && now > deadline;
}

export function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const date = parseUTCDate(isoString);
  const now = new Date();
  // Date subtraction is timezone-agnostic — no manual offset needed
  const diffMs = now - date;
  
  if (isNaN(diffMs)) return "";
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}
