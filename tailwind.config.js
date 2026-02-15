/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: {
            DEFAULT: "#1E6FAE",
            50: "#E6F1FA",
            100: "#CCE3F5",
            200: "#99C7EB",
            300: "#66ABE1",
            400: "#338FD7",
            500: "#1E6FAE",
            600: "#185A8A",
            700: "#124467",
            800: "#0C2D44",
            900: "#061721"
          },
          accent: {
            DEFAULT: "#F7941D",
            50: "#FEF3E6",
            100: "#FDE7CC",
            200: "#FBCF99",
            300: "#F9B766",
            400: "#F7A233",
            500: "#F7941D",
            600: "#E88412",
            700: "#C86F0F",
            800: "#A85A0C",
            900: "#884509"
          },
          soft: "#E6F1FA",
          primaryHover: "#155A8A",
          accentHover: "#E88412"
        }
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "shimmer": "shimmer 2s infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" }
        }
      }
    }
  },
  plugins: []
};
