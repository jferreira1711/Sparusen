/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: "#2471A3", dark: "#1A3A5C", light: "#D6EAF8" },
        secondary: { DEFAULT: "#148F77", dark: "#0e6b59", light: "#D1F2EB" },
        accent:    { DEFAULT: "#D35400" },
      }
    },
  },
  plugins: [],
}