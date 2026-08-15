import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LocationService } from './location.service';
import { environment } from '../../../environments/environment';
import { Location } from '../../models/weather.model';

const STORAGE_KEY = 'weather_dashboard_last_location';
const GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const TEST_KEY = 'test-api-key';

interface GeolocationStub {
  getCurrentPosition: jasmine.Spy;
}

/** Installs an own `navigator.geolocation` property that shadows the real one. */
function stubGeolocation(value: GeolocationStub | undefined): void {
  Object.defineProperty(navigator, 'geolocation', {
    value,
    configurable: true,
    writable: true,
  });
}

function removeGeolocationStub(): void {
  delete (navigator as unknown as Record<string, unknown>)['geolocation'];
}

describe('LocationService', () => {
  let service: LocationService;
  let httpMock: HttpTestingController;
  const originalKey = environment.openWeatherMapApiKey;

  beforeEach(() => {
    localStorage.clear();
    environment.openWeatherMapApiKey = TEST_KEY;
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LocationService],
    });
    service = TestBed.inject(LocationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    removeGeolocationStub();
    environment.openWeatherMapApiKey = originalKey;
    localStorage.clear();
  });

  describe('detectLocation', () => {
    it('emits and persists the browser position on success (TC-LOC-001)', () => {
      stubGeolocation({
        getCurrentPosition: jasmine
          .createSpy('getCurrentPosition')
          .and.callFake((success: PositionCallback) =>
            success({ coords: { latitude: 40.7, longitude: -74 } } as GeolocationPosition)
          ),
      });

      let result: Location | undefined;
      service.detectLocation().subscribe((loc) => (result = loc));

      expect(result).toEqual({ latitude: 40.7, longitude: -74 });
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(result);
    });

    it('requests a low-accuracy position with a 10s timeout (TC-LOC-002)', () => {
      const getCurrentPosition = jasmine.createSpy('getCurrentPosition');
      stubGeolocation({ getCurrentPosition });

      service.detectLocation().subscribe();

      const options = getCurrentPosition.calls.mostRecent().args[2];
      expect(options).toEqual({ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    });

    it('falls back to the stored location when geolocation never responds (TC-LOC-003)', fakeAsync(() => {
      const stored: Location = { latitude: 1.1, longitude: 2.2, cityName: 'Stored City' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      stubGeolocation({ getCurrentPosition: jasmine.createSpy('getCurrentPosition') });

      let result: Location | undefined;
      service.detectLocation().subscribe((loc) => (result = loc));

      expect(result).toBeUndefined();
      tick(10000);
      expect(result).toEqual(stored);
    }));

    it('errors when geolocation times out and nothing is stored (TC-LOC-004)', fakeAsync(() => {
      stubGeolocation({ getCurrentPosition: jasmine.createSpy('getCurrentPosition') });

      let error: Error | undefined;
      service.detectLocation().subscribe({ error: (err: Error) => (error = err) });
      tick(10000);

      expect(error?.message).toContain('Location request timed out');
    }));

    it('falls back to the stored location when permission is denied (TC-LOC-005)', () => {
      const stored: Location = { latitude: 3, longitude: 4 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      stubGeolocation({
        getCurrentPosition: jasmine
          .createSpy('getCurrentPosition')
          .and.callFake((_success: PositionCallback, failure: PositionErrorCallback) =>
            failure({
              code: 1,
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
              message: 'denied',
            } as GeolocationPositionError)
          ),
      });

      let result: Location | undefined;
      service.detectLocation().subscribe((loc) => (result = loc));

      expect(result).toEqual(stored);
    });

    it('errors with a permission message when denied and nothing is stored (TC-LOC-006)', () => {
      stubGeolocation({
        getCurrentPosition: jasmine
          .createSpy('getCurrentPosition')
          .and.callFake((_success: PositionCallback, failure: PositionErrorCallback) =>
            failure({
              code: 1,
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
              message: 'denied',
            } as GeolocationPositionError)
          ),
      });

      let error: Error | undefined;
      service.detectLocation().subscribe({ error: (err: Error) => (error = err) });

      expect(error?.message).toContain('Location permission denied');
    });

    it('errors when the browser does not support geolocation (TC-LOC-007)', () => {
      stubGeolocation(undefined);

      let error: Error | undefined;
      service.detectLocation().subscribe({ error: (err: Error) => (error = err) });

      expect(error?.message).toBe('Geolocation is not supported by this browser.');
    });

    it('uses the stored location when geolocation is unsupported (TC-LOC-008)', () => {
      const stored: Location = { latitude: 9, longitude: 8, cityName: 'Fallback' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      stubGeolocation(undefined);

      let result: Location | undefined;
      service.detectLocation().subscribe((loc) => (result = loc));

      expect(result).toEqual(stored);
    });

    it('ignores a late position callback after the timeout fallback (TC-LOC-009)', fakeAsync(() => {
      const stored: Location = { latitude: 5, longitude: 6 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      let capturedSuccess: PositionCallback | undefined;
      stubGeolocation({
        getCurrentPosition: jasmine
          .createSpy('getCurrentPosition')
          .and.callFake((success: PositionCallback) => (capturedSuccess = success)),
      });

      const emissions: Location[] = [];
      service.detectLocation().subscribe((loc) => emissions.push(loc));
      tick(10000);
      capturedSuccess?.({ coords: { latitude: 40, longitude: 40 } } as GeolocationPosition);

      expect(emissions).toEqual([stored]);
    }));
  });

  describe('searchCity', () => {
    it('requests /geo/1.0/direct with an encoded query, limit and appid (TC-LOC-020)', () => {
      service.searchCity('São Paulo').subscribe();

      const req = httpMock.expectOne(() => true);
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toBe(
        `${GEOCODING_URL}?q=${encodeURIComponent('São Paulo')}&limit=1&appid=${TEST_KEY}`
      );
      req.flush([{ name: 'São Paulo', lat: -23.5, lon: -46.6, country: 'BR' }]);
    });

    it('maps the first geocoding result onto a Location and persists it (TC-LOC-021)', () => {
      let result: Location | undefined;
      service.searchCity('London').subscribe((loc) => (result = loc));
      httpMock.expectOne(() => true).flush([
        { name: 'London', lat: 51.5073, lon: -0.1277, country: 'GB', state: 'England' },
        { name: 'London', lat: 42.98, lon: -81.23, country: 'CA' },
      ]);

      expect(result).toEqual({ latitude: 51.5073, longitude: -0.1277, cityName: 'London' });
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(result);
    });

    it('errors with a not-found message on an empty result set (TC-LOC-022)', () => {
      let error: Error | undefined;
      service.searchCity('Nowhereville').subscribe({ error: (err: Error) => (error = err) });
      httpMock.expectOne(() => true).flush([]);

      expect(error?.message).toBe('City "Nowhereville" not found.');
    });

    it('falls back to the stored location when the geocoding request fails (TC-LOC-023)', () => {
      const stored: Location = { latitude: 7, longitude: 7, cityName: 'Stored' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      let result: Location | undefined;
      service.searchCity('Paris').subscribe((loc) => (result = loc));
      httpMock.expectOne(() => true).flush('boom', { status: 500, statusText: 'Server Error' });

      expect(result).toEqual(stored);
    });

    it('falls back to the stored location when the city is not found (TC-LOC-024)', () => {
      const stored: Location = { latitude: 7, longitude: 7 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      let result: Location | undefined;
      service.searchCity('Nowhereville').subscribe((loc) => (result = loc));
      httpMock.expectOne(() => true).flush([]);

      expect(result).toEqual(stored);
    });

    it('does not retry a failed geocoding request (TC-LOC-025)', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ latitude: 0, longitude: 0 }));

      service.searchCity('Paris').subscribe();
      httpMock.expectOne(() => true).flush('boom', { status: 500, statusText: 'Server Error' });

      httpMock.expectNone(() => true);
    });
  });
});
