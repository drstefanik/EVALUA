/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary)',
          contrast: 'var(--brand-primary-contrast)',
        },
        // Legacy aliases kept so existing utility classes like `bg-binavy`
        // continue to work while we gradually migrate screens to the new
        // design tokens.
        binavy: '#00247D',
        bireg: '#CF142B',
        biwhite: '#FFFFFF',
        surface: {
          base: 'var(--surface-base)',
          muted: 'var(--surface-muted)',
          elevated: 'var(--surface-elevated)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        textc: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
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
