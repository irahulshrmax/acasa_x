// tailwind.config.ts
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: "class", // class-based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
    extend: {
      // ---------- SCREENS / BREAKPOINTS ----------
      screens: {
        xs: "475px",
        ...defaultTheme.screens,
        "3xl": "1920px",
        "4xl": "2560px",
      },

      // ---------- FONTS ----------
      fontFamily: {
        sans: ["Inter", "system-ui", ...defaultTheme.fontFamily.sans],
        display: ["Cal Sans", "Inter", ...defaultTheme.fontFamily.sans],
        mono: ["JetBrains Mono", ...defaultTheme.fontFamily.mono],
      },

      // ---------- CUSTOM COLORS ----------
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        surface: {
          light: "#ffffff",
          dark: "#0a0a0a",
          muted: "#f5f5f5",
        },
        border: {
          light: "#e5e7eb",
          dark: "#27272a",
        },
      },

      // ---------- SPACING ----------
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
        "144": "36rem",
      },

      // ---------- ANIMATIONS & KEYFRAMES (Enhanced) ----------
      keyframes: {
        // Original
        enter: {
          "0%": { opacity: "0", transform: "translateY(-16px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        leave: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-8px) scale(0.97)" },
        },

        // New Animations
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },

      animation: {
        // Base
        enter: "enter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        leave: "leave 0.16s ease forwards",

        // New
        "slide-in": "slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-out": "slide-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.2s ease forwards",
        "fade-out": "fade-out 0.2s ease forwards",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow": "spin-slow 3s linear infinite",
        "spin-slower": "spin-slow 6s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
      },

      // ---------- CUSTOM BACKDROP FILTERS ----------
      backdropBlur: {
        xs: "2px",
      },

      // ---------- BOX SHADOWS ----------
      boxShadow: {
        "glow": "0 0 20px rgba(14, 165, 233, 0.3)",
        "glow-lg": "0 0 40px rgba(14, 165, 233, 0.4)",
        "inner-lg": "inset 0 2px 4px 0 rgb(0 0 0 / 0.06)",
        "soft": "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
      },

      // ---------- BORDER RADIUS ----------
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // ---------- Z-INDEX ----------
      zIndex: {
        "1": "1",
        "2": "2",
        "3": "3",
        "4": "4",
        "5": "5",
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
    },
  },

  // ---------- PLUGINS ----------
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")({
      strategy: "class", // only generate classes
    }),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/container-queries"),

    // ---------- CUSTOM PLUGIN (Utilities) ----------
    plugin(function ({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        ".text-shadow": {
          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
        },
        ".text-shadow-md": {
          textShadow: "0 4px 8px rgba(0,0,0,0.12)",
        },
        ".text-shadow-lg": {
          textShadow: "0 8px 16px rgba(0,0,0,0.15)",
        },
        ".text-shadow-none": {
          textShadow: "none",
        },
        ".bg-gradient-shimmer": {
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
        },
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
        ".scrollbar-default": {
          "-ms-overflow-style": "auto",
          "scrollbar-width": "auto",
          "&::-webkit-scrollbar": {
            display: "block",
          },
        },
      };

      const newComponents = {
        ".card": {
          backgroundColor: theme("colors.surface.light"),
          borderRadius: theme("borderRadius.2xl"),
          boxShadow: theme("boxShadow.soft"),
          padding: theme("spacing.6"),
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: theme("boxShadow.lg"),
            transform: "translateY(-2px)",
          },
          "@media (prefers-color-scheme: dark)": {
            backgroundColor: theme("colors.surface.dark"),
          },
        },
        ".container-custom": {
          maxWidth: "1280px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: theme("spacing.4"),
          paddingRight: theme("spacing.4"),
          "@media (min-width: 640px)": {
            paddingLeft: theme("spacing.6"),
            paddingRight: theme("spacing.6"),
          },
          "@media (min-width: 1024px)": {
            paddingLeft: theme("spacing.8"),
            paddingRight: theme("spacing.8"),
          },
        },
      };

      addUtilities(newUtilities);
      addComponents(newComponents);
    }),
  ],
};

export default config;