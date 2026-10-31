# Store screenshots — October 31, 2026

Five current app captures replace the older store set, in this order:

1. Daily Scripture and reflection on Home.
2. Trivia: the Easy, Medium and Hard daily set.
3. A real 2/3 result with green/red tiles and **Share your Results**.
4. Bible reading in WEB.
5. The Science-filtered daily briefing.

## Store status

**Apple:** the screenshot-only build 68 has been superseded by **iOS 1.2.12 (69)**, **Waiting for Review**, submission `af422ab3-38a0-46b2-a613-68c7c0590300`. Build 69 includes the subsequent Trivia date and Pro archive improvements. All five corrected screenshots remain `COMPLETE` in the verified order. Release remains **automatic after approval**. The existing 1.2.11 release stays available during review. [Current submission](../../releases/qa/2026-10-31-trivia-dates/apple-review.json) · [Accepted images](apple-screenshots.json). The original build-68 receipt is preserved in `apple-submission.json` as historical evidence.

**Google Play:** the same iPhone captures were reused at the owner's explicit request. Five 1620 × 2880 RGB JPEGs replace the en-US phone screenshots. Upload hashes, order and edit validation passed; final consolidated commit `04676631694635823735` returned HTTP 200. Earlier queued edits were removed before this final set was submitted. Google approved this screenshot-only change and it was **published on October 31**; the console showed no remaining queued change afterward. Managed publishing remains on. [Upload audit](google-submission.json) · [Publication confirmation](../../releases/qa/2026-10-31-trivia-dates/google-screenshots-published.jpg). The subsequent Android 140 release is tracked in the [Trivia dates release audit](../../releases/TRIVIA_DATES_2026_10_31.md).

Apple’s update is still submitted for review; Google’s screenshot change has been published. Public storefront propagation can take time. No new legal agreement was accepted, and no promotional notification was sent.

## Files and provenance

The `iphone/` folder preserves the five full-resolution **1320 × 2868** source PNGs. Apple uses `01-daily-scripture.jpg` (a high-quality JPEG export) and PNGs 02–05. The initial Home PNG stayed in processing; the JPEG processed successfully and replaced that pending reservation. Original pixels remain available in the PNG source.

The `google-play/` folder contains five **1620 × 2880** JPEG exports. The original iPhone images are centered on a matching cream 9:16 canvas, preserving the whole interface. They were exported from a local HTML layout through the browser; no generated app UI, retouching, device mockups or text overlays were added. Reuse of the iPhone status bar/interface on Google Play was explicitly authorized by the owner.

iPhone capture device: a dedicated iPhone 17 Pro Max simulator on iOS 26.5. The current 1.2.12 JavaScript ran through Metro in the existing SDK 54 native QA shell, using production services and a fresh local guest. These are current-source simulator captures, not photographs of a physical phone or execution of the signed device IPA. The result came from normal guest play; no personal account/progress or fabricated score was used. The exported images contain no development banner or simulator frame. [Capture manifest](iphone-manifest.json).

Source commit: `0003cd8c8c33025b879ffe0c03b592602b34b393`. EAS production build `111c0fa2-c4b8-4df2-8ea0-32328f466c51` produced iOS 68; submission `8e928bdd-1fce-48b5-84f4-a2f9a12f34e1` uploaded it successfully. The actual signed IPA was checked for bundle/version, production API/database, absence of the staging database, Trivia/sharing text and Google OAuth IDs. Apple processed the selected build as `VALID` with non-exempt encryption false. [Signed artifact audit](ios-68-artifact.json).

Image dimensions, opacity, format and upload hashes were checked; the captures and Google exports were visually reviewed. Typecheck passed on the version-only source change. No new runtime behavior tests or physical-device authentication/accessibility passes are claimed for this screenshot update.

The final visual check caught clipped footer labels in the initial Bible frame. It was retaken after the reader settled, confirmed with all navigation labels visible, and replaced in both stores. The initial Apple review request was withdrawn and the corrected set resubmitted with the same valid build 68. [Correction audit](capture-correction.json). The files in this folder and the linked store audits describe the corrected set.

The older Apple and Google image files were downloaded before replacement and preserved at `/Volumes/Lexar/sanctuary-capture-tools/previous-store-assets/`. Store account credentials, upload tokens and reviewer contact details are excluded from this folder.

References: [Apple screenshot updates](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/), [Google preview asset requirements](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).
