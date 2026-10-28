# Daily Trivia visual QA — October 28, 2026

Scope: Discovery/trivia, shared semantic colors, and its public browser entry. This is not an app-wide sign-off.

Later sharing revision: the user clarified that sharing should be a simple sentence, not Wordle squares. The grids are now removed from native/web results, shared text and the generic preview image. Earlier captures below document the superseded design. Current marketing QA and captures are in sanctuary-marketing-home/docs/DISCOVERIES.md. Native result statistics were re-inspected after the removal; the 14.7-second result and one-day streak remained intact.

## References

Visually inspected Mobbin: [HQ timer](https://mobbin.com/screens/83cf8c38-888a-48bd-9f16-31c2be7fa120), [HQ results](https://mobbin.com/screens/8e6e2824-e979-417c-8a93-117ad3b4302b), [Kahoot editor duration](https://mobbin.com/screens/00e75c6c-5132-44dc-875f-8fb08dd26bce), and [Duolingo result metrics](https://mobbin.com/screens/f84d9b73-f89f-451a-8d81-6f8eaa579cb2). These captures informed short questions, prominent timing, large choices, and compact result metrics; none was claimed to demonstrate Wordle sharing.

Earlier palette/reading references: [Insight Timer](https://mobbin.com/screens/bde9d7a7-2bc6-4391-b0ca-bfd62ac926a1), [Matter appearance](https://mobbin.com/flows/5c6014ff-fb9b-40ff-af37-5b4310f5a665?tab=screens), and [Matter reader](https://mobbin.com/flows/4b721028-845b-41eb-8d52-445f906cf52e?tab=screens).

[Netflix's official rules](https://help.netflix.com/en/node/683580550445668) support the 20-second/four-choice default. Automatic elimination at 7/14 seconds and consecutive-correct-day streaks are Sanctuary decisions confirmed by the user. [Roku's daily/archive description](https://support.roku.com/article/roku-new-os-features) was reviewed; no live Roku game was played.

## Verified interactions

- Native: explicit Start hides the prompt until the timer begins; wrong choices disappear automatically; a correct answer at 14.7 seconds persists and yields a one-day win streak. Both light and dark result surfaces inspected.
- Native: Share opens the system text share sheet. Copy was exercised locally; no message was sent. The shared payload is also covered by the pure-rule test.
- Native: Scripture opens the internal Bible reader. Selecting KJV through that reader updates the trivia Scripture card from WEB to KJV on return. The same saved result/time remains visible.
- Browser: public /discoveries entry loads today's question without onboarding. Reloading an active round preserves its deadline; timeout shows 20.0s, zero win streak, correct answer, short detail and Scripture.
- Browser: blocked clipboard access exposes a selectable four-line result. Its inspected text contains date, seven outcome squares, time, streak and generic /discoveries link. It has no answer, question, factoid, citation or item ID.
- Native preview progress and outbox use a dedicated local-only namespace so QA data cannot later sync into a real account.

## Evidence

All captures are under ../../../qa-screenshots/2026-10-28-polish/ relative to this document:

- timed-result-light-top.png — complete result hierarchy, saved time and streak.
- timed-result-light-kjv.png — inline KJV Scripture and share action.
- timed-result-dark.png — dark result, WEB Scripture, history and share action.
- web-timeout-share.png — browser timeout and manual-share fallback entry.
- spoiler-free-share.png — focused copyable result without answer content.
- compact-question-light.png and compact-question-dark.png — earlier compact question states, before the timed controls.

The John 11:35 fixture is superseded UI test data. The user rejected its trivia quality and later resumed contextual question writing; the backend now contains a live-reviewed contextual pilot. Screenshots do not establish editorial acceptance. Older report-light.png and the first concept are obsolete.

## Checks

45 backend Discovery tests and 14 mobile Discovery tests passed. Mobile behavior checks and mobile/web TypeScript passed. Contrast checks cover 4.5:1 semantic text/action/error/disabled pairs and 3:1 focus in both themes. Strict Bible extraction checks cover all four bundled editions, bounded ranges, full chapters, absent verses and preference resolution.

Only Sanctuary QC iPhone SE (E73C3418-AB5F-43A8-9445-10B09CA8CEC6), iOS 26.5, was used for final native QA. The extra QA device was shut down and deleted; existing inactive devices were preserved. Native preview used the existing development binary and loopback API backed by in-memory PostgreSQL with synthetic editorial records. No production approvals, publication or feature enablement occurred. Missing unrelated preview profile/congregation endpoints produced development warnings, dismissed for captures.

## Remaining coverage

Android, physical devices, native Dynamic Type/VoiceOver walkthroughs, other app routes, and authenticated church/admin/subscription states were not signed off. Native wrong-answer/timeout/reopen branches have automated coverage but were not separately exercised end to end in the simulator; browser timeout/reload and native correct-answer/share/translation paths were exercised. Native share delivery to another person was not tested. Browser history is explicitly local to that browser; cross-device guest history is not implemented.

Hosted Discovery tables do not yet exist. The schema/content rollout remains pending under the backend production rollout procedure. Candidate text is unpublished and awaiting the user's separate authoring task.
