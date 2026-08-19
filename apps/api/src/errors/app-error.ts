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
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_CONTRACT_MISMATCH"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  INVALID_REQUEST: 400,
  BOOKING_CODE_NOT_FOUND: 404,
  UPSTREAM_TIMEOUT: 504,
  UPSTREAM_UNAVAILABLE: 502,
  UPSTREAM_CONTRACT_MISMATCH: 502,
  INTERNAL_ERROR: 500
};

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
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
