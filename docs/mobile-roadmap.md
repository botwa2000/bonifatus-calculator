# Mobile Expansion Audit and Milestone Plan

This document captures the current state of the web app, what can be reused for mobile, the gaps to close, and a set of milestones to deliver an Android/iOS app that mirrors the existing functionality while using the same Supabase backend.

## Current State (Web)

- **Stack**: Next.js 15 (App Router) with TypeScript, Tailwind, Radix/shadcn UI pieces, Framer Motion; Supabase backend with RLS and migrations in `supabase/migrations`; API routes in `app/api/*`; PWA setup planned (next-pwa dependency) but not yet configured.
- **Domain logic**: Bonus calculator is decoupled and reusable (`lib/calculator/engine.ts`). Database types are generated (`types/database.ts`). Email templates and services live in `lib/email/*`.
- **Auth/security**: Supabase Auth with password login and verification codes (`app/api/auth/*`), Cloudflare Turnstile bot check (`lib/auth/turnstile.ts`), session middleware (`middleware.ts`, `lib/supabase/middleware.ts`), idle logout guard (`components/auth/IdleLogoutGuard.tsx`), security event logging RPC calls.
- **Features in UI**: Student dashboard and calculator (`components/student/StudentWorkspace.tsx`, `app/student/*`), parent invites and QR codes (`app/parent/children/page.tsx`), grade storage/listing endpoints (`app/api/grades/*`), parent-child connections (`app/api/connections/*`).
- **Client data layer**: Uses fetch against Next API routes and Supabase client wrappers (`lib/supabase/*`). Browser clients assume `window`/`localStorage`. QR scanning uses browser libraries (`@zxing/browser`), QR generation uses `qrcode.react`.
- **Testing/tooling**: Vitest + React Testing Library + Playwright configured in package.json, but no test suites exist yet. Husky/lint-staged set up for lint/format.

## Reuse vs. Rewrite

- **Strong reuse**: Supabase schema and RLS policies; all migrations; Next API route handlers (they already expose JSON APIs usable by mobile if CORS/auth are handled); calculator engine; shared types (`types/database.ts`), validation schemas; email templates/services; security event logging RPCs.
- **Needs adaptation**:
  - Supabase client config relies on browser storage (`localStorage`) via `@supabase/ssr`; React Native will need `@supabase/supabase-js` with `AsyncStorage/MMKV` and no `next/headers`.
  - Turnstile requires a web widget; mobile needs an alternative (native bot mitigation or server-side rate limiting + device fingerprint).
  - UI components are web/DOM-specific (Radix primitives, Next routing, qrcode.react, @zxing/browser). Navigation, form components, and animations must be rebuilt with React Native equivalents.
  - API access currently assumes same-origin cookies; mobile should use token-based auth (supabase access/refresh tokens) and explicit Authorization headers.
  - Env config is web-centric (`NEXT_PUBLIC_*`); mobile will need its own env handling and build-time config per environment.
  - No CORS headers or mobile error envelopes are defined; must be validated before consumption by native clients.

## Gaps to Close Before/While Adding Mobile

- Create a shared package for domain logic (calculator, validation, constants, API client types) to avoid duplication between web and mobile.
- Define and document the mobile API surface (auth, grades CRUD, connections/invites) with request/response contracts and error codes.
- Add CORS and auth token handling to API routes (or expose Supabase REST directly with row-level security) to allow cross-origin mobile requests.
- Replace Turnstile dependency for mobile flows (e.g., server-side rate limiting + risk scoring; or mobile-friendly CAPTCHA).
- Provide a storage-agnostic Supabase client factory (web uses cookies/localStorage, mobile uses AsyncStorage/MMKV).
- Swap QR/scan libraries for mobile equivalents (e.g., expo-camera/barcode-scanner) and expose invite codes as plain strings for copy/paste fallback.
- Add telemetry/monitoring hooks that work on mobile (Sentry/LogRocket-equivalent) and secure secret management (no secrets in the bundle).

## Milestones

1. **Repo Prep & Shared Core (1-2 days)**
   - Create a `packages/shared` (or similar) workspace for `lib/calculator/engine.ts`, validation helpers, constants, and API TypeScript types.
   - Add an `api-client` module (fetch wrappers) that the web app can consume now; ensure responses are typed and portable.
   - Introduce a platform-agnostic Supabase client factory interface (web + future mobile implementations).
2. **API Readiness for Mobile (1-2 days)**
   - Add CORS handling and explicit auth header support to `app/api/*` routes.
   - Ensure all mobile-needed endpoints exist: auth (register/login/verify/resend), grades CRUD, factor/config retrieval, parent-child invites, connections, and summaries.
   - Harden rate limiting and security event logging for mobile traffic; document error codes.
3. **Mobile Scaffold (React Native/Expo) (1-2 days)**
   - Scaffold `apps/mobile` with Expo (recommended given React stack) using TypeScript, React Navigation, and Tailwind-RN or styled components.
   - Implement Supabase client with AsyncStorage/MMKV and link to the shared API client/types.
   - Add env config per stage (dev/staging/prod) and CI jobs for mobile lint/typecheck.
4. **Auth & Onboarding (2-3 days)**
   - Implement login/register/reset flows mirroring `app/api/auth/*`, with secure token storage and session refresh.
   - Replace Turnstile with mobile-friendly mitigations (server-side rate limits + device signals, or native CAPTCHA if required).
   - Add role-aware navigation (parent vs. child) and session/idle handling.
5. **Feature Parity: Grades & Connections (3-5 days)**
   - Port the calculator UI using the shared engine; implement grade entry, factor selection, and result breakdown.
   - Implement saved grades list/detail using `app/api/grades/*`; include offline-friendly caching with react-query + persistence.
   - Build parent flows: invite code creation/acceptance, QR display/scan (mobile scanner), child grade summaries.
6. **Mobile UX Polish & Release (3-5 days)**
   - Add push notifications (expo-notifications) for invites/rewards, biometric unlock for parents, and deep links for invite acceptance.
   - Optimize performance (bundle size, image handling), accessibility, and localization parity with web.
   - Set up E2E tests (Detox/Appium), release artifacts (APK/AAB, IPA/TestFlight), store assets, privacy policy links, and crash/error reporting.

## Immediate Next Actions

- Decide on the mobile framework (Expo/React Native aligns best with current React codebase).
- Stand up the shared workspace and API client to enable incremental reuse.
- Add CORS + token auth support to the existing API routes and validate endpoints against the planned mobile flows.
- Plan the Turnstile replacement for native flows and choose the mobile storage layer for Supabase sessions.
