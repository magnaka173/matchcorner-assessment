/**
 * Canonical records only. Prisma Json rejects `undefined`; a JSON round-trip
 * drops those keys and rejects class/Error values. Key names that belong to
 * operator/session payloads are refused so they cannot be stored even if a
 * caller accidentally passes a raw Betway object.
 */

const FORBIDDEN_KEYS = new Set([
  "accountid",
  "authorization",
  "cookie",
  "cookies",
  "rawresponse",
  "set-cookie",
  "cf-ray",
  "cf_bm",
  "__cf_bm"
]);

export function toCanonicalJson(value: unknown): unknown {
  let cloned: unknown;

  try {
    cloned = JSON.parse(JSON.stringify(value)) as unknown;
  } catch {
    throw new Error("Value is not JSON-serializable canonical data.");
  }

  assertNoSensitiveKeys(cloned);
  return cloned;
}

function assertNoSensitiveKeys(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      assertNoSensitiveKeys(item);
    }
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      throw new Error(`Refusing to persist sensitive field "${key}".`);
    }
    assertNoSensitiveKeys(child);
  }
}
