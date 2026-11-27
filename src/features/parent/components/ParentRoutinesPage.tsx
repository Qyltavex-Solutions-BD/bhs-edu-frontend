'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, Clock, Coffee, DoorOpen, Layers, Printer, Users } from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/store/api';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import {
  useGetParentByIdQuery,
  useGetSchoolClassesQuery,
  useGetSectionWeeklyRoutineQuery,
  type ParentChildItem,
  type SectionTimetablePeriod,
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
import type { SchoolProfile } from '@/src/types/entities';
import { WeekDay } from '@/src/types/enums';

const SCHOOL_DAYS_ORDER: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
];

const FALLBACK_SCHOOL_PROFILE: SchoolProfile = {
  id: 'school-default',
  name: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
  nameEn: 'Vojesshor High School',
  eiin: '112233',
  establishedYear: 1965,
  address: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
  phone: '',
  email: '',
  createdAt: '',
  updatedAt: '',
};

function to12hDisplay(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

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

export function ParentRoutinesPage() {
  const auth = useAppSelector((s) => s.auth);
  const { data: db } = useGetBootstrapQuery();
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();
  const { data: allClasses = [] } = useGetSchoolClassesQuery();

  const parentId = meData?.parent?.id || auth.user?.parentId || '';

  const {
    data: parentDetail,
    isLoading: loadingParent,
  } = useGetParentByIdQuery(parentId, { skip: !parentId });

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [dayFilter, setDayFilter] = useState<'ALL' | WeekDay>('ALL');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const todayDay = getTodayWeekDay();

  const schoolProfile: SchoolProfile = db?.schoolProfile ?? FALLBACK_SCHOOL_PROFILE;

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

  const sectionId = activeChild?.sectionId ?? '';
  const childGroupId = activeChild?.groupId ?? null;
  const academicYearId = activeChild?.academicYearId ?? undefined;

  const {
    data: routineData,
    isLoading: loadingRoutine,
    isFetching: fetchingRoutine,
  } = useGetSectionWeeklyRoutineQuery(
    { sectionId, academicYearId },
    { skip: !sectionId }
  );

  const scheduleByDay = useMemo(() => {
    const rawTimetable = routineData?.timetable ?? [];
    const extraDays = rawTimetable
      .filter(
        (d) =>
          !SCHOOL_DAYS_ORDER.includes(d.day) && d.periods && d.periods.length > 0
      )
      .map((d) => d.day);
    const ordered = [...SCHOOL_DAYS_ORDER, ...extraDays];

    return ordered.map((day) => {
      const found = rawTimetable.find((d) => d.day === day);
      const filteredPeriods = [...(found?.periods ?? [])]
        .sort((a, b) => a.periodNumber - b.periodNumber)
        .map((period) => ({
          ...period,
          slots: period.slots.filter(
            (slot) =>
              slot.isBreak ||
              !slot.group ||
              !childGroupId ||
              slot.group.id === childGroupId
          ),
        }));
      return {
        day,
        periods: filteredPeriods,
      };
    });
  }, [routineData?.timetable, childGroupId]);

  type RoutineColumn =
    | {
        kind: 'period';
        key: string;
        periodNumber: number;
        label: string;
        displayTime: string | null;
        isBreak: boolean;
      }
    | {
        kind: 'tiffin';
        key: string;
        label: string;
        displayTime: string;
      };

  const periodColumns: RoutineColumn[] = useMemo(() => {
    const periodMeta = new Map<
      number,
      {
        periodName?: string | null;
        startTime?: string;
        endTime?: string;
        displayTime?: string;
        isBreak?: boolean;
      }
    >();

    for (const dayEntry of scheduleByDay) {
      for (const p of dayEntry.periods) {
        if (!periodMeta.has(p.periodNumber)) {
          periodMeta.set(p.periodNumber, {
            periodName: p.periodName,
            startTime: p.time?.startTime,
            endTime: p.time?.endTime,
            displayTime: p.time?.displayTime,
            isBreak: p.isBreak,
          });
        }
      }
    }

    const sortedNums = Array.from(periodMeta.keys()).sort((a, b) => a - b);
    const cols: RoutineColumn[] = [];

    for (let i = 0; i < sortedNums.length; i++) {
      const num = sortedNums[i];
      const meta = periodMeta.get(num)!;

      if (i > 0) {
        const prevMeta = periodMeta.get(sortedNums[i - 1])!;
        if (
          !prevMeta.isBreak &&
          !meta.isBreak &&
          prevMeta.endTime &&
          meta.startTime &&
          prevMeta.endTime < meta.startTime
        ) {
          cols.push({
            kind: 'tiffin',
            key: `tiffin-${sortedNums[i - 1]}-${num}`,
            label: 'টিফিন বিরতি',
            displayTime: `${to12hDisplay(prevMeta.endTime)} - ${to12hDisplay(meta.startTime)}`,
          });
        }
      }

      cols.push({
        kind: 'period',
        key: `period-${num}`,
        periodNumber: num,
        label:
          meta.periodName ||
          (meta.isBreak ? 'টিফিন বিরতি' : `পিরিয়ড ${formatNumber(num, 'bn')}`),
        displayTime: meta.displayTime || null,
        isBreak: Boolean(meta.isBreak),
      });
    }

    return cols;
  }, [scheduleByDay]);

  const visibleDays = useMemo(
    () =>
      dayFilter === 'ALL'
        ? scheduleByDay
        : scheduleByDay.filter((d) => d.day === dayFilter),
    [scheduleByDay, dayFilter]
  );

  const stats = useMemo(() => {
    const countNonBreak = (periods: SectionTimetablePeriod[]) =>
      periods.filter((p) => !p.isBreak && p.slots.some((s) => !s.isBreak)).length;

    const totalWeekly = scheduleByDay.reduce((s, d) => s + countNonBreak(d.periods), 0);
    const todayEntry = scheduleByDay.find((d) => d.day === todayDay);
    const todayCount = todayEntry ? countNonBreak(todayEntry.periods) : 0;
    const activeDays = scheduleByDay.filter((d) => countNonBreak(d.periods) > 0).length;
    return { totalWeekly, todayCount, activeDays };
  }, [scheduleByDay, todayDay]);

  if (loadingMe || (Boolean(parentId) && loadingParent)) {
    return <LoadingSkeleton rows={6} />;
  }

  const activeClassLabel = activeChild?.currentClass
    ? classNameMap.get(activeChild.currentClass) ?? activeChild.currentClass
    : '';
  const activeChildName = activeChild
    ? activeChild.studentNameBn || activeChild.studentNameEn
    : '';
  const activeGroupLabel = activeChild?.groupName ? ` · ${activeChild.groupName}` : '';

  return (
    <div className="space-y-6">
      <PageHeader
        title={'সাপ্তাহিক ক্লাস রুটিন'}
        description={
          activeChild
            ? `${activeChildName} · ${activeClassLabel}${activeChild.currentSection ? ` (${activeChild.currentSection})` : ''}${activeGroupLabel}${activeChild.academicYear ? ` · শিক্ষাবর্ষ ${activeChild.academicYear}` : ''}`
            : 'দিন ও পিরিয়ড অনুযায়ী শ্রেণির সাপ্তাহিক ক্লাস রুটিন'
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            disabled={!activeChild || stats.totalWeekly === 0}
            onClick={() => setShowPrintModal(true)}
          >
            <Printer className="w-4 h-4" />
            {'প্রিন্ট / PDF (A4)'}
          </Button>
        }
      />

      {!parentId ? (
        <Card className="p-8">
          <EmptyState
            title={'অভিভাবক প্রোফাইল যুক্ত নেই'}
            description={'আপনার অ্যাকাউন্টের সাথে এখনো কোনো অভিভাবক প্রোফাইল লিংক করা হয়নি।'}
          />
        </Card>
      ) : !activeChild ? (
        <Card className="p-8">
          <EmptyState
            title={'কোনো সন্তান লিংক করা নেই'}
            description={'আপনার অভিভাবক প্রোফাইলের সাথে কোনো শিক্ষার্থীর তথ্য যুক্ত করা হলে এখানে তার ক্লাস রুটিন দেখতে পাবেন।'}
          />
        </Card>
      ) : (
        <>
          <ChildSwitcherBar
            childrenList={children}
            selectedStudentId={activeChild.studentId}
            classNameMap={classNameMap}
            onChange={(id) => {
              setSelectedStudentId(id);
              setDayFilter('ALL');
            }}
          />

          {loadingRoutine || fetchingRoutine ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <>
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
                      id="parent-routine-day-filter"
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
              {!sectionId || stats.totalWeekly === 0 ? (
                <Card className="p-8">
                  <EmptyState
                    title={'এই শ্রেণি ও শাখার জন্য কোনো ক্লাস রুটিন পাওয়া যায়নি'}
                    description={
                      'প্রশাসন থেকে ক্লাস রুটিন তৈরি করা হলে এখানে দিন ও পিরিয়ড অনুযায়ী সম্পূর্ণ রুটিন দেখতে পাবেন।'
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
                              key={col.key}
                              className={cn(
                                'px-3 py-3 text-center border-r border-border last:border-r-0',
                                col.kind === 'tiffin' ? 'min-w-[125px] bg-amber-500/[0.06]' : 'min-w-[155px]'
                              )}
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
                        {visibleDays.map(({ day, periods }, dayIdx) => {
                          const dayLabel = ENUM_LABELS.WeekDay?.[day]?.bn ?? day;
                          const isToday = day === todayDay;
                          const classCount = periods.filter(
                            (p) => !p.isBreak && p.slots.some((s) => !s.isBreak)
                          ).length;

                          const byPeriod = new Map<number, SectionTimetablePeriod>();
                          for (const p of periods) {
                            byPeriod.set(p.periodNumber, p);
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
                                  {`${formatNumber(classCount, 'bn')}টি ক্লাস`}
                                </p>
                              </td>

                              {periodColumns.map((col) => {
                                if (col.kind === 'tiffin') {
                                  if (dayIdx > 0) return null;
                                  return (
                                    <td
                                      key={col.key}
                                      rowSpan={visibleDays.length}
                                      className="p-2 border-r border-border last:border-r-0 align-middle text-center bg-amber-500/[0.06]"
                                    >
                                      <div className="flex flex-col items-center justify-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-400">
                                        <Coffee className="w-4 h-4" />
                                        <span>{'টিফিন'}</span>
                                      </div>
                                    </td>
                                  );
                                }

                                const periodObj = byPeriod.get(col.periodNumber);
                                const slots = periodObj?.slots ?? [];

                                return (
                                  <td
                                    key={col.key}
                                    className="p-2 border-r border-border last:border-r-0"
                                  >
                                    {!periodObj || slots.length === 0 ? (
                                      periodObj?.isBreak || col.isBreak ? (
                                        <div className="h-[80px] rounded-lg border border-dashed border-amber-500/30 bg-amber-500/[0.05] flex flex-col items-center justify-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                          <Coffee className="w-3.5 h-3.5" />
                                          <span>{'বিরতি'}</span>
                                        </div>
                                      ) : (
                                        <div className="h-[80px] rounded-lg border border-dashed border-border/70 bg-surface-muted/20 flex items-center justify-center text-xs text-muted-foreground/70">
                                          {'—'}
                                        </div>
                                      )
                                    ) : (
                                      <div className="space-y-2">
                                        {slots.map((slot) =>
                                          slot.isBreak ? (
                                            <div
                                              key={slot.routineId}
                                              className="h-[80px] rounded-lg border border-dashed border-amber-500/30 bg-amber-500/[0.05] flex flex-col items-center justify-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400"
                                            >
                                              <Coffee className="w-3.5 h-3.5" />
                                              <span>{'বিরতি'}</span>
                                            </div>
                                          ) : (
                                            <div
                                              key={slot.routineId}
                                              className="min-h-[80px] rounded-lg border border-primary/25 bg-primary/[0.06] p-2.5 flex flex-col justify-between gap-1.5"
                                            >
                                              <div>
                                                <p className="text-sm font-bold text-foreground leading-snug">
                                                  {slot.subject?.name || 'বিষয়'}
                                                </p>
                                                <p className="text-xs font-medium text-primary mt-0.5 truncate">
                                                  {slot.teacher?.name || 'শিক্ষক নির্ধারিত নয়'}
                                                </p>
                                              </div>

                                              {slot.room && (
                                                <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground pt-1 border-t border-primary/15">
                                                  <DoorOpen className="w-3.5 h-3.5" />
                                                  <span>{slot.room}</span>
                                                </div>
                                              )}
                                            </div>
                                          )
                                        )}
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
            </>
          )}
        </>
      )}

      {/* Landscape A4 Print / PDF Modal */}
      <Modal
        open={showPrintModal && Boolean(activeChild) && stats.totalWeekly > 0}
        onClose={() => setShowPrintModal(false)}
        title={'সাপ্তাহিক ক্লাস রুটিন (A4 প্রিন্ট / PDF)'}
        maxWidth="max-w-6xl"
      >
        {activeChild && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2 print:hidden">
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
                titleBn={'শ্রেণির সাপ্তাহিক ক্লাস রুটিন'}
                titleEn={'Class Weekly Routine'}
                subtitleBn={`${activeChildName} · ${activeClassLabel}${activeChild.currentSection ? ` (${activeChild.currentSection})` : ''}${activeGroupLabel}${activeChild.academicYear ? ` · শিক্ষাবর্ষ ${activeChild.academicYear}` : ''}`}
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
                          key={`print-head-${col.key}`}
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
                    {visibleDays.map(({ day, periods }, dayIdx) => {
                      const dayLabel = ENUM_LABELS.WeekDay?.[day]?.bn ?? day;
                      const byPeriod = new Map<number, SectionTimetablePeriod>();
                      for (const p of periods) {
                        byPeriod.set(p.periodNumber, p);
                      }

                      return (
                        <tr key={`print-${day}`}>
                          <td className="border border-[#18181B] px-2 py-2 font-bold bg-[#FAFAFA] align-top">
                            {dayLabel}
                          </td>
                          {periodColumns.map((col) => {
                            if (col.kind === 'tiffin') {
                              if (dayIdx > 0) return null;
                              return (
                                <td
                                  key={`print-${day}-${col.key}`}
                                  rowSpan={visibleDays.length}
                                  className="border border-[#18181B] px-2 py-2 align-middle text-center font-bold text-[#111111] bg-[#FAFAFA]"
                                >
                                  {'টিফিন'}
                                </td>
                              );
                            }

                            const periodObj = byPeriod.get(col.periodNumber);
                            const slots = periodObj?.slots ?? [];
                            return (
                              <td
                                key={`print-${day}-${col.key}`}
                                className="border border-[#18181B] px-2 py-1.5 align-top"
                              >
                                {!periodObj || slots.length === 0 ? (
                                  <div className="text-center text-[#71717A]">
                                    {periodObj?.isBreak || col.isBreak ? 'বিরতি' : '—'}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {slots.map((slot) =>
                                      slot.isBreak ? (
                                        <div
                                          key={`print-${slot.routineId}`}
                                          className="text-center text-[#71717A]"
                                        >
                                          {'বিরতি'}
                                        </div>
                                      ) : (
                                        <div key={`print-${slot.routineId}`}>
                                          <div className="font-bold text-[#111111]">
                                            {slot.subject?.name || 'বিষয়'}
                                          </div>
                                          <div className="text-[10px] text-[#3F3F46]">
                                            {slot.teacher?.name || '—'}
                                          </div>
                                          {slot.room && (
                                            <div className="text-[10px] text-[#52525B]">
                                              {slot.room}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    )}
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
        )}
      </Modal>
    </div>
  );
}
