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
      <div class="rounded-2xl bg-white/10 p-6 backdrop-blur-md">
        <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div class="text-center sm:text-left">
            <div class="flex items-center justify-center gap-2 sm:justify-start">
              <img
                [src]="'https://openweathermap.org/img/wn/' + weather.icon + '@2x.png'"
                [alt]="weather.description"
                class="h-20 w-20"
              />
              <span class="text-6xl font-bold">
                {{ weather.temperature | number : '1.0-0' }}°{{ unit === 'metric' ? 'C' : 'F' }}
              </span>
            </div>
            <p class="mt-1 text-xl capitalize">{{ weather.description }}</p>
          </div>

          <div class="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:text-base">
            <div>
              <span class="opacity-70">Feels like</span>
              <p class="text-lg font-semibold">
                {{ weather.feelsLike | number : '1.0-0' }}°{{ unit === 'metric' ? 'C' : 'F' }}
              </p>
            </div>
            <div>
              <span class="opacity-70">Humidity</span>
              <p class="text-lg font-semibold">{{ weather.humidity }}%</p>
            </div>
            <div>
              <span class="opacity-70">Wind</span>
              <p class="text-lg font-semibold">
                {{ weather.windSpeed | number : '1.0-1' }} {{ unit === 'metric' ? 'm/s' : 'mph' }}
              </p>
            </div>
            <div>
              <span class="opacity-70">Updated</span>
              <p class="text-lg font-semibold">
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
