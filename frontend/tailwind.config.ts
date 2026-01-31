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
          DEFAULT: '#00A896',
          dark: '#008577',
          light: '#E0F5F3',
        },
        secondary: {
          DEFAULT: '#2C3E50',
        },
        text: {
          primary: '#2C3E50',
          secondary: '#7F8C8D',
          muted: '#BDC3C7',
        },
        bg: {
          main: '#F5F7FA',
        },
        success: '#27AE60',
        warning: '#F39C12',
        danger: '#E74C3C',
        info: '#3498DB',
      },
      fontFamily: {
        sans: ['var(--font-rubik)', 'Rubik', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
export default config
