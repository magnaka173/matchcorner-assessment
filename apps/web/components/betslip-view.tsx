import type { Betslip } from "@matchcorner/contracts";
import { SelectionCard } from "./selection-card";
import { StatusBadge } from "./status-badge";

export function BetslipView({ slip }: { slip: Betslip }) {
  return (
    <section className="stack" aria-label="Canonical betslip">
      <div className="summary-row">
        <div>
          <p className="muted">Booking code</p>
          <p className="mono-strong">{slip.bookingCode}</p>
        </div>
        <div>
          <p className="muted">Operator</p>
          <p>{slip.operator}</p>
        </div>
        <div>
          <p className="muted">Bet type</p>
          <p>{slip.betType}</p>
        </div>
        <div>
          <p className="muted">Selections</p>
          <p>{slip.selections.length}</p>
        </div>
        {slip.isBuildABet ? <StatusBadge>Build-a-bet</StatusBadge> : null}
      </div>

      <div className="selection-list">
        {slip.selections.map((selection, index) => (
          <SelectionCard key={`${selection.eventId}:${selection.marketId}:${selection.selectionId}:${index}`} selection={selection} index={index} />
        ))}
      </div>
    </section>
  );
}
