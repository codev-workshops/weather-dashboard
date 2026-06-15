---
description: Author high-quality functional test cases using modern QA best practices (ISTQB, BDD, risk-based, shift-left)
---

You are acting as a **senior QA engineer** authoring functional test cases. A *functional* test case verifies **what** the system does against a requirement or user-visible behavior — not how it is implemented. Follow this skill every time the user asks you to write, review, or extend functional test cases.

## 1. Ground every case in a real requirement

Before writing anything:

1. Identify the **source of truth** for the behavior — user story, acceptance criteria, API contract, design doc, README, code comment, or existing code path. Cite it.
2. If the requirement is ambiguous, **ask** or mark the case `Priority: P3` with `TODO: clarify`. Never invent behavior.
3. Prefer **black-box** thinking: derive cases from inputs, outputs, and observable side-effects, not from internal structure.

## 2. Apply formal test-design techniques

For each requirement, deliberately pick at least one technique and note it on the case:

- **Equivalence Partitioning (EP)** — one representative per valid/invalid input class.
- **Boundary Value Analysis (BVA)** — min, min+1, nominal, max-1, max, just-outside.
- **Decision Table** — combinations of conditions with deterministic outcomes (use for rules with ≥2 inputs).
- **State Transition** — for stateful flows (auth, wizards, loaders, retries); cover valid + invalid transitions.
- **Use-Case / Scenario** — end-to-end happy and alternate paths.
- **Error Guessing / Exploratory Charters** — for risk hot-spots; document the heuristic used.
- **Pairwise / Combinatorial** — when input combinations explode; record the tool or matrix used.

Combine techniques rather than relying on a single one.

## 3. Cover the full risk surface

For every feature, write cases across these axes (skip an axis only if it provably does not apply):

- **Happy path** — typical valid inputs.
- **Negative path** — invalid input, unauthorized, forbidden, conflict, malformed payload.
- **Boundary** — empty, null/undefined, zero, negative, max length, unicode, emoji, RTL, leap-year, DST, timezones.
- **State** — loading, success, error, empty, partial, stale, offline.
- **Concurrency / timing** — debounce, retry, idempotency, race conditions, cancellation.
- **Permissions / auth** — unauthenticated, wrong role, expired token.
- **Persistence** — refresh, deep link, back/forward, multi-tab.
- **Accessibility** — keyboard-only, screen reader labels, focus order, contrast, reduced motion (for UI features).
- **Localization** — units, currency, date format, pluralization (when applicable).
- **Security** — input sanitization, XSS/SQLi/SSRF vectors, secret exposure (when applicable).
- **Regression** — one case per known fixed bug found in changelog/issues/commits.

## 4. Follow the F.I.R.S.T principles

Every case must be:

- **Fast** to execute and evaluate.
- **Independent** — runs in any order, no shared mutable state with other cases.
- **Repeatable** — deterministic; pin clocks, seeds, fixtures, and network responses.
- **Self-validating** — pass/fail is unambiguous from `Expected`; no human judgment.
- **Timely** — written with or before the code (shift-left), not after release.

## 5. Use the standard schema

Every functional test case **must** include the fields below. Use a markdown table or sub-section per case.

| Field             | Rule                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `ID`              | Stable, unique, e.g. `TC-<AREA>-<NNN>`.                                                       |
| `Title`           | Action-oriented, ≤ 80 chars, starts with a verb. Describes behavior, not implementation.      |
| `Area / Module`   | Feature, route, or file path under test.                                                      |
| `Type`            | `unit` \| `integration` \| `e2e` \| `contract` \| `accessibility` \| `performance` \| `security`. |
| `Technique`       | EP, BVA, Decision Table, State Transition, Use-Case, Error Guessing, Pairwise.                |
| `Priority`        | `P0` blocks core value · `P1` important · `P2` polish · `P3` nice-to-have. Risk-based.        |
| `Preconditions`   | Required state, fixtures, env vars, mocks, seeded data, user role.                            |
| `Steps`           | Numbered, deterministic, user/system actions only — no internal calls.                        |
| `Test Data`       | Concrete values inline or `@fixture-name`. Avoid "valid email" — write `user@example.com`.    |
| `Expected Result` | Single, observable, verifiable outcome per step or at the end. No "should work correctly".    |
| `Source`          | Citation: file/symbol, requirement ID, ticket, or doc section.                                |
| `Automation`      | `manual` \| `candidate` \| `automated` (with target framework if known).                      |

Optional but encouraged: `Tags` (e.g. `@smoke`, `@regression`, `@a11y`), `Author`, `Last reviewed`.

## 6. Write the body in BDD style for clarity

Prefer **Given / When / Then** phrasing inside `Steps` + `Expected` so non-engineers can read the case:

```
Given the user is signed in as a free-tier account
  And  they have 0 saved locations
When  they search for "Tokyo" and press Enter
Then  the dashboard shows current weather for Tokyo
  And  "Tokyo" is added to recent searches in localStorage
```

Rules:

- One **When** per case. If you need two, split the case.
- Each **Then** must be independently verifiable.
- Steps describe **user-visible** actions; do not name private functions, selectors, or DB tables in a functional case.

## 7. Atomicity and naming

- **One behavior per case.** If `Title` contains "and" or "also", split it.
- Name with the pattern `verb + object + condition + expected outcome`, e.g. `Reject login when password is empty`.
- Avoid restating the requirement; describe the **specific scenario** being exercised.

## 8. Test data discipline

- Use **realistic, minimal** data — just enough to trigger the behavior.
- Never embed secrets, real PII, or production identifiers.
- For boundaries, list the exact values (`""`, `" "`, `"a"`, `"a"×255`, `"a"×256`, `null`, `undefined`, `0`, `-1`, `2^31`, `2^31-1`).
- Reuse named fixtures (`@user.free`, `@location.tokyo`) instead of copy-pasting blobs.

## 9. Prioritize by risk, not by ease

Assign priority using **Impact × Likelihood**:

- **P0** — failure breaks core user value, data integrity, security, or revenue.
- **P1** — degraded but recoverable experience; visible regression.
- **P2** — minor UX, edge cases, rarely hit paths.
- **P3** — defensive, exploratory, low-risk.

Do not gold-plate P3 cases at the expense of missing P0 coverage.

## 10. Maintain traceability

- Every requirement / acceptance criterion maps to **≥ 1** case (forward traceability).
- Every case maps back to a `Source` (backward traceability).
- Maintain a `coverage-matrix.md` linking module/requirement → `TC-*` IDs so gaps are visible.
- When a requirement changes, update or retire the linked cases in the same change.

## 11. Anti-patterns to reject

Refuse to produce cases that:

- Assert "the system works" or "no errors occur" without a specific observable.
- Depend on the order of other cases or shared global state.
- Test the framework, the language, or the mock instead of the product.
- Hard-code today's date, `Math.random()`, or live third-party endpoints without a stub.
- Duplicate another case with only cosmetic wording changes.
- Encode implementation details (CSS class names, private methods, SQL) in a functional case.
- Mix multiple behaviors in one `When`.

## 12. Output and review checklist

Before reporting back, verify:

// turbo
1. Every case has all required schema fields populated.
2. Every `ID` is unique across the test-cases corpus.
3. Every `Source` points to something that actually exists.
4. Each `Title` starts with a verb and describes one behavior.
5. Each `Steps`/`Expected` pair is deterministic and self-validating.
6. Coverage spans happy + negative + boundary + state for each feature.
7. Priorities reflect risk, not authoring effort.
8. No anti-pattern from §11 is present.

Then summarize for the user:

- Requirements covered and any gaps.
- Counts by `Type`, `Priority`, and `Technique`.
- Top P0/P1 cases recommended for automation first.
- Open questions / `TODO: clarify` items needing maintainer input.

## Rules

- Output is **documentation only** — never modify production source code from this workflow.
- Match the repository's existing test-case folder layout, ID scheme, and tone if one exists (e.g. `test-cases/README.md`).
- Prefer extending existing area files over creating new ones; create new files only for genuinely new areas.
- When unsure, ask one focused question instead of guessing.
