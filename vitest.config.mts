import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    exclude: ["src/*.ne.js"],
    alias: {
      "./lexer": "./src/lexer.ts",
    },
  },
});
