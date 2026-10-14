import React from 'react';
import { RequestStatus, WorkOrderStatus, PriorityLevel, UserRole } from '@/lib/types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'status' | 'priority' | 'role' | 'neutral' | 'outline';
  status?: RequestStatus | WorkOrderStatus;
  priority?: PriorityLevel;
  role?: UserRole;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  status,
  priority,
  role,
  size = 'md',
  className = '',
}: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  // If status is supplied
  if (status) {
    const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      OPEN: {
        bg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800',
        text: 'text-sky-700 dark:text-sky-300',
        dot: 'bg-sky-500',
        label: 'Open',
      },
      TRIAGED: {
        bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
        text: 'text-indigo-700 dark:text-indigo-300',
        dot: 'bg-indigo-500',
        label: 'Triaged',
      },
      ASSIGNED: {
        bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-500',
        label: 'Assigned',
      },
      IN_PROGRESS: {
        bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        dot: 'bg-blue-500 animate-pulse',
        label: 'In Progress',
      },
      RESOLVED: {
        bg: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
        text: 'text-teal-700 dark:text-teal-300',
        dot: 'bg-teal-500',
        label: 'Resolved',
      },
      VERIFIED: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        label: 'Verified',
      },
      CLOSED: {
        bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        text: 'text-slate-600 dark:text-slate-400',
        dot: 'bg-slate-400',
        label: 'Closed',
      },
      REOPENED: {
        bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
        text: 'text-rose-700 dark:text-rose-300',
        dot: 'bg-rose-500',
        label: 'Reopened',
      },
      CANCELLED: {
        bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        text: 'text-slate-500 dark:text-slate-400',
        dot: 'bg-slate-400',
        label: 'Cancelled',
      },
      PENDING: {
        bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-500',
        label: 'Pending',
      },
      ACCEPTED: {
        bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        dot: 'bg-blue-500',
        label: 'Accepted',
      },
      ON_HOLD: {
        bg: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
        text: 'text-orange-700 dark:text-orange-300',
        dot: 'bg-orange-500',
        label: 'On Hold',
      },
      COMPLETED: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        label: 'Completed',
      },
    };

    const cfg = statusConfig[status] || {
      bg: 'bg-slate-100 border-slate-200',
      text: 'text-slate-700',
      dot: 'bg-slate-400',
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${cfg.bg} ${cfg.text} ${sizeClasses} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span>{children || cfg.label}</span>
      </span>
    );
  }

  // Priority
  if (priority) {
    const priorityConfig: Record<PriorityLevel, { bg: string; text: string; label: string }> = {
      CRITICAL: {
        bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-semibold',
        text: 'text-rose-800 dark:text-rose-200',
        label: 'Critical',
      },
      HIGH: {
        bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        text: 'text-amber-800 dark:text-amber-200',
        label: 'High',
      },
      MEDIUM: {
        bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        label: 'Medium',
      },
      LOW: {
        bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        text: 'text-slate-700 dark:text-slate-300',
        label: 'Low',
      },
    };

    const cfg = priorityConfig[priority];
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full border ${cfg.bg} ${sizeClasses} ${className}`}
      >
        {children || cfg.label}
      </span>
    );
  }

  // Role
  if (role) {
    const roleLabels: Record<UserRole, string> = {
      REQUESTER: 'Requester',
      TECHNICIAN: 'Technician',
      FACILITY_MANAGER: 'Facility Manager',
      ADMIN: 'Admin',
    };

    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${sizeClasses} ${className}`}
      >
        {children || roleLabels[role]}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
}
