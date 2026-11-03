# Build and release policy

## No EAS credits

The owner requires local builds going forward. Do not consume EAS credits.

- Never start an EAS cloud build, including through `eas build`, `npx eas-cli`, `eas build:dev`, GitHub integration, EAS Workflows, or another automation.
- Build with local Xcode/Gradle or `eas build --local`. Use the repository commands `npm run build:ios` and `npm run build:android` for signed local EAS builds.
- Use `npm run eas -- <command>` for EAS CLI access. Its guard rejects cloud builds and other cloud execution/publication commands. Read-only account/build queries, environment configuration, credentials and store submission do not start a build and remain available.
- Do not remove the guard, add a cloud-build script/workflow, or bypass it with a globally installed CLI. A future exception requires the owner's explicit authorization for that specific credit-consuming run.
- If local storage, signing, tools or a connected device are missing, resolve the local requirement or explain the concrete blocker. Do not fall back to a paid/cloud build.
- Before distribution, verify the signed artifact, version/build number, production configuration, store disclosures and relevant tracking behavior. Do not claim physical-device verification from a simulator or unit test.

See [local build instructions](docs/LOCAL_BUILDS.md). Keep generated artifacts, signing credentials, client tokens and build working directories out of Git.
