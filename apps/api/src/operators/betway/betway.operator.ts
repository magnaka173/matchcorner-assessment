import type { Betslip, Operator } from "@matchcorner/contracts";
import type { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import type { BookingOperator } from "../booking-operator.js";
import {
  BETWAY_OPERATOR_NAME,
  betwayDecodeUrl,
  loadBetwayConfig,
  type BetwayConfig
} from "./betway.config.js";
import { mapFindBookABetResponse } from "./betway.mapper.js";
import { findBookABetResponseSchema } from "./betway.schemas.js";

export type FetchLike = typeof globalThis.fetch;
type FetchResponse = Awaited<ReturnType<FetchLike>>;

export interface BetwayNigeriaOperatorOptions {
  config?: BetwayConfig;
  /** Injectable for tests; no test in this repository touches the live API. */
  fetch?: FetchLike;
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

/** Field paths only — never the received values, which may echo upstream data. */
function summarizeSchemaFailure(error: ZodError): string {
  return error.issues
    .slice(0, 3)
    .map((issue) => `${issue.path.join(".") || "<root>"}:${issue.code}`)
    .join(", ");
}

/**
 * Betway Nigeria booking-code operator.
 *
 * The raw Betway response shape stops here: callers only ever receive canonical
 * contracts or an `AppError`.
 */
export class BetwayNigeriaOperator implements BookingOperator {
  readonly operator: Operator = BETWAY_OPERATOR_NAME;

  private readonly config: BetwayConfig;
  private readonly fetchImpl: FetchLike;

  constructor(options: BetwayNigeriaOperatorOptions = {}) {
    this.config = options.config ?? loadBetwayConfig();
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async decode(bookingCode: string): Promise<Betslip> {
    const payload = await this.findBookABet(bookingCode);

    const parsed = findBookABetResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw AppError.upstreamContractMismatch(this.operator, summarizeSchemaFailure(parsed.error));
    }

    // Betway answers an unknown or expired code with a 200 and no selections.
    if (parsed.data.selections.length === 0) {
      throw AppError.bookingCodeNotFound(bookingCode);
    }

    return mapFindBookABetResponse(bookingCode, parsed.data);
  }

  private async findBookABet(bookingCode: string): Promise<unknown> {
    let response: FetchResponse;

    try {
      response = await this.fetchImpl(betwayDecodeUrl(this.config), {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-brand-id": this.config.brandId
        },
        body: JSON.stringify({
          countryCode: this.config.countryCode,
          bookingCode,
          cultureCode: this.config.cultureCode
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs)
      });
    } catch (error) {
      if (isTimeoutError(error)) {
        throw AppError.upstreamTimeout(this.operator, error);
      }
      throw AppError.upstreamUnavailable(this.operator, { cause: error });
    }

    if (response.status === 404) {
      throw AppError.bookingCodeNotFound(bookingCode);
    }

    if (!response.ok) {
      throw AppError.upstreamUnavailable(this.operator, { status: response.status });
    }

    try {
      return await response.json();
    } catch (error) {
      if (isTimeoutError(error)) {
        throw AppError.upstreamTimeout(this.operator, error);
      }
      throw AppError.upstreamContractMismatch(this.operator, "body was not valid json", error);
    }
  }
}
