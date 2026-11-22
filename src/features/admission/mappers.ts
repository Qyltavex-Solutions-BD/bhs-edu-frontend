import { Gender, Religion } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { OnlineAdmissionApplication } from '@/src/types/proposed/future';
import {
  AdmissionFormMode,
  BD_PHONE_REGEX,
  formatStructuredAddress,
  getClassAdmissionRules,
  getNextSuggestedRoll,
  getOptionalSubjectsForClassGroup,
  gpaToLetterGrade,
  normalizeDigits,
  parseAddressToStructured,
  toBlockLetters,
} from './rules';
import type { UnifiedAdmissionFormValues } from './schema';

export function resolvePrimaryGuardianPhone(values: UnifiedAdmissionFormValues): string {
  const fatherPhone = normalizeDigits(values.fatherPhone.trim());
  const motherPhone = normalizeDigits(values.motherPhone.trim());
  const legalPhone = normalizeDigits(values.legalGuardianPhone.trim());

  if (values.primaryGuardianType === 'FATHER' && values.fatherAlive && BD_PHONE_REGEX.test(fatherPhone)) {
    return fatherPhone;
  }
  if (values.primaryGuardianType === 'MOTHER' && values.motherAlive && BD_PHONE_REGEX.test(motherPhone)) {
    return motherPhone;
  }
  if (values.primaryGuardianType === 'LEGAL_GUARDIAN' && BD_PHONE_REGEX.test(legalPhone)) {
    return legalPhone;
  }

  if (values.fatherAlive && BD_PHONE_REGEX.test(fatherPhone)) return fatherPhone;
  if (values.motherAlive && BD_PHONE_REGEX.test(motherPhone)) return motherPhone;
  if (BD_PHONE_REGEX.test(legalPhone)) return legalPhone;
  return fatherPhone || motherPhone || legalPhone;
}

export function buildDefaultAdmissionValues(
  db: MockDatabase,
  mode: AdmissionFormMode,
  yearId?: string,
  prefillApp?: OnlineAdmissionApplication | null
): UnifiedAdmissionFormValues {
  const activeYearId = yearId || db.academicYears.find((y) => y.isActive)?.id || db.academicYears[0]?.id || '';
  const defaultClassId = prefillApp?.targetClassId || db.classes[0]?.id || 'cls-6';
  const targetCls = db.classes.find((c) => c.id === defaultClassId);
  const rules = getClassAdmissionRules(targetCls?.numericValue ?? 6);

  const matchingSection =
    (prefillApp?.preferredSection
      ? db.sections.find((s) => s.classId === defaultClassId && s.name === prefillApp.preferredSection)
      : undefined) || db.sections.find((s) => s.classId === defaultClassId);
  const sectionId = matchingSection?.id ?? '';
  const suggestedRoll = mode === 'admin' && sectionId ? String(getNextSuggestedRoll(db, activeYearId, sectionId)) : '';

  const permParts =
    prefillApp?.permanentAddressParts ||
    parseAddressToStructured(prefillApp?.permanentAddress);
  const presParts =
    prefillApp?.presentAddressParts ||
    parseAddressToStructured(prefillApp?.presentAddress);
  const addressesEqual =
    !prefillApp ||
    (prefillApp.presentAddress?.trim() || '') === (prefillApp.permanentAddress?.trim() || '');

  // Resolve optionalClassSubjectId from prefill (either direct id or subject name match)
  let optionalClassSubjectId = prefillApp?.optionalClassSubjectId || '';
  if (!optionalClassSubjectId && prefillApp?.optionalSubjectName && prefillApp.targetGroupId) {
    const opts = getOptionalSubjectsForClassGroup(db, defaultClassId, prefillApp.targetGroupId, activeYearId);
    const matched = opts.find(
      (o) =>
        o.nameBn === prefillApp.optionalSubjectName ||
        o.nameEn.toLowerCase() === prefillApp.optionalSubjectName?.toLowerCase()
    );
    optionalClassSubjectId = matched?.classSubjectId ?? '';
  }

  const admissionType =
    prefillApp?.admissionType ??
    (prefillApp?.isReadmission ? 'READMISSION' : rules.defaultAdmissionType);

  return {
    targetClassId: defaultClassId,
    admissionType,
    preferredSection: prefillApp?.preferredSection || '',
    targetGroupId: prefillApp?.targetGroupId || '',
    optionalClassSubjectId,
    previousSchoolName: prefillApp?.previousSchoolName || '',
    previousSchoolEiin: prefillApp?.previousSchoolEiin || '',
    previousSchoolAddress: prefillApp?.previousSchoolAddress || '',
    previousClass: prefillApp?.previousClass || rules.defaultPreviousClassBn,
    previousGrade: prefillApp?.previousGrade || '',
    prevExamPassingYear: prefillApp?.prevExamPassingYear ? String(prefillApp.prevExamPassingYear) : '2026',
    prevExamRoll: prefillApp?.prevExamRoll || '',
    prevExamGpa: prefillApp?.prevExamGpa !== undefined && prefillApp?.prevExamGpa !== null ? String(prefillApp.prevExamGpa) : '',
    transferCertificateNo: prefillApp?.transferCertificateNo || '',
    transferCertificateDate: prefillApp?.transferCertificateDate || '',
    boardRegistrationNo: prefillApp?.boardRegistrationNo || '',
    boardRegistrationSession: prefillApp?.boardRegistrationSession || (targetCls?.numericValue === 10 ? '2025-26' : ''),

    photoPreview: prefillApp?.photoPreview ?? null,
    studentNameBn: prefillApp?.studentNameBn || '',
    studentNameEn: prefillApp?.studentNameEn ? toBlockLetters(prefillApp.studentNameEn) : '',
    dateOfBirth: prefillApp?.dateOfBirth || '',
    birthCertificateNo: prefillApp?.birthCertificateNo || '',
    gender: prefillApp?.gender ?? Gender.MALE,
    religion: prefillApp?.religion ?? Religion.ISLAM,
    bloodGroup: prefillApp?.bloodGroup || '',
    nationality: prefillApp?.nationality || 'বাংলাদেশি',
    studentPhone: prefillApp?.studentPhone || '',

    fatherAlive: prefillApp?.fatherAlive ?? true,
    fatherNameBn: prefillApp?.fatherNameBn || '',
    fatherNameEn: prefillApp?.fatherNameEn ? toBlockLetters(prefillApp.fatherNameEn) : '',
    fatherOccupation: prefillApp?.fatherOccupation || '',
    fatherNid: prefillApp?.fatherNid || '',
    fatherPhone: prefillApp?.fatherPhone ?? (prefillApp?.fatherAlive !== false ? prefillApp?.guardianPhone || '' : ''),

    motherAlive: prefillApp?.motherAlive ?? true,
    motherNameBn: prefillApp?.motherNameBn || '',
    motherNameEn: prefillApp?.motherNameEn ? toBlockLetters(prefillApp.motherNameEn) : '',
    motherOccupation: prefillApp?.motherOccupation || '',
    motherNid: prefillApp?.motherNid || '',
    motherPhone: prefillApp?.motherPhone || '',

    primaryGuardianType:
      prefillApp?.primaryGuardianType ??
      (prefillApp?.fatherAlive === false
        ? prefillApp?.motherAlive === false
          ? 'LEGAL_GUARDIAN'
          : 'MOTHER'
        : 'FATHER'),
    guardianMonthlyIncome:
      prefillApp?.guardianMonthlyIncome !== undefined && prefillApp?.guardianMonthlyIncome !== null
        ? String(prefillApp.guardianMonthlyIncome)
        : '',
    hasSeparateGuardian: Boolean(prefillApp?.legalGuardianNameBn),
    legalGuardianNameBn: prefillApp?.legalGuardianNameBn || '',
    legalGuardianNameEn: prefillApp?.legalGuardianNameEn ? toBlockLetters(prefillApp.legalGuardianNameEn) : '',
    legalGuardianRelation: prefillApp?.legalGuardianRelation || '',
    legalGuardianNid: prefillApp?.legalGuardianNid || '',
    legalGuardianPhone: prefillApp?.legalGuardianPhone || '',
    legalGuardianAddress: prefillApp?.legalGuardianAddress || '',

    permanentAddressParts: {
      village: permParts.village || '',
      postOffice: permParts.postOffice || '',
      postCode: permParts.postCode || '',
      upazila: permParts.upazila || 'নড়িয়া',
      district: permParts.district || 'শরীয়তপুর',
    },
    sameAsPermanent: addressesEqual,
    presentAddressParts: {
      village: presParts.village || '',
      postOffice: presParts.postOffice || '',
      postCode: presParts.postCode || '',
      upazila: presParts.upazila || 'নড়িয়া',
      district: presParts.district || 'শরীয়তপুর',
    },

    attachments: prefillApp?.attachments ?? {},
    declarationAccepted: prefillApp?.declarationAccepted ?? false,

    academicYearId: activeYearId,
    sectionId,
    roll: suggestedRoll,
    formSerialNo: prefillApp?.applicationNumber || '',
    admissionFeePaid: '',
    receiptNo: '',
    verifiedDocuments: prefillApp?.verifiedDocuments ?? {},
    remarks: prefillApp?.remarks || '',
  };
}

export function toPublicAdmissionPayload(
  values: UnifiedAdmissionFormValues,
  db: MockDatabase
): Omit<
  OnlineAdmissionApplication,
  'id' | 'applicationNumber' | 'status' | 'submittedAt' | 'admissionTestRoll' | 'admissionTestDate'
> {
  const cls = db.classes.find((c) => c.id === values.targetClassId);
  const rules = getClassAdmissionRules(cls?.numericValue ?? 6);
  const permanentFormatted = formatStructuredAddress(values.permanentAddressParts);
  const presentParts = values.sameAsPermanent ? values.permanentAddressParts : values.presentAddressParts;
  const presentFormatted = formatStructuredAddress(presentParts);

  const optionals = rules.requiresOptionalSubject
    ? getOptionalSubjectsForClassGroup(db, values.targetClassId, values.targetGroupId)
    : [];
  const chosenOptional = optionals.find((o) => o.classSubjectId === values.optionalClassSubjectId);

  return {
    academicSession: db.admissionContent.academicSession ?? '২০২৭',
    studentNameBn: values.studentNameBn.trim(),
    studentNameEn: toBlockLetters(values.studentNameEn.trim()),
    photoPreview: values.photoPreview || null,
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    birthCertificateNo: normalizeDigits(values.birthCertificateNo.trim()),
    religion: values.religion,
    bloodGroup: (values.bloodGroup || null) as OnlineAdmissionApplication['bloodGroup'],
    nationality: values.nationality.trim() || 'বাংলাদেশি',
    studentPhone: values.studentPhone.trim() ? normalizeDigits(values.studentPhone.trim()) : null,

    fatherAlive: values.fatherAlive,
    fatherNameBn: values.fatherNameBn.trim(),
    fatherNameEn: toBlockLetters(values.fatherNameEn.trim()),
    fatherOccupation: values.fatherAlive ? values.fatherOccupation.trim() : 'মৃত',
    fatherNid: values.fatherNid.trim() ? normalizeDigits(values.fatherNid.trim()) : '',
    fatherPhone: values.fatherAlive && values.fatherPhone.trim() ? normalizeDigits(values.fatherPhone.trim()) : null,

    motherAlive: values.motherAlive,
    motherNameBn: values.motherNameBn.trim(),
    motherNameEn: toBlockLetters(values.motherNameEn.trim()),
    motherOccupation: values.motherAlive ? values.motherOccupation.trim() : 'মৃত',
    motherNid: values.motherNid.trim() ? normalizeDigits(values.motherNid.trim()) : '',
    motherPhone: values.motherAlive && values.motherPhone.trim() ? normalizeDigits(values.motherPhone.trim()) : null,

    primaryGuardianType: values.primaryGuardianType,
    guardianPhone: resolvePrimaryGuardianPhone(values),
    guardianMonthlyIncome: values.guardianMonthlyIncome.trim()
      ? Number(normalizeDigits(values.guardianMonthlyIncome))
      : null,
    legalGuardianNameBn: values.legalGuardianNameBn.trim() || null,
    legalGuardianNameEn: values.legalGuardianNameEn.trim()
      ? toBlockLetters(values.legalGuardianNameEn.trim())
      : null,
    legalGuardianRelation: values.legalGuardianRelation.trim() || null,
    legalGuardianPhone: values.legalGuardianPhone.trim()
      ? normalizeDigits(values.legalGuardianPhone.trim())
      : null,
    legalGuardianNid: values.legalGuardianNid.trim()
      ? normalizeDigits(values.legalGuardianNid.trim())
      : null,
    legalGuardianAddress: values.legalGuardianAddress.trim() || null,

    presentAddress: presentFormatted,
    permanentAddress: permanentFormatted,
    presentAddressParts: presentParts,
    permanentAddressParts: values.permanentAddressParts,

    previousSchoolName: values.previousSchoolName.trim() || undefined,
    previousSchoolEiin: values.previousSchoolEiin.trim() ? normalizeDigits(values.previousSchoolEiin.trim()) : null,
    previousSchoolAddress: values.previousSchoolAddress.trim() || undefined,
    previousClass: rules.defaultPreviousClassBn,
    previousGrade: rules.showPreviousGpa
      ? gpaToLetterGrade(values.prevExamGpa) || values.previousGrade.trim() || undefined
      : undefined,
    prevExamPassingYear: values.prevExamPassingYear.trim()
      ? Number(normalizeDigits(values.prevExamPassingYear))
      : undefined,
    prevExamRoll: values.prevExamRoll.trim() || undefined,
    prevExamGpa:
      rules.showPreviousGpa && values.prevExamGpa.trim()
        ? Number(normalizeDigits(values.prevExamGpa))
        : undefined,
    transferCertificateNo: values.transferCertificateNo.trim() || null,
    transferCertificateDate: values.transferCertificateDate.trim() || null,
    boardRegistrationNo: values.boardRegistrationNo.trim()
      ? normalizeDigits(values.boardRegistrationNo.trim())
      : null,
    boardRegistrationSession: values.boardRegistrationSession.trim() || null,

    admissionType: values.admissionType,
    isReadmission: values.admissionType === 'READMISSION',
    targetClassId: values.targetClassId,
    preferredSection: undefined,
    targetGroupId: rules.requiresGroup ? values.targetGroupId || null : null,
    optionalClassSubjectId: rules.requiresOptionalSubject ? values.optionalClassSubjectId || null : null,
    optionalSubjectName: rules.requiresOptionalSubject ? chosenOptional?.nameBn ?? null : null,
    attachments: values.attachments ?? null,
    declarationAccepted: values.declarationAccepted,
    remarks: values.remarks.trim() || undefined,
  };
}

export function toAdminCreateStudentPayload(
  values: UnifiedAdmissionFormValues,
  db: MockDatabase,
  sourceApplicationId?: string
): Record<string, unknown> {
  const cls = db.classes.find((c) => c.id === values.targetClassId);
  const rules = getClassAdmissionRules(cls?.numericValue ?? 6);
  const permanentFormatted = formatStructuredAddress(values.permanentAddressParts);
  const presentParts = values.sameAsPermanent ? values.permanentAddressParts : values.presentAddressParts;
  const presentFormatted = formatStructuredAddress(presentParts);

  return {
    sourceApplicationId: sourceApplicationId || undefined,
    nameBn: values.studentNameBn.trim(),
    nameEn: toBlockLetters(values.studentNameEn.trim()),
    photo: values.photoPreview || null,
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    bloodGroup: values.bloodGroup || null,
    religion: values.religion,
    nationality: values.nationality.trim() || 'বাংলাদেশি',
    studentPhone: values.studentPhone.trim() ? normalizeDigits(values.studentPhone.trim()) : null,
    birthCertificateNo: normalizeDigits(values.birthCertificateNo.trim()),
    boardRegistrationNo: values.boardRegistrationNo.trim()
      ? normalizeDigits(values.boardRegistrationNo.trim())
      : null,
    presentAddress: presentFormatted,
    permanentAddress: permanentFormatted,

    fatherAlive: values.fatherAlive,
    fatherNameBn: values.fatherNameBn.trim(),
    fatherNameEn: toBlockLetters(values.fatherNameEn.trim()),
    fatherOccupation: values.fatherAlive ? values.fatherOccupation.trim() : 'মৃত',
    fatherNid: values.fatherNid.trim() ? normalizeDigits(values.fatherNid.trim()) : '',
    fatherPhone: values.fatherAlive && values.fatherPhone.trim() ? normalizeDigits(values.fatherPhone.trim()) : '',

    motherAlive: values.motherAlive,
    motherNameBn: values.motherNameBn.trim(),
    motherNameEn: toBlockLetters(values.motherNameEn.trim()),
    motherOccupation: values.motherAlive ? values.motherOccupation.trim() : 'মৃত',
    motherNid: values.motherNid.trim() ? normalizeDigits(values.motherNid.trim()) : '',
    motherPhone: values.motherAlive && values.motherPhone.trim() ? normalizeDigits(values.motherPhone.trim()) : '',

    primaryGuardianType: values.primaryGuardianType,
    guardianPhone: resolvePrimaryGuardianPhone(values),
    guardianMonthlyIncome: values.guardianMonthlyIncome.trim()
      ? Number(normalizeDigits(values.guardianMonthlyIncome))
      : null,
    legalGuardianNameBn: values.legalGuardianNameBn.trim() || null,
    legalGuardianNameEn: values.legalGuardianNameEn.trim()
      ? toBlockLetters(values.legalGuardianNameEn.trim())
      : null,
    legalGuardianRelation: values.legalGuardianRelation.trim() || null,
    legalGuardianPhone: values.legalGuardianPhone.trim()
      ? normalizeDigits(values.legalGuardianPhone.trim())
      : null,
    legalGuardianNid: values.legalGuardianNid.trim()
      ? normalizeDigits(values.legalGuardianNid.trim())
      : null,
    legalGuardianAddress: values.legalGuardianAddress.trim() || null,

    previousSchoolName: values.previousSchoolName.trim() || null,
    previousSchoolEiin: values.previousSchoolEiin.trim() ? normalizeDigits(values.previousSchoolEiin.trim()) : null,
    previousSchoolAddress: values.previousSchoolAddress.trim() || null,
    previousGrade: rules.showPreviousGpa
      ? gpaToLetterGrade(values.prevExamGpa) || values.previousGrade.trim() || null
      : null,
    prevExamPassingYear: values.prevExamPassingYear.trim()
      ? Number(normalizeDigits(values.prevExamPassingYear))
      : null,
    prevExamRoll: values.prevExamRoll.trim() || null,
    prevExamGpa:
      rules.showPreviousGpa && values.prevExamGpa.trim()
        ? Number(normalizeDigits(values.prevExamGpa))
        : null,
    transferCertificateNo: values.transferCertificateNo.trim() || null,
    transferCertificateDate: values.transferCertificateDate.trim() || null,

    admissionType: values.admissionType,
    isReadmission: values.admissionType === 'READMISSION',
    academicYearId: values.academicYearId,
    classId: values.targetClassId,
    sectionId: values.sectionId,
    groupId: rules.requiresGroup ? values.targetGroupId || null : null,
    optionalClassSubjectId: rules.requiresOptionalSubject ? values.optionalClassSubjectId || null : null,
    roll: Number(normalizeDigits(values.roll)),
    formSerialNo: values.formSerialNo.trim() || null,
    verifiedDocuments: values.verifiedDocuments ?? {},
    remarks: [
      values.receiptNo.trim() ? `রসিদ নং: ${values.receiptNo.trim()}` : '',
      values.admissionFeePaid.trim() ? `ভর্তি ফি: ৳${normalizeDigits(values.admissionFeePaid.trim())}` : '',
      values.remarks.trim(),
    ]
      .filter(Boolean)
      .join(' · ') || null,
  };
}
