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
- Android 1.2.13 (141): EAS build `6ed62208-53d4-4296-8149-b84ac073ab19` finished; EAS submission `ba76534c-e166-4372-95bb-2633506153ce` finished. The draft production release was reviewed in Play Console, given matching feature notes, and sent with its corrected Data safety form. Google confirms **Changes in review** and managed publishing is off, so the full rollout publishes automatically after approval. [Review proof](android-1.2.13-in-review.png), [artifact metadata](android-1.2.13-artifact.json), [exported declaration](play-1.2.13-data-safety.csv).


## Disclosure reconciliation

Apple’s existing label listed only name/email and marked them unlinked. The current app stores accounts, prayers/guidance/preferences, subscribed entitlements, content reports, gameplay, and usage/installation identifiers. Its updated label now lists ten types with account linkage and purpose-specific functionality/personalization/analytics. Advertising tracking is not declared because it is not used by this implementation. [Apple disclosure proof](ios-privacy-updated.png).

Google’s previous name/email answers incorrectly marked retained account data ephemeral, leaving its public page showing no collection. Its revised form includes name, email, user IDs, religious preferences, purchase history, app interactions, search requests, other user content and device IDs. Account/automatic identifier collection remains required in the aggregate declaration; user-submitted preferences/content, searches and purchases are optional. Search requests are conservatively disclosed without assuming the complete infrastructure path is ephemeral. Service-provider processing is distinguished from third-party sharing. Existing OAuth, encrypted transport and account-deletion URL were retained. [Submitted preview](play-data-safety-preview.png). These disclosure changes do not add new collection behavior.

The public privacy policy was updated from web-only wording to describe the mobile app, synced Trivia progress, content reports, pseudonymous usage measurement, native push, RevenueCat/store purchases and service providers. Web source `61e40f2` is live at production deployment `sanctuary-layperson-webapp-rhwpi8l57.vercel.app`.

Classification references: [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/) and [Google Data safety definitions](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en). Physical-device receipt and review/publication remain separate from implementation and metadata evidence.

Both 1.2.13 store submissions are pending external review. No additional release confirmation is required. The version is not claimed public until store publication is observed. Local QA services and simulators are stopped.
