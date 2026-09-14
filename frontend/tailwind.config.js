/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rf: {
          dark: '#0a0d14',
          card: '#121824',
          border: '#1f293d',
          active: '#00f0ff',
          alert: '#ff0055',
          warning: '#ffb700',
          success: '#00ff88',
          purple: '#9d4edd',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
