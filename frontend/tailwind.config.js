/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        darkBackground: '#181818', // Dark background color
        lightText: '#f5f5f5', // Light text color for contrast
        accentColor: '#4ade80', // Vibrant accent color (you can change this)
      },
    },
  },
  darkMode: 'class', // Enable dark mode
  plugins: [],
};

