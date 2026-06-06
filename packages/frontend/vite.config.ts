import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { copyFileSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Copy extension files straight to dist without bundling them.
    // Vite would otherwise bundle content.js and background.js into
    // the main chunk, which breaks the Chrome extension context.
    {
      name: "copy-extension-files",
      closeBundle() {
        const files = ["content.js", "background.js", "manifest.json"];
        files.forEach((file) => {
          copyFileSync(
            resolve(__dirname, "public", file),
            resolve(__dirname, "dist", file),
          );
          console.log(`Copied ${file} to dist/`);
        });
      },
    },
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
