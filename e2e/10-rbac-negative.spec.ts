import { test, expect } from '@playwright/test';
import { DEMO_CREDENTIALS, loginAs, logout } from './helpers/auth';

test.describe('Phase K & L — RBAC Guards, Negative Scenarios & Security Boundaries', () => {
  test('Direct UI Route Navigation Guards (Role-Based Enclosure)', async ({ page }) => {
    // 1. Log in as Requester
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER);
    await expect(page).toHaveURL(/.*\/requester/);

    // Attempt direct navigation to /admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    // Should NOT have access to Admin console
    await expect(page.getByText('Governance, Security & Audit Console')).not.toBeVisible();
    await expect(page.getByText('Unauthorized Station Access')).toBeVisible();

    // Attempt direct navigation to /manager
    await page.goto('/manager');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Operations & Triage Command')).not.toBeVisible();
    await expect(page.getByText('Unauthorized Station Access')).toBeVisible();

    // Attempt direct navigation to /technician
    await page.goto('/technician');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Field Dispatch & Repair Orders')).not.toBeVisible();
    await expect(page.getByText('Unauthorized Station Access')).toBeVisible();

    await logout(page);
  });

  test('Direct GraphQL RBAC Guards: Non-Admin Cannot Execute Administrative Mutations', async ({
    request,
    page,
  }) => {
    // 1. Authenticate as Requester via login to get valid token
    await loginAs(page, DEMO_CREDENTIALS.REQUESTER);
    const token = await page.evaluate(() => localStorage.getItem('fixflow_token'));
    expect(token).toBeTruthy();
    await logout(page);

    // 2. Attempt admin mutation: approveRegistrationApplication
    const approveResp = await request.post('http://localhost:4000/graphql', {
      headers: {
        'Content-Type': 'application/json',
        'apollo-require-preflight': 'true',
        Authorization: `Bearer ${token}`,
      },
      data: {
        query: `
          mutation DirectAdminHack($id: ID!) {
            approveRegistrationApplication(id: $id) {
              id
              status
            }
          }
        `,
        variables: { id: '00000000-0000-0000-0000-000000000001' },
      },
    });

    const approveJson = await approveResp.json();
    expect(approveJson.errors).toBeDefined();
    expect(approveJson.errors.length).toBeGreaterThan(0);
    const errCode = approveJson.errors[0]?.extensions?.code;
    expect(['FORBIDDEN', 'UNAUTHENTICATED', 'INTERNAL_SERVER_ERROR']).toContain(errCode);

    // 3. Attempt manager mutation: overridePriority as requester
    const overrideResp = await request.post('http://localhost:4000/graphql', {
      headers: {
        'Content-Type': 'application/json',
        'apollo-require-preflight': 'true',
        Authorization: `Bearer ${token}`,
      },
      data: {
        query: `
          mutation DirectManagerHack($id: ID!, $priority: PriorityLevel!, $reason: String!) {
            overridePriority(id: $id, priority: $priority, reason: $reason) {
              id
              priority
            }
          }
        `,
        variables: {
          id: '00000000-0000-0000-0000-000000000001',
          priority: 'CRITICAL',
          reason: 'Unauthorized attempt',
        },
      },
    });

    const overrideJson = await overrideResp.json();
    expect(overrideJson.errors).toBeDefined();
    expect(overrideJson.errors.length).toBeGreaterThan(0);
  });

  test('Unauthenticated Direct GraphQL Rejection', async ({ request }) => {
    // Attempt to query users without credentials
    const resp = await request.post('http://localhost:4000/graphql', {
      headers: {
        'Content-Type': 'application/json',
        'apollo-require-preflight': 'true',
      },
      data: {
        query: `
          query UnauthenticatedInspection {
            users {
              id
              email
              role
            }
          }
        `,
      },
    });

    const json = await resp.json();
    expect(json.errors).toBeDefined();
    expect(json.errors.length).toBeGreaterThan(0);
    const code = json.errors[0]?.extensions?.code;
    expect(['UNAUTHENTICATED', 'FORBIDDEN', 'INTERNAL_SERVER_ERROR']).toContain(code);
  });

  test('Form Validation & Disallowed Upload Rejection', async ({ request, page }) => {
    // 1. Duplicate email registration rejection
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.fill('#first-name-input', 'Duplicate');
    await page.fill('#last-name-input', 'User');
    await page.fill('#email-register-input', DEMO_CREDENTIALS.REQUESTER.email); // existing email
    await page.fill('#register-password-input', 'ValidPassword@123');
    await page.fill('#register-confirm-password-input', 'ValidPassword@123');

    await page.click('#submit-register-btn');
    await page.waitForTimeout(1000);

    // Expect an error banner on register page
    await expect(page.locator('#register-error-banner')).toBeVisible({ timeout: 10000 });

    // 2. Reject executable upload to attachment endpoint
    const uploadResp = await request.post('http://localhost:4000/api/attachments/upload', {
      multipart: {
        file: {
          name: 'malicious-payload.sh',
          mimeType: 'application/x-sh',
          buffer: Buffer.from('#!/bin/bash\necho "exploit"\n'),
        },
      },
    });

    expect(uploadResp.status()).toBeGreaterThanOrEqual(400);
  });
});
