# Google sign-in: release checks and October 31 repair

## Production repair — October 31, 2026

The Google Cloud project `glory-app-437300` (number `227530603982`) had only a debug Android OAuth client active. Its production **Sanctuary Android App** client appeared under Deleted credentials with deletion date **September 30, 2026**. The deletion's actor and cause were not established.

Restored that existing client during the October 31 audit. Google confirmed `OAuth client "Sanctuary Android App" restored`. Its unchanged package and SHA-1 exactly match the public certificate downloaded from Google Play's **Protected with Play → Play Store protection → Manage Play app signing** page. No scopes, client secrets, signing keys or app binaries were changed.

| Configuration | Verified value |
| --- | --- |
| Android package | `us.sanctuaryapp.app` |
| Restored Android client | `227530603982-sh58idp0aq3b3uflnnofvun8v61hjs64.apps.googleusercontent.com` |
| Play signing SHA-1 | `87:B2:8B:56:02:2A:0D:5E:C3:ED:71:6F:DE:52:EF:CD:06:1F:2E:83` |
| Play signing SHA-256 | `20:77:2E:8A:67:95:E3:0B:8F:04:30:E4:EB:9C:E7:40:BA:50:80:11:11:5C:26:E6:31:4B:75:38:2E:EB:03:FE` |
| Production web audience | `227530603982-dmkq0fmm06uakc7ac5rueooosrb5e8i0.apps.googleusercontent.com` |
| iOS client | `227530603982-uj62ko7k4bqai0a42irca49umb9sgopg.apps.googleusercontent.com` |

[Restoration confirmation](qa/2026-10-31-google-sign-in/oauth-restored.png) · [Restored package and certificate](qa/2026-10-31-google-sign-in/oauth-client-verified.png)

Before restoration, the sampled production activities included Android `DEVELOPER_ERROR` and `A non-recoverable sign in failure occurred`, before any ID-token receipt or Supabase exchange. The production Supabase Google authorization endpoint redirects to Google using the same web audience packaged in the inspected builds. **After restoration, the owner fully closed/reopened the app, retried and confirmed: “Sign-in works now.”** The subsequent production telemetry also contains new token-received and sign-in-success events. This verifies the reported Play sign-in failure is repaired. The installed version number was not supplied, so this confirmation must not be described as a fresh build-139 installation test. Google warns that configuration changes may take five minutes to a few hours to propagate.

At this audit, Play showed **1.2.10 / 133** as the public production release. **139 (1.2.11) · Trivia** is now approved and **ready to publish**, with managed publishing still on. It has not been published by this repair. Inspected AABs 133, 135, 138 and 139 use the same upload certificate and packaged production Google IDs. See the [artifact audit](qa/2026-10-31-google-sign-in/audit.json).

## Checks required before every Android release

1. Inspect the actual signed production artifact, not just `.env.local`: verify the package, packaged web audience, production API/database, version code and upload certificate. Record the artifact hash. EAS secret variables can be available to cloud builds even when omitted from the Plaintext/Sensitive log listing.
2. Read the **Play app signing** certificate in Play Console. The AAB/upload certificate is different and does not prove Google sign-in will work for Play installs. Check all active certificates if Play key upgrades introduce more than one.
3. In the Google Auth Platform project for the packaged **web** client, confirm an active Android OAuth client for the exact package and Play signing SHA-1. Check Deleted credentials if it disappears. Do not replace a production client with a debug or upload certificate to make a local build pass.
4. Confirm the production Supabase Google provider uses the same web audience. Keep the iOS client and URL scheme aligned separately. `google-services.json` belongs to the Firebase push project `glory-app-cf113` (`618700854180`); its automatically generated OAuth IDs do not replace Sanctuary's explicit sign-in IDs in `glory-app-437300`.
5. Install through Google Play's internal testing or production track and complete Google sign-in on a physical device. Confirm token receipt, a successful Supabase session, app reopen and sign-out. A directly installed EAS APK uses another certificate and is insufficient for this check. Do not mark the release's authentication acceptance passed without this observation.
6. If Google reports a configuration error, inspect package/project/certificate registration and recent Google Cloud changes before rebuilding. Preserve Google managed publishing and Apple manual release holds unless release publication is authorized.

Reference: [Google client authentication](https://developers.google.com/android/guides/client-auth), [Google Sign-In troubleshooting](https://react-native-google-signin.github.io/docs/troubleshooting).
