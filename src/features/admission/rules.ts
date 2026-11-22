import { BloodGroup } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { AdmissionType, StructuredAddress } from '@/src/types/proposed/future';

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
  minAge: number;
  maxAge: number;
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

export function toBlockLetters(value: string): string {
  return value.toUpperCase();
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
    descBn: 'প্রাথমিক বা পূর্ববর্তী স্তর উত্তীর্ণ হয়ে নতুন ভর্তি',
    descEn: 'Fresh admission after completing previous class',
  },
  TRANSFER: {
    bn: 'বদলি (TC / e-TC)',
    en: 'Transfer (TC / e-TC)',
    descBn: 'অন্য মাধ্যমিক বিদ্যালয় থেকে ছাড়পত্রসহ ভর্তি',
    descEn: 'Transfer from another secondary school with TC',
  },
  READMISSION: {
    bn: 'পুনঃভর্তি',
    en: 'Re-admission',
    descBn: 'অত্র বিদ্যালয়ের পূর্ববর্তী শিক্ষার্থীর পুনঃভর্তি',
    descEn: 'Re-admission for a returning student of this school',
  },
};

/**
 * Single Source of Truth for Bangladeshi Secondary School (Classes 6-10) admission rules.
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
      requiresParentNid: false,
      showStudentPhone: false,
      minAge: 9,
      maxAge: 15,
      defaultPreviousClassBn: '৫ম শ্রেণি',
      defaultPreviousClassEn: 'Class 5',
      previousSchoolLabelBn: 'পূর্ববর্তী প্রাথমিক বিদ্যালয়ের নাম',
      previousSchoolLabelEn: 'Previous Primary School Name',
      policyNoteBn:
        '৬ষ্ঠ শ্রেণিতে ভর্তির জন্য ৫ম শ্রেণি উত্তীর্ণ প্রত্যয়নপত্র ও ১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন আবশ্যক।',
      policyNoteEn:
        'Class 6 admission requires Class 5 completion proof and a 17-digit online Birth Registration Certificate.',
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
      allowedAdmissionTypes: ['TRANSFER', 'NEW', 'READMISSION'],
      defaultAdmissionType: 'TRANSFER',
      requiresParentNid: false,
      showStudentPhone: false,
      minAge: numericClass === 7 ? 10 : 11,
      maxAge: numericClass === 7 ? 16 : 17,
      defaultPreviousClassBn: prevBn,
      defaultPreviousClassEn: prevEn,
      previousSchoolLabelBn: 'পূর্ববর্তী মাধ্যমিক বিদ্যালয়ের নাম',
      previousSchoolLabelEn: 'Previous Secondary School Name',
      policyNoteBn: `${numericClass === 7 ? '৭ম' : '৮ম'} শ্রেণিতে অন্য বিদ্যালয় থেকে ভর্তির ক্ষেত্রে ছাড়পত্র (TC) ও বার্ষিক পরীক্ষার ফলাফল সনদ আবশ্যক।`,
      policyNoteEn: `Admission to Class ${numericClass} from another school requires a Transfer Certificate (TC) and annual exam transcript.`,
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
      minAge: 12,
      maxAge: 18,
      defaultPreviousClassBn: '৮ম শ্রেণি',
      defaultPreviousClassEn: 'Class 8',
      previousSchoolLabelBn: '৮ম শ্রেণিতে অধ্যয়নরত বিদ্যালয়ের নাম',
      previousSchoolLabelEn: 'School Attended in Class 8',
      policyNoteBn:
        '৯ম শ্রেণিতে এসএসসি বোর্ড রেজিস্ট্রেশন (eSIF) হবে। বিভাগ ও ৪র্থ বিষয় নির্বাচন, ইংরেজি নাম (BLOCK LETTERS), ১৭ ডিজিট জন্ম নিবন্ধন এবং পিতা-মাতার এনআইডি বাধ্যতামূলক।',
      policyNoteEn:
        'SSC Board Registration (eSIF) takes place in Class 9. Group, 4th subject, English BLOCK LETTERS names, 17-digit Birth Certificate, and parents’ NID are required.',
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
    minAge: 13,
    maxAge: 19,
    defaultPreviousClassBn: '৯ম শ্রেণি',
    defaultPreviousClassEn: 'Class 9',
    previousSchoolLabelBn: 'পূর্ববর্তী বিদ্যালয়ের নাম (৯ম শ্রেণি)',
    previousSchoolLabelEn: 'Previous School Name (Class 9)',
    policyNoteBn:
      'শিক্ষা বোর্ডের নীতিমালা অনুযায়ী ১০ম শ্রেণিতে সরাসরি নতুন ভর্তি হয় না—শুধুমাত্র বোর্ড অনুমোদিত e-TC (ছাড়পত্র) বা পুনঃভর্তি গ্রহণযোগ্য। ৯ম শ্রেণির বোর্ড রেজিস্ট্রেশন নম্বর, বিভাগ ও ৪র্থ বিষয় হুবহু দিতে হবে।',
    policyNoteEn:
      'Per Education Board policy, Class 10 accepts only Board e-TC transfers or re-admissions. Class 9 Board Registration No, exact stream, and 4th subject are mandatory.',
  };
}

export function getRequiredDocumentChecklist(
  numericClass: number,
  admissionType: AdmissionType
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
          ? 'Original Transfer Certificate (TC) & annual exam transcript from previous school'
          : 'Previous class annual exam transcript',
      required: true,
    });
  } else if (numericClass === 9) {
    items.push({
      key: 'class8PassCert',
      labelBn: '৮ম শ্রেণি উত্তীর্ণের প্রশংসাপত্র / বার্ষিক নম্বরপত্র' + (admissionType === 'TRANSFER' ? ' ও ছাড়পত্র (TC)' : ''),
      labelEn: 'Class 8 pass certificate / annual transcript' + (admissionType === 'TRANSFER' ? ' & Transfer Certificate (TC)' : ''),
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
          ? 'Education Board approved e-TC Order & Class 9 Board Registration Card copy'
          : 'Class 9 Board Registration Card & annual exam transcript',
      required: true,
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
  const chunks = raw.split(',').map((s) => s.trim()).filter(Boolean);
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
    upazila: extract(['উপজেলা:', 'থানা:', 'Upazila:'], chunks.length >= 4 ? 2 : chunks.length === 3 ? 1 : undefined),
    district: extract(['জেলা:', 'District:'], chunks.length >= 2 ? chunks.length - 1 : undefined),
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

/**
 * Dynamically fetches valid 4th/optional subjects for a given class + academic group
 * from db.classSubjects (with fallback across academic years so upcoming sessions like 2027 work).
 */
export function getOptionalSubjectsForClassGroup(
  db: MockDatabase,
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
    const sub = db.subjects.find((s) => s.id === row.subjectId);
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
  db: MockDatabase,
  academicYearId: string,
  sectionId: string
): number {
  if (!academicYearId || !sectionId) return 1;
  const rolls = db.enrollments
    .filter((e) => e.academicYearId === academicYearId && e.sectionId === sectionId)
    .map((e) => e.roll);
  return rolls.length ? Math.max(...rolls) + 1 : 1;
}

export function checkDuplicateIdentity(
  db: MockDatabase,
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
    const existingStudent = db.students.find((s) => s.birthCertificateNo === bcn);
    if (existingStudent) {
      result.birthCertConflict = `এই জন্ম নিবন্ধন নম্বর ইতোমধ্যে ভর্তি শিক্ষার্থী ${existingStudent.nameBn || existingStudent.nameEn} (${existingStudent.studentId})-এর নামে নিবন্ধিত।`;
    } else {
      const existingApp = db.onlineAdmissions.find(
        (a) =>
          a.birthCertificateNo === bcn &&
          a.status !== 'REJECTED' &&
          a.id !== params.ignoreApplicationId
      );
      if (existingApp) {
        result.birthCertConflict = `এই জন্ম নিবন্ধন নম্বর দিয়ে ইতোমধ্যে একটি সক্রিয় আবেদন (${existingApp.applicationNumber}) জমা আছে।`;
      }
    }
  }

  if (brn && brn.length >= 8) {
    const existingStudent = db.students.find((s) => s.boardRegistrationNo === brn);
    if (existingStudent) {
      result.boardRegConflict = `এই বোর্ড রেজিস্ট্রেশন নম্বর ইতোমধ্যে ${existingStudent.nameBn || existingStudent.nameEn} (${existingStudent.studentId})-এর নামে নিবন্ধিত।`;
    } else {
      const existingApp = db.onlineAdmissions.find(
        (a) =>
          a.boardRegistrationNo === brn &&
          a.status !== 'REJECTED' &&
          a.id !== params.ignoreApplicationId
      );
      if (existingApp) {
        result.boardRegConflict = `এই বোর্ড রেজিস্ট্রেশন নম্বর দিয়ে ইতোমধ্যে আবেদন (${existingApp.applicationNumber}) জমা আছে।`;
      }
    }
  }

  return result;
}
