import { z } from 'zod';
import { ExamStatus, ExamType, ResultPublicationStatus } from '@/src/types/enums';

export const examCreateSchema = z
  .object({
    academicYearId: z.string().min(1, 'শিক্ষাবর্ষ নির্বাচন করুন'),
    classId: z.string().min(1, 'শ্রেণি নির্বাচন করুন'),
    gradingScaleId: z.string().min(1, 'গ্রেডিং স্কেল নির্বাচন করুন'),
    name: z
      .string()
      .min(2, 'পরীক্ষার নাম কমপক্ষে ২ অক্ষরের হতে হবে')
      .max(150, 'পরীক্ষার নাম সর্বোচ্চ ১৫০ অক্ষরের হতে পারে'),
    examType: z.nativeEnum(ExamType),
    startDate: z
      .string()
      .min(10, 'শুরুর তারিখ দিন')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'সঠিক তারিখ দিন (YYYY-MM-DD)'),
    endDate: z
      .string()
      .min(10, 'শেষের তারিখ দিন')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'সঠিক তারিখ দিন (YYYY-MM-DD)'),
    marksEntryDeadline: z.string().optional().nullable(),
    status: z.nativeEnum(ExamStatus).optional(),
    allowCombinedPass: z.boolean().default(true),
    weightagePercentage: z
      .number()
      .min(0, 'ওয়েটেজ ০ এর কম হতে পারে না')
      .max(100, 'ওয়েটেজ ১০০ এর বেশি হতে পারে না')
      .optional()
      .nullable(),
    autoAttachSubjects: z.boolean().default(true),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'পরীক্ষার শেষের তারিখ শুরুর তারিখের আগে হতে পারে না',
    path: ['endDate'],
  });

export const examUpdateSchema = z
  .object({
    name: z
      .string()
      .min(2, 'পরীক্ষার নাম কমপক্ষে ২ অক্ষরের হতে হবে')
      .max(150, 'পরীক্ষার নাম সর্বোচ্চ ১৫০ অক্ষরের হতে পারে')
      .optional(),
    examType: z.nativeEnum(ExamType).optional(),
    gradingScaleId: z.string().min(1).optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'সঠিক তারিখ দিন (YYYY-MM-DD)')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'সঠিক তারিখ দিন (YYYY-MM-DD)')
      .optional(),
    status: z.nativeEnum(ExamStatus).optional(),
    marksEntryDeadline: z.string().optional().nullable(),
    allowCombinedPass: z.boolean().optional(),
    weightagePercentage: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .nullable(),
    isLocked: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'পরীক্ষার শেষের তারিখ শুরুর তারিখের আগে হতে পারে না',
      path: ['endDate'],
    }
  );

export const examQuerySchema = z.object({
  academicYearId: z.string().optional(),
  classId: z.string().optional(),
  status: z.nativeEnum(ExamStatus).optional(),
  examType: z.nativeEnum(ExamType).optional(),
  resultStatus: z.nativeEnum(ResultPublicationStatus).optional(),
  search: z.string().optional(),
  isDeleted: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ExamCreateFormValues = z.infer<typeof examCreateSchema>;
export type ExamUpdateFormValues = z.infer<typeof examUpdateSchema>;
export type ExamQueryParams = z.infer<typeof examQuerySchema>;

