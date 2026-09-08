import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gate: {
          pending: "#f59e0b",
          pass: "#22c55e",
          fail: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
