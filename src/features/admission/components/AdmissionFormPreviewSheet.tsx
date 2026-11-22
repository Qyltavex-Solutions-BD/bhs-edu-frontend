'use client';

import React from 'react';
import { Pencil, User } from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { getEnumMeta } from '@/src/lib/constants/enums';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import { SCHOOL_LOGO_SRC, SchoolEmblem } from '@/src/components/shared/Feedback';
import type { AdmissionFormPrintData } from '@/src/lib/utils/cn';
import type { MockDatabase } from '@/src/mocks/seed';
import {
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
  db: MockDatabase;
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
  db: MockDatabase,
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
      : db.admissionContent.academicSession || '২০২৭';

  return {
    school: db.schoolProfile,
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
    declarationText: db.admissionContent.declarationText ?? null,
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
  const { locale, pick } = useI18n();
  const { school, values, numericClass, sessionLabel, submittedMeta } = data;
  const rules = getClassAdmissionRules(numericClass);
  const computedAge = calculateAgeYears(values.dateOfBirth);
  const bloodLabel =
    BLOOD_GROUP_OPTIONS.find((b) => b.value === values.bloodGroup)?.label || '—';
  const genderLabel =
    locale === 'bn'
      ? getEnumMeta('Gender', values.gender).bn
      : getEnumMeta('Gender', values.gender).en;
  const religionLabel =
    locale === 'bn'
      ? getEnumMeta('Religion', values.religion).bn
      : getEnumMeta('Religion', values.religion).en;
  const derivedGrade = gpaToLetterGrade(values.prevExamGpa);
  const presentParts = values.sameAsPermanent
    ? values.permanentAddressParts
    : values.presentAddressParts;

  const primaryGuardianLabel =
    values.primaryGuardianType === 'FATHER'
      ? pick('পিতা', 'Father')
      : values.primaryGuardianType === 'MOTHER'
        ? pick('মাতা', 'Mother')
        : values.legalGuardianRelation
          ? `${pick('বৈধ অভিভাবক', 'Legal Guardian')} (${values.legalGuardianRelation})`
          : pick('বৈধ অভিভাবক', 'Legal Guardian');

  const editLabel = pick('সংশোধন', 'Edit');
  const hasDeceasedParent = !values.fatherAlive || !values.motherAlive;
  const checklist = getRequiredDocumentChecklist(
    numericClass,
    values.admissionType,
    hasDeceasedParent
  );

  const uploadedDocs = [
    values.attachments?.birthCertificate && {
      label: pick('জন্ম নিবন্ধন', 'Birth Certificate'),
      name: values.attachments.birthCertificate.name,
    },
    values.attachments?.parentsNid && {
      label: pick('পিতা-মাতার এনআইডি', 'Parents’ NID'),
      name: values.attachments.parentsNid.name,
    },
    values.attachments?.previousRecordOrTc && {
      label: pick('পূর্ববর্তী সনদ / ছাড়পত্র', 'Transcript / TC'),
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
                    EIIN: {school.eiin ?? '113587'} · {pick('স্থাপিত:', 'Est.')}{' '}
                    {formatNumber(school.establishedYear ?? 1978, locale)}
                  </p>
                  <div className="pt-1.5">
                    <span className="inline-block text-[15px] font-bold text-[#111111] border-b-[1.5px] border-[#18181B] pb-0.5 px-3">
                      {isPreviewOnly
                        ? pick(
                            `অনলাইন ভর্তি আবেদনপত্র — প্রিভিউ (শিক্ষাবর্ষ: ${sessionLabel})`,
                            `Online Admission Application Form — Preview (Session: ${sessionLabel})`
                          )
                        : pick(
                            `অনলাইন ভর্তি আবেদনপত্র — আবেদনকারীর কপি (শিক্ষাবর্ষ: ${sessionLabel})`,
                            `Online Admission Application Form — Applicant Copy (Session: ${sessionLabel})`
                          )}
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
                        {pick('পাসপোর্ট ছবি', 'Passport Photo')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Official Tracking Strip (Submitted Copy Only) */}
              {!isPreviewOnly && (
                <div className="grid grid-cols-3 border border-[#52525B] divide-x divide-[#52525B] bg-[#F4F4F5] text-[12.5px] tabular-nums">
                  <div className="px-2.5 py-2 flex items-center justify-between gap-1.5">
                    <span className="text-[#52525B]">{pick('আবেদন নম্বর:', 'Application No:')}</span>
                    <strong className="font-mono text-[13.5px] text-[#111111]">
                      {submittedMeta.applicationNumber}
                    </strong>
                  </div>
                  <div className="px-2.5 py-2 flex items-center justify-between gap-1.5">
                    <span className="text-[#52525B]">{pick('জমাদানের তারিখ:', 'Submitted:')}</span>
                    <strong className="text-[#111111]">
                      {formatDateLong(submittedMeta.submittedAt, locale)}
                    </strong>
                  </div>
                  <div className="px-2.5 py-2 flex items-center justify-between gap-1.5">
                    <span className="text-[#52525B]">{pick('ভর্তি পরীক্ষার রোল:', 'Test Roll:')}</span>
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
                  title={pick(
                    '১. ভর্তি ও পূর্ববর্তী একাডেমিক তথ্য',
                    '1. Admission & Previous Academic Details'
                  )}
                  editStep={isPreviewOnly ? 1 : undefined}
                  onJumpToStep={onJumpToStep}
                  editLabel={editLabel}
                  first
                />
                <div className="grid grid-cols-2 gap-px bg-[#D4D4D8]">
                  <A4Row
                    label={pick('ভর্তিচ্ছু শ্রেণি', 'Target Class')}
                    value={
                      <strong className="font-bold">
                        {locale === 'bn' ? data.targetClassNameBn : data.targetClassNameEn}
                      </strong>
                    }
                  />
                  <A4Row
                    label={pick('ভর্তির ধরন', 'Admission Type')}
                    value={
                      locale === 'bn'
                        ? ADMISSION_TYPE_META[values.admissionType].bn
                        : ADMISSION_TYPE_META[values.admissionType].en
                    }
                  />
                  {rules.requiresGroup && (
                    <>
                      <A4Row
                        label={pick('বিভাগ (Group)', 'Academic Group')}
                        value={
                          <strong className="font-semibold">
                            {(locale === 'bn' ? data.groupNameBn : data.groupNameEn) || '—'}
                          </strong>
                        }
                      />
                      <A4Row
                        label={pick('৪র্থ / ঐচ্ছিক বিষয়', '4th / Optional')}
                        value={data.optionalSubjectLabel || '—'}
                      />
                    </>
                  )}
                  <A4Row
                    label={pick('পূর্ববর্তী শ্রেণি', 'Previous Class')}
                    value={
                      locale === 'bn' ? rules.defaultPreviousClassBn : rules.defaultPreviousClassEn
                    }
                  />
                  <A4Row
                    label={pick('পাসের সন', 'Passing Year')}
                    value={values.prevExamPassingYear}
                    mono
                  />
                  <A4Row
                    label={pick('পূর্ববর্তী বিদ্যালয়', 'Previous School')}
                    value={values.previousSchoolName}
                    colSpan2
                  />
                  {rules.showPreviousSchoolEiin && values.previousSchoolEiin && (
                    <A4Row
                      label={pick('বিদ্যালয়ের EIIN', 'School EIIN')}
                      value={values.previousSchoolEiin}
                      mono
                    />
                  )}
                  <A4Row
                    label={pick('পূর্ববর্তী রোল নং', 'Previous Roll')}
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
                      label={pick('প্রাপ্ত জিপিএ', 'Annual GPA')}
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
                            ? pick('বোর্ড e-TC নং', 'Board e-TC No')
                            : pick('ছাড়পত্র (TC) নং', 'TC Number')
                        }
                        value={values.transferCertificateNo}
                        mono
                      />
                      <A4Row
                        label={pick('ছাড়পত্রের তারিখ', 'TC Issue Date')}
                        value={values.transferCertificateDate}
                        mono
                      />
                    </>
                  )}
                  {values.boardRegistrationNo && (
                    <>
                      <A4Row
                        label={pick('বোর্ড রেজিস্ট্রেশন নং', 'Board Reg No')}
                        value={values.boardRegistrationNo}
                        mono
                      />
                      <A4Row
                        label={pick('রেজিস্ট্রেশন সেশন', 'Reg Session')}
                        value={values.boardRegistrationSession}
                        mono
                      />
                    </>
                  )}
                </div>

                {/* Section 2: Student Personal Information */}
                <A4SectionBar
                  title={pick('২. শিক্ষার্থীর ব্যক্তিগত তথ্য', '2. Student Personal Information')}
                  editStep={isPreviewOnly ? 2 : undefined}
                  onJumpToStep={onJumpToStep}
                  editLabel={editLabel}
                />
                <div className="grid grid-cols-2 gap-px bg-[#D4D4D8]">
                  <A4Row
                    label={pick('নাম (বাংলায়)', 'Name (Bangla)')}
                    value={<strong className="font-bold">{values.studentNameBn}</strong>}
                  />
                  <A4Row
                    label={pick('নাম (ইংরেজিতে)', 'Name (English)')}
                    value={
                      <span className="uppercase tracking-wide font-semibold">
                        {values.studentNameEn}
                      </span>
                    }
                  />
                  <A4Row
                    label={pick('জন্ম তারিখ', 'Date of Birth')}
                    value={
                      values.dateOfBirth
                        ? `${values.dateOfBirth}${computedAge !== null ? ` (${computedAge} বছর)` : ''}`
                        : '—'
                    }
                    mono
                  />
                  <A4Row
                    label={pick('জন্ম নিবন্ধন (১৭ ডিজিট)', 'Birth Cert (17 Digits)')}
                    value={values.birthCertificateNo}
                    mono
                  />
                  <A4Row label={pick('লিঙ্গ', 'Gender')} value={genderLabel} />
                  <A4Row label={pick('ধর্ম', 'Religion')} value={religionLabel} />
                  <A4Row label={pick('রক্তের গ্রুপ', 'Blood Group')} value={bloodLabel} />
                  <A4Row label={pick('জাতীয়তা', 'Nationality')} value={values.nationality} />
                  {values.studentPhone && (
                    <A4Row
                      label={pick('শিক্ষার্থীর মোবাইল', 'Student Mobile')}
                      value={values.studentPhone}
                      mono
                      colSpan2
                    />
                  )}
                </div>

                {/* Section 3: Father, Mother, Primary Contact & Legal Guardian */}
                <A4SectionBar
                  title={pick(
                    '৩. পিতা, মাতা ও অভিভাবকের তথ্য',
                    '3. Parents & Guardian Information'
                  )}
                  editStep={isPreviewOnly ? 3 : undefined}
                  onJumpToStep={onJumpToStep}
                  editLabel={editLabel}
                />
                <div className="grid grid-cols-2 gap-px bg-[#D4D4D8]">
                  <A4Row
                    label={pick('পিতার নাম (বাংলায়)', 'Father’s Name (BN)')}
                    value={
                      <span>
                        <strong className="font-semibold">{values.fatherNameBn}</strong>
                        {!values.fatherAlive && (
                          <span className="text-[12px] text-[#52525B] ml-1">
                            ({pick('মৃত', 'Deceased')})
                          </span>
                        )}
                      </span>
                    }
                  />
                  <A4Row
                    label={pick('পিতার নাম (ইংরেজিতে)', 'Father’s Name (EN)')}
                    value={<span className="uppercase">{values.fatherNameEn}</span>}
                  />
                  {(values.fatherAlive || values.fatherNid) && (
                    <A4Row
                      label={pick('পিতার এনআইডি', 'Father’s NID')}
                      value={values.fatherNid}
                      mono
                      colSpan2={!values.fatherAlive}
                    />
                  )}
                  {values.fatherAlive && (
                    <>
                      <A4Row
                        label={pick('পিতার মোবাইল', 'Father’s Mobile')}
                        value={values.fatherPhone}
                        mono
                      />
                      <A4Row
                        label={pick('পিতার পেশা', 'Father’s Occupation')}
                        value={values.fatherOccupation}
                        colSpan2
                      />
                    </>
                  )}

                  <A4Row
                    label={pick('মাতার নাম (বাংলায়)', 'Mother’s Name (BN)')}
                    value={
                      <span>
                        <strong className="font-semibold">{values.motherNameBn}</strong>
                        {!values.motherAlive && (
                          <span className="text-[12px] text-[#52525B] ml-1">
                            ({pick('মৃত', 'Deceased')})
                          </span>
                        )}
                      </span>
                    }
                  />
                  <A4Row
                    label={pick('মাতার নাম (ইংরেজিতে)', 'Mother’s Name (EN)')}
                    value={<span className="uppercase">{values.motherNameEn}</span>}
                  />
                  {(values.motherAlive || values.motherNid) && (
                    <A4Row
                      label={pick('মাতার এনআইডি', 'Mother’s NID')}
                      value={values.motherNid}
                      mono
                      colSpan2={!values.motherAlive}
                    />
                  )}
                  {values.motherAlive && (
                    <>
                      <A4Row
                        label={pick('মাতার মোবাইল', 'Mother’s Mobile')}
                        value={values.motherPhone}
                        mono
                      />
                      <A4Row
                        label={pick('মাতার পেশা', 'Mother’s Occupation')}
                        value={values.motherOccupation}
                        colSpan2
                      />
                    </>
                  )}

                  <A4Row
                    label={pick('প্রাথমিক যোগাযোগকারী', 'Primary Contact')}
                    value={
                      <span>
                        <strong className="font-semibold">{primaryGuardianLabel}</strong>
                        {' · '}
                        <span className="font-mono">{resolvePrimaryGuardianPhone(values)}</span>
                      </span>
                    }
                  />
                  <A4Row
                    label={pick('পরিবারের মাসিক আয়', 'Monthly Income')}
                    value={values.guardianMonthlyIncome ? `৳ ${values.guardianMonthlyIncome}` : '—'}
                    mono
                  />

                  {showLegalGuardian && (
                    <>
                      <A4Row
                        label={pick('বৈধ অভিভাবকের নাম', 'Legal Guardian')}
                        value={
                          values.legalGuardianNameEn
                            ? `${values.legalGuardianNameBn} (${values.legalGuardianNameEn})`
                            : values.legalGuardianNameBn
                        }
                      />
                      <A4Row
                        label={pick('সম্পর্ক', 'Relationship')}
                        value={values.legalGuardianRelation}
                      />
                      <A4Row
                        label={pick('অভিভাবকের মোবাইল', 'Guardian Mobile')}
                        value={values.legalGuardianPhone}
                        mono
                      />
                      <A4Row
                        label={pick('অভিভাবকের এনআইডি', 'Guardian NID')}
                        value={values.legalGuardianNid}
                        mono
                      />
                      {values.legalGuardianAddress && (
                        <A4Row
                          label={pick('অভিভাবকের ঠিকানা', 'Guardian Address')}
                          value={values.legalGuardianAddress}
                          colSpan2
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Section 4: Structured Permanent & Present Addresses */}
                <A4SectionBar
                  title={pick('৪. স্থায়ী ও বর্তমান ঠিকানা', '4. Permanent & Present Address')}
                  editStep={isPreviewOnly ? 3 : undefined}
                  onJumpToStep={onJumpToStep}
                  editLabel={editLabel}
                />
                <div className="grid grid-cols-2 divide-x divide-[#D4D4D8] text-[13px] leading-[1.55]">
                  <div className="px-3 py-2 space-y-0.5">
                    <p className="font-bold text-[#18181B]">
                      {pick('স্থায়ী ঠিকানা:', 'Permanent Address:')}
                    </p>
                    <p>
                      <span className="text-[#52525B]">{pick('গ্রাম/বাসা:', 'Village:')}</span>{' '}
                      {values.permanentAddressParts.village || '—'} ·{' '}
                      <span className="text-[#52525B]">{pick('ডাকঘর:', 'Post:')}</span>{' '}
                      {values.permanentAddressParts.postOffice || '—'}
                      {values.permanentAddressParts.postCode
                        ? ` (${values.permanentAddressParts.postCode})`
                        : ''}
                    </p>
                    <p>
                      <span className="text-[#52525B]">
                        {pick('উপজেলা / জেলা:', 'Upazila / District:')}
                      </span>{' '}
                      {values.permanentAddressParts.upazila || '—'},{' '}
                      {values.permanentAddressParts.district || '—'}
                    </p>
                  </div>

                  <div className="px-3 py-2 space-y-0.5">
                    <p className="font-bold text-[#18181B]">
                      {pick('বর্তমান ঠিকানা:', 'Present Address:')}
                      {values.sameAsPermanent && (
                        <span className="font-normal text-[#52525B] ml-1">
                          ({pick('স্থায়ী ঠিকানার অনুরূপ', 'Same as permanent')})
                        </span>
                      )}
                    </p>
                    <p>
                      <span className="text-[#52525B]">{pick('গ্রাম/বাসা:', 'Village:')}</span>{' '}
                      {presentParts.village || '—'} ·{' '}
                      <span className="text-[#52525B]">{pick('ডাকঘর:', 'Post:')}</span>{' '}
                      {presentParts.postOffice || '—'}
                      {presentParts.postCode ? ` (${presentParts.postCode})` : ''}
                    </p>
                    <p>
                      <span className="text-[#52525B]">
                        {pick('উপজেলা / জেলা:', 'Upazila / District:')}
                      </span>{' '}
                      {presentParts.upazila || '—'}, {presentParts.district || '—'}
                    </p>
                  </div>
                </div>

                {/* Section 5: Uploaded Supporting Documents (if any) */}
                {uploadedDocs.length > 0 && (
                  <>
                    <A4SectionBar
                      title={pick(
                        '৫. সংযুক্ত ডিজিটাল কাগজপত্র',
                        '5. Attached Supporting Documents'
                      )}
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
                      {pick(
                        'ভর্তির দিন বিদ্যালয় অফিসে জমাদানের প্রয়োজনীয় কাগজপত্র:',
                        'Hardcopy Documents Required at School Office on Admission Day:'
                      )}
                    </p>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] text-[#27272A] leading-[1.48]">
                      {checklist.map((item, idx) => (
                        <li key={item.key}>
                          {formatNumber(idx + 1, locale)}.{' '}
                          {locale === 'bn' ? item.labelBn : item.labelEn}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-1 space-y-1">
                    <p className="text-[13px] font-bold text-[#111111]">
                      {pick('অঙ্গীকারনামা:', 'Declaration:')}
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
                        {pick('অভিভাবকের স্বাক্ষর ও তারিখ', 'Guardian Signature & Date')}
                      </div>
                    </div>
                    <div>
                      <div className="border-t border-[#27272A] pt-1.5 font-semibold">
                        {pick('শিক্ষার্থীর স্বাক্ষর ও তারিখ', 'Student Signature & Date')}
                      </div>
                    </div>
                    <div>
                      <div className="border-t border-[#27272A] pt-1.5 font-semibold">
                        {pick('ভর্তি গ্রহণকারী / প্রধান শিক্ষক', 'Receiving Officer / Head Teacher')}
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
