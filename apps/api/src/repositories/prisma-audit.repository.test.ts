import assert from "node:assert/strict";
import { test } from "node:test";
import type { Betslip } from "@matchcorner/contracts";
import { AppError } from "../errors/app-error.js";
import { PrismaAuditRepository } from "./prisma-audit.repository.js";

const slip: Betslip = {
  operator: "betway-ng",
  bookingCode: "BWSOURCE01",
  betType: "single",
  isBuildABet: false,
  selections: [
    {
      eventId: "68096464",
      eventName: "Connecticut Sun vs. Los Angeles Sparks",
      sport: "Basketball",
      marketId: "68096464223hcp=1.5~",
      marketName: "Handicap",
      operatorMarketId: "68096464223",
      selectionId: "68096464223hcp=1.5~1715",
      selectionName: "Los Angeles Sparks (-1.5)",
      handicap: -1.5,
      odds: 1.74,
      active: true
    }
  ]
};

test("maps a slip snapshot onto Prisma create data as JSON, not a string", async () => {
  const captured: unknown[] = [];
  const repository = new PrismaAuditRepository({
    slipSnapshot: {
      create: async (args: unknown) => {
        captured.push(args);
        return {};
      }
    },
    conversionRun: {
      create: async () => {
        throw new Error("conversionRun.create should not be called");
      }
    }
  } as never);

  await repository.saveSlipSnapshot({
    operator: "betway-ng",
    bookingCode: "BWSOURCE01",
    fingerprint: "abc",
    betType: "single",
    selectionCount: 1,
    slip,
    captureType: "decode"
  });

  const args = captured[0] as { data: Record<string, unknown> };
  assert.equal(args.data["bookingCode"], "BWSOURCE01");
  assert.equal(args.data["captureType"], "decode");
  assert.equal(typeof args.data["slip"], "object");
  assert.notEqual(typeof args.data["slip"], "string");
  assert.equal(JSON.stringify(args.data["slip"]).includes("accountId"), false);
});

test("maps a conversion run including identity arrays as JSON", async () => {
  const captured: unknown[] = [];
  const repository = new PrismaAuditRepository({
    slipSnapshot: {
      create: async () => {
        throw new Error("slipSnapshot.create should not be called");
      }
    },
    conversionRun: {
      create: async (args: unknown) => {
        captured.push(args);
        return {};
      }
    }
  } as never);

  await repository.saveConversionRun({
    operator: "betway-ng",
    sourceCode: "BWSOURCE01",
    targetCode: "BWTARGET01",
    sourceFingerprint: "aaa",
    targetFingerprint: "bbb",
    verified: false,
    sourceSelectionCount: 2,
    targetSelectionCount: 1,
    missingIdentities: ["e1:m1:s1"],
    extraIdentities: []
  });

  const args = captured[0] as { data: Record<string, unknown> };
  assert.equal(args.data["verified"], false);
  assert.deepEqual(args.data["missingIdentities"], ["e1:m1:s1"]);
  assert.deepEqual(args.data["extraIdentities"], []);
});

test("turns a Prisma write failure into INTERNAL_ERROR without leaking the cause", async () => {
  const consoleError = console.error;
  console.error = () => {};

  const repository = new PrismaAuditRepository({
    slipSnapshot: {
      create: async () => {
        const error = new Error("P1001: Can't reach database server at postgresql://postgres:postgres@localhost:5432/matchcorner");
        (error as Error & { code: string }).code = "P1001";
        throw error;
      }
    },
    conversionRun: {
      create: async () => ({})
    }
  } as never);

  try {
    await assert.rejects(
      repository.saveSlipSnapshot({
        operator: "betway-ng",
        bookingCode: "BWSOURCE01",
        fingerprint: "abc",
        betType: "single",
        selectionCount: 1,
        slip,
        captureType: "decode"
      }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "INTERNAL_ERROR");
        assert.equal(error.message.includes("postgresql://"), false);
        assert.equal(error.details, undefined);
        assert.equal(error.logContext?.["prismaCode"], "P1001");
        assert.equal(error.logContext?.["table"], "SlipSnapshot");
        return true;
      }
    );
  } finally {
    console.error = consoleError;
  }
});
