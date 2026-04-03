export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 12px 30px rgba(15, 23, 42, 0.08)",
        panel: "0 24px 60px rgba(15, 23, 42, 0.15)"
      },
     colors: {
  brand: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#5b6cff",
    700: "#4338ca",
    900: "#1e1b4b" // ✅ ADD THIS
  }
}
    }
  },
  plugins: []
};
