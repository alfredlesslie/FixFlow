'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  Upload,
  Plus,
  Trash2,
  DollarSign,
  Camera,
  MapPin,
  Calendar,
  FileText,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useDataBridge } from '@/lib/use-data-bridge';
import { WorkOrder, WorkOrderStatus, WorkOrderPart } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const SAMPLE_AFTER_PHOTOS = [
  'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
];

export function TechnicianWorkbench() {
  const { workOrders, activeUser, updateWorkOrder } = useDataBridge();

  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'pending' | 'completed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  // Form states inside modal
  const [modalStatus, setModalStatus] = useState<WorkOrderStatus>('IN_PROGRESS');
  const [diagnosis, setDiagnosis] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [parts, setParts] = useState<WorkOrderPart[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartCost, setNewPartCost] = useState(25);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Work orders assigned to this technician (or all if demoing)
  const myWorkOrders = workOrders.filter(
    (wo) => wo.assignedToId === activeUser.id || activeUser.role === 'ADMIN' || activeUser.role === 'FACILITY_MANAGER'
  );

  const filteredOrders = myWorkOrders.filter((wo) => {
    if (activeTab === 'in_progress') return wo.status === 'IN_PROGRESS';
    if (activeTab === 'pending') return wo.status === 'PENDING' || wo.status === 'ACCEPTED';
    if (activeTab === 'completed') return wo.status === 'COMPLETED';
    return true;
  });

  const handleOpenOrder = (wo: WorkOrder) => {
    setSelectedOrder(wo);
    setModalStatus(wo.status);
    setDiagnosis(wo.diagnosis || '');
    setRepairNotes(wo.repairNotes || '');
    setParts(wo.partsUsed || []);
    setAfterImages(wo.afterImages || []);
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const newPart: WorkOrderPart = {
      id: `p-${Date.now()}`,
      name: newPartName.trim(),
      quantity: Number(newPartQty),
      unitCost: Number(newPartCost),
    };
    setParts([...parts, newPart]);
    setNewPartName('');
    setNewPartQty(1);
    setNewPartCost(25);
  };

  const handleRemovePart = (id: string) => {
    setParts(parts.filter((p) => p.id !== id));
  };

  const totalPartsCost = parts.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);

  const handleSaveProgress = (completeOrder = false) => {
    if (!selectedOrder) return;
    setIsSaving(true);

    const nextStatus: WorkOrderStatus = completeOrder ? 'COMPLETED' : modalStatus;

    updateWorkOrder(selectedOrder.id, {
      status: nextStatus,
      diagnosis,
      repairNotes,
      partsUsed: parts,
      afterImages,
    });

    setIsSaving(false);
    setSelectedOrder(null);
  };

  const calculateSlaRemainingText = (deadlineIso: string) => {
    const diffMs = new Date(deadlineIso).getTime() - Date.now();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 0) {
      return { text: `${Math.abs(diffHours)}h Overdue`, isOverdue: true };
    }
    return { text: `${diffHours}h Remaining`, isOverdue: false };
  };

  return (
    <div className="space-y-6">
      {/* Workbench Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/10 text-sky-200 border border-white/10">
            Technician Workbench
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-2">
            Field Dispatch & Repair Orders
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Assigned to: <strong className="text-white">{activeUser.name}</strong> • {activeUser.department}
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
            <span className="block text-xl font-bold tabular-data text-white">
              {myWorkOrders.filter((w) => w.status === 'IN_PROGRESS').length}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Jobs</span>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
            <span className="block text-xl font-bold tabular-data text-emerald-400">
              {myWorkOrders.filter((w) => w.status === 'COMPLETED').length}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Completed</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Assigned ({myWorkOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'in_progress'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          In Progress ({myWorkOrders.filter((w) => w.status === 'IN_PROGRESS').length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'pending'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Pending / Accepted ({myWorkOrders.filter((w) => w.status === 'PENDING' || w.status === 'ACCEPTED').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'completed'
              ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Awaiting Verification ({myWorkOrders.filter((w) => w.status === 'COMPLETED').length})
        </button>
      </div>

      {/* Work Order Cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No work orders in this view.
          </div>
        ) : (
          filteredOrders.map((wo) => {
            const sla = calculateSlaRemainingText(wo.slaDeadline);

            return (
              <div
                key={wo.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all double-bezel-interactive flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="tabular-data text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {wo.orderNumber}
                    </span>
                    <Badge status={wo.status} size="sm" />
                    <Badge priority={wo.priority} size="sm" />
                    {wo.verificationStatus === 'VERIFIED' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> FM Verified
                      </span>
                    )}
                    {wo.verificationStatus === 'REJECTED' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Rework Required
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {wo.requestTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {wo.locationName}
                    </span>
                    {wo.assetName && (
                      <>
                        <span>•</span>
                        <span className="text-sky-600 dark:text-sky-400 font-medium">
                          {wo.assetName}
                        </span>
                      </>
                    )}
                  </div>

                  {wo.diagnosis && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      Diagnosis: {wo.diagnosis}
                    </p>
                  )}
                </div>

                {/* Right Action & SLA Box */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold tabular-data ${
                      sla.isOverdue
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{sla.text}</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenOrder(wo)}
                    icon={<Wrench className="w-3.5 h-3.5" />}
                  >
                    {wo.status === 'COMPLETED' ? 'Review Repair' : 'Execute Work'}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Work Order Execution & Evidence Studio Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          maxWidth="4xl"
          title={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                {selectedOrder.orderNumber}
              </span>
              <span>Work Order Execution</span>
            </div>
          }
          subtitle={`Task: ${selectedOrder.requestTitle} • ${selectedOrder.locationName}`}
        >
          <div className="space-y-6">
            {/* Status Selector */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Job Execution State:
              </span>
              <div className="flex items-center gap-2">
                {(['ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'] as WorkOrderStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setModalStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all haptic-press ${
                      modalStatus === st
                        ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnosis & Findings */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Field Diagnosis & Root Cause
              </label>
              <textarea
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Identified root cause (e.g. sheared motor gear, burst gasket, faulty relay)..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Repair Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corrective Actions Taken
              </label>
              <textarea
                rows={2}
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                placeholder="Details of corrective action, calibrations performed, and torque specs verified..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Parts Used Tracker */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-sky-500" />
                  Parts & Consumables Logged
                </span>
                <span className="tabular-data text-xs font-bold text-slate-900 dark:text-white">
                  Total Parts Cost: ${totalPartsCost.toFixed(2)}
                </span>
              </div>

              {/* List of parts */}
              {parts.length > 0 && (
                <div className="space-y-1.5">
                  {parts.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                        <span className="text-slate-400 ml-2">Qty: {p.quantity} × ${p.unitCost.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-data font-bold">${(p.quantity * p.unitCost).toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(p.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Part Form */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Part name (e.g. 2-inch ProPress coupling)"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
                <input
                  type="number"
                  min={1}
                  value={newPartQty}
                  onChange={(e) => setNewPartQty(Number(e.target.value))}
                  placeholder="Qty"
                  className="w-16 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={newPartCost}
                  onChange={(e) => setNewPartCost(Number(e.target.value))}
                  placeholder="Unit $"
                  className="w-20 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddPart}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Before & After Repair Evidence Studio */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-sky-500" />
                    Repair Evidence Studio (Before & After)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Facility Managers verify quality and issue resolution against photographic evidence.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Before Images */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Before Repair (Reported)
                  </span>
                  {selectedOrder.beforeImages && selectedOrder.beforeImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedOrder.beforeImages.map((img, i) => (
                        <div key={i} className="h-28 rounded-lg overflow-hidden border border-slate-200">
                          <img src={img} alt="Before" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-28 flex items-center justify-center text-xs text-slate-400 border border-dashed rounded-lg">
                      No initial photo reported
                    </div>
                  )}
                </div>

                {/* After Images */}
                <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                      After Repair (Evidence)
                    </span>
                    <span className="text-[10px] text-slate-400">Attached: {afterImages.length}</span>
                  </div>

                  {afterImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {afterImages.map((img, i) => (
                        <div key={i} className="relative h-28 rounded-lg overflow-hidden border border-emerald-300">
                          <img src={img} alt="After" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setAfterImages(afterImages.filter((x) => x !== img))}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-28 flex items-center justify-center text-xs text-slate-400 border border-dashed border-emerald-200 rounded-lg">
                      Attach verified completion photo
                    </div>
                  )}

                  {/* Add sample after photos */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400">Attach:</span>
                    {SAMPLE_AFTER_PHOTOS.map((photo, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setAfterImages((prev) => (!prev.includes(photo) ? [...prev, photo] : prev));
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      >
                        + Repair Photo {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={isSaving}
                  onClick={() => handleSaveProgress(false)}
                >
                  Save Progress
                </Button>
                <Button
                  type="button"
                  variant="success"
                  isLoading={isSaving}
                  onClick={() => handleSaveProgress(true)}
                  icon={<ShieldCheck className="w-4 h-4" />}
                >
                  Submit for FM Verification
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
