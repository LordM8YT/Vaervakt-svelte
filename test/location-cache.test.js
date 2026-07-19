import test from "node:test";
import assert from "node:assert/strict";

import { createCachedLocation } from "../src/utilities/LocationCache.js";

test("preserves an existing location timestamp during weather refreshes", () => {
  const cachedAt = 1_700_000_000_000;
  const location = createCachedLocation(
    {
      name: "Lund, Kristiansand",
      lat: 58.157123,
      lon: 8.018456,
      source: "gps",
      accuracy: 8.2,
      cachedAt,
    },
    true
  );

  assert.equal(location.cachedAt, cachedAt);
  assert.equal(location.lat, 58.157123);
  assert.equal(location.lon, 8.018456);
  assert.equal(location.accuracy, 8);
});

test("rejects invalid cached coordinates", () => {
  assert.equal(
    createCachedLocation({
      name: "Ugyldig",
      lat: 91,
      lon: 8,
      source: "search",
    }),
    null
  );
});

test("keeps Stream Deck as the source of a shared location", () => {
  const location = createCachedLocation({
    name: "Kristiansand",
    lat: 58.1467,
    lon: 7.9956,
    source: "streamdeck",
  });

  assert.equal(location.source, "streamdeck");
  assert.equal(location.lat, 58.1467);
  assert.equal(location.lon, 7.9956);
});
