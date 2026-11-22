'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle, BookOpen, GraduationCap, Info } from 'lucide-react';
import { FormField, Input, Select } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import type { MockDatabase } from '@/src/mocks/seed';
import type { AdmissionType } from '@/src/types/proposed/future';
import {
  ADMISSION_TYPE_META,
  AdmissionFormMode,
  cleanNumericInput,
  getClassAdmissionRules,
  getNextSuggestedRoll,
  getOptionalSubjectsForClassGroup,
} from '../rules';
import type { UnifiedAdmissionFormValues } from '../schema';

interface StepClassAndAcademicProps {
  form: UseFormReturn<UnifiedAdmissionFormValues>;
  db: MockDatabase;
  mode: AdmissionFormMode;
  boardRegDuplicate?: string;
}

export function StepClassAndAcademic({
  form,
  db,
  mode,
  boardRegDuplicate,
}: StepClassAndAcademicProps) {
  const { locale, pick } = useI18n();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const targetClassId = watch('targetClassId');
  const admissionType = watch('admissionType');
  const targetGroupId = watch('targetGroupId');
  const academicYearId = watch('academicYearId');

  // Filter classes: in public mode respect optional publicOpenClassIds config; in admin mode show all Classes 6-10
  const openClassIds = db.admissionContent.publicOpenClassIds;
  const availableClasses = db.classes
    .filter((c) => c.isActive)
    .filter((c) =>
      mode === 'admin' || !openClassIds?.length ? true : openClassIds.includes(c.id)
    )
    .sort((a, b) => a.numericValue - b.numericValue);

  const selectedClass =
    db.classes.find((c) => c.id === targetClassId) ?? availableClasses[0];
  const numericClass = selectedClass?.numericValue ?? 6;
  const rules = getClassAdmissionRules(numericClass);

  const classSections = db.sections.filter(
    (s) => s.classId === targetClassId && s.isActive
  );
  const optionalSubjects = rules.requiresOptionalSubject
    ? getOptionalSubjectsForClassGroup(
        db,
        targetClassId,
        targetGroupId || null,
        academicYearId
      )
    : [];

  const handleClassChange = (newClassId: string) => {
    const nextCls = db.classes.find((c) => c.id === newClassId);
    const nextRules = getClassAdmissionRules(nextCls?.numericValue ?? 6);
    setValue('targetClassId', newClassId, { shouldValidate: true });

    // Enforce valid admission type (e.g. Class 10 cannot be NEW)
    if (!nextRules.allowedAdmissionTypes.includes(admissionType)) {
      setValue('admissionType', nextRules.defaultAdmissionType, {
        shouldValidate: true,
      });
    }

    // Update default previous class label
    setValue('previousClass', nextRules.defaultPreviousClassBn);

    // Clear group / 4th subject if moving to Class 6-8
    if (!nextRules.requiresGroup) {
      setValue('targetGroupId', '');
      setValue('optionalClassSubjectId', '');
    } else if (!targetGroupId && db.academicGroups[0]) {
      setValue('targetGroupId', db.academicGroups[0].id);
      const nextOpts = getOptionalSubjectsForClassGroup(
        db,
        newClassId,
        db.academicGroups[0].id,
        academicYearId
      );
      setValue('optionalClassSubjectId', nextOpts[0]?.classSubjectId ?? '');
    }

    // Update section & suggested roll for admin mode
    const firstSec = db.sections.find((s) => s.classId === newClassId && s.isActive);
    setValue('preferredSection', firstSec?.name ?? '');
    if (mode === 'admin' && firstSec) {
      setValue('sectionId', firstSec.id);
      setValue(
        'roll',
        String(getNextSuggestedRoll(db, academicYearId, firstSec.id))
      );
    }

    if (nextCls?.numericValue === 10 && !watch('boardRegistrationSession')) {
      setValue('boardRegistrationSession', '2025-26');
    }
  };

  const handleGroupChange = (newGroupId: string) => {
    setValue('targetGroupId', newGroupId, { shouldValidate: true });
    const opts = getOptionalSubjectsForClassGroup(
      db,
      targetClassId,
      newGroupId,
      academicYearId
    );
    setValue('optionalClassSubjectId', opts[0]?.classSubjectId ?? '', {
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-7">
      {/* 1. Target Class Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary shrink-0" />
            {pick('১. ভর্তিচ্ছু শ্রেণি নির্বাচন করুন (৬ষ্ঠ – ১০ম)', '1. Select Target Class (Classes 6–10)')}
          </h3>
          <span className="text-xs text-muted-foreground">
            {pick('শ্রেণি অনুযায়ী ফরমের নিয়ম স্বয়ংক্রিয়ভাবে নির্ধারিত হবে', 'Form rules adapt automatically by class')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {availableClasses.map((cls) => {
            const active = cls.id === targetClassId;
            const clsRules = getClassAdmissionRules(cls.numericValue);
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => handleClassChange(cls.id)}
                className={`p-3 rounded-[var(--radius)] border text-left transition-colors duration-150 cursor-pointer ${
                  active
                    ? 'border-primary bg-primary/8 text-foreground ring-1 ring-primary/30'
                    : 'border-border bg-surface text-foreground hover:bg-surface-muted/60'
                }`}
              >
                <div className="text-sm font-bold leading-snug">
                  {locale === 'bn' ? cls.nameBn || cls.name : cls.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {clsRules.isTransferOrReadmissionOnly
                    ? pick('বোর্ড e-TC / পুনঃভর্তি', 'Board e-TC / Readmit')
                    : clsRules.requiresGroup
                      ? pick('বিভাগ ও ৪র্থ বিষয়সহ', 'Stream & 4th Subject')
                      : pick('সাধারণ মাধ্যমিক', 'General Secondary')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Policy Notice Strip */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-[var(--radius)] border border-border bg-surface-muted/50 text-sm text-foreground/90">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {locale === 'bn' ? rules.policyNoteBn : rules.policyNoteEn}
          </p>
        </div>
      </div>

      {/* 2. Admission Type + Stream & 4th Subject (Class 9-10) */}
      <div className="pt-5 border-t border-border space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {pick('ভর্তির ধরন', 'Admission Type')}
            <span className="text-destructive ml-1">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(['NEW', 'TRANSFER', 'READMISSION'] as AdmissionType[]).map((type) => {
              const allowed = rules.allowedAdmissionTypes.includes(type);
              const active = admissionType === type;
              const meta = ADMISSION_TYPE_META[type];
              return (
                <button
                  key={type}
                  type="button"
                  disabled={!allowed}
                  onClick={() =>
                    setValue('admissionType', type, { shouldValidate: true })
                  }
                  className={`p-3 rounded-[var(--radius)] border text-left transition-colors duration-150 ${
                    !allowed
                      ? 'border-border/60 bg-surface-muted/30 text-muted-foreground/50 cursor-not-allowed'
                      : active
                        ? 'border-primary bg-primary/8 text-foreground ring-1 ring-primary/30 cursor-pointer'
                        : 'border-border bg-surface text-foreground hover:bg-surface-muted/50 cursor-pointer'
                  }`}
                >
                  <div className="text-sm font-semibold">
                    {locale === 'bn' ? meta.bn : meta.en}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {!allowed
                      ? pick('১০ম শ্রেণিতে প্রযোজ্য নয়', 'Not eligible for Class 10')
                      : locale === 'bn'
                        ? meta.descBn
                        : meta.descEn}
                  </div>
                </button>
              );
            })}
          </div>
          {errors.admissionType && (
            <p className="text-sm text-destructive font-medium">
              {errors.admissionType.message}
            </p>
          )}
        </div>

        {/* Conditional Class 9 & 10 Stream + 4th Subject */}
        {rules.requiresGroup && (
          <div className="p-4 sm:p-5 rounded-[var(--radius)] border border-border bg-surface-muted/35 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              {numericClass === 10
                ? pick(
                    'বিভাগ ও ৪র্থ বিষয় (৯ম শ্রেণির বোর্ড রেজিস্ট্রেশন অনুযায়ী)',
                    'Stream & 4th Subject (Matching Class 9 Board Registration)'
                  )
                : pick(
                    '৯ম শ্রেণির বিভাগ ও ৪র্থ (ঐচ্ছিক) বিষয় নির্বাচন',
                    'Class 9 Academic Group & 4th (Optional) Subject'
                  )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label={pick('বিভাগ (Group / Stream)', 'Academic Group')}
                required
                error={errors.targetGroupId?.message}
              >
                <Select
                  value={targetGroupId}
                  onChange={(e) => handleGroupChange(e.target.value)}
                >
                  <option value="">
                    {pick('— বিভাগ নির্বাচন করুন —', '— Select Group —')}
                  </option>
                  {db.academicGroups
                    .filter((g) => g.isActive)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {locale === 'bn' ? g.nameBn || g.name : g.name}
                      </option>
                    ))}
                </Select>
              </FormField>

              <FormField
                label={pick('৪র্থ / ঐচ্ছিক বিষয়', '4th / Optional Subject')}
                required
                hint={
                  !targetGroupId
                    ? pick('প্রথমে বিভাগ নির্বাচন করুন', 'Select an academic group first')
                    : undefined
                }
                error={errors.optionalClassSubjectId?.message}
              >
                <Select
                  {...register('optionalClassSubjectId')}
                  disabled={!targetGroupId}
                >
                  <option value="">
                    {pick('— ৪র্থ বিষয় নির্বাচন করুন —', '— Select 4th Subject —')}
                  </option>
                  {optionalSubjects.map((opt) => (
                    <option key={opt.classSubjectId} value={opt.classSubjectId}>
                      {locale === 'bn' ? opt.nameBn : opt.nameEn}
                      {opt.officialCode ? ` (${opt.officialCode})` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>
        )}

        {/* Preferred Section (Public only — Admin sets official section in Step 4) */}
        {mode === 'public' && classSections.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label={pick('পছন্দের শাখা (ঐচ্ছিক)', 'Preferred Section (Optional)')}
              hint={pick(
                'চূড়ান্ত শাখা বিদ্যালয় কর্তৃপক্ষ আসন সাপেক্ষে নির্ধারণ করবে',
                'Final section is assigned by school office based on seat capacity'
              )}
            >
              <Select {...register('preferredSection')}>
                <option value="">{pick('যেকোনো শাখা', 'Any Available Section')}</option>
                {classSections.map((sec) => (
                  <option key={sec.id} value={sec.name}>
                    {pick(`শাখা ${sec.name}`, `Section ${sec.name}`)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        )}
      </div>

      {/* 3. Previous Academic Record, TC & Board Registration */}
      <div className="pt-5 border-t border-border space-y-4">
        <h4 className="text-sm font-semibold text-foreground">
          {pick(
            'পূর্ববর্তী বিদ্যালয় ও একাডেমিক তথ্য',
            'Previous School & Academic Records'
          )}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={
              locale === 'bn'
                ? rules.previousSchoolLabelBn
                : rules.previousSchoolLabelEn
            }
            required={admissionType !== 'READMISSION'}
            error={errors.previousSchoolName?.message}
          >
            <Input
              {...register('previousSchoolName')}
              placeholder={
                numericClass === 6
                  ? 'যেমন: ভোজেশ্বর সরকারি প্রাথমিক বিদ্যালয়'
                  : 'যেমন: নড়িয়া বিহারী লাল সরকারি উচ্চ বিদ্যালয়'
              }
            />
          </FormField>

          {numericClass >= 7 && (
            <FormField
              label={pick('পূর্ববর্তী বিদ্যালয়ের EIIN (যদি জানা থাকে)', 'Previous School EIIN (Optional)')}
              hint={
                numericClass === 10
                  ? pick('বোর্ড e-TC যাচাইয়ের জন্য ৬ ডিজিটের EIIN', '6-digit EIIN for Board e-TC verification')
                  : undefined
              }
            >
              <Input
                value={watch('previousSchoolEiin')}
                inputMode="numeric"
                maxLength={6}
                onChange={(e) =>
                  setValue('previousSchoolEiin', cleanNumericInput(e.target.value, 6))
                }
                placeholder="যেমন: 113587"
                className="font-mono tabular-nums"
              />
            </FormField>
          )}

          <FormField
            label={pick('পূর্ববর্তী শ্রেণি', 'Previous Class')}
          >
            <Input
              {...register('previousClass')}
              placeholder={rules.defaultPreviousClassBn}
            />
          </FormField>

          <FormField
            label={pick('সর্বশেষ বার্ষিক পরীক্ষার ফলাফল / গ্রেড', 'Last Annual Exam Result / Grade')}
            error={errors.previousGrade?.message}
          >
            <Input
              {...register('previousGrade')}
              placeholder={pick('যেমন: A+ / ১ম স্থান / উত্তীর্ণ', 'e.g. A+ / 1st Position / Passed')}
            />
          </FormField>

          <FormField
            label={pick('পাসের শিক্ষাবর্ষ', 'Passing Year')}
          >
            <Input
              value={watch('prevExamPassingYear')}
              inputMode="numeric"
              maxLength={4}
              onChange={(e) =>
                setValue('prevExamPassingYear', cleanNumericInput(e.target.value, 4))
              }
              placeholder="2026"
              className="font-mono tabular-nums"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={pick('পূর্ববর্তী রোল নং', 'Previous Roll')}>
              <Input
                {...register('prevExamRoll')}
                placeholder="যেমন: 12"
                className="font-mono tabular-nums"
              />
            </FormField>
            <FormField
              label={pick('জিপিএ (যদি থাকে)', 'GPA (Optional)')}
              error={errors.prevExamGpa?.message}
            >
              <Input
                {...register('prevExamGpa')}
                inputMode="decimal"
                placeholder="5.00"
                className="font-mono tabular-nums"
              />
            </FormField>
          </div>
        </div>

        {/* Conditional TC / e-TC Fields (When TRANSFER or Class 10) */}
        {(admissionType === 'TRANSFER' || numericClass === 10) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/70">
            <FormField
              label={
                numericClass === 10
                  ? pick('বোর্ড e-TC / ছাড়পত্র নম্বর', 'Board e-TC Order / TC Number')
                  : pick('ছাড়পত্র (TC) নম্বর', 'Transfer Certificate (TC) Number')
              }
              required={admissionType === 'TRANSFER' && numericClass >= 7}
              error={errors.transferCertificateNo?.message}
            >
              <Input
                {...register('transferCertificateNo')}
                placeholder={
                  numericClass === 10
                    ? 'যেমন: ETC-2026-44129'
                    : 'যেমন: TC-2026-084'
                }
                className="font-mono tabular-nums"
              />
            </FormField>

            <FormField
              label={pick('ছাড়পত্র ইস্যুর তারিখ', 'TC Issue Date')}
            >
              <Input type="date" {...register('transferCertificateDate')} />
            </FormField>
          </div>
        )}

        {/* Conditional Board Registration Fields (Class 9 optional, Class 10 MANDATORY) */}
        {rules.showBoardRegistration && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/70">
            <FormField
              label={
                numericClass === 10
                  ? pick('৯ম শ্রেণির এসএসসি বোর্ড রেজিস্ট্রেশন নম্বর', 'Class 9 SSC Board Registration No')
                  : pick('বোর্ড রেজিস্ট্রেশন নম্বর (থাকলে)', 'Board Registration No (If Already Issued)')
              }
              required={rules.requiresBoardRegistration}
              error={errors.boardRegistrationNo?.message || boardRegDuplicate}
            >
              <Input
                value={watch('boardRegistrationNo')}
                inputMode="numeric"
                maxLength={14}
                onChange={(e) =>
                  setValue(
                    'boardRegistrationNo',
                    cleanNumericInput(e.target.value, 14),
                    { shouldValidate: true }
                  )
                }
                placeholder="যেমন: 2110548790"
                className="font-mono tabular-nums"
              />
            </FormField>

            <FormField
              label={pick('বোর্ড রেজিস্ট্রেশন সেশন', 'Board Registration Session')}
            >
              <Input
                {...register('boardRegistrationSession')}
                placeholder="যেমন: 2025-26"
                className="font-mono tabular-nums"
              />
            </FormField>

            {boardRegDuplicate && (
              <div className="sm:col-span-2 flex items-start gap-2 p-3 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{boardRegDuplicate}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
