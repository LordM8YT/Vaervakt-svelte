type WeatherImageInput = {
  mode: "weather" | "bath";
  placeName: string;
  temperature?: number | null;
  condition?: string;
  icon?: string;
  bathTemperature?: number | null;
  bathPlace?: string | null;
  status?: "ok" | "loading" | "error";
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

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function makeKeyImage(input: WeatherImageInput): string {
  const place = escapeXml(truncate(input.placeName || "Værvakt", 18));
  const condition = escapeXml(truncate(input.condition || "Lokalt vær", 20));
  const icon = escapeXml(input.icon || (input.mode === "bath" ? "🌊" : "☁️"));
  const temp = escapeXml(formatTemperature(input.temperature));
  const bathTemp = escapeXml(formatTemperature(input.bathTemperature));
  const bathPlace = escapeXml(truncate(input.bathPlace || "Badetemp", 18));
  const status = input.status || "ok";
  const message = escapeXml(truncate(input.message || "Sjekker Værvakt", 22));
  const isBath = input.mode === "bath";

  const centerText = status === "error" ? "!" : isBath ? bathTemp : temp;
  const bottomPrimary = status === "error" ? "Feil" : isBath ? bathPlace : place;
  const bottomSecondary =
    status === "error"
      ? message
      : isBath
        ? "Badetemp fra Yr"
        : input.bathTemperature
          ? `Bad ${bathTemp}`
          : condition;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
  <defs>
    <linearGradient id="bg" x1="12" y1="0" x2="132" y2="144" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#12305f"/>
      <stop offset="0.52" stop-color="#061328"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(105 30) rotate(120) scale(72)">
      <stop stop-color="#38bdf8" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="144" height="144" rx="26" fill="url(#bg)"/>
  <rect width="144" height="144" rx="26" fill="url(#glow)"/>
  <rect x="8" y="8" width="128" height="128" rx="22" fill="rgba(255,255,255,0.04)" stroke="rgba(186,230,253,0.22)" stroke-width="1"/>
  <text x="18" y="27" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="10" font-weight="800" letter-spacing="1.2">VÆRVAKT</text>
  <text x="113" y="43" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" font-size="32">${icon}</text>
  <text x="18" y="79" fill="#ffffff" font-family="Arial, sans-serif" font-size="${centerText.length > 3 ? 37 : 44}" font-weight="900">${centerText}</text>
  <text x="18" y="104" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="12" font-weight="800">${bottomPrimary}</text>
  <text x="18" y="120" fill="#94a3b8" font-family="Arial, sans-serif" font-size="10" font-weight="700">${escapeXml(bottomSecondary)}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
