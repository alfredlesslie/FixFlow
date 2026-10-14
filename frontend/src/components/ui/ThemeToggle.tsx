'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  variant?: 'ghost' | 'pill' | 'outline';
  showLabel?: boolean;
}

export function ThemeToggle({
  className = '',
  variant = 'ghost',
  showLabel = false,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const baseStyles =
    'relative inline-flex items-center justify-center transition-all duration-200 select-none haptic-press focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl';

  const variantStyles = {
    ghost:
      'p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80',
    outline:
      'p-2 border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 shadow-sm',
    pill:
      'px-3 py-1.5 gap-2 border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700',
  }[variant];

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={toggleTheme}
      className={`${baseStyles} ${variantStyles} ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {mounted ? (
          isDark ? (
            <Sun className="w-4 h-4 text-amber-400 rotate-0 scale-100 transition-all duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-sky-600 rotate-0 scale-100 transition-all duration-300" />
          )
        ) : (
          <div className="w-4 h-4 rounded-full bg-slate-400/20 animate-pulse" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-medium">
          {mounted ? (isDark ? 'Light' : 'Dark') : 'Theme'}
        </span>
      )}
    </button>
  );
}
