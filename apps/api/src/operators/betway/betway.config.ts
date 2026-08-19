import type { Operator } from "@matchcorner/contracts";
import { z } from "zod";

/**
 * Betway Nigeria integration configuration.
 *
 * These values are public integration parameters rather than secrets, but they
 * are still read from the environment so the operator can be pointed at a
 * different brand, region or mock host without a code change.
 */

export const BETWAY_OPERATOR_NAME: Operator = "betway-ng";
export const BETWAY_DECODE_PATH = "/appsynapse/bet-api-sr02/v2/Betting/FindBookABet";

const betwayEnvSchema = z.object({
  BETWAY_BASE_URL: z.url().default("https://www.betway.com.ng"),
  BETWAY_BRAND_ID: z.string().min(1).default("f8a8d16a-d619-4b49-aa8c-f21211403c92"),
  BETWAY_COUNTRY_CODE: z.string().min(2).max(3).default("NG"),
  BETWAY_CULTURE_CODE: z.string().min(2).max(10).default("en-US"),
  BETWAY_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(8_000)
});

export interface BetwayConfig {
  baseUrl: string;
  brandId: string;
  countryCode: string;
  cultureCode: string;
  timeoutMs: number;
}

export function loadBetwayConfig(env: NodeJS.ProcessEnv = process.env): BetwayConfig {
  const parsed = betwayEnvSchema.safeParse(env);

  if (!parsed.success) {
    const invalidKeys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid Betway configuration: ${invalidKeys}`);
  }

  return {
    baseUrl: parsed.data.BETWAY_BASE_URL.replace(/\/+$/, ""),
    brandId: parsed.data.BETWAY_BRAND_ID,
    countryCode: parsed.data.BETWAY_COUNTRY_CODE,
    cultureCode: parsed.data.BETWAY_CULTURE_CODE,
    timeoutMs: parsed.data.BETWAY_TIMEOUT_MS
  };
}

export function betwayDecodeUrl(config: BetwayConfig): string {
  return `${config.baseUrl}${BETWAY_DECODE_PATH}`;
}
