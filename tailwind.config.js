/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Luxury Charcoal & Obsidian Slate
        obsidian: {
          950: '#0E0E11',
          900: '#141418',
          850: '#18181E',
          800: '#1F1F26',
          750: '#25252F',
          700: '#2E2E3A',
          600: '#424252',
          500: '#68687C',
        },
        // Champagne Gold & Bronze Luxury Accents
        gold: {
          50: '#FDF8F0',
          100: '#F9ECD9',
          200: '#F3D9B5',
          300: '#EBC38A',
          400: '#E5A962', // Primary Brand Gold
          500: '#D49547',
          600: '#B87B32',
          700: '#945E24',
          800: '#73461A',
          900: '#523112',
          950: '#2E1A08',
        },
        // Command Canvas Theme
        command: {
          bg: '#0F0F13',
          surface: '#15151B',
          card: '#1A1A22',
          cardHover: '#20202B',
          border: '#272734',
          borderHover: '#E5A962',
          muted: '#717182',
          text: '#EEEEF2',
          textMuted: '#9D9DAE',
        },
        intel: {
          gold: '#E5A962',
          goldDim: 'rgba(229, 169, 98, 0.15)',
          amber: '#F59E0B',
          cyan: '#38BDF8',
          purple: '#C084FC',
        },
        severity: {
          low: '#34D399',
          moderate: '#FBBF24',
          high: '#FB923C',
          critical: '#F87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(229, 169, 98, 0.35)',
        'gold-sm': '0 0 12px -2px rgba(229, 169, 98, 0.25)',
        'card-emboss': '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card-inset': 'inset 0 2px 6px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gold-spin': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
};
