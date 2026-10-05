/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#187FF6",
        accent: "#EFC718",
        surface: "#F0F0F0",
        field: "#F3F6FF",
        ink: "#111827",
        "ink-muted": "#6B7280",
        route: "#F0553F",
      },
    },
  },
  plugins: [],
};
