/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. Add these Keyframes
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        // NEW: Visualizer animation
        bounceSlow: {
          '0%, 100%': { height: '10%' },
          '50%': { height: '80%' },
        },

        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" }
        }
      },
      animation: {
        marquee: 'marquee 20s linear infinite',
        // NEW: Visualizer utilities
        'visualizer-1': 'bounceSlow 1s ease-in-out infinite',
        'visualizer-2': 'bounceSlow 1.1s ease-in-out infinite 0.1s',
        'visualizer-3': 'bounceSlow 1.2s ease-in-out infinite 0.2s',
        'visualizer-4': 'bounceSlow 0.9s ease-in-out infinite 0.3s',
        'visualizer-5': 'bounceSlow 1.3s ease-in-out infinite 0.4s',
        blob: "blob 7s infinite",
      },
    },
  },
  plugins: [],
}