import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  role: 'REQUESTER' | 'TECHNICIAN' | 'FACILITY_MANAGER' | 'ADMIN';
  expectedName: string;
  expectedDashboardPath: string;
}

export const DEMO_CREDENTIALS = {
  REQUESTER: {
    email: 'student.riya@fixflow.edu',
    password: process.env.DEMO_STUDENT_PASSWORD || 'Student@123',
    role: 'REQUESTER' as const,
    expectedName: 'Riya Patel',
    expectedDashboardPath: '/requester',
  },
  REQUESTER_B: {
    email: 'prof.sharma@fixflow.edu',
    password: process.env.DEMO_STUDENT_PASSWORD || 'Student@123',
    role: 'REQUESTER' as const,
    expectedName: 'Prof. Sharma',
    expectedDashboardPath: '/requester',
  },
  TECHNICIAN: {
    email: 'tech.rahul@fixflow.edu',
    password: process.env.DEMO_TECH_PASSWORD || 'Tech@123',
    role: 'TECHNICIAN' as const,
    expectedName: 'Rahul Verma',
    expectedDashboardPath: '/technician',
  },
  TECHNICIAN_B: {
    email: 'tech.arun@fixflow.edu',
    password: process.env.DEMO_TECH_PASSWORD || 'Tech@123',
    role: 'TECHNICIAN' as const,
    expectedName: 'Arun Kumar',
    expectedDashboardPath: '/technician',
  },
  FACILITY_MANAGER: {
    email: 'manager@fixflow.edu',
    password: process.env.DEMO_MANAGER_PASSWORD || 'Manager@123',
    role: 'FACILITY_MANAGER' as const,
    expectedName: 'Sunil Mehta',
    expectedDashboardPath: '/manager',
  },
  ADMIN: {
    email: 'admin@fixflow.edu',
    password: process.env.DEMO_ADMIN_PASSWORD || 'Admin@123',
    role: 'ADMIN' as const,
    expectedName: 'Campus Administrator',
    expectedDashboardPath: '/admin',
  },
};

/**
 * Log into FixFlow as the specified user.
 */
export async function loginAs(page: Page, user: TestUser, passwordOverride?: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill credentials
  await page.fill('#email-input', user.email);
  const password = passwordOverride ||
    (user.role === 'ADMIN' ? DEMO_CREDENTIALS.ADMIN.password :
     user.role === 'FACILITY_MANAGER' ? DEMO_CREDENTIALS.FACILITY_MANAGER.password :
     user.role === 'TECHNICIAN' ? DEMO_CREDENTIALS.TECHNICIAN.password :
     DEMO_CREDENTIALS.REQUESTER.password);

  await page.fill('#password-input', password);
  await page.click('#submit-login-btn');

  // Check if redirect occurs or if rate limiting triggers an error banner
  try {
    await page.waitForURL(`**${user.expectedDashboardPath}**`, { timeout: 8000 });
  } catch (err) {
    const errorBanner = page.locator('#login-error-banner').or(page.getByText(/internal server error|too many login attempts/i));
    if (await errorBanner.isVisible()) {
      console.log(`[RateLimitRecovery] Detected rate limit banner on login for ${user.email}. Waiting for window reset...`);
      await page.waitForTimeout(30000);
      await page.click('#submit-login-btn');
      try {
        await page.waitForURL(`**${user.expectedDashboardPath}**`, { timeout: 10000 });
      } catch {
        await page.waitForTimeout(30000);
        await page.click('#submit-login-btn');
        await page.waitForURL(`**${user.expectedDashboardPath}**`, { timeout: 15000 });
      }
    } else {
      throw err;
    }
  }
  await page.waitForLoadState('networkidle');

  // Verify user is visible in AppShell
  const userMenuBtn = page.locator('#user-menu-btn').or(page.locator('header button:has(img)'));
  await expect(userMenuBtn).toBeVisible({ timeout: 10000 });
}

/**
 * Log out of FixFlow and verify redirect to login.
 */
export async function logout(page: Page) {
  const userMenuBtn = page.locator('#user-menu-btn').or(page.locator('header button:has(img)'));
  if (await userMenuBtn.isVisible()) {
    await userMenuBtn.click();
    const logoutBtn = page.locator('#user-logout-btn').or(page.getByRole('button', { name: /sign out/i }));
    await expect(logoutBtn).toBeVisible({ timeout: 5000 });
    await logoutBtn.click();
    await page.waitForURL('**/login', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  } else {
    // If already on login or menu hidden
    await page.goto('/login');
  }
}
