import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        desk: {
          ink: "#111827",
          muted: "#667085",
          line: "#d0d5dd",
          panel: "#f8fafc",
          canvas: "#eef2f6",
          accent: "#0f766e",
        },
      },
      boxShadow: {
        panel: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
