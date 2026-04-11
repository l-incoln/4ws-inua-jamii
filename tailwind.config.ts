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
        // 1. Deep Royal Blue — primary: headers, buttons, key actions
        primary: {
          50:  '#EEF4FF',
          100: '#D9E5FF',
          200: '#B3CBFF',
          400: '#4D7FF0',
          500: '#2D5CC8',
          600: '#1E3A8A',   // ← brand core
          700: '#162C6E',
          800: '#0F1F50',
          900: '#081232',
        },
        // 2. Sky Blue — secondary: backgrounds, highlights, cards
        sky: {
          50:  '#EEF8FD',
          100: '#D4EDF9',
          200: '#A9DBF3',
          400: '#65B5E0',
          500: '#4FA3D1',   // ← brand core
          600: '#3A87B3',
          700: '#2D6A8E',
        },
        // 3 & 4. Growth Green (light) + Accent Green (bright) — CTAs, success, icons
        green: {
          50:  '#F3FBE8',
          100: '#E5F5CF',
          200: '#CAEAA0',
          400: '#7AC142',   // ← brand core (light green)
          500: '#6DBE45',   // ← brand core (accent green)
          600: '#559135',
          700: '#3E6A27',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'count-up': 'countUp 2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0A1438 0%, #1E3A8A 60%, #2D5CC8 100%)',
        'section-gradient': 'linear-gradient(180deg, #EEF8FD 0%, #ffffff 100%)',
      },
    },
  },
  plugins: [],
}

export default config
