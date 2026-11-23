'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Download,
  Eye,
  Printer,
  Search,
} from 'lucide-react';
import { latestOpenDay, localToday } from '@/src/lib/schoolDay';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { AttendanceStatus, EnrollmentStatus, StudentStatus } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import { attendanceBarTone, attendanceRateTone } from './attendanceShared';

type ReportViewMode = 'section' | 'summary';

export function AttendanceReports({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const defaultMonth = useMemo(() => {
    const open = latestOpenDay(db, yearId, localToday());
    return open.slice(0, 7);
  }, [db, yearId]);

  const [month, setMonth] = useState(defaultMonth);
  const [viewMode, setViewMode] = useState<ReportViewMode>('section');
  const [classId, setClassId] = useState(db.classes[0]?.id || '');
  const [sectionId, setSectionId] = useState(
    db.sections.find((s) => s.classId === db.classes[0]?.id)?.id || ''
  );
  const [search, setSearch] = useState('');
  const [onlyAtRisk, setOnlyAtRisk] = useState(false);

  const sections = useMemo(
    () => db.sections.filter((item) => item.classId === classId),
    [db.sections, classId]
  );
  const activeSectionId = sections.some((item) => item.id === sectionId)
    ? sectionId
    : sections[0]?.id ?? '';

  const studentById = useMemo(
    () => new Map(db.students.map((s) => [s.id, s])),
    [db.students]
  );

  // Pre-filter attendance records for the selected month & group by enrollmentId
  const monthAttendances = useMemo(
    () => db.attendances.filter((a) => a.date.startsWith(month)),
    [db.attendances, month]
  );

  const recordsByEnrollment = useMemo(() => {
    const map = new Map<string, MockDatabase['attendances']>();
    monthAttendances.forEach((rec) => {
      const list = map.get(rec.studentEnrollmentId);
      if (list) list.push(rec);
      else map.set(rec.studentEnrollmentId, [rec]);
    });
    return map;
  }, [monthAttendances]);

  const activeEnrollmentsInYear = useMemo(
    () =>
      db.enrollments.filter(
        (enr) =>
          enr.academicYearId === yearId &&
          enr.status === EnrollmentStatus.ACTIVE &&
          studentById.get(enr.studentId)?.status === StudentStatus.ACTIVE
      ),
    [db.enrollments, yearId, studentById]
  );

  // Section-detail rows
  const sectionRows = useMemo(() => {
    return activeEnrollmentsInYear
      .filter((enr) => enr.classId === classId && enr.sectionId === activeSectionId)
      .sort((a, b) => a.roll - b.roll)
      .map((enrollment) => {
        const student = studentById.get(enrollment.studentId);
        const records = recordsByEnrollment.get(enrollment.id) ?? [];
        let present = 0;
        let late = 0;
        let absent = 0;
        let leave = 0;
        records.forEach((r) => {
          if (r.status === AttendanceStatus.PRESENT) present += 1;
          else if (r.status === AttendanceStatus.LATE) late += 1;
          else if (r.status === AttendanceStatus.ABSENT) absent += 1;
          else if (r.status === AttendanceStatus.LEAVE) leave += 1;
        });
        const totalDays = records.length;
        const rate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : null;
        return {
          enrollment,
          student,
          present,
          late,
          absent,
          leave,
          totalDays,
          rate,
          isAtRisk: rate !== null && rate < 75,
          isPerfect: totalDays > 0 && rate === 100,
        };
      });
  }, [activeEnrollmentsInYear, classId, activeSectionId, studentById, recordsByEnrollment]);

  // School-wide class/section summary rows
  const summaryRows = useMemo(() => {
    return db.classes
      .slice()
      .sort((a, b) => a.numericValue - b.numericValue)
      .flatMap((cls) => {
        const clsSections = db.sections.filter((s) => s.classId === cls.id);
        return clsSections.map((sec) => {
          const secEnrs = activeEnrollmentsInYear.filter(
            (e) => e.classId === cls.id && e.sectionId === sec.id
          );
          let present = 0;
          let late = 0;
          let absent = 0;
          let leave = 0;
          let atRiskCount = 0;
          let perfectCount = 0;
          const uniqueDates = new Set<string>();

          secEnrs.forEach((enr) => {
            const recs = recordsByEnrollment.get(enr.id) ?? [];
            let stuPresent = 0;
            let stuLate = 0;
            recs.forEach((r) => {
              uniqueDates.add(r.date);
              if (r.status === AttendanceStatus.PRESENT) {
                present += 1;
                stuPresent += 1;
              } else if (r.status === AttendanceStatus.LATE) {
                late += 1;
                stuLate += 1;
              } else if (r.status === AttendanceStatus.ABSENT) absent += 1;
              else if (r.status === AttendanceStatus.LEAVE) leave += 1;
            });
            if (recs.length > 0) {
              const r = Math.round(((stuPresent + stuLate) / recs.length) * 100);
              if (r < 75) atRiskCount += 1;
              if (r === 100) perfectCount += 1;
            }
          });

          const totalMarks = present + late + absent + leave;
          const avgRate =
            totalMarks > 0 ? Math.round(((present + late) / totalMarks) * 100) : null;

          return {
            classId: cls.id,
            sectionId: sec.id,
            classLabel: locale === 'bn' ? cls.nameBn || cls.name : cls.name,
            sectionLabel: sec.name,
            studentCount: secEnrs.length,
            workingDays: uniqueDates.size,
            present,
            late,
            absent,
            leave,
            atRiskCount,
            perfectCount,
            avgRate,
          };
        });
      })
      .filter((r) => r.studentCount > 0);
  }, [db.classes, db.sections, activeEnrollmentsInYear, recordsByEnrollment, locale]);

  // Filtered section rows
  const filteredSectionRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sectionRows.filter((row) => {
      if (onlyAtRisk && !row.isAtRisk) return false;
      if (!q) return true;
      return (
        String(row.enrollment.roll).includes(q) ||
        (row.student?.nameBn ?? '').toLowerCase().includes(q) ||
        (row.student?.nameEn ?? '').toLowerCase().includes(q) ||
        (row.student?.studentId ?? '').toLowerCase().includes(q)
      );
    });
  }, [sectionRows, search, onlyAtRisk]);

  // KPI metrics (adaptive to Section Detail vs School Summary)
  const kpi = useMemo(() => {
    if (viewMode === 'section') {
      const uniqueDates = new Set<string>();
      sectionRows.forEach((r) => {
        (recordsByEnrollment.get(r.enrollment.id) ?? []).forEach((rec) => uniqueDates.add(rec.date));
      });
      const totalPresentLate = sectionRows.reduce((s, r) => s + r.present + r.late, 0);
      const totalDaysMarks = sectionRows.reduce((s, r) => s + r.totalDays, 0);
      const avgRate =
        totalDaysMarks > 0 ? Math.round((totalPresentLate / totalDaysMarks) * 100) : null;
      const atRisk = sectionRows.filter((r) => r.isAtRisk).length;
      const perfect = sectionRows.filter((r) => r.isPerfect).length;
      return {
        avgRate,
        workingDays: uniqueDates.size,
        atRisk,
        perfect,
        studentCount: sectionRows.length,
      };
    }
    const uniqueDates = new Set(monthAttendances.map((a) => a.date));
    const totalPresentLate = summaryRows.reduce((s, r) => s + r.present + r.late, 0);
    const totalMarks = summaryRows.reduce((s, r) => s + r.present + r.late + r.absent + r.leave, 0);
    const avgRate = totalMarks > 0 ? Math.round((totalPresentLate / totalMarks) * 100) : null;
    const atRisk = summaryRows.reduce((s, r) => s + r.atRiskCount, 0);
    const perfect = summaryRows.reduce((s, r) => s + r.perfectCount, 0);
    const studentCount = summaryRows.reduce((s, r) => s + r.studentCount, 0);
    return {
      avgRate,
      workingDays: uniqueDates.size,
      atRisk,
      perfect,
      studentCount,
    };
  }, [viewMode, sectionRows, summaryRows, recordsByEnrollment, monthAttendances]);

  const handleExportCsv = () => {
    if (viewMode === 'section') {
      if (!filteredSectionRows.length) return;
      const cls = db.classes.find((c) => c.id === classId);
      const sec = db.sections.find((s) => s.id === activeSectionId);
      exportToCsv(
        filteredSectionRows.map((r) => ({
          month,
          className: cls?.name ?? classId,
          section: sec?.name ?? activeSectionId,
          roll: r.enrollment.roll,
          studentId: r.student?.studentId ?? '',
          studentName: locale === 'bn' ? r.student?.nameBn || r.student?.nameEn || '' : r.student?.nameEn || '',
          workingDays: r.totalDays,
          present: r.present,
          late: r.late,
          absent: r.absent,
          leave: r.leave,
          rate: r.rate !== null ? `${r.rate}%` : '—',
        })),
        `attendance-report-${month}-${cls?.numericValue ?? 'class'}-${sec?.name ?? 'sec'}.csv`,
        [
          { key: 'month', label: pick('মাস', 'Month') },
          { key: 'className', label: pick('শ্রেণি', 'Class') },
          { key: 'section', label: pick('শাখা', 'Section') },
          { key: 'roll', label: pick('রোল', 'Roll') },
          { key: 'studentId', label: pick('আইডি', 'Student ID') },
          { key: 'studentName', label: pick('শিক্ষার্থীর নাম', 'Student Name') },
          { key: 'workingDays', label: pick('কার্যদিবস', 'Working Days') },
          { key: 'present', label: pick('উপস্থিত', 'Present') },
          { key: 'late', label: pick('দেরি', 'Late') },
          { key: 'absent', label: pick('অনুপস্থিত', 'Absent') },
          { key: 'leave', label: pick('ছুটি', 'Leave') },
          { key: 'rate', label: pick('উপস্থিতির হার', 'Attendance %') },
        ]
      );
      return;
    }

    if (!summaryRows.length) return;
    exportToCsv(
      summaryRows.map((r) => ({
        month,
        className: r.classLabel,
        section: r.sectionLabel,
        students: r.studentCount,
        workingDays: r.workingDays,
        present: r.present,
        late: r.late,
        absent: r.absent,
        leave: r.leave,
        atRisk: r.atRiskCount,
        avgRate: r.avgRate !== null ? `${r.avgRate}%` : '—',
      })),
      `attendance-school-summary-${month}.csv`,
      [
        { key: 'month', label: pick('মাস', 'Month') },
        { key: 'className', label: pick('শ্রেণি', 'Class') },
        { key: 'section', label: pick('শাখা', 'Section') },
        { key: 'students', label: pick('শিক্ষার্থী', 'Students') },
        { key: 'workingDays', label: pick('কার্যদিবস', 'Working Days') },
        { key: 'present', label: pick('উপস্থিত', 'Present') },
        { key: 'late', label: pick('দেরি', 'Late') },
        { key: 'absent', label: pick('অনুপস্থিত', 'Absent') },
        { key: 'leave', label: pick('ছুটি', 'Leave') },
        { key: 'atRisk', label: pick('<৭৫% ঝুঁকিপূর্ণ', '<75% At-Risk') },
        { key: 'avgRate', label: pick('গড় হার', 'Avg Rate') },
      ]
    );
  };

  return (
    <div className="space-y-5">
      {/* 4-Column Hairline-Divided KPI Strip */}
      <Card className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden p-0">
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
          <p className="text-base font-bold text-foreground">
            {viewMode === 'section'
              ? pick('শাখার গড় উপস্থিতি', 'Section Avg Attendance')
              : pick('বিদ্যালয়ের গড় উপস্থিতি', 'School Avg Attendance')}
          </p>
          <p className={cn('text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight', attendanceRateTone(kpi.avgRate))}>
            {kpi.avgRate !== null ? `${formatNumber(kpi.avgRate, locale)}%` : '—'}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {pick(
              `মোট ${formatNumber(kpi.studentCount, 'bn')} জন শিক্ষার্থী`,
              `${kpi.studentCount} active students`
            )}
          </p>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
          <p className="text-base font-bold text-foreground">
            {pick('মোট কার্যদিবস', 'Recorded School Days')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
            {formatNumber(kpi.workingDays, locale)}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {pick(`নির্বাচিত মাস: ${month}`, `Month: ${month}`)}
          </p>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
          <p className="text-base font-bold text-foreground">
            {pick('৭৫%-এর নিচে ঝুঁকিপূর্ণ', 'Below 75% (At-Risk)')}
          </p>
          <p
            className={cn(
              'text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight',
              kpi.atRisk > 0 ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatNumber(kpi.atRisk, locale)}
          </p>
          <p className="text-sm text-muted-foreground">
            {pick('অভিভাবকের সাথে যোগাযোগ প্রয়োজন', 'Requires attendance follow-up')}
          </p>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
          <p className="text-base font-bold text-foreground">
            {pick('শতভাগ উপস্থিতি (১০০%)', '100% Perfect Attendance')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-success">
            {formatNumber(kpi.perfect, locale)}
          </p>
          <p className="text-sm text-muted-foreground">
            {pick('কোনো অনুপস্থিতি বা ছুটি নেই', 'Zero absences in selected month')}
          </p>
        </div>
      </Card>

      {/* Filter & View Mode Toolbar */}
      <Card className="p-4 sm:p-5 space-y-3.5 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setViewMode('section')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm sm:text-base font-semibold transition-all cursor-pointer',
                viewMode === 'section'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {pick('শাখাভিত্তিক বিস্তারিত', 'Section Detail')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm sm:text-base font-semibold transition-all cursor-pointer',
                viewMode === 'summary'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {pick('সকল শ্রেণির সারসংক্ষেপ', 'All Classes Summary')}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-10 text-sm font-semibold" onClick={handleExportCsv}>
              <Download className="w-4 h-4" />
              {pick('CSV ডাউনলোড', 'Export CSV')}
            </Button>
            <Button variant="outline" size="sm" className="h-10 text-sm font-semibold" onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {pick('প্রিন্ট', 'Print')}
            </Button>
          </div>
        </div>

        <div className="pt-3.5 border-t border-border flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground block">
              {pick('মাস', 'Month')}
            </label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-44 h-10 text-sm sm:text-base tabular-nums"
            />
          </div>

          {viewMode === 'section' && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground block">
                  {pick('শ্রেণি', 'Class')}
                </label>
                <Select
                  value={classId}
                  onChange={(e) => {
                    const nextClassId = e.target.value;
                    setClassId(nextClassId);
                    setSectionId(db.sections.find((s) => s.classId === nextClassId)?.id ?? '');
                  }}
                  className="w-40 h-10 text-sm sm:text-base font-semibold"
                >
                  {db.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {locale === 'bn' ? cls.nameBn || cls.name : cls.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground block">
                  {pick('শাখা', 'Section')}
                </label>
                <Select
                  value={activeSectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-32 h-10 text-sm sm:text-base font-semibold"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <label className="text-sm font-semibold text-foreground block">
                  {pick('শিক্ষার্থী খুঁজুন', 'Search student')}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={pick('রোল, নাম বা আইডি...', 'Roll, name or ID...')}
                    className="pl-9 h-10 text-sm sm:text-base"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOnlyAtRisk((v) => !v)}
                className={cn(
                  'h-10 px-3.5 rounded-2xl border text-sm font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer',
                  onlyAtRisk
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-border bg-background text-foreground hover:bg-surface-muted'
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                {pick('শুধু <৭৫% ঝুঁকিপূর্ণ', 'Only <75% At-Risk')}
              </button>
            </>
          )}
        </div>
      </Card>

      {/* Report Table */}
      {viewMode === 'section' ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">{pick('রোল', 'Roll')}</th>
                  <th className="py-3 px-4">{pick('শিক্ষার্থী', 'Student')}</th>
                  <th className="py-3 px-4 text-right">{pick('কার্যদিবস', 'Days')}</th>
                  <th className="py-3 px-4 text-right">{pick('উপস্থিত', 'Present')}</th>
                  <th className="py-3 px-4 text-right">{pick('দেরি', 'Late')}</th>
                  <th className="py-3 px-4 text-right">{pick('অনুপস্থিত', 'Absent')}</th>
                  <th className="py-3 px-4 text-right">{pick('ছুটি', 'Leave')}</th>
                  <th className="py-3 px-4 w-44">{pick('উপস্থিতির হার', 'Attendance %')}</th>
                  <th className="py-3 px-4 text-right no-print">{pick('প্রোফাইল', 'Profile')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSectionRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 px-4 text-center text-muted-foreground">
                      {onlyAtRisk
                        ? pick('এই শাখায় ৭৫%-এর নিচে কোনো শিক্ষার্থী নেই।', 'No students below 75% attendance in this section.')
                        : pick('এই শাখায় কোনো তথ্য পাওয়া যায়নি।', 'No attendance records found for this section.')}
                    </td>
                  </tr>
                ) : (
                  filteredSectionRows.map((row) => (
                    <tr
                      key={row.enrollment.id}
                      className={cn(
                        'hover:bg-surface-muted/30 transition-colors',
                        row.isAtRisk && 'bg-destructive/[0.03]'
                      )}
                    >
                      <td className="py-2.5 px-4 font-mono font-medium tabular-nums">
                        {formatNumber(row.enrollment.roll, locale)}
                      </td>
                      <td className="py-2.5 px-4">
                        <Link
                          href={`/admin/students/${row.enrollment.studentId}#attendance`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {locale === 'bn'
                            ? row.student?.nameBn || row.student?.nameEn
                            : row.student?.nameEn || row.student?.nameBn}
                        </Link>
                        <p className="text-sm text-muted-foreground font-mono">
                          {row.student?.studentId}
                        </p>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">
                        {formatNumber(row.totalDays, locale)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium text-success">
                        {formatNumber(row.present, locale)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium text-warning">
                        {formatNumber(row.late, locale)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium text-destructive">
                        {formatNumber(row.absent, locale)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-info">
                        {formatNumber(row.leave, locale)}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', attendanceBarTone(row.rate))}
                              style={{ width: `${row.rate ?? 0}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              'w-12 text-right text-sm font-semibold tabular-nums',
                              attendanceRateTone(row.rate)
                            )}
                          >
                            {row.rate !== null ? `${formatNumber(row.rate, locale)}%` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right no-print">
                        <Link
                          href={`/admin/students/${row.enrollment.studentId}#attendance`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                        >
                          <Eye className="w-4 h-4" />
                          {pick('দেখুন', 'View')}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">{pick('শ্রেণি ও শাখা', 'Class & Section')}</th>
                  <th className="py-3 px-4 text-right">{pick('শিক্ষার্থী', 'Students')}</th>
                  <th className="py-3 px-4 text-right">{pick('কার্যদিবস', 'Days')}</th>
                  <th className="py-3 px-4 text-right">{pick('উপস্থিত + দেরি', 'Present + Late')}</th>
                  <th className="py-3 px-4 text-right">{pick('অনুপস্থিত', 'Absent')}</th>
                  <th className="py-3 px-4 text-right">{pick('<৭৫% ঝুঁকি', '<75% Risk')}</th>
                  <th className="py-3 px-4 w-48">{pick('গড় উপস্থিতি', 'Avg Rate')}</th>
                  <th className="py-3 px-4 text-right no-print">{pick('বিস্তারিত', 'Inspect')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summaryRows.map((row) => (
                  <tr key={`${row.classId}-${row.sectionId}`} className="hover:bg-surface-muted/30">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {row.classLabel}{' '}
                      <span className="text-muted-foreground font-normal">({row.sectionLabel})</span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">
                      {formatNumber(row.studentCount, locale)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">
                      {formatNumber(row.workingDays, locale)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-success font-medium">
                      {formatNumber(row.present + row.late, locale)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium text-destructive">
                      {formatNumber(row.absent, locale)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span
                        className={cn(
                          'font-medium',
                          row.atRiskCount > 0 ? 'text-destructive' : 'text-muted-foreground'
                        )}
                      >
                        {formatNumber(row.atRiskCount, locale)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', attendanceBarTone(row.avgRate))}
                            style={{ width: `${row.avgRate ?? 0}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            'w-12 text-right text-sm font-semibold tabular-nums',
                            attendanceRateTone(row.avgRate)
                          )}
                        >
                          {row.avgRate !== null ? `${formatNumber(row.avgRate, locale)}%` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right no-print">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-sm font-semibold"
                        onClick={() => {
                          setClassId(row.classId);
                          setSectionId(row.sectionId);
                          setViewMode('section');
                        }}
                      >
                        {pick('শাখা দেখুন', 'Inspect')}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
