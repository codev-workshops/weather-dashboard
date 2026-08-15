import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HourlyForecast, TemperatureUnit } from '../../../../models/weather.model';

@Component({
  selector: 'app-temperature-trend',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (forecast && forecast.hours.length > 1) {
      <div class="glass-card mt-6 p-4 sm:p-6">
        <h3 class="mb-4 fluid-lg font-semibold flex items-center gap-2">
          <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
          Temperature Trend
        </h3>
        <div class="relative w-full overflow-hidden" style="height: 180px;">
          <svg
            class="w-full h-full"
            [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight"
            preserveAspectRatio="none"
          >
            <!-- Grid lines -->
            @for (line of gridLines; track line.y) {
              <line
                [attr.x1]="padding"
                [attr.y1]="line.y"
                [attr.x2]="chartWidth - padding"
                [attr.y2]="line.y"
                stroke="currentColor"
                stroke-opacity="0.1"
                stroke-dasharray="4 4"
              />
              <text
                [attr.x]="padding - 4"
                [attr.y]="line.y + 4"
                fill="currentColor"
                fill-opacity="0.5"
                text-anchor="end"
                class="text-[10px]"
              >{{ line.label }}</text>
            }

            <!-- Gradient fill -->
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="currentColor" stop-opacity="0.3" />
                <stop offset="100%" stop-color="currentColor" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            <path
              [attr.d]="areaPath"
              fill="url(#tempGradient)"
            />

            <!-- Line -->
            <path
              [attr.d]="linePath"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-opacity="0.9"
            />

            <!-- Data points -->
            @for (point of dataPoints; track point.x) {
              <circle
                [attr.cx]="point.x"
                [attr.cy]="point.y"
                r="3.5"
                fill="currentColor"
                fill-opacity="0.9"
                stroke="currentColor"
                stroke-opacity="0.3"
                stroke-width="1"
              />
            }

            <!-- Time labels -->
            @for (point of dataPoints; track point.x; let i = $index) {
              @if (i % labelInterval === 0) {
                <text
                  [attr.x]="point.x"
                  [attr.y]="chartHeight - 4"
                  fill="currentColor"
                  fill-opacity="0.5"
                  text-anchor="middle"
                  class="text-[10px]"
                >{{ point.timeLabel }}</text>
              }
            }
          </svg>
        </div>
      </div>
    }
  `,
})
export class TemperatureTrendComponent implements OnChanges {
  @Input() forecast: HourlyForecast | null = null;
  @Input() unit: TemperatureUnit = 'metric';

  chartWidth = 600;
  chartHeight = 180;
  padding = 40;

  dataPoints: { x: number; y: number; temp: number; timeLabel: string }[] = [];
  linePath = '';
  areaPath = '';
  gridLines: { y: number; label: string }[] = [];
  labelInterval = 2;

  ngOnChanges(): void {
    this.computeChart();
  }

  private computeChart(): void {
    if (!this.forecast || this.forecast.hours.length < 2) return;

    const hours = this.forecast.hours;
    const temps = hours.map((h) => h.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const range = maxTemp - minTemp || 1;

    const plotWidth = this.chartWidth - this.padding * 2;
    const plotHeight = this.chartHeight - this.padding * 2;

    this.dataPoints = hours.map((hour, i) => {
      const x = this.padding + (i / (hours.length - 1)) * plotWidth;
      const y = this.padding + (1 - (hour.temperature - minTemp) / range) * plotHeight;
      const date = new Date(hour.time * 1000);
      const timeLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return { x, y, temp: hour.temperature, timeLabel };
    });

    this.labelInterval = Math.max(1, Math.floor(hours.length / 6));

    this.linePath = this.dataPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    const bottomY = this.padding + plotHeight;
    this.areaPath = this.linePath +
      ` L ${this.dataPoints[this.dataPoints.length - 1].x} ${bottomY}` +
      ` L ${this.dataPoints[0].x} ${bottomY} Z`;

    const gridCount = 4;
    this.gridLines = Array.from({ length: gridCount }, (_, i) => {
      const ratio = i / (gridCount - 1);
      const y = this.padding + ratio * plotHeight;
      const temp = maxTemp - ratio * range;
      return { y, label: `${temp.toFixed(0)}°` };
    });
  }
}
