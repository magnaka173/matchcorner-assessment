import { computeSlipFingerprint, type Betslip, type EncodeSlipInput } from "@matchcorner/contracts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../errors/app-error.js";
import type { BookingOperator } from "../operators/booking-operator.js";
import { BookingService } from "./booking.service.js";

function slipFor(bookingCode: string, odds = 1.74): Betslip {
  return {
    operator: "betway-ng",
    bookingCode,
    betType: "multi",
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
        odds,
        active: true
      }
    ]
  };
}

const encodeInput: EncodeSlipInput = {
  betType: "single",
  selections: [
    {
      eventId: "68096464",
      operatorMarketId: "68096464223",
      selectionId: "68096464223hcp=1.5~1715"
    }
  ]
};

function operatorReturning(slip: Betslip): BookingOperator {
  return {
    operator: "betway-ng",
    decode: async () => slip,
    encode: async () => {
      throw new Error("encode should not be called during decode");
    }
  };
}

test("returns the canonical slip together with its fingerprint", async () => {
  const slip = slipFor("BW69DC9F6B");
  const service = new BookingService(operatorReturning(slip));

  const decoded = await service.decodeBookingCode("BW69DC9F6B");

  assert.equal(decoded.slip, slip);
  assert.match(decoded.fingerprint, /^[0-9a-f]{64}$/);
});

test("derives the fingerprint from canonical selection identity", async () => {
  const slip = slipFor("BW69DC9F6B");
  const service = new BookingService(operatorReturning(slip));

  const decoded = await service.decodeBookingCode("BW69DC9F6B");

  assert.equal(decoded.fingerprint, computeSlipFingerprint(slip.selections));
});

test("keeps the fingerprint stable when only the odds move", async () => {
  const first = await new BookingService(operatorReturning(slipFor("BW69DC9F6B", 1.74))).decodeBookingCode(
    "BW69DC9F6B"
  );
  const second = await new BookingService(operatorReturning(slipFor("BW69DC9F6B", 2.31))).decodeBookingCode(
    "BW69DC9F6B"
  );

  assert.equal(first.fingerprint, second.fingerprint);
});

test("passes the booking code through to the operator", async () => {
  const seen: string[] = [];
  const service = new BookingService({
    operator: "betway-ng",
    decode: async (bookingCode) => {
      seen.push(bookingCode);
      return slipFor(bookingCode);
    },
    encode: async () => {
      throw new Error("encode should not be called during decode");
    }
  });

  await service.decodeBookingCode("BW1234ABCD");

  assert.deepEqual(seen, ["BW1234ABCD"]);
});

test("propagates operator errors unchanged", async () => {
  const service = new BookingService({
    operator: "betway-ng",
    decode: async () => {
      throw AppError.bookingCodeNotFound("BWMISSING");
    },
    encode: async () => {
      throw new Error("encode should not be called during decode");
    }
  });

  await assert.rejects(service.decodeBookingCode("BWMISSING"), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, "BOOKING_CODE_NOT_FOUND");
    return true;
  });
});

test("returns the created booking code without decoding it", async () => {
  let decodeCalls = 0;
  const seen: EncodeSlipInput[] = [];
  const service = new BookingService({
    operator: "betway-ng",
    decode: async () => {
      decodeCalls += 1;
      throw new Error("decode should not be called during encode");
    },
    encode: async (input) => {
      seen.push(input);
      return "BWENCODE01";
    }
  });

  const encoded = await service.encodeSelections(encodeInput);

  assert.deepEqual(encoded, { bookingCode: "BWENCODE01" });
  assert.deepEqual(seen, [encodeInput]);
  assert.equal(decodeCalls, 0);
});

test("propagates encode operator errors unchanged", async () => {
  const service = new BookingService({
    operator: "betway-ng",
    decode: async () => {
      throw new Error("decode should not be called during encode");
    },
    encode: async () => {
      throw AppError.upstreamUnavailable("betway-ng", { status: 500 });
    }
  });

  await assert.rejects(service.encodeSelections(encodeInput), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, "UPSTREAM_UNAVAILABLE");
    return true;
  });
});
