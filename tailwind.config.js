/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#FBF5ED', 100: '#F6EBDD', 200: '#ECD5B8', 300: '#E0B789', 400: '#D4A373', 500: '#A56F3D', 600: '#8A572B', 700: '#734820', 800: '#51351F', 900: '#382E29', 950: '#241A12' },
      },
      fontSize: { xs: ['13px', '18px'] },
    },
  },
  plugins: [],
}

