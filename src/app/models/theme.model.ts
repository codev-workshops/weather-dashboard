/**
 * Identifier of a user-selectable colour theme.
 *
 * The weather-condition gradients are hue-driven, so a colour theme only needs
 * to supply the base hue (and a neighbouring accent hue) used by `styles.scss`.
 */
export type ColorThemeId = 'green' | 'blue' | 'violet' | 'amber' | 'rose';

export interface ColorTheme {
  id: ColorThemeId;
  /** Human-readable name shown in the theme picker. */
  label: string;
  /** Representative swatch colour for the picker. */
  swatch: string;
}
