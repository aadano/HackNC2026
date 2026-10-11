
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Forward /api calls to the Gemini server (npm run server).
  // 127.0.0.1, not localhost: on some machines localhost resolves to IPv6 first and the request hangs.
  server: { proxy: { "/api": "http://127.0.0.1:3001" } },
});
