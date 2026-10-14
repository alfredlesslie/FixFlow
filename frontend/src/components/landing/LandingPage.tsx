'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Wrench,
  SlidersHorizontal,
  ChevronRight,
  Building2,
  Camera,
  FileCheck2,
  Sparkles,
  TrendingUp,
  Inbox,
  ThumbsUp,
  ChevronDown,
  Eye,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getRoleRedirectPath } from '@/lib/role-routing';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeRoleTab, setActiveRoleTab] = useState<'requester' | 'technician' | 'manager' | 'admin'>('manager');
  const [activePreviewMode, setActivePreviewMode] = useState<'triage' | 'evidence' | 'upvote'>('triage');

  const roleRedirectUrl = user ? getRoleRedirectPath(user.role) : '/login';

  return (
    <div className="min-h-[100dvh] bg-[#06090e] text-slate-100 selection:bg-sky-500 selection:text-white flex flex-col font-sans">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[380px] bg-sky-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] -left-32 w-[520px] h-[380px] bg-blue-600/5 blur-[150px] rounded-full" />
        <div className="absolute top-[70%] -right-32 w-[520px] h-[380px] bg-indigo-600/5 blur-[150px] rounded-full" />
      </div>

      {/* 1. Header / Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#06090e]/85 border-b border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform duration-150">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                FixFlow
                <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/80">
                  Campus Ops
                </span>
              </span>
              <span className="text-[11px] text-slate-400">Lifecycle & Maintenance</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#problems" className="hover:text-white transition-colors">
              Challenges
            </a>
            <a href="#solution" className="hover:text-white transition-colors">
              Solution
            </a>
            <a href="#roles" className="hover:text-white transition-colors">
              Operations Roles
            </a>
            <a href="#lifecycle" className="hover:text-white transition-colors">
              Maintenance Lifecycle
            </a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <Link href={roleRedirectUrl}>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-md shadow-sky-900/30 ring-1 ring-white/20"
                  trailingIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Enter Station ({user.role.replace('_', ' ')})
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  id="landing-signin-btn"
                  size="sm"
                  variant="primary"
                  className="bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-md shadow-sky-900/30 ring-1 ring-white/20"
                  trailingIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1">
        {/* 2. Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
              {/* Eyebrow Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-800/70 text-[11px] font-semibold uppercase tracking-wider text-sky-400 mb-6 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Campus Infrastructure & Maintenance Intelligence</span>
              </div>

              {/* Display Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
                From Broken to Resolved,{' '}
                <span className="bg-gradient-to-r from-sky-400 via-blue-300 to-sky-200 bg-clip-text text-transparent">
                  Visible Across Campus.
                </span>
              </h1>

              {/* Subtext */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-[62ch]">
                A unified operational platform connecting students, field specialists, facility managers, and administrators. Eliminate duplicate reports, prioritize urgent repairs with live scoring, and inspect verified evidence before closure.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
                {isAuthenticated && user ? (
                  <Link href={roleRedirectUrl} className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-lg shadow-sky-950/50 ring-1 ring-white/25 px-6 py-3"
                      trailingIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Open My Station ({user.role.replace('_', ' ')})
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button
                      id="hero-signin-btn"
                      size="lg"
                      className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-lg shadow-sky-950/50 ring-1 ring-white/25 px-6 py-3"
                      trailingIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Access Station / Sign In
                    </Button>
                  </Link>
                )}

                <a href="#lifecycle" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 hover:text-white px-6 py-3"
                  >
                    Explore Resolution Lifecycle
                  </Button>
                </a>
              </div>
            </div>

            {/* Interactive Telemetry / Preview Card */}
            <div className="mt-14 max-w-4xl mx-auto">
              <div className="p-1.5 sm:p-2 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 shadow-2xl shadow-black/80">
                <div className="rounded-xl bg-slate-900/90 border border-white/10 p-5 sm:p-6 backdrop-blur-md">
                  {/* Top Bar of Preview */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/10 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider tabular-data">
                        LIVE TELEMETRY • REQ-2026-0103
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/80">
                        Priority Score: 92/100
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10 self-start sm:self-auto">
                      <button
                        onClick={() => setActivePreviewMode('triage')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                          activePreviewMode === 'triage'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Triage Command
                      </button>
                      <button
                        onClick={() => setActivePreviewMode('evidence')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                          activePreviewMode === 'evidence'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Field Evidence
                      </button>
                      <button
                        onClick={() => setActivePreviewMode('upvote')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                          activePreviewMode === 'upvote'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Upvote Validation
                      </button>
                    </div>
                  </div>

                  {/* Body of Preview Card */}
                  {activePreviewMode === 'triage' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                      <div className="md:col-span-2 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Turing Hall — Lecture Hall 402 • Asset: PRJ-T402</span>
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          Overheating ceiling projector with grinding fan noise
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Laser projector shuts down with thermal overload indicator after 15 minutes of lecture projection. Community upvotes confirmed across 3 academic sections.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/80 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-sky-400" /> 3 Duplicates Merged
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400" /> SLA: 4h Resolution Window
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2.5 text-xs">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Dispatch State</span>
                          <span className="text-sky-400 font-semibold">Assigned</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Lead Specialist</span>
                          <span className="text-slate-200">Rahul Sharma (HVAC/AV)</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Required Parts</span>
                          <span className="text-slate-200">Exhaust Fan Unit (FAN-402)</span>
                        </div>
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-slate-300 font-medium">
                          <span>Verification Gate</span>
                          <span className="text-amber-400 flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Photo Required
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewMode === 'evidence' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-slate-400 font-medium">Pre-Repair Defect Photo</span>
                          <span className="text-[10px] text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80">Issue Submitted</span>
                        </div>
                        <div className="h-28 rounded-lg bg-slate-800/80 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
                          <Camera className="w-5 h-5 text-slate-500" />
                          <span>Thermal shutdown indicator & seized bearing</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-slate-400 font-medium">Post-Repair Resolution Proof</span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">Verified & Logged</span>
                        </div>
                        <div className="h-28 rounded-lg bg-emerald-950/20 border border-emerald-800/60 flex flex-col items-center justify-center text-emerald-300 text-xs gap-1.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>Replacement fan installed • Full 60m test pass</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewMode === 'upvote' && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] uppercase font-bold text-sky-400 tracking-wider">Duplicate Prevention Engine</span>
                        <h4 className="text-sm font-semibold text-white mt-0.5">
                          "Similar issue already reported at Lecture Hall 402"
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-lg">
                          Instead of generating a 4th redundant work order, the requester upvoted the existing ticket. This boosted priority score by +15 and notified the facility manager immediately.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="px-3.5 py-2 rounded-xl bg-sky-950/80 border border-sky-800/80 flex items-center gap-2 text-sky-300 text-xs font-semibold">
                          <ThumbsUp className="w-4 h-4 text-sky-400" />
                          <span>6 Community Upvotes</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. The Problem vs. The Solution Section */}
        <section id="problems" className="py-20 md:py-28 border-t border-white/10 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Campus Maintenance Challenges</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
                Why Campus Issue Resolution Breaks Down
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-3">
                Universities manage thousands of facilities, classrooms, and assets. Without a unified system, everyday operational friction compounds into multi-week delays.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="solution">
              {/* Problem Column */}
              <div className="p-1.5 rounded-2xl bg-rose-950/20 border border-rose-900/40">
                <div className="p-6 rounded-xl bg-[#090d14] border border-rose-950/60 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-4">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>The Traditional Friction</span>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                        <h4 className="text-sm font-semibold text-slate-200">Scattered & Lost Channels</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Reports sent via random emails, front-desk sticky notes, or hallway mentions vanish with zero accountability or ticket tracking.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                        <h4 className="text-sm font-semibold text-slate-200">Duplicate Submission Avalanches</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          When an elevator or projector stalls, 20 different individuals file identical tickets, clogging administrative queues and wasting triage hours.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                        <h4 className="text-sm font-semibold text-slate-200">Subjective & Blind Prioritization</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Urgent safety hazards often wait behind minor aesthetic requests simply because there is no automated scoring or impact analysis.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                        <h4 className="text-sm font-semibold text-slate-200">Zero Visibility & Ghost Closures</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Tickets get marked "closed" without photographic evidence, leaving students and faculty wondering whether the item was ever inspected.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solution Column */}
              <div className="p-1.5 rounded-2xl bg-sky-950/30 border border-sky-800/40">
                <div className="p-6 rounded-xl bg-[#090d14] border border-sky-950/60 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-4">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      <span>The FixFlow Operating Standard</span>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                        <h4 className="text-sm font-semibold text-white">Centralized Campus Hub</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          A single authoritative platform tied directly to buildings, rooms, and registered equipment serial numbers.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                        <h4 className="text-sm font-semibold text-white">Proactive Duplicate Deduplication & Upvotes</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          In-flight duplicate detection immediately alerts users to existing issues, turning redundant submissions into priority-boosting community votes.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                        <h4 className="text-sm font-semibold text-white">Dynamic AI Priority Engine</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Objective scoring (0–100) dynamically balances safety hazards, location occupancy, and vote counts to dispatch the right jobs first.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                        <h4 className="text-sm font-semibold text-white">Mandatory Photographic Sign-Off</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Field technicians must attach photographic evidence and parts usage logs before facility managers can grant final resolution approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. The Four Campus Operations Roles Section */}
        <section id="roles" className="py-20 md:py-28 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Institutional Personas</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
                Four Dedicated Roles, One Unified Pipeline
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-3">
                Tailored operational environments engineered for every stakeholder across the campus maintenance lifecycle.
              </p>
            </div>

            {/* Role Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 max-w-3xl mb-10">
              <button
                onClick={() => setActiveRoleTab('requester')}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeRoleTab === 'requester'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40 ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Requester</span>
              </button>

              <button
                onClick={() => setActiveRoleTab('technician')}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeRoleTab === 'technician'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40 ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Technician</span>
              </button>

              <button
                onClick={() => setActiveRoleTab('manager')}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeRoleTab === 'manager'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40 ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Facility Manager</span>
              </button>

              <button
                onClick={() => setActiveRoleTab('admin')}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeRoleTab === 'admin'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40 ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Administrator</span>
              </button>
            </div>

            {/* Active Role Content Card */}
            <div className="p-1.5 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 shadow-xl">
              <div className="p-6 sm:p-8 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-md">
                {activeRoleTab === 'requester' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/80 text-xs font-semibold">
                        Students, Faculty & Campus Staff
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        Requester Portal — Report, Upvote, and Track
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                        Designed for fast, friction-free reporting from any smartphone or laptop. Students and staff can report broken infrastructure, view issues already reported in their building, upvote defects to amplify priority, and receive notifications when work is completed.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>30-second reporting with asset and location tags</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Automatic duplicate detection prevents wasted tickets</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Community upvoting validates urgency in real-time</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Live status timeline from dispatch to verified repair</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Primary Responsibilities</span>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <strong className="text-white block">Capture Defect</strong>
                          <span className="text-slate-400">Upload photos and specify exact classroom or asset tag.</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <strong className="text-white block">Community Upvoting</strong>
                          <span className="text-slate-400">Endorse existing issues rather than filing duplicates.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRoleTab === 'technician' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/80 text-xs font-semibold">
                        Field Engineers & Maintenance Specialists
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        Technician Workbench — Execution & Photographic Evidence
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                        A focused, high-density workbench built for the field. Technicians access assigned work orders organized by building, view equipment technical specs, log replacement components and labor hours, and upload mandatory photo verification.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Clear list of assigned jobs with building routing</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Integrated parts and inventory logging per order</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Mandatory post-repair photographic proof gate</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Single-tap status progression from In Progress to Review</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Primary Responsibilities</span>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <strong className="text-white block">Field Diagnostics & Repair</strong>
                          <span className="text-slate-400">Resolve hardware, electrical, and structural campus defects.</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <strong className="text-white block">Photographic Verification</strong>
                          <span className="text-slate-400">Document completed work with high-resolution proof.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRoleTab === 'manager' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/80 text-xs font-semibold">
                        Operations & Triage Command
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        Facility Manager Center — Triage, Dispatch & SLA Monitor
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                        The operational heart of campus maintenance. Facility managers triage inbound reports with algorithmic urgency scoring, merge duplicates into single work orders, dispatch field specialists, and review repair photos in the Verification Studio before sign-off.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>AI-assisted priority scoring (0–100 scale)</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>1-click duplicate detection and issue merging</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Technician assignment with live workload visibility</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Verification Studio for final repair inspection</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Primary Responsibilities</span>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <strong className="text-white block">Triage & Queue Management</strong>
                          <span className="text-slate-400">Filter, prioritize, and dispatch tickets within SLA targets.</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <strong className="text-white block">Quality Assurance Sign-Off</strong>
                          <span className="text-slate-400">Validate technician photo evidence before closing tickets.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRoleTab === 'admin' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/80 text-xs font-semibold">
                        Campus Governance & Audits
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        Administrator Console — Governance, Audits & Lifecycle
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                        High-level oversight across all campus infrastructure. Administrators manage institutional user roles, audit SLA compliance and MTTR (Mean Time to Repair), inspect full maintenance histories, and oversee the campus asset registry.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Campus-wide MTTR and SLA performance analytics</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Granular Role-Based Access Control (RBAC) governance</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Immutable audit logs for compliance inspections</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Campus asset registry and lifecycle maintenance records</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Primary Responsibilities</span>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <strong className="text-white block">System Governance</strong>
                          <span className="text-slate-400">Enforce institutional security and role boundaries.</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <strong className="text-white block">Audit & Capital Planning</strong>
                          <span className="text-slate-400">Evaluate equipment replacement cycles and MTTR trends.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 5. The Maintenance Lifecycle Section */}
        <section id="lifecycle" className="py-20 md:py-28 border-t border-white/10 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14 text-center mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">End-to-End Workflow</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
                The FixFlow Maintenance Lifecycle
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-3">
                A rigorous, four-phase sequence ensuring every campus defect is caught, deduplicated, fixed, and verified.
              </p>
            </div>

            {/* 4 Steps in Flow */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Step 1 */}
              <div className="p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between">
                <div className="p-5 rounded-xl bg-[#090d14] h-full flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-800/80 text-sky-400 flex items-center justify-center font-bold text-sm mb-4">
                      01
                    </div>
                    <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">Phase 1</span>
                    <h3 className="text-base font-bold text-white mt-1 mb-2">Capture & Deduplicate</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Issue submitted with photo and location. Intelligent duplicate detection identifies similar reports, prompting requesters to upvote existing tickets instead of creating clutter.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-500 font-medium">
                    Owner: Requester & Detection Engine
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between">
                <div className="p-5 rounded-xl bg-[#090d14] h-full flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/80 text-blue-400 flex items-center justify-center font-bold text-sm mb-4">
                      02
                    </div>
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">Phase 2</span>
                    <h3 className="text-base font-bold text-white mt-1 mb-2">Triage & Dynamic Priority</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Automated scoring (0–100) evaluates safety risks, room occupancy, and community votes. Facility managers review the queue and dispatch work orders with active SLA timers.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-500 font-medium">
                    Owner: Facility Manager & AI Scoring
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between">
                <div className="p-5 rounded-xl bg-[#090d14] h-full flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
                      03
                    </div>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">Phase 3</span>
                    <h3 className="text-base font-bold text-white mt-1 mb-2">Field Repair & Parts</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Assigned technician accepts the order on their workbench, accesses equipment manuals, logs replacement components, and carries out the physical maintenance.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-500 font-medium">
                    Owner: Field Engineering Specialist
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between">
                <div className="p-5 rounded-xl bg-[#090d14] h-full flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                      04
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Phase 4</span>
                    <h3 className="text-base font-bold text-white mt-1 mb-2">Verified Proof & Sign-Off</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Technician uploads photographic evidence of completed repair. Facility manager verifies proof in the Verification Studio before final closure and notifies all original upvoters.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-500 font-medium">
                    Owner: Facility Manager & Requester
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Prominent Sign In CTA Section */}
        <section className="py-20 border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-1.5 sm:p-2 rounded-3xl bg-gradient-to-b from-sky-500/20 via-blue-500/10 to-transparent border border-white/10 shadow-2xl">
              <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-8 sm:p-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white mb-6 shadow-lg shadow-sky-500/30">
                  <Layers className="w-6 h-6" />
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                  Streamline Your Campus Infrastructure Today
                </h2>

                <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8">
                  Sign in with your institutional credentials to access your designated role portal, report maintenance issues, or manage campus work orders.
                </p>

                {isAuthenticated && user ? (
                  <Link href={roleRedirectUrl}>
                    <Button
                      size="lg"
                      className="bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-lg shadow-sky-950/50 ring-1 ring-white/25 px-8 py-3 text-base"
                      trailingIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Enter Station ({user.role.replace('_', ' ')})
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button
                      id="cta-signin-btn"
                      size="lg"
                      className="bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-lg shadow-sky-950/50 ring-1 ring-white/25 px-8 py-3 text-base"
                      trailingIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Sign In to Station
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Institutional Footer */}
      <footer className="border-t border-white/10 bg-[#04060a] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-sky-600/30 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">FixFlow</span>
              <p className="text-[11px] text-slate-500">Campus Operations & Maintenance Intelligence Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <a href="#problems" className="hover:text-white transition-colors">Challenges</a>
            <a href="#solution" className="hover:text-white transition-colors">Solution</a>
            <a href="#roles" className="hover:text-white transition-colors">Roles</a>
            <a href="#lifecycle" className="hover:text-white transition-colors">Lifecycle</a>
            <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium">Sign In</Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>SLA Target: 95%</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-500">RBAC Protected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
