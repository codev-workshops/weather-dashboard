# AGENTS.md — Weather Dashboard

## Build & Lint

```bash
npm install
ng build          # production build
ng serve          # dev server on http://localhost:4200
ng lint           # ESLint via @angular-eslint
npm test -- --watch=false --browsers=ChromeHeadless   # Karma/Jasmine unit tests
```

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, `npm run lint`,
`npm run build`, and the headless test suite on every push and pull request.

## Conventions

- **Angular 17 standalone components** — no NgModules.
- **Angular 17 control flow** — use `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`.
- **`inject()` function** — prefer `inject(Service)` over constructor injection.
- **Strict TypeScript** — no `any` types; `strict: true` in `tsconfig.json`.
- **Tailwind CSS** for styling — configured via `tailwind.config.js`.
- **Core / Shared / Features** folder structure.
- **Smart vs Presentational** component pattern — only smart components inject services.
- **RxJS `async` pipe** in templates — no manual `.subscribe()`.
- Array types use `T[]` syntax, not `Array<T>`.
- **Unit tests** — Jasmine specs as `*.spec.ts` beside the source file; mock HTTP
  with `HttpClientTestingModule` / `HttpTestingController` and never call the live
  OpenWeatherMap API. Specs that need the HTTP path (rather than the mock-data
  fallback) temporarily override `environment.openWeatherMapApiKey` and restore it
  in `afterEach`. Reference the matching `test-cases/` IDs (e.g. `TC-WX-001`) in
  spec titles.

## Environment Files

- `src/environments/environment.ts` — development
- `src/environments/environment.prod.ts` — production (swapped via `fileReplacements` in `angular.json`)
