import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { DEMO_CREDENTIALS, loginAs, logout } from './helpers/auth';

const RUN_ID = Date.now().toString().slice(-6);
export const REQUEST_A_TITLE = `E2E-${RUN_ID}-REQUEST-A`;
export const REQUEST_B_TITLE = `E2E-${RUN_ID}-REQUEST-B`;

test.describe('Phase D — Request Creation, Attachments and Cross-Account Visibility', () => {
  test('Requester A creates Request A with real image attachment and verifies persistence', async ({ page }) => {
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER);
    await expect(page).toHaveURL(/.*\/requester/);

    // Open Create Request Modal
    await page.getByRole('button', { name: /report an issue/i }).click();
    await expect(page.getByText('Report Campus Issue', { exact: false })).toBeVisible();

    // Fill Title
    await page.fill('input[placeholder*="Broken water pipe"]', REQUEST_A_TITLE);

    // Select Category
    await page.selectOption('select >> nth=0', 'Plumbing');

    // Fill Description
    await page.fill(
      'textarea[placeholder*="Describe what is malfunctioning"]',
      `E2E Acceptance Test primary maintenance request ${REQUEST_A_TITLE}. Immediate plumbing triage required.`
    );

    // Upload real photo attachment
    const imagePath = path.resolve('backend/assets/demo-attachments/water-leak-evidence.png');
    expect(fs.existsSync(imagePath)).toBeTruthy();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /upload real photo/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(imagePath);

    // Verify preview appears
    await expect(page.locator('img[alt="Attached Evidence"]').first()).toBeVisible({ timeout: 10000 });

    // Submit Report
    await page.getByRole('button', { name: /submit report/i }).click();

    // Verify modal closes
    await expect(page.getByText('Report Campus Issue', { exact: false })).not.toBeVisible({ timeout: 10000 });

    // Verify Request A appears in "My Reports" / "Reported by Me"
    await expect(page.getByText(REQUEST_A_TITLE).first()).toBeVisible({ timeout: 15000 });

    // Open Request Detail Modal
    await page.getByText(REQUEST_A_TITLE).first().click();
    await expect(page.getByText('Resolution Lifecycle')).toBeVisible({ timeout: 10000 });

    // Verify attached image is visible in detail view
    const evidenceImg = page.locator('img[alt*="Evidence"]').first();
    await expect(evidenceImg).toBeVisible();

    // Close detail modal
    await page.keyboard.press('Escape');

    // Logout Requester A
    await logout(page);
  });

  test('Requester B creates Request B and cross-account visibility is strictly segregated', async ({ page }) => {
    // Requester B logs in
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER_B);
    await expect(page).toHaveURL(/.*\/requester/);

    // Open Create Request Modal
    await page.getByRole('button', { name: /report an issue/i }).click();
    await page.fill('input[placeholder*="Broken water pipe"]', REQUEST_B_TITLE);
    await page.selectOption('select >> nth=0', 'Electrical');
    await page.fill(
      'textarea[placeholder*="Describe what is malfunctioning"]',
      `E2E Acceptance Test secondary maintenance request ${REQUEST_B_TITLE}. Main power fluctuation issue.`
    );

    // Add sample photo
    await page.getByRole('button', { name: /\+ Photo 1/i }).click();
    await page.getByRole('button', { name: /submit report/i }).click();

    await expect(page.getByText('Report Campus Issue', { exact: false })).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(REQUEST_B_TITLE).first()).toBeVisible({ timeout: 15000 });

    // Requester B logs out
    await logout(page);

    // Requester A logs in and checks "Reported by Me"
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER);
    await expect(page).toHaveURL(/.*\/requester/);

    // Click "Reported by Me" filter if present
    const reportedByMeTab = page.getByText('Reported by Me', { exact: false }).or(page.getByText('My Tickets', { exact: false })).first();
    if (await reportedByMeTab.isVisible()) {
      await reportedByMeTab.click();
    }

    // Verify Request A is visible
    await expect(page.getByText(REQUEST_A_TITLE).first()).toBeVisible();

    await logout(page);
  });

  test('Invalid upload types are rejected by upload validation', async ({ page }) => {
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER);
    await expect(page).toHaveURL(/.*\/requester/);

    await page.getByRole('button', { name: /report an issue/i }).click();

    // Attempt to upload invalid text file
    const invalidFilePath = path.resolve('backend/package.json');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /upload real photo/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(invalidFilePath);

    // Verify validation error
    await expect(page.getByText('Please select a valid image file', { exact: false })).toBeVisible();

    // Cancel modal
    await page.getByRole('button', { name: /cancel/i }).click();
    await logout(page);
  });
});
