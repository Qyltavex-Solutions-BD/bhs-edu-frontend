'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import {
  useGetParentByIdQuery,
  useGetSchoolClassesQuery,
  type ParentChildItem,
} from '@/src/services/academic';
import {
  useGetParentChildAttendanceQuery,
  useGetParentSmsLogsQuery,
} from '@/src/features/attendance/api/attendance.api';
import {
  useGetExamsQuery,
  useGetStudentTranscriptQuery,
} from '@/src/features/examinations/api/examinations.api';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Card } from '@/src/components/ui/primitives';
import {
  formatDateLong,
  formatDateShort,
  formatNumber,
} from '@/src/lib/formatters';
import { ResultPublicationStatus } from '@/src/types/enums';

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

export function ParentDashboardPage() {
  const auth = useAppSelector((s) => s.auth);
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();
  const { data: allClasses = [] } = useGetSchoolClassesQuery();

  const parentId = meData?.parent?.id || auth.user?.parentId || '';

  const {
    data: parentDetail,
    isLoading: loadingParent,
  } = useGetParentByIdQuery(parentId, { skip: !parentId });

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

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
  const classId = activeChild?.classId ?? '';

  const { data: attendanceData } = useGetParentChildAttendanceQuery(
    { studentEnrollmentId: enrollmentId },
    { skip: !enrollmentId }
  );

  const { data: smsData } = useGetParentSmsLogsQuery(
    { page: 1, limit: 10 },
    { skip: !parentId }
  );

  const { data: examsData } = useGetExamsQuery(
    { classId: classId || undefined, limit: 50 },
    { skip: !classId }
  );

  const childExams = useMemo(
    () => (examsData?.items ?? []).filter((e) => !e.isDeleted && e.classId === classId),
    [examsData, classId]
  );

  const latestPublishedExam = useMemo(
    () =>
      childExams.find((e) => e.resultStatus === ResultPublicationStatus.PUBLISHED) ??
      null,
    [childExams]
  );

  const { data: latestTranscript } = useGetStudentTranscriptQuery(
    {
      enrollmentId,
      examId: latestPublishedExam?.id ?? '',
    },
    { skip: !enrollmentId || !latestPublishedExam?.id }
  );

  if (loadingMe || (Boolean(parentId) && loadingParent)) {
    return <LoadingSkeleton rows={6} />;
  }

  if (!parentId || !parentDetail) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'অভিভাবক ড্যাশবোর্ড'}
          description={'আপনার সন্তানের হাজিরা, প্রকাশিত ফলাফল, ক্লাস রুটিন ও SMS নোটিফিকেশন এক নজরে দেখুন'}
        />
        <EmptyState
          title={'অভিভাবক প্রোফাইল যুক্ত নেই'}
          description={'আপনার অ্যাকাউন্টের সাথে এখনো কোনো অভিভাবক প্রোফাইল লিংক করা হয়নি।'}
        />
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`অভিভাবক ড্যাশবোর্ড — ${parentDetail.nameBn || parentDetail.name}`}
          description={'আপনার সন্তানের হাজিরা, প্রকাশিত ফলাফল, ক্লাস রুটিন ও SMS নোটিফিকেশন এক নজরে দেখুন'}
        />
        <EmptyState
          title={'কোনো সন্তান সংযুক্ত নেই'}
          description={'আপনার অভিভাবক প্রোফাইলের সাথে এখনো কোনো শিক্ষার্থীর তথ্য যুক্ত করা হয়নি।'}
        />
      </div>
    );
  }

  const attSummary = attendanceData?.summary ?? {
    totalDays: 0,
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    percentage: 0,
  };
  const mySms = smsData?.items ?? [];
  const activeClassLabel = activeChild.currentClass
    ? classNameMap.get(activeChild.currentClass) ?? activeChild.currentClass
    : '—';
  const latestGpa = latestTranscript?.resultSummary?.gpa;
  const latestMerit = latestTranscript?.resultSummary?.meritPosition;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`অভিভাবক ড্যাশবোর্ড — ${parentDetail.nameBn || parentDetail.name}`}
        description={'আপনার সন্তানের হাজিরা, প্রকাশিত ফলাফল, ক্লাস রুটিন ও SMS নোটিফিকেশন এক নজরে দেখুন'}
      />

      <ChildSwitcherBar
        childrenList={children}
        selectedStudentId={activeChild.studentId}
        classNameMap={classNameMap}
        onChange={setSelectedStudentId}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={'নির্বাচিত শিক্ষার্থী'}
          value={activeChild.studentNameBn || activeChild.studentNameEn}
          meta={`${activeClassLabel}${activeChild.currentSection ? ` (${activeChild.currentSection})` : ''} · রোল ${activeChild.currentRoll != null ? formatNumber(activeChild.currentRoll, 'bn') : '—'}`}
          accent="primary"
        />
        <StatCard
          label={'উপস্থিতির হার'}
          value={`${formatNumber(attSummary.percentage, 'bn')}%`}
          meta={`${formatNumber(attSummary.present + attSummary.late, 'bn')}/${formatNumber(attSummary.totalDays, 'bn')} কার্যদিবস`}
          accent="success"
        />
        <StatCard
          label={'সর্বশেষ প্রকাশিত জিপিএ'}
          value={latestGpa != null ? formatNumber(latestGpa, 'bn', 2) : '—'}
          meta={
            latestMerit
              ? `মেধা স্থান: #${formatNumber(latestMerit, 'bn')}`
              : 'ফলাফল অপেক্ষমাণ'
          }
        />
        <StatCard
          label={'প্রাপ্ত হাজিরা SMS'}
          value={formatNumber(smsData?.total ?? mySms.length, 'bn')}
          meta={parentDetail.phone}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              {'সাম্প্রতিক হাজিরা ও SMS বার্তা'}
            </h2>
            <Link
              href="/parent/sms-history"
              className="text-sm font-medium text-primary hover:underline"
            >
              {'সব SMS দেখুন'}
            </Link>
          </div>
          {mySms.length === 0 ? (
            <EmptyState title={'কোনো SMS লগ নেই'} />
          ) : (
            <div className="divide-y divide-border">
              {mySms.slice(0, 4).map((sms) => (
                <div key={sms.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {formatDateLong(sms.sentAt ?? sms.createdAt, 'bn')}
                    </span>
                    <StatusBadge enumName="SmsStatus" value={sms.status} />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {sms.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              {'পরীক্ষার সূচি ও ফলাফল'}
            </h2>
            <Link
              href="/parent/results"
              className="text-sm font-medium text-primary hover:underline"
            >
              {'মার্কশিট দেখুন'}
            </Link>
          </div>
          {childExams.length === 0 ? (
            <EmptyState title={'কোনো পরীক্ষা নির্ধারিত নেই'} />
          ) : (
            <div className="divide-y divide-border">
              {childExams.map((ex) => (
                <div
                  key={ex.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-base font-semibold">{ex.name}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {formatDateShort(ex.startDate, 'bn')} –{' '}
                      {formatDateShort(ex.endDate, 'bn')}
                    </p>
                  </div>
                  <StatusBadge
                    enumName="ResultPublicationStatus"
                    value={ex.resultStatus}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
