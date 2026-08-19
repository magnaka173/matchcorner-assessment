import assert from "node:assert/strict";
import { test } from "node:test";
import { betwayDecodeUrl, betwayEncodeUrl, loadBetwayConfig, BETWAY_DECODE_PATH, BETWAY_ENCODE_PATH } from "./betway.config.js";

test("falls back to the documented public Betway Nigeria configuration", () => {
  const config = loadBetwayConfig({});

  assert.equal(config.baseUrl, "https://www.betway.com.ng");
  assert.equal(config.brandId, "f8a8d16a-d619-4b49-aa8c-f21211403c92");
  assert.equal(config.countryCode, "NG");
  assert.equal(config.cultureCode, "en-US");
  assert.equal(config.timeoutMs, 8_000);
});

test("reads every value from the environment", () => {
  const config = loadBetwayConfig({
    BETWAY_BASE_URL: "https://betway.example/",
    BETWAY_BRAND_ID: "another-brand",
    BETWAY_COUNTRY_CODE: "GH",
    BETWAY_CULTURE_CODE: "en-GB",
    BETWAY_TIMEOUT_MS: "1500"
  });

  assert.equal(config.baseUrl, "https://betway.example");
  assert.equal(config.brandId, "another-brand");
  assert.equal(config.countryCode, "GH");
  assert.equal(config.cultureCode, "en-GB");
  assert.equal(config.timeoutMs, 1500);
});

test("builds the FindBookABet url from the configured base url", () => {
  assert.equal(
    betwayDecodeUrl(loadBetwayConfig({})),
    `https://www.betway.com.ng${BETWAY_DECODE_PATH}`
  );
});

test("builds the BookABet url from the configured base url", () => {
  assert.equal(
    betwayEncodeUrl(loadBetwayConfig({})),
    `https://www.betway.com.ng${BETWAY_ENCODE_PATH}`
  );
});

test("rejects an unusable base url instead of starting with a broken operator", () => {
  assert.throws(() => loadBetwayConfig({ BETWAY_BASE_URL: "not-a-url" }), /Invalid Betway configuration/);
});
