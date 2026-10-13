/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat_400Regular"],
        medium: ["Montserrat_500Medium"],
        semibold: ["Montserrat_600SemiBold"],
        bold: ["Montserrat_700Bold"],
      },

      colors: {
        primary: "#187FF6",
        accent: "#EFC718",
        surface: "#F0F0F0",
        field: "#F3F6FF",
        ink: "#111827",
        "ink-muted": "#6B7280",
        border: "#E5E9F0",
        route: "#F0553F",
      },
    },
  },
  plugins: [],
};
