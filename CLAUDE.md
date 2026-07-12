# Bonifatus — Development Principles

## Production-grade mindset

Every code change, bug fix, or feature must meet the same bar as a production app shipped to paying users. There are no exceptions. Children and parents depend on this app working correctly. Treat every PR as if you are personally responsible for the store release.

## Mobile testing is mandatory — no code-only review

**Never mark any mobile change as done without running it on the Pixel_8_Phone emulator.**

Code review is insufficient. In this project, silent runtime failures that passed code review included:

- `FlutterActivity` vs `FlutterFragmentActivity` (biometric silently broken)
- `logout()` not clearing JWT (auto-login on reopen — users saw their data after signing out)
- Inactivity timeout missing entirely (feature existed in code but was never wired in)

### Testing emulator setup

```powershell
# Launch emulator (Pixel 8, phone form factor — NOT Lala_Tablet which is tablet only)
flutter emulators --launch Pixel_8_Phone

# Wait for boot
adb -e wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done; echo booted'

# Build and install
cd mobile
flutter build apk --debug
adb install -r build\app\outputs\flutter-apk\app-debug.apk

# Launch
adb -s emulator-5554 shell am start -S -n com.bonifatus.app/.MainActivity
```

### Mandatory test protocol for auth-related changes

Run all steps in order. Screenshot every state transition.

1. **Fresh login**: email + password → verify home screen, correct user name
2. **Logout**: Settings → Log Out → verify login screen appears
3. **Kill + reopen**: `adb shell am force-stop com.bonifatus.app` then relaunch → must show login screen, NOT dashboard (proves token was cleared)
4. **Inactivity**: reduce timeout to 1 min in code, wait → verify auto-logout fires
5. **Biometric** (if changed): enroll fingerprint in emulator Extended Controls, enable in Settings, logout, reopen → biometric button must appear on login screen

### ADB interaction

```powershell
# Tap
adb -s emulator-5554 shell input tap X Y
# Type
adb -s emulator-5554 shell input text "text"
# Tab (next field, keyboard-safe)
adb -s emulator-5554 shell input keyevent 61
# Enter / submit
adb -s emulator-5554 shell input keyevent 66
# Screenshot
adb -s emulator-5554 exec-out screencap -p > screen.png
# UIAutomator dump (get exact element coordinates)
adb -s emulator-5554 shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml ui.xml
```

**DO NOT use Galaxy_S25_Ultra** — screencap returns all-black (Samsung proprietary GPU), am start fails with Error type 3.

### Test credentials

- Student: `alexander.perel+maxim@gmail.com` / `TestMaxim2026`
- Parent: `alexander.perel@gmail.com` / (check memory)

## Localization — no hardcoded strings

All user-visible text must use `AppLocalizations.of(context)!.<key>`. No hardcoded English strings in widgets. This includes:

- Error messages and SnackBar content
- Button labels and titles
- Empty states and placeholders
- Dialog content

Add new keys to ALL six ARB files (`app_en.arb`, `app_de.arb`, `app_es.arb`, `app_fr.arb`, `app_it.arb`, `app_ru.arb`) then run `flutter gen-l10n`.

## Data — no placeholder or mocked data in production paths

Every screen must display real data from the database. If an API call fails, show a proper error state — never fall back to fake/demo data on non-web builds.

The `kIsWeb && kDebugMode` guard in providers is the ONLY acceptable place for demo data. All other code paths must call real APIs.

## Full screen audit checklist

Before releasing any build, verify each screen:

- [ ] All text uses l10n (grep for hardcoded strings in widget tree)
- [ ] Loading state shown while fetching data
- [ ] Error state shown if fetch fails (not empty list, not silent)
- [ ] Empty state shown if fetch returns zero results (not loading spinner forever)
- [ ] Real data from DB — not hardcoded values or demo data
- [ ] Navigation works correctly in both student and parent roles
- [ ] Dark mode renders correctly
- [ ] German locale renders correctly (longest strings, tests overflow)

## Never bump pubspec.yaml version

Codemagic sets the build number. Each version bump requires a new App Store review cycle. Do not change `version:` in `mobile/pubspec.yaml` under any circumstances.

## CI/CD — releasing to stores

```powershell
gh workflow run flutter-release.yml -f platform=both -f track=alpha
```

Monitor: `gh run view <run_id>`

Both jobs must succeed:

- `Build & publish Flutter Android` → Google Play alpha
- `Build & publish Flutter iOS (Codemagic)` → Codemagic build triggered

## Architecture quick reference

- **Auth**: JWT via `/api/mobile/auth/signin` → stored in `FlutterSecureStorage` (`access_token`)
- **Biometric**: `biometric_enabled` flag + `biometric_jwt` snapshot in `FlutterSecureStorage`; snapshot taken when user enables biometric in Settings; survives explicit logout; cleared when biometric disabled or JWT expires
- **Router guard**: `_AuthListenable` on `authStateNotifierProvider`; redirect to `/auth/login` when unauthenticated
- **Inactivity**: `InactivityGuard` wraps both `student_shell.dart` and `parent_shell.dart`; 15-min timer, resets on any pointer event
- **Parent dashboard grades**: `/api/parent/children/quick-grades` combines `quickGrades` (Notes feature) + `subjectGrades` from `termGrades` (Calculator feature) so children using either feature appear with correct counts
