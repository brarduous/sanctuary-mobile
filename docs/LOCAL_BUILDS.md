# Local builds without EAS credits

The owner disabled credit-consuming EAS work on November 3, 2026. Use local Xcode/Gradle, or the signed local build commands:

```sh
npm run build:ios
npm run build:android
```

Both invoke the repository EAS guard with `build --local`, one platform at a time, using the production profile. Local builds use this Mac's CPU and disk; they do not run on EAS cloud workers. They still need the normal native toolchain and signing credentials. iOS builds require macOS/Xcode; Android requires the JDK and Android SDK. Keep enough free disk space for dependencies and native build outputs before starting.

Put local bundled configuration in ignored `.env.local`. The guard imports only `EXPO_PUBLIC_*`, `META_APP_ID` and `META_APP_CLIENT_TOKEN`, preserving explicit shell values. It never imports server credential variables from that file. Supabase's public URL/key are required before a build can start; EAS variables with Secret visibility are unavailable to local workers. Working directories and artifacts default to ignored `.local-builds/` on the project drive, and can be overridden with Expo's `EAS_LOCAL_BUILD_WORKINGDIR` / `EAS_LOCAL_BUILD_ARTIFACTS_DIR` variables. Keep detailed build logs private because signing tools may include credential payloads.

iOS builds allow 120 seconds for Fastlane's Xcode build-settings query, with two attempts, so loading the native workspace from an external drive can finish. Explicit `FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT` / `FASTLANE_XCODEBUILD_SETTINGS_RETRIES` values override these defaults.

For another existing profile, use:

```sh
npm run eas -- build --local --platform android --profile device-qa
```

Account, environment, credential, existing-build status/cancellation and store submission commands are available through `npm run eas -- ...`. The wrapper rejects builds lacking the exact `--local` flag, boolean overrides, alternative cloud-build commands, workflows and unknown commands. `npm run test:build-policy` verifies these restrictions without creating any builds.

`AGENTS.md` also prohibits direct global-CLI, npx, CI or workflow bypasses. This repository policy and wrapper govern the supplied commands; they are not an Expo account billing cap. Do not enable an external build integration or invoke a cloud worker separately.

Store upload/review and physical-device verification remain separate from compiling a local binary. Do not commit build artifacts, private signing files or local configuration.
