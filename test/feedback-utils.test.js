import assert from "node:assert/strict";
import test from "node:test";
import {
  FEEDBACK_EMAIL,
  buildFeedbackMailto,
} from "../src/utilities/FeedbackUtils.js";

test("buildFeedbackMailto creates a prefilled beta feedback email", () => {
  const href = buildFeedbackMailto({
    path: "/lokalt/",
    viewport: "390×844",
    userAgent: "Test Browser",
  });
  const url = new URL(href);

  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, FEEDBACK_EMAIL);
  assert.equal(url.searchParams.get("subject"), "Tilbakemelding – Værvakt beta");
  assert.match(url.searchParams.get("body"), /Side: \/lokalt\//);
  assert.match(url.searchParams.get("body"), /Skjerm: 390×844/);
  assert.match(url.searchParams.get("body"), /Nettleser: Test Browser/);
});

test("buildFeedbackMailto strips newlines from technical context", () => {
  const href = buildFeedbackMailto({
    path: "/bad/\nSkjult: verdi",
    userAgent: "Browser\r\nInjected",
  });
  const body = new URL(href).searchParams.get("body");

  assert.match(body, /Side: \/bad\/ Skjult: verdi/);
  assert.match(body, /Nettleser: Browser Injected/);
  assert.doesNotMatch(body, /Side: \/bad\/\nSkjult/);
});
