import { z } from 'zod';
import { NoticeStatus } from '@/src/types/enums';

export const noticeSchema = z.object({
  title: z.string().min(3, 'নোটিশের শিরোনাম আবশ্যক'),
  description: z.string().min(10, 'বিস্তারিত বিবরণ লিখুন'),
  status: z.nativeEnum(NoticeStatus),
  isUrgent: z.boolean().optional(),
  audience: z.enum(['ALL', 'PARENTS', 'TEACHERS', 'STUDENTS']).optional(),
});

export type NoticeFormValues = z.infer<typeof noticeSchema>;
