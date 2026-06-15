/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // OKLCH color system for better perceptual uniformity
        primary: {
          50: 'oklch(0.98 0.01 150)',
          100: 'oklch(0.95 0.02 150)',
          200: 'oklch(0.90 0.04 150)',
          300: 'oklch(0.82 0.08 150)',
          400: 'oklch(0.70 0.12 150)',
          500: 'oklch(0.60 0.15 150)',
          600: 'oklch(0.50 0.15 150)',
          700: 'oklch(0.40 0.12 150)',
          800: 'oklch(0.32 0.08 150)',
          900: 'oklch(0.25 0.05 150)',
          950: 'oklch(0.15 0.03 150)',
        },
      },
      spacing: {
        // 8-point grid system
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.5rem + 1.875vw, 2.25rem)',
        'fluid-4xl': 'clamp(2.25rem, 1.8rem + 2.25vw, 3rem)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.25)',
        'glow': '0 0 20px rgba(255, 255, 255, 0.3)',
        'glow-strong': '0 0 30px rgba(255, 255, 255, 0.5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}

