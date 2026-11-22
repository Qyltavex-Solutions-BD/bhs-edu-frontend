'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Home, ShieldAlert, Users } from 'lucide-react';
import { FormField, Input, Switch } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import type { SchoolClass } from '@/src/types/entities';
import {
  cleanNumericInput,
  getClassAdmissionRules,
  toBlockLetters,
} from '../rules';
import type { UnifiedAdmissionFormValues } from '../schema';

interface StepParentsAndAddressProps {
  form: UseFormReturn<UnifiedAdmissionFormValues>;
  selectedClass?: SchoolClass;
}

export function StepParentsAndAddress({
  form,
  selectedClass,
}: StepParentsAndAddressProps) {
  const { pick } = useI18n();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const rules = getClassAdmissionRules(selectedClass?.numericValue ?? 6);

  const fatherAlive = watch('fatherAlive');
  const motherAlive = watch('motherAlive');
  const bothParentsDeceased = !fatherAlive && !motherAlive;
  const hasSeparateGuardian = watch('hasSeparateGuardian');
  const showLegalGuardian = bothParentsDeceased || hasSeparateGuardian;
  const sameAsPermanent = watch('sameAsPermanent');

  const handleToggleSameAddress = (checked: boolean) => {
    setValue('sameAsPermanent', checked, { shouldValidate: true });
    if (checked) {
      const perm = watch('permanentAddressParts');
      setValue('presentAddressParts', { ...perm }, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-7">
      {/* 1. Father's Information */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary shrink-0" />
            {pick('পিতার তথ্য (এনআইডি অনুযায়ী)', 'Father’s Information (per NID)')}
          </h3>
          <div className="inline-flex items-center gap-1 p-1 bg-surface-muted rounded-[var(--radius)] border border-border">
            <button
              type="button"
              onClick={() => setValue('fatherAlive', true, { shouldValidate: true })}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                fatherAlive
                  ? 'bg-surface text-foreground border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {pick('জীবিত', 'Alive')}
            </button>
            <button
              type="button"
              onClick={() => setValue('fatherAlive', false, { shouldValidate: true })}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                !fatherAlive
                  ? 'bg-surface text-foreground border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {pick('মৃত (Late)', 'Deceased')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={pick('পিতার নাম (বাংলায়)', 'Father’s Name (Bangla)')}
            required
            error={errors.fatherNameBn?.message}
          >
            <Input
              {...register('fatherNameBn')}
              placeholder={fatherAlive ? 'যেমন: মোঃ সাইদুর রহমান' : 'যেমন: মৃত মোঃ সাইদুর রহমান'}
            />
          </FormField>

          <FormField
            label={pick('পিতার নাম (ইংরেজিতে — BLOCK LETTERS)', 'Father’s Name (English — BLOCK LETTERS)')}
            required
            error={errors.fatherNameEn?.message}
          >
            <Input
              value={watch('fatherNameEn')}
              onChange={(e) =>
                setValue('fatherNameEn', toBlockLetters(e.target.value), {
                  shouldValidate: true,
                })
              }
              placeholder="e.g. MD. SAIDUR RAHMAN"
              className="uppercase tracking-wide"
            />
          </FormField>

          {fatherAlive && (
            <>
              <FormField
                label={pick('পিতার এনআইডি নম্বর', 'Father’s NID Number')}
                required={rules.requiresParentNid}
                hint={pick('১০, ১৩ অথবা ১৭ ডিজিট', '10, 13, or 17 digits')}
                error={errors.fatherNid?.message}
              >
                <Input
                  value={watch('fatherNid')}
                  inputMode="numeric"
                  maxLength={17}
                  onChange={(e) =>
                    setValue('fatherNid', cleanNumericInput(e.target.value, 17), {
                      shouldValidate: true,
                    })
                  }
                  placeholder="19848614500112233"
                  className="font-mono tabular-nums"
                />
              </FormField>

              <FormField
                label={pick('পিতার মোবাইল নম্বর (১১ ডিজিট)', 'Father’s Mobile Number (11 Digits)')}
                required={!motherAlive}
                hint={pick('বিদ্যালয়ের জরুরি এসএমএস ও যোগাযোগের জন্য', 'Used for attendance & school SMS alerts')}
                error={errors.fatherPhone?.message}
              >
                <Input
                  value={watch('fatherPhone')}
                  inputMode="numeric"
                  maxLength={11}
                  onChange={(e) =>
                    setValue('fatherPhone', cleanNumericInput(e.target.value, 11), {
                      shouldValidate: true,
                    })
                  }
                  placeholder="017XXXXXXXX"
                  className="font-mono tabular-nums"
                />
              </FormField>

              <FormField
                label={pick('পিতার পেশা', 'Father’s Occupation')}
                error={errors.fatherOccupation?.message}
              >
                <Input
                  {...register('fatherOccupation')}
                  placeholder="যেমন: ব্যবসা / চাকরি / কৃষি / প্রবাসী"
                />
              </FormField>
            </>
          )}
        </div>
      </div>

      {/* 2. Mother's Information */}
      <div className="pt-5 border-t border-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">
            {pick('মাতার তথ্য (এনআইডি অনুযায়ী)', 'Mother’s Information (per NID)')}
          </h3>
          <div className="inline-flex items-center gap-1 p-1 bg-surface-muted rounded-[var(--radius)] border border-border">
            <button
              type="button"
              onClick={() => setValue('motherAlive', true, { shouldValidate: true })}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                motherAlive
                  ? 'bg-surface text-foreground border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {pick('জীবিত', 'Alive')}
            </button>
            <button
              type="button"
              onClick={() => setValue('motherAlive', false, { shouldValidate: true })}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                !motherAlive
                  ? 'bg-surface text-foreground border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {pick('মৃত (Late)', 'Deceased')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={pick('মাতার নাম (বাংলায়)', 'Mother’s Name (Bangla)')}
            required
            error={errors.motherNameBn?.message}
          >
            <Input
              {...register('motherNameBn')}
              placeholder={motherAlive ? 'যেমন: মোছাঃ সালমা বেগম' : 'যেমন: মৃত মোছাঃ সালমা বেগম'}
            />
          </FormField>

          <FormField
            label={pick('মাতার নাম (ইংরেজিতে — BLOCK LETTERS)', 'Mother’s Name (English — BLOCK LETTERS)')}
            required
            error={errors.motherNameEn?.message}
          >
            <Input
              value={watch('motherNameEn')}
              onChange={(e) =>
                setValue('motherNameEn', toBlockLetters(e.target.value), {
                  shouldValidate: true,
                })
              }
              placeholder="e.g. MST. SALMA BEGUM"
              className="uppercase tracking-wide"
            />
          </FormField>

          {motherAlive && (
            <>
              <FormField
                label={pick('মাতার এনআইডি নম্বর', 'Mother’s NID Number')}
                required={rules.requiresParentNid}
                hint={pick('১০, ১৩ অথবা ১৭ ডিজিট', '10, 13, or 17 digits')}
                error={errors.motherNid?.message}
              >
                <Input
                  value={watch('motherNid')}
                  inputMode="numeric"
                  maxLength={17}
                  onChange={(e) =>
                    setValue('motherNid', cleanNumericInput(e.target.value, 17), {
                      shouldValidate: true,
                    })
                  }
                  placeholder="19888614500112244"
                  className="font-mono tabular-nums"
                />
              </FormField>

              <FormField
                label={pick('মাতার মোবাইল নম্বর (১১ ডিজিট)', 'Mother’s Mobile Number (11 Digits)')}
                required={!fatherAlive}
                error={errors.motherPhone?.message}
              >
                <Input
                  value={watch('motherPhone')}
                  inputMode="numeric"
                  maxLength={11}
                  onChange={(e) =>
                    setValue('motherPhone', cleanNumericInput(e.target.value, 11), {
                      shouldValidate: true,
                    })
                  }
                  placeholder="018XXXXXXXX"
                  className="font-mono tabular-nums"
                />
              </FormField>

              <FormField
                label={pick('মাতার পেশা', 'Mother’s Occupation')}
                error={errors.motherOccupation?.message}
              >
                <Input
                  {...register('motherOccupation')}
                  placeholder="যেমন: গৃহিণী / শিক্ষকতা / চাকরি"
                />
              </FormField>
            </>
          )}

          <FormField
            label={pick('অভিভাবকের মাসিক আয় (টাকা — ঐচ্ছিক)', 'Guardian Monthly Income (BDT — Optional)')}
          >
            <Input
              value={watch('guardianMonthlyIncome')}
              inputMode="numeric"
              onChange={(e) =>
                setValue('guardianMonthlyIncome', cleanNumericInput(e.target.value, 8))
              }
              placeholder="যেমন: 25000"
              className="font-mono tabular-nums"
            />
          </FormField>
        </div>
      </div>

      {/* 3. Conditional Legal Guardian Section (Auto-Required if Both Parents Deceased) */}
      <div className="pt-5 border-t border-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              {bothParentsDeceased && (
                <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
              )}
              {pick(
                'বৈধ অভিভাবকের তথ্য (পিতা-মাতা উভয়েই মৃত হলে বা ভিন্ন অভিভাবকের তত্ত্বাবধানে থাকলে)',
                'Legal Guardian Details (Mandatory if Both Parents Deceased)'
              )}
            </h4>
            {bothParentsDeceased && (
              <p className="text-xs text-destructive">
                {pick(
                  'পিতা ও মাতা উভয়েই মৃত নির্বাচিত হওয়ায় বৈধ অভিভাবকের তথ্য প্রদান বাধ্যতামূলক।',
                  'Both parents are marked deceased; legal guardian information is mandatory.'
                )}
              </p>
            )}
          </div>
          {!bothParentsDeceased && (
            <Switch
              checked={hasSeparateGuardian}
              onChange={(val) => setValue('hasSeparateGuardian', val)}
              label={pick('ভিন্ন অভিভাবক যোগ করুন', 'Add separate guardian')}
            />
          )}
        </div>

        {showLegalGuardian && (
          <div className="p-4 sm:p-5 rounded-[var(--radius)] border border-border bg-surface-muted/35 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label={pick('বৈধ অভিভাবকের নাম (বাংলায়)', 'Legal Guardian Name (Bangla)')}
              required
              error={errors.legalGuardianNameBn?.message}
            >
              <Input {...register('legalGuardianNameBn')} placeholder="যেমন: মোঃ কামাল হোসেন" />
            </FormField>

            <FormField
              label={pick('বৈধ অভিভাবকের নাম (ইংরেজিতে)', 'Legal Guardian Name (English)')}
            >
              <Input
                value={watch('legalGuardianNameEn')}
                onChange={(e) =>
                  setValue('legalGuardianNameEn', toBlockLetters(e.target.value))
                }
                placeholder="e.g. MD. KAMAL HOSSAIN"
                className="uppercase tracking-wide"
              />
            </FormField>

            <FormField
              label={pick('শিক্ষার্থীর সাথে সম্পর্ক', 'Relationship with Student')}
              required
              error={errors.legalGuardianRelation?.message}
            >
              <Input
                {...register('legalGuardianRelation')}
                placeholder="যেমন: চাচা / মামা / দাদা / বড় ভাই"
              />
            </FormField>

            <FormField
              label={pick('অভিভাবকের মোবাইল নম্বর (১১ ডিজিট)', 'Legal Guardian Mobile (11 Digits)')}
              required
              error={errors.legalGuardianPhone?.message}
            >
              <Input
                value={watch('legalGuardianPhone')}
                inputMode="numeric"
                maxLength={11}
                onChange={(e) =>
                  setValue('legalGuardianPhone', cleanNumericInput(e.target.value, 11), {
                    shouldValidate: true,
                  })
                }
                placeholder="017XXXXXXXX"
                className="font-mono tabular-nums"
              />
            </FormField>

            <FormField
              label={pick('অভিভাবকের এনআইডি নম্বর', 'Legal Guardian NID')}
              error={errors.legalGuardianNid?.message}
            >
              <Input
                value={watch('legalGuardianNid')}
                inputMode="numeric"
                maxLength={17}
                onChange={(e) =>
                  setValue('legalGuardianNid', cleanNumericInput(e.target.value, 17), {
                    shouldValidate: true,
                  })
                }
                placeholder="১০, ১৩ বা ১৭ ডিজিট"
                className="font-mono tabular-nums"
              />
            </FormField>

            <FormField
              label={pick('অভিভাবকের ঠিকানা', 'Legal Guardian Address')}
              required={bothParentsDeceased}
              error={errors.legalGuardianAddress?.message}
            >
              <Input
                {...register('legalGuardianAddress')}
                placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা"
              />
            </FormField>
          </div>
        )}
      </div>

      {/* 4. Structured Addresses */}
      <div className="pt-5 border-t border-border space-y-5">
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Home className="w-4 h-4 text-primary shrink-0" />
            {pick('স্থায়ী ঠিকানা (Permanent Address)', 'Permanent Address')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <FormField
                label={pick('গ্রাম / বাসা ও রোড', 'Village / House')}
                required
                error={errors.permanentAddressParts?.village?.message}
              >
                <Input
                  {...register('permanentAddressParts.village')}
                  placeholder="যেমন: ভোজেশ্বর বাজার / মশুরা"
                />
              </FormField>
            </div>
            <FormField
              label={pick('ডাকঘর', 'Post Office')}
              required
              error={errors.permanentAddressParts?.postOffice?.message}
            >
              <Input
                {...register('permanentAddressParts.postOffice')}
                placeholder="যেমন: ভোজেশ্বর"
              />
            </FormField>
            <FormField
              label={pick('উপজেলা / থানা', 'Upazila / Thana')}
              required
              error={errors.permanentAddressParts?.upazila?.message}
            >
              <Input
                {...register('permanentAddressParts.upazila')}
                placeholder="যেমন: নড়িয়া"
              />
            </FormField>
            <FormField
              label={pick('জেলা', 'District')}
              required
              error={errors.permanentAddressParts?.district?.message}
            >
              <Input
                {...register('permanentAddressParts.district')}
                placeholder="যেমন: শরীয়তপুর"
              />
            </FormField>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground">
              {pick('বর্তমান ঠিকানা (Present Address)', 'Present Address')}
            </h3>
            <Switch
              checked={sameAsPermanent}
              onChange={handleToggleSameAddress}
              label={pick('স্থায়ী ও বর্তমান ঠিকানা একই', 'Same as permanent address')}
            />
          </div>

          {!sameAsPermanent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2">
                <FormField
                  label={pick('গ্রাম / বাসা ও রোড', 'Village / House')}
                  required
                  error={errors.presentAddressParts?.village?.message}
                >
                  <Input
                    {...register('presentAddressParts.village')}
                    placeholder="গ্রাম / বাসা নম্বর"
                  />
                </FormField>
              </div>
              <FormField
                label={pick('ডাকঘর', 'Post Office')}
                required
                error={errors.presentAddressParts?.postOffice?.message}
              >
                <Input
                  {...register('presentAddressParts.postOffice')}
                  placeholder="ডাকঘর"
                />
              </FormField>
              <FormField
                label={pick('উপজেলা / থানা', 'Upazila / Thana')}
                required
                error={errors.presentAddressParts?.upazila?.message}
              >
                <Input
                  {...register('presentAddressParts.upazila')}
                  placeholder="উপজেলা / থানা"
                />
              </FormField>
              <FormField
                label={pick('জেলা', 'District')}
                required
                error={errors.presentAddressParts?.district?.message}
              >
                <Input
                  {...register('presentAddressParts.district')}
                  placeholder="জেলা"
                />
              </FormField>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
