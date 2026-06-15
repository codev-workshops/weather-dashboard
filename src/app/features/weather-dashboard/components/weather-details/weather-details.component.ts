import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentWeather, TemperatureUnit } from '../../../../models/weather.model';

@Component({
  selector: 'app-weather-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (weather) {
      <div class="glass-card mt-6 p-4 sm:p-6">
        <h3 class="mb-4 fluid-lg font-semibold flex items-center gap-2">
          <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          Weather Details
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- Visibility -->
          <div class="interactive interaction-hover p-4 rounded-xl bg-white/5 text-center">
            <div class="mb-2 flex justify-center">
              <svg class="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </div>
            <span class="block text-xs uppercase tracking-wider opacity-70 mb-1">Visibility</span>
            <p class="fluid-base font-semibold tabular-nums">{{ formatVisibility(weather.visibility) }}</p>
          </div>

          <!-- Pressure -->
          <div class="interactive interaction-hover p-4 rounded-xl bg-white/5 text-center">
            <div class="mb-2 flex justify-center">
              <svg class="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <span class="block text-xs uppercase tracking-wider opacity-70 mb-1">Pressure</span>
            <p class="fluid-base font-semibold tabular-nums">{{ weather.pressure }} hPa</p>
          </div>

          <!-- Wind Direction -->
          <div class="interactive interaction-hover p-4 rounded-xl bg-white/5 text-center">
            <div class="mb-2 flex justify-center">
              <svg class="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                   [style.transform]="'rotate(' + weather.windDeg + 'deg)'">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
              </svg>
            </div>
            <span class="block text-xs uppercase tracking-wider opacity-70 mb-1">Wind Dir</span>
            <p class="fluid-base font-semibold">{{ getWindDirection(weather.windDeg) }}</p>
          </div>

          <!-- Cloudiness -->
          <div class="interactive interaction-hover p-4 rounded-xl bg-white/5 text-center">
            <div class="mb-2 flex justify-center">
              <svg class="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
              </svg>
            </div>
            <span class="block text-xs uppercase tracking-wider opacity-70 mb-1">Clouds</span>
            <p class="fluid-base font-semibold tabular-nums">{{ weather.cloudiness }}%</p>
          </div>

          <!-- Sunrise -->
          <div class="interactive interaction-hover p-4 rounded-xl bg-white/5 text-center">
            <div class="mb-2 flex justify-center">
              <svg class="w-6 h-6 opacity-70 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <span class="block text-xs uppercase tracking-wider opacity-70 mb-1">Sunrise</span>
            <p class="fluid-base font-semibold">{{ weather.sunrise * 1000 | date : 'HH:mm' }}</p>
          </div>

          <!-- Sunset -->
          <div class="interactive interaction-hover p-4 rounded-xl bg-white/5 text-center">
            <div class="mb-2 flex justify-center">
              <svg class="w-6 h-6 opacity-70 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <span class="block text-xs uppercase tracking-wider opacity-70 mb-1">Sunset</span>
            <p class="fluid-base font-semibold">{{ weather.sunset * 1000 | date : 'HH:mm' }}</p>
          </div>

          <!-- Feels Like -->
          <div class="interactive interaction-hover p-4 rounded-xl bg-white/5 text-center">
            <div class="mb-2 flex justify-center">
              <svg class="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span class="block text-xs uppercase tracking-wider opacity-70 mb-1">Feels Like</span>
            <p class="fluid-base font-semibold tabular-nums">{{ weather.feelsLike | number : '1.0-0' }}°</p>
          </div>

          <!-- Humidity -->
          <div class="interactive interaction-hover p-4 rounded-xl bg-white/5 text-center">
            <div class="mb-2 flex justify-center">
              <svg class="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3c-4.97 4.97-7 8.03-7 11a7 7 0 1014 0c0-2.97-2.03-6.03-7-11z"></path>
              </svg>
            </div>
            <span class="block text-xs uppercase tracking-wider opacity-70 mb-1">Humidity</span>
            <p class="fluid-base font-semibold tabular-nums">{{ weather.humidity }}%</p>
          </div>
        </div>
      </div>
    }
  `,
})
export class WeatherDetailsComponent {
  @Input() weather: CurrentWeather | null = null;
  @Input() unit: TemperatureUnit = 'metric';

  formatVisibility(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  }

  getWindDirection(deg: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
  }
}
