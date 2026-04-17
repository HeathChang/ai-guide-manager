/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'rgb(var(--color-bg-base) / <alpha-value>)',
          card: 'rgb(var(--color-bg-card) / <alpha-value>)',
          muted: 'rgb(var(--color-bg-muted) / <alpha-value>)',
          accent: 'rgb(var(--color-bg-accent) / <alpha-value>)',
        },
        text: {
          main: 'rgb(var(--color-text-main) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
          accent: 'rgb(var(--color-text-accent) / <alpha-value>)',
        },
        border: {
          base: 'rgb(var(--color-border-base) / <alpha-value>)',
          accent: 'rgb(var(--color-border-accent) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          hover: 'rgb(var(--color-brand-hover) / <alpha-value>)',
        },
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        btn: 'var(--radius-btn)',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
