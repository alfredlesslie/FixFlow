'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Building2,
  Phone,
  Shield,
  HardHat,
  UserCheck,
  Wrench,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
  BadgeCheck,
  Briefcase,
  FileText,
  Loader2,
} from 'lucide-react';

export type RequestedRole = 'REQUESTER' | 'TECHNICIAN' | 'FACILITY_MANAGER';

interface RegistrationData {
  firstName: string;
  lastName: string;
  institutionalEmail: string;
  institutionalId: string;
  department: string;
  contactNumber: string;
  requestedRole: RequestedRole;
  password: string;
  passwordConfirmation: string;
  // Technician specific
  tradeDiscipline: string;
  certificationNumber: string;
  yearsExperience: string;
  // Facility Manager specific
  facilityScope: string;
  appointmentJustification: string;
}

const DEPARTMENTS = [
  'Central Facilities Operations',
  'Computer Science & Engineering',
  'Electrical & Automation Systems',
  'Mechanical & Civil Engineering',
  'Physics & Natural Sciences',
  'Campus Life & Student Affairs',
  'Health & Medical Sciences',
  'Business & Campus Administration',
  'Library & Information Services',
];

const TRADE_DISCIPLINES = [
  'Electrical & Automation Systems',
  'HVAC & Climate Control',
  'Plumbing & Hydraulics',
  'Carpentry & Structural',
  'Audio/Visual & Electronics',
  'General Maintenance & Locksmith',
];

const FACILITY_SCOPES = [
  'Central Academic Campus (All Buildings)',
  'Engineering & Science Complex',
  'Student Residential Quadrant',
  'Athletics & Recreation Facilities',
  'Health Sciences Center',
  'Administrative & Support Annex',
];

export function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    institutionalEmail: '',
    institutionalId: '',
    department: DEPARTMENTS[0],
    contactNumber: '',
    requestedRole: 'REQUESTER',
    password: '',
    passwordConfirmation: '',
    tradeDiscipline: TRADE_DISCIPLINES[0],
    certificationNumber: '',
    yearsExperience: '3',
    facilityScope: FACILITY_SCOPES[0],
    appointmentJustification: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const handleInputChange = (
    field: keyof RegistrationData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.firstName.trim()) errs.firstName = 'First name is required';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.institutionalEmail.trim()) {
      errs.institutionalEmail = 'Institutional email is required';
    } else if (!emailRegex.test(formData.institutionalEmail)) {
      errs.institutionalEmail = 'Please provide a valid email format';
    } else if (!formData.institutionalEmail.toLowerCase().includes('.edu') && !formData.institutionalEmail.toLowerCase().includes('fixflow')) {
      errs.institutionalEmail = 'Must be an authorized campus address (.edu or fixflow.edu)';
    }

    if (!formData.institutionalId.trim()) {
      errs.institutionalId = 'Institutional ID / Staff / Student ID is required';
    }

    if (!formData.contactNumber.trim()) {
      errs.contactNumber = 'Contact phone number is required';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.passwordConfirmation) {
      errs.passwordConfirmation = 'Passwords do not match';
    }

    // Role-specific validations
    if (formData.requestedRole === 'TECHNICIAN') {
      if (!formData.certificationNumber.trim()) {
        errs.certificationNumber = 'Trade license or certification number is required for technicians';
      }
    }

    if (formData.requestedRole === 'FACILITY_MANAGER') {
      if (!formData.appointmentJustification.trim()) {
        errs.appointmentJustification = 'Please provide your administrative appointment justification';
      } else if (formData.appointmentJustification.trim().length < 20) {
        errs.appointmentJustification = 'Please provide a detailed justification (min 20 characters)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate registration submission (Prototype state without fabricating backend mutation)
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionSuccess(true);

      // Save application details in sessionStorage for previewing verification & approval screens
      try {
        const applicationRecord = {
          ...formData,
          submittedAt: new Date().toISOString(),
          status: 'PENDING_VERIFICATION',
        };
        sessionStorage.setItem('fixflow_last_registration', JSON.stringify(applicationRecord));
      } catch {}

      // Navigate after brief delay or user can click
      const targetQuery = new URLSearchParams({
        email: formData.institutionalEmail,
        role: formData.requestedRole,
        name: `${formData.firstName} ${formData.lastName}`,
      }).toString();

      router.push(`/verify-email?${targetQuery}`);
    }, 900);
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-slate-200 dark:bg-slate-800' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-sky-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    }
  };

  const strength = getPasswordStrength(formData.password);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Registration Card */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-7 transition-colors">
        {/* Header */}
        <div className="space-y-2 border-b border-slate-100 dark:border-slate-800/80 pb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/80 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Institutional Account Enrollment</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Register for FixFlow
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Create an authorized campus operations account. Institutional verification is required for all roles.
          </p>
        </div>

        {/* Global Error Banner */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Please resolve the highlighted fields before submitting:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                {Object.values(errors).slice(0, 3).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Account Role Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select Institutional Account Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Requester Option */}
              <button
                type="button"
                id="role-select-requester"
                onClick={() => handleInputChange('requestedRole', 'REQUESTER')}
                className={`p-3.5 rounded-2xl border text-left transition-all haptic-press flex flex-col justify-between gap-2 ${
                  formData.requestedRole === 'REQUESTER'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 dark:border-sky-500 text-slate-900 dark:text-white ring-2 ring-sky-500/20'
                    : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  {formData.requestedRole === 'REQUESTER' && (
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Requester</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Student / Faculty / Staff report & track issues
                  </div>
                </div>
              </button>

              {/* Technician Option */}
              <button
                type="button"
                id="role-select-technician"
                onClick={() => handleInputChange('requestedRole', 'TECHNICIAN')}
                className={`p-3.5 rounded-2xl border text-left transition-all haptic-press flex flex-col justify-between gap-2 ${
                  formData.requestedRole === 'TECHNICIAN'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 dark:border-amber-500 text-slate-900 dark:text-white ring-2 ring-amber-500/20'
                    : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <HardHat className="w-4 h-4" />
                  </div>
                  {formData.requestedRole === 'TECHNICIAN' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Technician</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Field trade specialist for work order execution
                  </div>
                </div>
              </button>

              {/* Facility Manager Option */}
              <button
                type="button"
                id="role-select-manager"
                onClick={() => handleInputChange('requestedRole', 'FACILITY_MANAGER')}
                className={`p-3.5 rounded-2xl border text-left transition-all haptic-press flex flex-col justify-between gap-2 ${
                  formData.requestedRole === 'FACILITY_MANAGER'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 text-slate-900 dark:text-white ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                  {formData.requestedRole === 'FACILITY_MANAGER' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Facility Manager</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Operations lead for triage, dispatch & SLA review
                  </div>
                </div>
              </button>
            </div>

            {/* Note on Admin accounts */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 italic">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                System Administrator accounts cannot be self-registered. They are provisioned directly by institution governance.
              </span>
            </p>
          </div>

          {/* 2. Personal & Institutional Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
              Personal & Institutional Details
            </h3>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="first-name-input"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="e.g. Maya"
                    className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      errors.firstName ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="last-name-input"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="e.g. Patel"
                    className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      errors.lastName ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email & Institutional ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email (.edu) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="email-register-input"
                    value={formData.institutionalEmail}
                    onChange={(e) => handleInputChange('institutionalEmail', e.target.value)}
                    placeholder="name@university.edu"
                    className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      errors.institutionalEmail ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {errors.institutionalEmail ? (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.institutionalEmail}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-0.5">Verification link will be dispatched here</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional ID / Roll Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="inst-id-input"
                    value={formData.institutionalId}
                    onChange={(e) => handleInputChange('institutionalId', e.target.value)}
                    placeholder="e.g. STU-2024-8842 or FAC-901"
                    className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      errors.institutionalId ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {errors.institutionalId && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.institutionalId}</p>
                )}
              </div>
            </div>

            {/* Department & Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Department / Faculty <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <select
                    id="department-select"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    id="phone-input"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      errors.contactNumber ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {errors.contactNumber && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.contactNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Conditional Qualifications Section */}
          {formData.requestedRole === 'TECHNICIAN' && (
            <div className="space-y-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Technician Trade Qualifications
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Technician accounts receive access to physical facility work orders and require manual approval by the Campus Administrator.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Trade Discipline <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="trade-discipline-select"
                    value={formData.tradeDiscipline}
                    onChange={(e) => handleInputChange('tradeDiscipline', e.target.value)}
                    className="block w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {TRADE_DISCIPLINES.map((trade) => (
                      <option key={trade} value={trade}>
                        {trade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Years of Field Experience
                  </label>
                  <select
                    id="years-exp-select"
                    value={formData.yearsExperience}
                    onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                    className="block w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="1-2">1–2 years (Apprentice / Junior)</option>
                    <option value="3-5">3–5 years (Journeyperson)</option>
                    <option value="6-10">6–10 years (Senior Specialist)</option>
                    <option value="10+">10+ years (Master Technician)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  License / Trade Certification Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="cert-number-input"
                    value={formData.certificationNumber}
                    onChange={(e) => handleInputChange('certificationNumber', e.target.value)}
                    placeholder="e.g. ELEC-CERT-2023-8891 or HVAC-EPA-Universal"
                    className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.certificationNumber ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {errors.certificationNumber && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.certificationNumber}</p>
                )}
              </div>
            </div>
          )}

          {formData.requestedRole === 'FACILITY_MANAGER' && (
            <div className="space-y-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  Facility Manager Scope & Appointment Justification
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Elevated access to triage campus maintenance, assign technicians, and sign off on completion SLA. Requires verification by Institutional Administration.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Requested Building / Zone Scope <span className="text-rose-500">*</span>
                </label>
                <select
                  id="scope-select"
                  value={formData.facilityScope}
                  onChange={(e) => handleInputChange('facilityScope', e.target.value)}
                  className="block w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {FACILITY_SCOPES.map((scope) => (
                    <option key={scope} value={scope}>
                      {scope}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Administrative Appointment / Authorization Justification <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="justification-input"
                    rows={3}
                    value={formData.appointmentJustification}
                    onChange={(e) => handleInputChange('appointmentJustification', e.target.value)}
                    placeholder="Specify your designated campus role, official department head reference, or appointment memo number authorizing facility triage responsibilities."
                    className={`block w-full p-3 text-xs sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.appointmentJustification ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {errors.appointmentJustification && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.appointmentJustification}</p>
                )}
              </div>
            </div>
          )}

          {/* 4. Password & Security */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
              Account Security & Password
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="register-password-input"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className={`block w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      errors.password ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.password}</p>
                )}

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Strength:</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 transition-all ${
                            step <= strength.score ? strength.color : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="register-confirm-password-input"
                    value={formData.passwordConfirmation}
                    onChange={(e) => handleInputChange('passwordConfirmation', e.target.value)}
                    placeholder="••••••••"
                    className={`block w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      errors.passwordConfirmation ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.passwordConfirmation && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.passwordConfirmation}</p>
                )}
              </div>
            </div>
          </div>

          {/* 5. Dynamic Next-Step Explanation Panel */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/90 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-sky-500" />
              <span>Next Steps After Registration:</span>
            </div>

            {formData.requestedRole === 'REQUESTER' && (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Upon submission, a verification token is sent to your institutional address (<strong>{formData.institutionalEmail || 'user@fixflow.edu'}</strong>). You must verify your email to activate reporting capabilities. Access is restricted until verified.
              </p>
            )}

            {formData.requestedRole === 'TECHNICIAN' && (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Technician accounts require <strong>two stages</strong>: first, verify your campus email; second, the Campus Administrator verifies your trade credentials and grants field dispatch privileges. You will enter a pending approval state upon email verification.
              </p>
            )}

            {formData.requestedRole === 'FACILITY_MANAGER' && (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Facility Manager accounts require institutional email verification followed by <strong>mandatory Administrator authorization</strong>. Roles are never granted solely based on selection; governance approval is required before triage tools are unlocked.
              </p>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2 space-y-4">
            <button
              type="submit"
              id="submit-register-btn"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-sky-600/20 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all haptic-press disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enrolling Institutional Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Send Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an authorized institutional account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  Sign In to Station
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
