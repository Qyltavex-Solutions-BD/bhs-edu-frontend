'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Bold,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GripVertical,
  Heading2,
  Image as ImageIcon,
  Italic,
  List,
  Pencil,
  Plus,
  Printer,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  useCreateNoticeMutation,
  useDeleteCmsItemMutation,
  useGetBootstrapQuery,
  useReorderCmsItemsMutation,
  useToggleCmsItemMutation,
  useUpdateAdmissionContentMutation,
  useUpsertCmsItemMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import {
  NoticeDocumentModal,
  NoticeFormatBadge,
} from '@/src/components/shared/NoticeDocumentViewer';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  SegmentedTabs,
  Select,
  Switch,
  Textarea,
} from '@/src/components/ui/primitives';
import { LibraryDistributionType, NoticeStatus, ResourceType } from '@/src/types/enums';
import type { Notice, NoticeAttachmentType } from '@/src/types/entities';

// 7.11 Library
export function AdminReportsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  const reportCards = [
    { titleBn: 'শিক্ষার্থী পরিসংখ্যান ও তালিকা', titleEn: 'Student Enrollment Report', rows: db.students, file: 'students-report.csv' },
    { titleBn: 'হাজিরা সারসংক্ষেপ রিপোর্ট', titleEn: 'Attendance Summary Report', rows: db.attendances.slice(0, 60), file: 'attendance-report.csv' },
    { titleBn: 'পরীক্ষা ও ফলাফল সারসংক্ষেপ', titleEn: 'Examination Results Summary', rows: db.resultSummaries, file: 'results-report.csv' },
    { titleBn: 'শিক্ষক ও কর্মচারী ডিরেক্টরি', titleEn: 'Staff & Faculty Report', rows: db.staff, file: 'staff-report.csv' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('রিপোর্ট ও বিশ্লেষণ কেন্দ্র', 'Reports & Analytics Center')}
        actions={
          <Button variant="outline" size="sm" onClick={triggerPrint}>
            <Printer className="w-4 h-4" /> {pick('প্রিন্ট রিপোর্ট', 'Print View')}
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportCards.map((r) => (
          <Card key={r.file} className="p-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">{pick(r.titleBn, r.titleEn)}</h3>
              <p className="text-sm text-muted-foreground tabular-nums mt-1">
                {r.rows.length} {pick('টি রেকর্ড প্রস্তুত', 'records ready')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCsv(r.rows as unknown as Record<string, unknown>[], r.file)}
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 7.16 Settings & Profile

