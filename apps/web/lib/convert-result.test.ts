import type { ConvertResult } from "@matchcorner/contracts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { isVerifiedConversion } from "./convert-result";

const verified: ConvertResult = {
  sourceCode: "BWSOURCE01",
  targetCode: "BWTARGET01",
  verified: true,
  sourceFingerprint: "aa",
  targetFingerprint: "aa",
  sourceSelectionCount: 2,
  targetSelectionCount: 2,
  slip: {
    operator: "betway-ng",
    bookingCode: "BWTARGET01",
    betType: "multi",
    isBuildABet: false,
    selections: []
  }
};

test("treats only verified === true as a successful conversion", () => {
  assert.equal(isVerifiedConversion(verified), true);
  assert.equal(isVerifiedConversion(null), false);
  assert.equal(isVerifiedConversion(undefined), false);
  assert.equal(isVerifiedConversion({ ...verified, verified: false } as unknown as ConvertResult), false);
});
