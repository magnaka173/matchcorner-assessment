"use client";

import type { DecodedSlip } from "@matchcorner/contracts";
import { useState } from "react";
import { decodeSlip } from "../lib/api";
import { BetslipView } from "./betslip-view";
import { BookingCodeForm } from "./booking-code-form";
import { ErrorPanel } from "./error-panel";
import { FingerprintBlock } from "./fingerprint-block";

export function DecodePanel() {
  const [bookingCode, setBookingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<DecodedSlip | null>(null);

  async function submit(): Promise<void> {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setResult(await decodeSlip(bookingCode.trim()));
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="panel-decode"
      role="tabpanel"
      aria-labelledby="tab-decode"
      className="panel"
    >
      <div className="panel-intro">
        <h2>Decode</h2>
        <p>Look up a Betway Nigeria booking code and inspect the canonical slip returned by the API.</p>
      </div>

      <BookingCodeForm
        id="decode-booking-code"
        value={bookingCode}
        onChange={setBookingCode}
        onSubmit={() => void submit()}
        submitLabel="Decode slip"
        loadingLabel="Decoding…"
        loading={loading}
      />

      {error ? <ErrorPanel error={error} /> : null}

      {result ? (
        <div className="result-stack">
          <FingerprintBlock label="Slip fingerprint" fingerprint={result.fingerprint} />
          <BetslipView slip={result.slip} />
        </div>
      ) : null}
    </section>
  );
}
