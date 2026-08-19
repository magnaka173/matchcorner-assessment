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

## Security

Do not commit:

- browser cookies
- authorization/session tokens
- raw account identifiers
- copied browser cURL captures
- `.env`
- raw operator-response fixtures containing private data

Use sanitized fixtures only.
