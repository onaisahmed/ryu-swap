/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "custom-color": "#181C14",
        contentBox: "#3C3D37",
        "header-color": "#ECDFCC",
        "button-color": "#FF5733",
        "button-hover": "#fc603f",
      },
    },
  },
  plugins: [],
};
