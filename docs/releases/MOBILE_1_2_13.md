# Sanctuary 1.2.13 release candidate

Authorized November 2, 2026: complete the mobile roadmap implementation and publish to both stores. This record distinguishes code, checks, store review, and public availability.

Changes: richer News on Home and feed, readable full headlines and images, expandable briefing and searchable topics; compact daily Home Trivia; More with Games/Videos/News; explicit guest import; any-score participation streaks; 20-second reading plus 20-second answer period with legacy restoration; optional signed-in evening Trivia consent; account-safe sync, routing, attribution, and foreground time-zone updates. Existing reading/haptic/news work is intentionally included.

Compatibility source: backend `1634434` on current `c625227`; web `488ae19` on current `c61c46a`. Production database timing expansion must precede signed clients. Only the two new November 2 migrations are intended for production. Discovery delivery remains disabled until internal evidence exists.

Checks: mobile typecheck and ten behavior scripts passed; 24 Discovery tests, 14 roadmap/participation/consent tests, three sharing tests and four News tests passed. Backend 257 existing plus three new tests passed. Web production build, types and targeted lint passed. Native visual evidence is linked in [QA](../qa/2026-11-02-mobile-roadmap/README.md).

Named limits: sandbox purchase/restore and a real sandbox donation were not performed in this pass. The historical Giving payment/subscription webhook issue is still present and is not signed off. Physical push receipt, terminated-app taps, Play-signed Google login, VoiceOver/TalkBack and installed/uninstalled link verification remain deferred. Two-week retention measurement and usage-driven expansion require time and an audience; they are not complete at release.

Store artifact IDs and verified publication states will be appended after build/submission. Remote EAS build numbers are authoritative.
