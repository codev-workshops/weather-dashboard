import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  merge,
  of,
  forkJoin,
} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  startWith,
  tap,
} from 'rxjs/operators';
import { LocationService } from '../../core/services/location.service';
import { WeatherService } from '../../core/services/weather.service';
import { ThemeService } from '../../core/services/theme.service';
import {
  CurrentWeather,
  HourlyForecast,
  Location,
  TemperatureUnit,
} from '../../models/weather.model';
import { CurrentWeatherComponent } from './components/current-weather/current-weather.component';
import { HourlyForecastComponent } from './components/hourly-forecast/hourly-forecast.component';
import { LocationDisplayComponent } from './components/location-display/location-display.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';

interface WeatherState {
  loading: boolean;
  error: string | null;
  current: CurrentWeather | null;
  forecast: HourlyForecast | null;
  location: Location | null;
  themeClass: string;
  stale: boolean;
}

/**
 * Smart / container component that orchestrates the entire weather dashboard.
 *
 * Reactive pipeline:
 *   location$ (browser geolocation | manual city search)
 *     → combineLatest with unitSubject
 *       → switchMap to forkJoin(currentWeather$, hourlyForecast$)
 *         → map to WeatherState
 *           → template renders via async pipe
 *
 * All data flows are declarative. No manual `.subscribe()` calls.
 */
@Component({
  selector: 'app-weather-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CurrentWeatherComponent,
    HourlyForecastComponent,
    LocationDisplayComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
  ],
  template: `
    @if (state$ | async; as state) {
      <div
        [ngClass]="state.themeClass"
        class="min-h-screen p-4 transition-all duration-700 sm:p-8"
      >
        <div class="mx-auto max-w-3xl">
          <!-- Header -->
          <div class="mb-6 flex items-center justify-between">
            <h1 class="text-3xl font-bold">Weather Dashboard</h1>
            <button
              (click)="toggleUnit()"
              class="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30"
            >
              {{ (unitSubject | async) === 'metric' ? '°C → °F' : '°F → °C' }}
            </button>
          </div>

          <!-- Stale data banner -->
          @if (state.stale) {
            <div class="mb-4 rounded-lg bg-yellow-500/20 p-3 text-center text-sm">
              Showing cached data. Live update failed.
            </div>
          }

          <!-- Location + search -->
          @if (state.location) {
            <app-location-display
              [location]="state.location"
              (citySearch)="onCitySearch($event)"
            />
          }

          <!-- Loading -->
          @if (state.loading) {
            <app-loading-spinner />
          }

          <!-- Error -->
          @if (state.error && !state.current) {
            <app-error-message
              [message]="state.error"
              (retry)="retrySubject.next()"
            />
          }

          <!-- Weather data -->
          @if (state.current) {
            <app-current-weather
              [weather]="state.current"
              [unit]="(unitSubject | async) ?? 'metric'"
            />
          }

          @if (state.forecast) {
            <app-hourly-forecast
              [forecast]="state.forecast"
              [unit]="(unitSubject | async) ?? 'metric'"
            />
          }
        </div>
      </div>
    }
  `,
})
export class WeatherDashboardComponent implements OnInit {
  private locationService = inject(LocationService);
  private weatherService = inject(WeatherService);
  private themeService = inject(ThemeService);

  unitSubject = new BehaviorSubject<TemperatureUnit>('metric');
  retrySubject = new Subject<void>();

  private manualCity$ = new Subject<string>();

  state$!: ReturnType<typeof this.buildStatePipeline>;

  ngOnInit(): void {
    this.state$ = this.buildStatePipeline();
  }

  onCitySearch(query: string): void {
    this.manualCity$.next(query);
  }

  toggleUnit(): void {
    const next = this.unitSubject.getValue() === 'metric' ? 'imperial' : 'metric';
    this.unitSubject.next(next);
  }

  /**
   * Constructs the main reactive pipeline.
   *
   * 1. `location$` merges browser geolocation with debounced city search.
   * 2. `combineLatest([location$, unit$, retry$])` triggers a fresh fetch
   *    whenever any input changes.
   * 3. `switchMap` fans out to `forkJoin` for current + forecast in parallel.
   * 4. Results are mapped to a `WeatherState` consumed by the template.
   */
  private buildStatePipeline() {
    const location$ = merge(
      this.locationService.detectLocation(),
      this.manualCity$.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        filter((q) => q.trim().length > 0),
        switchMap((city) =>
          this.locationService.searchCity(city).pipe(
            catchError(() => of(null))
          )
        ),
        filter((loc): loc is Location => loc !== null)
      )
    ).pipe(shareReplay(1));

    return combineLatest([
      location$.pipe(startWith(null)),
      this.unitSubject,
      this.retrySubject.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([loc, units]) => {
        if (!loc) {
          return of<WeatherState>({
            loading: true,
            error: null,
            current: null,
            forecast: null,
            location: null,
            themeClass: 'theme-clear-day',
            stale: false,
          });
        }

        return forkJoin({
          current: this.weatherService.getCurrentWeather(loc.latitude, loc.longitude, units),
          forecast: this.weatherService.getHourlyForecast(loc.latitude, loc.longitude, units),
        }).pipe(
          map(
            ({ current, forecast }): WeatherState => ({
              loading: false,
              error: null,
              current,
              forecast,
              location: loc,
              themeClass: this.themeService.getThemeClass(
                current.condition,
                current.sunrise,
                current.sunset
              ),
              stale: false,
            })
          ),
          startWith<WeatherState>({
            loading: true,
            error: null,
            current: null,
            forecast: null,
            location: loc,
            themeClass: 'theme-clear-day',
            stale: false,
          }),
          catchError((err: unknown) => {
            const message =
              err instanceof Error ? err.message : 'Failed to fetch weather data.';
            const cachedCurrent = this.weatherService['currentWeatherCache$'].getValue();
            const cachedForecast = this.weatherService['hourlyForecastCache$'].getValue();
            return of<WeatherState>({
              loading: false,
              error: message,
              current: cachedCurrent,
              forecast: cachedForecast,
              location: loc,
              themeClass: cachedCurrent
                ? this.themeService.getThemeClass(
                    cachedCurrent.condition,
                    cachedCurrent.sunrise,
                    cachedCurrent.sunset
                  )
                : 'theme-clear-day',
              stale: cachedCurrent !== null,
            });
          })
        );
      }),
      tap((state) => {
        if (state.stale) {
          console.warn('Displaying stale cached weather data.');
        }
      })
    );
  }
}
