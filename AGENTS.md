# AGENTS.md — Weather Dashboard

## Build & Lint

```bash
npm install
ng build          # production build
ng serve          # dev server on http://localhost:4200
ng lint           # ESLint via @angular-eslint
```

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

## Environment Files

- `src/environments/environment.ts` — development
- `src/environments/environment.prod.ts` — production (swapped via `fileReplacements` in `angular.json`)
