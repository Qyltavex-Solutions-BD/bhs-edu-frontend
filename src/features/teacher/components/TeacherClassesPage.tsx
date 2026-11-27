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

export function TeacherClassesPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const teacher = useCurrentTeacher(db);
  if (isLoading || !db || !teacher) return <LoadingSkeleton />;

  const myAssignments = db.teacherAssignments.filter((a) => a.staffId === teacher.id);
  const sectionIds = Array.from(new Set(myAssignments.map((a) => a.sectionId)));

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আমার নির্ধারিত শ্রেণিসমূহ'}
        description={'আপনার নির্ধারিত শাখা ও বিষয়সমূহ'}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectionIds.map((secId) => {
          const sec = db.sections.find((s) => s.id === secId);
          const cls = db.classes.find((c) => c.id === sec?.classId);
          const secAssignments = myAssignments.filter((a) => a.sectionId === secId);
          const studentCount = db.enrollments.filter((e) => e.sectionId === secId).length;
          const isClassTeacher = db.sectionClassTeachers.some(
            (l) => l.sectionId === secId && l.staffId === teacher.id
          );

          return (
            <Card key={secId} className="p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-primary">
                      {cls?.nameBn || cls?.name} — {'শাখা'} {sec?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                      {'শিক্ষার্থী সংখ্যা:'} {formatNumber(studentCount, 'bn')}
                    </p>
                  </div>
                  {isClassTeacher && (
                    <span className="text-xs font-semibold text-foreground border border-accent/40 bg-accent/10 px-2 py-0.5 rounded">
                      {'শ্রেণি শিক্ষক'}
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-1.5">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {'নির্ধারিত বিষয়:'}
                  </p>
                  {secAssignments.map((a) => {
                    const sub = getAssignmentSubject(db, a.classSubjectId);
                    return (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <span>{sub?.nameBn || sub?.name}</span>
                        <span className={a.canEnterMarks ? 'text-success font-medium' : 'text-muted-foreground'}>
                          {a.canEnterMarks
                            ? 'নম্বর এন্ট্রি সক্রিয়'
                            : 'শুধু দেখুন'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Link href={`/teacher/classes/${secId}`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full">
                    {'শাখা বিস্তারিত'}
                  </Button>
                </Link>
                <Link href="/teacher/attendance">
                  <Button variant="outline" size="sm">
                    {'হাজিরা'}
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

