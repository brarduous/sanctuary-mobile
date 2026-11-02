# Mobile production status — November 2, 2026

Checked approximately 9:43–9:45 a.m. America/New_York. Read-only audit: no store publication, notification preference, rollout, or production data was changed.

## Distribution

| Surface | Observation | Evidence |
| --- | --- | --- |
| iOS US storefront | Public **1.2.12**. Release `2026-11-01T00:30:51Z` = **October 31, 8:30:51 p.m. EDT**. Notes describe Trivia dates/sharing, free today, Pro archive, and refreshed screenshots. | [Public listing](https://apps.apple.com/us/app/sanctuary-daily-faith-focus/id6757966099), rendered version 1.2.12; [Apple lookup](https://itunes.apple.com/lookup?id=6757966099&country=us), checked `2026-11-02T14:43:08Z`. |
| Google Play production | **139 (1.2.11) · Trivia** is **Available on Google Play**, released October 31. **1.2.12**, code **140**, is **Ready to publish**. Managed publishing is on; one approved Production change says “Start full rollout.” | Authenticated [release rows](https://play.google.com/console/u/0/developers/8715406039218746780/app/4974619440589159854/tracks/production?tab=releases) and [publishing overview](https://play.google.com/console/u/0/developers/8715406039218746780/app/4974619440589159854/publishing). The header's “Latest release: 1.2.12” alone does not establish public availability. |
| Trivia API | HTTP 200, `enabled: true`, three items dated `2026-11-02`, positions 1, 2, 3. | Public [daily-set endpoint](https://api.sanctuaryapp.us/api/v1/discoveries/bundle?dailySet=1&timeZone=America%2FNew_York), checked `2026-11-02T14:44:33Z`. |

App Store Connect required sign-in; public lookup/listing establish iOS version availability. Existing [iOS artifact evidence](qa/2026-10-31-trivia-dates/ios-69-artifact.json) supplies the build-69/source mapping. No fresh physical-device install was performed. Google status comes from its authenticated console.

The [October 31 submission record](TRIVIA_DATES_2026_10_31.md) is historical evidence; its review/quick-check states are superseded by this audit.

## Source versus shipped artifacts

- Local and remote mobile `main`: `c3d32b5d8d64ee6a079915925c1c99ae1d92097c`, confirmed with `git ls-remote origin refs/heads/main`.
- Submitted 1.2.12 runtime source: `dc17c7ab9a73ee5ca9c5900c20af963715c6988b`. Receipts: [iOS 69](qa/2026-10-31-trivia-dates/ios-69-artifact.json), [Android 140](qa/2026-10-31-trivia-dates/android-140-artifact.json). Later main commits merge the change and record release evidence.
- Pre-existing uncommitted work adds a reading period before countdown, saved 20-second round compatibility, haptic feedback, and news TL;DR/Christian-assessment display. Inspected and preserved; these changes are not in the submitted binaries.
- EAS uses remote versioning. Local `app.json` build values differ from store numbers; actual store/artifact receipts are authoritative.

## Product findings

- Tabs: Home, Bible, conditional My Church, Guidance, News. A direct Trivia addition would give members six tabs.
- Home puts Trivia after Scripture, reflection, prayer, and signed-in guidance. Its existing card supports unstarted/partial/completed results.
- `lib/discoveryDailySet.ts` defines streaks as perfect 3/3 days. Participation-based reminders need a shared new rule.
- Profile already has separate Trivia consent. Backend migration `20261028230000_discovery_reminders.sql` seeds a disabled 18:00-local category. Dispatcher code enforces quiet hours and six-hour spacing. **Live reminder settings and delivery were not queried or verified.**
- Backend `services/discoveryReminders.js` selects legacy single-question schedule/completion and links to a question. Daily-three reminders need set-level selection/suppression and the daily-set route. This is a source finding, not a production delivery trial.
- Shared result URLs use `/trivia`; Android link filters declare `/join` and `/discoveries`. Installed-app `/trivia` behavior remains unverified.

## Working-tree validation

Completed successfully November 2:

- `npm run typecheck`
- `npm run check:behavior` — ten scripts, including preservation checks across 4,756 Bible chapters.
- `npm run test:discoveries` — **24 passed**.
- `npm run test:content-share` — **3 passed**.

Checks include pre-existing uncommitted work. They do not prove those changes shipped, backend timing migrations deployed, or physical-device purchase/restore, giving, accessibility, and native push delivery passed. Module-type and deprecated test-renderer warnings remain nonblocking. Previously deferred physical-device QA is not reinstated by this audit.

See [mobile roadmap](../../MOBILE_ROADMAP.md).
