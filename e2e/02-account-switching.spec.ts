import { test, expect } from '@playwright/test';
import { DEMO_CREDENTIALS, loginAs, logout } from './helpers/auth';

test.describe('Phase C — Authentication and Account-Switching Regression', () => {
  test('Complete multi-role transition sequence in single browser context without page reload', async ({ page }) => {
    // 1. Requester logs in
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER);
    await expect(page).toHaveURL(/.*\/requester/);
    await expect(page.locator('header').getByText('Riya', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /report an issue/i })).toBeVisible();

    // 2. Requester logs out
    await logout(page);
    await expect(page).toHaveURL(/.*\/login/);

    // 3. Technician logs in
    await loginAs(page, DEMO_CREDENTIALS.TECHNICIAN);
    await expect(page).toHaveURL(/.*\/technician/);
    await expect(page.locator('header').getByText('Rahul', { exact: true })).toBeVisible();
    await expect(page.getByText('Technician Workbench', { exact: false }).first()).toBeVisible();

    // 4. Technician logs out
    await logout(page);
    await expect(page).toHaveURL(/.*\/login/);

    // 5. Facility Manager logs in
    await loginAs(page, DEMO_CREDENTIALS.FACILITY_MANAGER);
    await expect(page).toHaveURL(/.*\/manager/);
    await expect(page.locator('header').getByText('Sunil', { exact: true })).toBeVisible();
    await expect(page.getByText('Facility Manager Command Center', { exact: false }).first()).toBeVisible();

    // 6. Facility Manager logs out
    await logout(page);
    await expect(page).toHaveURL(/.*\/login/);

    // 7. Administrator logs in
    await loginAs(page, DEMO_CREDENTIALS.ADMIN);
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.locator('header').getByText('Campus', { exact: true })).toBeVisible();
    await expect(page.getByText('Governance, Security & Audit Console', { exact: false }).first()).toBeVisible();

    // 8. Administrator logs out
    await logout(page);
    await expect(page).toHaveURL(/.*\/login/);

    // 9. Requester logs in again (verifies no first-navigation 403 or cache bleed)
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER);
    await expect(page).toHaveURL(/.*\/requester/);
    await expect(page.locator('header').getByText('Riya', { exact: true })).toBeVisible();

    // Verify session persistence after page reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/requester/);
    await expect(page.locator('header').getByText('Riya', { exact: true })).toBeVisible();

    // Verify genuine unauthorized direct navigation to admin is blocked
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const isStationDenied = await page.locator('text=Station Access Denied').isVisible();
    const isUnauthorized = await page.locator('text=Unauthorized').isVisible();
    const isRedirectedToRequester = page.url().includes('/requester');
    expect(isStationDenied || isUnauthorized || isRedirectedToRequester).toBeTruthy();

    // Final clean logout
    await logout(page);
  });

  test('Unauthenticated direct navigation to protected stations is blocked', async ({ page }) => {
    // Unauthenticated user attempts direct access to protected routes
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/login/);

    await page.goto('/manager');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/login/);

    await page.goto('/technician');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/login/);

    await page.goto('/requester');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/login/);
  });
});
