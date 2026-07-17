# StackBriefs Development Backlog

**Last updated:** 2026-07-17
**Status:** Approved CLI execution backlog
**Product contract:** [PRD.md](PRD.md)
**Implementation contract:** [toolify-clone-development-plan.md](toolify-clone-development-plan.md)
**Production repository:** `/home/ja/stackbriefs`
**Visual reference only:** `/home/ja/ai-website-cloner-template`

## Current execution ledger

The accepted repository baseline is clean `main` at `513bdd5`, synchronized with `origin/main` when this backlog was reconciled after the SB-105 implementation merge. Reconfirm the baseline before starting a task because commit identities can advance after reviewed merges.

| Task | State | Accepted evidence |
| --- | --- | --- |
| SB-101 | Done | `b24b7c0` — approved development baseline |
| SB-102 | Done | `b10ad7b` — production visual foundation |
| SB-103 | Done | `a6fa671` — shared shell and navigation |
| SB-104 | Done | `c7b1f9e` — P0 route and status-page skeleton |
| SB-105 | Provisional | `513bdd5` — merged under the prior sequence; the revised contract requires replacing its temporary fixture model with SB-201/SB-202 publication projections before acceptance |
| SB-201 | Ready | First remaining implementation task |
| SB-202 | Blocked | Execute after SB-201 |
| All later tasks | Blocked or deferred | Release only when their listed dependencies are accepted |

## CLI execution contract

Execute one explicitly selected task at a time. Read this contract, that task, its referenced PRD/development-plan sections, repository `AGENTS.md`, and the current repository state. Do not load adjacent tasks as implied implementation scope and do not begin the next task automatically.

### Reusable worktree and delivery policy

- Keep `/home/ja/stackbriefs` as the clean accepted-`main` and reconciliation checkout.
- Starting with SB-201, use one reusable serial-development worktree at `/home/ja/stackbriefs/.worktrees/cli-development`.
- Create a fresh task branch from the current accepted `origin/main` inside that reusable worktree for every implementation task. Keep one focused branch, commit series, and PR per task.
- After a reviewed PR is merged, reconcile `/home/ja/stackbriefs` with `origin/main`, verify the merged baseline, then reuse the same physical worktree for the next task branch. Do not create or delete a physical worktree for each serial task.
- Create an additional worktree only when the user explicitly authorizes genuinely independent parallel development. Never let two worktrees edit the same files or depend on unmerged behavior.
- Legacy task worktrees outside `/home/ja/stackbriefs/.worktrees/cli-development` are not valid execution starting points. Audit and archive any untracked evidence before removing them; never discard an unclean worktree merely to simplify the workspace list.
- Task branches may be pushed and focused PRs may be opened as part of the approved CLI workflow. Merge only after an independent review accepts the exact PR and the current invocation has merge authority.

### Autonomy and change boundaries

- For implementation tasks, inspect the repository, edit in-scope local files, run non-destructive validation, create the task branch and commits, push the branch, and open the focused PR without asking again.
- For review or verification-only tasks, inspect and report evidence only. Do not implement fixes inside the Gate.
- Preserve unrelated user changes and existing public behavior. Do not delete or weaken required behavior, schemas, tests, or routes merely to make validation pass.
- Reuse native HTML, Astro, Tailwind, browser APIs, existing project patterns, and already approved dependencies before adding code or packages.
- Require confirmation before destructive Git operations, credentials changes, purchases, production deployment, DNS or account changes, unrelated external writes, or a material expansion of product scope.

### Validation strategy

- New deterministic behavior: add the smallest focused failing test before implementation, make it pass, then simplify only when the passing solution is unnecessarily complex.
- Bug fix: add a regression test that reproduces the defect first.
- Refactor: establish characterization coverage before changing implementation.
- Visual, content, configuration, or deployment preparation: define a failing render, build-output, screenshot, accessibility, HTTP, or configuration check instead of manufacturing an irrelevant unit test.
- Verification-only Gate: run the fixed matrix against one exact commit or deployment, record reproducible failures, and route each failure to a separate bounded task.
- Run focused validation first. Before a code or repository-change task is ready for review, run `npm run check`, applicable focused tests, `npm test`, and `npm run build`. Add `npm run test:schema`, Playwright, axe, Preview, performance, link, or HTTP checks only when the task makes them applicable.

### Global done criteria

A task is complete only when its acceptance criteria and applicable validation pass, its diff contains no unrelated changes, its required review evidence exists, and its final report states the outcome, files changed, commands/results, deviations, blockers, and remaining risk. A repository-change task is not reconciled until its accepted PR is merged and the same commit is present on clean local and remote `main`.

### Global stop rules

- Stop when the selected task is complete; do not start the next backlog task automatically.
- If a dependency or required starting-state artifact is absent, stop and report the exact missing prerequisite.
- If the same failure recurs twice without new evidence, stop repeating the same action and report the diagnosed blocker plus the smallest next step.
- If a missing product decision would change public behavior, stop and request that decision instead of choosing silently.
- If the required change exceeds the task boundary, requires an unapproved dependency, or reveals an unrelated defect, keep the current scope bounded and report or create a separate follow-up task.
- Stop before credential-gated, destructive, production-impacting, DNS, account, billing, or other externally consequential actions unless the selected task and current user authorization explicitly permit them.

## PRD acceptance traceability

| PRD acceptance criterion | Primary implementation and verification tasks |
| --- | --- |
| AC-01 Scenario isolation | SB-201, SB-202, SB-205, SB-206, SB-301, SB-302, SB-305 |
| AC-02 Required determinism | SB-204, SB-208, SB-305 |
| AC-03 Optional neutrality | SB-204, SB-208, SB-305 |
| AC-04 Stable order and Affiliate invariance | SB-105, SB-204, SB-304, SB-305 |
| AC-05 Zero-result honesty | SB-204, SB-206, SB-208, SB-305 |
| AC-06 URL round trip | SB-205, SB-208, SB-301, SB-302, SB-305 |
| AC-07 Shortlist and comparison | SB-301, SB-302, SB-305 |
| AC-08 Changing eligibility | SB-301, SB-302, SB-305 |
| AC-09 Evidence honesty | SB-203, SB-304, SB-305, SB-410 |
| AC-10 Freshness parity | SB-203, SB-304, SB-305, SB-410 |
| AC-11 Link separation | SB-304, SB-402, SB-405, SB-410 |
| AC-12 Static usefulness | SB-105, SB-206, SB-208, SB-303, SB-401, SB-402, SB-305 |
| AC-13 Responsive accessibility | SB-102, SB-103, SB-104, SB-105, SB-206, SB-207, SB-208, SB-301, SB-302, SB-303, SB-304, SB-305, SB-412, SB-414 |
| AC-14 Lifecycle behavior | SB-202, SB-403, SB-404, SB-410, SB-412, SB-414 |
| AC-15 Production content and release | SB-305, SB-407, SB-408, SB-409, SB-410, SB-411, SB-412, SB-413, SB-414 |

## Task template

Every active task uses the same contract: `Status`, `Priority`, `Risk`, `Dependencies`, `Execution mode`, `Traceability`, `Review focus`, `Goal`, `Starting state`, `Deliverables`, `Acceptance criteria`, task-specific `Validation`, `Stop/blocked conditions`, and `Out of scope`. The global contract supplies repeated coding, TDD, PR, review, completion, and stop behavior; task sections contain only task-specific semantics.

---

## Completed foundation

SB-101 through SB-104 are immutable completed records in the execution ledger above. They are not active CLI prompts and must not be rerun unless their accepted evidence is invalidated.

---

## Phase 2 — Content foundation, Home, and Decision vertical slice

### SB-201 — Define the authoritative content schema and heterogeneous fixtures

- **Status:** Ready
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-104
- **Execution mode:** Implementation in the reusable CLI worktree
- **Traceability:** PRD AC-01, AC-15; development-plan content schema
- **Review focus:** Content contract, heterogeneous modeling, reference integrity, and fixture isolation

**Goal:** Establish one Astro Content Collections contract for Scenario, Tool, Scenario Candidate, Source Observation, Offer, and trusted page content.

**Starting state:** SB-104 is accepted on clean `main`. `src/content.config.ts`, collection records, heterogeneous fixtures, and `tests/content-schema.test.ts` do not exist; the `test:schema` script exists but cannot pass until this task creates its suite.

**Deliverables:**

- implement `src/content.config.ts` and collection folders;
- validate immutable IDs/slugs, references, Scenario prerequisites, dimension/operator compatibility, values, dates, URLs, lifecycle fields, hands-on states, and Offer states;
- add immutable publication-history semantics through optional `firstPublishedAt` and identify non-production fixtures explicitly;
- add two materially different fixture Scenarios with different dimension structures;
- implement `tests/content-schema.test.ts` and add `npm run test:schema` to CI only after it passes.

**Acceptance criteria:**

- one schema is authoritative for content and Domain assembly;
- the two fixtures prove Scenario-local dimensions and Candidate/Tool separation;
- Offer data remains structurally outside decision eligibility fields;
- schema failures identify the record and actionable cause.

**Validation:** `npm run test:schema`; focused negative-case tests; successful CI including the schema job.

**Stop/blocked conditions:** Stop if the PRD and development plan disagree on a required field or lifecycle meaning, if Astro Content Collections cannot express a required invariant without a product-level schema decision, or if an additional dependency appears necessary.

**Out of scope:** CMS, database, global dimensions, publication service, approval digest, UI filtering, or real production Scenario selection.

### SB-202 — Assemble content and validate publication lifecycle

- **Status:** Blocked by SB-201
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-201
- **Execution mode:** Implementation
- **Traceability:** PRD AC-01, AC-14, AC-15
- **Review focus:** Domain assembly, lifecycle correctness, publication history, and Scenario isolation

**Goal:** Convert validated collection entries into framework-independent Domain objects and derive public exposure or blocked lifecycle outcomes.

**Starting state:** SB-201 must provide the accepted schema, collection records, fixture markers, and passing schema suite. Publication assembly and build-target filtering do not yet exist.

**Deliverables:**

- implement the Astro-aware assembler and `src/domain/publication.ts`;
- resolve Scenario, Tool, Candidate, Source, replacement, and Offer references;
- derive published, hidden, blocked, retired, replacement, and exposed-Tool outcomes;
- enforce Scenario-local blocking so one invalid Scenario does not block unrelated valid content.
- accept one typed `development | preview | production` build target and exclude fixture records from Production discovery, generated public routes, sitemap inputs, and structured-data inputs while retaining them in Development, Preview, and tests;

**Acceptance criteria:**

- pure Domain outputs contain no Astro, DOM, browser-clock, UI, or Offer-to-decision dependency;
- invalid/draft content is not publicly exposed;
- blocked and retired outcomes carry enough information for status pages and redirects;
- validation messages are deterministic and actionable.

**Validation:** focused publication tests; `npm run test:schema`.

**Stop/blocked conditions:** Stop if SB-201 records cannot be assembled without duplicating the authoritative schema, or if build-target behavior would change evidence, eligibility, ordering, explanations, or Affiliate neutrality.

**Out of scope:** Evidence ranking, filtering, route rendering, runtime CMS, or cross-Scenario publication priority.

### SB-105 — Reconcile the Home discovery experience with validated fixtures

- **Status:** Provisional implementation merged; reconciliation blocked by SB-201 and SB-202
- **Priority:** High
- **Risk:** Medium
- **Dependencies:** SB-202
- **Execution mode:** Implementation
- **Traceability:** PRD AC-04, AC-12, AC-13
- **Review focus:** Scenario-first discovery, deterministic ordering, responsive presentation, and product-scope fidelity

**Goal:** Preserve the reviewed Home discovery experience while replacing its temporary fixture model with validated publication projections.

**Starting state:** PR #8 merged the Home Hero, ordered Scenario rows, process explanation, trust links, responsive styles, and tests at `513bdd5`. The current Home and Decision routes read temporary records from `src/fixtures/home-scenarios.ts`; SB-201 and SB-202 must provide the authoritative Scenario schema and stable published fixture projections before this task can be accepted.

**Deliverables:**

- preserve the reviewed compact Hero, `#scenarios`, Scenario rows, three-step process explanation, trust links, and Footer composition;
- migrate Home and Decision consumers from `src/fixtures/home-scenarios.ts` to the accepted publication projections, then remove the temporary parallel model;
- continue to show goal, prerequisites, boundary summary, candidate count, dimension count, and review context;
- preserve normalized Scenario-title/slug ordering;
- preserve the prohibition on ratings, featured placement, popularity, deals, Affiliate value, and file-order sorting.

**Acceptance criteria:**

- Home communicates the product promise and leads directly to Scenario decisions;
- repeated fixture input yields stable row order;
- the full page is meaningful without JavaScript;
- layout remains readable at 320px, 400% zoom, tablet, and desktop.

**Validation:** focused ordering/render tests; keyboard inspection; screenshots at 360, 768, and 1440 widths.

**Stop/blocked conditions:** Stop if SB-202 does not expose stable published fixture projections, or if implementing Home would require a temporary parallel content model.

**Out of scope:** Search, Tool directory, real production content, Analytics, or dynamic ranking.

### SB-203 — Implement deterministic evidence resolution

- **Status:** Blocked by SB-202
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-202
- **Execution mode:** Implementation
- **Traceability:** PRD AC-09, AC-10
- **Review focus:** Evidence authority, freshness, conflict, scope, and Affiliate neutrality

**Goal:** Resolve claim-level evidence into the PRD states using authority, scope, canonical value, freshness, and conflict rules.

**Starting state:** SB-202 must expose framework-independent Source Observations and publication inputs. No evidence resolver exists.

**Deliverables:**

- implement `src/domain/evidence.ts` as a pure module;
- support verified fact, editorial assessment, not verified, needs recheck, not applicable, and conflicting states;
- enforce authority selection, wrong-scope exclusion, equal-authority conflict, and 7/30/90-day freshness windows;
- ensure browser time can only downgrade a deployed state.

**Acceptance criteria:**

- identical evidence and clock input produces identical state and explanation;
- weak, stale, conflicting, or wrong-scope evidence never appears verified;
- source count, commission, confidence, and recency do not break equal-authority conflict;
- Offer fields cannot influence resolution.

**Validation:** focused evidence tests; mutation/fixture checks for Affiliate neutrality; `npm run test:schema`.

**Stop/blocked conditions:** Stop if a claim type lacks an approved authority or freshness rule, or if the implementation would require confidence scoring, source voting, or Offer-derived evidence.

**Out of scope:** UI badges, external evidence fetching, confidence scoring, LLM inference, or editorial automation.

### SB-204 — Implement deterministic decision evaluation

- **Status:** Blocked by SB-203
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-203
- **Execution mode:** Implementation
- **Traceability:** PRD AC-02, AC-03, AC-04, AC-05
- **Review focus:** Deterministic evaluation, stable ordering, explanations, and Affiliate neutrality

**Goal:** Evaluate required and optional Scenario conditions into stable matches, exclusions, explanations, and zero-result recovery data.

**Starting state:** SB-203 must provide accepted evidence states and claim values. No decision evaluator or zero-result relaxation projection exists.

**Deliverables:**

- implement `src/domain/decision.ts` with `eq`, `contains`, `lte`, and `gte` operators;
- apply required AND semantics and keep `no_match` distinct from `unknown`;
- keep optional preferences explanatory only;
- sort by normalized Tool name then slug and derive explicit blocking-condition relaxation options.

**Acceptance criteria:**

- formal matches satisfy every required condition;
- optional changes never alter membership, ordering, alternatives, or conclusions;
- no condition is silently weakened and no universal winner is produced;
- repeated normalized inputs yield byte-stable candidate IDs/order/explanation order where serialized.

**Validation:** focused decision tests; Affiliate-neutrality regression test; `npm run test:schema`.

**Stop/blocked conditions:** Stop if a proposed operator or relaxation rule is absent from the approved contract, or if implementation would introduce scoring, OR groups, fuzzy matching, or silent condition weakening.

**Out of scope:** Browser controls, global ranking, fuzzy matching, OR groups, scoring, or persisted recommendations.

### SB-205 — Implement URL state normalization and round trips

- **Status:** Blocked by SB-201 and SB-204
- **Priority:** High
- **Risk:** Medium
- **Dependencies:** SB-201, SB-204
- **Execution mode:** Implementation
- **Traceability:** PRD AC-01, AC-06
- **Review focus:** URL normalization, deterministic serialization, Scenario scope, and invalid-state handling

**Goal:** Provide one pure parser/normalizer/serializer for required, optional, shortlist, and comparison-fragment state.

**Starting state:** SB-201 and SB-204 must define accepted Scenario dimensions, Candidate identities, and decision state. No URL-state module exists.

**Deliverables:**

- implement `src/domain/url-state.ts` for `r`, `p`, `shortlist`, and `#comparison`;
- remove invalid dimensions, values, modes, duplicates, fifth items, deleted Tools, and cross-Scenario Tools;
- enforce one mode per dimension and deterministic serialization;
- keep temporary query and fragment state out of canonical metadata.

**Acceptance criteria:**

- valid state round-trips without information loss;
- invalid state normalizes to one canonical representation;
- shortlist remains within 0–4 valid current-Scenario Tools;
- comparison fragment survives only with 2–4 valid shortlisted Tools.

**Validation:** focused URL-state tests.

**Stop/blocked conditions:** Stop if URL compatibility requires supporting undocumented legacy parameters, persistent storage, accounts, or cross-Scenario state.

**Out of scope:** History API controller, storage, accounts, server sessions, or arbitrary query compatibility.

### SB-206 — Render the static Decision workspace

- **Status:** Blocked by SB-202 through SB-205 and SB-105
- **Priority:** High
- **Risk:** High
- **Dependencies:** SB-105, SB-202, SB-203, SB-204, SB-205
- **Execution mode:** Implementation
- **Traceability:** PRD AC-01, AC-05, AC-12, AC-13
- **Review focus:** Scenario boundaries, prerequisites, static projection, responsive layout, and evidence visibility

**Goal:** Render published Scenario boundaries, criteria, deterministic results, exclusions, evidence summaries, and zero-result guidance as useful static HTML.

**Starting state:** SB-105 must render Home from accepted publication projections; SB-202 through SB-205 must provide publication, evidence, decision, and URL-state outputs. Decision routes remain placeholders.

**Deliverables:**

- implement generated `/decision/[scenario]` pages and Decision components;
- reuse the same validated published Scenario projections already consumed by Home;
- render Scenario header including prerequisites and boundaries, criteria structure, result summary, Candidate cards, excluded rows, and zero-result recovery;
- implement the approved rail/flow/sheet-ready responsive composition without interactive mutation yet;
- use the Toolify clone only for bounded filter/list proportions and spacing rhythm.

**Acceptance criteria:**

- each fixture renders only its own dimensions and Candidates;
- Home lists only published Scenario projections in stable title/slug order;
- evidence state, limitations, and exclusion reasons remain visible without JavaScript;
- no Offer or Affiliate field influences result presence or order;
- the document has no page-level horizontal overflow at required widths.

**Validation:** focused render tests; `npm run test:schema`; JavaScript-disabled inspection; screenshots at 360, 768, and 1440 widths.

**Stop/blocked conditions:** Stop if UI rendering would need to duplicate Domain rules, if either heterogeneous fixture cannot render from the same component contract, or if required evidence and limitations cannot remain visible without JavaScript.

**Out of scope:** Live filter controls, shortlist, comparison, Tool detail, or browser History behavior.

### SB-207 — Add the browser, accessibility, and visual test harness

- **Status:** Blocked by SB-206
- **Priority:** High
- **Risk:** Medium
- **Dependencies:** SB-206
- **Execution mode:** Implementation
- **Traceability:** PRD AC-13; development-plan browser and visual test gate
- **Review focus:** Browser-harness reliability, accessibility tooling, CI lifecycle, and test isolation

**Goal:** Add the smallest Playwright and axe harness needed to test the first interactive Decision slice and subsequent visible behavior.

**Starting state:** SB-206 must provide the accepted static Home-to-Decision path. Playwright and axe are not yet installed or configured.

**Deliverables:**

- add maintained Playwright and `@axe-core/playwright` dependencies with documented license and bundle/runtime impact;
- configure Chromium and WebKit core projects plus a bounded Firefox smoke path;
- add server lifecycle, screenshot, console-error, overflow, keyboard, and axe helpers without a general test framework layer;
- establish one passing static Home-to-Decision smoke; do not merge skipped, expected-failure, or intentionally failing placeholders for later tasks.

**Acceptance criteria:**

- browser tests run locally and in the selected CI job without leaking a server process;
- axe reports actionable serious violations;
- screenshots can be captured deterministically at 360, 768, and 1440;
- no client runtime dependency is added to production output.

**Validation:** focused Playwright smoke; axe smoke; CI run URL.

**Stop/blocked conditions:** Stop if the proposed harness requires a client runtime, a broad visual-regression platform, skipped placeholder tests, or a browser matrix beyond the approved plan.

**Out of scope:** Full end-to-end coverage, visual snapshot platform, Storybook, or cross-browser matrix expansion beyond the plan.

### SB-208 — Implement Decision filtering and zero-result interaction

- **Status:** Blocked by SB-205 through SB-207
- **Priority:** High
- **Risk:** High
- **Dependencies:** SB-205, SB-206, SB-207
- **Execution mode:** Implementation
- **Traceability:** PRD AC-02, AC-03, AC-05, AC-06, AC-12, AC-13
- **Review focus:** Browser-state correctness, mobile interaction, focus behavior, accessibility, and static fallback

**Goal:** Add the native browser controller for desktop live filters, mobile staged filters, explicit zero-result relaxation, URL updates, and History restoration.

**Starting state:** SB-205 provides pure URL normalization, SB-206 provides static Decision markup, and SB-207 provides the browser harness. No interactive controller exists.

**Deliverables:**

- implement required/optional controls from Scenario dimensions without duplicating Domain rules;
- implement desktop `replaceState`, mobile draft/Apply/Cancel/Clear behavior, and `popstate` restoration;
- implement the native-dialog filter sheet, focus containment/return, result-summary focus, and polite count announcements;
- fail safely to the static projection when JavaScript errors or is disabled.

**Acceptance criteria:**

- desktop and mobile behavior match the History contract;
- zero-result recovery never changes a condition without explicit action;
- focus and result announcements are predictable without announcing the entire list;
- interaction cannot create false matches, hide evidence, or write persistent storage.

**Validation:** focused unit and Playwright tests in Chromium/WebKit; axe results; `npm run test:schema`; screenshots at required widths.

**Stop/blocked conditions:** Stop if the interaction requires duplicating decision rules, adopting a client framework, persisting user state, silently relaxing filters, or combining multiple independently reviewable controllers beyond one coherent PR.

**Out of scope:** Shortlist, comparison, cookies, local storage, remote state, or client framework adoption.

---

## Phase 3 — Shortlist, comparison, and Tool evidence

### SB-301 — Implement shortlist state and dock

- **Status:** Blocked by SB-208
- **Priority:** High
- **Risk:** High
- **Dependencies:** SB-208
- **Execution mode:** Implementation
- **Traceability:** PRD AC-06, AC-07, AC-08, AC-13
- **Review focus:** Shortlist invariants, URL state, focus behavior, responsive dock, and accessibility

**Goal:** Let users maintain a URL-only shortlist of one to four current-Scenario Candidates and understand changing eligibility.

**Starting state:** SB-208 must provide accepted filter, URL, History, focus, and responsive interaction behavior. Shortlist operations and dock UI do not exist.

**Deliverables:**

- implement pure shortlist operations and browser integration using normalized URL state;
- add Candidate add/remove controls and the safe-area-aware Shortlist dock;
- reject a fifth item with a visible reason;
- retain and clearly mark shortlisted Tools that stop matching until explicitly removed.

**Acceptance criteria:**

- shortlist state survives reload and History navigation through the URL only;
- Compare is disabled below two with a visible reason;
- the dock never covers focused or final content and respects mobile safe areas;
- no Tool is silently inserted, replaced, or removed except invalid-state normalization.

**Validation:** focused shortlist tests; Playwright Chromium/WebKit; axe; mobile and desktop screenshots.

**Stop/blocked conditions:** Stop if implementation requires persistent storage, cross-Scenario state, automatic Tool replacement, or a fifth-item policy different from the PRD.

**Out of scope:** Persistent saved lists, cross-Scenario shortlist, accounts, or recommendation ranking.

### SB-302 — Implement scenario-scoped comparison

- **Status:** Blocked by SB-301
- **Priority:** High
- **Risk:** High
- **Dependencies:** SB-301
- **Execution mode:** Implementation
- **Traceability:** PRD AC-01, AC-06, AC-07, AC-08, AC-13
- **Review focus:** Scenario-scoped comparison, table semantics, responsive overflow, and neutral presentation

**Goal:** Compare two to four shortlisted Tools with equal treatment using the active Scenario's dimensions, evidence states, and limitations.

**Starting state:** SB-301 must provide normalized 0–4 shortlist state and browser integration. Comparison projection and UI do not exist.

**Deliverables:**

- implement a pure Scenario comparison projection;
- render a semantic table with caption, row headers, equal Tool columns, unknowns, limitations, and no winner treatment;
- connect `#comparison` open/back/invalidated behavior and focus restoration;
- contain narrow-screen horizontal scrolling inside the comparison region.

**Acceptance criteria:**

- comparison never crosses Scenario boundaries or adds a winner;
- the same Scenario dimension order drives every column;
- mobile users retain identifiable Tool headers and all limitations;
- the document does not scroll horizontally.

**Validation:** focused comparison tests; Playwright Chromium/WebKit; axe; screenshots at 360, 768, and 1440 widths.

**Stop/blocked conditions:** Stop if comparison would cross Scenario boundaries, invent a score or winner, hide unknowns or limitations, or require page-level horizontal scrolling.

**Out of scope:** Global comparison pages, scoring, highlighted winners, export, or persisted comparison state.

### SB-303 — Implement Tool detail routes and Scenario context

- **Status:** Blocked by SB-202 and SB-203
- **Priority:** High
- **Risk:** High
- **Dependencies:** SB-202, SB-203
- **Execution mode:** Implementation
- **Traceability:** PRD AC-09, AC-11, AC-12, AC-13
- **Review focus:** Tool identity separation, Scenario context, routing, responsive composition, and accessibility

**Goal:** Render neutral Tool identity and Scenario-specific contexts without inventing global fit or universal conclusions.

**Starting state:** SB-202 and SB-203 must provide exposed Tool identities, Scenario contexts, evidence states, and lifecycle outcomes. Tool routes remain placeholders.

**Deliverables:**

- generate `/tool/[slug]` only for exposed Tools;
- render validated Breadcrumbs/return path, identity, neutral summary, Logo fallback, Official Link, Scenario contexts, limitations, hands-on state, and checklist;
- support direct entry without an active Scenario;
- use the Toolify clone only for Breadcrumb and long-form composition geometry.

**Acceptance criteria:**

- Tool identity remains separate from Scenario conclusions;
- return navigation cannot accept an arbitrary cross-origin value;
- inactive or unexposed Tools do not leak into discovery or generated public routes;
- missing assets preserve readable identity without layout shift.

**Validation:** focused route/render tests; Playwright direct and Scenario entry; `npm run test:schema`; screenshots at required widths.

**Stop/blocked conditions:** Stop if Tool presentation would require a global score, generic Tool Library, unsafe arbitrary return URL, or public exposure of inactive/hidden Tools.

**Out of scope:** Tool Library, ratings, reviews, global score, vendor dashboard, or user submissions.

### SB-304 — Render claim evidence and separate outbound link types

- **Status:** Blocked by SB-203 and SB-303
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-203, SB-303
- **Execution mode:** Implementation
- **Traceability:** PRD AC-04, AC-09, AC-10, AC-11, AC-13
- **Review focus:** Evidence language, outbound-link separation, security attributes, and Affiliate neutrality

**Goal:** Present claim-level evidence, Official destinations, and optional qualifying Offers as structurally and visually distinct paths.

**Starting state:** SB-203 must provide accepted evidence states and SB-303 must provide Tool detail composition. Claim rows, evidence disclosures, and Offer presentation do not exist.

**Deliverables:**

- implement Claim rows, Evidence badges/disclosures, link groups, and Offer panel;
- display state, check date, source, scope, limitation, and hands-on status without overstating verification;
- keep Official Link present when Offer is absent, invalid, expired, rejected, or research-only;
- apply `noopener` to external new tabs and `rel="sponsored"` plus disclosure to Affiliate links.

**Acceptance criteria:**

- Official, Evidence, and Offer elements are separately labeled and styled;
- stale/conflicting/not-verified evidence cannot render verified language;
- non-qualifying commercial records cannot render Deal/Discount language or active CTA;
- Affiliate data changes never alter Candidate eligibility, ordering, explanations, or comparison.

**Validation:** focused evidence/link/neutrality tests; Playwright Tool flow; axe; screenshots with and without a qualifying Offer.

**Stop/blocked conditions:** Stop if the UI cannot keep Official, Evidence, and Offer paths distinct, if Affiliate fields affect any decision output, or if implementing presentation would require Affiliate tracking or new commercial policy.

**Out of scope:** Affiliate tracking implementation, revenue reporting, vendor claims, paid placement, or runtime Offer fetching.

### SB-305 — Complete the interactive core journey and responsive accessibility gate

- **Status:** Blocked by SB-301 through SB-304
- **Priority:** High
- **Risk:** High
- **Dependencies:** SB-301, SB-302, SB-303, SB-304
- **Execution mode:** Verification-only; no fixes in this task
- **Traceability:** PRD AC-01 through AC-13
- **Review focus:** Independent end-to-end, responsive, browser, and accessibility verification

**Goal:** Independently verify the complete fixture journey from Home through Official Link across supported interaction and responsive states.

**Starting state:** SB-301 through SB-304 must be merged and reconciled on one clean `main` commit. The full fixture journey and browser matrix have not yet been independently verified together.

**Deliverables:**

- cover Home → Decision → filter → zero results → relax → shortlist → compare → evidence → Tool → Official Link;
- cover keyboard, touch, mobile Apply/Cancel, fifth-item rejection, back/forward, direct Tool entry, invalid state, JavaScript disabled, console errors, and bounded overflow;
- test 320/400% zoom, 360×800, 768 portrait/landscape, 1440×1000, forced colors, reduced motion, long content, and broken assets;
- record every failure with reproducible evidence and create a focused blocking defect task; do not implement fixes inside this Gate.

**Acceptance criteria:**

- the complete journey works with keyboard and touch;
- no serious axe violation, trapped focus, hidden critical information, uncaught console error, or page-level horizontal overflow remains;
- static content and Official Links remain useful without JavaScript;
- visible changes have reviewed screenshots at 360, 768, and 1440.

**Validation:** complete Playwright Chromium/WebKit suite; Firefox smoke; axe reports; manual screen-reader/browser note; `npm run test:schema`; screenshot set.

**Stop/blocked conditions:** On any failure, keep the Gate blocked, record exact reproduction evidence, create a bounded defect task, and stop. Do not edit product code, tests, content, or configuration inside this task.

**Out of scope:** Production content, SEO, Cloudflare deployment, Analytics, or P1 features.

---

## Phase 4 — Trust, SEO, security, and release

### SB-401 — Publish the Methodology page

- **Status:** Blocked by SB-304
- **Priority:** High
- **Risk:** Medium
- **Dependencies:** SB-304
- **Execution mode:** Content implementation
- **Traceability:** PRD AC-09, AC-10, AC-12
- **Review focus:** Methodology accuracy, trust language, reading-layout accessibility, and Domain parity

**Goal:** Provide accurate public documentation of matching, evidence states, freshness, conflict, corrections, hands-on status, and commercial neutrality.

**Starting state:** SB-304 must establish the accepted evidence and link presentation. The Methodology route exists only as a skeleton and final trusted content is absent.

**Deliverables:**

- author trusted repository MDX using the shared reading layout;
- explain required/optional behavior, unknowns, zero-result recovery, authority, freshness, conflict, and hands-on labels;
- link to relevant Decision and Affiliate Disclosure contexts;
- add a table of contents only if final length warrants it.

**Acceptance criteria:**

- public explanations match the implemented Domain behavior;
- headings, tables, anchors, and disclosures are keyboard and screen-reader accessible;
- no unsupported Best/Top, score, confidence, or source-majority claim appears;
- content remains readable without JavaScript.

**Validation:** focused content/render tests; link check; axe; mobile and desktop screenshots.

**Stop/blocked conditions:** Stop if public explanations cannot be traced to implemented Domain behavior, if copy introduces unsupported ranking/confidence claims, or if final length requires an unapproved information-architecture change.

**Out of scope:** Editorial CMS, comments, correction intake form, or new product policy.

### SB-402 — Publish the Affiliate Disclosure page

- **Status:** Blocked by SB-304
- **Priority:** High
- **Risk:** Medium
- **Dependencies:** SB-304
- **Execution mode:** Content implementation
- **Traceability:** PRD AC-11, AC-12; commercial-neutrality invariant
- **Review focus:** Affiliate disclosure completeness, commercial neutrality, link labeling, and accessibility

**Goal:** Explain Affiliate relationships, compensation, labeling, Offer qualification, and the invariant that commercial data cannot affect decisions.

**Starting state:** SB-304 must establish the accepted Official/Evidence/Offer presentation. The Affiliate Disclosure route exists only as a skeleton and final trusted copy is absent.

**Deliverables:**

- author trusted repository MDX using the shared reading layout;
- distinguish Official Link, Evidence Link, and Offer Link;
- explain sponsored-link labeling and non-qualifying Offer behavior;
- link consistently from Header, Footer, Methodology, and Offer presentation.

**Acceptance criteria:**

- disclosure language is consistent with PRD invariants and rendered Offer behavior;
- every active Offer path exposes nearby disclosure;
- absence of an Offer never obscures the Official Link;
- the page is indexable, accessible, and useful without JavaScript.

**Validation:** focused content/render tests; disclosure-link audit; axe; screenshots.

**Stop/blocked conditions:** Stop if disclosure wording would create a new commercial policy, contradict Affiliate-neutrality tests, or require legal claims beyond the approved PRD.

**Out of scope:** Legal advice, Affiliate network integration, commission reporting, or commercial ranking.

### SB-403 — Complete lifecycle routes, redirects, and discovery exclusion

- **Status:** Blocked by SB-202 and SB-303
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-202, SB-303
- **Execution mode:** Implementation
- **Traceability:** PRD AC-14
- **Review focus:** Lifecycle routing, publication-history semantics, discovery exclusion, redirects, and SEO safety

**Goal:** Make invalid, draft, blocked, retired, replacement, and inactive-Tool content follow the PRD lifecycle in generated routes and discovery surfaces.

**Starting state:** SB-202 must provide lifecycle outcomes and SB-303 must provide Tool route generation. StatusPage exists, but lifecycle outcomes are not connected to public routes and discovery.

**Deliverables:**

- connect publication outcomes to 404, noindex status pages, permanent replacements, and route omission;
- remove inactive content from Home, related links, canonical links, structured data inputs, and future sitemap inputs;
- ensure blocked/retired pages expose no current claims or active decision controls;
- preserve published slug identity and valid replacement type.

**Acceptance criteria:**

- never-published records resolve to 404 or no generated route as specified;
- blocked/retired pages are noindex and truthful;
- valid replacements redirect permanently and invalid replacements fail validation;
- no hidden record leaks into discovery or metadata.

**Validation:** focused lifecycle tests; built route/redirect inspection; Playwright lifecycle smoke; `npm run test:schema`.

**Stop/blocked conditions:** Stop if a record's publication history is ambiguous, a replacement target is invalid, or lifecycle handling would expose current claims or controls on blocked/retired content.

**Out of scope:** Tombstone database, redirect service, slug reuse, or P1 content index.

### SB-404 — Implement canonical metadata, structured data, sitemap, and robots

- **Status:** Blocked by SB-403
- **Priority:** High
- **Risk:** High
- **Dependencies:** SB-403
- **Execution mode:** Implementation
- **Traceability:** PRD AC-14; release SEO contract
- **Review focus:** Canonical metadata, structured data, sitemap eligibility, robots, and SEO correctness

**Goal:** Produce correct indexability and discovery metadata for every eligible production route without ranking or unsupported claims.

**Starting state:** SB-403 must provide accepted route eligibility and lifecycle handling. Canonical route metadata, structured data, sitemap filtering, and robots policy are incomplete.

**Deliverables:**

- use the production `site` and trailing-slash policy established by SB-104;
- implement unique title, description, canonical, Open Graph/Twitter metadata, and approved structured data by route type;
- add `@astrojs/sitemap` only after recording maintenance, license, and build impact;
- add `robots.txt`, published-only sitemap filtering, query-state canonicalization, and preview/status noindex behavior.

**Acceptance criteria:**

- only eligible published routes appear in sitemap and structured data;
- Decision query and fragment state never enters canonical metadata;
- Tool schema contains no unsupported ratings, rankings, or winner claims;
- preview and status pages remain noindex.

**Validation:** focused metadata tests; generated sitemap/robots inspection; structured-data validation output.

**Stop/blocked conditions:** Stop if schema.org output would require unsupported ratings/rankings, if route eligibility is unresolved, or if adding the sitemap package lacks an acceptable license, maintenance, or build-impact record.

**Out of scope:** Programmatic SEO, Analytics, search console automation, schema ratings, or P1 landing pages.

### SB-405 — Add outbound-content security and Cloudflare headers

- **Status:** Blocked by SB-304 and SB-404
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-304, SB-404
- **Execution mode:** Implementation
- **Traceability:** PRD AC-11, AC-14; development-plan security contract
- **Review focus:** Outbound URL validation, serialization safety, MDX boundaries, CSP, and static header correctness

**Goal:** Prevent unsafe outbound URLs or authored content from creating executable markup and provide a tested static security-header baseline.

**Starting state:** SB-304 and SB-404 must define accepted outbound presentation and serialized metadata. Application-level URL/MDX safeguards and the final Cloudflare `_headers` policy are incomplete.

**Deliverables:**

- enforce approved `https:` outbound URL rules and trusted authored `mailto:` exception;
- prohibit untrusted `set:html`/`innerHTML`, arbitrary MDX components, user-provided MDX, and inline scripts;
- safely serialize JSON/structured data across `<`, script boundaries, and unsafe Unicode separators;
- add Cloudflare `_headers` with tested CSP, Referrer Policy, nosniff, and minimal Permissions Policy.

**Acceptance criteria:**

- unsafe protocols and executable serialized payloads are rejected or escaped;
- external and Affiliate links use the required security/relationship attributes;
- the CSP permits the actual static application and blocks unapproved runtime sources;
- the built `_headers` artifact expresses the expected route-level header policy without requiring a live Preview environment.

**Validation:** focused security tests; built-output and `_headers` inspection; `npm audit --omit=dev`; local header-policy fixture results.

**Stop/blocked conditions:** Stop if the required CSP conflicts with approved static behavior, if trusted/untrusted content boundaries are unclear, or if the change would require Workers, runtime nonces, secrets, account settings, or live Cloudflare mutation.

**Out of scope:** Authentication, secrets store, WAF rules, server functions, runtime CSP nonce service, or penetration-testing platform.

### SB-406 — Optimize assets, links, and performance budgets

- **Status:** Blocked by SB-303 through SB-405
- **Priority:** Medium
- **Risk:** Medium
- **Dependencies:** SB-303, SB-404, SB-405
- **Execution mode:** Implementation and measurement
- **Traceability:** PRD AC-12, AC-13; development-plan performance gate
- **Review focus:** Asset loading, link integrity, bundle budget, Core Web Vitals, and visual stability

**Goal:** Keep the static site fast, stable, self-contained, and within the approved image, font, link, JavaScript, LCP, and CLS budgets.

**Starting state:** Tool routes, metadata, security boundaries, and representative assets must be merged. Final asset, link, bundle, LCP, and CLS measurements do not yet exist.

**Deliverables:**

- optimize local images with explicit dimensions and responsive formats where useful;
- subset/preload only the critical font face/weight and retain fallbacks;
- generate route-appropriate local Open Graph assets without copied reference artwork;
- add broken-link/orphan checks and measure initial route JavaScript, representative LCP, and CLS.

**Acceptance criteria:**

- no production page hotlinks Tool screenshots or Logos;
- broken/missing images preserve layout and text fallback;
- initial route JavaScript remains at or below the reviewed 50 KiB gzip-equivalent budget; any measured exception requires explicit user approval before this task can complete;
- representative mobile and desktop lab checks meet LCP ≤2.5s and CLS ≤0.1.

**Validation:** link/orphan test output; bundle-size report; performance report; broken-asset screenshots.

**Stop/blocked conditions:** Stop if a budget failure requires removing required behavior, if measurements are not reproducible, or if an exception to the approved JavaScript/LCP/CLS budget is needed; request explicit human approval for that exception.

**Out of scope:** CDN image service, runtime optimization service, exhaustive synthetic monitoring, or speculative caching infrastructure.

### SB-407 — Approve the first production Scenario contract

- **Status:** Deferred until SB-305 accepts the fixture-based frontend core
- **Priority:** Critical
- **Risk:** Medium
- **Dependencies:** SB-201, SB-204, SB-305
- **Execution mode:** Product-contract decision; human approval required
- **Traceability:** PRD AC-15 and publication minimums
- **Review focus:** Scenario scope, prerequisites, testability, risk boundary, and publication minimums

**Goal:** Select and approve one concrete, non-high-risk launch Scenario before evidence collection or production content encoding begins.

**Starting state:** SB-305 must accept the complete fixture-based frontend journey, and the accepted schema and decision vocabulary must exist. No production Scenario is selected or approved, and fixture Scenarios remain non-production.

**Deliverables:**

- define the goal, prerequisites, suitable and unsuitable boundaries, 4–7 Scenario-local dimensions, allowed values/operators, and at least three comparable Candidate targets;
- define realistic user inputs that demonstrate meaningful differences and zero-result recovery;
- define the verification checklist and explicitly exclude rankings, universal winners, paid placement, and Affiliate-driven selection;
- record the approved Scenario contract and acceptance decisions as the task artifact without changing production content files.

**Acceptance criteria:**

- the Scenario has a concrete decision goal and visible prerequisites;
- every proposed dimension has one compatible operator and canonical value model;
- Candidate selection is defensible without commercial inputs;
- the user approves the bounded Scenario contract for evidence work.

**Validation:** approved Scenario contract artifact; dimension/operator table; representative input examples; risk-boundary review; recorded user approval decision.

**Stop/blocked conditions:** Stop if SB-305 has not accepted the fixture-based frontend core, if the Scenario enters a high-risk vertical, lacks three comparable Candidates, cannot define 4–7 stable dimensions, or requires commercial inputs to justify Candidate selection. Do not begin source research without recorded approval.

**Out of scope:** Source research, content encoding, screenshots, Offer qualification, or publication.

### SB-408 — Build the production Scenario source ledger

- **Status:** Deferred; blocked by SB-203 and SB-407
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-203, SB-407
- **Execution mode:** Evidence research and artifact production
- **Traceability:** PRD AC-09, AC-10, AC-15
- **Review focus:** Source authority, claim scope, freshness, conflicts, completeness, and commercial neutrality

**Goal:** Produce a current, claim-level evidence package for the approved Scenario without modifying public site content.

**Starting state:** SB-407 must provide the approved Scenario claim matrix and SB-203 the accepted evidence rules. No production source ledger exists.

**Deliverables:**

- collect authoritative sources for every required-filter Candidate/dimension cell and every intended public factual claim;
- record canonical value, source type and URL, explicit scope, `lastCheckedAt`, relevant effective dates, conflicts, limitations, and hands-on state evidence;
- identify unsupported, stale, wrong-scope, or conflicting cells instead of inferring or filling them from weak sources;
- research Offer data separately and include it only as optional commercial evidence that cannot affect Candidate selection or conclusions.

**Acceptance criteria:**

- every required claim has qualifying current evidence or an explicit unresolved status;
- source scope and check dates are sufficient for deterministic evidence resolution;
- conflicts and hands-on limitations are preserved;
- the independent review finds no Affiliate-driven Candidate or conclusion change.

**Validation:** reviewed source ledger; claim/cell completeness matrix; conflict and freshness report; Affiliate-neutrality review; exact source URLs and check dates.

**Stop/blocked conditions:** Stop rather than infer when qualifying evidence is absent, stale, wrong-scope, or conflicting. Stop if source access requires credentials, paid purchases, prohibited scraping, or a change to the approved Scenario contract.

**Out of scope:** Automated scraping, production MDX/content records, public claims, screenshots, or publication approval.

### SB-409 — Encode the approved production Scenario content

- **Status:** Deferred; blocked by SB-202 through SB-204, SB-304, SB-403, SB-407, and SB-408
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-202, SB-203, SB-204, SB-304, SB-403, SB-407, SB-408
- **Execution mode:** Content implementation
- **Traceability:** PRD AC-09, AC-10, AC-11, AC-14, AC-15
- **Review focus:** Schema validity, source bindings, publication history, fixture isolation, deterministic output, and Affiliate neutrality

**Goal:** Encode the approved Scenario, Tools, Candidates, Sources, hands-on states, and any independently qualifying Offer in the authoritative content collections.

**Starting state:** The approved Scenario contract and reviewed source ledger must exist, and all listed code dependencies must be merged. Production content records do not exist.

**Deliverables:**

- add one real Scenario with visible prerequisites, approved boundaries and dimensions, and at least three comparable Candidates; mark every real Scenario, Tool, Candidate, Source, and Offer record `fixture: false`;
- bind every public claim and required-filter cell to the reviewed Source Observations without changing the approved contract;
- set lifecycle and immutable `firstPublishedAt` semantics when records are first approved for Production promotion, preserving the value afterward;
- include an Offer only when it independently qualifies; otherwise retain neutral Official Links only;
- add regression tests proving fixtures remain excluded from Production output and commercial fields cannot affect results or ordering.

**Acceptance criteria:**

- the real Scenario passes schema, evidence, decision, publication, and route generation;
- every public claim exposes state, scope, source, and check date;
- no fixture appears in the Production discovery or route projection;
- no commercial mutation affects eligibility, order, explanations, alternatives, or comparison.

**Validation:** `npm run test:schema`; focused publication/evidence/decision/fixture-isolation tests; complete Scenario screenshots.

**Stop/blocked conditions:** Stop if any public claim lacks a qualifying source binding, if encoding would change the approved Scenario contract, or if a fixture/commercial field would influence production eligibility or output.

**Out of scope:** Changing the approved Scenario contract, new source research, additional Scenarios, automated ingestion, or deployment.

### SB-410 — Verify production Scenario publication readiness

- **Status:** Deferred; blocked by SB-409
- **Priority:** Critical
- **Risk:** Medium
- **Dependencies:** SB-409
- **Execution mode:** Verification-only; no fixes in this task; human approval required after a pass
- **Traceability:** PRD AC-09, AC-10, AC-11, AC-14, AC-15
- **Review focus:** Evidence completeness, publication eligibility, rendered truthfulness, and production fixture exclusion

**Goal:** Independently verify the exact merged-main production Scenario is truthful and eligible for release; do not repair content inside this Gate.

**Starting state:** SB-409 must be merged and reconciled on one clean `main` commit with the production Scenario, source bindings, rendered routes, and passing implementation evidence.

**Deliverables:**

- verify the approved Scenario contract, source ledger, encoded records, rendered pages, and test evidence against the same merged-main commit;
- verify every required claim, limitation, check date, hands-on state, Official Link, optional Offer, and zero-result path;
- verify Development/Preview fixtures cannot enter Production discovery, generated routes, sitemap, or structured data;
- create atomic blocking content or code defect tasks for every failure and keep this Gate blocked until they merge and the full Gate is rerun.

**Acceptance criteria:**

- the real Scenario satisfies every PRD publication minimum;
- all public statements match current qualifying evidence and disclose limitations;
- fixture and Affiliate-neutrality controls pass;
- the user approves this exact merged-main content set for release candidacy.

**Validation:** publication-readiness checklist; source-ledger reconciliation; schema and focused test output; reviewed screenshots; merged commit SHA; recorded user approval decision.

**Stop/blocked conditions:** On any failure, keep the Gate blocked, record exact evidence, create a bounded content or code defect task, and stop. Do not edit sources, content, code, tests, or configuration inside this task.

**Out of scope:** Editing sources or content, implementing fixes, adding Scenarios, or deploying Preview/Production.

### SB-411 — Configure GitHub-backed Cloudflare Pages Preview

- **Status:** Deferred; blocked by SB-404 through SB-406 and SB-410
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-404, SB-405, SB-406, SB-410
- **Execution mode:** Credential-gated external action; explicit user authorization required before mutation
- **Traceability:** PRD AC-14, AC-15; development-plan Preview contract
- **Review focus:** Cloudflare Pages scope, GitHub binding, release-branch isolation, noindex Preview, headers, and secret safety

**Goal:** Connect the public GitHub repository to Cloudflare Pages and produce a reproducible noindex Preview without allowing `main` merges to trigger Production.

**Starting state:** All dependencies must be merged on clean `main`; the GitHub repository is public; Cloudflare project ownership, GitHub authorization, and account access must be confirmed before execution.

**Prerequisites:** User-authorized Cloudflare account access, GitHub repository authorization, confirmed Pages project ownership, and a StackBriefs-only Pages scope. The task may configure this site's static Pages build, Preview, release branch, redirects, and headers, but not account ownership, billing, unrelated projects, Workers, secrets, or DNS.

**Deliverables:**

- configure Node 24, `npm ci`, `npm run build`, output directory, Preview behavior, and `release` as the sole production branch;
- keep `main`, pull requests, and non-release branches in Preview behavior so ordinary merged work cannot cut over Production;
- configure the non-secret build target as `preview` for non-release deployments and `production` only for `release`;
- verify Preview noindex, redirects, canonical behavior, assets, and the live `_headers` policy created by SB-405;
- record only non-secret repository configuration and identify the deployed commit through Cloudflare/GitHub evidence.

**Acceptance criteria:**

- a reviewed GitHub commit produces a successful Cloudflare Preview URL;
- `release` is the only configured Production branch and has not been advanced by this task;
- Preview is noindex and serves expected redirects, canonical behavior, assets, and security headers;
- no secret, token, account-wide setting, Worker, DNS record, or unrelated Cloudflare project is changed.

**Validation:** GitHub PR/CI URL; Cloudflare Preview URL and build log; branch-control evidence; HTTP redirect/header/noindex smoke output; applicable local validation; recorded user authorization.

**Stop/blocked conditions:** Stop before mutation if credentials, project ownership, repository authorization, or target project identity are missing. Stop on any request to alter DNS, billing, account ownership, Workers, secrets, unrelated projects, or the Production branch.

**Out of scope:** Production cutover, custom-domain attachment, Workers, Pages Functions, D1, KV, R2, Analytics, billing, or account administration.

### SB-412 — Execute the release-candidate verification Gate

- **Status:** Deferred; blocked by SB-305 and SB-401 through SB-411
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-305, SB-401, SB-402, SB-403, SB-404, SB-405, SB-406, SB-410, SB-411
- **Execution mode:** Verification-only; no fixes in this task; human approval required after a pass
- **Traceability:** PRD AC-01 through AC-15
- **Review focus:** Independent local, CI, Preview, browser, accessibility, security, SEO, content, and performance verification

**Goal:** Verify one exact merged-main release candidate against the complete P0 contract and obtain explicit user authorization for Production promotion.

**Starting state:** Every dependency must be merged and reconciled on one clean candidate commit, with a successful CI run and Cloudflare Preview for that exact SHA.

**Deliverables:**

- run the compact release chain from a clean, reconciled candidate commit;
- execute the core browser flow, lifecycle, direct entry, invalid state, JavaScript-disabled, keyboard, touch, axe, responsive, forced-colors, reduced-motion, long-content, broken-asset, link, security-header, and performance checks;
- verify production content, fixture exclusion, sitemap, robots, canonical, redirect, and Affiliate-neutrality invariants on local, CI, and Preview;
- record every failure as an atomic blocking defect task; do not implement fixes inside this Gate.

**Acceptance criteria:**

- all required local commands and CI jobs pass on one merged-main candidate;
- no serious accessibility violation, uncaught console error, broken primary link, unintended page overflow, security-header failure, fixture leak, or unapproved release-budget exception remains;
- Preview smoke proves primary routes, redirect, canonical/noindex, one core interaction, and JavaScript-disabled Decision content;
- the user authorizes the exact candidate SHA for promotion to `release`.

**Validation:** `npm ci`; `npm run check`; `npm run test:schema`; `npm test`; `npm run build`; Playwright Chromium/WebKit and Firefox smoke; axe, performance, link, and header reports; Preview smoke; reviewed screenshots; approved candidate SHA; recorded user decision.

**Stop/blocked conditions:** On any failure, keep the Gate blocked, record exact reproduction evidence, create the smallest bounded defect task, and stop. Do not edit code, content, tests, configuration, Preview settings, or release branches inside this task.

**Out of scope:** Implementing fixes, new features, content expansion, architecture refactor, Production deployment, Analytics, or P1 scope.

### SB-413 — Promote the approved commit to Cloudflare Pages Production

- **Status:** Deferred; blocked by SB-412
- **Priority:** Critical
- **Risk:** Medium
- **Dependencies:** SB-412
- **Execution mode:** Credential-gated external Production action; exact-SHA authorization required
- **Traceability:** PRD AC-15; development-plan exact-commit promotion contract
- **Review focus:** Exact-commit promotion, release-branch integrity, Cloudflare deployment evidence, and scope containment

**Goal:** Promote only the user-approved release-candidate commit from reconciled `main` to the Cloudflare Pages `release` branch and capture the resulting deployment.

**Starting state:** SB-412 must record a passing candidate SHA and explicit user authorization. Local `main`, `origin/main`, the approved Preview, and the candidate SHA must identify the same content.

**Prerequisites:** SB-412 user approval names the exact commit SHA; Cloudflare/GitHub authorization is available; the user has recorded whether P0 uses the Pages hostname or an approved custom domain, and any required DNS authority is separately authorized before execution.

**Deliverables:**

- confirm local `main`, `origin/main`, the approved candidate SHA, and Preview deployment all identify the same content;
- advance `origin/release` to that exact commit through the accepted reviewed promotion workflow with no additional file changes;
- allow Cloudflare Pages to deploy the `release` branch and capture the deployment identifier and immutable commit evidence;
- if promotion or deployment fails, stop and create a bounded blocking defect or operations task instead of changing unrelated settings.

**Acceptance criteria:**

- `origin/release` identifies exactly the user-approved candidate commit;
- Cloudflare reports a successful Production deployment for that commit;
- no unapproved repository, Cloudflare, domain, DNS, account, billing, secret, or runtime change occurs;
- deployment evidence is ready for the independent Production verification Gate.

**Validation:** user-approved candidate SHA; pre/post branch evidence; reviewed promotion PR or equivalent protected workflow; Cloudflare deployment URL, identifier, and log; GitHub/Cloudflare commit match.

**Stop/blocked conditions:** Stop if any commit identity differs, authorization does not name the exact SHA, the release branch would include additional changes, or deployment requires unrelated Cloudflare, DNS, account, billing, or secret changes. Do not diagnose by changing Production settings inside this task.

**Out of scope:** Product changes, defect fixes, content changes, Production acceptance, destructive rollback testing, or unrelated Cloudflare administration.

### SB-414 — Verify Production and rollback readiness

- **Status:** Deferred; blocked by SB-413
- **Priority:** Critical
- **Risk:** High
- **Dependencies:** SB-413
- **Execution mode:** Verification-only against Production; no fixes in this task; human acceptance required after a pass
- **Traceability:** PRD AC-13, AC-14, AC-15
- **Review focus:** Independent Production behavior, commit identity, indexing, security, core journey, and rollback readiness

**Goal:** Independently verify the exact Production deployment and its rollback readiness without implementing fixes inside the Gate.

**Starting state:** SB-413 must provide a successful Production deployment identifier for the exact approved release SHA and any known prior successful Production rollback target.

**Deliverables:**

- run Production route, redirect, canonical, sitemap, robots, security-header, asset, core interaction, Official Link, accessibility, and JavaScript-disabled smoke checks;
- prove Production serves the user-approved `release` commit and does not leak Preview noindex behavior;
- if a prior successful Production deployment exists, retain its identifier as the rollback target and verify the non-destructive rollback procedure;
- for the first Production deployment, explicitly record that no prior Production target exists, retain the approved Preview/candidate evidence as the recovery reference, and establish this successful deployment as the baseline for subsequent rollback checks;
- route every failure to an atomic blocking defect, rollback-action, or deployment-operations task; do not repair it inside this Gate.

**Acceptance criteria:**

- Production serves the exact approved commit over HTTPS and all required smoke checks pass;
- indexing, canonical, security headers, assets, and core interaction match the release contract;
- rollback evidence truthfully distinguishes first deployment from later deployments;
- repository, CI, Preview, `release`, and Cloudflare Production evidence reference the same release commit;
- the user accepts the Production release.

**Validation:** Production URL and deployment identifier; release commit SHA; HTTP and browser smoke output; sitemap/robots/header/canonical checks; rollback or first-baseline evidence; `git rev-list --left-right --count main...origin/main` equals `0 0`; recorded user decision.

**Stop/blocked conditions:** On any failure, keep the Gate blocked and stop after recording the exact deployment, route, request, and evidence. Route correction or rollback to a separately authorized task; do not edit Production, code, content, configuration, DNS, or release branches inside this Gate.

**Out of scope:** Implementing fixes, post-launch content automation, monitoring platform, Analytics, P1 features, or infrastructure migration.
