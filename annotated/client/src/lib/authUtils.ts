// Authentication utility functions for token management and error handling

// Check if an error is an unauthorized access error (HTTP 401)
export function isUnauthorizedError(error: Error): boolean {
  // Use regex to match error message format from API responses
  return /^401: .*Unauthorized/.test(error.message);
}

// JWT token management functions for localStorage persistence

// Store authentication token in browser's local storage
export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

// Retrieve authentication token from browser's local storage
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Remove authentication token from browser's local storage (for logout)
export function removeAuthToken() {
  localStorage.removeItem('auth_token');
}