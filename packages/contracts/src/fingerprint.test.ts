import assert from "node:assert/strict";
import { test } from "node:test";
import type { Betslip, Selection } from "./betslip.js";
import { computeSlipFingerprint, selectionIdentity, toDecodedSlip } from "./fingerprint.js";

function selection(overrides: Partial<Selection> = {}): Selection {
  return {
    eventId: "68096464",
    eventName: "Connecticut Sun vs. Los Angeles Sparks",
    sport: "Basketball",
    region: "USA",
    league: "WNBA",
    startTime: "2026-08-18T23:00:00.000Z",
    marketId: "68096464223hcp=1.5~",
    marketName: "Handicap",
    operatorMarketId: "223",
    selectionId: "68096464223hcp=1.5~1715",
    selectionName: "Los Angeles Sparks (-1.5)",
    handicap: -1.5,
    odds: 1.87,
    active: true,
    ...overrides
  };
}

const firstSelection = selection();

const secondSelection = selection({
  eventId: "68096586",
  eventName: "Toronto Tempo vs. Indiana Fever",
  marketId: "68096586223hcp=10.5~",
  selectionId: "68096586223hcp=10.5~1715",
  selectionName: "Indiana Fever (-10.5)",
  handicap: -10.5,
  odds: 2.05
});

function slip(selections: Selection[]): Betslip {
  return {
    operator: "betway-ng",
    bookingCode: "BW69DC9F6B",
    betType: "multi",
    isBuildABet: false,
    selections
  };
}

test("selection identity is eventId, marketId and selectionId joined by colons", () => {
  assert.equal(
    selectionIdentity(firstSelection),
    "68096464:68096464223hcp=1.5~:68096464223hcp=1.5~1715"
  );
});

test("selection order does not change the fingerprint", () => {
  assert.equal(
    computeSlipFingerprint([firstSelection, secondSelection]),
    computeSlipFingerprint([secondSelection, firstSelection])
  );
});

test("changed odds do not change the fingerprint", () => {
  assert.equal(
    computeSlipFingerprint([firstSelection, secondSelection]),
    computeSlipFingerprint([selection({ odds: 3.4 }), secondSelection])
  );
});

test("volatile presentation and availability fields do not change the fingerprint", () => {
  const drifted = selection({
    eventName: "CON vs. LAS",
    marketName: "Point Handicap",
    selectionName: "Sparks -1.5",
    startTime: "2026-08-19T01:30:00.000Z",
    odds: 1.62,
    active: false,
    operatorMarketId: "999"
  });

  assert.equal(computeSlipFingerprint([firstSelection]), computeSlipFingerprint([drifted]));
});

test("changed eventId changes the fingerprint", () => {
  assert.notEqual(
    computeSlipFingerprint([firstSelection]),
    computeSlipFingerprint([selection({ eventId: "68096465" })])
  );
});

test("changed marketId changes the fingerprint", () => {
  assert.notEqual(
    computeSlipFingerprint([firstSelection]),
    computeSlipFingerprint([selection({ marketId: "68096464223hcp=2.5~" })])
  );
});

test("changed selectionId changes the fingerprint", () => {
  assert.notEqual(
    computeSlipFingerprint([firstSelection]),
    computeSlipFingerprint([selection({ selectionId: "68096464223hcp=1.5~1714" })])
  );
});

test("a dropped selection changes the fingerprint", () => {
  assert.notEqual(
    computeSlipFingerprint([firstSelection, secondSelection]),
    computeSlipFingerprint([firstSelection])
  );
});

test("fingerprint is a lowercase 64-character SHA-256 digest", () => {
  assert.match(computeSlipFingerprint([firstSelection]), /^[0-9a-f]{64}$/);
});

test("toDecodedSlip pairs the slip with its fingerprint", () => {
  const betslip = slip([firstSelection, secondSelection]);
  const decoded = toDecodedSlip(betslip);

  assert.equal(decoded.slip, betslip);
  assert.equal(decoded.fingerprint, computeSlipFingerprint(betslip.selections));
});

test("matches the fingerprint recorded for verified booking code BW69DC9F6B", () => {
  const verifiedSlip = slip([
    firstSelection,
    secondSelection,
    selection({
      eventId: "68096120",
      marketId: "68096120223hcp=4.5~",
      selectionId: "68096120223hcp=4.5~1715"
    }),
    selection({
      eventId: "68096232",
      marketId: "68096232223hcp=-3.5~",
      selectionId: "68096232223hcp=-3.5~1714"
    })
  ]);

  assert.equal(
    toDecodedSlip(verifiedSlip).fingerprint,
    "94c3c1d45329763971d28d59ca4dc2e3194c132ada692a639fb907fad395b56c"
  );
});
