import assert from "node:assert/strict";
import { test } from "node:test";
import { toCanonicalJson } from "./canonical-json.js";

test("round-trips a canonical slip and drops undefined keys", () => {
  const json = toCanonicalJson({
    operator: "betway-ng",
    bookingCode: "BWSOURCE01",
    region: undefined,
    handicap: null,
    selections: [{ eventId: "1", active: true }]
  });

  assert.deepEqual(json, {
    operator: "betway-ng",
    bookingCode: "BWSOURCE01",
    handicap: null,
    selections: [{ eventId: "1", active: true }]
  });
});

test("refuses to persist accountId, cookies, authorization or rawResponse", () => {
  for (const payload of [
    { accountId: "sanitized-placeholder-account-id" },
    { cookie: "session=1" },
    { Authorization: "Bearer abc" },
    { rawResponse: { foo: 1 } }
  ]) {
    assert.throws(() => toCanonicalJson(payload), /sensitive field/i);
  }
});
