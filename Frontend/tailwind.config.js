/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 60-30-10 distribution theme colors
        'v60': 'var(--color-60)',
        'v30': 'var(--color-30)',
        'v30-hover': 'var(--color-30-hover)',
        'v10': 'var(--color-10)',
        'v10-hover': 'var(--color-10-hover)',
        
        // Custom text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        // Sleeker box outlines with reduced roundedness
        'default': '8px',
        'card': '12px',
      },
      boxShadow: {
        'flat-premium': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'flat-premium-light': '0 2px 8px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
