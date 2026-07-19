import test from "node:test";
import assert from "node:assert/strict";

import {
  formatStationAge,
  latestStationUpdatedAt,
  parseStationTimestamp,
  stationUpdatedAt,
} from "../src/utilities/StationUtils.js";

test("formats recent station updates as relative Norwegian time", () => {
  const now = Date.parse("2026-07-19T12:30:00+02:00");

  assert.equal(
    formatStationAge("2026-07-19T12:26:00+02:00", now),
    "4 min siden"
  );
  assert.equal(
    formatStationAge("2026-07-19T10:15:00+02:00", now),
    "2 t siden"
  );
});

test("accepts database timestamps and rejects invalid values", () => {
  assert.ok(parseStationTimestamp("2026-07-19 12:26:00") instanceof Date);
  assert.equal(parseStationTimestamp("ukjent"), null);
  assert.equal(formatStationAge(null), "ukjent tidspunkt");
});

test("prefers the observation time for station cards", () => {
  assert.equal(
    stationUpdatedAt({
      lastSeenAt: "2026-07-19 12:29:00",
      reading: {
        observedAt: "2026-07-19 12:27:00",
        receivedAt: "2026-07-19 12:29:00",
      },
    }),
    "2026-07-19 12:27:00"
  );
});

test("finds the newest measurement across nearby stations", () => {
  assert.equal(
    latestStationUpdatedAt([
      { lastSeenAt: "2026-07-19T10:00:00+02:00" },
      { reading: { observedAt: "2026-07-19T10:08:00+02:00" } },
      { reading: { receivedAt: "2026-07-19T10:04:00+02:00" } },
    ]),
    "2026-07-19T10:08:00+02:00"
  );
  assert.equal(latestStationUpdatedAt(null), null);
});
