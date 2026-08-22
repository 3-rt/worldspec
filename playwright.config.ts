import { defineConfig, devices } from "@playwright/test";

const remoteBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const localBaseUrl = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: remoteBaseUrl ?? localBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: [
            "--use-angle=swiftshader",
            "--enable-webgl",
            "--ignore-gpu-blocklist",
            "--enable-unsafe-swiftshader",
          ],
        },
      },
    },
  ],
  webServer: remoteBaseUrl
    ? undefined
    : {
        command:
          "npm run build && npm start -- --hostname 127.0.0.1 --port 3100",
        url: localBaseUrl,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
