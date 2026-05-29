import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // proxies /api calls to your backend
    // So your frontend calls /api/sessions/... instead of http://localhost:3001/api/sessions/...
    // No CORS issues, cleaner code
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
