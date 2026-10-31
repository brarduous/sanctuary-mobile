# Store screenshots — October 31, 2026

Five current app captures replace the older store set, in this order:

1. Daily Scripture and reflection on Home.
2. Trivia: the Easy, Medium and Hard daily set.
3. A real 2/3 result with green/red tiles and **Share your Results**.
4. Bible reading in WEB.
5. The Science-filtered daily briefing.

## Store status

**Apple:** iOS **1.2.12 (68)** is **Waiting for Review**, submission `970fd64f-25b6-48bd-bf40-7eb652a003bc`. All five images reached `COMPLETE`, their order was re-read, and the inherited older screenshot set was removed from this new version. Apple requires a new version to replace approved screenshots, so the binary changes only the version metadata from 1.2.11. Release is **automatic after approval**. The existing 1.2.11 release remains available during review. [Submission](apple-submission.json) · [Accepted images](apple-screenshots.json) · [Console confirmation](apple-waiting-review.jpg).

**Google Play:** the same iPhone captures were reused at the owner's explicit request. Five 1620 × 2880 RGB JPEGs replace the en-US phone screenshots. Upload hashes, order and edit validation passed; commit `04676631694635823735` returned HTTP 200. The final consolidated submission at 2026-10-31T15:59:27.259Z is confirmed in the console as **Your changes are now in review**, specifically one **Change Phone screenshots** entry. Earlier queued screenshot edits were removed before submitting this final set; no obsolete approved batch remains queued. Android's released 1.2.11 (139) binary was not replaced. Managed publishing remains on; publish this screenshot change after Google approves it. The owner has authorized the store screenshot update. [Upload audit](google-submission.json) · [Console confirmation](google-in-review.jpg).

These are submitted store changes, not a claim that both public storefronts already show the images. No new legal agreement was accepted, and no promotional notification was sent.

## Files and provenance

The `iphone/` folder preserves the five full-resolution **1320 × 2868** source PNGs. Apple uses `01-daily-scripture.jpg` (a high-quality JPEG export) and PNGs 02–05. The initial Home PNG stayed in processing; the JPEG processed successfully and replaced that pending reservation. Original pixels remain available in the PNG source.

The `google-play/` folder contains five **1620 × 2880** JPEG exports. The original iPhone images are centered on a matching cream 9:16 canvas, preserving the whole interface. They were exported from a local HTML layout through the browser; no generated app UI, retouching, device mockups or text overlays were added. Reuse of the iPhone status bar/interface on Google Play was explicitly authorized by the owner.

iPhone capture device: a dedicated iPhone 17 Pro Max simulator on iOS 26.5. The current 1.2.12 JavaScript ran through Metro in the existing SDK 54 native QA shell, using production services and a fresh local guest. These are current-source simulator captures, not photographs of a physical phone or execution of the signed device IPA. The result came from normal guest play; no personal account/progress or fabricated score was used. The exported images contain no development banner or simulator frame. [Capture manifest](iphone-manifest.json).

Source commit: `0003cd8c8c33025b879ffe0c03b592602b34b393`. EAS production build `111c0fa2-c4b8-4df2-8ea0-32328f466c51` produced iOS 68; submission `8e928bdd-1fce-48b5-84f4-a2f9a12f34e1` uploaded it successfully. The actual signed IPA was checked for bundle/version, production API/database, absence of the staging database, Trivia/sharing text and Google OAuth IDs. Apple processed the selected build as `VALID` with non-exempt encryption false. [Signed artifact audit](ios-68-artifact.json).

Image dimensions, opacity, format and upload hashes were checked; the captures and Google exports were visually reviewed. Typecheck passed on the version-only source change. No new runtime behavior tests or physical-device authentication/accessibility passes are claimed for this screenshot update.

The final visual check caught clipped footer labels in the initial Bible frame. It was retaken after the reader settled, confirmed with all navigation labels visible, and replaced in both stores. The initial Apple review request was withdrawn and the corrected set resubmitted with the same valid build 68. [Correction audit](capture-correction.json). The files in this folder and the linked store audits describe the corrected set.

The older Apple and Google image files were downloaded before replacement and preserved at `/Volumes/Lexar/sanctuary-capture-tools/previous-store-assets/`. Store account credentials, upload tokens and reviewer contact details are excluded from this folder.

References: [Apple screenshot updates](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/), [Google preview asset requirements](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).
