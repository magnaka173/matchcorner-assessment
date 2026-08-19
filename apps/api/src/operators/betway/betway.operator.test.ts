import type { EncodeSlipInput } from "@matchcorner/contracts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../../errors/app-error.js";
import { BETWAY_DECODE_PATH, BETWAY_ENCODE_PATH, type BetwayConfig } from "./betway.config.js";
import { findBookABetFixture } from "./betway.fixtures.js";
import { BetwayNigeriaOperator, type FetchLike } from "./betway.operator.js";

const BOOKING_CODE = "BW69DC9F6B";

const testConfig: BetwayConfig = {
  baseUrl: "https://betway.test",
  brandId: "test-brand-id",
  countryCode: "NG",
  cultureCode: "en-US",
  timeoutMs: 8_000
};

interface CapturedRequest {
  url: string;
  method: string | undefined;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

let lastRequest: CapturedRequest | undefined;

function recordingFetch(respond: () => Response | Promise<Response>): FetchLike {
  return async (input, init) => {
    lastRequest = {
      url: String(input),
      method: init?.method,
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>
    };
    return respond();
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function createOperator(fetchImpl: FetchLike, config: BetwayConfig = testConfig): BetwayNigeriaOperator {
  return new BetwayNigeriaOperator({ config, fetch: fetchImpl });
}

async function expectAppError(operation: Promise<unknown>): Promise<AppError> {
  try {
    await operation;
  } catch (error) {
    assert.ok(error instanceof AppError, `expected an AppError, received ${String(error)}`);
    return error;
  }
  assert.fail("expected the operation to reject");
}

test("posts the booking code to the FindBookABet endpoint", async () => {
  const operator = createOperator(recordingFetch(() => jsonResponse(findBookABetFixture())));

  await operator.decode(BOOKING_CODE);

  assert.ok(lastRequest);
  assert.equal(lastRequest.url, `https://betway.test${BETWAY_DECODE_PATH}`);
  assert.equal(lastRequest.method, "POST");
  assert.deepEqual(lastRequest.body, {
    countryCode: "NG",
    bookingCode: BOOKING_CODE,
    cultureCode: "en-US"
  });
});

test("sends the brand id and json headers, and nothing account related", async () => {
  const operator = createOperator(recordingFetch(() => jsonResponse(findBookABetFixture())));

  await operator.decode(BOOKING_CODE);

  assert.ok(lastRequest);
  assert.deepEqual(lastRequest.headers, {
    accept: "application/json",
    "content-type": "application/json",
    "x-brand-id": "test-brand-id"
  });

  const forbidden = ["cookie", "authorization", "cf-", "x-ga", "accountid"];
  for (const header of Object.keys(lastRequest.headers)) {
    const normalized = header.toLowerCase();
    assert.ok(
      !forbidden.some((prefix) => normalized.includes(prefix)),
      `header ${header} must not be sent upstream`
    );
  }
});

test("returns a canonical slip for a valid response", async () => {
  const operator = createOperator(recordingFetch(() => jsonResponse(findBookABetFixture())));

  const slip = await operator.decode(BOOKING_CODE);

  assert.equal(slip.operator, "betway-ng");
  assert.equal(slip.bookingCode, BOOKING_CODE);
  assert.equal(slip.selections.length, 2);
  assert.equal(JSON.stringify(slip).includes("accountId"), false);
});

test("maps an upstream 500 to an upstream error", async () => {
  const operator = createOperator(recordingFetch(() => new Response("<html>gateway error</html>", { status: 500 })));

  const error = await expectAppError(operator.decode(BOOKING_CODE));

  assert.equal(error.code, "UPSTREAM_UNAVAILABLE");
  assert.equal(error.status, 502);
  assert.equal(error.message.includes("html"), false);
});

test("maps an upstream 403 to an upstream error", async () => {
  const operator = createOperator(recordingFetch(() => new Response("forbidden", { status: 403 })));

  const error = await expectAppError(operator.decode(BOOKING_CODE));

  assert.equal(error.code, "UPSTREAM_UNAVAILABLE");
  assert.equal(error.status, 502);
});

test("maps an upstream 404 to a booking code not found error", async () => {
  const operator = createOperator(recordingFetch(() => new Response("", { status: 404 })));

  const error = await expectAppError(operator.decode(BOOKING_CODE));

  assert.equal(error.code, "BOOKING_CODE_NOT_FOUND");
  assert.equal(error.status, 404);
});

test("treats an empty selection list as an unknown booking code", async () => {
  const operator = createOperator(
    recordingFetch(() => jsonResponse({ selections: [], isSingleBet: false, isBuildABet: false }))
  );

  const error = await expectAppError(operator.decode(BOOKING_CODE));

  assert.equal(error.code, "BOOKING_CODE_NOT_FOUND");
});

test("maps a malformed Betway response to a contract mismatch error", async () => {
  const payload = findBookABetFixture();
  const selections = payload["selections"] as Record<string, unknown>[];
  delete selections[0]?.["price"];

  const operator = createOperator(recordingFetch(() => jsonResponse(payload)));

  const error = await expectAppError(operator.decode(BOOKING_CODE));

  assert.equal(error.code, "UPSTREAM_CONTRACT_MISMATCH");
  assert.equal(error.status, 502);
});

test("maps a non-json response body to a contract mismatch error", async () => {
  const operator = createOperator(
    recordingFetch(() => new Response("<html>Access denied</html>", { status: 200 }))
  );

  const error = await expectAppError(operator.decode(BOOKING_CODE));

  assert.equal(error.code, "UPSTREAM_CONTRACT_MISMATCH");
  assert.equal(error.message.includes("Access denied"), false);
});

test("maps a transport failure to an upstream error", async () => {
  const operator = createOperator(() => Promise.reject(new TypeError("fetch failed")));

  const error = await expectAppError(operator.decode(BOOKING_CODE));

  assert.equal(error.code, "UPSTREAM_UNAVAILABLE");
  assert.equal(error.status, 502);
});

test("aborts the request and reports a timeout once the configured budget elapses", async () => {
  // The timer behind AbortSignal.timeout() is unref'd, so a stub fetch needs a
  // ref'd timer of its own to keep the event loop alive. It doubles as a guard:
  // if the abort never arrives, the test fails instead of hanging.
  const hangingFetch: FetchLike = (_input, init) =>
    new Promise((_resolve, reject) => {
      const guard = setTimeout(() => reject(new Error("request was never aborted")), 1_000);
      init?.signal?.addEventListener("abort", () => {
        clearTimeout(guard);
        reject(init.signal?.reason);
      });
    });

  const operator = createOperator(hangingFetch, { ...testConfig, timeoutMs: 10 });

  const error = await expectAppError(operator.decode(BOOKING_CODE));

  assert.equal(error.code, "UPSTREAM_TIMEOUT");
  assert.equal(error.status, 504);
});

const singleEncodeInput: EncodeSlipInput = {
  betType: "single",
  selections: [
    {
      eventId: "68096464",
      operatorMarketId: "68096464223",
      selectionId: "68096464223hcp=1.5~1715"
    }
  ]
};

const CREATED_CODE = "BWENCODE01";

test("posts the mapped outcomes to the BookABet endpoint", async () => {
  const operator = createOperator(recordingFetch(() => jsonResponse({ bookingCode: CREATED_CODE })));

  await operator.encode(singleEncodeInput);

  assert.ok(lastRequest);
  assert.equal(lastRequest.url, `https://betway.test${BETWAY_ENCODE_PATH}`);
  assert.equal(lastRequest.method, "POST");
  assert.deepEqual(lastRequest.body, {
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

test("encode sends the brand id and json headers, and nothing account related", async () => {
  const operator = createOperator(recordingFetch(() => jsonResponse({ bookingCode: CREATED_CODE })));

  await operator.encode(singleEncodeInput);

  assert.ok(lastRequest);
  assert.deepEqual(lastRequest.headers, {
    accept: "application/json",
    "content-type": "application/json",
    "x-brand-id": "test-brand-id"
  });

  const forbidden = ["cookie", "authorization", "cf-", "x-ga", "accountid"];
  for (const header of Object.keys(lastRequest.headers)) {
    const normalized = header.toLowerCase();
    assert.ok(
      !forbidden.some((prefix) => normalized.includes(prefix)),
      `header ${header} must not be sent upstream`
    );
  }

  const serialized = JSON.stringify(lastRequest.body);
  assert.equal(serialized.includes("accountId"), false);
  assert.equal(serialized.includes("odds"), false);
  assert.equal(serialized.includes("68096464223hcp=1.5~"), true);
  assert.notEqual(
    (lastRequest.body["outcomes"] as Array<Record<string, unknown>>)[0]?.["marketId"],
    "68096464223hcp=1.5~"
  );
});

test("encode returns the created booking code", async () => {
  const operator = createOperator(recordingFetch(() => jsonResponse({ bookingCode: "  bwencode01  " })));

  assert.equal(await operator.encode(singleEncodeInput), CREATED_CODE);
});

test("encode maps an upstream 500 to an upstream error", async () => {
  const operator = createOperator(recordingFetch(() => new Response("<html>gateway error</html>", { status: 500 })));

  const error = await expectAppError(operator.encode(singleEncodeInput));

  assert.equal(error.code, "UPSTREAM_UNAVAILABLE");
  assert.equal(error.status, 502);
  assert.equal(error.message.includes("html"), false);
});

test("encode maps a malformed Betway response to a contract mismatch error", async () => {
  const operator = createOperator(recordingFetch(() => jsonResponse({ bookingCode: "" })));

  const error = await expectAppError(operator.encode(singleEncodeInput));

  assert.equal(error.code, "UPSTREAM_CONTRACT_MISMATCH");
  assert.equal(error.status, 502);
});

test("encode maps a missing bookingCode to a contract mismatch error", async () => {
  const operator = createOperator(recordingFetch(() => jsonResponse({ ok: true })));

  const error = await expectAppError(operator.encode(singleEncodeInput));

  assert.equal(error.code, "UPSTREAM_CONTRACT_MISMATCH");
});

test("encode maps a non-json response body to a contract mismatch error", async () => {
  const operator = createOperator(
    recordingFetch(() => new Response("<html>Access denied</html>", { status: 200 }))
  );

  const error = await expectAppError(operator.encode(singleEncodeInput));

  assert.equal(error.code, "UPSTREAM_CONTRACT_MISMATCH");
  assert.equal(error.message.includes("Access denied"), false);
});

test("encode aborts the request and reports a timeout once the configured budget elapses", async () => {
  const hangingFetch: FetchLike = (_input, init) =>
    new Promise((_resolve, reject) => {
      const guard = setTimeout(() => reject(new Error("request was never aborted")), 1_000);
      init?.signal?.addEventListener("abort", () => {
        clearTimeout(guard);
        reject(init.signal?.reason);
      });
    });

  const operator = createOperator(hangingFetch, { ...testConfig, timeoutMs: 10 });

  const error = await expectAppError(operator.encode(singleEncodeInput));

  assert.equal(error.code, "UPSTREAM_TIMEOUT");
  assert.equal(error.status, 504);
});