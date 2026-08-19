import { toDecodedSlip, type DecodedSlip, type EncodedSlip, type EncodeSlipInput } from "@matchcorner/contracts";
import type { BookingOperator } from "../operators/booking-operator.js";

/**
 * Application service for booking-code workflows.
 *
 * The fingerprint is always derived from the canonical slip, never from an
 * operator payload, so parity checks stay comparable across operators and
 * across the Decode/Encode round trip added in the Convert commit.
 */
export class BookingService {
  constructor(private readonly operator: BookingOperator) {}

  async decodeBookingCode(bookingCode: string): Promise<DecodedSlip> {
    const slip = await this.operator.decode(bookingCode);
    return toDecodedSlip(slip);
  }

  async encodeSelections(input: EncodeSlipInput): Promise<EncodedSlip> {
    const bookingCode = await this.operator.encode(input);
    return { bookingCode };
  }
}
