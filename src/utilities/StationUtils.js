export function parseStationTimestamp(value) {
  if (!value) return null;
  const normalized = String(value).includes("T")
    ? String(value)
    : String(value).replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatStationAge(value, now = Date.now()) {
  const date = parseStationTimestamp(value);
  if (!date) return "ukjent tidspunkt";

  const ageMinutes = Math.max(0, Math.floor((Number(now) - date.getTime()) / 60000));
  if (ageMinutes < 1) return "nå nettopp";
  if (ageMinutes < 60) return `${ageMinutes} min siden`;

  const ageHours = Math.floor(ageMinutes / 60);
  if (ageHours < 24) return `${ageHours} t siden`;

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function stationUpdatedAt(station) {
  return (
    station?.reading?.observedAt ||
    station?.reading?.receivedAt ||
    station?.lastSeenAt ||
    null
  );
}

export function latestStationUpdatedAt(stations = []) {
  let latestValue = null;
  let latestTime = -Infinity;

  for (const station of Array.isArray(stations) ? stations : []) {
    const value = stationUpdatedAt(station);
    const date = parseStationTimestamp(value);
    if (date && date.getTime() > latestTime) {
      latestValue = value;
      latestTime = date.getTime();
    }
  }

  return latestValue;
}
