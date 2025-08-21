export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function removeAuthToken() {
  localStorage.removeItem('auth_token');
}
