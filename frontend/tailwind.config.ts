import type { Config } from 'tailwindcss'

function rgbVar(name: string) {
  return `rgb(var(${name}) / <alpha-value>)`
}

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: rgbVar('--brand-primary-rgb'),
          secondary: rgbVar('--brand-secondary-rgb'),
          accent: rgbVar('--brand-accent-rgb'),
          bg: rgbVar('--brand-bg-rgb'),
          surface: rgbVar('--brand-surface-rgb'),
          text: rgbVar('--brand-text-rgb'),
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 12px 40px -20px rgb(var(--brand-text-rgb) / 0.22)',
      },
    },
  },
  plugins: [],
}
export default config
