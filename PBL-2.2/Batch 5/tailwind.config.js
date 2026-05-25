export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sweety: {
          red: "#2563eb",
          crimson: "#1e40af",
          blush: "#eff6ff",
          blue: "#2563eb",
          sky: "#0ea5e9",
          indigo: "#4f46e5",
          cyan: "#ecfeff",
          ink: "#0f172a"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};
