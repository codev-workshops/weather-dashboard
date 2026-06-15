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
      <div class="glass-card mt-6 p-4 sm:p-6">
        <h3 class="mb-4 fluid-lg font-semibold flex items-center gap-2">
          <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Hourly Forecast
        </h3>
        <div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
          @for (hour of forecast.hours; track hour.time) {
            <div class="interactive interaction-hover flex flex-shrink-0 flex-col items-center rounded-2xl bg-white/10 px-5 py-4 snap-center min-w-[100px]">
              <span class="fluid-sm opacity-70 mb-2">
                {{ hour.time * 1000 | date : 'HH:mm' }}
              </span>
              <div class="relative group">
                <img
                  [src]="'https://openweathermap.org/img/wn/' + hour.icon + '@2x.png'"
                  [alt]="hour.description"
                  class="h-12 w-12 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <span class="fluid-base font-semibold mt-2 tabular-nums">
                {{ hour.temperature | number : '1.0-0' }}°
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
