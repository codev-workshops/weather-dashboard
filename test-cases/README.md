# Weather Dashboard — Functional Test-Case Suite

This directory contains **black-box functional test cases** for the Angular 17
Weather Dashboard. Cases are documentation-only; they describe **what** the
system must do, not **how** it is implemented.

## How the suite is organized

```
test-cases/
  README.md              ← you are here
  index.md               ← flat list of all TC IDs
  coverage-matrix.md     ← requirement ↔ TC traceability
  services/              ← LocationService, WeatherService, ThemeService
  components/            ← Smart + presentational components
  cross-cutting/         ← theming, units, caching, a11y
  configuration/         ← environment files, API key handling
  e2e/                   ← end-to-end user flows
```

## ID scheme

`TC-<AREA>-<NNN>` — globally unique across the suite.

| Area prefix | Meaning |
|---|---|
| `TC-LOC-*`   | `LocationService` |
| `TC-WX-*`    | `WeatherService` |
| `TC-THEME-*` | `ThemeService` |
| `TC-DASH-*`  | `WeatherDashboardComponent` (smart) |
| `TC-CW-*`    | `CurrentWeatherComponent` |
| `TC-HF-*`    | `HourlyForecastComponent` |
| `TC-LD-*`    | `LocationDisplayComponent` |
| `TC-LS-*`    | `LoadingSpinnerComponent` |
| `TC-EM-*`    | `ErrorMessageComponent` |
| `TC-CC-*`    | Cross-cutting (theming, units, caching, a11y) |
| `TC-CFG-*`   | Build-time configuration / environments |
| `TC-E2E-*`   | End-to-end user flows |

## Schema (per case)

Every case contains: `ID`, `Title`, `Area / Module`, `Type`, `Technique`,
`Priority`, `Preconditions`, `Steps` (Given/When/Then), `Test Data`,
`Expected Result`, `Source`, `Automation`.

See `.windsurf/workflows/write-functional-test-cases.md` for authoring rules.

## Priorities

- **P0** — blocks core value: location detection, weather rendering, fallback.
- **P1** — visible regression: unit toggle, search, theming, stale banner.
- **P2** — minor UX or rare paths.
- **P3** — defensive / `TODO: clarify`.

## Running existing tests

This repository ships with no Angular spec files yet. To sanity-check the build:

```bash
npm install
ng lint
ng build
```

When unit tests are added, recommended commands:

```bash
ng test --watch=false --browsers=ChromeHeadless
```

## Contributing a new case

1. Pick the correct area file; if no file fits, create one and register the
   prefix in this README.
2. Use the next free `NNN` for the area (see `index.md`).
3. Add the case to `index.md` and `coverage-matrix.md` in the same change.
4. Cite a real `Source` (file path + symbol or doc section).
