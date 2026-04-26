import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /engine-comparison\.spec\.ts/,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4176',
      url: 'http://127.0.0.1:4176',
      env: {
        VITE_ROOT_ENGINE: 'legacy',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4177',
      url: 'http://127.0.0.1:4177',
      env: {
        VITE_ROOT_ENGINE: 'modern',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

