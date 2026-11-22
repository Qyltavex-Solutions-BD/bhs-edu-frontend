'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { Button, Card } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import {
  useCreateStudentMutation,
  useSubmitAdmissionApplicationMutation,
} from '@/src/store/api';
import type { MockDatabase } from '@/src/mocks/seed';
import type { Student, StudentEnrollment } from '@/src/types/entities';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';
import {
  AdmissionFormMode,
  checkDuplicateIdentity,
} from '../rules';
import {
  ADMISSION_STEP_FIELDS,
  buildUnifiedAdmissionSchema,
  type UnifiedAdmissionFormValues,
} from '../schema';
import {
  buildDefaultAdmissionValues,
  toAdminCreateStudentPayload,
  toPublicAdmissionPayload,
} from '../mappers';
import { StepClassAndAcademic } from './StepClassAndAcademic';
import { StepStudentIdentity } from './StepStudentIdentity';
import { StepParentsAndAddress } from './StepParentsAndAddress';
import { StepFinalPublic } from './StepFinalPublic';
import { StepFinalAdmin } from './StepFinalAdmin';

export interface AdminAdmissionResult {
  student: Student;
  enrollment: StudentEnrollment;
  formValues: UnifiedAdmissionFormValues;
}

interface UnifiedAdmissionFormProps {
  mode: AdmissionFormMode;
  db: MockDatabase;
  yearId?: string;
  prefillApplication?: OnlineAdmissionApplication | null;
  onPublicSuccess?: (application: OnlineAdmissionApplication) => void;
  onAdminSuccess?: (result: AdminAdmissionResult) => void;
  onCancel?: () => void;
}

export function UnifiedAdmissionForm({
  mode,
  db,
  yearId,
  prefillApplication,
  onPublicSuccess,
  onAdminSuccess,
  onCancel,
}: UnifiedAdmissionFormProps) {
  const { locale, pick } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState<1 | 2 | 3 | 4>(
    prefillApplication ? 4 : 1
  );

  const [submitPublicApp, { isLoading: submittingPublic }] =
    useSubmitAdmissionApplicationMutation();
  const [createStudent, { isLoading: submittingAdmin }] =
    useCreateStudentMutation();

  const schema = useMemo(
    () => buildUnifiedAdmissionSchema(mode, db.classes),
    [mode, db.classes]
  );

  const defaultValues = useMemo(
    () => buildDefaultAdmissionValues(db, mode, yearId, prefillApplication),
    [db, mode, yearId, prefillApplication]
  );

  const form = useForm<UnifiedAdmissionFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues,
    mode: 'onBlur',
  });

  const targetClassId = form.watch('targetClassId');
  const birthCertificateNo = form.watch('birthCertificateNo');
  const boardRegistrationNo = form.watch('boardRegistrationNo');
  const selectedClass = db.classes.find((c) => c.id === targetClassId);

  const duplicates = useMemo(
    () =>
      checkDuplicateIdentity(db, {
        birthCertificateNo,
        boardRegistrationNo,
        ignoreApplicationId: prefillApplication?.id,
      }),
    [db, birthCertificateNo, boardRegistrationNo, prefillApplication?.id]
  );

  const steps: Array<{ num: 1 | 2 | 3 | 4; title: string; subtitle: string }> = [
    {
      num: 1,
      title: pick('শ্রেণি ও একাডেমিক', 'Class & Academic'),
      subtitle: pick('শ্রেণি, বিভাগ ও পূর্ববর্তী তথ্য', 'Class, stream & prev school'),
    },
    {
      num: 2,
      title: pick('শিক্ষার্থীর তথ্য ও ছবি', 'Student Identity'),
      subtitle: pick('নাম, জন্ম সনদ ও পাসপোর্ট ছবি', 'Name, birth cert & photo'),
    },
    {
      num: 3,
      title: pick('অভিভাবক ও ঠিকানা', 'Parents & Address'),
      subtitle: pick('পিতা-মাতা, বৈধ অভিভাবক ও ঠিকানা', 'Parents, guardian & address'),
    },
    {
      num: 4,
      title:
        mode === 'public'
          ? pick('কাগজপত্র, রিভিউ ও জমা', 'Review & Submit')
          : pick('শাখা, রোল ও ভর্তি নিশ্চিত', 'Placement & Admit'),
      subtitle:
        mode === 'public'
          ? pick('সংযোজন ও অঙ্গীকারনামা', 'Documents & declaration')
          : pick('শাখা, রোল ও কাগজপত্র যাচাই', 'Section, roll & doc check'),
    },
  ];

  const validateCurrentStep = async (currentStep: 1 | 2 | 3 | 4): Promise<boolean> => {
    // Check live duplicate conflicts on steps 1 & 2 before allowing advance
    if (currentStep === 1 && duplicates.boardRegConflict) {
      toast.error(duplicates.boardRegConflict);
      return false;
    }
    if (currentStep === 2 && duplicates.birthCertConflict) {
      toast.error(duplicates.birthCertConflict);
      return false;
    }

    const fields = ADMISSION_STEP_FIELDS[currentStep] as Array<
      keyof UnifiedAdmissionFormValues
    >;
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) {
      toast.error(
        pick(
          'অনুগ্রহ করে চিহ্নিত আবশ্যক তথ্যগুলো সঠিকভাবে পূরণ করুন।',
          'Please fix the highlighted required fields before continuing.'
        )
      );
    }
    return valid;
  };

  const handleNext = async () => {
    const ok = await validateCurrentStep(step);
    if (!ok) return;
    const nextStep = Math.min(4, step + 1) as 1 | 2 | 3 | 4;
    setStep(nextStep);
    setMaxVisitedStep((prev) => (nextStep > prev ? nextStep : prev));
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = async (target: 1 | 2 | 3 | 4) => {
    if (target === step) return;
    if (target < step) {
      setStep(target);
      return;
    }
    if (target <= maxVisitedStep) {
      const ok = await validateCurrentStep(step);
      if (ok) setStep(target);
    }
  };

  const onSubmit = async (values: UnifiedAdmissionFormValues) => {
    if (duplicates.birthCertConflict) {
      toast.error(duplicates.birthCertConflict);
      setStep(2);
      return;
    }
    if (duplicates.boardRegConflict) {
      toast.error(duplicates.boardRegConflict);
      setStep(1);
      return;
    }

    if (mode === 'public') {
      try {
        const payload = toPublicAdmissionPayload(values, db);
        const created = await submitPublicApp(payload).unwrap();
        toast.success(
          pick(
            `আবেদন সফলভাবে জমা হয়েছে! আবেদন নম্বর: ${created.applicationNumber}`,
            `Application submitted! Tracking No: ${created.applicationNumber}`
          )
        );
        onPublicSuccess?.(created);
      } catch (err: unknown) {
        const message =
          (err as { message?: string; data?: { message?: string } })?.message ||
          (err as { data?: { message?: string } })?.data?.message ||
          pick('আবেদন জমা দিতে সমস্যা হয়েছে।', 'Application submission failed.');
        toast.error(message);
      }
      return;
    }

    // Admin Direct Admission (or Inbox-to-Admit conversion)
    try {
      const payload = toAdminCreateStudentPayload(values, db, prefillApplication?.id);
      const res = (await createStudent(payload).unwrap()) as {
        student: Student;
        enrollment: StudentEnrollment;
      };
      toast.success(
        pick(
          `${res.student.nameBn || res.student.nameEn} সফলভাবে ভর্তি হয়েছে (${res.student.studentId})।`,
          `${res.student.nameEn} admitted successfully (${res.student.studentId}).`
        )
      );
      onAdminSuccess?.({
        student: res.student,
        enrollment: res.enrollment,
        formValues: values,
      });
    } catch (err: unknown) {
      const message =
        (err as { message?: string; data?: { message?: string } })?.message ||
        (err as { data?: { message?: string } })?.data?.message ||
        pick('শিক্ষার্থী ভর্তি সম্পন্ন হয়নি।', 'Student admission failed.');
      toast.error(message);
    }
  };

  const onInvalid = (errors: Record<string, unknown>) => {
    const errorKeys = Object.keys(errors);
    const stepOrder: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
    for (const s of stepOrder) {
      if (ADMISSION_STEP_FIELDS[s].some((field) => errorKeys.includes(field))) {
        setStep(s);
        break;
      }
    }
    toast.error(
      pick(
        'আবেদনের চিহ্নিত আবশ্যক তথ্যগুলো সঠিকভাবে পূরণ করুন।',
        'Please review and complete the highlighted required fields.'
      )
    );
  };

  const submitting = submittingPublic || submittingAdmin;

  return (
    <div className="space-y-5">
      {/* Prefill banner when converting an Online Application inside Admin Panel */}
      {prefillApplication && mode === 'admin' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[var(--radius)] border border-primary/30 bg-primary/5 text-sm">
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">
              {pick(
                `অনলাইন আবেদন (${prefillApplication.applicationNumber}) থেকে ভর্তি প্রক্রিয়াকরণ`,
                `Admitting from Online Application (${prefillApplication.applicationNumber})`
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {pick(
                'আবেদনকারীর সকল তথ্য পূরণ করা আছে। প্রয়োজনে যেকোনো ধাপ সংশোধন করে ধাপ ৪-এ শাখা ও রোল নিশ্চিত করুন।',
                'Applicant details are pre-filled. Review or edit any step, then finalize section & roll in Step 4.'
              )}
            </p>
          </div>
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              {pick('ইনবক্সে ফিরুন', 'Back to Inbox')}
            </Button>
          )}
        </div>
      )}

      {/* Clean 4-Step Progress Stepper */}
      <nav
        aria-label={pick('ভর্তি ফরমের ধাপসমূহ', 'Admission Form Steps')}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5"
      >
        {steps.map((s) => {
          const isCurrent = step === s.num;
          const isCompleted = step > s.num;
          const clickable = s.num <= maxVisitedStep || s.num < step;
          return (
            <button
              key={s.num}
              type="button"
              disabled={!clickable && !isCurrent}
              onClick={() => handleStepClick(s.num)}
              className={`flex items-start gap-3 p-3.5 rounded-[var(--radius)] border text-left transition-colors duration-150 ${
                isCurrent
                  ? 'border-primary bg-primary/8 text-foreground'
                  : isCompleted
                    ? 'border-success/35 bg-success/5 text-foreground hover:bg-success/10 cursor-pointer'
                    : clickable
                      ? 'border-border bg-surface text-foreground hover:bg-surface-muted/50 cursor-pointer'
                      : 'border-border bg-surface text-muted-foreground opacity-75 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 tabular-nums mt-0.5 ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                      ? 'bg-success text-white'
                      : 'bg-surface-muted text-muted-foreground border border-border'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : formatNumber(s.num, locale)}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight truncate">
                  {s.title}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                  {s.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Main Single-Elevation Form Container */}
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} noValidate>
        <Card className="p-5 sm:p-7 space-y-6">
          {/* Live Duplicate Warning Banner if present */}
          {(duplicates.birthCertConflict || duplicates.boardRegConflict) && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {duplicates.birthCertConflict && <p>{duplicates.birthCertConflict}</p>}
                {duplicates.boardRegConflict && <p>{duplicates.boardRegConflict}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <StepClassAndAcademic
              form={form}
              db={db}
              mode={mode}
              boardRegDuplicate={duplicates.boardRegConflict}
            />
          )}

          {step === 2 && (
            <StepStudentIdentity
              form={form}
              mode={mode}
              selectedClass={selectedClass}
              birthCertDuplicate={duplicates.birthCertConflict}
            />
          )}

          {step === 3 && (
            <StepParentsAndAddress form={form} selectedClass={selectedClass} />
          )}

          {step === 4 && mode === 'public' && (
            <StepFinalPublic
              form={form}
              db={db}
              onJumpToStep={(target) => setStep(target)}
            />
          )}

          {step === 4 && mode === 'admin' && (
            <StepFinalAdmin form={form} db={db} />
          )}

          {/* Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-border">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={step === 1}
                onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}
              >
                <ArrowLeft className="w-4 h-4" />
                {pick('পূর্ববর্তী ধাপ', 'Previous Step')}
              </Button>
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  {pick('বাতিল', 'Cancel')}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
                {pick(
                  `ধাপ ${formatNumber(step, locale)} / ৪`,
                  `Step ${step} of 4`
                )}
              </span>

              {step < 4 ? (
                <Button type="button" variant="primary" onClick={handleNext}>
                  {pick('পরবর্তী ধাপ', 'Next Step')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" variant="primary" disabled={submitting}>
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting
                    ? pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                    : mode === 'public'
                      ? pick('আবেদন জমা দিন', 'Submit Application')
                      : pick('ভর্তি নিশ্চিত করুন', 'Confirm Admission')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
