import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, retry } from 'rxjs/operators';
import {
  CurrentWeather,
  DailyForecast,
  DailyWeather,
  HourlyForecast,
  HourlyWeather,
  TemperatureUnit,
  WeatherCondition,
} from '../../models/weather.model';
import { environment } from '../../../environments/environment';
import { MOCK_CURRENT_WEATHER, MOCK_DAILY_FORECAST, MOCK_HOURLY_FORECAST } from '../mocks/weather.mock';

const CURRENT_WEATHER_CACHE_KEY = 'weather_dashboard_current';
const HOURLY_FORECAST_CACHE_KEY = 'weather_dashboard_hourly';
const DAILY_FORECAST_CACHE_KEY = 'weather_dashboard_daily';

/**
 * Fetches and caches weather data from the OpenWeatherMap API.
 *
 * Exposes the latest successful result via BehaviorSubjects and
 * localStorage so the UI can show stale data while a fresh request
 * is in flight. Falls back to hardcoded mock data when the API key
 * is missing or the network fails.
 */
@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);

  private currentWeatherCache$ = new BehaviorSubject<CurrentWeather | null>(
    this.loadFromStorage<CurrentWeather>(CURRENT_WEATHER_CACHE_KEY)
  );
  private hourlyForecastCache$ = new BehaviorSubject<HourlyForecast | null>(
    this.loadFromStorage<HourlyForecast>(HOURLY_FORECAST_CACHE_KEY)
  );
  private dailyForecastCache$ = new BehaviorSubject<DailyForecast | null>(
    this.loadFromStorage<DailyForecast>(DAILY_FORECAST_CACHE_KEY)
  );

  /** Observable of the last successfully fetched current weather. */
  cachedCurrentWeather$ = this.currentWeatherCache$.asObservable();
  /** Observable of the last successfully fetched hourly forecast. */
  cachedHourlyForecast$ = this.hourlyForecastCache$.asObservable();
  /** Observable of the last successfully fetched daily forecast. */
  cachedDailyForecast$ = this.dailyForecastCache$.asObservable();

  /**
   * Calls the OpenWeatherMap `/weather` endpoint and maps the raw
   * response to the `CurrentWeather` model.
   *
   * Retries once on transient failure, then falls back to cached
   * data or mock data if the API key is missing.
   */
  getCurrentWeather(lat: number, lon: number, units: TemperatureUnit): Observable<CurrentWeather> {
    if (this.isApiKeyMissing()) {
      console.warn('OpenWeatherMap API key is missing. Returning mock data.');
      return of(MOCK_CURRENT_WEATHER);
    }

    const url = `${environment.openWeatherMapBaseUrl}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${environment.openWeatherMapApiKey}`;
    return this.http.get<OpenWeatherCurrentResponse>(url).pipe(
      retry(1),
      map((res) => this.mapCurrentWeather(res)),
      tap((weather) => {
        this.currentWeatherCache$.next(weather);
        this.saveToStorage(CURRENT_WEATHER_CACHE_KEY, weather);
      }),
      catchError(() => {
        console.warn('Weather API call failed. Falling back to cached/mock data.');
        const cached = this.currentWeatherCache$.getValue();
        return of(cached ?? MOCK_CURRENT_WEATHER);
      })
    );
  }

  /**
   * Calls the OpenWeatherMap `/forecast` endpoint and maps the raw
   * response to the `HourlyForecast` model (next 12 three-hour slots).
   *
   * Retries once on transient failure, then falls back to cached
   * data or mock data.
   */
  getHourlyForecast(lat: number, lon: number, units: TemperatureUnit): Observable<HourlyForecast> {
    if (this.isApiKeyMissing()) {
      console.warn('OpenWeatherMap API key is missing. Returning mock forecast.');
      return of(MOCK_HOURLY_FORECAST);
    }

    const url = `${environment.openWeatherMapBaseUrl}/forecast?lat=${lat}&lon=${lon}&units=${units}&cnt=12&appid=${environment.openWeatherMapApiKey}`;
    return this.http.get<OpenWeatherForecastResponse>(url).pipe(
      retry(1),
      map((res) => this.mapHourlyForecast(res)),
      tap((forecast) => {
        this.hourlyForecastCache$.next(forecast);
        this.saveToStorage(HOURLY_FORECAST_CACHE_KEY, forecast);
      }),
      catchError(() => {
        console.warn('Forecast API call failed. Falling back to cached/mock data.');
        const cached = this.hourlyForecastCache$.getValue();
        return of(cached ?? MOCK_HOURLY_FORECAST);
      })
    );
  }

  /**
   * Fetches the 5-day/3-hour forecast and aggregates it into daily summaries.
   * Each day includes min/max temp, dominant condition, and precipitation chance.
   */
  getDailyForecast(lat: number, lon: number, units: TemperatureUnit): Observable<DailyForecast> {
    if (this.isApiKeyMissing()) {
      console.warn('OpenWeatherMap API key is missing. Returning mock daily forecast.');
      return of(MOCK_DAILY_FORECAST);
    }

    const url = `${environment.openWeatherMapBaseUrl}/forecast?lat=${lat}&lon=${lon}&units=${units}&cnt=40&appid=${environment.openWeatherMapApiKey}`;
    return this.http.get<OpenWeatherForecastResponse>(url).pipe(
      retry(1),
      map((res) => this.mapDailyForecast(res)),
      tap((forecast) => {
        this.dailyForecastCache$.next(forecast);
        this.saveToStorage(DAILY_FORECAST_CACHE_KEY, forecast);
      }),
      catchError(() => {
        console.warn('Daily forecast API call failed. Falling back to cached/mock data.');
        const cached = this.dailyForecastCache$.getValue();
        return of(cached ?? MOCK_DAILY_FORECAST);
      })
    );
  }

  private mapCurrentWeather(res: OpenWeatherCurrentResponse): CurrentWeather {
    return {
      temperature: res.main.temp,
      feelsLike: res.main.feels_like,
      humidity: res.main.humidity,
      windSpeed: res.wind.speed,
      description: res.weather[0]?.description ?? '',
      icon: res.weather[0]?.icon ?? '01d',
      condition: this.mapCondition(res.weather[0]?.main ?? ''),
      sunrise: res.sys.sunrise,
      sunset: res.sys.sunset,
      timestamp: res.dt,
      visibility: res.visibility ?? 10000,
      pressure: res.main.pressure ?? 1013,
      windDeg: res.wind.deg ?? 0,
      cloudiness: res.clouds?.all ?? 0,
    };
  }

  private mapHourlyForecast(res: OpenWeatherForecastResponse): HourlyForecast {
    const hours: HourlyWeather[] = res.list.map((item) => ({
      time: item.dt,
      temperature: item.main.temp,
      icon: item.weather[0]?.icon ?? '01d',
      description: item.weather[0]?.description ?? '',
    }));
    return { hours };
  }

  private mapDailyForecast(res: OpenWeatherForecastResponse): DailyForecast {
    const dayMap = new Map<string, OpenWeatherForecastResponse['list']>();

    for (const item of res.list) {
      const dateKey = new Date(item.dt * 1000).toDateString();
      const existing = dayMap.get(dateKey) ?? [];
      existing.push(item);
      dayMap.set(dateKey, existing);
    }

    const days: DailyWeather[] = [];
    for (const [, items] of dayMap) {
      if (items.length === 0) continue;
      const temps = items.map((i) => i.main.temp);
      const midpoint = items[Math.floor(items.length / 2)];
      days.push({
        date: items[0].dt,
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        icon: midpoint.weather[0]?.icon ?? '01d',
        description: midpoint.weather[0]?.description ?? '',
        condition: this.mapCondition(midpoint.weather[0]?.main ?? ''),
        humidity: Math.round(items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length),
        windSpeed: Math.max(...items.map((i) => i.wind.speed)),
        pop: Math.max(...items.map((i) => i.pop ?? 0)),
      });
    }

    return { days: days.slice(0, 5) };
  }

  private mapCondition(main: string): WeatherCondition {
    const normalized = main.toLowerCase();
    const conditionMap: Record<string, WeatherCondition> = {
      clear: 'clear',
      clouds: 'clouds',
      rain: 'rain',
      drizzle: 'rain',
      snow: 'snow',
      thunderstorm: 'thunderstorm',
      mist: 'mist',
      fog: 'mist',
      haze: 'mist',
      smoke: 'mist',
      dust: 'mist',
      sand: 'mist',
      ash: 'mist',
      squall: 'thunderstorm',
      tornado: 'thunderstorm',
    };
    return conditionMap[normalized] ?? 'clear';
  }

  private isApiKeyMissing(): boolean {
    return (
      !environment.openWeatherMapApiKey ||
      environment.openWeatherMapApiKey === 'YOUR_API_KEY_HERE'
    );
  }

  private saveToStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage may be unavailable
    }
  }

  private loadFromStorage<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  OpenWeatherMap raw response shapes (private to this service)      */
/* ------------------------------------------------------------------ */

interface OpenWeatherCurrentResponse {
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  wind: { speed: number; deg: number };
  weather: { main: string; description: string; icon: string }[];
  sys: { sunrise: number; sunset: number };
  clouds?: { all: number };
  visibility: number;
  dt: number;
}

interface OpenWeatherForecastResponse {
  list: {
    dt: number;
    main: { temp: number; humidity: number };
    weather: { main: string; description: string; icon: string }[];
    wind: { speed: number };
    pop?: number;
  }[];
}
