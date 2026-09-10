/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blossom: { 50: '#fff1f6', 100: '#ffe4ee', 300: '#f9a8c3', 500: '#ec5f8f', 700: '#be315f', 900: '#7f1734' },
      },
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        sans: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
