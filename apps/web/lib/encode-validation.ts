import type { BetType, EncodeSelection, EncodeSlipInput } from "@matchcorner/contracts";

export interface EncodeDraftRow {
  key: string;
  eventId: string;
  operatorMarketId: string;
  selectionId: string;
}

export function emptyEncodeRow(key = crypto.randomUUID()): EncodeDraftRow {
  return {
    key,
    eventId: "",
    operatorMarketId: "",
    selectionId: ""
  };
}

export function validateEncodeDraft(
  betType: BetType,
  rows: EncodeDraftRow[]
): { ok: true; input: EncodeSlipInput } | { ok: false; message: string } {
  const selections: EncodeSelection[] = [];

  for (const [index, row] of rows.entries()) {
    const eventId = row.eventId.trim();
    const operatorMarketId = row.operatorMarketId.trim();
    const selectionId = row.selectionId.trim();
    const label = `Selection ${index + 1}`;

    if (!eventId || !operatorMarketId || !selectionId) {
      return { ok: false, message: `${label} needs eventId, operatorMarketId and selectionId.` };
    }

    if (!Number.isFinite(Number(eventId)) || !Number.isInteger(Number(eventId))) {
      return { ok: false, message: `${label}: eventId must be a finite integer.` };
    }

    selections.push({ eventId, operatorMarketId, selectionId });
  }

  if (betType === "single" && selections.length !== 1) {
    return { ok: false, message: "A single bet must contain exactly one selection." };
  }

  if (betType === "multi" && selections.length < 2) {
    return { ok: false, message: "A multi bet must contain at least two selections." };
  }

  return { ok: true, input: { betType, selections } };
}
