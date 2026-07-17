# StackBriefs PRD

**Author:** Product Manager
**Date:** 2026-07-12
**Last updated:** 2026-07-17
**Status:** Approved product requirements
**Product:** StackBriefs
**Market:** English-language public web
**Implementation plan:** [Toolify clone development plan](toolify-clone-development-plan.md)

## Document responsibility

This PRD defines the product boundary, user journeys, public page responsibilities, decision and evidence semantics, release scope, and observable acceptance criteria. It does not define frontend architecture, visual tokens, component APIs, dependency selection, test tooling, deployment mechanics, or CLI execution workflow; those belong to the implementation plan or task backlog.

## 1. Product definition

StackBriefs is a free, scenario-first decision-support website that helps people narrow, compare, and verify AI-tool choices for a concrete use case. It does not use universal rankings, hidden scores, popularity, or affiliate economics to decide which tools qualify.

The core promise is:

> Start with a use case. Narrow the options. Choose with confidence.

The core journey is:

```text
Scenario
  → explicit decision criteria
  → explainable matches and exclusions
  → user-controlled shortlist
  → scenario-scoped comparison
  → claim-level evidence and freshness
  → Official Link or separately labeled Offer
```

### Product principles

1. **Scenario first:** begin with the user's decision context, not a tool directory.
2. **Deterministic and explainable:** identical normalized inputs produce identical results, order, and reasons.
3. **Evidence-aware:** distinguish verified facts, assessments, unknowns, stale evidence, non-applicable claims, and conflicts.
4. **User-controlled:** show trade-offs and limitations without declaring a universal winner.
5. **Free value first:** the decision remains useful without a commercial click.
6. **Commercial neutrality:** Affiliate and Offer data never affect eligibility, ordering, explanations, or conclusions.
7. **Static first:** public pages remain useful without JavaScript; JavaScript enhances filtering and temporary state.
8. **Open portfolio:** each Scenario qualifies independently; fixtures, file order, and commercial value never determine publication priority.

StackBriefs is not a generic Toolify/G2/TAAFT directory, review community, vendor marketplace, deals site, LLM recommendation engine, or workflow executor.

## 2. Users and jobs

Primary users are individuals and small teams evaluating AI tools under practical constraints such as price, privacy, collaboration, export, region, or commercial use. A secondary user is a Tool representative submitting corrections or evidence for later editorial review; self-publishing is outside MVP.

Users need StackBriefs to:

- choose an existing decision Scenario;
- understand its suitable and unsuitable boundaries;
- set required conditions and optional preferences;
- see why a Tool matches, fails, or remains unknown;
- recover deliberately from zero results;
- shortlist and compare only relevant candidates;
- inspect sources, check dates, limitations, and hands-on status;
- leave through a neutral Official Link or a clearly separated Affiliate Offer.

## 3. Product model and invariants

### Core entities

- **Scenario:** goal, boundaries, dimensions, allowed values, candidates, verification checklist, and related content.
- **Tool:** stable identity, neutral summary, Logo, and Official Links.
- **Scenario Candidate:** the Scenario-specific relationship between a Tool and its fit, limitations, claims, and evidence.
- **Source Observation:** a dated, scoped observation supporting one claim.
- **Offer:** an optional reviewed Affiliate destination and its current terms; it is presentation-only.
- **Shortlist:** temporary browser state containing 1–4 candidates from the current Scenario.

### Invariants

- Dimensions, requirements, candidate evaluation, shortlist, comparison, explanations, and URL state are scoped to one Scenario.
- The same Tool may match one Scenario, fail another, and remain unknown in a third.
- Match state is derived from current requirements and resolved evidence; it is never stored as editorial content.
- There is no global Tool score, global winner, universal filter set, or cross-scenario comparison conclusion.
- Tool identity remains separate from Scenario-specific conclusions.
- Offer data has no dependency path into evidence resolution or decision output.
- Development includes two materially different fixtures so the first Scenario cannot define the shared model.

## 4. MVP information architecture

| Route | Public responsibility |
| --- | --- |
| `/` | Explain the product, list published Scenarios in a stable non-commercial order, show the decision process, and link to trust pages. |
| `/decision/[scenario]` | Present Scenario boundaries, criteria, results, exclusions, zero-result recovery, shortlist, comparison, evidence, and outbound paths. |
| `/tool/[slug]` | Present neutral Tool identity, published Scenario context, claim-level evidence, limitations, Official Links, and an optional separate Offer. |
| `/methodology` | Explain matching, evidence states, freshness, conflicts, corrections, hands-on status, and commercial neutrality. |
| `/affiliate-disclosure` | Explain Affiliate relationships, labeling, compensation, and the rule that commercial data cannot affect decisions. |
| `/decision` | Permanently redirect to the Scenario section on Home; a searchable Scenario index is P1. |
| 404 response | Explain that the page is unavailable and provide routes back to Home, published Scenarios, and Methodology. |

Methodology and Affiliate Disclosure remain separate because evidence trust and commercial disclosure answer different user questions. Tool pages support a Scenario decision; they must not become a generic Tool Library in P0.

### Route lifecycle

| Content state | Public behavior |
| --- | --- |
| Invalid slug or never-published record | Return 404; exclude from canonical links, structured data, and sitemap. |
| Draft or unpublished record | Do not expose a public content route. |
| Previously published but temporarily withdrawn or blocked | Render a minimal `noindex` status page with no active decision controls or current claims. |
| Retired with a published replacement | Permanently redirect to the replacement. |
| Retired without a replacement | Render a minimal `noindex` retirement page with a path back to current Scenarios. |
| Tool with no published Scenario relationship | Hide from discovery; use the same never-published or previously-published rule above. |

Published slugs are not silently reused for unrelated content.

## 5. Primary user journeys

### Discover and enter a Scenario

The user scans concrete Scenario rows rather than broad categories or featured Tools, opens one Scenario, and sees its goal, prerequisites, suitable boundary, unsuitable boundary, and last-reviewed state before filtering.

### Filter deterministically

The user activates conditions as required or optional. Formal results contain only candidates whose required conditions all resolve to `match`. Each result shows inclusion reasons and a key limitation. Excluded candidates distinguish `no_match` from `unknown`.

### Recover from zero results

The product identifies which required conditions prevent a match and offers deliberate relaxation. It never silently changes a required condition, converts it to optional, or inserts an unknown candidate as a match.

### Shortlist and compare

The user may shortlist 1–4 candidates and compare 2–4 within the current Scenario. Comparison uses Scenario dimensions, equal visual treatment, explicit unknowns, and no winner column.

### Verify and leave

The user can inspect evidence, check dates, limitations, and hands-on status before using an Official Link. A qualifying Offer, when present, is visibly separate and disclosed. Absence of an Offer never removes the Official Link.

## 6. Decision behavior

### Requirements

Each Scenario defines the order, value type, allowed values, and one supported operator for every filterable dimension. MVP supports one active condition per dimension:

| Operator | Meaning |
| --- | --- |
| `eq` | value equals the selected boolean, enum, or finite number |
| `contains` | a set contains the selected enum value |
| `lte` | numeric value is less than or equal to the selected threshold |
| `gte` | numeric value is greater than or equal to the selected threshold |

MVP excludes free-text filters, arbitrary numbers, multi-select, OR groups, negation, ranges, fuzzy matching, and runtime synonym inference.

- Required conditions combine with logical AND.
- Required `match` passes; required `no_match` or `unknown` excludes.
- Optional preferences are explanatory only. They cannot change membership, default order, alternatives, or comparison conclusions.
- Formal results sort by normalized Tool name and then stable slug. Commercial fields and content file order are prohibited sort inputs.
- Explanations follow Scenario dimension order and distinguish failed, unknown, matched, optional, and limitation information.

### URL and temporary state

The canonical shape is:

```text
/decision/<scenario>?r=<dimension>:<value>&p=<dimension>:<value>&shortlist=<slug>,<slug>
```

`r` means required and `p` means optional. Invalid dimensions, values, modes, deleted Tools, duplicates, fifth shortlist entries, and cross-scenario Tools are removed during normalization. Reload and browser back/forward restore normalized state. Canonical metadata excludes temporary query state. Accounts, `localStorage`, databases, and server-side personalization are outside MVP.

## 7. Evidence and trust

### Public evidence states

- `verified_fact`: current qualifying evidence supports a canonical value;
- `editorial_assessment`: visibly labeled judgment that cannot satisfy a required filter;
- `not_verified`: no qualifying evidence;
- `needs_recheck`: previously qualifying evidence is stale;
- `not_applicable`: a current, explicit, supported assertion;
- `conflicting`: current equal-authority evidence disagrees.

Evidence qualifies only when it directly supports the claim type, matches the Tool and material scope such as plan, region, platform, or version, uses a valid canonical value, and is current. Official legal, pricing, documentation, release-note, plan-interface, and direct StackBriefs test evidence may qualify for their relevant claim types. Direct product/help pages may qualify for the claim they state. Directories, search results, social posts, community reports, and independent reviews may discover or corroborate claims but cannot independently establish `verified_fact`.

Resolution uses the highest qualifying authority available. Agreement resolves a value; disagreement at that authority resolves `conflicting`. Source count, majority, commission, confidence, and recency cannot break an equal-authority conflict. Wrong-scope evidence neither proves nor disproves the requested claim.

Default freshness windows are 7 days for deals and tracking, 30 days for price and plan claims, and 90 days for capabilities, integrations, privacy, rights, region, export, and general research. Freshness derives from `lastCheckedAt` and the relevant claim window. At expiry, the browser may downgrade a deployed state but may never upgrade evidence. Stale evidence cannot continue to support `verified_fact`, a required match, or current Deal language.

Hands-on state is one of `tested`, `partially_tested`, `not_tested`, or `unavailable`. Public copy must not imply direct experience when no test occurred.

## 8. Official, Evidence, and Offer separation

- **Official Link:** the neutral vendor destination and default outbound path.
- **Evidence Link:** a citation supporting a claim.
- **Offer Link:** an optional reviewed Affiliate destination with disclosure, scope, terms, status, and check date.

The three link types must be structurally and visually distinct. A free plan, paid plan, trial, or price is a product fact, not automatically an Offer. `research_only`, expired, rejected, or unverifiable commercial records cannot render Deal or Discount language or an active Offer CTA.

Affiliate status, network, commission, Offer presence, and Offer value must not create candidates, resolve unknown evidence, change results or order, alter alternatives or comparison conclusions, or create a winner. Submissions and payments are intake metadata only and have the same prohibition.

## 9. Content and release scope

Public content uses three editorial states: `draft`, `published`, and `retired`. Build validation may derive `blocked` when a requested publication has invalid references, insufficient required evidence, stale gating claims, or another Scenario-local failure. One blocked Scenario does not block unrelated valid Scenarios.

A Scenario may publish when it has:

- a concrete goal and clear suitable/unsuitable boundaries;
- at least three comparable candidates;
- approximately 4–7 stable Scenario-specific dimensions;
- current qualifying evidence for every candidate/dimension cell used as a required filter;
- realistic inputs that demonstrate meaningful differences and zero-result recovery;
- a reviewed verification checklist and no excluded high-risk vertical.

Development and Preview may use fixtures or contain no published Scenario. Production requires at least one real, non-fixture Scenario that passes the same validation.

### P0 — Decision website

- all routes and journeys in this PRD;
- deterministic evidence resolution and decision behavior;
- URL-only Shortlist and comparison;
- useful static HTML before JavaScript;
- responsive, accessible interaction from mobile through wide desktop;
- clear Official/Evidence separation;
- optional Offer presentation only when a record qualifies;
- no product Analytics requirement.

### P1 — Breadth and operations

- searchable Scenario index and Tool Library;
- additional Scenarios, Guides, Utilities, and fixed Scenario-bound comparison pages;
- correction/contact and reviewed Tool Owner intake;
- approved minimal measurement, newsletter, or additional explainable sorts;
- expanded link checking, content operations, and SEO.

### Later or explicitly excluded

- accounts, permanent shortlists, personalization, databases, UGC, ratings, vendor dashboards, paid placement, or universal rankings;
- LLM recommendations, generated workflows, tool execution, or autonomous publication;
- programmatic SEO, localization, native apps, high-risk decision verticals, or speculative Cloudflare services without a feature need.

## 10. Acceptance criteria

1. **Scenario isolation:** two heterogeneous fixtures render their own dimensions, candidates, URL state, shortlist, and comparison without leaking labels or logic.
2. **Required determinism:** every formal result matches every active required condition; `no_match` and `unknown` remain distinct exclusions.
3. **Optional neutrality:** changing only optional preferences does not change result membership, default order, alternatives, or conclusions.
4. **Stable order:** repeated normalized input produces identical candidate IDs, order, and explanation order; Affiliate-only changes produce the same decision output.
5. **Zero-result honesty:** zero results identify blocking conditions and require explicit user relaxation; no condition is silently weakened.
6. **URL round trip:** valid state survives parse/serialize/reload/back/forward; invalid, duplicate, fifth, deleted, and cross-scenario values are normalized away.
7. **Shortlist and comparison:** Shortlist is limited to 1–4 current-Scenario candidates; comparison requires 2–4 and never adds winner treatment.
8. **Changing eligibility:** if a shortlisted Tool stops matching after a filter change, it is clearly marked and never silently replaced.
9. **Evidence honesty:** every decision claim displays its state and relevant check date; stale, conflicting, wrong-scope, or weak evidence cannot appear verified.
10. **Freshness parity:** build-time and browser-time behavior agree at expiry, and browser code can only downgrade evidence.
11. **Link separation:** Official, Evidence, and Offer paths remain distinct; absence or invalidity of an Offer leaves the Official Link intact.
12. **Static usefulness:** Home, Decision, Tool, Methodology, and Disclosure provide meaningful content with JavaScript disabled.
13. **Responsive accessibility:** the complete flow works by keyboard and touch without information loss, trapped focus, or page-level horizontal overflow from 320 CSS pixels through wide desktop and at 400% zoom.
14. **Lifecycle behavior:** invalid, unpublished, blocked, retired, replacement, and inactive-Tool routes follow the route lifecycle table and do not leak into sitemap or structured data.
15. **Production content:** production includes at least one real qualifying Scenario, while fixture order and commercial data never determine Home ordering or publication priority.

## 11. Residual risks

- Evidence can become stale faster than editorial capacity can refresh it; affected claims must downgrade rather than remain falsely current.
- A dense evidence model can overwhelm users; presentation should use progressive disclosure without hiding limitations or state.
- URL-only state can grow; MVP limits dimensions and shortlist size before considering persistence.
- Scenario breadth can dilute quality; publication remains evidence-gated and Scenario-local.
- Affiliate monetization can erode trust; neutrality invariance and separate disclosure remain release requirements.
