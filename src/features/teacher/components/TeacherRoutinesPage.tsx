'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, Clock, DoorOpen, Layers, Printer } from 'lucide-react';
import { useLiveSchoolProfile } from '@/src/features/institution/hooks/useSchoolProfile';
import {
  useGetMyTeacherAssignmentsQuery,
  useGetSchoolClassesQuery,
  useGetTeacherWeeklyRoutineQuery,
  type TeacherWeeklyRoutineClass,
} from '@/src/services/academic';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Modal, Select } from '@/src/components/ui/primitives';
import { FormalExamDocumentShell } from '@/src/components/print/ExamPrintDocuments';
import { formatNumber } from '@/src/lib/formatters';
import { cn, triggerPrint } from '@/src/lib/utils/cn';
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

export function TeacherRoutinesPage() {
  const auth = useAppSelector((s) => s.auth);
  const schoolProfile = useLiveSchoolProfile();
  const { data: myAssignments = [], isLoading: loadingAssignments } =
    useGetMyTeacherAssignmentsQuery();
  const { data: allClasses = [] } = useGetSchoolClassesQuery();

  const staffId = auth.user?.staffId || myAssignments[0]?.staffId || '';

  const {
    data: routineData,
    isLoading: loadingRoutine,
    isFetching: fetchingRoutine,
  } = useGetTeacherWeeklyRoutineQuery({ staffId }, { skip: !staffId });

  const [dayFilter, setDayFilter] = useState<'ALL' | WeekDay>('ALL');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const todayDay = getTodayWeekDay();

  const scheduleByDay = useMemo(() => {
    const rawSchedule = routineData?.weeklySchedule ?? [];
    const extraDays = rawSchedule
      .filter(
        (d) =>
          !SCHOOL_DAYS_ORDER.includes(d.day) && d.classes && d.classes.length > 0
      )
      .map((d) => d.day);
    const ordered = [...SCHOOL_DAYS_ORDER, ...extraDays];

    return ordered.map((day) => {
      const found = rawSchedule.find((d) => d.day === day);
      return {
        day,
        classes: [...(found?.classes ?? [])].sort(
          (a, b) => a.periodNumber - b.periodNumber
        ),
      };
    });
  }, [routineData?.weeklySchedule]);

  const periodColumns = useMemo(() => {
    const periodMeta = new Map<number, { periodName?: string | null; displayTime?: string }>();
    let maxPeriod = 6;
    for (const dayEntry of scheduleByDay) {
      for (const cls of dayEntry.classes) {
        if (cls.periodNumber > maxPeriod) maxPeriod = cls.periodNumber;
        if (!periodMeta.has(cls.periodNumber)) {
          periodMeta.set(cls.periodNumber, {
            periodName: cls.periodName,
            displayTime: cls.time?.displayTime,
          });
        }
      }
    }
    return Array.from({ length: maxPeriod }, (_, idx) => {
      const num = idx + 1;
      const meta = periodMeta.get(num);
      return {
        periodNumber: num,
        label: meta?.periodName || `পিরিয়ড ${formatNumber(num, 'bn')}`,
        displayTime: meta?.displayTime || null,
      };
    });
  }, [scheduleByDay]);

  const visibleDays = useMemo(
    () =>
      dayFilter === 'ALL'
        ? scheduleByDay
        : scheduleByDay.filter((d) => d.day === dayFilter),
    [scheduleByDay, dayFilter]
  );

  const stats = useMemo(() => {
    const totalWeekly = scheduleByDay.reduce((s, d) => s + d.classes.length, 0);
    const todayCount =
      scheduleByDay.find((d) => d.day === todayDay)?.classes.length ?? 0;
    const activeDays = scheduleByDay.filter((d) => d.classes.length > 0).length;
    return { totalWeekly, todayCount, activeDays };
  }, [scheduleByDay, todayDay]);

  if (loadingAssignments || loadingRoutine || fetchingRoutine) {
    return <LoadingSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আমার সাপ্তাহিক ক্লাস রুটিন'}
        description={
          routineData?.academicYear?.name
            ? `শিক্ষাবর্ষ ${routineData.academicYear.name} — দিন ও পিরিয়ড অনুযায়ী আপনার নির্ধারিত ক্লাসসমূহ`
            : 'দিন ও পিরিয়ড অনুযায়ী আপনার নির্ধারিত ক্লাসসমূহ'
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            disabled={stats.totalWeekly === 0}
            onClick={() => setShowPrintModal(true)}
          >
            <Printer className="w-4 h-4" />
            {'প্রিন্ট / PDF (A4)'}
          </Button>
        }
      />

      {/* 3-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {'সাপ্তাহিক মোট ক্লাস'}
            </p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(stats.totalWeekly, 'bn')}{' '}
              <span className="text-sm font-semibold text-muted-foreground">{'টি'}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {`আজকের ক্লাস (${ENUM_LABELS.WeekDay?.[todayDay]?.bn ?? todayDay})`}
            </p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(stats.todayCount, 'bn')}{' '}
              <span className="text-sm font-semibold text-muted-foreground">{'টি'}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {'কার্যকর কর্মদিবস'}
            </p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(stats.activeDays, 'bn')}{' '}
              <span className="text-sm font-semibold text-muted-foreground">{'দিন'}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Day Filter Bar */}
      <Card className="p-4">
        <div className="w-full sm:max-w-xs">
          <FormField label={'বার নির্বাচন করুন'}>
            <Select
              id="teacher-routine-day-filter"
              name="day"
              aria-label="বার নির্বাচন করুন"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value as 'ALL' | WeekDay)}
            >
              <option value="ALL">{'সকল দিন'}</option>
              {scheduleByDay.map((d) => (
                <option key={d.day} value={d.day}>
                  {ENUM_LABELS.WeekDay?.[d.day]?.bn ?? d.day}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </Card>

      {/* Weekly Timetable Matrix (Day x Period) */}
      {!staffId || stats.totalWeekly === 0 ? (
        <Card className="p-8">
          <EmptyState
            title={'আপনার জন্য কোনো ক্লাস রুটিন পাওয়া যায়নি'}
            description={
              'প্রশাসন থেকে ক্লাস রুটিনে আপনার পিরিয়ড যুক্ত করা হলে এখানে দিন ও সময় অনুযায়ী দেখতে পাবেন।'
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-muted/70 text-sm font-semibold text-muted-foreground">
                  <th className="px-4 py-3 text-left w-36 border-r border-border">
                    {'বার / দিন'}
                  </th>
                  {periodColumns.map((col) => (
                    <th
                      key={col.periodNumber}
                      className="px-3 py-3 text-center min-w-[155px] border-r border-border last:border-r-0"
                    >
                      <div className="font-bold text-foreground">{col.label}</div>
                      {col.displayTime && (
                        <div className="text-xs font-normal text-muted-foreground mt-0.5 tabular-nums">
                          {col.displayTime}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleDays.map(({ day, classes }) => {
                  const dayLabel = ENUM_LABELS.WeekDay?.[day]?.bn ?? day;
                  const isToday = day === todayDay;

                  const byPeriod = new Map<number, TeacherWeeklyRoutineClass[]>();
                  for (const item of classes) {
                    const list = byPeriod.get(item.periodNumber) ?? [];
                    list.push(item);
                    byPeriod.set(item.periodNumber, list);
                  }

                  return (
                    <tr
                      key={day}
                      className={cn(
                        'align-top',
                        isToday ? 'bg-primary/[0.02]' : 'hover:bg-surface-muted/20'
                      )}
                    >
                      <td className="px-4 py-3.5 border-r border-border bg-surface-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">
                            {dayLabel}
                          </span>
                          {isToday && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
                              {'আজ'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                          {`${formatNumber(classes.length, 'bn')}টি ক্লাস`}
                        </p>
                      </td>

                      {periodColumns.map((col) => {
                        const slotItems = byPeriod.get(col.periodNumber) ?? [];
                        return (
                          <td
                            key={col.periodNumber}
                            className="p-2 border-r border-border last:border-r-0"
                          >
                            {slotItems.length === 0 ? (
                              <div className="h-[80px] rounded-lg border border-dashed border-border/70 bg-surface-muted/20 flex items-center justify-center text-xs text-muted-foreground/70">
                                {'—'}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {slotItems.map((item) => {
                                  const clsMeta = allClasses.find(
                                    (c) => c.id === item.class.id
                                  );
                                  const className = clsMeta?.nameBn || item.class.name;
                                  return (
                                    <div
                                      key={item.routineId}
                                      className="min-h-[80px] rounded-lg border border-primary/25 bg-primary/[0.06] p-2.5 flex flex-col justify-between gap-1.5"
                                    >
                                      <div>
                                        <p className="text-sm font-bold text-foreground leading-snug">
                                          {item.subject?.name || 'বিষয়'}
                                        </p>
                                        <p className="text-xs font-medium text-primary mt-0.5">
                                          {`${className} (${item.section.name})`}
                                        </p>
                                      </div>

                                      {item.room && (
                                        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground pt-1 border-t border-primary/15">
                                          <DoorOpen className="w-3.5 h-3.5" />
                                          <span>{item.room}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Landscape A4 Print / PDF Modal */}
      <Modal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={'সাপ্তাহিক ক্লাস রুটিন (A4 প্রিন্ট / PDF)'}
        maxWidth="max-w-6xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPrintModal(false)}>
              {'বন্ধ করুন'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {'প্রিন্ট / PDF সংরক্ষণ'}
            </Button>
          </div>
          <div className="overflow-x-auto pb-2">
            <FormalExamDocumentShell
              school={schoolProfile}
              titleBn={'শিক্ষকের সাপ্তাহিক ক্লাস রুটিন'}
              titleEn={'Teacher Weekly Class Routine'}
              subtitleBn={
                routineData?.teacher?.name
                  ? `${routineData.teacher.name} · শিক্ষাবর্ষ ${routineData.academicYear?.name ?? ''}`
                  : undefined
              }
              orientation="landscape"
            >
              <table className="w-full text-[11px] border border-[#18181B] border-collapse">
                <thead>
                  <tr className="bg-[#F4F4F5] text-[#111111]">
                    <th className="border border-[#18181B] px-2 py-2 text-left w-28">
                      {'বার / দিন'}
                    </th>
                    {periodColumns.map((col) => (
                      <th
                        key={col.periodNumber}
                        className="border border-[#18181B] px-2 py-1.5 text-center"
                      >
                        <div className="font-bold">{col.label}</div>
                        {col.displayTime && (
                          <div className="text-[10px] font-normal text-[#52525B]">
                            {col.displayTime}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleDays.map(({ day, classes }) => {
                    const dayLabel = ENUM_LABELS.WeekDay?.[day]?.bn ?? day;
                    const byPeriod = new Map<number, TeacherWeeklyRoutineClass[]>();
                    for (const item of classes) {
                      const list = byPeriod.get(item.periodNumber) ?? [];
                      list.push(item);
                      byPeriod.set(item.periodNumber, list);
                    }
                    return (
                      <tr key={day}>
                        <td className="border border-[#52525B] px-2 py-2 font-bold bg-[#FAFAFA]">
                          {dayLabel}
                        </td>
                        {periodColumns.map((col) => {
                          const slotItems = byPeriod.get(col.periodNumber) ?? [];
                          return (
                            <td
                              key={col.periodNumber}
                              className="border border-[#52525B] px-2 py-2 text-center align-middle"
                            >
                              {slotItems.length === 0 ? (
                                <span className="text-[#A1A1AA]">—</span>
                              ) : (
                                <div className="space-y-1">
                                  {slotItems.map((item) => {
                                    const clsMeta = allClasses.find(
                                      (c) => c.id === item.class.id
                                    );
                                    const className = clsMeta?.nameBn || item.class.name;
                                    return (
                                      <div key={item.routineId}>
                                        <div className="font-bold text-[#111111]">
                                          {item.subject?.name || 'বিষয়'}
                                        </div>
                                        <div className="text-[10px] text-[#3F3F46]">
                                          {`${className} (${item.section.name})`}
                                          {item.room ? ` · ${item.room}` : ''}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </FormalExamDocumentShell>
          </div>
        </div>
      </Modal>
    </div>
  );
}
