import { NoticeStatus, EventCategoryType } from '../enums';

export type NoticeAttachmentType = 'PDF' | 'IMAGE' | 'OFFICIAL_PAD';

export interface Notice {
  id: string;
  memoNo?: string | null;
  title: string;
  description: string;
  attachment?: string | null;
  attachmentType?: NoticeAttachmentType | null;
  attachmentUrl?: string | null;
  attachmentSize?: string | null;
  publishedAt?: string | null;
  status: NoticeStatus;
  createdBy: string;
  isUrgent?: boolean;
  audience?: 'ALL' | 'PARENTS' | 'TEACHERS' | 'STUDENTS';
  createdAt: string;
  updatedAt: string;
}

export interface News {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  publishedAt?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventCategory {
  id: string;
  name: string;
  type: EventCategoryType;
  description?: string | null;
}

export interface Event {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  image?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Career {
  id: string;
  title: string;
  description: string;
  circularFile?: string | null;
  deadline: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
