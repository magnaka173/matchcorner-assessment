Quality gates: [`ci.yml`](ci.yml) (Node typecheck/test/web build, Flutter analyze/test/debug APK).

Node job: `npm ci`, compile `@matchcorner/contracts`, `prisma generate`, `npm run typecheck`, `npm test`, Next.js production build.

Flutter job: `flutter pub get`, `flutter analyze`, `flutter test`, debug APK compile against `https://api.example.invalid`.

Railway services are configured in `apps/api/railway.toml` and `apps/web/railway.toml`. Deployment is not triggered from GitHub Actions.

See [docs/runbook.md](../../docs/runbook.md) and [docs/submission-evidence.md](../../docs/submission-evidence.md).
