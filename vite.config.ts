import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { openRouterApi } from "./server/openrouter";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), openRouterApi(env.OPENROUTER_API_KEY)],
    // tokenizer/ is a separate Bun project with its own runner; keep it out of the app suite.
    test: { include: ["src/**/*.test.ts"] },
  };
});
