import { resolve } from "node:path";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "@deconz-community/ddf-bundler": resolve(__dirname, "../../packages/bundler/index.ts"),
    },
  },
  build: {
    ssr: true,
    outDir: "dist",
    rollupOptions: {
      output: { chunkFileNames: "[name]-[hash].js" },
      input: { index: "./src/index.ts", cli: "./src/cli.ts" },
      external: [
        "@hono/node-server",
        "@hono/zod-validator",
        "@hono/zod-validator",
        "better-sqlite3",
        "drizzle-orm",
        "hono",
        "zod",
      ],
    },
  },
});
