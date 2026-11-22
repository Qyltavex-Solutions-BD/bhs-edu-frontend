import { z } from 'zod';
import { Gender, Religion } from '@/src/types/enums';
import type { SchoolClass } from '@/src/types/entities';
import {
  AdmissionFormMode,
  BD_BIRTH_CERT_REGEX,
  BD_NID_REGEX,
  BD_PHONE_REGEX,
  BOARD_REG_REGEX,
  calculateAgeYears,
  getClassAdmissionRules,
  normalizeDigits,
} from './rules';

export const structuredAddressSchema = z.object({
  village: z.string().trim(),
  postOffice: z.string().trim(),
  postCode: z.string().trim().optional().default(''),
  upazila: z.string().trim(),
  district: z.string().trim(),
});

export const documentAttachmentSchema = z
  .object({
    name: z.string(),
    dataUrl: z.string(),
    sizeBytes: z.number().optional(),
  })
  .nullable()
  .optional();

/**
 * Single Canonical Schema for Both Public Online Admission & Admin New Student Admission.
 * Base schema defines clean types; all required & class-conditional rules run inside superRefine()
 * so partial per-step validation via form.trigger() works accurately at every step.
 */
export const unifiedAdmissionBaseSchema = z.object({
  // Step 1: Class, Admission Type & Previous Academic Records
  targetClassId: z.string().default(''),
  admissionType: z.enum(['NEW', 'TRANSFER', 'READMISSION']),
  preferredSection: z.string().optional().default(''),
  targetGroupId: z.string().optional().default(''),
  optionalClassSubjectId: z.string().optional().default(''),
  previousSchoolName: z.string().trim().optional().default(''),
  previousSchoolEiin: z.string().trim().optional().default(''),
  previousSchoolAddress: z.string().trim().optional().default(''),
  previousClass: z.string().trim().optional().default(''),
  previousGrade: z.string().trim().optional().default(''),
  prevExamPassingYear: z.string().trim().optional().default(''),
  prevExamRoll: z.string().trim().optional().default(''),
  prevExamGpa: z.string().trim().optional().default(''),
  transferCertificateNo: z.string().trim().optional().default(''),
  transferCertificateDate: z.string().trim().optional().default(''),
  boardRegistrationNo: z.string().trim().optional().default(''),
  boardRegistrationSession: z.string().trim().optional().default(''),

  // Step 2: Student Identity & Passport Photo
  photoPreview: z.string().nullable().optional().default(null),
  studentNameBn: z.string().trim().default(''),
  studentNameEn: z.string().trim().default(''),
  dateOfBirth: z.string().default(''),
  birthCertificateNo: z
    .string()
    .trim()
    .transform((v) => normalizeDigits(v)),
  gender: z.nativeEnum(Gender),
  religion: z.nativeEnum(Religion),
  bloodGroup: z.string().optional().default(''),
  nationality: z.string().trim().default('বাংলাদেশি'),
  studentPhone: z.string().trim().optional().default(''),

  // Step 3: Parents (Alive/Deceased), Legal Guardian & Structured Addresses
  fatherAlive: z.boolean().default(true),
  fatherNameBn: z.string().trim().default(''),
  fatherNameEn: z.string().trim().default(''),
  fatherOccupation: z.string().trim().optional().default(''),
  fatherNid: z.string().trim().optional().default(''),
  fatherPhone: z.string().trim().optional().default(''),

  motherAlive: z.boolean().default(true),
  motherNameBn: z.string().trim().default(''),
  motherNameEn: z.string().trim().default(''),
  motherOccupation: z.string().trim().optional().default(''),
  motherNid: z.string().trim().optional().default(''),
  motherPhone: z.string().trim().optional().default(''),

  primaryGuardianType: z.enum(['FATHER', 'MOTHER', 'LEGAL_GUARDIAN']).default('FATHER'),
  guardianMonthlyIncome: z.string().trim().optional().default(''),
  hasSeparateGuardian: z.boolean().default(false),
  legalGuardianNameBn: z.string().trim().optional().default(''),
  legalGuardianNameEn: z.string().trim().optional().default(''),
  legalGuardianRelation: z.string().trim().optional().default(''),
  legalGuardianNid: z.string().trim().optional().default(''),
  legalGuardianPhone: z.string().trim().optional().default(''),
  legalGuardianAddress: z.string().trim().optional().default(''),

  permanentAddressParts: structuredAddressSchema,
  sameAsPermanent: z.boolean().default(true),
  presentAddressParts: structuredAddressSchema,

  // Step 4: Attachments, Declaration (Public) OR Office Placement & Doc Verification (Admin)
  attachments: z
    .object({
      birthCertificate: documentAttachmentSchema,
      parentsNid: documentAttachmentSchema,
      previousRecordOrTc: documentAttachmentSchema,
    })
    .optional()
    .default({}),
  declarationAccepted: z.boolean().default(false),

  // Admin Office Placement Fields
  academicYearId: z.string().optional().default(''),
  sectionId: z.string().optional().default(''),
  roll: z.string().trim().optional().default(''),
  formSerialNo: z.string().trim().optional().default(''),
  admissionFeePaid: z.string().trim().optional().default(''),
  receiptNo: z.string().trim().optional().default(''),
  verifiedDocuments: z.record(z.string(), z.boolean()).optional().default({}),
  remarks: z.string().trim().optional().default(''),
});

export type UnifiedAdmissionFormValues = z.infer<typeof unifiedAdmissionBaseSchema>;

const ENGLISH_NAME_REGEX = /^[A-Za-z.\-'\s]+$/;

export function buildUnifiedAdmissionSchema(
  mode: AdmissionFormMode,
  classes: SchoolClass[]
) {
  return unifiedAdmissionBaseSchema.superRefine((data, ctx) => {
    // --- STEP 1: Class, Admission Type, Stream, Previous Academic ---
    if (!data.targetClassId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetClassId'],
        message: 'ভর্তিচ্ছু শ্রেণি নির্বাচন করুন।',
      });
    }

    const selectedClass = classes.find((c) => c.id === data.targetClassId);
    const numericClass = selectedClass?.numericValue ?? 6;
    const rules = getClassAdmissionRules(numericClass);

    if (!rules.allowedAdmissionTypes.includes(data.admissionType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['admissionType'],
        message: '১০ম শ্রেণিতে বদলি (e-TC) অথবা পুনঃভর্তি নির্বাচন করুন।',
      });
    }

    if (rules.requiresGroup && !data.targetGroupId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetGroupId'],
        message: 'বিভাগ নির্বাচন করুন।',
      });
    }

    if (rules.requiresOptionalSubject && data.targetGroupId && !data.optionalClassSubjectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['optionalClassSubjectId'],
        message: '৪র্থ (ঐচ্ছিক) বিষয় নির্বাচন করুন।',
      });
    }

    if (data.admissionType !== 'READMISSION' && data.previousSchoolName.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['previousSchoolName'],
        message: 'পূর্ববর্তী বিদ্যালয়ের নাম প্রদান করুন।',
      });
    }

    if (data.previousSchoolEiin.trim()) {
      const eiin = normalizeDigits(data.previousSchoolEiin.trim());
      if (!/^\d{6}$/.test(eiin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousSchoolEiin'],
          message: 'EIIN নম্বর ৬ ডিজিটের হতে হবে।',
        });
      }
    }

    if (data.prevExamGpa.trim()) {
      const gpa = Number(normalizeDigits(data.prevExamGpa.trim()));
      if (Number.isNaN(gpa) || gpa < 0 || gpa > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['prevExamGpa'],
          message: 'জিপিএ ০.০০ থেকে ৫.০০-এর মধ্যে প্রদান করুন।',
        });
      }
    }

    if (
      data.admissionType === 'TRANSFER' &&
      numericClass >= 7 &&
      data.transferCertificateNo.trim().length < 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transferCertificateNo'],
        message:
          numericClass === 10
            ? 'বোর্ড e-TC / ছাড়পত্র নম্বর প্রদান করুন।'
            : 'পূর্ববর্তী বিদ্যালয়ের ছাড়পত্র (TC) নম্বর প্রদান করুন।',
      });
    }

    if (rules.requiresBoardRegistration) {
      const reg = normalizeDigits(data.boardRegistrationNo.trim());
      if (!BOARD_REG_REGEX.test(reg)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['boardRegistrationNo'],
          message: '৯ম শ্রেণির সঠিক বোর্ড রেজিস্ট্রেশন নম্বর (৮–১৪ ডিজিট) প্রদান করুন।',
        });
      }
    } else if (data.boardRegistrationNo.trim()) {
      const reg = normalizeDigits(data.boardRegistrationNo.trim());
      if (!BOARD_REG_REGEX.test(reg)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['boardRegistrationNo'],
          message: 'বোর্ড রেজিস্ট্রেশন নম্বর ৮–১৪ ডিজিটের হতে হবে।',
        });
      }
    }

    // --- STEP 2: Student Identity, BDRIS 17-Digit Check & Sensible Date Sanity ---
    if (data.studentNameBn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['studentNameBn'],
        message: 'শিক্ষার্থীর বাংলা নাম প্রদান করুন।',
      });
    }

    if (data.studentNameEn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['studentNameEn'],
        message: 'শিক্ষার্থীর ইংরেজি নাম প্রদান করুন।',
      });
    } else if (!ENGLISH_NAME_REGEX.test(data.studentNameEn.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['studentNameEn'],
        message: 'ইংরেজি নামে কেবল ইংরেজি অক্ষর ব্যবহার করুন।',
      });
    }

    if (data.dateOfBirth.trim().length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateOfBirth'],
        message: 'জন্ম তারিখ নির্বাচন করুন।',
      });
    } else {
      // Only hard-block impossible dates (future, <6 yrs, or >25 yrs);
      // DSHE typical range outside 10-18 is shown as a soft advisory in UI, never a hard blocker.
      const age = calculateAgeYears(data.dateOfBirth);
      if (age === null || age < 6 || age > 25) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dateOfBirth'],
          message: 'সঠিক জন্ম তারিখ নির্বাচন করুন।',
        });
      }
    }

    if (!BD_BIRTH_CERT_REGEX.test(data.birthCertificateNo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['birthCertificateNo'],
        message: '১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন নম্বর প্রদান করুন।',
      });
    } else if (data.dateOfBirth) {
      const dobYear = data.dateOfBirth.slice(0, 4);
      const certYear = data.birthCertificateNo.slice(0, 4);
      if (dobYear !== certYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthCertificateNo'],
          message: `জন্ম নিবন্ধন নম্বরের প্রথম ৪ ডিজিট (${certYear}) জন্মসালের (${dobYear}) সাথে সামঞ্জস্যপূর্ণ নয়।`,
        });
      }
    }

    if (data.nationality.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nationality'],
        message: 'জাতীয়তা প্রদান করুন।',
      });
    }

    if (data.studentPhone.trim()) {
      const phone = normalizeDigits(data.studentPhone.trim());
      if (!BD_PHONE_REGEX.test(phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['studentPhone'],
          message: '১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন (01XXXXXXXXX)।',
        });
      }
    }

    if (mode === 'public' && !data.photoPreview) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['photoPreview'],
        message: 'শিক্ষার্থীর পাসপোর্ট সাইজ ছবি আপলোড করুন।',
      });
    }

    // --- STEP 3: Parents, Legal Guardian & Structured Addresses ---
    if (data.fatherNameBn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fatherNameBn'],
        message: 'পিতার বাংলা নাম প্রদান করুন।',
      });
    }
    if (data.fatherNameEn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fatherNameEn'],
        message: 'পিতার ইংরেজি নাম প্রদান করুন।',
      });
    } else if (!ENGLISH_NAME_REGEX.test(data.fatherNameEn.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fatherNameEn'],
        message: 'পিতার ইংরেজি নামে কেবল ইংরেজি অক্ষর ব্যবহার করুন।',
      });
    }

    if (data.motherNameBn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motherNameBn'],
        message: 'মাতার বাংলা নাম প্রদান করুন।',
      });
    }
    if (data.motherNameEn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motherNameEn'],
        message: 'মাতার ইংরেজি নাম প্রদান করুন।',
      });
    } else if (!ENGLISH_NAME_REGEX.test(data.motherNameEn.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motherNameEn'],
        message: 'মাতার ইংরেজি নামে কেবল ইংরেজি অক্ষর ব্যবহার করুন।',
      });
    }

    const fatherPhone = normalizeDigits(data.fatherPhone.trim());
    const motherPhone = normalizeDigits(data.motherPhone.trim());
    const legalPhone = normalizeDigits(data.legalGuardianPhone.trim());
    const fatherNid = normalizeDigits(data.fatherNid.trim());
    const motherNid = normalizeDigits(data.motherNid.trim());
    const legalNid = normalizeDigits(data.legalGuardianNid.trim());

    if (data.fatherAlive) {
      if (rules.requiresParentNid && !fatherNid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fatherNid'],
          message: 'পিতার এনআইডি নম্বর প্রদান করুন।',
        });
      } else if (fatherNid && !BD_NID_REGEX.test(fatherNid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fatherNid'],
          message: '১০, ১৩ অথবা ১৭ ডিজিটের এনআইডি নম্বর প্রদান করুন।',
        });
      }
      if (fatherPhone && !BD_PHONE_REGEX.test(fatherPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fatherPhone'],
          message: '১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন।',
        });
      }
    } else if (fatherNid && !BD_NID_REGEX.test(fatherNid)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fatherNid'],
        message: '১০, ১৩ অথবা ১৭ ডিজিটের এনআইডি নম্বর প্রদান করুন।',
      });
    }

    if (data.motherAlive) {
      if (rules.requiresParentNid && !motherNid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['motherNid'],
          message: 'মাতার এনআইডি নম্বর প্রদান করুন।',
        });
      } else if (motherNid && !BD_NID_REGEX.test(motherNid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['motherNid'],
          message: '১০, ১৩ অথবা ১৭ ডিজিটের এনআইডি নম্বর প্রদান করুন।',
        });
      }
      if (motherPhone && !BD_PHONE_REGEX.test(motherPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['motherPhone'],
          message: '১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন।',
        });
      }
    } else if (motherNid && !BD_NID_REGEX.test(motherNid)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motherNid'],
        message: '১০, ১৩ অথবা ১৭ ডিজিটের এনআইডি নম্বর প্রদান করুন।',
      });
    }

    const bothParentsDeceased = !data.fatherAlive && !data.motherAlive;
    const needsLegalGuardian =
      bothParentsDeceased ||
      data.hasSeparateGuardian ||
      data.primaryGuardianType === 'LEGAL_GUARDIAN';

    if (needsLegalGuardian) {
      if (data.legalGuardianNameBn.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalGuardianNameBn'],
          message: 'বৈধ অভিভাবকের নাম প্রদান করুন।',
        });
      }
      if (data.legalGuardianRelation.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalGuardianRelation'],
          message: 'শিক্ষার্থীর সাথে সম্পর্ক উল্লেখ করুন।',
        });
      }
      if (!BD_PHONE_REGEX.test(legalPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalGuardianPhone'],
          message: 'অভিভাবকের ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।',
        });
      }
      if (legalNid && !BD_NID_REGEX.test(legalNid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalGuardianNid'],
          message: '১০, ১৩ অথবা ১৭ ডিজিটের এনআইডি নম্বর প্রদান করুন।',
        });
      }
      if (bothParentsDeceased && data.legalGuardianAddress.trim().length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalGuardianAddress'],
          message: 'বৈধ অভিভাবকের ঠিকানা প্রদান করুন।',
        });
      }
    }

    // Primary Contact Guardian validation (administration uses this for urgent contact & SMS)
    if (data.primaryGuardianType === 'FATHER') {
      if (!data.fatherAlive) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['primaryGuardianType'],
          message: 'জীবিত অভিভাবককে প্রাথমিক যোগাযোগকারী হিসেবে নির্বাচন করুন।',
        });
      } else if (!BD_PHONE_REGEX.test(fatherPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fatherPhone'],
          message: 'প্রাথমিক যোগাযোগের জন্য পিতার ১১ ডিজিটের সচল মোবাইল নম্বর প্রদান করুন।',
        });
      }
    } else if (data.primaryGuardianType === 'MOTHER') {
      if (!data.motherAlive) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['primaryGuardianType'],
          message: 'জীবিত অভিভাবককে প্রাথমিক যোগাযোগকারী হিসেবে নির্বাচন করুন।',
        });
      } else if (!BD_PHONE_REGEX.test(motherPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['motherPhone'],
          message: 'প্রাথমিক যোগাযোগের জন্য মাতার ১১ ডিজিটের সচল মোবাইল নম্বর প্রদান করুন।',
        });
      }
    } else if (!BD_PHONE_REGEX.test(legalPhone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['legalGuardianPhone'],
        message: 'প্রাথমিক যোগাযোগের জন্য বৈধ অভিভাবকের ১১ ডিজিটের সচল মোবাইল নম্বর প্রদান করুন।',
      });
    }

    const addrChecks: Array<{ key: keyof typeof data.permanentAddressParts; label: string }> = [
      { key: 'village', label: 'গ্রাম / মহল্লা / বাসা নং' },
      { key: 'postOffice', label: 'ডাকঘর' },
      { key: 'upazila', label: 'উপজেলা / থানা' },
      { key: 'district', label: 'জেলা' },
    ];
    for (const field of addrChecks) {
      if (data.permanentAddressParts[field.key].trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['permanentAddressParts', field.key],
          message: `স্থায়ী ঠিকানার ${field.label} প্রদান করুন।`,
        });
      }
      if (!data.sameAsPermanent && data.presentAddressParts[field.key].trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['presentAddressParts', field.key],
          message: `বর্তমান ঠিকানার ${field.label} প্রদান করুন।`,
        });
      }
    }

    if (data.permanentAddressParts.postCode && !/^\d{4}$/.test(normalizeDigits(data.permanentAddressParts.postCode))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['permanentAddressParts', 'postCode'],
        message: 'পোস্ট কোড ৪ ডিজিটের হতে হবে।',
      });
    }
    if (!data.sameAsPermanent && data.presentAddressParts.postCode && !/^\d{4}$/.test(normalizeDigits(data.presentAddressParts.postCode))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['presentAddressParts', 'postCode'],
        message: 'পোস্ট কোড ৪ ডিজিটের হতে হবে।',
      });
    }

    // --- STEP 4: Declaration (Public) OR Office Placement (Admin) ---
    if (mode === 'public') {
      if (!data.declarationAccepted) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['declarationAccepted'],
          message: 'অঙ্গীকারনামায় সম্মতি প্রদান করুন।',
        });
      }
    } else {
      if (!data.academicYearId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['academicYearId'],
          message: 'শিক্ষাবর্ষ নির্বাচন করুন।',
        });
      }
      if (!data.sectionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sectionId'],
          message: 'শাখা নির্বাচন করুন।',
        });
      }
      const rollNum = Number(normalizeDigits(data.roll));
      if (!data.roll.trim() || !Number.isInteger(rollNum) || rollNum < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['roll'],
          message: 'সঠিক রোল নম্বর প্রদান করুন।',
        });
      }
    }
  });
}

export const ADMISSION_STEP_FIELDS: Record<1 | 2 | 3 | 4, string[]> = {
  1: [
    'targetClassId',
    'admissionType',
    'targetGroupId',
    'optionalClassSubjectId',
    'previousSchoolName',
    'previousSchoolEiin',
    'prevExamPassingYear',
    'prevExamRoll',
    'prevExamGpa',
    'transferCertificateNo',
    'transferCertificateDate',
    'boardRegistrationNo',
    'boardRegistrationSession',
  ],
  2: [
    'photoPreview',
    'studentNameBn',
    'studentNameEn',
    'dateOfBirth',
    'birthCertificateNo',
    'gender',
    'religion',
    'bloodGroup',
    'nationality',
    'studentPhone',
  ],
  3: [
    'fatherAlive',
    'fatherNameBn',
    'fatherNameEn',
    'fatherOccupation',
    'fatherNid',
    'fatherPhone',
    'motherAlive',
    'motherNameBn',
    'motherNameEn',
    'motherOccupation',
    'motherNid',
    'motherPhone',
    'primaryGuardianType',
    'guardianMonthlyIncome',
    'hasSeparateGuardian',
    'legalGuardianNameBn',
    'legalGuardianNameEn',
    'legalGuardianRelation',
    'legalGuardianNid',
    'legalGuardianPhone',
    'legalGuardianAddress',
    'permanentAddressParts',
    'sameAsPermanent',
    'presentAddressParts',
  ],
  4: [
    'declarationAccepted',
    'academicYearId',
    'sectionId',
    'roll',
    'formSerialNo',
    'admissionFeePaid',
    'receiptNo',
  ],
};
