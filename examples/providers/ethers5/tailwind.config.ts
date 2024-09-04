import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hackerGreen: "#00FF00",
        hackerBlack: "#000000",
      },
      fontFamily: {
        hacker: ["VT323", "monospace"], 
      },
    },
  },
  plugins: [],
};
export default config;
