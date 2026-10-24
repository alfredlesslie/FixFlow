import { test, expect, Page } from '@playwright/test';
import { DEMO_CREDENTIALS, loginAs, logout } from './helpers/auth';

const RUN_ID = Date.now().toString().slice(-6);

test.describe.serial('Phase B & J — UI Control Inventory, Assets, Notifications & Comments', () => {
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

  test('Header Controls: Navigation, Theme Toggle, Notification Bell Drawer', async () => {
    // 1. Theme toggle switches dark/light mode
    const themeBtn = page.locator('header').getByRole('button', { name: /switch to/i }).first();
    await expect(themeBtn).toBeVisible();

    const htmlEl = page.locator('html');
    const initialIsDark = await htmlEl.evaluate((el) => el.classList.contains('dark'));

    await themeBtn.click();
    await page.waitForTimeout(300);
    const toggledIsDark = await htmlEl.evaluate((el) => el.classList.contains('dark'));
    expect(toggledIsDark).not.toBe(initialIsDark);

    // Toggle back
    await themeBtn.click();
    await page.waitForTimeout(300);

    // 2. Notification Bell Popover Drawer
    const bellBtn = page.getByRole('button', { name: /view notifications/i });
    await expect(bellBtn).toBeVisible();
    await bellBtn.click();

    // Verify Notification popover drawer opens
    await expect(page.getByText('Notifications').first()).toBeVisible();

    // Close notifications by clicking bell again
    await bellBtn.click();
  });

  test('Assets & Locations Explorer: Search, Category Filter, and Status Filtering', async () => {
    // Navigate to Assets page
    await page.goto('/assets');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Campus Asset Registry')).toBeVisible();

    // Verify assets table renders
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });

    // 1. Test search input
    const searchInput = page.locator('#asset-search-input');
    await searchInput.fill('Chiller');
    await page.waitForTimeout(300);
    await expect(page.getByText('Carrier', { exact: false }).first()).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // 2. Test Category Filter
    const catSelect = page.locator('#category-filter-select');
    await catSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    // Reset category filter
    await catSelect.selectOption('');

    // 3. Test Status Filter
    const statusSelect = page.locator('#status-filter-select');
    await statusSelect.selectOption('OPERATIONAL');
    await page.waitForTimeout(300);
    await expect(page.locator('tbody').getByText('Operational').first()).toBeVisible();

    // Reset status filter
    await statusSelect.selectOption('');
  });

  test('Asset Registration: Facility Manager Registers New Campus Asset', async () => {
    await page.goto('/assets');
    await page.waitForLoadState('networkidle');

    // Click Register New Asset
    const registerBtn = page.locator('#open-create-asset-modal');
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // Fill Create Asset Modal inside form
    const form = page.locator('form');
    await expect(form).toBeVisible();

    const tag = `AST-TEST-${RUN_ID}`;
    const name = `E2E Test Industrial Centrifugal Pump ${RUN_ID}`;
    await form.locator('input[placeholder="AST-AC-201"]').fill(tag);
    await form.locator('input[placeholder="Carrier 2.0 Ton AC"]').fill(name);
    await form.locator('select').first().selectOption({ index: 1 }); // Category
    await form.locator('select').nth(1).selectOption({ index: 1 }); // Location
    await form.locator('input[placeholder="Daikin / Cisco"]').fill('Grundfos Industrial');
    await form.locator('input[placeholder="Model Number"]').fill(`CRN-32-${RUN_ID}`);

    // Submit form
    await form.getByRole('button', { name: /save asset/i }).click();

    // Verify asset appears in table
    await page.locator('#asset-search-input').fill(tag);
    await page.waitForTimeout(500);
    await expect(page.locator('tbody').getByText(tag).first()).toBeVisible({ timeout: 10000 });
  });

  test('Request Comments: Post and Verify Discussion Activity', async () => {
    await page.goto('/manager');
    await page.waitForLoadState('networkidle');

    // Switch to Triage
    await page.locator('.double-bezel-interactive').filter({ hasText: 'Triage Queue' }).click();

    // Click on the first ticket heading to open detail modal
    const firstTicketTitle = page.locator('.double-bezel-interactive h3').first();
    if (await firstTicketTitle.isVisible()) {
      await firstTicketTitle.click();

      const detailModal = page.locator('[role="dialog"]');
      await expect(detailModal).toBeVisible();
      await expect(detailModal.getByText('Resolution Lifecycle')).toBeVisible();

      // Post a comment
      const commentText = `Operational triage note #${RUN_ID}: parts sourced and crew on standby.`;
      await detailModal.locator('input[placeholder*="Add supplementary information"]').fill(commentText);
      await detailModal.getByRole('button', { name: 'Post' }).click();

      // Verify comment appears in activity log
      await expect(detailModal.getByText(commentText)).toBeVisible({ timeout: 10000 });

      // Close modal
      await detailModal.getByRole('button', { name: /close/i }).click();
    }
  });
});
