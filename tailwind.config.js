/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        binavy: "#00247D",
        bireg: "#CF142B",
        biwhite: "#FFFFFF",
      },
      boxShadow: {
        soft: "0 18px 45px -15px rgba(0, 36, 125, 0.35)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(180deg,rgba(0,36,125,0.08),transparent 60%)",
        "network": "url('/src/assets/network.svg')",
      },
      keyframes: {
        "gradient-x": {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        "gradient-x": "gradient-x 12s ease infinite",
      },
    },
  },
  plugins: [],
}
