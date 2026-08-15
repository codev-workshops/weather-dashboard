import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ColorTheme, ColorThemeId } from '../../../../models/theme.model';

/**
 * Presentational colour-theme picker rendered as a row of swatches.
 *
 * @Input  themes      - Available colour themes.
 * @Input  active      - Identifier of the currently selected theme.
 * @Output themeChange - Emitted with the theme the user picked.
 */
@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  template: `
    <div
      class="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2"
      role="radiogroup"
      aria-label="Colour theme"
    >
      @for (theme of themes; track theme.id) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="theme.id === active"
          [attr.aria-label]="theme.label"
          [title]="theme.label"
          (click)="themeChange.emit(theme.id)"
          class="focus-ring interactive h-7 w-7 rounded-full border-2 transition-all duration-300"
          [class.border-white]="theme.id === active"
          [class.scale-110]="theme.id === active"
          [class.border-transparent]="theme.id !== active"
          [style.background]="theme.swatch"
        ></button>
      }
    </div>
  `,
})
export class ThemeSwitcherComponent {
  @Input() themes: ColorTheme[] = [];
  @Input() active: ColorThemeId = 'green';
  @Output() themeChange = new EventEmitter<ColorThemeId>();
}
