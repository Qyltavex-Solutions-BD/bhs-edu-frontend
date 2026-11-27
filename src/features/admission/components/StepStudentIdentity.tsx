'use client';

import React, { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle, Camera, CheckCircle2, Info, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/primitives';
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
        'শুধুমাত্র JPG, PNG অথবা WebP ফরম্যাটের ছবি আপলোড করুন।'
      );
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error(
        'ছবির আকার সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে।'
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
        title={'শিক্ষার্থীর ব্যক্তিগত ও জন্ম নিবন্ধন তথ্য'}
        subtitle={'অনলাইন জন্ম নিবন্ধন সনদ অনুযায়ী সকল তথ্য নির্ভুলভাবে পূরণ করুন।'}
      />

      {/* Passport Photograph Frame (Formal Institutional Style) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-border/80">
        <div className="w-28 h-36 rounded-2xl border-2 border-dashed border-border/80 bg-surface-muted/40 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt={'শিক্ষার্থীর ছবি'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center px-2 space-y-1.5 text-muted-foreground">
              <Camera className="w-6 h-6 mx-auto opacity-70" />
              <span className="block text-sm font-medium leading-tight">
                {'পাসপোর্ট ছবি'}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2.5 flex-1">
          <p className="text-base font-semibold text-foreground">
            {'শিক্ষার্থীর পাসপোর্ট সাইজ রঙিন ছবি'}
            {mode === 'public' && <span className="text-destructive ml-1">*</span>}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {'সদ্য তোলা পরিষ্কার মুখমণ্ডলসহ রঙিন ছবি (JPG/PNG, সর্বোচ্চ ২MB)। ছবিটি প্রবেশপত্র ও শিক্ষার্থী প্রোফাইলে সংরক্ষিত থাকবে।'}
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
                ? 'ছবি পরিবর্তন'
                : 'ছবি নির্বাচন করুন'}
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
                {'অপসারণ'}
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
          label={'শিক্ষার্থীর নাম (বাংলায়)'}
          required
          error={errors.studentNameBn?.message}
        >
          <AdmissionInput
            {...register('studentNameBn')}
            placeholder="যেমন: মোঃ রাফিউল ইসলাম"
          />
        </AdmissionField>

        <AdmissionField
          label={'শিক্ষার্থীর নাম (ইংরেজিতে বড় অক্ষরে)'}
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
          label={'জন্ম তারিখ'}
          required
          error={errors.dateOfBirth?.message}
        >
          <AdmissionInput type="date" {...register('dateOfBirth')} />
          {!errors.dateOfBirth && computedAge !== null && !outsideTypicalAge && (
            <p className="text-sm text-muted-foreground mt-1 tabular-nums">
              {`বয়স: ${computedAge} বছর`}
            </p>
          )}
          {!errors.dateOfBirth && outsideTypicalAge && (
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-1.5 mt-1 leading-snug">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {`বয়স ${computedAge} বছর — সাধারণ বয়সসীমার (${rules.typicalMinAge}–${rules.typicalMaxAge} বছর) বাইরে হওয়ায় ভর্তির সময় মূল জন্ম সনদ যাচাই সাপেক্ষে বিবেচিত হবে।`}
              </span>
            </p>
          )}
        </AdmissionField>

        <AdmissionField
          label={'অনলাইন জন্ম নিবন্ধন নম্বর (১৭ ডিজিট)'}
          required
          hint={
            !bdrisMatch && !bdrisMismatch
              ? 'সরকারি BDRIS বিধি অনুযায়ী প্রথম ৪ ডিজিট জন্মসাল হতে হবে।'
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
            <p className="text-sm text-success flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {`১৭ ডিজিট ও জন্মসাল (${dobYear}) সামঞ্জস্যপূর্ণ`}
            </p>
          )}
          {!errors.birthCertificateNo && bdrisMismatch && (
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {`প্রথম ৪ ডিজিট (${certYear}) জন্মসালের (${dobYear}) সাথে মিলছে না।`}
            </p>
          )}
        </AdmissionField>

        <AdmissionField label={'লিঙ্গ'} required error={errors.gender?.message}>
          <AdmissionSelect {...register('gender')}>
            <option value={Gender.MALE}>{'ছাত্র (পুরুষ)'}</option>
            <option value={Gender.FEMALE}>{'ছাত্রী (মহিলা)'}</option>
            <option value={Gender.OTHER}>{'অন্যান্য'}</option>
          </AdmissionSelect>
        </AdmissionField>

        <AdmissionField label={'ধর্ম'} required error={errors.religion?.message}>
          <AdmissionSelect {...register('religion')}>
            {Object.values(Religion).map((rel) => (
              <option key={rel} value={rel}>
                {getEnumMeta('Religion', rel).bn}
              </option>
            ))}
          </AdmissionSelect>
        </AdmissionField>

        <AdmissionField
          label={'রক্তের গ্রুপ (ঐচ্ছিক)'}
          error={errors.bloodGroup?.message}
        >
          <AdmissionSelect {...register('bloodGroup')}>
            <option value="">{'নির্বাচন করুন'}</option>
            {BLOOD_GROUP_OPTIONS.map((bg) => (
              <option key={bg.value} value={bg.value}>
                {bg.label}
              </option>
            ))}
          </AdmissionSelect>
        </AdmissionField>

        <AdmissionField
          label={'জাতীয়তা'}
          required
          error={errors.nationality?.message}
        >
          <AdmissionInput {...register('nationality')} placeholder="বাংলাদেশি" />
        </AdmissionField>

        {rules.showStudentPhone && (
          <AdmissionField
            label={'শিক্ষার্থীর মোবাইল নম্বর (ঐচ্ছিক)'}
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
