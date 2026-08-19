import type { Betslip, EncodeSlipInput } from "@matchcorner/contracts";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { createApp } from "../app.js";
import { AppError } from "../errors/app-error.js";
import type { BookingOperator } from "../operators/booking-operator.js";
import { InMemoryAuditRepository } from "../repositories/memory-audit.repository.js";
import { BookingService } from "../services/booking.service.js";

function slipFor(bookingCode: string): Betslip {
  return {
    operator: "betway-ng",
    bookingCode,
    betType: "single",
    isBuildABet: false,
    selections: [
      {
        eventId: "68096464",
        eventName: "Connecticut Sun vs. Los Angeles Sparks",
        sport: "Basketball",
        marketId: "68096464223hcp=1.5~",
        marketName: "Handicap (-1.5)",
        operatorMarketId: "68096464223",
        selectionId: "68096464223hcp=1.5~1715",
        selectionName: "Los Angeles Sparks (-1.5)",
        handicap: -1.5,
        odds: 1.74,
        active: true
      }
    ]
  };
}

let decode: (bookingCode: string) => Promise<Betslip> = async (bookingCode) => slipFor(bookingCode);
let encode: (input: EncodeSlipInput) => Promise<string> = async () => "BWENCODE01";

const stubOperator: BookingOperator = {
  operator: "betway-ng",
  decode: (bookingCode) => decode(bookingCode),
  encode: (input) => encode(input)
};

let server: Server;
let baseUrl: string;

// The error handler logs every failure; these tests deliberately trigger them.
const consoleError = console.error;

before(async () => {
  console.error = () => {};

  const app = createApp({ bookingService: new BookingService(stubOperator, new InMemoryAuditRepository()) });

  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });

  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  console.error = consoleError;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function postDecode(body: unknown, raw?: string) {
  const response = await fetch(`${baseUrl}/api/v1/slips/decode`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ?? JSON.stringify(body)
  });

  return { status: response.status, body: (await response.json()) as Record<string, any> };
}

async function postEncode(body: unknown) {
  const response = await fetch(`${baseUrl}/api/v1/slips/encode`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { status: response.status, body: (await response.json()) as Record<string, any> };
}

async function postConvert(body: unknown) {
  const response = await fetch(`${baseUrl}/api/v1/slips/convert`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { status: response.status, body: (await response.json()) as Record<string, any> };
}

test("decodes a booking code into a slip and fingerprint", async () => {
  decode = async (bookingCode) => slipFor(bookingCode);

  const response = await postDecode({ bookingCode: "BW69DC9F6B" });

  assert.equal(response.status, 200);
  assert.equal(response.body["slip"].bookingCode, "BW69DC9F6B");
  assert.equal(response.body["slip"].operator, "betway-ng");
  assert.match(response.body["fingerprint"], /^[0-9a-f]{64}$/);
  assert.deepEqual(Object.keys(response.body).sort(), ["fingerprint", "slip"]);
});

test("normalizes the booking code before reaching the operator", async () => {
  const seen: string[] = [];
  decode = async (bookingCode) => {
    seen.push(bookingCode);
    return slipFor(bookingCode);
  };

  const response = await postDecode({ bookingCode: "  bw69dc9f6b  " });

  assert.equal(response.status, 200);
  assert.deepEqual(seen, ["BW69DC9F6B"]);
});

test("rejects a missing, empty or non-Betway booking code", async () => {
  for (const bookingCode of [undefined, "", "   ", "ABC123", "BW", 12345]) {
    const response = await postDecode({ bookingCode });

    assert.equal(response.status, 400, `expected 400 for ${JSON.stringify(bookingCode)}`);
    assert.equal(response.body["error"].code, "INVALID_REQUEST");
    assert.ok(Array.isArray(response.body["error"].details));
  }
});

test("rejects an over-long booking code", async () => {
  const response = await postDecode({ bookingCode: `BW${"A".repeat(64)}` });

  assert.equal(response.status, 400);
  assert.equal(response.body["error"].code, "INVALID_REQUEST");
});

test("rejects a malformed json body", async () => {
  const response = await postDecode(undefined, "{ not json");

  assert.equal(response.status, 400);
  assert.equal(response.body["error"].code, "INVALID_REQUEST");
});

test("returns 404 when the operator reports an unknown booking code", async () => {
  decode = async () => {
    throw AppError.bookingCodeNotFound("BW69DC9F6B");
  };

  const response = await postDecode({ bookingCode: "BW69DC9F6B" });

  assert.equal(response.status, 404);
  assert.equal(response.body["error"].code, "BOOKING_CODE_NOT_FOUND");
});

test("returns 502 for an upstream failure without leaking upstream detail", async () => {
  decode = async () => {
    throw AppError.upstreamUnavailable("betway-ng", {
      status: 500,
      cause: new Error("<html>betway gateway error</html>")
    });
  };

  const response = await postDecode({ bookingCode: "BW69DC9F6B" });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.status, 502);
  assert.equal(response.body["error"].code, "UPSTREAM_UNAVAILABLE");
  assert.equal(serialized.includes("html"), false);
  assert.equal(serialized.includes("stack"), false);
  assert.equal(response.body["error"].details, undefined);
});

test("returns 504 when the operator times out", async () => {
  decode = async () => {
    throw AppError.upstreamTimeout("betway-ng");
  };

  const response = await postDecode({ bookingCode: "BW69DC9F6B" });

  assert.equal(response.status, 504);
  assert.equal(response.body["error"].code, "UPSTREAM_TIMEOUT");
});

test("returns 500 for an unexpected internal failure", async () => {
  decode = async () => {
    throw new Error("boom: postgres connection string leaked");
  };

  const response = await postDecode({ bookingCode: "BW69DC9F6B" });

  assert.equal(response.status, 500);
  assert.equal(response.body["error"].code, "INTERNAL_ERROR");
  assert.equal(JSON.stringify(response.body).includes("postgres"), false);
});

const verifiedSelection = {
  eventId: "68096464",
  eventName: "Connecticut Sun vs. Los Angeles Sparks",
  sport: "basketball",
  marketId: "68096464223hcp=1.5~",
  operatorMarketId: "68096464223",
  marketName: "Handicap (Incl. Overtime)",
  selectionId: "68096464223hcp=1.5~1715",
  selectionName: "Los Angeles Sparks (-1.5)",
  handicap: 1.5,
  odds: 1.74,
  active: true
};

test("encodes selections into a booking code", async () => {
  encode = async () => "BWENCODE01";

  const response = await postEncode({
    betType: "single",
    selections: [verifiedSelection]
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { bookingCode: "BWENCODE01" });
});

test("strips display and canonical market fields before reaching the operator", async () => {
  const seen: EncodeSlipInput[] = [];
  encode = async (input) => {
    seen.push(input);
    return "BWENCODE01";
  };

  const response = await postEncode({
    betType: "single",
    selections: [verifiedSelection]
  });

  assert.equal(response.status, 200);
  assert.deepEqual(seen, [
    {
      betType: "single",
      selections: [
        {
          eventId: "68096464",
          operatorMarketId: "68096464223",
          selectionId: "68096464223hcp=1.5~1715"
        }
      ]
    }
  ]);
});

test("rejects encode requests with no selections", async () => {
  const response = await postEncode({ betType: "multi", selections: [] });

  assert.equal(response.status, 400);
  assert.equal(response.body["error"].code, "INVALID_REQUEST");
});

test("rejects encode requests with an invalid eventId", async () => {
  const response = await postEncode({
    betType: "single",
    selections: [{ ...verifiedSelection, eventId: "not-a-number" }]
  });

  assert.equal(response.status, 400);
  assert.equal(response.body["error"].code, "INVALID_REQUEST");
});

test("rejects encode requests missing operatorMarketId", async () => {
  const { operatorMarketId: _omitted, ...withoutOperatorMarket } = verifiedSelection;
  const response = await postEncode({
    betType: "single",
    selections: [withoutOperatorMarket]
  });

  assert.equal(response.status, 400);
  assert.equal(response.body["error"].code, "INVALID_REQUEST");
});

test("rejects encode requests with a blank operatorMarketId", async () => {
  const response = await postEncode({
    betType: "single",
    selections: [{ ...verifiedSelection, operatorMarketId: "   " }]
  });

  assert.equal(response.status, 400);
  assert.equal(response.body["error"].code, "INVALID_REQUEST");
});

test("rejects a single bet with more than one selection", async () => {
  const response = await postEncode({
    betType: "single",
    selections: [verifiedSelection, { ...verifiedSelection, eventId: "68096586" }]
  });

  assert.equal(response.status, 400);
  assert.equal(response.body["error"].code, "INVALID_REQUEST");
});

test("rejects a multi bet with fewer than two selections", async () => {
  const response = await postEncode({
    betType: "multi",
    selections: [verifiedSelection]
  });

  assert.equal(response.status, 400);
  assert.equal(response.body["error"].code, "INVALID_REQUEST");
});

test("returns 502 for an encode upstream failure without leaking upstream detail", async () => {
  encode = async () => {
    throw AppError.upstreamUnavailable("betway-ng", {
      status: 500,
      cause: new Error("<html>betway gateway error</html>")
    });
  };

  const response = await postEncode({
    betType: "single",
    selections: [verifiedSelection]
  });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.status, 502);
  assert.equal(response.body["error"].code, "UPSTREAM_UNAVAILABLE");
  assert.equal(serialized.includes("html"), false);
  assert.equal(response.body["error"].details, undefined);
});

test("rejects a convert request with a missing bookingCode", async () => {
  const response = await postConvert({});

  assert.equal(response.status, 400);
  assert.equal(response.body["error"].code, "INVALID_REQUEST");
});

test("converts a booking code and returns the verified target slip", async () => {
  decode = async (bookingCode) => slipFor(bookingCode);
  encode = async () => "BWTARGET01";

  const response = await postConvert({ bookingCode: "BWSOURCE01" });

  assert.equal(response.status, 200);
  assert.equal(response.body["sourceCode"], "BWSOURCE01");
  assert.equal(response.body["targetCode"], "BWTARGET01");
  assert.equal(response.body["verified"], true);
  assert.equal(response.body["sourceFingerprint"], response.body["targetFingerprint"]);
  assert.equal(response.body["sourceSelectionCount"], 1);
  assert.equal(response.body["targetSelectionCount"], 1);
  assert.equal(response.body["slip"].bookingCode, "BWTARGET01");
  assert.match(response.body["sourceFingerprint"], /^[0-9a-f]{64}$/);
});

test("returns 422 when conversion parity fails", async () => {
  decode = async (bookingCode) => {
    const decoded = slipFor(bookingCode);
    if (bookingCode === "BWTARGET01") {
      const [only] = decoded.selections;
      assert.ok(only);
      return { ...decoded, selections: [{ ...only, selectionId: "changed-outcome" }] };
    }
    return decoded;
  };
  encode = async () => "BWTARGET01";

  const response = await postConvert({ bookingCode: "BWSOURCE01" });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.status, 422);
  assert.equal(response.body["error"].code, "CONVERSION_PARITY_FAILED");
  assert.equal(response.body["error"].details.targetCode, "BWTARGET01");
  assert.equal(response.body["error"].details.expectedSelectionCount, 1);
  assert.equal(response.body["error"].details.actualSelectionCount, 1);
  assert.ok(Array.isArray(response.body["error"].details.missingIdentities));
  assert.equal(serialized.includes("accountId"), false);
  assert.equal(serialized.includes("html"), false);
});
