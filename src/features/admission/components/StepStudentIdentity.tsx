'use client';

import React, { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle, Camera, CheckCircle2, Trash2, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button, FormField, Input, Select } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import { getEnumMeta } from '@/src/lib/constants/enums';
import { Gender, Religion } from '@/src/types/enums';
import type { SchoolClass } from '@/src/types/entities';
import {
  AdmissionFormMode,
  BD_BIRTH_CERT_REGEX,
  BLOOD_GROUP_OPTIONS,
  calculateAgeYears,
  cleanNumericInput,
  getClassAdmissionRules,
  toBlockLetters,
} from '../rules';
import type { UnifiedAdmissionFormValues } from '../schema';

interface StepStudentIdentityProps {
  form: UseFormReturn<UnifiedAdmissionFormValues>;
  mode: AdmissionFormMode;
  selectedClass?: SchoolClass;
  birthCertDuplicate?: string;
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

export function StepStudentIdentity({
  form,
  mode,
  selectedClass,
  birthCertDuplicate,
}: StepStudentIdentityProps) {
  const { locale, pick } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const numericClass = selectedClass?.numericValue ?? 6;
  const rules = getClassAdmissionRules(numericClass);

  const photoPreview = watch('photoPreview');
  const dateOfBirth = watch('dateOfBirth');
  const birthCertificateNo = watch('birthCertificateNo');
  const studentNameEn = watch('studentNameEn');

  const dobYear = dateOfBirth ? dateOfBirth.slice(0, 4) : '';
  const certYear = birthCertificateNo.length >= 4 ? birthCertificateNo.slice(0, 4) : '';
  const bdrisMatch =
    Boolean(dobYear) &&
    BD_BIRTH_CERT_REGEX.test(birthCertificateNo) &&
    dobYear === certYear;
  const bdrisMismatch =
    Boolean(dobYear) &&
    birthCertificateNo.length >= 4 &&
    dobYear !== certYear;
  const computedAge = calculateAgeYears(dateOfBirth);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(
        pick(
          'শুধুমাত্র JPG, PNG অথবা WebP ছবি আপলোড করুন।',
          'Please upload a JPG, PNG, or WebP image.'
        )
      );
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error(
        pick(
          'ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে।',
          'Photo size must not exceed 2MB.'
        )
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setValue('photoPreview', reader.result, { shouldValidate: true });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Passport Photograph Block (Used on Admit Card, Profile & ID Card) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-border">
        <div className="w-28 h-34 rounded-[var(--radius)] border border-border bg-surface-muted/50 overflow-hidden flex items-center justify-center shrink-0">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt={pick('শিক্ষার্থীর ছবি', 'Student photograph')}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center px-2 space-y-1 text-muted-foreground">
              <Camera className="w-6 h-6 mx-auto opacity-70" />
              <span className="block text-xs">
                {pick('পাসপোর্ট ছবি', 'Passport Photo')}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 flex-1">
          <div className="text-sm font-semibold text-foreground">
            {pick('শিক্ষার্থীর সদ্য তোলা পাসপোর্ট সাইজ রঙিন ছবি', 'Student Recent Passport-Size Color Photograph')}
            {mode === 'public' && <span className="text-destructive ml-1">*</span>}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {pick(
              'এই ছবিটি ভর্তি পরীক্ষার প্রবেশপত্র ও শিক্ষার্থীর আইডি কার্ডে ব্যবহৃত হবে। পরিষ্কার সাদা/হালকা ব্যাকগ্রাউন্ড (JPG/PNG, সর্বোচ্চ ২MB)।',
              'Used on the Admission Test Admit Card and Student ID Card. Clear light background (JPG/PNG, max 2MB).'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              {photoPreview
                ? pick('ছবি পরিবর্তন করুন', 'Change Photo')
                : pick('ছবি আপলোড করুন', 'Upload Photo')}
            </Button>
            {photoPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setValue('photoPreview', null, { shouldValidate: true })
                }
              >
                <Trash2 className="w-4 h-4 text-destructive" />
                {pick('মুছে ফেলুন', 'Remove')}
              </Button>
            )}
          </div>
          {errors.photoPreview && (
            <p className="text-sm text-destructive font-medium">
              {errors.photoPreview.message}
            </p>
          )}
        </div>
      </div>

      {/* Identity Fields */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary shrink-0" />
          {pick(
            'শিক্ষার্থীর ব্যক্তিগত ও জন্ম নিবন্ধন তথ্য',
            'Student Personal & Birth Registration Information'
          )}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={pick('শিক্ষার্থীর নাম (বাংলায় — জন্ম সনদ অনুযায়ী)', 'Student Name (Bangla — per Birth Certificate)')}
            required
            error={errors.studentNameBn?.message}
          >
            <Input
              {...register('studentNameBn')}
              placeholder="যেমন: মোঃ রাফিউল ইসলাম"
            />
          </FormField>

          <FormField
            label={pick('শিক্ষার্থীর নাম (ইংরেজিতে — BLOCK LETTERS)', 'Student Name (English — BLOCK LETTERS)')}
            required
            hint={pick('বোর্ড রেজিস্ট্রেশন ও সনদ অনুযায়ী বড় হাতের অক্ষরে সংরক্ষিত হবে', 'Auto-formatted to uppercase per Education Board standard')}
            error={errors.studentNameEn?.message}
          >
            <Input
              value={studentNameEn}
              onChange={(e) =>
                setValue('studentNameEn', toBlockLetters(e.target.value), {
                  shouldValidate: true,
                })
              }
              placeholder="e.g. MD. RAFIUL ISLAM"
              className="uppercase tracking-wide"
            />
          </FormField>

          <FormField
            label={pick('জন্ম তারিখ (জন্ম সনদ অনুযায়ী)', 'Date of Birth (per Birth Certificate)')}
            required
            hint={
              computedAge !== null
                ? pick(
                    `বর্তমান বয়স: ${computedAge} বছর (এই শ্রেণির উপযোগী বয়স ${rules.minAge}–${rules.maxAge} বছর)`,
                    `Calculated age: ${computedAge} years (expected ${rules.minAge}–${rules.maxAge} yrs for this class)`
                  )
                : undefined
            }
            error={errors.dateOfBirth?.message}
          >
            <Input type="date" {...register('dateOfBirth')} />
          </FormField>

          <FormField
            label={pick('১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন নম্বর', '17-Digit Online Birth Registration No (BDRIS)')}
            required
            error={errors.birthCertificateNo?.message || birthCertDuplicate}
          >
            <Input
              value={birthCertificateNo}
              inputMode="numeric"
              maxLength={17}
              onChange={(e) =>
                setValue(
                  'birthCertificateNo',
                  cleanNumericInput(e.target.value, 17),
                  { shouldValidate: true }
                )
              }
              placeholder={`${dobYear || '2014'}8614500012345`}
              className="font-mono tabular-nums tracking-wider"
            />
            {!errors.birthCertificateNo && !birthCertDuplicate && bdrisMatch && (
              <p className="text-xs text-success flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {pick(
                  `১৭ ডিজিট এবং জন্মসাল (${dobYear}) সঠিকভাবে মিলেছে`,
                  `17 digits verified & birth year (${dobYear}) matches`
                )}
              </p>
            )}
            {!errors.birthCertificateNo && bdrisMismatch && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {pick(
                  `জন্ম নিবন্ধনের প্রথম ৪ ডিজিট (${certYear}) জন্মসালের (${dobYear}) সাথে মিলছে না`,
                  `First 4 digits (${certYear}) do not match birth year (${dobYear})`
                )}
              </p>
            )}
          </FormField>

          <FormField label={pick('লিঙ্গ', 'Gender')} required error={errors.gender?.message}>
            <Select {...register('gender')}>
              <option value={Gender.MALE}>{pick('ছাত্র (Male)', 'Male')}</option>
              <option value={Gender.FEMALE}>{pick('ছাত্রী (Female)', 'Female')}</option>
              <option value={Gender.OTHER}>{pick('অন্যান্য', 'Other')}</option>
            </Select>
          </FormField>

          <FormField label={pick('ধর্ম', 'Religion')} required error={errors.religion?.message}>
            <Select {...register('religion')}>
              {Object.values(Religion).map((rel) => (
                <option key={rel} value={rel}>
                  {locale === 'bn'
                    ? getEnumMeta('Religion', rel).bn
                    : getEnumMeta('Religion', rel).en}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label={pick('রক্তের গ্রুপ (আইডি কার্ডের জন্য)', 'Blood Group (For Student ID Card)')}
            error={errors.bloodGroup?.message}
          >
            <Select {...register('bloodGroup')}>
              <option value="">{pick('জানা নেই / নির্বাচন করুন', 'Unknown / Select')}</option>
              {BLOOD_GROUP_OPTIONS.map((bg) => (
                <option key={bg.value} value={bg.value}>
                  {bg.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label={pick('জাতীয়তা', 'Nationality')}
            required
            error={errors.nationality?.message}
          >
            <Input {...register('nationality')} placeholder="বাংলাদেশি" />
          </FormField>

          {rules.showStudentPhone && (
            <FormField
              label={pick('শিক্ষার্থীর নিজস্ব মোবাইল (ঐচ্ছিক)', 'Student Personal Mobile (Optional)')}
              error={errors.studentPhone?.message}
            >
              <Input
                value={watch('studentPhone')}
                inputMode="numeric"
                maxLength={11}
                onChange={(e) =>
                  setValue('studentPhone', cleanNumericInput(e.target.value, 11), {
                    shouldValidate: true,
                  })
                }
                placeholder="01XXXXXXXXX"
                className="font-mono tabular-nums"
              />
            </FormField>
          )}
        </div>
      </div>
    </div>
  );
}
