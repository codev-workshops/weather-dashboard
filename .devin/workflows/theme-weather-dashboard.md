---
description: Change the weather dashboard color theme to any Tailwind color family
---

# Theme the Weather Dashboard

This workflow converts the dashboard's weather-condition gradients and accent colors to a new Tailwind color family (e.g. blue, purple, orange, pink, etc.).

## Input

The user provides a **target color family** — any Tailwind v3 palette name such as `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`.

## What gets changed

1. **`src/styles.scss`** — 12 `.theme-*` gradient classes
2. **`src/app/shared/components/error-message/error-message.component.ts`** — warning background + icon color
3. **`src/app/features/weather-dashboard/weather-dashboard.component.ts`** — stale-data banner background

## Mapping strategy

Use Tailwind hex values (v3 palette) and follow this mapping table for the 12 gradient declarations. Each weather condition gets a distinct position within the color family so conditions remain visually distinguishable.

| CSS class | Role | Tailwind tokens | Hex pair (day) | Hex pair (night) |
|---|---|---|---|---|
| `.theme-clear-day` | Bright, vibrant | `{family}-400 → {family}-600` | Use family-400, family-600 | — |
| `.theme-clear-night` | Deepest dark | `{family}-900 → {family}-950` | — | family-900, family-950, (neighboring family)-950 |
| `.theme-clouds-day` | Muted / overcast | `{family}-300 → {family}-600` | family-300, family-600 | — |
| `.theme-clouds-night` | Muted dark | `{family}-800 → {family}-950` | — | family-800, family-950 |
| `.theme-rain-day` | Cool / wet shift | Blend adjacent cool family | e.g. cyan-500 + teal-700 for "blue" | — |
| `.theme-rain-night` | Deep wet | `{family}-900 → {family}-950` | — | family-900, family-950 |
| `.theme-snow-day` | Light / crisp | Lightest tint + mid | `{lightest-family}-200 → {family}-400` | — |
| `.theme-snow-night` | Cold deep | `{family}-700 → {family}-900` | — | family-700, family-900 |
| `.theme-thunderstorm-day` | Heavy / dark | `{family}-700 → {family}-900` | family-700, family-900 | — |
| `.theme-thunderstorm-night` | Darkest | `{family}-950 blend` | — | family-950, family-950, neighboring-950 |
| `.theme-mist-day` | Foggy / soft | `{family}-300 → {family}-500` | family-300, family-500 | — |
| `.theme-mist-night` | Fog dark | `{family}-900 → neighboring-900` | — | family-900, neighboring-900 |

### `color: white` rule

- Add `color: white` for **night** variants and **day** variants where the gradient is dark enough (700+ stops).
- **Omit** `color: white` for light day variants (stops 500 and below, e.g. clear-day, snow-day, mist-day) so text remains dark for contrast.

### Accent colors

The warning/error accents should stay semantically "alert" but harmonize with the theme. Pick from these based on the target family:

- Warm themes (red, orange, amber, yellow, rose, pink): keep `amber-500/*` or `yellow-500/*`
- Cool themes (blue, indigo, sky, cyan, teal, emerald, green, lime, purple, violet, fuchsia): use `amber-500/*` (universal warning) or a warm accent like `orange-500/*`
- Neutral themes (slate/gray/stone): use `amber-500/*`

Current accent locations:
- `error-message.component.ts`: `bg-{accent}-500/30`, `text-{accent}-100`
- `weather-dashboard.component.ts` stale banner: `bg-{accent}-500/20`

## Steps

1. **Read current files**
   - `src/styles.scss`
   - `src/app/shared/components/error-message/error-message.component.ts`
   - `src/app/features/weather-dashboard/weather-dashboard.component.ts`

2. **Pick hex values** from the Tailwind v3 palette for the target color family. Use the mapping table above.

3. **Rewrite gradients** in `src/styles.scss`:
   - Replace all 12 `linear-gradient` declarations.
   - Preserve `color: white` only on dark variants.

4. **Update accent colors** in the two component files to the chosen alert accent.

5. **Build** with `ng build` to verify no compile errors.

6. **Visual verification** (optional but recommended):
   - `ng serve`
   - Use Playwright MCP to screenshot each weather theme by toggling the CSS class on `app-weather-dashboard > div`:
     ```js
     // Example: toggle to rain-day
     const el = document.querySelector('app-weather-dashboard > div');
     Array.from(el.classList).filter(c => c.startsWith('theme-')).forEach(c => el.classList.remove(c));
     el.classList.add('theme-rain-day');
     ```
   - Capture screenshots for at least: clear-day, clear-night, one intermediate day, and one dark night.

## Reference: Tailwind v3 hex values (selected families)

| Token | Blue | Indigo | Violet | Purple | Fuchsia | Pink | Rose | Red | Orange | Amber | Yellow | Lime | Green | Emerald | Teal | Cyan | Sky |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `*-200` | `#bfdbfe` | `#c7d2fe` | `#ddd6fe` | `#e9d5ff` | `#f5d0fe` | `#fbcfe8` | `#fecdd3` | `#fecaca` | `#fed7aa` | `#fde68a` | `#fef08a` | `#d9f99d` | `#bbf7d0` | `#a7f3d0` | `#99f6e4` | `#a5f3fc` | `#bae6fd` |
| `*-300` | `#93c5fd` | `#a5b4fc` | `#c4b5fd` | `#d8b4fe` | `#f0abfc` | `#f9a8d4` | `#fda4af` | `#fca5a5` | `#fdba74` | `#fcd34d` | `#fde047` | `#bef264` | `#86efac` | `#6ee7b7` | `#5eead4` | `#67e8f9` | `#7dd3fc` |
| `*-400` | `#60a5fa` | `#818cf8` | `#a78bfa` | `#c084fc` | `#e879f9` | `#f472b6` | `#fb7185` | `#f87171` | `#fb923c` | `#fbbf24` | `#facc15` | `#a3e635` | `#4ade80` | `#34d399` | `#2dd4bf` | `#22d3ee` | `#38bdf8` |
| `*-500` | `#3b82f6` | `#6366f1` | `#8b5cf6` | `#a855f7` | `#d946ef` | `#ec4899` | `#f43f5e` | `#ef4444` | `#f97316` | `#f59e0b` | `#eab308` | `#84cc16` | `#22c55e` | `#10b981` | `#14b8a6` | `#06b6d4` | `#0ea5e9` |
| `*-600` | `#2563eb` | `#4f46e5` | `#7c3aed` | `#9333ea` | `#c026d3` | `#db2777` | `#e11d48` | `#dc2626` | `#ea580c` | `#d97706` | `#ca8a04` | `#65a30d` | `#16a34a` | `#059669` | `#0d9488` | `#0891b2` | `#0284c7` |
| `*-700` | `#1d4ed8` | `#4338ca` | `#6d28d9` | `#7e22ce` | `#a21caf` | `#be185d` | `#be123c` | `#b91c1c` | `#c2410c` | `#b45309` | `#a16207` | `#4d7c0f` | `#15803d` | `#047857` | `#0f766e` | `#0e7490` | `#0369a1` |
| `*-800` | `#1e40af` | `#3730a3` | `#5b21b6` | `#6b21a8` | `#86198f` | `#9d174d` | `#9f1239` | `#991b1b` | `#9a3412` | `#92400e` | `#854d0e` | `#3f6212` | `#166534` | `#065f46` | `#115e59` | `#155e75` | `#075985` |
| `*-900` | `#1e3a8a` | `#312e81` | `#4c1d95` | `#581c87` | `#701a75` | `#831843` | `#881337` | `#7f1d1d` | `#7c2d12` | `#78350f` | `#713f12` | `#3f6212` | `#14532d` | `#064e3b` | `#134e4a` | `#164e63` | `#0c4a6e` |
| `*-950` | `#172554` | `#1e1b4b` | `#2e1065` | `#3b0764` | `#4a044e` | `#500724` | `#4c0519` | `#450a0a` | `#431407` | `#451a03` | `#422006` | `#1a2e05` | `#052e16` | `#022c22` | `#042f2e` | `#083344` | `#082f49` |

> For values not in the table, consult the [Tailwind CSS color palette](https://tailwindcss.com/docs/customizing-colors).

## Example: "blue" theme

```scss
/* Clear */
.theme-clear-day {
  background: linear-gradient(135deg, #60a5fa, #2563eb);
}
.theme-clear-night {
  background: linear-gradient(135deg, #1e3a8a, #172554, #0c4a6e);
  color: white;
}

/* Clouds */
.theme-clouds-day {
  background: linear-gradient(135deg, #93c5fd, #2563eb);
  color: white;
}
.theme-clouds-night {
  background: linear-gradient(135deg, #1e40af, #172554);
  color: white;
}

/* Rain */
.theme-rain-day {
  background: linear-gradient(135deg, #38bdf8, #0d9488);
  color: white;
}
.theme-rain-night {
  background: linear-gradient(135deg, #164e63, #172554);
  color: white;
}

/* Snow */
.theme-snow-day {
  background: linear-gradient(135deg, #bae6fd, #60a5fa);
}
.theme-snow-night {
  background: linear-gradient(135deg, #047857, #1e3a8a);
  color: white;
}

/* Thunderstorm */
.theme-thunderstorm-day {
  background: linear-gradient(135deg, #1d4ed8, #1e3a8a);
  color: white;
}
.theme-thunderstorm-night {
  background: linear-gradient(135deg, #172554, #1e1b4b, #0c4a6e);
  color: white;
}

/* Mist / Fog / Haze */
.theme-mist-day {
  background: linear-gradient(135deg, #7dd3fc, #3b82f6);
}
.theme-mist-night {
  background: linear-gradient(135deg, #1e3a8a, #164e63);
  color: white;
}
```
