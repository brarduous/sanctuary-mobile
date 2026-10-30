# Physical Android QA — October 30, 2026

Samsung Galaxy S24+ (SM-S926U), Android 17/API 37, full-resolution screenshots at 1080 × 2340. The owner authorized replacing app data and using ADB for input, screenshots and light/dark changes. The old Play-installed app required uninstalling because its signing certificate differs from the EAS QA APK. Checks used a fresh guest; no cloud account was deleted.

## Observed results

- Scrolled Home through its top, reflection, prayer and news content in dark mode; inspected the light Home and Bible reader. These are real screen interactions, not just static first-screen captures.
- The light trivia Start screen hides the question. Starting shows all four choices, timer and Reveal on the phone screen. Answered the October 30 question correctly at **18.9 seconds**, producing a **1-day** correct-answer streak, a brief detail and Mark 8:22–26 in WEB. Inspected results in both themes.
- Found white system status icons on a cream light-mode background. Commit `3957f8d` sets the root and navigation status-bar styles from the active theme. Installed a replacement Release APK and verified dark, readable light-mode icons; dark-mode icons remain white. See [replacement result](final-trivia-result-light.png).
- Opened the native Android share sheet and canceled without sending or copying. Its payload was exactly `I answered Sanctuary trivia correctly today!` followed by the Discoveries URL, with no answer. The same result remained after cancellation and two fresh reopens. See the share/reopen JSON records.
- One initial APK reopen briefly showed “Connect to download” despite a successful phone-to-API HTTP request. Restarting and replacing the APK cleared it; two subsequent reopen checks passed. This was not established as a code fix.

The owner stopped phone QA to disconnect and charge the device. Dark mode was restored; font scale remained its original 1.0. The last archived-question capture shows **Loading question**, not a ready question or a passed timed round. It is retained as an interrupted observation only.

## Scope and package evidence

The replacement QA APK is version 1.2.11/code 137, EAS build `4a6720ca-4ec3-4c2d-a575-3c9e0fe154c6`. Its archive included sharing changes that were subsequently committed as `58913bf`; the source-manifest hashes match that commit. QA APKs use production services and the published question link because public Discovery activation remains off. The replacement profile targets ARM64 only for this phone.

Final store packages **iOS 66 / Android 138** were independently downloaded and audited from production builds at `58913bf`. Both use the production API/database and contain the latest sharing and visual copy, with no staging database or QA loopback endpoint. The production Android bundle includes all four ABIs. Exact checksums and checks are in [the store artifact audit](final-store-artifact-audit.json).

Typecheck, all **14 Discovery tests**, all **3 content-sharing tests**, and existing behavior checks passed in a clean checkout at `58913bf`. The test harness uses generated Expo route types and sibling-repository fixtures; no source edits were needed.

This physical session did **not** finish dark timed-question elimination/timeout, full Scripture scrolling, changing translations, largest text/TalkBack, authenticated sync, offline acceptance, notification delivery or universal-link checks. Earlier simulator evidence covers some of those flows; do not label them physical-device passes. Native share contact suggestions were excluded from committed screenshots.
