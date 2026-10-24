'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getRoleRedirectPath } from '@/lib/role-routing';
import { LandingPage } from '@/components/landing/LandingPage';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.status === 'ACTIVE') {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [user, isLoading, router]);

  return <LandingPage />;
}

