/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0B1120',
        surface: {
          DEFAULT: '#111827',
          raised: '#1E293B',
        },
        border: {
          subtle: '#1F2937',
        },
        text: {
          primary: '#F1F5F9',
          muted: '#94A3B8',
        },
        accent: {
          primary: '#10B981',
          secondary: '#06B6D4',
        },
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
