import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Presentational error card with a retry button.
 *
 * @Input  message - Human-readable error text.
 * @Output retry   - Emitted when the user clicks "Retry".
 */
@Component({
  selector: 'app-error-message',
  standalone: true,
  template: `
    <div
      class="mx-auto max-w-md glass-card bg-amber-500/20 border-amber-500/30 p-8 text-center"
    >
      <div class="relative inline-block mb-4">
        <div class="absolute inset-0 bg-amber-400/20 rounded-full blur-xl animate-pulse-slow"></div>
        <svg
          class="relative mx-auto h-16 w-16 text-amber-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p class="mb-6 fluid-lg font-medium">{{ message }}</p>
      <button
        (click)="retry.emit()"
        class="focus-ring interactive interaction-hover rounded-xl bg-white/20 px-8 py-3 fluid-base font-semibold transition-all duration-300 hover:bg-white/30 hover:shadow-glow"
      >
        Retry
      </button>
    </div>
  `,
})
export class ErrorMessageComponent {
  @Input() message = 'An error occurred.';
  @Output() retry = new EventEmitter<void>();
}
