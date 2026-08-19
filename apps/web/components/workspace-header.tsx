"use client";

import { useEffect, useState } from "react";
import { fetchApiHealth, getApiBaseUrl } from "../lib/api";

type Health = "checking" | "online" | "offline";

export function WorkspaceHeader() {
  const [health, setHealth] = useState<Health>("checking");
  const apiBase = getApiBaseUrl();

  useEffect(() => {
    let cancelled = false;

    async function ping(): Promise<void> {
      const ok = await fetchApiHealth();
      if (!cancelled) {
        setHealth(ok ? "online" : "offline");
      }
    }

    void ping();
    const timer = window.setInterval(() => void ping(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <header className="hero">
      <div>
        <p className="eyebrow">MatchCorner Technical Assessment</p>
        <h1>Betway Nigeria booking workspace</h1>
        <p className="lede">
          Decode an existing code, encode selections, or convert a slip with mandatory round-trip
          verification. The browser talks only to the MatchCorner API.
        </p>
      </div>
      <div className="env-card" aria-live="polite">
        <p className="muted">Environment</p>
        <p className="env-line">
          <span className={`pulse pulse-${health}`} aria-hidden="true" />
          {health === "checking" ? "Checking API" : health === "online" ? "API online" : "API unreachable"}
        </p>
        <p className="mono-small">{apiBase}</p>
      </div>
    </header>
  );
}
