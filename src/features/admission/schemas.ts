import { z } from 'zod';
import { Gender, Religion } from '@/src/types/enums';
import { bdPhoneRegex } from '@/src/lib/validations/regex';

export const admissionApplicationSchema = z.object({
  studentNameBn: z.string().min(2, 'শিক্ষার্থীর বাংলা নাম আবশ্যক'),
  studentNameEn: z.string().min(2, 'শিক্ষার্থীর ইংরেজি নাম আবশ্যক'),
  fatherNameBn: z.string().min(2, 'পিতার বাংলা নাম আবশ্যক'),
  fatherNameEn: z.string().min(2, 'পিতার ইংরেজি নাম আবশ্যক'),
  fatherOccupation: z.string().min(2, 'পিতার পেশা আবশ্যক'),
  fatherNid: z.string().min(10, 'সঠিক এনআইডি নম্বর দিন (১০-১৭ ডিজিট)').max(17),
  motherNameBn: z.string().min(2, 'মাতার বাংলা নাম আবশ্যক'),
  motherNameEn: z.string().min(2, 'মাতার ইংরেজি নাম আবশ্যক'),
  motherOccupation: z.string().min(2, 'মাতার পেশা আবশ্যক'),
  motherNid: z.string().min(10, 'সঠিক এনআইডি নম্বর দিন (১০-১৭ ডিজিট)').max(17),
  guardianPhone: z
    .string()
    .regex(bdPhoneRegex, 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'),
  presentAddress: z.string().min(5, 'বর্তমান ঠিকানা আবশ্যক'),
  permanentAddress: z.string().min(5, 'স্থায়ী ঠিকানা আবশ্যক'),
  dateOfBirth: z.string().min(4, 'জন্ম তারিখ আবশ্যক'),
  gender: z.nativeEnum(Gender),
  birthCertificateNo: z
    .string()
    .regex(/^\d{17}$/, '১৭ ডিজিটের ডিজিটাল জন্ম সনদ নম্বর দিন'),
  religion: z.nativeEnum(Religion),
  prevExamName: z.string().optional(),
  prevExamPassingYear: z.coerce.number().int().min(2015).max(2026).optional(),
  prevExamRoll: z.string().optional(),
  prevExamRegistration: z.string().optional(),
  prevExamGpa: z.coerce.number().min(0).max(5).optional(),
  previousSchoolName: z.string().optional(),
  previousSchoolAddress: z.string().optional(),
  previousClass: z.string().optional(),
  previousGrade: z.string().optional(),
  isReadmission: z.boolean(),
  targetClassId: z.string().min(1, 'ভর্তিচ্ছু শ্রেণি নির্বাচন করুন'),
  preferredSection: z.string().optional(),
  targetGroupId: z.string().optional().nullable(),
  optionalSubjectName: z.string().optional().nullable(),
  declarationAccepted: z.boolean().refine((v) => v === true, {
    message: 'অঙ্গীকারনামায় সম্মতি প্রদান আবশ্যক',
  }),
});

export type AdmissionApplicationFormValues = z.infer<typeof admissionApplicationSchema>;
