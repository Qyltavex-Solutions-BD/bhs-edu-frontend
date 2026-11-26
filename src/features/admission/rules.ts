import { BloodGroup } from '@/src/types/enums';
import type {
  AcademicGroup,
  AcademicYear,
  ClassSubject,
  SchoolClass,
  SchoolProfile,
  Section,
  Student,
  StudentEnrollment,
  Subject,
} from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import type {
  AdmissionType,
  OnlineAdmissionApplication,
  StructuredAddress,
} from '@/src/types/proposed/future';

export interface AdmissionCatalogData {
  academicYears: AcademicYear[];
  classes: SchoolClass[];
  sections: Section[];
  academicGroups: AcademicGroup[];
  classSubjects: ClassSubject[];
  subjects?: Subject[];
  enrollments?: StudentEnrollment[];
  students?: Student[];
  onlineAdmissions?: OnlineAdmissionApplication[];
  admissionContent?: Partial<MockDatabase['admissionContent']>;
  schoolProfile?: SchoolProfile;
}

export type AdmissionFormMode = 'public' | 'admin';

export interface ClassAdmissionRule {
  numericClass: number;
  requiresGroup: boolean;
  requiresOptionalSubject: boolean;
  showBoardRegistration: boolean;
  requiresBoardRegistration: boolean;
  isTransferOrReadmissionOnly: boolean;
  allowedAdmissionTypes: AdmissionType[];
  defaultAdmissionType: AdmissionType;
  requiresParentNid: boolean;
  showStudentPhone: boolean;
  showPreviousSchoolEiin: boolean;
  showPreviousGpa: boolean;
  typicalMinAge: number;
  typicalMaxAge: number;
  defaultPreviousClassBn: string;
  defaultPreviousClassEn: string;
  previousSchoolLabelBn: string;
  previousSchoolLabelEn: string;
  policyNoteBn: string;
  policyNoteEn: string;
}

export interface DocumentChecklistItem {
  key: string;
  labelBn: string;
  labelEn: string;
  required: boolean;
}

const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function normalizeDigits(value: string): string {
  return value.replace(/[০-৯]/g, (ch) => BN_TO_EN_DIGITS[ch] ?? ch);
}

export function cleanNumericInput(value: string, maxLength?: number): string {
  const digits = normalizeDigits(value).replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

export function cleanDecimalInput(value: string, maxLength = 4): string {
  const normalized = normalizeDigits(value).replace(/[^0-9.]/g, '');
  const parts = normalized.split('.');
  const rebuilt = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : normalized;
  return rebuilt.slice(0, maxLength);
}

export function toBlockLetters(value: string): string {
  return value.toUpperCase();
}

/**
 * Official Bangladesh NCTB / Education Board 5.00 GPA-to-Letter-Grade conversion.
 */
export function gpaToLetterGrade(gpaRaw?: string | number | null): string {
  if (gpaRaw === undefined || gpaRaw === null || String(gpaRaw).trim() === '') return '';
  const num = Number(normalizeDigits(String(gpaRaw).trim()));
  if (Number.isNaN(num) || num < 0 || num > 5) return '';
  if (num >= 5.0) return 'A+';
  if (num >= 4.0) return 'A';
  if (num >= 3.5) return 'A-';
  if (num >= 3.0) return 'B';
  if (num >= 2.0) return 'C';
  if (num >= 1.0) return 'D';
  return 'F';
}

export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;
export const BD_NID_REGEX = /^(\d{10}|\d{13}|\d{17})$/;
export const BD_BIRTH_CERT_REGEX = /^\d{17}$/;
export const BOARD_REG_REGEX = /^\d{8,14}$/;

export const BLOOD_GROUP_OPTIONS: Array<{ value: BloodGroup; label: string }> = [
  { value: BloodGroup.A_POSITIVE, label: 'A+' },
  { value: BloodGroup.A_NEGATIVE, label: 'A-' },
  { value: BloodGroup.B_POSITIVE, label: 'B+' },
  { value: BloodGroup.B_NEGATIVE, label: 'B-' },
  { value: BloodGroup.O_POSITIVE, label: 'O+' },
  { value: BloodGroup.O_NEGATIVE, label: 'O-' },
  { value: BloodGroup.AB_POSITIVE, label: 'AB+' },
  { value: BloodGroup.AB_NEGATIVE, label: 'AB-' },
];

export const ADMISSION_TYPE_META: Record<
  AdmissionType,
  { bn: string; en: string; descBn: string; descEn: string }
> = {
  NEW: {
    bn: 'নতুন ভর্তি',
    en: 'New Admission',
    descBn: 'পূর্ববর্তী শ্রেণি উত্তীর্ণ হয়ে ভর্তি',
    descEn: 'Fresh admission after passing previous class',
  },
  TRANSFER: {
    bn: 'বদলি ভর্তি (TC / e-TC)',
    en: 'Transfer Admission (TC / e-TC)',
    descBn: 'অন্য বিদ্যালয়ের ছাড়পত্রসহ ভর্তি',
    descEn: 'Transfer from another school with TC',
  },
  READMISSION: {
    bn: 'পুনঃভর্তি',
    en: 'Re-admission',
    descBn: 'অত্র বিদ্যালয়ের পূর্ববর্তী শিক্ষার্থী',
    descEn: 'Returning student of this school',
  },
};

/**
 * Single Source of Truth for Bangladeshi Secondary School (Classes 6–10) admission rules.
 * Grounded in DSHE guidelines, Education Board eSIF (Class 9) & e-TC (Class 10) policies.
 */
export function getClassAdmissionRules(numericClass: number): ClassAdmissionRule {
  if (numericClass === 6) {
    return {
      numericClass: 6,
      requiresGroup: false,
      requiresOptionalSubject: false,
      showBoardRegistration: false,
      requiresBoardRegistration: false,
      isTransferOrReadmissionOnly: false,
      allowedAdmissionTypes: ['NEW', 'READMISSION'],
      defaultAdmissionType: 'NEW',
      requiresParentNid: true,
      showStudentPhone: false,
      showPreviousSchoolEiin: false,
      showPreviousGpa: false,
      typicalMinAge: 10,
      typicalMaxAge: 14,
      defaultPreviousClassBn: '৫ম শ্রেণি',
      defaultPreviousClassEn: 'Class 5',
      previousSchoolLabelBn: '৫ম শ্রেণি উত্তীর্ণ প্রাথমিক বিদ্যালয়ের নাম',
      previousSchoolLabelEn: 'Primary School Attended (Class 5)',
      policyNoteBn:
        '৬ষ্ঠ শ্রেণি: ৫ম শ্রেণি উত্তীর্ণ প্রত্যয়নপত্র ও ১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন সনদ প্রযোজ্য।',
      policyNoteEn:
        'Class 6: Class 5 completion proof and 17-digit online Birth Registration Certificate apply.',
    };
  }

  if (numericClass === 7 || numericClass === 8) {
    const prevBn = numericClass === 7 ? '৬ষ্ঠ শ্রেণি' : '৭ম শ্রেণি';
    const prevEn = numericClass === 7 ? 'Class 6' : 'Class 7';
    return {
      numericClass,
      requiresGroup: false,
      requiresOptionalSubject: false,
      showBoardRegistration: false,
      requiresBoardRegistration: false,
      isTransferOrReadmissionOnly: false,
      allowedAdmissionTypes: ['NEW', 'TRANSFER', 'READMISSION'],
      defaultAdmissionType: 'NEW',
      requiresParentNid: true,
      showStudentPhone: false,
      showPreviousSchoolEiin: true,
      showPreviousGpa: true,
      typicalMinAge: numericClass === 7 ? 11 : 12,
      typicalMaxAge: numericClass === 7 ? 15 : 16,
      defaultPreviousClassBn: prevBn,
      defaultPreviousClassEn: prevEn,
      previousSchoolLabelBn: `${prevBn} অধ্যয়নরত বিদ্যালয়ের নাম`,
      previousSchoolLabelEn: `Previous School Name (${prevEn})`,
      policyNoteBn: `${numericClass === 7 ? '৭ম' : '৮ম'} শ্রেণি: নতুন ভর্তি অথবা অন্য বিদ্যালয় থেকে বদলির ক্ষেত্রে মূল ছাড়পত্র (TC) ও ফলাফল বিবরণী প্রযোজ্য।`,
      policyNoteEn: `Class ${numericClass}: New admission or original Transfer Certificate (TC) and academic transcript apply.`,
    };
  }

  if (numericClass === 9) {
    return {
      numericClass: 9,
      requiresGroup: true,
      requiresOptionalSubject: true,
      showBoardRegistration: true,
      requiresBoardRegistration: false,
      isTransferOrReadmissionOnly: false,
      allowedAdmissionTypes: ['NEW', 'TRANSFER', 'READMISSION'],
      defaultAdmissionType: 'NEW',
      requiresParentNid: true,
      showStudentPhone: true,
      showPreviousSchoolEiin: true,
      showPreviousGpa: true,
      typicalMinAge: 13,
      typicalMaxAge: 17,
      defaultPreviousClassBn: '৮ম শ্রেণি',
      defaultPreviousClassEn: 'Class 8',
      previousSchoolLabelBn: '৮ম শ্রেণি উত্তীর্ণ বিদ্যালয়ের নাম',
      previousSchoolLabelEn: 'Previous School Name (Class 8)',
      policyNoteBn:
        '৯ম শ্রেণি: বিভাগ ও ৪র্থ বিষয় নির্বাচন এবং এসএসসি বোর্ড রেজিস্ট্রেশনের জন্য পিতা-মাতার এনআইডি আবশ্যক।',
      policyNoteEn:
        'Class 9: Academic Group, 4th subject, and parents’ NID are required for SSC Board Registration.',
    };
  }

  // Class 10 (SSC Batch) — Strictly Transfer (Board e-TC) or Re-admission per Education Board policy
  return {
    numericClass: 10,
    requiresGroup: true,
    requiresOptionalSubject: true,
    showBoardRegistration: true,
    requiresBoardRegistration: true,
    isTransferOrReadmissionOnly: true,
    allowedAdmissionTypes: ['TRANSFER', 'READMISSION'],
    defaultAdmissionType: 'TRANSFER',
    requiresParentNid: true,
    showStudentPhone: true,
    showPreviousSchoolEiin: true,
    showPreviousGpa: true,
    typicalMinAge: 14,
    typicalMaxAge: 18,
    defaultPreviousClassBn: '৯ম শ্রেণি',
    defaultPreviousClassEn: 'Class 9',
    previousSchoolLabelBn: '৯ম শ্রেণিতে অধ্যয়নরত বিদ্যালয়ের নাম',
    previousSchoolLabelEn: 'Previous School Name (Class 9)',
    policyNoteBn:
      '১০ম শ্রেণি: শিক্ষা বোর্ডের নীতিমালা অনুযায়ী কেবল বোর্ড অনুমোদিত e-TC অথবা পুনঃভর্তি প্রযোজ্য। ৯ম শ্রেণির বোর্ড রেজিস্ট্রেশন নম্বর ও বিভাগ হুবহু প্রদান করতে হবে।',
    policyNoteEn:
      'Class 10: Only Education Board approved e-TC transfers or re-admissions are eligible. Class 9 Board Registration No and stream are mandatory.',
  };
}

export function getRequiredDocumentChecklist(
  numericClass: number,
  admissionType: AdmissionType,
  hasDeceasedParent = false
): DocumentChecklistItem[] {
  const items: DocumentChecklistItem[] = [
    {
      key: 'passportPhotos',
      labelBn: 'শিক্ষার্থীর সদ্য তোলা ২ কপি পাসপোর্ট সাইজ রঙিন ছবি',
      labelEn: '2 recent passport-size color photographs of the student',
      required: true,
    },
    {
      key: 'birthCertificateCopy',
      labelBn: 'শিক্ষার্থীর ১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন সনদের ফটোকপি (বাংলা ও ইংরেজি)',
      labelEn: 'Photocopy of 17-digit online Birth Registration Certificate (BN & EN)',
      required: true,
    },
    {
      key: 'parentsNidCopy',
      labelBn: 'পিতা ও মাতার (অথবা বৈধ অভিভাবকের) জাতীয় পরিচয়পত্রের (NID) ফটোকপি',
      labelEn: 'Photocopy of Father’s & Mother’s (or Legal Guardian’s) NID cards',
      required: true,
    },
  ];

  if (numericClass === 6) {
    items.push({
      key: 'prevClassTestimonial',
      labelBn: '৫ম শ্রেণি উত্তীর্ণের প্রত্যয়নপত্র / বার্ষিক ফলাফল সনদ',
      labelEn: 'Class 5 completion certificate / annual exam report card',
      required: true,
    });
  } else if (numericClass <= 8) {
    items.push({
      key: 'transferCertificate',
      labelBn:
        admissionType === 'TRANSFER'
          ? 'পূর্ববর্তী বিদ্যালয়ের মূল ছাড়পত্র (TC) ও বার্ষিক ফলাফল বিবরণী'
          : 'পূর্ববর্তী শ্রেণির বার্ষিক পরীক্ষার ফলাফল বিবরণী',
      labelEn:
        admissionType === 'TRANSFER'
          ? 'Original Transfer Certificate (TC) & annual exam transcript'
          : 'Previous class annual exam transcript',
      required: true,
    });
  } else if (numericClass === 9) {
    items.push({
      key: 'class8PassCert',
      labelBn:
        '৮ম শ্রেণি উত্তীর্ণের প্রশংসাপত্র / বার্ষিক নম্বরপত্র' +
        (admissionType === 'TRANSFER' ? ' ও মূল ছাড়পত্র (TC)' : ''),
      labelEn:
        'Class 8 pass certificate / annual transcript' +
        (admissionType === 'TRANSFER' ? ' & Original TC' : ''),
      required: true,
    });
  } else {
    items.push({
      key: 'boardRegAndEtc',
      labelBn:
        admissionType === 'TRANSFER'
          ? 'শিক্ষা বোর্ডের অনুমোদিত e-TC অর্ডার ও ৯ম শ্রেণির বোর্ড রেজিস্ট্রেশন কার্ডের কপি'
          : '৯ম শ্রেণির বোর্ড রেজিস্ট্রেশন কার্ড ও বার্ষিক ফলাফল বিবরণী',
      labelEn:
        admissionType === 'TRANSFER'
          ? 'Education Board approved e-TC Order & Class 9 Board Registration Card'
          : 'Class 9 Board Registration Card & annual exam transcript',
      required: true,
    });
  }

  if (hasDeceasedParent) {
    items.push({
      key: 'parentDeathCertificate',
      labelBn: 'মৃত পিতা/মাতার মৃত্যু নিবন্ধন সনদের ফটোকপি (সংগ্রহে থাকলে)',
      labelEn: 'Photocopy of deceased parent’s Death Certificate (if available)',
      required: false,
    });
  }

  return items;
}

export function formatStructuredAddress(parts: StructuredAddress): string {
  const segments: string[] = [];
  if (parts.village.trim()) segments.push(`গ্রাম/বাসা: ${parts.village.trim()}`);
  if (parts.postOffice.trim()) {
    const po = parts.postCode?.trim()
      ? `${parts.postOffice.trim()} (${parts.postCode.trim()})`
      : parts.postOffice.trim();
    segments.push(`ডাকঘর: ${po}`);
  }
  if (parts.upazila.trim()) segments.push(`উপজেলা: ${parts.upazila.trim()}`);
  if (parts.district.trim()) segments.push(`জেলা: ${parts.district.trim()}`);
  return segments.join(', ');
}

export function parseAddressToStructured(raw?: string | null): StructuredAddress {
  if (!raw || !raw.trim()) {
    return { village: '', postOffice: '', postCode: '', upazila: '', district: '' };
  }
  const chunks = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const extract = (prefixes: string[], fallbackIndex?: number) => {
    const found = chunks.find((c) => prefixes.some((p) => c.startsWith(p)));
    if (found) {
      for (const p of prefixes) {
        if (found.startsWith(p)) return found.slice(p.length).trim();
      }
    }
    if (fallbackIndex !== undefined && chunks[fallbackIndex]) {
      return chunks[fallbackIndex].replace(/^[^:]+:\s*/, '').trim();
    }
    return '';
  };

  const poRaw = extract(['ডাকঘর:', 'পোস্ট:', 'PO:'], chunks.length >= 4 ? 1 : undefined);
  const poMatch = poRaw.match(/^(.+?)\s*\((\d{4})\)$/);

  return {
    village: extract(['গ্রাম/বাসা:', 'গ্রাম:', 'বাসা:', 'Village:'], 0),
    postOffice: poMatch ? poMatch[1].trim() : poRaw,
    postCode: poMatch ? poMatch[2] : '',
    upazila: extract(
      ['উপজেলা:', 'থানা:', 'Upazila:'],
      chunks.length >= 4 ? 2 : chunks.length === 3 ? 1 : undefined
    ),
    district: extract(
      ['জেলা:', 'District:'],
      chunks.length >= 2 ? chunks.length - 1 : undefined
    ),
  };
}

export function calculateAgeYears(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export interface OptionalSubjectChoice {
  classSubjectId: string;
  subjectId: string;
  nameBn: string;
  nameEn: string;
  officialCode?: string | null;
}

export function getOptionalSubjectsForClassGroup(
  db: AdmissionCatalogData,
  classId: string,
  groupId?: string | null,
  academicYearId?: string
): OptionalSubjectChoice[] {
  if (!classId) return [];

  const filterRows = (yearId?: string) =>
    db.classSubjects.filter(
      (row) =>
        row.isOptional &&
        row.isActive &&
        row.classId === classId &&
        (!yearId || row.academicYearId === yearId) &&
        (!groupId || !row.groupId || row.groupId === groupId)
    );

  let rows = academicYearId ? filterRows(academicYearId) : [];
  if (!rows.length) {
    const activeYear = db.academicYears.find((y) => y.isActive)?.id;
    rows = filterRows(activeYear);
  }
  if (!rows.length) {
    rows = filterRows(undefined);
  }

  const seen = new Set<string>();
  const choices: OptionalSubjectChoice[] = [];
  for (const row of rows) {
    if (seen.has(row.subjectId)) continue;
    seen.add(row.subjectId);
    const sub =
      (row as ClassSubject & { subject?: Subject }).subject ??
      db.subjects?.find((s) => s.id === row.subjectId);
    if (!sub) continue;
    choices.push({
      classSubjectId: row.id,
      subjectId: sub.id,
      nameBn: sub.nameBn || sub.name,
      nameEn: sub.name,
      officialCode: sub.officialCode,
    });
  }
  return choices;
}

export function getNextSuggestedRoll(
  db: AdmissionCatalogData,
  academicYearId: string,
  sectionId: string
): number {
  if (!academicYearId || !sectionId) return 1;
  const rolls = (db.enrollments ?? [])
    .filter((e) => e.academicYearId === academicYearId && e.sectionId === sectionId)
    .map((e) => e.roll);
  return rolls.length ? Math.max(...rolls) + 1 : 1;
}

export function checkDuplicateIdentity(
  db: AdmissionCatalogData,
  params: {
    birthCertificateNo?: string;
    boardRegistrationNo?: string;
    ignoreApplicationId?: string;
  }
): { birthCertConflict?: string; boardRegConflict?: string } {
  const result: { birthCertConflict?: string; boardRegConflict?: string } = {};
  const bcn = params.birthCertificateNo?.trim();
  const brn = params.boardRegistrationNo?.trim();

  if (bcn && BD_BIRTH_CERT_REGEX.test(bcn)) {
    const existingStudent = (db.students ?? []).find((s) => s.birthCertificateNo === bcn);
    if (existingStudent) {
      result.birthCertConflict = `এই জন্ম নিবন্ধন নম্বর ইতোমধ্যে ${existingStudent.nameBn || existingStudent.nameEn} (${existingStudent.studentId})-এর নামে নিবন্ধিত রয়েছে।`;
    } else {
      const existingApp = (db.onlineAdmissions ?? []).find(
        (a) =>
          a.birthCertificateNo === bcn &&
          a.status !== 'REJECTED' &&
          a.id !== params.ignoreApplicationId
      );
      if (existingApp) {
        result.birthCertConflict = `এই জন্ম নিবন্ধন নম্বর দিয়ে ইতোমধ্যে একটি আবেদন (${existingApp.applicationNumber}) জমা রয়েছে।`;
      }
    }
  }

  if (brn && brn.length >= 8) {
    const existingStudent = (db.students ?? []).find((s) => s.boardRegistrationNo === brn);
    if (existingStudent) {
      result.boardRegConflict = `এই বোর্ড রেজিস্ট্রেশন নম্বর ইতোমধ্যে ${existingStudent.nameBn || existingStudent.nameEn} (${existingStudent.studentId})-এর নামে নিবন্ধিত রয়েছে।`;
    } else {
      const existingApp = (db.onlineAdmissions ?? []).find(
        (a) =>
          a.boardRegistrationNo === brn &&
          a.status !== 'REJECTED' &&
          a.id !== params.ignoreApplicationId
      );
      if (existingApp) {
        result.boardRegConflict = `এই বোর্ড রেজিস্ট্রেশন নম্বর দিয়ে ইতোমধ্যে একটি আবেদন (${existingApp.applicationNumber}) জমা রয়েছে।`;
      }
    }
  }

  return result;
}
