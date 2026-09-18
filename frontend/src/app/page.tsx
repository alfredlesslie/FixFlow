'use client';

import React from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  Wrench,
  Building2,
  Users,
  ArrowRight,
  Clock,
  Radio,
} from 'lucide-react';

const HEALTH_CHECK_QUERY = gql`
  query HealthCheck {
    healthCheck {
      status
      service
      environment
      uptime
      timestamp
      database
    }
  }
`;

export default function HomePage() {
  const { data, loading, error, refetch } = useQuery(HEALTH_CHECK_QUERY, {
    pollInterval: 10000,
  });

  const health = data?.healthCheck;
  const isHealthy = health?.status === 'ok';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm font-bold text-xl">
              F
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-slate-900">FixFlow</span>
                <span className="text-xs bg-brand-100 text-brand-800 font-medium px-2 py-0.5 rounded-full">
                  v1.0-alpha
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Campus Maintenance & Asset Lifecycle Platform
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50">
              <span className="relative flex h-2 w-2">
                {loading ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                ) : isHealthy ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                ) : (
                  <span className="inline-flex h-full w-full rounded-full bg-rose-400"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    loading ? 'bg-amber-500' : isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                ></span>
              </span>
              <span className="font-medium text-slate-600">
                {loading ? 'Checking GraphQL...' : isHealthy ? 'GraphQL Connected' : 'Connecting to API...'}
              </span>
            </div>

            <a
              href="/login"
              id="login-nav-btn"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              Sign In
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {/* Hero Section */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full text-brand-700 text-xs font-semibold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>Campus Facilities & Infrastructure Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Centralized Maintenance & Asset Lifecycle Platform
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              FixFlow replaces scattered campus reporting with a unified institutional workflow: track
              critical assets, automate preventive maintenance, enforce deterministic SLAs, dispatch work
              orders to technicians, and maintain auditable repair records.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="/login"
                id="get-started-btn"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition shadow-sm"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="http://localhost:4000/graphql"
                target="_blank"
                rel="noreferrer"
                id="graphql-playground-btn"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition"
              >
                <Radio className="w-4 h-4 text-brand-600" />
                <span>GraphQL Playground</span>
              </a>
            </div>
          </div>
        </section>

        {/* Realtime API & Architecture Foundation Status Card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Foundation Health & Diagnostics</h2>
                <p className="text-xs text-slate-500">Live communication check between Next.js and NestJS GraphQL</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              id="refresh-health-btn"
              className="text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              Refresh Status
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* API Status */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start space-x-3">
              <div className="mt-0.5">
                {isHealthy ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">GraphQL Endpoint</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {loading ? 'Querying...' : isHealthy ? 'Active & Responding' : 'Degraded / Pending'}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql'}
                </div>
              </div>
            </div>

            {/* Service Environment */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start space-x-3">
              <div className="mt-0.5 text-brand-600">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Backend Service</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {health?.service || 'FixFlow NestJS Engine'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Env: <span className="font-semibold">{health?.environment || 'development'}</span>
                </div>
              </div>
            </div>

            {/* Database Status */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start space-x-3">
              <div className="mt-0.5 text-slate-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">PostgreSQL + Prisma</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
                  {health?.database || 'Ready for Connection'}
                </div>
                <div className="text-xs text-slate-500 mt-1">12 Core Relational Entities</div>
              </div>
            </div>

            {/* Uptime */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start space-x-3">
              <div className="mt-0.5 text-slate-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Server Uptime</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {health?.uptime !== undefined ? `${Math.floor(health.uptime)}s` : 'Standby'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Awaiting heartbeat'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Four Core Roles & Workflows */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Role-Based Operational Architecture</h2>
              <p className="text-sm text-slate-500">
                Discrete permission boundaries and customized interfaces across the institutional hierarchy
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Requester */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Requester</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students and faculty report asset breakdowns, specify locations, provide photo evidence, track
                  real-time progress, and verify work completion before closure.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                Lifecycle: Report &rarr; Track &rarr; Verify
              </div>
            </div>

            {/* Technician */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Technician</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Operational field workbench to accept assigned work orders, update work state to IN_PROGRESS,
                  log repair steps and parts used, and mark orders resolved.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                Lifecycle: Accept &rarr; Repair &rarr; Resolve
              </div>
            </div>

            {/* Facility Manager */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Facility Manager</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Oversees campus asset inventory, triages incoming requests, enforces deterministic SLAs (2h–72h),
                  schedules preventive maintenance, and tracks technician workload.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                Lifecycle: Triage &rarr; Dispatch &rarr; Schedule
              </div>
            </div>

            {/* Administrator */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Administrator</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full governance over users, roles, campus buildings/rooms, asset categories, system configurations,
                  and complete immutable audit logs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                Lifecycle: Provision &rarr; Configure &rarr; Audit
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-3 sm:space-y-0">
          <div>
            &copy; 2026 FixFlow — University Web Technologies Project. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <span>Next.js 14</span>
            <span>Apollo GraphQL</span>
            <span>NestJS</span>
            <span>Prisma</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
