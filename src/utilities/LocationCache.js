const SEARCH_CACHE_COORDINATE_DECIMALS = 5;
export const MAX_SAVED_LOCATIONS = 3;

export function createCachedLocation(location, preserveTimestamp = false) {
  const name = String(location?.name || "").trim().slice(0, 160);
  const lat = Number(location?.lat);
  const lon = Number(location?.lon);
  if (
    !name ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  const isGps = location.source === "gps";
  const source = isGps
    ? "gps"
    : location.source === "streamdeck"
      ? "streamdeck"
      : "search";
  const accuracy =
    location.accuracy === null || location.accuracy === ""
      ? Number.NaN
      : Number(location.accuracy);
  const cachedAt = Number(location.cachedAt);
  return {
    name,
    // GPS beholdes urørt. Bare søketreff normaliseres for en stabil cacheverdi.
    lat: isGps ? lat : Number(lat.toFixed(SEARCH_CACHE_COORDINATE_DECIMALS)),
    lon: isGps ? lon : Number(lon.toFixed(SEARCH_CACHE_COORDINATE_DECIMALS)),
    accuracy: Number.isFinite(accuracy)
      ? Math.max(0, Math.round(accuracy))
      : null,
    source,
    cachedAt:
      preserveTimestamp && Number.isFinite(cachedAt) && cachedAt > 0
        ? cachedAt
        : Date.now(),
  };
}

export function normalizeSavedLocations(locations) {
  if (!Array.isArray(locations)) return [];

  return locations.reduce((saved, location) => {
    const normalized = createCachedLocation(location, true);
    if (!normalized || saved.length >= MAX_SAVED_LOCATIONS) return saved;
    const duplicate = saved.some(
      (item) =>
        item.name.localeCompare(normalized.name, "nb", { sensitivity: "base" }) === 0 ||
        (item.lat === normalized.lat && item.lon === normalized.lon)
    );
    if (!duplicate) saved.push(normalized);
    return saved;
  }, []);
}

export function addSavedLocation(locations, location) {
  const saved = normalizeSavedLocations(locations);
  const normalized = createCachedLocation(location, true);
  if (!normalized) return saved;

  const existingIndex = saved.findIndex(
    (item) =>
      item.name.localeCompare(normalized.name, "nb", { sensitivity: "base" }) === 0 ||
      (item.lat === normalized.lat && item.lon === normalized.lon)
  );
  if (existingIndex >= 0) {
    saved[existingIndex] = normalized;
    return saved;
  }
  return saved.length < MAX_SAVED_LOCATIONS ? [...saved, normalized] : saved;
}

export function removeSavedLocation(locations, location) {
  const normalized = createCachedLocation(location, true);
  if (!normalized) return normalizeSavedLocations(locations);
  return normalizeSavedLocations(locations).filter(
    (item) => !(item.lat === normalized.lat && item.lon === normalized.lon)
  );
}
