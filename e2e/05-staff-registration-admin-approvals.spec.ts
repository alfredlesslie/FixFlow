import { test, expect } from '@playwright/test';
import { DEMO_CREDENTIALS, loginAs, logout } from './helpers/auth';
import { getLatestVerificationLink } from './helpers/mailpit';

const RUN_ID = Date.now().toString().slice(-6);
const PASSWORD = 'TestUser@123';

export const TEST_STAFF = {
  TECH_A: {
    firstName: 'Devon',
    lastName: `TechA-${RUN_ID}`,
    email: `devon.techa.${RUN_ID}@fixflow.edu`,
    instId: `ID-TA-${RUN_ID}`,
    dept: 'Central Facilities Operations',
    phone: '+1 555-010-0001',
    role: 'TECHNICIAN' as const,
    trade: 'Electrical & Automation Systems',
    cert: `ELEC-CERT-${RUN_ID}`,
    expectedDashboard: '/technician',
  },
  TECH_B: {
    firstName: 'Marcus',
    lastName: `TechB-${RUN_ID}`,
    email: `marcus.techb.${RUN_ID}@fixflow.edu`,
    instId: `ID-TB-${RUN_ID}`,
    dept: 'Central Facilities Operations',
    phone: '+1 555-010-0002',
    role: 'TECHNICIAN' as const,
    trade: 'HVAC & Climate Control',
    cert: `HVAC-CERT-${RUN_ID}`,
    rejectionReason: 'The trade certification credentials could not be verified with campus facilities records.',
  },
  MGR_A: {
    firstName: 'Elena',
    lastName: `MgrA-${RUN_ID}`,
    email: `elena.mgra.${RUN_ID}@fixflow.edu`,
    instId: `ID-MA-${RUN_ID}`,
    dept: 'Central Facilities Operations',
    phone: '+1 555-010-0003',
    role: 'FACILITY_MANAGER' as const,
    scope: 'Engineering & Science Complex',
    justification: 'Appointed Lead Operations Coordinator for Engineering Complex per Facilities Memo 2026-B.',
    expectedDashboard: '/manager',
  },
};

test.describe('Phase F — New Account Registration and Administrator Approval', () => {
  test('Register and verify email for 3 staff applicants (Tech A, Tech B, FM A)', async ({ page }) => {
    // 1. Register Technician A
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.click('#role-select-technician');
    await page.fill('#first-name-input', TEST_STAFF.TECH_A.firstName);
    await page.fill('#last-name-input', TEST_STAFF.TECH_A.lastName);
    await page.fill('#email-register-input', TEST_STAFF.TECH_A.email);
    await page.fill('#inst-id-input', TEST_STAFF.TECH_A.instId);
    await page.selectOption('#department-select', TEST_STAFF.TECH_A.dept);
    await page.fill('#phone-input', TEST_STAFF.TECH_A.phone);
    await page.selectOption('#trade-discipline-select', TEST_STAFF.TECH_A.trade);
    await page.fill('#cert-number-input', TEST_STAFF.TECH_A.cert);
    await page.fill('#register-password-input', PASSWORD);
    await page.fill('#register-confirm-password-input', PASSWORD);

    await page.click('#submit-register-btn');
    await page.waitForURL('**/verify-email**', { timeout: 15000 });

    // Verify email via Mailpit
    const techALink = await getLatestVerificationLink(TEST_STAFF.TECH_A.email);
    await page.goto(techALink);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Institutional Email Verified', { exact: false })).toBeVisible({ timeout: 15000 });

    // 2. Register Technician B
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.click('#role-select-technician');
    await page.fill('#first-name-input', TEST_STAFF.TECH_B.firstName);
    await page.fill('#last-name-input', TEST_STAFF.TECH_B.lastName);
    await page.fill('#email-register-input', TEST_STAFF.TECH_B.email);
    await page.fill('#inst-id-input', TEST_STAFF.TECH_B.instId);
    await page.selectOption('#department-select', TEST_STAFF.TECH_B.dept);
    await page.fill('#phone-input', TEST_STAFF.TECH_B.phone);
    await page.selectOption('#trade-discipline-select', TEST_STAFF.TECH_B.trade);
    await page.fill('#cert-number-input', TEST_STAFF.TECH_B.cert);
    await page.fill('#register-password-input', PASSWORD);
    await page.fill('#register-confirm-password-input', PASSWORD);

    await page.click('#submit-register-btn');
    await page.waitForURL('**/verify-email**', { timeout: 15000 });

    const techBLink = await getLatestVerificationLink(TEST_STAFF.TECH_B.email);
    await page.goto(techBLink);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Institutional Email Verified', { exact: false })).toBeVisible({ timeout: 15000 });

    // 3. Register Facility Manager A
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.click('#role-select-manager');
    await page.fill('#first-name-input', TEST_STAFF.MGR_A.firstName);
    await page.fill('#last-name-input', TEST_STAFF.MGR_A.lastName);
    await page.fill('#email-register-input', TEST_STAFF.MGR_A.email);
    await page.fill('#inst-id-input', TEST_STAFF.MGR_A.instId);
    await page.selectOption('#department-select', TEST_STAFF.MGR_A.dept);
    await page.fill('#phone-input', TEST_STAFF.MGR_A.phone);
    await page.selectOption('#scope-select', TEST_STAFF.MGR_A.scope);
    await page.fill('#justification-input', TEST_STAFF.MGR_A.justification);
    await page.fill('#register-password-input', PASSWORD);
    await page.fill('#register-confirm-password-input', PASSWORD);

    await page.click('#submit-register-btn');
    await page.waitForURL('**/verify-email**', { timeout: 15000 });

    const mgrALink = await getLatestVerificationLink(TEST_STAFF.MGR_A.email);
    await page.goto(mgrALink);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Institutional Email Verified', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('Administrator reviews Approvals: Approves Tech A & FM A, Rejects Tech B with reason', async ({ page }) => {
    // Admin logs in
    await loginAs(page, DEMO_CREDENTIALS.ADMIN);
    await expect(page).toHaveURL(/.*\/admin/);

    // Navigate to Approvals
    await page.goto('/admin/approvals');
    await page.waitForLoadState('networkidle');

    // Filter by Pending
    await page.getByRole('button', { name: 'Pending' }).click();
    await page.waitForTimeout(500);

    // Verify all 3 applications appear
    await expect(page.getByText(TEST_STAFF.TECH_A.email)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(TEST_STAFF.TECH_B.email)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(TEST_STAFF.MGR_A.email)).toBeVisible({ timeout: 10000 });

    // 1. Approve Tech A
    const techACard = page.locator('.p-5.hover\\:bg-slate-50\\/60, .p-5').filter({ hasText: TEST_STAFF.TECH_A.email });
    await techACard.getByRole('button', { name: /approve account/i }).click();

    // Confirm in modal
    const approveModal = page.locator('[role="dialog"]');
    await expect(approveModal).toBeVisible();
    await approveModal.getByRole('button', { name: /confirm & authorize/i }).click();
    await expect(approveModal).not.toBeVisible({ timeout: 10000 });

    // 2. Approve FM A
    const mgrACard = page.locator('.p-5.hover\\:bg-slate-50\\/60, .p-5').filter({ hasText: TEST_STAFF.MGR_A.email });
    await mgrACard.getByRole('button', { name: /approve account/i }).click();
    await expect(approveModal).toBeVisible();
    await approveModal.getByRole('button', { name: /confirm & authorize/i }).click();
    await expect(approveModal).not.toBeVisible({ timeout: 10000 });

    // 3. Reject Tech B with reason
    const techBCard = page.locator('.p-5.hover\\:bg-slate-50\\/60, .p-5').filter({ hasText: TEST_STAFF.TECH_B.email });
    await techBCard.getByRole('button', { name: /reject/i }).click();

    // Rejection modal
    const rejectModal = page.locator('[role="dialog"]');
    await expect(rejectModal).toBeVisible();
    await rejectModal.locator('#reject-reason-input').fill(TEST_STAFF.TECH_B.rejectionReason);
    await rejectModal.getByRole('button', { name: /confirm denial/i }).click();
    await expect(rejectModal).not.toBeVisible({ timeout: 10000 });

    // Verify filters
    // Approved filter shows Tech A and FM A
    await page.getByRole('button', { name: 'Approved' }).click();
    await expect(page.getByText(TEST_STAFF.TECH_A.email)).toBeVisible();
    await expect(page.getByText(TEST_STAFF.MGR_A.email)).toBeVisible();

    // Rejected filter shows Tech B
    await page.getByRole('button', { name: 'Rejected' }).click();
    await expect(page.getByText(TEST_STAFF.TECH_B.email)).toBeVisible();

    await logout(page);
  });

  test('Verify login authorization outcomes for approved and rejected users', async ({ page }) => {
    // 1. Approved Technician A logs in -> opens /technician
    await page.goto('/login');
    await page.fill('#email-input', TEST_STAFF.TECH_A.email);
    await page.fill('#password-input', PASSWORD);
    await page.click('#submit-login-btn');
    await page.waitForURL('**/technician**', { timeout: 15000 });
    await expect(page.getByText('Technician Workbench', { exact: false }).first()).toBeVisible();
    await logout(page);

    // 2. Approved FM A logs in -> opens /manager
    await page.goto('/login');
    await page.fill('#email-input', TEST_STAFF.MGR_A.email);
    await page.fill('#password-input', PASSWORD);
    await page.click('#submit-login-btn');
    await page.waitForURL('**/manager**', { timeout: 15000 });
    await expect(page.getByText('Facility Manager Command Center', { exact: false }).first()).toBeVisible();
    await logout(page);

    // 3. Rejected Technician B logs in -> redirected to /pending-approval with rejection reason
    await page.goto('/login');
    await page.fill('#email-input', TEST_STAFF.TECH_B.email);
    await page.fill('#password-input', PASSWORD);
    await page.click('#submit-login-btn');
    await expect(
      page.getByRole('heading', { name: 'Application Not Approved' })
    ).toBeVisible({ timeout: 15000 });
  });
});
