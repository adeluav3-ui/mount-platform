/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        naijaGreen: "#009E60",
        darkGreen: "#006400",
      },
    },
  },
  plugins: [],
}