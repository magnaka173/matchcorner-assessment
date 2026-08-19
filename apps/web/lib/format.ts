export function formatStartTime(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function formatOdds(odds: number): string {
  return Number.isFinite(odds) ? odds.toFixed(2) : String(odds);
}

export function shortFingerprint(fingerprint: string): string {
  if (fingerprint.length <= 16) {
    return fingerprint;
  }
  return `${fingerprint.slice(0, 8)}…${fingerprint.slice(-8)}`;
}
