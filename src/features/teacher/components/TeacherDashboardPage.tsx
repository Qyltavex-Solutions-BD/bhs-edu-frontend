'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ClipboardCheck, DoorOpen, FileSpreadsheet } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import {
  useGetClassTeachersQuery,
  useGetMyTeacherAssignmentsQuery,
  useGetSchoolClassesQuery,
  useGetTeacherWeeklyRoutineQuery,
} from '@/src/services/academic';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import { useGetExamsQuery } from '@/src/features/examinations/api/examinations.api';
import { useGetPortalNoticesQuery } from '@/src/features/notices/api/notices.api';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';
import { WeekDay } from '@/src/types/enums';

const SCHOOL_DAYS_ORDER: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
];

function getTodayWeekDay(): WeekDay {
  const map: WeekDay[] = [
    WeekDay.SUNDAY,
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
    WeekDay.SATURDAY,
  ];
  return map[new Date().getDay()] ?? WeekDay.SUNDAY;
}

export function TeacherDashboardPage() {
  const auth = useAppSelector((s) => s.auth);
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();
  const { data: myAssignments = [], isLoading: loadingAssignments } =
    useGetMyTeacherAssignmentsQuery();
  const { data: allClasses = [], isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const { data: classTeachers = [] } = useGetClassTeachersQuery();
  const { data: enrollmentsList = [] } = useGetEnrollmentsQuery();
  const { data: examsData } = useGetExamsQuery({ limit: 100 });
  const { data: noticesData } = useGetPortalNoticesQuery({ page: 1, limit: 5 });

  const staffId = meData?.staff?.id || auth.user?.staffId || myAssignments[0]?.staffId || '';

  const { data: routineData } = useGetTeacherWeeklyRoutineQuery(
    { staffId },
    { skip: !staffId }
  );

  const todayDay = getTodayWeekDay();

  const classMap = useMemo(() => {
    const map = new Map<string, (typeof allClasses)[number]>();
    for (const c of allClasses) map.set(c.id, c);
    return map;
  }, [allClasses]);

  const activeAssignments = useMemo(
    () => myAssignments.filter((a) => a.isActive),
    [myAssignments]
  );

  const mySectionIds = useMemo(
    () => Array.from(new Set(activeAssignments.map((a) => a.sectionId).filter(Boolean))),
    [activeAssignments]
  );

  const myClassIds = useMemo(
    () => Array.from(new Set(activeAssignments.map((a) => a.classId).filter(Boolean))),
    [activeAssignments]
  );

  const myEnrollments = useMemo(() => {
    return enrollmentsList.filter((e) => mySectionIds.includes(e.sectionId));
  }, [enrollmentsList, mySectionIds]);

  const enrollmentCountBySection = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of enrollmentsList) {
      map.set(e.sectionId, (map.get(e.sectionId) ?? 0) + 1);
    }
    return map;
  }, [enrollmentsList]);

  const myClassTeacherLinks = useMemo(
    () => classTeachers.filter((ct) => ct.staffId === staffId),
    [classTeachers, staffId]
  );

  const weeklySchedule = routineData?.weeklySchedule ?? [];

  const totalWeeklyPeriods = useMemo(
    () => weeklySchedule.reduce((sum, d) => sum + (d.classes?.length ?? 0), 0),
    [weeklySchedule]
  );

  const todayRoutines = useMemo(() => {
    const entry = weeklySchedule.find((d) => d.day === todayDay);
    return [...(entry?.classes ?? [])].sort((a, b) => a.periodNumber - b.periodNumber);
  }, [weeklySchedule, todayDay]);

  const weeklyChartData = useMemo(() => {
    return SCHOOL_DAYS_ORDER.map((day) => {
      const entry = weeklySchedule.find((d) => d.day === day);
      return {
        day: ENUM_LABELS.WeekDay?.[day]?.bn ?? day,
        classes: entry?.classes?.length ?? 0,
      };
    });
  }, [weeklySchedule]);

  const myExams = useMemo(
    () =>
      (examsData?.items ?? []).filter(
        (e) => !e.isDeleted && myClassIds.includes(e.classId)
      ),
    [examsData, myClassIds]
  );

  const openMarksExams = useMemo(
    () => myExams.filter((e) => !e.isLocked),
    [myExams]
  );

  const notices = noticesData?.items ?? [];

  if (loadingMe || loadingAssignments || loadingClasses) {
    return <LoadingSkeleton rows={6} />;
  }

  const teacherName = meData?.name || auth.user?.name || routineData?.teacher?.name || 'শিক্ষক';
  const teacherDesignation =
    meData?.staff?.designation || routineData?.teacher?.designation || 'শিক্ষক';
  const teacherEmployeeId =
    meData?.staff?.employeeId || routineData?.teacher?.employeeId || '—';

  const todayLabelBn = ENUM_LABELS.WeekDay?.[todayDay]?.bn ?? todayDay;

  const firstClassTeacher = myClassTeacherLinks[0];
  const firstClassTeacherLabel = firstClassTeacher
    ? `${classMap.get(firstClassTeacher.section?.classId ?? '')?.nameBn || firstClassTeacher.section?.schoolClass?.name || ''} (${firstClassTeacher.section?.name ?? ''})`
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`স্বাগতম, ${teacherName}`}
        description={`${teacherDesignation} · কর্মচারী আইডি: ${teacherEmployeeId}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/teacher/attendance">
              <Button variant="primary" size="sm">
                <ClipboardCheck className="w-4 h-4" />
                {'হাজিরা নিন'}
              </Button>
            </Link>
            <Link href="/teacher/marks-entry">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="w-4 h-4" />
                {'নম্বর এন্ট্রি'}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={'নির্ধারিত বিষয় ও শাখা'}
          value={formatNumber(activeAssignments.length, 'bn')}
          meta={`${formatNumber(mySectionIds.length, 'bn')}টি শাখায় পাঠদান`}
          accent="primary"
        />
        <StatCard
          label={'মোট নির্ধারিত শিক্ষার্থী'}
          value={formatNumber(myEnrollments.length, 'bn')}
          meta={
            firstClassTeacherLabel
              ? `শ্রেণি শিক্ষক: ${firstClassTeacherLabel}`
              : 'বিষয়ভিত্তিক শিক্ষক'
          }
        />
        <StatCard
          label={'সাপ্তাহিক পিরিয়ড'}
          value={formatNumber(totalWeeklyPeriods, 'bn')}
          meta={`আজকের ক্লাস: ${formatNumber(todayRoutines.length, 'bn')}টি`}
        />
        <StatCard
          label={'চলমান নম্বর এন্ট্রি'}
          value={formatNumber(openMarksExams.length, 'bn')}
          meta={`মোট পরীক্ষা: ${formatNumber(myExams.length, 'bn')}টি`}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">
                {`আজকের ক্লাস রুটিন (${todayLabelBn})`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {'আপনার নির্ধারিত পিরিয়ডসমূহ'}
              </p>
            </div>
            <Link href="/teacher/routines" className="text-sm font-medium text-primary hover:underline">
              {'পূর্ণ রুটিন দেখুন'}
            </Link>
          </div>
          {todayRoutines.length === 0 ? (
            <EmptyState
              title={'আজ কোনো পিরিয়ড নির্ধারিত নেই'}
              description={'সাপ্তাহিক পূর্ণাঙ্গ রুটিন দেখতে ডান পাশের "পূর্ণ রুটিন দেখুন" লিংকে ক্লিক করুন।'}
            />
          ) : (
            <div className="divide-y divide-border">
              {todayRoutines.map((r) => {
                const clsMeta = classMap.get(r.class.id);
                const className = clsMeta?.nameBn || r.class.name;
                return (
                  <div key={r.routineId} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold">
                        {r.subject?.name || 'বিষয়'}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span>{`${className} (${r.section.name})`}</span>
                        {r.room && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <DoorOpen className="w-3.5 h-3.5" />
                              {r.room}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-sm font-semibold text-primary">
                        {r.time?.displayTime || `${r.time?.startTime} – ${r.time?.endTime}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.periodName || `পিরিয়ড ${formatNumber(r.periodNumber, 'bn')}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold mb-1">
            {'সাপ্তাহিক ক্লাস বিন্যাস'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {'বার অনুযায়ী নির্ধারিত ক্লাস সংখ্যা'}
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="classes"
                  fill="#124B96"
                  radius={[4, 4, 0, 0]}
                  name={'ক্লাস সংখ্যা'}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              {'শ্রেণি শিক্ষক দায়িত্ব'}
            </h2>
            <Link href="/teacher/classes" className="text-sm font-medium text-primary hover:underline">
              {'সকল শ্রেণি'}
            </Link>
          </div>
          {myClassTeacherLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {'কোনো শাখার শ্রেণি শিক্ষক হিসেবে নির্ধারিত নন।'}
            </p>
          ) : (
            <div className="space-y-3">
              {myClassTeacherLinks.map((ct) => {
                const secId = ct.section?.id ?? ct.sectionId;
                const clsName =
                  classMap.get(ct.section?.classId ?? '')?.nameBn ||
                  ct.section?.schoolClass?.name ||
                  'শ্রেণি';
                const secName = ct.section?.name ?? '—';
                const studentCount = enrollmentCountBySection.get(secId) ?? 0;
                return (
                  <div
                    key={ct.id}
                    className="p-4 rounded-[var(--radius)] border border-border bg-muted/30 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-base font-semibold">
                        {clsName} — {'শাখা'} {secName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                        {'শিক্ষার্থী:'} {formatNumber(studentCount, 'bn')} {'জন'}
                      </p>
                    </div>
                    <Link href={`/teacher/classes/${secId}`}>
                      <Button variant="outline" size="sm">
                        {'বিস্তারিত'}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">{'সাম্প্রতিক নোটিশ'}</h2>
            <Link href="/teacher/notices" className="text-sm font-medium text-primary hover:underline">
              {'সব নোটিশ'}
            </Link>
          </div>
          {notices.length === 0 ? (
            <EmptyState title={'কোনো নোটিশ পাওয়া যায়নি'} />
          ) : (
            <div className="divide-y divide-border">
              {notices.map((n) => (
                <div key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {formatDateShort(n.publishedAt ?? n.createdAt, 'bn')}
                    </p>
                  </div>
                  <StatusBadge enumName="NoticeStatus" value={n.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
