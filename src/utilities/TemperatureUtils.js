export function formatTemperature(value) {
  if (value === null || value === undefined || value === "") return "–";
  const temperature = Number(value);
  return Number.isFinite(temperature)
    ? temperature.toFixed(1).replace(".", ",")
    : "–";
}

export function formatTemperatureWithUnit(value) {
  const formatted = formatTemperature(value);
  return formatted === "–" ? formatted : `${formatted} °C`;
}
