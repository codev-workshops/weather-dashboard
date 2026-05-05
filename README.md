# Weather Dashboard

A responsive Angular 17 weather dashboard that detects user location via the browser Geolocation API, fetches real-time weather from OpenWeatherMap, and dynamically themes the UI based on weather conditions and time of day.

## Architecture

The project follows the **core / shared / features** pattern with strict separation of smart (container) and presentational components.

```
src/app/
├── core/            # Singleton services and mock data
│   ├── services/
│   │   ├── location.service.ts   — Geolocation + geocoding
│   │   ├── weather.service.ts    — API calls, caching, mapping
│   │   └── theme.service.ts      — Condition/time → CSS class
│   └── mocks/
│       └── weather.mock.ts       — Fallback data when API is unavailable
├── shared/          # Reusable, stateless UI components
│   └── components/
│       ├── loading-spinner/
│       └── error-message/
├── features/        # Feature-scoped smart + presentational components
│   └── weather-dashboard/
│       ├── weather-dashboard.component.ts  (smart/container)
│       └── components/
│           ├── current-weather/            (presentational)
│           ├── hourly-forecast/            (presentational)
│           └── location-display/           (presentational)
├── models/
│   └── weather.model.ts
└── app.component.ts
```

### Smart vs Presentational Components

| Component | Role | Injects services? |
|---|---|---|
| `WeatherDashboardComponent` | **Smart** — orchestrates data flow, manages state | Yes |
| `CurrentWeatherComponent` | **Presentational** — renders current weather card | No |
| `HourlyForecastComponent` | **Presentational** — renders scrollable hourly list | No |
| `LocationDisplayComponent` | **Presentational** — shows city name + search input | No |

## Setup

```bash
npm install
```

Set your OpenWeatherMap API key in `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  openWeatherMapApiKey: 'YOUR_ACTUAL_KEY',
  openWeatherMapBaseUrl: 'https://api.openweathermap.org/data/2.5',
};
```

> If no API key is provided, the app falls back to mock data with a console warning.

Run the dev server:

```bash
ng serve
```

## RxJS Data Flow

```
location$ ─────────────┐
  ├─ detectLocation()   │
  └─ manualCity$ ───────┤
                        ├─ combineLatest([location$, unitSubject, retrySubject])
                        │
                        └─ switchMap → forkJoin({
                              getCurrentWeather(),
                              getHourlyForecast()
                           })
                              │
                              └─ map → WeatherState
                                        │
                                        └─ template via `async` pipe
```

- `location$` merges browser geolocation detection with debounced manual city search.
- `combineLatest` re-fires the entire pipeline when the location, temperature unit, or retry trigger changes.
- `forkJoin` fetches current weather and hourly forecast in parallel.
- The result is mapped to a single `WeatherState` object consumed by the template through the `async` pipe — no manual `.subscribe()` calls.

## Swapping the Weather API

To use a different weather provider:

1. Create a new service that implements the same method signatures as `WeatherService`:
   - `getCurrentWeather(lat, lon, units): Observable<CurrentWeather>`
   - `getHourlyForecast(lat, lon, units): Observable<HourlyForecast>`
2. Map the provider's response to the `CurrentWeather` and `HourlyForecast` interfaces.
3. Register the new service in place of `WeatherService` (or use Angular's DI to swap providers).

## Features

- **Geolocation detection** with fallback to localStorage
- **Manual city search** with 400ms debounce
- **Temperature unit toggle** (°C / °F) — entire pipeline re-fires automatically
- **Dynamic theming** — gradient backgrounds based on weather condition + day/night
- **Stale data banner** — shows cached results when the API is unreachable
- **Mock data fallback** — works without an API key for development/demo

## Linting

```bash
ng lint
```

## Build

```bash
ng build
```
