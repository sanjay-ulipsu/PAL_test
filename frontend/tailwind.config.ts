import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        manrope: ["var(--font-manrope)", "Manrope", "sans-serif"],
        "source-sans": ["var(--font-source-sans)", '"Source Sans 3"', "sans-serif"],
        "madimi-one": ["var(--font-madimi)", '"Madimi One"', "cursive"],
      },
      colors: {
        // Blueberry (primary purple) scale
        blueberry: {
          DEFAULT: "#3a3087",
          300: "#a197f2",
          400: "#8f83f0",
          500: "#7364ec",
          600: "#695bd7",
          700: "#5247a8",
          800: "#3f3782",
        },
        // Blueberry Alt scale (darker, for headings/text)
        "blueberry-alt": {
          50: "#f6f5ff",
          100: "#d0cbfd",
          200: "#aaa2f9",
          300: "#8a7ef2",
          400: "#6f61e9",
          500: "#594bdd",
          600: "#4839cd",
          700: "#3a2cb8",
          800: "#2f22a0",
          900: "#261b87",
        },
        // Sunshade (amber/gold)
        sunshade: {
          DEFAULT: "#f4a71d",
          50: "#fef6e8",
          100: "#fbe3b9",
          200: "#f9d697",
          300: "#f7c368",
          400: "#f5b84a",
          500: "#f3a61d",
          600: "#dd971a",
          700: "#ad7615",
          800: "#865b10",
          900: "#66460c",
        },
        // Persian Rose (pink accent)
        "p-rose": {
          DEFAULT: "#e539b5",
          200: "#f3a4dd",
          300: "#ee7acd",
          400: "#ea61c4",
          500: "#e539b5",
          600: "#d034a5",
          700: "#a32881",
          800: "#7e1f64",
        },
        // Neutrals
        neutral: {
          100: "#c5c7cb",
          200: "#a9acb2",
          300: "#82868e",
          400: "#696f79",
          500: "#444b57",
          600: "#3e444f",
          700: "#30353e",
          800: "#1d2025",
        },
        // Semantic
        "alert-danger": "#ff7448",
        "alert-success": "#5dda5d",
        "alert-warning": "#f4a71d",
        // Backgrounds
        "page-bg": "#f7f7fb",
        // shadcn compat
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        elevation1:
          "2px 2px 2px 0px #e7e7e7, 0px 1px 1px 0px #e7e7e799, -2px -2px 2px 0px #ffffff, 0px -1px 1px 0px #ffffff99",
        elevation2:
          "4px 4px 4px 0px #e7e7e7, 0px 2px 2px 0px #e7e7e799, -4px -4px 4px 0px #ffffff, 0px -2px 2px 0px #ffffff99",
        elevation3:
          "6px 6px 6px 0px #e7e7e7, 0px 4px 4px 0px #e7e7e799, -6px -6px 6px 0px #ffffff, 0px -4px 4px 0px #ffffff99",
        elevation4:
          "8px 8px 8px 0px #e7e7e7, 0px 6px 6px 0px #e7e7e799, -8px -8px 8px 0px #ffffff, 0px -6px 6px 0px #ffffff99",
        elevation5:
          "12px 12px 12px 0px #e7e7e7, 0px 8px 8px 0px #e7e7e799, -12px -12px 12px 0px #ffffff, 0px -8px 8px 0px #ffffff99",
        elevation6:
          "16px 16px 15px 0px #e7e7e7, 0px 10px 10px 0px #e7e7e799, -16px -16px 15px 0px #ffffff, 0px -10px 10px 0px #ffffff99",
        depth3:
          "2px 2px 2px 0px #dedede inset, -2px -2px 2px 0px #dedede99 inset",
        depth4:
          "4px 4px 4px 0px #dededee5 inset, -4px -4px 3px 0px #dedede66 inset",
        depth5:
          "4px 4px 4px 0px #dededee5 inset, -6px -6px 5px 0px #dedede66 inset",
        depth6:
          "4px 4px 4px 0px #dededee5 inset, -8px -8px 7px 0px #dedede66 inset",
        "gold-glow":
          "0px 1px 2px 0px #fea015, 0px 4px 8px 0px #fea01540, 0px 8px 16px 0px #fea01520",
        "purple-glow":
          "0px 1px 2px 0px #7364ec, 0px 4px 8px 0px #7364ec40, 0px 8px 16px 0px #7364ec20",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "gradient-card":
          "linear-gradient(118.69deg, rgba(244,167,29,0.5) 0%, rgba(254,211,133,0.5) 0.01%, rgba(255,255,255,0.5) 52%, rgba(192,184,250,0.5) 100%)",
        "gradient-gold":
          "linear-gradient(270deg, #f6bc54cc 0%, #f4a71d 100%)",
        "gradient-purple":
          "linear-gradient(135deg, #7364ec 0%, #3a2cb8 100%)",
        "gradient-element":
          "linear-gradient(132deg, #f7f7f8 0.01%, #f4f4f6 100%)",
        "gradient-border":
          "linear-gradient(140.87deg, #f79d14 0.15%, #fed385 0.16%, rgba(255,255,255,0.5) 52.25%, #b2a8fa 100.34%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
