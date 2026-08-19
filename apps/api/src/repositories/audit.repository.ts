import type { Betslip } from "@matchcorner/contracts";

export const SLIP_CAPTURE_TYPES = ["decode", "convert-source", "convert-target"] as const;

export type SlipCaptureType = (typeof SLIP_CAPTURE_TYPES)[number];

export interface SaveSlipSnapshotInput {
  operator: string;
  bookingCode: string;
  fingerprint: string;
  betType: string;
  selectionCount: number;
  slip: Betslip;
  captureType: SlipCaptureType;
}

export interface SaveConversionRunInput {
  operator: string;
  sourceCode: string;
  targetCode?: string;
  sourceFingerprint: string;
  targetFingerprint?: string;
  verified: boolean;
  sourceSelectionCount: number;
  targetSelectionCount?: number;
  missingIdentities?: string[];
  extraIdentities?: string[];
}

/**
 * Persistence for canonical slip snapshots and conversion audits.
 *
 * Implementations must never accept or store raw operator payloads.
 */
export interface AuditRepository {
  saveSlipSnapshot(input: SaveSlipSnapshotInput): Promise<void>;
  saveConversionRun(input: SaveConversionRunInput): Promise<void>;
}
