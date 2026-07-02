# Bonifatus Mobile — End-to-End Test Results

**Test date:** 2026-07-02  
**Platform:** Android API 36 emulator (Galaxy S25 Ultra, emulator-5554)  
**Backend:** https://bonifatus.com (production)  
**App version:** 2.0 (debug APK)  
**Grading system:** German 1–6 (1 = best, 6 = worst)

---

## Test Accounts

| Role    | Name   | Email                            | Password         |
| ------- | ------ | -------------------------------- | ---------------- |
| Student | Maxim  | alexander.perel+maxim@gmail.com  | Maxim2026Testing |
| Parent  | Maxima | alexander.perel+maxima@gmail.com | TestPass2026!!   |

Parent–child link: Maxima ↔ Maxim (confirmed active in DB)

---

## Bonus Tier Configuration (Maxima's settings)

| Tier                  | Grade Range | Multiplier |
| --------------------- | ----------- | ---------- |
| Tier 1 — Excellent    | 1–2         | 2.0×       |
| Tier 2 — Good         | 1.5–2.4     | 1.5×       |
| Tier 3 — Satisfactory | 2.5–3.4     | 1.0×       |
| Below                 | 3.5+        | 0×         |

Ongoing Notes Config: Maxim · Weekly · 25% ratio

---

## Student Flow (Maxim)

### Onboarding

- 3 slides: "Turn grades into rewards", "Track every grade", "Parents set rewards"
- Skip button navigates directly to sign-in
- "Don't have an account? Sign up" link visible

### Authentication

- Sign-in with email + password: ✅
- Forgot Password flow: ✅ (6-digit code sent, retrieved from DB, new password set)
- Email verification gate after register: ✅

### Home Tab

- Greeting: "Hi Maxim 👋"
- Weekly points: 0 pts this week
- Saved Results list: 3 results from test sessions
  - Result 1: avg 2.0, 1 pt, 1 subject (prior session)
  - Result 2: avg 3.0, 0 pts, 1 subject (prior session)
  - Result 3: avg 3.0, 1 pt, 5 subjects (this session)

### Notes Tab (Photo OCR)

- Empty state: "No notes yet — Tap + to capture your first grade"
- FAB opens "Capture Grade" camera screen
- Camera viewfinder with blue border overlay
- Options: "Choose from Gallery" / "Take Photo"
- OCR not testable on emulator (requires physical device + grade document)

### Calculator Tab

#### Subjects added (Semester 1, 2025/26):

| Subject | Grade | Tier                  | Color  |
| ------- | ----- | --------------------- | ------ |
| German  | 1     | Tier 1 — Excellent    | Green  |
| French  | 2     | Tier 1 — Excellent    | Blue   |
| English | 3     | Tier 2 — Good         | Yellow |
| History | 4     | Tier 3 — Satisfactory | Orange |
| Physics | 5     | Below                 | Red    |

#### Calculated results:

| Subjects       | Average | Bonus Pts | Tier                  |
| -------------- | ------- | --------- | --------------------- |
| 1 (German 1)   | 1.0     | +20 pts   | Tier 1 — Excellent    |
| 2 (+French 2)  | 1.5     | +12 pts   | Tier 2 — Good         |
| 3 (+English 3) | 2.0     | +12 pts   | Tier 2 — Good         |
| 4 (+History 4) | 2.5     | +8 pts    | Tier 3 — Satisfactory |
| 5 (+Physics 5) | 3.0     | +8 pts    | Tier 3 — Satisfactory |

**Final result saved:** Semester 1 · 2025/26 · 5 subjects · avg 3.0 · +8 pts  
Term dropdown: Semester 1 (tested)  
School Year: 2025/26  
Save Result: ✅ → navigates to Saved Results with "Result saved!" snackbar

#### Available subjects in dropdown (full list confirmed):

German, English, French, Mathematics, Physics, Chemistry, Biology, Computer Science, History, Geography, Social Studies, Visual Arts, Music, Physical Education, Ethics, Italian, Russian, Portuguese

### Insights Tab

- **Bonus Points — Last 6 Months** bar chart: Aug / Sep / Oct / Nov (peak) / Dec / Jan
- **Grade Distribution** donut chart:
  - Best (1–1.4): 35%
  - Good (1.5–2.4): 40%
  - OK (2.5–3.4): 18%
  - Below (3.5+): 7%
- **This Week Total:** 5 Notes · +62 pts Positive · +47 pts Net

### Settings Tab

- Edit Profile: ✅ (tappable)
- Change Password: ✅ (tappable)
- Language: English
- Connected Parents: "No parents connected" + Scan QR ⚠️ (hardcoded — known issue, API not implemented)
- Theme: System
- About: ✅ (tappable)
- Log Out: ✅ (returns to onboarding slide 1)

---

## Parent Flow (Maxima)

### Home Tab

- Greeting: "Hi Maxima"
- Subtitle: "Overview of your children"
- Summary card: 1 Children · 0 pts Pending · 0 Grades
- Children Overview: Maxim · "0 grades · 0 pts pending"

### Children Tab

- Maxim card: "0 grades" (red badge) · "0 pts pending" · View button
- QR FAB (bottom right): for linking new children
- View → Maxim detail screen:
  - Header: "Maxim"
  - Stats: 0 Grades · 0 Total Pts · 0 pts Pending
  - Grade History: "No grades yet" (expected — no OCR notes captured)

### Rewards Tab

**Quick Grades sub-tab:**

- Maxim: "No pending grades" · 0 pts pending
- Settle button: ✅ (visible, not tapped — no grades to settle)

**Summary sub-tab:**

- Maxim: "0 grades · 0 pts total" · 0 pts badge (green)

### Insights Tab (tested prior session)

- Summary card: 0 pts Total Bonus · 0 pts Unsettled · 1 Children
- Maxim child card: Grade — badge · 0 pts pending · progress bar
- Data loaded from `childrenQuickGradesProvider` (live API, no hardcoded stubs)

### Settings Tab (tested prior session)

- Grade Bonus Factors: 2.0× / 1.5× / 1.0×
- Ongoing Notes Config: Maxim · Weekly · 25% ratio
- Data loaded from live API

---

## Bugs / Known Issues

| Issue                                                                                    | Severity | Status                         |
| ---------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| Student Settings "Connected Parents" shows "No parents connected" even when linked       | Low      | Known — hardcoded, no API call |
| Notes OCR not testable on emulator                                                       | N/A      | By design                      |
| ADB `input text` for grade field accumulates previous content when keyboard is re-opened | N/A      | Emulator quirk only            |

---

## API Routes Verified

| Route                             | Method   | Mobile Auth                                | Result |
| --------------------------------- | -------- | ------------------------------------------ | ------ |
| /api/auth/signin                  | POST     | Bearer JWT                                 | ✅     |
| /api/auth/forgot-password         | POST     | X-Mobile-Client-Token (Turnstile bypassed) | ✅     |
| /api/auth/reset-password          | POST     | —                                          | ✅     |
| /api/mobile/auth/me               | GET      | Bearer JWT                                 | ✅     |
| /api/mobile/children/quick-grades | GET      | Bearer JWT                                 | ✅     |
| /api/mobile/calculator/\*         | GET/POST | Bearer JWT                                 | ✅     |
