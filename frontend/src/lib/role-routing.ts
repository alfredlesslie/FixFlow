import { UserRole } from './types';

export function getRoleRedirectPath(role?: UserRole | string | null): string {
  switch (role) {
    case 'REQUESTER':
      return '/requester';
    case 'TECHNICIAN':
      return '/technician';
    case 'FACILITY_MANAGER':
      return '/manager';
    case 'ADMIN':
      return '/admin';
    default:
      return '/requester';
  }
}

export function isRoleAuthorized(
  userRole: UserRole | string | null | undefined,
  allowedRoles: (UserRole | string)[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
