# REVIEW.md — Code Review Guide

Standards for reviewing (and self-reviewing) changes to the Weather Dashboard.
Conventions here extend [`AGENTS.md`](AGENTS.md) and the architecture described in
[`README.md`](README.md); where they disagree, `AGENTS.md` wins and this file should be updated.

## 1. Before requesting review

Run everything locally and paste the results in the PR description:

```bash
npm install
npm run lint     # ng lint (ESLint 9 flat config)
npm run build    # ng build — must be warning-free
npm test -- --watch=false --browsers=ChromeHeadless   # only if specs exist for touched code
```

A PR is ready for review when:

- Lint and build are clean — no new warnings, no `eslint-disable` without a one-line justification comment.
- The diff is scoped to the stated goal; unrelated formatting, dependency bumps, and refactors are split out.
- The description explains **why**, links the issue/session, and lists manual verification steps for UI changes (with screenshots for visual work).
- Any behaviour change is reflected in `test-cases/` (see §6) and in the README/AGENTS docs when it changes setup or conventions.

## 2. Review process

- **Reviewer scope**: correctness first, then security, then architecture fit, then style. Style nits are non-blocking — prefix them `nit:`.
- **Severity labels**: `blocker:` (must fix before merge), `question:`, `nit:`. Blockers are bugs, security issues, or convention violations.
- **Author responsibilities**: reply to every comment, push fixes as new commits (never force-push over a review in progress), and re-request review instead of self-merging after changes.
- **Merge criteria**: at least one approval, all conversations resolved, CI/lint/build green, branch up to date with `main`.
- **Commits**: Conventional Commit subjects (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`) — matching existing history. Squash noise before merge.
- **Branches**: short-lived feature branches off `main`; never commit directly to `main`.

## 3. Correctness checklist

Adapted from `.devin/workflows/review.md`:

- [ ] Logic and edge cases: empty city search, zero/negative temperatures, missing forecast slots, midnight/timezone boundaries, unit conversion.
- [ ] Null/undefined safety — OpenWeatherMap fields are optional (`rain`, `snow`, `wind.gust`); never assume presence.
- [ ] No unhandled observable errors: every HTTP stream has `catchError` and a defined fallback (cache → mock).
- [ ] Race conditions: `switchMap` (not `mergeMap`) for location/unit-driven refetches so stale responses cannot overwrite fresh state.
- [ ] Resource management: no manual `.subscribe()` in components — use the `async` pipe; if a subscription is unavoidable, use `takeUntilDestroyed()`.
- [ ] Caching: `localStorage` keys are versioned and namespaced (`weather_dashboard_*`), cache reads are wrapped in `try/catch` (quota/JSON errors, private mode), staleness is surfaced to the user via the stale-data banner, and cache keys include everything the payload depends on (location **and** units).
- [ ] API contracts: raw API responses are mapped into the interfaces in `src/app/models/weather.model.ts` — raw shapes must not leak into components or templates.
- [ ] Pre-existing bugs noticed while reviewing are reported, not silently ignored.

## 4. Architecture & conventions

- [ ] **Standalone components only** — no NgModules.
- [ ] **Angular 17 control flow** (`@if`, `@for`, `@switch`); no `*ngIf`/`*ngFor`. `@for` has a stable `track` expression.
- [ ] **`inject()`** instead of constructor injection.
- [ ] **Smart vs presentational**: only `features/*/…component.ts` container components inject services; presentational components take `@Input()`/emit `@Output()` only.
- [ ] Folder placement respects **core / shared / features**; singletons live in `core/services` with `providedIn: 'root'`.
- [ ] Selectors: components `app-` kebab-case, directives `app` camelCase (enforced by ESLint).
- [ ] Styling via Tailwind utilities and existing design tokens; avoid ad-hoc hex colours and one-off SCSS when a token/utility exists.
- [ ] Public services, non-obvious streams, and models carry short doc comments; comments explain intent, not the diff.

## 5. Linting & typing

- [ ] `npm run lint` clean under `eslint.config.js` (`eslint:recommended`, `typescript-eslint` recommended + stylistic, `@angular-eslint` ts/template recommended, template a11y).
- [ ] **No `any`**, no non-null `!` assertions to silence the compiler, no `as` casts that hide a real shape mismatch; `strict`, `noImplicitReturns`, and `strictTemplates` stay on.
- [ ] Array types written `T[]`, not `Array<T>`.
- [ ] No `console.log` left behind — the deliberate API-key/fallback `console.warn`s are the only expected console output.
- [ ] Template a11y rules satisfied: labels for inputs, alt text/`aria-label` on icon-only controls, keyboard-reachable interactive elements, sufficient contrast in both day and night themes.
- [ ] `.editorconfig` respected; no reformatting of untouched lines.

## 6. Tests & test cases

- [ ] Behaviour changes update or add cases in `test-cases/` using the `TC-<AREA>-<NNN>` scheme, and register them in `index.md` and `coverage-matrix.md` (see `test-cases/README.md`).
- [ ] New/changed services have Karma/Jasmine specs where practical: HTTP calls tested with `HttpTestingController`, streams asserted on emitted values, fallback paths (missing key, network failure, corrupt cache) covered.
- [ ] Tests assert real behaviour — no snapshot-only or tautological assertions, and no production code changed just to make a test pass.

## 7. Security checklist

- [ ] **Secrets**: no real API keys, tokens, or credentials in the diff. `src/environments/environment*.ts` is committed, so it must keep the `YOUR_API_KEY_HERE` placeholder; real keys are supplied locally/at build time and never committed. Reject any PR that adds a live key — the key must be rotated if one lands.
- [ ] Treat the OpenWeatherMap key as public-by-nature in a browser app: keep it restricted/rate-limited, and route it through a backend proxy if it ever gains privileged scope.
- [ ] **No secrets in logs** — never log full request URLs, headers, or the key.
- [ ] **Injection/XSS**: no `innerHTML`, `bypassSecurityTrustHtml`, `eval`, or direct DOM writes with API/user data; render through Angular bindings so sanitization applies.
- [ ] **Untrusted input**: city search strings and API payloads are validated/encoded before use in URLs (`HttpParams`, not string concatenation), and cached JSON is validated after `JSON.parse` before being trusted.
- [ ] **Storage**: only non-sensitive weather data in `localStorage`; no user identifiers, coordinates history, or credentials.
- [ ] **Transport**: HTTPS-only endpoints; no mixed content; no disabling TLS verification.
- [ ] **Privacy**: geolocation is requested only on user-visible action, failures degrade gracefully, and coordinates are not sent anywhere except the weather provider.
- [ ] **Dependencies**: new dependencies are justified, actively maintained, and pinned via `package-lock.json`; prefer versions published at least a week ago; `npm audit` shows no new high/critical findings.
- [ ] No third-party scripts, analytics, or CDN assets added without explicit approval.

## 8. Performance & UX

- [ ] No redundant HTTP calls — the pipeline re-fires only on location, unit, or retry changes; manual search stays debounced.
- [ ] Heavy computation stays out of templates and getters (precompute in the stream/`map`).
- [ ] Loading, error, empty, and stale states all handled visually.
- [ ] Layout verified at mobile and desktop widths, and in both day and night themes.
