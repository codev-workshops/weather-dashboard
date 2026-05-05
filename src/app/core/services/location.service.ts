import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Location } from '../../models/weather.model';
import { environment } from '../../../environments/environment';

const LOCATION_STORAGE_KEY = 'weather_dashboard_last_location';

/**
 * Manages user geolocation detection and city-based geocoding.
 *
 * Wraps the browser Geolocation API in an Observable and falls back to
 * localStorage when the browser blocks or times out. Also provides
 * `searchCity()` for manual lookups via the OpenWeatherMap Geocoding API.
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private http = inject(HttpClient);

  /**
   * Attempts browser geolocation with a 10-second timeout.
   * Falls back to the last persisted location in localStorage.
   *
   * @returns Observable emitting a single `Location` then completing.
   */
  detectLocation(): Observable<Location> {
    return new Observable<Location>((observer) => {
      if (!navigator.geolocation) {
        const fallback = this.getStoredLocation();
        if (fallback) {
          observer.next(fallback);
          observer.complete();
        } else {
          observer.error(new Error('Geolocation is not supported by this browser.'));
        }
        return;
      }

      let settled = false;

      const settle = (action: () => void): void => {
        if (!settled) {
          settled = true;
          action();
        }
      };

      const fallbackTimeout = setTimeout(() => {
        settle(() => {
          const fallback = this.getStoredLocation();
          if (fallback) {
            observer.next(fallback);
            observer.complete();
          } else {
            observer.error(
              new Error('Location request timed out. Please search for a city manually.')
            );
          }
        });
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(fallbackTimeout);
          settle(() => {
            const loc: Location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            this.storeLocation(loc);
            observer.next(loc);
            observer.complete();
          });
        },
        (error) => {
          clearTimeout(fallbackTimeout);
          settle(() => {
            const fallback = this.getStoredLocation();
            if (fallback) {
              observer.next(fallback);
              observer.complete();
            } else {
              observer.error(new Error(this.mapGeolocationError(error)));
            }
          });
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    });
  }

  /**
   * Geocodes a city name via the OpenWeatherMap `/geo/1.0/direct` endpoint.
   *
   * @param query - Human-readable city name (e.g. "London").
   * @returns Observable emitting a `Location` with `cityName` populated.
   */
  searchCity(query: string): Observable<Location> {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${environment.openWeatherMapApiKey}`;
    return this.http.get<GeocodingResponse[]>(url).pipe(
      map((results) => {
        if (!results || results.length === 0) {
          throw new Error(`City "${query}" not found.`);
        }
        const first = results[0];
        return {
          latitude: first.lat,
          longitude: first.lon,
          cityName: first.name,
        } as Location;
      }),
      tap((loc) => this.storeLocation(loc)),
      catchError((err) => {
        const fallback = this.getStoredLocation();
        if (fallback) {
          return of(fallback);
        }
        throw err;
      })
    );
  }

  private storeLocation(loc: Location): void {
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // localStorage may be unavailable
    }
  }

  private getStoredLocation(): Location | null {
    try {
      const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Location) : null;
    } catch {
      return null;
    }
  }

  private mapGeolocationError(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location permission denied. Please search for a city manually.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information is unavailable.';
      case error.TIMEOUT:
        return 'Location request timed out.';
      default:
        return 'An unknown geolocation error occurred.';
    }
  }
}

interface GeocodingResponse {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}
