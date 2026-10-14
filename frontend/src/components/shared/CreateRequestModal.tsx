'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Upload,
  ThumbsUp,
  X,
  Sparkles,
  Camera,
  MapPin,
  Tag,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDataBridge } from '@/lib/use-data-bridge';
import { DuplicateCandidate } from '@/lib/types';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSelectExistingIssue?: (requestId: string) => void;
}

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'HVAC & Refrigeration',
  'Audio-Visual & IT',
  'Infrastructure & Safety',
  'Elevators & Doors',
  'Custodial & Grounds',
];

const LOCATIONS = [
  { id: 'loc-lib-2', name: 'Central Library — 2nd Floor Study Commons', building: 'Central Library', room: 'Commons 204' },
  { id: 'loc-dorm-n', name: 'North Quad — Residence Hall B Entrance', building: 'Residence Hall B', room: 'Vestibule' },
  { id: 'loc-eng-4', name: 'Turing Hall — Lecture Hall 402', building: 'Turing Hall', room: 'Hall 402' },
  { id: 'loc-dine-1', name: 'Student Union — Central Dining Kitchen', building: 'Student Union', room: 'Kitchen' },
  { id: 'loc-sci-1', name: 'Science Complex — Physics Lab 108', building: 'Science Complex', room: 'Lab 108' },
  { id: 'loc-ath-g', name: 'Athletic Pavilion — Main Gymnasium', building: 'Athletic Pavilion', room: 'Gym 1' },
];

const PRESET_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
  'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800',
  'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800',
];

export function CreateRequestModal({
  isOpen,
  onClose,
  onSuccess,
  onSelectExistingIssue,
}: CreateRequestModalProps) {
  const { activeUser, createRequest, detectDuplicates, upvoteRequest } = useDataBridge();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [initialSeverity, setInitialSeverity] = useState(5);
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live duplicate detection candidates
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [dismissDuplicateNotice, setDismissDuplicateNotice] = useState(false);

  useEffect(() => {
    if (title.length > 5 || description.length > 10) {
      const candidates = detectDuplicates(title, description, category, locationId);
      setDuplicateCandidates(candidates);
      setDismissDuplicateNotice(false);
    } else {
      setDuplicateCandidates([]);
    }
  }, [title, description, category, locationId, detectDuplicates]);

  const selectedLoc = LOCATIONS.find((l) => l.id === locationId) || LOCATIONS[0];

  const handleUpvoteDuplicateInstead = (candidate: DuplicateCandidate) => {
    upvoteRequest(candidate.requestId);
    onClose();
    if (onSelectExistingIssue) {
      onSelectExistingIssue(candidate.requestId);
    }
  };

  const handleAddSamplePhoto = (url: string) => {
    if (!images.includes(url)) {
      setImages([...images, url]);
    }
  };

  const handleRemovePhoto = (url: string) => {
    setImages(images.filter((img) => img !== url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      createRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        locationId: selectedLoc.id,
        locationName: selectedLoc.name,
        building: selectedLoc.building,
        room: selectedLoc.room,
        initialSeverity,
        images,
        user: activeUser,
      });

      // Reset
      setTitle('');
      setDescription('');
      setImages([]);
      setIsSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      setIsSubmitting(false);
    }
  };

  const getSeverityDescription = (val: number) => {
    if (val <= 2) return 'Negligible cosmetic blemish; no impact on operations.';
    if (val <= 4) return 'Minor inconvenience; space remains functional.';
    if (val <= 6) return 'Noticeable operational impairment; repairs required soon.';
    if (val <= 8) return 'Significant disruption or accessibility blockage; requires urgent response.';
    return 'Critical active hazard, flooding, or safety danger requiring immediate emergency shutoff!';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title="Report Campus Issue"
      subtitle="Submit maintenance notices for campus facilities, equipment, or safety concerns."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Live Duplicate Detection Banner */}
        {duplicateCandidates.length > 0 && !dismissDuplicateNotice && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Similar Existing Issue Detected ({duplicateCandidates[0].similarityScore}% Match)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDismissDuplicateNotice(true)}
                className="text-amber-600 hover:text-amber-800 text-xs font-medium"
              >
                Dismiss
              </button>
            </div>

            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1.5 leading-snug">
              An issue matching this location and topic is already active. Upvoting it raises its urgency for dispatch and avoids duplicate work!
            </p>

            <div className="mt-3 space-y-2">
              {duplicateCandidates.slice(0, 2).map((candidate) => (
                <div
                  key={candidate.requestId}
                  className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {candidate.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {candidate.locationName} • {candidate.upvotes} community upvotes
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpvoteDuplicateInstead(candidate)}
                    icon={<ThumbsUp className="w-3.5 h-3.5 text-sky-600" />}
                  >
                    Upvote Instead
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Issue Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Broken water pipe leaking through ceiling tiles"
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Category & Location Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Campus Location
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what is malfunctioning, any noises/odors/leaks, and exact equipment involved..."
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
          />
        </div>

        {/* Severity Slider */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-500" />
              Observed Severity Level
            </span>
            <span className="tabular-data font-bold text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
              {initialSeverity} / 10
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={initialSeverity}
            onChange={(e) => setInitialSeverity(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {getSeverityDescription(initialSeverity)}
          </p>
        </div>

        {/* Photo Evidence Attachments */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Photographic Evidence</span>
            <span className="text-[11px] text-slate-400">Optional (up to 4)</span>
          </label>

          {/* Attached image preview chips */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((img, i) => (
                <div key={i} className="relative h-20 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={img} alt="Attached" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(img)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Demo preset photo buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Attach sample photo:</span>
            {PRESET_SAMPLE_PHOTOS.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAddSamplePhoto(photo)}
                className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                + Photo {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!title.trim() || !description.trim()}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
