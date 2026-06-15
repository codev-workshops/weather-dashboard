# Frontend Design Skills

Modern frontend design skills for creating contemporary, accessible, and performant web interfaces. This skill covers current 2024-2025 design trends, CSS architecture, accessibility standards, and best practices.

## Core Design Principles

### Hierarchy & Visual Organization
- **Type Scale**: Use consistent modular scales (1.2-1.5 ratios) for typography
- **Visual Weight**: Size, color, and position guide user attention
- **Spacing**: 8-point grid system for consistent spacing (4px base unit)
- **Grouping**: Related elements clustered with whitespace separation

### Consistency & Mental Models
- **Pattern Repetition**: Users build mental models - don't break consistency
- **Predictable Interactions**: Similar controls behave similarly
- **Language Consistency**: Terminology remains uniform across interface

### Affordance & Feedback
- **Interactive Cues**: Buttons/links must look interactive (hover states, cursor changes)
- **Immediate Response**: Every action deserves feedback (loading, success, error states)
- **Error Prevention**: Design prevents errors before they happen
- **Clear Focus States**: Visible focus rings for keyboard navigation

## Modern CSS Architecture (2025 Standards)

### CSS Cascade Layers
```css
@layer reset, base, components, utilities, overrides;

@layer reset {
  /* CSS reset/normalize */
}

@layer base {
  /* Base HTML element styles */
}

@layer components {
  /* Component-specific styles */
}

@layer utilities {
  /* Utility classes */
}

@layer overrides {
  /* Emergency overrides only */
}
```

### Native CSS Nesting
```css
.card {
  padding: 1rem;

  &:hover {
    transform: translateY(-2px);
  }

  & .title {
    font-size: 1.25rem;
  }
}
```

### Container Queries
```css
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

## Color Systems (OKLCH Standard)

### Why OKLCH Over HSL
- Better perceptual uniformity
- Enables relative color manipulation
- Wider gamut support
- Baseline 2025 browser support

### Design Token Structure
```css
:root {
  /* Primitive tokens */
  --color-primary-50: oklch(0.95 0.01 250);
  --color-primary-100: oklch(0.90 0.02 250);
  --color-primary-500: oklch(0.65 0.15 250);
  --color-primary-900: oklch(0.35 0.10 250);

  /* Semantic tokens */
  --color-background: var(--color-primary-50);
  --color-surface: oklch(from var(--color-background) l c h);
  --color-text-primary: oklch(0.2 0.02 250);
  --color-text-secondary: oklch(0.4 0.02 250);

  /* Component tokens */
  --color-button-bg: var(--color-primary-500);
  --color-button-text: oklch(0.98 0 0);
}
```

### Relative Color Manipulation
```css
.button:hover {
  background-color: oklch(from var(--color-button-bg) l c h / 0.9);
}

.button:active {
  background-color: oklch(from var(--color-button-bg) calc(l - 5%) c h);
}
```

## Modern Layout Patterns

### Bento Grid Layouts
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, minmax(180px, auto));
  gap: 1rem;
}

.bento-item-large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-item-wide {
  grid-column: span 2;
}
```

### Liquid Glass Effects
```css
.glass {
  background: oklch(from var(--color-background) l c h / 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid oklch(from var(--color-background) l c h / 0.2);
  box-shadow:
    0 4px 6px -1px oklch(0 0 0 / 0.1),
    0 2px 4px -2px oklch(0 0 0 / 0.1);
}
```

## Animation & Micro-interactions

### CSS Scroll-Driven Animations
```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-reveal {
  animation: fade-in 0.6s ease-out;
  animation-timeline: view();
  animation-range: entry 10% cover 30%;
}
```

### View Transitions API
```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

@keyframes slide-out {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}
```

### Performance-First Animations
```css
/* Use compositor-only properties */
.animated {
  transform: translateZ(0);
  will-change: transform;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .animated {
    transition: none;
    animation: none;
  }
}
```

## Accessibility (WCAG 2.2 + EAA 2025)

### Contrast Requirements
- **Body Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **Interactive Elements**: 3:1 minimum
- **Use APCA**: More accurate than WCAG 2 for perceptual contrast

### Focus Management
```css
/* Visible focus indicators */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Skip navigation link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary-500);
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### Touch Target Sizes
- **Minimum**: 24×24 CSS pixels (WCAG AA)
- **Recommended**: 44×44 pixels (enhanced touch baseline)
- **Spacing**: 8px minimum between interactive elements

### Semantic HTML
```html
<!-- Use proper heading hierarchy -->
<h1>Main title</h1>
<h2>Section title</h2>
<h3>Subsection title</h3>

<!-- Accessible forms -->
<label for="email">Email address</label>
<input
  type="email"
  id="email"
  name="email"
  aria-describedby="email-hint"
  required
>
<span id="email-hint" class="hint">We'll never share your email</span>

<!-- Accessible buttons -->
<button aria-label="Close dialog" type="button">
  <span aria-hidden="true">&times;</span>
</button>
```

## Performance Optimization

### Core Web Vitals
```css
/* LCP: Largest Contentful Paint */
.hero-image {
  fetchpriority: high;
  content-visibility: auto;
  contain-intrinsic-size: 800px 600px;
}

/* CLS: Cumulative Layout Shift */
img, video {
  display: block;
  max-width: 100%;
  height: auto;
}

/* INP: Interaction to Next Paint */
.interactive {
  contain: layout style paint;
}
```

### Content Visibility
```css
.offscreen-content {
  content-visibility: auto;
  contain-intrinsic-size: 1000px;
}
```

### Image Optimization
```html
<picture>
  <source
    srcset="image.avif"
    type="image/avif"
  >
  <source
    srcset="image.webp"
    type="image/webp"
  >
  <img
    src="image.jpg"
    alt="Description"
    loading="lazy"
    width="800"
    height="600"
    decoding="async"
  >
</picture>
```

## Typography Systems

### Fluid Typography
```css
:root {
  --font-size-min: 16px;
  --font-size-max: 20px;
  --font-size-preferred: clamp(
    var(--font-size-min),
    2vw + 1rem,
    var(--font-size-max)
  );
}

body {
  font-size: var(--font-size-preferred);
}
```

### Type Scale
```css
:root {
  --type-scale: 1.25; /* Major third */

  --text-xs: calc(1rem / var(--type-scale) / var(--type-scale));
  --text-sm: calc(1rem / var(--type-scale));
  --text-base: 1rem;
  --text-lg: calc(1rem * var(--type-scale));
  --text-xl: calc(1rem * var(--type-scale) * var(--type-scale));
  --text-2xl: calc(1rem * var(--type-scale) * var(--type-scale) * var(--type-scale));
}
```

### Line Height & Readability
```css
body {
  line-height: 1.6;
  max-width: 65ch; /* Optimal reading length */
}

h1, h2, h3 {
  line-height: 1.2;
}
```

## Component Patterns

### Card Component
```css
.card {
  container-type: inline-size;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 1px 3px oklch(0 0 0 / 0.12),
    0 1px 2px oklch(0 0 0 / 0.24);
}

@container (min-width: 300px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

### Button Component
```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-height: 44px; /* Touch-friendly */
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px oklch(0 0 0 / 0.15);
}

.button:active {
  transform: translateY(0);
}

.button:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

## Dark Mode Design

### Dark Mode First Approach
```css
:root {
  --color-background: oklch(0.15 0.01 250);
  --color-surface: oklch(0.20 0.01 250);
  --color-text-primary: oklch(0.95 0.01 250);
  --color-text-secondary: oklch(0.75 0.01 250);
}

@media (prefers-color-scheme: light) {
  :root {
    --color-background: oklch(0.98 0.01 250);
    --color-surface: oklch(1 0 0);
    --color-text-primary: oklch(0.15 0.01 250);
    --color-text-secondary: oklch(0.4 0.01 250);
  }
}
```

### Dark Mode Best Practices
- Reduce saturation for dark backgrounds
- Increase contrast for text
- Use subtle shadows instead of heavy borders
- Avoid pure black (#000) - use dark grays instead
- Test colorblind accessibility in both modes

## Modern Visual Trends (2025)

### 1. Bento Grids
- Asymmetric card layouts with varied sizes
- Inspired by Apple's product pages
- Great for dashboards and feature sections

### 2. Liquid Glass
- Subtle transparency with blur effects
- Soft borders and layered shadows
- Works well on floating surfaces

### 3. Glow Effects
- Luminous accents and light blooms
- Used for emphasis and interaction feedback
- Electric blues, neon accents with dark backgrounds

### 4. AI Minimalism
- Clean layouts with bold typography
- Generous whitespace
- Inspired by OpenAI/Perplexity aesthetics
- Perfect for SaaS and AI products

### 5. Kinetic Typography
- Scroll or cursor responsive text
- Dynamic headlines that respond to user interaction
- Creates engaging hero sections

### 6. Neo-Brutalism
- Bold colors, thick borders
- Raw, unpolished aesthetic
- Works for creative agencies and portfolios

## Design Handoff Pattern

### design.md Structure
```yaml
# Design System Handoff

tokens:
  colors:
    primary:
      light: oklch(0.65 0.15 250)
      dark: oklch(0.70 0.12 250)
  spacing:
    base: 4px
    scale: 8

components:
  button:
    states:
      default:
        background: primary
        text: white
      hover:
        background: primary-dark
        transform: translateY(-1px)

accessibility:
  contrast_ratio: 4.5:1
  touch_targets: 44px
  focus_visible: true
```

## Browser Support Baseline (2025)

### Widely Supported
- CSS Grid: ✓ (Baseline 2020)
- Container Queries: ✓ (Chrome 105+, Safari 16+, Firefox 110+)
- CSS Nesting: ✓ (All major browsers)
- `:has()` selector: ✓ (Chrome 105+, Safari 15.4+, Firefox 121+)
- View Transitions: ✓ (Chrome 111+, Safari 18+)
- OKLCH colors: ✓ (All major browsers)

### Progressive Enhancement
- Use modern features with fallbacks
- `@supports` queries for feature detection
- Graceful degradation for older browsers

## Quick Reference Checklist

### Design Phase
- [ ] Define color system using OKLCH
- [ ] Establish typography scale
- [ ] Plan component architecture
- [ ] Map user flows and interactions
- [ ] Consider accessibility from start

### Implementation Phase
- [ ] Use semantic HTML elements
- [ ] Implement proper heading hierarchy
- [ ] Add focus states for all interactive elements
- [ ] Ensure touch targets meet size requirements
- [ ] Test color contrast ratios
- [ ] Implement dark mode support
- [ ] Add loading and error states
- [ ] Optimize images and media

### Testing Phase
- [ ] Keyboard navigation test
- [ ] Screen reader compatibility
- [ ] Mobile responsiveness check
- [ ] Performance audit (Lighthouse)
- [ ] Cross-browser testing
- [ ] Colorblind accessibility testing

This skill provides a comprehensive foundation for modern frontend design, emphasizing accessibility, performance, and contemporary visual patterns while maintaining future-proof CSS architecture.