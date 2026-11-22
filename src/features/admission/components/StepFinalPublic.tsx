'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  CheckCircle2,
  ClipboardCheck,
  FileUp,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import type { MockDatabase } from '@/src/mocks/seed';
import {
  ADMISSION_TYPE_META,
  BLOOD_GROUP_OPTIONS,
  formatStructuredAddress,
  getClassAdmissionRules,
  getOptionalSubjectsForClassGroup,
  getRequiredDocumentChecklist,
} from '../rules';
import { resolvePrimaryGuardianPhone } from '../mappers';
import type { UnifiedAdmissionFormValues } from '../schema';

interface StepFinalPublicProps {
  form: UseFormReturn<UnifiedAdmissionFormValues>;
  db: MockDatabase;
  onJumpToStep: (step: 1 | 2 | 3) => void;
}

const MAX_DOC_BYTES = 3 * 1024 * 1024; // 3 MB

export function StepFinalPublic({
  form,
  db,
  onJumpToStep,
}: StepFinalPublicProps) {
  const { locale, pick } = useI18n();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const values = watch();
  const selectedClass = db.classes.find((c) => c.id === values.targetClassId);
  const numericClass = selectedClass?.numericValue ?? 6;
  const rules = getClassAdmissionRules(numericClass);
  const group = db.academicGroups.find((g) => g.id === values.targetGroupId);
  const optionalChoices = rules.requiresOptionalSubject
    ? getOptionalSubjectsForClassGroup(db, values.targetClassId, values.targetGroupId)
    : [];
  const chosenOptional = optionalChoices.find(
    (o) => o.classSubjectId === values.optionalClassSubjectId
  );
  const checklist = getRequiredDocumentChecklist(numericClass, values.admissionType);

  const permanentFormatted = formatStructuredAddress(values.permanentAddressParts);
  const presentFormatted = values.sameAsPermanent
    ? permanentFormatted
    : formatStructuredAddress(values.presentAddressParts);
  const bloodLabel =
    BLOOD_GROUP_OPTIONS.find((b) => b.value === values.bloodGroup)?.label || '—';

  const handleUploadDoc = (
    key: 'birthCertificate' | 'parentsNid' | 'previousRecordOrTc',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_DOC_BYTES) {
      toast.error(
        pick('ফাইলের সাইজ সর্বোচ্চ ৩ মেগাবাইট (3MB) হতে পারবে।', 'File size must be under 3MB.')
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setValue(`attachments.${key}`, {
          name: file.name,
          dataUrl: reader.result,
          sizeBytes: file.size,
        });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const docSlots: Array<{
    key: 'birthCertificate' | 'parentsNid' | 'previousRecordOrTc';
    labelBn: string;
    labelEn: string;
  }> = [
    {
      key: 'birthCertificate',
      labelBn: 'জন্ম নিবন্ধন সনদের ছবি / PDF (ঐচ্ছিক)',
      labelEn: 'Birth Certificate Scan / Photo (Optional)',
    },
    {
      key: 'parentsNid',
      labelBn: 'পিতা-মাতার এনআইডি কপি (ঐচ্ছিক)',
      labelEn: 'Parents’ NID Copy (Optional)',
    },
    {
      key: 'previousRecordOrTc',
      labelBn:
        numericClass === 10
          ? 'বোর্ড e-TC অর্ডার ও ৯ম শ্রেণির রেজিস্ট্রেশন কপি (ঐচ্ছিক)'
          : 'পূর্ববর্তী শ্রেণির প্রত্যয়ন / ছাড়পত্র (TC) (ঐচ্ছিক)',
      labelEn:
        numericClass === 10
          ? 'Board e-TC Order & Class 9 Reg Copy (Optional)'
          : 'Previous Transcript / TC Copy (Optional)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Hybrid Optional Digital Attachments + Required Hardcopy Checklist */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <FileUp className="w-4 h-4 text-primary shrink-0" />
          {pick(
            'কাগজপত্র সংযোজন (ডিজিটাল কপি ঐচ্ছিক, মূল কপি ভর্তির দিন যাচাই করা হবে)',
            'Supporting Documents (Digital Upload Optional · Hardcopies Verified at Admission)'
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {docSlots.map((slot) => {
            const current = values.attachments?.[slot.key];
            return (
              <div
                key={slot.key}
                className="p-3.5 rounded-[var(--radius)] border border-border bg-surface space-y-2"
              >
                <p className="text-xs font-medium text-foreground">
                  {locale === 'bn' ? slot.labelBn : slot.labelEn}
                </p>
                {current ? (
                  <div className="flex items-center justify-between gap-2 text-xs text-success bg-success/5 border border-success/25 rounded px-2.5 py-2">
                    <span className="truncate font-medium">{current.name}</span>
                    <button
                      type="button"
                      onClick={() => setValue(`attachments.${slot.key}`, null)}
                      className="text-destructive hover:opacity-80 shrink-0 cursor-pointer"
                      aria-label={pick('মুছুন', 'Remove')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-border rounded py-2.5 px-2 cursor-pointer transition-colors hover:bg-surface-muted/40">
                    <FileUp className="w-3.5 h-3.5" />
                    <span>{pick('ছবি বা PDF বেছে নিন', 'Choose Image / PDF')}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleUploadDoc(slot.key, e)}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-[var(--radius)] border border-border bg-surface-muted/40 space-y-2.5">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary shrink-0" />
            {pick(
              'ভর্তির দিন বিদ্যালয় অফিসে যেসব কাগজপত্র জমা দিতে হবে:',
              'Hardcopy Documents Required at School Office on Admission Day:'
            )}
          </p>
          <ul className="space-y-1.5 text-sm text-foreground/90">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>{locale === 'bn' ? item.labelBn : item.labelEn}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 2. Clean Application Summary Preview with Quick-Edit Links */}
      <div className="pt-5 border-t border-border space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          {pick('আবেদনের পূর্ণাঙ্গ সারসংক্ষেপ (জমা দেওয়ার আগে যাচাই করুন)', 'Complete Application Summary (Review Before Submitting)')}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
          {/* Academic Summary */}
          <div className="p-4 rounded-[var(--radius)] border border-border bg-surface space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-semibold text-foreground">
                {pick('শ্রেণি ও একাডেমিক', 'Class & Academic')}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(1)}>
                <Pencil className="w-3.5 h-3.5" />
                {pick('সম্পাদনা', 'Edit')}
              </Button>
            </div>
            <p>
              <span className="text-muted-foreground">{pick('ভর্তিচ্ছু শ্রেণি:', 'Target Class:')}</span>{' '}
              <strong>{locale === 'bn' ? selectedClass?.nameBn : selectedClass?.name}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">{pick('ভর্তির ধরন:', 'Admission Type:')}</span>{' '}
              {locale === 'bn'
                ? ADMISSION_TYPE_META[values.admissionType].bn
                : ADMISSION_TYPE_META[values.admissionType].en}
            </p>
            {rules.requiresGroup && (
              <>
                <p>
                  <span className="text-muted-foreground">{pick('বিভাগ:', 'Group:')}</span>{' '}
                  <strong>{locale === 'bn' ? group?.nameBn : group?.name || '—'}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">{pick('৪র্থ বিষয়:', '4th Subject:')}</span>{' '}
                  {chosenOptional ? (locale === 'bn' ? chosenOptional.nameBn : chosenOptional.nameEn) : '—'}
                </p>
              </>
            )}
            {values.previousSchoolName && (
              <p>
                <span className="text-muted-foreground">{pick('পূর্ববর্তী বিদ্যালয়:', 'Prev School:')}</span>{' '}
                {values.previousSchoolName}
              </p>
            )}
            {values.transferCertificateNo && (
              <p className="tabular-nums">
                <span className="text-muted-foreground">{pick('ছাড়পত্র (TC) নং:', 'TC / e-TC No:')}</span>{' '}
                <span className="font-mono">{values.transferCertificateNo}</span>
              </p>
            )}
            {values.boardRegistrationNo && (
              <p className="tabular-nums">
                <span className="text-muted-foreground">{pick('বোর্ড রেজিস্ট্রেশন:', 'Board Reg:')}</span>{' '}
                <span className="font-mono">{values.boardRegistrationNo}</span>
              </p>
            )}
          </div>

          {/* Student Summary */}
          <div className="p-4 rounded-[var(--radius)] border border-border bg-surface space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-semibold text-foreground">
                {pick('শিক্ষার্থীর তথ্য', 'Student Identity')}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(2)}>
                <Pencil className="w-3.5 h-3.5" />
                {pick('সম্পাদনা', 'Edit')}
              </Button>
            </div>
            <div className="flex items-start gap-3">
              {values.photoPreview && (
                <img
                  src={values.photoPreview}
                  alt={values.studentNameEn}
                  referrerPolicy="no-referrer"
                  className="w-12 h-14 object-cover rounded border border-border shrink-0"
                />
              )}
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-foreground">{values.studentNameBn}</p>
                <p className="text-xs font-mono uppercase text-muted-foreground">{values.studentNameEn}</p>
              </div>
            </div>
            <p className="tabular-nums">
              <span className="text-muted-foreground">{pick('জন্ম তারিখ:', 'DOB:')}</span>{' '}
              {values.dateOfBirth}
            </p>
            <p className="tabular-nums">
              <span className="text-muted-foreground">{pick('জন্ম নিবন্ধন:', 'Birth Cert:')}</span>{' '}
              <span className="font-mono">{values.birthCertificateNo}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{pick('রক্তের গ্রুপ:', 'Blood Group:')}</span>{' '}
              {bloodLabel}
            </p>
          </div>

          {/* Parents & Address Summary */}
          <div className="p-4 rounded-[var(--radius)] border border-border bg-surface space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-semibold text-foreground">
                {pick('অভিভাবক ও ঠিকানা', 'Parents & Address')}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(3)}>
                <Pencil className="w-3.5 h-3.5" />
                {pick('সম্পাদনা', 'Edit')}
              </Button>
            </div>
            <p>
              <span className="text-muted-foreground">{pick('পিতা:', 'Father:')}</span>{' '}
              {values.fatherNameBn}{' '}
              {!values.fatherAlive && (
                <span className="text-xs text-muted-foreground">({pick('মৃত', 'Deceased')})</span>
              )}
            </p>
            <p>
              <span className="text-muted-foreground">{pick('মাতা:', 'Mother:')}</span>{' '}
              {values.motherNameBn}{' '}
              {!values.motherAlive && (
                <span className="text-xs text-muted-foreground">({pick('মৃত', 'Deceased')})</span>
              )}
            </p>
            {values.legalGuardianNameBn && (
              <p>
                <span className="text-muted-foreground">{pick('বৈধ অভিভাবক:', 'Guardian:')}</span>{' '}
                {values.legalGuardianNameBn} ({values.legalGuardianRelation})
              </p>
            )}
            <p className="tabular-nums">
              <span className="text-muted-foreground">{pick('অভিভাবক মোবাইল:', 'Contact Phone:')}</span>{' '}
              <span className="font-mono font-medium">{resolvePrimaryGuardianPhone(values)}</span>
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>{pick('বর্তমান ঠিকানা:', 'Present:')}</strong> {presentFormatted}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Official Declaration */}
      <div className="p-5 rounded-[var(--radius)] border border-border bg-surface-muted/35 space-y-3">
        <p className="text-sm font-semibold text-foreground">
          {pick('অঙ্গীকারনামা (Student & Guardian Declaration)', 'Student & Guardian Declaration')}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {db.admissionContent.declarationText ||
            'আমি এই মর্মে অঙ্গীকার করছি যে, উপরে প্রদত্ত সকল তথ্য জন্ম নিবন্ধন ও জাতীয় পরিচয়পত্র অনুযায়ী সম্পূর্ণ সত্য ও সঠিক। ভর্তি হলে বিদ্যালয়ের সকল নিয়ম-শৃঙ্খলা, নির্ধারিত পোশাক ও নিয়মিত উপস্থিতি মেনে চলতে বাধ্য থাকব।'}
        </p>
        <label className="flex items-start gap-2.5 pt-1 text-sm font-medium text-foreground cursor-pointer">
          <input
            type="checkbox"
            {...register('declarationAccepted')}
            className="w-4 h-4 mt-0.5 accent-primary shrink-0"
          />
          <span>
            {pick(
              'আমি উপরের অঙ্গীকারনামা পড়েছি এবং নিশ্চিত করছি যে প্রদত্ত সকল তথ্য সঠিক।',
              'I have read the declaration and confirm all submitted information is accurate.'
            )}
          </span>
        </label>
        {errors.declarationAccepted && (
          <p className="text-sm text-destructive font-medium">
            {errors.declarationAccepted.message}
          </p>
        )}
      </div>
    </div>
  );
}
