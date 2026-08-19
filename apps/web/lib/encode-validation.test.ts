import assert from "node:assert/strict";
import { test } from "node:test";
import { validateEncodeDraft, type EncodeDraftRow } from "./encode-validation";

function row(overrides: Partial<EncodeDraftRow> = {}): EncodeDraftRow {
  return {
    key: "row-1",
    eventId: "73466978",
    operatorMarketId: "73466978223",
    selectionId: "73466978223hcp=1.5~1715",
    ...overrides
  };
}

test("accepts a single bet with exactly one complete selection", () => {
  const result = validateEncodeDraft("single", [row()]);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.input, {
      betType: "single",
      selections: [
        {
          eventId: "73466978",
          operatorMarketId: "73466978223",
          selectionId: "73466978223hcp=1.5~1715"
        }
      ]
    });
  }
});

test("rejects a single bet with more than one selection", () => {
  const result = validateEncodeDraft("single", [row(), row({ key: "row-2", eventId: "68096464" })]);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /exactly one selection/i);
  }
});

test("accepts a multi bet with two complete selections", () => {
  const result = validateEncodeDraft("multi", [
    row(),
    row({ key: "row-2", eventId: "68096464", operatorMarketId: "68096464223", selectionId: "68096464223hcp=1.5~1715" })
  ]);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.input.betType, "multi");
    assert.equal(result.input.selections.length, 2);
  }
});

test("rejects a multi bet with fewer than two selections", () => {
  const result = validateEncodeDraft("multi", [row()]);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /at least two selections/i);
  }
});

test("rejects missing operatorMarketId after trim", () => {
  const result = validateEncodeDraft("single", [row({ operatorMarketId: "   " })]);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /operatorMarketId/i);
  }
});

test("rejects a non-integer eventId", () => {
  const result = validateEncodeDraft("single", [row({ eventId: "not-a-number" })]);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /eventId must be a finite integer/i);
  }
});
