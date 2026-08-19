import type { Betslip, Selection } from "@matchcorner/contracts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { findBookABetFixture } from "./betway.fixtures.js";
import { mapFindBookABetResponse } from "./betway.mapper.js";
import { findBookABetResponseSchema } from "./betway.schemas.js";

const BOOKING_CODE = "BW69DC9F6B";

/** The fixture is deliberately untyped: it stands in for unvalidated upstream JSON. */
type RawObject = Record<string, unknown>;

function mapFixture(mutate: (payload: RawObject) => void = () => {}): Betslip {
  const payload = findBookABetFixture();
  mutate(payload);
  return mapFindBookABetResponse(BOOKING_CODE, findBookABetResponseSchema.parse(payload));
}

function selectionAt(slip: Betslip, index: number): Selection {
  const selection = slip.selections[index];
  assert.ok(selection, `expected a selection at index ${index}`);
  return selection;
}

function rawSelectionAt(payload: RawObject, index: number): RawObject {
  const selections = payload["selections"] as RawObject[];
  const selection = selections[index];
  assert.ok(selection, `expected a raw selection at index ${index}`);
  return selection;
}

function rawChild(parent: RawObject, key: string): RawObject {
  return parent[key] as RawObject;
}

test("maps slip level fields from the response and the caller's booking code", () => {
  const slip = mapFixture();

  assert.equal(slip.operator, "betway-ng");
  assert.equal(slip.bookingCode, BOOKING_CODE);
  assert.equal(slip.betType, "multi");
  assert.equal(slip.isBuildABet, false);
  assert.equal(slip.selections.length, 2);
});

test("maps betType to single when Betway reports a single bet", () => {
  const slip = mapFixture((payload) => {
    payload["isSingleBet"] = true;
  });

  assert.equal(slip.betType, "single");
});

test("maps eventId from sportEvent as a string", () => {
  const selection = selectionAt(mapFixture(), 0);

  assert.equal(selection.eventId, "68096464");
  assert.equal(selection.eventName, "Connecticut Sun vs. Los Angeles Sparks");
  assert.equal(selection.sport, "Basketball");
  assert.equal(selection.region, "USA");
  assert.equal(selection.league, "WNBA");
});

test("prefers originalMarket.marketId as the canonical exact market", () => {
  const selection = selectionAt(mapFixture(), 0);

  assert.equal(selection.marketId, "68096464223hcp=1.5~");
  assert.equal(selection.marketName, "Handicap (-1.5)");
});

test("keeps the parent market.marketId as operatorMarketId for later encoding", () => {
  const selection = selectionAt(mapFixture(), 0);

  assert.equal(selection.operatorMarketId, "68096464223");
  assert.notEqual(selection.operatorMarketId, selection.marketId);
});

test("falls back to the selection marketId when originalMarket is absent", () => {
  const selection = selectionAt(mapFixture(), 1);

  assert.equal(selection.marketId, "68096586222");
  assert.equal(selection.operatorMarketId, "68096586222");
  assert.equal(selection.marketName, "Money Line");
});

test("maps outcomeId to selectionId", () => {
  assert.equal(selectionAt(mapFixture(), 0).selectionId, "68096464223hcp=1.5~1715");
  assert.equal(selectionAt(mapFixture(), 1).selectionId, "68096586222~1714");
});

test("combines the outcome display name with its special bet value", () => {
  assert.equal(selectionAt(mapFixture(), 0).selectionName, "Los Angeles Sparks (-1.5)");
});

test("uses the outcome name alone when no special bet value is present", () => {
  assert.equal(selectionAt(mapFixture(), 1).selectionName, "Indiana Fever");
});

test("spaces the special bet value even when Betway omits the leading space", () => {
  const slip = mapFixture((payload) => {
    rawChild(rawSelectionAt(payload, 0), "outcome")["sbv"] = "(-2.5)";
  });

  assert.equal(selectionAt(slip, 0).selectionName, "Los Angeles Sparks (-2.5)");
});

test("maps priceDecimal to odds", () => {
  assert.equal(selectionAt(mapFixture(), 0).odds, 1.74);
  assert.equal(selectionAt(mapFixture(), 1).odds, 2.05);
});

test("maps handicap from the outcome, falling back to the selection", () => {
  assert.equal(selectionAt(mapFixture(), 0).handicap, -1.5);
  assert.equal(selectionAt(mapFixture(), 1).handicap, null);

  const slip = mapFixture((payload) => {
    rawChild(rawSelectionAt(payload, 0), "outcome")["handicap"] = null;
    rawSelectionAt(payload, 0)["handicap"] = 2.5;
  });
  assert.equal(selectionAt(slip, 0).handicap, 2.5);
});

test("maps expectedStartEpoch seconds to an ISO timestamp", () => {
  assert.equal(selectionAt(mapFixture(), 0).startTime, "2026-08-18T23:00:00.000Z");
});

test("leaves startTime undefined when Betway omits expectedStartEpoch", () => {
  const slip = mapFixture((payload) => {
    delete rawChild(rawSelectionAt(payload, 0), "sportEvent")["expectedStartEpoch"];
  });

  assert.equal(selectionAt(slip, 0).startTime, undefined);
});

test("marks a selection active only when every availability flag is true", () => {
  assert.equal(selectionAt(mapFixture(), 0).active, true);
  // The fixture's second selection has isOutcomeActive: false.
  assert.equal(selectionAt(mapFixture(), 1).active, false);

  for (const flag of ["isEventActive", "isMarketActive", "isOutcomeActive"]) {
    const slip = mapFixture((payload) => {
      rawSelectionAt(payload, 0)[flag] = false;
    });
    assert.equal(selectionAt(slip, 0).active, false, `${flag} should force active to false`);
  }

  const tradingSuspended = mapFixture((payload) => {
    rawChild(rawSelectionAt(payload, 0), "outcome")["isTradingActive"] = false;
  });
  assert.equal(selectionAt(tradingSuspended, 0).active, false);
});

test("treats a missing availability flag as inactive", () => {
  const slip = mapFixture((payload) => {
    delete rawChild(rawSelectionAt(payload, 0), "outcome")["isTradingActive"];
  });

  assert.equal(selectionAt(slip, 0).active, false);
});

test("does not expose accountId or any other unmodelled upstream field", () => {
  const slip = mapFixture();
  const serialized = JSON.stringify(slip);

  assert.equal(serialized.includes("accountId"), false);
  assert.equal(serialized.includes("sanitized-placeholder-account-id"), false);
  assert.equal(serialized.includes("unmodelledFutureField"), false);
  assert.equal(serialized.includes("priceFractional"), false);

  const expectedKeys = [
    "eventId",
    "eventName",
    "sport",
    "region",
    "league",
    "startTime",
    "marketId",
    "marketName",
    "operatorMarketId",
    "selectionId",
    "selectionName",
    "handicap",
    "odds",
    "active"
  ].sort();

  for (const selection of slip.selections) {
    assert.deepEqual(Object.keys(selection).sort(), expectedKeys);
  }
});
