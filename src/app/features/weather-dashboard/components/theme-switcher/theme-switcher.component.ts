import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
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
      @for (theme of themes; track theme.id; let i = $index) {
        <button
          #swatch
          type="button"
          role="radio"
          [attr.aria-checked]="theme.id === active"
          [attr.aria-label]="theme.label"
          [title]="theme.label"
          [tabindex]="theme.id === active ? 0 : -1"
          (click)="themeChange.emit(theme.id)"
          (keydown)="onKeydown($event, i)"
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

  @ViewChildren('swatch') private swatches!: QueryList<ElementRef<HTMLButtonElement>>;

  /**
   * Implements the WAI-ARIA radio group keyboard pattern: arrow keys (plus
   * Home / End) move focus to a swatch and select it, while the group itself
   * stays a single tab stop via roving `tabindex`.
   */
  onKeydown(event: KeyboardEvent, index: number): void {
    const last = this.themes.length - 1;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = index === last ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = index === 0 ? last : index - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.themeChange.emit(this.themes[next].id);
    this.swatches.get(next)?.nativeElement.focus();
  }
}
