"use client";

import type { FormEvent } from "react";

export function BookingCodeForm({
  id,
  value,
  onChange,
  onSubmit,
  submitLabel,
  loadingLabel,
  loading
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  loadingLabel: string;
  loading: boolean;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!loading) {
      onSubmit();
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor={id}>Booking code</label>
        <input
          id={id}
          name="bookingCode"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="BW..."
          value={value}
          disabled={loading}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <button type="submit" className="button button-primary" disabled={loading || value.trim().length === 0}>
        {loading ? loadingLabel : submitLabel}
      </button>
    </form>
  );
}
