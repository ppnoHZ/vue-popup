import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  plugins: [vue()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vue",
              test: /node_modules[\\/](?:@vue|vue)[\\/]/,
              priority: 20,
            },
            {
              name: "date-picker",
              test: /node_modules[\\/]ant-design-vue[\\/]es[\\/](?:date-picker|vc-picker)[\\/]/,
              priority: 10,
            },
            { name: "vendor", test: /node_modules/ },
          ],
        },
      },
    },
  },
  test: { environment: "jsdom", include: ["src/**/*.spec.ts"] },
});
