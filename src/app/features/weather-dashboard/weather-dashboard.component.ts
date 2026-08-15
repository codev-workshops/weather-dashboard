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
  DailyForecast,
  HourlyForecast,
  Location,
  TemperatureUnit,
} from '../../models/weather.model';
import { CurrentWeatherComponent } from './components/current-weather/current-weather.component';
import { HourlyForecastComponent } from './components/hourly-forecast/hourly-forecast.component';
import { LocationDisplayComponent } from './components/location-display/location-display.component';
import { WeatherDetailsComponent } from './components/weather-details/weather-details.component';
import { DailyForecastComponent } from './components/daily-forecast/daily-forecast.component';
import { TemperatureTrendComponent } from './components/temperature-trend/temperature-trend.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';

interface WeatherState {
  loading: boolean;
  error: string | null;
  current: CurrentWeather | null;
  forecast: HourlyForecast | null;
  daily: DailyForecast | null;
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
    WeatherDetailsComponent,
    DailyForecastComponent,
    TemperatureTrendComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
  ],
  template: `
    @if (state$ | async; as state) {
      <div
        [ngClass]="state.themeClass"
        class="min-h-screen p-4 sm:p-8 transition-all duration-700 relative"
      >
        <!-- Grain texture overlay -->
        <div class="grain-overlay"></div>

        <div class="mx-auto max-w-4xl relative z-10">
          <!-- Header -->
          <div class="mb-8 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="interactive interaction-hover p-3 rounded-2xl bg-white/10">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                </svg>
              </div>
              <div>
                <h1 class="fluid-3xl font-bold">Weather Dashboard</h1>
                <p class="text-sm opacity-70">Real-time weather updates</p>
              </div>
            </div>
            <button
              (click)="toggleUnit()"
              class="focus-ring interactive interaction-hover rounded-xl bg-white/20 px-5 py-3 fluid-sm font-semibold transition-all duration-300 hover:bg-white/30 hover:shadow-glow flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
              {{ (unitSubject | async) === 'metric' ? '°C → °F' : '°F → °C' }}
            </button>
          </div>

          <!-- Stale data banner -->
          @if (state.stale) {
            <div class="mb-6 glass-card bg-amber-500/20 border-amber-500/30 p-4 text-center fluid-sm flex items-center justify-center gap-2">
              <svg class="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              Showing cached data. Live update failed.
            </div>
          }

          <!-- Location + search (always show search when no location so user can type a city) -->
          <app-location-display
            [location]="state.location!"
            (citySearch)="onCitySearch($event)"
          />

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

          @if (state.forecast) {
            <app-temperature-trend
              [forecast]="state.forecast"
              [unit]="(unitSubject | async) ?? 'metric'"
            />
          }

          @if (state.current) {
            <app-weather-details
              [weather]="state.current"
              [unit]="(unitSubject | async) ?? 'metric'"
            />
          }

          @if (state.daily) {
            <app-daily-forecast
              [forecast]="state.daily"
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
    const PENDING = Symbol('pending');
    type MaybeLocation = Location | null | typeof PENDING;

    const location$ = merge(
      this.locationService.detectLocation().pipe(
        catchError(() => of(null))
      ),
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
      location$.pipe(startWith(PENDING as MaybeLocation)),
      this.unitSubject,
      this.retrySubject.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([loc, units]) => {
        if (loc === PENDING) {
          return of<WeatherState>({
            loading: true,
            error: null,
            current: null,
            forecast: null,
            daily: null,
            location: null,
            themeClass: 'theme-clear-day',
            stale: false,
          });
        }
        if (!loc) {
          return of<WeatherState>({
            loading: false,
            error: 'Could not detect your location. Please search for a city.',
            current: null,
            forecast: null,
            daily: null,
            location: null,
            themeClass: 'theme-clear-day',
            stale: false,
          });
        }

        return forkJoin({
          current: this.weatherService.getCurrentWeather(loc.latitude, loc.longitude, units),
          forecast: this.weatherService.getHourlyForecast(loc.latitude, loc.longitude, units),
          daily: this.weatherService.getDailyForecast(loc.latitude, loc.longitude, units),
        }).pipe(
          map(
            ({ current, forecast, daily }): WeatherState => ({
              loading: false,
              error: null,
              current,
              forecast,
              daily,
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
            daily: null,
            location: loc,
            themeClass: 'theme-clear-day',
            stale: false,
          }),
          catchError((err: unknown) => {
            const message =
              err instanceof Error ? err.message : 'Failed to fetch weather data.';
            const cachedCurrent = this.weatherService['currentWeatherCache$'].getValue();
            const cachedForecast = this.weatherService['hourlyForecastCache$'].getValue();
            const cachedDaily = this.weatherService['dailyForecastCache$'].getValue();
            return of<WeatherState>({
              loading: false,
              error: message,
              current: cachedCurrent,
              forecast: cachedForecast,
              daily: cachedDaily,
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
