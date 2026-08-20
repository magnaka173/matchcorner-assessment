# MatchCorner Technical Assessment

Betway Nigeria booking-code product: **Decode**, **Encode**, and **Convert** with mandatory round-trip verification.

The browser and Flutter client talk only to the MatchCorner API. The API owns the Betway Nigeria adapter, canonical slip mapping, fingerprint/parity checks, and PostgreSQL audit snapshots.

## Live Demo

- **Web:** https://matchcornerweb-production.up.railway.app
- **API health:** https://matchcornerapi-production.up.railway.app/api/v1/health
- **Repository:** https://github.com/magnaka173/matchcorner-assessment

A Flutter **release APK** is built locally against the public HTTPS API. It is not hosted from this repository.

## Delivered Capabilities

**Web** (Next.js workspace against the public API):

- Decode a Betway booking code into a canonical `Betslip`
- Encode canonical selections into a new Betway booking code
- Convert a source code into a new code
- Re-decode the target code and treat the conversion as success only when semantic parity verifies

**Flutter** (Android-installable Decode viewer):

- Same public API and canonical domain model as web
- Decode + betslip viewer only (no Encode/Convert UI)
- Production builds inject the API origin with `--dart-define=API_BASE_URL=...`

**Backend** (Node.js + Express):

- `BookingOperator` abstraction with a Betway Nigeria adapter
- Shared `@matchcorner/contracts` canonical types
- SHA-256 fingerprint and identity-set parity on Convert
- Prisma/PostgreSQL snapshots of canonical slips and conversion runs
- Structured `AppError` responses (no raw Betway bodies to clients)

## Quick Architecture

See [docs/architecture.md](docs/architecture.md).

Clients never call Betway. Convert is Decode → Encode → Decode → identity comparison, not “BookABet returned a code”.

## Verification Philosophy

A successful `BookABet` response is **not** considered sufficient.

Convert performs:

```text
source Decode  →  Encode  →  target Decode  →  canonical identity comparison
```

Stable selection identity:

```text
eventId + ":" + canonical marketId + ":" + selectionId
```

The slip fingerprint is SHA-256 of those identities, sorted and joined with `|`.

**Ignored (may move between Decode and re-Decode):** odds, names, timestamps, selection order, `active`, `operatorMarketId`.

**Enforced:** `eventId`, canonical exact `marketId`, `selectionId`.

## Local Development

See [docs/runbook.md](docs/runbook.md). Copy [`.env.example`](.env.example) to `.env`, install, build shared contracts, then start the API and web apps.

Flutter Decode viewer: [apps/mobile/README.md](apps/mobile/README.md).

## Testing

Automated tests cover contracts, API orchestration, Betway mapping, persistence allowlists, and web/mobile clients. External Betway and PostgreSQL boundaries are mocked. Tests do not call live Betway, depend on current booking codes or odds, or require a running database.

Live operator and UI checks are manual. See [docs/submission-evidence.md](docs/submission-evidence.md).

```bash
npm run typecheck
npm test
npm --workspace @matchcorner/web run build

cd apps/mobile
flutter analyze
flutter test
```

GitHub Actions runs the Node gates plus Flutter analyze/test and a debug APK compile. Latest green `develop` run: [CI #32339121028](https://github.com/magnaka173/matchcorner-assessment/actions/runs/32339121028).

## Deployment

- **Railway Web** and **Railway API** are separate services from this repository root (npm workspaces). Config-as-code: [`apps/api/railway.toml`](apps/api/railway.toml), [`apps/web/railway.toml`](apps/web/railway.toml). Leave the Railway Root Directory empty.
- **Railway Postgres** supplies `DATABASE_URL`. Production schema updates use `prisma migrate deploy` (never `prisma migrate dev`).
- API healthcheck: `GET /api/v1/health` (does not call Betway or query Postgres).
- Flutter release builds use the public HTTPS API origin, not localhost.

## Security

Betway traffic stays server-side. Clients do not receive operator cookies or session data. Canonical DTOs allowlist consumed fields. Audit persistence stores canonical snapshots only and refuses account/session/raw-upstream keys. Secrets live in environment variables; `.env` is not committed. Automated tests use sanitized fixtures.

Do not commit cookies, tokens, account identifiers, copied browser captures, or raw operator payloads that contain private data.

## Submission Evidence

Reviewer checklist, git history, and remaining manual attachments: [docs/submission-evidence.md](docs/submission-evidence.md).
