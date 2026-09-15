import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
    safelist: [
    "bg-avatar-1", "bg-avatar-2", "bg-avatar-3", "bg-avatar-4",
    "bg-avatar-5", "bg-avatar-6", "bg-avatar-7", "bg-avatar-8",
    "text-avatar-1", "text-avatar-2", "text-avatar-3", "text-avatar-4",
    "text-avatar-5", "text-avatar-6", "text-avatar-7", "text-avatar-8",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0E1116",
        paper: "#F7F7F5",
        line: "#2A2E37",

        // Feature-area accents — each part of the app gets its own hue
        // instead of one blue doing everything, so the UI reads as
        // richer and more differentiated at a glance.
        signal: {
          DEFAULT: "#4F7CFF", // Tasks / Kanban
          muted: "#4F7CFF26",
        },
        indigo: {
          DEFAULT: "#6366F1", // Projects
          muted: "#6366F126",
        },
        violet: {
          DEFAULT: "#A78BFA", // Analytics
          muted: "#A78BFA26",
        },
        emerald: {
          DEFAULT: "#34D399", // Billing / success
          muted: "#34D39926",
        },

        done: {
          DEFAULT: "#3FB68B",
          muted: "#3FB68B26",
        },
        warn: {
          DEFAULT: "#E6A23C",
          muted: "#E6A23C26",
        },

        status: {
          todo: "#6B7280",
          "in-progress": "#4F7CFF",
          "in-review": "#E6A23C",
          done: "#3FB68B",
        },

        // Distinct hues for avatar generation — cycled through by a
        // hash of the person's name, so a team looks visually diverse
        // instead of every avatar being the same blue circle.
        avatar: {
          1: "#4F7CFF",
          2: "#A78BFA",
          3: "#34D399",
          4: "#F472B6",
          5: "#FB923C",
          6: "#38BDF8",
          7: "#A3E635",
          8: "#FB7185",
        },
      },
      backgroundImage: {
        "ai-gradient": "linear-gradient(135deg, #F472B6 0%, #FB923C 100%)",
        "ai-gradient-muted": "linear-gradient(135deg, #F472B626 0%, #FB923C26 100%)",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "IBM Plex Mono", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        lg: "8px",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4)",
        "glow-signal": "0 0 0 1px rgba(79,124,255,0.2), 0 8px 24px rgba(79,124,255,0.15)",
      },
    },
  },
  plugins: [],
} satisfies Config;