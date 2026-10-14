'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RequesterDashboard } from '@/components/roles/RequesterDashboard';

export default function RequesterPage() {
  return (
    <ProtectedRoute allowedRoles={['REQUESTER', 'FACILITY_MANAGER', 'ADMIN']}>
      <AppShell>
        <RequesterDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}
