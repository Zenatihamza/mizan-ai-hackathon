/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm "justice" palette — overrides the neutral scale used across the app.
        // Espresso / leather / parchment tones taken from the JusticIA brand.
        slate: {
          50: "#faf5ef",
          100: "#f4eae0",
          200: "#e8d8c9",
          300: "#d2b9a6",
          400: "#b08c76",
          500: "#876451",
          600: "#5c4233",
          700: "#3f2a1f",
          800: "#2c1c14",
          900: "#1f130d",
          950: "#160d09",
        },
        gold: {
          DEFAULT: "#cf9a4e",
          dark: "#a8763a",
          light: "#e6bd72",
        },
        copper: {
          DEFAULT: "#c87f55",
          dark: "#9c6240",
          light: "#dba07c",
        },
        maroon: {
          DEFAULT: "#7a2e2a",
          dark: "#5a201d",
          light: "#a8453f",
        },
      },
      fontFamily: {
        display: ['"Inter"', "system-ui", "sans-serif"],
        brand: ['"Playfair Display"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
