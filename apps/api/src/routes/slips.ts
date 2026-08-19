import { Router } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import type { BookingService } from "../services/booking.service.js";

/**
 * Booking codes observed on Betway are `BW` + hex, but the suffix length and
 * alphabet are not contractually guaranteed, so this stays deliberately loose:
 * enough to reject obvious junk without rejecting a valid future code.
 */
const bookingCodeSchema = z
  .string()
  .trim()
  .min(4, "bookingCode is too short")
  .max(32, "bookingCode is too long")
  .transform((value) => value.toUpperCase())
  .refine((value) => /^BW[A-Z0-9]+$/.test(value), "bookingCode must start with BW");

export const decodeSlipRequestSchema = z.object({
  bookingCode: bookingCodeSchema
});

export const convertSlipRequestSchema = decodeSlipRequestSchema;

const encodeSelectionSchema = z.object({
  eventId: z
    .union([z.string(), z.number()])
    .transform((value) => String(value).trim())
    .refine((value) => value.length > 0, "eventId is required")
    .refine(
      (value) => Number.isFinite(Number(value)) && Number.isInteger(Number(value)),
      "eventId must be a finite integer"
    ),
  operatorMarketId: z.string().trim().min(1, "operatorMarketId is required"),
  selectionId: z.string().trim().min(1, "selectionId is required")
});

/**
 * Extra display/canonical fields (odds, eventName, exact marketId, ...) are
 * stripped. Encode only forwards the three identifiers BookABet needs.
 */
export const encodeSlipRequestSchema = z
  .object({
    betType: z.enum(["single", "multi"]),
    selections: z.array(encodeSelectionSchema).min(1, "at least one selection is required")
  })
  .refine((data) => data.betType !== "single" || data.selections.length === 1, {
    message: "a single bet must contain exactly one selection",
    path: ["selections"]
  })
  .refine((data) => data.betType !== "multi" || data.selections.length >= 2, {
    message: "a multi bet must contain at least two selections",
    path: ["selections"]
  });

function toValidationDetails(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message
  }));
}

export function createSlipsRouter(bookingService: BookingService): Router {
  const router = Router();

  router.post("/decode", async (req, res) => {
    const parsed = decodeSlipRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      throw AppError.invalidRequest("Invalid decode request.", toValidationDetails(parsed.error));
    }

    const decoded = await bookingService.decodeBookingCode(parsed.data.bookingCode);
    res.json(decoded);
  });

  router.post("/encode", async (req, res) => {
    const parsed = encodeSlipRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      throw AppError.invalidRequest("Invalid encode request.", toValidationDetails(parsed.error));
    }

    const encoded = await bookingService.encodeSelections(parsed.data);
    res.json(encoded);
  });

  router.post("/convert", async (req, res) => {
    const parsed = convertSlipRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      throw AppError.invalidRequest("Invalid convert request.", toValidationDetails(parsed.error));
    }

    const converted = await bookingService.convertBookingCode(parsed.data.bookingCode);
    res.json(converted);
  });

  return router;
}
