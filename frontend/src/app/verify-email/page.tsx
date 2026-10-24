'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { gql, useMutation } from '@apollo/client';
import {
  Mail,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Layers,
  ShieldAlert,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AccountStatus } from '@/lib/types';

const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      success
      message
      status
      user {
        id
        email
        firstName
        lastName
        name
        role
        status
        emailVerified
      }
    }
  }
`;

const RESEND_VERIFICATION_MUTATION = gql`
  mutation ResendVerificationEmail($input: ResendVerificationInput!) {
    resendVerificationEmail(input: $input) {
      success
      message
      emailDispatched
    }
  }
`;

type VerificationState = 'pending' | 'success' | 'expired' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';
  const roleParam = searchParams.get('role') || 'REQUESTER';
  const nameParam = searchParams.get('name') || 'Campus Member';
  const statusParam = (searchParams.get('status') as VerificationState) || 'pending';
  const dispatchedParam = searchParams.get('dispatched');

  const [activeState, setActiveState] = useState<VerificationState>(
    tokenParam ? 'pending' : statusParam
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(!!tokenParam);
  const [isDispatched, setIsDispatched] = useState<boolean>(dispatchedParam !== 'false');
  const [returnedStatus, setReturnedStatus] = useState<AccountStatus | null>(null);
  const [resolvedName, setResolvedName] = useState<string>(nameParam);
  const [resolvedEmail, setResolvedEmail] = useState<string>(emailParam || 'user@fixflow.edu');
  const [resolvedRole, setResolvedRole] = useState<string>(roleParam);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const [executeVerifyEmail] = useMutation(VERIFY_EMAIL_MUTATION);
  const [executeResendVerification] = useMutation(RESEND_VERIFICATION_MUTATION);

  // Automatic verification when token query parameter is present
  useEffect(() => {
    if (!tokenParam) return;

    let isMounted = true;
    setIsVerifying(true);
    setErrorMessage(null);

    // Call verifyEmail without printing or exposing token in logs
    executeVerifyEmail({
      variables: {
        input: { token: tokenParam.trim() },
      },
    })
      .then((res) => {
        if (!isMounted) return;
        setIsVerifying(false);

        const verifyResult = res.data?.verifyEmail;
        if (verifyResult) {
          setReturnedStatus(verifyResult.status);
          if (verifyResult.user) {
            if (verifyResult.user.name) setResolvedName(verifyResult.user.name);
            if (verifyResult.user.email) setResolvedEmail(verifyResult.user.email);
            if (verifyResult.user.role) setResolvedRole(verifyResult.user.role);
          }
          setActiveState('success');
        } else {
          setActiveState('error');
          setErrorMessage('Verification response was incomplete.');
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setIsVerifying(false);

        const msg = err?.message || '';
        if (msg.toLowerCase().includes('expired')) {
          setActiveState('expired');
          setErrorMessage(msg);
        } else if (msg.toLowerCase().includes('already been used')) {
          setActiveState('error');
          setErrorMessage(
            'This verification link has already been used. If your account is verified, please sign in or check your review status.'
          );
        } else {
          setActiveState('error');
          setErrorMessage(msg || 'Invalid or malformed verification link.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tokenParam, executeVerifyEmail]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendError(null);
    setResendMessage(null);

    const targetEmail = resolvedEmail.trim().toLowerCase();
    if (!targetEmail || targetEmail === 'user@fixflow.edu') {
      setResendError('A valid institutional email address is required to dispatch verification.');
      return;
    }

    try {
      const res = await executeResendVerification({
        variables: {
          input: { email: targetEmail },
        },
      });

      const resendData = res.data?.resendVerificationEmail;
      const msg =
        resendData?.message ||
        'If an unverified account exists for this email, a verification link has been dispatched.';

      if (resendData && resendData.emailDispatched === false) {
        setResendError(msg);
        setIsDispatched(false);
      } else {
        setResendCooldown(30);
        setResendSuccess(true);
        setResendMessage(msg);
        setIsDispatched(true);
        setResendError(null);
        setTimeout(() => setResendSuccess(false), 7000);
      }
    } catch (err: any) {
      setResendError(err?.message || 'Failed to resend verification email.');
      setIsDispatched(false);
    }
  };

  const isElevatedRole =
    returnedStatus === 'PENDING_APPROVAL' ||
    resolvedRole === 'TECHNICIAN' ||
    resolvedRole === 'FACILITY_MANAGER';

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
          {/* VERIFYING TOKEN SPINNER */}
          {isVerifying ? (
            <div className="space-y-6 text-center py-8">
              <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/80 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-inner">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Validating Institutional Verification Token
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Communicating with FixFlow authentication authority...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* STATE 1: PENDING EMAIL VERIFICATION */}
              {activeState === 'pending' && (
                <div className="space-y-6 text-center">
                  <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center mx-auto shadow-inner ${
                    isDispatched
                      ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-800/80 text-sky-600 dark:text-sky-400'
                      : 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/80 text-amber-600 dark:text-amber-400'
                  }`}>
                    {isDispatched ? <Mail className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                  </div>

                  <div className="space-y-2">
                    {isDispatched ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 text-[11px] font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        Verification Dispatched
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Delivery Pending • Mail Server Offline
                      </div>
                    )}
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Verify Your Institutional Email
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                      {isDispatched ? (
                        <>We have dispatched an activation link to your campus inbox at:</>
                      ) : (
                        <>Your account is registered, but FixFlow could not reach the campus email provider to deliver your activation link to:</>
                      )}
                    </p>
                    <div className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono font-semibold text-xs text-sky-600 dark:text-sky-400">
                      {resolvedEmail}
                    </div>
                  </div>

                  {!isDispatched && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs text-left space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>Email Delivery Was Not Accepted</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        The local mail testing service (Mailpit on port 8025/1025) was not reachable when the registration was submitted. Ensure the Mailpit container is running, then click <strong>Resend Verification Email</strong> below to dispatch your activation link.
                      </p>
                    </div>
                  )}

                  {resendSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{resendMessage || `A fresh verification link has been dispatched to ${resolvedEmail}.`}</span>
                    </div>
                  )}

                  {resendError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{resendError}</span>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Verification Instructions:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li>Open the local email inbox in Mailpit at <strong>http://localhost:8025</strong>.</li>
                      <li>Click the secure <strong>Verify Institutional Email</strong> link in the message.</li>
                      <li>Links expire in 24 hours for institutional security compliance.</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      id="resend-verification-btn"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all haptic-press disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend Verification Email'}
                      </span>
                    </button>
                    <Link
                      href="/login"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all haptic-press flex items-center justify-center gap-2"
                    >
                      <span>Return to Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
                      Thank you, <strong>{resolvedName}</strong>. Your campus email address (<strong>{resolvedEmail}</strong>) is officially authenticated.
                    </p>
                    {returnedStatus && (
                      <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                        Account Status: {returnedStatus}
                      </div>
                    )}
                  </div>

                  {/* Conditional next-step branch based on returned account status & role */}
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
                        Because you requested an elevated operations role (<strong>{resolvedRole.replace('_', ' ')}</strong>), an Institutional Administrator must review your trade qualifications or appointment justification before dashboard privileges can be granted.
                      </p>
                      <Link
                        href={`/pending-approval?email=${encodeURIComponent(resolvedEmail)}&role=${resolvedRole}&name=${encodeURIComponent(resolvedName)}`}
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
                      For your security, verification links expire 24 hours after issuance. {errorMessage || `The link sent to ${resolvedEmail} is no longer valid.`}
                    </p>
                  </div>

                  {resendSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{resendMessage || 'A fresh verification link has been dispatched.'}</span>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all haptic-press flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Request New Verification Link'}
                      </span>
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
                      {errorMessage ||
                        'The verification token could not be validated. It may have already been used, expired, or was formatted incorrectly.'}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all haptic-press flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend Verification Link'}
                      </span>
                    </button>
                    <Link
                      href="/register"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
                    >
                      Restart Enrollment
                    </Link>
                  </div>
                </div>
              )}

              {/* Development Preview States (Restricted to non-production environments) */}
              {(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-semibold uppercase tracking-wider text-slate-500">
                      State Inspection
                    </span>
                    <span>Preview visual states</span>
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
                      1. Pending
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
                      2. Verified
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
                      3. Expired
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
                      4. Error
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
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
