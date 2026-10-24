import { test, expect, Page } from '@playwright/test';
import { DEMO_CREDENTIALS, loginAs, logout } from './helpers/auth';

test.describe.serial('Phase H — Facility Manager Command Center, KPIs & Severity Filtering', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAs(page, DEMO_CREDENTIALS.FACILITY_MANAGER);
    await expect(page).toHaveURL(/.*\/manager/);
  });

  test.afterAll(async () => {
    if (page) {
      await logout(page);
      await page.close();
    }
  });

  test('KPI Cards Navigation and Tab Switching', async () => {
    // 1. Triage Queue KPI card click activates Triage tab
    const triageCard = page.locator('.double-bezel-interactive').filter({ hasText: 'Triage Queue' });
    await triageCard.click();
    await expect(page.locator('button', { hasText: /triage & dispatch queue/i }).first()).toBeVisible();

    // 2. Repairs for Review KPI card click activates Verification Studio
    const reviewCard = page.locator('.double-bezel-interactive').filter({ hasText: 'Repairs for Review' });
    await reviewCard.click();
    await expect(page.locator('button', { hasText: /verification studio/i }).first()).toBeVisible();

    // 3. Active Work Orders KPI card click activates All Work Orders
    const woCard = page.locator('.double-bezel-interactive').filter({ hasText: 'Active Work Orders' });
    await woCard.click();
    await expect(page.locator('button', { hasText: /all work orders/i }).first()).toBeVisible();

    // 4. All Work Orders Tab shows work order entries
    await expect(page.getByText(/SLA Target/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Critical / High Severity KPI Card Toggle (Mouse, Enter, Space keys & Filter Persistence)', async () => {
    const severityCard = page.locator('[role="button"]').filter({ hasText: 'Critical / High Severity' });
    await expect(severityCard).toBeVisible();
    await expect(severityCard).toHaveAttribute('aria-pressed', 'false');

    // A. Mouse Click Activation
    await severityCard.click();
    await expect(severityCard).toHaveAttribute('aria-pressed', 'true');
    await expect(severityCard.getByText('Active Filter')).toBeVisible();
    await expect(severityCard.getByText('Click to show all')).toBeVisible();

    // Switch to All Work Orders view
    await page.getByRole('button', { name: /all work orders/i }).click();
    await page.waitForTimeout(300);

    // B. Mouse Click Deactivation
    await severityCard.click();
    await expect(severityCard).toHaveAttribute('aria-pressed', 'false');
    await expect(severityCard.getByText('Priority 1 & 2')).toBeVisible();
    await expect(severityCard.getByText('Active Filter')).not.toBeVisible();

    // C. Keyboard Activation via Enter Key
    await severityCard.focus();
    await page.keyboard.press('Enter');
    await expect(severityCard).toHaveAttribute('aria-pressed', 'true');
    await expect(severityCard.getByText('Active Filter')).toBeVisible();

    // D. Keyboard Deactivation via Space Key
    await page.keyboard.press('Space');
    await expect(severityCard).toHaveAttribute('aria-pressed', 'false');
    await expect(severityCard.getByText('Active Filter')).not.toBeVisible();
  });

  test('Priority Override with Justification Audit Reason', async () => {
    // Switch to Triage
    await page.locator('.double-bezel-interactive').filter({ hasText: 'Triage Queue' }).click();

    // Check if there is an item in triage to test override
    const triageItems = page.locator('.double-bezel-interactive').filter({ hasText: /Override Score/i });
    const count = await triageItems.count();

    if (count > 0) {
      const firstItem = triageItems.first();
      await firstItem.getByRole('button', { name: /override score/i }).click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal.getByText('Dynamic Priority Triage & Override')).toBeVisible();

      // Change level to CRITICAL
      await modal.locator('select').selectOption('CRITICAL');

      // Audit reason
      await modal
        .locator('textarea')
        .fill('High-profile institutional VIP event taking place; escalated to CRITICAL priority.');

      await modal.getByRole('button', { name: /confirm override/i }).click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      // Verify priority was updated to Critical
      await expect(firstItem.getByText('Critical').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
