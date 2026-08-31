import { fileURLToPath, URL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

/**
 * Writes public/version.json at build start so Vite serves it in dev and
 * copies it into dist/. VersionBanner compares this file (fetched fresh,
 * no cache) against __APP_VERSION__ baked into the current bundle — a
 * mismatch means a newer build is deployed and a reload picks it up.
 */
function versionJsonPlugin() {
  return {
    name: "version-json",
    buildStart() {
      writeFileSync(
        new URL("./public/version.json", import.meta.url),
        JSON.stringify({ version: pkg.version }),
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionJsonPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
