'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { PhoneCall, ShieldAlert } from 'lucide-react';
import type { SchoolClass } from '@/src/types/entities';
import type { PrimaryGuardianType } from '@/src/types/proposed/future';
import {
  cleanNumericInput,
  formatStructuredAddress,
  getClassAdmissionRules,
  toBlockLetters,
} from '../rules';
import type { UnifiedAdmissionFormValues } from '../schema';
import {
  AdmissionField,
  AdmissionInput,
  AdmissionSectionHeader,
} from './AdmissionFormPrimitives';

interface StepParentsAndAddressProps {
  form: UseFormReturn<UnifiedAdmissionFormValues>;
  selectedClass?: SchoolClass;
}

export function StepParentsAndAddress({
  form,
  selectedClass,
}: StepParentsAndAddressProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const rules = getClassAdmissionRules(selectedClass?.numericValue ?? 6);

  const fatherAlive = watch('fatherAlive');
  const motherAlive = watch('motherAlive');
  const primaryGuardianType = watch('primaryGuardianType');
  const bothParentsDeceased = !fatherAlive && !motherAlive;
  const hasSeparateGuardian = watch('hasSeparateGuardian');
  const showLegalGuardian =
    bothParentsDeceased ||
    hasSeparateGuardian ||
    primaryGuardianType === 'LEGAL_GUARDIAN';
  const sameAsPermanent = watch('sameAsPermanent');
  const permanentAddressParts = watch('permanentAddressParts');

  const handleFatherAliveChange = (alive: boolean) => {
    setValue('fatherAlive', alive, { shouldValidate: true });
    if (!alive && primaryGuardianType === 'FATHER') {
      setValue('primaryGuardianType', motherAlive ? 'MOTHER' : 'LEGAL_GUARDIAN', {
        shouldValidate: true,
      });
    }
  };

  const handleMotherAliveChange = (alive: boolean) => {
    setValue('motherAlive', alive, { shouldValidate: true });
    if (!alive && primaryGuardianType === 'MOTHER') {
      setValue('primaryGuardianType', fatherAlive ? 'FATHER' : 'LEGAL_GUARDIAN', {
        shouldValidate: true,
      });
    }
  };

  const handlePrimaryGuardianChange = (next: PrimaryGuardianType) => {
    setValue('primaryGuardianType', next, { shouldValidate: true });
    if (next === 'LEGAL_GUARDIAN' && !bothParentsDeceased) {
      setValue('hasSeparateGuardian', true);
    }
  };

  const handleToggleSameAddress = (checked: boolean) => {
    setValue('sameAsPermanent', checked, { shouldValidate: true });
    if (checked) {
      setValue('presentAddressParts', { ...permanentAddressParts }, { shouldValidate: true });
    }
  };

  const primaryOptions: Array<{
    value: PrimaryGuardianType;
    label: string;
    disabled: boolean;
  }> = [
    {
      value: 'FATHER',
      label: 'পিতা',
      disabled: !fatherAlive,
    },
    {
      value: 'MOTHER',
      label: 'মাতা',
      disabled: !motherAlive,
    },
    {
      value: 'LEGAL_GUARDIAN',
      label: 'বৈধ অভিভাবক',
      disabled: false,
    },
  ];

  return (
    <div className="space-y-7">
      {/* 1. Father's Information */}
      <div className="space-y-4">
        <AdmissionSectionHeader
          title={'১. পিতার তথ্য'}
          rightSlot={
            <div className="inline-flex border border-border/80 rounded-xl overflow-hidden divide-x divide-border/80 text-sm font-semibold">
              <button
                type="button"
                onClick={() => handleFatherAliveChange(true)}
                className={`px-3.5 py-1.5 transition-colors cursor-pointer ${
                  fatherAlive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {'জীবিত'}
              </button>
              <button
                type="button"
                onClick={() => handleFatherAliveChange(false)}
                className={`px-3.5 py-1.5 transition-colors cursor-pointer ${
                  !fatherAlive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {'মৃত'}
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdmissionField
            label={'পিতার নাম (বাংলায়)'}
            required
            error={errors.fatherNameBn?.message}
          >
            <AdmissionInput
              {...register('fatherNameBn')}
              placeholder={fatherAlive ? 'যেমন: মোঃ সাইদুর রহমান' : 'যেমন: মৃত মোঃ সাইদুর রহমান'}
            />
          </AdmissionField>

          <AdmissionField
            label={'পিতার নাম (ইংরেজিতে বড় অক্ষরে)'}
            required
            error={errors.fatherNameEn?.message}
          >
            <AdmissionInput
              value={watch('fatherNameEn')}
              onChange={(e) =>
                setValue('fatherNameEn', toBlockLetters(e.target.value), {
                  shouldValidate: true,
                })
              }
              placeholder="MD. SAIDUR RAHMAN"
              className="uppercase tracking-wide"
            />
          </AdmissionField>

          <AdmissionField
            label={
              fatherAlive
                ? 'পিতার এনআইডি নম্বর'
                : 'পিতার এনআইডি নম্বর (সংগ্রহে থাকলে — ঐচ্ছিক)'
            }
            required={fatherAlive && rules.requiresParentNid}
            hint={
              fatherAlive
                ? '১০, ১৩ অথবা ১৭ ডিজিট'
                : 'বোর্ড রেজিস্ট্রেশনে (eSIF) সহায়ক—না থাকলে খালি রাখা যাবে।'
            }
            error={errors.fatherNid?.message}
          >
            <AdmissionInput
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
          </AdmissionField>

          {fatherAlive && (
            <>
              <AdmissionField
                label={'পিতার মোবাইল নম্বর'}
                required={primaryGuardianType === 'FATHER'}
                error={errors.fatherPhone?.message}
              >
                <AdmissionInput
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
              </AdmissionField>

              <AdmissionField
                label={'পিতার পেশা'}
                error={errors.fatherOccupation?.message}
              >
                <AdmissionInput
                  {...register('fatherOccupation')}
                  placeholder="যেমন: ব্যবসা / চাকরি / কৃষি"
                />
              </AdmissionField>
            </>
          )}
        </div>
      </div>

      {/* 2. Mother's Information (Strictly Mother's own fields — NO household income mixed in) */}
      <div className="space-y-4">
        <AdmissionSectionHeader
          title={'২. মাতার তথ্য'}
          rightSlot={
            <div className="inline-flex border border-border/80 rounded-xl overflow-hidden divide-x divide-border/80 text-sm font-semibold">
              <button
                type="button"
                onClick={() => handleMotherAliveChange(true)}
                className={`px-3.5 py-1.5 transition-colors cursor-pointer ${
                  motherAlive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {'জীবিত'}
              </button>
              <button
                type="button"
                onClick={() => handleMotherAliveChange(false)}
                className={`px-3.5 py-1.5 transition-colors cursor-pointer ${
                  !motherAlive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {'মৃত'}
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdmissionField
            label={'মাতার নাম (বাংলায়)'}
            required
            error={errors.motherNameBn?.message}
          >
            <AdmissionInput
              {...register('motherNameBn')}
              placeholder={motherAlive ? 'যেমন: মোছাঃ সালমা বেগম' : 'যেমন: মৃত মোছাঃ সালমা বেগম'}
            />
          </AdmissionField>

          <AdmissionField
            label={'মাতার নাম (ইংরেজিতে বড় অক্ষরে)'}
            required
            error={errors.motherNameEn?.message}
          >
            <AdmissionInput
              value={watch('motherNameEn')}
              onChange={(e) =>
                setValue('motherNameEn', toBlockLetters(e.target.value), {
                  shouldValidate: true,
                })
              }
              placeholder="MST. SALMA BEGUM"
              className="uppercase tracking-wide"
            />
          </AdmissionField>

          <AdmissionField
            label={
              motherAlive
                ? 'মাতার এনআইডি নম্বর'
                : 'মাতার এনআইডি নম্বর (সংগ্রহে থাকলে — ঐচ্ছিক)'
            }
            required={motherAlive && rules.requiresParentNid}
            hint={
              motherAlive
                ? '১০, ১৩ অথবা ১৭ ডিজিট'
                : 'বোর্ড রেজিস্ট্রেশনে (eSIF) সহায়ক—না থাকলে খালি রাখা যাবে।'
            }
            error={errors.motherNid?.message}
          >
            <AdmissionInput
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
          </AdmissionField>

          {motherAlive && (
            <>
              <AdmissionField
                label={'মাতার মোবাইল নম্বর'}
                required={primaryGuardianType === 'MOTHER'}
                error={errors.motherPhone?.message}
              >
                <AdmissionInput
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
              </AdmissionField>

              <AdmissionField
                label={'মাতার পেশা'}
                error={errors.motherOccupation?.message}
              >
                <AdmissionInput
                  {...register('motherOccupation')}
                  placeholder="যেমন: গৃহিণী / শিক্ষকতা / চাকরি"
                />
              </AdmissionField>
            </>
          )}
        </div>
      </div>

      {/* 3. Primary Contact, Household Income & Legal Guardian */}
      <div className="space-y-4">
        <AdmissionSectionHeader
          title={'৩. প্রাথমিক যোগাযোগকারী অভিভাবক ও পারিবারিক তথ্য'}
          subtitle={'জরুরি প্রয়োজন, উপস্থিতি এসএমএস ও বিদ্যালয়ের নোটিশের জন্য প্রাথমিক অভিভাবক নির্ধারণ করুন।'}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Primary Contact Radio Selector */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-base font-semibold text-foreground">
              <span className="inline-flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-primary" />
                {'প্রাথমিক যোগাযোগকারী অভিভাবক'}
              </span>
              <span className="text-destructive ml-1">*</span>
            </label>
            <div className="grid grid-cols-3 border border-border/80 rounded-xl overflow-hidden divide-x divide-border/80 shadow-xs">
              {primaryOptions.map((opt) => {
                const active = primaryGuardianType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handlePrimaryGuardianChange(opt.value)}
                    className={`h-11 px-3 text-base font-semibold transition-colors ${
                      opt.disabled
                        ? 'bg-surface-muted/40 text-muted-foreground/45 cursor-not-allowed'
                        : active
                          ? 'bg-primary text-primary-foreground cursor-pointer shadow-xs'
                          : 'bg-surface text-foreground hover:bg-surface-muted/60 cursor-pointer'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.primaryGuardianType && (
              <p className="text-sm text-destructive font-medium">
                {errors.primaryGuardianType.message}
              </p>
            )}
          </div>

          {/* Combined Household / Guardian Monthly Income (Properly placed outside Mother's section) */}
          <AdmissionField
            label={'পরিবারের মাসিক আয় (টাকা — ঐচ্ছিক)'}
          >
            <AdmissionInput
              value={watch('guardianMonthlyIncome')}
              inputMode="numeric"
              onChange={(e) =>
                setValue('guardianMonthlyIncome', cleanNumericInput(e.target.value, 8))
              }
              placeholder="যেমন: 25000"
              className="font-mono tabular-nums"
            />
          </AdmissionField>
        </div>

        {/* Legal Guardian Toggle or Mandatory Notice */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {bothParentsDeceased ? (
            <p className="text-sm font-medium text-destructive inline-flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              {'পিতা ও মাতা উভয়েই মৃত হওয়ায় বৈধ অভিভাবকের তথ্য প্রদান বাধ্যতামূলক।'}
            </p>
          ) : primaryGuardianType === 'LEGAL_GUARDIAN' ? (
            <p className="text-sm text-muted-foreground">
              {'বৈধ অভিভাবককে প্রাথমিক যোগাযোগকারী হিসেবে নির্বাচন করা হয়েছে—নিচের তথ্যগুলো পূরণ করুন।'}
            </p>
          ) : (
            <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasSeparateGuardian}
                onChange={(e) => setValue('hasSeparateGuardian', e.target.checked)}
                className="w-4 h-4 rounded-[3px] accent-primary"
              />
              <span>
                {'পিতা-মাতা ব্যতীত ভিন্ন বৈধ অভিভাবকের তথ্য যুক্ত করুন (ঐচ্ছিক)'}
              </span>
            </label>
          )}
        </div>

        {showLegalGuardian && (
          <div className="p-5 rounded-2xl border border-border/80 bg-surface-muted/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdmissionField
              label={'বৈধ অভিভাবকের নাম (বাংলায়)'}
              required
              error={errors.legalGuardianNameBn?.message}
            >
              <AdmissionInput {...register('legalGuardianNameBn')} placeholder="যেমন: মোঃ কামাল হোসেন" />
            </AdmissionField>

            <AdmissionField
              label={'বৈধ অভিভাবকের নাম (ইংরেজিতে)'}
            >
              <AdmissionInput
                value={watch('legalGuardianNameEn')}
                onChange={(e) =>
                  setValue('legalGuardianNameEn', toBlockLetters(e.target.value))
                }
                placeholder="MD. KAMAL HOSSAIN"
                className="uppercase tracking-wide"
              />
            </AdmissionField>

            <AdmissionField
              label={'শিক্ষার্থীর সাথে সম্পর্ক'}
              required
              error={errors.legalGuardianRelation?.message}
            >
              <AdmissionInput
                {...register('legalGuardianRelation')}
                placeholder="যেমন: চাচা / মামা / দাদা / বড় ভাই"
              />
            </AdmissionField>

            <AdmissionField
              label={'বৈধ অভিভাবকের মোবাইল নম্বর'}
              required
              error={errors.legalGuardianPhone?.message}
            >
              <AdmissionInput
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
            </AdmissionField>

            <AdmissionField
              label={'বৈধ অভিভাবকের এনআইডি নম্বর'}
              error={errors.legalGuardianNid?.message}
            >
              <AdmissionInput
                value={watch('legalGuardianNid')}
                inputMode="numeric"
                maxLength={17}
                onChange={(e) =>
                  setValue('legalGuardianNid', cleanNumericInput(e.target.value, 17), {
                    shouldValidate: true,
                  })
                }
                placeholder="১০, ১৩ অথবা ১৭ ডিজিট"
                className="font-mono tabular-nums"
              />
            </AdmissionField>

            <AdmissionField
              label={'বৈধ অভিভাবকের ঠিকানা'}
              required={bothParentsDeceased}
              error={errors.legalGuardianAddress?.message}
            >
              <AdmissionInput
                {...register('legalGuardianAddress')}
                placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা"
              />
            </AdmissionField>
          </div>
        )}
      </div>

      {/* 4. Structured Permanent & Present Addresses */}
      <div className="space-y-5">
        <div className="space-y-4">
          <AdmissionSectionHeader
            title={'৪. স্থায়ী ঠিকানা'}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdmissionField
              label={'গ্রাম / মহল্লা / বাসা নং'}
              required
              error={errors.permanentAddressParts?.village?.message}
              className="sm:col-span-2"
            >
              <AdmissionInput
                {...register('permanentAddressParts.village')}
                placeholder="যেমন: ভোজেশ্বর বাজার"
              />
            </AdmissionField>

            <AdmissionField
              label={'ডাকঘর'}
              required
              error={errors.permanentAddressParts?.postOffice?.message}
            >
              <AdmissionInput
                {...register('permanentAddressParts.postOffice')}
                placeholder="যেমন: ভোজেশ্বর"
              />
            </AdmissionField>

            <AdmissionField
              label={'পোস্ট কোড (ঐচ্ছিক)'}
              error={errors.permanentAddressParts?.postCode?.message}
            >
              <AdmissionInput
                value={watch('permanentAddressParts.postCode') || ''}
                inputMode="numeric"
                maxLength={4}
                onChange={(e) =>
                  setValue(
                    'permanentAddressParts.postCode',
                    cleanNumericInput(e.target.value, 4),
                    { shouldValidate: true }
                  )
                }
                placeholder="8021"
                className="font-mono tabular-nums"
              />
            </AdmissionField>

            <AdmissionField
              label={'উপজেলা / থানা'}
              required
              error={errors.permanentAddressParts?.upazila?.message}
              className="sm:col-span-1 lg:col-span-2"
            >
              <AdmissionInput
                {...register('permanentAddressParts.upazila')}
                placeholder="যেমন: নড়িয়া"
              />
            </AdmissionField>

            <AdmissionField
              label={'জেলা'}
              required
              error={errors.permanentAddressParts?.district?.message}
              className="sm:col-span-1 lg:col-span-2"
            >
              <AdmissionInput
                {...register('permanentAddressParts.district')}
                placeholder="যেমন: শরীয়তপুর"
              />
            </AdmissionField>
          </div>
        </div>

        <div className="space-y-4">
          <AdmissionSectionHeader
            title={'৫. বর্তমান ঠিকানা'}
            rightSlot={
              <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sameAsPermanent}
                  onChange={(e) => handleToggleSameAddress(e.target.checked)}
                  className="w-4 h-4 rounded-[3px] accent-primary"
                />
                <span>{'স্থায়ী ঠিকানার অনুরূপ'}</span>
              </label>
            }
          />

          {sameAsPermanent ? (
            <div className="px-4 py-3 rounded-2xl border border-border/80 bg-surface-muted/30 text-base text-muted-foreground">
              {formatStructuredAddress(permanentAddressParts) ||
                'স্থায়ী ঠিকানা পূরণ করলে এখানে স্বয়ংক্রিয়ভাবে যুক্ত হবে।'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AdmissionField
                label={'গ্রাম / মহল্লা / বাসা নং'}
                required
                error={errors.presentAddressParts?.village?.message}
                className="sm:col-span-2"
              >
                <AdmissionInput
                  {...register('presentAddressParts.village')}
                  placeholder="গ্রাম / বাসা নম্বর"
                />
              </AdmissionField>

              <AdmissionField
                label={'ডাকঘর'}
                required
                error={errors.presentAddressParts?.postOffice?.message}
              >
                <AdmissionInput
                  {...register('presentAddressParts.postOffice')}
                  placeholder="ডাকঘর"
                />
              </AdmissionField>

              <AdmissionField
                label={'পোস্ট কোড (ঐচ্ছিক)'}
                error={errors.presentAddressParts?.postCode?.message}
              >
                <AdmissionInput
                  value={watch('presentAddressParts.postCode') || ''}
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(e) =>
                    setValue(
                      'presentAddressParts.postCode',
                      cleanNumericInput(e.target.value, 4),
                      { shouldValidate: true }
                    )
                  }
                  placeholder="8021"
                  className="font-mono tabular-nums"
                />
              </AdmissionField>

              <AdmissionField
                label={'উপজেলা / থানা'}
                required
                error={errors.presentAddressParts?.upazila?.message}
                className="sm:col-span-1 lg:col-span-2"
              >
                <AdmissionInput
                  {...register('presentAddressParts.upazila')}
                  placeholder="উপজেলা / থানা"
                />
              </AdmissionField>

              <AdmissionField
                label={'জেলা'}
                required
                error={errors.presentAddressParts?.district?.message}
                className="sm:col-span-1 lg:col-span-2"
              >
                <AdmissionInput
                  {...register('presentAddressParts.district')}
                  placeholder="জেলা"
                />
              </AdmissionField>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
