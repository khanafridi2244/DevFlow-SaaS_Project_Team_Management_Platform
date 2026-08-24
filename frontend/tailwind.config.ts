import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1116",
        paper: "#F7F7F5",
        signal: {
          DEFAULT: "#4F7CFF",
          muted: "#4F7CFF33",
        },
        done: {
          DEFAULT: "#3FB68B",
          muted: "#3FB68B33",
        },
        warn: {
          DEFAULT: "#E6A23C",
          muted: "#E6A23C33",
        },
        line: "#2A2E37",
        // Status-rail colors, named after the actual task statuses so
        // components can reference them semantically (bg-status-todo)
        // rather than remembering which hex maps to which state.
        status: {
          todo: "#6B7280",
          "in-progress": "#4F7CFF",
          "in-review": "#E6A23C",
          done: "#3FB68B",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "IBM Plex Mono", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Tighter radii than the default Tailwind scale — a dev-tool
        // interface reads as more precise/serious with less rounding
        // than a consumer marketing site.
        DEFAULT: "6px",
        sm: "4px",
        lg: "8px",
      },
    },
  },
  plugins: [],
} satisfies Config;