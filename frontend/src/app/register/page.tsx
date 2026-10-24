'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ArrowLeft, ShieldCheck } from 'lucide-react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-sky-600/10 to-indigo-600/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top Header Navigation */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between z-10 mb-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-150">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            FixFlow
            <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Campus Ops
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="outline" />
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </header>

      {/* Main Registration Content */}
      <main className="max-w-4xl w-full mx-auto relative z-10 flex-1 flex items-center justify-center">
        <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading enrollment station...</div>}>
          <RegisterForm />
        </React.Suspense>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center mt-8 z-10 text-xs text-slate-500 dark:text-slate-400">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Institutional identity verification and role-based privilege governance active.</span>
        </p>
      </footer>
    </div>
  );
}
