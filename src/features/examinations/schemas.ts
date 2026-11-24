import { z } from 'zod';
import { ExamType } from '@/src/types/enums';

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

export type ExamCreateFormValues = z.infer<typeof examCreateSchema>;
