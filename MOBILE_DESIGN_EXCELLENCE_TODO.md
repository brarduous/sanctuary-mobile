# Sanctuary mobile: design excellence and release checklist

Updated: October 12, 2026. Autonomous refinement and store release pass. Physical-device, owner-account Apple sign-in and participant studies removed at the user’s request on October 12; none is marked passed.

This plan turns the goal of a 10/10 experience into concrete work and observable acceptance criteria. Scores are internal design judgments, not external certification. Existing fixes stay in place while the experience is refined.

## Current position

The app runs in Simulator. Native Google sign-in has returned to authenticated Home. The preference reminder is a branded overlay, and Later persists a new 30-day deadline. Scripture cards have bounded square-to-portrait sizing with complete long passages accessible. Main screens and many secondary flows have been inspected in light and dark. Live Spotify Profile results and RevenueCat Test Store offers have loaded. Native Giving has reached the correct Stripe sandbox checkout and recovered after closing it; no payment was submitted.

Remaining verification includes normal Google session restoration, loaded onboarding artist results, guest invite continuation through provider authentication, and successful test purchase/payment handling. Backend fixes have passed local tests but still need deployment and deployed-flow verification.

Evidence: [screenshot report](qa-screenshots/2026-10-11-baseline-2/index.html), [structured audit](qa-screenshots/2026-10-11-baseline-2/baseline-audit.json). Captures 245–258 are registered and stale summaries reconciled. The report separates current verification from historical captures; final-build regrading is still required.


### Release pass — October 12, 2026

Completed: Q01 evidence reconciliation (258 captures, all files validated), route/state inventory, source and archive QA cleanup, strict invite validation and scanner lifecycle (R05), synchronous checkout duplicate guard, cancellation form preservation, authenticated profile/membership stale-response protection, subscription account isolation, and compatible dependency patches. Normal Metro is retained; temporary QA backend/Metro on 3117/8082 are stopped. Private fixtures and signing material remain outside build uploads. Version 1.2.10 is prepared; npm is the mobile build’s single package manager.

Validation: mobile TypeScript, seven behavior checks (including real component lifecycles with mocked SDK/network boundaries), 4,756 Bible chapter preservation checks, Expo dependency compatibility, and 109 backend tests pass. These do not substitute for native provider/payment observations. Backend production dependency audit has no high/critical findings; mobile retains tooling/dependency advisories requiring assessment before a clean security claim.

Release blockers: final native interactions and new Mobbin inspections cannot run because computer control fails to start its native pipe; Render authentication is still expired; successful Stripe donation recording and RevenueCat purchase/restore remain unverified. Source inspection found that `/webhook` treats one-time checkout completion as subscription completion, while `/stripe/checkout` supplies no donation ledger metadata. R03 needs a proper idempotent donation path and test verification. Store submission remains pending these blockers.

Backend candidate: [PR #11](https://github.com/brarduous/sanctuary-backend/pull/11). Production’s 33 migration versions match local inventory; this backend candidate needs no new migration. Deployment rollback is the previously deployed application commit; no schema rollback is necessary for this candidate.

## Priorities and completion rules

| Priority | Meaning | Completion requirement |
| --- | --- | --- |
| P0 | Evidence, reliability, or release blocker | Actual flow verified; fix and evidence recorded |
| P1 | Largest improvement to design and daily use | Implemented, inspected in compact/large Simulators in both themes, and regraded |
| P2 | Final interaction and consistency refinement | Measurable behavior verified and usability issues resolved |

Suggested roles below describe responsibility, not assigned people. Dependencies specify the work that should happen first. Every parent checkbox remains open until its acceptance criteria are met.

For every implementation task: preserve current unrelated changes; record the affected routes; run relevant type checks and behavior checks; save Simulator before/after evidence; update the audit with Simulator, appearance, state, and limitations. Avoid mirroring implementation details with unnecessary tests. Add regression tests for consequential state, data, and API behavior.

## Phase 1 — Establish a trustworthy baseline and design direction

### Q01 — Reconcile the current QC evidence

- [x] Complete Q01. **P0 · QA/engineering · First task**
- [x] Register captures 245–258, including Google authenticated Home, Church entry points, Giving form/keyboard/checkout recovery, and Volunteer navigation.
- [x] Replace stale “Google awaiting sign-in” and “native Giving unverified” summaries with the verified outcomes. Keep session restoration and successful payment explicitly open.
- [x] Separate historical failures from current unresolved issues. Earlier screenshots stay available as history; they must not drive the latest score when superseded.
- [x] Record current QA services and temporary isolated app configuration accurately. Confirm no QA session loader or privileged credentials entered production source.
- [x] Create a current route/state inventory covering guest, authenticated, incomplete onboarding, member, restricted access, populated, empty, loading, error, and success states where applicable.
- [x] Rebuild the HTML report using `node scripts/build-mobile-qc-report.mjs` and confirm all referenced images exist.

**Acceptance:** Each current grade links to the latest relevant screenshot. Remaining coverage matches observed reality. Native Google callback and sandbox checkout are distinguished from persisted sessions and completed payments.

### D01 — Expand the Mobbin comparison set

- [ ] Complete D01. **P1 · Design · Depends on Q01**
- [ ] Inspect comparable devotional/Bible, meditation, community, and giving/subscription experiences. Select apps based on relevant flows, not popularity alone.
- [ ] Compare Home hierarchy, daily reading, onboarding, community participation, giving, and subscription decision-making. Inspect dark variants when available.
- [ ] For each reference, save the app name, direct Mobbin screen/flow link, inspected state, screenshot where available, observation, and proposed Sanctuary application.
- [ ] Build a short comparison table: Sanctuary issue → observed reference pattern → intended improvement → verification method.
- [ ] Identify where Sanctuary should remain distinctive: warm reading surfaces, spiritual content, restrained gold emphasis, and church context.
- [ ] Record inaccessible or uninspected states as gaps. Do not infer a complete app experience from one reference screen.

**Acceptance:** Every major flow has an inspected comparable pattern or an explicit gap. References support concrete decisions; they do not become a collection of unrelated visual styles.

### D02 — Define and apply a shared design system

- [ ] Complete D02. **P1 · Design/engineering · Depends on D01**
- [ ] Audit `constants/Colors.ts`, `constants/Layout.ts`, shared controls, and inline styles for inconsistent spacing, radii, borders, typography, and action hierarchy.
- [ ] Define semantic roles for page background, elevated surface, inset reading surface, primary text, secondary text, separator, selection, focus, error, and disabled states in both themes.
- [ ] Define typography roles for screen title, section heading, reading body, metadata, form label, helper text, and action label. Specify wrapping and font-scaling behavior.
- [ ] Establish spacing and component geometry for screen gutters, section gaps, card padding, row height, icons, and bottom safe areas.
- [ ] Standardize primary/secondary/text actions, selection controls, headers, modal close controls, loading/error states, and card families. Keep editorial reading and actionable list rows visually distinguishable.
- [ ] Apply the system incrementally to Home, then high-use routes. Consolidate repeated styles only when the shared behavior is genuinely reusable.

**Acceptance:** The same control has consistent geometry, semantics, and theme behavior across routes. Gold has a clear emphasis role. No text or essential state relies solely on color. Long labels and enlarged text fit.

## Phase 2 — Elevate the everyday experience

### D03 — Redesign Home around a clear daily experience

- [ ] Complete D03. **P1 · Design/engineering · Depends on D02**
- [ ] Inventory everything currently above and below the fold in `app/(tabs)/index.tsx`. Rank it by user value and frequency of use.
- [ ] Create a clear first action around daily scripture/devotional content. Establish a deliberate hierarchy between the greeting, daily content, supporting actions, and church/community content.
- [ ] Reduce competing visual emphasis: avoid giving every card the same weight, repeated strong borders, or multiple equally prominent actions in one viewport.
- [ ] Refine hero imagery/cropping, title wrapping, supporting metadata, and card spacing using actual short and long content.
- [ ] Make the next action understandable from its label and placement. Ensure scripture, reflection, and church content lead to the expected destination.
- [ ] Design guest, member, no-church, loading, and unavailable-content variants using the same hierarchy.
- [ ] Verify the scripture card remains 1:1 by default and can grow to approximately 3:4. Preserve complete passage access, clear continuation controls, and the full reader.
- [ ] Capture first viewport and full-scroll evidence on compact and larger iPhones in light/dark, including a long passage and long devotional title.

**Acceptance:** A new user can identify the daily action without coaching. No primary action is hidden or overlapped. Card sizing is intentional across content lengths. The daily reading can be opened and completed in Simulator.

### D04 — Unify Bible, devotional, News, and lesson reading

- [ ] Complete D04. **P1 · Design/engineering · Depends on D02**
- [ ] Compare `app/(tabs)/bible.tsx`, devotional and News detail routes, church lesson/journey/video readers, `ChurchLessonContent`, `ReadingControls`, and `ScriptureLinkifier`.
- [ ] Align readable text measure, title/body rhythm, verse-number spacing, paragraph spacing, metadata, and Scripture-link treatment while respecting each content type.
- [ ] Keep navigation and close controls discoverable without making headers dominate the reading experience.
- [ ] Review nested cards and section decoration; remove visual weight that interrupts continuous reading without conveying meaning.
- [ ] Verify long titles, nested HTML, lists, quotations, links, final paragraphs, closing prayers, reflections, and full passages render without content loss.
- [ ] Define reading-position behavior for closing a Scripture overlay, returning from a detail view, and resuming the app. Implement preservation where appropriate.
- [ ] Check translation/chapter pickers, selected state, focus, full-list scrolling, and return to the intended passage.

**Acceptance:** Reading remains comfortable in both themes, no content is truncated or silently dropped, and temporary overlays return users to the same reading position. Evidence includes final content, not only the header.

### D05 — Refine navigation, feeds, and saved-content discovery

- [ ] Complete D05. **P1 · Design/engineering · Depends on D02–D03**
- [ ] Review main tab labels and selected indicators against the actual destinations and recurring user tasks.
- [ ] Make Library/history entry points, saved content, Guidance history, and personal News feed understandable and consistent.
- [ ] Standardize feed section headings, card metadata, image fallback behavior, and actionable rows. Avoid overusing text on imagery.
- [ ] Check sticky headers and scroll behavior on SE; resolve any collision between screen titles, filters, and header actions.
- [ ] Verify back behavior from deep links, notifications where testable, unknown links, and nested readers. Recovery should land at a sensible destination.
- [ ] Retain the new actual Church → Give and Church → Volunteer entry points; confirm discoverability and hierarchy within the refined Church screen.

**Acceptance:** Users can locate saved content and key church actions without guessing. Selected navigation is visible in both themes. Back/close behavior does not strand users or reopen an unrelated screen.

### D06 — Refine onboarding, Profile, and preference reminders

- [ ] Complete D06. **P1 · Design/engineering · Depends on D02; service verification R02**
- [ ] Review step headings, progress, explanations, required/optional labels, validation timing, and primary action placement across all onboarding steps.
- [ ] Verify long choice labels, Other text entry, artist portraits, selection/removal chips, five-artist limit, no-results, loading, and retry behavior with real results.
- [ ] Keep keyboard dismissal and the next action predictable on compact devices. Preserve entered values when opening explanations or moving between steps.
- [ ] Align Profile preference controls with onboarding without obscuring existing saved selections or implying unsaved changes are committed.
- [ ] Refine the branded preference overlay’s hierarchy, copy, dismissal, and focus behavior. Keep Later’s 30-day reset and prevent repeat prompts at each login.
- [ ] Verify reminder timing and dismissal across cold launch, relogin, failed preference writes, and time boundaries. Define fallback behavior if persistence fails.

**Acceptance:** Users understand what they are choosing and when it saves. No choice is hidden by the keyboard. Existing preferences survive cancellations. Reminder behavior matches its visible promise.

### D07 — Refine Church, Volunteer, Giving, and subscription decisions

- [ ] Complete D07. **P1 · Design/engineering · Depends on D02, R03–R04**
- [ ] Review Church content hierarchy: updates, studies, weekly journey, Give, and Volunteer. Use clear section priorities rather than equally weighted containers.
- [ ] Make Volunteer assignment date, role, location where available, response status, and next action scannable. Distinguish restricted access from empty schedules and errors.
- [ ] Refine Giving amount entry, fund selection, recipient identity, minimum/invalid amount feedback, disabled submit state, and return from checkout.
- [ ] Preserve the Done keyboard accessory and reachable submit action in both themes. Confirm no accidental repeat checkout on rapid taps.
- [ ] Refine paywall benefit hierarchy and actual store price/period disclosure. Keep Restore, close, renewal information, and unavailable-offer recovery visible.
- [ ] Ensure successful, canceled, and failed actions have truthful feedback and a clear next step. A canceled checkout must not imply a donation was recorded.

**Acceptance:** Users understand where money goes, what a subscription costs, and what action they are confirming. Volunteer state matches backend data. All critical actions remain accessible on compact screens.

## Phase 3 — Make the experience feel finished

### D08 — Audit dark mode as an independent design

- [ ] Complete D08. **P1 · Design/QA · Depends on D03–D07**
- [ ] Inspect every current route/state in dark appearance, including overlays, pickers, forms, media, keyboard, loading, error, and disabled controls.
- [ ] Tune surface separation, border visibility, image contrast, muted text, and gold emphasis. Avoid flat stacks of indistinguishable dark cards.
- [ ] Measure text and essential control contrast against their actual surfaces using applicable accessibility criteria. Verify selected and focus states without relying solely on color.
- [ ] Check system appearance changes while screens and overlays are open; no stale light surface or unreadable transition state should remain.
- [ ] Pair settled light/dark captures of the same content and state for regrading.

**Acceptance:** Both themes have deliberate hierarchy and readable secondary content. No route is accepted based only on its light screenshot.

### D09 — Complete accessibility and adaptive-layout checks

- [ ] Complete D09. **P1 · Engineering/QA · Depends on shared design system**
- [ ] Test default, large, and accessibility text sizes on compact and larger devices. Let rows and controls grow rather than clipping essential text.
- [ ] Verify VoiceOver labels, roles, checked/selected/disabled states, reading order, heading structure, and overlay focus return.
- [ ] Ensure interactive controls meet at least 44-point touch targets; audit tightly spaced icons and close controls in particular.
- [ ] Check reduced motion, bold text where relevant, screen safe areas, and keyboard avoidance. Respect reduced-motion preferences in custom animations.
- [ ] Verify meaningful feedback is available beyond visual color or animation, including save errors and selection limits.

**Acceptance:** Core journeys can be completed with VoiceOver and enlarged text. No essential action disappears, overlaps, or becomes unreachable. Findings include actual native observations.

### D10 — Refine transitions, feedback, and state continuity

- [ ] Complete D10. **P2 · Design/engineering · Depends on D03–D07**
- [ ] Audit navigation transitions, overlay appearance/dismissal, selection feedback, keyboard behavior, media handoff, and save/completion feedback.
- [ ] Introduce restrained motion and optional haptics only where they clarify a state change or completed action. Keep timing consistent and respect reduced motion.
- [ ] Remove layout jumps caused by late-loading images, fonts, or inconsistent loading containers. Reserve sensible space for async content.
- [ ] Preserve relevant query, filter, selected fund, and reading state across temporary navigation. Define which fields intentionally clear after completion or cancellation.
- [ ] Guard duplicate taps and stale async responses. Ensure buttons recover after cancellation or failure and do not remain loading indefinitely.

**Acceptance:** The app communicates state changes immediately and predictably. No unnecessary motion blocks an action; no cancellation leaves a stuck spinner or duplicate request.

### D11 — Finish loading, empty, error, offline, and permission states

- [ ] Complete D11. **P1 · Engineering/design · Depends on Q01 route/state inventory**
- [ ] Review each async screen for distinct loading, empty, restricted, unconfigured, failed, and populated states.
- [ ] Use concise explanations and a useful next action. Offer retry only when retry can help; use navigation or setup guidance for access/configuration limits.
- [ ] Test slow requests, lost network, reconnect, expired session, unavailable optional integrations, and broken image/media loads.
- [ ] Keep previously loaded content visible where safe rather than replacing the whole screen with a spinner during refresh.
- [ ] Verify camera/microphone permission requests occur in response to a relevant user action; denial and later settings changes have clear recovery.

**Acceptance:** Errors cannot masquerade as successful empty data. Optional failures do not obscure otherwise usable content. Recovery works without requiring an app restart.

## Phase 4 — Close functional and release gaps

### R01 — Verify authentication and invite continuity

- [ ] Complete R01. **P0 · Engineering/QA · Google callback already observed**
- [ ] Verify the normal Google-authenticated session survives bundle reload, background/foreground, and native cold launch. Confirm correct account identity and no unexpected onboarding or reminder.
- [ ] Verify sign-out and subsequent sign-in do not leave stale protected content or stale loading state.
- [ ] Test provider cancellation and recoverable failure from both Login and Join; retain the intended destination.
- [ ] Open a valid invite as a guest, authenticate, and complete joining the intended QA church. Verify resulting membership and destination; test invalid/expired invite recovery separately.

**Acceptance:** Google callback and restoration have Simulator evidence. A guest invite survives authentication and updates the correct membership. Apple provider success is outside this release pass and is not claimed verified.

### R02 — Verify loaded onboarding artist results

- [ ] Complete R02. **P0 · Engineering/QA · Dedicated QA account and live Spotify requested**
- [ ] Use an isolated QA flow with live Spotify search and an incomplete-onboarding QA profile. Keep privileged credentials out of the client and do not overwrite a real user's production preferences.
- [ ] Exercise search, loaded portraits/results, no results, error/retry, selection, removal, limit, keyboard dismissal, and theme changes on the actual onboarding route.
- [ ] Save synthetic QA preferences and verify persisted artist identity/count after reopening. Confirm shared Profile/onboarding identity matching remains correct.
- [ ] Restore temporary fixtures/configuration after recording evidence; document any remaining service/environment gap.

**Acceptance:** Real loaded onboarding results are captured in both themes. Saving and reopening preserve the chosen artists; Profile results alone do not close this task.

### R03 — Verify complete Stripe test payment handling

- [ ] Complete R03. **P0 · Engineering/QA · Native sandbox checkout already observed**
- [ ] Verify canceled checkout and browser/app return on a release-like build, including repeated attempts and interrupted network.
- [ ] Complete a sandbox payment using official test data through the approved test workflow. Verify the resulting checkout/payment state rather than assuming a success redirect means payment succeeded.
- [ ] Verify webhook/event processing and the app's donation record/status for the exact QA church, fund, currency, and amount.
- [ ] Check idempotency/duplicate delivery and failed-payment handling; a repeated event must not create duplicate donations.
- [ ] Confirm test/live configuration separation and correct return links for the intended deployed environment. Record test evidence without exposing keys or private checkout URLs.

**Acceptance:** One successful test donation has matching provider and application records; failed/canceled attempts do not record success. No live donation is required by this checklist.

### R04 — Verify RevenueCat purchase, entitlement, and restore

- [ ] Complete R04. **P0 · Engineering/QA · Offers, cancellation, and simulated failure already observed**
- [ ] Complete a successful test purchase with the intended test environment; verify entitlement changes and actual premium behavior.
- [ ] Verify restore on the appropriate account/build, reopening after purchase, and sign-out/account changes without leaking entitlements.
- [ ] Test canceled/failed purchase, empty offerings, integration unavailability, and expired/revoked test entitlement where supported.
- [ ] Confirm visible store price/period and terms agree with the configured product. Inspect compact light/dark disclosure and action placement.

**Acceptance:** Purchase, restore, and entitlement lifecycle are observed, not inferred from a loaded offer. The UI returns to usable actions after every failed/canceled path.

### R05 — Verify invite parsing and scanner lifecycle in source

- [x] Complete R05. **P0 · Engineering · No physical device required**
- [x] Reject unrelated, malformed and invalid invite URLs; retain valid web/deep links and raw invite tokens.
- [x] Guard duplicate scan callbacks synchronously and stop rendering the camera when the route loses focus.
- [x] Verify valid/invalid invite handling with deterministic regression checks retain existing light/dark Simulator permission/close evidence. New runtime interaction remains unavailable this pass.

**Acceptance:** Source checks cover parsing and duplicate/lifecycle behavior. Hardware capture quality and actual QR scanning are outside this pass; no hardware success is claimed.

### R06 — Deploy and verify backend remediations

- [ ] Complete R06. **P0 · Engineering/release · Depends on reviewed backend change set**
- [ ] Inventory the backend changes and necessary migrations, including member content access, Volunteer ordering/responses, News contracts, journey progress errors, and optional integration startup/recovery.
- [ ] Reconcile staging migration history with the target environment; review access/privacy policies and prepare migration verification and rollback steps.
- [ ] Run relevant backend checks on the final reviewed change set. The previous 109 passing tests are historical evidence, not a substitute for checks after new changes.
- [ ] Deploy through the project's established release process and verify authenticated mobile → deployed API → data → response behavior.
- [ ] Confirm failures remain distinguishable from empty/disabled states and sensitive/privileged fields are not exposed in member responses.

**Acceptance:** The intended deployed version and schema are confirmed; actual member journeys work against it. Local staging success does not close deployed verification.

### R07 — Validate the final native build and clean QA scaffolding

- [ ] Complete R07. **P0 · Engineering/QA · Depends on in-scope R01–R06 and final UI changes**
- [ ] Build/install a release-like native app to catch issues hidden by Metro/development tooling: provider redirects, deep links, fonts/assets, payment return, startup, and production integration configuration.
- [ ] Test cold start, background resume, and core navigation on compact and current larger iPhones. Use Simulator-supported checks and production exports; record hardware-only gaps separately.
- [ ] Inspect runtime logs for relevant crashes or failed boundaries, with secrets and private content redacted.
- [ ] Remove temporary QA loaders, loopback endpoints, overrides, and diagnostic logging from shipping source/configuration. Stop temporary QA services when their work is complete.
- [ ] Keep reusable private QA fixtures secured and separate from distributable artifacts. Leave the normal app configuration and intended appearance restored.

**Acceptance:** The app works without development-only session injection or local server assumptions. Shipping artifacts contain no privileged QA configuration. Final build/version and device evidence are recorded.

## Phase 5 — Regrade and validate available flows

### Q02 — Perform the final screen/state QC pass

- [ ] Complete Q02. **P1 · Design/QA · Depends on completed refinements and verified final build**
- [ ] Capture every route and critical state from the Q01 inventory, in both themes, on compact and larger layouts. Include enlarged text, keyboard, long content, and below-fold completion evidence where relevant.
- [ ] Grade hierarchy, consistency, readability/accessibility, interaction/state quality, and task clarity separately. Mark untested dimensions as unverified rather than assigning a score from a screenshot.
- [ ] Compare the latest captures with inspected Mobbin references and identify remaining justified differences.
- [ ] Fix and recapture all material clipping, inaccessible actions, misleading states, hierarchy problems, and continuity failures.
- [ ] Publish the updated local report with current captures, benchmark observations, validations, limitations, and remaining work.

**Acceptance:** No unresolved critical/high-severity design or functional finding. Each route has current evidence and any residual minor issue is explicitly listed. A high visual score cannot override a broken task.

## Recommended execution order

1. Reconcile evidence (Q01), inspect stronger references (D01), establish shared design rules (D02).
2. Refine Home (D03) as the design anchor; review it before propagating the approach.
3. Apply the system to reading, navigation, preferences, and church actions (D04–D07).
4. Complete theme, accessibility, interaction, and exceptional-state checks (D08–D11).
5. Close service gaps and deployed behavior (R01–R06); validate the final native build and cleanup (R07).
6. Regrade all current states (Q02); address findings and recapture affected states.

Reliability work R01–R06 can proceed alongside design when it does not depend on the changed UI. Q01 should be completed before discussing a new aggregate score. External dependencies in this pass are service authentication and the project’s release/deployment process.

## Final acceptance gate

- [ ] Home and every major flow follow the refined Sanctuary design system.
- [ ] All critical journeys work on the final build with truthful success/failure states.
- [ ] Light, dark, compact layout, enlarged text, and VoiceOver checks have current evidence.
- [ ] No content truncation, hidden essential action, stuck loading, or repeat-login reminder defect remains.
- [ ] In-scope Google authentication, onboarding, membership, test giving, entitlement, and restore behavior are verified end to end.
- [ ] Backend fixes are verified in the intended deployed environment.
- [ ] Current Simulator screenshots and automated behavior checks support the quality assessment; limitations are explicit.
- [ ] Temporary QA scaffolding is absent from shipping artifacts.

Completion means meeting these observable criteria. The 10/10 ambition remains a design target, not a promise that no future improvement will be possible.
