/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundColor: {
        darkgray: "#201c1c",
        darkestgray: "#100E0E"
      },
      fontFamily: {
        'Readex': ['Readex Pro', 'sans-serif']
      }
    }
  },
  plugins: []
}