import { Injectable } from '@angular/core';
import { WeatherCondition } from '../../models/weather.model';

/**
 * Determines the CSS theme class based on the current weather
 * condition and whether it is day or night.
 *
 * Day/night is derived by comparing `Date.now()` to the sunrise
 * and sunset Unix timestamps provided by the weather API.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
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
}
