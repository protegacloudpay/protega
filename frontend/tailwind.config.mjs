/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        protega: {
          teal: '#0E7C86',
          'teal-dark': '#0A4E54',
          gold: '#F2B705',
        },
      },
    },
  },
  plugins: [],
}

