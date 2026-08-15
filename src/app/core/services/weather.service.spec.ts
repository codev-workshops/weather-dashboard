import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WeatherService } from './weather.service';
import { environment } from '../../../environments/environment';
import {
  MOCK_CURRENT_WEATHER,
  MOCK_DAILY_FORECAST,
  MOCK_HOURLY_FORECAST,
} from '../mocks/weather.mock';
import {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  WeatherCondition,
} from '../../models/weather.model';

const PLACEHOLDER_KEY = 'YOUR_API_KEY_HERE';
const TEST_KEY = 'test-api-key';
const BASE_URL = environment.openWeatherMapBaseUrl;
const LAT = 51.5;
const LON = -0.12;

/** Raw `/weather` payload shaped like `OpenWeatherCurrentResponse`. */
const RAW_CURRENT = {
  main: { temp: 18.4, feels_like: 17.1, humidity: 62, pressure: 1008 },
  wind: { speed: 4.2, deg: 190 },
  weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }],
  sys: { sunrise: 1_700_000_000, sunset: 1_700_040_000 },
  clouds: { all: 75 },
  visibility: 8000,
  dt: 1_700_010_000,
};

/** Raw `/forecast` payload shaped like `OpenWeatherForecastResponse`. */
function rawForecast(slots: number, startDt = 1_700_000_000): {
  list: {
    dt: number;
    main: { temp: number; humidity: number };
    weather: { main: string; description: string; icon: string }[];
    wind: { speed: number };
    pop?: number;
  }[];
} {
  return {
    list: Array.from({ length: slots }, (_, i) => ({
      dt: startDt + i * 3 * 3600,
      main: { temp: 10 + i, humidity: 50 + i },
      weather: [{ main: 'Clouds', description: 'scattered clouds', icon: '03d' }],
      wind: { speed: 1 + i * 0.5 },
      pop: i / 100,
    })),
  };
}

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;
  const originalKey = environment.openWeatherMapApiKey;

  beforeEach(() => {
    localStorage.clear();
    environment.openWeatherMapApiKey = TEST_KEY;
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WeatherService],
    });
    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    environment.openWeatherMapApiKey = originalKey;
    localStorage.clear();
  });

  describe('getCurrentWeather', () => {
    it('requests /weather with lat, lon, units and appid (TC-WX-001)', () => {
      service.getCurrentWeather(LAT, LON, 'metric').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${BASE_URL}/weather` || r.urlWithParams.startsWith(`${BASE_URL}/weather`)
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toBe(
        `${BASE_URL}/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${TEST_KEY}`
      );
      req.flush(RAW_CURRENT);
    });

    it('maps the raw OpenWeatherMap response onto CurrentWeather (TC-WX-002)', () => {
      let result: CurrentWeather | undefined;
      service.getCurrentWeather(LAT, LON, 'metric').subscribe((w) => (result = w));
      httpMock.expectOne(() => true).flush(RAW_CURRENT);

      expect(result).toEqual({
        temperature: 18.4,
        feelsLike: 17.1,
        humidity: 62,
        windSpeed: 4.2,
        description: 'light rain',
        icon: '10d',
        condition: 'rain',
        sunrise: 1_700_000_000,
        sunset: 1_700_040_000,
        timestamp: 1_700_010_000,
        visibility: 8000,
        pressure: 1008,
        windDeg: 190,
        cloudiness: 75,
      });
    });

    it('normalizes provider condition strings onto the WeatherCondition union (TC-WX-003)', () => {
      const cases: [string, WeatherCondition][] = [
        ['Drizzle', 'rain'],
        ['Haze', 'mist'],
        ['Tornado', 'thunderstorm'],
        ['Unmapped', 'clear'],
      ];

      for (const [main, expected] of cases) {
        let result: CurrentWeather | undefined;
        service.getCurrentWeather(LAT, LON, 'metric').subscribe((w) => (result = w));
        httpMock.expectOne(() => true).flush({
          ...RAW_CURRENT,
          weather: [{ main, description: 'x', icon: '01d' }],
        });
        expect(result?.condition).toBe(expected);
      }
    });

    it('caches the mapped result in localStorage and on cachedCurrentWeather$ (TC-WX-004)', () => {
      const emissions: (CurrentWeather | null)[] = [];
      service.cachedCurrentWeather$.subscribe((w) => emissions.push(w));

      service.getCurrentWeather(LAT, LON, 'imperial').subscribe();
      httpMock.expectOne(() => true).flush(RAW_CURRENT);

      const cached = emissions[emissions.length - 1];
      expect(cached?.temperature).toBe(18.4);
      expect(JSON.parse(localStorage.getItem('weather_dashboard_current') ?? 'null')).toEqual(
        cached
      );
    });

    it('retries the request once before giving up (TC-WX-005)', () => {
      let result: CurrentWeather | undefined;
      service.getCurrentWeather(LAT, LON, 'metric').subscribe((w) => (result = w));

      httpMock.expectOne(() => true).flush('boom', { status: 500, statusText: 'Server Error' });
      httpMock.expectOne(() => true).flush(RAW_CURRENT);

      expect(result?.temperature).toBe(18.4);
    });

    it('falls back to mock data when both attempts fail and nothing is cached (TC-WX-006)', () => {
      let result: CurrentWeather | undefined;
      service.getCurrentWeather(LAT, LON, 'metric').subscribe((w) => (result = w));

      for (let i = 0; i < 2; i++) {
        httpMock.expectOne(() => true).flush('boom', { status: 500, statusText: 'Server Error' });
      }

      expect(result).toBe(MOCK_CURRENT_WEATHER);
    });

    it('falls back to previously cached data when the request fails (TC-WX-007)', () => {
      service.getCurrentWeather(LAT, LON, 'metric').subscribe();
      httpMock.expectOne(() => true).flush(RAW_CURRENT);

      let result: CurrentWeather | undefined;
      service.getCurrentWeather(LAT, LON, 'metric').subscribe((w) => (result = w));
      for (let i = 0; i < 2; i++) {
        httpMock.expectOne(() => true).flush('boom', { status: 503, statusText: 'Unavailable' });
      }

      expect(result?.temperature).toBe(18.4);
      expect(result).not.toBe(MOCK_CURRENT_WEATHER);
    });

    it('returns mock data without any HTTP call when the API key is the placeholder (TC-WX-008)', () => {
      environment.openWeatherMapApiKey = PLACEHOLDER_KEY;

      let result: CurrentWeather | undefined;
      service.getCurrentWeather(LAT, LON, 'metric').subscribe((w) => (result = w));

      expect(result).toBe(MOCK_CURRENT_WEATHER);
      httpMock.expectNone(() => true);
    });

    it('returns mock data without any HTTP call when the API key is empty (TC-WX-009)', () => {
      environment.openWeatherMapApiKey = '';

      let result: CurrentWeather | undefined;
      service.getCurrentWeather(LAT, LON, 'metric').subscribe((w) => (result = w));

      expect(result).toBe(MOCK_CURRENT_WEATHER);
      httpMock.expectNone(() => true);
    });
  });

  describe('getHourlyForecast', () => {
    it('requests /forecast with cnt=12 (TC-WX-020)', () => {
      service.getHourlyForecast(LAT, LON, 'metric').subscribe();

      const req = httpMock.expectOne(() => true);
      expect(req.request.urlWithParams).toBe(
        `${BASE_URL}/forecast?lat=${LAT}&lon=${LON}&units=metric&cnt=12&appid=${TEST_KEY}`
      );
      req.flush(rawForecast(12));
    });

    it('maps each forecast slot onto HourlyWeather (TC-WX-021)', () => {
      let result: HourlyForecast | undefined;
      service.getHourlyForecast(LAT, LON, 'metric').subscribe((f) => (result = f));
      const raw = rawForecast(12);
      httpMock.expectOne(() => true).flush(raw);

      expect(result?.hours.length).toBe(12);
      expect(result?.hours[0]).toEqual({
        time: raw.list[0].dt,
        temperature: raw.list[0].main.temp,
        icon: '03d',
        description: 'scattered clouds',
      });
    });

    it('defaults icon and description when the weather array is empty (TC-WX-022)', () => {
      let result: HourlyForecast | undefined;
      service.getHourlyForecast(LAT, LON, 'metric').subscribe((f) => (result = f));
      httpMock.expectOne(() => true).flush({
        list: [{ dt: 1, main: { temp: 5, humidity: 50 }, weather: [], wind: { speed: 1 } }],
      });

      expect(result?.hours[0].icon).toBe('01d');
      expect(result?.hours[0].description).toBe('');
    });

    it('retries once then falls back to mock data (TC-WX-023)', () => {
      let result: HourlyForecast | undefined;
      service.getHourlyForecast(LAT, LON, 'metric').subscribe((f) => (result = f));

      for (let i = 0; i < 2; i++) {
        httpMock.expectOne(() => true).flush('boom', { status: 500, statusText: 'Server Error' });
      }

      expect(result).toBe(MOCK_HOURLY_FORECAST);
    });

    it('returns mock forecast without HTTP when the API key is missing (TC-WX-024)', () => {
      environment.openWeatherMapApiKey = PLACEHOLDER_KEY;

      let result: HourlyForecast | undefined;
      service.getHourlyForecast(LAT, LON, 'metric').subscribe((f) => (result = f));

      expect(result).toBe(MOCK_HOURLY_FORECAST);
      httpMock.expectNone(() => true);
    });
  });

  describe('getDailyForecast', () => {
    it('requests /forecast with cnt=40 (TC-WX-030)', () => {
      service.getDailyForecast(LAT, LON, 'imperial').subscribe();

      const req = httpMock.expectOne(() => true);
      expect(req.request.urlWithParams).toBe(
        `${BASE_URL}/forecast?lat=${LAT}&lon=${LON}&units=imperial&cnt=40&appid=${TEST_KEY}`
      );
      req.flush(rawForecast(40));
    });

    it('aggregates 3-hour slots into at most 5 daily summaries (TC-WX-031)', () => {
      let result: DailyForecast | undefined;
      service.getDailyForecast(LAT, LON, 'metric').subscribe((f) => (result = f));
      httpMock.expectOne(() => true).flush(rawForecast(40));

      expect(result?.days.length).toBe(5);
      for (const day of result?.days ?? []) {
        expect(day.tempMax).toBeGreaterThanOrEqual(day.tempMin);
        expect(day.condition).toBe('clouds');
      }
    });

    it('derives min/max temp, mean humidity, max wind and max pop per day (TC-WX-032)', () => {
      const dayStart = Math.floor(new Date('2024-03-10T00:00:00Z').getTime() / 1000);
      const raw = {
        list: [
          {
            dt: dayStart + 3600,
            main: { temp: 4, humidity: 40 },
            weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
            wind: { speed: 1 },
            pop: 0.1,
          },
          {
            dt: dayStart + 7200,
            main: { temp: 12, humidity: 60 },
            weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }],
            wind: { speed: 6 },
            pop: 0.8,
          },
          {
            dt: dayStart + 10800,
            main: { temp: 9, humidity: 50 },
            weather: [{ main: 'Snow', description: 'light snow', icon: '13d' }],
            wind: { speed: 3 },
            pop: 0.4,
          },
        ],
      };

      let result: DailyForecast | undefined;
      service.getDailyForecast(LAT, LON, 'metric').subscribe((f) => (result = f));
      httpMock.expectOne(() => true).flush(raw);

      expect(result?.days.length).toBe(1);
      expect(result?.days[0]).toEqual({
        date: raw.list[0].dt,
        tempMin: 4,
        tempMax: 12,
        icon: '10d',
        description: 'light rain',
        condition: 'rain',
        humidity: 50,
        windSpeed: 6,
        pop: 0.8,
      });
    });

    it('treats a missing pop as zero (TC-WX-033)', () => {
      let result: DailyForecast | undefined;
      service.getDailyForecast(LAT, LON, 'metric').subscribe((f) => (result = f));
      httpMock.expectOne(() => true).flush({
        list: [
          {
            dt: 1_700_000_000,
            main: { temp: 5, humidity: 50 },
            weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
            wind: { speed: 2 },
          },
        ],
      });

      expect(result?.days[0].pop).toBe(0);
    });

    it('retries once then falls back to mock data (TC-WX-034)', () => {
      let result: DailyForecast | undefined;
      service.getDailyForecast(LAT, LON, 'metric').subscribe((f) => (result = f));

      for (let i = 0; i < 2; i++) {
        httpMock.expectOne(() => true).flush('boom', { status: 500, statusText: 'Server Error' });
      }

      expect(result).toBe(MOCK_DAILY_FORECAST);
    });

    it('returns mock daily forecast without HTTP when the API key is missing (TC-WX-035)', () => {
      environment.openWeatherMapApiKey = PLACEHOLDER_KEY;

      let result: DailyForecast | undefined;
      service.getDailyForecast(LAT, LON, 'metric').subscribe((f) => (result = f));

      expect(result).toBe(MOCK_DAILY_FORECAST);
      httpMock.expectNone(() => true);
    });
  });

  it('seeds the cached observables from localStorage on construction (TC-WX-040)', () => {
    const stored: CurrentWeather = { ...MOCK_CURRENT_WEATHER, temperature: -7 };
    localStorage.setItem('weather_dashboard_current', JSON.stringify(stored));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WeatherService],
    });
    const freshService = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);

    const emissions: (CurrentWeather | null)[] = [];
    freshService.cachedCurrentWeather$.subscribe((w) => emissions.push(w));
    expect(emissions[emissions.length - 1]).toEqual(stored);
  });
});
