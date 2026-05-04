import { Component } from '@angular/core';

/** Standalone CSS-only loading spinner styled with Tailwind. */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="flex items-center justify-center py-16">
      <div
        class="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white"
      ></div>
    </div>
  `,
})
export class LoadingSpinnerComponent {}
