import { createHash } from "node:crypto";
import type { Betslip, DecodedSlip, Selection } from "./betslip.js";

export const SELECTION_IDENTITY_SEPARATOR = ":";
export const SLIP_IDENTITY_SEPARATOR = "|";

/**
 * The only fields that carry semantic identity. Everything else on a
 * `Selection` — odds, display names, start times, availability — can change
 * between decoding a booking code and verifying the regenerated one without
 * changing which bet was placed.
 */
export type SelectionIdentityParts = Pick<Selection, "eventId" | "marketId" | "selectionId">;

export function selectionIdentity(selection: SelectionIdentityParts): string {
  return [selection.eventId, selection.marketId, selection.selectionId].join(SELECTION_IDENTITY_SEPARATOR);
}

/**
 * The exact pre-hash string, exposed so a failed parity check can be audited
 * without re-deriving it by hand.
 */
export function slipIdentityPayload(selections: readonly SelectionIdentityParts[]): string {
  return selections
    .map(selectionIdentity)
    .sort()
    .join(SLIP_IDENTITY_SEPARATOR);
}

export function computeSlipFingerprint(selections: readonly SelectionIdentityParts[]): string {
  return createHash("sha256").update(slipIdentityPayload(selections), "utf8").digest("hex");
}

export function toDecodedSlip(slip: Betslip): DecodedSlip {
  return {
    slip,
    fingerprint: computeSlipFingerprint(slip.selections)
  };
}
