import type { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../errors/app-error.js";
import { toCanonicalJson } from "../db/canonical-json.js";
import type { AuditRepository, SaveConversionRunInput, SaveSlipSnapshotInput } from "./audit.repository.js";

type AuditPrisma = Pick<PrismaClient, "slipSnapshot" | "conversionRun">;

function persistenceFailed(table: string, error: unknown): AppError {
  const prismaCode =
    error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "UNKNOWN";

  console.error("audit_write_failed", { table, prismaCode });

  return new AppError("INTERNAL_ERROR", "Failed to persist audit data.", {
    logContext: { table, prismaCode }
  });
}

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return toCanonicalJson(value) as Prisma.InputJsonValue;
}

export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly db: AuditPrisma) {}

  async saveSlipSnapshot(input: SaveSlipSnapshotInput): Promise<void> {
    try {
      await this.db.slipSnapshot.create({
        data: {
          operator: input.operator,
          bookingCode: input.bookingCode,
          fingerprint: input.fingerprint,
          betType: input.betType,
          selectionCount: input.selectionCount,
          slip: asInputJson(input.slip),
          captureType: input.captureType
        }
      });
    } catch (error) {
      throw persistenceFailed("SlipSnapshot", error);
    }
  }

  async saveConversionRun(input: SaveConversionRunInput): Promise<void> {
    try {
      await this.db.conversionRun.create({
        data: {
          operator: input.operator,
          sourceCode: input.sourceCode,
          targetCode: input.targetCode,
          sourceFingerprint: input.sourceFingerprint,
          targetFingerprint: input.targetFingerprint,
          verified: input.verified,
          sourceSelectionCount: input.sourceSelectionCount,
          targetSelectionCount: input.targetSelectionCount,
          missingIdentities: input.missingIdentities === undefined ? undefined : asInputJson(input.missingIdentities),
          extraIdentities: input.extraIdentities === undefined ? undefined : asInputJson(input.extraIdentities)
        }
      });
    } catch (error) {
      throw persistenceFailed("ConversionRun", error);
    }
  }
}
