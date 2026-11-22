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
 * Mode-specific & class-specific real-world validations are enforced cleanly in buildUnifiedAdmissionSchema().
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
    // 0. Core Class Selection Check (Step 1)
    if (!data.targetClassId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetClassId'],
        message: 'ভর্তিচ্ছু শ্রেণি নির্বাচন করুন',
      });
    }

    const selectedClass = classes.find((c) => c.id === data.targetClassId);
    const numericClass = selectedClass?.numericValue ?? 6;
    const rules = getClassAdmissionRules(numericClass);

    // 1. Class-specific Admission Type & Group / 4th Subject validation
    if (!rules.allowedAdmissionTypes.includes(data.admissionType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['admissionType'],
        message: '১০ম শ্রেণিতে সরাসরি নতুন ভর্তি প্রযোজ্য নয়—বদলি (e-TC) বা পুনঃভর্তি নির্বাচন করুন',
      });
    }

    if (rules.requiresGroup && !data.targetGroupId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetGroupId'],
        message: '৯ম–১০ম শ্রেণির জন্য বিভাগ (বিজ্ঞান / মানবিক / ব্যবসায় শিক্ষা) নির্বাচন আবশ্যক',
      });
    }

    if (rules.requiresOptionalSubject && data.targetGroupId && !data.optionalClassSubjectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['optionalClassSubjectId'],
        message: '৪র্থ (ঐচ্ছিক) বিষয় নির্বাচন আবশ্যক',
      });
    }

    // 2. Previous school, TC & Board Registration validation
    if (data.admissionType !== 'READMISSION' && data.previousSchoolName.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['previousSchoolName'],
        message: `${rules.previousSchoolLabelBn} লিখুন`,
      });
    }

    if (data.admissionType === 'TRANSFER' && numericClass >= 7 && data.transferCertificateNo.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transferCertificateNo'],
        message:
          numericClass === 10
            ? 'শিক্ষা বোর্ডের e-TC / ছাড়পত্র নম্বর আবশ্যক'
            : 'পূর্ববর্তী বিদ্যালয়ের ছাড়পত্র (TC) নম্বর আবশ্যক',
      });
    }

    if (rules.requiresBoardRegistration) {
      const reg = normalizeDigits(data.boardRegistrationNo.trim());
      if (!BOARD_REG_REGEX.test(reg)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['boardRegistrationNo'],
          message: '১০ম শ্রেণির জন্য ৯ম শ্রেণির সঠিক বোর্ড রেজিস্ট্রেশন নম্বর (৮–১৪ ডিজিট) আবশ্যক',
        });
      }
    } else if (data.boardRegistrationNo.trim()) {
      const reg = normalizeDigits(data.boardRegistrationNo.trim());
      if (!BOARD_REG_REGEX.test(reg)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['boardRegistrationNo'],
          message: 'বোর্ড রেজিস্ট্রেশন নম্বর ৮–১৪ ডিজিটের হতে হবে',
        });
      }
    }

    if (data.prevExamGpa.trim()) {
      const gpa = Number(normalizeDigits(data.prevExamGpa));
      if (Number.isNaN(gpa) || gpa < 0 || gpa > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['prevExamGpa'],
          message: 'জিপিএ ০.০০ থেকে ৫.০০ এর মধ্যে হতে হবে',
        });
      }
    }

    // 3. Student Identity, BDRIS Birth Certificate Year Cross-Check & Age Guardrail (Step 2)
    if (data.studentNameBn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['studentNameBn'],
        message: 'শিক্ষার্থীর বাংলা নাম আবশ্যক',
      });
    }

    if (data.studentNameEn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['studentNameEn'],
        message: 'শিক্ষার্থীর ইংরেজি নাম আবশ্যক',
      });
    } else if (!ENGLISH_NAME_REGEX.test(data.studentNameEn.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['studentNameEn'],
        message: 'ইংরেজি নামে শুধুমাত্র ইংরেজি অক্ষর ব্যবহার করুন',
      });
    }

    if (data.dateOfBirth.trim().length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateOfBirth'],
        message: 'সঠিক জন্ম তারিখ নির্বাচন করুন',
      });
    }

    if (!BD_BIRTH_CERT_REGEX.test(data.birthCertificateNo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['birthCertificateNo'],
        message: '১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন নম্বর দিন',
      });
    } else if (data.dateOfBirth) {
      const dobYear = data.dateOfBirth.slice(0, 4);
      const certYear = data.birthCertificateNo.slice(0, 4);
      if (dobYear !== certYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthCertificateNo'],
          message: `অনলাইন জন্ম নিবন্ধনের প্রথম ৪ ডিজিট (${certYear}) জন্মসালের (${dobYear}) সাথে মিলছে না`,
        });
      }
    }

    const age = calculateAgeYears(data.dateOfBirth);
    if (age !== null && (age < rules.minAge || age > rules.maxAge)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateOfBirth'],
        message: `${selectedClass?.nameBn || `Class ${numericClass}`}-এর জন্য বয়স সাধারণত ${rules.minAge} থেকে ${rules.maxAge} বছরের মধ্যে হতে হয়`,
      });
    }

    if (data.nationality.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nationality'],
        message: 'জাতীয়তা আবশ্যক',
      });
    }

    if (data.studentPhone.trim()) {
      const phone = normalizeDigits(data.studentPhone.trim());
      if (!BD_PHONE_REGEX.test(phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['studentPhone'],
          message: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)',
        });
      }
    }

    if (mode === 'public' && !data.photoPreview) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['photoPreview'],
        message: 'প্রবেশপত্র ও আইডি কার্ডের জন্য শিক্ষার্থীর পাসপোর্ট ছবি আপলোড আবশ্যক',
      });
    }

    // 4. Father & Mother Alive/Deceased + Legal Guardian Real-World Validation (Step 3)
    if (data.fatherNameBn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fatherNameBn'],
        message: 'পিতার বাংলা নাম আবশ্যক',
      });
    }
    if (data.fatherNameEn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fatherNameEn'],
        message: 'পিতার ইংরেজি নাম আবশ্যক',
      });
    } else if (!ENGLISH_NAME_REGEX.test(data.fatherNameEn.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fatherNameEn'],
        message: 'পিতার ইংরেজি নামে শুধুমাত্র ইংরেজি অক্ষর দিন',
      });
    }

    if (data.motherNameBn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motherNameBn'],
        message: 'মাতার বাংলা নাম আবশ্যক',
      });
    }
    if (data.motherNameEn.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motherNameEn'],
        message: 'মাতার ইংরেজি নাম আবশ্যক',
      });
    } else if (!ENGLISH_NAME_REGEX.test(data.motherNameEn.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motherNameEn'],
        message: 'মাতার ইংরেজি নামে শুধুমাত্র ইংরেজি অক্ষর দিন',
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
          message: 'বোর্ড রেজিস্ট্রেশনের জন্য পিতার এনআইডি নম্বর আবশ্যক',
        });
      } else if (fatherNid && !BD_NID_REGEX.test(fatherNid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fatherNid'],
          message: 'সঠিক এনআইডি নম্বর দিন (১০, ১৩ অথবা ১৭ ডিজিট)',
        });
      }
      if (fatherPhone && !BD_PHONE_REGEX.test(fatherPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fatherPhone'],
          message: 'পিতার ১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)',
        });
      }
    }

    if (data.motherAlive) {
      if (rules.requiresParentNid && !motherNid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['motherNid'],
          message: 'বোর্ড রেজিস্ট্রেশনের জন্য মাতার এনআইডি নম্বর আবশ্যক',
        });
      } else if (motherNid && !BD_NID_REGEX.test(motherNid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['motherNid'],
          message: 'সঠিক এনআইডি নম্বর দিন (১০, ১৩ অথবা ১৭ ডিজিট)',
        });
      }
      if (motherPhone && !BD_PHONE_REGEX.test(motherPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['motherPhone'],
          message: 'মাতার ১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)',
        });
      }
    }

    const bothParentsDeceased = !data.fatherAlive && !data.motherAlive;
    const needsLegalGuardian = bothParentsDeceased || data.hasSeparateGuardian;

    if (needsLegalGuardian) {
      if (data.legalGuardianNameBn.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalGuardianNameBn'],
          message: 'বৈধ অভিভাবকের বাংলা নাম আবশ্যক',
        });
      }
      if (data.legalGuardianRelation.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalGuardianRelation'],
          message: 'শিক্ষার্থীর সাথে অভিভাবকের সম্পর্ক লিখুন (যেমন: চাচা / মামা / বড় ভাই)',
        });
      }
      if (!BD_PHONE_REGEX.test(legalPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalGuardianPhone'],
          message: 'বৈধ অভিভাবকের সচল ১১ ডিজিটের মোবাইল নম্বর আবশ্যক',
        });
      }
      if (legalNid && !BD_NID_REGEX.test(legalNid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalGuardianNid'],
          message: 'সঠিক এনআইডি নম্বর দিন (১০, ১৩ অথবা ১৭ ডিজিট)',
        });
      }
      if (bothParentsDeceased && data.legalGuardianAddress.trim().length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legalGuardianAddress'],
          message: 'বৈধ অভিভাবকের ঠিকানা আবশ্যক',
        });
      }
    }

    // At least one active guardian contact mobile is required for school SMS & notices
    const hasValidContact =
      (data.fatherAlive && BD_PHONE_REGEX.test(fatherPhone)) ||
      (data.motherAlive && BD_PHONE_REGEX.test(motherPhone)) ||
      (needsLegalGuardian && BD_PHONE_REGEX.test(legalPhone));

    if (!hasValidContact) {
      const targetPath = data.fatherAlive
        ? ['fatherPhone']
        : data.motherAlive
          ? ['motherPhone']
          : ['legalGuardianPhone'];
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: targetPath,
        message: 'অভিভাবকের অন্তত একটি সচল বাংলাদেশি মোবাইল নম্বর (01XXXXXXXXX) আবশ্যক',
      });
    }

    // 5. Structured Address validation
    const addrChecks: Array<{ key: keyof typeof data.permanentAddressParts; label: string }> = [
      { key: 'village', label: 'গ্রাম / বাসা ও রোড' },
      { key: 'postOffice', label: 'ডাকঘর' },
      { key: 'upazila', label: 'উপজেলা / থানা' },
      { key: 'district', label: 'জেলা' },
    ];
    for (const field of addrChecks) {
      if (data.permanentAddressParts[field.key].trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['permanentAddressParts', field.key],
          message: `স্থায়ী ঠিকানার ${field.label} আবশ্যক`,
        });
      }
      if (!data.sameAsPermanent && data.presentAddressParts[field.key].trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['presentAddressParts', field.key],
          message: `বর্তমান ঠিকানার ${field.label} আবশ্যক`,
        });
      }
    }

    // 6. Mode-specific Final Step Validation
    if (mode === 'public') {
      if (!data.declarationAccepted) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['declarationAccepted'],
          message: 'অঙ্গীকারনামায় সম্মতি প্রদান আবশ্যক',
        });
      }
    } else {
      if (!data.academicYearId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['academicYearId'],
          message: 'শিক্ষাবর্ষ নির্বাচন করুন',
        });
      }
      if (!data.sectionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sectionId'],
          message: 'ভর্তির শাখা নির্বাচন করুন',
        });
      }
      const rollNum = Number(normalizeDigits(data.roll));
      if (!data.roll.trim() || !Number.isInteger(rollNum) || rollNum < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['roll'],
          message: 'সঠিক রোল নম্বর (১ বা তার বেশি) দিন',
        });
      }
    }
  });
}

/**
 * Field names validated per step before advancing.
 */
export const ADMISSION_STEP_FIELDS: Record<1 | 2 | 3 | 4, string[]> = {
  1: [
    'targetClassId',
    'admissionType',
    'targetGroupId',
    'optionalClassSubjectId',
    'previousSchoolName',
    'previousSchoolEiin',
    'previousClass',
    'previousGrade',
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
