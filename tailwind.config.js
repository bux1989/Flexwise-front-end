/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundOpacity: {
        '15': '0.15',
        '25': '0.25',
        '35': '0.35',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'float-gentle': 'float 8s ease-in-out infinite',
        'fall-slow': 'fall 10s ease-in-out infinite',
        'fall-medium': 'fall 6s ease-in-out infinite',
        'fall-gentle': 'fall 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fall: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(5px) rotate(2deg)' },
        }
      }
    },
  },
  plugins: [],
}
