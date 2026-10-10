
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Forward /api calls to the Gemini server (npm run server).
  server: { proxy: { "/api": "http://localhost:3001" } },
});
