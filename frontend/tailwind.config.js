/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#dc2626', dark: '#991b1b', light: '#fca5a5' },
      },
    },
  },
  plugins: [],
};
