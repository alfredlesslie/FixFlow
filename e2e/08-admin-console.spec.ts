import { test, expect, Page } from '@playwright/test';
import { DEMO_CREDENTIALS, loginAs, logout } from './helpers/auth';

test.describe.serial('Phase I — System Administrator Console & Governance', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAs(page, DEMO_CREDENTIALS.ADMIN);
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test.afterAll(async () => {
    if (page) {
      await logout(page);
      await page.close();
    }
  });

  test('Tab Navigation: User & Role Governance, Approvals, Security & Audit, Health & Diagnostics', async () => {
    // 1. User & Role Governance tab
    const userGovTab = page.getByRole('button', { name: /user & role governance/i });
    await expect(userGovTab).toBeVisible();
    await userGovTab.click();
    await expect(page.getByText('Administrators can dynamically assign roles and revoke access.')).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();

    // 2. Account Approvals tab
    const approvalsTab = page.getByRole('button', { name: /account approvals/i });
    await expect(approvalsTab).toBeVisible();
    await approvalsTab.click();
    await expect(page.getByText('Pending Authorization')).toBeVisible();

    // 3. Security & Audit Explorer tab
    const auditTab = page.getByRole('button', { name: /security & audit explorer/i });
    await expect(auditTab).toBeVisible();
    await auditTab.click();
    await expect(page.getByPlaceholder('Search audit trail by actor, action, ticket number, or reason...')).toBeVisible();

    // 4. Health & Diagnostics tab
    const healthTab = page.getByRole('button', { name: /health & diagnostics/i });
    await expect(healthTab).toBeVisible();
    await healthTab.click();
    await expect(page.getByText('NestJS + GraphQL API')).toBeVisible();
    await expect(page.getByText('PostgreSQL 16 Engine')).toBeVisible();
    await expect(page.getByText('Reactive Event Bridge')).toBeVisible();
  });

  test('User Governance: Suspend and Reactivate Account Safeguards', async () => {
    // Ensure on Users tab
    await page.getByRole('button', { name: /user & role governance/i }).click();

    // Locate the first test user or technician (not the logged in admin)
    const userRow = page.locator('tr').filter({ hasText: 'tech.rahul@fixflow.edu' });
    await expect(userRow).toBeVisible();

    // Click Suspend or Activate button
    const toggleBtn = userRow.getByRole('button', { name: /Suspend|Activate/i });
    const initialAction = await toggleBtn.textContent();
    await toggleBtn.click();
    await page.waitForTimeout(500);

    // Verify status toggles
    if (initialAction?.includes('Suspend')) {
      await expect(userRow.getByText('Suspended')).toBeVisible();
      // Restore back to active
      await userRow.getByRole('button', { name: /Activate/i }).click();
      await page.waitForTimeout(500);
      await expect(userRow.getByText('Active')).toBeVisible();
    } else {
      await expect(userRow.getByText('Active')).toBeVisible();
    }
  });

  test('Security & Audit Explorer: Search, Filters & Secret Sanitization', async () => {
    // Open Audit tab
    await page.getByRole('button', { name: /security & audit explorer/i }).click();

    // Search audit trail
    const searchInput = page.getByPlaceholder('Search audit trail by actor, action, ticket number, or reason...');
    await searchInput.fill('USER');
    await page.waitForTimeout(300);

    // Filter by action dropdown if options available
    const actionSelect = page.locator('select').first();
    await expect(actionSelect).toBeVisible();

    // Verify audit rows are rendered
    const auditRows = page.locator('tbody tr');
    const rowCount = await auditRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Inspect first audit row: verify structure and NO leaked secrets/passwords
    const firstRowText = await auditRows.first().textContent();
    expect(firstRowText).not.toContain('password');
    expect(firstRowText).not.toContain('jwt_secret');
    expect(firstRowText).not.toContain('authorization_bearer');
  });
});
