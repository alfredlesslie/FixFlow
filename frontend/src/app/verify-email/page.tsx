'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Layers,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

type VerificationState = 'pending' | 'success' | 'expired' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailParam = searchParams.get('email') || 'student.riya@fixflow.edu';
  const roleParam = searchParams.get('role') || 'REQUESTER';
  const nameParam = searchParams.get('name') || 'Campus Member';
  const statusParam = (searchParams.get('status') as VerificationState) || 'pending';

  const [activeState, setActiveState] = useState<VerificationState>(statusParam);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (['pending', 'success', 'expired', 'error'].includes(statusParam)) {
      setActiveState(statusParam);
    }
  }, [statusParam]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 5000);
  };

  const isElevatedRole = roleParam === 'TECHNICIAN' || roleParam === 'FACILITY_MANAGER';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-600/10 to-indigo-600/10 blur-3xl pointer-events-none rounded-full" />
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

      {/* Main Card */}
      <main className="max-w-2xl w-full mx-auto relative z-10 my-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6 transition-colors">
          {/* STATE 1: PENDING EMAIL VERIFICATION */}
          {activeState === 'pending' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/80 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-inner">
                <Mail className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 text-[11px] font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Verification Dispatched
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Verify Your Institutional Email
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  We have dispatched an activation link to your campus inbox at:
                </p>
                <div className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono font-semibold text-xs text-sky-600 dark:text-sky-400">
                  {emailParam}
                </div>
              </div>

              {resendSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>A fresh verification link has been dispatched to {emailParam}.</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Verification Instructions:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>Check your inbox and spam folders for an email from <strong>no-reply@fixflow.edu</strong>.</li>
                  <li>Click the secure link inside the email to authenticate institutional affiliation.</li>
                  <li>Links expire in 24 hours for institutional security compliance.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all haptic-press disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend Verification Email'}
                  </span>
                </button>

                {/* Simulate link click for demonstration */}
                <button
                  type="button"
                  onClick={() => setActiveState('success')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all haptic-press flex items-center justify-center gap-2"
                >
                  <span>Simulate Verified Link Click</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: SUCCESSFUL VERIFICATION */}
          {activeState === 'success' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Affiliation Confirmed
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Institutional Email Verified
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Thank you, <strong>{nameParam}</strong>. Your campus email address (<strong>{emailParam}</strong>) is officially authenticated.
                </p>
              </div>

              {/* Conditional next-step branch */}
              {!isElevatedRole ? (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-left space-y-3">
                  <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Requester Account Activated</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    You have full access to report infrastructure issues, browse building tickets, and upvote campus repairs. Sign in with your institutional credentials to get started.
                  </p>
                  <Link
                    href="/login"
                    id="verify-success-signin-btn"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md transition-all haptic-press"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-left space-y-3">
                  <div className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Next Stage: Administrator Approval Required</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    Because you requested an elevated operations role (<strong>{roleParam.replace('_', ' ')}</strong>), an Institutional Administrator must review your trade qualifications or appointment justification before dashboard privileges can be granted.
                  </p>
                  <Link
                    href={`/pending-approval?email=${encodeURIComponent(emailParam)}&role=${roleParam}&name=${encodeURIComponent(nameParam)}`}
                    id="verify-success-pending-btn"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-all haptic-press"
                  >
                    <span>View Application Review Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* STATE 3: EXPIRED TOKEN */}
          {activeState === 'expired' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Link Expired
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Verification Token Expired
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  For your security, verification links expire 24 hours after issuance. The link sent to <strong>{emailParam}</strong> is no longer valid.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleResend();
                    setActiveState('pending');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all haptic-press flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Request New Verification Link</span>
                </button>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* STATE 4: ERROR / INVALID TOKEN */}
          {activeState === 'error' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Verification Failed
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Invalid Verification Link
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  The verification token could not be validated. It may have already been used or was formatted incorrectly by your email client.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 text-left">
                Error Reference: <code>ERR_AUTH_TOKEN_MALFORMED</code> • Contact FixFlow Campus Support if this persists.
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all haptic-press text-center"
                >
                  Restart Enrollment
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

          {/* Development Prototype State Switcher */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-500">
                Development Preview States
              </span>
              <span>Test edge states</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveState('pending')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                  activeState === 'pending'
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-400'
                    : 'bg-slate-100/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                1. Pending Check
              </button>
              <button
                type="button"
                onClick={() => setActiveState('success')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                  activeState === 'success'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400'
                    : 'bg-slate-100/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                2. Verified Success
              </button>
              <button
                type="button"
                onClick={() => setActiveState('expired')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                  activeState === 'expired'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-400'
                    : 'bg-slate-100/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                3. Expired Token
              </button>
              <button
                type="button"
                onClick={() => setActiveState('error')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                  activeState === 'error'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-400'
                    : 'bg-slate-100/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                4. General Error
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Clear distinction: Email delivery backend not connected in Phase 5. Prototype presentation provides realistic state inspection.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl w-full mx-auto text-center mt-6 text-xs text-slate-400 relative z-10">
        Institutional Campus Security Protocol • Single Sign-On Ready
      </footer>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading verification portal...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
