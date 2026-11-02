import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LocationService } from './location.service';
import { Location } from '../../models/weather.model';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'weather_dashboard_last_location';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

const STORED_LOCATION: Location = { latitude: 51.5074, longitude: -0.1278, cityName: 'London' };

type SuccessCb = PositionCallback;
type ErrorCb = PositionErrorCallback | null | undefined;

function makePosition(latitude: number, longitude: number): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition;
}

function makePositionError(code: number): GeolocationPositionError {
  return {
    code,
    message: 'mock error',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

describe('LocationService', () => {
  let service: LocationService;
  let httpTesting: HttpTestingController;
  let getCurrentPosition: jasmine.Spy<Geolocation['getCurrentPosition']>;
  let successCb: SuccessCb | undefined;
  let errorCb: ErrorCb;

  function mockGeolocation(): void {
    getCurrentPosition = jasmine
      .createSpy('getCurrentPosition')
      .and.callFake((success: SuccessCb, error?: ErrorCb) => {
        successCb = success;
        errorCb = error;
      });
    const geolocation = { getCurrentPosition } as unknown as Geolocation;
    spyOnProperty(navigator, 'geolocation', 'get').and.returnValue(geolocation);
  }

  function storeLocation(loc: Location): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  }

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    successCb = undefined;
    errorCb = undefined;

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LocationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('detectLocation()', () => {
    it('emits the browser position, stores it, and completes on success', fakeAsync(() => {
      mockGeolocation();
      const next = jasmine.createSpy('next');
      const complete = jasmine.createSpy('complete');
      const error = jasmine.createSpy('error');

      service.detectLocation().subscribe({ next, complete, error });
      successCb?.(makePosition(40.7128, -74.006));

      expect(next).toHaveBeenCalledOnceWith({ latitude: 40.7128, longitude: -74.006 });
      expect(complete).toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
      });

      // The 10s fallback timer must have been cleared.
      tick(10000);
      expect(next).toHaveBeenCalledTimes(1);
    }));

    it('requests position with the expected geolocation options', () => {
      mockGeolocation();
      service.detectLocation().subscribe();

      expect(getCurrentPosition).toHaveBeenCalledOnceWith(
        jasmine.any(Function),
        jasmine.any(Function),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
      successCb?.(makePosition(0, 0));
    });

    describe('when geolocation errors', () => {
      const cases: { name: string; code: number; message: string }[] = [
        {
          name: 'PERMISSION_DENIED',
          code: 1,
          message: 'Location permission denied. Please search for a city manually.',
        },
        { name: 'POSITION_UNAVAILABLE', code: 2, message: 'Location information is unavailable.' },
        { name: 'TIMEOUT', code: 3, message: 'Location request timed out.' },
        { name: 'unknown code', code: 99, message: 'An unknown geolocation error occurred.' },
      ];

      for (const c of cases) {
        it(`maps ${c.name} to a user-facing error when nothing is stored`, fakeAsync(() => {
          mockGeolocation();
          const next = jasmine.createSpy('next');
          let received: Error | undefined;

          service.detectLocation().subscribe({ next, error: (e: Error) => (received = e) });
          errorCb?.(makePositionError(c.code));

          expect(next).not.toHaveBeenCalled();
          expect(received).toEqual(jasmine.any(Error));
          expect(received?.message).toBe(c.message);
          flush();
        }));
      }

      it('falls back to the stored location on permission denied', fakeAsync(() => {
        storeLocation(STORED_LOCATION);
        mockGeolocation();
        const next = jasmine.createSpy('next');
        const complete = jasmine.createSpy('complete');
        const error = jasmine.createSpy('error');

        service.detectLocation().subscribe({ next, complete, error });
        errorCb?.(makePositionError(1));

        expect(next).toHaveBeenCalledOnceWith(STORED_LOCATION);
        expect(complete).toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
        flush();
      }));
    });

    describe('10-second fallback timeout', () => {
      it('does not settle before 10 seconds', fakeAsync(() => {
        mockGeolocation();
        const next = jasmine.createSpy('next');
        const error = jasmine.createSpy('error');

        service.detectLocation().subscribe({ next, error });
        tick(9999);

        expect(next).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
        tick(1);
      }));

      it('errors with a timeout message after 10 seconds when nothing is stored', fakeAsync(() => {
        mockGeolocation();
        let received: Error | undefined;

        service.detectLocation().subscribe({ error: (e: Error) => (received = e) });
        tick(10000);

        expect(received?.message).toBe(
          'Location request timed out. Please search for a city manually.'
        );
      }));

      it('emits the stored location after 10 seconds when available', fakeAsync(() => {
        storeLocation(STORED_LOCATION);
        mockGeolocation();
        const next = jasmine.createSpy('next');
        const complete = jasmine.createSpy('complete');

        service.detectLocation().subscribe({ next, complete });
        tick(10000);

        expect(next).toHaveBeenCalledOnceWith(STORED_LOCATION);
        expect(complete).toHaveBeenCalled();
      }));

      it('ignores late geolocation callbacks once the timeout has settled', fakeAsync(() => {
        storeLocation(STORED_LOCATION);
        mockGeolocation();
        const next = jasmine.createSpy('next');
        const error = jasmine.createSpy('error');

        service.detectLocation().subscribe({ next, error });
        tick(10000);
        successCb?.(makePosition(1, 2));
        errorCb?.(makePositionError(1));

        expect(next).toHaveBeenCalledOnceWith(STORED_LOCATION);
        expect(error).not.toHaveBeenCalled();
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual(STORED_LOCATION);
      }));
    });

    describe('when the browser does not support geolocation', () => {
      beforeEach(() => {
        spyOnProperty(navigator, 'geolocation', 'get').and.returnValue(
          undefined as unknown as Geolocation
        );
      });

      it('errors when nothing is stored', () => {
        let received: Error | undefined;
        service.detectLocation().subscribe({ error: (e: Error) => (received = e) });
        expect(received?.message).toBe('Geolocation is not supported by this browser.');
      });

      it('emits the stored location when available', () => {
        storeLocation(STORED_LOCATION);
        const next = jasmine.createSpy('next');
        const complete = jasmine.createSpy('complete');

        service.detectLocation().subscribe({ next, complete });

        expect(next).toHaveBeenCalledOnceWith(STORED_LOCATION);
        expect(complete).toHaveBeenCalled();
      });
    });
  });

  describe('searchCity()', () => {
    it('calls the geocoding endpoint with an encoded query, limit and API key', () => {
      service.searchCity('New York').subscribe({ error: () => undefined });

      const req = httpTesting.expectOne((r) => r.url.startsWith(GEO_URL));
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(
        `${GEO_URL}?q=New%20York&limit=1&appid=${environment.openWeatherMapApiKey}`
      );
      req.flush([]);
    });

    it('maps the first result to a Location and stores it', () => {
      let result: Location | undefined;
      service.searchCity('Paris').subscribe((loc) => (result = loc));

      httpTesting.expectOne((r) => r.url.startsWith(GEO_URL)).flush([
        { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' },
        { name: 'Paris', lat: 33.6609, lon: -95.5555, country: 'US', state: 'Texas' },
      ]);

      const expected: Location = { latitude: 48.8566, longitude: 2.3522, cityName: 'Paris' };
      expect(result).toEqual(expected);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual(expected);
    });

    it('errors with "City not found" on empty results when nothing is stored', () => {
      let received: Error | undefined;
      service.searchCity('Atlantis').subscribe({ error: (e: Error) => (received = e) });

      httpTesting.expectOne((r) => r.url.startsWith(GEO_URL)).flush([]);

      expect(received?.message).toBe('City "Atlantis" not found.');
    });

    it('errors with "City not found" when the response body is null', () => {
      let received: Error | undefined;
      service.searchCity('Nowhere').subscribe({ error: (e: Error) => (received = e) });

      httpTesting.expectOne((r) => r.url.startsWith(GEO_URL)).flush(null);

      expect(received?.message).toBe('City "Nowhere" not found.');
    });

    it('falls back to the stored location on empty results', () => {
      storeLocation(STORED_LOCATION);
      let result: Location | undefined;
      service.searchCity('Atlantis').subscribe((loc) => (result = loc));

      httpTesting.expectOne((r) => r.url.startsWith(GEO_URL)).flush([]);

      expect(result).toEqual(STORED_LOCATION);
    });

    it('propagates HTTP errors when nothing is stored', () => {
      let received: HttpErrorResponse | undefined;
      service.searchCity('London').subscribe({ error: (e: HttpErrorResponse) => (received = e) });

      httpTesting
        .expectOne((r) => r.url.startsWith(GEO_URL))
        .flush({ message: 'Invalid API key' }, { status: 401, statusText: 'Unauthorized' });

      expect(received).toEqual(jasmine.any(HttpErrorResponse));
      expect(received?.status).toBe(401);
    });

    it('falls back to the stored location on HTTP errors', () => {
      storeLocation(STORED_LOCATION);
      let result: Location | undefined;
      service.searchCity('London').subscribe((loc) => (result = loc));

      httpTesting
        .expectOne((r) => r.url.startsWith(GEO_URL))
        .error(new ProgressEvent('network error'));

      expect(result).toEqual(STORED_LOCATION);
    });
  });

  describe('localStorage persistence', () => {
    it('writes the location JSON under the weather_dashboard_last_location key', () => {
      const setItem = spyOn(Storage.prototype, 'setItem').and.callThrough();
      service.searchCity('Paris').subscribe();

      httpTesting
        .expectOne((r) => r.url.startsWith(GEO_URL))
        .flush([{ name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }]);

      expect(setItem).toHaveBeenCalledOnceWith(
        STORAGE_KEY,
        JSON.stringify({ latitude: 48.8566, longitude: 2.3522, cityName: 'Paris' })
      );
    });

    it('reads the stored location from the weather_dashboard_last_location key', () => {
      const getItem = spyOn(Storage.prototype, 'getItem').and.returnValue(
        JSON.stringify(STORED_LOCATION)
      );
      spyOnProperty(navigator, 'geolocation', 'get').and.returnValue(
        undefined as unknown as Geolocation
      );
      let result: Location | undefined;

      service.detectLocation().subscribe((loc) => (result = loc));

      expect(getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result).toEqual(STORED_LOCATION);
    });

    it('still emits the geolocation result when setItem throws', fakeAsync(() => {
      spyOn(Storage.prototype, 'setItem').and.throwError('QuotaExceededError');
      mockGeolocation();
      const next = jasmine.createSpy('next');
      const error = jasmine.createSpy('error');

      service.detectLocation().subscribe({ next, error });
      successCb?.(makePosition(10, 20));

      expect(next).toHaveBeenCalledOnceWith({ latitude: 10, longitude: 20 });
      expect(error).not.toHaveBeenCalled();
      flush();
    }));

    it('still emits the search result when setItem throws', () => {
      spyOn(Storage.prototype, 'setItem').and.throwError('SecurityError');
      let result: Location | undefined;
      service.searchCity('Paris').subscribe((loc) => (result = loc));

      httpTesting
        .expectOne((r) => r.url.startsWith(GEO_URL))
        .flush([{ name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }]);

      expect(result).toEqual({ latitude: 48.8566, longitude: 2.3522, cityName: 'Paris' });
    });

    it('treats a throwing getItem as no stored location', fakeAsync(() => {
      spyOn(Storage.prototype, 'getItem').and.throwError('SecurityError');
      mockGeolocation();
      let received: Error | undefined;

      service.detectLocation().subscribe({ error: (e: Error) => (received = e) });
      errorCb?.(makePositionError(1));

      expect(received?.message).toBe(
        'Location permission denied. Please search for a city manually.'
      );
      flush();
    }));

    it('treats corrupt JSON in storage as no stored location', fakeAsync(() => {
      localStorage.setItem(STORAGE_KEY, '{not valid json');
      mockGeolocation();
      let received: Error | undefined;

      service.detectLocation().subscribe({ error: (e: Error) => (received = e) });
      tick(10000);

      expect(received?.message).toBe(
        'Location request timed out. Please search for a city manually.'
      );
    }));
  });
});
