# StackBriefs Development Backlog

**Status:** Approved task source for Paperclip backlog creation
**Product contract:** [PRD.md](PRD.md)
**Implementation contract:** [toolify-clone-development-plan.md](toolify-clone-development-plan.md)
**Production repository:** `/home/ja/stackbriefs`
**Visual reference only:** `/home/ja/ai-website-cloner-template`

## Backlog execution contract

The tasks below are ordered by dependency and product risk. Every task starts in `backlog` and represents one independently reviewable outcome.

Unless a task says otherwise:

- use one isolated worktree and one focused branch from the current accepted `main` baseline;
- write the smallest failing automated test or verification that proves the missing behavior before implementation, then make it pass and refactor only when the passing solution is unnecessarily complex;
- make surgical changes only: no unrelated cleanup, speculative abstraction, unrequested configuration, or dependency addition;
- reuse native HTML, Astro, Tailwind, browser APIs, and existing project patterns before adding code or packages;
- include tests in the same PR as the behavior they protect;
- push the branch to `origin`, open one focused PR, and attach exact command results plus screenshots for visible changes;
- require the exact Paperclip Agent `Reviewer` for every code or repository-change task; use `Review focus` to describe the required domain lens without inventing Agent names;
- after Reviewer accepts the PR, Chief of staff owns the merge/reconciliation handoff: merge through the accepted repository workflow or obtain the required Board action, update local `main`, and attach the merged commit evidence;
- Reviewer records the final Paperclip review decision only after the accepted PR is merged, the merge commit is present on `main`, and the clean merged baseline has been reconciled;
- a task with `Approver: Board` advances to Board approval only after independent review and merged-main reconciliation; Board approval is reserved for the explicit high-risk Gates below;
- run `npm run check`, the relevant focused tests, `npm test`, and `npm run build`; run `npm run test:schema`, Playwright, axe, preview, or HTTP checks when the task makes those gates applicable.

`Reviewer` and `Approver` describe Paperclip execution-policy stages. `Approver: No` means independent review is sufficient. `Watchdog` is separate issue-level configuration, not an execution-policy stage. When a task names `Hermes Chairman Assistant`, attach that Watchdog only when Chief of staff releases the issue into `todo` or `in_progress`; never attach it while the issue is inert in `backlog`. A Watchdog monitors liveness and evidence only and is not a substitute for tests, review, approval, or task ownership.

Before any task is routed, the named Agent's current instructions must authorize its scope. In particular, Frontend Engineer must have the approved, StackBriefs-only Cloudflare Pages boundary: it may configure and verify this site's static Pages build, Preview, release-branch deployment, redirects, and headers, but may not alter account ownership, billing, unrelated projects, Workers, secrets, or DNS without an explicit Board-authorized task.

---

## Phase 1 — Walking skeleton

### SB-101 — Publish the approved development baseline

- **Priority:** Critical
- **Complexity:** Small
- **Dependencies:** None
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Repository baseline, CI reproducibility, and scope integrity
- **Approver:** No
- **Watchdog:** No

**Objective:** Make the approved local baseline available on `origin/main` and prove that the remote repository can execute the existing harness before product implementation starts.

**Scope:**

- reconcile local `main` and `origin/main` without rewriting history;
- publish the approved baseline commit through the repository's accepted merge path;
- verify the remote CI run uses Node 24, `npm ci`, check, unit test, and build steps.

**Test/verification-first loop:** Capture the initial ahead/behind state and remote CI baseline, publish the missing commit, then prove local and remote `main` identify the same accepted commit and CI is green.

**Completion conditions:**

- the approved PRD, development plan, development backlog, package files, and TypeScript configuration are present on `origin/main`;
- the working tree is clean and local `main` matches `origin/main`;
- the corresponding GitHub Actions run succeeds.

**Acceptance evidence:** `git status --short --branch`; `git rev-list --left-right --count main...origin/main`; successful GitHub Actions URL; `npm run check`; `npm test`; `npm run build`.

**Non-goals:** Product code, dependency upgrades, branch-protection redesign, or Cloudflare deployment.

### SB-102 — Establish the production visual foundation

- **Priority:** High
- **Complexity:** Medium
- **Dependencies:** SB-101
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Visual tokens, typography, responsive behavior, and accessibility
- **Approver:** No
- **Watchdog:** No

**Objective:** Replace the placeholder warm-cream styling with the approved StackBriefs tokens, typography, spacing, focus treatment, and local identity assets.

**Scope:**

- implement the minimum color system, typography scale, spacing, radius, border, shadow, motion, container, and layer tokens;
- self-host the required Geist font assets with the approved system-font fallback stack used only during load failure;
- place stable Logo/favicon/manifest assets in their correct Astro asset locations;
- use the Toolify clone only to inspect container and spacing geometry, never to copy runtime code or assets.

**TDD loop:** Add token/contrast and base-render assertions first, observe failure against the placeholder stylesheet, then implement the minimum passing visual foundation.

**Completion conditions:**

- placeholder colors and layout rules are removed;
- one brand color plus success, warning, and danger states pass tested contrast pairs and retain non-color cues;
- base typography and page gutters reflow from 320px through the wide container;
- reduced-motion and visible focus defaults exist.

**Acceptance evidence:** focused Vitest token/render tests; automated contrast results; `npm run check`; `npm test`; `npm run build`; screenshots at 360, 768, and 1440 widths.

**Non-goals:** Page-specific composition, dark mode, decorative illustration, a generic design-system package, or a component library.

### SB-103 — Build the shared shell and navigation

- **Priority:** High
- **Complexity:** Medium
- **Dependencies:** SB-102
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Navigation semantics, keyboard behavior, responsive shell, and accessibility
- **Approver:** No
- **Watchdog:** No

**Objective:** Provide the reusable Header, mobile navigation, Footer, Breadcrumbs, Skip Link, and accessible page-layout primitives used by every P0 route.

**Scope:**

- implement `SiteHeader`, `MobileNav`, `SiteFooter`, `Breadcrumbs`, and shared layout slots;
- expose only Browse scenarios, Methodology, and Affiliate disclosure destinations;
- implement current-page state, Escape/outside close, focus entry/return, and scroll locking for the mobile menu;
- keep navigation useful without client-framework runtime code.

**TDD loop:** Write component-render tests for landmarks, destination parity, labels, `aria-current`, and menu control relationships before implementing the shell.

**Completion conditions:**

- desktop and mobile navigation expose the same approved destinations;
- keyboard focus is visible and returns to the menu trigger after close;
- Header/Footer structure is consistent across a fixture page and a reading page;
- no login, search, Tool Library, submit, rankings, or commercial CTA appears.

**Acceptance evidence:** focused Astro component/Vitest tests; keyboard walkthrough; `npm run check`; `npm test`; `npm run build`; screenshots at 360, 768, and 1440 widths.

**Non-goals:** Decision filters, route content, account navigation, or a general-purpose navigation framework.

### SB-104 — Create the P0 route and status-page skeleton

- **Priority:** High
- **Complexity:** Medium
- **Dependencies:** SB-103
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Route contract, static fallback behavior, redirects, and status-page semantics
- **Approver:** No
- **Watchdog:** No

**Objective:** Make every P0 route addressable with meaningful static placeholder content and shared layouts before domain behavior is connected.

**Scope:**

- create route skeletons for Home, Decision, Tool, Methodology, Affiliate Disclosure, and `/404.html`;
- implement a shared `StatusPage` presentation for unavailable, blocked, and retired states;
- configure the permanent `/decision` to `/#scenarios` redirect using the approved static deployment mechanism;
- configure the production `site` value and one repository-wide trailing-slash policy before route behavior expands;
- ensure every page has one H1, recovery navigation, and useful HTML without JavaScript.

**TDD loop:** Add route/build-output assertions for the required paths, redirect artifact, headings, and `noindex` status markup before creating the pages.

**Completion conditions:**

- all P0 routes build successfully and use the shared shell;
- `/decision` redirects permanently to `/#scenarios`;
- 404/status pages expose approved recovery paths and no misleading decision controls;
- route placeholders are explicitly non-production fixture content.

**Acceptance evidence:** focused route tests; built `dist` inspection; `npm run check`; `npm test`; `npm run build`; JavaScript-disabled route inspection; screenshots for each distinct layout.

**Non-goals:** Content Collections, filtering, evidence resolution, Tool conclusions, sitemap, or final trust copy.

### SB-105 — Implement the Home discovery experience with fixtures

- **Priority:** High
- **Complexity:** Medium
- **Dependencies:** SB-104
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Scenario-first discovery, deterministic ordering, responsive presentation, and product-scope fidelity
- **Approver:** No
- **Watchdog:** No

**Objective:** Turn Home into the approved scenario-first discovery page using deterministic fixture rows and the Toolify reference only for bounded list geometry.

**Scope:**

- implement compact Hero, `#scenarios`, Scenario rows, three-step process explanation, trust links, and Footer composition;
- show goal, prerequisites, boundary summary, candidate count, dimension count, and review context;
- sort fixtures by normalized Scenario title then slug;
- prohibit ratings, featured placement, popularity, deals, Affiliate value, and file-order sorting.

**TDD loop:** Add failing tests for stable ordering, prohibited commercial inputs, required row fields, and Home anchors before implementing the list.

**Completion conditions:**

- Home communicates the product promise and leads directly to Scenario decisions;
- repeated fixture input yields stable row order;
- the full page is meaningful without JavaScript;
- layout remains readable at 320px, 400% zoom, tablet, and desktop.

**Acceptance evidence:** focused ordering/render tests; `npm run check`; `npm test`; `npm run build`; keyboard inspection; screenshots at 360, 768, and 1440 widths.

**Non-goals:** Search, Tool directory, real production content, Analytics, or dynamic ranking.

---

## Phase 2 — Decision vertical slice

### SB-201 — Define the authoritative content schema and heterogeneous fixtures

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-105
- **Suggested assignee:** Backend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Content contract, heterogeneous modeling, reference integrity, and fixture isolation
- **Approver:** No
- **Watchdog:** No

**Objective:** Establish one Astro Content Collections contract for Scenario, Tool, Scenario Candidate, Source Observation, Offer, and trusted page content.

**Scope:**

- implement `src/content.config.ts` and collection folders;
- validate immutable IDs/slugs, references, Scenario prerequisites, dimension/operator compatibility, values, dates, URLs, lifecycle fields, hands-on states, and Offer states;
- add immutable publication-history semantics through optional `firstPublishedAt` and identify non-production fixtures explicitly;
- add two materially different fixture Scenarios with different dimension structures;
- implement `tests/content-schema.test.ts` and add `npm run test:schema` to CI only after it passes.

**TDD loop:** Write legal and illegal fixture cases first, confirm the schema suite fails for missing references, wrong scope, invalid dates/operators/URLs/states, then implement the minimum schema that makes them pass.

**Completion conditions:**

- one schema is authoritative for content and Domain assembly;
- the two fixtures prove Scenario-local dimensions and Candidate/Tool separation;
- Offer data remains structurally outside decision eligibility fields;
- schema failures identify the record and actionable cause.

**Acceptance evidence:** `npm run test:schema`; focused negative-case tests; `npm run check`; `npm test`; `npm run build`; successful CI including the schema job.

**Non-goals:** CMS, database, global dimensions, publication service, approval digest, UI filtering, or real production Scenario selection.

### SB-202 — Assemble content and validate publication lifecycle

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-201
- **Suggested assignee:** Backend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Domain assembly, lifecycle correctness, publication history, and Scenario isolation
- **Approver:** No
- **Watchdog:** No

**Objective:** Convert validated collection entries into framework-independent Domain objects and derive public exposure or blocked lifecycle outcomes.

**Scope:**

- implement the Astro-aware assembler and `src/domain/publication.ts`;
- resolve Scenario, Tool, Candidate, Source, replacement, and Offer references;
- derive published, hidden, blocked, retired, replacement, and exposed-Tool outcomes;
- enforce Scenario-local blocking so one invalid Scenario does not block unrelated valid content.
- accept one typed `development | preview | production` build target and exclude fixture records from Production discovery, generated public routes, sitemap inputs, and structured-data inputs while retaining them in Development, Preview, and tests;

**TDD loop:** Add lifecycle and broken-reference cases first, including replacement errors, inactive Tools, stale gating claims, and an unrelated valid Scenario, then implement the assembler and validator.

**Completion conditions:**

- pure Domain outputs contain no Astro, DOM, browser-clock, UI, or Offer-to-decision dependency;
- invalid/draft content is not publicly exposed;
- blocked and retired outcomes carry enough information for status pages and redirects;
- validation messages are deterministic and actionable.

**Acceptance evidence:** focused publication tests; `npm run test:schema`; `npm run check`; `npm test`; `npm run build`.

**Non-goals:** Evidence ranking, filtering, route rendering, runtime CMS, or cross-Scenario publication priority.

### SB-203 — Implement deterministic evidence resolution

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-202
- **Suggested assignee:** Backend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Evidence authority, freshness, conflict, scope, and Affiliate neutrality
- **Approver:** No
- **Watchdog:** No

**Objective:** Resolve claim-level evidence into the PRD states using authority, scope, canonical value, freshness, and conflict rules.

**Scope:**

- implement `src/domain/evidence.ts` as a pure module;
- support verified fact, editorial assessment, not verified, needs recheck, not applicable, and conflicting states;
- enforce authority selection, wrong-scope exclusion, equal-authority conflict, and 7/30/90-day freshness windows;
- ensure browser time can only downgrade a deployed state.

**TDD loop:** Write matrix tests for authority, agreement, conflict, stale evidence, wrong scope, weak sources, not applicable, and browser/build expiry parity before implementation.

**Completion conditions:**

- identical evidence and clock input produces identical state and explanation;
- weak, stale, conflicting, or wrong-scope evidence never appears verified;
- source count, commission, confidence, and recency do not break equal-authority conflict;
- Offer fields cannot influence resolution.

**Acceptance evidence:** focused evidence tests; mutation/fixture checks for Affiliate neutrality; `npm run test:schema`; `npm run check`; `npm test`; `npm run build`.

**Non-goals:** UI badges, external evidence fetching, confidence scoring, LLM inference, or editorial automation.

### SB-204 — Implement deterministic decision evaluation

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-203
- **Suggested assignee:** Backend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Deterministic evaluation, stable ordering, explanations, and Affiliate neutrality
- **Approver:** No
- **Watchdog:** No

**Objective:** Evaluate required and optional Scenario conditions into stable matches, exclusions, explanations, and zero-result recovery data.

**Scope:**

- implement `src/domain/decision.ts` with `eq`, `contains`, `lte`, and `gte` operators;
- apply required AND semantics and keep `no_match` distinct from `unknown`;
- keep optional preferences explanatory only;
- sort by normalized Tool name then slug and derive explicit blocking-condition relaxation options.

**TDD loop:** Add failing tests for every operator, required/optional behavior, unknowns, stable order, explanation order, zero results, heterogeneous Scenarios, and Affiliate-only mutations before implementation.

**Completion conditions:**

- formal matches satisfy every required condition;
- optional changes never alter membership, ordering, alternatives, or conclusions;
- no condition is silently weakened and no universal winner is produced;
- repeated normalized inputs yield byte-stable candidate IDs/order/explanation order where serialized.

**Acceptance evidence:** focused decision tests; Affiliate-neutrality regression test; `npm run test:schema`; `npm run check`; `npm test`; `npm run build`.

**Non-goals:** Browser controls, global ranking, fuzzy matching, OR groups, scoring, or persisted recommendations.

### SB-205 — Implement URL state normalization and round trips

- **Priority:** High
- **Complexity:** Medium
- **Dependencies:** SB-201, SB-204
- **Suggested assignee:** Backend Engineer
- **Reviewer:** Reviewer
- **Review focus:** URL normalization, deterministic serialization, Scenario scope, and invalid-state handling
- **Approver:** No
- **Watchdog:** No

**Objective:** Provide one pure parser/normalizer/serializer for required, optional, shortlist, and comparison-fragment state.

**Scope:**

- implement `src/domain/url-state.ts` for `r`, `p`, `shortlist`, and `#comparison`;
- remove invalid dimensions, values, modes, duplicates, fifth items, deleted Tools, and cross-Scenario Tools;
- enforce one mode per dimension and deterministic serialization;
- keep temporary query and fragment state out of canonical metadata.

**TDD loop:** Write round-trip and invalid-input property tables first, including deleted and cross-Scenario cases, then implement the minimum parser and serializer.

**Completion conditions:**

- valid state round-trips without information loss;
- invalid state normalizes to one canonical representation;
- shortlist remains within 0–4 valid current-Scenario Tools;
- comparison fragment survives only with 2–4 valid shortlisted Tools.

**Acceptance evidence:** focused URL-state tests; `npm run check`; `npm test`; `npm run build`.

**Non-goals:** History API controller, storage, accounts, server sessions, or arbitrary query compatibility.

### SB-206 — Render the static Decision workspace

- **Priority:** High
- **Complexity:** Large
- **Dependencies:** SB-202, SB-203, SB-204, SB-205
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Scenario boundaries, prerequisites, static projection, responsive layout, and evidence visibility
- **Approver:** No
- **Watchdog:** No

**Objective:** Render published Scenario boundaries, criteria, deterministic results, exclusions, evidence summaries, and zero-result guidance as useful static HTML.

**Scope:**

- implement generated `/decision/[scenario]` pages and Decision components;
- replace the temporary Home fixture source with the published Scenario projections produced by the validated assembler;
- render Scenario header including prerequisites and boundaries, criteria structure, result summary, Candidate cards, excluded rows, and zero-result recovery;
- implement the approved rail/flow/sheet-ready responsive composition without interactive mutation yet;
- use the Toolify clone only for bounded filter/list proportions and spacing rhythm.

**TDD loop:** Add render tests for two heterogeneous fixtures, match/no-match/unknown labels, explanation order, boundaries, and zero-result content before building the page.

**Completion conditions:**

- each fixture renders only its own dimensions and Candidates;
- Home lists only published Scenario projections in stable title/slug order;
- evidence state, limitations, and exclusion reasons remain visible without JavaScript;
- no Offer or Affiliate field influences result presence or order;
- the document has no page-level horizontal overflow at required widths.

**Acceptance evidence:** focused render tests; `npm run test:schema`; `npm run check`; `npm test`; `npm run build`; JavaScript-disabled inspection; screenshots at 360, 768, and 1440 widths.

**Non-goals:** Live filter controls, shortlist, comparison, Tool detail, or browser History behavior.

### SB-207 — Add the browser, accessibility, and visual test harness

- **Priority:** High
- **Complexity:** Medium
- **Dependencies:** SB-206
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Browser-harness reliability, accessibility tooling, CI lifecycle, and test isolation
- **Approver:** No
- **Watchdog:** No

**Objective:** Add the smallest Playwright and axe harness needed to test the first interactive Decision slice and subsequent visible behavior.

**Scope:**

- add maintained Playwright and `@axe-core/playwright` dependencies with documented license and bundle/runtime impact;
- configure Chromium and WebKit core projects plus a bounded Firefox smoke path;
- add server lifecycle, screenshot, console-error, overflow, keyboard, and axe helpers without a general test framework layer;
- establish one passing static Home-to-Decision smoke; do not merge skipped, expected-failure, or intentionally failing placeholders for later tasks.

**TDD loop:** Define the minimal browser acceptance path, observe the new smoke fail before the harness exists, then make the harness and committed smoke pass. SB-208 owns its own failing interaction tests.

**Completion conditions:**

- browser tests run locally and in the selected CI job without leaking a server process;
- axe reports actionable serious violations;
- screenshots can be captured deterministically at 360, 768, and 1440;
- no client runtime dependency is added to production output.

**Acceptance evidence:** focused Playwright smoke; axe smoke; `npm run check`; `npm test`; `npm run build`; CI run URL.

**Non-goals:** Full end-to-end coverage, visual snapshot platform, Storybook, or cross-browser matrix expansion beyond the plan.

### SB-208 — Implement Decision filtering and zero-result interaction

- **Priority:** High
- **Complexity:** Large
- **Dependencies:** SB-205, SB-206, SB-207
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Browser-state correctness, mobile interaction, focus behavior, accessibility, and static fallback
- **Approver:** No
- **Watchdog:** No

**Objective:** Add the native browser controller for desktop live filters, mobile staged filters, explicit zero-result relaxation, URL updates, and History restoration.

**Scope:**

- implement required/optional controls from Scenario dimensions without duplicating Domain rules;
- implement desktop `replaceState`, mobile draft/Apply/Cancel/Clear behavior, and `popstate` restoration;
- implement the native-dialog filter sheet, focus containment/return, result-summary focus, and polite count announcements;
- fail safely to the static projection when JavaScript errors or is disabled.

**TDD loop:** Write browser tests for required/optional changes, mobile Apply/Cancel, zero results, explicit relaxation, invalid initial state, back/forward, focus, and JavaScript-disabled fallback before implementing the controller.

**Completion conditions:**

- desktop and mobile behavior match the History contract;
- zero-result recovery never changes a condition without explicit action;
- focus and result announcements are predictable without announcing the entire list;
- interaction cannot create false matches, hide evidence, or write persistent storage.

**Acceptance evidence:** focused unit and Playwright tests in Chromium/WebKit; axe results; `npm run test:schema`; `npm run check`; `npm test`; `npm run build`; screenshots at required widths.

**Non-goals:** Shortlist, comparison, cookies, local storage, remote state, or client framework adoption.

---

## Phase 3 — Shortlist, comparison, and Tool evidence

### SB-301 — Implement shortlist state and dock

- **Priority:** High
- **Complexity:** Large
- **Dependencies:** SB-208
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Shortlist invariants, URL state, focus behavior, responsive dock, and accessibility
- **Approver:** No
- **Watchdog:** No

**Objective:** Let users maintain a URL-only shortlist of one to four current-Scenario Candidates and understand changing eligibility.

**Scope:**

- implement pure shortlist operations and browser integration using normalized URL state;
- add Candidate add/remove controls and the safe-area-aware Shortlist dock;
- reject a fifth item with a visible reason;
- retain and clearly mark shortlisted Tools that stop matching until explicitly removed.

**TDD loop:** Add unit and browser tests for 0–4 states, fifth-item rejection, duplicate/deleted/cross-Scenario normalization, eligibility changes, removal focus, count announcement, and back/forward before implementation.

**Completion conditions:**

- shortlist state survives reload and History navigation through the URL only;
- Compare is disabled below two with a visible reason;
- the dock never covers focused or final content and respects mobile safe areas;
- no Tool is silently inserted, replaced, or removed except invalid-state normalization.

**Acceptance evidence:** focused shortlist tests; Playwright Chromium/WebKit; axe; `npm run check`; `npm test`; `npm run build`; mobile and desktop screenshots.

**Non-goals:** Persistent saved lists, cross-Scenario shortlist, accounts, or recommendation ranking.

### SB-302 — Implement scenario-scoped comparison

- **Priority:** High
- **Complexity:** Large
- **Dependencies:** SB-301
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Scenario-scoped comparison, table semantics, responsive overflow, and neutral presentation
- **Approver:** No
- **Watchdog:** No

**Objective:** Compare two to four shortlisted Tools with equal treatment using the active Scenario's dimensions, evidence states, and limitations.

**Scope:**

- implement a pure Scenario comparison projection;
- render a semantic table with caption, row headers, equal Tool columns, unknowns, limitations, and no winner treatment;
- connect `#comparison` open/back/invalidated behavior and focus restoration;
- contain narrow-screen horizontal scrolling inside the comparison region.

**TDD loop:** Write projection and browser tests for 2–4 Tools, unknown cells, no-longer-matching Tools, invalid fragment removal, Back behavior, table semantics, and page overflow before implementation.

**Completion conditions:**

- comparison never crosses Scenario boundaries or adds a winner;
- the same Scenario dimension order drives every column;
- mobile users retain identifiable Tool headers and all limitations;
- the document does not scroll horizontally.

**Acceptance evidence:** focused comparison tests; Playwright Chromium/WebKit; axe; `npm run check`; `npm test`; `npm run build`; screenshots at 360, 768, and 1440 widths.

**Non-goals:** Global comparison pages, scoring, highlighted winners, export, or persisted comparison state.

### SB-303 — Implement Tool detail routes and Scenario context

- **Priority:** High
- **Complexity:** Large
- **Dependencies:** SB-202, SB-203
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Tool identity separation, Scenario context, routing, responsive composition, and accessibility
- **Approver:** No
- **Watchdog:** No

**Objective:** Render neutral Tool identity and Scenario-specific contexts without inventing global fit or universal conclusions.

**Scope:**

- generate `/tool/[slug]` only for exposed Tools;
- render validated Breadcrumbs/return path, identity, neutral summary, Logo fallback, Official Link, Scenario contexts, limitations, hands-on state, and checklist;
- support direct entry without an active Scenario;
- use the Toolify clone only for Breadcrumb and long-form composition geometry.

**TDD loop:** Add render and route tests for Scenario entry, direct entry, multiple Scenario contexts, hidden Tools, invalid slug, long content, and missing/broken Logo before implementation.

**Completion conditions:**

- Tool identity remains separate from Scenario conclusions;
- return navigation cannot accept an arbitrary cross-origin value;
- inactive or unexposed Tools do not leak into discovery or generated public routes;
- missing assets preserve readable identity without layout shift.

**Acceptance evidence:** focused route/render tests; Playwright direct and Scenario entry; `npm run test:schema`; `npm run check`; `npm test`; `npm run build`; screenshots at required widths.

**Non-goals:** Tool Library, ratings, reviews, global score, vendor dashboard, or user submissions.

### SB-304 — Render claim evidence and separate outbound link types

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-203, SB-303
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Evidence language, outbound-link separation, security attributes, and Affiliate neutrality
- **Approver:** Board
- **Watchdog:** No

**Objective:** Present claim-level evidence, Official destinations, and optional qualifying Offers as structurally and visually distinct paths.

**Scope:**

- implement Claim rows, Evidence badges/disclosures, link groups, and Offer panel;
- display state, check date, source, scope, limitation, and hands-on status without overstating verification;
- keep Official Link present when Offer is absent, invalid, expired, rejected, or research-only;
- apply `noopener` to external new tabs and `rel="sponsored"` plus disclosure to Affiliate links.

**TDD loop:** Write render and invariance tests for every evidence state and Offer status, missing Offer, invalid Offer, Affiliate-only mutations, link attributes, and stale downgrade before implementation.

**Completion conditions:**

- Official, Evidence, and Offer elements are separately labeled and styled;
- stale/conflicting/not-verified evidence cannot render verified language;
- non-qualifying commercial records cannot render Deal/Discount language or active CTA;
- Affiliate data changes never alter Candidate eligibility, ordering, explanations, or comparison.

**Acceptance evidence:** focused evidence/link/neutrality tests; Playwright Tool flow; axe; `npm run check`; `npm test`; `npm run build`; screenshots with and without a qualifying Offer.

**Non-goals:** Affiliate tracking implementation, revenue reporting, vendor claims, paid placement, or runtime Offer fetching.

### SB-305 — Complete the interactive core journey and responsive accessibility gate

- **Priority:** High
- **Complexity:** Large
- **Dependencies:** SB-301, SB-302, SB-303, SB-304
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Independent end-to-end, responsive, browser, and accessibility verification
- **Approver:** No
- **Watchdog:** Conditional — Hermes Chairman Assistant; attach only when the Gate enters `todo` or `in_progress`

**Objective:** Independently verify the complete fixture journey from Home through Official Link across supported interaction and responsive states.

**Scope:**

- cover Home → Decision → filter → zero results → relax → shortlist → compare → evidence → Tool → Official Link;
- cover keyboard, touch, mobile Apply/Cancel, fifth-item rejection, back/forward, direct Tool entry, invalid state, JavaScript disabled, console errors, and bounded overflow;
- test 320/400% zoom, 360×800, 768 portrait/landscape, 1440×1000, forced colors, reduced motion, long content, and broken assets;
- record every failure with reproducible evidence and create a focused blocking defect task; do not implement fixes inside this Gate.

**Verification loop:** Run the defined matrix against one merged-main commit. If any check fails, keep the Gate blocked, route an atomic defect task through implementation and review, then rerun the affected check and the complete matrix against the new reconciled commit.

**Completion conditions:**

- the complete journey works with keyboard and touch;
- no serious axe violation, trapped focus, hidden critical information, uncaught console error, or page-level horizontal overflow remains;
- static content and Official Links remain useful without JavaScript;
- visible changes have reviewed screenshots at 360, 768, and 1440.

**Acceptance evidence:** complete Playwright Chromium/WebKit suite; Firefox smoke; axe reports; manual screen-reader/browser note; `npm run test:schema`; `npm run check`; `npm test`; `npm run build`; screenshot set.

**Non-goals:** Production content, SEO, Cloudflare deployment, Analytics, or P1 features.

---

## Phase 4 — Trust, SEO, security, and release

### SB-401 — Publish the Methodology page

- **Priority:** High
- **Complexity:** Medium
- **Dependencies:** SB-304
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Methodology accuracy, trust language, reading-layout accessibility, and Domain parity
- **Approver:** No
- **Watchdog:** No

**Objective:** Provide accurate public documentation of matching, evidence states, freshness, conflict, corrections, hands-on status, and commercial neutrality.

**Scope:**

- author trusted repository MDX using the shared reading layout;
- explain required/optional behavior, unknowns, zero-result recovery, authority, freshness, conflict, and hands-on labels;
- link to relevant Decision and Affiliate Disclosure contexts;
- add a table of contents only if final length warrants it.

**TDD loop:** Add route/render/link assertions for required methodology topics and prohibited winner/ranking claims before authoring the final content.

**Completion conditions:**

- public explanations match the implemented Domain behavior;
- headings, tables, anchors, and disclosures are keyboard and screen-reader accessible;
- no unsupported Best/Top, score, confidence, or source-majority claim appears;
- content remains readable without JavaScript.

**Acceptance evidence:** focused content/render tests; link check; axe; `npm run check`; `npm test`; `npm run build`; mobile and desktop screenshots.

**Non-goals:** Editorial CMS, comments, correction intake form, or new product policy.

### SB-402 — Publish the Affiliate Disclosure page

- **Priority:** High
- **Complexity:** Medium
- **Dependencies:** SB-304
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Affiliate disclosure completeness, commercial neutrality, link labeling, and accessibility
- **Approver:** Board
- **Watchdog:** No

**Objective:** Explain Affiliate relationships, compensation, labeling, Offer qualification, and the invariant that commercial data cannot affect decisions.

**Scope:**

- author trusted repository MDX using the shared reading layout;
- distinguish Official Link, Evidence Link, and Offer Link;
- explain sponsored-link labeling and non-qualifying Offer behavior;
- link consistently from Header, Footer, Methodology, and Offer presentation.

**TDD loop:** Add route/render/link assertions for the required disclosure statements and navigation paths before authoring the final copy.

**Completion conditions:**

- disclosure language is consistent with PRD invariants and rendered Offer behavior;
- every active Offer path exposes nearby disclosure;
- absence of an Offer never obscures the Official Link;
- the page is indexable, accessible, and useful without JavaScript.

**Acceptance evidence:** focused content/render tests; disclosure-link audit; axe; `npm run check`; `npm test`; `npm run build`; screenshots.

**Non-goals:** Legal advice, Affiliate network integration, commission reporting, or commercial ranking.

### SB-403 — Complete lifecycle routes, redirects, and discovery exclusion

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-202, SB-303
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Lifecycle routing, publication-history semantics, discovery exclusion, redirects, and SEO safety
- **Approver:** No
- **Watchdog:** No

**Objective:** Make invalid, draft, blocked, retired, replacement, and inactive-Tool content follow the PRD lifecycle in generated routes and discovery surfaces.

**Scope:**

- connect publication outcomes to 404, noindex status pages, permanent replacements, and route omission;
- remove inactive content from Home, related links, canonical links, structured data inputs, and future sitemap inputs;
- ensure blocked/retired pages expose no current claims or active decision controls;
- preserve published slug identity and valid replacement type.

**TDD loop:** Write route-generation and output tests for every lifecycle row, including unrelated valid Scenario isolation and inactive Tool behavior, before wiring route generation.

**Completion conditions:**

- never-published records resolve to 404 or no generated route as specified;
- blocked/retired pages are noindex and truthful;
- valid replacements redirect permanently and invalid replacements fail validation;
- no hidden record leaks into discovery or metadata.

**Acceptance evidence:** focused lifecycle tests; built route/redirect inspection; Playwright lifecycle smoke; `npm run test:schema`; `npm run check`; `npm test`; `npm run build`.

**Non-goals:** Tombstone database, redirect service, slug reuse, or P1 content index.

### SB-404 — Implement canonical metadata, structured data, sitemap, and robots

- **Priority:** High
- **Complexity:** Large
- **Dependencies:** SB-403
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Canonical metadata, structured data, sitemap eligibility, robots, and SEO correctness
- **Approver:** No
- **Watchdog:** No

**Objective:** Produce correct indexability and discovery metadata for every eligible production route without ranking or unsupported claims.

**Scope:**

- use the production `site` and trailing-slash policy established by SB-104;
- implement unique title, description, canonical, Open Graph/Twitter metadata, and approved structured data by route type;
- add `@astrojs/sitemap` only after recording maintenance, license, and build impact;
- add `robots.txt`, published-only sitemap filtering, query-state canonicalization, and preview/status noindex behavior.

**TDD loop:** Add metadata/sitemap/robots assertions for indexable, query-state, preview, 404, blocked, retired, and hidden routes before implementation.

**Completion conditions:**

- only eligible published routes appear in sitemap and structured data;
- Decision query and fragment state never enters canonical metadata;
- Tool schema contains no unsupported ratings, rankings, or winner claims;
- preview and status pages remain noindex.

**Acceptance evidence:** focused metadata tests; generated sitemap/robots inspection; structured-data validation output; `npm run check`; `npm test`; `npm run build`.

**Non-goals:** Programmatic SEO, Analytics, search console automation, schema ratings, or P1 landing pages.

### SB-405 — Add outbound-content security and Cloudflare headers

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-304, SB-404
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Outbound URL validation, serialization safety, MDX boundaries, CSP, and static header correctness
- **Approver:** Board
- **Watchdog:** No

**Objective:** Prevent unsafe outbound URLs or authored content from creating executable markup and provide a tested static security-header baseline.

**Scope:**

- enforce approved `https:` outbound URL rules and trusted authored `mailto:` exception;
- prohibit untrusted `set:html`/`innerHTML`, arbitrary MDX components, user-provided MDX, and inline scripts;
- safely serialize JSON/structured data across `<`, script boundaries, and unsafe Unicode separators;
- add Cloudflare `_headers` with tested CSP, Referrer Policy, nosniff, and minimal Permissions Policy.

**TDD loop:** Add malicious URL, serialized-script-boundary, external-link attribute, MDX boundary, and header fixture tests before implementing the safeguards.

**Completion conditions:**

- unsafe protocols and executable serialized payloads are rejected or escaped;
- external and Affiliate links use the required security/relationship attributes;
- the CSP permits the actual static application and blocks unapproved runtime sources;
- the built `_headers` artifact expresses the expected route-level header policy without requiring a live Preview environment.

**Acceptance evidence:** focused security tests; built-output and `_headers` inspection; `npm audit --omit=dev`; `npm run check`; `npm test`; `npm run build`; local header-policy fixture results.

**Non-goals:** Authentication, secrets store, WAF rules, server functions, runtime CSP nonce service, or penetration-testing platform.

### SB-406 — Optimize assets, links, and performance budgets

- **Priority:** Medium
- **Complexity:** Medium
- **Dependencies:** SB-303, SB-404, SB-405
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Asset loading, link integrity, bundle budget, Core Web Vitals, and visual stability
- **Approver:** No
- **Watchdog:** No

**Objective:** Keep the static site fast, stable, self-contained, and within the approved image, font, link, JavaScript, LCP, and CLS budgets.

**Scope:**

- optimize local images with explicit dimensions and responsive formats where useful;
- subset/preload only the critical font face/weight and retain fallbacks;
- generate route-appropriate local Open Graph assets without copied reference artwork;
- add broken-link/orphan checks and measure initial route JavaScript, representative LCP, and CLS.

**TDD loop:** Establish failing budget or broken-asset/link fixtures first, make the smallest asset or loading correction, then rerun focused and representative route measurements.

**Completion conditions:**

- no production page hotlinks Tool screenshots or Logos;
- broken/missing images preserve layout and text fallback;
- initial route JavaScript remains at or below the reviewed 50 KiB gzip-equivalent budget; any measured exception requires an explicit Board approval before this task can complete;
- representative mobile and desktop lab checks meet LCP ≤2.5s and CLS ≤0.1.

**Acceptance evidence:** link/orphan test output; bundle-size report; performance report; `npm run check`; `npm test`; `npm run build`; broken-asset screenshots.

**Non-goals:** CDN image service, runtime optimization service, exhaustive synthetic monitoring, or speculative caching infrastructure.

### SB-407 — Approve the first production Scenario contract

- **Priority:** Critical
- **Complexity:** Medium
- **Dependencies:** SB-201, SB-204
- **Suggested assignee:** Product Manager
- **Reviewer:** Reviewer
- **Review focus:** Scenario scope, prerequisites, testability, risk boundary, and publication minimums
- **Approver:** Board
- **Watchdog:** No

**Objective:** Select and approve one concrete, non-high-risk launch Scenario before evidence collection or production content encoding begins.

**Scope:**

- define the goal, prerequisites, suitable and unsuitable boundaries, 4–7 Scenario-local dimensions, allowed values/operators, and at least three comparable Candidate targets;
- define realistic user inputs that demonstrate meaningful differences and zero-result recovery;
- define the verification checklist and explicitly exclude rankings, universal winners, paid placement, and Affiliate-driven selection;
- record the approved Scenario contract and acceptance decisions as the task artifact without changing production content files.

**Test/verification-first loop:** Check the proposed Scenario against the PRD publication minimums and schema vocabulary, record every ambiguity or untestable criterion, then refine only the contract until every required field and acceptance example is explicit.

**Completion conditions:**

- the Scenario has a concrete decision goal and visible prerequisites;
- every proposed dimension has one compatible operator and canonical value model;
- Candidate selection is defensible without commercial inputs;
- Board approves the bounded Scenario contract for evidence work.

**Acceptance evidence:** approved Scenario contract artifact; dimension/operator table; representative input examples; risk-boundary review; Board approval decision.

**Non-goals:** Source research, content encoding, screenshots, Offer qualification, or publication.

### SB-408 — Build the production Scenario source ledger

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-203, SB-407
- **Suggested assignee:** Product Operations Manager
- **Reviewer:** Reviewer
- **Review focus:** Source authority, claim scope, freshness, conflicts, completeness, and commercial neutrality
- **Approver:** No
- **Watchdog:** No

**Objective:** Produce a current, claim-level evidence package for the approved Scenario without modifying public site content.

**Scope:**

- collect authoritative sources for every required-filter Candidate/dimension cell and every intended public factual claim;
- record canonical value, source type and URL, explicit scope, `lastCheckedAt`, relevant effective dates, conflicts, limitations, and hands-on state evidence;
- identify unsupported, stale, wrong-scope, or conflicting cells instead of inferring or filling them from weak sources;
- research Offer data separately and include it only as optional commercial evidence that cannot affect Candidate selection or conclusions.

**Evidence loop:** Start from the approved claim matrix, mark every cell unverified, add qualifying observations one claim at a time, run the evidence rules against the package, and leave unresolved cells explicit rather than weakening the Scenario contract.

**Completion conditions:**

- every required claim has qualifying current evidence or an explicit unresolved status;
- source scope and check dates are sufficient for deterministic evidence resolution;
- conflicts and hands-on limitations are preserved;
- the independent review finds no Affiliate-driven Candidate or conclusion change.

**Acceptance evidence:** reviewed source ledger; claim/cell completeness matrix; conflict and freshness report; Affiliate-neutrality review; exact source URLs and check dates.

**Non-goals:** Automated scraping, production MDX/content records, public claims, screenshots, or publication approval.

### SB-409 — Encode the approved production Scenario content

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-202, SB-203, SB-204, SB-304, SB-403, SB-407, SB-408
- **Suggested assignee:** Backend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Schema validity, source bindings, publication history, fixture isolation, deterministic output, and Affiliate neutrality
- **Approver:** No
- **Watchdog:** No

**Objective:** Encode the approved Scenario, Tools, Candidates, Sources, hands-on states, and any independently qualifying Offer in the authoritative content collections.

**Scope:**

- add one real Scenario with visible prerequisites, approved boundaries and dimensions, and at least three comparable Candidates; mark every real Scenario, Tool, Candidate, Source, and Offer record `fixture: false`;
- bind every public claim and required-filter cell to the reviewed Source Observations without changing the approved contract;
- set lifecycle and immutable `firstPublishedAt` semantics when records are first approved for Production promotion, preserving the value afterward;
- include an Offer only when it independently qualifies; otherwise retain neutral Official Links only;
- add regression tests proving fixtures remain excluded from Production output and commercial fields cannot affect results or ordering.

**TDD loop:** Add the real records as initially failing schema/publication cases, resolve only evidence-backed validation failures, then add deterministic decision, route, fixture-isolation, and Affiliate-neutrality regressions.

**Completion conditions:**

- the real Scenario passes schema, evidence, decision, publication, and route generation;
- every public claim exposes state, scope, source, and check date;
- no fixture appears in the Production discovery or route projection;
- no commercial mutation affects eligibility, order, explanations, alternatives, or comparison.

**Acceptance evidence:** `npm run test:schema`; focused publication/evidence/decision/fixture-isolation tests; `npm run check`; `npm test`; `npm run build`; complete Scenario screenshots.

**Non-goals:** Changing the approved Scenario contract, new source research, additional Scenarios, automated ingestion, or deployment.

### SB-410 — Verify production Scenario publication readiness

- **Priority:** Critical
- **Complexity:** Medium
- **Dependencies:** SB-409
- **Suggested assignee:** Reviewer
- **Reviewer:** No — this task is the independent verification Gate
- **Review focus:** Evidence completeness, publication eligibility, rendered truthfulness, and production fixture exclusion
- **Approver:** Board
- **Watchdog:** No

**Objective:** Independently verify the exact merged-main production Scenario is truthful and eligible for release; do not repair content inside this Gate.

**Scope:**

- verify the approved Scenario contract, source ledger, encoded records, rendered pages, and test evidence against the same merged-main commit;
- verify every required claim, limitation, check date, hands-on state, Official Link, optional Offer, and zero-result path;
- verify Development/Preview fixtures cannot enter Production discovery, generated routes, sitemap, or structured data;
- create atomic blocking content or code defect tasks for every failure and keep this Gate blocked until they merge and the full Gate is rerun.

**Verification loop:** Run the fixed publication-readiness matrix against one reconciled commit. On failure, record exact evidence and route a bounded defect; after its reviewed merge, rerun the affected check and the complete Gate.

**Completion conditions:**

- the real Scenario satisfies every PRD publication minimum;
- all public statements match current qualifying evidence and disclose limitations;
- fixture and Affiliate-neutrality controls pass;
- Board approves this exact merged-main content set for release candidacy.

**Acceptance evidence:** publication-readiness checklist; source-ledger reconciliation; schema and focused test output; reviewed screenshots; merged commit SHA; Board approval decision.

**Non-goals:** Editing sources or content, implementing fixes, adding Scenarios, or deploying Preview/Production.

### SB-411 — Configure GitHub-backed Cloudflare Pages Preview

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-404, SB-405, SB-406, SB-410
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Cloudflare Pages scope, GitHub binding, release-branch isolation, noindex Preview, headers, and secret safety
- **Approver:** Board
- **Watchdog:** Conditional — Hermes Chairman Assistant; attach only when the task enters `todo` or `in_progress`

**Objective:** Connect the public GitHub repository to Cloudflare Pages and produce a reproducible noindex Preview without allowing `main` merges to trigger Production.

**Prerequisites:** Board-authorized Cloudflare account access, GitHub repository authorization, confirmed Pages project ownership, and the approved Frontend Engineer instructions for StackBriefs-only Pages work.

**Scope:**

- configure Node 24, `npm ci`, `npm run build`, output directory, Preview behavior, and `release` as the sole production branch;
- keep `main`, pull requests, and non-release branches in Preview behavior so ordinary merged work cannot cut over Production;
- configure the non-secret build target as `preview` for non-release deployments and `production` only for `release`;
- verify Preview noindex, redirects, canonical behavior, assets, and the live `_headers` policy created by SB-405;
- record only non-secret repository configuration and identify the deployed commit through Cloudflare/GitHub evidence.

**Test/verification-first loop:** Define local build and Preview HTTP assertions first, create the bounded Pages integration, then make configuration-only corrections until the exact reviewed commit passes.

**Completion conditions:**

- a reviewed GitHub commit produces a successful Cloudflare Preview URL;
- `release` is the only configured Production branch and has not been advanced by this task;
- Preview is noindex and serves expected redirects, canonical behavior, assets, and security headers;
- no secret, token, account-wide setting, Worker, DNS record, or unrelated Cloudflare project is changed.

**Acceptance evidence:** GitHub PR/CI URL; Cloudflare Preview URL and build log; branch-control evidence; HTTP redirect/header/noindex smoke output; `npm run check`; `npm run test:schema`; `npm test`; `npm run build`; Board approval decision.

**Non-goals:** Production cutover, custom-domain attachment, Workers, Pages Functions, D1, KV, R2, Analytics, billing, or account administration.

### SB-412 — Execute the release-candidate verification Gate

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-305, SB-401, SB-402, SB-403, SB-404, SB-405, SB-406, SB-410, SB-411
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Independent local, CI, Preview, browser, accessibility, security, SEO, content, and performance verification
- **Approver:** Board
- **Watchdog:** Conditional — Hermes Chairman Assistant; attach only when the Gate enters `todo` or `in_progress`

**Objective:** Verify one exact merged-main release candidate against the complete P0 contract and obtain Board authorization for Production promotion.

**Scope:**

- run the compact release chain from a clean, reconciled candidate commit;
- execute the core browser flow, lifecycle, direct entry, invalid state, JavaScript-disabled, keyboard, touch, axe, responsive, forced-colors, reduced-motion, long-content, broken-asset, link, security-header, and performance checks;
- verify production content, fixture exclusion, sitemap, robots, canonical, redirect, and Affiliate-neutrality invariants on local, CI, and Preview;
- record every failure as an atomic blocking defect task; do not implement fixes inside this Gate.

**Verification loop:** Run the fixed matrix against one candidate SHA. If any check fails, keep the Gate blocked, route the smallest defect through implementation, review, merge, and baseline reconciliation, then rerun the affected check and the full matrix against the replacement SHA.

**Completion conditions:**

- all required local commands and CI jobs pass on one merged-main candidate;
- no serious accessibility violation, uncaught console error, broken primary link, unintended page overflow, security-header failure, fixture leak, or unapproved release-budget exception remains;
- Preview smoke proves primary routes, redirect, canonical/noindex, one core interaction, and JavaScript-disabled Decision content;
- Board authorizes the exact candidate SHA for promotion to `release`.

**Acceptance evidence:** `npm ci`; `npm run check`; `npm run test:schema`; `npm test`; `npm run build`; Playwright Chromium/WebKit and Firefox smoke; axe, performance, link, and header reports; Preview smoke; reviewed screenshots; approved candidate SHA; Board decision.

**Non-goals:** Implementing fixes, new features, content expansion, architecture refactor, Production deployment, Analytics, or P1 scope.

### SB-413 — Promote the approved commit to Cloudflare Pages Production

- **Priority:** Critical
- **Complexity:** Medium
- **Dependencies:** SB-412
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Exact-commit promotion, release-branch integrity, Cloudflare deployment evidence, and scope containment
- **Approver:** No — SB-412 Board approval authorizes this exact promotion
- **Watchdog:** Conditional — Hermes Chairman Assistant; attach only when the task enters `todo` or `in_progress`

**Objective:** Promote only the Board-approved release-candidate commit from reconciled `main` to the Cloudflare Pages `release` branch and capture the resulting deployment.

**Prerequisites:** SB-412 Board approval names the exact commit SHA; Cloudflare/GitHub authorization is available; Board has recorded whether P0 uses the Pages hostname or an approved custom domain, and any required DNS authority is available before the task enters `todo`.

**Scope:**

- confirm local `main`, `origin/main`, the approved candidate SHA, and Preview deployment all identify the same content;
- advance `origin/release` to that exact commit through the accepted reviewed promotion workflow with no additional file changes;
- allow Cloudflare Pages to deploy the `release` branch and capture the deployment identifier and immutable commit evidence;
- if promotion or deployment fails, stop and create a bounded blocking defect or operations task instead of changing unrelated settings.

**Execution loop:** Verify the approved SHA and pre-deploy branch state, perform the single bounded promotion, then verify Cloudflare received that SHA. Do not combine diagnosis or corrective configuration with the promotion task.

**Completion conditions:**

- `origin/release` identifies exactly the Board-approved candidate commit;
- Cloudflare reports a successful Production deployment for that commit;
- no unapproved repository, Cloudflare, domain, DNS, account, billing, secret, or runtime change occurs;
- deployment evidence is ready for the independent Production verification Gate.

**Acceptance evidence:** Board-approved candidate SHA; pre/post branch evidence; reviewed promotion PR or equivalent protected workflow; Cloudflare deployment URL, identifier, and log; GitHub/Cloudflare commit match.

**Non-goals:** Product changes, defect fixes, content changes, Production acceptance, destructive rollback testing, or unrelated Cloudflare administration.

### SB-414 — Verify Production and rollback readiness

- **Priority:** Critical
- **Complexity:** Large
- **Dependencies:** SB-413
- **Suggested assignee:** Frontend Engineer
- **Reviewer:** Reviewer
- **Review focus:** Independent Production behavior, commit identity, indexing, security, core journey, and rollback readiness
- **Approver:** Board
- **Watchdog:** Conditional — Hermes Chairman Assistant; attach only when the Gate enters `todo` or `in_progress`

**Objective:** Independently verify the exact Production deployment and its rollback readiness without implementing fixes inside the Gate.

**Scope:**

- run Production route, redirect, canonical, sitemap, robots, security-header, asset, core interaction, Official Link, accessibility, and JavaScript-disabled smoke checks;
- prove Production serves the Board-approved `release` commit and does not leak Preview noindex behavior;
- if a prior successful Production deployment exists, retain its identifier as the rollback target and verify the non-destructive rollback procedure;
- for the first Production deployment, explicitly record that no prior Production target exists, retain the approved Preview/candidate evidence as the recovery reference, and establish this successful deployment as the baseline for subsequent rollback checks;
- route every failure to an atomic blocking defect, rollback-action, or deployment-operations task; do not repair it inside this Gate.

**Verification loop:** Run the fixed Production matrix against one deployment identifier. On failure, keep the Gate blocked and escalate the exact corrective or rollback action; after reviewed resolution, rerun the affected check and the complete Gate.

**Completion conditions:**

- Production serves the exact approved commit over HTTPS and all required smoke checks pass;
- indexing, canonical, security headers, assets, and core interaction match the release contract;
- rollback evidence truthfully distinguishes first deployment from later deployments;
- repository, CI, Preview, `release`, Cloudflare Production, and Paperclip evidence reference the same release commit;
- Board accepts the Production release.

**Acceptance evidence:** Production URL and deployment identifier; release commit SHA; HTTP and browser smoke output; sitemap/robots/header/canonical checks; rollback or first-baseline evidence; `git rev-list --left-right --count main...origin/main` equals `0 0`; Board decision.

**Non-goals:** Implementing fixes, post-launch content automation, monitoring platform, Analytics, P1 features, or infrastructure migration.
