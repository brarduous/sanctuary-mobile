# Mobile acquisition integration — November 3, 2026

Prepared in draft PR #11, paired with the live web funnel in sanctuary-layperson-web PR #8. This is source/build validation, not a shipped mobile release. The existing iOS 1.2.13 review submission remains unchanged.

## Behavior

Android Play Install Referrer preserves the website click ID plus original/latest campaign labels. A persisted first-open observation retries failures using the same event ID. The private website report attributes Android first opens only when they match a non-test store click in the preceding 30 days. Existing installations predating `EXPO_PUBLIC_ATTRIBUTION_RELEASE_AT` record `app_open`. Missing or invalid cutoffs also record `app_open`; configure the real first-enabled-binary publication instant before release.

Meta SDK `react-native-fbsdk-next` 13.4.3 uses Sanctuary app `1153789907089705`, published and linked to dataset `1100842532594240` with the owner's approval. Native auto-initialization is disabled. Physical iOS devices initialize only after ATT is granted; foreground checks observe permission revocation without repeatedly prompting. Android honors a removed/limited advertising ID. Development and internal QA builds disable Meta events; internal first-party observations explicitly carry `is_test=true`.

Only installation/activation measurement is enabled. No app-secret, quiz answers, scores, prayer/advice content, account identity, email, or purchase/subscription values are sent by this acquisition integration. Meta's dashboard disables automatic purchases/subscriptions, extra app metadata, sampled app-screen layouts and event suggestions. Existing unrelated SDK/account data handling is still covered by the app's broader store disclosures.

Native app ID/client-token configuration lives in ignored local `.env.local` and EAS production variables. `app.config.js` reads local fallback configuration without overriding EAS environment values or exporting it into `extra`. A client token is bundled SDK configuration; never substitute a Meta app secret. See `.env.example`. Nonproduction EAS profiles explicitly disable Meta and mark acquisition tests; production clears the test flag.

## Validation

- Ten acquisition tests pass: referrer preservation, concurrent startup, offline idempotent replay, existing-install classification, missing cutoff, internal release-mode test labels, consent, no foreground re-prompting, permission revocation and opt-out/feature/device guards.
- TypeScript passes; local EAS app-config evaluation works with Expo dotenv loading disabled.
- Android native arm64 debug assembly passes, including FBSDK and Expo Tracking Transparency modules. This development artifact does not prove Play referrer or production SDK delivery.
- Both iOS and Android production-mode Hermes exports pass.
- iOS prebuild passes. Generated configuration has the correct Meta app ID, disabled auto-init, ATT purpose string and Meta SKAdNetwork IDs. Dependency/build status is recorded in `attribution-build-verification.json`.

## Next distributed binary

1. Keep the current review submission in place. Use the next available app version/build; remote EAS versioning is authoritative.
2. Reconcile Apple App Privacy and Google Play Data safety/advertising-ID declarations with the enabled Meta SDK. Device identifiers and app interactions used for advertising measurement must be represented alongside existing data categories. Do not label prayer/advice content as sent to Meta; it is not sent by this integration. Existing 1.2.13 labels describe the binary already under review and have not been changed for unshipped SDK code.
3. Configure `EXPO_PUBLIC_ATTRIBUTION_RELEASE_AT` to the first tracking-enabled binary's actual publication instant in UTC. EAS production has Meta configuration and `EXPO_PUBLIC_META_APP_EVENTS_ENABLED=true`; native build changes require a new binary, not an OTA-only update.
4. Install the candidate through Google Play testing, follow the campaign-aware website store link, and verify one first open matches the website click. An APK sideload does not establish Play Install Referrer attribution. Internal observations stay excluded from business totals.
5. On a physical iPhone test ATT denial/grant and revocation, confirm no Meta startup when denied, then verify granted installation/activation in Meta Events Manager with an appropriately configured test candidate. The default internal profile disables Meta; enable it deliberately only for controlled vendor verification.
6. Verify vendor events before release, then confirm real store-install/first-open reporting after publication. iOS downloads use Apple's verified campaign link and aggregate App Store Connect campaign reporting; individual web-to-iPhone installs cannot be reconstructed from it. Apple campaign visibility requires five individual Apple Accounts.

References: [Expo environment variables](https://docs.expo.dev/guides/environment-variables/), [SDK plugin and installation guidance](https://github.com/thebergamo/react-native-fbsdk-next#expo-installation), [Apple App Privacy](https://developer.apple.com/app-store/app-privacy-details/), [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469).
