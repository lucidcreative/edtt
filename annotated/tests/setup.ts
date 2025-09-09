// Test environment setup for Vitest unit tests
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for consistent test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

// Mock fetch globally for all HTTP requests in tests
global.fetch = vi.fn();

// Mock localStorage for browser storage testing
const localStorageMock = {
  getItem: vi.fn(), // Mock getting items from localStorage
  setItem: vi.fn(), // Mock setting items in localStorage
  removeItem: vi.fn(), // Mock removing items from localStorage
  clear: vi.fn(), // Mock clearing all localStorage
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true, // Allow overriding in individual tests
  value: vi.fn().mockImplementation(query => ({
    matches: false, // Default to not matching media query
    media: query, // Return the query string
    onchange: null, // Legacy property
    addListener: vi.fn(), // Deprecated method for compatibility
    removeListener: vi.fn(), // Deprecated method for compatibility
    addEventListener: vi.fn(), // Modern event listener
    removeEventListener: vi.fn(), // Modern event listener removal
    dispatchEvent: vi.fn(), // Event dispatching
  })),
});

// Mock ResizeObserver for components that observe element resizing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(), // Mock starting observation of an element
  unobserve: vi.fn(), // Mock stopping observation of an element
  disconnect: vi.fn(), // Mock disconnecting all observations
}));