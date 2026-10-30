# Sanctuary launch visual review — October 29, 2026

Verdict: the warm paper/forest identity, editorial type and restrained gold actions are strong. The tested daily reading and trivia surfaces are cleaner after the changes below. This is a focused visual review, not a claim that Sanctuary is objectively the best app or that all release acceptance is complete. Public rollout remains held.

Application source: `2e5fb4e96673acf3f36ec47e7ac973aa0f6feb56`. One simulator: Sanctuary QC iPhone SE, iOS 26.5, 375 × 667 points. [Rebuilt Release artifact provenance](simulator-artifact.json). No physical device was used, as requested by the owner.

## Benchmarks inspected

| Reference | Observed pattern | Sanctuary decision |
| --- | --- | --- |
| [Matter reading flow](https://mobbin.com/flows/4b721028-845b-41eb-8d52-445f906cf52e?tab=screens) | Reading text takes priority over surrounding controls. | Keep Georgia, comfortable passage spacing and compact metadata; bring Scripture higher in the result. |
| [Insight Timer daily surface](https://mobbin.com/screens/bde9d7a7-2bc6-4391-b0ca-bfd62ac926a1) | Daily intention and compact entry points give the screen a clear hierarchy. | Remove repeated reflection labels; keep one section heading and one action. |
| [HQ Trivia question](https://mobbin.com/screens/83cf8c38-888a-48bd-9f16-31c2be7fa120) | Timer, question and parallel answer rows carry the screen with little supporting copy. | Keep Sanctuary's four choices, explicit Start, difficulty and Reveal; consolidate the timer/reveal row and reduce small-phone question size. |

These are qualitative references, not a measured competitive ranking. HQ's reference has three choices; Sanctuary intentionally retains four.

## Imagegen passes and critical selection

[Pass 1](trivia-pass-1.png) explored question/result light/dark layouts. [Pass 2](pass-2.png) extended the comparison to Home, Bible and result surfaces. Exact prompts are retained alongside the images. Both boards are concepts, not runtime screenshots or sources of biblical truth.

Adopted: compact answer/status treatment, unboxed time/streak metrics, a persistent result footer, clearer photo labels and less repeated Home copy. Rejected: invented `1 / 5` progression, a partially empty bar at 20 seconds, omitted difficulty/Reveal, lime success colors, decorative dark texture and any suggestion that a single verse represents an entire approved passage. Pass 2 still introduces gradients, green success styling and unrealistically compressed content; these were not copied. Scripture comes from the actual Bible reader, not generated artwork. No generated image is shipped as an app screen.

## Implemented and verified

| Surface | Change | Evidence / extent |
| --- | --- | --- |
| Timed trivia | On compact phones, 22/30 question type, 20-point gutters and a combined timer/Reveal row; four 52-point answer targets remain. | Actual [light](trivia-question-light-after.jpg) and [dark](trivia-question-dark-after.jpg) questions: complete 19-word prompt, four choices, 20s and Reveal fit together at default text size. |
| Trivia result | Combine outcome and correct answer; compact response time/streak; Done/Share remain outside the scrolling passage in a safe-area footer. | [Light](trivia-result-light-after.jpg), [dark](trivia-result-dark-after.jpg). Correct answer recorded at 1.4s with a 1-day streak; a separate fresh [timeout](trivia-timeout-after.jpg) records 20.0s and zero days. Full Luke 17:1–12 remains present, with WEB and internal-reader link. |
| Larger text | Reuse live font-scale reflow and stack footer actions at increased scale. | [Actual larger-text result](trivia-large-text-after.jpg), three increases from default while open. No clipped lines in the visible content or action labels; saved result persists. Default size restored. This is not maximum-size or screen-reader sign-off. |
| Sharing | Persistent footer opens the existing native share sheet. | [Actual sheet](trivia-share-after.jpg): generic correct-result preview; canceled without copying, saving or sending. Existing tests verify the full payload is spoiler-free. |
| Home | Photo overlay strengthened to 56% black; edition label fully white; remove redundant Today's focus/Daily reflection labels in the photo strip. | [Before light](home-light-before.jpg), [after dark](home-dark-after.jpg). White text has a calculated worst-case 4.95:1 contrast over a white photo under the overlay. Reflection copy removal also confirmed in the live accessibility tree. Lower-card visual inspection was limited by simulator scrolling automation; no full lower-Home acceptance is claimed. |
| News | Empty filtered/search states offer Browse all news and clear the filter/query; truly empty All News offers Refresh. | [Empty state after](news-empty-dark-after.jpg) → [loaded articles after action](news-all-dark-after.jpg). Confirmed against production read-only article data. |
| Guidance | Sample prompt and divider use semantic theme colors; disabled action uses an opaque semantic disabled pair instead of opacity; controls have explicit button roles. | Entry form inspected in light/dark. No personal guidance was submitted. Private history/profile details are not retained in this review's assets. |

Production-connected development app was used for read-only Home, Bible, Guidance, Church and News review. Trivia interaction used a separately identified, locally built Release app against hosted staging, with isolated guest storage. Its unrelated Home endpoints are deliberately unavailable and are not representative of production Home. No production trivia completion or real notification was created. The isolated QA installation was reset between test rounds; production app storage was preserved.

## Remaining quality work

1. **Content readiness:** this account's Church surface contains older test announcements. All News loaded articles dated September 24/22/21 while the review date is October 29. Investigate publication/freshness and intended cohort visibility before launch; this review neither deletes church content nor establishes that all news is stale. Home's synopsis and article feed are separate surfaces.
2. **Bible edition typography:** bundled KJV contains literal `‹ ›`, pilcrows and square-bracket editorial markings, visibly distracting in [light](bible-light-before.jpg) and [dark](bible-dark.jpg). Their presentation should be reconciled with the edition's source metadata before cleanup. Scripture and bundled text were preserved exactly during this pass. [CrossWire's documentation](https://www.crosswire.org/osis/tutor.jsp) explains translation-addition markup generally; it does not establish the provenance or intended rendering of this particular export.
3. **Accessibility and devices:** VoiceOver/TalkBack, maximum text size, timer usability with assistive technology, Android hardware, terminated-app notifications and installed/uninstalled universal links remain unsigned off. Larger text can require scrolling during a timed question; default-size fit does not resolve that usability question.
4. **Packaging:** iOS 65 and Android 137 contain the preceding `b2fb713` source. New production packages must include `2e5fb4e` before publishing these visual improvements. Apple 65 is saved with manual release; Android managed publishing remains on. No public release was performed.

## Validation

`npm run typecheck`, all 14 Discovery tests and `npm run check:behavior` passed after the implementation. Existing checks include exact Scripture preservation across 4,756 chapters/four editions, passage/version boundaries, timer/elimination/streak/share behavior, account isolation and semantic light/dark contrast. The local simulator Release build succeeded and its Hermes bundle was inspected for staging identity and the new polish strings. [Structured visual observations](visual-qa.json) record the fresh correct and timeout rounds. React review found no new effects, asynchronous fetch chains or packages in the visual changes; the News recovery reuses the existing fetch path.

Onboarding, paywall/purchase, complete Church/community flows, complete Guidance responses, every empty/error state and the websites were not reaccepted in this pass. Their previous evidence, where present, remains separate. The older [native QA record](../../releases/qa/2026-10-29/SIMULATOR_QA.md) includes cold-offline recovery and earlier translation/timeout checks.
