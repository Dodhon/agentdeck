const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3333",
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command:
      "PORT=3333 DB_PATH=./ops_board/ops_board.e2e.sqlite node ./ops_board/server.js",
    url: "http://127.0.0.1:3333",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
