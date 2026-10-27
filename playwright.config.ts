import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: {
    channel: process.env.PW_CHANNEL || "chrome",
    baseURL: "http://127.0.0.1:5187",
    headless: true,
    viewport: { width: 1100, height: 800 },
  },
  webServer: {
    command: "npm run dev -- --port 5187 --strictPort",
    url: "http://127.0.0.1:5187",
    reuseExistingServer: false,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
