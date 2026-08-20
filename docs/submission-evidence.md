# Submission evidence

Reviewer-facing checklist. Items below are backed by this repository, public URLs, or a recorded GitHub Actions run. Screenshots and device recordings that are **not** in git are listed separately — they are not invented here.

## Public URLs

| What | URL |
| --- | --- |
| Web | https://matchcornerweb-production.up.railway.app |
| API | https://matchcornerapi-production.up.railway.app |
| API health | https://matchcornerapi-production.up.railway.app/api/v1/health |
| GitHub | https://github.com/magnaka173/matchcorner-assessment |
| GitHub Actions | https://github.com/magnaka173/matchcorner-assessment/actions |
| Green CI on `develop` (`fix(build): compile shared contracts for production`) | https://github.com/magnaka173/matchcorner-assessment/actions/runs/32339121028 |

There is **no** public APK download URL in this repository. The release APK is a local Flutter artifact.

## Requirements coverage

| Requirement | Implementation | Evidence |
| --- | --- | --- |
| Decode | `BookingService.decodeBookingCode` → Betway `FindBookABet` → canonical `DecodedSlip`. Web Decode tab; Flutter Decode screen. | [`apps/api/src/services/booking.service.ts`](../apps/api/src/services/booking.service.ts), [`apps/api/src/routes/slips.ts`](../apps/api/src/routes/slips.ts), web Decode panel, [`apps/mobile/lib/api/matchcorner_api.dart`](../apps/mobile/lib/api/matchcorner_api.dart), mocked API/Flutter tests |
| Encode | `BookingService.encodeSelections` → Betway `BookABet` using `operatorMarketId`. Web Encode tab. | Mapper `mapToBookABetRequest`, encode route Zod schema, encode operator tests |
| Convert | Decode source → require active selections and `operatorMarketId` → Encode → Decode target → parity. | `convertBookingCode`, convert tests, web Convert panel |
| Round-trip parity | Success body is only returned when fingerprints match. Failures throw `CONVERSION_PARITY_FAILED` (HTTP 422). | [`packages/contracts/src/parity.ts`](../packages/contracts/src/parity.ts), `booking.convert.test.ts`, ConvertResult `verified: true` in [`packages/contracts/src/convert.ts`](../packages/contracts/src/convert.ts) |
| Canonical slip | Shared `@matchcorner/contracts` `Betslip` / `Selection`; `marketId` vs `operatorMarketId` kept distinct. | [`packages/contracts/src/betslip.ts`](../packages/contracts/src/betslip.ts), mapper tests, fingerprint tests |
| PostgreSQL persistence | Prisma `SlipSnapshot` and `ConversionRun`; canonical JSON only. Railway API `preDeployCommand` runs `prisma migrate deploy`. | [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma), [`apps/api/railway.toml`](../apps/api/railway.toml), persistence allowlist tests |
| Public web deployment | Railway web service, Next.js `start` on `0.0.0.0`. | https://matchcornerweb-production.up.railway.app (workspace loads; API origin shown as the public API) |
| Public API deployment | Railway API service, `node dist/index.js`. | https://matchcornerapi-production.up.railway.app/api/v1/health → `{"ok":true,"service":"matchcorner-api"}` |
| GitHub CI | `.github/workflows/ci.yml` on PRs and pushes to `main` / `develop`. | [Run 32339121028](https://github.com/magnaka173/matchcorner-assessment/actions/runs/32339121028) (`completed` / `success` on `develop`) |
| Flutter APK | Same Dart app; release build injects public HTTPS API via `--dart-define`. CI compiles a debug APK against a dummy origin. | [apps/mobile/README.md](../apps/mobile/README.md), [runbook.md](runbook.md), Flutter job in `ci.yml`. APK files are gitignored (`apps/mobile/build/`) |
| Physical Android verification | Installable Android application in `apps/mobile`. | **Not stored in this repository.** Attach a device screenshot/video externally (see below). |
| Betway UI verification | Reconnaissance Convert produced `BW69DC9F6B`; 4/4 identity match; loaded in Betway’s UI (18 Aug 2026 notes). Fingerprint locked in tests. | [betway-integration.md](betway-integration.md), [`packages/contracts/src/fingerprint.test.ts`](../packages/contracts/src/fingerprint.test.ts). That booking code is a historical sports slip and may no longer decode live. Attach a **current** Betway UI screenshot externally if re-verified. |
| Documentation | README, architecture, runbook, integration notes, this file. | [`README.md`](../README.md), [architecture.md](architecture.md), [runbook.md](runbook.md) |
| Git history | Linear feature commits on `develop` (see below). | `git log --oneline` |

`GET /api/v1/health` does **not** query Postgres or call Betway. It proves the API process is up, not that a given booking code still exists.

## Development history

From `git log --oneline --decorate -15` on `develop` (newest first):

```text
3b4ba8e fix(build): compile shared contracts for production
95a3a88 ci: add quality gates and Railway deployment config
e769119 test: add booking-code contract and parity coverage
42ff868 feat(mobile): add Flutter betslip viewer
75af1ac feat(mobile): add Flutter betslip viewer
c154028 feat(web): add decode encode convert workspace
dece238 feat(db): persist slip snapshots and conversion audits
156c53e feat(api): convert slips with parity verification
aa4cc7d feat(api): encode selections into Betway booking codes
3d13178 feat(api): decode Betway booking codes
ed60c72 feat(core): define canonical betslip contract
4483e7b docs: capture Betway booking-code investigation
04b5132 chore: bootstrap full-stack assessment monorepo
```

`main` is the investigation commit (`4483e7b`). Feature work and CI/production follow on `develop`.

Progression: bootstrap → investigation notes → canonical contract → decode → encode → convert → database → web → mobile → tests → CI/Railway config → production shared-contracts compile fix → documentation (this submission).

Hashes are from the repository at documentation time. They are not rewritten here.

## Manual evidence to attach externally

This repository has **no screenshot/video directory of product proof**. Do not look for invented filenames. Attach the following outside git (zip, email, or drive) if the assessor wants visual confirmation:

1. GitHub Actions green run (or use the public Actions URL above)
2. Railway API service **Active**
3. Railway Web service **Active**
4. Railway Postgres attached to the API (no connection strings)
5. Web Convert result showing `verified: true` and matching fingerprints
6. Generated booking code accepted in **Betway’s own UI**
7. Physical Android app showing a canonical Decode slip against the public HTTPS API
8. Optional 5-minute walkthrough recording

If you later add files under [`docs/evidence/`](evidence/README.md), use real captures only and strip cookies, tokens, and account identifiers.

## CI pipeline (as implemented)

**Node job** (`ci.yml`): checkout → Node 20 → `npm ci` → `npm --workspace @matchcorner/contracts run build` → `prisma generate` (dummy `DATABASE_URL`) → `npm run typecheck` → `npm test` → `npm --workspace @matchcorner/web run build` with `NEXT_PUBLIC_API_BASE_URL=https://api.example.invalid`.

**Flutter job**: checkout → Java 17 → Flutter `3.47.0` stable → `flutter pub get` → `flutter analyze` → `flutter test` → `flutter build apk --debug --dart-define=API_BASE_URL=https://api.example.invalid`.

Deployment is **not** triggered from GitHub Actions. Railway uses the toml files above.
