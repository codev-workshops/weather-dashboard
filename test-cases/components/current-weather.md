# CurrentWeatherComponent — Functional Test Cases

Source: `src/app/features/weather-dashboard/components/current-weather/current-weather.component.ts`

Pure presentational. Renders a card from a `CurrentWeather` `@Input` and a
`TemperatureUnit` `@Input` (default `"metric"`). The whole card is hidden when
`weather` is falsy.

---

## TC-CW-001 — Render rounded temperature with the metric suffix

| Field | Value |
|---|---|
| Area / Module | `CurrentWeatherComponent` template |
| Type | unit |
| Technique | Use-Case |
| Priority | P0 |
| Preconditions | TestBed renders the component with `weather = { temperature: 22.6, ... }`, `unit = "metric"`. |
| Steps | **When** the component renders **Then** the temperature node displays the rounded value with `°C`. |
| Test Data | temperature = `22.6`, unit = `"metric"` |
| Expected Result | The `.text-6xl` element's text content is `"23°C"`. |
| Source | `current-weather.component.ts:25-27` |
| Automation | candidate |

## TC-CW-002 — Render imperial unit suffix when `unit="imperial"`

| Field | Value |
|---|---|
| Area / Module | `CurrentWeatherComponent` template |
| Type | unit |
| Technique | EP (units) |
| Priority | P0 |
| Preconditions | `weather.temperature = 75.4`, `unit = "imperial"`. |
| Steps | **When** the component renders **Then** the temperature uses `°F`. |
| Test Data | temperature = `75.4`, unit = `"imperial"` |
| Expected Result | Temperature node text equals `"75°F"`; "Feels like" node ends with `°F`; wind unit is `mph`. |
| Source | `current-weather.component.ts:25-47` |
| Automation | candidate |

## TC-CW-003 — Render rounded "Feels like" with the unit suffix

| Field | Value |
|---|---|
| Area / Module | `CurrentWeatherComponent` template |
| Type | unit |
| Technique | BVA (rounding) |
| Priority | P1 |
| Preconditions | `weather.feelsLike = 19.4`, `unit = "metric"`. |
| Steps | **When** the component renders **Then** the "Feels like" element shows the rounded value. |
| Test Data | feelsLike = `19.4` |
| Expected Result | "Feels like" element text equals `"19°C"` (per `'1.0-0'`). |
| Source | `current-weather.component.ts:34-37` |
| Automation | candidate |

## TC-CW-004 — Render humidity as a whole percentage

| Field | Value |
|---|---|
| Area / Module | `CurrentWeatherComponent` template |
| Type | unit |
| Technique | Use-Case |
| Priority | P2 |
| Preconditions | `weather.humidity = 55`. |
| Steps | **When** the component renders **Then** the humidity element shows `"55%"`. |
| Test Data | humidity = `55` |
| Expected Result | Humidity element text equals `"55%"`. |
| Source | `current-weather.component.ts:39-42` |
| Automation | candidate |

## TC-CW-005 — Render wind speed with one decimal and unit-aware suffix

| Field | Value |
|---|---|
| Area / Module | `CurrentWeatherComponent` template |
| Type | unit |
| Technique | BVA |
| Priority | P2 |
| Preconditions | `weather.windSpeed = 3.55`, `unit = "metric"`. |
| Steps | **When** the component renders **Then** the wind element formats the value with one decimal. |
| Test Data | windSpeed = `3.55` |
| Expected Result | Wind element text equals `"3.6 m/s"` (per `'1.0-1'`); when `unit="imperial"` the suffix becomes `"mph"`. |
| Source | `current-weather.component.ts:43-48` |
| Automation | candidate |

## TC-CW-006 — Build the icon URL from `weather.icon`

| Field | Value |
|---|---|
| Area / Module | `CurrentWeatherComponent` template |
| Type | unit |
| Technique | Use-Case |
| Priority | P1 |
| Preconditions | `weather.icon = "10d"`, `weather.description = "light rain"`. |
| Steps | **When** the component renders **Then** the `<img>` `src` and `alt` are derived. |
| Test Data | icon = `"10d"` |
| Expected Result | `img.src` equals `"https://openweathermap.org/img/wn/10d@2x.png"`; `img.alt` equals `"light rain"`. |
| Source | `current-weather.component.ts:21-24` |
| Automation | candidate |

## TC-CW-007 — Capitalize description only via CSS, not the raw string

| Field | Value |
|---|---|
| Area / Module | `CurrentWeatherComponent` template |
| Type | accessibility |
| Technique | Use-Case |
| Priority | P3 |
| Preconditions | `weather.description = "light rain"`. |
| Steps | **When** the component renders **Then** the description element keeps the raw text. |
| Test Data | description = `"light rain"` |
| Expected Result | The text node content equals `"light rain"` (case preserved); the element has the `capitalize` Tailwind class so screen readers receive the raw string while sighted users see capitalized text. |
| Source | `current-weather.component.ts:29` |
| Automation | candidate |

## TC-CW-008 — Format the "Updated" timestamp using the user's locale

| Field | Value |
|---|---|
| Area / Module | `CurrentWeatherComponent` template |
| Type | unit |
| Technique | BVA (timestamp boundary) |
| Priority | P2 |
| Preconditions | `weather.timestamp = 1700020800` (epoch seconds = 2023-11-15 04:40:00 UTC); test bed forces locale `"en-US"` and timezone `"UTC"`. |
| Steps | **When** the component renders **Then** the "Updated" element renders the time in short form. |
| Test Data | timestamp = `1700020800` |
| Expected Result | "Updated" element text equals `"4:40 AM"`. |
| Source | `current-weather.component.ts:50-53` |
| Automation | candidate |

## TC-CW-009 — Render nothing when `weather` is null/undefined

| Field | Value |
|---|---|
| Area / Module | `CurrentWeatherComponent` template |
| Type | unit |
| Technique | BVA (null) |
| Priority | P1 |
| Preconditions | The component is created without setting `weather`. |
| Steps | **When** change detection runs **Then** no card is rendered. |
| Test Data | `weather = undefined` |
| Expected Result | The host element has no children that match `.rounded-2xl`. |
| Source | `current-weather.component.ts:15-58` |
| Automation | candidate |

## TC-CW-010 — Default the unit to metric when `unit` input is omitted

| Field | Value |
|---|---|
| Area / Module | `CurrentWeatherComponent.unit` default |
| Type | unit |
| Technique | EP (default) |
| Priority | P2 |
| Preconditions | Component is bound only with `weather`. |
| Steps | **When** the template renders **Then** all temperature/wind suffixes use the metric forms. |
| Test Data | `unit` not provided |
| Expected Result | Temperature suffix is `°C`; wind suffix is `m/s`. |
| Source | `current-weather.component.ts:63` |
| Automation | candidate |
