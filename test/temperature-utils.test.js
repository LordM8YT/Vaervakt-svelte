import test from "node:test";
import assert from "node:assert/strict";

import {
  formatTemperature,
  formatTemperatureWithUnit,
} from "../src/utilities/TemperatureUtils.js";

test("formats weather temperatures with one Norwegian decimal", () => {
  assert.equal(formatTemperature(14.24), "14,2");
  assert.equal(formatTemperature(-3.16), "-3,2");
  assert.equal(formatTemperature(15), "15,0");
});

test("adds the unit only to valid temperatures", () => {
  assert.equal(formatTemperatureWithUnit("13.2"), "13,2 °C");
  assert.equal(formatTemperatureWithUnit(null), "–");
  assert.equal(formatTemperatureWithUnit("ikke et tall"), "–");
});
