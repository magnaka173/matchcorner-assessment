# MatchCorner mobile

Flutter betslip viewer for the MatchCorner technical assessment.

This app **decodes** a Betway Nigeria booking code by calling the MatchCorner
backend only. It does not talk to Betway, and it does not implement Encode or
Convert.

## Prerequisites

- Flutter SDK (stable)
- A running MatchCorner API (`npm run dev:api` from the repo root)
- For a device/emulator build: Android SDK, or Xcode on macOS for iOS

## How to run

From `apps/mobile`:

```bash
flutter pub get
```

Commit the generated `pubspec.lock` — this is an application, not a Dart package.

```bash
flutter run --dart-define=API_BASE_URL=<reachable-api-url>
```

`API_BASE_URL` is the MatchCorner API origin, **not** a Betway URL. It must be
reachable from the emulator or physical device:

| Runtime | Typical origin |
| --- | --- |
| iOS Simulator / desktop | `http://localhost:4000` |
| Android emulator | `http://10.0.2.2:4000` |
| Physical device | `http://<LAN-IP-of-the-API-host>:4000` |

Do not commit a machine-specific IP into source. Pass it at run/build time.

If `API_BASE_URL` is omitted, the app falls back to `http://localhost:4000`.

### HTTP on a physical iOS device

The iOS Simulator can reach `http://localhost:4000`. A physical iPhone talking
to a LAN `http://` origin may be blocked by App Transport Security. Use HTTPS
or a development ATS exception locally; do not weaken production ATS defaults
in this repository.

### HTTP on Android

Flutter's **debug** Android manifest already allows cleartext HTTP so local
development against `http://10.0.2.2:4000` works. Release/production builds
keep the platform default (HTTPS). Do not globally weaken network security for
shipped builds.

## Analyze and test

```bash
flutter analyze
flutter test
```

## Android APK

```bash
flutter build apk --debug \
  --dart-define=API_BASE_URL=<reachable-api-url>
```

The debug APK is written to `build/app/outputs/flutter-apk/app-debug.apk`.

## iOS

The same Dart code supports iOS, and this repository includes the generated
iOS project under `ios/`.

Producing a distributable IPA or TestFlight build requires Apple
signing/provisioning and an appropriate macOS/Xcode environment. This
assessment commit does not perform signing and does not produce an IPA.

## Scope

Implemented:

- Booking-code Decode against `POST /api/v1/slips/decode`
- Canonical slip, selection cards, stable identifiers, fingerprint
- Loading / success / normalized error states

Not in this commit:

- Encode / Convert
- Authentication
- Firebase App Distribution
