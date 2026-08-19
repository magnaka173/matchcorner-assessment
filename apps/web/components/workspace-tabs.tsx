"use client";

import type { KeyboardEvent } from "react";

export type WorkspaceTab = "decode" | "encode" | "convert";

const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "decode", label: "Decode" },
  { id: "encode", label: "Encode" },
  { id: "convert", label: "Convert" }
];

export function WorkspaceTabs({
  value,
  onChange
}: {
  value: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const current = TABS.findIndex((tab) => tab.id === value);
    if (current < 0) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = TABS[(current + delta + TABS.length) % TABS.length];
      if (next) {
        onChange(next.id);
      }
    }

    if (event.key === "Home") {
      event.preventDefault();
      const first = TABS[0];
      if (first) {
        onChange(first.id);
      }
    }

    if (event.key === "End") {
      event.preventDefault();
      const last = TABS[TABS.length - 1];
      if (last) {
        onChange(last.id);
      }
    }
  }

  return (
    <div className="tabs" role="tablist" aria-label="Booking-code workflows" onKeyDown={onKeyDown}>
      {TABS.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={selected ? "tab tab-active" : "tab"}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
