# StackBriefs PRD

**Author:** Product Manager
**Date:** 2026-07-12
**Status:** Approved product requirements
**Product:** StackBriefs
**Market:** English-language public web
**Implementation plan:** [Toolify clone development plan](toolify-clone-development-plan.md)

## Document responsibility

This PRD owns product boundaries, domain semantics, user journeys, product states, scope, metrics, risks, and acceptance criteria. It does not own frontend architecture, visual implementation, dependency selection, delivery sequencing, or development workflow.

The repository currently contains a minimal executable Astro scaffold: `src/pages/index.astro`, `src/layouts/BaseLayout.astro`, `src/styles/global.css`, and `tests/scaffold.test.ts`. `npm run test`, `npm run check`, and `npm run build` pass, with the build generating one static page. Content Collections, domain modules, planned product routes beyond `/`, and `tests/content-schema.test.ts` remain unimplemented; `npm run test:schema` is therefore expected to fail until schema work begins. Requirements below describe the product contract and planned behavior, not implemented product capability.

## 1. Product decision

StackBriefs is a free, scenario-first decision-support product that helps people narrow, compare, and verify AI-tool options for a specific use case without black-box recommendations, universal rankings, or commercial influence.

The central product object is **User Scenario**, not Tool, Category, ranking, deal, or generated workflow. Each scenario owns its goal, boundaries, decision dimensions, deterministic filters, candidate set, verification checklist, related content, and evidence references. StackBriefs publishes an open, heterogeneous portfolio of independently reviewed scenarios; it does not preselect one strategic first public scenario. Users choose, filter, and compare only within scenarios that have passed their own content and evidence publication gates. Development fixtures validate the shared product but never determine public scenario priority, portfolio order, vertical, homepage, shared filters, data model, comparison model, or URL state.

The core promise is:

> Start with a use case. Narrow the options. Choose with confidence.

The core journey is:

```text
User Scenario
  → decision criteria and boundaries
  → deterministic requirements
  → explainable matches and exclusions
  → user-controlled shortlist
  → scenario-scoped comparison
  → claim-level evidence and freshness verification
  → user decision
  → official link or separately labeled Offer path
```

## 2. Problem, positioning, and product principles

### 2.1 User problem

People evaluating AI tools face an abundance of directory entries, marketing claims, rankings, changing free-plan limits, and commercial calls to action. Existing discovery products often help users find tools but do not reliably help them:

- define what matters for a particular use case;
- separate eligible candidates from non-matches using explicit conditions;
- understand why a tool appears or is excluded;
- compare only the dimensions relevant to the current decision;
- distinguish verified facts from editorial assessment, unknown information, stale evidence, and non-applicable fields;
- verify dynamic claims before leaving for a vendor or affiliate destination.

### 2.2 Positioning

StackBriefs helps users discover, filter, compare, and verify AI tools for specific use cases through free decision guidance, practical utilities, source-ledger-backed facts, and transparent commercial status.

StackBriefs is not:

- a general-purpose AI-tool directory;
- a Toolify, G2, TAAFT, or Product Hunt replica;
- a universal “best tools” ranking product;
- an LLM recommendation, workflow-generation, or automatic stack-building product;
- a deals or coupon aggregator;
- a vendor marketplace, review community, or paid-placement system;
- a site whose eligibility, results, or default ordering are influenced by affiliate economics.

### 2.3 Product principles

1. **Scenario first:** begin with the user’s decision context, not a tool inventory.
2. **User-controlled choice:** provide criteria, filters, evidence, and conditional guidance; do not announce a universal winner.
3. **Deterministic and explainable:** identical normalized inputs produce identical results, ordering, and explanations.
4. **Evidence-aware:** show what is known, assessed, unknown, stale, non-applicable, or conflicting.
5. **Free value first:** a user can understand and verify a decision without clicking a commercial link.
6. **Commercial neutrality:** affiliate and offer data are presentation-only and cannot affect decision logic.
7. **Static first:** public pages remain useful without JavaScript; browser enhancement handles filters and temporary state.
8. **Open published portfolio:** no single scenario is preselected as the strategic first public scenario; every published scenario independently passes the same content and evidence gates.
9. **Reviewed contribution:** Tool Owner submissions may improve the factual record, but submission or payment never equals publication or favorable treatment.
10. **Open-ended architecture:** no fixture, vertical, clone convenience, or shared dimension set may become the product boundary.

## 3. Target users and jobs

The source documents describe use cases and decision jobs but do not explicitly define named target-user segments. The job-based groups below are Product assumptions inferred from that material, not source-defined market segments. Quantitative segment sizing is unavailable and is not invented in this PRD.

### 3.1 Primary users

**Independent evaluator**
A person choosing an AI tool for a concrete work outcome who wants to reduce research time without surrendering the final decision to a ranking or model.

**Small-team decision maker**
A founder, operator, marketer, creator, or functional lead comparing tools under budget, workflow, privacy, collaboration, export, or commercial-use constraints.

**Evidence-conscious researcher**
A person who needs to verify pricing, free-plan limits, capabilities, privacy, region, migration, or offer claims before recommending or adopting a tool.

**Tool Owner contributor**
A merchant, network representative, or authorized Tool representative who needs a reviewed channel to submit or correct Tool facts, Official Links, plan information, Affiliate/Referral URLs, Offer terms, and supporting evidence without purchasing publication or favorable treatment.

### 3.2 Jobs to be done

- When I have a specific use case, help me identify the conditions that materially change the choice.
- When I set required conditions, show only candidates with current evidence confirming every requirement.
- When a candidate does not qualify, tell me whether it fails a condition or lacks sufficient evidence.
- When no candidate qualifies, show which requirements conflict and let me relax them deliberately.
- When I compare tools, show scenario-relevant facts and limitations rather than every feature.
- Before I leave StackBriefs, give me sources and a verification checklist so I can make my own decision.
- If a reviewed Affiliate/Referral commercial destination exists, label it separately so I can distinguish evidence from monetization; otherwise send me to the real Official Link without implying an Offer, Deal, or Discount.
- When I represent a Tool, let me submit or correct factual and commercial-source information for webmaster review without implying that submission or payment guarantees publication or favorable treatment.

## 4. Product boundaries and domain relationships

### 4.1 Open-ended multi-scenario boundary

StackBriefs supports an unbounded portfolio of User Scenarios. Each scenario can have different dimensions, requirement values, candidates, evidence coverage, and comparison logic. The same Tool may be a match in one scenario, a non-match in another, and unknown in a third.

The following must always be scoped to the current `scenarioId`:

- user requirements;
- candidate eligibility;
- decision dimensions;
- filter state;
- shortlist membership;
- comparison content;
- explanations;
- URL state.

There is no global tool score, global winner, universal filter set, or global scenario-independent comparison conclusion.

Development must use:

- one representative fixture to exercise the complete decision loop; and
- one structurally different heterogeneous fixture to prove the shared product has not been hard-coded to the representative fixture.

Fixtures are validation data, not public-launch commitments or product boundaries.

Public content follows a portfolio rule:

- StackBriefs does not reserve or preselect one strategic first public scenario.
- Any scenario may publish when it independently passes the scenario contract, content review, required-filter evidence coverage, freshness, reference-integrity, and risk gates.
- A scenario that fails its gate remains unpublished without blocking other qualifying scenarios.
- Clone convenience, fixture order, existing screenshots, and implementation coverage cannot determine scenario priority or publication order.
- Users choose among reviewed published scenarios and all filter, shortlist, and comparison behavior remains scoped to the selected scenario.

### 4.2 Domain relationships

```text
User Scenario
  ├─ goal, suitable/not-suitable boundaries, prerequisites
  ├─ Decision Dimensions and allowed requirement values
  ├─ Deterministic Filters
  ├─ Scenario Candidates
  │    ├─ scenario-specific fit and limitation
  │    ├─ dimension-to-claim relationships
  │    └─ Tool reference
  ├─ Verification Checklist
  ├─ related Utilities, Guides, and fixed Comparisons
  └─ Source Ledger references

Tool
  ├─ stable identity and official destination
  ├─ neutral summary
  ├─ related User Scenarios
  ├─ scenario-specific conclusions only through Scenario Candidate
  └─ separate Offer status, when any

Source Ledger / Evidence
  ├─ supports an individual claim
  ├─ records source type, claim type, observed value and scope
  ├─ records capture/check dates, confidence, and notes
  └─ resolves to evidence state before candidate evaluation

User Shortlist
  ├─ contains 1–4 current-scenario candidates
  └─ enables scenario-scoped comparison at 2–4 items

Offer
  ├─ stores a reviewed Affiliate/Referral commercial destination, including network or merchant-submitted programs
  ├─ records status, terms, date, region, disclosure, and evidence
  └─ is presentation-only and has no dependency into eligibility, evaluation, comparison, or sorting
```

### 4.3 Entity responsibilities

**User Scenario** owns the decision contract: goal, boundaries, prerequisites, dimensions, requirement values, candidate references, verification checklist, related content, and review status.

**Scenario Candidate** is the relationship between a User Scenario and a Tool. It stores only scenario-specific fit, limitations, dimension/claim associations, hands-on state, risk flags, and evidence references. It does not duplicate the Tool’s entire profile.

**Tool** owns stable identity, a neutral summary, official links, and relationships to scenarios. Tool pages aggregate scenario-specific context but do not create global suitability conclusions.

**Source Ledger / Evidence** records claim-level observations and provenance. A non-empty source record alone does not make a fact verified; source authority, scope, freshness, and conflicts must be resolved first.

**Offer** owns a reviewed Affiliate/Referral commercial destination and its status, terms, scope, disclosure, and supporting evidence references. It may originate from an affiliate network such as CJ or a merchant/Tool Owner submission. It is not itself evidence. An absent Offer is valid and cannot remove or demote a Tool; the real Official Link remains the neutral user destination.

**Tool Owner Submission** is an intake record, not published content. It may contain proposed Tool facts, Official Links, plan information, Affiliate/Referral URLs, Offer terms, corrections, and evidence. A webmaster must review, independently qualify, and explicitly accept each publishable change.

**Shortlist** is temporary user state, not a server-side content object in MVP.

## 5. Primary user journeys

### Journey A — Discover a decision scenario

1. User enters from the homepage, reviewed scenario portfolio/index/search, related Tool, Utility, Guide, or search engine.
2. User chooses among published scenarios expressed as concrete choices, not broad categories or one strategically privileged launch scenario.
3. User can inspect the selected scenario’s goal, suitable/not-suitable boundaries, prerequisites, and last review status before filtering.
4. If no published scenario matches a search, the product shows adjacent reviewed scenarios, a generic selection checklist, and a scenario-suggestion path; it does not generate or publish an unreviewed answer.

**Observable success:** the user reaches an existing scenario or an explicit no-scenario recovery state without receiving a fabricated recommendation.

### Journey B — Filter candidates deterministically

1. User sets one or more conditions.
2. Each condition is labeled as a required condition or optional preference.
3. Formal results contain only candidates whose every required condition resolves to `match`.
4. Each candidate displays why it is included, plus a key scenario-specific limitation.
5. Excluded candidates distinguish `no_match` from `unknown`.
6. Results use a stable, explainable order.

**Observable success:** replaying the same normalized scenario, evidence snapshot, and requirements yields byte-equivalent candidate IDs, order, and explanation order.

### Journey C — Recover from zero results

1. The product states which combination of required conditions caused zero formal matches.
2. The user can relax one condition at a time; no condition is silently removed.
3. “Closest alternatives” appear outside formal results.
4. Each alternative identifies every required condition that is `no_match` or `unknown`.
5. Closest alternatives are ordered by unmet required-condition count, then normalized Tool name, then slug.
6. Commercial status is never used as a fallback.

**Observable success:** the zero-result state identifies at least one actionable condition change or states that no eligible alternative exists.

### Journey D — Build a shortlist and compare

1. User may retain 1–4 current-scenario candidates.
2. One item remains useful through its evidence and verification checklist; the UI does not create a fake comparison.
3. Comparison enables only at 2–4 valid items.
4. Restored state is deduplicated, capped at four, checked against current-scenario membership, and stripped of invalid/deleted IDs.
5. A filter change does not silently remove a selected Tool; the product marks it as no longer matching until the user removes it.
6. Comparison shows only the current scenario’s dimensions and does not declare a universal winner.

**Observable success:** invalid, duplicate, deleted, fifth, and cross-scenario shortlist entries never appear in the active comparison.

### Journey E — Verify and leave

1. User can inspect claim-level status, source, last checked date, and freshness.
2. User can distinguish Official, Evidence, and Offer links by label, placement, and semantics.
3. User receives a scenario-specific pre-decision checklist.
4. If a qualifying Affiliate Offer exists, the user may choose it as a separately disclosed commercial path.
5. If no qualifying Affiliate Offer exists, the real Official Link remains the destination and is not labeled Offer, Deal, or Discount.
6. User may choose an Official Link, a qualifying Offer, an alternative, or no Tool.

**Observable success:** every commercial destination is disclosed and structurally separate from citations; every Tool retains a truthful Official path regardless of Offer availability; choosing no commercial path remains a complete outcome.

### Journey F — Submit or correct Tool information

1. A Tool Owner submits or updates Tool facts, Official Links, plan information, Affiliate/Referral URLs, Offer terms, corrections, or supporting evidence through the designated channel.
2. The product acknowledges receipt without representing the submission as published, verified, approved, or queued for favorable placement.
3. A webmaster reviews source authority, scope, freshness, conflicts, policy compliance, and commercial separation before accepting any change.
4. Accepted factual changes publish with their evidence state; accepted commercial destinations publish only after Offer review. Rejected or insufficient submissions remain unpublished with an internal reason.
5. Free submission/correction access and any paid service are visibly separated. Payment may purchase preparation, research assistance, or a defined response-time service only; it never guarantees inclusion, favorable conclusions, ordering, evidence status, or Offer approval.

**Observable success:** a submitted or paid record cannot become public without a recorded webmaster decision, and published decision results are byte-equivalent when only submission/payment metadata changes.

## 6. Page responsibilities

### 6.1 MVP/P0 routes

**Home (`/`)**

- Communicate the scenario-first promise.
- Provide discovery across the reviewed published-scenario portfolio.
- Do not privilege a fixture or preselected scenario because it was implemented, cloned, or researched first.
- Explain deterministic filtering, shortlist/comparison, evidence/freshness, and affiliate neutrality.
- Link Methodology and Affiliate Disclosure.
- Exclude dense tool walls, rankings, unsupported social proof, and commercial hero CTAs.

**Decision workspace (`/decision/{scenario}`)**

- Display scenario goal, suitable/not-suitable boundaries, prerequisites, and decision dimensions.
- Render useful static scenario/candidate/evidence content before JavaScript.
- Provide content-driven requirement controls.
- Explain formal inclusion, `no_match`, and `unknown` exclusion.
- Provide zero-result recovery without silently weakening filters.
- Support 1–4 shortlist and 2–4 comparison.
- Display evidence status, freshness, conflict, citations, and verification checklist.

**Tool detail (`/tool/{slug}`)**

- Provide a neutral Tool summary and related scenarios.
- Show scenario-specific fit and limitations, not global suitability.
- Show hands-on state, risk flags, and claim-level evidence.
- Separate Official, Evidence, and Offer regions.
- Preserve a return path to the current scenario context.

**Methodology (`/methodology`)**

- Explain scenario selection, deterministic matching, unknown handling, evidence authority, freshness, conflicts, hands-on states, corrections, and commercial neutrality.

**Affiliate Disclosure (`/affiliate-disclosure`)**

- Explain affiliate relationships and the prohibition on commercial influence over eligibility, results, and default ordering.

### 6.2 P1 page expansion

- scenario index and search for the growing reviewed portfolio;
- any additional scenario that independently passes publication gates, without reserving a “second” strategic slot;
- Tool Library index;
- fixed, indexable scenario-bound comparison routes;
- Utilities, beginning with simple selection/filter/checklist/matrix value;
- expanded Guides and trust/correction/contact pages;
- newsletter;
- Tool Owner submission/update/correction intake with free and paid-service boundaries, webmaster review state, and no automatic publication.

### 6.3 P2 page expansion

- account/workspace surfaces, only if evidence justifies server-side persistence;
- localization or additional platforms;
- programmatic inventory only if it preserves the scenario/evidence contract and receives separate approval.

## 7. Deterministic behavior requirements

### 7.1 Requirement evaluation

- Every explicit required condition must resolve to `match` for formal inclusion.
- `no_match` and `unknown` both exclude a candidate but must produce different human-readable reasons.
- Optional preferences display differences only; they do not exclude, score, or secretly reorder candidates.
- Match state is derived at runtime from the current requirement and resolved evidence. It is never stored as content.
- There is no overall score, universal winner, hidden editorial rank, popularity rank, or commercial weight.

### 7.2 Ordering

Formal results sort by normalized Tool name, then slug as a stable tie-breaker.

Additional sort options may be added in P1 only when they are directly explainable, such as last-checked date or free-plan state. Affiliate status, offer status, commission, ratings, reviews, popularity, saved count, traffic, and sponsorship are forbidden ordering inputs.

### 7.3 URL and state

MVP state is scenario-scoped and query-driven. The canonical shape is:

```text
/decision/<scenario-slug>?r=<dimension>:<value>&r=<dimension>:<value>&shortlist=<slug>,<slug>
```

Behavior:

- parse repeated requirements deterministically;
- accept the first valid duplicate requirement occurrence;
- serialize requirements in scenario dimension order;
- remove invalid dimensions, invalid values, deleted tools, and cross-scenario tools;
- preserve first-valid shortlist order after deduplication;
- cap shortlist at four;
- restore normalized state on reload and browser back/forward;
- ensure parse → serialize → parse stability.

Local storage, accounts, databases, and server-side personalization are excluded from MVP unless measured URL limits later justify a separate decision.

### 7.4 Progressive enhancement

- Static HTML must provide a useful dated scenario and evidence snapshot.
- JavaScript may enhance filtering, shortlist, comparison, and browser-time freshness.
- Client code may downgrade current evidence to stale after its validity date; it may not upgrade missing, weak, conflicting, or stale evidence.
- Script failure must not produce a blank or misleading page.

## 8. Evidence and trust semantics

### 8.1 User-visible information states

Every displayed decision claim must use one of these states:

- `verified_fact`: current qualifying evidence supports the normalized claim.
- `editorial_assessment`: an explicitly labeled StackBriefs judgment tied to scenario and conditions.
- `not_verified`: qualifying evidence is missing or insufficient.
- `needs_recheck`: previously relevant evidence is outside its freshness window.
- `not_applicable`: the dimension does not apply to this Tool in this scenario.
- `conflicting`: current same-scope qualifying observations disagree; for required matching this resolves to `unknown`.

`unknown` is the candidate-evaluation result for missing, insufficient, stale, scope-mismatched, or conflicting evidence. **Unknown is never a positive match.**

### 8.2 Evidence qualification

A source entry must record at least:

- claim and claim type;
- entity reference;
- URL and source type;
- observed value;
- relevant scope, including region, plan/tier, version, or effective date where applicable;
- captured date and last-checked date;
- confidence and notes.

Rules:

- Official product, pricing, documentation, legal, or other claim-direct sources are preferred.
- Community, directory, search-result, and manual-note sources may discover leads but cannot independently establish `verified_fact`.
- A source with the wrong scope does not prove or disprove the requested scope; it yields `unknown`.
- Current equal-authority, same-scope observations with different normalized values yield `conflicting`; recency alone cannot silently choose a winner.
- Confidence is explanatory metadata in MVP and has no direct scoring or matching effect.
- Future, missing, invalid, or unparsable dates invalidate current evidence.

### 8.3 Freshness windows

- deal, coupon, and affiliate tracking: 7 days;
- pricing, free plan, trial, and plan limits: 30 days;
- capability, integration, privacy, commercial use, copyright, region, cancellation, migration/export, risk, and general research: 90 days.

At expiry:

- affected required conditions resolve to `unknown`;
- positive current-language is removed;
- the UI shows `Needs recheck`;
- an expired verified deal cannot remain `verified_deal`;
- dated history may remain visible.

Page-level “Current” status is permitted only when all required decision claims are within their applicable windows. One fresh claim cannot hide stale or missing claims elsewhere on the page.

### 8.4 Hands-on states

- `tested`;
- `partially_tested`;
- `not_tested`;
- `unavailable`.

Public presentation must not imply direct experience when the state is `not_tested`.

## 9. Official, Evidence, and Offer separation

### 9.1 Link types

**Official Link:** the real neutral Tool destination, such as the product homepage; it is the default outbound destination when no qualifying Offer exists.
**Evidence Link:** citation supporting a claim.
**Offer Link:** a reviewed Affiliate/Referral commercial destination, including an affiliate-network program such as CJ or a merchant-submitted destination, with disclosure, status, date, terms, region, and evidence.

These links must be structurally, visually, and semantically distinguishable. A free plan, paid plan, trial, or price is an evidence-backed product fact; it becomes Offer content only when a separately reviewed Affiliate/Referral commercial destination and terms qualify. An Official Link must never be relabeled as Offer, Deal, or Discount merely because no Offer exists.

### 9.2 Offer states

- `verified_deal`: a current, verifiable deal with qualifying evidence.
- `trackable_offer`: an approved trackable affiliate destination without a verified exclusive discount.
- `research_only`: commercial or tracking status is not sufficiently verified; must not use deal or discount language.
- `expired`: the deal, link, plan, or tracking validity has ended.
- `rejected`: unavailable because of application, region, terms, payment, or another recorded constraint.

### 9.3 Commercial neutrality

Affiliate status, network, commission, Offer presence, Offer value, and Offer state must not:

- create or remove Scenario Candidates;
- change required-condition evaluation;
- convert `unknown` into `match`;
- change formal result membership;
- change default ordering;
- change closest-alternative ordering;
- change comparison conclusions;
- create a universal winner.

`expired` and `rejected` states cannot render an active commercial CTA. `research_only` cannot be represented as a deal. Absence of an Offer is valid, and the real Official Link remains available without Offer, Deal, or Discount labeling. Adding or substituting an Affiliate/Referral URL later must leave eligibility, formal results, explanations, closest alternatives, comparison conclusions, and ordering unchanged.

### 9.4 Tool Owner submission and service boundary

The Tool Owner channel accepts proposed Tool facts, Official Links, plan information, Affiliate/Referral URLs, Offer terms, corrections, and evidence. Submission is an intake action only; it never establishes publication, verification, Offer status, or evidence state.

The mandatory workflow is:

```text
Tool Owner submission
  → receipt recorded
  → webmaster source/scope/freshness/conflict/policy review
  → accept, partially accept, request evidence, or reject
  → publication only for explicitly accepted fields
```

Free service:

- submit a new Tool for consideration;
- propose updates or corrections;
- provide Official Links, plan facts, Affiliate/Referral URLs, Offer terms, and evidence;
- receive a receipt and normal-queue review outcome when operationally supported.

Paid service, only if separately approved and disclosed, may cover defined preparation, evidence-collection assistance, structured-data formatting, or a response-time/service-level commitment. Payment must not guarantee or influence:

- inclusion or publication;
- favorable scenario fit, conclusions, or wording;
- candidate eligibility, results, or ordering;
- `verified_fact`, confidence, freshness, or any evidence state;
- Offer approval, Deal/Discount language, or commercial prominence.

Submission and payment metadata are prohibited inputs to scenario selection, candidate evaluation, comparison, and ordering. No self-serve Tool Owner dashboard or direct publishing permission is included in P0 or P1.

## 10. Scope and phasing

### 10.1 MVP / P0a — Decision and evidence core

MVP validates the shared decision loop and heterogeneous architecture with fixtures while allowing any number of independently qualified scenarios to enter the reviewed public portfolio; it does not preselect one strategic launch scenario or pursue directory scale.

Must include:

- static Astro application with scenario-first homepage and shared shell;
- one representative fixture exercising the complete loop;
- one heterogeneous fixture proving dimensions, filters, shortlist, comparison, URL state, and discovery structure are not hard-coded;
- evidence-ready public content before release;
- User Scenario, Scenario Candidate, Tool, and Source Ledger domain relationships;
- deterministic evidence resolution and candidate evaluation;
- explainable formal matches, exclusions, and zero-result recovery;
- query-driven 1–4 shortlist and 2–4 comparison;
- claim-level evidence states, freshness, conflicts, hands-on state, and risk visibility;
- `/`, `/decision/{scenario}`, `/tool/{slug}`, `/methodology`, and `/affiliate-disclosure` responsibilities;
- useful no-JavaScript dated snapshot;
- clear Official and Evidence separation;
- no active Offer requirement.

Each scenario independently qualifies for publication only when it has:

- a concrete goal and clear suitable/not-suitable boundaries;
- at least 3 comparable candidates, with 3–5 preferred for each scenario’s initial publication;
- approximately 4–7 stable scenario-specific dimensions;
- current qualifying evidence for every candidate × dimension cell used as a required filter;
- realistic inputs that produce 1–3 formal matches and at least two evidence-supported candidate differences;
- maintainable freshness for dynamic claims;
- no excluded high-risk vertical.

### 10.2 MVP / P0b — Qualified commercial layer and minimal measurement

P0b begins only after the P0a preview passes the decision/evidence/shortlist/comparison acceptance flow.

- Add an Offer region only if at least one reviewed Affiliate/Referral destination, including a network or merchant submission, qualifies.
- If none qualifies, keep the real Official Link as the outbound destination without Offer, Deal, or Discount labeling.
- Treat free/paid plan, trial, and price information as evidence-backed product facts, not automatic Offers.
- Preserve Official/Evidence/Offer separation and affiliate-neutrality invariance, including later Affiliate URL substitution.
- Emit privacy-minimal anonymous product events with no dependency into decision logic.

Minimum event vocabulary:

- `decision_opened`;
- `filter_changed`;
- `zero_results_viewed`;
- `shortlist_changed`;
- `comparison_opened`;
- `evidence_opened`;
- `official_link_clicked`;
- `offer_link_clicked`.

Events must contain no personal data, free text, full URL, fingerprint, commission value, or shortlist IDs. Official and Offer clicks must remain separate event types. Event failure cannot block navigation or filtering. This draft sets the initial behavior baseline to the first complete 30 consecutive days after public launch; no behavioral optimization target may be set until that window is complete and observed.

### 10.3 P1 — Breadth and controlled operations

- scenario index/search and additional independently qualified published scenarios;
- Tool Library index and fixed scenario-bound Comparison routes;
- simple Utilities and expanded Guides/trust/correction/contact content;
- newsletter;
- reviewed Tool Owner submission/update/correction intake, including the free channel and any separately approved paid service boundary;
- additional explainable sort options;
- broader hands-on research and evidence coverage;
- local workflow maturation, CI, link checks, and expanded SEO metadata;
- deterministic content gates, evidence manifests, independent review, audit trail, and rollback drills.

### 10.4 P2 — Explicitly deferred

- accounts, permanent server-side shortlists, databases, or personalization;
- UGC, reviews, vendor profiles, vendor dashboards, or paid placement;
- LLM task interpretation, recommendations, generated workflows, or generated stacks;
- third-party tool connection, execution, or orchestration;
- Worker redirect/click-tracking service;
- D1, KV, R2, Queues, Durable Objects, or high-scale crawler infrastructure;
- programmatic SEO, localization, native apps, or extensions;
- hidden scores, universal rankings, or high-risk decision verticals;
- long-term Next.js clone maintenance or additional clone targets;
- automated content publication or schema-changing content operations without a separately approved product and safety design.

## 11. Success metrics

### 11.1 Release-quality metrics

| Metric | Baseline | MVP target | Evidence |
|---|---:|---:|---|
| Published scenarios independently passing the scenario/content/evidence gates | not established | 100% | per-scenario publication validation; one failure cannot block another qualifying scenario |
| Required-filter candidate × dimension cells with current qualifying evidence | not established | 100% | source coverage report |
| Identical normalized input producing identical IDs/order/explanations | not established | 100% of deterministic test fixtures | repeat/round-trip tests |
| Required `unknown` incorrectly included as formal match | not established | 0 | unit and end-to-end tests |
| Affiliate/Offer-only data change altering eligibility or default order | not established | 0 | invariance fixture comparing result bytes/order |
| Invalid, deleted, fifth, or cross-scenario shortlist entries retained | not established | 0 | normalization and browser tests |
| Zero-result states that silently weaken a condition | not established | 0 | scenario tests and browser evidence |
| `research_only` shown as a deal | not established | 0 | publication validation and UI test |
| Expired/rejected Offer with active commercial CTA | not established | 0 | publication validation and UI test |
| Missing qualifying Offer causing the Official Link to be absent or mislabeled Offer/Deal/Discount | not established | 0 | publication validation and route inspection |
| Free/paid plan fact represented as an Offer without a separately reviewed Affiliate/Referral destination | not established | 0 | content validation and UI test |
| Tool Owner submission or payment metadata causing publication or decision-output change | not established | 0 | webmaster-decision audit plus invariance fixture |
| Fact claims lacking visible state, source, or check date where required | not established | 0 | content validation and route inspection |
| Primary routes useful without JavaScript | no production baseline | 100% | browser run with JavaScript disabled |

### 11.2 User-behavior metrics

Instrument and monitor:

- scenario discovery → decision-workspace entry rate;
- percentage of decision sessions with at least one filter change;
- zero-result rate and subsequent deliberate relaxation rate;
- formal result → shortlist rate;
- valid shortlist → comparison-open rate;
- evidence and Methodology open rate;
- verification-checklist engagement;
- official-link and Offer-link clicks as separate events;
- percentage of commercial clicks preceded by scenario, filtering, comparison, or evidence engagement;
- Utility completion rate when Utilities enter P1.

The draft baseline is the first complete 30 consecutive days after public launch. During that window StackBriefs records only the stated privacy-minimal event vocabulary, keeps `official_link_clicked` and `offer_link_clicked` separate, and collects no personal data, free text, full URLs, fingerprints, commission values, or shortlist IDs. The sources do not provide trustworthy traffic baselines or behavioral target percentages, so no optimization target is set before the baseline completes; any later improvement target must follow the observed evidence and the project’s confirmed decision process. Affiliate clicks and revenue are outcome metrics and cannot replace decision-quality metrics.

### 11.3 Trust and content-health metrics

- percentage of required claims inside freshness windows;
- count and age of stale claims;
- time to remove current language after evidence expires;
- time to correct a verified user-reported error;
- percentage of `not_tested` records upgraded through real hands-on work;
- count of unresolved current source conflicts;
- number of commercial-neutrality violations: target zero.

## 12. Testable acceptance criteria

### AC-01 — Multi-scenario architecture

Given two fixtures with materially different dimension structures, when each is loaded, then its controls, evaluation, shortlist, comparison, and URL normalization use only that fixture’s scenario contract; no first-fixture labels, dimensions, branches, or candidates appear in the other fixture.

### AC-02 — Published-portfolio neutrality

Given zero, one, or multiple scenarios have independently passed publication gates, when the homepage and scenario discovery surfaces are viewed, then they communicate an open multi-scenario portfolio, expose only reviewed published scenarios, and do not privilege a fixture, vertical, or clone-derived scenario as StackBriefs’ strategic first scenario.

### AC-03 — Required-condition determinism

Given the same normalized scenario, evidence snapshot, and requirements, when evaluation runs repeatedly, then candidate IDs, order, match states, and explanation order are identical.

### AC-04 — Unknown handling

Given a required claim is missing, stale, scope-mismatched, weak-only, invalid-dated, future-dated, or conflicting, when the candidate is evaluated, then that requirement resolves to `unknown`, the candidate is excluded from formal results, and the reason is visible.

### AC-05 — Optional preferences

Given an optional preference is unmet or unknown, when candidates are evaluated, then no candidate is excluded or assigned a hidden score because of that preference.

### AC-06 — Affiliate neutrality

Given two datasets differ only in affiliate status, network, commission, Offer presence, Offer value, or Offer state, when decision results are produced, then formal membership, order, explanations, closest alternatives, and comparison conclusions are identical.

### AC-07 — Stable ordering

Given multiple formal matches, when default ordering is applied, then results sort by normalized Tool name and slug only.

### AC-08 — Zero-result recovery

Given no candidate matches every required condition, when the result state renders, then it names the unmet/conflicting conditions, offers one-at-a-time relaxation, keeps closest alternatives outside formal results, labels every `no_match` and `unknown`, and does not silently remove a requirement.

### AC-09 — Shortlist normalization

Given duplicate, invalid, deleted, fifth, and cross-scenario Tool IDs, when shortlist state is restored, then only the first four unique valid current-scenario IDs remain in first-valid order.

### AC-10 — Comparison scope

Given one shortlisted Tool, comparison remains disabled while the Tool’s evidence and checklist remain available. Given 2–4 valid Tools, comparison displays only current-scenario dimensions and no universal winner.

### AC-11 — Selected Tool after filter change

Given a selected Tool ceases to match after a requirement change, when results update, then the Tool remains visibly selected with a no-longer-matching warning until the user removes it.

### AC-12 — Evidence-state honesty

Given a displayed claim, when the user inspects it, then the UI identifies its information state and exposes the relevant check date and citation where required. `not_tested` never appears as hands-on experience.

### AC-13 — Freshness boundary

Given evidence at and immediately after the 7-, 30-, or 90-day boundary, when build-time and browser-time freshness are evaluated against the same UTC instant, then both produce the same current/stale result; after expiry, the browser can only downgrade the state.

### AC-14 — Conflicting evidence

Given current equal-authority observations with identical scope but different normalized values, when the claim resolves, then its state is `conflicting`, required matching becomes `unknown`, and no source is silently selected only because it is newer.

### AC-15 — Link separation

Given a Tool page with Official, Evidence, and qualified Offer destinations, when rendered, then all three use distinct labels/regions; evidence links are not commercial CTAs; disclosure is reachable; and the Offer has status, check date, terms/region where applicable.

### AC-16 — Invalid Offer behavior

Given `research_only`, `expired`, or `rejected`, when the Offer region renders, then `research_only` uses no deal language and `expired`/`rejected` expose no active commercial CTA; the neutral Official Link remains available.

### AC-17 — Static fallback

Given JavaScript is disabled or the enhancement script fails, when a primary route loads, then the user can still read the scenario, boundaries, candidate/evidence snapshot, check dates, verification guidance, Methodology, and Disclosure without a blank or false-current interface.

### AC-18 — Product independence

Given the production product surfaces, when reviewed, then they contain no copied third-party branding, assets, copy, ratings, reviews, saved counts, traffic, sponsors, ads, rankings, or directory-commercial logic.

### AC-19 — No universal winner

Given any scenario, comparison, Tool page, or Utility output, when no explicit condition-bound editorial assessment supports a statement, then the product never declares a Tool “best for you” or a universal winner.

### AC-20 — Publication gate

Given real public content, when required-filter evidence coverage, references, dates, authority, scope, conflicts, prohibited fields, Offer rules, and scenario contract are validated, then any failure blocks that scenario’s publication with an entry, rule, and corrective message without blocking another qualifying scenario.

### AC-21 — Tool Owner submission review

Given a free or paid Tool Owner submission containing facts, Official Links, plan information, Affiliate/Referral URLs, Offer terms, corrections, or evidence, when the submission is processed, then no field becomes public without a recorded webmaster acceptance decision; payment changes neither publication eligibility nor fit, conclusions, ordering, evidence state, or Offer approval.

### AC-22 — Offer cold start and substitution

Given no qualifying Affiliate Offer exists, when a Tool destination renders, then the real Official Link remains available and is not labeled Offer, Deal, or Discount. Given a qualifying Affiliate/Referral URL is added or substituted later, then candidate eligibility, formal results, explanations, closest alternatives, comparison conclusions, and ordering remain identical.

### AC-23 — Draft behavioral baseline

Given public launch has occurred, when behavior measurement begins, then the baseline covers the first complete 30 consecutive days; `official_link_clicked` and `offer_link_clicked` remain separate; no event contains personal data, free text, full URLs, fingerprints, commission values, or shortlist IDs; and no optimization target is set until the completed baseline has been observed.

## 13. Non-goals

MVP does not include:

- exhaustive AI-tool coverage or a fixed page-count target;
- a public commitment to any illustrative fixture;
- automatic scenario generation or publication;
- LLM recommendations, task parsing, workflow generation, or stack generation;
- accounts, permanent saved state, UGC, reviews, vendor tools, or paid placement;
- automatic rankings, ratings, popularity, traffic, or social proof;
- third-party tool execution;
- a required active affiliate deal;
- a runtime content agent or public write API;
- high-risk medical, financial-trading, gambling, adult, or companion-AI decision verticals;
- a second production frontend or long-lived dependency on any reference clone.

## 14. Risks, assumptions, and open product decisions

### 14.1 Residual risks

| Risk | Consequence | Required control |
|---|---|---|
| First fixture becomes the de facto vertical | Homepage and shared model stop being multi-scenario | heterogeneous fixture gate plus AC-01/AC-02 |
| Reference structure imports directory or commercial bias | Product becomes a ranked directory | explicit reject list plus affiliate-neutrality invariance |
| Evidence exists but is weak, stale, wrong-scope, or conflicting | False verified facts and false matches | source resolution, freshness, conflict, and publication gates |
| Static pages age after build | Users see outdated “current” claims | dated snapshots plus browser-only downgrade |
| URL state accepts invalid or cross-scenario data | Mixed decisions and misleading comparisons | canonical normalization and round-trip tests |
| Offer content overtakes free decision value | Trust and positioning degrade | P0a-before-P0b gate and strict link separation |
| Automation creates common-mode evidence errors | Incorrect content can publish at scale | independent re-fetch/review, deterministic gates, shadow calibration, circuit breakers |
| Behavioral targets are invented before traffic exists | Misleading product success claims | 30-day baseline before setting optimization targets |

### 14.2 Assumptions

1. One or more public-ready scenarios can be prepared with at least 3 comparable candidates and complete evidence for required filters; no scenario is entitled to priority before it passes its own gate.
2. Query parameters are sufficient for MVP sharing/persistence; this must be revisited only if measured URL limits create a user-visible problem.
3. Static Astro plus browser enhancement can meet the full decision loop without accounts, a database, or server functions.
4. Users value decision transparency and verification enough to engage beyond a simple directory click; behavioral instrumentation will test this.
5. A qualified Offer may not exist at launch; the product remains complete without one.
6. The first 30 days can establish useful behavioral baselines; no unsupported traffic or conversion targets are asserted now.

### 14.3 Open product decisions

The PRD intentionally leaves three product decisions open until supporting evidence exists:

- which real User Scenarios first satisfy the publication gate;
- whether P0b has a qualifying Offer or launches with Official Links only;
- which behavioral targets should be adopted after the first complete 30-day baseline.

These decisions do not change the shared P0 domain contract.
