"use client";

import type { ConvertResult } from "@matchcorner/contracts";
import { useState } from "react";
import { convertSlip } from "../lib/api";
import { isVerifiedConversion } from "../lib/convert-result";
import { BetslipView } from "./betslip-view";
import { BookingCodeForm } from "./booking-code-form";
import { CopyButton } from "./copy-button";
import { ErrorPanel } from "./error-panel";
import { FingerprintBlock } from "./fingerprint-block";
import { StatusBadge } from "./status-badge";

export function ConvertPanel() {
  const [bookingCode, setBookingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);

  async function submit(): Promise<void> {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setResult(await convertSlip(bookingCode.trim()));
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="panel-convert" role="tabpanel" aria-labelledby="tab-convert" className="panel">
      <div className="panel-intro">
        <h2>Convert</h2>
        <p>
          Decode the source slip, encode a new code, then re-decode and compare stable selection
          identities. A generated code is only shown as success when the API returns{" "}
          <code>verified: true</code>.
        </p>
      </div>

      <BookingCodeForm
        id="convert-booking-code"
        value={bookingCode}
        onChange={setBookingCode}
        onSubmit={() => void submit()}
        submitLabel="Convert and verify"
        loadingLabel="Converting and verifying…"
        loading={loading}
      />

      {error ? <ErrorPanel error={error} /> : null}

      {isVerifiedConversion(result) ? (
        <div className="result-stack">
          <div className="verified-banner" aria-live="polite">
            <StatusBadge tone="success">Verified</StatusBadge>
            <p>
              The new booking code contains the same semantic selections as the source. Odds and
              display names may differ.
            </p>
          </div>

          <div className="summary-row">
            <div>
              <p className="muted">Source code</p>
              <p className="mono-strong">{result.sourceCode}</p>
            </div>
            <div>
              <p className="muted">Target code</p>
              <div className="generated-code-row">
                <p className="mono-strong">{result.targetCode}</p>
                <CopyButton value={result.targetCode} />
              </div>
            </div>
            <div>
              <p className="muted">Source selections</p>
              <p>{result.sourceSelectionCount}</p>
            </div>
            <div>
              <p className="muted">Target selections</p>
              <p>{result.targetSelectionCount}</p>
            </div>
          </div>

          <div className="fingerprint-grid">
            <FingerprintBlock label="Source fingerprint" fingerprint={result.sourceFingerprint} />
            <FingerprintBlock label="Target fingerprint" fingerprint={result.targetFingerprint} />
          </div>

          <h3 className="subheading">Target canonical slip</h3>
          <BetslipView slip={result.slip} />
        </div>
      ) : null}
    </section>
  );
}
