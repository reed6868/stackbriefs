# SB-305 core journey verification gate

**Status:** Pass  
**Reconciled application commit:** `41b6bb432ae6c54194855068f44a1d27493b4bdd`  
**Date:** 2026-07-17  
**Browser path:** Repository Playwright; the Browser plugin was not available in this session.

## Gate outcome

The complete fixture journey works from Home through the neutral Official Link with keyboard and touch input. The reconciled matrix found no remaining serious axe violation, uncaught page or console error, trapped background focus, hidden critical information, or page-level horizontal overflow.

The first matrix run found one product defect: the mobile menu glyph disappeared under forced colors. The Gate remained blocked while [Issue #22](https://github.com/reed6868/stackbriefs/issues/22) was implemented and reviewed separately through PR #23. The complete matrix then passed against reconciled main commit `41b6bb4`.

## Journey and interaction matrix

| Area | Evidence | Result |
| --- | --- | --- |
| Home → Decision → filter → zero results → relax → shortlist → compare → evidence → Tool → Official Link | `core-journey-gate.test.ts` keyboard and touch journeys | Pass |
| Keyboard reachability | Real Tab-order traversal, Enter activation, comparison focus, Evidence disclosure, Official Link | Pass |
| Touch | 360×800 touch context, mobile Apply, shortlist, compare, Tool, disclosure, Official Link | Pass |
| Mobile dialog | Open-dialog axe scan, background control exclusion, Escape close, focus return, Apply and existing Cancel coverage | Pass |
| Fifth shortlist item | Existing expanded-fixture rejection test | Pass |
| Back/forward | Existing filter, shortlist, and comparison history tests | Pass |
| Direct Tool and invalid state | Existing Tool direct-entry, cross-origin return, invalid slug, and URL normalization tests | Pass |
| JavaScript disabled | Static Decision plus Tool evidence and clickable Official Link at 320 CSS px | Pass |
| Broken assets and long content | Broken Logo fallback plus injected long Scenario limitation | Pass |
| Console and page errors | Watchers across the interactive and responsive Gate paths | None |
| Bounded overflow | Document-width assertions across all matrix viewports | Pass |

## Responsive and accessibility matrix

| Mode | Coverage | Result |
| --- | --- | --- |
| 400% reflow | 320 CSS px, equivalent to a 1280 CSS px layout viewed at 400% for WCAG reflow evaluation | Pass |
| Mobile | 360×800 | Pass |
| Tablet portrait | 768×1024 | Pass |
| Tablet landscape | 1024×768 | Pass |
| Desktop | 1440×1000 | Pass |
| Forced colors | Chromium `forced-colors: active`; system-color menu glyph contrast asserted | Pass after Issue #22 |
| Reduced motion | `prefers-reduced-motion: reduce` plus no running document animations | Pass |
| Axe | Home, Decision, comparison, open filter dialog, Tool, forced colors, and responsive paths | No serious or critical violations |

## Browser results

- Chromium and WebKit core: 52 passed, 2 expected skips in 3.1 minutes.
  - WebKit skips Chromium-only forced-colors emulation in the Gate and focused header regression.
- Firefox smoke: 1 passed, 1 expected forced-colors skip.
- Main CI for the reconciled product fix: [run 29602624009](https://github.com/reed6868/stackbriefs/actions/runs/29602624009), including `browser-evidence-29602624009`.

## Static and build results

- `npm run test:schema`: 16 passed.
- `npm run check`: zero errors, warnings, or hints.
- `npm test`: 145 passed across 17 files.
- `npm run build`: 10 static routes built.

## Manual browser and screen-reader note

No OS screen-reader runtime was available. A manual semantic browser pass checked the rendered heading hierarchy, named navigation and dialog landmarks, dialog focus return, table caption and row/column headers, button/link accessible names, evidence disclosure summaries, status text, and source/check-date reading order. Chromium, WebKit, and Firefox automation exercised the same semantic controls by accessible role and name.

No critical information depends only on color: match and evidence states retain visible text, the shortlist exposes count and eligibility text, forced-colors controls retain visible boundaries and glyphs, and Official, Evidence, and Offer destinations remain text-labeled.

## Screenshot review

Reviewed screenshots at 360, 768, and 1440 pixels for Decision, shortlist, comparison, and Tool states. Additional review covered 320 CSS px reflow, 1024×768 landscape, and forced colors. Text remained readable, long content wrapped, sticky shortlist content did not cover focused controls, comparison stayed contained, and no page-level horizontal overflow appeared.

The forced-colors before/after review confirmed the only Gate defect: the previously blank mobile menu button now renders all three `ButtonText` glyph bars.

## Remaining risk

An OS-level screen-reader session was not available; the Gate uses manual semantic inspection, role/name-driven browser interaction, focus assertions, and axe as the available evidence. No product failure remains open from this Gate.
