import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig, normalizePath } from "vite";

const runtimeData = normalizePath(fileURLToPath(new URL("./data", import.meta.url)));

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    watch: {
      ignored: [runtimeData, `${runtimeData}/**`],
    },
    fs: {
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/data/*.json", "**/data/*.tmp", "**/data/.session-secret*", "**/*.server.*", "**/.codex-local-backup/**"],
    },
  },
});
