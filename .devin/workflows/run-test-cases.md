---
description: Execute the functional test-case suite under /test-cases against the running app using the Playwright MCP server
---

You are acting as a **QA automation engineer**. Your job is to execute the documentation-only test cases under `test-cases/` against the live Weather Dashboard application by driving a real browser through the **Playwright MCP server** (`mcp0_browser_*` tools).

This workflow is **execution-only** — do **not** edit production source or test-case files. You may only:

- Start / stop a local dev server.
- Drive the browser via MCP tools.
- Create a fresh run report under `test-cases/runs/<timestamp>/` (markdown only).

## Step 1 — Pick the scope

Ask the user which slice to run if they did not specify. Default to **all P0 + P1 e2e cases** when nothing is provided.

Accept any of:

- A specific TC ID (e.g. `TC-E2E-002`).
- An area folder (e.g. `components/`, `e2e/`, `cross-cutting/`).
- A priority filter (`P0`, `P0+P1`, `all`).
- A `Type` filter (`e2e`, `accessibility`, …).

Resolve the scope into a concrete ordered list of `TC-*` IDs by reading `test-cases/index.md` and the area files it points to. Skip cases whose `Automation` field is `manual` and report them as **skipped (manual)**.

## Step 2 — Read every selected case in full

For each `TC-*` in scope, open the file containing it (paths follow `test-cases/<area>/<feature>.md`) and capture the full row:

`ID`, `Title`, `Area`, `Type`, `Technique`, `Priority`, `Preconditions`, `Steps`, `Test Data`, `Expected Result`, `Source`, `Automation`.

Do **not** invent behavior. If `Expected Result` contains `TODO: clarify`, mark the case as **blocked (ambiguous)** and continue.

## Step 3 — Prepare the application

1. Check whether a dev server is already listening on `http://localhost:4200`. If yes, reuse it.
2. Otherwise start one in the background:
   ```bash
   npm run start -- --port 4200
   ```
   Wait until the server responds before proceeding.
3. Resize the browser to a deterministic viewport:
   - `mcp0_browser_resize` → 1280 × 800.

## Step 4 — Per-case execution loop

For each case in order, do the following. Treat each case as **independent** — never let state from a prior case leak in.

### 4a. Reset the browser context

Before every case:

- `mcp0_browser_evaluate` → clear storage and patch APIs the case requires:
  ```js
  () => {
    localStorage.clear();
    sessionStorage.clear();
  }
  ```
- If the case's `Preconditions` mention geolocation, `localStorage` seeds, fixed clock, or `reducedMotion`, apply them via `mcp0_browser_run_code_unsafe` using Playwright's `page.addInitScript` / `page.clock` / `context.grantPermissions` **before** navigation. Examples:
  - **Geolocation success** → `addInitScript` that overrides `navigator.geolocation.getCurrentPosition` with the case's coordinates.
  - **Geolocation denied** → same hook, but invoke the error callback with `code: 1`.
  - **Seeded `localStorage`** → `addInitScript` that calls `localStorage.setItem(...)` with the value from `Test Data` / `Preconditions`.
  - **Fixed clock** → `page.clock.install({ time: <epoch_ms> })`.
- If the case stubs `https://api.openweathermap.org/**` or a geocoder, register `page.route(...)` handlers returning the fixtures referenced in `Test Data`. If a fixture file is not present in the repo, synthesize a **minimal deterministic JSON** that satisfies the `Expected Result` and record what you used in the run report.

### 4b. Drive the steps

Translate the Given/When/Then steps into MCP calls:

- **Navigate** → `mcp0_browser_navigate` to `http://localhost:4200<route>` (default `/`).
- **Snapshot before asserting** → `mcp0_browser_snapshot` to obtain stable element refs.
- **Interact** → `mcp0_browser_click`, `mcp0_browser_type`, `mcp0_browser_fill_form`, `mcp0_browser_press_key`, `mcp0_browser_select_option`, `mcp0_browser_hover` as required.
- **Wait deterministically** → `mcp0_browser_wait_for` on text from the `Expected Result`. Never use arbitrary sleeps unless the case explicitly says "waits N ms" (then use `time: N/1000`).
- **Inspect network** → `mcp0_browser_network_requests` (with a `filter` regex) and `mcp0_browser_network_request` when the case asserts request shape, count, or query params (e.g. `units=imperial`).

### 4c. Verify the expected result

Verify each clause of `Expected Result` independently:

- **Visible text / headings** → assert via the latest `mcp0_browser_snapshot` content.
- **DOM state / classes / attributes** → `mcp0_browser_evaluate` with a focused selector returning a boolean or value (only when the case explicitly references the class/attribute — never invent selectors).
- **`localStorage` state** → `mcp0_browser_evaluate` returning `JSON.parse(localStorage.getItem(<key>))`.
- **HTTP traffic** → counts and query strings from `mcp0_browser_network_requests`.
- **Focus order (a11y)** → repeated `mcp0_browser_press_key('Tab')` followed by `mcp0_browser_evaluate(() => document.activeElement?.tagName + '#' + document.activeElement?.id)`.
- **Console** → `mcp0_browser_console_messages` only if the case asserts on console output.

Each clause produces a `pass` / `fail` with the observed value. The case overall is `pass` only if every clause passes.

### 4d. On failure

- Capture `mcp0_browser_take_screenshot` → save as `test-cases/runs/<timestamp>/<TC-ID>.png`.
- Capture `mcp0_browser_snapshot` → save the markdown via the tool's `filename` arg as `test-cases/runs/<timestamp>/<TC-ID>.snapshot.md`.
- Record the failing clause, expected value, observed value, and any error-level console messages.
- Continue to the next case — never abort the run on a single failure.

## Step 5 — Tear down

- Close the page with `mcp0_browser_close`.
- If you started the dev server in Step 3, stop it.

## Step 6 — Write the run report

Create `test-cases/runs/<UTC-ISO-timestamp>/report.md` containing:

1. **Header** — timestamp, app URL, commit SHA (`git rev-parse HEAD`), browser viewport.
2. **Summary table** — totals by status (`pass`, `fail`, `blocked`, `skipped`) and by `Priority`.
3. **Per-case results table** — `ID`, `Title`, `Priority`, `Status`, `Duration ms`, `Notes`, link to screenshot/snapshot if any.
4. **Failures section** — for each `fail`, the failing clause, expected vs observed, and artifact links.
5. **Blocked / skipped section** — IDs with the reason (e.g. `manual`, `TODO: clarify`, missing fixture).
6. **Suggested next actions** — only factual items (e.g. "TC-E2E-005 — observed banner text differs by one word; confirm copy with maintainer"). Do **not** propose source changes from this workflow.

## Step 7 — Report back to the user

Reply in chat with:

- One-line headline (e.g. `7/9 passed, 1 failed, 1 skipped`).
- A short table mirroring the summary.
- The path to the run report.
- The first failing case (if any) with its expected vs observed values.

## Rules

- **Execution only** — never modify files under `src/` or `test-cases/<area>/`. Only write under `test-cases/runs/`.
- **Deterministic** — always stub external APIs and geolocation; never hit the live OpenWeather endpoint.
- **One case = one clean context** — reset storage, routes, and init scripts between cases.
- **No invented assertions** — assert only what the case's `Expected Result` says. If a clause is too vague to verify, mark the case `blocked (ambiguous)` with the exact wording quoted.
- **Cite artifacts** — every `fail` row in the report must link to a screenshot and a snapshot file.
- **Stop conditions** — only abort the whole run if the dev server fails to start or the browser MCP is unavailable; otherwise always finish the loop and produce a report.
