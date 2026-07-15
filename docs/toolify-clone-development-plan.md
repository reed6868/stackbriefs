# StackBriefs Toolify Clone Development Plan

This document is the implementation source of truth. Product behavior and acceptance semantics belong to the [PRD](PRD.md). Toolify research, visual implementation rules, dependency policy, delivery order, and verification are consolidated here. External orchestration is out of scope.

- Date: 2026-07-14
- Status: Implementation plan; repository scaffold exists, application implementation has not started
- Scope: StackBriefs public Web frontend, Toolify-based UI migration, domain logic, static content delivery, implementation sequence, and release verification
- Production repository: `/home/ja/stackbriefs`
- Visual reference repository: `/home/ja/ai-website-cloner-template`

## Goal

Build StackBriefs as a static, scenario-first decision-support website that helps users narrow, compare, and verify AI-tool choices through deterministic requirements and claim-level evidence, while reusing suitable geometry from the local Toolify reference assets and adopting open-source UI only after verification.

## Architecture summary

The planned frontend uses Astro static output, strict TypeScript, Content Collections, Tailwind CSS, and small browser-side enhancements. Toolify contributes page geometry and responsive behavior only. Pure TypeScript modules own evidence resolution, matching, explanations, shortlist normalization, comparison projection, freshness, publication validation, and URL state.

## Current technical baseline

The repository currently declares:

- Astro `7.0.7`
- `@astrojs/mdx` `7.0.2`
- Tailwind CSS `4.3.2`
- TypeScript `5.9.3`
- Vitest `4.1.10`
- strictest Astro TypeScript configuration

The current `package.json` declares these scripts:

```text
npm run dev
npm run check
npm run test
npm run test:schema
npm run build
npm run preview
```

The repository does not currently contain `src/`, `tests/`, an Astro config, application routes, or the files targeted by `test:schema`. The package files therefore prove dependency and script scaffolding only; they do not prove that the declared checks can pass or that any application behavior exists.

Repository verification on 2026-07-14:

- `npm run check` exits successfully but warns that `src/pages` is missing;
- `npm run build` exits successfully and builds `0` pages;
- `npm run test` exits with code `1` because no test files exist;
- `npm run test:schema` has no target file until `tests/content-schema.test.ts` is created.

---

## 1. Governing product contract

The [PRD](PRD.md) is authoritative for the product center, scenario portfolio, deterministic behavior, evidence states, commercial neutrality, scope, and acceptance criteria. This scheme implements that contract and does not redefine it.

Implementation must preserve three boundary invariants:

1. all decision state is scoped to a Scenario;
2. runtime match state is derived from content and evidence rather than stored;
3. Offer data has no dependency path into eligibility, ordering, explanations, alternatives, or comparison conclusions.

---

## 2. Chosen implementation approach

### 2.1 Reuse-first Astro migration

The selected approach is:

```text
Toolify visual clone
  → observe reusable geometry and responsive behavior
  → reimplement once in Astro
  → add native accessible interactions
  → conditionally adopt mature Astro components
  → implement only StackBriefs-specific decision/evidence semantics
```

This approach is selected over:

- modifying the Next.js Toolify clone into production;
- creating a new UI from a blank Astro project;
- adopting a complete third-party design system;
- cloning G2, Product Hunt, or TAAFT as additional applications.

### 2.2 Production boundaries

```text
/home/ja/ai-website-cloner-template
  Visual reference only
  No runtime dependency
  No shared package
  No production deployment

/home/ja/stackbriefs
  Sole production source
  Domain logic
  Content and evidence
  Astro pages and components
  Tests and release configuration
```

Forbidden:

- cross-repository imports;
- submodules connecting clone and production;
- synchronized CSS copies;
- long-term Next.js/Astro dual stack;
- React/Vue client runtime in the public P0 application;
- direct copying of Toolify branding, copy, content, images, rankings, ads, or monetization logic.

---

## 3. Route and information architecture

### 3.1 Canonical P0 routes

```text
/
/decision/[scenario]
/tool/[slug]
/methodology
/affiliate-disclosure
```

`/decision` may provide a scenario selector, but a selected scenario uses `/decision/[scenario]`.

### 3.2 Route correction rationale

A static deployment cannot render different scenario-specific HTML from:

```text
/decision?scenario=<slug>
```

Cloudflare Pages serves the same static `/decision/index.html` regardless of query parameters. Requiring JavaScript to select a scenario would violate the useful no-JavaScript snapshot contract and weaken canonical SEO.

The canonical state contract is therefore:

```text
/decision/<scenario-slug>
  ?r=<dimension>:<value>
  &r=<dimension>:<value>
  &shortlist=<slug>,<slug>
```

The path selects statically rendered scenario content. Query parameters represent temporary user state only.

### 3.3 Route responsibilities

The PRD section “Page responsibilities” owns the content and behavior required on Home, Decision, Tool, Methodology, and Affiliate Disclosure pages. This scheme adds only implementation constraints:

- `/decision/[scenario]` must be statically generated from published Scenario content;
- temporary requirements and shortlist values remain query state and are removed from canonical URLs;
- Tool pages preserve a return link to the active Scenario when that context is present;
- trust pages render as static MDX through the shared reading layout.

---

## 4. Domain and content architecture

### 4.1 Stored content shape

The PRD section “Product boundaries and domain relationships” owns entity meaning and field semantics. The frontend implements that contract through Astro Content Collections or validated data modules for `Scenario`, `Tool`, `ScenarioCandidate`, `SourceObservation`, and optional `Offer` records.

Implementation requirements:

- keep Scenario-local dimensions inside the Scenario contract rather than creating a mandatory global dimension set;
- keep Tool identity separate from scenario-specific Candidate conclusions;
- validate all references at build time;
- keep intake/review records outside public content collections;
- keep Offer records outside the DecisionProjection and decision-engine dependency graph;
- generate schema types from one contract rather than maintaining parallel UI types.

### 4.2 Derived states

Never store runtime match results in content.

```text
SourceObservation[]
  → ResolvedClaim
  → CandidateEvaluation
  → DecisionResults
  → ComparisonProjection
```

Candidate outcomes:

```text
match
no_match
unknown
```

Evidence states:

```text
verified_fact
editorial_assessment
not_verified
needs_recheck
not_applicable
conflicting
```

### 4.3 Freshness implementation

The PRD owns freshness windows and invalid-evidence behavior. Implement them once as typed Domain constants used by build-time resolution, browser downgrade logic, tests, and publication validation. Static HTML displays `checkedAt` and `validThrough`; browser code may downgrade after expiry but may never upgrade evidence.

### 4.4 Source resolution implementation

Implement the PRD’s authority, scope, freshness, conflict, and confidence rules in `resolveClaim`. UI code receives a `ResolvedClaim` and cannot reinterpret raw observations independently.

---

## 5. Pure domain module design

Representative modules:

```text
src/domain/model.ts
src/domain/evidence.ts
src/domain/decision.ts
src/domain/url-state.ts
src/domain/publication.ts
```

### 5.1 Module interfaces

```ts
resolveClaim(claimKey, observations, asOf): ResolvedClaim

evaluateCandidate(
  scenario,
  candidate,
  requirements,
  resolvedClaims,
): CandidateEvaluation

filterCandidates(
  scenario,
  candidates,
  requirements,
  resolvedClaims,
  toolNames,
): DecisionResults

normalizeShortlist(requestedSlugs, allowedSlugs): string[]

buildComparison(
  scenario,
  selectedCandidates,
  resolvedClaims,
): ComparisonProjection

parseDecisionUrl(url, scenario): NormalizedDecisionState

serializeDecisionUrl(state, scenario): string

validatePublication(dataset, asOf): PublicationIssue[]
```

### 5.2 Dependency rules

Domain modules must not import:

- Astro;
- DOM APIs;
- analytics;
- UI components;
- Offer presentation;
- Toolify clone data;
- browser clocks created internally.

All time-dependent functions receive an explicit `asOf` value.

---

## 6. Build-time and browser data flow

```text
Content Collections
  → Astro-aware content assembler
  → publication validator
  → resolved static evidence snapshot
  → scenario-specific DecisionProjection
  → static Astro route
  → optional browser controller
```

The DecisionProjection contains only:

- current Scenario;
- current dimensions;
- candidate summaries;
- relevant claim keys;
- normalized observations needed by those claims;
- minimal Tool display fields.

It excludes:

- full Tool article bodies;
- unrelated Source Ledger records;
- unrelated scenarios;
- Offer data;
- private intake/review records.

---

## 7. Toolify visual reuse plan

### 7.1 Source references

#### Home

- `/home/ja/ai-website-cloner-template/src/app/page.tsx`
- `/home/ja/ai-website-cloner-template/src/app/globals.css`

Reuse:

- header geometry;
- content container;
- Hero composition;
- search/entry placement;
- card/list rhythm;
- responsive layout.

Remove:

- dense directory feed;
- Most Saved/Most Used;
- sponsors;
- Featured paid hierarchy;
- Prompt Gallery;
- Toolify copy and assets.

#### Category/List

- `/home/ja/ai-website-cloner-template/src/app/category/ai-video-generator/category-page.tsx`
- `/home/ja/ai-website-cloner-template/src/app/category/ai-video-generator/category.css`

Reuse:

- filter placement;
- list/card geometry;
- disclosure layout;
- pagination geometry;
- educational body rhythm;
- responsive collapse.

Replace:

- Best/Most Saved/Recent logic;
- ratings, reviews, saved counts;
- hardcoded category content;
- fake filter behavior.

#### Tool Detail

- `/home/ja/ai-website-cloner-template/src/app/tool/heygen/heygen-page.tsx`
- `/home/ja/ai-website-cloner-template/src/app/tool/heygen/heygen.css`

Reuse:

- Breadcrumb;
- Hero composition;
- Sticky Section Navigation;
- long-form section rhythm;
- fact/plan card geometry;
- related-content layout;
- desktop/mobile composition.

Remove:

- Sponsors;
- Reviews;
- Traffic Analytics;
- Social Listening;
- Discord and locked upsells;
- Toolify Badge Embed;
- generic Alternatives;
- screenshot-height hacks.

### 7.2 Shared Astro modules

Create substantive shared modules rather than route-specific wrappers:

```text
SiteHeader
SiteFooter
PageContainer
PageSection
ScenarioHero
Breadcrumbs
CandidateCard
MetadataRow
TagList
RequirementPanel
DisclosureGroup
SectionNav
FactCard
ComparisonTable
SiteImage
TrustLinkGroup
```

Do not create separate HomeHeader, DecisionHeader, and ToolHeader modules.

---

## 8. Dependency and reuse policy

The production codebase currently has no UI-component, icon, search, client-state, or browser-test dependency beyond the packages declared in `package.json`.

Use this selection order:

1. confirm the capability is required by the current phase;
2. reuse geometry observed in the local Toolify clone without cross-repository imports;
3. prefer native HTML, CSS, and browser APIs;
4. evaluate a small Astro-compatible dependency only when native behavior is insufficient;
5. implement the smallest local component when no verified dependency fits.

Native defaults include `details`/`summary`, `dialog`, `fieldset`, native inputs, semantic tables, `time`, `aria-live`, `URLSearchParams`, History API, IntersectionObserver, Clipboard API, CSS Grid, and Flexbox.

Conditional candidates:

- `accessible-astro-components` may be evaluated for focused accessibility primitives, but only after an Astro 7, global-CSS, keyboard, focus, license, and bundle spike;
- official `@lucide/astro` may be adopted after current package and license review, using individual imports;
- Pagefind remains deferred until published content volume proves that full-site search is needed.

Do not introduce React/Vue UI runtimes, a second design system, a client state library, a search server, a database for P0 search, or an entire component framework for one control. Every adopted dependency must record its version, license, source, reviewed modules, transitive dependencies, and local modifications.

## 9. Interaction requirements

The PRD’s deterministic behavior and AC-03 through AC-11 own the interaction semantics. The browser controller must consume Domain outputs rather than reimplement matching, exclusion, recovery, Shortlist, or comparison rules.

Implementation obligations:

- generate controls from the active Scenario contract and pass only normalized values to Domain functions;
- render formal results, exclusions, recovery state, Shortlist, and comparison from typed projections;
- keep DOM state, URL state, and the visible result projection synchronized;
- use semantic form controls, status announcements, and a semantic comparison table;
- keep no-JavaScript content useful and never hide required evidence or limitations behind the controller.

### 9.1 URL and history

```text
/decision/<scenario>?r=<dimension>:<value>&r=...&shortlist=a,b
```

- Native `getAll("r")` parsing.
- First valid duplicate requirement wins.
- Canonical ordering follows Scenario dimensions.
- Browser back/forward restores normalized state.
- Parse → serialize → parse remains stable.
- No localStorage in P0.

---

## 10. Visual and interface implementation baseline

This section contains the visual rules required to implement the production frontend. It is an implementation constraint, not a separate product strategy.

### 10.1 Interface character and identity

StackBriefs should read as a precise, calm intelligence workspace rather than an AI directory, editorial magazine, marketing landing page, or decorative dashboard.

- Use the `StackBriefs` wordmark as the primary identity.
- Use a simple one-color Signal Stack mark for favicon and constrained navigation.
- Current favicon assets are `/home/ja/stackbriefs/s-16px.svg`, `/home/ja/stackbriefs/s-32px.svg`, and `/home/ja/stackbriefs/s.ico`; the final wordmark and production mark remain implementation deliverables.
- Use Geist for brand, headings, body, and UI; use Geist Mono for sources, dates, versions, and compact evidence metadata.
- Use product logos and screenshots as evidence, not decorative hero imagery.

### 10.2 Core tokens

| Token | Value | Use |
|---|---|---|
| `canvas` | `#F7F8FC` | Page background |
| `surface` | `#FFFFFF` | Reading and interactive surfaces |
| `surface-subtle` | `#F0F2F7` | Quiet grouping |
| `text-strong` | `#11131A` | Headings and essential labels |
| `text-default` | `#353A46` | Body and control text |
| `text-muted` | `#687080` | Supporting metadata |
| `border-default` | `#DCE1EA` | Dividers and surface boundaries |
| `brand-primary` | `#315CFF` | Links, primary actions, selection, focus |
| `brand-soft` | `#E9EEFF` | Quiet selection |
| `semantic-positive` | `#16745A` | Verified or matching state |
| `semantic-caution` | `#8A6200` | Unknown, stale, or incomplete state |
| `semantic-negative` | `#B83A3A` | Failed or conflicting state |

Cobalt is the only brand accent. Semantic colors remain local to text, icons, and narrow boundaries; whole cards and sections stay neutral. Never communicate state through color alone.

Layout tokens:

- spacing scale: `4, 8, 12, 16, 24, 32, 48, 64px`;
- page gutters: `20px` mobile, `24px` tablet, `32px` desktop;
- maximum page container: `1200px`;
- reading measure: `64–72ch`;
- control radius: `6px`; grouped surfaces: `8px` maximum;
- frequent pointer targets: at least `44 × 44px`;
- focus: `3px solid brand-primary` with `2px` offset;
- interaction transitions: `120–180ms` for color, border, or background only.

### 10.3 Page composition

Home:

- compact header;
- decision briefing with a direct Scenario entry;
- published Scenario rows rather than a category card wall;
- one compact process line;
- evidence, Methodology, and neutrality links;
- simple ruled footer.

Decision Workspace:

- compact Scenario header with boundary and review metadata;
- `288px` criteria rail and flexible result field at desktop widths;
- formal candidates as neutral bordered surfaces;
- excluded candidates as compact rows;
- zero-result recovery in one neutral bordered region;
- Shortlist dock only after selection;
- semantic comparison table with equal columns and no winner treatment.

Tool Detail:

- neutral Tool identity and summary;
- scenario context and return path;
- reading column plus compact metadata rail;
- claim-level evidence as divider rows;
- Official, Evidence, and Offer areas remain structurally distinct;
- no global suitability or winner label.

### 10.4 Responsive and state behavior

Structural breakpoints are base, `768px`, `960px`, and `1200px`. At tablet widths, criteria and metadata rails move into the main flow. At mobile widths, content becomes single-column and comparison scrolls only inside its own bounded container.

Every state uses a visible label plus icon, border, shape, or position:

- verified/match: positive local signal on a neutral surface;
- no-match/conflict: negative local signal on a neutral surface;
- unknown/stale: caution label with interrupted or dashed geometry;
- selected: cobalt border/control state and `brand-soft`, visually separate from match state;
- disabled: readable label, neutral disabled surface, and native unavailable interaction.

### 10.5 Explicit reject list

Do not ship:

- Toolify branding, copy, assets, rankings, ratings, reviews, traffic, saved counts, ads, sponsors, or commercial ordering;
- dense tool walls, oversized marketing heroes, featured placement, or dominant commercial CTAs;
- warm cream editorial styling, serif-led hierarchy, purple AI gradients, glow, glass, blur, or cyber-dark decoration;
- nested card walls, metric tiles, winner columns, trophies, scores, or decorative dashboards;
- generic AI robots, sparks, network-node imagery, or animated intelligence metaphors;
- fixed screenshot-height hacks, route-specific CSS duplication, or layout animation.

## 11. Accessibility implementation

Release verification must cover:

- WCAG 2.2 AA contrast;
- correct landmarks and heading hierarchy;
- Skip Link;
- keyboard-complete filters, shortlist, comparison, disclosure, and dialogs;
- visible unclipped focus at 200% zoom;
- forced-colors and `prefers-reduced-motion` support;
- persistent underlines for prose links;
- text plus non-color state cues;
- native disabled semantics and visible reasons;
- `aria-live` result summaries;
- comparison captions and row/column headers;
- critical evidence and limitations retained in mobile reading order;
- automated axe checks plus manual keyboard review.

Target viewports:

- `360 × 800`: complete mobile flow;
- `768 × 1024`: route, overflow, interaction, and axe smoke;
- `1440 × 1000`: complete desktop flow.

## 12. Performance budgets

Release targets:

- LCP ≤ 2.5s at p75 mobile
- INP ≤ 200ms
- CLS ≤ 0.1
- total first-load JavaScript ≤ 50KB gzip on primary routes
- Decision Workspace JavaScript ≤ 35KB gzip
- no client-framework bundle
- no runtime third-party scripts
- no unoptimized remote images
- preload only critical font files
- no more than two active weights per font family in P0
- useful static HTML before JavaScript
- no skeleton UI for statically available content

A budget failure blocks release unless the architecture plan is explicitly revised.

---

## 13. SEO architecture

- One static canonical page per Scenario: `/decision/[scenario]`.
- One static canonical Tool page: `/tool/[slug]`.
- Temporary `r` and `shortlist` state does not create a separate indexed page.
- Canonical strips temporary state parameters.
- Unique title, description, Open Graph metadata, and Breadcrumb data per Scenario and Tool.
- Structured data derives only from approved facts.
- Sitemap includes published Scenarios, Tools, and trust pages.
- Invalid or publication-blocked content is excluded at build time.
- No “best tools” claims without a deterministic scenario contract.
- No programmatic SEO in P0.
- Fixed indexable comparison pages remain P1 and require stable scenario-bound intent.

---

## 14. Testing strategy

### 14.1 Unit and publication tests

Vitest covers:

- exact freshness boundaries;
- invalid, future, stale, and missing dates;
- weak evidence rejection;
- same-scope conflicts;
- required unknown exclusion;
- optional preference neutrality;
- stable result ordering;
- zero-result alternative ordering;
- shortlist normalization;
- comparison scope;
- URL round trips;
- DecisionProjection omission rules;
- static/browser freshness parity;
- Affiliate-neutrality invariance;
- actionable publication errors.

### 14.2 Browser tests

Playwright runs against `astro preview`, not the dev server.

Complete flows:

```text
Home
→ Scenario
→ set requirements
→ zero result
→ relax one requirement
→ shortlist
→ compare
→ inspect evidence
→ use Official path
```

Additional cases:

- direct Tool page;
- Methodology and Disclosure;
- invalid URL state;
- back/forward restoration;
- fifth shortlist rejection;
- selected Tool stops matching;
- no-JavaScript dated snapshot;
- no uncaught console errors;
- no unintended overflow.

### 14.3 Release command

A single `npm run release:check` must chain:

```text
Astro/type check
→ content/publication validation
→ Vitest
→ static build
→ Playwright
→ axe
```

Cloudflare promotion records the exact commit SHA and successful release-check result.

---

## 15. Delivery phases and priorities

These phases define implementation grouping and dependency order. Work must not bypass unresolved blocker dependencies.

### Priority 0: Blockers and contracts

- repository security verification;
- canonical route contract from this plan;
- Scenario/Tool/Candidate/Source domain contract implementation;
- source authority, scope, normalization, and freshness matrix;
- scenario publication/readiness gate;
- base visual tokens and identity assets.

No implementation task may bypass unresolved Priority 0 work.

### Priority 1: Core deterministic product

- Astro application foundation;
- Content Collection schemas;
- publication validator;
- evidence resolution;
- deterministic decision engine;
- URL normalization;
- one evidence-qualified integration Scenario;
- base layout and shared tokens;
- static Decision and Tool routes;
- no-JavaScript snapshot.

### Priority 2: Complete user loop

- requirement controls;
- explanations;
- zero-result recovery;
- Shortlist;
- comparison;
- browser history;
- browser-time freshness downgrade;
- trust-link separation;
- Methodology and Disclosure;
- homepage scenario discovery.

### Priority 3: Quality and release

- responsive refinement;
- keyboard and accessibility review;
- performance budgets;
- SEO metadata and sitemap;
- Vitest branch coverage;
- Playwright and axe;
- release command;
- Cloudflare preview and production acceptance.

---

## 16. Release gates and definition of done

Production promotion is blocked by any failed PRD acceptance criterion or any of these implementation failures:

- unresolved Domain, route, content, or source-resolution contract;
- failed type, publication, unit, build, browser, accessibility, or release check;
- false verified fact, required unknown admitted as a match, or commercial data affecting results;
- broken cross-scenario Shortlist state or silent requirement weakening;
- stale verified content presented as current;
- invalid Official/Evidence/Offer separation;
- inaccessible keyboard flow, unintended viewport overflow, or performance-budget failure;
- copied Toolify branding/commercial content or an unreviewed dependency.

The frontend is done only when:

- production is one static Astro codebase with no clone runtime dependency;
- reviewed Scenarios generate canonical Decision pages;
- Toolify geometry is reimplemented through shared StackBriefs components and tokens;
- the complete filter, explanation, zero-result, Shortlist, comparison, evidence, and outbound-link loop passes;
- pages remain useful without JavaScript;
- mobile, tablet, desktop, keyboard, reduced-motion, forced-colors, SEO, and performance checks pass;
- `npm run release:check` succeeds against the exact commit promoted to Cloudflare.
