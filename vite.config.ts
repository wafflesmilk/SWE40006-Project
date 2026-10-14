/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],

  resolve: {
    tsconfigPaths: true,
  },

  test: {
    include: ["app/tests/**/*.{test,spec}.{ts,tsx}"], // only look inside 'app/tests', e2e folder is reserved for playwright
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
    },
  },
});
