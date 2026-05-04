/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg:      'var(--bg-app)',
          surface: 'var(--bg-surface)',
          card:    'var(--bg-card)',
          border:  'var(--border)',
          accent:  '#F97316',
          primary: '#2563EB',
          text:    'var(--text-primary)',
          muted:   'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
