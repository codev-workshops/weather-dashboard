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
    <div class="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      @if (location) {
        <h2 class="text-2xl font-bold">
          {{ location.cityName || 'Current Location' }}
        </h2>
      }
      <input
        type="text"
        placeholder="Search city..."
        (input)="onInput($event)"
        class="w-full rounded-lg bg-white/20 px-4 py-2 placeholder-white/60 backdrop-blur-sm
               outline-none transition focus:bg-white/30 sm:w-64"
      />
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
