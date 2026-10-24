import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RateLimitGuard(reflector);
  });

  afterEach(() => {
    guard.clear();
  });

  const createMockContext = (ip: string, handlerName: string) => {
    return {
      getHandler: () => ({ name: handlerName }),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          headers: {},
        }),
      }),
      getType: () => 'graphql',
      getArgs: () => [null, null, { req: { ip, headers: {} } }, null],
    } as any;
  };

  it('allows requests within configured threshold', () => {
    jest.spyOn(reflector, 'get').mockReturnValue({ windowMs: 60000, max: 2 });
    const ctx = createMockContext('127.0.0.1', 'login');

    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws 429 TOO_MANY_REQUESTS when limit is exceeded', () => {
    jest.spyOn(reflector, 'get').mockReturnValue({ windowMs: 60000, max: 2 });
    const ctx = createMockContext('127.0.0.1', 'login');

    guard.canActivate(ctx);
    guard.canActivate(ctx);

    try {
      guard.canActivate(ctx);
      throw new Error('Expected HttpException 429 but method returned without throwing');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect((err as HttpException).message).toContain('Rate limit exceeded');
    }
  });

  it('resets hit counter after window expiration', () => {
    jest.spyOn(reflector, 'get').mockReturnValue({ windowMs: -1000, max: 1 }); // Already expired
    const ctx = createMockContext('127.0.0.1', 'login');

    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('does not trust client-supplied X-Forwarded-For header directly when req.ip is set', () => {
    jest.spyOn(reflector, 'get').mockReturnValue({ windowMs: 60000, max: 2 });

    // Client connects from 192.168.1.50 and attempts to spoof X-Forwarded-For with random IPs
    const ctx1 = {
      getHandler: () => ({ name: 'login' }),
      getClass: () => ({}),
      getType: () => 'graphql',
      getArgs: () => [null, null, { req: { ip: '192.168.1.50', headers: { 'x-forwarded-for': '203.0.113.1' } } }, null],
    } as any;

    const ctx2 = {
      getHandler: () => ({ name: 'login' }),
      getClass: () => ({}),
      getType: () => 'graphql',
      getArgs: () => [null, null, { req: { ip: '192.168.1.50', headers: { 'x-forwarded-for': '203.0.113.2' } } }, null],
    } as any;

    const ctx3 = {
      getHandler: () => ({ name: 'login' }),
      getClass: () => ({}),
      getType: () => 'graphql',
      getArgs: () => [null, null, { req: { ip: '192.168.1.50', headers: { 'x-forwarded-for': '203.0.113.3' } } }, null],
    } as any;

    expect(guard.canActivate(ctx1)).toBe(true);
    expect(guard.canActivate(ctx2)).toBe(true);
    // Third attempt from same connection IP must be blocked despite different X-Forwarded-For headers
    expect(() => guard.canActivate(ctx3)).toThrow(HttpException);
  });

  it('cleans up expired records when cleanupExpired is triggered', () => {
    jest.spyOn(reflector, 'get').mockReturnValue({ windowMs: 1000, max: 5 });
    const ctx = createMockContext('10.0.0.1', 'login');
    guard.canActivate(ctx);

    // Trigger cleanup with a future timestamp
    guard.cleanupExpired(Date.now() + 5000);

    // Hit map should now be empty after cleanup
    // Re-accessing with max: 1 should allow the request
    jest.spyOn(reflector, 'get').mockReturnValue({ windowMs: 60000, max: 1 });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
