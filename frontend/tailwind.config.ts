import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a237e', // Deep Royal Blue
          dark: '#000051',
          light: '#534bae',
        },
        secondary: {
          DEFAULT: '#ffa000', // Amber/Gold
          dark: '#c67100',
          light: '#ffd149',
        },
        success: '#2e7d32',
        warning: '#ed6c02',
        danger: '#d32f2f',
        info: '#0288d1',
        background: '#f5f5f5',
        surface: '#ffffff',
        muted: '#9e9e9e',
      },
      fontFamily: {
        sans: ['var(--font-rubik)', 'Rubik', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'premium-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
export default config
