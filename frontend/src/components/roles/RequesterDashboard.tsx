'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  ThumbsUp,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Inbox,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { useDataBridge } from '@/lib/use-data-bridge';
import { MaintenanceRequest } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CreateRequestModal } from '@/components/shared/CreateRequestModal';
import { IssueDetailModal } from '@/components/shared/IssueDetailModal';

export function RequesterDashboard() {
  const { requests, activeUser, upvoteRequest } = useDataBridge();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'my-reports' | 'my-upvotes' | 'critical'>('all');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  // Stats
  const myReports = requests.filter((r) => r.reportedById === activeUser.id);
  const myUpvoted = requests.filter((r) => r.upvoters.includes(activeUser.id));
  const resolvedCount = requests.filter((r) => r.status === 'VERIFIED' || r.status === 'CLOSED').length;
  const criticalCount = requests.filter((r) => r.priority === 'CRITICAL').length;

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    // Tab filter
    if (activeTab === 'my-reports' && r.reportedById !== activeUser.id) return false;
    if (activeTab === 'my-upvotes' && !r.upvoters.includes(activeUser.id)) return false;
    if (activeTab === 'critical' && r.priority !== 'CRITICAL') return false;

    // Category filter
    if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        r.requestNumber.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const categories = ['ALL', ...Array.from(new Set(requests.map((r) => r.category)))];

  return (
    <div className="space-y-6">
      {/* Hero Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-sky-900 to-indigo-950 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/10 text-sky-200 border border-white/10">
            Requester Portal
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-2">
            Welcome back, {activeUser.name}
          </h1>
          <p className="text-xs text-sky-200/80 mt-1 max-w-xl">
            Report facility issues across campus, monitor repair progress in real-time, or upvote existing notices to accelerate priority dispatch.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <Button
            id="report-issue-btn"
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4 text-white" />}
            onClick={() => setIsCreateOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold shadow-md shadow-sky-950/40 ring-1 ring-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-950"
          >
            Report an Issue
          </Button>
        </div>

        {/* Ambient subtle glow background */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer double-bezel-interactive ${
            activeTab === 'all'
              ? 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <p className="text-xs text-slate-500 font-medium">Campus Issues</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-data">
              {requests.length}
            </span>
            <span className="text-[11px] text-slate-400">Total Active</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('my-reports')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer double-bezel-interactive ${
            activeTab === 'my-reports'
              ? 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <p className="text-xs text-slate-500 font-medium">Reported by Me</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-data">
              {myReports.length}
            </span>
            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">My Tickets</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('my-upvotes')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer double-bezel-interactive ${
            activeTab === 'my-upvotes'
              ? 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <p className="text-xs text-slate-500 font-medium">Upvoted by Me</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-data">
              {myUpvoted.length}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Supported</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('critical')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer double-bezel-interactive ${
            activeTab === 'critical'
              ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <p className="text-xs text-slate-500 font-medium">Critical Emergencies</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-data">
              {criticalCount}
            </span>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-rose-500" /> Urgent
            </span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, location, room number, or REQ-id..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 pl-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors haptic-press ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Issue Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Showing {filteredRequests.length} Issues
          </p>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No matching issues found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or filter, or report a new campus issue.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setActiveTab('all');
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((req) => {
              const isUpvoted = req.upvoters.includes(activeUser.id);

              return (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all double-bezel-interactive flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Request ID, Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular-data text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          {req.requestNumber}
                        </span>
                        <Badge status={req.status} size="sm" />
                      </div>
                      <Badge priority={req.priority} size="sm" />
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => setSelectedRequest(req)}
                      className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors cursor-pointer line-clamp-2 leading-snug tracking-tight"
                    >
                      {req.title}
                    </h3>

                    {/* Description Excerpt */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {req.description}
                    </p>

                    {/* Location & Metadata */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{req.locationName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Category: <strong className="text-slate-600 dark:text-slate-300">{req.category}</strong></span>
                        <span>{new Date(req.reportedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Upvote & Inspect */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        upvoteRequest(req.id);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all haptic-press ${
                        isUpvoted
                          ? 'bg-sky-500 text-white shadow-sm ring-1 ring-sky-400'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-white stroke-white' : ''}`} />
                      <span>{isUpvoted ? 'Upvoted' : 'Upvote'}</span>
                      <span className="tabular-data font-bold">({req.upvotes})</span>
                    </button>

                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="text-xs font-medium text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1 transition-colors"
                    >
                      <span>View Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Issue Modal */}
      <CreateRequestModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSelectExistingIssue={(existingId) => {
          const found = requests.find((r) => r.id === existingId);
          if (found) setSelectedRequest(found);
        }}
      />

      {/* Inspect Issue Modal */}
      <IssueDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}
