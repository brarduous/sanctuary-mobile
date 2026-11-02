# Sanctuary 1.2.13 release candidate

Authorized November 2, 2026: complete the mobile roadmap implementation and publish to both stores. This record distinguishes code, checks, store review, and public availability.

Changes: richer News on Home and feed, readable full headlines and images, expandable briefing and searchable topics; compact daily Home Trivia; More with Games/Videos/News; explicit guest import; any-score participation streaks; 20-second reading plus 20-second answer period with legacy restoration; optional signed-in evening Trivia consent; account-safe sync, routing, attribution, and foreground time-zone updates. Existing reading/haptic/news work is intentionally included.

Compatibility source: backend `1634434` on current `c625227`; web `488ae19` on current `c61c46a`. Production database timing expansion must precede signed clients. Only the two new November 2 migrations are intended for production. Discovery delivery remains disabled until internal evidence exists.

Checks: mobile typecheck and ten behavior scripts passed; 24 Discovery tests, 14 roadmap/participation/consent tests, three sharing tests and four News tests passed. Backend 257 existing plus three new tests passed. Web production build, types and targeted lint passed. Native visual evidence is linked in [QA](../qa/2026-11-02-mobile-roadmap/README.md).

Named limits: sandbox purchase/restore and a real sandbox donation were not performed in this pass. The historical Giving payment/subscription webhook issue is still present and is not signed off. Physical push receipt, terminated-app taps, Play-signed Google login, VoiceOver/TalkBack and installed/uninstalled link verification remain deferred. Two-week retention measurement and usage-driven expansion require time and an audience; they are not complete at release.

Store artifact IDs and verified publication states will be appended after build/submission. Remote EAS build numbers are authoritative.

## Verified release progress

- Runtime source: mobile `701b150`; backend runtime `1634434` (report SQL correction `481ea68`); web `e63cb05`.
- Both database migrations applied to Sanctuary production with guarded timing compatibility verified. Discovery remains disabled/dry_run at 19:00.
- Backend Render deploy is live. Web production deployment `sanctuary-layperson-webapp-8rl5mx9w6.vercel.app` serves www; `/trivia` is in its association metadata.
- Android 1.2.12 (140): published through managed publishing November 2, confirmed by the empty ready-to-publish queue and publication date. Public device install propagation was not tested.
- iOS 1.2.13 (70): EAS build `1c6035b7-8a9f-444b-ba03-3c8b8dcd2eda`, upload `ceb36621-aff5-436a-8c90-a81a48cdd866` finished. App Store review submission `d70b4ba4-e944-426d-95e2-fb46635951e2` is **Waiting for Review**, automatic release after approval. [Submission proof](ios-1.2.13-submitted.png), [signed artifact metadata](ios-1.2.13-artifact.json).
- Android 1.2.13 (141): EAS build `6ed62208-53d4-4296-8149-b84ac073ab19` compiling. `store-review` submit profile uploads a draft production release so feature notes can be checked in Play Console before review/rollout.
