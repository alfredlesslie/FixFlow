'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TechnicianWorkbench } from '@/components/roles/TechnicianWorkbench';

export default function TechnicianPage() {
  return (
    <ProtectedRoute allowedRoles={['TECHNICIAN']}>
      <AppShell>
        <TechnicianWorkbench />
      </AppShell>
    </ProtectedRoute>
  );
}
