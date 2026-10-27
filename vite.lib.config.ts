import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "lib",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: fileURLToPath(
        new URL("./src/components/DraggablePopup/index.ts", import.meta.url),
      ),
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
      cssFileName: "style",
    },
    rolldownOptions: {
      external: ["vue", "@floating-ui/vue"],
      output: { exports: "named" },
    },
  },
});
