import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiClientError, asParityErrorDetails, decodeSlip, isApiClientError } from "./api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("maps a structured MatchCorner error onto ApiClientError", async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        error: {
          code: "BOOKING_CODE_NOT_FOUND",
          message: "Booking code was not found or is no longer valid."
        }
      }),
      { status: 404, headers: { "content-type": "application/json" } }
    )) as typeof fetch;

  await assert.rejects(
    () => decodeSlip("BWDEADCODE"),
    (error: unknown) => {
      assert.equal(isApiClientError(error), true);
      assert.ok(error instanceof ApiClientError);
      assert.equal(error.code, "BOOKING_CODE_NOT_FOUND");
      assert.equal(error.status, 404);
      assert.equal(JSON.stringify(error).includes("accountId"), false);
      return true;
    }
  );
});

test("maps a transport failure onto NETWORK_ERROR", async () => {
  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;

  await assert.rejects(
    () => decodeSlip("BW69DC9F6B"),
    (error: unknown) => {
      assert.ok(error instanceof ApiClientError);
      assert.equal(error.code, "NETWORK_ERROR");
      assert.equal(error.status, 0);
      return true;
    }
  );
});

test("normalizes parity details and ignores extra upstream-shaped fields", () => {
  const details = asParityErrorDetails({
    targetCode: "BWTARGET01",
    expectedSelectionCount: 4,
    actualSelectionCount: 3,
    missingIdentities: ["event-4:market-4-exact:selection-4"],
    extraIdentities: [],
    rawResponse: { html: "<upstream>" },
    accountId: "sanitized-placeholder-account-id",
    cookies: "must-not-surface"
  });

  assert.deepEqual(details, {
    targetCode: "BWTARGET01",
    expectedSelectionCount: 4,
    actualSelectionCount: 3,
    missingIdentities: ["event-4:market-4-exact:selection-4"],
    extraIdentities: []
  });
  assert.equal(JSON.stringify(details).includes("rawResponse"), false);
  assert.equal(JSON.stringify(details).includes("accountId"), false);
  assert.equal(JSON.stringify(details).includes("cookies"), false);
});

test("returns undefined when parity details are not an object", () => {
  assert.equal(asParityErrorDetails(undefined), undefined);
  assert.equal(asParityErrorDetails("nope"), undefined);
});
