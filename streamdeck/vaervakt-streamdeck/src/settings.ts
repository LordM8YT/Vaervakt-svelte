export type VaervaktSettings = {
  apiBase?: string;
  placeName?: string;
  lat?: string | number;
  lon?: string | number;
  refreshMinutes?: string | number;
  openOnPress?: boolean;
  reporterName?: string;
  reportCondition?: string;
};

export const DEFAULT_SETTINGS: Required<VaervaktSettings> = {
  apiBase: "https://www.xn--vrvakt-pua.no",
  placeName: "Kristiansand",
  lat: 58.1467,
  lon: 7.9956,
  refreshMinutes: 10,
  openOnPress: true,
  reporterName: "Stream Deck",
  reportCondition: "Sol / Klart",
};

export function normalizeSettings(settings: VaervaktSettings = {}): Required<VaervaktSettings> {
  const lat = Number(settings.lat ?? DEFAULT_SETTINGS.lat);
  const lon = Number(settings.lon ?? DEFAULT_SETTINGS.lon);
  const refreshMinutes = Number(settings.refreshMinutes ?? DEFAULT_SETTINGS.refreshMinutes);

  return {
    apiBase: String(settings.apiBase || DEFAULT_SETTINGS.apiBase).replace(/\/+$/, ""),
    placeName: String(settings.placeName || DEFAULT_SETTINGS.placeName),
    lat: Number.isFinite(lat) ? lat : DEFAULT_SETTINGS.lat,
    lon: Number.isFinite(lon) ? lon : DEFAULT_SETTINGS.lon,
    refreshMinutes: Number.isFinite(refreshMinutes)
      ? Math.max(2, Math.min(60, refreshMinutes))
      : DEFAULT_SETTINGS.refreshMinutes,
    openOnPress: settings.openOnPress !== false,
    reporterName: String(settings.reporterName || DEFAULT_SETTINGS.reporterName).trim(),
    reportCondition: String(settings.reportCondition || DEFAULT_SETTINGS.reportCondition).trim(),
  };
}
