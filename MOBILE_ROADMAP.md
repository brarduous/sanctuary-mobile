# Sanctuary mobile roadmap

Updated November 2, 2026. Implementation roadmap for product alignment. Release candidate 1.2.13 now implements Home Trivia, More, Videos, the Home/feed News redesign, shared participation streaks, explicit reminder consent, and attributed daily-loop measurement. Version 1.2.13 is submitted to both stores for automatic release after approval; evening delivery stays paused pending an eligible internal cohort. See the [implementation and QA record](docs/qa/2026-11-02-mobile-roadmap/README.md) for evidence and remaining acceptance work.

Make Sanctuary's daily rhythm easy to find: Scripture and reflection, a short Bible game, and an optional evening invitation to return. Give secondary features a permanent home without crowding the tab bar.

## Production baseline

| Surface | Verified November 2 | Next action |
| --- | --- | --- |
| iOS, US App Store | **1.2.12 (69) is public**. **1.2.13 (70) is Waiting for Review**, automatic release after approval. | Apple review is pending. |
| Android, Google Play | **1.2.12 (140) is Available on Google Play**, published November 2 at 5:35 p.m. Eastern, 100% rollout. **1.2.13 (141) is in review**, including its corrected Data safety form. | Automatic full rollout after Google approval; managed publishing off. |
| Production Trivia API | Enabled; returns today's three questions in positions 1–3 for America/New_York. | Preserve free daily access and Pro archive enforcement. |
| Mobile source | **1.2.13 runtime `701b150`**, iOS build 70 / Android 141; subsequent commits record release evidence and submission configuration. 1.2.12 runtime remains `dc17c7a`. | See [1.2.13 release record](docs/releases/MOBILE_1_2_13.md) for artifacts, checks and limitations. |

See [production audit](docs/releases/PRODUCTION_STATUS_2026_11_02.md) for evidence, checks, and limits. Old submission records describe their capture date, not current store status.

## Product direction

- **Home:** a prominent, compact daily Trivia card immediately below the greeting/date and above Scripture. Keep reflection and prayer easy to reach.
- **More:** a permanent hub for **Games**, **Videos**, **News**, and supporting destinations. Trivia is the first game; avoid empty future-game categories.
- **Reminders:** one optional evening Trivia push when today's set is unfinished, staggered from the devotional push, with encouraging state-aware copy.
- **Trivia tab:** defer. Home supplies daily visibility; More → Games supplies a permanent destination. Revisit only when observed use justifies changing the primary tabs.

The user requested exploration of higher Home priority, evening streak reminders, and a More button for Games/Videos. Exact placement, tab order, reminder time, and participation-streak rules below are recommendations to validate during implementation.

## 1. Release parity and readiness

### M01 — Reconcile shipped versions · P0 · Release

- [x] Publish approved Android 1.2.12 (140) through managed publishing; production track confirms Available on Google Play at 100%. Physical install propagation remains deferred.
- [x] Keep one current status record linking runtime source, version/build, publication state, and outstanding acceptance evidence. EAS uses remote versioning; local `app.json` build numbers are not authoritative.
- [x] Review and preserve existing uncommitted work: 20-second reading period plus 20-second countdown, legacy-round restoration, haptics, and news TL;DR/Christian assessment. Verify mobile/API timing compatibility before release. Do not silently include it in a documentation commit.

**Done when:** public versions are recorded accurately and the next candidate has an explicit source/artifact and QA record.

### M02 — Reconcile critical journey evidence · P1 · Engineering/QA

- [ ] Recheck authentication/session restoration, sign-out/account change, and invite continuation on the next release candidate.
- [ ] Verify sandbox Pro purchase, restore, entitlement persistence, and account isolation; check free today / Pro archive behavior after purchase and expiry.
- [ ] Reconcile the historical Giving/webhook finding with current backend code, then verify one idempotent sandbox donation before treating Giving as verified.
- [ ] Check shared `/trivia` URLs and notification routing with warm/cold app launch. Android's declared link filters currently include `/join` and `/discoveries`, not `/trivia`.
- [ ] Verify compact layouts, enlarged text, both themes, reduced motion, and offline completion/reconnect using the authorized simulator workflow. Keep physical-device delivery, Play-signed Google sign-in, VoiceOver/TalkBack, and installed/uninstalled domain verification explicitly deferred until device QA resumes.

**Done when:** each journey has current evidence or a named remaining limitation. Source checks and simulator screenshots do not close hardware-only gaps. See the detailed [historical checklist](MOBILE_DESIGN_EXCELLENCE_TODO.md); this roadmap does not reinstate previously deferred physical-device sign-off as a condition for the already-approved release.

## 2. Daily visibility and feature discovery

### M03 — Promote the daily Trivia card · P1 · Mobile

Replace the tall Trivia section currently below guidance with one compact card below the Home greeting. Reuse the existing daily-set/progress state and remove the duplicate lower card. Use Sanctuary's warm surfaces, typography, and restrained gold emphasis.

| Today's state | Content | Action |
| --- | --- | --- |
| Not started | **Today's Bible Trivia** · Three questions: easy, medium, hard. | **Play today's three** |
| One or two completed | **Keep going** · 1/3 or 2/3 played; progress saved. | **Continue** |
| Three completed | **Today's Trivia complete** · Actual score and result squares. | **View and share results** |
| Loading/unavailable | Compact loading or useful retry state; Home remains usable. | Retry where useful; never label yesterday's cache as today. |

- [x] Use a persistent daily entry, not a modal, carousel, or rotating promotion. Let text wrap; compact must not mean fixed-height clipping.
- [x] Open the daily set without automatically starting a timed question. Continue at the next unanswered question.
- [x] Refresh on foreground/local midnight; preserve partial/offline results, account boundaries, and explicit guest import.
- [x] Reduce emphasis after completion while retaining results/sharing. Restore the invitation on the next local day.
- [ ] Verify reflection remains easy to find on small screens; avoid an oversized banner or stacked promotions.

**Done when:** unstarted, partial, completed, offline, and day-change states work and today's game is visible near the top of Home.

### M04 — Add More with Games, Videos, and News · P1 · Mobile

Proposed tabs: **Home · Bible · Guidance · My Church · More**. My Church remains conditional on membership; nonmembers see four tabs and find Join a church in More. Move News into More while preserving existing routes and links.

| More destination | Initial scope |
| --- | --- |
| **Games** | Today's Bible Trivia, results, and the existing Pro past-games entry. Add games only when playable. |
| **Videos** | A browse destination for existing recommended faith videos, preserving preferences and playback behavior. Church messages retain church access rules. |
| **News** | Existing Daily Briefing, categories, articles, and Scripture links. |
| **Supporting destinations** | Profile/settings, notification preferences, and join/manage church as relevant. Keep the profile-avatar shortcut. |

- [ ] Preserve back navigation, deep links, drafts, account gates, and tab state. Do not leave a visible News tab beside More.
- [ ] Handle guest, member, nonmember, empty-video, and offline states; retain existing content permissions.
- [ ] Use clear labeled rows and a short, scannable hub rather than a grid of future features.

**Done when:** Games, Videos, and News are predictably reachable through More, existing links work, and the tab bar never has six items.

## 3. Evening return habit

### M05 — Define a participation streak · P1 · Mobile/Web/Backend

**Recommendation:** earn a daily play streak by finishing all three questions, regardless of score. Wrong answers, timeouts, and reveals count as completed participation. Keep accuracy and any perfect-set record separate and labeled. An unfinished today does not break yesterday's continuing streak until the local day ends.

Candidate 1.2.13 uses **daily-participation-v1** across mobile, web and server: all three completed questions count at any score. Former perfect-set records stay separate; canonical history is preserved.

- [x] Share one rule across Home, results, Games, web, and server-generated reminder copy.
- [x] Derive streaks from canonical completion history; deduplicate retries/corrections, exclude archive play, and preserve guest/account boundaries.
- [x] Preserve historical completions and document how recalculated participation streaks differ from former perfect-set streaks.
- [ ] Test midnight, DST/timezone travel, missed days, partial sets, offline sync, reveal/timeout, account changes, and archive play.

**Done when:** finishing today's three earns a clearly explained play streak independently of score.

### M06 — Deliver an optional evening reminder · P1 · Backend/Mobile · Depends on M05 for streak copy

**Recommended initial time: 7 p.m. recipient-local time**, after the morning devotional. Existing code seeds 6 p.m.; change that setting intentionally. Retain six-hour separation from other routine pushes and 9 p.m.–8 a.m. quiet hours. Skip conflicts rather than sending late during quiet hours.

| State at dispatch | Title | Body |
| --- | --- | --- |
| No continuing play streak; unstarted | **Start your streak** | Today's three Bible questions are ready. Play a little, learn something new. |
| Continuing play streak; unfinished | **Keep your streak going** | Your daily three are waiting. Finish today's Trivia to keep your streak going. |
| Partial set; no continuing streak | **Finish today's three** | Pick up where you left off in today's Bible Trivia. |
| Three completed | No reminder | Suppress regardless of score. |
| Streak cannot be established reliably | **Today's Trivia is ready** | Try today's three Bible questions. |

Treat these as proposed copy. Avoid guilt, fabricated counts, answer spoilers, or promises that a reminder guarantees a streak. Use generic copy if M05 is deferred.

- [x] Reuse the existing `discovery` category, 15-minute dispatcher, token capabilities, deduplication, and `notifications.trivia` preference. No second scheduler.
- [x] **Correct eligibility before activation:** the prior backend read legacy `discovery_schedule`, selected one question, suppressed after its completion, and linked to its detail. The release implementation uses complete daily sets. Use today's published three-question set, suppress after all three are complete, and open `/discoveries` to resume remaining questions.
- [ ] Recheck explicit opt-in, supported client, content/withdrawals, synced completion, quiet hours, spacing, and one-send-per-user/local-day at dispatch. Skip when the complete daily set is unavailable.
- [x] Keep separate Trivia consent off by default. After a completed set offer **Remind me in the evening**, with a clear decline. Request OS permission only after user intent; expose the setting in Profile/More and do not repeatedly prompt after decline.
- [ ] Suppress using server-known completion; offline unsynced play may still receive a reminder until reconnect. Start with supported signed-in users. Guest reminders need a separate consent/identity/deduplication design.
- [ ] Verify denied permissions, token changes, sign-out, local-time changes, overlapping dispatch, suppression, and routing. Record real native receipt and terminated-app tap evidence when physical-device QA resumes.
- [ ] Inspect live runtime settings/delivery history before claiming reminders are already enabled. Dry-run → internal cohort → 10% → 50% → 100% of eligible opted-in users after reviewing failures and opt-outs. Retain a category pause control.

**Done when:** opted-in users with unfinished Trivia receive at most one useful evening invitation, separated from other pushes, opening the correct local day's remaining questions. Keep delivery evidence and device limitations explicit.

## 4. Measure and improve

### M07 — Measure discovery and return use · P1 · Mobile/Backend

- [ ] Establish a baseline before changing placement: visible impressions, opens, starts, set completions, next-day/seven-day return, sharing intent, and devotional engagement.
- [x] Correct impression semantics: replace mount-based `card_viewed` with actual viewport visibility while focused/foregrounded and session/day deduplication. Implemented locally; historical impressions remain incomparable.
- [x] Distinguish entry source: Home, More → Games, shared link, or push. A share sheet opening is share initiation, not completed sharing.
- [ ] Review push attempts, provider acceptance/receipts, opens, completion after open, and opt-outs using minimum-necessary first-party data.
- [ ] Review two full weeks of the new experience; use usability evidence and extend measurement if the audience is too small for meaningful retention comparisons.
- [ ] Check whether News becomes too hard to find in More or Trivia crowds out Scripture/reflection.

**Trivia-tab decision gate:** repeated intentional daily use, users still struggling to find Games despite Home/More, and a clear plan for which existing tab moves. No extra tab solely because Trivia is new.

### M08 — Expand after the daily loop works · P2 · Product/Content

- [ ] Improve explanation/source readability, question variety, and difficulty using completion and issue evidence.
- [ ] Refine Videos browsing based on actual use and available content.
- [ ] Consider another Bible game, learning history, or optional practice after daily sets, archive entitlements, and the reviewed content runway are dependable.

## Delivery order

1. M01: accurate release parity; reconcile M02 evidence with current code.
2. M03–M04: prominent Home card and More, with M07 baseline measurement.
3. M05–M06: shared streak rules and correct set eligibility, then staged evening delivery.
4. M07–M08: review actual use before expanding games or changing primary tabs again.

Runtime changes need relevant type/behavior checks and compact/large light/dark review. Keep hardware-only gaps deferred and explicit under the existing QA scope. Checkboxes remain open until supported by evidence; these are ordered work packages, not delivery-date commitments.
