import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Location } from '../../../../models/weather.model';

/**
 * Displays the current city name and exposes a text input
 * for manual city search. Emits search queries through `citySearch`.
 */
@Component({
  selector: 'app-location-display',
  standalone: true,
  template: `
    <div class="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      @if (location) {
        <div class="flex items-center gap-3">
          <div class="interactive interaction-hover p-2 rounded-xl bg-white/10">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div>
            <h2 class="fluid-2xl font-bold">{{ location.cityName || 'Current Location' }}</h2>
            <p class="text-sm opacity-70">Weather at your location</p>
          </div>
        </div>
      }
      <div class="relative w-full sm:w-80">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search city..."
          (input)="onInput($event)"
          class="focus-ring w-full rounded-xl bg-white/20 px-4 py-3 pl-10 placeholder-white/60 backdrop-blur-sm
               outline-none transition-all duration-300 focus:bg-white/30 focus:shadow-glow"
        />
      </div>
    </div>
  `,
})
export class LocationDisplayComponent {
  @Input() location!: Location;
  @Output() citySearch = new EventEmitter<string>();

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.citySearch.emit(value);
  }
}
