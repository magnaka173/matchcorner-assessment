import type { Betslip, EncodeSlipInput, Selection } from "@matchcorner/contracts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { findBookABetFixture } from "./betway.fixtures.js";
import { mapFindBookABetResponse, mapToBookABetRequest } from "./betway.mapper.js";
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

test("prefers sportEvent homeTeam and awayTeam over placeholder display names", () => {
  const slip = mapFixture((payload) => {
    const sportEvent = rawChild(rawSelectionAt(payload, 0), "sportEvent");
    sportEvent["displayName"] = "R16P11 vs. R16P12";
    sportEvent["name"] = "R16P11 vs. R16P12";
    sportEvent["homeTeam"] = "Cirstea, Sorana";
    sportEvent["awayTeam"] = "Pegula, Jessica";
    rawSelectionAt(payload, 0)["eventName"] = "R16P11 vs. R16P12";
  });
  const mapped = selectionAt(slip, 0);

  assert.equal(mapped.eventName, "Cirstea, Sorana vs. Pegula, Jessica");
  assert.equal(mapped.eventId, "68096464");
});

test("falls back to displayName when homeTeam or awayTeam is missing", () => {
  const slip = mapFixture((payload) => {
    const sportEvent = rawChild(rawSelectionAt(payload, 0), "sportEvent");
    sportEvent["homeTeam"] = "Cirstea, Sorana";
    delete sportEvent["awayTeam"];
  });

  assert.equal(selectionAt(slip, 0).eventName, "Connecticut Sun vs. Los Angeles Sparks");
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

const verifiedEncodeSelection = {
  eventId: "68096464",
  operatorMarketId: "68096464223",
  selectionId: "68096464223hcp=1.5~1715"
};

const locale = { countryCode: "NG", cultureCode: "en-US" };

test("maps a single bet onto BookABet with isSingleBet true", () => {
  const input: EncodeSlipInput = {
    betType: "single",
    selections: [verifiedEncodeSelection]
  };

  const request = mapToBookABetRequest(input, locale);

  assert.deepEqual(request, {
    cultureCode: "en-US",
    countryCode: "NG",
    isSingleBet: true,
    outcomes: [
      {
        outcomeId: "68096464223hcp=1.5~1715",
        eventId: 68096464,
        marketId: "68096464223",
        payment: 1,
        value: 0,
        selected: true
      }
    ]
  });
});

test("maps a multi bet onto BookABet with isSingleBet false", () => {
  const input: EncodeSlipInput = {
    betType: "multi",
    selections: [
      verifiedEncodeSelection,
      {
        eventId: "68096586",
        operatorMarketId: "68096586223",
        selectionId: "68096586223hcp=10.5~1715"
      }
    ]
  };

  const request = mapToBookABetRequest(input, locale);

  assert.equal(request.isSingleBet, false);
  assert.equal(request.outcomes.length, 2);
});

test("BookABet sends operatorMarketId as marketId even when the canonical line differs", () => {
  const input: EncodeSlipInput = {
    betType: "single",
    selections: [
      {
        eventId: "73466978",
        operatorMarketId: "73466978223",
        selectionId: "73466978223hcp=1.5~1715"
      }
    ]
  };

  const request = mapToBookABetRequest(input, locale);
  const outcome = request.outcomes[0];
  assert.ok(outcome);

  assert.deepEqual(outcome, {
    outcomeId: "73466978223hcp=1.5~1715",
    eventId: 73466978,
    marketId: "73466978223",
    payment: 1,
    value: 0,
    selected: true
  });
  assert.notEqual(outcome.marketId, "73466978223hcp=1.5~");
});

test("sends operatorMarketId as BookABet marketId, never the exact canonical line", () => {
  const request = mapToBookABetRequest(
    { betType: "single", selections: [verifiedEncodeSelection] },
    locale
  );
  const outcome = request.outcomes[0];
  assert.ok(outcome);

  assert.equal(outcome.marketId, "68096464223");
  assert.equal(outcome.outcomeId, "68096464223hcp=1.5~1715");
  assert.equal(typeof outcome.eventId, "number");
  assert.equal(outcome.eventId, 68096464);
  assert.notEqual(outcome.marketId, "68096464223hcp=1.5~");
});

test("BookABet payload contains only the verified write fields", () => {
  const request = mapToBookABetRequest(
    { betType: "single", selections: [verifiedEncodeSelection] },
    locale
  );
  const serialized = JSON.stringify(request);

  assert.equal(serialized.includes("accountId"), false);
  assert.equal(serialized.includes("odds"), false);
  assert.equal(serialized.includes("cookie"), false);
  assert.equal(serialized.includes("authorization"), false);
  assert.equal(serialized.includes("68096464223hcp=1.5~1715"), true);
  assert.equal(serialized.includes("\"marketId\":\"68096464223hcp=1.5~\""), false);

  const outcome = request.outcomes[0];
  assert.ok(outcome);
  assert.deepEqual(Object.keys(outcome).sort(), [
    "eventId",
    "marketId",
    "outcomeId",
    "payment",
    "selected",
    "value"
  ]);
});
