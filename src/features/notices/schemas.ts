import { z } from 'zod';
import { NoticeStatus } from '@/src/types/enums';

export const noticeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  memoNo: z.string().trim().max(100).optional(),
  status: z.nativeEnum(NoticeStatus),
  isUrgent: z.boolean().optional(),
});

export type NoticeFormValues = z.infer<typeof noticeSchema>;
