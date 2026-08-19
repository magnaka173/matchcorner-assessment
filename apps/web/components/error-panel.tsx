import { asIdentityList, asParityErrorDetails, isApiClientError } from "../lib/api";

function titleFor(code: string): string {
  switch (code) {
    case "INVALID_REQUEST":
      return "Invalid request";
    case "BOOKING_CODE_NOT_FOUND":
      return "Booking code not found";
    case "SOURCE_SELECTION_UNAVAILABLE":
      return "A source selection is no longer available";
    case "CONVERSION_INPUT_INVALID":
      return "This slip cannot be encoded";
    case "CONVERSION_PARITY_FAILED":
      return "Conversion was not verified";
    case "UPSTREAM_TIMEOUT":
      return "The betting operator timed out";
    case "UPSTREAM_UNAVAILABLE":
      return "The betting operator is unavailable";
    case "UPSTREAM_CONTRACT_MISMATCH":
      return "Unexpected operator response";
    case "NETWORK_ERROR":
      return "API unreachable";
    case "INVALID_RESPONSE":
      return "Unexpected API response";
    default:
      return "Request failed";
  }
}

function describeUnknown(error: unknown): { code: string; message: string; details?: unknown } {
  if (isApiClientError(error)) {
    return { code: error.code, message: error.message, details: error.details };
  }
  if (error instanceof Error) {
    return { code: "INTERNAL_ERROR", message: error.message };
  }
  return { code: "INTERNAL_ERROR", message: "Unexpected error." };
}

export function ErrorPanel({ error }: { error: unknown }) {
  const parsed = describeUnknown(error);
  const parity = parsed.code === "CONVERSION_PARITY_FAILED" ? asParityErrorDetails(parsed.details) : undefined;
  const unavailable = asIdentityList(parsed.details, "unavailableIdentities");
  const invalid = asIdentityList(parsed.details, "invalidIdentities");

  return (
    <div className="error-panel" role="alert">
      <p className="error-title">{titleFor(parsed.code)}</p>
      <p>{parsed.message}</p>

      {parity ? (
        <dl className="meta-grid">
          {parity.targetCode ? (
            <div>
              <dt>Generated code</dt>
              <dd>
                <code>{parity.targetCode}</code>
              </dd>
            </div>
          ) : null}
          {parity.expectedSelectionCount !== undefined ? (
            <div>
              <dt>Expected selections</dt>
              <dd>{parity.expectedSelectionCount}</dd>
            </div>
          ) : null}
          {parity.actualSelectionCount !== undefined ? (
            <div>
              <dt>Actual selections</dt>
              <dd>{parity.actualSelectionCount}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {parity?.missingIdentities && parity.missingIdentities.length > 0 ? (
        <IdentityList heading="Missing identities" identities={parity.missingIdentities} />
      ) : null}
      {parity?.extraIdentities && parity.extraIdentities.length > 0 ? (
        <IdentityList heading="Extra identities" identities={parity.extraIdentities} />
      ) : null}
      {unavailable && unavailable.length > 0 ? (
        <IdentityList heading="Unavailable selections" identities={unavailable} />
      ) : null}
      {invalid && invalid.length > 0 ? (
        <IdentityList heading="Invalid encode identifiers" identities={invalid} />
      ) : null}

      <details className="technical">
        <summary>Technical details</summary>
        <p>
          <span className="muted">code</span> <code>{parsed.code}</code>
          {isApiClientError(error) && error.status > 0 ? (
            <>
              {" "}
              <span className="muted">status</span> <code>{error.status}</code>
            </>
          ) : null}
        </p>
      </details>
    </div>
  );
}

function IdentityList({ heading, identities }: { heading: string; identities: string[] }) {
  return (
    <div>
      <p className="muted">{heading}</p>
      <ul className="identity-list">
        {identities.map((identity) => (
          <li key={identity}>
            <code>{identity}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
