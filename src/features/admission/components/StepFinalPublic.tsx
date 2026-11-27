'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { CheckCircle2, FileUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MockDatabase } from '@/src/mocks/seed';
import { getRequiredDocumentChecklist } from '../rules';
import type { UnifiedAdmissionFormValues } from '../schema';
import { AdmissionSectionHeader } from './AdmissionFormPrimitives';
import { AdmissionFormPreviewSheet } from './AdmissionFormPreviewSheet';

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
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const values = watch();
  const selectedClass = db.classes.find((c) => c.id === values.targetClassId);
  const numericClass = selectedClass?.numericValue ?? 6;
  const hasDeceasedParent = !values.fatherAlive || !values.motherAlive;
  const checklist = getRequiredDocumentChecklist(
    numericClass,
    values.admissionType,
    hasDeceasedParent
  );

  const handleUploadDoc = (
    key: 'birthCertificate' | 'parentsNid' | 'previousRecordOrTc',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_DOC_BYTES) {
      toast.error(
        'ফাইলের আকার সর্বোচ্চ ৩ মেগাবাইট (3MB) হতে পারবে।'
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
      labelBn: 'জন্ম নিবন্ধন সনদ (ঐচ্ছিক)',
      labelEn: 'Birth Certificate (Optional)',
    },
    {
      key: 'parentsNid',
      labelBn: 'পিতা-মাতার এনআইডি (ঐচ্ছিক)',
      labelEn: 'Parents’ NID (Optional)',
    },
    {
      key: 'previousRecordOrTc',
      labelBn:
        numericClass === 10
          ? 'বোর্ড e-TC ও ৯ম শ্রেণির রেজিস্ট্রেশন (ঐচ্ছিক)'
          : 'পূর্ববর্তী শ্রেণির ফলাফল / TC (ঐচ্ছিক)',
      labelEn:
        numericClass === 10
          ? 'Board e-TC & Class 9 Reg (Optional)'
          : 'Previous Result / TC (Optional)',
    },
  ];

  return (
    <div className="space-y-7">
      {/* 1. Compact Optional Supporting Document Upload Strip */}
      <div className="space-y-3.5">
        <AdmissionSectionHeader
          title={'১. কাগজপত্র সংযোজন (ঐচ্ছিক)'}
          subtitle={'অনলাইনে সংযোজন ঐচ্ছিক; তবে চূড়ান্ত ভর্তির সময় নিচের মূল কাগজপত্র বিদ্যালয় অফিসে জমা দিতে হবে।'}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {docSlots.map((slot) => {
            const current = values.attachments?.[slot.key];
            return (
              <div
                key={slot.key}
                className="p-3.5 rounded-2xl border border-border/80 bg-surface space-y-2.5 shadow-xs"
              >
                <p className="text-sm font-semibold text-foreground">
                  {slot.labelBn}
                </p>
                {current ? (
                  <div className="flex items-center justify-between gap-2 text-sm text-success bg-success/5 border border-success/30 rounded-xl px-3 py-2">
                    <span className="truncate font-medium">{current.name}</span>
                    <button
                      type="button"
                      onClick={() => setValue(`attachments.${slot.key}`, null)}
                      className="text-destructive hover:opacity-80 shrink-0 cursor-pointer"
                      aria-label={'অপসারণ'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-dashed border-border rounded-xl py-2.5 px-3 cursor-pointer transition-colors hover:bg-surface-muted/40">
                    <FileUp className="w-4 h-4" />
                    <span>{'ফাইল নির্বাচন করুন (JPG/PDF)'}</span>
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
      </div>

      {/* 2. Full Official Application Form Preview (Single Unified Institutional Sheet) */}
      <div className="space-y-3.5">
        <AdmissionSectionHeader
          title={'২. পূর্ণাঙ্গ আবেদনপত্র প্রিভিউ'}
          subtitle={'আবেদন চূড়ান্ত জমা দেওয়ার পূর্বে নিচের সকল তথ্য সতর্কতার সাথে মিলিয়ে নিন। কোনো সংশোধনের প্রয়োজন হলে সংশ্লিষ্ট অংশের "সংশোধন" বাটনে ক্লিক করুন।'}
        />

        <AdmissionFormPreviewSheet
          values={values}
          db={db}
          mode="public"
          onJumpToStep={onJumpToStep}
        />
      </div>

      {/* 3. Required Hardcopies Note & Official Declaration */}
      <div className="border border-border/80 rounded-2xl bg-surface-muted/30 divide-y divide-border/80">
        <div className="p-5 space-y-2.5">
          <p className="text-sm font-semibold text-foreground">
            {'ভর্তির সময় বিদ্যালয় অফিসে জমাদানের আবশ্যক কাগজপত্র:'}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-foreground/90">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>{item.labelBn}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {'অঙ্গীকারনামা'}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {db.admissionContent.declarationText ||
              'আমি এই মর্মে অঙ্গীকার করছি যে, উপরে উল্লিখিত সকল তথ্য জন্ম নিবন্ধন ও জাতীয় পরিচয়পত্র অনুযায়ী সম্পূর্ণ সত্য ও নির্ভুল। আমি অত্র প্রতিষ্ঠানের প্রচলিত ও ভবিষ্যতে প্রণীত যাবতীয় নিয়ম-কানুন মানিয়া চলিব এবং বিদ্যালয়ে নির্ধারিত পোশাক পরিধান করে নিয়মিত উপস্থিত থাকিব।'}
          </p>
          <label className="flex items-start gap-2.5 pt-1 text-sm font-medium text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('declarationAccepted')}
              className="w-4 h-4 mt-0.5 rounded-[3px] accent-primary shrink-0"
            />
            <span>
              {'আমি উপরের পূর্ণাঙ্গ আবেদনপত্র যাচাই করেছি এবং অঙ্গীকারনামায় সম্মতি প্রদান করছি।'}
            </span>
          </label>
          {errors.declarationAccepted && (
            <p className="text-sm text-destructive font-medium">
              {errors.declarationAccepted.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
