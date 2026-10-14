'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminConsole } from '@/components/roles/AdminConsole';

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AppShell>
        <AdminConsole />
      </AppShell>
    </ProtectedRoute>
  );
}
