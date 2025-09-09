// Playwright configuration for end-to-end testing
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directory containing E2E test files
  testDir: './tests/e2e',
  // Run tests in parallel for faster execution
  fullyParallel: true,
  // Forbid test.only() in CI environment to prevent selective test runs
  forbidOnly: !!process.env.CI,
  // Retry failed tests in CI (2 retries) but not in local development (0 retries)
  retries: process.env.CI ? 2 : 0,
  // Use single worker in CI for stability, unlimited workers locally
  workers: process.env.CI ? 1 : undefined,
  // Generate HTML report for test results visualization
  reporter: 'html',
  use: {
    // Base URL for all tests - points to local development server
    baseURL: 'http://localhost:5000',
    // Enable trace collection on first retry for debugging failed tests
    trace: 'on-first-retry',
  },

  // Define test projects for different browsers
  projects: [
    {
      // Chrome/Chromium browser testing
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Firefox browser testing
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      // Safari/WebKit browser testing
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Web server configuration for test environment
  webServer: {
    // Command to start the development server for testing
    command: 'npm run dev',
    // URL to wait for before starting tests
    url: 'http://localhost:5000',
    // Reuse existing server in local development, start fresh in CI
    reuseExistingServer: !process.env.CI,
  },
});