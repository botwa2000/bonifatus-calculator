# Store privacy answers — source of truth

Single source for the App Store "App Privacy" answers, the Google Play "Data safety" form,
the iOS privacy manifest (`mobile/ios/Runner/PrivacyInfo.xcprivacy`) and the privacy policy
(`messages/*.json` → `privacy`, `cookiePolicy`). Change them together.

Last reviewed: 2026-10-31 (first-party usage statistics + Firebase Analytics flags).

## What the apps collect

| Data                                                                                                                                                | Where it goes                                             | Linked to the account  | Purpose                              | Retention                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------- | ------------------------------------ | --------------------------------------------------------- |
| Name, email address                                                                                                                                 | Our server (Hetzner, DE)                                  | Yes                    | Account, sign-in                     | Until account deletion                                    |
| Grades, subjects, rewards, settlements (user content)                                                                                               | Our server                                                | Yes                    | App functionality                    | Until account deletion                                    |
| Random installation ID (16 hex chars, generated on the device)                                                                                      | Our server                                                | Yes, once signed in    | Request signing, usage statistics    | 13 months / account deletion                              |
| App interactions: screens opened, features used and their outcome, app version, platform, language; country from the network (never the IP address) | Our server (`/api/t`, `action_log`)                       | Yes, once signed in    | Analytics                            | 13 months / account deletion                              |
| In-app feedback (rating, optional comment), one-tap scan rating                                                                                     | Our server; app rating also emailed to info@bonifatus.com | Yes, once signed in    | App functionality (customer support) | Comment text 30 days, rating 13 months / account deletion |
| Screen views and app usage with a random app-instance ID                                                                                            | Google Analytics for Firebase                             | No (no user ID is set) | Analytics                            | Google Analytics retention setting                        |
| Play Install Referrer (utm_source / medium / campaign of the store link, Android only, first open)                                                  | Our server                                                | Yes, once signed in    | Analytics (where installs come from) | 13 months / account deletion                              |

Not collected: advertising ID (Android `AD_ID` permission removed, `google_analytics_adid_collection_enabled=false`;
iOS IDFV collection off, no AdSupport / ATT), precise or coarse location, contacts, photos (report-card photos are
recognised on the device and never uploaded), IP addresses for statistics, device fingerprints.
No data is sold or used for advertising; nothing is used for tracking across apps or websites.

## App Store Connect → App Privacy

- Data used to track you: **None**.
- Data linked to you:
  - Contact Info → Name, Email Address — App Functionality
  - User Content → Other User Content (grades, rewards) — App Functionality
  - User Content → Customer Support (feedback) — App Functionality
  - Identifiers → Device ID (random install ID) — Analytics, App Functionality
  - Usage Data → Product Interaction — Analytics
- Data not linked to you:
  - Usage Data → Product Interaction (Firebase Analytics) — Analytics
- Privacy manifest: `PrivacyInfo.xcprivacy` declares the linked types above, `NSPrivacyTracking=false`,
  UserDefaults reason `CA92.1`.

## Google Play Console → Data safety

- Data collected and shared: shared **No** (Google Analytics for Firebase acts as our service provider).
- Encrypted in transit: **Yes**. Users can request deletion: **Yes** (in-app "Delete account" and bonifatus.com).
- Personal info → Name, Email address — collected, required, App functionality, Account management.
- App activity → App interactions — collected, required, Analytics.
- App activity → Other user-generated content (grades, feedback) — collected, optional for feedback, App functionality.
- Device or other IDs → collected (random install ID / app-instance ID), required, Analytics.
- Location, financial info, photos, contacts, messages, audio, health, files: **not collected**.

## Families / Kids

- Play: the app targets families (parents and children). Firebase Analytics is used with advertising-ID collection
  and ad personalization disabled; no ads SDK is present.
- App Store: not in the Kids category. Children's settings put the feedback form (free text) behind a parental gate
  (multiplication question); the one-tap scan rating carries no free text.

## Website (bonifatus.com)

- Essential cookies only, until the visitor consents to analytics in the cookie banner.
- With consent: Google Analytics 4 (`_ga`, `_ga_<ID>`; Google Signals and ad personalization off) and a random
  ID in localStorage (`bonifatus-usage-id`) for our own statistics.
- Without consent: our own statistics count visits with a daily-rotating salted hash; nothing is stored on the device.
