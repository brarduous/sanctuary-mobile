# Focused pilot readiness — 2026-09-21

## Release state

| Item | State | Evidence / next action |
| --- | --- | --- |
| Campus entry | Live | `https://www.sanctuaryapp.us/campus` returns 200. The application endpoint validates required fields; no real application was submitted during verification. |
| Web source and store click | Partly live | Campus and Daily emit `store_click`; Campus includes source path and UTM context. Confirm the GTM destination receives these events. |
| Install attribution | Missing | Store clicks cannot yet be joined reliably to installs. Choose a supported attribution method before paid acquisition. |
| First devotional completed | Missing | The native devotional page offers reading, audio, prayer, and sharing, but no user completion action or event. Backend `daily_devotionals.status = completed` means generation finished, not that a reader finished. |
| Day-seven return | Missing | Define a distinct return event and cohort query after first devotional completion. |
| Fresh store-install test | Pending | No connected Android device or booted iPhone simulator was available. Recruit unfamiliar testers using current App Store and Play builds. |
| Studio founding creator route | Live after Studio deployment | `/studio/founding` explains no-card access, gives first-project steps, and invites feedback. The current Studio deployment does not force checkout. |

## First-week test script

Recruit at least two unfamiliar iPhone users and two unfamiliar Android users. Give each only the store listing and a campus pilot link with a distinct `utm_campaign`. Observe without coaching: open listing, install, launch, create or skip an account, find today's Scripture, read the reflection and prayer, and describe whether they believe they finished. Ask them to return on day seven. Record device/OS, source link, each step's result, time to first devotional, confusion, and return. Do not count content generation as reader completion.

## Event definitions

- `campus_landing_view`: one page view, with route and UTM values.
- `store_click`: one store-button click, with platform, placement, campaign, and source. This is live on the web.
- `install_attributed`: first app open joined to a campaign by a supported attribution mechanism; not yet implemented.
- `first_devotional_completed`: first authenticated, deliberate reader completion, stored once per user. Requires an in-app completion action and backend idempotency.
- `day_seven_return`: app foreground or a meaningful action on local day 7 after first completion. Report both exact-day and days 6–8 windows to account for time zones.
- `studio_first_content_pack_completed`: successful persisted pack generation, once per user on the server; current browser-local event is insufficient across devices.
- `clergy_first_care_or_group_workflow`: successful backend mutation for care follow-up or group setup, once per ministry.

## Store listing draft

**Opening line:** Five meaningful minutes with God: Scripture, reflection, and prayer for everyday life.

**Description lead:** Start with a short Scripture passage. Pause with a reflection that connects faith to real life. End with a simple prayer. Sanctuary helps you return to that rhythm each day, wherever you are. You can also save what matters and, when your church participates, connect with its updates and community.

**Screenshot order:** 1. Today's Scripture, 2. reflection, 3. prayer, 4. return habit / saved content, 5. optional church features. Use screenshots from the current store builds and ensure every caption describes a feature visible in that build.

The current iPhone listing leads with a broad faith-and-church description. Update its text and screenshots in App Store Connect. Review the Android listing in Play Console before changing it; automated access to that console was unavailable during this audit.

## Trust review before scale

- Inventory account identifiers, profile preferences, prayer content, church interactions, payment SDK data, notifications, and analytics sent by the mobile app and its SDKs. Reconcile that inventory with the Google Play Data safety declaration and the public privacy policy. Do not assume “No data collected” is accurate merely because some features are optional.
- The App Store publicly shows Brandon Jones as seller. Apple states that an individual membership uses the legal name. If founder privacy requires an organization seller, the account holder should evaluate Apple's individual-to-organization request and its documentation requirements; changing listing copy alone will not change the seller.
- Keep partner language factual. Start with two local Black campus groups and one local women's Bible-study leader, each testing a four-week use case. Do not imply endorsement by InterVarsity, Impact, or the National Baptist Convention. Do not use Impact's no-solicitation contact form for outreach.

## Go / no-go for paid acquisition

Hold paid acquisition until a store-install test succeeds on both platforms, the first devotional completion and day-seven return definitions are measurable, the founding creator journey has been tested with a real invited user, and store privacy declarations are reconciled with the app's actual data handling.
