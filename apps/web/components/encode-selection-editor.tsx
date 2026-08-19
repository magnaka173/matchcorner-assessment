"use client";

import type { BetType } from "@matchcorner/contracts";
import type { EncodeDraftRow } from "../lib/encode-validation";
import { emptyEncodeRow } from "../lib/encode-validation";

export function EncodeSelectionEditor({
  betType,
  onBetTypeChange,
  rows,
  onChange,
  disabled
}: {
  betType: BetType;
  onBetTypeChange: (betType: BetType) => void;
  rows: EncodeDraftRow[];
  onChange: (rows: EncodeDraftRow[]) => void;
  disabled: boolean;
}) {
  function updateRow(key: string, field: keyof Omit<EncodeDraftRow, "key">, value: string): void {
    onChange(rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  }

  function removeRow(key: string): void {
    const next = rows.filter((row) => row.key !== key);
    onChange(next.length > 0 ? next : [emptyEncodeRow()]);
  }

  return (
    <div className="stack">
      <fieldset className="segmented" disabled={disabled}>
        <legend>Bet type</legend>
        <label>
          <input
            type="radio"
            name="betType"
            value="single"
            checked={betType === "single"}
            onChange={() => onBetTypeChange("single")}
          />
          Single
        </label>
        <label>
          <input
            type="radio"
            name="betType"
            value="multi"
            checked={betType === "multi"}
            onChange={() => onBetTypeChange("multi")}
          />
          Multi
        </label>
      </fieldset>

      <ol className="encode-rows">
        {rows.map((row, index) => (
          <li key={row.key} className="encode-row">
            <p className="encode-row-label">Selection {index + 1}</p>
            <div className="encode-fields">
              <div className="field">
                <label htmlFor={`eventId-${row.key}`}>eventId</label>
                <input
                  id={`eventId-${row.key}`}
                  value={row.eventId}
                  disabled={disabled}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="numeric event id"
                  onChange={(event) => updateRow(row.key, "eventId", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`operatorMarketId-${row.key}`}>operatorMarketId</label>
                <input
                  id={`operatorMarketId-${row.key}`}
                  value={row.operatorMarketId}
                  disabled={disabled}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="parent market id"
                  onChange={(event) => updateRow(row.key, "operatorMarketId", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`selectionId-${row.key}`}>selectionId</label>
                <input
                  id={`selectionId-${row.key}`}
                  value={row.selectionId}
                  disabled={disabled}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="outcome id"
                  onChange={(event) => updateRow(row.key, "selectionId", event.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="button button-secondary button-compact"
              disabled={disabled || rows.length === 1}
              onClick={() => removeRow(row.key)}
            >
              Remove
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="button button-secondary"
        disabled={disabled}
        onClick={() => onChange([...rows, emptyEncodeRow()])}
      >
        Add selection
      </button>
    </div>
  );
}
