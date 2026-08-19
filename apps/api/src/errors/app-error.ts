/**
 * Application error taxonomy.
 *
 * Every failure that can reach a client is expressed as an `AppError` so the
 * HTTP layer never has to guess a status code, and so upstream operator
 * details (bodies, headers, HTML error pages) stay server-side.
 */

export type AppErrorCode =
  | "INVALID_REQUEST"
  | "BOOKING_CODE_NOT_FOUND"
  | "SOURCE_SELECTION_UNAVAILABLE"
  | "CONVERSION_INPUT_INVALID"
  | "CONVERSION_PARITY_FAILED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_CONTRACT_MISMATCH"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  INVALID_REQUEST: 400,
  BOOKING_CODE_NOT_FOUND: 404,
  SOURCE_SELECTION_UNAVAILABLE: 422,
  CONVERSION_INPUT_INVALID: 422,
  CONVERSION_PARITY_FAILED: 422,
  UPSTREAM_TIMEOUT: 504,
  UPSTREAM_UNAVAILABLE: 502,
  UPSTREAM_CONTRACT_MISMATCH: 502,
  INTERNAL_ERROR: 500
};

/** Codes whose `details` are derived from our own domain data and are safe to return. */
export const CLIENT_VISIBLE_ERROR_DETAILS: ReadonlySet<AppErrorCode> = new Set([
  "INVALID_REQUEST",
  "SOURCE_SELECTION_UNAVAILABLE",
  "CONVERSION_INPUT_INVALID",
  "CONVERSION_PARITY_FAILED"
]);

export interface AppErrorOptions {
  /** Safe to return to the client. Only ever derived from our own validation. */
  details?: unknown;
  /** Never serialized to the client; kept for server-side logs. */
  cause?: unknown;
  /** Concise, sanitized key/values for server-side logs. */
  logContext?: Record<string, string | number | boolean>;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly logContext?: Record<string, string | number | boolean>;

  constructor(code: AppErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = options.details;
    this.logContext = options.logContext;
  }

  static invalidRequest(message: string, details?: unknown): AppError {
    return new AppError("INVALID_REQUEST", message, { details });
  }

  static bookingCodeNotFound(bookingCode: string): AppError {
    return new AppError("BOOKING_CODE_NOT_FOUND", "Booking code was not found or is no longer valid.", {
      logContext: { bookingCode }
    });
  }

  static upstreamTimeout(operator: string, cause?: unknown): AppError {
    return new AppError("UPSTREAM_TIMEOUT", "The betting operator did not respond in time.", {
      cause,
      logContext: { operator }
    });
  }

  static upstreamUnavailable(
    operator: string,
    options: { status?: number; cause?: unknown } = {}
  ): AppError {
    return new AppError("UPSTREAM_UNAVAILABLE", "The betting operator returned an unexpected response.", {
      cause: options.cause,
      logContext: options.status === undefined ? { operator } : { operator, upstreamStatus: options.status }
    });
  }

  static upstreamContractMismatch(operator: string, reason: string, cause?: unknown): AppError {
    return new AppError(
      "UPSTREAM_CONTRACT_MISMATCH",
      "The betting operator response did not match the expected contract.",
      { cause, logContext: { operator, reason } }
    );
  }

  static sourceSelectionUnavailable(unavailableIdentities: string[]): AppError {
    return new AppError("SOURCE_SELECTION_UNAVAILABLE", "One or more selections are no longer available.", {
      details: { unavailableIdentities },
      logContext: { unavailableCount: unavailableIdentities.length }
    });
  }

  static conversionInputInvalid(invalidIdentities: string[]): AppError {
    return new AppError(
      "CONVERSION_INPUT_INVALID",
      "A decoded selection is missing the operator market identifier required to encode.",
      { details: { invalidIdentities }, logContext: { invalidCount: invalidIdentities.length } }
    );
  }

  static conversionParityFailed(details: {
    targetCode: string;
    expectedSelectionCount: number;
    actualSelectionCount: number;
    missingIdentities: string[];
    extraIdentities: string[];
  }): AppError {
    return new AppError(
      "CONVERSION_PARITY_FAILED",
      "The generated booking code does not contain the same selections.",
      {
        details,
        logContext: {
          targetCode: details.targetCode,
          expectedSelectionCount: details.expectedSelectionCount,
          actualSelectionCount: details.actualSelectionCount
        }
      }
    );
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
