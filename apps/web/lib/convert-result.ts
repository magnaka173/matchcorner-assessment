import type { ConvertResult } from "@matchcorner/contracts";

/**
 * Convert success UI is shown only when the API marked the round-trip verified.
 * A 200-shaped payload with `verified: false` must not be treated as success.
 */
export function isVerifiedConversion(
  result: ConvertResult | null | undefined
): result is ConvertResult {
  return result?.verified === true;
}
