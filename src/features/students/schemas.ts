import { z } from 'zod';
import { Gender, Religion } from '@/src/types/enums';
import { bdPhoneRegex } from '@/src/lib/validations/regex';

export const studentRegistrationSchema = z.object({
  nameEn: z.string().min(2, 'ইংরেজি নাম আবশ্যক'),
  nameBn: z.string().min(2, 'বাংলা নাম আবশ্যক'),
  dateOfBirth: z.string().min(4, 'জন্ম তারিখ আবশ্যক'),
  gender: z.nativeEnum(Gender),
  bloodGroup: z.string().optional(),
  religion: z.nativeEnum(Religion),
  birthCertificateNo: z.string().regex(/^\d{17}$/, '১৭ ডিজিটের জন্ম সনদ নম্বর দিন'),
  boardRegistrationNo: z.string().optional(),
  presentAddress: z.string().min(5, 'বর্তমান ঠিকানা আবশ্যক'),
  permanentAddress: z.string().min(5, 'স্থায়ী ঠিকানা আবশ্যক'),
  fatherNameEn: z.string().min(2, 'পিতার ইংরেজি নাম আবশ্যক'),
  fatherNameBn: z.string().min(2, 'পিতার বাংলা নাম আবশ্যক'),
  fatherOccupation: z.string().optional(),
  fatherNid: z.string().optional(),
  guardianPhone: z.string().regex(bdPhoneRegex, 'সঠিক মোবাইল নম্বর দিন'),
  motherNameEn: z.string().min(2, 'মাতার ইংরেজি নাম আবশ্যক'),
  motherNameBn: z.string().min(2, 'মাতার বাংলা নাম আবশ্যক'),
  motherOccupation: z.string().optional(),
  motherNid: z.string().optional(),
  motherPhone: z.string().optional(),
  previousSchoolName: z.string().optional(),
  previousSchoolAddress: z.string().optional(),
  previousGrade: z.string().optional(),
  prevExamPassingYear: z.coerce.number().int().optional(),
  prevExamRoll: z.string().optional(),
  prevExamRegistration: z.string().optional(),
  prevExamGpa: z.coerce.number().min(0).max(5).optional(),
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  groupId: z.string().optional().nullable(),
  roll: z.coerce.number().int().min(1),
  isReadmission: z.boolean().default(false),
});

export type StudentRegistrationFormValues = z.infer<typeof studentRegistrationSchema>;

export const transferCertificateSchema = z.object({
  studentId: z.string().min(1, 'শিক্ষার্থী নির্বাচন করুন'),
  tcNumber: z.string().min(3, 'টিসি নম্বর আবশ্যক'),
  issueDate: z.string().min(4),
  leavingDate: z.string().min(4),
  reason: z.string().min(3, 'বিদ্যালয় ত্যাগের কারণ উল্লেখ করুন'),
  duesCleared: z.boolean(),
  conductRemarks: z.string().min(2),
  leavingClass: z.string().min(1),
  promotedToNextClass: z.boolean(),
  destinationSchool: z.string().optional(),
});

export type TransferCertificateFormValues = z.infer<typeof transferCertificateSchema>;
