# Trivia: sharing brief

October 31 screenshot refresh: five current app images now highlight Scripture, the three-question Trivia set, **Share your Results**, Bible reading and the Science briefing. iOS **1.2.12 (68)** is **Waiting for Review** and will release automatically after approval. Google’s en-US phone screenshot update has passed quick checks and is **In review**, with managed publishing on. The owner requested reuse of the Apple captures on Google Play; Google exports use a 9:16 canvas. [Assets, provenance and store confirmations](../store/2026-10-31/README.md). Do not announce the new images as live in both storefronts until review/publication completes.

October 31, 2026: the browser game is live at https://sanctuaryapp.us/trivia, and the owner authorized publication of both native updates. **Android 1.2.11 (139)** is **Available on Google Play**. **iOS 1.2.11 (67)** was approved, manually released through Apple's API (HTTP 201), and independently re-read as **Ready for Sale**. The immediate public US Apple lookup still returned 1.2.10; confirm storefront propagation before announcing universal availability. [Apple release audit](qa/2026-10-31-app-store/release.json) · [Google production release](qa/2026-10-31-google-sign-in/android-139-available.png) · [Google publishing confirmation](qa/2026-10-31-google-sign-in/android-139-published.png).

Update from the [App Store](https://apps.apple.com/us/app/sanctuary-daily-faith-focus/id6757966099) or [Google Play](https://play.google.com/store/apps/details?id=us.sanctuaryapp.app), then find **Trivia → Your daily three** on Home below Personal guidance. Store/device propagation may delay the update's appearance. Google managed publishing remains enabled for future changes. The earlier October 30 Waiting for Review/In review screenshots below are historical submission evidence.

Google sign-in on the installed Android app was repaired on October 31 by restoring its deleted production OAuth client; the owner confirmed a successful retry. See the [sign-in audit and release checks](GOOGLE_SIGN_IN.md).

## What people can share

**Trivia** gives players three daily questions: Easy, Medium, Hard. Each question has a 20-second round, a short factual reveal and readable source context. The button is **Share your Results**.

Results show three ordered squares: green for correct, red for incorrect/revealed/timed out, neutral for unplayed. Checks/crosses and labels also communicate the result in the app. Shared text contains the date, score and browser link, with no question or answer spoilers.

Example format (illustrative score):

```text
Sanctuary Trivia · 2026-10-30
🟩🟥🟩
Easy · Medium · Hard
2/3 correct
https://sanctuaryapp.us/trivia?date=2026-10-30
```

The `/trivia` route keeps shared results in the browser, including on phones with an older Sanctuary app installed. Existing `/discoveries` app links remain supported.

## Starting copy

- Three questions. One score. Your turn.
- Easy, medium, hard. Can you go three for three?
- Play three 20-second questions. Learn a detail worth sharing.

Lead with curiosity and friendly competition. Use plain language and real discoveries. Keep the audience broad, including people new to church; avoid assumed Bible expertise, forced slang and guilt about a low score.

## Assets and claims

[Native results preview](qa/2026-10-30-native-three-results.jpg) shows the current interface and final button label. It is an actual simulator QA result, not a store screenshot export. [Production browser results](qa/2026-10-30-production-trivia-results-full.png) show the live game. [Apple review proof](qa/2026-10-30-ios-67-waiting-for-review.jpg) confirms build 67. [Google Play review proof](qa/2026-10-30-android-139-in-review.png) confirms release 19 with build 139. Use these for campaign planning; the native simulator capture includes its frame and is not a store screenshot export.

The launch bank contains seven independently reviewed daily sets (21 questions). Difficulty labels are editorial estimates; do not advertise measured audience success rates or perfect factual infallibility. Source research currently supports Bible-text facts; do not advertise a public atlas, lexicon or commentary reader.

Store release copy:

> Trivia is now three questions a day: Easy, Medium, Hard. Play a quick round, discover something new, and Share your Results with three spoiler-free squares.

Keep launch timing separate from store submission timing. Apple manual release and Google managed publishing remain on hold for the owner.
