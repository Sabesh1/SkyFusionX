/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Global Theme Variables
        theme: {
          bg: 'var(--theme-bg)',
          surface: 'var(--theme-surface)',
          card: 'var(--theme-card)',
          border: 'var(--theme-border)',
          'border-hover': 'var(--theme-border-hover)',
          muted: 'var(--theme-muted)',
          text: 'var(--theme-text)',
          'text-secondary': 'var(--theme-text-secondary)',
          glass: 'var(--theme-glass)',
          accent: 'var(--theme-accent)',
          primary: 'var(--theme-primary)',
          'primary-hover': 'var(--theme-primary-hover)',
          secondary: 'var(--theme-secondary)',
          'secondary-hover': 'var(--theme-secondary-hover)',
        },
        intel: {
          gold: '#0D9488', // Teal instead of Gold
          goldDim: 'rgba(13, 148, 136, 0.15)', // Teal dim
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
        'primary-glow': '0 0 25px -5px rgba(13, 148, 136, 0.35)', // Teal glow
        'primary-sm': '0 0 12px -2px rgba(13, 148, 136, 0.25)',
        'card-emboss': '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card-inset': 'inset 0 2px 6px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'primary-spin': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
};
