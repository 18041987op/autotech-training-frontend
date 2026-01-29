/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1E6FAE",       // AutoRx Blue
          primaryHover: "#155A8A",  // Hover blue
          accent: "#F7941D",        // Orange CTA
          accentHover: "#E88412",   // Orange hover
          soft: "#E6F1FA"           // Soft bg/ring
        }
      }
    }
  },
  plugins: []
};
