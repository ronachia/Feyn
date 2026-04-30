/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg:      '#FAFAFA',
          surface: '#F0F4FF',
          card:    '#FFFFFF',
          border:  '#E2E8F0',
          accent:  '#F97316',
          primary: '#2563EB',
          text:    '#0F172A',
          muted:   '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
