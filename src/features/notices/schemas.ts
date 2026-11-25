import { z } from 'zod';
import { NoticeAudience, NoticeStatus } from '@/src/types/enums';

export const noticeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  memoNo: z.string().trim().max(100).optional(),
  status: z.nativeEnum(NoticeStatus),
  isUrgent: z.boolean().optional(),
  audiences: z.array(z.nativeEnum(NoticeAudience)).min(1).optional(),
});

export type NoticeFormValues = z.infer<typeof noticeSchema>;
