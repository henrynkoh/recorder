/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#FF3B30',
        secondary: '#007AFF',
        darkBg: '#1C1C1E',
        lightBg: '#F2F2F7',
        darkText: '#333333',
        lightText: '#F2F2F7',
      },
    },
  },
  plugins: [],
} 