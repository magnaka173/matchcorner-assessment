import type { CorsOptions } from "cors";

/**
 * Optional CORS_ORIGIN restricts browser origins in production.
 *
 * Unset or blank keeps the previous local-development default (any origin).
 * Comma-separated values allow the deployed web app plus localhost.
 */
export function createCorsOptions(corsOrigin: string | undefined): CorsOptions {
  const origins = (corsOrigin ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    return {};
  }

  const [single, ...rest] = origins;
  if (single === undefined) {
    return {};
  }

  return { origin: rest.length === 0 ? single : origins };
}
