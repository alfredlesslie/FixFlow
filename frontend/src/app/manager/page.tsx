'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FacilityManagerCommandCenter } from '@/components/roles/FacilityManagerCommandCenter';

export default function ManagerPage() {
  return (
    <ProtectedRoute allowedRoles={['FACILITY_MANAGER']}>
      <AppShell>
        <FacilityManagerCommandCenter />
      </AppShell>
    </ProtectedRoute>
  );
}
