import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentWeather, TemperatureUnit } from '../../../../models/weather.model';

/**
 * Presentational component that renders the current weather details.
 *
 * Receives data exclusively through @Input() — no service injection.
 */
@Component({
  selector: 'app-current-weather',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (weather) {
      <div class="glass-card p-6 sm:p-8">
        <div class="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div class="text-center sm:text-left">
            <div class="flex items-center justify-center gap-4 sm:justify-start">
              <div class="relative group">
                <img
                  [src]="'https://openweathermap.org/img/wn/' + weather.icon + '@4x.png'"
                  [alt]="weather.description"
                  class="h-24 w-24 transition-transform duration-300 group-hover:scale-110 group-hover:animate-float"
                />
                <div class="absolute inset-0 rounded-full bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div class="flex flex-col">
                <span class="fluid-4xl font-bold tabular-nums tracking-tight">
                  {{ weather.temperature | number : '1.0-0' }}°
                </span>
                <span class="text-sm font-medium opacity-70">{{ unit === 'metric' ? 'Celsius' : 'Fahrenheit' }}</span>
              </div>
            </div>
            <p class="mt-2 fluid-xl font-medium capitalize">{{ weather.description }}</p>
          </div>

          <div class="grid grid-cols-2 gap-x-8 gap-y-4 fluid-sm sm:fluid-base">
            <div class="interactive interaction-hover p-3 rounded-xl bg-white/5">
              <span class="block opacity-70 text-xs uppercase tracking-wider mb-1">Feels Like</span>
              <p class="fluid-lg font-semibold tabular-nums">
                {{ weather.feelsLike | number : '1.0-0' }}°
              </p>
            </div>
            <div class="interactive interaction-hover p-3 rounded-xl bg-white/5">
              <span class="block opacity-70 text-xs uppercase tracking-wider mb-1">Humidity</span>
              <p class="fluid-lg font-semibold tabular-nums">{{ weather.humidity }}%</p>
            </div>
            <div class="interactive interaction-hover p-3 rounded-xl bg-white/5">
              <span class="block opacity-70 text-xs uppercase tracking-wider mb-1">Wind</span>
              <p class="fluid-lg font-semibold tabular-nums">
                {{ weather.windSpeed | number : '1.0-1' }} {{ unit === 'metric' ? 'm/s' : 'mph' }}
              </p>
            </div>
            <div class="interactive interaction-hover p-3 rounded-xl bg-white/5">
              <span class="block opacity-70 text-xs uppercase tracking-wider mb-1">Updated</span>
              <p class="fluid-lg font-semibold">
                {{ weather.timestamp * 1000 | date : 'shortTime' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class CurrentWeatherComponent {
  @Input() weather!: CurrentWeather;
  @Input() unit: TemperatureUnit = 'metric';
}
