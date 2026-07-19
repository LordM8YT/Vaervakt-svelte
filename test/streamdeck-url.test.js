import test from "node:test";
import assert from "node:assert/strict";

import { buildAppUrl } from "../streamdeck/vaervakt-streamdeck/shared.js";

test("opens the app route with the Stream Deck location in the fragment", () => {
  const target = new URL(
    buildAppUrl(
      {
        apiBase: "https://www.værvakt.no/",
        placeName: "Lund, Kristiansand",
        lat: 58.157123,
        lon: 8.018456,
      },
      "/bad/"
    )
  );
  const location = new URLSearchParams(target.hash.slice(1));

  assert.equal(target.pathname, "/bad/");
  assert.equal(location.get("source"), "streamdeck");
  assert.equal(location.get("name"), "Lund, Kristiansand");
  assert.equal(location.get("lat"), "58.157123");
  assert.equal(location.get("lon"), "8.018456");
});
