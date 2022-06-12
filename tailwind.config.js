module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
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
}