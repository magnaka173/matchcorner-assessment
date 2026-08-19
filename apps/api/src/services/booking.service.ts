import { toDecodedSlip, type DecodedSlip } from "@matchcorner/contracts";
import type { BookingOperator } from "../operators/booking-operator.js";

/**
 * Application service for booking-code workflows.
 *
 * The fingerprint is always derived from the canonical slip, never from an
 * operator payload, so parity checks stay comparable across operators and
 * across the Decode/Encode round trip added in later commits.
 */
export class BookingService {
  constructor(private readonly operator: BookingOperator) {}

  async decodeBookingCode(bookingCode: string): Promise<DecodedSlip> {
    const slip = await this.operator.decode(bookingCode);
    return toDecodedSlip(slip);
  }
}
