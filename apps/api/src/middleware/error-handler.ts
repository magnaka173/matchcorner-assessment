import type { ErrorRequestHandler } from "express";
import { AppError, isAppError } from "../errors/app-error.js";

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  // express.json() rejects malformed bodies with a SyntaxError carrying `body`.
  if (error instanceof SyntaxError && "body" in error) {
    return AppError.invalidRequest("Request body is not valid JSON.");
  }

  return new AppError("INTERNAL_ERROR", "Unexpected internal error.", { cause: error });
}

function describeCause(cause: unknown): string | undefined {
  if (cause instanceof Error) {
    return `${cause.name}: ${cause.message}`;
  }
  return undefined;
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const appError = toAppError(error);

  console.error("request_failed", {
    method: req.method,
    path: req.path,
    status: appError.status,
    code: appError.code,
    ...appError.logContext,
    cause: describeCause(appError.cause)
  });

  const body: ErrorResponseBody = {
    error: {
      code: appError.code,
      message: appError.message
    }
  };

  // Only our own validation output is echoed back; upstream payloads never are.
  if (appError.code === "INVALID_REQUEST" && appError.details !== undefined) {
    body.error.details = appError.details;
  }

  res.status(appError.status).json(body);
};
