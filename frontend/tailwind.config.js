/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        navy: { 900: "#060b24", 800: "#0b1233", 700: "#141c45" },
        brand: {
          50: "#f4f1ff",
          100: "#ebe5ff",
          200: "#d7cdff",
          300: "#b9a6ff",
          400: "#9a7bff",
          500: "#7c4dff",
          600: "#6a2df5",
          700: "#5a1fe0",
          800: "#4a19b8",
          900: "#3d1794",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -8px rgba(16,24,40,0.08)",
        glow: "0 12px 30px -10px rgba(106,45,245,0.55)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg,#7c4dff 0%,#5a1fe0 100%)",
        "banner-gradient": "linear-gradient(100deg,#5a1fe0 0%,#7c4dff 60%,#8f5cff 100%)",
      },
    },
  },
  plugins: [],
};
