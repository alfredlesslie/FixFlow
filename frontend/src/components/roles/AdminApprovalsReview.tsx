'use client';

import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  UserCheck,
  Shield,
  HardHat,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  FileText,
  Mail,
  Building2,
  Phone,
  Briefcase,
  AlertCircle,
  ExternalLink,
  Info,
  BadgeCheck,
  RotateCcw,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { RegistrationApplication, ApplicationStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth-context';

export const GET_REGISTRATION_APPLICATIONS_QUERY = gql`
  query GetRegistrationApplications($status: ApplicationStatus) {
    registrationApplications(status: $status) {
      id
      userId
      applicantName
      applicantEmail
      institutionalId
      department
      contactNumber
      requestedRole
      status
      emailVerified
      tradeDiscipline
      certificationNumber
      yearsExperience
      facilityScope
      appointmentJustification
      rejectionReason
      reviewedById
      reviewedAt
      submittedAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_REGISTRATION_APPLICATION_QUERY = gql`
  query GetRegistrationApplication($id: ID!) {
    registrationApplication(id: $id) {
      id
      userId
      applicantName
      applicantEmail
      institutionalId
      department
      contactNumber
      requestedRole
      status
      emailVerified
      tradeDiscipline
      certificationNumber
      yearsExperience
      facilityScope
      appointmentJustification
      rejectionReason
      reviewedById
      reviewedAt
      submittedAt
      createdAt
      updatedAt
    }
  }
`;

export const APPROVE_REGISTRATION_APPLICATION_MUTATION = gql`
  mutation ApproveRegistrationApplication($id: ID!) {
    approveRegistrationApplication(id: $id) {
      id
      userId
      applicantName
      applicantEmail
      institutionalId
      department
      contactNumber
      requestedRole
      status
      emailVerified
      tradeDiscipline
      certificationNumber
      yearsExperience
      facilityScope
      appointmentJustification
      rejectionReason
      reviewedById
      reviewedAt
      submittedAt
      createdAt
      updatedAt
    }
  }
`;

export const REJECT_REGISTRATION_APPLICATION_MUTATION = gql`
  mutation RejectRegistrationApplication($id: ID!, $reason: String!) {
    rejectRegistrationApplication(id: $id, reason: $reason) {
      id
      userId
      applicantName
      applicantEmail
      institutionalId
      department
      contactNumber
      requestedRole
      status
      emailVerified
      tradeDiscipline
      certificationNumber
      yearsExperience
      facilityScope
      appointmentJustification
      rejectionReason
      reviewedById
      reviewedAt
      submittedAt
      createdAt
      updatedAt
    }
  }
`;

function formatErrorMessage(err: any): string {
  if (err?.graphQLErrors && err.graphQLErrors.length > 0) {
    const first = err.graphQLErrors[0];
    if (Array.isArray(first.message)) return first.message.join('. ');
    if (first.message) return first.message;
  }
  if (
    err?.message?.includes('Failed to fetch') ||
    err?.message?.includes('NetworkError') ||
    err?.networkError
  ) {
    return 'Unable to reach FixFlow backend service. Please ensure the backend server is running.';
  }
  return err?.message || 'An unexpected error occurred during this operation.';
}

export function AdminApprovalsReview() {
  const { user: authUser } = useAuth();

  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TECHNICIAN' | 'FACILITY_MANAGER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedApp, setSelectedApp] = useState<RegistrationApplication | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionAlert, setActionAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Real backend GraphQL queries & mutations
  const { data, loading, error, refetch } = useQuery(GET_REGISTRATION_APPLICATIONS_QUERY, {
    variables: {
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  const [approveMutation, { loading: isApproving }] = useMutation(
    APPROVE_REGISTRATION_APPLICATION_MUTATION
  );
  const [rejectMutation, { loading: isRejecting }] = useMutation(
    REJECT_REGISTRATION_APPLICATION_MUTATION
  );

  const applications: RegistrationApplication[] = data?.registrationApplications || [];

  // Quick reject reason presets
  const REJECT_PRESETS = [
    'Unverified or unlisted trade certification credentials.',
    'Administrative appointment letter or department authorization not provided.',
    'Requested facility scope exceeds departmental assignment.',
    'Applicant already has an active account; request role change through department head.',
  ];

  const handleApprove = async () => {
    if (!selectedApp) return;

    // Client-side self-approval guard (mirrors backend rule)
    if (selectedApp.userId && authUser && selectedApp.userId === authUser.id) {
      setActionAlert({
        type: 'error',
        message: 'Self-approval prohibited: Administrators cannot approve their own registration application.',
      });
      setIsApproveOpen(false);
      return;
    }

    // Client-side email verification guard (mirrors backend rule)
    if (!selectedApp.emailVerified) {
      setActionAlert({
        type: 'error',
        message: 'Cannot approve staff application: Applicant institutional email address has not been verified.',
      });
      setIsApproveOpen(false);
      return;
    }

    setActiveActionId(selectedApp.id);
    setActionAlert(null);

    try {
      const res = await approveMutation({
        variables: { id: selectedApp.id },
      });

      const updated = res.data?.approveRegistrationApplication;
      setActionAlert({
        type: 'success',
        message: `Application for ${updated?.applicantName || selectedApp.applicantName} approved successfully. Assigned role: ${(updated?.requestedRole || selectedApp.requestedRole).replace('_', ' ')}.`,
      });

      setIsApproveOpen(false);
      setSelectedApp(null);
      await refetch();
    } catch (err: any) {
      setActionAlert({
        type: 'error',
        message: formatErrorMessage(err),
      });
    } finally {
      setActiveActionId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) return;

    if (rejectionReason.trim().length < 10) {
      setActionAlert({
        type: 'error',
        message: 'A documented rejection reason of at least 10 characters is required.',
      });
      return;
    }

    if (selectedApp.userId && authUser && selectedApp.userId === authUser.id) {
      setActionAlert({
        type: 'error',
        message: 'Prohibited: You cannot reject your own registration application.',
      });
      setIsRejectOpen(false);
      return;
    }

    setActiveActionId(selectedApp.id);
    setActionAlert(null);

    try {
      const res = await rejectMutation({
        variables: {
          id: selectedApp.id,
          reason: rejectionReason.trim(),
        },
      });

      const updated = res.data?.rejectRegistrationApplication;
      setActionAlert({
        type: 'success',
        message: `Application for ${updated?.applicantName || selectedApp.applicantName} was rejected with recorded justification.`,
      });

      setIsRejectOpen(false);
      setSelectedApp(null);
      setRejectionReason('');
      await refetch();
    } catch (err: any) {
      setActionAlert({
        type: 'error',
        message: formatErrorMessage(err),
      });
    } finally {
      setActiveActionId(null);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (roleFilter !== 'ALL' && app.requestedRole !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        app.applicantName.toLowerCase().includes(q) ||
        app.applicantEmail.toLowerCase().includes(q) ||
        app.institutionalId.toLowerCase().includes(q) ||
        app.department.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const pendingCount = applications.filter((a) => a.status === 'PENDING_REVIEW').length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;

  if (authUser && authUser.role !== 'ADMIN') {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-sm text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Administrator Access Required</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The registration approvals workstation is restricted to verified administrators. Your current role is <strong className="font-mono text-slate-700 dark:text-slate-300">[{authUser.role}]</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            actionAlert.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span>{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className={`text-[11px] font-semibold hover:underline ${
              actionAlert.type === 'error'
                ? 'text-rose-700 dark:text-rose-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Pending Authorization
            </span>
            <div className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 mt-0.5">
              {pendingCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Approved Accounts
            </span>
            <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5">
              {approvedCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Rejected Requests
            </span>
            <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400 mt-0.5">
              {rejectedCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Governance State
            </span>
            <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              RBAC Strict Enforcement
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="approvals-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applicant name, email, or ID..."
            className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {(['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'ALL'
                  ? 'All'
                  : st === 'PENDING_REVIEW'
                  ? 'Pending'
                  : st === 'APPROVED'
                  ? 'Approved'
                  : 'Rejected'}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Requested Roles</option>
            <option value="TECHNICIAN">Technicians Only</option>
            <option value="FACILITY_MANAGER">Facility Managers Only</option>
          </select>

          {/* Refresh Action */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded-xl flex items-center gap-1.5"
            title="Refresh applications from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Backend Error Alert & Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <strong className="block font-semibold">Failed to load registration applications</strong>
              <span className="text-[11px] text-rose-700 dark:text-rose-400">
                {formatErrorMessage(error)}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 self-start sm:self-auto shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Retry Request
          </Button>
        </div>
      )}

      {/* Applications Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading && applications.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-sky-500 animate-spin" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Retrieving registration applications...</p>
            <p className="text-[11px] text-slate-500">Connecting to FixFlow GraphQL administrator service.</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <UserCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No applications match current filters.</p>
            <p className="text-[11px]">Adjust your search query or reset status filters above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Applicant Identity */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-sm shrink-0">
                      {app.applicantName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {app.applicantName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                          {app.institutionalId}
                        </span>

                        {/* Requested Role Badge */}
                        {app.requestedRole === 'TECHNICIAN' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <HardHat className="w-3 h-3" />
                            Technician
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            <Wrench className="w-3 h-3" />
                            Facility Manager
                          </span>
                        )}

                        {/* Email Verification State */}
                        {app.emailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Email Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            Unverified Email
                          </span>
                        )}

                        {/* Application Status */}
                        {app.status === 'PENDING_REVIEW' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                            Pending Review
                          </span>
                        )}
                        {app.status === 'APPROVED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Approved
                          </span>
                        )}
                        {app.status === 'REJECTED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            Rejected
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{app.applicantEmail}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.department}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.contactNumber}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    {app.status === 'PENDING_REVIEW' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={activeActionId === app.id || isApproving || isRejecting}
                          onClick={() => {
                            setSelectedApp(app);
                            setIsRejectOpen(true);
                          }}
                          className="border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        >
                          {activeActionId === app.id && isRejecting ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                          )}
                          Reject
                        </Button>

                        <Button
                          size="sm"
                          variant="primary"
                          disabled={
                            activeActionId === app.id ||
                            isApproving ||
                            isRejecting ||
                            (!!app.userId && !!authUser && app.userId === authUser.id) ||
                            !app.emailVerified
                          }
                          onClick={() => {
                            setSelectedApp(app);
                            setIsApproveOpen(true);
                          }}
                          title={
                            app.userId && authUser && app.userId === authUser.id
                              ? 'Self-approval is prohibited'
                              : !app.emailVerified
                              ? 'Applicant email verification required'
                              : 'Authorize account'
                          }
                          className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {activeActionId === app.id && isApproving ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          )}
                          Approve Account
                        </Button>
                      </>
                    ) : app.status === 'APPROVED' ? (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Authorized
                          {app.reviewedById ? ` by admin (${app.reviewedById.substring(0, 8)})` : ''}
                          {app.reviewedAt ? ` on ${new Date(app.reviewedAt).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        <span>
                          Denied
                          {app.reviewedById ? ` by admin (${app.reviewedById.substring(0, 8)})` : ''}
                          {app.reviewedAt ? ` on ${new Date(app.reviewedAt).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Qualification Details Drawer */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                    <span>Qualification & Access Scope Details</span>
                    <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                  </div>

                  {app.requestedRole === 'TECHNICIAN' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700 dark:text-slate-300 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Trade Discipline:</span>
                        <strong className="text-slate-900 dark:text-white">{app.tradeDiscipline || 'General Maintenance'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Trade License / Cert:</span>
                        <span className="font-mono text-slate-900 dark:text-white font-semibold">
                          {app.certificationNumber || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Years Experience:</span>
                        <span className="text-slate-900 dark:text-white">{app.yearsExperience || 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  {app.requestedRole === 'FACILITY_MANAGER' && (
                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <span className="text-slate-400">Target Facility Scope: </span>
                        <strong className="text-slate-900 dark:text-white">{app.facilityScope}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Appointment Justification:</span>
                        <p className="italic text-slate-700 dark:text-slate-300 mt-0.5 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                          "{app.appointmentJustification}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rejection explanation if already rejected */}
                  {app.status === 'REJECTED' && app.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-300">
                      <strong>Recorded Rejection Reason:</strong> {app.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APPROVAL CONFIRMATION MODAL */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>Authorize Institutional Account</span>
          </div>
        }
        subtitle="Review applicant credentials and confirm role permissions."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApproveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={
                isApproving ||
                (!!selectedApp?.userId && !!authUser && selectedApp.userId === authUser.id) ||
                !selectedApp?.emailVerified
              }
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Authorizing...
                </>
              ) : (
                'Confirm & Authorize Account'
              )}
            </Button>
          </>
        }
      >
        {selectedApp && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Applicant:</span>
                <strong className="text-slate-900 dark:text-white">{selectedApp.applicantName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Campus Email:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedApp.applicantEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Institutional ID:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedApp.institutionalId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigning Role:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {selectedApp.requestedRole.replace('_', ' ')}
                </span>
              </div>
            </div>

            {selectedApp.userId && authUser && selectedApp.userId === authUser.id && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-300 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Self-Approval Prohibited:</strong> You cannot approve your own registration application under institutional audit policy.
                </span>
              </div>
            )}

            {!selectedApp.emailVerified && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Email Verification Required:</strong> This applicant has not yet completed institutional email verification. The backend requires email verification before an application can be approved.
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              By authorizing, this user will gain access to campus work orders, equipment triage, and operational tools corresponding to the requested role. An immutable governance audit entry will be recorded.
            </p>
          </div>
        )}
      </Modal>

      {/* REJECTION REASON MODAL */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title={
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <XCircle className="w-5 h-5" />
            <span>Deny Application for Access</span>
          </div>
        }
        subtitle="A mandatory justification must be recorded for the applicant and audit trail."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRejectOpen(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={
                isRejecting ||
                rejectionReason.trim().length < 10 ||
                (!!selectedApp?.userId && !!authUser && selectedApp.userId === authUser.id)
              }
              onClick={handleReject}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Denying...
                </>
              ) : (
                'Confirm Denial'
              )}
            </Button>
          </>
        }
      >
        {selectedApp && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Specify the rationale for denying the request for{' '}
              <strong className="text-slate-900 dark:text-white">{selectedApp.applicantName}</strong> (
              {selectedApp.requestedRole.replace('_', ' ')}). The applicant will see this explanation and will have an option to submit a corrected application.
            </p>

            {selectedApp.userId && authUser && selectedApp.userId === authUser.id && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-300 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Prohibited:</strong> You cannot reject your own registration application.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Denial <span className="text-rose-500">* (minimum 10 characters)</span>
              </label>
              <textarea
                id="reject-reason-input"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. The trade certification number provided does not match campus records. Please reapply with valid state certification documentation."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Characters: {rejectionReason.length}/10 minimum
              </span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                Quick Reason Presets:
              </span>
              <div className="space-y-1">
                {REJECT_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
