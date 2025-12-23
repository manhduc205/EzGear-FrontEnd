tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          primary: "#D70018", // Reddish color from the buy buttons
          secondary: "#E04040",
          "background-light": "#F9FAFB",
          "background-dark": "#111827",
          "surface-light": "#FFFFFF",
          "surface-dark": "#1F2937",
          "text-light": "#1F2937",
          "text-dark": "#F3F4F6",
          "border-light": "#E5E7EB",
          "border-dark": "#374151",
          "accent-blue": "#2563EB",
        },
        fontFamily: {
          display: ["Inter", "sans-serif"],
          sans: ["Inter", "sans-serif"],
        },
        borderRadius: {
          DEFAULT: "0.5rem",
          lg: "0.75rem",
          xl: "1rem",
        },
        boxShadow: {
          'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        }
      },
    },
  };
