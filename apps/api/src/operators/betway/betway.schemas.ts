import { z } from "zod";

/**
 * Partial schemas for Betway's `POST /Betting/FindBookABet` response.
 *
 * Only fields this application actually consumes are described. Every object
 * is loose (the Zod 4 spelling of `.passthrough()`) because the real payload
 * carries many unrelated fields and Betway may add more at any time — an
 * unknown field must never fail a decode.
 *
 * Deliberately not modelled: `accountId` and any other account/session data.
 * It is not parsed, not mapped and therefore cannot leak into a response.
 */

/** Betway is inconsistent about numeric vs string identifiers. */
const identifier = z.union([z.string().min(1), z.number()]);
const optionalIdentifier = identifier.nullish();
const optionalText = z.union([z.string(), z.number()]).nullish();
const optionalNumber = z.union([z.number(), z.string()]).nullish();
const optionalFlag = z.boolean().nullish();

const priceSchema = z.looseObject({
  priceDecimal: z.number().positive()
});

const outcomeSchema = z.looseObject({
  outcomeId: z.string().min(1),
  eventId: optionalIdentifier,
  displayName: optionalText,
  name: optionalText,
  sbv: optionalText,
  handicap: optionalNumber,
  isTradingActive: optionalFlag
});

const marketSchema = z.looseObject({
  marketId: z.string().min(1),
  displayName: optionalText,
  name: optionalText
});

const sportEventSchema = z.looseObject({
  eventId: identifier,
  displayName: optionalText,
  name: optionalText,
  expectedStartEpoch: z.number().nullish(),
  sportId: optionalIdentifier,
  region: optionalText,
  league: optionalText,
  /** Present on match events; more reliable than placeholder display names. */
  homeTeam: optionalText,
  awayTeam: optionalText
});

export const betwaySelectionSchema = z.looseObject({
  outcomeId: z.string().min(1),
  price: priceSchema,
  outcome: outcomeSchema,
  market: marketSchema.nullish(),
  /** Present when Betway splits a display market from its exact line. */
  originalMarket: marketSchema.nullish(),
  sportEvent: sportEventSchema,

  marketId: z.string().min(1),
  marketName: optionalText,
  eventId: optionalIdentifier,
  eventName: optionalText,
  sportId: optionalIdentifier,
  region: optionalText,
  league: optionalText,
  handicap: optionalNumber,
  isMarketActive: optionalFlag,
  isEventActive: optionalFlag,
  isOutcomeActive: optionalFlag
});

export const findBookABetResponseSchema = z.looseObject({
  selections: z.array(betwaySelectionSchema),
  isSingleBet: optionalFlag,
  isBuildABet: optionalFlag
});

/**
 * Booking codes observed on Betway are `BW` + hex, but the suffix length is
 * not contractually guaranteed. Keep this aligned with the local decode input
 * rule: reject obvious junk without rejecting a valid future code.
 */
const createdBookingCodeSchema = z
  .string()
  .trim()
  .min(4)
  .max(32)
  .transform((value) => value.toUpperCase())
  .refine((value) => /^BW[A-Z0-9]+$/.test(value));

export const bookABetResponseSchema = z.looseObject({
  bookingCode: createdBookingCodeSchema
});

export interface BookABetOutcome {
  outcomeId: string;
  eventId: number;
  marketId: string;
  payment: 1;
  value: 0;
  selected: true;
}

export interface BookABetRequest {
  cultureCode: string;
  countryCode: string;
  isSingleBet: boolean;
  outcomes: BookABetOutcome[];
}

export type BetwaySelection = z.infer<typeof betwaySelectionSchema>;
export type FindBookABetResponse = z.infer<typeof findBookABetResponseSchema>;
export type BookABetResponse = z.infer<typeof bookABetResponseSchema>;
