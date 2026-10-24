import { SetMetadata } from '@nestjs/common';

export const ALLOW_REJECTED_KEY = 'allow_rejected';

/**
 * Decorator to explicitly permit accounts in AccountStatus.REJECTED to access a restricted resolver
 * (e.g. self profile view or submitting a reapplication).
 */
export const AllowRejected = () => SetMetadata(ALLOW_REJECTED_KEY, true);
