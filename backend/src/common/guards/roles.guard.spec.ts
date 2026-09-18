import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockGqlContext(user?: { id: string; role: Role }) {
    return {
      getHandler: () => {},
      getClass: () => {},
      getArgs: () => [{}, {}, { req: { user } }, {}],
      getType: () => 'graphql',
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required on route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockGqlContext({ id: 'u1', role: Role.REQUESTER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user role matches required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.FACILITY_MANAGER, Role.ADMIN]);
    const context = createMockGqlContext({ id: 'u1', role: Role.FACILITY_MANAGER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user role is not authorized', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.FACILITY_MANAGER, Role.ADMIN]);
    const context = createMockGqlContext({ id: 'u1', role: Role.REQUESTER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when context has no user identity', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockGqlContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
