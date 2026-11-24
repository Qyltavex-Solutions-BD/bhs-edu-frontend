import { z } from 'zod';
import { SubjectCategory } from '@/src/types/enums';

export const subjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'ইংরেজি নাম আবশ্যক')
    .max(150, 'ইংরেজি নাম ১৫০ অক্ষরের বেশি হতে পারবে না'),
  nameBn: z
    .string()
    .trim()
    .min(1, 'বাংলা নাম আবশ্যক')
    .max(150, 'বাংলা নাম ১৫০ অক্ষরের বেশি হতে পারবে না'),
  officialCode: z
    .string()
    .trim()
    .max(30, 'বোর্ড কোড ৩০ অক্ষরের বেশি হতে পারবে না'),
  category: z.nativeEnum(SubjectCategory),
  description: z
    .string()
    .trim()
    .max(500, 'বিবরণ ৫০০ অক্ষরের বেশি হতে পারবে না'),
  isActive: z.boolean(),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;

export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'ইংরেজি নাম আবশ্যক')
    .max(100, 'ইংরেজি নাম ১০০ অক্ষরের বেশি হতে পারবে না'),
  nameBn: z
    .string()
    .max(100, 'বাংলা নাম ১০০ অক্ষরের বেশি হতে পারবে না'),
  description: z
    .string()
    .max(500, 'বিবরণ ৫০০ অক্ষরের বেশি হতে পারবে না'),
  isActive: z.boolean(),
});

export type GroupFormValues = z.infer<typeof groupSchema>;

export const yearSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'শিক্ষাবর্ষের নাম আবশ্যক')
      .max(20, 'শিক্ষাবর্ষের নাম সর্বোচ্চ ২০ অক্ষরের হতে পারে'),
    startDate: z.string().min(1, 'শুরুর তারিখ আবশ্যক'),
    endDate: z.string().min(1, 'শেষ তারিখ আবশ্যক'),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.startDate) < new Date(data.endDate);
    },
    {
      message: 'শুরুর তারিখ শেষ তারিখের আগে হতে হবে',
      path: ['endDate'],
    }
  );

export type YearFormValues = z.infer<typeof yearSchema>;

export const classSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'শ্রেণির নাম আবশ্যক')
    .max(50, 'শ্রেণির নাম ৫০ অক্ষরের বেশি হতে পারবে না'),
  nameBn: z
    .string()
    .max(50, 'বাংলা নাম ৫০ অক্ষরের বেশি হতে পারবে না'),
  numericValue: z
    .string()
    .trim()
    .min(1, 'শ্রেণি নম্বর আবশ্যক')
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1 && num <= 12;
    }, 'শ্রেণি নম্বর ১ থেকে ১২ এর মধ্যে হতে হবে'),
  sectionNames: z.string(),
  isActive: z.boolean(),
});

export type ClassFormValues = z.infer<typeof classSchema>;

export const sectionSchema = z.object({
  classId: z.string().min(1, 'শ্রেণি নির্বাচন করুন'),
  name: z
    .string()
    .trim()
    .min(1, 'শাখার নাম আবশ্যক')
    .max(50, 'শাখার নাম ৫০ অক্ষরের বেশি হতে পারবে না'),
  isActive: z.boolean(),
});

export type SectionFormValues = z.infer<typeof sectionSchema>;

export const assignClassSubjectSchema = z.object({
  classId: z.string().min(1, 'শ্রেণি নির্বাচন করুন'),
  subjectId: z.string().min(1, 'বিষয় নির্বাচন করুন'),
  groupId: z.string(),
  isOptional: z.boolean(),
});

export type AssignClassSubjectFormValues = z.infer<typeof assignClassSubjectSchema>;

export const rolloverClassSubjectSchema = z.object({
  fromAcademicYearId: z.string().min(1, 'কপি করার উৎস শিক্ষাবর্ষ নির্বাচন করুন'),
});

export type RolloverClassSubjectFormValues = z.infer<typeof rolloverClassSubjectSchema>;

