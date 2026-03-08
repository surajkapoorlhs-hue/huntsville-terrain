import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "react-vendor";
          }

          if (
            id.includes("/maplibre-gl/")
          ) {
            return "map-vendor";
          }
        }
      }
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,js}"]
  }
});
