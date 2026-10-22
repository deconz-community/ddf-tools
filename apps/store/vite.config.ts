import { defineConfig } from "vite-plus";

export default defineConfig({
  build: {
    ssr: "./src/index.ts",
    outDir: "dist",
    rollupOptions: {
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
