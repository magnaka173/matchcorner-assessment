import {
  computeSlipFingerprint,
  selectionIdentity,
  type Betslip,
  type EncodeSlipInput,
  type Selection
} from "@matchcorner/contracts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../errors/app-error.js";
import type { BookingOperator } from "../operators/booking-operator.js";
import { InMemoryAuditRepository } from "../repositories/memory-audit.repository.js";
import { BookingService } from "./booking.service.js";

const SOURCE_CODE = "BWSOURCE01";
const TARGET_CODE = "BWTARGET01";

function selection(index: 1 | 2 | 3 | 4, overrides: Partial<Selection> = {}): Selection {
  return {
    eventId: `event-${index}`,
    eventName: `Event ${index}`,
    sport: "soccer",
    marketId: `market-${index}-exact`,
    marketName: `Market ${index}`,
    operatorMarketId: `market-${index}`,
    selectionId: `selection-${index}`,
    selectionName: `Pick ${index}`,
    handicap: null,
    odds: 1.5 + index * 0.1,
    active: true,
    ...overrides
  };
}

function slip(bookingCode: string, selections: Selection[]): Betslip {
  return {
    operator: "betway-ng",
    bookingCode,
    betType: selections.length === 1 ? "single" : "multi",
    isBuildABet: false,
    selections
  };
}

interface RecordingOperator extends BookingOperator {
  readonly calls: string[];
  readonly encodeInputs: EncodeSlipInput[];
}

function recordingOperator(options: {
  source: Betslip;
  target: Betslip;
  targetCode?: string;
  encode?: BookingOperator["encode"];
  decodeTarget?: BookingOperator["decode"];
}): RecordingOperator {
  const targetCode = options.targetCode ?? TARGET_CODE;
  const calls: string[] = [];
  const encodeInputs: EncodeSlipInput[] = [];

  return {
    operator: "betway-ng",
    calls,
    encodeInputs,
    decode: async (bookingCode) => {
      calls.push(`decode:${bookingCode}`);
      if (bookingCode === SOURCE_CODE) {
        return options.source;
      }
      if (bookingCode === targetCode) {
        return options.decodeTarget ? options.decodeTarget(bookingCode) : options.target;
      }
      throw new Error(`unexpected decode of ${bookingCode}`);
    },
    encode: async (input) => {
      calls.push("encode");
      encodeInputs.push(input);
      if (options.encode) {
        return options.encode(input);
      }
      return targetCode;
    }
  };
}

function bookingService(operator: BookingOperator, audits = new InMemoryAuditRepository()): BookingService {
  return new BookingService(operator, audits);
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

test("converts a source code through encode and verified re-decode", async () => {
  const sourceSelections = [selection(1), selection(2), selection(3)];
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, sourceSelections),
    target: slip(TARGET_CODE, sourceSelections)
  });
  const service = new BookingService(operator, new InMemoryAuditRepository());

  const result = await service.convertBookingCode(SOURCE_CODE);

  assert.deepEqual(operator.calls, [`decode:${SOURCE_CODE}`, "encode", `decode:${TARGET_CODE}`]);
  assert.deepEqual(operator.encodeInputs, [
    {
      betType: "multi",
      selections: [
        { eventId: "event-1", operatorMarketId: "market-1", selectionId: "selection-1" },
        { eventId: "event-2", operatorMarketId: "market-2", selectionId: "selection-2" },
        { eventId: "event-3", operatorMarketId: "market-3", selectionId: "selection-3" }
      ]
    }
  ]);
  assert.equal(result.verified, true);
  assert.equal(result.sourceCode, SOURCE_CODE);
  assert.equal(result.targetCode, TARGET_CODE);
  assert.equal(result.sourceFingerprint, computeSlipFingerprint(sourceSelections));
  assert.equal(result.targetFingerprint, result.sourceFingerprint);
  assert.equal(result.sourceSelectionCount, 3);
  assert.equal(result.targetSelectionCount, 3);
  assert.equal(result.slip.bookingCode, TARGET_CODE);
  assert.equal(JSON.stringify(result).includes("accountId"), false);
});

test("treats a reordered target slip as verified", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1), selection(2), selection(3)]),
    target: slip(TARGET_CODE, [selection(3), selection(1), selection(2)])
  });

  const result = await new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE);

  assert.equal(result.verified, true);
  assert.equal(result.sourceFingerprint, result.targetFingerprint);
  assert.equal(result.sourceSelectionCount, result.targetSelectionCount);
});

test("treats changed odds as verified", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1, { odds: 1.74 }), selection(2, { odds: 1.91 })]),
    target: slip(TARGET_CODE, [selection(1, { odds: 1.8 }), selection(2, { odds: 1.85 })])
  });

  const result = await new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE);

  assert.equal(result.verified, true);
  assert.equal(result.sourceFingerprint, result.targetFingerprint);
  assert.equal(result.sourceSelectionCount, result.targetSelectionCount);
});

test("treats changed display names as verified", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [
      selection(1, { eventName: "Home vs Away", selectionName: "Home", marketName: "1X2" })
    ]),
    target: slip(TARGET_CODE, [
      selection(1, { eventName: "HOME v AWAY", selectionName: "1", marketName: "Full Time Result" })
    ])
  });

  const result = await new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE);

  assert.equal(result.verified, true);
  assert.equal(result.sourceFingerprint, result.targetFingerprint);
  assert.equal(result.sourceSelectionCount, result.targetSelectionCount);
});

test("treats changed startTime as verified", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1, { startTime: "2026-08-18T23:00:00.000Z" })]),
    target: slip(TARGET_CODE, [selection(1, { startTime: "2026-08-19T01:30:00.000Z" })])
  });

  const result = await new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE);

  assert.equal(result.verified, true);
  assert.equal(result.sourceFingerprint, result.targetFingerprint);
  assert.equal(result.sourceSelectionCount, result.targetSelectionCount);
});

test("fails conversion when re-decode returns fewer selections than BookABet accepted", async () => {
  // Observed during reconnaissance: a 4-selection source was accepted by BookABet,
  // but re-decoding the generated code returned only 3 selections — an upstream
  // availability race. Round-trip parity exists so that case cannot be reported
  // as a successful conversion.
  const dropped = selection(4);
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1), selection(2), selection(3), dropped]),
    target: slip(TARGET_CODE, [selection(1), selection(2), selection(3)])
  });

  const error = await expectAppError(new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "CONVERSION_PARITY_FAILED");
  assert.equal(error.status, 422);
  assert.equal(error.details && typeof error.details === "object" && "rawResponse" in error.details, false);
  assert.deepEqual(error.details, {
    targetCode: TARGET_CODE,
    expectedSelectionCount: 4,
    actualSelectionCount: 3,
    missingIdentities: [selectionIdentity(dropped)],
    extraIdentities: []
  });
});

test("fails parity when the target has an extra selection", async () => {
  const extra = selection(4);
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1), selection(2), selection(3)]),
    target: slip(TARGET_CODE, [selection(1), selection(2), selection(3), extra])
  });

  const error = await expectAppError(new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "CONVERSION_PARITY_FAILED");
  assert.deepEqual((error.details as { extraIdentities: string[] }).extraIdentities, [
    selectionIdentity(extra)
  ]);
});

test("fails parity when a selectionId changes", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1)]),
    target: slip(TARGET_CODE, [selection(1, { selectionId: "selection-1-other" })])
  });

  const error = await expectAppError(new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "CONVERSION_PARITY_FAILED");
});

test("fails parity when the exact canonical marketId changes", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1)]),
    target: slip(TARGET_CODE, [selection(1, { marketId: "market-1-other-exact" })])
  });

  const error = await expectAppError(new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "CONVERSION_PARITY_FAILED");
  assert.deepEqual((error.details as { missingIdentities: string[] }).missingIdentities, [
    "event-1:market-1-exact:selection-1"
  ]);
});

test("fails parity when an eventId changes", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1)]),
    target: slip(TARGET_CODE, [selection(1, { eventId: "event-9" })])
  });

  const error = await expectAppError(new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "CONVERSION_PARITY_FAILED");
});

test("does not encode when a source selection is inactive", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1), selection(2, { active: false })]),
    target: slip(TARGET_CODE, [selection(1), selection(2)])
  });

  const error = await expectAppError(new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "SOURCE_SELECTION_UNAVAILABLE");
  assert.equal(error.status, 422);
  assert.deepEqual(error.details, {
    unavailableIdentities: ["event-2:market-2-exact:selection-2"]
  });
  assert.deepEqual(operator.calls, [`decode:${SOURCE_CODE}`]);
});

test("does not encode when operatorMarketId is missing", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1, { operatorMarketId: undefined })]),
    target: slip(TARGET_CODE, [selection(1)])
  });

  const error = await expectAppError(new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "CONVERSION_INPUT_INVALID");
  assert.equal(error.status, 422);
  assert.deepEqual(error.details, {
    invalidIdentities: ["event-1:market-1-exact:selection-1"]
  });
  assert.deepEqual(operator.calls, [`decode:${SOURCE_CODE}`]);
});

test("does not encode when operatorMarketId is blank", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1, { operatorMarketId: "   " })]),
    target: slip(TARGET_CODE, [selection(1)])
  });

  const error = await expectAppError(new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "CONVERSION_INPUT_INVALID");
  assert.deepEqual(operator.calls, [`decode:${SOURCE_CODE}`]);
});

test("propagates encode failures without decoding the target", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1), selection(2)]),
    target: slip(TARGET_CODE, [selection(1), selection(2)]),
    encode: async () => {
      throw AppError.upstreamUnavailable("betway-ng", { status: 500 });
    }
  });

  const error = await expectAppError(new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "UPSTREAM_UNAVAILABLE");
  assert.deepEqual(operator.calls, [`decode:${SOURCE_CODE}`, "encode"]);
});

test("fails conversion when target decode throws", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1)]),
    target: slip(TARGET_CODE, [selection(1)]),
    decodeTarget: async () => {
      throw AppError.bookingCodeNotFound(TARGET_CODE);
    }
  });

  const error = await expectAppError(new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "BOOKING_CODE_NOT_FOUND");
  assert.deepEqual(operator.calls, [`decode:${SOURCE_CODE}`, "encode", `decode:${TARGET_CODE}`]);
});

test("sends operatorMarketId to encode, never the canonical exact marketId", async () => {
  const sourceSelection = selection(1, {
    marketId: "68096464223hcp=1.5~",
    operatorMarketId: "68096464223"
  });
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [sourceSelection]),
    target: slip(TARGET_CODE, [sourceSelection])
  });

  await new BookingService(operator, new InMemoryAuditRepository()).convertBookingCode(SOURCE_CODE);

  assert.equal(operator.encodeInputs[0]?.selections[0]?.operatorMarketId, "68096464223");
  assert.equal(JSON.stringify(operator.encodeInputs).includes("68096464223hcp=1.5~"), false);
});

test("persists source and target snapshots and a verified conversion run", async () => {
  const sourceSelections = [selection(1), selection(2)];
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, sourceSelections),
    target: slip(TARGET_CODE, sourceSelections)
  });
  const audits = new InMemoryAuditRepository();

  const result = await bookingService(operator, audits).convertBookingCode(SOURCE_CODE);

  assert.deepEqual(
    audits.snapshots.map((snapshot) => snapshot.captureType),
    ["convert-source", "convert-target"]
  );
  assert.equal(audits.snapshots[0]?.bookingCode, SOURCE_CODE);
  assert.equal(audits.snapshots[1]?.bookingCode, TARGET_CODE);
  assert.equal(audits.snapshots[0]?.fingerprint, result.sourceFingerprint);
  assert.equal(audits.snapshots[1]?.fingerprint, result.targetFingerprint);
  assert.equal(audits.conversionRuns.length, 1);

  const run = audits.conversionRuns[0];
  assert.ok(run);
  assert.equal(run.verified, true);
  assert.equal(run.sourceCode, SOURCE_CODE);
  assert.equal(run.targetCode, TARGET_CODE);
  assert.equal(run.sourceFingerprint, result.sourceFingerprint);
  assert.equal(run.targetFingerprint, result.targetFingerprint);
  assert.equal(run.sourceSelectionCount, 2);
  assert.equal(run.targetSelectionCount, 2);
  assert.deepEqual(run.missingIdentities, []);
  assert.deepEqual(run.extraIdentities, []);

  const persisted = JSON.stringify(audits);
  assert.equal(persisted.includes("accountId"), false);
  assert.equal(persisted.includes("rawResponse"), false);
  assert.equal(persisted.includes("headers"), false);
});

test("persists an unverified conversion run then still throws parity failure", async () => {
  const missing = selection(4);
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1), selection(2), selection(3), missing]),
    target: slip(TARGET_CODE, [selection(1), selection(2), selection(3)])
  });
  const audits = new InMemoryAuditRepository();

  const error = await expectAppError(bookingService(operator, audits).convertBookingCode(SOURCE_CODE));

  assert.equal(error.code, "CONVERSION_PARITY_FAILED");
  assert.equal(audits.snapshots.length, 2);
  assert.equal(audits.conversionRuns.length, 1);

  const run = audits.conversionRuns[0];
  assert.ok(run);
  assert.equal(run.verified, false);
  assert.equal(run.targetCode, TARGET_CODE);
  assert.deepEqual(run.missingIdentities, [selectionIdentity(missing)]);
  assert.deepEqual(run.extraIdentities, []);
});

test("persists extra identities when the target slip has an additional selection", async () => {
  const extra = selection(4);
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1), selection(2), selection(3)]),
    target: slip(TARGET_CODE, [selection(1), selection(2), selection(3), extra])
  });
  const audits = new InMemoryAuditRepository();

  await expectAppError(bookingService(operator, audits).convertBookingCode(SOURCE_CODE));

  const run = audits.conversionRuns[0];
  assert.ok(run);
  assert.equal(run.verified, false);
  assert.deepEqual(run.missingIdentities, []);
  assert.deepEqual(run.extraIdentities, [selectionIdentity(extra)]);
});

test("does not persist conversion audits when the source is inactive", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1, { active: false })]),
    target: slip(TARGET_CODE, [selection(1)])
  });
  const audits = new InMemoryAuditRepository();

  await expectAppError(bookingService(operator, audits).convertBookingCode(SOURCE_CODE));
  assert.equal(audits.snapshots.length, 0);
  assert.equal(audits.conversionRuns.length, 0);
});

test("does not persist conversion audits when encode fails", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1), selection(2)]),
    target: slip(TARGET_CODE, [selection(1), selection(2)]),
    encode: async () => {
      throw AppError.upstreamUnavailable("betway-ng", { status: 500 });
    }
  });
  const audits = new InMemoryAuditRepository();

  await expectAppError(bookingService(operator, audits).convertBookingCode(SOURCE_CODE));
  assert.equal(audits.snapshots.length, 0);
  assert.equal(audits.conversionRuns.length, 0);
});

test("does not persist conversion audits when target decode fails", async () => {
  const operator = recordingOperator({
    source: slip(SOURCE_CODE, [selection(1)]),
    target: slip(TARGET_CODE, [selection(1)]),
    decodeTarget: async () => {
      throw AppError.bookingCodeNotFound(TARGET_CODE);
    }
  });
  const audits = new InMemoryAuditRepository();

  await expectAppError(bookingService(operator, audits).convertBookingCode(SOURCE_CODE));
  assert.equal(audits.snapshots.length, 0);
  assert.equal(audits.conversionRuns.length, 0);
});
