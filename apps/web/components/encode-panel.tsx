"use client";

import type { BetType, EncodedSlip } from "@matchcorner/contracts";
import { useState } from "react";
import { encodeSlip } from "../lib/api";
import { emptyEncodeRow, validateEncodeDraft, type EncodeDraftRow } from "../lib/encode-validation";
import { CopyButton } from "./copy-button";
import { EncodeSelectionEditor } from "./encode-selection-editor";
import { ErrorPanel } from "./error-panel";

export function EncodePanel() {
  const [betType, setBetType] = useState<BetType>("single");
  const [rows, setRows] = useState<EncodeDraftRow[]>([emptyEncodeRow("selection-1")]);
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<EncodedSlip | null>(null);

  async function submit(): Promise<void> {
    setError(null);
    setClientMessage(null);

    const validated = validateEncodeDraft(betType, rows);
    if (!validated.ok) {
      setClientMessage(validated.message);
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      setResult(await encodeSlip(validated.input));
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="panel-encode" role="tabpanel" aria-labelledby="tab-encode" className="panel">
      <div className="panel-intro">
        <h2>Encode</h2>
        <p>
          Create a new booking code from operator identifiers. Use the parent <code>operatorMarketId</code>,
          not the exact line-level market id.
        </p>
      </div>

      <EncodeSelectionEditor
        betType={betType}
        onBetTypeChange={setBetType}
        rows={rows}
        onChange={setRows}
        disabled={loading}
      />

      <button type="button" className="button button-primary" disabled={loading} onClick={() => void submit()}>
        {loading ? "Generating booking code…" : "Generate booking code"}
      </button>

      {clientMessage ? (
        <div className="error-panel" role="alert">
          <p className="error-title">Check the encode form</p>
          <p>{clientMessage}</p>
        </div>
      ) : null}

      {error ? <ErrorPanel error={error} /> : null}

      {result ? (
        <div className="generated-code">
          <p className="muted">Generated code</p>
          <div className="generated-code-row">
            <p className="mono-strong">{result.bookingCode}</p>
            <CopyButton value={result.bookingCode} />
          </div>
          <p className="hint">This tab does not verify the code. Use Convert for a round-trip parity check.</p>
        </div>
      ) : null}
    </section>
  );
}
