'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { isRoleAuthorized, getRoleRedirectPath } from '@/lib/role-routing';
import { ShieldAlert, ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: (UserRole | string)[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    } else if (!loading && user && user.status === 'REJECTED') {
      router.replace(
        `/pending-approval?status=rejected&email=${encodeURIComponent(user.email)}&role=${user.role}&name=${encodeURIComponent(user.name)}`
      );
    } else if (!loading && user && user.status && user.status !== 'ACTIVE') {
      logout().then(() => router.replace('/login'));
    }
  }, [loading, isAuthenticated, user, logout, router]);

  // Keep protected route in loading state while authentication or user identity/role is resolving
  if (loading || (isAuthenticated && user && !user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

  if (user.status === 'REJECTED' || (user.status && user.status !== 'ACTIVE')) {
    return null; // Will redirect via useEffect
  }

  // If specific roles are required, verify access
  if (allowedRoles && allowedRoles.length > 0 && !isRoleAuthorized(user.role, allowedRoles)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900">
              403 • Access Restricted
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Unauthorized Station Access
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your active institutional role <strong className="text-slate-800 dark:text-slate-200 font-mono">[{user.role}]</strong> does not have permission to access this operational dashboard.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-left text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Authorized Roles:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                {allowedRoles.join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Account:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                {user.email}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <Button
              className="w-full"
              onClick={() => router.push(getRoleRedirectPath(user.role))}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to My Station
            </Button>
            <Button
              variant="outline"
              className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              icon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
