import type { VaervaktReport } from "./vaervakt-api";

export type KeyImageInput = {
  mode: "weather" | "bath" | "bathInfo" | "latest" | "report" | "open";
  placeName: string;
  temperature?: number | null;
  condition?: string;
  icon?: string;
  bathTemperature?: number | null;
  bathPlace?: string | null;
  bathDistanceKm?: number | null;
  bathTime?: string | null;
  reportCondition?: string | null;
  latestReport?: VaervaktReport | null;
  status?: "ok" | "loading" | "success" | "error";
  message?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTemperature(value?: number | null): string {
  if (!Number.isFinite(Number(value))) {
    return "--";
  }

  return `${Math.round(Number(value))}°`;
}

function formatDistance(value?: number | null): string {
  const distance = Number(value);
  if (!Number.isFinite(distance)) {
    return "";
  }

  if (distance < 1) {
    return `${Math.max(1, Math.round(distance * 1000))} M`;
  }

  return `${distance.toFixed(1).replace(".", ",")} KM`;
}

function formatShortTime(value?: string | null): string {
  if (!value) {
    return "NÅ";
  }

  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return "NÅ";
  }

  return new Intl.DateTimeFormat("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function upper(value: string, maxLength: number): string {
  return truncate(value, maxLength).toUpperCase();
}

function conditionIcon(condition = ""): string {
  const lower = condition.toLowerCase();
  if (lower.includes("snø") || lower.includes("sludd")) return "❄️";
  if (lower.includes("regn") || lower.includes("byge")) return "🌧️";
  if (lower.includes("torden") || lower.includes("storm") || lower.includes("vind")) return "⛈️";
  if (lower.includes("tåke")) return "🌫️";
  if (lower.includes("sky")) return "☁️";
  return "☀️";
}

function shell(content: string, accent = "#38bdf8", glowX = 106, glowY = 106): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
  <defs>
    <linearGradient id="bg" x1="10" y1="0" x2="134" y2="144" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#16386e"/>
      <stop offset="0.45" stop-color="#07162d"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${glowX} ${glowY}) rotate(120) scale(76)">
      <stop stop-color="${accent}" stop-opacity="0.66"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity="0.34"/>
    </filter>
  </defs>
  <rect width="144" height="144" rx="26" fill="url(#bg)"/>
  <rect width="144" height="144" rx="26" fill="url(#glow)"/>
  <path d="M0 0h25L0 25Z" fill="${accent}" opacity=".78"/>
  <path d="M144 144h-25l25-25Z" fill="#2563eb" opacity=".78"/>
  <rect x="7" y="7" width="130" height="130" rx="22" fill="rgba(255,255,255,.035)" stroke="rgba(186,230,253,.18)" stroke-width="1"/>
  ${content}
</svg>`;
}

function dataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function text(value: string, maxLength: number): string {
  return escapeXml(upper(value, maxLength));
}

export function makeKeyImage(input: KeyImageInput): string {
  const status = input.status || "ok";
  const place = text(input.placeName || "Værvakt", 10);
  const condition = text(input.condition || "Lokalt vær", 11);
  const icon = escapeXml(input.icon || conditionIcon(input.condition));
  const temp = escapeXml(formatTemperature(input.temperature));
  const bathTemp = escapeXml(formatTemperature(input.bathTemperature));
  const bathPlace = text(input.bathPlace || "Badeplass", 10);
  const bathDistance = escapeXml(formatDistance(input.bathDistanceKm) || "NÆR DEG");
  const bathTime = escapeXml(formatShortTime(input.bathTime));
  const message = text(input.message || "Oppdaterer", 11);
  const reportCondition = input.reportCondition || "Sol / Klart";
  const reportIcon = conditionIcon(reportCondition);
  const reportLabel = text(reportCondition, 11);

  if (status === "error") {
    return dataUri(shell(`
  <text x="13" y="34" fill="#fecdd3" font-family="Arial, sans-serif" font-size="12" font-weight="900">VÆRVAKT</text>
  <text x="13" y="78" fill="#ffffff" font-family="Arial, sans-serif" font-size="50" font-weight="900">!</text>
  <text x="13" y="105" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="14" font-weight="900">FEIL</text>
  <text x="13" y="123" fill="#fecdd3" font-family="Arial, sans-serif" font-size="10.5" font-weight="800">${message}</text>
`, "#fb7185", 104, 38));
  }

  if (input.mode === "bathInfo") {
    return dataUri(shell(`
  <text x="16" y="31" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="10.5" font-weight="900">BADESTED</text>
  <text x="16" y="61" fill="#ffffff" font-family="Arial, sans-serif" font-size="17.5" font-weight="900">${status === "loading" ? "LASTER" : bathPlace}</text>
  <text x="16" y="84" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="15" font-weight="900">${status === "loading" ? "BADETEMP" : bathDistance}</text>
  <text x="16" y="105" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="10" font-weight="800">${status === "loading" ? "YR" : `YR · ${bathTime}`}</text>
  <text x="113" y="120" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" font-size="32">🌊</text>
`, "#38bdf8"));
  }

  if (input.mode === "latest") {
    const report = input.latestReport;
    const latestIcon = escapeXml(report?.icon || "📍");
    const latestTemp = escapeXml(formatTemperature(report?.temp));
    const latestLocation = text(report?.location || input.placeName || "Lokalt", 10);
    const latestMeta = text(report ? `${report.condition} · ${report.time}` : "Ingen rapport", 13);

    return dataUri(shell(`
  <text x="16" y="31" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="10.5" font-weight="900">SISTE</text>
  <text x="15" y="72" fill="#ffffff" font-family="Arial, sans-serif" font-size="${latestTemp.length > 3 ? 42 : 53}" font-weight="900">${status === "loading" ? "--" : latestTemp}</text>
  <text x="16" y="97" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="12.5" font-weight="900">${latestLocation}</text>
  <text x="16" y="117" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="9.5" font-weight="800">${latestMeta}</text>
  <text x="113" y="116" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" font-size="32">${latestIcon}</text>
`, "#38bdf8", 108, 42));
  }

  if (input.mode === "report") {
    const label = status === "success" ? "SENDT" : status === "loading" ? "SENDER" : "RAPPORT";
    const sub = status === "success" ? "TAKK" : reportLabel;
    const mainIcon = status === "success" ? "✅" : reportIcon;

    return dataUri(shell(`
  <text x="16" y="31" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="10.5" font-weight="900">VÆRVAKT</text>
  <text x="72" y="74" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" font-size="42" filter="url(#softShadow)">${mainIcon}</text>
  <text x="16" y="101" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="900">${label}</text>
  <text x="16" y="119" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="10" font-weight="800">${sub}</text>
`, status === "success" ? "#22c55e" : "#38bdf8", 100, 42));
  }

  if (input.mode === "open") {
    return dataUri(shell(`
  <text x="16" y="31" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="10.5" font-weight="900">ÅPNE</text>
  <text x="72" y="75" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" font-size="44" filter="url(#softShadow)">🌤️</text>
  <text x="16" y="104" fill="#ffffff" font-family="Arial, sans-serif" font-size="17" font-weight="900">VÆRVAKT</text>
  <text x="16" y="121" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="10" font-weight="800">${place}</text>
`, "#38bdf8", 100, 40));
  }

  if (input.mode === "bath") {
    const mainTemp = status === "loading" ? "--" : bathTemp;

    return dataUri(shell(`
  <text x="16" y="31" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="10.5" font-weight="900">BADETEMP</text>
  <text x="15" y="72" fill="#ffffff" font-family="Arial, sans-serif" font-size="${mainTemp.length > 3 ? 44 : 56}" font-weight="900">${mainTemp}</text>
  <text x="16" y="97" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="12.5" font-weight="900">${bathPlace}</text>
  <text x="16" y="117" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="9.5" font-weight="800">YR · ${bathDistance}</text>
  <text x="113" y="116" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" font-size="32">🌊</text>
`, "#38bdf8", 108, 42));
  }

  const mainTemp = status === "loading" ? "--" : temp;

  return dataUri(shell(`
  <text x="16" y="31" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="10.5" font-weight="900">NÅ</text>
  <text x="15" y="72" fill="#ffffff" font-family="Arial, sans-serif" font-size="${mainTemp.length > 3 ? 44 : 56}" font-weight="900">${mainTemp}</text>
  <text x="16" y="97" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="12.5" font-weight="900">${place}</text>
  <text x="16" y="117" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="9.5" font-weight="800">${condition}</text>
  <text x="113" y="116" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" font-size="32">${icon}</text>
`, "#38bdf8", 108, 42));
}
