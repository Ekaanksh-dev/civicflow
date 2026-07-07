/**
 * Ensures an ISO timestamp string from the backend is correctly parsed as UTC.
 * Appends 'Z' to naive datetime strings that lack a timezone indicator.
 */
function parseUTCDate(isoString) {
  if (typeof isoString === "string" && !isoString.endsWith("Z") && !isoString.includes("+") && !/\d{2}:\d{2}$/.test(isoString.slice(-6).replace(/T.*/, ""))) {
    return new Date(isoString + "Z");
  }
  return new Date(isoString);
}

export function formatToIST(isoString) {
  if (!isoString) return "N/A";
  const date = parseUTCDate(isoString);
  if (isNaN(date.getTime())) return isoString;

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
