import { normalizeSettings, type VaervaktSettings } from "../settings";

export type VaervaktWeather = {
  current: {
    temperature: number;
    condition: string;
    icon: string;
    windSpeed: number;
  };
  bathing?: {
    waterTemperature?: number | null;
    waterTemperatureLocation?: string | null;
    waterTemperatureDistanceKm?: number | null;
    waterTemperatureTime?: string | null;
    nearby?: Array<{
      name: string;
      municipality?: string;
      temperature: number;
      distanceKm?: number;
      time?: string;
    }>;
  };
};

export type VaervaktReport = {
  id: number;
  icon: string;
  time: string;
  reporter: string;
  condition: string;
  location: string;
  temp: number;
  createdAt: string;
};

export async function fetchVaervaktWeather(settings: VaervaktSettings): Promise<VaervaktWeather> {
  const normalized = normalizeSettings(settings);
  const params = new URLSearchParams({
    lat: String(normalized.lat),
    lon: String(normalized.lon),
  });
  const response = await fetch(`${normalized.apiBase}/api/weather.php?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Vaervakt-StreamDeck/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`Værvakt svarte med HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as VaervaktWeather & {
    success?: boolean;
    message?: string;
  };

  if (payload.success === false) {
    throw new Error(payload.message || "Værvakt kunne ikke hente data.");
  }

  if (!payload.current) {
    throw new Error("Værvakt-data mangler current-felt.");
  }

  return payload;
}

export async function fetchLatestReport(settings: VaervaktSettings): Promise<VaervaktReport | null> {
  const normalized = normalizeSettings(settings);
  const params = new URLSearchParams({
    limit: "1",
    lat: String(normalized.lat),
    lon: String(normalized.lon),
    radiusKm: "35",
    location: normalized.placeName,
  });
  const response = await fetch(`${normalized.apiBase}/api/reports.php?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Vaervakt-StreamDeck/0.2",
    },
  });

  if (!response.ok) {
    throw new Error(`Værvakt svarte med HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as {
    success?: boolean;
    message?: string;
    reports?: VaervaktReport[];
  };

  if (payload.success === false) {
    throw new Error(payload.message || "Kunne ikke hente siste rapport.");
  }

  return payload.reports?.[0] ?? null;
}

export async function submitQuickReport(settings: VaervaktSettings, weather: VaervaktWeather): Promise<string> {
  const normalized = normalizeSettings(settings);
  const response = await fetch(`${normalized.apiBase}/api/reports.php`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Vaervakt-StreamDeck/0.2",
    },
    body: JSON.stringify({
      username: normalized.reporterName,
      condition: normalized.reportCondition,
      location: normalized.placeName,
      temperature: weather.current.temperature,
      lat: normalized.lat,
      lon: normalized.lon,
    }),
  });

  if (!response.ok) {
    throw new Error(`Værvakt svarte med HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as {
    success?: boolean;
    message?: string;
  };

  if (payload.success === false) {
    throw new Error(payload.message || "Rapporten kunne ikke sendes.");
  }

  return payload.message || "Rapporten er sendt.";
}
