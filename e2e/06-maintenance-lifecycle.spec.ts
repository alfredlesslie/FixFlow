import { test, expect } from '@playwright/test';
import { DEMO_CREDENTIALS, loginAs, logout } from './helpers/auth';

const RUN_ID = Date.now().toString().slice(-6);

test.describe('Phase G — Technician Assignment and Full Maintenance Lifecycle', () => {
  const PRIMARY_REQ_TITLE = `E2E-LIFECYCLE-LEAK-${RUN_ID}`;
  const REWORK_REQ_TITLE = `E2E-REWORK-HVAC-${RUN_ID}`;

  test('Step 1-3: End-to-End Happy Path (Triage -> Dispatch -> Technician Execution with Parts & Photos -> FM Verification & Closure)', async ({
    page,
  }) => {
    // 1. Requester creates primary request
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER);
    await page.getByRole('button', { name: /report an issue/i }).click();

    await expect(page.getByText('Report Campus Issue', { exact: false })).toBeVisible();
    await page.fill('input[placeholder*="Broken water pipe"]', PRIMARY_REQ_TITLE);
    await page.selectOption('select >> nth=0', 'Plumbing');
    await page.fill(
      'textarea[placeholder*="Describe what is malfunctioning"]',
      'High-pressure hydronic water pipe burst in sub-basement machine room with standing water.'
    );

    await page.getByRole('button', { name: /submit report/i }).click();
    await expect(page.getByText('Report Campus Issue', { exact: false })).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(PRIMARY_REQ_TITLE).first()).toBeVisible({ timeout: 15000 });
    await logout(page);

    // 2. Manager triage and dispatch
    await loginAs(page, DEMO_CREDENTIALS.FACILITY_MANAGER);
    await expect(page).toHaveURL(/.*\/manager/);

    // Ensure Triage Queue tab is selected
    const triageCard = page.locator('.double-bezel-interactive', { hasText: 'Triage Queue' });
    await triageCard.click();

    // Locate the request card
    const requestCard = page.locator('.double-bezel-interactive').filter({ hasText: PRIMARY_REQ_TITLE });
    await expect(requestCard).toBeVisible({ timeout: 10000 });

    // Open Dispatch modal
    await requestCard.getByRole('button', { name: /dispatch work order/i }).click();
    const dispatchModal = page.locator('[role="dialog"]');
    await expect(dispatchModal).toBeVisible();

    // Select Technician Rahul Verma and dispatch
    await dispatchModal.locator('select').first().selectOption({ label: 'Rahul Verma (HVAC & Electrical Maintenance)' });
    await dispatchModal.getByRole('button', { name: /dispatch order/i }).click();
    await expect(dispatchModal).not.toBeVisible({ timeout: 10000 });

    // Request should no longer be in Triage Queue
    await expect(page.locator('.double-bezel-interactive').filter({ hasText: PRIMARY_REQ_TITLE })).not.toBeVisible();
    await logout(page);

    // 3. Technician Rahul executes work
    await loginAs(page, DEMO_CREDENTIALS.TECHNICIAN);
    await expect(page).toHaveURL(/.*\/technician/);

    // Locate assigned work order
    const workOrderCard = page.locator('.double-bezel-interactive').filter({ hasText: PRIMARY_REQ_TITLE });
    await expect(workOrderCard).toBeVisible({ timeout: 10000 });

    // Open work order execution modal
    await workOrderCard.getByRole('button', { name: /execute work/i }).click();
    const execModal = page.locator('[role="dialog"]');
    await expect(execModal).toBeVisible();

    // Update state to IN_PROGRESS
    await execModal.getByRole('button', { name: 'IN PROGRESS' }).click();

    // Fill Diagnosis & Corrective Actions
    await execModal
      .locator('textarea')
      .first()
      .fill('Eroded valve seating and flange rupture causing severe hydronic pressure leak.');
    await execModal
      .locator('textarea')
      .nth(1)
      .fill('Replaced 2-inch commercial union gasket, reseated valve body, torqued to 45 ft-lbs, pressure tested.');

    // Add parts used
    await execModal.locator('input[placeholder*="Part name"]').fill('2-inch Heavy Duty Union Gasket');
    await execModal.locator('input[placeholder*="Qty"]').fill('2');
    await execModal.locator('input[placeholder*="Unit $"]').fill('45');
    await execModal.getByRole('button', { name: 'Add' }).click();
    await expect(execModal.getByText('2-inch Heavy Duty Union Gasket')).toBeVisible();

    // Attach after-repair evidence photo
    await execModal.getByRole('button', { name: '+ Repair Photo 1' }).click();
    await expect(execModal.getByText(/Attached:/)).toBeVisible();

    // Submit for FM Verification
    await execModal.getByRole('button', { name: /submit for fm verification/i }).click();
    await expect(execModal).not.toBeVisible({ timeout: 10000 });
    await logout(page);

    // 4. Facility Manager Verification Studio
    await loginAs(page, DEMO_CREDENTIALS.FACILITY_MANAGER);
    await expect(page).toHaveURL(/.*\/manager/);

    // Switch to Verification tab
    await page.locator('.double-bezel-interactive').filter({ hasText: 'Repairs for Review' }).click();

    // Locate the completed work order in Verification Studio
    const reviewCard = page.locator('.double-bezel-interactive').filter({ hasText: PRIMARY_REQ_TITLE });
    await expect(reviewCard).toBeVisible({ timeout: 10000 });

    // Verify evidence and parts are present
    await expect(reviewCard.getByText('After Repair (Submitted Evidence)')).toBeVisible();
    await expect(reviewCard.getByText('2-inch Heavy Duty Union Gasket (x2)')).toBeVisible();

    // Verify & Close Case
    await reviewCard.getByRole('button', { name: /verify & close case/i }).click();

    // Success feedback banner
    await expect(page.getByText(/successfully verified and closed/i)).toBeVisible({ timeout: 10000 });

    // Review card moves out of Verification Studio
    await expect(page.locator('.double-bezel-interactive').filter({ hasText: PRIMARY_REQ_TITLE })).not.toBeVisible();
    await logout(page);

    // 5. Cross-account verification: Requester sees resolved status
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER);
    await expect(page.getByText(PRIMARY_REQ_TITLE).first()).toBeVisible();
    await logout(page);
  });

  test('Step 5: Rework Path (Manager Rejects Verification with Mandatory Note -> Technician Returns to Rework)', async ({
    page,
  }) => {
    // 1. Requester creates second request
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER);
    await page.getByRole('button', { name: /report an issue/i }).click();

    await expect(page.getByText('Report Campus Issue', { exact: false })).toBeVisible();
    await page.fill('input[placeholder*="Broken water pipe"]', REWORK_REQ_TITLE);
    await page.selectOption('select >> nth=0', 'HVAC & Refrigeration');
    await page.fill(
      'textarea[placeholder*="Describe what is malfunctioning"]',
      'Air handler rooftop blower unit making intermittent grinding metallic noise.'
    );

    await page.getByRole('button', { name: /submit report/i }).click();
    await expect(page.getByText('Report Campus Issue', { exact: false })).not.toBeVisible({ timeout: 10000 });
    await logout(page);

    // 2. Manager dispatches to Rahul
    await loginAs(page, DEMO_CREDENTIALS.FACILITY_MANAGER);
    const triageCard = page.locator('.double-bezel-interactive', { hasText: 'Triage Queue' });
    await triageCard.click();

    const reworkCard = page.locator('.double-bezel-interactive').filter({ hasText: REWORK_REQ_TITLE });
    await expect(reworkCard).toBeVisible({ timeout: 10000 });

    await reworkCard.getByRole('button', { name: /dispatch work order/i }).click();
    const dispatchModal = page.locator('[role="dialog"]');
    await expect(dispatchModal).toBeVisible();
    await dispatchModal.locator('select').first().selectOption({ label: 'Rahul Verma (HVAC & Electrical Maintenance)' });
    await dispatchModal.getByRole('button', { name: /dispatch order/i }).click();
    await expect(dispatchModal).not.toBeVisible({ timeout: 10000 });
    await logout(page);

    // 3. Technician Rahul executes and submits for verification
    await loginAs(page, DEMO_CREDENTIALS.TECHNICIAN);
    const woCard = page.locator('.double-bezel-interactive').filter({ hasText: REWORK_REQ_TITLE });
    await expect(woCard).toBeVisible({ timeout: 10000 });

    await woCard.getByRole('button', { name: /execute work/i }).click();
    const execModal = page.locator('[role="dialog"]');
    await expect(execModal).toBeVisible();

    await execModal.locator('textarea').first().fill('Blower belt misaligned with pulley.');
    await execModal.locator('textarea').nth(1).fill('Realigned belt and tightened tensioner.');
    await execModal.getByRole('button', { name: '+ Repair Photo 2' }).click();

    await execModal.getByRole('button', { name: /submit for fm verification/i }).click();
    await expect(execModal).not.toBeVisible({ timeout: 10000 });
    await logout(page);

    // 4. Manager reviews and REJECTS with mandatory rework note
    await loginAs(page, DEMO_CREDENTIALS.FACILITY_MANAGER);
    await page.locator('.double-bezel-interactive').filter({ hasText: 'Repairs for Review' }).click();

    const reviewWoCard = page.locator('.double-bezel-interactive').filter({ hasText: REWORK_REQ_TITLE });
    await expect(reviewWoCard).toBeVisible({ timeout: 10000 });

    await reviewWoCard.getByRole('button', { name: /reject \/ return for rework/i }).click();
    const rejectModal = page.locator('[role="dialog"]');
    await expect(rejectModal).toBeVisible();

    const reworkNote = 'Vibration dampener mount was not reinstalled. Please mount bracket before sign-off.';
    await rejectModal.locator('textarea').fill(reworkNote);
    await rejectModal.getByRole('button', { name: /submit rejection/i }).click();
    await expect(rejectModal).not.toBeVisible({ timeout: 10000 });

    // Success feedback confirming return for rework
    await expect(page.getByText(/returned to technician for rework/i)).toBeVisible({ timeout: 10000 });
    await logout(page);

    // 5. Technician checks work order returns to active queue
    await loginAs(page, DEMO_CREDENTIALS.TECHNICIAN);
    const reworkTechWo = page.locator('.double-bezel-interactive').filter({ hasText: REWORK_REQ_TITLE });
    await expect(reworkTechWo).toBeVisible({ timeout: 10000 });
    await logout(page);
  });
});
