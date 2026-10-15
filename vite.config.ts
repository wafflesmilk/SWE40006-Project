/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), !process.env.VITEST && reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    include: ["app/tests/**/*.{test,spec}.{ts,tsx}"], // only look inside 'app/tests', e2e folder is reserved for playwright
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
    },
    environment: "happy-dom", // needed to render a browser DOM for home component testing. Vitest uses Node by default
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgres://test_user:test_password@localhost:5432/test_db",
    },
  },
});
