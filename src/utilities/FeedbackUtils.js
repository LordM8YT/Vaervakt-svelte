export const FEEDBACK_EMAIL = "kontakt@xn--vrvakt-pua.no";
export const FEEDBACK_EMAIL_LABEL = "kontakt@værvakt.no";

function cleanLine(value, maximumLength) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

export function buildFeedbackMailto({
  path = "/",
  viewport = "",
  userAgent = "",
} = {}) {
  const safePath = cleanLine(path, 120) || "/";
  const safeViewport = cleanLine(viewport, 40) || "Ukjent";
  const safeUserAgent = cleanLine(userAgent, 300) || "Ukjent";
  const subject = "Tilbakemelding – Værvakt beta";
  const body = [
    "Hei! Jeg tester Værvakt.no beta.",
    "",
    "Hva prøvde du å gjøre?",
    "",
    "Hva forventet du?",
    "",
    "Hva skjedde?",
    "",
    "Teknisk informasjon (kan slettes):",
    `Side: ${safePath}`,
    `Skjerm: ${safeViewport}`,
    `Nettleser: ${safeUserAgent}`,
  ].join("\n");

  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
