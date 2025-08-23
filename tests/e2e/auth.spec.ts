import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/');
    
    // Should show auth page when not logged in
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/');
    
    // Try to submit without filling fields
    await page.locator('[data-testid="login-button"]').click();
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill with invalid credentials
    await page.locator('[data-testid="email-input"]').fill('invalid@test.com');
    await page.locator('[data-testid="password-input"]').fill('wrongpassword');
    await page.locator('[data-testid="login-button"]').click();
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should login successfully with demo teacher', async ({ page }) => {
    await page.goto('/');
    
    // Fill with demo credentials
    await page.locator('[data-testid="email-input"]').fill('demo@teacher.com');
    await page.locator('[data-testid="password-input"]').fill('demo123');
    await page.locator('[data-testid="login-button"]').click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
  });
});

test.describe('Student Authentication', () => {
  test('should show student login tab', async ({ page }) => {
    await page.goto('/');
    
    // Switch to student tab
    await page.locator('[data-testid="student-tab"]').click();
    
    // Should show student login form
    await expect(page.locator('[data-testid="classroom-code-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="nickname-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="pin-input"]')).toBeVisible();
  });

  test('should login as demo student', async ({ page }) => {
    await page.goto('/');
    
    // Switch to student tab
    await page.locator('[data-testid="student-tab"]').click();
    
    // Fill student credentials
    await page.locator('[data-testid="classroom-code-input"]').fill('DEMO01');
    await page.locator('[data-testid="nickname-input"]').fill('DemoStudent');
    await page.locator('[data-testid="pin-input"]').fill('1234');
    await page.locator('[data-testid="student-login-button"]').click();
    
    // Should redirect to student dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
  });
});