'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  Lock,
  MonitorPlay,
  Printer,
  Save,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { toast } from 'sonner';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import {
  useGetBootstrapQuery,
  useMarkNotificationReadMutation,
  useSaveAttendanceBatchMutation,
  useSaveMarksBatchMutation,
} from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableMarksheet } from '@/src/components/print/PrintDocuments';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import {
  formatDateLong,
  formatDateShort,
  formatNumber,
  formatTime12h,
  evaluateExamSubjectMark,
} from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';
import { triggerPrint } from '@/src/lib/utils/cn';
import {
  AttendanceMethod,
  AttendanceStatus,
  ResultPublicationStatus,
  WeekDay,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';

const DAYS_ORDER: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
];

function useCurrentTeacher(db: MockDatabase | undefined) {
  const auth = useAppSelector((s) => s.auth);
  return useMemo(() => {
    if (!db) return null;
    const byId = auth.user?.staffId ? db.staff.find((s) => s.id === auth.user?.staffId) : null;
    return byId ?? db.staff.find((s) => s.id === 'staff-3') ?? db.staff[0] ?? null;
  }, [db, auth.user?.staffId]);
}

function getAssignmentSubject(db: MockDatabase, classSubjectId: string) {
  const cs = db.classSubjects.find((x) => x.id === classSubjectId);
  return cs ? db.subjects.find((s) => s.id === cs.subjectId) : undefined;
}

export function TeacherProfilePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  if (isLoading || !db || !teacher) return <LoadingSkeleton />;
  const dept = db.departments.find((d) => d.id === teacher.departmentId);
  const myAssignments = db.teacherAssignments.filter((a) => a.staffId === teacher.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আমার প্রোফাইল'}
        description={'শিক্ষক পরিচিতি ও নির্ধারিত বিষয়ের বিবরণ'}
      />
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-sm text-muted-foreground">{'পূর্ণ নাম'}</p>
            <p className="font-semibold mt-0.5">{teacher.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'পদবি ও বিভাগ'}</p>
            <p className="font-medium mt-0.5">
              {teacher.designation} · {dept?.name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'কর্মচারী আইডি'}</p>
            <p className="font-mono mt-0.5">{teacher.employeeId ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'যোগদানের তারিখ'}</p>
            <p className="tabular-nums mt-0.5">{formatDateLong(teacher.joiningDate, 'bn')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'শিক্ষাগত যোগ্যতা'}</p>
            <p className="mt-0.5">{teacher.qualification ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'যোগাযোগ'}</p>
            <p className="tabular-nums mt-0.5">
              {teacher.phone ?? '—'} · {teacher.email ?? '—'}
            </p>
          </div>
        </div>
      </Card>

      <CommonProfilePanel
        roleLabel={`${teacher.designation} · ${dept?.name ?? ''}`}
        extraMeta={`ID: ${teacher.employeeId ?? '—'}`}
      />

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">
          {'নির্ধারিত বিষয় ও নম্বর এন্ট্রি অনুমতি'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="py-2 pr-4">{'শ্রেণি ও শাখা'}</th>
                <th className="py-2 pr-4">{'বিষয়'}</th>
                <th className="py-2">{'নম্বর এন্ট্রি অনুমতি'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myAssignments.map((a) => {
                const cls = db.classes.find((c) => c.id === a.classId);
                const sec = db.sections.find((s) => s.id === a.sectionId);
                const sub = getAssignmentSubject(db, a.classSubjectId);
                return (
                  <tr key={a.id}>
                    <td className="py-2.5 pr-4 font-medium">
                      {cls?.nameBn || cls?.name} ({sec?.name})
                    </td>
                    <td className="py-2.5 pr-4">{sub?.nameBn || sub?.name}</td>
                    <td className="py-2.5">
                      {a.canEnterMarks ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {'অনুমোদিত'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
                          <Lock className="w-3.5 h-3.5" />
                          {'শুধুমাত্র পাঠদান (নম্বর এন্ট্রি সীমিত)'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

