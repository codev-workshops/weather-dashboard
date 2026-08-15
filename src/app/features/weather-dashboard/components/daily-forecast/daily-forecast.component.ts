import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyForecast, TemperatureUnit } from '../../../../models/weather.model';

@Component({
  selector: 'app-daily-forecast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (forecast && forecast.days.length > 0) {
      <div class="glass-card mt-6 p-4 sm:p-6">
        <h3 class="mb-4 fluid-lg font-semibold flex items-center gap-2">
          <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          5-Day Forecast
        </h3>
        <div class="space-y-2">
          @for (day of forecast.days; track day.date) {
            <div class="interactive interaction-hover flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <!-- Day name -->
              <span class="w-16 fluid-sm font-medium shrink-0">
                {{ getDayName(day.date) }}
              </span>

              <!-- Weather icon -->
              <img
                [src]="'https://openweathermap.org/img/wn/' + day.icon + '@2x.png'"
                [alt]="day.description"
                class="w-10 h-10 shrink-0"
              />

              <!-- Precipitation -->
              <div class="w-12 fluid-sm text-center shrink-0">
                @if (day.pop > 0) {
                  <span class="text-blue-300">{{ day.pop * 100 | number : '1.0-0' }}%</span>
                }
              </div>

              <!-- Temperature bar -->
              <div class="flex-1 flex items-center gap-2 min-w-0">
                <span class="fluid-sm tabular-nums opacity-70 w-10 text-right shrink-0">
                  {{ day.tempMin | number : '1.0-0' }}°
                </span>
                <div class="flex-1 h-2 rounded-full bg-white/10 relative overflow-hidden">
                  <div
                    class="absolute inset-y-0 rounded-full"
                    [style.left.%]="getTempBarLeft(day.tempMin)"
                    [style.right.%]="getTempBarRight(day.tempMax)"
                    [style.background]="getTempGradient(day.tempMin, day.tempMax)"
                  ></div>
                </div>
                <span class="fluid-sm tabular-nums font-semibold w-10 shrink-0">
                  {{ day.tempMax | number : '1.0-0' }}°
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class DailyForecastComponent {
  @Input() forecast: DailyForecast | null = null;
  @Input() unit: TemperatureUnit = 'metric';

  private globalMin = 0;
  private globalMax = 40;

  getDayName(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return 'Tmrw';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  getTempBarLeft(tempMin: number): number {
    this.computeGlobalRange();
    const range = this.globalMax - this.globalMin || 1;
    return ((tempMin - this.globalMin) / range) * 100;
  }

  getTempBarRight(tempMax: number): number {
    this.computeGlobalRange();
    const range = this.globalMax - this.globalMin || 1;
    return ((this.globalMax - tempMax) / range) * 100;
  }

  getTempGradient(tempMin: number, tempMax: number): string {
    const coldHue = 210;
    const hotHue = 30;
    const range = this.globalMax - this.globalMin || 1;
    const startRatio = (tempMin - this.globalMin) / range;
    const endRatio = (tempMax - this.globalMin) / range;
    const startHue = coldHue + (hotHue - coldHue) * startRatio;
    const endHue = coldHue + (hotHue - coldHue) * endRatio;
    return `linear-gradient(90deg, oklch(0.7 0.12 ${startHue}), oklch(0.75 0.15 ${endHue}))`;
  }

  private computeGlobalRange(): void {
    if (!this.forecast) return;
    const mins = this.forecast.days.map((d) => d.tempMin);
    const maxes = this.forecast.days.map((d) => d.tempMax);
    this.globalMin = Math.min(...mins);
    this.globalMax = Math.max(...maxes);
  }
}
