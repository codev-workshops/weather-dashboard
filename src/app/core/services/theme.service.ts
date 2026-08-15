import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WeatherCondition } from '../../models/weather.model';
import { ColorTheme, ColorThemeId } from '../../models/theme.model';

const STORAGE_KEY = 'weather-dashboard.colorTheme';

/**
 * Determines the CSS theme classes applied to the dashboard host element:
 *
 * - a weather class such as `theme-clear-day`, derived from the current
 *   condition and whether it is day or night;
 * - a colour class such as `palette-blue`, chosen by the user and persisted in
 *   `localStorage`. The palette class only overrides the `--theme-hue` custom
 *   properties that every gradient in `styles.scss` is built from.
 *
 * Day/night is derived by comparing `Date.now()` to the sunrise
 * and sunset Unix timestamps provided by the weather API.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly colorThemes: ColorTheme[] = [
    { id: 'green', label: 'Forest', swatch: 'oklch(0.60 0.15 150)' },
    { id: 'blue', label: 'Ocean', swatch: 'oklch(0.60 0.15 250)' },
    { id: 'violet', label: 'Twilight', swatch: 'oklch(0.60 0.15 300)' },
    { id: 'amber', label: 'Sunset', swatch: 'oklch(0.60 0.15 70)' },
    { id: 'rose', label: 'Blossom', swatch: 'oklch(0.60 0.15 10)' },
  ];

  private colorThemeSubject = new BehaviorSubject<ColorThemeId>(this.readStoredTheme());

  /** Currently selected colour theme. */
  readonly colorTheme$: Observable<ColorThemeId> = this.colorThemeSubject.asObservable();

  /**
   * Selects a colour theme and persists it for future visits.
   *
   * @param id - Identifier of one of `colorThemes`.
   */
  setColorTheme(id: ColorThemeId): void {
    this.colorThemeSubject.next(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage unavailable (private mode / quota) — the choice still applies
      // for the current session.
    }
  }

  /**
   * Returns the CSS class carrying the colour theme's hue variables.
   *
   * @param id - Identifier of one of `colorThemes`.
   */
  getColorThemeClass(id: ColorThemeId): string {
    return `palette-${id}`;
  }

  /**
   * Returns a CSS class name such as `theme-clear-day` or `theme-rain-night`.
   *
   * @param condition - Current weather condition category.
   * @param sunrise   - Unix timestamp (seconds) of today's sunrise.
   * @param sunset    - Unix timestamp (seconds) of today's sunset.
   * @returns A string suitable for `[ngClass]` binding.
   */
  getThemeClass(condition: WeatherCondition, sunrise: number, sunset: number): string {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const period = nowSeconds >= sunrise && nowSeconds < sunset ? 'day' : 'night';
    return `theme-${condition}-${period}`;
  }

  private readStoredTheme(): ColorThemeId {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    const match = this.colorThemes.find((theme) => theme.id === stored);
    return match ? match.id : 'green';
  }
}
