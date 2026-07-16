# StackBriefs Frontend Development Plan — Toolify UI Reference

**Date:** 2026-07-16
**Status:** Approved implementation plan; product implementation has not started
**Production repository:** `/home/ja/stackbriefs`
**Visual reference repository:** `/home/ja/ai-website-cloner-template`

## Document responsibility

This document is the implementation source of truth for frontend architecture, information architecture, visual rules, page composition, component boundaries, interactions, responsive behavior, content storage, accessibility, security, testing, and release sequencing. Product meaning and acceptance semantics belong to [PRD.md](PRD.md). Paperclip, worktrees, reviewers, watchdogs, and task prompts belong to task artifacts, not these product documents.

## 1. Current baseline and immediate cleanup

The repository is a minimal static Astro scaffold, not a partially implemented product. It currently contains one placeholder page, one layout, one stylesheet, and one smoke test.

The declared stack is Astro `7.0.7` with static output, strict TypeScript `5.9.3`, Tailwind CSS `4.3.2`, MDX `7.0.2`, Vitest `4.1.10`, and Cloudflare Pages delivery.

Existing commands:

```text
npm ci
npm run check
npm test
npm run test:schema
npm run build
```

Before or inside the first product slice:

1. standardize local, CI, and Cloudflare builds on a supported Node `24.x` release without governing an exact patch in prose;
2. separate browser application types from Node/Vitest test types so `src` cannot accidentally rely on `process`, `Buffer`, or Vitest globals;
3. implement `tests/content-schema.test.ts` before treating `npm run test:schema` as a required passing gate;
4. replace the current warm-cream placeholder stylesheet with the visual system in this plan;
5. configure the production `site` and one trailing-slash policy with the P0 route skeleton; configure Cloudflare Preview `noindex` before the first Preview deployment;
6. reserve `release` as the only Cloudflare Pages Production branch so ordinary `main` merges remain Preview-only.

Do not revert unrelated uncommitted repository changes while applying this plan.

## 2. Architecture and reuse policy

### Production architecture

Use one static Astro application with:

- Astro pages and layouts for route HTML;
- Tailwind and shared CSS tokens for styling;
- one schema-backed Astro Content Collections source for public structured content;
- pure TypeScript modules for evidence, decision, shortlist, comparison, URL normalization, and publication validation;
- small browser controllers using native DOM and History APIs;
- Cloudflare Pages for preview, production, HTTPS, redirects, and static headers.

P0 does not require React, Vue, a state library, a database, server rendering, Pages Functions, D1, KV, R2, accounts, local persistence, a CMS, Pagefind, or runtime third-party scripts.

### Toolify reuse boundary

The local Toolify clone is a visual reference, not a codebase to merge or deploy.

Reference Header/container geometry from `src/app/page.tsx`, filter/list proportions from `src/app/category/ai-video-generator/`, and Breadcrumb/long-form composition from `src/app/tool/heygen/`. Reimplement only container widths, column proportions, spacing rhythm, responsive collapse, and disclosure placement.

Do not copy branding, copy, images, Tool data, rankings, ratings, reviews, saved counts, traffic, ads, sponsors, commercial ordering, screenshot-height hacks, or runtime code. Do not create cross-repository imports, synchronized CSS, submodules, or a long-lived Next.js/Astro dual stack.

G2, Product Hunt, and TAAFT may inform one bounded interaction pattern, but they do not contribute code, assets, page systems, or ranking logic. Every route uses one StackBriefs visual grammar.

### Dependency policy

Use native HTML and browser behavior when it already provides correct semantics. Adopt a mature open-source package when it removes meaningful implementation or accessibility work.

Conditional additions are Playwright plus `@axe-core/playwright` with the first browser interaction slice, `@astrojs/sitemap` during release work, and one Lucide-compatible Astro icon package when a reusable icon set is first needed.

Do not add a full component library, client framework, animation library, form framework, or state manager for P0. Record the need, maintenance status, bundle impact, and license in the PR that adds any dependency.

## 3. Routes and navigation

### Route contract

| Route | Rendering | Indexing and behavior |
| --- | --- | --- |
| `/` | static Home | canonical and indexable |
| `/decision/[scenario]` | generated from published Scenario content | canonical strips `r`, `p`, and `shortlist` query state |
| `/tool/[slug]` | generated only for exposed Tools | canonical and indexable when related to a published Scenario |
| `/methodology` | trusted repository MDX in reading layout | canonical and indexable |
| `/affiliate-disclosure` | trusted repository MDX in reading layout | canonical and indexable |
| `/decision` | Cloudflare static redirect | permanent redirect to `/#scenarios` |
| `/404.html` | static status layout | `noindex`; linked recovery actions |

Lifecycle behavior follows the PRD. Never-published invalid content resolves to 404. Previously published blocked or retired content may generate only the approved `noindex` status page or redirect. Status routes expose no active filters, current claims, structured data, or sitemap entry.

### Header

Desktop Header contains the StackBriefs Logo/wordmark, `Browse scenarios`, `Methodology`, and `Affiliate disclosure`.

Do not add a Tool Library, rankings, login, search box, submit button, or dominant commercial CTA in P0.

Mobile uses a labeled menu button with `aria-expanded` and `aria-controls`, the same destinations, visible focus, Escape/outside-close behavior, focus return, and scroll locking only while open. Current routes use `aria-current="page"`; the Scenario anchor uses an active visual state only while that section is the current destination.

### Footer and path context

Footer repeats the three navigation destinations, a short product statement, copyright, and the Affiliate disclosure link. Prose links remain underlined.

Breadcrumbs:

- Decision: `Home / Scenario name`;
- Tool with Scenario context: `Home / Scenario name / Tool name`;
- direct Tool entry: `Home / Tool name`.

Tool pages preserve a return path to the active published Scenario when context exists. Derive it from validated Scenario and URL state; never navigate to an arbitrary cross-origin `return` value.

## 4. Visual system

### Direction

Use a precise, calm decision workspace: light neutral surfaces, restrained cobalt identity, clear typography, thin dividers, and limited motion. P0 is light-only and has no theme toggle. Avoid a dense directory wall, editorial cream, purple AI gradients, glow, glass, cyber-dark styling, dashboards, trophy/winner treatments, and decorative AI imagery.

### Minimum color system

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#F7F8FA` | page background |
| `surface` | `#FFFFFF` | primary panels |
| `text` | `#171A21` | headings and body text |
| `muted` | `#4F5868` | secondary text; not below normal-text AA contrast |
| `border` | `#D8DEE8` | dividers and neutral controls |
| `brand` | `#2346C9` | primary actions, selected state, links where appropriate |
| `brand-soft` | `#EEF2FF` | restrained selected background |
| `success` | `#1B6B45` | verified or matched state, distinguished by label and icon |
| `warning` | `#8A4B08` | stale or needs-recheck state |
| `danger` | `#B42318` | conflicting, invalid, or destructive state |

Use one brand color plus these three state colors. Selected and interactive states use `brand`; `unknown` and `not_verified` use `muted` with a question label or dashed treatment; ordinary `no_match` uses neutral text/border with an X label rather than danger red. Verified and matched may share `success` only when their labels and icons remain distinct. Use semantic colors locally, never as full-card decoration or as the only signal. Generate any light state tint from the existing color with `color-mix()` rather than adding palette tokens. Create hierarchy through typography, spacing, border weight, and layout—not additional colors. Verify actual foreground/background pairs with an automated contrast check.

### Typography and spacing

- Primary typeface: self-hosted Geist with `ui-sans-serif`, `system-ui`, and `sans-serif` fallbacks.
- Geist Mono is limited to dates, IDs, or compact metadata; it is not a body face.
- Body: `16px`, line-height `1.6`; compact metadata: `14px`, line-height `1.45`.
- Headings use a restrained scale around `20/24/32/44px`; use `clamp()` only for the Home H1.
- Reading measure is approximately `68–74ch`; decision layouts use a maximum container near `1200px`.
- Use a 4px spacing base with page gutters of `16px`, `24px`, and `32px` as width permits.
- Radius: approximately `8px` for controls and `12px` for panels. Avoid nested rounded-card walls.
- Shadows are limited to the mobile menu, dialog, and Shortlist dock. Structure uses borders and spacing first.
- Use one outline icon family at `16`, `20`, or `24px`; identity assets remain local SVG.
- Interaction transitions are `120–180ms`, affect color/opacity/transform only, and disable under `prefers-reduced-motion`.

Layer order remains small and documented: normal content, sticky Header/filter, Shortlist dock, then modal overlay. No arbitrary high z-index values.

## 5. Page composition

### Home

Order: shared Header; compact Hero; published Scenario rows under `#scenarios`; a three-step narrow/compare/verify explanation; trust links; shared Footer.

Scenario rows show goal, boundary summary, candidate count, dimension count, and review/check context. They do not show ratings, popularity, deals, affiliate value, or featured placement. P0 sorts by normalized Scenario title and then slug; file order, publication time, traffic, and commercial data are prohibited inputs.

### Decision Workspace

At `960px` and above, use a compact Scenario header, an approximately `288px` criteria rail, and a flexible results column containing the summary, candidates, exclusions, and zero-result recovery. Show Shortlist only after selection and render comparison below the result area when opened.

Below `960px`, criteria enter the main flow. On small screens, a `Filters` button opens an accessible native-dialog-based sheet. Changes are staged until `Apply`; `Cancel` restores the prior applied state. `Clear all` is explicit. After Apply, focus moves to the result summary and the page scrolls only when needed.

Desktop filter changes update immediately without moving focus. Result counts use a polite `aria-live` region. Required/optional mode is visible in every active control.

Candidate surfaces show Tool identity, match reasons, key limitation, evidence-state summary, shortlist control, and Tool details link. Excluded candidates use compact rows and preserve the difference between `no_match` and `unknown`.

Zero-result recovery identifies blocking requirements and offers explicit relaxation; it never changes state automatically.

The Shortlist dock appears after one selection, shows count/removal controls, disables Compare below two with a visible reason, caps the list at four, respects `env(safe-area-inset-bottom)`, and never covers focused or final content.

Comparison uses a real table with caption, row headers, and equal Tool columns. On narrow screens, horizontal scrolling is contained inside the table region, Tool headers remain identifiable, and the document itself does not scroll sideways. Unknowns and limitations remain in the mobile reading order. No column is highlighted as a winner.

### Tool Detail

Order: Breadcrumb/validated Scenario return; Tool identity, summary, Logo fallback, and Official Link; published Scenario contexts and limitations; claim/evidence rows; hands-on status and checklist; optional separated Offer; related Scenarios and Footer.

Direct Tool entry never invents global fit or a universal winner. Long evidence uses disclosure components without hiding state or limitation summaries.

### Trust and status pages

Methodology and Affiliate Disclosure use the same reading layout, table styles, heading anchors, and Footer. A visible table of contents is optional only when the final content length warrants it.

404, blocked, and retired pages use one `StatusPage` layout with a clear status, plain explanation, Home/Scenario recovery, and no misleading decision UI.

## 6. Component boundaries

Expected component groups:

| Group | Components |
| --- | --- |
| Shell | `SiteHeader`, `MobileNav`, `SiteFooter`, `Breadcrumbs`, `StatusPage` |
| Primitives | `Button`, `TextLink`, `IconButton`, `Field`, `Badge`, `Disclosure`, `Dialog` |
| Discovery | `Hero`, `ScenarioList`, `ScenarioRow`, `TrustStrip` |
| Decision | `ScenarioHeader`, `CriteriaPanel`, `FilterControl`, `ResultSummary`, `CandidateCard`, `ExcludedCandidateList`, `ZeroResults`, `EvidenceBadge`, `ShortlistDock`, `ComparisonTable` |
| Tool | `ToolHeader`, `ScenarioContext`, `ClaimRow`, `LinkGroup`, `OfferPanel` |

Critical component state contract:

| Component | Required input | States and events | Responsive/accessibility contract |
| --- | --- | --- | --- |
| `FilterControl` | Dimension contract, applied/draft value, required/optional mode | inactive, required, optional, disabled, invalid; change value/mode and clear | Native labeled control inside `fieldset`; mobile edits draft state, desktop edits applied state; error and disabled reason remain visible. |
| `CandidateCard` | Tool summary, CandidateEvaluation, limitation, evidence summary, shortlist state | match, `no_match`, `unknown`, selected, shortlisted-but-no-longer-matching; add/remove and open Tool | Heading and actions stay in DOM order; state uses label plus icon/border; no clickable-card wrapper around nested controls. |
| `ShortlistDock` | Normalized 0–4 items and comparison eligibility | hidden at 0, single item, compare-ready 2–4, full at 4; remove and open comparison | Announces count changes politely, exposes disabled reason, preserves focus after removal, and respects mobile safe area without covering content. |
| `ComparisonTable` | Scenario-bound projection for 2–4 Tools | collapsed, open, unknown cells, no-longer-matching Tool, contained overflow | Real table with caption and row/column headers; equal columns, no winner state, and horizontal scrolling only inside its region. |
| `Dialog` / `MobileNav` | Type, open state, trigger reference, accessible label | closed/open; Escape, outside close, Apply/Cancel where applicable | Filter uses native `dialog`; menu exposes `aria-expanded`; opening moves focus inside, closing returns it to the trigger, and background scroll is locked only while open. |

Each component contract defines purpose, required data, states, mobile behavior, keyboard behavior, and visible error/empty behavior. Do not build a Storybook or generic design-system package for P0.

Create an abstraction when one substantive behavior needs isolation or the pattern is proven on two routes. Keep one-off page composition local. UI components render Domain outputs; they do not reimplement evidence, eligibility, ordering, URL, or Affiliate-neutrality rules.

Use native elements first: links for navigation, buttons for actions, fieldsets/legends for grouped criteria, checkboxes/radios/selects for choices, `dialog` for the mobile sheet, `details` for non-critical disclosure, and `table` for comparison.

## 7. Content and Domain structure

Use one authoritative structured-content schema, implemented through Astro Content Collections, for Scenario, Tool, Scenario Candidate, Source Observation, and optional Offer records. Do not maintain parallel JSON schema, UI type, and content type definitions.

Minimum schema contract:

| Record | Required fields | Reference and validation rules |
| --- | --- | --- |
| All structured records | `fixture` | Fixture provenance is explicit. Production validation excludes fixture records and rejects any non-fixture public projection that depends on a fixture-only record. |
| Scenario/Tool route fields | `id`, `slug`, `status`, `lastReviewedAt`; optional `replacementSlug`, `firstPublishedAt` | IDs/slugs are unique and immutable after first publication; `status` is `draft`, `published`, or `retired`; replacement must resolve to a published record of the same type. `firstPublishedAt` is set when the record is first approved for Production promotion and is never removed or changed afterward. |
| Scenario | `title`, `goal`, `prerequisites[]`, `suitableFor`, `notSuitableFor`, `dimensions[]`, `candidateIds[]`, `verificationChecklist[]` | Prerequisites are user-visible before filtering. Dimension and Candidate references are Scenario-local; dimension IDs and order are unique; production requires the PRD publication minimums. |
| Dimension | `id`, `label`, `valueType`, `operator`, `order`; conditional `allowedValues`, `unit` | `valueType` is boolean, enum, number, or enum-set; operator is `eq`, `contains`, `lte`, or `gte` and must be compatible; values are finite and canonical. |
| Tool | `name`, `summary`, `officialUrl`; optional `logo` | Official URL must be valid `https:`; Tool identity contains no Scenario fit, ranking, evidence state, or Offer conclusion. |
| Scenario Candidate | `id`, `scenarioId`, `toolId`, `limitation`, `claimBindings`, `handsOnState` | Scenario/Tool pair is unique; references must resolve; hands-on state uses the PRD enum; decision outcomes are derived, never stored. |
| Source Observation | `id`, `subjectType`, `subjectId`, `claimKey`, `sourceType`, `sourceUrl`, `observedValue`, `scope`, `lastCheckedAt` | Subject and claim resolve; URL/date/value are valid; value matches the claim type/unit; scope is explicit; optional effective dates cannot extend freshness. |
| Offer | `id`, `toolId`, `affiliateUrl`, `status`, `lastCheckedAt`, `evidenceIds[]`; optional `terms`, `region` | URL and evidence references validate; status is `verified_deal`, `trackable_offer`, `research_only`, `expired`, or `rejected`; Offer remains outside every DecisionProjection. |

Recommended structure (collection folders omitted here follow their entity names):

```text
src/content.config.ts
src/content/{scenarios,tools,candidates,sources,offers}/
src/content/pages/          trusted Methodology/Disclosure MDX

src/domain/model.ts
src/domain/evidence.ts
src/domain/decision.ts
src/domain/url-state.ts
src/domain/publication.ts
```

An Astro-aware assembler validates references and converts collection entries into framework-independent Domain objects. Pure Domain modules do not import Astro, DOM APIs, browser clocks, UI components, or Offer presentation.

Core flow is Content Collections → validated Domain objects → publication validation → resolved evidence → candidate evaluation → static Decision projection → optional browser controller.

Implement only `draft`, `published`, and `retired` editorial states. Publication validation may derive Scenario-local `blocked`; no approval digest, database, publication service, or runtime CMS is required. Use immutable `firstPublishedAt` to distinguish a never-published record from content that was previously published and later withdrawn, blocked, or retired.

Two heterogeneous fixtures must use different dimension structures. Fixtures remain available to Development, Preview, automated tests, long-content cases, and broken-state cases, but Production discovery, generated public routes, sitemap, and structured data exclude every `fixture: true` projection. A non-fixture Scenario cannot reference fixture-only Candidates, Sources, Tools, or Offers.

Pass one typed build target, `development | preview | production`, into publication assembly. Local development defaults to `development`; Cloudflare branch configuration supplies `preview` for non-release builds and `production` only for `release`. This target may remove fixture projections and apply Preview indexing policy, but it cannot change evidence, eligibility, ordering, explanations, or Affiliate-neutrality behavior.

MDX is limited to trusted repository authors and long-form trust content. Do not accept raw user-authored MDX, untrusted HTML, or unvalidated scriptable content.

## 8. Browser state and interaction rules

- Parse and normalize `r`, `p`, and `shortlist` once in `src/domain/url-state.ts`.
- Initial invalid-state cleanup uses `history.replaceState`.
- Desktop live filter changes and shortlist add/remove use `replaceState` to avoid history spam.
- Mobile Apply and deliberate Clear-all actions may use `pushState` to preserve meaningful applied snapshots.
- `popstate` restores controls, result state, shortlist, comparison eligibility, focus context, and result count without reloading.
- Switching a dimension between required and optional replaces its prior mode.
- A shortlisted Tool that stops matching remains visible and clearly marked until the user removes it.
- Comparison opens only with 2–4 valid current-Scenario Tools.
- Browser time may downgrade expired evidence but never fetch, infer, or upgrade a claim.
- No P0 interaction reads or writes cookies, `localStorage`, `sessionStorage`, or a remote state service.

Comparison and History contract:

| Trigger/state | URL and History behavior | UI and focus behavior |
| --- | --- | --- |
| Initial load | Parse and normalize query state; use `replaceState` only when cleanup changes it. `#comparison` is retained only with 2–4 valid shortlisted Tools. | Restore applied controls and shortlist; open comparison only for a valid `#comparison`, otherwise keep it collapsed. |
| Desktop filter or shortlist change | Update query state with `replaceState`. Remove `#comparison` if fewer than two valid Tools remain. | Update results in place without moving focus; keep an open comparison only while still valid. |
| Mobile filter draft | Do not change URL, results, or shortlist until Apply. | Apply commits the draft and focuses the result summary; Cancel discards it and returns focus to the Filters trigger. |
| Mobile Apply or deliberate Clear all | Commit a meaningful state snapshot with `pushState`; normalize before serialization. | Recompute results and announce the result count without announcing the full list. |
| Open comparison | `pushState` the same normalized query plus `#comparison`; fragments never enter canonical metadata. | Render/scroll to the inline comparison and focus its heading. Back removes the fragment and returns context to the Compare control. |
| `popstate` or invalidated selection | Restore normalized query/fragment state; remove invalid fragment with `replaceState`. | Restore controls, results, shortlist, comparison eligibility, and an appropriate focus/scroll context without reload. |

All browser controllers fail safely: static content remains readable, Official Links remain usable, and errors do not create false matches or hide evidence states.

## 9. Responsive and accessibility contract

Build mobile-first. Structural reference points are base, `768px`, `960px`, and `1200px`, but component behavior follows available space rather than device labels.

Responsive state contract:

| Available width/condition | Navigation and page layout | Filters, Shortlist, and comparison |
| --- | --- | --- |
| `320–767px` | Mobile menu; single-column pages; `16px` gutters | Filters use staged `dialog` Sheet; Shortlist uses safe-area dock; comparison scrolls only inside its bounded region. |
| `768–959px` | Desktop link navigation; rails enter the main flow; `24px` gutters | Criteria render inline above results; no filter Sheet; Shortlist may remain sticky without covering content; comparison stays contained. |
| `960–1199px` | Desktop Header and two-column Decision layout | Approximately `288px` criteria rail with live updates; results flex; comparison renders below the workspace. |
| `>=1200px` | Same structure inside an approximately `1200px` centered container with `32px` gutters | Do not stretch reading columns or comparison cells beyond useful measures. |
| 400% zoom, narrow landscape, or reduced height | Reflow according to available CSS width; avoid height-dependent sticky UI | Preserve all controls and evidence in DOM order; docks/sheets must not cover focused content or depend on hover. |

Cover `320 CSS px` reflow/400% zoom, the complete `360 × 800` flow, tablet portrait/narrow landscape near `768px`, desktop at `1440 × 1000`, and wide-screen max widths. Controls use at least `44 × 44 CSS px` targets unless they are inline links. Test safe areas, virtual keyboards, long content, missing/broken images, and prohibit hover-only behavior.

Accessibility ships with each slice:

- semantic landmarks, one clear H1, logical headings, and Skip Link;
- complete keyboard operation, visible unclipped focus, and predictable focus return;
- text plus non-color state cues;
- correct disabled semantics and visible reasons;
- `aria-live` result summaries without announcing entire result lists;
- accessible menu and dialog naming, Escape behavior, and focus containment;
- semantic comparison table headers and caption;
- `prefers-reduced-motion`, forced-colors, text spacing, and 400% zoom checks;
- critical limitations and evidence retained in DOM order on every viewport.

## 10. Assets, SEO, and security

### Assets

- Use `src/assets` for imported/optimized content images and `public` for stable passthrough assets such as favicon, manifest, and Cloudflare files.
- Do not hotlink remote Tool screenshots or Logos. Record source/license/capture date for screenshots.
- Use Astro image processing with explicit dimensions, responsive `srcset/sizes`, and WebP/AVIF where appropriate.
- Provide a text/initial fallback for missing or broken Tool Logos.
- Self-host and subset fonts; preload only the actually critical face/weight.
- Generate route-appropriate Open Graph images without copying vendor or reference-site artwork.

### SEO

- Configure production `site` and one trailing-slash policy.
- Every indexable route owns a unique title, description, canonical, Open Graph/Twitter metadata, and appropriate Breadcrumb structured data.
- Use `WebSite` on Home, `WebPage` plus `BreadcrumbList` on Decision/trust routes, and `SoftwareApplication` on Tool only when the published facts satisfy that schema; never encode rankings or unsupported ratings.
- Query-state Decision URLs canonicalize to the Scenario path.
- Sitemap includes only published Scenarios, exposed Tools, and trust pages.
- Preview deployments, 404, blocked, and retired status pages are `noindex`.
- Add `robots.txt`, broken-link/orphan checks, and redirect tests before production.
- Do not use Best/Top claims or programmatic SEO in P0.

### Security

- Validate public outbound URLs and allow `https:`; allow `mailto:` only in trusted authored contact copy.
- External new-tab links use `noopener`; Affiliate links also use `rel="sponsored"` and clear disclosure.
- Never render untrusted `set:html`/`innerHTML`. Escape serialized JSON so `<`, script boundaries, and unsafe Unicode separators cannot create executable markup.
- Treat repository MDX as trusted-author content; disallow user-provided MDX, arbitrary components, and inline scripts.
- Add Cloudflare `_headers` with a tested baseline Content Security Policy, `Referrer-Policy`, `X-Content-Type-Options: nosniff`, and a minimal `Permissions-Policy`.
- Preview and production security headers are verified through HTTP smoke tests.

## 11. Testing and release gates

Tests ship in the same PR as the behavior they protect.

### Unit and schema tests

Vitest covers:

- heterogeneous content fixtures and broken references;
- build-target fixture isolation and non-fixture-to-fixture reference rejection;
- authority, scope, freshness, conflict, and unknown handling;
- required/optional behavior and stable ordering;
- zero-result alternatives;
- URL round trips and shortlist normalization;
- comparison scope and changing eligibility;
- Affiliate-neutrality invariance;
- lifecycle exposure, immutable `firstPublishedAt`, and actionable validation errors.

### Browser and visual tests

Add Playwright and axe with the first interactive Decision slice, not at the end. Cover:

```text
Home → Decision → filter → zero results → relax → shortlist
→ compare → inspect evidence → Tool → Official Link
```

Also cover mobile Apply/Cancel, fifth-item rejection, back/forward, direct Tool entry, invalid state, lifecycle pages, JavaScript-disabled content, keyboard flow, focus return, console errors, and page overflow.

Run the core flow in Chromium and WebKit before release; add a Firefox route/interaction smoke where practical. Manual accessibility review includes at least one current screen-reader/browser pairing such as VoiceOver/Safari or NVDA/Firefox.

Every visible route change includes reviewed screenshots at `360`, `768`, and `1440` widths. Manual release review adds 320 CSS-pixel/400% zoom, narrow landscape, forced-colors, reduced-motion, long-content, and broken-asset fixtures.

### Performance and release

Keep the release harness small:

```text
npm ci
→ npm run check
→ npm run test:schema
→ npm test
→ npm run build
→ core Playwright + axe
→ Cloudflare Preview smoke
```

Release expectations:

- useful static HTML before JavaScript;
- no client-framework bundle or runtime third-party script;
- LCP at or below `2.5s` and CLS at or below `0.1` in a representative mobile and desktop lab check;
- no serious axe violation, uncaught console error, broken primary link, or unintended page overflow;
- initial route JavaScript remains within a reviewed `50 KiB` gzip-equivalent budget; a measured exception requires explicit Board approval;
- preview smoke checks primary routes, redirects, canonical/noindex behavior, security headers, one core interaction, and JavaScript-disabled Decision content;
- Cloudflare Pages uses `release` as its only Production branch; `main`, pull requests, and other branches remain Preview-only;
- Board approval names the exact merged-main candidate commit before it is promoted without additional changes to `release`;
- production deploys that exact passing commit. If a previous successful Production deployment exists, retain it as the rollback target; for the first deployment, record the absence of a predecessor and establish the successful release as the initial rollback baseline.

Do not require literal browser user agents, fixed CDP profiles, three-run medians, every-file hashes, `/_release.json`, long-term release-evidence retention, or an Analytics collector for P0.

## 12. Delivery sequence

Responsive behavior, accessibility, tests, and screenshots are part of every phase rather than a final cleanup phase.

### Phase 1 — Walking skeleton

- align Node and TypeScript/test configuration;
- establish tokens, typography, shared shell, Header/Footer, mobile menu, Breadcrumbs, and StatusPage;
- configure the production `site` and one trailing-slash policy, then create all P0 routes using fixture content;
- implement Home Scenario rows and `/decision` redirect;
- verify mobile, tablet, desktop, keyboard, and screenshots.

### Phase 2 — Decision vertical slice

- establish the single content schema and two heterogeneous fixtures;
- implement evidence resolution, required/optional evaluation, stable ordering, and URL normalization with tests;
- build the Scenario header, criteria rail/sheet, result summary, candidate/excluded states, and zero-result recovery;
- introduce Playwright and axe for the complete slice.

### Phase 3 — Shortlist, comparison, and Tool evidence

- implement Shortlist limits, dock, safe area, changing eligibility, and History behavior;
- implement semantic responsive comparison;
- implement Tool details, Scenario return context, claim rows, Logo fallback, Official/Evidence separation, and optional qualifying Offer presentation;
- test direct entry, long content, broken assets, and JavaScript-disabled behavior.

### Phase 4 — Trust, SEO, security, and release

- complete Methodology and Affiliate Disclosure content;
- implement lifecycle pages/redirects, sitemap, robots, canonical metadata, Open Graph assets, headers, and link checks;
- approve one bounded production Scenario contract, build its independent source ledger, encode it, and pass a separate publication-readiness Gate;
- configure GitHub-backed Cloudflare Pages Preview with `release` isolated as the Production branch;
- run a verification-only release-candidate Gate; route failures to atomic blocking defect tasks rather than fixing them inside the Gate;
- after Board approval, promote the exact candidate commit to `release`, then run a separate verification-only Production and rollback-readiness Gate.

## 13. Definition of done

P0 is complete when:

- every PRD route and lifecycle state behaves as specified;
- the complete Scenario-to-Official-Link journey works with keyboard, touch, and JavaScript disabled where applicable;
- two heterogeneous fixtures pass Development/Preview validation, remain excluded from Production output, and at least one real qualifying Scenario passes publication validation;
- Decision, Evidence, URL, Shortlist, Comparison, and Affiliate-neutrality tests pass;
- Home ordering is stable and excludes commercial inputs;
- Toolify reference geometry has been reimplemented without copied branding, content, assets, or runtime dependencies;
- responsive, accessibility, screenshot, SEO, security-header, performance, and Preview smoke gates pass;
- `npm run check`, `npm run test:schema`, `npm test`, and `npm run build` pass from a clean candidate commit;
- the Board-approved merged-main commit is promoted unchanged to the `release` branch and is the commit served by Cloudflare Production;
- the production deployment is smoke-tested; an existing last-known-good Production deployment remains available for rollback, or the first successful deployment is truthfully recorded as the initial rollback baseline.
