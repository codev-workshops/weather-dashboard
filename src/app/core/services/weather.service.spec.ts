import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { WeatherService } from './weather.service';
import {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  WeatherCondition,
} from '../../models/weather.model';
import { environment } from '../../../environments/environment';
import {
  MOCK_CURRENT_WEATHER,
  MOCK_DAILY_FORECAST,
  MOCK_HOURLY_FORECAST,
} from '../mocks/weather.mock';

const CURRENT_KEY = 'weather_dashboard_current';
const HOURLY_KEY = 'weather_dashboard_hourly';
const DAILY_KEY = 'weather_dashboard_daily';
const BASE_URL = environment.openWeatherMapBaseUrl;
const TEST_API_KEY = 'test-api-key';

const RAW_CURRENT = {
  main: { temp: 18.4, feels_like: 17.2, humidity: 72, pressure: 1008 },
  wind: { speed: 4.1, deg: 270 },
  weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }],
  sys: { sunrise: 1_700_000_000, sunset: 1_700_040_000 },
  clouds: { all: 75 },
  visibility: 8000,
  dt: 1_700_020_000,
};

function localSeconds(year: number, month: number, day: number, hour: number): number {
  return Math.floor(new Date(year, month, day, hour).getTime() / 1000);
}

function forecastItem(
  dt: number,
  temp: number,
  main = 'Clear',
  opts: { humidity?: number; speed?: number; pop?: number; icon?: string; description?: string } = {}
) {
  return {
    dt,
    main: { temp, humidity: opts.humidity ?? 50 },
    weather: [{ main, description: opts.description ?? main.toLowerCase(), icon: opts.icon ?? '01d' }],
    wind: { speed: opts.speed ?? 1 },
    pop: opts.pop,
  };
}

function isUrl(path: string) {
  return (req: { url: string }) => req.url.startsWith(`${BASE_URL}${path}?`);
}

describe('WeatherService', () => {
  let httpTesting: HttpTestingController;
  let originalApiKey: string;

  function createService(): WeatherService {
    const service = TestBed.inject(WeatherService);
    httpTesting = TestBed.inject(HttpTestingController);
    return service;
  }

  function failTwice(path: string): void {
    // retry(1) means two attempts before falling back.
    for (let i = 0; i < 2; i++) {
      httpTesting
        .expectOne(isUrl(path))
        .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    }
  }

  beforeEach(() => {
    originalApiKey = environment.openWeatherMapApiKey;
    environment.openWeatherMapApiKey = TEST_API_KEY;
    [CURRENT_KEY, HOURLY_KEY, DAILY_KEY].forEach((k) => localStorage.removeItem(k));
    spyOn(console, 'warn');

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    httpTesting?.verify();
    environment.openWeatherMapApiKey = originalApiKey;
    [CURRENT_KEY, HOURLY_KEY, DAILY_KEY].forEach((k) => localStorage.removeItem(k));
  });

  describe('when the API key is missing', () => {
    for (const key of ['', 'YOUR_API_KEY_HERE']) {
      it(`returns mock data without HTTP calls (key=${JSON.stringify(key)})`, () => {
        environment.openWeatherMapApiKey = key;
        const service = createService();
        const results: unknown[] = [];

        service.getCurrentWeather(1, 2, 'metric').subscribe((r) => results.push(r));
        service.getHourlyForecast(1, 2, 'metric').subscribe((r) => results.push(r));
        service.getDailyForecast(1, 2, 'metric').subscribe((r) => results.push(r));

        expect(results).toEqual([MOCK_CURRENT_WEATHER, MOCK_HOURLY_FORECAST, MOCK_DAILY_FORECAST]);
        httpTesting.expectNone(() => true);
        expect(console.warn).toHaveBeenCalledTimes(3);
      });
    }
  });

  describe('cache hydration', () => {
    it('starts with null caches when storage is empty', () => {
      const service = createService();
      const values: unknown[] = [];
      service.cachedCurrentWeather$.subscribe((v) => values.push(v));
      service.cachedHourlyForecast$.subscribe((v) => values.push(v));
      service.cachedDailyForecast$.subscribe((v) => values.push(v));
      expect(values).toEqual([null, null, null]);
    });

    it('hydrates caches from localStorage on construction', () => {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(MOCK_CURRENT_WEATHER));
      localStorage.setItem(HOURLY_KEY, JSON.stringify(MOCK_HOURLY_FORECAST));
      localStorage.setItem(DAILY_KEY, JSON.stringify(MOCK_DAILY_FORECAST));
      const service = createService();

      let current: CurrentWeather | null | undefined;
      let hourly: HourlyForecast | null | undefined;
      let daily: DailyForecast | null | undefined;
      service.cachedCurrentWeather$.subscribe((v) => (current = v));
      service.cachedHourlyForecast$.subscribe((v) => (hourly = v));
      service.cachedDailyForecast$.subscribe((v) => (daily = v));

      expect(current).toEqual(MOCK_CURRENT_WEATHER);
      expect(hourly).toEqual(MOCK_HOURLY_FORECAST);
      expect(daily).toEqual(MOCK_DAILY_FORECAST);
    });

    it('ignores corrupt JSON in storage', () => {
      localStorage.setItem(CURRENT_KEY, '{bad json');
      const service = createService();
      let current: CurrentWeather | null | undefined;
      service.cachedCurrentWeather$.subscribe((v) => (current = v));
      expect(current).toBeNull();
    });

    it('handles localStorage.getItem throwing', () => {
      spyOn(Storage.prototype, 'getItem').and.throwError('SecurityError');
      const service = createService();
      let current: CurrentWeather | null | undefined;
      service.cachedCurrentWeather$.subscribe((v) => (current = v));
      expect(current).toBeNull();
    });
  });

  describe('getCurrentWeather()', () => {
    it('requests the /weather endpoint with coords, units and API key', () => {
      const service = createService();
      service.getCurrentWeather(51.5, -0.12, 'imperial').subscribe();

      const req = httpTesting.expectOne(isUrl('/weather'));
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(
        `${BASE_URL}/weather?lat=51.5&lon=-0.12&units=imperial&appid=${TEST_API_KEY}`
      );
      req.flush(RAW_CURRENT);
    });

    it('maps the raw response to CurrentWeather', () => {
      const service = createService();
      let result: CurrentWeather | undefined;
      service.getCurrentWeather(1, 2, 'metric').subscribe((r) => (result = r));

      httpTesting.expectOne(isUrl('/weather')).flush(RAW_CURRENT);

      expect(result).toEqual({
        temperature: 18.4,
        feelsLike: 17.2,
        humidity: 72,
        windSpeed: 4.1,
        description: 'light rain',
        icon: '10d',
        condition: 'rain',
        sunrise: 1_700_000_000,
        sunset: 1_700_040_000,
        timestamp: 1_700_020_000,
        visibility: 8000,
        pressure: 1008,
        windDeg: 270,
        cloudiness: 75,
      });
    });

    it('applies defaults for missing optional fields', () => {
      const service = createService();
      let result: CurrentWeather | undefined;
      service.getCurrentWeather(1, 2, 'metric').subscribe((r) => (result = r));

      httpTesting.expectOne(isUrl('/weather')).flush({
        main: { temp: 5, feels_like: 3, humidity: 90 },
        wind: { speed: 2 },
        weather: [],
        sys: { sunrise: 1, sunset: 2 },
        dt: 3,
      });

      expect(result).toEqual(
        jasmine.objectContaining({
          description: '',
          icon: '01d',
          condition: 'clear',
          visibility: 10000,
          pressure: 1013,
          windDeg: 0,
          cloudiness: 0,
        })
      );
    });

    it('updates the cache subject and localStorage on success', () => {
      const service = createService();
      const setItem = spyOn(Storage.prototype, 'setItem').and.callThrough();
      let cached: CurrentWeather | null | undefined;
      service.cachedCurrentWeather$.subscribe((v) => (cached = v));

      service.getCurrentWeather(1, 2, 'metric').subscribe();
      httpTesting.expectOne(isUrl('/weather')).flush(RAW_CURRENT);

      expect(cached?.temperature).toBe(18.4);
      expect(setItem).toHaveBeenCalledWith(CURRENT_KEY, jasmine.any(String));
      expect(JSON.parse(localStorage.getItem(CURRENT_KEY) as string).temperature).toBe(18.4);
    });

    it('still emits when localStorage.setItem throws', () => {
      const service = createService();
      spyOn(Storage.prototype, 'setItem').and.throwError('QuotaExceededError');
      let result: CurrentWeather | undefined;

      service.getCurrentWeather(1, 2, 'metric').subscribe((r) => (result = r));
      httpTesting.expectOne(isUrl('/weather')).flush(RAW_CURRENT);

      expect(result?.temperature).toBe(18.4);
    });

    it('retries once and succeeds on the second attempt', () => {
      const service = createService();
      let result: CurrentWeather | undefined;
      service.getCurrentWeather(1, 2, 'metric').subscribe((r) => (result = r));

      httpTesting.expectOne(isUrl('/weather')).error(new ProgressEvent('network'));
      httpTesting.expectOne(isUrl('/weather')).flush(RAW_CURRENT);

      expect(result?.temperature).toBe(18.4);
    });

    it('falls back to mock data after the retry fails with no cache', () => {
      const service = createService();
      let result: CurrentWeather | undefined;
      service.getCurrentWeather(1, 2, 'metric').subscribe((r) => (result = r));

      failTwice('/weather');

      expect(result).toEqual(MOCK_CURRENT_WEATHER);
      expect(console.warn).toHaveBeenCalledWith(
        'Weather API call failed. Falling back to cached/mock data.'
      );
    });

    it('falls back to the last cached value after the retry fails', () => {
      const service = createService();
      service.getCurrentWeather(1, 2, 'metric').subscribe();
      httpTesting.expectOne(isUrl('/weather')).flush(RAW_CURRENT);

      let result: CurrentWeather | undefined;
      service.getCurrentWeather(1, 2, 'metric').subscribe((r) => (result = r));
      failTwice('/weather');

      expect(result?.temperature).toBe(18.4);
      expect(result?.condition).toBe('rain');
    });

    describe('condition mapping', () => {
      const mapping: [string, WeatherCondition][] = [
        ['Clear', 'clear'],
        ['Clouds', 'clouds'],
        ['Rain', 'rain'],
        ['Drizzle', 'rain'],
        ['Snow', 'snow'],
        ['Thunderstorm', 'thunderstorm'],
        ['Squall', 'thunderstorm'],
        ['Tornado', 'thunderstorm'],
        ['Mist', 'mist'],
        ['Fog', 'mist'],
        ['Haze', 'mist'],
        ['Smoke', 'mist'],
        ['Dust', 'mist'],
        ['Sand', 'mist'],
        ['Ash', 'mist'],
        ['Unknown', 'clear'],
      ];

      for (const [main, expected] of mapping) {
        it(`maps "${main}" to "${expected}"`, () => {
          const service = createService();
          let result: CurrentWeather | undefined;
          service.getCurrentWeather(1, 2, 'metric').subscribe((r) => (result = r));

          httpTesting
            .expectOne(isUrl('/weather'))
            .flush({ ...RAW_CURRENT, weather: [{ main, description: 'x', icon: '01d' }] });

          expect(result?.condition).toBe(expected);
        });
      }
    });
  });

  describe('getHourlyForecast()', () => {
    const rawForecast = {
      list: [
        forecastItem(1000, 10, 'Clear', { icon: '01d', description: 'clear sky' }),
        forecastItem(4600, 12, 'Clouds', { icon: '02d', description: 'few clouds' }),
        { dt: 8200, main: { temp: 9, humidity: 40 }, weather: [], wind: { speed: 1 } },
      ],
    };

    it('requests /forecast with cnt=12', () => {
      const service = createService();
      service.getHourlyForecast(3, 4, 'metric').subscribe();

      const req = httpTesting.expectOne(isUrl('/forecast'));
      expect(req.request.url).toBe(
        `${BASE_URL}/forecast?lat=3&lon=4&units=metric&cnt=12&appid=${TEST_API_KEY}`
      );
      req.flush({ list: [] });
    });

    it('maps each list item to an HourlyWeather with defaults', () => {
      const service = createService();
      let result: HourlyForecast | undefined;
      service.getHourlyForecast(3, 4, 'metric').subscribe((r) => (result = r));

      httpTesting.expectOne(isUrl('/forecast')).flush(rawForecast);

      expect(result).toEqual({
        hours: [
          { time: 1000, temperature: 10, icon: '01d', description: 'clear sky' },
          { time: 4600, temperature: 12, icon: '02d', description: 'few clouds' },
          { time: 8200, temperature: 9, icon: '01d', description: '' },
        ],
      });
    });

    it('updates the cache and localStorage on success', () => {
      const service = createService();
      let cached: HourlyForecast | null | undefined;
      service.cachedHourlyForecast$.subscribe((v) => (cached = v));

      service.getHourlyForecast(3, 4, 'metric').subscribe();
      httpTesting.expectOne(isUrl('/forecast')).flush(rawForecast);

      expect(cached?.hours.length).toBe(3);
      expect(JSON.parse(localStorage.getItem(HOURLY_KEY) as string).hours.length).toBe(3);
    });

    it('falls back to mock data after the retry fails with no cache', () => {
      const service = createService();
      let result: HourlyForecast | undefined;
      service.getHourlyForecast(3, 4, 'metric').subscribe((r) => (result = r));

      failTwice('/forecast');

      expect(result).toEqual(MOCK_HOURLY_FORECAST);
    });

    it('falls back to the hydrated cache after the retry fails', () => {
      const stored: HourlyForecast = {
        hours: [{ time: 1, temperature: 2, icon: '03n', description: 'stored' }],
      };
      localStorage.setItem(HOURLY_KEY, JSON.stringify(stored));
      const service = createService();
      let result: HourlyForecast | undefined;
      service.getHourlyForecast(3, 4, 'metric').subscribe((r) => (result = r));

      failTwice('/forecast');

      expect(result).toEqual(stored);
    });
  });

  describe('getDailyForecast()', () => {
    it('requests /forecast with cnt=40', () => {
      const service = createService();
      service.getDailyForecast(5, 6, 'imperial').subscribe();

      const req: TestRequest = httpTesting.expectOne(isUrl('/forecast'));
      expect(req.request.url).toBe(
        `${BASE_URL}/forecast?lat=5&lon=6&units=imperial&cnt=40&appid=${TEST_API_KEY}`
      );
      req.flush({ list: [] });
    });

    it('aggregates 3-hour slots into daily summaries', () => {
      const day1 = [
        forecastItem(localSeconds(2024, 0, 15, 3), 10, 'Clear', {
          humidity: 50,
          speed: 2,
          icon: '01n',
        }),
        forecastItem(localSeconds(2024, 0, 15, 9), 15, 'Drizzle', {
          humidity: 60,
          speed: 5,
          pop: 0.2,
          icon: '09d',
          description: 'light drizzle',
        }),
        forecastItem(localSeconds(2024, 0, 15, 15), 12, 'Clouds', {
          humidity: 71,
          speed: 3,
          pop: 0.4,
          icon: '03d',
        }),
      ];
      const day2 = [
        forecastItem(localSeconds(2024, 0, 16, 12), 20, 'Snow', {
          humidity: 80,
          speed: 7,
          icon: '13d',
          description: 'snow',
        }),
      ];

      const service = createService();
      let result: DailyForecast | undefined;
      service.getDailyForecast(5, 6, 'metric').subscribe((r) => (result = r));
      httpTesting.expectOne(isUrl('/forecast')).flush({ list: [...day1, ...day2] });

      expect(result).toEqual({
        days: [
          {
            date: day1[0].dt,
            tempMin: 10,
            tempMax: 15,
            icon: '09d',
            description: 'light drizzle',
            condition: 'rain',
            humidity: 60,
            windSpeed: 5,
            pop: 0.4,
          },
          {
            date: day2[0].dt,
            tempMin: 20,
            tempMax: 20,
            icon: '13d',
            description: 'snow',
            condition: 'snow',
            humidity: 80,
            windSpeed: 7,
            pop: 0,
          },
        ],
      });
    });

    it('limits the result to 5 days', () => {
      const list = Array.from({ length: 7 }, (_, i) =>
        forecastItem(localSeconds(2024, 0, 10 + i, 12), 10 + i)
      );
      const service = createService();
      let result: DailyForecast | undefined;
      service.getDailyForecast(5, 6, 'metric').subscribe((r) => (result = r));
      httpTesting.expectOne(isUrl('/forecast')).flush({ list });

      expect(result?.days.length).toBe(5);
      expect(result?.days.map((d) => d.tempMax)).toEqual([10, 11, 12, 13, 14]);
    });

    it('defaults icon, description and condition when weather is empty', () => {
      const service = createService();
      let result: DailyForecast | undefined;
      service.getDailyForecast(5, 6, 'metric').subscribe((r) => (result = r));
      httpTesting.expectOne(isUrl('/forecast')).flush({
        list: [
          {
            dt: localSeconds(2024, 0, 15, 12),
            main: { temp: 1, humidity: 10 },
            weather: [],
            wind: { speed: 1 },
          },
        ],
      });

      expect(result?.days[0]).toEqual(
        jasmine.objectContaining({ icon: '01d', description: '', condition: 'clear', pop: 0 })
      );
    });

    it('updates the cache and localStorage on success', () => {
      const service = createService();
      let cached: DailyForecast | null | undefined;
      service.cachedDailyForecast$.subscribe((v) => (cached = v));

      service.getDailyForecast(5, 6, 'metric').subscribe();
      httpTesting
        .expectOne(isUrl('/forecast'))
        .flush({ list: [forecastItem(localSeconds(2024, 0, 15, 12), 10)] });

      expect(cached?.days.length).toBe(1);
      expect(JSON.parse(localStorage.getItem(DAILY_KEY) as string).days.length).toBe(1);
    });

    it('falls back to mock data after the retry fails with no cache', () => {
      const service = createService();
      let result: DailyForecast | undefined;
      service.getDailyForecast(5, 6, 'metric').subscribe((r) => (result = r));

      failTwice('/forecast');

      expect(result).toEqual(MOCK_DAILY_FORECAST);
      expect(console.warn).toHaveBeenCalledWith(
        'Daily forecast API call failed. Falling back to cached/mock data.'
      );
    });

    it('falls back to the last cached value after the retry fails', () => {
      const service = createService();
      service.getDailyForecast(5, 6, 'metric').subscribe();
      httpTesting
        .expectOne(isUrl('/forecast'))
        .flush({ list: [forecastItem(localSeconds(2024, 0, 15, 12), 33)] });

      let result: DailyForecast | undefined;
      service.getDailyForecast(5, 6, 'metric').subscribe((r) => (result = r));
      failTwice('/forecast');

      expect(result?.days[0].tempMax).toBe(33);
    });
  });
});
