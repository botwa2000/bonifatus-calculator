## Homepage Demo Calculator & Profile Rollout

### Goals

- Embed a frictionless demo calculator on the homepage to show value instantly.
- Gate persistence behind auth (“Save & Track”), supporting parents with multiple children and multi-year history.
- Keep grading systems and multipliers sourced from the database (no hard-coded scales).
- Add role-aware profile pages for parents and students.

### What’s Implemented Now

- New config endpoint (DB-backed, no hard-coded scales or multipliers):
  - `GET /api/config/calculator` → grading systems, bonus factor defaults, and a small subject list (public, cacheable).

### Data Sources to Use (no hard-coding)

- `grading_systems` (active, ordered) for scale names, best/worst, and definitions.
- `bonus_factor_defaults` for class level, term type, and grade tier multipliers; overlay with `user_bonus_factors` when authenticated.
- `subjects` (non-custom, active) for quick subject search/select in the demo.
- `term_grades` + `subject_grades` for persistence once authenticated (server-side calculation to prevent tampering).

### UX Plan for the Homepage Demo

- Hero: left = headline/value prop; right = embedded demo calculator card (mobile: demo sits below headline).
- Inputs: grading system picker (localized), class level, term type, subject rows (subject search + grade + optional weight), “Add subject”, “Use sample data”.
- Output: real-time bonus total + short breakdown (“normalize → tier → multipliers → floor at 0”), with a “How it’s calculated” accordion.
- CTA: “Save & Track” opens signup/login; note that demo is not saved until authenticated.
- When logged in: show child selector (parent) or fixed child (student), school year + term fields, and “Save term” to persist.

### Implementation Steps (next)

1. Shared calculation utility
   - Input: grading system definition + factor set (defaults + overrides) + subject entries.
   - Output: per-subject normalized grade, tier, bonus, and total (with floor at zero).
   - Use server-side calc for persistence (prevents tampering).
2. Config fetch on the homepage
   - Call `GET /api/config/calculator` on load; cache client-side.
   - Localize labels/examples in the picker.
3. DemoCalculator component (marketing page)
   - Build UI shell with grading system picker, factor selectors, subject rows, result card, and “Save & Track” CTA.
   - Add “sample data” button to populate a quick scenario.
   - Use DB-fed grading systems to drive grade dropdowns; subjects are searchable; weight field labeled as importance multiplier.
4. Auth gate for saving
   - If unauthenticated, CTA opens auth modal with return URL back to the calculator.
   - If authenticated, show child selector (parent) and persist via `POST /api/grades/save` (to be added) that runs server-side calc and writes `term_grades` + `subject_grades`.
5. Profile pages (parent/student)
   - Parent: name/email/language/timezone/notifications; linked children list; security info.
   - Student: name/language/timezone; linked parents list; minimal settings.
   - Protect routes; role-aware rendering.
6. QA
   - Demo works without auth; save blocked until login.
   - Factors and grading systems are loaded from DB, not hard-coded.
   - Mobile layout and localized labels verified.

### Next Tasks to Pick Up

- Add calculator shared utility (server + client-safe wrapper).
- Add `POST /api/grades/save` with server-side calculation and persistence.
- Build `DemoCalculator` component and embed in the homepage hero.
- Scaffold profile routes/pages with role-aware data fetch/update.
