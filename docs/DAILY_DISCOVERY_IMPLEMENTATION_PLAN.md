# Daily Discovery: trivia and Christianity facts

Status: MVP implemented locally on October 28, 2026; editorial approval, staging/native acceptance, and rollout remain pending. No production changes have been made. See the [implementation/release runbook](../../sanctuary-backend/docs/DAILY_DISCOVERY_RELEASE.md) and [36-candidate editorial packet](../../sanctuary-backend/docs/DAILY_DISCOVERY_REVIEW.html).

Policy update from the user: simple Bible-text trivia may be auto-approved. The new [curriculum/evidence/difficulty methodology](../../sanctuary-backend/docs/DAILY_DISCOVERY_CURRICULUM.md) supersedes the manual-only rules below for eligible questions: daily runway generation, a minimum 95-point evidence gate, two distinct verifier models, bounded retries, audited automatic scheduling, and estimated Easy/Moderate/Challenging labels. Historical, doctrinal, disputed, or tradition-specific material stays outside that automation. Production deployment and live calibration remain pending.
Prepared October 28, 2026, from the attached “Strategic Implementation Plan for Daily Gamified Microlearning” and inspection of the current Sanctuary repositories.

## 1. Product recommendation

Add **Daily Discovery**, a free, optional Home card with one new Christianity discovery each day. Each discovery contains both a trivia question and a short fact/explanation. Users choose “Try the question” or “Show me the fact”; both lead to the same sourced learning moment. This satisfies trivia and fact discovery without creating two competing daily tasks.

Target 30–60 seconds per discovery. Preserve Sanctuary’s Scripture, reflection, prayer, and guidance priorities. Begin with broadly accessible biblical material and Christian history; identify traditions explicitly where practices or interpretations differ.

### MVP scope

- One scheduled discovery per local calendar day, shared across the audience for that date.
- Four answer choices, a reveal-without-answer option, and a 60–100 word explanation.
- Source references, a Bible-reading link when applicable, and an optional related general devotional link.
- Guest access and free access for signed-in users.
- Cached content and durable offline completion recording.
- “Discoveries explored” as a cumulative, optional progress indicator; count answering and direct reveal equally, once per discovery.
- Native sharing with a stable link to the specific discovery.
- An editorial process, a reviewed launch library, and controlled rollout.

Defer leaderboards, speed scoring, competitive badges, additional streaks, paid archives, adaptive difficulty, a searchable fact library, automated social publishing, and attribution SDKs until the initial experience is useful and reliable. Existing devotional streak behavior is outside this change.

## 2. Experience and placement

Place a compact “Daily Discovery / Did you know?” card after the existing personal guidance section and before recommended videos. This preserves the current adjacency of daily prayer and personal guidance. Open a dedicated detail screen at `/discoveries/[id]`; avoid adding another bottom tab.

| State | Behavior |
| --- | --- |
| New discovery | Show category, a curiosity prompt, “Try the question,” and “Show me the fact.” |
| Question | Show four readable choices without a timer. Selection commits one answer and immediately reveals the explanation. |
| Answer revealed | Identify the correct choice using text and icons as well as color. Use neutral copy such as “Here’s the story behind it.” |
| Direct reveal | Show the same fact and sources without assigning an incorrect answer or score. |
| Completed today | Retain the card with “You explored today’s discovery” and a way to reread it. |
| New local day | Select that date’s cached discovery; refresh on foreground and at midnight while active. |
| Offline, cached | Support question, reveal, source text, and local completion. Indicate when an external source requires a connection. |
| Offline, no daily content | Offer a bundled evergreen discovery labeled “From the collection,” rather than labeling old content as today’s. |
| Shared past discovery | Open that exact published item, clearly dated; do not redirect it to today’s item. |
| Withdrawn discovery | Online readers receive an unavailable/correction state; cached copies are removed on the next successful refresh. |

Keep progress secondary and dismissible. Missing a day creates no reset, backlog, or catch-up prompt. Include large text, screen-reader announcements for reveals, existing touch-target rules, light/dark themes, and reduced-motion support.

## 3. Content and theological standards

Proposed starting mix for a 60-item reviewed library: 36 Bible/context questions, 15 Christian history questions, and 9 clearly attributed traditions/practices questions. This is an editorial starting point to evaluate, not a research-backed optimal ratio. Schedule 30 days at launch and maintain at least 14 days of reviewed content ahead of publication.

Implementation note: the first version contains 36 unpublished biblical-text candidates with exact WEB excerpts. Historical and tradition-specific authoring is deferred until its stronger per-claim evidence requirements can be met. Short explanations take priority over padding them to a target word count. No candidate has been represented as human-approved.

Suggested categories: Bible people and places; Scripture context; early Christianity; Christian worship and practices; seasons and celebrations. A weekly theme may connect to the general devotional curriculum when the connection is natural. Do not force a link to a user’s personalized devotional.

Every discovery must:

1. Teach one clear idea and have exactly one defensible correct answer among four distinct choices.
2. Include a source that directly supports the question, answer, and explanation. Historical facts may need historical sources rather than a Scripture citation.
3. Distinguish what a biblical text states from later tradition, historical interpretation, or doctrine. Use labels such as “Catholic tradition” where relevant.
4. Avoid disputed interpretations presented as settled universal facts, obscure numerical traps, sensational claims, and “real Christians know this” language.
5. Record Scripture translation where wording matters, and track quotation/image permissions and attribution.
6. Include an internal review note and a reader-facing “Report an issue” path.

Use paraphrases and references by default, with brief quotations only when their permitted use is established. When Scripture wording is essential to the answer, pin that wording to the reviewed translation; the user may still open their preferred translation to read the passage.

Example brief: a question about the setting of Pentecost, with the answer and explanation checked against Acts 2:1–11. The fact path introduces the same setting without requiring an answer. This is a brief for review, not launch-ready content.

### Editorial lifecycle

`draft → in_review → approved → scheduled → published → withdrawn`

Start with structured content files, an import validator, and an authenticated preview. A dedicated editor in Sanctuary Studio can follow after the schema and editorial work are proven. Reuse the backend’s existing authentication/admin authorization; congregation-level access alone must not grant global publication rights.

Historical, doctrinal, disputed, and tradition-specific material requires human review before scheduling. Straightforward Bible-text questions may auto-approve only through the separately audited 95-point evidence policy. The writer cannot approve itself; two verifier models, exact-source checks, and unambiguous-answer checks apply. Record review method, reviewer/model identity, review time, sources checked, revision, and publication history. Edits to an approved item require a fresh applicable review; published revisions remain auditable.

Automated checks cover field completeness, four unique option IDs/texts, correct-option membership, length limits, permitted source URL schemes, required labels, duplicate wording, and conflicting dates. They do not replace source review. Warn when the approved content runway drops below 14 days.

## 4. Fit with the current repositories

| Area | Existing foundation and planned work |
| --- | --- |
| Mobile | `sanctuary-mobile`: Expo 54, React Native, Expo Router, AsyncStorage, sharing/capture packages, Bible links, theme and accessibility conventions. Add the Home card, detail route, data/cache module, and completion outbox. |
| Backend | `sanctuary-backend`: Express, Supabase/Postgres, migrations, admin middleware, route tests, and notification infrastructure. Add discovery tables, read/sync/admin routes, validation, and content scheduling. No new backend platform is needed. |
| Web | `sanctuary-layperson-web`: existing public daily/download pages and devotional pages. Add a public `/discoveries/[id]` fallback with the question, reveal, sources, app CTA, and social metadata. Confirm production domain ownership before deployment. |
| Editorial | Begin with validated imports and protected previews. Later add a global-admin editor in `sanctuary-studio-web` after confirming the intended platform-admin surface. |
| Notifications | Extend `sanctuary-backend/services/notificationCalendar.js` and `sanctuary-mobile/lib/pushNotifications.ts`; reuse recipient-local scheduling, opt-in rules, deduplication, quiet hours, and rollout stages. |

Use the active `sanctuary-mobile` project. Do not modify the separate `sanctuary-mobile-release-1.2.9` snapshot for this work.

## 5. Data model and API

### Proposed tables

| Table | Essential fields and rules |
| --- | --- |
| `discoveries` | Stable UUID, slug, category, editorial state, current revision, created/updated timestamps. |
| `discovery_revisions` | Discovery ID, revision, prompt, four `{id,text}` choices, correct option ID, fact heading, explanation, sources, optional structured Bible reference/translation, tradition label, related general devotional ID, reviewer and review timestamps. Preserve historical revisions. |
| `discovery_schedule` | Publication date, locale, discovery ID, approved revision. Unique date/locale pair. Only reviewed revisions may be scheduled. |
| `discovery_completions` | User ID, discovery ID, revision, mode (`answered` or `revealed`), optional option ID, client event UUID, occurred-at UTC, local date/timezone, server receipt time. Unique user/discovery completion; retries cannot inflate totals. |

A source entry includes title, publisher, URL or Scripture reference, locator, source type, and rights/attribution notes. Keep private editorial notes separate from public content.

Use stable option IDs rather than positional `correct_index`, so shuffling cannot change answer meaning. Keep option order stable within an attempt. Do not base64-encode answers as a security measure. Offline explanations inherently make answers available to a determined reader; this is acceptable for a private, noncompetitive activity.

### Proposed endpoints

- `GET /api/v1/discoveries/bundle`: bounded date/locale window of approved, released revisions, including seven days of scheduled material for offline use. Return schema version, bundle revision, server time, and ETag. Upcoming cached content is not embargoed secret content; never include drafts or private editorial fields.
- `GET /api/v1/discoveries/:id`: public past/current item, source data, and withdrawal status. Do not expose future items through public share pages before their date.
- `POST /api/v1/discoveries/completions`: authenticated batch sync with bounded payloads, idempotency, and server validation of item/option/revision. Derive user identity from authentication, never from a client-supplied user ID.
- `GET /api/v1/discoveries/progress`: deduplicated cumulative total and recent completions for the current user.
- Protected admin import, preview, approval, scheduling, correction, and withdrawal endpoints under the backend’s existing admin routing conventions.

Public content may be cached independently from authenticated progress. Use row-level policies and backend authorization so users cannot read another user’s history or write content. Service credentials stay on the server. Account deletion removes completion data through the existing deletion workflow.

For two devices completing the same item differently, retain the first server-accepted completion as canonical and return it to both devices. Preserve the local reveal while offline. Avoid client-clock last-write-wins as a scoring/progress authority. Historical revisions allow answers recorded before a correction to sync consistently; invalidate misleading completions explicitly if a correction requires it.

## 6. Offline and daily-date behavior

Start with existing AsyncStorage for the small content bundle and account-scoped completion outbox. Serialize outbox writes through one module, persist before acknowledging completion, retain pending events across restarts, and remove them only after server acknowledgement. Define bounded storage and recovery for corrupt cache entries. Adopt SQLite if the archive or queue grows enough to need transactions or relational queries; a wholesale storage migration is not an MVP prerequisite.

Refresh after initial hydration, on app foreground, and on manual retry, using ETags and backoff. Background refresh is an enhancement, not a guarantee of freshness. Never block the whole Home screen on this request.

Compute “today” using the device’s local calendar and IANA timezone, not UTC string truncation. Use the same date/zone definition for the card and reminder. Cache neighboring dates for timezone travel and always deduplicate completion by discovery ID. A timezone change may change which item is current, but cannot award the same discovery twice. Test date-line travel, DST, midnight, and clock changes; this feature has no prizes requiring strict anti-clock-tampering enforcement.

Guest progress remains local and is not uploaded automatically. Offer an explicit merge after sign-in; deduplicate by discovery ID. Scope signed-in storage to the account, prevent retries under a different account, and clear that account’s pending local data on sign-out with a defined unsynced-data notice. Keep reusable public content separate.

Bundled evergreen content supplies a first-install offline fallback. An offline device cannot receive a withdrawal immediately; revalidate on reconnect and stop serving removed content then.

## 7. Sharing, links, and growth

Use `https://sanctuaryapp.us/discoveries/<stable-id>` as the canonical link. The ID must remain stable across corrections and sharing. Create a question share card first; optionally offer an explicit “Share the fact” version after reveal. Keep text readable and avoid leaking an answer on the default question card.

The mobile configuration already declares iOS associated domains. Android currently limits verified HTTPS links to `/join`; add `/discoveries` explicitly. Verify the live AASA and Android `assetlinks.json` for both canonical/WWW hosts, correct app identity, and production signing certificates. The repository configuration alone does not prove domain verification is functioning.

Test installed-app cold/warm launch, guest access, notification taps, past questions, and navigation through login/onboarding. The root layout currently redirects signed-in users with incomplete onboarding: allow the discovery preview or preserve its route and resume it afterward. Check terminated-app notification routing as well as the active response listener.

For users without the app, make the web discovery immediately useful and offer store links. Do not require deferred linking for launch or promise automatic recovery after installation. A later attribution phase can evaluate supported mechanisms and Android Install Referrer; preserve an explicit return-to-link option for all users.

After the daily feature is stable, generate social assets from approved revisions in square, portrait-feed, and story formats. Start with a reviewed weekly export pack. Add a publishing queue only if the operational need is established, with idempotent jobs, publication-date checks, retries, alerts, and a pause control. Corrected/withdrawn content must invalidate queued assets and flag already-published posts for correction. Use approved caption templates before adding generated captions.

Update store screenshots and feature copy once the feature is live. Keyword demand, vendor claims, and attribution costs require fresh validation before selecting a growth strategy; the attached document’s numerical growth claims are not release targets.

## 8. Reminder behavior

Add `discoveries` as a separate notification preference, initially off. After the first completed discovery, offer “Would you like a gentle reminder?” with time selection and a clear decline. Avoid repeated automatic prompts after decline; expose the setting in Profile.

The current push hook requests OS permission while mounting. Split permission requests from token refresh: refreshing an existing grant should not trigger a prompt, and the new discovery permission prompt must follow user intent. Audit existing devotional/church onboarding flows so this refactor does not remove their explicit opt-in paths.

Use the existing server scheduler and 9 p.m.–8 a.m. local quiet hours. Respect the documented six-hour separation from other routine notifications; skip a discovery reminder when it would conflict with the devotional or church cadence. Prefer integrating a discovery mention into an already opted-in reminder only when the user has opted into discoveries too. Suppress sends for known completed items; offline unsynced completion can only be suppressed once reported. Send nothing when the scheduled discovery is unavailable.

## 9. Delivery sequence and release gates

These are ordered work packages, not committed calendar estimates. One implementer can deliver them sequentially while the content owner prepares and reviews the library.

| Milestone | Work | Exit gate |
| --- | --- | --- |
| 1. Content contract and prototype | Finalize naming, broad-Christian scope, source rubric, 10 reviewed examples, and question/reveal/completed mobile states. | Both participation paths are understandable and fit a brief session; sources support every example. |
| 2. Backend foundation | Add migrations/rollback, policies, import validator, preview, scheduling, bundle endpoints, completion sync, and progress. | No drafts leak; unauthorized writes fail; corrections and duplicate sync behave correctly. |
| 3. Mobile MVP | Add Home card and detail route, cache, evergreen fallback, account-scoped outbox, local date handling, and Bible links. | Complete discovery offline, restart, reconnect, and see exactly one completion persisted. Guests and account switching work. |
| 4. Shareable release | Add native sharing, public web fallback, social metadata, domain association updates, and onboarding continuation. | Shared links open the correct item with and without the app; historical links survive a new day. |
| 5. Pilot | Ship internally, then a stable 10% cohort and 50% cohort before broad availability; launch with 30 scheduled days. | Observe at least a week of pilot use, verify source reports and queue health, and review core devotional engagement before expanding. |
| 6. Optional expansion | Add discovery reminders, Studio editor, reviewed social packs, and later publishing/attribution if justified. | Explicit reminder preferences work; editorial capacity supports the cadence; the relevant pilot shows useful engagement. |

Use a server-controlled visibility flag and separate reminder/social controls. The flag should hide the Home entry without breaking past public links. Disabling discovery must not affect devotional generation, prayer, guidance, or church content.

### Required verification

- Backend authorization, content status filtering, schedule uniqueness, invalid answer rejection, duplicate/batch retries, revision corrections, and deletion.
- Mobile online/offline first launch, cache exhaustion, persistence before app termination, retry after reconnect, two-device completion, guest merge, sign-out/account switch, and date changes.
- VoiceOver/TalkBack, large text, answer announcements, contrast, reduced motion, small screens, and question/share layout.
- Physical iOS/Android link verification, cold launch, in-app browser fallback, expired/withdrawn links, and login/onboarding continuation.
- Reminder tests for explicit opt-in, OS denial/already-granted states, timezone/DST, category preference, quiet hours, duplicate dispatch, and conflicts with existing sends before reminder rollout.

Run the affected repositories’ existing type checks and relevant route/behavior checks alongside these focused tests. This planning change itself does not require running app tests.

## 10. Measurement and decisions

Collect minimum necessary first-party events: card viewed, question opened, answer committed, direct reveal, explanation viewed, source/Bible link opened, share initiated, web app CTA clicked, and sync outcome. Do not treat opening a share sheet as proof of a completed share. Deduplicate completion events; avoid including personal prayer/guidance data in analytics.

Measure card-to-discovery conversion, answer-versus-reveal preference, explanation reach, repeat discovery use over seven days, sharing intent, and source issue reports. Compare eligible users randomly assigned visibility cohorts to assess return visits and devotional/prayer completion; feature users alone are a self-selected comparison. Review reminder opt-outs only after reminders launch.

Record baseline engagement before the pilot. Agree on meaningful success thresholds after seeing baseline counts; do not claim a retention lift from industry statistics or a small pilot. Expansion requires stable completion/sync behavior, a sustainable reviewed-content runway, useful repeat engagement, and no material decline in the core daily rhythm.

Planning assumptions to revisit during milestone 1: broad-Christian editorial scope, trivia and fact as two paths to one item, free daily access, Home placement after guidance, English-first content, and cumulative rather than competitive progress.

## 11. How this plan adapts the attached research

- Retain the brief daily rhythm, forgiving participation, sourced explanations, cached content, and reusable share assets. The research provides design hypotheses, not demonstrated Sanctuary outcomes. One new question daily also does not itself implement spaced repetition; an optional concept-revisit schedule would need separate design and evaluation.
- Reuse the existing Supabase/Express backend instead of introducing PocketBase or Strapi.
- Keep AsyncStorage for this small initial dataset. Expo documents it as suitable for small persistent app state; SQLite remains an option if requirements grow. Source: [Expo storage guidance](https://docs.expo.dev/develop/user-interface/store-data/).
- Reject base64 as answer protection and client-clock last-write-wins for canonical completion totals.
- Reject fingerprint-based deferred-link matching. Apple prohibits deriving device signals to uniquely identify users/devices and identifies responsibilities for third-party SDKs. This applies even if a vendor promises better install attribution. Source: [Apple privacy and data use guidance](https://developer.apple.com/app-store/user-privacy-and-data-use/).
- Treat installed-app links and post-install referral recovery as distinct capabilities. Verified Android App Links route web URLs to installed apps; Play Install Referrer separately exposes referral information for Play installations. Sources: [Android deep links](https://developer.android.com/training/app-links), [Google Play Install Referrer](https://developer.android.com/google/play/installreferrer).
- Defer growth vendor selection, automatic social publishing, and store positioning until the daily experience and editorial process are proven. Revalidate platform-specific store and publishing requirements at that stage.
