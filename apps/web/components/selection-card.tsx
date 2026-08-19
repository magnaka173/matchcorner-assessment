import type { Selection } from "@matchcorner/contracts";
import { formatOdds, formatStartTime } from "../lib/format";
import { StatusBadge } from "./status-badge";

export function SelectionCard({ selection, index }: { selection: Selection; index: number }) {
  const regionLeague = [selection.region, selection.league].filter(Boolean).join(" · ");
  const startTime = formatStartTime(selection.startTime);

  return (
    <article className="selection-card">
      <header className="selection-card-head">
        <h3>
          <span className="muted">#{index + 1}</span> {selection.eventName || "Unnamed event"}
        </h3>
        <StatusBadge tone={selection.active ? "success" : "warning"}>
          {selection.active ? "Active" : "Unavailable"}
        </StatusBadge>
      </header>

      <dl className="meta-grid">
        <div>
          <dt>Market</dt>
          <dd>{selection.marketName || "—"}</dd>
        </div>
        <div>
          <dt>Selection</dt>
          <dd>{selection.selectionName || "—"}</dd>
        </div>
        <div>
          <dt>Odds</dt>
          <dd>{formatOdds(selection.odds)}</dd>
        </div>
        <div>
          <dt>Sport</dt>
          <dd>{selection.sport || "—"}</dd>
        </div>
        {regionLeague ? (
          <div>
            <dt>Competition</dt>
            <dd>{regionLeague}</dd>
          </div>
        ) : null}
        {startTime ? (
          <div>
            <dt>Start</dt>
            <dd>{startTime}</dd>
          </div>
        ) : null}
      </dl>

      <details className="technical">
        <summary>Stable identifiers</summary>
        <dl className="id-list">
          <div>
            <dt>eventId</dt>
            <dd>
              <code>{selection.eventId}</code>
            </dd>
          </div>
          <div>
            <dt>marketId</dt>
            <dd>
              <code>{selection.marketId}</code>
            </dd>
          </div>
          <div>
            <dt>operatorMarketId</dt>
            <dd>
              <code>{selection.operatorMarketId || "—"}</code>
            </dd>
          </div>
          <div>
            <dt>selectionId</dt>
            <dd>
              <code>{selection.selectionId}</code>
            </dd>
          </div>
        </dl>
      </details>
    </article>
  );
}
