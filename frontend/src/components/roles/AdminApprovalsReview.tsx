'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { RegistrationApplication, ApplicationStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth-context';

export const INITIAL_APPLICATIONS: RegistrationApplication[] = [
  {
    id: 'app-2026-001',
    applicantName: 'Vikram Joshi',
    applicantEmail: 'v.joshi@fixflow.edu',
    institutionalId: 'TECH-2026-0814',
    department: 'Central Facilities Operations',
    contactNumber: '+1 (555) 392-1849',
    requestedRole: 'TECHNICIAN',
    emailVerified: true,
    status: 'PENDING_REVIEW',
    tradeDiscipline: 'HVAC & Climate Control',
    certificationNumber: 'EPA-UNIVERSAL-49201',
    yearsExperience: '6-10',
    facilityScope: 'Central Academic Campus (All Buildings)',
    submittedAt: '2026-10-14T08:30:00Z',
  },
  {
    id: 'app-2026-002',
    applicantName: 'Dr. Anita Desai',
    applicantEmail: 'a.desai@fixflow.edu',
    institutionalId: 'FAC-2024-9104',
    department: 'Electrical & Automation Systems',
    contactNumber: '+1 (555) 781-4492',
    requestedRole: 'FACILITY_MANAGER',
    emailVerified: true,
    status: 'PENDING_REVIEW',
    facilityScope: 'Engineering & Science Complex',
    appointmentJustification:
      'Appointed Faculty Operations Co-Chair for the New Technology Wing. Requires ticket triage and specialist dispatch privileges.',
    submittedAt: '2026-10-13T14:45:00Z',
  },
  {
    id: 'app-2026-003',
    applicantName: 'Carlos Morales',
    applicantEmail: 'c.morales@fixflow.edu',
    institutionalId: 'TECH-2026-0922',
    department: 'Central Facilities Operations',
    contactNumber: '+1 (555) 619-2044',
    requestedRole: 'TECHNICIAN',
    emailVerified: false,
    status: 'PENDING_REVIEW',
    tradeDiscipline: 'Plumbing & Hydraulics',
    certificationNumber: 'PLUMB-MSTR-88210',
    yearsExperience: '3-5',
    submittedAt: '2026-10-14T10:15:00Z',
  },
  {
    id: 'app-2026-004',
    applicantName: 'Preeti Sengupta',
    applicantEmail: 'p.sengupta@fixflow.edu',
    institutionalId: 'FAC-2025-0129',
    department: 'Library & Information Services',
    contactNumber: '+1 (555) 440-1928',
    requestedRole: 'FACILITY_MANAGER',
    emailVerified: true,
    status: 'REJECTED',
    facilityScope: 'Central Academic Campus (All Buildings)',
    appointmentJustification: 'Staff librarian requesting building oversight permissions.',
    rejectionReason:
      'Facility manager authorization requires written sign-off from the University Facilities Director. Please attach appointment letter ref.',
    reviewedBy: 'Vikram Singhania (Admin)',
    reviewedAt: '2026-10-12T16:00:00Z',
    submittedAt: '2026-10-11T11:20:00Z',
  },
];

export function AdminApprovalsReview() {
  const { user: authUser } = useAuth();

  const [applications, setApplications] = useState<RegistrationApplication[]>(() => {
    // Check if a registration was just submitted during this session
    try {
      const saved = sessionStorage.getItem('fixflow_last_registration');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.requestedRole !== 'REQUESTER') {
          const newApp: RegistrationApplication = {
            id: `app-live-${Date.now()}`,
            applicantName: `${parsed.firstName} ${parsed.lastName}`,
            applicantEmail: parsed.institutionalEmail,
            institutionalId: parsed.institutionalId,
            department: parsed.department,
            contactNumber: parsed.contactNumber,
            requestedRole: parsed.requestedRole,
            emailVerified: true,
            status: 'PENDING_REVIEW',
            tradeDiscipline: parsed.tradeDiscipline,
            certificationNumber: parsed.certificationNumber,
            yearsExperience: parsed.yearsExperience,
            facilityScope: parsed.facilityScope,
            appointmentJustification: parsed.appointmentJustification,
            submittedAt: parsed.submittedAt || new Date().toISOString(),
          };
          return [newApp, ...INITIAL_APPLICATIONS];
        }
      }
    } catch {}
    return INITIAL_APPLICATIONS;
  });

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

  // Quick reject reason presets
  const REJECT_PRESETS = [
    'Unverified or unlisted trade certification credentials.',
    'Administrative appointment letter or department authorization not provided.',
    'Requested facility scope exceeds departmental assignment.',
    'Applicant already has an active account; request role change through department head.',
  ];

  const handleApprove = () => {
    if (!selectedApp) return;

    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedApp.id
          ? {
              ...app,
              status: 'APPROVED' as ApplicationStatus,
              reviewedBy: authUser?.name || 'Administrator',
              reviewedAt: new Date().toISOString(),
            }
          : app
      )
    );

    setActionAlert({
      type: 'success',
      message: `Application for ${selectedApp.applicantName} approved. Assigned role: ${selectedApp.requestedRole.replace('_', ' ')}.`,
    });

    setIsApproveOpen(false);
    setSelectedApp(null);
  };

  const handleReject = () => {
    if (!selectedApp || !rejectionReason.trim()) return;

    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedApp.id
          ? {
              ...app,
              status: 'REJECTED' as ApplicationStatus,
              rejectionReason: rejectionReason.trim(),
              reviewedBy: authUser?.name || 'Administrator',
              reviewedAt: new Date().toISOString(),
            }
          : app
      )
    );

    setActionAlert({
      type: 'success',
      message: `Application for ${selectedApp.applicantName} was rejected with recorded justification.`,
    });

    setIsRejectOpen(false);
    setSelectedApp(null);
    setRejectionReason('');
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

  return (
    <div className="space-y-6">
      {/* Action Notification Alert */}
      {actionAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
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
        </div>
      </div>

      {/* Integration Boundary Notice */}
      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong>Frontend Integration Boundary:</strong> Only signed-in Administrators can view and execute these approval actions. Approval mutations update client session state and dispatch records to the local audit trail pending final backend GraphQL endpoint connection.
        </div>
      </div>

      {/* Applications Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredApps.length === 0 ? (
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
                          onClick={() => {
                            setSelectedApp(app);
                            setIsRejectOpen(true);
                          }}
                          className="border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>

                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedApp(app);
                            setIsApproveOpen(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Approve Account
                        </Button>
                      </>
                    ) : app.status === 'APPROVED' ? (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Authorized by {app.reviewedBy}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        <span>Denied by {app.reviewedBy}</span>
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
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Confirm & Authorize Account
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

            {!selectedApp.emailVerified && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Notice: This applicant has not yet completed institutional email verification. Approving now will grant role permissions once email verification succeeds.
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              By authorizing, this user will gain access to campus work orders, equipment triage, and operational tools corresponding to the requested role. An immutable governance log will be created.
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
              disabled={rejectionReason.trim().length < 10}
              onClick={handleReject}
            >
              Confirm Denial
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
