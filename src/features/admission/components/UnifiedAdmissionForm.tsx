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
import { Button } from '@/src/components/ui/primitives';
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

  const steps: Array<{ num: 1 | 2 | 3 | 4; title: string }> = [
    {
      num: 1,
      title: pick('শ্রেণি ও একাডেমিক তথ্য', 'Class & Academic'),
    },
    {
      num: 2,
      title: pick('শিক্ষার্থীর তথ্য ও ছবি', 'Student Identity'),
    },
    {
      num: 3,
      title: pick('অভিভাবক ও ঠিকানা', 'Parents & Address'),
    },
    {
      num: 4,
      title:
        mode === 'public'
          ? pick('ফর্ম প্রিভিউ ও জমা', 'Preview & Submit')
          : pick('শাখা, রোল ও ভর্তি', 'Placement & Admit'),
    },
  ];

  const validateCurrentStep = async (currentStep: 1 | 2 | 3 | 4): Promise<boolean> => {
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
          'চিহ্নিত আবশ্যক ঘরগুলো সঠিকভাবে পূরণ করুন।',
          'Please complete the highlighted required fields.'
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
            `আবেদন সফলভাবে গৃহীত হয়েছে। আবেদন নম্বর: ${created.applicationNumber}`,
            `Application submitted. Tracking No: ${created.applicationNumber}`
          )
        );
        onPublicSuccess?.(created);
      } catch (err: unknown) {
        const message =
          (err as { message?: string; data?: { message?: string } })?.message ||
          (err as { data?: { message?: string } })?.data?.message ||
          pick('আবেদন জমা দেওয়া সম্ভব হয়নি।', 'Application submission failed.');
        toast.error(message);
      }
      return;
    }

    try {
      const payload = toAdminCreateStudentPayload(values, db, prefillApplication?.id);
      const res = (await createStudent(payload).unwrap()) as {
        student: Student;
        enrollment: StudentEnrollment;
      };
      toast.success(
        pick(
          `${res.student.nameBn || res.student.nameEn} ভর্তি সম্পন্ন হয়েছে (${res.student.studentId})।`,
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
        pick('ভর্তি সম্পন্ন করা সম্ভব হয়নি।', 'Student admission failed.');
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
        'চিহ্নিত আবশ্যক ঘরগুলো সঠিকভাবে পূরণ করুন।',
        'Please complete the highlighted required fields.'
      )
    );
  };

  const submitting = submittingPublic || submittingAdmin;

  return (
    <div className="space-y-5">
      {/* Prefill Notice when Converting Online Application in Admin */}
      {prefillApplication && mode === 'admin' && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-primary/30 bg-primary/5 text-base">
          <div>
            <p className="font-semibold text-foreground text-base">
              {pick(
                `অনলাইন আবেদন (${prefillApplication.applicationNumber}) থেকে ভর্তি প্রক্রিয়াকরণ`,
                `Processing Admission from Online Application (${prefillApplication.applicationNumber})`
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pick(
                'আবেদনকারীর তথ্য প্রি-ফিল করা আছে। প্রয়োজনে সংশোধন করে ধাপ ৪-এ শাখা ও রোল নিশ্চিত করুন।',
                'Applicant data is pre-filled. Review any step, then confirm section & roll in Step 4.'
              )}
            </p>
          </div>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-10 px-4 text-sm font-semibold"
              onClick={onCancel}
            >
              {pick('ইনবক্সে ফিরুন', 'Back to Inbox')}
            </Button>
          )}
        </div>
      )}

      {/* Official Single-Container Institutional Form Frame */}
      <div className="border border-border/80 rounded-3xl bg-surface overflow-hidden shadow-[0_2px_16px_-4px_rgba(28,100,64,0.08)]">
        {/* Crisp Official Top Step Navigation Bar */}
        <nav
          aria-label={pick('ভর্তি ফরমের ধাপসমূহ', 'Admission Form Steps')}
          className="grid grid-cols-2 lg:grid-cols-4 border-b border-border/80 bg-surface-muted/30 divide-y lg:divide-y-0 divide-x divide-border/80"
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
                className={`relative flex items-center gap-3 px-5 py-4 text-left transition-colors duration-150 ${
                  isCurrent
                    ? 'bg-surface text-foreground font-semibold shadow-xs'
                    : isCompleted
                      ? 'bg-surface-muted/20 text-foreground hover:bg-surface cursor-pointer'
                      : clickable
                        ? 'text-foreground/80 hover:bg-surface cursor-pointer'
                        : 'text-muted-foreground/60 cursor-not-allowed'
                }`}
              >
                {isCurrent && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1 bg-primary rounded-t-full"
                  />
                )}
                <span
                  className={`w-8 h-8 rounded-xl text-sm font-bold flex items-center justify-center shrink-0 tabular-nums transition-colors ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                      : isCompleted
                        ? 'bg-primary/15 text-primary'
                        : 'bg-surface border border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : formatNumber(s.num, locale)}
                </span>
                <span className="text-base font-semibold truncate">{s.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Form Body */}
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} noValidate>
          <div className="p-6 sm:p-8 space-y-7">
            {(duplicates.birthCertConflict || duplicates.boardRegConflict) && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-destructive/40 bg-destructive/5 text-sm text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
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
              <StepFinalAdmin
                form={form}
                db={db}
                onJumpToStep={(target) => setStep(target)}
              />
            )}

            {/* Formal Footer Action Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border">
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-11 px-4 text-sm font-semibold"
                  disabled={step === 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {pick('পূর্ববর্তী ধাপ', 'Previous')}
                </Button>
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl h-11 px-4 text-sm font-semibold"
                    onClick={onCancel}
                  >
                    {pick('বাতিল', 'Cancel')}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3.5">
                <span className="text-sm text-muted-foreground font-medium tabular-nums hidden sm:inline">
                  {pick(
                    `ধাপ ${formatNumber(step, locale)} / ৪`,
                    `Step ${step} of 4`
                  )}
                </span>

                {step < 4 ? (
                  <Button
                    type="button"
                    variant="primary"
                    className="rounded-xl h-11 px-5 text-base font-semibold shadow-sm"
                    onClick={handleNext}
                  >
                    {pick('পরবর্তী ধাপ', 'Next Step')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    className="rounded-xl h-11 px-6 text-base font-semibold shadow-sm"
                    disabled={submitting}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {submitting
                      ? pick('সংরক্ষণ হচ্ছে...', 'Submitting...')
                      : mode === 'public'
                        ? pick('আবেদন চূড়ান্ত জমা দিন', 'Submit Application')
                        : pick('ভর্তি নিশ্চিত করুন', 'Confirm Admission')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
