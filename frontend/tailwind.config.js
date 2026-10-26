/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          bg: '#D0E2B9',
          input: '#C1D3AE',
          low: '#B8D4A4',
        },
        taupe: {
          DEFAULT: '#A38C70',
          dark: '#8F765E',
          text: '#9C846B',
        },
        cream: '#E5E9CB',
        ink: '#11110D',
      },
      fontFamily: {
        hand: ['"Patrick Hand"', '"Comic Neue"', 'cursive'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
