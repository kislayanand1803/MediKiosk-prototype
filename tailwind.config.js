/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        medical: {
          50: "#eff6ff",
          100: "#dbeafe",
          600: "#2563eb",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};
