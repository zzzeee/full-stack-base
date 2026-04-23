/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            maxWidth: {
                content: "var(--page-max-width)",
            },
            spacing: {
                header: "var(--header-height)",
                sidebar: "var(--sidebar-width)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                expo: {
                    canvas: "hsl(var(--expo-canvas))",
                    sidebar: "hsl(var(--expo-sidebar))",
                    "sidebar-border": "hsl(var(--expo-sidebar-border))",
                    "nav-active": "hsl(var(--expo-nav-active))",
                    "nav-active-border": "hsl(var(--expo-nav-active-border))",
                },
            },
            boxShadow: {
                header: "0 1px 0 0 hsl(var(--border) / 0.6)",
                sidebar: "1px 0 0 0 hsl(var(--expo-sidebar-border) / 0.9)",
                soft: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "slide-in-from-top": {
                    "0%": { transform: "translateY(-4px)" },
                    "100%": { transform: "translateY(0)" },
                },
            },
            animation: {
                in: "fade-in 0.2s ease-out",
            },
        },
    },
    plugins: [],
};
