'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getRoleRedirectPath } from '@/lib/role-routing';
import {
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Loader2,
  Wrench,
  Shield,
  HardHat,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('manager@fixflow.edu');
  const [password, setPassword] = useState('Manager@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in, redirect straight to their authorized portal
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getRoleRedirectPath(user.role));
    }
  }, [isAuthenticated, user, router]);

  const presets = [
    {
      role: 'Facility Manager',
      label: 'Manager',
      email: 'manager@fixflow.edu',
      pass: 'Manager@123',
      icon: <Wrench className="w-3.5 h-3.5 text-indigo-500" />,
      badge: 'Triage & Dispatch',
      border: 'hover:border-indigo-400 dark:hover:border-indigo-500',
    },
    {
      role: 'Technician',
      label: 'Technician',
      email: 'tech.rahul@fixflow.edu',
      pass: 'Tech@123',
      icon: <HardHat className="w-3.5 h-3.5 text-amber-500" />,
      badge: 'Workbench & Evidence',
      border: 'hover:border-amber-400 dark:hover:border-amber-500',
    },
    {
      role: 'Requester',
      label: 'Requester',
      email: 'student.riya@fixflow.edu',
      pass: 'Student@123',
      icon: <UserCheck className="w-3.5 h-3.5 text-sky-500" />,
      badge: 'Report & Upvote',
      border: 'hover:border-sky-400 dark:hover:border-sky-500',
    },
    {
      role: 'Administrator',
      label: 'Admin',
      email: 'admin@fixflow.edu',
      pass: 'Admin@123',
      icon: <Shield className="w-3.5 h-3.5 text-emerald-500" />,
      badge: 'Governance & Audits',
      border: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setEmail(p.email);
    setPassword(p.pass);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const authUser = await login(email, password);
      const targetPath = getRoleRedirectPath(authUser.role);
      router.push(targetPath);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify institutional credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-600/15 to-indigo-600/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Institutional Portal Access
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/25">
            F
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Fix<span className="text-sky-400">Flow</span>
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-slate-400">
          Campus Maintenance & Asset Lifecycle Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-3xl sm:px-9 space-y-6">
          {errorMsg && (
            <div
              id="login-error-alert"
              className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="user@fixflow.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="password-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              id="submit-login-btn"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-sky-600/20 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900 transition-all haptic-press disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Station</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Presets for Demonstration */}
          <div className="pt-5 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Institutional Accounts
              </span>
              <span className="text-[10px] text-slate-500">Tap to populate</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => {
                const isSelected = email === p.email;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`text-left p-2.5 rounded-xl border transition-all haptic-press ${
                      isSelected
                        ? 'bg-slate-800 border-sky-500/80 shadow-sm'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-300 ' + p.border
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      {p.icon}
                      <span>{p.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.email}</div>
                    <div className="text-[9px] text-slate-500 mt-1">{p.badge}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Protected by institutional role-based access control (RBAC).
          </p>
        </div>
      </div>
    </div>
  );
}
