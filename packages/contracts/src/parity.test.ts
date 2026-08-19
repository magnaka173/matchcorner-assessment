import assert from "node:assert/strict";
import { test } from "node:test";
import type { Selection } from "./betslip.js";
import { compareSlipParity } from "./parity.js";

function parts(eventId: string, marketId: string, selectionId: string): Selection {
  return {
    eventId,
    eventName: "ignored",
    sport: "ignored",
    marketId,
    marketName: "ignored",
    operatorMarketId: "ignored",
    selectionId,
    selectionName: "ignored",
    odds: 1.5,
    active: true
  };
}

const a = parts("e1", "m1", "s1");
const b = parts("e2", "m2", "s2");
const c = parts("e3", "m3", "s3");

test("matching identities verify regardless of order", () => {
  const parity = compareSlipParity([a, b, c], [c, a, b]);

  assert.equal(parity.verified, true);
  assert.equal(parity.expectedSelectionCount, 3);
  assert.equal(parity.actualSelectionCount, 3);
  assert.deepEqual(parity.missingIdentities, []);
  assert.deepEqual(parity.extraIdentities, []);
});

test("odds, names, timestamps and operatorMarketId do not affect parity", () => {
  const drifted = {
    ...a,
    eventName: "other name",
    odds: 9.99,
    active: false,
    operatorMarketId: "different-parent",
    startTime: "2099-01-01T00:00:00.000Z"
  };

  assert.equal(compareSlipParity([a, b], [drifted, b]).verified, true);
});

test("a missing target selection is reported and not verified", () => {
  const parity = compareSlipParity([a, b, c], [a, b]);

  assert.equal(parity.verified, false);
  assert.equal(parity.expectedSelectionCount, 3);
  assert.equal(parity.actualSelectionCount, 2);
  assert.deepEqual(parity.missingIdentities, ["e3:m3:s3"]);
  assert.deepEqual(parity.extraIdentities, []);
});

test("an extra target selection is reported and not verified", () => {
  const parity = compareSlipParity([a, b], [a, b, c]);

  assert.equal(parity.verified, false);
  assert.deepEqual(parity.missingIdentities, []);
  assert.deepEqual(parity.extraIdentities, ["e3:m3:s3"]);
});

test("a changed selectionId fails parity", () => {
  const parity = compareSlipParity([a], [{ ...a, selectionId: "other" }]);

  assert.equal(parity.verified, false);
  assert.deepEqual(parity.missingIdentities, ["e1:m1:s1"]);
  assert.deepEqual(parity.extraIdentities, ["e1:m1:other"]);
});

test("a changed canonical marketId fails parity", () => {
  const parity = compareSlipParity([a], [{ ...a, marketId: "m1-other" }]);

  assert.equal(parity.verified, false);
  assert.deepEqual(parity.missingIdentities, ["e1:m1:s1"]);
  assert.deepEqual(parity.extraIdentities, ["e1:m1-other:s1"]);
});

test("a changed eventId fails parity", () => {
  const parity = compareSlipParity([a], [{ ...a, eventId: "e9" }]);

  assert.equal(parity.verified, false);
  assert.deepEqual(parity.missingIdentities, ["e1:m1:s1"]);
  assert.deepEqual(parity.extraIdentities, ["e9:m1:s1"]);
});
