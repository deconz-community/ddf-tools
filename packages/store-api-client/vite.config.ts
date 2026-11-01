import path from "node:path";
import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["index.ts"],
    tsconfig: "tsconfig.build.json",
    format: "esm",
    clean: false,
    dts: { emitDtsOnly: true },
    outExtensions: () => ({ dts: ".d.ts" }),
    outputOptions: { codeSplitting: false },
  },
  resolve: {
    alias: {
      "~/": `${path.resolve(__dirname, "src")}/`,
    },
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, "index.ts"),
      formats: ["es"],
      fileName: () => "store-api-client.mjs",
    },
  },
});
