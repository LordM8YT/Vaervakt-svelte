function normalizedPart(value) {
  return String(value || "").trim();
}

export function createPlaceOptions(cities = []) {
  const seenLabels = new Set();
  const options = [];

  for (const city of Array.isArray(cities) ? cities : []) {
    const latitudeText = normalizedPart(city?.latitude);
    const longitudeText = normalizedPart(city?.longitude);
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    const name = normalizedPart(city?.name);
    if (
      !name ||
      !latitudeText ||
      !longitudeText ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      continue;
    }

    const parts = [name];
    for (const value of [city?.region, city?.countryCode]) {
      const part = normalizedPart(value);
      if (
        part &&
        !parts.some(
          (existing) =>
            existing.localeCompare(part, "nb", { sensitivity: "base" }) === 0
        )
      ) {
        parts.push(part);
      }
    }

    const label = parts.join(", ");
    const labelKey = label.toLocaleLowerCase("nb");
    if (seenLabels.has(labelKey)) continue;
    seenLabels.add(labelKey);
    options.push({
      value: `${city.latitude} ${city.longitude}`,
      label,
    });
  }

  return options;
}
