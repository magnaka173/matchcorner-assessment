import { CopyButton } from "./copy-button";
import { shortFingerprint } from "../lib/format";

export function FingerprintBlock({
  label,
  fingerprint
}: {
  label: string;
  fingerprint: string;
}) {
  return (
    <div className="fingerprint">
      <div className="fingerprint-head">
        <span className="muted">{label}</span>
        <CopyButton value={fingerprint} label="Copy hash" />
      </div>
      <code className="fingerprint-value" title={fingerprint}>
        {shortFingerprint(fingerprint)}
      </code>
    </div>
  );
}
