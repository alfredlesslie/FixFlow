'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import {
  ThumbsUp,
  Clock,
  MapPin,
  Tag,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Flame,
  ArrowUpRight,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AuthenticatedImage } from '@/components/ui/AuthenticatedImage';
import { MaintenanceRequest, RequestComment, RequestStatus, UserRole } from '@/lib/types';
import { useDataBridge } from '@/lib/use-data-bridge';
import { GET_COMMENTS_QUERY } from '@/lib/graphql-operations';

interface IssueDetailModalProps {
  request: MaintenanceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenWorkOrder?: (workOrderId: string) => void;
  onOpenPriorityOverride?: (request: MaintenanceRequest) => void;
}

const LIFECYCLE_STEPS: RequestStatus[] = [
  'OPEN',
  'TRIAGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'CLOSED',
];

export function IssueDetailModal({
  request,
  isOpen,
  onClose,
  onOpenWorkOrder,
  onOpenPriorityOverride,
}: IssueDetailModalProps) {
  const { activeUser, upvoteRequest, removeUpvote, unmarkRequestDuplicate, addComment } = useDataBridge();
  const [commentInput, setCommentInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: commentsData, refetch: refetchComments } = useQuery(GET_COMMENTS_QUERY, {
    variables: { requestId: request?.id },
    skip: !request?.id,
    fetchPolicy: 'cache-and-network',
  });

  const commentsList: RequestComment[] = useMemo(() => {
    if (commentsData?.comments && commentsData.comments.length > 0) {
      return commentsData.comments.map((c: any) => ({
        id: c.id,
        authorId: c.authorId,
        authorName: c.author?.name || 'Staff User',
        authorRole: (c.author?.role as UserRole) || 'REQUESTER',
        content: c.content,
        createdAt: c.createdAt,
        isInternal: c.isInternal,
      }));
    }
    return request?.comments || [];
  }, [commentsData, request?.comments]);

  const displayImages = useMemo(() => {
    // 1. Check persistent custom attachments map first
    if (request?.id && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('fixflow_request_attachments');
        if (raw) {
          const map = JSON.parse(raw);
          const stored = map[request.id] || (request.requestNumber ? map[request.requestNumber] : undefined);
          if (stored && Array.isArray(stored)) {
            return stored;
          }
        }
      } catch {}
    }

    // 2. Fall back to request.images if present and valid
    if (request?.images && Array.isArray(request.images)) {
      return request.images;
    }

    return [];
  }, [request?.id, request?.requestNumber, request?.images]);

  if (!request) return null;

  const isUpvoted = request.upvoters.includes(activeUser.id);
  const currentStepIndex = LIFECYCLE_STEPS.indexOf(request.status);

  const handleUpvote = async () => {
    try {
      if (isUpvoted) {
        await removeUpvote(request.id);
      } else {
        await upvoteRequest(request.id);
      }
    } catch (err) {
      console.error('Failed to update upvote:', err);
    }
  };

  const handleUnlinkDuplicate = async () => {
    try {
      await unmarkRequestDuplicate(request.id);
    } catch (err) {
      console.error('Failed to unlink duplicate:', err);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    try {
      await addComment(request.id, commentInput.trim());
      setCommentInput('');
      await refetchComments();
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tabular-data text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
            {request.requestNumber}
          </span>
          <Badge status={request.status} />
          <Badge priority={request.priority} />
          {request.priorityFactors.isOverridden && (
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
              FM Overridden
            </span>
          )}
        </div>
      }
      subtitle={
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{request.locationName}</span>
          <span>•</span>
          <span>Reported by {request.reportedByName}</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Main Title & Upvote CTA Banner */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {request.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="inline-flex items-center gap-1 font-medium">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {request.category}
              </span>
              {request.assetName && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
                    Asset: {request.assetName} ({request.assetTag})
                  </span>
                </>
              )}
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(request.reportedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Upvote Button */}
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-150 haptic-press ${
                isUpvoted
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-300 dark:ring-sky-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <ThumbsUp
                className={`w-4 h-4 ${isUpvoted ? 'fill-white stroke-white' : ''}`}
              />
              <span>{isUpvoted ? 'Upvoted' : 'Upvote Issue'}</span>
              <span className="tabular-data px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-xs">
                {request.upvotes}
              </span>
            </button>

            {/* Facility Manager Override Button */}
            {(activeUser.role === 'FACILITY_MANAGER' || activeUser.role === 'ADMIN') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenPriorityOverride && onOpenPriorityOverride(request)}
              >
                Triage / Score
              </Button>
            )}
          </div>
        </div>

        {/* Duplicate Notice Banner */}
        {request.isDuplicate && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Official Duplicate Notice
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-snug">
                    This request is linked as a duplicate of primary ticket <strong className="font-mono">#{request.duplicateOfNumber || request.duplicateOfId}</strong>.
                  </p>
                  {request.duplicateReason && (
                    <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 mt-1 italic">
                      Justification: {request.duplicateReason}
                    </p>
                  )}
                </div>
              </div>
              {(activeUser.role === 'FACILITY_MANAGER' || activeUser.role === 'ADMIN' || activeUser.role === 'TECHNICIAN') && (
                <button
                  type="button"
                  onClick={handleUnlinkDuplicate}
                  className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700 transition-colors shrink-0"
                >
                  Unlink Duplicate
                </button>
              )}
            </div>
          </div>
        )}

        {/* 7-Step Lifecycle Horizontal Stepper */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Resolution Lifecycle
          </p>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center min-w-[620px]">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = request.status === step;

                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-sky-500 text-white ring-4 ring-sky-100 dark:ring-sky-950 scale-110 shadow-sm'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPassed && !isCurrent ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 font-medium tracking-tight text-center ${
                          isCurrent
                            ? 'text-sky-600 dark:text-sky-400 font-bold'
                            : isPassed
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.replace('_', ' ')}
                      </span>
                    </div>
                    {idx < LIFECYCLE_STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-1 transition-colors ${
                          currentStepIndex > idx ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Priority Score Breakdown Pill */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Priority Composite Score:
            </span>
            <span className="tabular-data font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
              {request.priorityFactors.calculatedScore}/100
            </span>
            <span className="text-slate-500">({request.priority})</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>Severity: {request.priorityFactors.initialSeverity}/10</span>
            <span>Asset Criticality: {request.priorityFactors.assetCriticality}/10</span>
            <span>Community Votes: +{request.priorityFactors.upvoteMultiplier}pts</span>
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Issue Description & Findings
          </h3>
          <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {request.description}
          </div>
        </div>

        {/* Evidence Photos */}
        {displayImages && displayImages.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              Attached Photographic Evidence ({displayImages.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {displayImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className="group relative h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer shadow-sm"
                >
                  <AuthenticatedImage
                    src={img}
                    alt={`Evidence ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                    View Full
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Associated Work Order Link (if dispatched) */}
        {request.workOrderId && (
          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  Active Work Order: {request.workOrderId}
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  Technician assigned. Inspection & repair workflow in progress.
                </p>
              </div>
            </div>
            {onOpenWorkOrder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenWorkOrder(request.workOrderId!)}
                trailingIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                Inspect Work Order
              </Button>
            )}
          </div>
        )}

        {/* Discussion & Activity Timeline */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Activity Log & Discussion ({commentsList.length})
          </h3>

          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
            {commentsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No comments or updates yet.
              </p>
            ) : (
              commentsList.map((comm) => (
                <div
                  key={comm.id}
                  className={`p-3 rounded-xl border text-xs ${
                    comm.isSystemEvent
                      ? 'bg-slate-50 dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 italic'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {comm.authorName}
                      <Badge role={comm.authorRole} size="sm" />
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(comm.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="leading-relaxed">{comm.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleSendComment} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add supplementary information or response..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!commentInput.trim()}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Post
            </Button>
          </form>
        </div>
      </div>

      {/* Lightbox Modal for Full Image */}
      {selectedImage && (
        <Modal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          maxWidth="2xl"
        >
          <AuthenticatedImage
            src={selectedImage}
            alt="Evidence full view"
            className="w-full h-auto rounded-xl max-h-[75vh] object-contain mx-auto"
          />
        </Modal>
      )}
    </Modal>
  );
}
