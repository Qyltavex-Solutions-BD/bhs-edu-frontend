import { z } from 'zod';
import {
  ExamType,
  Gender,
  NoticeStatus,
  Religion,
  StaffType,
  EmploymentType,
} from '@/src/types/enums';

export const bdPhoneRegex = /^(\+?88)?01[3-9]\d{8}$/;

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'ইমেইল অথবা মোবাইল নম্বর দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

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

export const studentRegistrationSchema = z.object({
  nameEn: z.string().min(2, 'ইংরেজি নাম আবশ্যক'),
  nameBn: z.string().min(2, 'বাংলা নাম আবশ্যক'),
  dateOfBirth: z.string().min(4, 'জন্ম তারিখ আবশ্যক'),
  gender: z.nativeEnum(Gender),
  bloodGroup: z.string().optional(),
  religion: z.nativeEnum(Religion),
  birthCertificateNo: z.string().min(10, 'জন্ম সনদ নম্বর আবশ্যক'),
  boardRegistrationNo: z.string().optional(),
  presentAddress: z.string().min(4, 'বর্তমান ঠিকানা আবশ্যক'),
  permanentAddress: z.string().min(4, 'স্থায়ী ঠিকানা আবশ্যক'),
  parentName: z.string().min(2, 'অভিভাবকের নাম আবশ্যক'),
  parentNameBn: z.string().optional(),
  parentPhone: z.string().regex(bdPhoneRegex, 'সঠিক মোবাইল নম্বর দিন'),
  parentOccupation: z.string().optional(),
  parentNid: z.string().optional(),
  admissionDate: z.string().min(4),
  previousSchoolName: z.string().optional(),
  previousGpa: z.coerce.number().min(0).max(5).optional(),
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  groupId: z.string().optional().nullable(),
  roll: z.coerce.number().int().min(1),
  isReadmission: z.boolean().default(false),
});

export const staffSchema = z.object({
  employeeId: z.string().min(2, 'স্টাফ আইডি আবশ্যক'),
  name: z.string().min(2, 'নাম আবশ্যক'),
  designation: z.string().min(2, 'পদবি আবশ্যক'),
  qualification: z.string().optional(),
  staffType: z.nativeEnum(StaffType),
  departmentId: z.string().optional(),
  employmentType: z.nativeEnum(EmploymentType),
  phone: z.string().regex(bdPhoneRegex, 'সঠিক মোবাইল নম্বর দিন'),
  email: z.string().email('সঠিক ইমেইল দিন').optional().or(z.literal('')),
  joiningDate: z.string().min(4, 'যোগদানের তারিখ আবশ্যক'),
});

export const examCreateSchema = z.object({
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
  gradingScaleId: z.string().min(1),
  name: z.string().min(3, 'পরীক্ষার নাম আবশ্যক'),
  examType: z.nativeEnum(ExamType),
  startDate: z.string().min(4),
  endDate: z.string().min(4),
  marksEntryDeadline: z.string().optional(),
  allowCombinedPass: z.boolean().default(true),
});

export const noticeSchema = z.object({
  title: z.string().min(3, 'নোটিশের শিরোনাম আবশ্যক'),
  description: z.string().min(10, 'বিস্তারিত বিবরণ লিখুন'),
  status: z.nativeEnum(NoticeStatus),
  isUrgent: z.boolean().optional(),
  audience: z.enum(['ALL', 'PARENTS', 'TEACHERS', 'STUDENTS']).optional(),
});

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

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, 'বর্তমান পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
    newPassword: z
      .string()
      .min(8, 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি',
    path: ['confirmPassword'],
  });

