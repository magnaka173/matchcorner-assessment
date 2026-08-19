/**
 * Sanitized `FindBookABet` fixture.
 *
 * This is a hand-written minimal document that mirrors the *structure* verified
 * during reconnaissance (booking code BW69DC9F6B) — not a captured response.
 * It contains no cookies, no authorization data, no analytics identifiers and
 * no real account identifier.
 *
 * The `accountId` below is an obvious synthetic placeholder kept on purpose:
 * it lets the mapper tests prove that account data present in an upstream
 * payload never reaches the canonical slip.
 */

const SANITIZED_ACCOUNT_ID = "sanitized-placeholder-account-id";

/** Fresh object per call so a test can mutate its copy safely. */
export function findBookABetFixture(): Record<string, unknown> {
  return {
    accountId: SANITIZED_ACCOUNT_ID,
    isSingleBet: false,
    isBuildABet: false,
    unmodelledFutureField: "ignored by our schemas",
    selections: [
      {
        // Handicap selection: Betway splits the exact line into `originalMarket`.
        outcomeId: "68096464223hcp=1.5~1715",
        marketId: "68096464223hcp=1.5~",
        marketName: "Handicap",
        eventId: 68096464,
        eventName: "Connecticut Sun vs. Los Angeles Sparks",
        sportId: "Basketball",
        region: "USA",
        league: "WNBA",
        handicap: -1.5,
        isMarketActive: true,
        isEventActive: true,
        isOutcomeActive: true,
        price: {
          priceDecimal: 1.74,
          priceFractional: "37/50"
        },
        outcome: {
          outcomeId: "68096464223hcp=1.5~1715",
          eventId: 68096464,
          displayName: "Los Angeles Sparks",
          name: "Los Angeles Sparks",
          sbv: " (-1.5)",
          handicap: -1.5,
          isTradingActive: true
        },
        market: {
          marketId: "68096464223",
          displayName: "Handicap",
          name: "handicap"
        },
        originalMarket: {
          marketId: "68096464223hcp=1.5~",
          displayName: "Handicap (-1.5)",
          name: "handicap-1.5"
        },
        sportEvent: {
          eventId: 68096464,
          displayName: "Connecticut Sun vs. Los Angeles Sparks",
          name: "Connecticut Sun v Los Angeles Sparks",
          expectedStartEpoch: 1787094000,
          sportId: "Basketball",
          region: "USA",
          league: "WNBA"
        }
      },
      {
        // Money line selection: no `originalMarket`, so the market falls back.
        outcomeId: "68096586222~1714",
        marketId: "68096586222",
        marketName: "Money Line",
        eventId: 68096586,
        eventName: "Toronto Tempo vs. Indiana Fever",
        sportId: "Basketball",
        region: "USA",
        league: "WNBA",
        handicap: null,
        isMarketActive: true,
        isEventActive: true,
        isOutcomeActive: false,
        price: {
          priceDecimal: 2.05
        },
        outcome: {
          outcomeId: "68096586222~1714",
          eventId: 68096586,
          displayName: "Indiana Fever",
          name: "Indiana Fever",
          sbv: null,
          handicap: null,
          isTradingActive: true
        },
        market: {
          marketId: "68096586222",
          displayName: "Money Line",
          name: "money-line"
        },
        originalMarket: null,
        sportEvent: {
          eventId: 68096586,
          displayName: "Toronto Tempo vs. Indiana Fever",
          name: "Toronto Tempo v Indiana Fever",
          expectedStartEpoch: 1787101200,
          sportId: "Basketball",
          region: "USA",
          league: "WNBA"
        }
      }
    ]
  };
}
