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
      class="mx-auto max-w-md rounded-xl bg-red-500/20 p-6 text-center backdrop-blur-sm"
    >
      <svg
        class="mx-auto mb-3 h-10 w-10 text-red-300"
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
      <p class="mb-4 text-lg">{{ message }}</p>
      <button
        (click)="retry.emit()"
        class="rounded-lg bg-white/20 px-6 py-2 font-semibold transition hover:bg-white/30"
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
