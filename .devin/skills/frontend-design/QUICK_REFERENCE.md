# Frontend Design Quick Reference

## Color Decisions

### Choosing Color Palettes
```css
/* Modern approach: OKLCH for better perceptual uniformity */
:root {
  /* Primary brand color */
  --brand-primary: oklch(0.65 0.15 250); /* Blue */

  /* Semantic colors */
  --success: oklch(0.65 0.15 150); /* Green */
  --warning: oklch(0.75 0.15 80);  /* Yellow/Orange */
  --error: oklch(0.65 0.15 25);    /* Red */

  /* Neutral scale */
  --gray-50: oklch(0.98 0.01 250);
  --gray-100: oklch(0.95 0.01 250);
  --gray-900: oklch(0.20 0.01 250);
}
```

### Dark Mode Colors
```css
/* Dark mode: reduce saturation, increase contrast */
@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.15 0.01 250);  /* Not pure black */
    --surface: oklch(0.20 0.01 250);
    --text-primary: oklch(0.95 0.01 250);
    --text-secondary: oklch(0.70 0.01 250);
  }
}
```

## Typography Scale

### Standard Type Scale
```css
:root {
  --font-xs: 0.75rem;   /* 12px */
  --font-sm: 0.875rem;  /* 14px */
  --font-base: 1rem;    /* 16px */
  --font-lg: 1.125rem;  /* 18px */
  --font-xl: 1.25rem;   /* 20px */
  --font-2xl: 1.5rem;   /* 24px */
  --font-3xl: 1.875rem; /* 30px */
}
```

### Fluid Typography
```css
/* Scales smoothly between viewport sizes */
.text-fluid {
  font-size: clamp(1rem, 2vw + 1rem, 1.25rem);
}
```

## Spacing System

### 8-Point Grid
```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
}
```

## Component Patterns

### Card Pattern
```css
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--gray-200);
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}
```

### Button Pattern
```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  font-weight: 500;
  min-height: 44px; /* Touch target */
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
```

### Input Pattern
```css
.input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: var(--font-base);
  min-height: 44px;
}

.input:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

## Layout Patterns

### Bento Grid
```css
.bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.bento-item-large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-item-wide {
  grid-column: span 2;
}
```

### Container Query Pattern
```css
.component {
  container-type: inline-size;
}

@container (min-width: 300px) {
  .component {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

## Accessibility Quick Checks

### Contrast Ratios
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

### Focus States
```css
/* Always provide visible focus indicators */
:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}

/* Remove default only if you provide custom */
:focus {
  outline: none;
}
```

### Touch Targets
- Minimum: 24×24px (WCAG AA)
- Recommended: 44×44px
- Spacing: 8px between elements

## Animation Timing

### Standard Easing
```css
/* Ease-out for natural feel */
.transition-natural {
  transition: all 0.3s ease-out;
}

/* Ease-in-out for entering elements */
.transition-enter {
  transition: all 0.3s ease-in-out;
}

/* Linear for continuous motion */
.transition-linear {
  transition: all 0.2s linear;
}
```

### Respect Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Quick Wins

### Image Loading
```html
<!-- Lazy load below-fold images -->
<img loading="lazy" src="image.jpg" alt="Description">

<!-- Priority for hero images -->
<img fetchpriority="high" src="hero.jpg" alt="Hero">

<!-- Always include dimensions -->
<img width="800" height="600" src="image.jpg" alt="Description">
```

### Content Visibility
```css
/* Skip rendering off-screen content */
.offscreen {
  content-visibility: auto;
  contain-intrinsic-size: 1000px;
}
```

### Font Loading
```css
/* Prevent layout shift */
html {
  font-display: swap;
}
```

## Common Design Problems

### Center Content
```css
/* Flexbox center */
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Grid center */
.center {
  display: grid;
  place-items: center;
}
```

### Truncate Text
```css
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.truncate-multiline {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### Remove Scrollbar but Keep Functionality
```css
.no-scrollbar {
  scrollbar-width: none; /* Firefox */
}

.no-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
```

## Responsive Breakpoints

### Standard Breakpoints
```css
/* Mobile-first approach */
.component {
  /* Mobile styles (default) */
}

@media (min-width: 640px) {
  /* Small tablets */
}

@media (min-width: 768px) {
  /* Tablets */
}

@media (min-width: 1024px) {
  /* Desktop */
}

@media (min-width: 1280px) {
  /* Large desktop */
}
```

## Modern CSS Features

### CSS Variables
```css
:root {
  --primary-color: oklch(0.65 0.15 250);
}

.button {
  background: var(--primary-color);
}
```

### CSS Nesting
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

### :has() Selector
```css
/* Style parent based on children */
.card:has(.badge) {
  border-color: var(--brand-primary);
}

/* Style form when input is invalid */
.form:has(:invalid) {
  border-color: var(--error);
}
```

## Design Tokens Example

```css
:root {
  /* Colors */
  --color-primary: oklch(0.65 0.15 250);
  --color-secondary: oklch(0.65 0.15 150);

  /* Typography */
  --font-family-base: system-ui, -apple-system, sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.6;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
}
```

## Browser Compatibility

### Use @supports for Progressive Enhancement
```css
@supports (backdrop-filter: blur(10px)) {
  .glass {
    backdrop-filter: blur(10px);
  }
}

@supports (container-type: inline-size) {
  .component {
    container-type: inline-size;
  }
}
```

This quick reference provides the most commonly used modern frontend design patterns and decisions for daily development work.