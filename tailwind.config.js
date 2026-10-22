/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  corePlugins: {
    preflight: false, // Protects WP theme global styles
  },
  theme: {
    extend: {},
  },
  plugins: [],
}