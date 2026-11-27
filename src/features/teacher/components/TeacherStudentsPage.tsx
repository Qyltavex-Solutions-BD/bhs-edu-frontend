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

export function TeacherStudentsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;

  const mySectionIds = Array.from(
    new Set(db.teacherAssignments.filter((a) => a.staffId === teacher.id).map((a) => a.sectionId))
  );
  const mySections = db.sections.filter((s) => mySectionIds.includes(s.id));

  const rows = db.enrollments
    .filter((e) => mySectionIds.includes(e.sectionId))
    .filter((e) => sectionFilter === 'ALL' || e.sectionId === sectionFilter)
    .map((e) => {
      const stu = db.students.find((s) => s.id === e.studentId)!;
      const cls = db.classes.find((c) => c.id === e.classId);
      const sec = db.sections.find((s) => s.id === e.sectionId);
      const pl = db.parentStudents.find((l) => l.studentId === e.studentId && l.isPrimary);
      const parent = db.parents.find((p) => p.id === pl?.parentId);
      return { enr: e, stu, cls, sec, parent };
    })
    .filter(
      (r) =>
        !search.trim() ||
        r.stu.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        (r.stu.nameBn ?? '').includes(search) ||
        r.stu.studentId.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আমার নির্ধারিত শিক্ষার্থী'}
        description={'শুধুমাত্র আপনার পাঠদানকৃত শাখাসমূহের শিক্ষার্থী'}
      />
      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={'নাম বা শিক্ষার্থী আইডি দিয়ে খুঁজুন...'}
          className="sm:max-w-xs"
        />
        <Select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="sm:max-w-xs"
        >
          <option value="ALL">{'সকল নির্ধারিত শাখা'}</option>
          {mySections.map((s) => {
            const cls = db.classes.find((c) => c.id === s.classId);
            return (
              <option key={s.id} value={s.id}>
                {cls?.nameBn || cls?.name} ({s.name})
              </option>
            );
          })}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">{'আইডি ও রোল'}</th>
                <th className="px-4 py-3 text-left">{'শিক্ষার্থীর নাম'}</th>
                <th className="px-4 py-3 text-left">{'শ্রেণি ও শাখা'}</th>
                <th className="px-4 py-3 text-left">{'অভিভাবক'}</th>
                <th className="px-4 py-3 text-left">{'অবস্থা'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {rows.map(({ enr, stu, cls, sec, parent }) => (
                <tr key={enr.id}>
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm">{stu.studentId}</p>
                    <p className="text-sm text-muted-foreground">
                      {'রোল:'} {formatNumber(enr.roll, 'bn')}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {stu.nameBn || stu.nameEn}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {cls?.nameBn || cls?.name} ({sec?.name})
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p>{parent?.name ?? '—'}</p>
                    <p className="text-sm text-muted-foreground">{parent?.phone ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge enumName="StudentStatus" value={stu.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

