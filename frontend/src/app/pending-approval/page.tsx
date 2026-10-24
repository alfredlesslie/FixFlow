'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Clock,
  ShieldCheck,
  XCircle,
  FileText,
  User,
  Building2,
  Mail,
  ArrowRight,
  Layers,
  Sparkles,
  RotateCcw,
  BadgeCheck,
  AlertCircle,
  Info,
  LogOut,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

type ApprovalStatus = 'pending' | 'rejected';

function PendingApprovalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();

  const emailParam = searchParams.get('email') || authUser?.email || 'tech.applicant@fixflow.edu';
  const roleParam = searchParams.get('role') || authUser?.role || 'TECHNICIAN';
  const nameParam = searchParams.get('name') || authUser?.name || 'Arun Nair';
  const statusParam =
    (searchParams.get('status') as ApprovalStatus) ||
    (authUser?.status === 'REJECTED' ? 'rejected' : 'pending');

  const [status, setStatus] = useState<ApprovalStatus>(statusParam);

  useEffect(() => {
    if (authUser?.status === 'REJECTED') {
      setStatus('rejected');
    } else if (statusParam === 'rejected' || statusParam === 'pending') {
      setStatus(statusParam);
    }
  }, [statusParam, authUser]);

  // Read any last registration details stored in sessionStorage
  const [sessionRecord, setSessionRecord] = useState<any>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('fixflow_last_registration');
      if (saved) setSessionRecord(JSON.parse(saved));
    } catch {}
  }, []);

  const applicant = {
    name: authUser?.name || nameParam,
    email: authUser?.email || emailParam,
    role: authUser?.role || roleParam,
    institutionalId: authUser?.institutionalId || sessionRecord?.institutionalId || 'TECH-2026-0941',
    department: authUser?.department || sessionRecord?.department || 'Electrical & Automation Systems',
    submittedAt: sessionRecord?.submittedAt ? new Date(sessionRecord.submittedAt).toLocaleDateString() : 'Today at 09:15 AM',
    tradeDiscipline: sessionRecord?.tradeDiscipline || 'Electrical & Automation Systems',
    certificationNumber: sessionRecord?.certificationNumber || 'ELEC-CERT-9042-B',
    yearsExperience: sessionRecord?.yearsExperience || '4',
    scope: sessionRecord?.facilityScope || 'Central Academic Campus (All Buildings)',
    justification:
      sessionRecord?.appointmentJustification ||
      'Designated campus maintenance tradesperson authorized to accept and resolve physical facility work orders.',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-600/10 to-indigo-600/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between relative z-10 mb-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            Fix<span className="text-sky-500">Flow</span>
          </span>
        </Link>
        <ThemeToggle variant="outline" />
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto relative z-10 my-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6 transition-colors">
          {/* STATE A: PENDING REVIEW */}
          {status === 'pending' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Application Queued for Review
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Pending Administrator Approval
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your institutional email has been verified. Because you requested elevated access as a{' '}
                  <strong className="text-slate-900 dark:text-white font-semibold">
                    {applicant.role.replace('_', ' ')}
                  </strong>
                  , your credentials must be authorized by campus operations administration.
                </p>
              </div>

              {/* Application Details Summary */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/80 font-semibold text-slate-700 dark:text-slate-300">
                  <span>Application Summary</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full font-bold">
                    Review in Progress
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Applicant</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{applicant.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Institutional ID</span>
                    <span className="font-mono text-slate-900 dark:text-white">{applicant.institutionalId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Campus Email</span>
                    <span className="font-mono text-slate-900 dark:text-white truncate block">{applicant.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Department</span>
                    <span className="text-slate-900 dark:text-white">{applicant.department}</span>
                  </div>
                </div>

                {applicant.role === 'TECHNICIAN' && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <div>
                      <span className="text-slate-400">Trade Discipline: </span>
                      <strong className="text-slate-800 dark:text-slate-200">{applicant.tradeDiscipline}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">License / Cert: </span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{applicant.certificationNumber}</strong>
                    </div>
                  </div>
                )}

                {applicant.role === 'FACILITY_MANAGER' && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <div>
                      <span className="text-slate-400">Target Facility Scope: </span>
                      <strong className="text-slate-800 dark:text-slate-200">{applicant.scope}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Appointment Justification: </span>
                      <span className="italic text-slate-700 dark:text-slate-300 block mt-0.5">{applicant.justification}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Informational SLA Note */}
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 text-xs text-sky-900 dark:text-sky-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  Institutional reviews are typically completed within <strong>24 to 48 campus operational hours</strong>. Once authorized, you will receive an approval confirmation and full dispatch access upon logging in.
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  id="pending-return-login-btn"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-md transition-all haptic-press text-center"
                >
                  Return to Sign In Portal
                </Link>
                {authUser && (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-center flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
                <Link
                  href="/"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
                >
                  Explore Public Platform
                </Link>
              </div>
            </div>
          )}

          {/* STATE B: REJECTED APPLICATION */}
          {status === 'rejected' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                  <XCircle className="w-8 h-8" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Review Complete
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Application Not Approved
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your application for <strong className="text-slate-900 dark:text-white">{applicant.role.replace('_', ' ')}</strong> could not be approved by the Campus Administrator based on the submitted credentials.
                </p>
              </div>

              {/* Rejection Reason Card */}
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 text-xs space-y-2">
                <div className="font-semibold text-rose-900 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>Administrator Explanation:</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-rose-200/60 dark:border-rose-900/40 italic">
                  "The provided trade certification number ({applicant.certificationNumber}) could not be validated against the active campus facilities vendor/personnel roster. Please attach your state journeyperson certification ID or contact Facilities Central Office to verify authorization."
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Reviewed by: Campus Administration • Ref ID: <code>APPR-REJ-2026-0419</code>
                </div>
              </div>

              {/* Reapplication Path */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">How to resolve:</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  You may submit a corrected application with updated certification numbers or department assignments, or register as a standard <strong>Requester</strong> without elevated permissions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/register?reapply=true"
                  id="reapply-btn"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all haptic-press flex items-center justify-center gap-2 text-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit Corrected Application</span>
                </Link>
                {authUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-center flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
                  >
                    Return to Login
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Development Prototype Switcher (Restricted to development/test environments only) */}
          {(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span className="font-semibold uppercase tracking-wider text-slate-500">
                  Development Preview States
                </span>
                <span>Toggle approval outcome</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-medium border transition-colors ${
                    status === 'pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-400'
                      : 'bg-slate-100/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  1. Pending Review State
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('rejected')}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-medium border transition-colors ${
                    status === 'rejected'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-400'
                      : 'bg-slate-100/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  2. Rejected with Reason & Reapplication
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Clear distinction: Prototype presentation state clearly identified. Restricted to development/test environments.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl w-full mx-auto text-center mt-6 text-xs text-slate-400 relative z-10">
        Institutional Campus Operations • Administrator Governance
      </footer>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading review state...</div>}>
      <PendingApprovalContent />
    </Suspense>
  );
}
