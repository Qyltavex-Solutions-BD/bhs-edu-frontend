'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle, Building2, CheckCircle2, ClipboardCheck, Sparkles } from 'lucide-react';
import { Button, FormField, Input, Select } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import type { MockDatabase } from '@/src/mocks/seed';
import {
  cleanNumericInput,
  getNextSuggestedRoll,
  getRequiredDocumentChecklist,
} from '../rules';
import type { UnifiedAdmissionFormValues } from '../schema';

interface StepFinalAdminProps {
  form: UseFormReturn<UnifiedAdmissionFormValues>;
  db: MockDatabase;
}

export function StepFinalAdmin({ form, db }: StepFinalAdminProps) {
  const { locale, pick } = useI18n();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const academicYearId = watch('academicYearId');
  const targetClassId = watch('targetClassId');
  const sectionId = watch('sectionId');
  const roll = watch('roll');
  const admissionType = watch('admissionType');
  const verifiedDocuments = watch('verifiedDocuments') || {};

  const selectedClass = db.classes.find((c) => c.id === targetClassId);
  const numericClass = selectedClass?.numericValue ?? 6;
  const classSections = db.sections.filter(
    (s) => s.classId === targetClassId && s.isActive
  );
  const checklist = getRequiredDocumentChecklist(numericClass, admissionType);

  const suggestedRoll = getNextSuggestedRoll(db, academicYearId, sectionId);
  const rollNumber = Number(roll);
  const rollConflict =
    Boolean(sectionId && academicYearId && rollNumber > 0) &&
    db.enrollments.some(
      (e) =>
        e.academicYearId === academicYearId &&
        e.sectionId === sectionId &&
        e.roll === rollNumber
    );

  const handleYearOrSectionChange = (nextYearId: string, nextSectionId: string) => {
    setValue('academicYearId', nextYearId, { shouldValidate: true });
    setValue('sectionId', nextSectionId, { shouldValidate: true });
    if (nextYearId && nextSectionId) {
      setValue('roll', String(getNextSuggestedRoll(db, nextYearId, nextSectionId)), {
        shouldValidate: true,
      });
    }
  };

  const toggleDoc = (key: string) => {
    setValue('verifiedDocuments', {
      ...verifiedDocuments,
      [key]: !verifiedDocuments[key],
    });
  };

  const checkedCount = checklist.filter((item) => verifiedDocuments[item.key]).length;

  return (
    <div className="space-y-6">
      {/* 1. Office Placement (Academic Year, Section, Roll, Form Serial, Fee Receipt) */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          {pick(
            'অফিসিয়াল ভর্তি প্লেসমেন্ট (শিক্ষাবর্ষ, শাখা, রোল ও রসিদ)',
            'Official Office Placement (Academic Year, Section, Roll & Receipt)'
          )}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            label={pick('শিক্ষাবর্ষ (Academic Year)', 'Academic Year')}
            required
            error={errors.academicYearId?.message}
          >
            <Select
              value={academicYearId}
              onChange={(e) => handleYearOrSectionChange(e.target.value, sectionId)}
            >
              {db.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isActive ? pick('(চলমান)', '(Active)') : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label={pick('ভর্তির শাখা (Section)', 'Section')}
            required
            error={errors.sectionId?.message}
          >
            <Select
              value={sectionId}
              onChange={(e) => handleYearOrSectionChange(academicYearId, e.target.value)}
            >
              <option value="">{pick('— শাখা বেছে নিন —', '— Choose Section —')}</option>
              {classSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {pick(`শাখা ${sec.name}`, `Section ${sec.name}`)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label={pick('শ্রেণি রোল নম্বর', 'Class Roll Number')}
            required
            error={
              errors.roll?.message ||
              (rollConflict
                ? pick(
                    `এই শাখায় রোল ${roll} ইতোমধ্যে ব্যবহৃত হয়েছে`,
                    `Roll ${roll} is already taken in this section`
                  )
                : undefined)
            }
          >
            <div className="flex items-center gap-2">
              <Input
                value={roll}
                inputMode="numeric"
                onChange={(e) =>
                  setValue('roll', cleanNumericInput(e.target.value, 4), {
                    shouldValidate: true,
                  })
                }
                placeholder={String(suggestedRoll)}
                className="font-mono tabular-nums"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setValue('roll', String(suggestedRoll), { shouldValidate: true })
                }
                title={pick('পরবর্তী খালি রোল বসান', 'Apply next available roll')}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {suggestedRoll}
              </Button>
            </div>
            {!rollConflict && rollNumber > 0 && (
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {pick('রোল নম্বর খালি আছে', 'Roll number is available')}
              </p>
            )}
          </FormField>

          <FormField
            label={pick('ভর্তি ফরম / সিরিয়াল নং (ঐচ্ছিক)', 'Admission Form Serial No (Optional)')}
          >
            <Input
              {...register('formSerialNo')}
              placeholder="যেমন: BHS-2026-0142"
              className="font-mono tabular-nums"
            />
          </FormField>

          <FormField
            label={pick('জমাকৃত ভর্তি ফি (টাকা — ঐচ্ছিক)', 'Admission Fee Deposited (BDT — Optional)')}
          >
            <Input
              value={watch('admissionFeePaid')}
              inputMode="numeric"
              onChange={(e) =>
                setValue('admissionFeePaid', cleanNumericInput(e.target.value, 6))
              }
              placeholder="যেমন: 1200"
              className="font-mono tabular-nums"
            />
          </FormField>

          <FormField
            label={pick('ফি রসিদ নম্বর (ঐচ্ছিক)', 'Fee Receipt Number (Optional)')}
          >
            <Input
              {...register('receiptNo')}
              placeholder="যেমন: RCP-0921"
              className="font-mono tabular-nums"
            />
          </FormField>
        </div>

        <FormField label={pick('অফিস মন্তব্য (ঐচ্ছিক)', 'Office Remarks (Optional)')}>
          <Input
            {...register('remarks')}
            placeholder={pick(
              'যেমন: মূল জন্ম নিবন্ধন ও ছাড়পত্র যাচাই করা হয়েছে',
              'e.g. Original birth certificate and TC verified'
            )}
          />
        </FormField>
      </div>

      {/* 2. Physical Document Verification Checklist (Real-World Office Desk Flow) */}
      <div className="pt-5 border-t border-border space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary shrink-0" />
            {pick(
              'মূল কাগজপত্র যাচাই চেকলিস্ট (অফিস রেকর্ড)',
              'Physical Document Verification Checklist (Office Desk)'
            )}
          </h4>
          <span className="text-xs text-muted-foreground tabular-nums">
            {pick(
              `যাচাইকৃত: ${checkedCount} / ${checklist.length}`,
              `Verified: ${checkedCount} / ${checklist.length}`
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {checklist.map((item) => {
            const checked = Boolean(verifiedDocuments[item.key]);
            return (
              <label
                key={item.key}
                className={`flex items-start gap-2.5 p-3 rounded-[var(--radius)] border text-sm cursor-pointer transition-colors ${
                  checked
                    ? 'border-success/40 bg-success/5 text-foreground'
                    : 'border-border bg-surface text-foreground/90 hover:bg-surface-muted/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDoc(item.key)}
                  className="w-4 h-4 mt-0.5 accent-primary shrink-0"
                />
                <span>{locale === 'bn' ? item.labelBn : item.labelEn}</span>
              </label>
            );
          })}
        </div>

        {checkedCount < checklist.length && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              {pick(
                'কোনো কাগজ বাকি থাকলেও ভর্তি সম্পন্ন করা যাবে—বাকি কাগজপত্র স্টুডেন্ট প্রোফাইলে রেকর্ড থাকবে।',
                'You may complete admission even if a document is pending; missing items stay tracked on the student record.'
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
