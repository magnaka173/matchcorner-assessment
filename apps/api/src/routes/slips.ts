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

  return router;
}
