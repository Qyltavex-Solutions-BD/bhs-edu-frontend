'use client';

import React, { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import type { MockDatabase } from '@/src/mocks/seed';
import {
  cleanNumericInput,
  getNextSuggestedRoll,
  getRequiredDocumentChecklist,
} from '../rules';
import type { UnifiedAdmissionFormValues } from '../schema';
import {
  AdmissionField,
  AdmissionInput,
  AdmissionSectionHeader,
  AdmissionSelect,
} from './AdmissionFormPrimitives';
import { AdmissionFormPreviewSheet } from './AdmissionFormPreviewSheet';

interface StepFinalAdminProps {
  form: UseFormReturn<UnifiedAdmissionFormValues>;
  db: MockDatabase;
  onJumpToStep?: (step: 1 | 2 | 3) => void;
}

export function StepFinalAdmin({ form, db, onJumpToStep }: StepFinalAdminProps) {
  const { locale, pick } = useI18n();
  const [showFullPreview, setShowFullPreview] = useState(false);

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const values = watch();
  const academicYearId = values.academicYearId;
  const targetClassId = values.targetClassId;
  const sectionId = values.sectionId;
  const roll = values.roll;
  const admissionType = values.admissionType;
  const verifiedDocuments = values.verifiedDocuments || {};

  const selectedClass = db.classes.find((c) => c.id === targetClassId);
  const numericClass = selectedClass?.numericValue ?? 6;
  const classSections = db.sections.filter(
    (s) => s.classId === targetClassId && s.isActive
  );
  const hasDeceasedParent = !values.fatherAlive || !values.motherAlive;
  const checklist = getRequiredDocumentChecklist(
    numericClass,
    admissionType,
    hasDeceasedParent
  );

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
    <div className="space-y-7">
      {/* 1. Office Placement (Academic Year, Section, Roll, Form Serial, Fee Receipt) */}
      <div className="space-y-4">
        <AdmissionSectionHeader
          title={pick('১. অফিসিয়াল ভর্তি প্লেসমেন্ট ও রসিদ তথ্য', '1. Official Placement & Receipt Details')}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowFullPreview((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              {showFullPreview
                ? pick('পূর্ণাঙ্গ ফর্ম প্রিভিউ লুকান', 'Hide Full Form Preview')
                : pick('পূর্ণাঙ্গ ফর্ম প্রিভিউ দেখুন', 'Review Full Application Form')}
              {showFullPreview ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          }
        />

        {showFullPreview && (
          <div className="pb-2">
            <AdmissionFormPreviewSheet
              values={values}
              db={db}
              mode="admin"
              onJumpToStep={onJumpToStep}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdmissionField
            label={pick('শিক্ষাবর্ষ', 'Academic Year')}
            required
            error={errors.academicYearId?.message}
          >
            <AdmissionSelect
              value={academicYearId}
              onChange={(e) => handleYearOrSectionChange(e.target.value, sectionId)}
            >
              {db.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isActive ? pick('(চলমান)', '(Active)') : ''}
                </option>
              ))}
            </AdmissionSelect>
          </AdmissionField>

          <AdmissionField
            label={pick('শাখা (Section)', 'Section')}
            required
            error={errors.sectionId?.message}
          >
            <AdmissionSelect
              value={sectionId}
              onChange={(e) => handleYearOrSectionChange(academicYearId, e.target.value)}
            >
              <option value="">{pick('নির্বাচন করুন', 'Select Section')}</option>
              {classSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {pick(`শাখা ${sec.name}`, `Section ${sec.name}`)}
                </option>
              ))}
            </AdmissionSelect>
          </AdmissionField>

          <AdmissionField
            label={pick('শ্রেণি রোল নম্বর', 'Class Roll Number')}
            required
            error={
              errors.roll?.message ||
              (rollConflict
                ? pick(
                    `এই শাখায় রোল ${roll} ইতোমধ্যে ব্যবহৃত হয়েছে।`,
                    `Roll ${roll} is already assigned in this section.`
                  )
                : undefined)
            }
          >
            <div className="flex items-center gap-2">
              <AdmissionInput
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
                className="rounded-[4px] h-10 px-3 text-xs tabular-nums"
                onClick={() =>
                  setValue('roll', String(suggestedRoll), { shouldValidate: true })
                }
              >
                {pick(`পরবর্তী (${suggestedRoll})`, `Next (${suggestedRoll})`)}
              </Button>
            </div>
            {!rollConflict && rollNumber > 0 && (
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {pick('রোল নম্বরটি খালি রয়েছে', 'Roll number available')}
              </p>
            )}
          </AdmissionField>

          <AdmissionField
            label={pick('ভর্তি ফরম সিরিয়াল নং (ঐচ্ছিক)', 'Admission Form Serial No (Optional)')}
          >
            <AdmissionInput
              {...register('formSerialNo')}
              placeholder="যেমন: BHS-2026-0142"
              className="font-mono tabular-nums"
            />
          </AdmissionField>

          <AdmissionField
            label={pick('জমাকৃত ভর্তি ফি (টাকা — ঐচ্ছিক)', 'Admission Fee Deposited (BDT — Optional)')}
          >
            <AdmissionInput
              value={watch('admissionFeePaid')}
              inputMode="numeric"
              onChange={(e) =>
                setValue('admissionFeePaid', cleanNumericInput(e.target.value, 6))
              }
              placeholder="যেমন: 1200"
              className="font-mono tabular-nums"
            />
          </AdmissionField>

          <AdmissionField
            label={pick('ফি রসিদ নম্বর (ঐচ্ছিক)', 'Fee Receipt No (Optional)')}
          >
            <AdmissionInput
              {...register('receiptNo')}
              placeholder="যেমন: RCP-0921"
              className="font-mono tabular-nums"
            />
          </AdmissionField>
        </div>

        <AdmissionField label={pick('অফিস মন্তব্য (ঐচ্ছিক)', 'Office Remarks (Optional)')}>
          <AdmissionInput
            {...register('remarks')}
            placeholder={pick(
              'যেমন: মূল জন্ম নিবন্ধন ও ছাড়পত্র যাচাই সম্পন্ন',
              'e.g. Original birth certificate and TC verified'
            )}
          />
        </AdmissionField>
      </div>

      {/* 2. Physical Document Verification Checklist */}
      <div className="space-y-3.5">
        <AdmissionSectionHeader
          title={pick('২. মূল কাগজপত্র যাচাই তালিকা', '2. Physical Document Verification Checklist')}
          rightSlot={
            <span className="text-xs text-muted-foreground tabular-nums">
              {pick(
                `যাচাইকৃত: ${checkedCount} / ${checklist.length}`,
                `Verified: ${checkedCount} / ${checklist.length}`
              )}
            </span>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {checklist.map((item) => {
            const checked = Boolean(verifiedDocuments[item.key]);
            return (
              <label
                key={item.key}
                className={`flex items-start gap-2.5 px-3 py-2.5 rounded-[4px] border text-sm cursor-pointer transition-colors ${
                  checked
                    ? 'border-primary/45 bg-primary/5 text-foreground'
                    : 'border-border bg-surface text-foreground/90 hover:bg-surface-muted/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDoc(item.key)}
                  className="w-4 h-4 mt-0.5 rounded-[3px] accent-primary shrink-0"
                />
                <span className="text-xs sm:text-sm leading-snug">
                  {locale === 'bn' ? item.labelBn : item.labelEn}
                </span>
              </label>
            );
          })}
        </div>

        {checkedCount < checklist.length && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              {pick(
                'কোনো কাগজ বাকি থাকলেও ভর্তি সম্পন্ন করা যাবে—বাকি কাগজপত্র শিক্ষার্থীর রেকর্ডে সংরক্ষিত থাকবে।',
                'Admission can proceed with pending documents; missing items remain tracked on the student record.'
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
