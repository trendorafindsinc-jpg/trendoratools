/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf6',
          100: '#dcfce9',
          500: '#245a46',
          600: '#1b4636',
          700: '#163a2d'
        }
      }
    }
  },
  plugins: []
};
