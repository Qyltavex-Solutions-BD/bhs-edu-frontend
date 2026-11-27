'use client';

import React from 'react';
import { Pencil, User } from 'lucide-react';
import { getEnumMeta } from '@/src/lib/constants/enums';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import { SCHOOL_LOGO_SRC, SchoolEmblem } from '@/src/components/shared/Feedback';
import type { AdmissionFormPrintData } from '@/src/lib/utils/cn';
import {
  type AdmissionCatalogData,
  ADMISSION_TYPE_META,
  BLOOD_GROUP_OPTIONS,
  calculateAgeYears,
  getClassAdmissionRules,
  getOptionalSubjectsForClassGroup,
  getRequiredDocumentChecklist,
  gpaToLetterGrade,
} from '../rules';
import { resolvePrimaryGuardianPhone } from '../mappers';
import type { UnifiedAdmissionFormValues } from '../schema';

export interface SubmittedSheetMeta {
  applicationNumber: string;
  submittedAt: string;
  admissionTestRoll?: string;
  admissionTestDate?: string;
}

interface AdmissionFormPreviewSheetProps {
  values: UnifiedAdmissionFormValues;
  db: AdmissionCatalogData;
  mode: 'public' | 'admin';
  onJumpToStep?: (step: 1 | 2 | 3) => void;
  submittedMeta?: SubmittedSheetMeta;
}

/**
 * Builds a compact, serializable print payload for the standalone /print-certificate route
 * (used as automatic sandbox fallback when window.print() is blocked inside an iframe).
 */
export function buildAdmissionFormPrintData(
  values: UnifiedAdmissionFormValues,
  db: AdmissionCatalogData,
  mode: 'public' | 'admin',
  submittedMeta: SubmittedSheetMeta
): AdmissionFormPrintData {
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
  const sessionLabel =
    mode === 'admin'
      ? db.academicYears.find((y) => y.id === values.academicYearId)?.name || '২০২৬'
      : db.admissionContent?.academicSession || '২০২৭';

  return {
    school: db.schoolProfile ?? ({
      id: 'default',
      name: 'Bhojeshwar High School',
      nameBn: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
      nameEn: 'Bhojeshwar High School',
      eiin: '113587',
      address: 'নড়িয়া, শরীয়তপুর',
      createdAt: '',
      updatedAt: '',
    } as NonNullable<AdmissionCatalogData['schoolProfile']>),
    values,
    targetClassNameBn: selectedClass?.nameBn ?? '৬ষ্ঠ শ্রেণি',
    targetClassNameEn: selectedClass?.name ?? 'Class 6',
    numericClass,
    groupNameBn: group?.nameBn ?? null,
    groupNameEn: group?.name ?? null,
    optionalSubjectLabel: chosenOptional
      ? `${chosenOptional.nameBn}${chosenOptional.officialCode ? ` (${chosenOptional.officialCode})` : ''}`
      : null,
    sessionLabel,
    declarationText: db.admissionContent?.declarationText ?? null,
    submittedMeta,
  };
}

function A4Row({
  label,
  value,
  mono,
  colSpan2,
}: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  colSpan2?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[142px_1fr] bg-white ${
        colSpan2 ? 'col-span-2' : ''
      }`}
    >
      <div className="px-2.5 py-1.5 text-[13px] font-medium text-[#3F3F46] bg-[#F4F4F5] border-r border-[#D4D4D8] flex items-center leading-[1.4]">
        {label}
      </div>
      <div
        className={`px-2.5 py-1.5 text-[13.5px] text-[#111111] bg-white flex items-center break-words leading-[1.4] ${
          mono ? 'font-mono tabular-nums' : ''
        }`}
      >
        {value || <span className="text-[#A1A1AA]">—</span>}
      </div>
    </div>
  );
}

function A4SectionBar({
  title,
  editStep,
  onJumpToStep,
  editLabel,
  first,
}: {
  title: string;
  editStep?: 1 | 2 | 3;
  onJumpToStep?: (step: 1 | 2 | 3) => void;
  editLabel: string;
  first?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-1.5 bg-[#E4E4E7]/85 border-b border-[#52525B] ${
        first ? '' : 'border-t'
      }`}
    >
      <h4 className="text-[13.5px] font-bold text-[#111111] tracking-wide leading-snug">
        {title}
      </h4>
      {editStep && onJumpToStep && (
        <button
          type="button"
          onClick={() => onJumpToStep(editStep)}
          className="no-print inline-flex items-center gap-1 text-[13px] font-semibold text-[#0A6E31] hover:underline cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          {editLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Pure, print-locked A4 Official Admission Form Document.
 * Matches the exact Bangladeshi institutional craftsmanship of Admin TC (ছাড়পত্র) & Testimonial (প্রত্যয়নপত্র):
 * - Pure crisp white A4 paper (794px) immune to dark mode
 * - Classic double-border institutional frame (#18181B outer / #52525B inner)
 * - Full-color BHS School Emblem in letterhead + subtle centered watermark (জলছাপ)
 * - Fixed non-breaking 2-column institutional table grid so Print & PDF never collapse or break
 */
export function PrintableAdmissionFormDocument({
  data,
  onJumpToStep,
  isPreviewOnly = false,
}: {
  data: AdmissionFormPrintData;
  onJumpToStep?: (step: 1 | 2 | 3) => void;
  isPreviewOnly?: boolean;
}) {
  const { school, values, numericClass, sessionLabel, submittedMeta } = data;
  const rules = getClassAdmissionRules(numericClass);
  const computedAge = calculateAgeYears(values.dateOfBirth);
  const bloodLabel =
    BLOOD_GROUP_OPTIONS.find((b) => b.value === values.bloodGroup)?.label || '—';
  const genderLabel =
    getEnumMeta('Gender', values.gender).bn;
  const religionLabel =
    getEnumMeta('Religion', values.religion).bn;
  const derivedGrade = gpaToLetterGrade(values.prevExamGpa);
  const presentParts = values.sameAsPermanent
    ? values.permanentAddressParts
    : values.presentAddressParts;

  const primaryGuardianLabel =
    values.primaryGuardianType === 'FATHER'
      ? 'পিতা'
      : values.primaryGuardianType === 'MOTHER'
        ? 'মাতা'
        : values.legalGuardianRelation
          ? `${'বৈধ অভিভাবক'} (${values.legalGuardianRelation})`
          : 'বৈধ অভিভাবক';

  const editLabel = 'সংশোধন';
  const hasDeceasedParent = !values.fatherAlive || !values.motherAlive;
  const checklist = getRequiredDocumentChecklist(
    numericClass,
    values.admissionType,
    hasDeceasedParent
  );

  const uploadedDocs = [
    values.attachments?.birthCertificate && {
      label: 'জন্ম নিবন্ধন',
      name: values.attachments.birthCertificate.name,
    },
    values.attachments?.parentsNid && {
      label: 'পিতা-মাতার এনআইডি',
      name: values.attachments.parentsNid.name,
    },
    values.attachments?.previousRecordOrTc && {
      label: 'পূর্ববর্তী সনদ / ছাড়পত্র',
      name: values.attachments.previousRecordOrTc.name,
    },
  ].filter(Boolean) as Array<{ label: string; name: string }>;

  const showLegalGuardian =
    (values.hasSeparateGuardian ||
      (!values.fatherAlive && !values.motherAlive) ||
      values.primaryGuardianType === 'LEGAL_GUARDIAN') &&
    Boolean(values.legalGuardianNameBn);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div
        data-certificate-print-root="true"
        className="certificate-paper bg-white text-[#111111] w-[794px] mx-auto p-3 border border-neutral-300"
      >
        {/* Classic Formal Double-Border A4 Frame (matches TC & Testimonial) */}
        <div className="border-[2px] border-[#18181B] p-[4px] bg-white">
          <div className="relative overflow-hidden border border-[#52525B] px-5 py-4 bg-white">
            {/* Subtle Full-Color School Logo Watermark (জলছাপ) */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-0"
            >
              <img
                src={SCHOOL_LOGO_SRC}
                alt=""
                referrerPolicy="no-referrer"
                className="w-[310px] h-[310px] object-contain opacity-[0.06]"
              />
            </div>

            <div className="relative z-10 space-y-2.5">
              {/* 1. Institutional Letterhead + Framed Applicant Passport Photo */}
              <div className="border-b-[3px] border-double border-[#27272A] pb-3 flex flex-row items-center justify-between gap-3">
                <div className="shrink-0 w-[80px] flex items-center justify-start">
                  <SchoolEmblem size={66} className="ring-0 bg-transparent p-0" />
                </div>

                <div className="flex-1 text-center space-y-0.5">
                  <h1 className="text-[24px] font-bold tracking-tight text-[#111111] leading-tight">
                    {school.name}
                  </h1>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#27272A]">
                    {school.nameEn ?? 'BHOJESHWAR HIGH SCHOOL'}
                  </p>
                  <p className="text-[13px] text-[#3F3F46]">{school.address}</p>
                  <p className="text-[12px] text-[#52525B] tabular-nums">
                    EIIN: {school.eiin ?? '113587'} · {'স্থাপিত:'}{' '}
                    {formatNumber(school.establishedYear ?? 1978, 'bn')}
                  </p>
                  <div className="pt-1.5">
                    <span className="inline-block text-[15px] font-bold text-[#111111] border-b-[1.5px] border-[#18181B] pb-0.5 px-3">
                      {isPreviewOnly
                        ? `অনলাইন ভর্তি আবেদনপত্র — প্রিভিউ (শিক্ষাবর্ষ: ${sessionLabel})`
                        : `অনলাইন ভর্তি আবেদনপত্র — আবেদনকারীর কপি (শিক্ষাবর্ষ: ${sessionLabel})`}
                    </span>
                  </div>
                </div>

                {/* Top-Right Framed Passport Photo Box */}
                <div className="w-[80px] h-[98px] border border-[#27272A] bg-[#FAFAFA] overflow-hidden flex items-center justify-center shrink-0">
                  {values.photoPreview ? (
                    <img
                      src={values.photoPreview}
                      alt={values.studentNameEn || 'Applicant'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-[#71717A] px-1">
                      <User className="w-5 h-5 mx-auto opacity-60" />
                      <span className="block text-[11px] mt-1 leading-tight">
                        {'পাসপোর্ট ছবি'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Official Tracking Strip (Submitted Copy Only) */}
              {!isPreviewOnly && (
                <div className="grid grid-cols-3 border border-[#52525B] divide-x divide-[#52525B] bg-[#F4F4F5] text-[12.5px] tabular-nums">
                  <div className="px-2.5 py-2 flex items-center justify-between gap-1.5">
                    <span className="text-[#52525B]">{'আবেদন নম্বর:'}</span>
                    <strong className="font-mono text-[13.5px] text-[#111111]">
                      {submittedMeta.applicationNumber}
                    </strong>
                  </div>
                  <div className="px-2.5 py-2 flex items-center justify-between gap-1.5">
                    <span className="text-[#52525B]">{'জমাদানের তারিখ:'}</span>
                    <strong className="text-[#111111]">
                      {formatDateLong(submittedMeta.submittedAt, 'bn')}
                    </strong>
                  </div>
                  <div className="px-2.5 py-2 flex items-center justify-between gap-1.5">
                    <span className="text-[#52525B]">{'ভর্তি পরীক্ষার রোল:'}</span>
                    <strong className="font-mono text-[13.5px] text-[#111111]">
                      {submittedMeta.admissionTestRoll || '—'}
                    </strong>
                  </div>
                </div>
              )}

              {/* 3. Main Structured Institutional Table Container */}
              <div className="border border-[#52525B]">
                {/* Section 1: Admission & Previous Academic Records */}
                <A4SectionBar
                  title={'১. ভর্তি ও পূর্ববর্তী একাডেমিক তথ্য'}
                  editStep={isPreviewOnly ? 1 : undefined}
                  onJumpToStep={onJumpToStep}
                  editLabel={editLabel}
                  first
                />
                <div className="grid grid-cols-2 gap-px bg-[#D4D4D8]">
                  <A4Row
                    label={'ভর্তিচ্ছু শ্রেণি'}
                    value={
                      <strong className="font-bold">
                        {data.targetClassNameBn}
                      </strong>
                    }
                  />
                  <A4Row
                    label={'ভর্তির ধরন'}
                    value={
                      ADMISSION_TYPE_META[values.admissionType].bn
                    }
                  />
                  {rules.requiresGroup && (
                    <>
                      <A4Row
                        label={'বিভাগ (Group)'}
                        value={
                          <strong className="font-semibold">
                            {(data.groupNameBn) || '—'}
                          </strong>
                        }
                      />
                      <A4Row
                        label={'৪র্থ / ঐচ্ছিক বিষয়'}
                        value={data.optionalSubjectLabel || '—'}
                      />
                    </>
                  )}
                  <A4Row
                    label={'পূর্ববর্তী শ্রেণি'}
                    value={
                      rules.defaultPreviousClassBn
                    }
                  />
                  <A4Row
                    label={'পাসের সন'}
                    value={values.prevExamPassingYear}
                    mono
                  />
                  <A4Row
                    label={'পূর্ববর্তী বিদ্যালয়'}
                    value={values.previousSchoolName}
                    colSpan2
                  />
                  {rules.showPreviousSchoolEiin && values.previousSchoolEiin && (
                    <A4Row
                      label={'বিদ্যালয়ের EIIN'}
                      value={values.previousSchoolEiin}
                      mono
                    />
                  )}
                  <A4Row
                    label={'পূর্ববর্তী রোল নং'}
                    value={values.prevExamRoll}
                    mono
                    colSpan2={
                      !rules.showPreviousGpa &&
                      !values.prevExamGpa &&
                      !(rules.showPreviousSchoolEiin && values.previousSchoolEiin)
                    }
                  />
                  {(rules.showPreviousGpa || Boolean(values.prevExamGpa)) && (
                    <A4Row
                      label={'প্রাপ্ত জিপিএ'}
                      value={
                        values.prevExamGpa
                          ? `${values.prevExamGpa}${derivedGrade ? ` (${derivedGrade})` : ''}`
                          : '—'
                      }
                      mono
                      colSpan2={Boolean(rules.showPreviousSchoolEiin && values.previousSchoolEiin)}
                    />
                  )}
                  {values.transferCertificateNo && (
                    <>
                      <A4Row
                        label={
                          numericClass === 10
                            ? 'বোর্ড e-TC নং'
                            : 'ছাড়পত্র (TC) নং'
                        }
                        value={values.transferCertificateNo}
                        mono
                      />
                      <A4Row
                        label={'ছাড়পত্রের তারিখ'}
                        value={values.transferCertificateDate}
                        mono
                      />
                    </>
                  )}
                  {values.boardRegistrationNo && (
                    <>
                      <A4Row
                        label={'বোর্ড রেজিস্ট্রেশন নং'}
                        value={values.boardRegistrationNo}
                        mono
                      />
                      <A4Row
                        label={'রেজিস্ট্রেশন সেশন'}
                        value={values.boardRegistrationSession}
                        mono
                      />
                    </>
                  )}
                </div>

                {/* Section 2: Student Personal Information */}
                <A4SectionBar
                  title={'২. শিক্ষার্থীর ব্যক্তিগত তথ্য'}
                  editStep={isPreviewOnly ? 2 : undefined}
                  onJumpToStep={onJumpToStep}
                  editLabel={editLabel}
                />
                <div className="grid grid-cols-2 gap-px bg-[#D4D4D8]">
                  <A4Row
                    label={'নাম (বাংলায়)'}
                    value={<strong className="font-bold">{values.studentNameBn}</strong>}
                  />
                  <A4Row
                    label={'নাম (ইংরেজিতে)'}
                    value={
                      <span className="uppercase tracking-wide font-semibold">
                        {values.studentNameEn}
                      </span>
                    }
                  />
                  <A4Row
                    label={'জন্ম তারিখ'}
                    value={
                      values.dateOfBirth
                        ? `${values.dateOfBirth}${computedAge !== null ? ` (${computedAge} বছর)` : ''}`
                        : '—'
                    }
                    mono
                  />
                  <A4Row
                    label={'জন্ম নিবন্ধন (১৭ ডিজিট)'}
                    value={values.birthCertificateNo}
                    mono
                  />
                  <A4Row label={'লিঙ্গ'} value={genderLabel} />
                  <A4Row label={'ধর্ম'} value={religionLabel} />
                  <A4Row label={'রক্তের গ্রুপ'} value={bloodLabel} />
                  <A4Row label={'জাতীয়তা'} value={values.nationality} />
                  {values.studentPhone && (
                    <A4Row
                      label={'শিক্ষার্থীর মোবাইল'}
                      value={values.studentPhone}
                      mono
                      colSpan2
                    />
                  )}
                </div>

                {/* Section 3: Father, Mother, Primary Contact & Legal Guardian */}
                <A4SectionBar
                  title={'৩. পিতা, মাতা ও অভিভাবকের তথ্য'}
                  editStep={isPreviewOnly ? 3 : undefined}
                  onJumpToStep={onJumpToStep}
                  editLabel={editLabel}
                />
                <div className="grid grid-cols-2 gap-px bg-[#D4D4D8]">
                  <A4Row
                    label={'পিতার নাম (বাংলায়)'}
                    value={
                      <span>
                        <strong className="font-semibold">{values.fatherNameBn}</strong>
                        {!values.fatherAlive && (
                          <span className="text-[12px] text-[#52525B] ml-1">
                            ({'মৃত'})
                          </span>
                        )}
                      </span>
                    }
                  />
                  <A4Row
                    label={'পিতার নাম (ইংরেজিতে)'}
                    value={<span className="uppercase">{values.fatherNameEn}</span>}
                  />
                  {(values.fatherAlive || values.fatherNid) && (
                    <A4Row
                      label={'পিতার এনআইডি'}
                      value={values.fatherNid}
                      mono
                      colSpan2={!values.fatherAlive}
                    />
                  )}
                  {values.fatherAlive && (
                    <>
                      <A4Row
                        label={'পিতার মোবাইল'}
                        value={values.fatherPhone}
                        mono
                      />
                      <A4Row
                        label={'পিতার পেশা'}
                        value={values.fatherOccupation}
                        colSpan2
                      />
                    </>
                  )}

                  <A4Row
                    label={'মাতার নাম (বাংলায়)'}
                    value={
                      <span>
                        <strong className="font-semibold">{values.motherNameBn}</strong>
                        {!values.motherAlive && (
                          <span className="text-[12px] text-[#52525B] ml-1">
                            ({'মৃত'})
                          </span>
                        )}
                      </span>
                    }
                  />
                  <A4Row
                    label={'মাতার নাম (ইংরেজিতে)'}
                    value={<span className="uppercase">{values.motherNameEn}</span>}
                  />
                  {(values.motherAlive || values.motherNid) && (
                    <A4Row
                      label={'মাতার এনআইডি'}
                      value={values.motherNid}
                      mono
                      colSpan2={!values.motherAlive}
                    />
                  )}
                  {values.motherAlive && (
                    <>
                      <A4Row
                        label={'মাতার মোবাইল'}
                        value={values.motherPhone}
                        mono
                      />
                      <A4Row
                        label={'মাতার পেশা'}
                        value={values.motherOccupation}
                        colSpan2
                      />
                    </>
                  )}

                  <A4Row
                    label={'প্রাথমিক যোগাযোগকারী'}
                    value={
                      <span>
                        <strong className="font-semibold">{primaryGuardianLabel}</strong>
                        {' · '}
                        <span className="font-mono">{resolvePrimaryGuardianPhone(values)}</span>
                      </span>
                    }
                  />
                  <A4Row
                    label={'পরিবারের মাসিক আয়'}
                    value={values.guardianMonthlyIncome ? `৳ ${values.guardianMonthlyIncome}` : '—'}
                    mono
                  />

                  {showLegalGuardian && (
                    <>
                      <A4Row
                        label={'বৈধ অভিভাবকের নাম'}
                        value={
                          values.legalGuardianNameEn
                            ? `${values.legalGuardianNameBn} (${values.legalGuardianNameEn})`
                            : values.legalGuardianNameBn
                        }
                      />
                      <A4Row
                        label={'সম্পর্ক'}
                        value={values.legalGuardianRelation}
                      />
                      <A4Row
                        label={'অভিভাবকের মোবাইল'}
                        value={values.legalGuardianPhone}
                        mono
                      />
                      <A4Row
                        label={'অভিভাবকের এনআইডি'}
                        value={values.legalGuardianNid}
                        mono
                      />
                      {values.legalGuardianAddress && (
                        <A4Row
                          label={'অভিভাবকের ঠিকানা'}
                          value={values.legalGuardianAddress}
                          colSpan2
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Section 4: Structured Permanent & Present Addresses */}
                <A4SectionBar
                  title={'৪. স্থায়ী ও বর্তমান ঠিকানা'}
                  editStep={isPreviewOnly ? 3 : undefined}
                  onJumpToStep={onJumpToStep}
                  editLabel={editLabel}
                />
                <div className="grid grid-cols-2 divide-x divide-[#D4D4D8] text-[13px] leading-[1.55]">
                  <div className="px-3 py-2 space-y-0.5">
                    <p className="font-bold text-[#18181B]">
                      {'স্থায়ী ঠিকানা:'}
                    </p>
                    <p>
                      <span className="text-[#52525B]">{'গ্রাম/বাসা:'}</span>{' '}
                      {values.permanentAddressParts.village || '—'} ·{' '}
                      <span className="text-[#52525B]">{'ডাকঘর:'}</span>{' '}
                      {values.permanentAddressParts.postOffice || '—'}
                      {values.permanentAddressParts.postCode
                        ? ` (${values.permanentAddressParts.postCode})`
                        : ''}
                    </p>
                    <p>
                      <span className="text-[#52525B]">
                        {'উপজেলা / জেলা:'}
                      </span>{' '}
                      {values.permanentAddressParts.upazila || '—'},{' '}
                      {values.permanentAddressParts.district || '—'}
                    </p>
                  </div>

                  <div className="px-3 py-2 space-y-0.5">
                    <p className="font-bold text-[#18181B]">
                      {'বর্তমান ঠিকানা:'}
                      {values.sameAsPermanent && (
                        <span className="font-normal text-[#52525B] ml-1">
                          ({'স্থায়ী ঠিকানার অনুরূপ'})
                        </span>
                      )}
                    </p>
                    <p>
                      <span className="text-[#52525B]">{'গ্রাম/বাসা:'}</span>{' '}
                      {presentParts.village || '—'} ·{' '}
                      <span className="text-[#52525B]">{'ডাকঘর:'}</span>{' '}
                      {presentParts.postOffice || '—'}
                      {presentParts.postCode ? ` (${presentParts.postCode})` : ''}
                    </p>
                    <p>
                      <span className="text-[#52525B]">
                        {'উপজেলা / জেলা:'}
                      </span>{' '}
                      {presentParts.upazila || '—'}, {presentParts.district || '—'}
                    </p>
                  </div>
                </div>

                {/* Section 5: Uploaded Supporting Documents (if any) */}
                {uploadedDocs.length > 0 && (
                  <>
                    <A4SectionBar
                      title={'৫. সংযুক্ত ডিজিটাল কাগজপত্র'}
                      editLabel={editLabel}
                    />
                    <div className="px-3 py-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[#111111]">
                      {uploadedDocs.map((doc) => (
                        <span key={doc.label}>
                          <span className="text-[#52525B]">{doc.label}:</span>{' '}
                          <strong className="font-semibold">{doc.name}</strong>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 4. Official Hardcopy Checklist + Declaration + 3-Column Signature Block (Submitted Copy) */}
              {!isPreviewOnly && (
                <div className="space-y-3 pt-1">
                  <div className="border border-[#D4D4D8] bg-[#FAFAFA] px-3 py-2.5 space-y-1">
                    <p className="text-[13px] font-bold text-[#111111]">
                      {'ভর্তির দিন বিদ্যালয় অফিসে জমাদানের প্রয়োজনীয় কাগজপত্র:'}
                    </p>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] text-[#27272A] leading-[1.48]">
                      {checklist.map((item, idx) => (
                        <li key={item.key}>
                          {formatNumber(idx + 1, 'bn')}.{' '}
                          {item.labelBn}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-1 space-y-1">
                    <p className="text-[13px] font-bold text-[#111111]">
                      {'অঙ্গীকারনামা:'}
                    </p>
                    <p className="text-[12.5px] text-[#27272A] leading-[1.58] text-justify">
                      {data.declarationText ||
                        'আমি এই মর্মে অঙ্গীকার করছি যে, উপরে উল্লিখিত সকল তথ্য জন্ম নিবন্ধন ও জাতীয় পরিচয়পত্র অনুযায়ী সম্পূর্ণ সত্য ও নির্ভুল। আমি অত্র প্রতিষ্ঠানের প্রচলিত ও ভবিষ্যতে প্রণীত যাবতীয় নিয়ম-কানুন মানিয়া চলিব এবং বিদ্যালয়ে নির্ধারিত পোশাক পরিধান করে নিয়মিত উপস্থিত থাকিব।'}
                    </p>
                  </div>

                  {/* Clean 3-Column Institutional Signature Row */}
                  <div className="grid grid-cols-3 gap-8 pt-10 px-2 text-center text-[13px] text-[#18181B]">
                    <div>
                      <div className="border-t border-[#27272A] pt-1.5 font-semibold">
                        {'অভিভাবকের স্বাক্ষর ও তারিখ'}
                      </div>
                    </div>
                    <div>
                      <div className="border-t border-[#27272A] pt-1.5 font-semibold">
                        {'শিক্ষার্থীর স্বাক্ষর ও তারিখ'}
                      </div>
                    </div>
                    <div>
                      <div className="border-t border-[#27272A] pt-1.5 font-semibold">
                        {'ভর্তি গ্রহণকারী / প্রধান শিক্ষক'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full Official Institutional Admission Application Form Sheet.
 * Used identically in Step 4 Preview, Post-Submission Confirmation (Print & A4 PDF Download),
 * Application Status Lookup, and Standalone Print Route — guaranteeing 100% visual & data fidelity.
 */
export function AdmissionFormPreviewSheet({
  values,
  db,
  mode,
  onJumpToStep,
  submittedMeta,
}: AdmissionFormPreviewSheetProps) {
  const data = buildAdmissionFormPrintData(
    values,
    db,
    mode,
    submittedMeta ?? {
      applicationNumber: 'PREVIEW',
      submittedAt: new Date().toISOString(),
    }
  );

  return (
    <PrintableAdmissionFormDocument
      data={data}
      onJumpToStep={onJumpToStep}
      isPreviewOnly={!submittedMeta}
    />
  );
}
