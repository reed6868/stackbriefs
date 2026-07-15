# Repository Guidelines

## Project Structure & Module Organization

This repository is an early Astro scaffold. `docs/PRD.md` defines product behavior and acceptance criteria; `docs/toolify-clone-development-plan.md` is the implementation source of truth. Add application code under `src/`, using Astro conventions such as `src/pages/` for routes, `src/components/` for reusable UI, and dedicated domain modules for evidence, filtering, shortlist, and comparison logic. Place Vitest suites in `tests/`; `tests/content-schema.test.ts` is the planned schema entry point. Root SVG/ICO files are identity assets.

## Build, Test, and Development Commands

- `npm ci` installs the exact dependency versions in `package-lock.json`.
- `npm run dev` starts the Astro development server.
- `npm run check` runs Astro and strict TypeScript validation.
- `npm test` runs all Vitest suites once.
- `npm run test:schema` runs the content-schema suite specifically.
- `npm run build` creates the static production output in `dist/`.
- `npm run preview` serves the built output for final inspection.

The repository includes a minimal static Astro entry page and smoke test so the
baseline `check`, `test`, and `build` commands remain executable. Product routes,
content schemas, and domain behavior must be added through scoped tasks.

## Coding Style & Naming Conventions

Use ESM and the strictest Astro TypeScript configuration. Follow existing two-space indentation. Prefer small, pure TypeScript modules for decision rules and keep UI components free of duplicated domain logic. Use `PascalCase.astro` for components, `camelCase` for functions and variables, kebab-case for route/content slugs, and `*.test.ts` for tests. No formatter or linter is configured, so keep edits consistent and run `npm run check` before submitting.

## Testing Guidelines

Vitest is the current test framework. Cover deterministic ordering, unknown/stale evidence handling, URL round trips, shortlist limits, comparison scope, and affiliate-neutral results. Add regression tests with every behavior change. No numeric coverage threshold is configured; prioritize meaningful branch coverage. Browser and accessibility checks with Playwright and axe are planned but not yet wired into `package.json`.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit prefixes such as `docs:` and `chore:`; continue with concise imperative subjects (`feat: add scenario route`, `test: cover stale evidence`). Pull requests should explain the change and its product-contract impact, link relevant issues, list commands run, and include screenshots for visible UI changes. Keep PRs focused, update governing docs when contracts change, and never mix affiliate data into eligibility or ranking logic.
