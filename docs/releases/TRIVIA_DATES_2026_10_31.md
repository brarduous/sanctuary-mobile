# Trivia dates and Pro archive — October 31, 2026

Shared results display MM/DD/YYYY (for example, 10/31/2026) and always link to https://sanctuaryapp.us/trivia. Opening that link selects the viewer’s current local date; no query variable is required. A dated archive link remains usable by signed-in Pro users.

Web and mobile offer previous/next navigation and a Today action. The web date picker caps selection at today. Future or invalid web links resolve to today. Today is free; past dates require a current Pro profile. The API checks the authenticated user's subscription_tier, rejects future dates, and returns only today by default. Upcoming offline bundles are no longer supplied. Direct question reads enforce the same archive and local-date boundary.

Validation: both clients typecheck; seven daily-set tests cover all 64 share patterns, date formatting, calendar validity, day boundaries and matching web/mobile output. All 207 backend tests pass, including actual SQL-backed Pro/free/guest archive reads, ignored client entitlement hints, downgrade rejection, future reads and bundle filtering. Browser checks cover today without a query, future-link normalization, disabled forward navigation and the guest archive gate. No production account tier was changed for testing.

## Deployment and distribution

The [website](https://sanctuaryapp.us/trivia) and API are live from the merged default branches. Production checks confirm exactly three items for today (HTTP 200), a Pro-required archive response for guests (403), and rejection of future dates (400). Older direct question links resolve with the viewer’s session/timezone and show a Pro sign-in gate to guests. New shares show `Sanctuary Trivia · 10/31/2026` and end with the clean `/trivia` URL.

iOS **1.2.12 (69)** is **Waiting for Review**, automatically released after approval. It supersedes the earlier screenshot-only build 68 while keeping all five corrected screenshots. The signed IPA retains the production API/database and existing Google OAuth clients and URL scheme. [Apple receipt](qa/2026-10-31-trivia-dates/apple-review.json) · [Artifact checks](qa/2026-10-31-trivia-dates/ios-69-artifact.json).

The approved five-image Google Play screenshot change was published. Global managed publishing remains on. Android **1.2.12 (140)** was submitted successfully to the **production** track. Play Console shows **Running quick checks**; it will send the release for review automatically after those checks pass. Managed publishing requires the final publication after approval. [Submission receipt](qa/2026-10-31-trivia-dates/eas-android-submission.json) · [Console](qa/2026-10-31-trivia-dates/google-140-checks.jpg) · [Signed AAB audit](qa/2026-10-31-trivia-dates/android-140-artifact.json).

[Release evidence and verification limits](qa/2026-10-31-trivia-dates/release.json) · [Live default game](qa/2026-10-31-trivia-dates/production-today.jpg) · [Web share text](qa/2026-10-31-trivia-dates/web-share-date.jpg) · [Native share preview](qa/2026-10-31-trivia-dates/native-share-date.jpg). The isolated archive completion test confirms past games save their original puzzle date and the actual play date; an archive play does not count as a release-day perfect-set streak.
