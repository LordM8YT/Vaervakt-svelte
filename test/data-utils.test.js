import test from "node:test";
import assert from "node:assert/strict";
import { getHourlyForecastByDate } from "../src/utilities/DataUtils.js";

function forecastPoint(date, hour, temperature) {
  const iso = `${date}T${String(hour).padStart(2, "0")}:00:00Z`;
  return {
    dt: Math.floor(new Date(iso).getTime() / 1000),
    dt_txt: iso.replace("T", " ").replace("Z", ""),
    main: { temp: temperature },
    weather: [{ icon: "01d", description: "Klart" }],
  };
}

test("groups up to 12 MET time points for only the next three days", () => {
  const current = Math.floor(new Date("2026-07-27T08:00:00Z").getTime() / 1000);
  const list = [
    forecastPoint("2026-07-27", 9, 18),
    ...Array.from({ length: 13 }, (_, hour) =>
      forecastPoint("2026-07-28", hour, 19 + hour / 10)
    ),
    forecastPoint("2026-07-29", 12, 21),
    forecastPoint("2026-07-30", 12, 22),
    forecastPoint("2026-07-31", 12, 23),
  ];

  const result = getHourlyForecastByDate({ cod: "200", list }, current);

  assert.deepEqual(Object.keys(result), [
    "2026-07-28",
    "2026-07-29",
    "2026-07-30",
  ]);
  assert.equal(result["2026-07-28"].length, 12);
  assert.equal(result["2026-07-28"][0].description, "Klart");
  assert.equal(result["2026-07-31"], undefined);
});
