'use client';

import React, { useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/src/components/ui/primitives';
import { useGetNextSuggestedRollQuery } from '@/src/features/students/api/students.api';
import {
  type AdmissionCatalogData,
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
  db: AdmissionCatalogData;
  onJumpToStep?: (step: 1 | 2 | 3) => void;
}

export function StepFinalAdmin({ form, db, onJumpToStep }: StepFinalAdminProps) {
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

  const { data: nextRollData } = useGetNextSuggestedRollQuery(
    { academicYearId, sectionId },
    { skip: !academicYearId || !sectionId }
  );

  const suggestedRoll =
    nextRollData?.nextRoll ?? getNextSuggestedRoll(db, academicYearId, sectionId);
  const rollNumber = Number(roll);
  const rollConflict =
    Boolean(sectionId && academicYearId && rollNumber > 0) &&
    (nextRollData
      ? nextRollData.usedRolls.includes(rollNumber)
      : (db.enrollments ?? []).some(
          (e) =>
            e.academicYearId === academicYearId &&
            e.sectionId === sectionId &&
            e.roll === rollNumber
        ));

  useEffect(() => {
    if (nextRollData?.nextRoll && !roll) {
      setValue('roll', String(nextRollData.nextRoll), { shouldValidate: true });
    }
  }, [nextRollData?.nextRoll, roll, setValue]);

  const handleYearOrSectionChange = (nextYearId: string, nextSectionId: string) => {
    setValue('academicYearId', nextYearId, { shouldValidate: true });
    setValue('sectionId', nextSectionId, { shouldValidate: true });
    if (nextYearId && nextSectionId) {
      setValue('roll', '', { shouldValidate: false });
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
          title={'১. অফিসিয়াল ভর্তি প্লেসমেন্ট ও রসিদ তথ্য'}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowFullPreview((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline cursor-pointer"
            >
              {showFullPreview
                ? 'পূর্ণাঙ্গ ফর্ম প্রিভিউ লুকান'
                : 'পূর্ণাঙ্গ ফর্ম প্রিভিউ দেখুন'}
              {showFullPreview ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
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
            label={'শিক্ষাবর্ষ'}
            required
            error={errors.academicYearId?.message}
          >
            <AdmissionSelect
              value={academicYearId}
              onChange={(e) => handleYearOrSectionChange(e.target.value, sectionId)}
            >
              {db.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isActive ? '(চলমান)' : ''}
                </option>
              ))}
            </AdmissionSelect>
          </AdmissionField>

          <AdmissionField
            label={'শাখা (Section)'}
            required
            error={errors.sectionId?.message}
          >
            <AdmissionSelect
              value={sectionId}
              onChange={(e) => handleYearOrSectionChange(academicYearId, e.target.value)}
            >
              <option value="">{'নির্বাচন করুন'}</option>
              {classSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {`শাখা ${sec.name}`}
                </option>
              ))}
            </AdmissionSelect>
          </AdmissionField>

          <AdmissionField
            label={'শ্রেণি রোল নম্বর'}
            required
            error={
              errors.roll?.message ||
              (rollConflict
                ? `এই শাখায় রোল ${roll} ইতোমধ্যে ব্যবহৃত হয়েছে।`
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
                className="rounded-xl h-11 px-3.5 text-sm font-semibold tabular-nums shrink-0"
                onClick={() =>
                  setValue('roll', String(suggestedRoll), { shouldValidate: true })
                }
              >
                {`পরবর্তী (${suggestedRoll})`}
              </Button>
            </div>
            {!rollConflict && rollNumber > 0 && (
              <p className="text-sm text-success flex items-center gap-1.5 mt-1 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {'রোল নম্বরটি খালি রয়েছে'}
              </p>
            )}
          </AdmissionField>

          <AdmissionField
            label={'ভর্তি ফরম সিরিয়াল নং (ঐচ্ছিক)'}
          >
            <AdmissionInput
              {...register('formSerialNo')}
              placeholder="যেমন: BHS-2026-0142"
              className="font-mono tabular-nums"
            />
          </AdmissionField>

          <AdmissionField
            label={'জমাকৃত ভর্তি ফি (টাকা — ঐচ্ছিক)'}
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
            label={'ফি রসিদ নম্বর (ঐচ্ছিক)'}
          >
            <AdmissionInput
              {...register('receiptNo')}
              placeholder="যেমন: RCP-0921"
              className="font-mono tabular-nums"
            />
          </AdmissionField>
        </div>

        <AdmissionField label={'অফিস মন্তব্য (ঐচ্ছিক)'}>
          <AdmissionInput
            {...register('remarks')}
            placeholder={'যেমন: মূল জন্ম নিবন্ধন ও ছাড়পত্র যাচাই সম্পন্ন'}
          />
        </AdmissionField>
      </div>

      {/* 2. Physical Document Verification Checklist */}
      <div className="space-y-3.5">
        <AdmissionSectionHeader
          title={'২. মূল কাগজপত্র যাচাই তালিকা'}
          rightSlot={
            <span className="text-sm text-muted-foreground tabular-nums">
              {`যাচাইকৃত: ${checkedCount} / ${checklist.length}`}
            </span>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checklist.map((item) => {
            const checked = Boolean(verifiedDocuments[item.key]);
            return (
              <label
                key={item.key}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-base cursor-pointer transition-colors ${
                  checked
                    ? 'border-primary/50 bg-primary/5 text-foreground ring-1 ring-primary/30'
                    : 'border-border/80 bg-surface text-foreground/90 hover:bg-surface-muted/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDoc(item.key)}
                  className="w-5 h-5 mt-0.5 rounded-md accent-primary shrink-0 cursor-pointer"
                />
                <span className="text-sm sm:text-base leading-snug">
                  {item.labelBn}
                </span>
              </label>
            );
          })}
        </div>

        {checkedCount < checklist.length && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              {'কোনো কাগজ বাকি থাকলেও ভর্তি সম্পন্ন করা যাবে—বাকি কাগজপত্র শিক্ষার্থীর রেকর্ডে সংরক্ষিত থাকবে।'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
