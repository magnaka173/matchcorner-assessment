import { computeSlipFingerprint, selectionIdentity, type SelectionIdentityParts } from "./fingerprint.js";

/**
 * Set-level comparison of two slips' stable selection identities.
 *
 * Fingerprints remain the source of truth (they retain duplicate identities).
 * Missing/extra lists are derived from identity *sets* so a parity failure can
 * name which selections drifted without leaking display or price data.
 */
export interface ParityResult {
  verified: boolean;
  expectedSelectionCount: number;
  actualSelectionCount: number;
  missingIdentities: string[];
  extraIdentities: string[];
}

export function compareSlipParity(
  expected: readonly SelectionIdentityParts[],
  actual: readonly SelectionIdentityParts[]
): ParityResult {
  const expectedIdentities = expected.map(selectionIdentity);
  const actualIdentities = actual.map(selectionIdentity);

  const expectedSet = new Set(expectedIdentities);
  const actualSet = new Set(actualIdentities);

  const missingIdentities = [...expectedSet].filter((identity) => !actualSet.has(identity)).sort();
  const extraIdentities = [...actualSet].filter((identity) => !expectedSet.has(identity)).sort();

  const fingerprintsMatch = computeSlipFingerprint(expected) === computeSlipFingerprint(actual);

  return {
    verified: fingerprintsMatch && missingIdentities.length === 0 && extraIdentities.length === 0,
    expectedSelectionCount: expected.length,
    actualSelectionCount: actual.length,
    missingIdentities,
    extraIdentities
  };
}
