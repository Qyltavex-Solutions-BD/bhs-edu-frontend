'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle, Info } from 'lucide-react';
import type { AdmissionType } from '@/src/types/proposed/future';
import {
  type AdmissionCatalogData,
  ADMISSION_TYPE_META,
  AdmissionFormMode,
  cleanDecimalInput,
  cleanNumericInput,
  getClassAdmissionRules,
  getNextSuggestedRoll,
  getOptionalSubjectsForClassGroup,
  gpaToLetterGrade,
} from '../rules';
import type { UnifiedAdmissionFormValues } from '../schema';
import {
  AdmissionField,
  AdmissionInput,
  AdmissionSectionHeader,
  AdmissionSelect,
} from './AdmissionFormPrimitives';

interface StepClassAndAcademicProps {
  form: UseFormReturn<UnifiedAdmissionFormValues>;
  db: AdmissionCatalogData;
  mode: AdmissionFormMode;
  boardRegDuplicate?: string;
}

export function StepClassAndAcademic({
  form,
  db,
  mode,
  boardRegDuplicate,
}: StepClassAndAcademicProps) {
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
  const prevExamGpa = watch('prevExamGpa');

  const openClassIds = db.admissionContent?.publicOpenClassIds;
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

  const optionalSubjects = rules.requiresOptionalSubject
    ? getOptionalSubjectsForClassGroup(
        db,
        targetClassId,
        targetGroupId || null,
        academicYearId
      )
    : [];

  // Show Board Registration for Class 10 always (mandatory), and for Class 9 only on Transfer/Readmission
  const showBoardRegFields =
    numericClass === 10 ||
    (numericClass === 9 && (admissionType === 'TRANSFER' || admissionType === 'READMISSION'));

  const showTcFields = admissionType === 'TRANSFER' && numericClass >= 7;
  const derivedGrade = gpaToLetterGrade(prevExamGpa);

  const handleClassChange = (newClassId: string) => {
    const nextCls = db.classes.find((c) => c.id === newClassId);
    const nextNum = nextCls?.numericValue ?? 6;
    const nextRules = getClassAdmissionRules(nextNum);
    setValue('targetClassId', newClassId, { shouldValidate: true });

    if (nextNum === 10) {
      // Class 10 strictly defaults to Transfer (e-TC)
      setValue('admissionType', 'TRANSFER', { shouldValidate: true });
    } else if (numericClass === 10) {
      // Returning from Class 10 to any lower class (6-9): strictly revert to New Admission default
      setValue('admissionType', nextRules.defaultAdmissionType, {
        shouldValidate: true,
      });
    } else if (!nextRules.allowedAdmissionTypes.includes(admissionType)) {
      setValue('admissionType', nextRules.defaultAdmissionType, {
        shouldValidate: true,
      });
    }

    // Automatically track previous class — no redundant input needed
    setValue('previousClass', nextRules.defaultPreviousClassBn);

    if (!nextRules.showPreviousSchoolEiin) {
      setValue('previousSchoolEiin', '');
    }
    if (!nextRules.showPreviousGpa) {
      setValue('prevExamGpa', '');
      setValue('previousGrade', '');
    }

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

    if (nextNum < 9) {
      setValue('boardRegistrationNo', '');
      setValue('boardRegistrationSession', '');
    } else if (nextNum === 10 && !watch('boardRegistrationSession')) {
      setValue('boardRegistrationSession', '2025-26');
    }

    // Admin official section auto-sync (Public never picks section)
    const firstSec = db.sections.find((s) => s.classId === newClassId && s.isActive);
    if (mode === 'admin' && firstSec) {
      setValue('sectionId', firstSec.id);
      setValue(
        'roll',
        String(getNextSuggestedRoll(db, academicYearId, firstSec.id))
      );
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
      {/* 1. Target Class & Admission Type */}
      <div className="space-y-4">
        <AdmissionSectionHeader
          title={'১. ভর্তিচ্ছু শ্রেণি ও ভর্তির ধরন'}
          subtitle={'ভর্তিচ্ছু শ্রেণি নির্বাচন করুন — শ্রেণি অনুযায়ী আবশ্যক তথ্যসমূহ প্রদর্শিত হবে।'}
        />

        {/* Crisp Segmented Institutional Class Bar */}
        <div className="space-y-2.5">
          <label className="block text-base font-semibold text-foreground">
            {'ভর্তিচ্ছু শ্রেণি'}
            <span className="text-destructive ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {availableClasses.map((cls) => {
              const active = cls.id === targetClassId;
              const clsRules = getClassAdmissionRules(cls.numericValue);
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => handleClassChange(cls.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                      : 'border-border/80 bg-surface text-foreground hover:bg-surface-muted/60'
                  }`}
                >
                  <span className="block text-base font-bold leading-tight">
                    {cls.nameBn || cls.name}
                  </span>
                  <span
                    className={`block text-sm mt-1 leading-tight ${
                      active ? 'text-primary-foreground/90' : 'text-muted-foreground'
                    }`}
                  >
                    {clsRules.isTransferOrReadmissionOnly
                      ? 'বোর্ড e-TC / পুনঃভর্তি'
                      : clsRules.requiresGroup
                        ? 'বিভাগ ও ৪র্থ বিষয়'
                        : 'সাধারণ শাখা'}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.targetClassId && (
            <p className="text-sm text-destructive font-medium">
              {errors.targetClassId.message}
            </p>
          )}
        </div>

        {/* Concise Institutional Policy Strip */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-primary/20 bg-primary/5 text-sm text-foreground/90">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {rules.policyNoteBn}
          </p>
        </div>

        {/* Admission Type Inline Radio Controls */}
        <div className="space-y-2.5">
          <label className="block text-base font-semibold text-foreground">
            {'ভর্তির ধরন'}
            <span className="text-destructive ml-1">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-150 ${
                    !allowed
                      ? 'border-border/50 bg-surface-muted/20 text-muted-foreground/50 cursor-not-allowed'
                      : active
                        ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary cursor-pointer shadow-xs'
                        : 'border-border/80 bg-surface text-foreground hover:bg-surface-muted/50 cursor-pointer'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      active ? 'border-primary' : 'border-muted-foreground/40'
                    }`}
                  >
                    {active && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold leading-tight">
                      {meta.bn}
                    </span>
                    <span className="block text-sm text-muted-foreground mt-1 leading-snug">
                      {!allowed
                        ? numericClass === 6
                          ? '৬ষ্ঠ শ্রেণিতে প্রযোজ্য নয়'
                          : numericClass === 10
                            ? '১০ম শ্রেণিতে প্রযোজ্য নয়'
                            : 'এই শ্রেণিতে প্রযোজ্য নয়'
                        : meta.descBn}
                    </span>
                  </span>
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

        {/* Conditional Stream & 4th Subject (Classes 9 & 10) */}
        {rules.requiresGroup && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <AdmissionField
              label={'বিভাগ (Group)'}
              required
              error={errors.targetGroupId?.message}
            >
              <AdmissionSelect
                value={targetGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
              >
                <option value="">{'নির্বাচন করুন'}</option>
                {db.academicGroups
                  .filter((g) => g.isActive)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nameBn || g.name}
                    </option>
                  ))}
              </AdmissionSelect>
            </AdmissionField>

            <AdmissionField
              label={'৪র্থ / ঐচ্ছিক বিষয়'}
              required
              hint={
                !targetGroupId
                  ? 'প্রথমে বিভাগ নির্বাচন করুন।'
                  : undefined
              }
              error={errors.optionalClassSubjectId?.message}
            >
              <AdmissionSelect
                {...register('optionalClassSubjectId')}
                disabled={!targetGroupId}
              >
                <option value="">
                  {'নির্বাচন করুন'}
                </option>
                {optionalSubjects.map((opt) => (
                  <option key={opt.classSubjectId} value={opt.classSubjectId}>
                    {opt.nameBn}
                    {opt.officialCode ? ` (${opt.officialCode})` : ''}
                  </option>
                ))}
              </AdmissionSelect>
            </AdmissionField>
          </div>
        )}
      </div>

      {/* 2. Previous School & Annual Exam Record */}
      <div className="space-y-4">
        <AdmissionSectionHeader
          title={`২. পূর্ববর্তী বিদ্যালয় ও ${rules.defaultPreviousClassBn}-এর তথ্য`}
        />

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            rules.showPreviousGpa ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
          } gap-4`}
        >
          <AdmissionField
            label={
              rules.previousSchoolLabelBn
            }
            required={admissionType !== 'READMISSION'}
            error={errors.previousSchoolName?.message}
            className={
              rules.showPreviousSchoolEiin
                ? 'sm:col-span-2'
                : 'sm:col-span-2'
            }
          >
            <AdmissionInput
              {...register('previousSchoolName')}
              placeholder={
                numericClass === 6
                  ? 'যেমন: ভোজেশ্বর সরকারি প্রাথমিক বিদ্যালয়'
                  : 'যেমন: নড়িয়া বিহারী লাল সরকারি উচ্চ বিদ্যালয়'
              }
            />
          </AdmissionField>

          {rules.showPreviousSchoolEiin && (
            <AdmissionField
              label={'বিদ্যালয়ের EIIN (ঐচ্ছিক)'}
              error={errors.previousSchoolEiin?.message}
            >
              <AdmissionInput
                value={watch('previousSchoolEiin')}
                inputMode="numeric"
                maxLength={6}
                onChange={(e) =>
                  setValue('previousSchoolEiin', cleanNumericInput(e.target.value, 6), {
                    shouldValidate: true,
                  })
                }
                placeholder="৬ ডিজিট (যেমন: 113587)"
                className="font-mono tabular-nums"
              />
            </AdmissionField>
          )}

          <AdmissionField
            label={`${rules.defaultPreviousClassBn} পাসের সন`}
          >
            <AdmissionInput
              value={watch('prevExamPassingYear')}
              inputMode="numeric"
              maxLength={4}
              onChange={(e) =>
                setValue('prevExamPassingYear', cleanNumericInput(e.target.value, 4))
              }
              placeholder="2026"
              className="font-mono tabular-nums"
            />
          </AdmissionField>

          <AdmissionField
            label={`${rules.defaultPreviousClassBn}-এর রোল নং (ঐচ্ছিক)`}
          >
            <AdmissionInput
              value={watch('prevExamRoll')}
              inputMode="numeric"
              onChange={(e) =>
                setValue('prevExamRoll', cleanNumericInput(e.target.value, 8))
              }
              placeholder="যেমন: 12"
              className="font-mono tabular-nums"
            />
          </AdmissionField>

          {/* GPA only shown for Classes 7–10 (Not Class 6 where PEC is discontinued) */}
          {rules.showPreviousGpa && (
            <AdmissionField
              label={'বার্ষিক পরীক্ষার জিপিএ (ঐচ্ছিক)'}
              hint={
                derivedGrade
                  ? `সমতুল্য গ্রেড: ${derivedGrade}`
                  : numericClass === 9
                    ? '০.০০–৫.০০ স্কেলে (বিভাগ যাচাইয়ে সহায়ক)'
                    : '০.০০ থেকে ৫.০০ স্কেলে (যেমন: 5.00)'
              }
              error={errors.prevExamGpa?.message}
            >
              <AdmissionInput
                value={prevExamGpa}
                inputMode="decimal"
                maxLength={4}
                onChange={(e) =>
                  setValue('prevExamGpa', cleanDecimalInput(e.target.value, 4), {
                    shouldValidate: true,
                  })
                }
                placeholder="5.00"
                className="font-mono tabular-nums"
              />
            </AdmissionField>
          )}
        </div>

        {/* Conditional Transfer Certificate (TC / e-TC) */}
        {showTcFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/70">
            <AdmissionField
              label={
                numericClass === 10
                  ? 'বোর্ড e-TC / ছাড়পত্র নম্বর'
                  : 'ছাড়পত্র (TC) নম্বর'
              }
              required
              error={errors.transferCertificateNo?.message}
            >
              <AdmissionInput
                {...register('transferCertificateNo')}
                placeholder={numericClass === 10 ? 'যেমন: ETC-2026-44129' : 'যেমন: TC-2026-084'}
                className="font-mono tabular-nums"
              />
            </AdmissionField>

            <AdmissionField
              label={'ছাড়পত্র ইস্যুর তারিখ'}
            >
              <AdmissionInput type="date" {...register('transferCertificateDate')} />
            </AdmissionField>
          </div>
        )}

        {/* Conditional SSC Board Registration (Mandatory Class 10; Optional Class 9 Transfer/Readmit) */}
        {showBoardRegFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/70">
            <AdmissionField
              label={
                numericClass === 10
                  ? '৯ম শ্রেণির এসএসসি বোর্ড রেজিস্ট্রেশন নম্বর'
                  : 'বোর্ড রেজিস্ট্রেশন নম্বর (ইস্যু হয়ে থাকলে)'
              }
              required={rules.requiresBoardRegistration}
              error={errors.boardRegistrationNo?.message || boardRegDuplicate}
            >
              <AdmissionInput
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
            </AdmissionField>

            <AdmissionField
              label={'রেজিস্ট্রেশন শিক্ষাবর্ষ (সেশন)'}
            >
              <AdmissionInput
                {...register('boardRegistrationSession')}
                placeholder="যেমন: 2025-26"
                className="font-mono tabular-nums"
              />
            </AdmissionField>

            {boardRegDuplicate && (
              <div className="sm:col-span-2 flex items-start gap-2.5 px-4 py-3 rounded-2xl border border-destructive/40 bg-destructive/5 text-sm text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{boardRegDuplicate}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
