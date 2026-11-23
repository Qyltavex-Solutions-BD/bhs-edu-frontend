'use client';

import React, { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle, Camera, CheckCircle2, Info, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/primitives';
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
import {
  AdmissionField,
  AdmissionInput,
  AdmissionSectionHeader,
  AdmissionSelect,
} from './AdmissionFormPrimitives';

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
  const outsideTypicalAge =
    computedAge !== null &&
    computedAge >= 6 &&
    computedAge <= 25 &&
    (computedAge < rules.typicalMinAge || computedAge > rules.typicalMaxAge);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(
        pick(
          'শুধুমাত্র JPG, PNG অথবা WebP ফরম্যাটের ছবি আপলোড করুন।',
          'Please upload a JPG, PNG, or WebP photograph.'
        )
      );
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error(
        pick(
          'ছবির আকার সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে।',
          'Photograph size must not exceed 2MB.'
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
      <AdmissionSectionHeader
        title={pick('শিক্ষার্থীর ব্যক্তিগত ও জন্ম নিবন্ধন তথ্য', 'Student Personal & Birth Registration Information')}
        subtitle={pick(
          'অনলাইন জন্ম নিবন্ধন সনদ অনুযায়ী সকল তথ্য নির্ভুলভাবে পূরণ করুন।',
          'Enter all personal details exactly as printed on the online Birth Registration Certificate.'
        )}
      />

      {/* Passport Photograph Frame (Formal Institutional Style) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-border/80">
        <div className="w-28 h-36 rounded-2xl border-2 border-dashed border-border/80 bg-surface-muted/40 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt={pick('শিক্ষার্থীর ছবি', 'Student photograph')}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center px-2 space-y-1.5 text-muted-foreground">
              <Camera className="w-6 h-6 mx-auto opacity-70" />
              <span className="block text-xs font-medium leading-tight">
                {pick('পাসপোর্ট ছবি', 'Passport Photo')}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2.5 flex-1">
          <p className="text-base font-semibold text-foreground">
            {pick('শিক্ষার্থীর পাসপোর্ট সাইজ রঙিন ছবি', 'Student Passport-Size Color Photograph')}
            {mode === 'public' && <span className="text-destructive ml-1">*</span>}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {pick(
              'সদ্য তোলা পরিষ্কার মুখমণ্ডলসহ রঙিন ছবি (JPG/PNG, সর্বোচ্চ ২MB)। ছবিটি প্রবেশপত্র ও শিক্ষার্থী প্রোফাইলে সংরক্ষিত থাকবে।',
              'Recent clear color portrait (JPG/PNG, max 2MB). Used on the Admit Card and student profile.'
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
              className="rounded-xl h-10 px-4 text-sm font-semibold"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              {photoPreview
                ? pick('ছবি পরিবর্তন', 'Change Photo')
                : pick('ছবি নির্বাচন করুন', 'Choose Photo')}
            </Button>
            {photoPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl h-10 px-4 text-sm font-semibold"
                onClick={() =>
                  setValue('photoPreview', null, { shouldValidate: true })
                }
              >
                <Trash2 className="w-4 h-4 text-destructive" />
                {pick('অপসারণ', 'Remove')}
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

      {/* Personal & BDRIS Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdmissionField
          label={pick('শিক্ষার্থীর নাম (বাংলায়)', 'Student Name (Bangla)')}
          required
          error={errors.studentNameBn?.message}
        >
          <AdmissionInput
            {...register('studentNameBn')}
            placeholder="যেমন: মোঃ রাফিউল ইসলাম"
          />
        </AdmissionField>

        <AdmissionField
          label={pick('শিক্ষার্থীর নাম (ইংরেজিতে বড় অক্ষরে)', 'Student Name (English — BLOCK LETTERS)')}
          required
          error={errors.studentNameEn?.message}
        >
          <AdmissionInput
            value={studentNameEn}
            onChange={(e) =>
              setValue('studentNameEn', toBlockLetters(e.target.value), {
                shouldValidate: true,
              })
            }
            placeholder="MD. RAFIUL ISLAM"
            className="uppercase tracking-wide"
          />
        </AdmissionField>

        <AdmissionField
          label={pick('জন্ম তারিখ', 'Date of Birth')}
          required
          error={errors.dateOfBirth?.message}
        >
          <AdmissionInput type="date" {...register('dateOfBirth')} />
          {!errors.dateOfBirth && computedAge !== null && !outsideTypicalAge && (
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {pick(`বয়স: ${computedAge} বছর`, `Age: ${computedAge} years`)}
            </p>
          )}
          {!errors.dateOfBirth && outsideTypicalAge && (
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5 mt-1 leading-snug">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {pick(
                  `বয়স ${computedAge} বছর — সাধারণ বয়সসীমার (${rules.typicalMinAge}–${rules.typicalMaxAge} বছর) বাইরে হওয়ায় ভর্তির সময় মূল জন্ম সনদ যাচাই সাপেক্ষে বিবেচিত হবে।`,
                  `Age is ${computedAge} yrs (typical range ${rules.typicalMinAge}–${rules.typicalMaxAge} yrs). Subject to office verification of original birth certificate.`
                )}
              </span>
            </p>
          )}
        </AdmissionField>

        <AdmissionField
          label={pick('অনলাইন জন্ম নিবন্ধন নম্বর (১৭ ডিজিট)', 'Online Birth Registration No (17 Digits)')}
          required
          hint={
            !bdrisMatch && !bdrisMismatch
              ? pick(
                  'সরকারি BDRIS বিধি অনুযায়ী প্রথম ৪ ডিজিট জন্মসাল হতে হবে।',
                  'Per BDRIS standard, the first 4 digits must match the birth year.'
                )
              : undefined
          }
          error={errors.birthCertificateNo?.message || birthCertDuplicate}
        >
          <AdmissionInput
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
                `১৭ ডিজিট ও জন্মসাল (${dobYear}) সামঞ্জস্যপূর্ণ`,
                `17 digits & birth year (${dobYear}) verified`
              )}
            </p>
          )}
          {!errors.birthCertificateNo && bdrisMismatch && (
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {pick(
                `প্রথম ৪ ডিজিট (${certYear}) জন্মসালের (${dobYear}) সাথে মিলছে না।`,
                `First 4 digits (${certYear}) do not match birth year (${dobYear}).`
              )}
            </p>
          )}
        </AdmissionField>

        <AdmissionField label={pick('লিঙ্গ', 'Gender')} required error={errors.gender?.message}>
          <AdmissionSelect {...register('gender')}>
            <option value={Gender.MALE}>{pick('ছাত্র (পুরুষ)', 'Male')}</option>
            <option value={Gender.FEMALE}>{pick('ছাত্রী (মহিলা)', 'Female')}</option>
            <option value={Gender.OTHER}>{pick('অন্যান্য', 'Other')}</option>
          </AdmissionSelect>
        </AdmissionField>

        <AdmissionField label={pick('ধর্ম', 'Religion')} required error={errors.religion?.message}>
          <AdmissionSelect {...register('religion')}>
            {Object.values(Religion).map((rel) => (
              <option key={rel} value={rel}>
                {locale === 'bn'
                  ? getEnumMeta('Religion', rel).bn
                  : getEnumMeta('Religion', rel).en}
              </option>
            ))}
          </AdmissionSelect>
        </AdmissionField>

        <AdmissionField
          label={pick('রক্তের গ্রুপ (ঐচ্ছিক)', 'Blood Group (Optional)')}
          error={errors.bloodGroup?.message}
        >
          <AdmissionSelect {...register('bloodGroup')}>
            <option value="">{pick('নির্বাচন করুন', 'Select')}</option>
            {BLOOD_GROUP_OPTIONS.map((bg) => (
              <option key={bg.value} value={bg.value}>
                {bg.label}
              </option>
            ))}
          </AdmissionSelect>
        </AdmissionField>

        <AdmissionField
          label={pick('জাতীয়তা', 'Nationality')}
          required
          error={errors.nationality?.message}
        >
          <AdmissionInput {...register('nationality')} placeholder="বাংলাদেশি" />
        </AdmissionField>

        {rules.showStudentPhone && (
          <AdmissionField
            label={pick('শিক্ষার্থীর মোবাইল নম্বর (ঐচ্ছিক)', 'Student Mobile Number (Optional)')}
            error={errors.studentPhone?.message}
          >
            <AdmissionInput
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
          </AdmissionField>
        )}
      </div>
    </div>
  );
}
