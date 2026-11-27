'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Users, XCircle } from 'lucide-react';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import {
  useGetParentByIdQuery,
  useGetSchoolClassesQuery,
  type ParentChildItem,
} from '@/src/services/academic';
import { useGetParentChildAttendanceQuery } from '@/src/features/attendance/api/attendance.api';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Card, FormField, Input } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber, formatTime12h } from '@/src/lib/formatters';
import { AttendanceStatus } from '@/src/types/enums';

function getCurrentMonthValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function ChildSwitcherBar({
  childrenList,
  selectedStudentId,
  classNameMap,
  onChange,
}: {
  childrenList: ParentChildItem[];
  selectedStudentId: string;
  classNameMap: Map<string, string>;
  onChange: (id: string) => void;
}) {
  if (childrenList.length <= 1) return null;
  return (
    <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Users className="w-4 h-4 text-primary" />
        <span>{'সন্তান নির্বাচন করুন:'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {childrenList.map((c) => {
          const active = c.studentId === selectedStudentId;
          const clsLabel = c.currentClass
            ? classNameMap.get(c.currentClass) ?? c.currentClass
            : '';
          return (
            <button
              key={c.mappingId}
              type="button"
              onClick={() => onChange(c.studentId)}
              className={`px-3 py-1.5 rounded-[var(--radius)] text-sm font-semibold border transition-colors cursor-pointer ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-muted/50'
              }`}
            >
              {c.studentNameBn || c.studentNameEn}
              {clsLabel ? ` · ${clsLabel}` : ''}
              {c.currentSection ? ` (${c.currentSection})` : ''}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function ParentAttendancePage() {
  const auth = useAppSelector((s) => s.auth);
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();
  const { data: allClasses = [] } = useGetSchoolClassesQuery();

  const parentId = meData?.parent?.id || auth.user?.parentId || '';

  const {
    data: parentDetail,
    isLoading: loadingParent,
  } = useGetParentByIdQuery(parentId, { skip: !parentId });

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [month, setMonth] = useState<string>(getCurrentMonthValue);

  const classNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cls of allClasses) {
      map.set(cls.name, cls.nameBn || cls.name);
    }
    return map;
  }, [allClasses]);

  const children = parentDetail?.children ?? [];
  const activeChild = useMemo(() => {
    if (children.length === 0) return null;
    if (selectedStudentId) {
      const found = children.find((c) => c.studentId === selectedStudentId);
      if (found) return found;
    }
    return children[0] ?? null;
  }, [children, selectedStudentId]);

  const enrollmentId = activeChild?.enrollmentId ?? '';

  const {
    data: attendanceData,
    isLoading: loadingAttendance,
    isFetching: fetchingAttendance,
  } = useGetParentChildAttendanceQuery(
    {
      studentEnrollmentId: enrollmentId,
      month: month || undefined,
    },
    { skip: !enrollmentId }
  );

  if (loadingMe || (Boolean(parentId) && loadingParent)) {
    return <LoadingSkeleton />;
  }

  const summary = attendanceData?.summary ?? {
    totalDays: 0,
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    percentage: 0,
  };
  const records = attendanceData?.records ?? [];
  const activeClassLabel = activeChild?.currentClass
    ? classNameMap.get(activeChild.currentClass) ?? activeChild.currentClass
    : '';

  return (
    <div className="space-y-6">
      <PageHeader
        title={'সন্তানের হাজিরা ক্যালেন্ডার'}
        description={
          activeChild
            ? `${activeChild.studentNameBn || activeChild.studentNameEn} · ${activeClassLabel}${activeChild.currentSection ? ` (${activeChild.currentSection})` : ''}`
            : 'মাসিক ক্যালেন্ডার হিট-ভিউ ও দৈনিক RFID/ম্যানুয়াল হাজিরা লগ'
        }
      />

      {!parentId ? (
        <EmptyState
          title={'অভিভাবক প্রোফাইল যুক্ত নেই'}
          description={'আপনার অ্যাকাউন্টের সাথে এখনো কোনো অভিভাবক প্রোফাইল লিংক করা হয়নি।'}
        />
      ) : !activeChild ? (
        <EmptyState
          title={'কোনো সন্তান লিংক করা নেই'}
          description={'আপনার অভিভাবক প্রোফাইলের সাথে কোনো শিক্ষার্থীর তথ্য যুক্ত করা হলে এখানে হাজিরা দেখতে পাবেন।'}
        />
      ) : (
        <>
          <ChildSwitcherBar
            childrenList={children}
            selectedStudentId={activeChild.studentId}
            classNameMap={classNameMap}
            onChange={setSelectedStudentId}
          />

          <Card className="p-4">
            <div className="w-full sm:max-w-xs">
              <FormField label={'মাস নির্বাচন করুন'}>
                <Input
                  id="parent-attendance-month"
                  name="month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </FormField>
            </div>
          </Card>

          {!enrollmentId ? (
            <EmptyState
              title={'চলমান ভর্তি তথ্য পাওয়া যায়নি'}
              description={'এই শিক্ষার্থীর চলমান শিক্ষাবর্ষের ভর্তি তথ্য এখনো সক্রিয় নেই।'}
            />
          ) : loadingAttendance || fetchingAttendance ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label={'উপস্থিতির হার'}
                  value={`${formatNumber(summary.percentage, 'bn')}%`}
                  icon={<Calendar className="w-5 h-5" />}
                  accent="primary"
                />
                <StatCard
                  label={'উপস্থিত'}
                  value={formatNumber(summary.present, 'bn')}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  accent="success"
                />
                <StatCard
                  label={'বিলম্বে উপস্থিত'}
                  value={formatNumber(summary.late, 'bn')}
                  icon={<Clock className="w-5 h-5" />}
                  accent="warning"
                />
                <StatCard
                  label={'অনুপস্থিত'}
                  value={formatNumber(summary.absent, 'bn')}
                  icon={<XCircle className="w-5 h-5" />}
                  accent="destructive"
                />
              </div>

              {records.length === 0 ? (
                <EmptyState
                  title={'এই মাসে কোনো হাজিরা রেকর্ড নেই'}
                  description={'নির্বাচিত মাসে এখনো কোনো উপস্থিতি বা অনুপস্থিতি এন্ট্রি করা হয়নি।'}
                />
              ) : (
                <>
                  <Card className="p-5">
                    <h2 className="text-base font-semibold mb-1">
                      {'দৈনিক হাজিরা গ্রিড'}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {'P = উপস্থিত, L = বিলম্ব, A = অনুপস্থিত, LV = অনুমোদিত ছুটি'}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2.5 tabular-nums">
                      {records
                        .slice()
                        .reverse()
                        .map((r) => {
                          const code =
                            r.status === AttendanceStatus.PRESENT
                              ? 'P'
                              : r.status === AttendanceStatus.LATE
                                ? 'L'
                                : r.status === AttendanceStatus.ABSENT
                                  ? 'A'
                                  : 'LV';
                          const cls =
                            r.status === AttendanceStatus.PRESENT
                              ? 'bg-success/15 text-success border-success/30'
                              : r.status === AttendanceStatus.LATE
                                ? 'bg-warning/15 text-warning border-warning/30'
                                : r.status === AttendanceStatus.ABSENT
                                  ? 'bg-destructive/15 text-destructive border-destructive/30'
                                  : 'bg-info/15 text-info border-info/30';
                          return (
                            <div
                              key={r.id}
                              className={`p-2.5 rounded-[var(--radius)] border text-center ${cls}`}
                            >
                              <p className="text-xs">{formatDateShort(r.date, 'bn')}</p>
                              <p className="text-base font-bold mt-0.5">{code}</p>
                            </div>
                          );
                        })}
                    </div>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left">{'তারিখ'}</th>
                            <th className="px-4 py-3 text-left">{'অবস্থা'}</th>
                            <th className="px-4 py-3 text-left">{'পদ্ধতি'}</th>
                            <th className="px-4 py-3 text-left">{'প্রবেশ'}</th>
                            <th className="px-4 py-3 text-left">{'প্রস্থান'}</th>
                            <th className="px-4 py-3 text-left">{'মন্তব্য'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border tabular-nums">
                          {records.map((r) => (
                            <tr key={r.id} className="hover:bg-muted/20">
                              <td className="px-4 py-3 font-medium">
                                {formatDateShort(r.date, 'bn')}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge enumName="AttendanceStatus" value={r.status} />
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{r.method}</td>
                              <td className="px-4 py-3">
                                {r.inTime ? formatTime12h(r.inTime.slice(11, 16)) : '—'}
                              </td>
                              <td className="px-4 py-3">
                                {r.outTime ? formatTime12h(r.outTime.slice(11, 16)) : '—'}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {r.remarks || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
