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
          900: '#050D1F',
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
        // 5. Gold / Amber — warm CTA accent
        gold: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sora)',  'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm':    '0 0 15px rgba(30, 58, 138, 0.30)',
        'glow-md':    '0 0 30px rgba(30, 58, 138, 0.40)',
        'glow-lg':    '0 0 60px rgba(30, 58, 138, 0.50)',
        'glow-sky':   '0 0 30px rgba(79,  163, 209, 0.40)',
        'glow-green': '0 0 30px rgba(109, 190, 69,  0.40)',
        'glow-gold':  '0 0 30px rgba(245, 158, 11,  0.40)',
      },
      animation: {
        'fade-in':       'fadeIn 0.6s ease-out',
        'slide-up':      'slideUp 0.6s ease-out',
        'count-up':      'countUp 2s ease-out',
        'gradient-shift':'gradientShift 6s ease infinite',
        'glow-pulse':    'glowPulse 2.5s ease-in-out infinite',
        'float-slow':    'floatSlow 8s ease-in-out infinite',
        'shimmer-text':  'shimmerText 2.5s linear infinite',
        'bounce-gentle': 'bounceGentle 2.2s ease-in-out infinite',
        'spin-slow':     'spin 10s linear infinite',
        'border-spin':   'borderSpin 4s linear infinite',
        'scale-in':      'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(30,58,138,0.25)' },
          '50%':      { boxShadow: '0 0 50px rgba(30,58,138,0.55), 0 0 80px rgba(45,92,200,0.25)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-14px)' },
        },
        shimmerText: {
          to: { backgroundPosition: '200% center' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        borderSpin: {
          to: { '--angle': '360deg' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #050D1F 0%, #0A1440 35%, #1E3A8A 70%, #2D5CC8 100%)',
        'cta-gradient':  'linear-gradient(135deg, #0F1F50 0%, #1E3A8A 50%, #162C6E 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'section-gradient': 'linear-gradient(180deg, #EEF8FD 0%, #ffffff 100%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
      },
    },
  },
  plugins: [],
}

export default config
