import type { Betslip, EncodeSlipInput, Operator } from "@matchcorner/contracts";

/**
 * Everything the application layer is allowed to know about a sportsbook.
 *
 * Implementations own their transport, payload schemas and error translation;
 * they hand back canonical contracts only. Convert is application orchestration
 * over `decode` and `encode`, not an operator method.
 */
export interface BookingOperator {
  readonly operator: Operator;
  decode(bookingCode: string): Promise<Betslip>;
  encode(input: EncodeSlipInput): Promise<string>;
}
