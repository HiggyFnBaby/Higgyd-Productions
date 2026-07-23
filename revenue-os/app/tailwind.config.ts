import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          signal: "#6366f1",
          offer: "#8b5cf6",
          angle: "#ec4899",
          conversation: "#f59e0b",
          won: "#22c55e",
          lost: "#64748b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
