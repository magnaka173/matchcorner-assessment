import type { BetType } from "./betslip.js";

/**
 * Operator-neutral encode input.
 *
 * Display names, odds and the exact line-level `marketId` are intentionally
 * absent. Encoding only needs the identifiers the sportsbook's write API
 * accepts; exact-market identity is a Decode/parity concern.
 */
export interface EncodeSelection {
  eventId: string;
  /** Parent/display market ID as the operator's write API expects it. */
  operatorMarketId: string;
  selectionId: string;
}

export interface EncodeSlipInput {
  betType: BetType;
  selections: EncodeSelection[];
}

export interface EncodedSlip {
  bookingCode: string;
}
