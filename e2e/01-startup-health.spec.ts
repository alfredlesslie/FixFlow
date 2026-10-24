import { test, expect } from '@playwright/test';

test.describe('Phase A — Application Startup and Health', () => {
  test('Backend health endpoint reports healthy and database connected', async ({ request }) => {
    const response = await request.get('http://localhost:4000/api/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.database).toBe('connected');
    expect(body.service).toContain('FixFlow');
  });

  test('GraphQL endpoint responds to query', async ({ request }) => {
    const response = await request.post('http://localhost:4000/graphql', {
      headers: {
        'Content-Type': 'application/json',
        'apollo-require-preflight': 'true',
      },
      data: {
        query: `
          query {
            __typename
          }
        `,
      },
    });

    const text = await response.text();
    if (response.status() !== 200) {
      console.log('GraphQL Error Response:', response.status(), text);
    }
    expect(response.status()).toBe(200);
    const body = JSON.parse(text);
    expect(body.data?.__typename).toBe('Query');
    expect(body.errors).toBeUndefined();
  });

  test('Mailpit service is available and responding', async ({ request }) => {
    const response = await request.get('http://localhost:8025/api/v1/messages');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('messages');
  });

  test('Frontend application loads with valid title, meta, and no fatal React crash', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known harmless browser warnings
        if (!text.includes('Apollo DevTools') && !text.includes('chrome-extension://')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify title and page elements
    const title = await page.title();
    expect(title.toLowerCase()).toContain('fixflow');

    // Verify home page call to actions or redirect
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Verify no unhandled runtime crashes
    expect(consoleErrors.filter((e) => e.includes('Minified React error'))).toHaveLength(0);
  });

  test('Login and Register pages render correctly', async ({ page }) => {
    // Test Login Page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#email-input')).toBeVisible();
    await expect(page.locator('#password-input')).toBeVisible();
    await expect(page.locator('#submit-login-btn')).toBeVisible();

    // Test Register Page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#role-select-requester')).toBeVisible();
    await expect(page.locator('#first-name-input')).toBeVisible();
    await expect(page.locator('#email-register-input')).toBeVisible();
    await expect(page.locator('#submit-register-btn')).toBeVisible();
  });
});
