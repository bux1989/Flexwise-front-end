import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

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
      }
    },
  },
  plugins: [
    forms,
    typography,
  ],
}
