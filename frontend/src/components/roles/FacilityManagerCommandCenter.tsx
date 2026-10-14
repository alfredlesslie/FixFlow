'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  HardHat,
  GitMerge,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Eye,
  Check,
  X,
  FileCheck2,
  TrendingUp,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useDataBridge } from '@/lib/use-data-bridge';
import { MaintenanceRequest, WorkOrder, PriorityLevel } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { IssueDetailModal } from '@/components/shared/IssueDetailModal';

export function FacilityManagerCommandCenter() {
  const {
    requests,
    workOrders,
    users,
    analytics,
    activeUser,
    overridePriority,
    createWorkOrder,
    verifyWorkOrder,
    mergeDuplicates,
  } = useDataBridge();

  const [activeTab, setActiveTab] = useState<'triage' | 'verification' | 'work_orders'>('triage');

  // Modal dialog states
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [priorityModalRequest, setPriorityModalRequest] = useState<MaintenanceRequest | null>(null);
  const [overrideLevel, setOverrideLevel] = useState<PriorityLevel>('CRITICAL');
  const [overrideReason, setOverrideReason] = useState('');

  // Dispatch Modal
  const [dispatchRequest, setDispatchRequest] = useState<MaintenanceRequest | null>(null);
  const [dispatchTechId, setDispatchTechId] = useState('');
  const [dispatchSlaHours, setDispatchSlaHours] = useState(4);

  // Verification Modal
  const [verificationOrder, setVerificationOrder] = useState<WorkOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Duplicate Merge Modal
  const [mergePrimaryRequest, setMergePrimaryRequest] = useState<MaintenanceRequest | null>(null);
  const [selectedDupIds, setSelectedDupIds] = useState<string[]>([]);

  const technicians = users.filter((u) => u.role === 'TECHNICIAN' && u.active);

  // Filter queues
  const triageQueue = requests.filter(
    (r) => r.status === 'OPEN' || r.status === 'TRIAGED' || r.status === 'REOPENED'
  );

  const verificationQueue = workOrders.filter(
    (w) => w.status === 'COMPLETED' && w.verificationStatus === 'PENDING'
  );

  // Priority override submit
  const handleSavePriorityOverride = () => {
    if (!priorityModalRequest || !overrideReason.trim()) return;
    overridePriority(priorityModalRequest.id, overrideLevel, overrideReason.trim());
    setPriorityModalRequest(null);
    setOverrideReason('');
  };

  // Dispatch submit
  const handleSaveDispatch = () => {
    if (!dispatchRequest || !dispatchTechId) return;
    createWorkOrder({
      requestId: dispatchRequest.id,
      technicianId: dispatchTechId,
      slaHours: dispatchSlaHours,
    });
    setDispatchRequest(null);
    setDispatchTechId('');
  };

  // Verification submit
  const handleVerify = (approved: boolean) => {
    if (!verificationOrder) return;
    if (!approved && !rejectionReason.trim()) return;

    verifyWorkOrder(verificationOrder.id, approved, rejectionReason.trim());
    setVerificationOrder(null);
    setRejectionReason('');
    setShowRejectForm(false);
  };

  // Merge submit
  const handleExecuteMerge = () => {
    if (!mergePrimaryRequest || selectedDupIds.length === 0) return;
    mergeDuplicates(mergePrimaryRequest.id, selectedDupIds);
    setMergePrimaryRequest(null);
    setSelectedDupIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/10 text-sky-200 border border-white/10">
            Facility Manager Command Center
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-2">
            Operations & Triage Command
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Director of Operations: <strong className="text-white">{activeUser.name}</strong> • Active Triage Engine & SLA Monitor
          </p>
        </div>

        {/* Real SLA Rate Pill */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
            <span className="text-xl font-bold tabular-data text-emerald-400">
              {analytics.slaComplianceRate}%
            </span>
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">SLA Met</span>
          </div>
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
            <span className="text-xl font-bold tabular-data text-sky-300">
              {analytics.mttrHours}h
            </span>
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">Mean MTTR</span>
          </div>
        </div>
      </div>

      {/* Operational Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('triage')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer double-bezel-interactive ${
            activeTab === 'triage'
              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Triage Queue</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-data">
              {triageQueue.length}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Needs Dispatch</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('verification')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer double-bezel-interactive ${
            activeTab === 'verification'
              ? 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Repairs for Review</span>
            <FileCheck2 className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-data">
              {verificationQueue.length}
            </span>
            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">Pending Sign-off</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('work_orders')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer double-bezel-interactive ${
            activeTab === 'work_orders'
              ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Active Work Orders</span>
            <HardHat className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-data">
              {workOrders.filter((w) => w.status !== 'COMPLETED').length}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Field Operations</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Critical / High Severity</span>
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-data">
              {analytics.criticalOrHigh}
            </span>
            <span className="text-[11px] text-rose-600 font-semibold">Priority 1 & 2</span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('triage')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'triage'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Triage & Dispatch Queue ({triageQueue.length})
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'verification'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Verification Studio</span>
          {verificationQueue.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-sky-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('work_orders')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'work_orders'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Work Orders ({workOrders.length})
        </button>
      </div>

      {/* TAB 1: TRIAGE & DISPATCH QUEUE */}
      {activeTab === 'triage' && (
        <div className="space-y-4">
          {triageQueue.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              Triage queue clear. All active reports dispatched.
            </div>
          ) : (
            triageQueue.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all double-bezel-interactive flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="tabular-data text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {req.requestNumber}
                    </span>
                    <Badge status={req.status} size="sm" />
                    <Badge priority={req.priority} size="sm" />
                    <span className="tabular-data text-xs font-semibold text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Score: {req.priorityFactors.calculatedScore}/100
                    </span>
                    {req.priorityFactors.isOverridden && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        FM Overridden
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => setSelectedRequest(req)}
                    className="text-base font-bold text-slate-900 dark:text-white hover:text-sky-600 cursor-pointer"
                  >
                    {req.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {req.locationName}
                    </span>
                    <span>•</span>
                    <span>Reported by: {req.reportedByName}</span>
                    <span>•</span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      {req.upvotes} Community Votes
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {req.description}
                  </p>
                </div>

                {/* FM Action Buttons */}
                <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setDispatchRequest(req);
                      if (technicians.length > 0) setDispatchTechId(technicians[0].id);
                    }}
                    icon={<HardHat className="w-3.5 h-3.5" />}
                  >
                    Dispatch Work Order
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPriorityModalRequest(req);
                        setOverrideLevel(req.priority);
                      }}
                      icon={<Sliders className="w-3.5 h-3.5" />}
                    >
                      Override Score
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setMergePrimaryRequest(req);
                      }}
                      icon={<GitMerge className="w-3.5 h-3.5" />}
                    >
                      Merge Duplicates
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: VERIFICATION STUDIO */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          {verificationQueue.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No completed work orders awaiting verification.
            </div>
          ) : (
            verificationQueue.map((wo) => (
              <div
                key={wo.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm double-bezel-interactive space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                      {wo.orderNumber}
                    </span>
                    <Badge status={wo.status} size="sm" />
                    <span className="text-xs text-slate-500">
                      Completed by <strong className="text-slate-800 dark:text-slate-200">{wo.assignedToName}</strong>
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Completed at: {wo.completedAt ? new Date(wo.completedAt).toLocaleString() : 'Just now'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {wo.requestTitle}
                </h3>

                {/* Evidence Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Before Repair
                    </h4>
                    {wo.beforeImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {wo.beforeImages.map((img, i) => (
                          <div key={i} className="h-32 rounded-lg overflow-hidden border border-slate-200">
                            <img src={img} alt="Before" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center text-xs text-slate-400 border border-dashed rounded-lg">
                        No before photo
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                      After Repair (Submitted Evidence)
                    </h4>
                    {wo.afterImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {wo.afterImages.map((img, i) => (
                          <div key={i} className="h-32 rounded-lg overflow-hidden border border-emerald-300">
                            <img src={img} alt="After" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center text-xs text-slate-400 border border-dashed rounded-lg">
                        No completion photo submitted
                      </div>
                    )}
                  </div>
                </div>

                {/* Tech Diagnosis and Notes */}
                <div className="text-xs space-y-1 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {wo.diagnosis && (
                    <p>
                      <strong>Diagnosis:</strong> {wo.diagnosis}
                    </p>
                  )}
                  {wo.repairNotes && (
                    <p>
                      <strong>Corrective Action:</strong> {wo.repairNotes}
                    </p>
                  )}
                  {wo.partsUsed.length > 0 && (
                    <p className="text-slate-500">
                      <strong>Parts Used:</strong>{' '}
                      {wo.partsUsed.map((p) => `${p.name} (x${p.quantity})`).join(', ')}
                    </p>
                  )}
                </div>

                {/* Verification CTA Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setVerificationOrder(wo);
                      setShowRejectForm(true);
                    }}
                    icon={<X className="w-3.5 h-3.5" />}
                  >
                    Reject / Return for Rework
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => {
                      setVerificationOrder(wo);
                      handleVerify(true);
                    }}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Verify & Close Case
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ALL WORK ORDERS */}
      {activeTab === 'work_orders' && (
        <div className="space-y-3">
          {workOrders.map((wo) => (
            <div
              key={wo.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{wo.orderNumber}</span>
                  <Badge status={wo.status} size="sm" />
                  <Badge priority={wo.priority} size="sm" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  {wo.requestTitle}
                </p>
                <p className="text-slate-500">
                  Assigned to: {wo.assignedToName} • {wo.locationName}
                </p>
              </div>

              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">SLA Target</span>
                <span className="tabular-data font-semibold">
                  {new Date(wo.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Priority Override */}
      {priorityModalRequest && (
        <Modal
          isOpen={!!priorityModalRequest}
          onClose={() => setPriorityModalRequest(null)}
          title="Dynamic Priority Triage & Override"
          subtitle={`Ticket: ${priorityModalRequest.requestNumber} • ${priorityModalRequest.title}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Calculated Composite Score:</span>
                <span className="font-bold tabular-data text-sm">
                  {priorityModalRequest.priorityFactors.calculatedScore}/100
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-500 text-[11px]">
                <span>Severity Weight: {priorityModalRequest.priorityFactors.initialSeverity}/10</span>
                <span>Asset Criticality: {priorityModalRequest.priorityFactors.assetCriticality}/10</span>
                <span>Community Votes: +{priorityModalRequest.priorityFactors.upvoteMultiplier} pts</span>
                <span>Age Unresolved: +{priorityModalRequest.priorityFactors.unresolvedHoursWeight} pts</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Manual Override Target Priority
              </label>
              <select
                value={overrideLevel}
                onChange={(e) => setOverrideLevel(e.target.value as PriorityLevel)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <option value="CRITICAL">CRITICAL (Immediate safety or major operational risk)</option>
                <option value="HIGH">HIGH (Urgent; significant disruption)</option>
                <option value="MEDIUM">MEDIUM (Standard scheduling queue)</option>
                <option value="LOW">LOW (Cosmetic or deferred maintenance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Audit Reason for Override <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Document operational justification (e.g. VIP event in hall, impending rain forecast, lab experiment dependency)..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setPriorityModalRequest(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!overrideReason.trim()}
                onClick={handleSavePriorityOverride}
              >
                Confirm Override
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Dispatch Work Order */}
      {dispatchRequest && (
        <Modal
          isOpen={!!dispatchRequest}
          onClose={() => setDispatchRequest(null)}
          title="Dispatch Work Order"
          subtitle={`Assigning: ${dispatchRequest.requestNumber} • ${dispatchRequest.title}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Technician
              </label>
              <select
                value={dispatchTechId}
                onChange={(e) => setDispatchTechId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SLA Response & Resolution Target
              </label>
              <select
                value={dispatchSlaHours}
                onChange={(e) => setDispatchSlaHours(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <option value={2}>2 Hours (Critical Emergency)</option>
                <option value={4}>4 Hours (High Priority)</option>
                <option value={8}>8 Hours (Standard Same-day)</option>
                <option value={24}>24 Hours (Next Business Day)</option>
                <option value={48}>48 Hours (Scheduled Maintenance)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setDispatchRequest(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveDispatch}>
                Dispatch Order
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Rejection Reason */}
      {showRejectForm && verificationOrder && (
        <Modal
          isOpen={showRejectForm}
          onClose={() => setShowRejectForm(false)}
          title="Reject Repair & Return for Rework"
          subtitle={`Work Order: ${verificationOrder.orderNumber}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rejection & Rework Requirements <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify what remains incomplete or failed inspection (e.g. pipe joint still sweating, debris not cleared, calibration out of spec)..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={!rejectionReason.trim()}
                onClick={() => handleVerify(false)}
              >
                Submit Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Duplicate Merge Dialog */}
      {mergePrimaryRequest && (
        <Modal
          isOpen={!!mergePrimaryRequest}
          onClose={() => setMergePrimaryRequest(null)}
          title="Consolidate & Merge Duplicates"
          subtitle={`Primary: ${mergePrimaryRequest.requestNumber} • ${mergePrimaryRequest.title}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select other requests that report this exact incident. Merging transfers community upvotes, preserves an audit trail, and marks child tickets as resolved duplicates.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {requests
                .filter((r) => r.id !== mergePrimaryRequest.id && !r.isDuplicate && r.status !== 'CLOSED')
                .map((candidate) => {
                  const isChecked = selectedDupIds.includes(candidate.id);
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedDupIds(selectedDupIds.filter((id) => id !== candidate.id));
                        } else {
                          setSelectedDupIds([...selectedDupIds, candidate.id]);
                        }
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors text-xs flex items-center justify-between ${
                        isChecked
                          ? 'bg-sky-50 dark:bg-sky-950 border-sky-300 dark:border-sky-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{candidate.title}</p>
                        <p className="text-slate-500 text-[11px]">
                          {candidate.locationName} • {candidate.upvotes} votes
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded accent-sky-600"
                      />
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setMergePrimaryRequest(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={selectedDupIds.length === 0}
                onClick={handleExecuteMerge}
              >
                Merge ({selectedDupIds.length}) Tickets
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Inspect Issue Modal */}
      <IssueDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}
