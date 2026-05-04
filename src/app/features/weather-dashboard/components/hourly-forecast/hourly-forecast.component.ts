import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HourlyForecast, TemperatureUnit } from '../../../../models/weather.model';

/**
 * Presentational component that renders a horizontal scrollable
 * list of hourly weather cards for the next 12 hours.
 */
@Component({
  selector: 'app-hourly-forecast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (forecast) {
      <div class="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
        <h3 class="mb-3 text-lg font-semibold">Hourly Forecast</h3>
        <div class="flex gap-4 overflow-x-auto pb-2">
          @for (hour of forecast.hours; track hour.time) {
            <div class="flex flex-shrink-0 flex-col items-center rounded-xl bg-white/10 px-4 py-3">
              <span class="text-sm opacity-70">
                {{ hour.time * 1000 | date : 'HH:mm' }}
              </span>
              <img
                [src]="'https://openweathermap.org/img/wn/' + hour.icon + '.png'"
                [alt]="hour.description"
                class="my-1 h-10 w-10"
              />
              <span class="font-semibold">
                {{ hour.temperature | number : '1.0-0' }}°{{ unit === 'metric' ? 'C' : 'F' }}
              </span>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class HourlyForecastComponent {
  @Input() forecast!: HourlyForecast;
  @Input() unit: TemperatureUnit = 'metric';
}
