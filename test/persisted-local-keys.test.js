import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("keeps saved locations during legacy client-data cleanup", async () => {
  const mainSource = await readFile(new URL("../src/main.js", import.meta.url), "utf8");

  assert.match(mainSource, /["']vaervakt_saved_locations_v1["']/);
});
