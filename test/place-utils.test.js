import assert from "node:assert/strict";
import test from "node:test";
import { createPlaceOptions } from "../src/utilities/PlaceUtils.js";

test("deduplicates indistinguishable place search results", () => {
  assert.deepEqual(
    createPlaceOptions([
      {
        latitude: "59.9133",
        longitude: "10.7389",
        name: "Oslo",
        region: "Oslo",
        countryCode: "NO",
      },
      {
        latitude: "59.9138",
        longitude: "10.7387",
        name: "Oslo",
        region: "Oslo",
        countryCode: "NO",
      },
    ]),
    [{ value: "59.9133 10.7389", label: "Oslo, NO" }]
  );
});

test("keeps same-name places when their regions differ", () => {
  assert.deepEqual(
    createPlaceOptions([
      {
        latitude: "39.8",
        longitude: "-89.6",
        name: "Springfield",
        region: "Illinois",
        countryCode: "US",
      },
      {
        latitude: "44.0",
        longitude: "-123.0",
        name: "Springfield",
        region: "Oregon",
        countryCode: "US",
      },
    ]).map((option) => option.label),
    ["Springfield, Illinois, US", "Springfield, Oregon, US"]
  );
});

test("skips invalid place search results", () => {
  assert.deepEqual(
    createPlaceOptions([
      { latitude: "", longitude: "", name: "Ugyldig" },
      { latitude: "59.9", longitude: "10.7", name: "" },
    ]),
    []
  );
});
