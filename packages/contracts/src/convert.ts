import type { Betslip } from "./betslip.js";

/**
 * Successful Convert result. Failures throw rather than returning
 * `verified: false` — a generated code that failed parity is not a conversion.
 */
export interface ConvertResult {
  sourceCode: string;
  targetCode: string;
  verified: true;
  sourceFingerprint: string;
  targetFingerprint: string;
  sourceSelectionCount: number;
  targetSelectionCount: number;
  slip: Betslip;
}
