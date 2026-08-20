import assert from "node:assert/strict";
import { test } from "node:test";
import { createCorsOptions } from "./cors-origin.js";

test("allows any origin when CORS_ORIGIN is unset", () => {
  assert.deepEqual(createCorsOptions(undefined), {});
  assert.deepEqual(createCorsOptions(""), {});
  assert.deepEqual(createCorsOptions("   "), {});
});

test("uses a single configured production origin", () => {
  assert.deepEqual(createCorsOptions("https://web.example.invalid"), {
    origin: "https://web.example.invalid"
  });
});

test("accepts comma-separated origins including local development", () => {
  assert.deepEqual(
    createCorsOptions("https://web.example.invalid, http://localhost:3000 "),
    {
      origin: ["https://web.example.invalid", "http://localhost:3000"]
    }
  );
});
