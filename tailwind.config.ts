// tailwind.config.ts
// Advanced Tailwind CSS Configuration
// Author: Rahul Sharma (@irahulshrmax)
// Email: rs765145@gmail.com
// Social: Instagram, YouTube, LinkedIn, GitHub, Snapchat, Threads, X, Facebook

import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";
import colors from "tailwindcss/colors";

// Extended configuration metadata
const configMetadata = {
  author: {
    name: "Rahul Sharma",
    email: "rs765145@gmail.com",
    username: "irahulshrmax",
    social: {
      instagram: "https://instagram.com/irahulshrmax",
      youtube: "https://youtube.com/@irahulshrmax",
      linkedin: "https://linkedin.com/in/irahulshrmax",
      github: "https://github.com/irahulshrmax",
      snapchat: "https://snapchat.com/add/irahulshrmax",
      threads: "https://threads.net/@irahulshrmax",
      twitter: "https://x.com/irahulshrmax",
      facebook: "https://facebook.com/irahulshrmax"
    },
    website: "https://irahulshrmax.dev"
  },
  version: "3.0.0",
  environment: process.env.NODE_ENV || "development"
};

const config: Config = {
  darkMode: ["class", 'class'], // class-based dark mode with fallback
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // Include all potential content locations
    "./sections/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
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
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    
    extend: {
      // ---------- SCREENS / BREAKPOINTS ----------
      screens: {
        xs: "475px",
        ...defaultTheme.screens,
        "3xl": "1920px",
        "4xl": "2560px",
        "5xl": "3200px",
        // Custom breakpoints for specific use cases
        'tall': { 'raw': '(min-height: 800px)' },
        'short': { 'raw': '(max-height: 600px)' },
        'hover-hover': { 'raw': '(hover: hover)' },
        'no-hover': { 'raw': '(hover: none)' },
      },

      // ---------- FONTS ----------
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", ...defaultTheme.fontFamily.sans],
        display: ["Cal Sans", "Inter", "Poppins", ...defaultTheme.fontFamily.sans],
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", ...defaultTheme.fontFamily.mono],
        brand: ["'Raleway'", "Inter", "sans-serif"],
        heading: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Nunito'", "Inter", "sans-serif"],
        code: ["'Fira Code'", "'JetBrains Mono'", "monospace"],
      },

      // ---------- FONT SIZES WITH LINE HEIGHTS ----------
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.75rem' }],
        'tiny': ['0.6875rem', { lineHeight: '1rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.16' }],
        '6xl': ['3.75rem', { lineHeight: '1.16' }],
        '7xl': ['4.5rem', { lineHeight: '1.16' }],
        '8xl': ['6rem', { lineHeight: '1.16' }],
        '9xl': ['8rem', { lineHeight: '1.16' }],
        '10xl': ['10rem', { lineHeight: '1.16' }],
      },

      // ---------- CUSTOM COLORS ----------
      colors: {
        // Brand colors (your personal brand)
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
          DEFAULT: "#0ea5e9",
        },
        
        // Social media colors
        social: {
          instagram: "#E4405F",
          youtube: "#FF0000",
          linkedin: "#0A66C2",
          github: "#181717",
          snapchat: "#FFFC00",
          threads: "#000000",
          twitter: "#000000",
          facebook: "#1877F2",
          discord: "#5865F2",
          twitch: "#9146FF",
          reddit: "#FF4500",
          whatsapp: "#25D366",
          telegram: "#26A5E4",
        },
        
        // Surface colors
        surface: {
          light: "#ffffff",
          dark: "#0a0a0a",
          muted: "#f5f5f5",
          elevated: "#ffffff",
          'elevated-dark': "#1a1a1a",
        },
        
        // Border colors
        border: {
          light: "#e5e7eb",
          dark: "#27272a",
          primary: "#0ea5e9",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
        },
        
        // Status colors
        status: {
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
          info: "#0ea5e9",
        },
        
        // Extended colors from Tailwind
        gray: colors.slate,
        blue: colors.blue,
        red: colors.red,
        green: colors.green,
        yellow: colors.yellow,
        purple: colors.purple,
        pink: colors.pink,
        indigo: colors.indigo,
        cyan: colors.cyan,
        teal: colors.teal,
        orange: colors.orange,
        amber: colors.amber,
        lime: colors.lime,
        emerald: colors.emerald,
        fuchsia: colors.fuchsia,
        rose: colors.rose,
        violet: colors.violet,
      },

      // ---------- SPACING ----------
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
        "144": "36rem",
        "160": "40rem",
        "192": "48rem",
        "224": "56rem",
        "256": "64rem",
        // Percentage based spacing
        '1/10': '10%',
        '1/8': '12.5%',
        '3/8': '37.5%',
        '5/8': '62.5%',
        '7/8': '87.5%',
      },

      // ---------- ANIMATIONS & KEYFRAMES (Enhanced) ----------
      keyframes: {
        // Entrance animations
        enter: {
          "0%": { opacity: "0", transform: "translateY(-16px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        leave: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-8px) scale(0.97)" },
        },
        
        // Slide animations
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-top": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-out": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "slide-out-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        
        // Fade animations
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        
        // Scale animations
        "scale-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.8)", opacity: "0" },
        },
        "scale-in-center": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        
        // Bounce animations
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        
        // Spin animations
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "spin-reverse": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "spin-pulse": {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(180deg) scale(1.1)" },
        },
        
        // Pulse animations
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(14, 165, 233, 0.4)" },
          "50%": { boxShadow: "0 0 20px 10px rgba(14, 165, 233, 0)" },
        },
        
        // Shimmer animation
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        
        // Float animation
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        
        // Rotate animation
        rotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        
        // Wiggle animation
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        
        // Glow animation
        glow: {
          "0%, 100%": { filter: "brightness(1)" },
          "50%": { filter: "brightness(1.2)" },
        },
        
        // Progress bar animation
        progress: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },

      animation: {
        // Base
        enter: "enter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        leave: "leave 0.16s ease forwards",
        
        // Slide
        "slide-in": "slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-top": "slide-in-top 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-bottom": "slide-in-bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-out": "slide-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-out-left": "slide-out-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        
        // Fade
        "fade-in": "fade-in 0.2s ease forwards",
        "fade-out": "fade-out 0.2s ease forwards",
        "fade-in-up": "fade-in-up 0.3s ease forwards",
        "fade-in-down": "fade-in-down 0.3s ease forwards",
        "fade-in-left": "fade-in-left 0.3s ease forwards",
        "fade-in-right": "fade-in-right 0.3s ease forwards",
        
        // Scale
        "scale-in": "scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-out": "scale-out 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in-center": "scale-in-center 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        
        // Bounce
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        
        // Spin
        "spin-slow": "spin-slow 3s linear infinite",
        "spin-slower": "spin-slow 6s linear infinite",
        "spin-reverse": "spin-reverse 3s linear infinite",
        "spin-pulse": "spin-pulse 2s ease-in-out infinite",
        
        // Pulse
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        
        // Others
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        wiggle: "wiggle 0.3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        progress: "progress 1s ease-in-out forwards",
      },

      // ---------- CUSTOM BACKDROP FILTERS ----------
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        "3xl": "40px",
      },

      // ---------- CUSTOM BOX SHADOWS ----------
      boxShadow: {
        glow: "0 0 20px rgba(14, 165, 233, 0.3)",
        "glow-lg": "0 0 40px rgba(14, 165, 233, 0.4)",
        "glow-xl": "0 0 60px rgba(14, 165, 233, 0.5)",
        "inner-lg": "inset 0 2px 4px 0 rgb(0 0 0 / 0.06)",
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        "soft-dark": "0 2px 15px -3px rgba(255, 255, 255, 0.07), 0 10px 20px -2px rgba(255, 255, 255, 0.04)",
        "card": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "elevated": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "floating": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        "brand": "0 4px 14px 0 rgba(14, 165, 233, 0.39)",
        "brand-lg": "0 8px 25px 0 rgba(14, 165, 233, 0.5)",
      },

      // ---------- BORDER RADIUS ----------
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
        "7xl": "3.5rem",
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
        "auto": "auto",
        "dropdown": "1000",
        "sticky": "1020",
        "fixed": "1030",
        "modal-backdrop": "1040",
        "modal": "1050",
        "popover": "1060",
        "tooltip": "1070",
        "toast": "1080",
        "max": "9999",
      },

      // ---------- TRANSITION DURATION ----------
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
        '4000': '4000ms',
        '5000': '5000ms',
      },

      // ---------- TRANSITION TIMING FUNCTION ----------
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'sharp': 'cubic-bezier(0.4, 0, 0.6, 1)',
      },

      // ---------- BACKGROUND POSITION ----------
      backgroundPosition: {
        'center-center': 'center center',
        'top-center': 'top center',
        'bottom-center': 'bottom center',
        'left-center': 'left center',
        'right-center': 'right center',
      },

      // ---------- BACKGROUND SIZE ----------
      backgroundSize: {
        'auto': 'auto',
        'cover': 'cover',
        'contain': 'contain',
        '50%': '50%',
        '100%': '100%',
        '200%': '200%',
      },

      // ---------- MIN/MAX WIDTH & HEIGHT ----------
      minWidth: {
        '0': '0px',
        '1/4': '25%',
        '1/3': '33.333%',
        '1/2': '50%',
        '3/4': '75%',
        'full': '100%',
        'screen': '100vw',
        'min': 'min-content',
        'max': 'max-content',
        'fit': 'fit-content',
      },

      maxWidth: {
        'prose': '65ch',
        'screen-3xl': '1920px',
        'screen-4xl': '2560px',
      },

      minHeight: {
        '0': '0px',
        'screen-50': '50vh',
        'screen-75': '75vh',
      },

      maxHeight: {
        'screen-50': '50vh',
        'screen-75': '75vh',
        'screen-90': '90vh',
      },
    },
  },

  // ---------- PLUGINS ----------
  plugins: [
    // Official Tailwind plugins
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")({
      strategy: "class", // only generate classes
    }),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/container-queries"),
    
    // Additional community plugins
    require("tailwindcss-textshadow"),
    require("tailwindcss-animate"),
    
   
    
    // ---------- ANIMATION DELAY PLUGIN ----------
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities({
        'animation-delay': (value: string) => ({
          'animation-delay': value,
        }),
      }, {
        values: theme('transitionDelay'),
      });
    }),
  ],

  // ---------- FUTURE CONFIG ----------
  future: {
    hoverOnlyWhenSupported: true,
    respectDefaultRingColorOpacity: true,
    disableColorOpacityUtilitiesByDefault: false,
    relativeContentPathsByDefault: true,
  },

  // ---------- EXPERIMENTAL FEATURES ----------
  experimental: {
    optimizeUniversalDefaults: true,
    matchVariant: true,
  },
};

export default config;

// Export types for use in other files
export type { Config };