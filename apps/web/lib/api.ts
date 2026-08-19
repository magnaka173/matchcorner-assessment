import type { ConvertResult, DecodedSlip, EncodedSlip, EncodeSlipInput } from "@matchcorner/contracts";

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/+$/, "");
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

interface ErrorPayload {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}

function parseApiError(payload: unknown, status: number): ApiClientError {
  const record = asRecord(payload);
  const error = asRecord(record?.["error"]);
  const code = typeof error?.["code"] === "string" ? error["code"] : "INTERNAL_ERROR";
  const message =
    typeof error?.["message"] === "string" ? error["message"] : "The MatchCorner API returned an error.";

  return new ApiClientError(code, message, status, error?.["details"]);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiClientError("INVALID_RESPONSE", "The API returned a non-JSON response.", response.status);
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw new ApiClientError(
      "NETWORK_ERROR",
      "Could not reach the MatchCorner API. Confirm the API is running.",
      0
    );
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw parseApiError(payload, response.status);
  }

  return payload as T;
}

export async function decodeSlip(bookingCode: string): Promise<DecodedSlip> {
  return postJson<DecodedSlip>("/api/v1/slips/decode", { bookingCode });
}

export async function encodeSlip(input: EncodeSlipInput): Promise<EncodedSlip> {
  return postJson<EncodedSlip>("/api/v1/slips/encode", input);
}

export async function convertSlip(bookingCode: string): Promise<ConvertResult> {
  return postJson<ConvertResult>("/api/v1/slips/convert", { bookingCode });
}

export async function fetchApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/health`, {
      headers: { accept: "application/json" }
    });
    if (!response.ok) {
      return false;
    }
    const payload = asRecord(await response.json());
    return payload?.["ok"] === true;
  } catch {
    return false;
  }
}

export interface ParityErrorDetails {
  targetCode?: string;
  expectedSelectionCount?: number;
  actualSelectionCount?: number;
  missingIdentities?: string[];
  extraIdentities?: string[];
}

export function asParityErrorDetails(details: unknown): ParityErrorDetails | undefined {
  const record = asRecord(details);
  if (!record) {
    return undefined;
  }

  const missing = record["missingIdentities"];
  const extra = record["extraIdentities"];

  return {
    targetCode: typeof record["targetCode"] === "string" ? record["targetCode"] : undefined,
    expectedSelectionCount:
      typeof record["expectedSelectionCount"] === "number" ? record["expectedSelectionCount"] : undefined,
    actualSelectionCount:
      typeof record["actualSelectionCount"] === "number" ? record["actualSelectionCount"] : undefined,
    missingIdentities: Array.isArray(missing) ? missing.filter((item) => typeof item === "string") : undefined,
    extraIdentities: Array.isArray(extra) ? extra.filter((item) => typeof item === "string") : undefined
  };
}

export function asIdentityList(details: unknown, key: string): string[] | undefined {
  const record = asRecord(details);
  const value = record?.[key];
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.filter((item) => typeof item === "string");
}
