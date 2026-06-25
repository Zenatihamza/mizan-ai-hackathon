/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#D4AF37",
          dark: "#A8862B",
          light: "#E6C75A",
        },
      },
      fontFamily: {
        display: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
