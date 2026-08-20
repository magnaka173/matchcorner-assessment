# Runbook

Practical local and Railway operations for the MatchCorner monorepo.

## Requirements

- Node.js 20+ (`engines.node` in the repository root; CI uses Node 20)
- npm (workspace install from the repository root)
- PostgreSQL (local development and Railway production)
- Flutter stable (CI pins `3.47.0`)
- Android SDK for Android emulator/device builds and APKs
- macOS + Xcode only if you need an iOS simulator or IPA (not delivered here)

## Install

From the repository root:

```bash
npm ci
npm --workspace @matchcorner/contracts run build
```

`@matchcorner/contracts` must be compiled to `packages/contracts/dist/` before typecheck, tests, Next.js production build, or `node dist/index.js`. Railway and GitHub Actions do this automatically.

Flutter is separate:

```bash
cd apps/mobile
flutter pub get
```

Commit `apps/mobile/pubspec.lock` — this is an application, not a Dart package.

## Environment

Copy [`.env.example`](../.env.example) to `.env`. Never commit `.env` or a production `DATABASE_URL`.

| Variable | Service | Purpose |
| --- | --- | --- |
| `PORT` | API | Listen port (local default `4000`; Railway provides this) |
| `HOST` | API | Bind address (default `0.0.0.0`) |
| `DATABASE_URL` | API | PostgreSQL connection string |
| `BETWAY_BASE_URL` | API | Betway origin (example default in `.env.example`) |
| `BETWAY_BRAND_ID` | API | Public `x-brand-id` for Betway Nigeria |
| `BETWAY_COUNTRY_CODE` | API | BookABet / FindBookABet country (example `NG`) |
| `BETWAY_CULTURE_CODE` | API | Locale (example `en-US`) |
| `BETWAY_TIMEOUT_MS` | API | Upstream timeout (optional; default `8000`) |
| `CORS_ORIGIN` | API | Optional comma-separated browser origins. Unset = allow any origin (local default). Production should include the web origin. |
| `NEXT_PUBLIC_API_BASE_URL` | Web | Public API origin **inlined at Next.js build time**. Do not bake `localhost` into a production web build. |
| `NODE_ENV` | API | `development` locally |

Flutter does not read `.env`. Pass `API_BASE_URL` with `--dart-define` (see below).

## Database

Scripts (from the repository root):

```bash
npm --workspace @matchcorner/api run prisma:generate
npm --workspace @matchcorner/api run prisma:migrate   # local only: prisma migrate dev
npm --workspace @matchcorner/api run prisma:deploy    # production: prisma migrate deploy
```

`prisma generate` does not connect to Postgres; it only needs the `DATABASE_URL` **name** present. The API `postinstall` hook also runs `prisma generate`.

**Production** schema updates use `prisma migrate deploy`. Do not run `prisma migrate dev` against Railway.

## Run API

```bash
npm run dev:api
```

That is `tsx watch` on `@matchcorner/api` (`npm --workspace @matchcorner/api run dev`).

Production-style start (what Railway runs after build):

```bash
npm --workspace @matchcorner/api run build
npm --workspace @matchcorner/api run start
```

`start` is `node dist/index.js`. Health: `GET http://localhost:4000/api/v1/health`.

## Run Web

```bash
npm run dev:web
```

That is `next dev`. Point `NEXT_PUBLIC_API_BASE_URL` at the API origin.

Production-style:

```bash
npm --workspace @matchcorner/web run build
npm --workspace @matchcorner/web run start
```

`start` binds `0.0.0.0` so Railway can reach the process.

## Flutter development

From `apps/mobile`. `API_BASE_URL` is the **MatchCorner API** origin, never a Betway URL.

| Runtime | Typical origin |
| --- | --- |
| Android emulator | `http://10.0.2.2:4000` |
| iOS Simulator / desktop | `http://localhost:4000` |
| Physical device (dev) | Reachable LAN API address, e.g. `http://192.168.x.x:4000` |
| Production / release | `https://matchcornerapi-production.up.railway.app` |

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

Debug Android allows cleartext HTTP to a local API. Release builds keep the platform HTTPS default. Do not commit a machine-specific LAN IP.

### Release APK

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://matchcornerapi-production.up.railway.app
```

Output: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk` (gitignored).

### iOS

The same Dart application and API client can target iOS. This repository includes the generated `apps/mobile/ios/` project. A distributable IPA or TestFlight build requires Apple signing, provisioning, and macOS/Xcode. **No IPA is delivered.**

## Quality gates

From the repository root (contracts `dist/` must exist; CI builds it first):

```bash
npm run typecheck
npm test
npm --workspace @matchcorner/web run build
```

Flutter:

```bash
cd apps/mobile
flutter analyze
flutter test
```

GitHub Actions additionally generates the Prisma client (dummy `DATABASE_URL`, no live Postgres) and compiles a **debug** APK with `--dart-define=API_BASE_URL=https://api.example.invalid` (compile verification only).

## Railway

- Shared **npm workspace**. Leave each service’s **Root Directory empty** so `package-lock.json` and `packages/contracts` resolve. Set config-as-code to `/apps/api/railway.toml` or `/apps/web/railway.toml`.
- Railpack installs from the repository root, then runs `buildCommand`.
- **API build:** contracts build → `prisma generate` → API `tsc`.
- **API pre-deploy:** `npm --workspace @matchcorner/api run prisma:deploy`.
- **API start:** `npm --workspace @matchcorner/api run start`.
- **API healthcheck:** `/api/v1/health` (configured in `apps/api/railway.toml`).
- **Web build:** contracts build → `next build`. `NEXT_PUBLIC_API_BASE_URL` must be set on the web service **before** the first production build.
- **Web start:** `npm --workspace @matchcorner/web run start`.
- **Web liveness:** the live Next.js app is served at `/`. `apps/web/railway.toml` does not set `healthcheckPath`.
- Postgres on the API service provides `DATABASE_URL`. Do not put Railway internal service IDs in git.

Public origins:

- Web: https://matchcornerweb-production.up.railway.app
- API: https://matchcornerapi-production.up.railway.app
