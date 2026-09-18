'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('manager@fixflow.edu');
  const [password, setPassword] = useState('Manager@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presets = [
    {
      role: 'Facility Manager',
      email: 'manager@fixflow.edu',
      pass: 'Manager@123',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
    },
    {
      role: 'Technician',
      email: 'tech.rahul@fixflow.edu',
      pass: 'Tech@123',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    },
    {
      role: 'Requester (Student)',
      email: 'student.riya@fixflow.edu',
      pass: 'Student@123',
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    },
    {
      role: 'Administrator',
      email: 'admin@fixflow.edu',
      pass: 'Admin@123',
      color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
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
      await login(email, password);
      router.push('/assets');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-xl bg-brand-600 items-center justify-center text-white font-black text-2xl shadow-sm">
          F
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign In to FixFlow
        </h1>
        <p className="text-sm text-slate-500">
          Campus Maintenance & Asset Lifecycle Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                  placeholder="name@fixflow.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="password-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              id="submit-login-btn"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Presets for Demonstration */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Demo Quick-Fill by Role:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`text-xs p-2 rounded-lg border text-left font-medium transition ${p.color}`}
                >
                  <div className="font-bold">{p.role}</div>
                  <div className="text-[10px] opacity-75 truncate">{p.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 transition font-medium inline-flex items-center space-x-1"
          >
            <span>&larr; Return to FixFlow Overview</span>
          </a>
        </div>
      </div>
    </div>
  );
}
