import type { Betslip, Operator } from "@matchcorner/contracts";

/**
 * Everything the application layer is allowed to know about a sportsbook.
 *
 * Implementations own their transport, payload schemas and error translation;
 * they hand back canonical contracts only. Encode/Convert are added to this
 * interface in later commits.
 */
export interface BookingOperator {
  readonly operator: Operator;
  decode(bookingCode: string): Promise<Betslip>;
}
