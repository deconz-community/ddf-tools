import { execFileSync } from "node:child_process";
import path from "node:path";
import { defineConfig } from "vite-plus";
import packageJson from "./package.json";

function getPackageName() {
  return packageJson.name.replace(/@[^/]+\//g, "");
}

function getPackageNameCamelCase() {
  try {
    return getPackageName().replace(/[-]./g, (char) => char[1].toUpperCase());
  } catch (err) {
    throw new Error("Name property in package.json is missing.");
  }
}

const fileName = {
  es: `${getPackageName()}.mjs`,
  cjs: `${getPackageName()}.cjs`,
};

const formats = Object.keys(fileName) as Array<keyof typeof fileName>;

export default defineConfig({
  plugins: [
    {
      name: "build-dts",
      // build-dts.js loads the CJS bundle, so run it once that format is written
      writeBundle(options) {
        if (options.format !== "cjs") return;
        execFileSync("node", ["./build-dts.js"], { stdio: "inherit" });
      },
    },
  ],
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "index.ts"),
      name: getPackageNameCamelCase(),
      formats,
      fileName: (format) => fileName[format],
    },
    rollupOptions: {
      // deps that shouldn't be bundled
      external: ["zod"],
    },
  },
});
