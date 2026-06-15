import { Component } from '@angular/core';

/** Standalone CSS-only loading spinner styled with Tailwind. */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="flex items-center justify-center py-20">
      <div class="relative">
        <div
          class="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-white"
        ></div>
        <div class="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-white/10 opacity-20"></div>
      </div>
    </div>
  `,
})
export class LoadingSpinnerComponent {}
