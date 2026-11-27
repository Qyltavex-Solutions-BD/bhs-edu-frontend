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

export function TeacherAttendancePage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [saveBatch, { isLoading: saving }] = useSaveAttendanceBatchMutation();
  const teacher = useCurrentTeacher(db);
  const auth = useAppSelector((s) => s.auth);
  const mySectionIds = useMemo(
    () =>
      db && teacher
        ? Array.from(
            new Set(db.teacherAssignments.filter((a) => a.staffId === teacher.id).map((a) => a.sectionId))
          )
        : [],
    [db, teacher]
  );

  const [sectionId, setSectionId] = useState('sec-9-ka');
  const [date, setDate] = useState('2026-11-19');
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AttendanceStatus>>({});

  if (isLoading || !db || !teacher) return <LoadingSkeleton />;

  const activeSecId = mySectionIds.includes(sectionId) ? sectionId : mySectionIds[0];
  const sec = db.sections.find((s) => s.id === activeSecId);
  const methodCfg = db.classAttendanceConfigs.find((c) => c.classId === sec?.classId);
  const isRfidPrimary = methodCfg?.method === AttendanceMethod.RFID;

  const enrollments = db.enrollments
    .filter((e) => e.sectionId === activeSecId)
    .sort((a, b) => a.roll - b.roll);

  const getStatus = (enrollmentId: string) => {
    if (draftStatuses[enrollmentId]) return draftStatuses[enrollmentId];
    const existing = db.attendances.find(
      (a) => a.studentEnrollmentId === enrollmentId && a.date === date
    );
    return existing?.status ?? AttendanceStatus.PRESENT;
  };

  const handleSave = async () => {
    try {
      const res = await saveBatch({
        date,
        academicYearId: enrollments[0]?.academicYearId ?? db.academicYears.find((year) => year.isActive)?.id ?? '',
        markedBy: auth.user?.id ?? 'user-teacher-1',
        entries: enrollments.map((e) => ({
          studentEnrollmentId: e.id,
          status: getStatus(e.id),
          method: isRfidPrimary ? AttendanceMethod.RFID : AttendanceMethod.MANUAL,
        })),
      }).unwrap();
      toast.success(
        `${formatNumber(res.saved, 'bn')} জন শিক্ষার্থীর হাজিরা সংরক্ষিত হয়েছে। অনুপস্থিত SMS কিউ: ${formatNumber(res.smsQueued, 'bn')}`
      );
    } catch {
      toast.error('হাজিরা সংরক্ষণ করা যায়নি');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={'দৈনিক হাজিরা গ্রহণ'}
        description={'নির্ধারিত শাখার হাজিরা নথিভুক্ত করুন; অনুপস্থিতিতে অভিভাবকের কাছে স্বয়ংক্রিয় SMS কিউ হবে'}
      />

      <Card className="p-4 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            {'শাখা নির্বাচন'}
          </label>
          <Select value={activeSecId} onChange={(e) => setSectionId(e.target.value)}>
            {mySectionIds.map((sid) => {
              const s = db.sections.find((x) => x.id === sid);
              const c = db.classes.find((x) => x.id === s?.classId);
              return (
                <option key={sid} value={sid}>
                  {c?.nameBn || c?.name} ({s?.name})
                </option>
              );
            })}
          </Select>
        </div>
        <div className="w-44">
          <label className="text-sm font-medium text-muted-foreground block mb-1">
            {'তারিখ'}
          </label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex-1 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const all: Record<string, AttendanceStatus> = {};
              enrollments.forEach((e) => {
                all[e.id] = AttendanceStatus.PRESENT;
              });
              setDraftStatuses(all);
            }}
          >
            {'সবাইকে উপস্থিত করুন'}
          </Button>
          <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
            <Save className="w-4 h-4" />
            {'হাজিরা সংরক্ষণ'}
          </Button>
        </div>
      </Card>

      {isRfidPrimary && (
        <div className="p-3.5 rounded-[var(--radius)] border border-info/40 bg-info/10 text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-info shrink-0 mt-0.5" />
          <p>
            {'এই শ্রেণির জন্য প্রাথমিক হাজিরা পদ্ধতি RFID নির্ধারিত আছে। আপনি প্রয়োজনে ম্যানুয়াল ফলোব্যাক হিসেবে অনুপস্থিতি বা ছুটি হালনাগাদ করতে পারেন।'}
          </p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">{'রোল'}</th>
                <th className="px-4 py-3 text-left">{'শিক্ষার্থী'}</th>
                <th className="px-4 py-3 text-left">{'হাজিরার অবস্থা'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {enrollments.map((enr) => {
                const stu = db.students.find((s) => s.id === enr.studentId);
                const status = getStatus(enr.id);
                return (
                  <tr key={enr.id}>
                    <td className="px-4 py-3 font-semibold">{formatNumber(enr.roll, 'bn')}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{stu?.nameBn || stu?.nameEn}</p>
                      <p className="text-sm text-muted-foreground font-mono">{stu?.studentId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          AttendanceStatus.PRESENT,
                          AttendanceStatus.ABSENT,
                          AttendanceStatus.LATE,
                          AttendanceStatus.LEAVE,
                        ].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setDraftStatuses((prev) => ({ ...prev, [enr.id]: st }))}
                            className={`px-2.5 py-1 rounded text-sm font-medium border cursor-pointer transition-colors ${
                              status === st
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-surface border-border hover:bg-surface-muted'
                            }`}
                          >
                            {ENUM_LABELS.AttendanceStatus[st]?.bn ?? st}
                          </button>
                        ))}
                      </div>
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

