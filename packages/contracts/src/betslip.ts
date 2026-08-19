/**
 * Canonical, operator-neutral betslip contract.
 *
 * Application code depends on this shape only. Operator adapters are
 * responsible for translating raw provider payloads into these types, so no
 * consumer needs to know how any single sportsbook models its data.
 */

export type Operator = "betway-ng";

export type BetType = "single" | "multi";

export interface Selection {
  eventId: string;
  eventName: string;
  sport: string;
  region?: string;
  league?: string;
  startTime?: string;

  /**
   * Exact market identity, including the line where the operator encodes one.
   * Two different handicap lines are two different markets.
   */
  marketId: string;
  marketName: string;

  /**
   * Parent/display market ID as the operator expects it on write requests.
   * Kept separate from `marketId` because encoding and identity have
   * different granularity requirements.
   */
  operatorMarketId?: string;

  selectionId: string;
  selectionName: string;
  handicap?: number | null;
  odds: number;
  active: boolean;
}

export interface Betslip {
  operator: Operator;
  bookingCode: string;
  betType: BetType;
  isBuildABet: boolean;
  selections: Selection[];
}

export interface DecodedSlip {
  slip: Betslip;
  fingerprint: string;
}
