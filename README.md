# MatchCorner Technical Assessment

Small full-stack product for Betway Nigeria booking-code workflows.

## Assessment scope

The target product supports:

- **Decode** — Betway booking code → normalized betslip
- **Encode** — selections → new Betway booking code
- **Convert** — existing booking code → new code for the same bet
- **Verify** — re-decode the generated code and compare stable selection identities
- **Web** — browser UI for the booking-code workflows
- **Mobile** — Flutter betslip viewer
- **Auditability** — clear Git history, documentation and verification evidence

## Repository layout

```text
apps/
  api/          Node.js + Express + TypeScript API
  web/          Next.js + TypeScript web app
  mobile/       Flutter betslip viewer (Decode only)

packages/
  contracts/    Shared canonical betslip contracts

docs/           Architecture and investigation notes
```

## First-commit goal

This commit intentionally contains only the project skeleton, shared conventions and a health endpoint.

Betway-specific Decode / Encode / Convert logic is added in later commits so the Git history shows the implementation workflow clearly.

## Local setup

1. Copy `.env.example` to `.env`.
2. Install dependencies.
3. Start the API and web apps.

```bash
npm install
npm run dev:api
npm run dev:web
```

See `apps/mobile/README.md` to run the Flutter Decode viewer.

## Testing

Automated tests mock the Betway operator and PostgreSQL boundaries. They do not call live Betway, depend on current booking codes or odds, or require a running database.

Live Betway verification is intentionally manual.

Fingerprints ignore live odds, names, timestamps and availability flags. They enforce stable `eventId` + canonical `marketId` + `selectionId` identity.

```bash
npm run typecheck
npm test
npm --workspace @matchcorner/web run build

cd apps/mobile
flutter analyze
flutter test
```

## CI and Deployment

GitHub Actions (`.github/workflows/ci.yml`) runs on pull requests and on pushes to `main` and `develop`. Node jobs typecheck, test, and build the web app with mocked operator/database boundaries. Flutter jobs analyze, test, and compile a debug APK against a dummy API origin (`https://api.example.invalid`) — compile verification only.

API and web deploy as **separate Railway services** from this repository root (npm workspaces). Point each service’s config-as-code file at `/apps/api/railway.toml` or `/apps/web/railway.toml`, and leave the Root Directory empty so the lockfile and `packages/contracts` resolve.

Railway Postgres supplies `DATABASE_URL`. `npm ci` / Railpack install runs `prisma generate` via the API `postinstall` script. Production schema updates use `prisma migrate deploy` (never `prisma migrate dev`). The API healthcheck is `GET /api/v1/health` and does not call Betway.

Required production variables:

- API: `DATABASE_URL`, `PORT` (Railway-provided), `BETWAY_BASE_URL`, `BETWAY_BRAND_ID`, `BETWAY_COUNTRY_CODE`, `BETWAY_CULTURE_CODE`. Optional: `HOST` (default `0.0.0.0`), `CORS_ORIGIN`, `BETWAY_TIMEOUT_MS`.
- Web: `NEXT_PUBLIC_API_BASE_URL` (public HTTPS API origin; inlined at build time). Railway provides `PORT`.

A distributable Flutter APK should use `--dart-define=API_BASE_URL=<public HTTPS API origin>`.

## Security

Do not commit:

- browser cookies
- authorization/session tokens
- raw account identifiers
- copied browser cURL captures
- `.env`
- raw operator-response fixtures containing private data

Use sanitized fixtures only.
