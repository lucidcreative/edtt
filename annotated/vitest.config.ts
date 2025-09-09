// Vitest configuration for unit testing
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Enable global test functions (describe, it, expect) without imports
    globals: true,
    // Use jsdom environment to simulate browser DOM for React component testing
    environment: 'jsdom',
    // Run setup file before all tests to configure testing environment
    setupFiles: ['./tests/setup.ts'],
    // Include pattern for test files - supports multiple extensions
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Exclude directories from test discovery to avoid unnecessary file scanning
    exclude: ['node_modules', 'dist', '.replit', 'playwright.config.ts'],
  },
  resolve: {
    alias: {
      // Path alias for client source - enables @/ imports in tests
      '@': resolve(__dirname, './client/src'),
      // Path alias for shared types - enables @shared/ imports in tests
      '@shared': resolve(__dirname, './shared'),
      // Path alias for server code - enables @server/ imports in tests
      '@server': resolve(__dirname, './server'),
    },
  },
});