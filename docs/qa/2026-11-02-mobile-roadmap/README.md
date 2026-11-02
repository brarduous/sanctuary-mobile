# Mobile roadmap — first implementation slice

November 2, 2026. Local implementation of M03–M04 and the visibility correction in M07, plus the requested News refresh on Home and the feed. This is an uncommitted working-tree candidate based on `c3d32b5`, not a submitted or published release. Store status remains the dated [production audit](../../releases/PRODUCTION_STATUS_2026_11_02.md).

## Behavior

- Home has one compact, permanent Trivia card between the greeting and Scripture. It shows the current local day's full three-question set, partial progress, actual completed score/squares, cached/offline status, loading, or retry. Yesterday's cache never supplies today's results. Completed sets use a quieter action.
- The card opens the daily-set overview. That screen chooses the next unanswered question and retains the separate explicit Start action before a timed round. Guest import stays explicit; progress continues to use the existing account-scoped store/outbox.
- Foreground refresh detects a changed local date before applying the 15-minute bundle throttle. Existing minute-level foreground checks still cover local midnight and timezone changes.
- Tabs are Home, Bible, Guidance, conditional My Church, More. Members see five tabs; guests/nonmembers see four. News keeps its existing `/news` route, mounted tab state, filters and readers, with a hidden tab button and an explicit return to More. Tab back behavior uses history.
- More provides Games (the existing daily Trivia overview, results and Pro archive), Videos, News, Profile/settings, notification preferences, and membership-aware church entry. There are no empty future-game categories.
- Videos reuses the existing recommendation endpoint, Profile preferences, and external-player behavior. Guest sign-in, empty recommendations, loading and retry are distinct. Refresh can retain current-account content; stale account/blurred requests cannot replace it.
- Notification preferences link to the existing Profile controls. No notification consent, scheduler, reminder timing, delivery, or streak rule changes are included.

## News design follow-up

The user explicitly requested a more appealing News section on **both Home and the feed** during this implementation.

- Home replaces the long, undifferentiated recap with a real lead-story image, complete headline, short factual preview, and Read & reflect action. A separate daily-briefing row opens the recap in the feed. Optional lead-story loading never blocks Scripture/reflection; failures retain the existing invitation to browse News.
- The feed uses the same story component for a featured lead and smaller supporting cards. Headlines wrap fully; preview text is deliberately excerpted at word boundaries. Category and publication time are real API metadata, without invented popularity or reading-time labels. Broken images retain their reserved geometry and a branded fallback.
- The briefing now renders (its former header function was unused), expands only on request, and preserves the full synopsis, Scripture and prayer. Home’s briefing shortcut expands it explicitly.
- A few current topic chips sit beside an Explore topics button. The searchable sheet retains access to every existing topic and selected-state labels without rendering hundreds of chips in the main feed.
- Search is presented across all news because the existing search endpoint does not combine category filters or accept page numbers. Selecting a topic clears that search explicitly. Search results do not paginate into duplicates; ordinary feed pagination deduplicates IDs. Refresh retains the chosen topic/search and stale topic/account responses are discarded.
- Existing detail routes, TL;DR/Christian assessment edits, Scripture overlays, listening and sharing behavior are preserved.
- The standard bottom tab bar receives only visible routes while the navigator retains legacy routes. This fixes native announcements of “1 of 6” for four visible tabs and keeps More selected while viewing News. `@react-navigation/bottom-tabs` 7.10.1 was already installed transitively; it is now declared directly, with the existing lock entry retained.

`npm run test:news` — **4 passed**: current/legacy previews and dates; independent Home loading, superseded responses and destinations; full titles/image fallback geometry; topic races, refresh preservation, search pagination and topic-sheet selection.

## Measurement

`card_viewed` now requires at least half the card, or half a smaller viewport for enlarged text, to intersect the Home viewport while focused and foregrounded. Counts are deduplicated per account/local day/entry surface for the app process, including remounts. The on-device deduplication key is never sent. There is no persistent identifier added to the existing aggregate payload.

Home/Games entry parameters are carried to the overview for navigation context. Entry-source storage, opens/starts/set-completion events, cohort retention analysis, and a production baseline remain M07 work. The existing backend metric schema does not store entry source. Historical mount-based impressions cannot be presented as a visibility baseline. No baseline or retention improvement is claimed.

Candidate source hashes and Hermes bundle receipts are in [provenance.json](provenance.json). The source index includes the preserved pre-existing runtime edits.

## Automated evidence

- `npm run typecheck` — passed.
- Final-source production Hermes exports — passed for iOS (`entry-9039136374a1aabbd7d76fd83a42894e.hbc`) and Android (`entry-dcc67631a049435d14d46bb70b9d2d53.hbc`), each 46.5 MB. Commands use `npx expo export --platform ios|android --max-workers 1` and ignored `node_modules/.cache/roadmap-*-export` directories. No signed IPA/AAB or store upload was produced.
- `npm run check:behavior` — all ten existing scripts passed, including auth and entitlement isolation, native-action guards, contrast, and 4,756 Bible chapters.
- `npm run test:discoveries` — 24 passed, including the pre-existing reading-time/legacy-round and haptic work.
- `npm run test:content-share` — 3 passed.
- `npm run test:roadmap` — 8 passed: Home states/overview navigation/exposure deduplication, More destinations, video account-race/error/empty/guest handling, viewport thresholds, background/tab visibility, midnight refresh, member/nonmember tab configuration, and the recommendation API’s strict/fallback contracts.
- Backend `node --test test/integration/discoveryDailySets.test.js` — 11 passed against isolated PostgreSQL, including free today / verified Pro archive / blocked future sets.
- Backend `node --test --test-name-pattern='timed results' test/integration/discoveries.test.js` — passed against isolated PostgreSQL. It accepts new answers through 39,999 ms and both 20,000/40,000 ms timeout events after the reading-time migration, preserves canonical results, and rejects invalid timing.

Existing Node module-type, deprecated test-renderer and Express router warnings are nonblocking. No test uses production accounts or payments.

## Existing work and release limits

The pre-existing changes to question reading time, legacy saved-round restoration, haptics, and News TL;DR/Christian assessment are preserved. Source timing compatibility is verified with `20261101120000_discovery_reading_time.sql`; **production deployment of that migration is not established by these checks** and must precede a native release containing 40-second events. Do not silently package these edits as a documentation-only change.

M01 publication is a separate release action. M02 purchase/restore, donation/webhook, invite and shared-link runtime evidence remains open. Participation streaks (M05), evening-reminder set eligibility/consent/rollout (M06), and broader measurement (M07) remain subsequent work. The existing perfect-set streak label is unchanged on results.

## Native QA

An unsigned iOS Simulator Debug build succeeded with `xcodebuild`, using the existing workspace/scheme and two compiler workers. The first highly concurrent build was interrupted after memory pressure; the incremental retry succeeded. It is a development binary loading current working-tree JavaScript through Metro, not a signed release artifact.

The previous Sanctuary QC simulator no longer existed. Created two isolated iOS 26.5 devices: Sanctuary Roadmap QA (iPhone SE 3, `533229A8-7BEC-4BD5-AAA5-4EBEDB20284C`) and Sanctuary Roadmap Large QA (iPhone 17, `D85CBE40-DB8D-427A-A360-7DCD6B6739E3`). The other project's simulator was not used.

The local API on port 4013 uses the existing in-memory PostgreSQL test harness and synthetic daily-set fixtures. Only allowlisted public News GETs are forwarded to production, with no authentication headers. Guest Scripture uses the existing public devotional path. No production account or completion was copied or written. The fixture initially lacked `/log-activity`, producing a development LogBox warning; that local endpoint was stubbed to discard activity and return 204, and the warning was dismissed. This does not verify production activity logging. No fixture or URL override was added to shipping source or `.env` files.

Observed:

- Home's unstarted Trivia invitation is immediately below the greeting and above Scripture, on compact and larger devices. The larger viewport also shows the full Scripture card. Reflection is present below it in the native accessibility tree; its visual acceptance is not closed.
- More's Games/Videos/News rows render in light/dark. Native navigation announces four tabs for the guest and keeps More selected in News, fixing the six-route count seen during the first review.
- The News feed loads public imagery and complete headlines. Opening a story reaches the existing reader with TL;DR/assessment and Scripture links; Back returns to the retained feed. The briefing expands and collapses.
- At extra-extra-extra-large system text, News headings and controls reflow, the searchable topic sheet remains readable, and selecting Health dismisses it and loads Health stories. Default text and light appearance were restored afterward. Maximum accessibility text, VoiceOver/TalkBack and reduced-motion runtime behavior are not signed off.

| Capture | Scope |
| --- | --- |
| [Home, larger light](home-large-light.png) | Initial Trivia and Scripture placement |
| [More, larger light](more-large-light.png), [dark](more-large-dark.png) | Permanent destinations and shared surfaces |
| [News story, compact light](news-story-se-light.png), [dark](news-story-se-dark.png) | Complete lead card, image, summary and reading action |
| [News, larger light](news-large-light.png) | Final feed header and lead card |
| [News, larger dark/enlarged](news-large-dark-enlarged.png) | Selected topic and scaled controls |
| [Topics, larger dark/enlarged](news-topics-large-dark-enlarged.png) | Searchable topic sheet |

[First compact review](news-se-first-review.png) is historical: the final header is shorter and has the separate topic-sheet button. Do not use it as final-layout evidence.

Remaining native acceptance: Home's lower News section is present in the native tree and reuses the visually inspected story card, but a settled on-screen Home-news capture was not obtained. Signed-in Videos/loading/retry, the Profile notification anchor, guest import, native partial/completed/offline Trivia and actual midnight transitions have automated/source coverage or historical evidence, not fresh native sign-off in this pass. M03/M04 remain open where their acceptance requires that evidence.

Simulator evidence does not establish physical push receipt, Play-signed Google sign-in, installed/uninstalled domain verification, or VoiceOver/TalkBack. Those hardware-only gaps remain deferred. Temporary Metro/API services and the new QA devices are stopped after this pass; their saved test-only data stays isolated.

## 1.2.13 candidate follow-through

Runtime source `701b150` includes the subsequent shared play-streak rule, attributed metrics, explicit consent and reading/haptic work. Fresh native review on the larger QA simulator completed an incorrect answer, a reveal, and a 40-second timeout. The resulting 0/3 score earned a **1-day play streak**. Home correctly showed 2/3 partial progress, then the quiet completed state. Terminating/relaunching with the isolated API deliberately stopped restored the completed result with “Saved on this device · connect to refresh.” The test API was restarted after that check, then stopped at cleanup. Guest mode showed no reminder consent or OS permission prompt. Account switching/consent remain automated evidence, not a new signed-in native walkthrough.

Captures: [partial Home](home-partial-large-light.png), [completed daily set](trivia-completed-large-light.png), [completed Home after offline restart](home-completed-offline-large-light.png), and [web reading introduction](web-trivia-reading-intro.png). This supersedes the earlier absence of fresh partial/completed/offline evidence; local midnight, signed-in Videos and Profile anchor still lack new native visual sign-off.

The unsigned simulator binary produced Expo Notifications’ persisted-registration Keychain error at module import. Its entitlement dump is empty. The actual signed App Store IPA **1.2.13 (70)** was downloaded and inspected separately: application identifier `QKQ2WNHKWS.us.sanctuaryapp.app`, team `QKQ2WNHKWS`, production APS entitlement, and no get-task-allow. This establishes the signing difference; it does not establish device push receipt. A local simulator signing experiment was reverted after Simulator rejected launching it; no change to shipping source or signed artifacts resulted.

Web worktree production build/types/targeted lint passed, the beta site loaded today’s real public three and opened the reading introduction without starting the timer, and production was deployed from `e63cb05`. The raw Vercel preview is outside the API origin allowlist; beta and www are the existing supported origins. No CORS expansion was made.

Production compatibility migrations 20261102120000 and 20261102130000 completed and were checked read-only: 40-second timing available, four attribution columns present, discovery reminder time 19:00, category still disabled/dry_run. Render serves the new backend; web association metadata includes `/trivia`. Full backend checks: 257 existing plus three new tests passed, with the aggregate retention SQL verified separately against isolated PostgreSQL and production. Historical impressions remain incomparable and no mature retention cohort exists yet.
