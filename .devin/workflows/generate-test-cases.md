---
description: Analyze any codebase and generate a comprehensive functional test-case suite under /test-cases
---

You are acting as a **senior QA engineer** performing a full functional test-case generation pass on the current repository. This workflow is **language- and framework-agnostic** — it must work for any project (web, backend, CLI, library, mobile).

The deliverable is a structured set of markdown files under `test-cases/` at the repo root, authored using the principles in `.windsurf/workflows/write-functional-test-cases.md` (read it first if it exists; otherwise apply ISTQB / BDD / risk-based / shift-left fundamentals).

Do **not** modify production source code from this workflow. Output is documentation only.

## Step 1 — Orient yourself in the repo

1. Read the root `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, and any `docs/` entrypoints to learn the product purpose, primary user, and tech stack.
2. Inspect manifest files to detect stack and entrypoints:
   - JS/TS: `package.json` (scripts, deps, `main`, `bin`)
   - Python: `pyproject.toml`, `setup.py`, `requirements*.txt`
   - Go: `go.mod`, `cmd/*`
   - Rust: `Cargo.toml`
   - JVM: `pom.xml`, `build.gradle*`
   - .NET: `*.csproj`, `*.sln`
   - Mobile: `Podfile`, `build.gradle`, `pubspec.yaml`
3. Map the high-level architecture by listing top-level source folders (e.g. `src/`, `app/`, `pkg/`, `lib/`, `cmd/`, `internal/`, `services/`, `features/`).
4. Identify external surfaces — the things real users or callers exercise:
   - UI routes / screens / components
   - HTTP / gRPC / GraphQL endpoints
   - CLI commands and flags
   - Public library APIs (exported symbols)
   - Background jobs, schedulers, event handlers
   - Persisted state, caches, config, feature flags
5. List existing tests (`*test*`, `*.spec.*`, `__tests__/`, `tests/`, `e2e/`) to avoid duplicating coverage and to learn naming conventions.

If the repo already has a `test-cases/` folder, **read its `README.md`, `index.md`, and `coverage-matrix.md` first** and extend the existing scheme rather than reinventing it.

## Step 2 — Build a feature inventory

Produce an internal list (you do not need to commit this) of every user-visible behavior, grouped by area. For each item capture:

- Area / module path
- Trigger (user action, API call, event, schedule)
- Inputs and their domains
- Observable outputs / side-effects
- Known states (loading, empty, error, offline, partial, stale)
- Risk level (impact × likelihood)
- Source citation (file + symbol or doc section)

Prefer **black-box** framing — describe *what* the system does, not *how*.

## Step 3 — Decide the folder layout

Use this default structure unless the repo already defines one:

```
test-cases/
  README.md              # how to read & contribute to the suite
  index.md               # flat list of all TC IDs with titles
  coverage-matrix.md     # area/requirement -> TC IDs (forward + backward traceability)
  <area-1>/
    <feature-a>.md
    <feature-b>.md
  <area-2>/
    ...
  cross-cutting/         # a11y, i18n, security, performance, theming
  e2e/                   # end-to-end user flows
  configuration/         # env vars, feature flags, build modes
```

Pick area names from the repo's own vocabulary (e.g. `components/`, `services/`, `api/`, `cli/`, `workers/`). One file per cohesive feature; do not create one file per case.

## Step 4 — Generate the cases

For every feature in the inventory, author cases using the schema and rules from `write-functional-test-cases.md`. At minimum each case must include:

`ID`, `Title`, `Area / Module`, `Type`, `Technique`, `Priority`, `Preconditions`, `Steps` (Given/When/Then), `Test Data`, `Expected Result`, `Source`, `Automation`.

ID scheme: `TC-<AREA>-<NNN>` where `<AREA>` is a short uppercase token (e.g. `TC-AUTH-001`, `TC-CLI-014`). IDs must be globally unique across the suite.

Coverage rules — for **every** feature, deliberately include cases across these axes (skip an axis only if it provably does not apply, and note why):

- Happy path
- Negative / invalid input / unauthorized
- Boundary values (empty, null, min, max, just-outside, unicode/emoji, RTL, DST, timezones)
- State transitions (loading, success, error, empty, partial, stale, offline)
- Concurrency / timing (debounce, retry, idempotency, cancellation, races)
- Permissions / auth (unauthenticated, wrong role, expired token)
- Persistence (refresh, deep link, back/forward, multi-tab, restart)
- Accessibility (keyboard, screen reader, focus, contrast) — for any UI
- Localization (units, currency, dates, pluralization) — when applicable
- Security (input sanitization, injection vectors, secret exposure) — when applicable
- Regression (one case per known fixed bug from changelog / closed issues / git log)

Apply formal techniques explicitly and record which one on each case: EP, BVA, Decision Table, State Transition, Use-Case, Error Guessing, Pairwise.

Prioritize by **risk, not ease**: P0 blocks core value / data / security / revenue · P1 visible regression · P2 minor UX · P3 defensive.

## Step 5 — Maintain traceability

1. Update `test-cases/index.md` with a sorted table of every `ID`, `Title`, `Area`, `Priority`, `Type`.
2. Update `test-cases/coverage-matrix.md` with a two-way mapping:
   - **Forward**: each requirement / feature → list of `TC-*` IDs covering it.
   - **Backward**: each `TC-*` → its `Source` (file/symbol/doc/ticket).
3. Flag any requirement with **0 cases** as a coverage gap in the matrix.
4. For ambiguous behavior, create the case at `Priority: P3` with `TODO: clarify` and list it in the final summary — never invent behavior.

## Step 6 — Self-review before reporting

// turbo
Verify each of the following and fix any failure before finishing:

1. Every case has all required schema fields populated.
2. Every `ID` is unique across `test-cases/`.
3. Every `Source` points to a path/symbol/doc that actually exists in the repo.
4. Every `Title` starts with a verb and describes exactly one behavior (no "and"/"also").
5. Every `Steps` + `Expected` pair is deterministic and self-validating (no "should work correctly").
6. Each feature has happy + negative + boundary + state coverage (or a documented reason for skipping).
7. No anti-patterns: order-dependent cases, asserting "no errors", testing the framework, hard-coded `today`/`Math.random()`/live third-party calls, duplicate cases, or implementation details (CSS classes, private methods, SQL) in a functional case.
8. Priorities reflect risk, not authoring effort.

## Step 7 — Summarize for the user

Report back with:

- Stack and architecture detected (1–2 lines).
- Folder layout created or extended under `test-cases/`.
- Counts by `Area`, `Type`, `Priority`, and `Technique`.
- Top 5–10 P0/P1 cases recommended for automation first.
- Coverage gaps and `TODO: clarify` items needing maintainer input.
- Suggested next command to run existing tests / linters so the user can sanity-check the repo state.

## Rules

- **Documentation only** — do not edit production source.
- **Generic** — never assume a specific framework; detect it from manifests.
- **Extend, don't overwrite** — if `test-cases/` exists, match its existing layout, ID scheme, and tone; only create new files for genuinely new areas.
- **Cite everything** — every case's `Source` must reference a real file/symbol/doc/ticket.
- **Ask once, then proceed** — if a critical ambiguity blocks ≥ 5 cases, ask one focused question; otherwise mark `TODO: clarify` and continue.
