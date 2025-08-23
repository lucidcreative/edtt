export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

// Cookie-based auth tokens - more secure than localStorage
export function setAuthToken(token: string) {
  // Set httpOnly cookie via API call instead of client-side
  // This will be handled by the server's auth endpoints
}

export function getAuthToken(): string | null {
  // Auth token is now stored in httpOnly cookie
  // Return null as client-side JS cannot access httpOnly cookies
  // The browser will automatically send the cookie with requests
  return null;
}

export function removeAuthToken() {
  // Logout will be handled by server clearing the cookie
  // Client-side just needs to redirect/refresh state
}
