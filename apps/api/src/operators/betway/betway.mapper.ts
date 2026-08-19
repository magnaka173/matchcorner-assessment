import type { Betslip, Selection } from "@matchcorner/contracts";
import { BETWAY_OPERATOR_NAME } from "./betway.config.js";
import type { BetwaySelection, FindBookABetResponse } from "./betway.schemas.js";

type MaybeText = string | number | null | undefined;

/** First non-empty value, normalized to a trimmed string. */
function firstText(...values: MaybeText[]): string | undefined {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    const text = String(value).trim();
    if (text.length > 0) {
      return text;
    }
  }
  return undefined;
}

function toNumberOrNull(value: MaybeText): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toIsoStartTime(expectedStartEpoch: number | null | undefined): string | undefined {
  if (expectedStartEpoch === null || expectedStartEpoch === undefined) {
    return undefined;
  }
  const startTime = new Date(expectedStartEpoch * 1000);
  return Number.isNaN(startTime.getTime()) ? undefined : startTime.toISOString();
}

/** Betway carries the line separately from the outcome name, e.g. `"Sparks"` + `" (-1.5)"`. */
function buildSelectionName(outcome: BetwaySelection["outcome"]): string {
  const base = firstText(outcome.displayName, outcome.name) ?? "";
  const specialBetValue = firstText(outcome.sbv);
  return specialBetValue ? `${base} ${specialBetValue}`.trim() : base;
}

export function mapBetwaySelection(raw: BetwaySelection): Selection {
  return {
    eventId: String(raw.sportEvent.eventId),
    eventName: firstText(raw.sportEvent.displayName, raw.sportEvent.name, raw.eventName) ?? "",
    sport: firstText(raw.sportEvent.sportId, raw.sportId) ?? "",
    region: firstText(raw.sportEvent.region, raw.region),
    league: firstText(raw.sportEvent.league, raw.league),
    startTime: toIsoStartTime(raw.sportEvent.expectedStartEpoch),

    // Exact line-level market: this is what selection identity is built from.
    marketId: raw.originalMarket?.marketId ?? raw.marketId,
    marketName:
      firstText(
        raw.originalMarket?.displayName,
        raw.originalMarket?.name,
        raw.marketName,
        raw.market?.displayName,
        raw.market?.name
      ) ?? "",

    // Parent/display market: what BookABet will need when Encode is added.
    operatorMarketId: raw.market?.marketId ?? raw.marketId,

    selectionId: raw.outcomeId,
    selectionName: buildSelectionName(raw.outcome),
    handicap: toNumberOrNull(raw.outcome.handicap ?? raw.handicap),
    odds: raw.price.priceDecimal,

    // Fail closed: a missing availability flag is treated as unavailable rather
    // than advertising a selection Betway may no longer accept.
    active: Boolean(
      raw.isEventActive && raw.isMarketActive && raw.isOutcomeActive && raw.outcome.isTradingActive
    )
  };
}

export function mapFindBookABetResponse(
  bookingCode: string,
  response: FindBookABetResponse
): Betslip {
  return {
    operator: BETWAY_OPERATOR_NAME,
    bookingCode,
    betType: response.isSingleBet ? "single" : "multi",
    isBuildABet: response.isBuildABet === true,
    selections: response.selections.map(mapBetwaySelection)
  };
}
