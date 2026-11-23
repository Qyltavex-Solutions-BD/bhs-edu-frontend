'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Calendar,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Download,
  RotateCcw,
  Save,
  Search,
  Settings,
  UserX,
} from 'lucide-react';
import { useSaveAttendanceBatchMutation } from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import { useSearchParams } from '@/src/lib/navigation';
import { closedDay, latestOpenDay, localToday } from '@/src/lib/schoolDay';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv } from '@/src/lib/utils/cn';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import {
  AttendanceMethod,
  AttendanceStatus,
  CardStatus,
  EnrollmentStatus,
  StudentStatus,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import {
  attendanceRateTone,
  errorMessage,
  formatClockTime,
  getStatusLabel,
  shiftOpenDay,
  STATUS_OPTIONS,
} from './attendanceShared';

type StatusFilter = 'ALL' | AttendanceStatus | 'UNMARKED';

export function DailyRegister({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const auth = useAppSelector((state) => state.auth);
  const [params] = useSearchParams();
  const [saveBatch, { isLoading }] = useSaveAttendanceBatchMutation();

  const today = useMemo(() => localToday(), []);
  const defaultOpenDate = useMemo(
    () => (closedDay(db, today, yearId) ? latestOpenDay(db, yearId, today) : today),
    [db, today, yearId]
  );

  const [date, setDate] = useState(() => params.get('date') || defaultOpenDate);
  const initialClass = params.get('classId') || db.classes[0]?.id || '';
  const [classId, setClassId] = useState(initialClass);
  const [sectionId, setSectionId] = useState(
    params.get('sectionId') || db.sections.find((item) => item.classId === initialClass)?.id || ''
  );

  const [draftStatus, setDraftStatus] = useState<Record<string, AttendanceStatus>>({});
  const [draftRemarks, setDraftRemarks] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showMatrix, setShowMatrix] = useState(true);

  const sections = useMemo(
    () => db.sections.filter((item) => item.classId === classId),
    [db.sections, classId]
  );
  const activeSectionId = sections.some((item) => item.id === sectionId)
    ? sectionId
    : sections[0]?.id ?? '';

  const classConfig = useMemo(
    () => db.classAttendanceConfigs.find((item) => item.classId === classId),
    [db.classAttendanceConfigs, classId]
  );
  const method = classConfig?.method ?? AttendanceMethod.MANUAL;
  const manual = method !== AttendanceMethod.RFID;
  const autoSmsOnAbsent = classConfig?.autoSmsOnAbsent ?? true;
  const blocked = closedDay(db, date, yearId);

  useEffect(() => {
    setDraftStatus({});
    setDraftRemarks({});
  }, [date, activeSectionId, yearId]);

  // Index today's attendance records by studentEnrollmentId for O(1) lookup
  const attendanceByEnrollment = useMemo(() => {
    const map = new Map<string, MockDatabase['attendances'][number]>();
    db.attendances.forEach((item) => {
      if (item.date === date) map.set(item.studentEnrollmentId, item);
    });
    return map;
  }, [db.attendances, date]);

  const studentById = useMemo(() => {
    const map = new Map(db.students.map((s) => [s.id, s]));
    return map;
  }, [db.students]);

  const activeCardByStudent = useMemo(() => {
    const map = new Map<string, string>();
    db.rfidCards.forEach((c) => {
      if (c.status === CardStatus.ACTIVE) map.set(c.studentId, c.cardNumber);
    });
    return map;
  }, [db.rfidCards]);

  // School-wide section completion matrix for the selected date & academic year
  const sectionMatrix = useMemo(() => {
    const activeEnrollments = db.enrollments.filter(
      (enr) =>
        enr.academicYearId === yearId &&
        enr.status === EnrollmentStatus.ACTIVE &&
        studentById.get(enr.studentId)?.status === StudentStatus.ACTIVE
    );

    const rows = db.classes
      .slice()
      .sort((a, b) => a.numericValue - b.numericValue)
      .flatMap((cls) => {
        const clsSections = db.sections.filter((s) => s.classId === cls.id);
        const clsMethod =
          db.classAttendanceConfigs.find((cfg) => cfg.classId === cls.id)?.method ??
          AttendanceMethod.MANUAL;
        return clsSections.map((sec) => {
          const secEnrollments = activeEnrollments.filter(
            (e) => e.classId === cls.id && e.sectionId === sec.id
          );
          let marked = 0;
          let presentOrLate = 0;
          secEnrollments.forEach((e) => {
            const att = attendanceByEnrollment.get(e.id);
            if (att) {
              marked += 1;
              if (att.status === AttendanceStatus.PRESENT || att.status === AttendanceStatus.LATE) {
                presentOrLate += 1;
              }
            }
          });
          return {
            classId: cls.id,
            classLabel: locale === 'bn' ? cls.nameBn || cls.name : cls.name,
            sectionId: sec.id,
            sectionLabel: sec.name,
            method: clsMethod,
            total: secEnrollments.length,
            marked,
            presentOrLate,
            complete: secEnrollments.length > 0 && marked === secEnrollments.length,
          };
        });
      })
      .filter((r) => r.total > 0);

    const completedCount = rows.filter((r) => r.complete).length;
    const totalStudents = rows.reduce((s, r) => s + r.total, 0);
    const totalMarked = rows.reduce((s, r) => s + r.marked, 0);
    const totalPresentOrLate = rows.reduce((s, r) => s + r.presentOrLate, 0);
    const schoolRate = totalMarked > 0 ? Math.round((totalPresentOrLate / totalMarked) * 100) : null;

    return { rows, completedCount, totalSections: rows.length, totalStudents, totalMarked, schoolRate };
  }, [db.classes, db.sections, db.enrollments, db.classAttendanceConfigs, yearId, studentById, attendanceByEnrollment, locale]);

  // Active enrollments for selected class + section
  const enrollments = useMemo(
    () =>
      db.enrollments
        .filter(
          (item) =>
            item.academicYearId === yearId &&
            item.classId === classId &&
            item.sectionId === activeSectionId &&
            item.status === EnrollmentStatus.ACTIVE &&
            studentById.get(item.studentId)?.status === StudentStatus.ACTIVE
        )
        .sort((a, b) => a.roll - b.roll),
    [db.enrollments, yearId, classId, activeSectionId, studentById]
  );

  const statusOf = (enrollmentId: string): AttendanceStatus | undefined => {
    if (draftStatus[enrollmentId]) return draftStatus[enrollmentId];
    return attendanceByEnrollment.get(enrollmentId)?.status;
  };

  const remarksOf = (enrollmentId: string): string => {
    if (enrollmentId in draftRemarks) return draftRemarks[enrollmentId];
    return attendanceByEnrollment.get(enrollmentId)?.remarks ?? '';
  };

  const isRowDirty = (enrollmentId: string): boolean => {
    const saved = attendanceByEnrollment.get(enrollmentId);
    const statusChanged =
      enrollmentId in draftStatus && draftStatus[enrollmentId] !== saved?.status;
    const remarksChanged =
      enrollmentId in draftRemarks &&
      draftRemarks[enrollmentId].trim() !== (saved?.remarks ?? '').trim();
    return statusChanged || remarksChanged;
  };

  const dirtyCount = useMemo(
    () => enrollments.filter((e) => isRowDirty(e.id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enrollments, draftStatus, draftRemarks, attendanceByEnrollment]
  );

  const tally = useMemo(() => {
    return enrollments.reduce(
      (sum, enrollment) => {
        const st = statusOf(enrollment.id);
        if (st === AttendanceStatus.PRESENT) sum.present += 1;
        else if (st === AttendanceStatus.LATE) sum.late += 1;
        else if (st === AttendanceStatus.ABSENT) sum.absent += 1;
        else if (st === AttendanceStatus.LEAVE) sum.leave += 1;
        else sum.open += 1;
        return sum;
      },
      { present: 0, late: 0, absent: 0, leave: 0, open: 0 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollments, draftStatus, attendanceByEnrollment]);

  const markedInSection = enrollments.length - tally.open;
  const sectionRate =
    markedInSection > 0 ? Math.round(((tally.present + tally.late) / markedInSection) * 100) : null;

  const filteredEnrollments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrollments.filter((enr) => {
      const student = studentById.get(enr.studentId);
      const st = statusOf(enr.id);
      if (statusFilter === 'UNMARKED' && st !== undefined) return false;
      if (statusFilter !== 'ALL' && statusFilter !== 'UNMARKED' && st !== statusFilter) return false;
      if (!q) return true;
      const card = activeCardByStudent.get(enr.studentId) ?? '';
      return (
        String(enr.roll).includes(q) ||
        (student?.nameBn ?? '').toLowerCase().includes(q) ||
        (student?.nameEn ?? '').toLowerCase().includes(q) ||
        (student?.studentId ?? '').toLowerCase().includes(q) ||
        card.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollments, search, statusFilter, draftStatus, attendanceByEnrollment, studentById, activeCardByStudent]);

  const prevOpen = useMemo(() => shiftOpenDay(db, date, yearId, -1), [db, date, yearId]);
  const nextOpen = useMemo(() => shiftOpenDay(db, date, yearId, 1), [db, date, yearId]);

  const handleMarkAllPresent = () => {
    const next: Record<string, AttendanceStatus> = {};
    enrollments.forEach((enr) => {
      next[enr.id] = AttendanceStatus.PRESENT;
    });
    setDraftStatus(next);
  };

  const handleMarkUnmarkedAbsent = () => {
    const next: Record<string, AttendanceStatus> = { ...draftStatus };
    let marked = 0;
    enrollments.forEach((enr) => {
      if (!statusOf(enr.id)) {
        next[enr.id] = AttendanceStatus.ABSENT;
        marked += 1;
      }
    });
    if (marked === 0) {
      toast.info(pick('অচিহ্নিত কোনো শিক্ষার্থী নেই।', 'No unmarked students remaining.'));
      return;
    }
    setDraftStatus(next);
    toast.info(
      pick(
        `${formatNumber(marked, 'bn')} জনকে অনুপস্থিত চিহ্নিত করা হয়েছে — সংরক্ষণ করুন।`,
        `Marked ${marked} unscanned students absent — click Save to commit.`
      )
    );
  };

  const handleResetDraft = () => {
    setDraftStatus({});
    setDraftRemarks({});
  };

  const handleSave = async () => {
    const entries = enrollments
      .map((enrollment) => ({
        enrollment,
        status: statusOf(enrollment.id),
        remarks: remarksOf(enrollment.id),
      }))
      .filter((row) => (manual ? true : Boolean(row.status)))
      .map((row) => ({
        studentEnrollmentId: row.enrollment.id,
        status: row.status ?? AttendanceStatus.PRESENT,
        method: manual ? AttendanceMethod.MANUAL : AttendanceMethod.RFID,
        remarks: row.remarks,
      }));

    if (!entries.length) {
      toast.error(pick('সংরক্ষণের মতো কোনো হাজিরা সারি নেই।', 'There are no attendance entries to save.'));
      return;
    }

    try {
      const result = await saveBatch({
        date,
        academicYearId: yearId,
        markedBy: auth.user?.id || 'user-admin',
        entries,
      }).unwrap();
      setDraftStatus({});
      setDraftRemarks({});
      toast.success(
        pick(
          `${formatNumber(result.saved, 'bn')} জনের হাজিরা সংরক্ষিত হয়েছে${result.smsQueued ? ` · ${formatNumber(result.smsQueued, 'bn')} টি অনুপস্থিতি এসএমএস পাঠানো হয়েছে` : ''}।`,
          `Saved ${result.saved} attendance records${result.smsQueued ? ` · ${result.smsQueued} absent SMS queued` : ''}.`
        )
      );
    } catch (err) {
      toast.error(errorMessage(err, pick('হাজিরা সংরক্ষণ করা যায়নি।', 'Could not save attendance.')));
    }
  };

  const handleExportCsv = () => {
    if (!enrollments.length) return;
    const cls = db.classes.find((c) => c.id === classId);
    const sec = db.sections.find((s) => s.id === activeSectionId);
    const rows = enrollments.map((enr) => {
      const stu = studentById.get(enr.studentId);
      const saved = attendanceByEnrollment.get(enr.id);
      const st = statusOf(enr.id);
      return {
        date,
        className: cls?.name ?? classId,
        section: sec?.name ?? activeSectionId,
        roll: enr.roll,
        studentId: stu?.studentId ?? '',
        studentName: locale === 'bn' ? stu?.nameBn || stu?.nameEn || '' : stu?.nameEn || '',
        status: getStatusLabel(st, locale),
        inTime: formatClockTime(saved?.inTime),
        outTime: formatClockTime(saved?.outTime),
        method: saved?.method ?? method,
        remarks: remarksOf(enr.id),
      };
    });
    exportToCsv(rows, `daily-attendance-${date}-${cls?.numericValue ?? 'class'}-${sec?.name ?? 'sec'}.csv`, [
      { key: 'date', label: pick('তারিখ', 'Date') },
      { key: 'className', label: pick('শ্রেণি', 'Class') },
      { key: 'section', label: pick('শাখা', 'Section') },
      { key: 'roll', label: pick('রোল', 'Roll') },
      { key: 'studentId', label: pick('আইডি', 'Student ID') },
      { key: 'studentName', label: pick('শিক্ষার্থীর নাম', 'Student Name') },
      { key: 'status', label: pick('অবস্থা', 'Status') },
      { key: 'inTime', label: pick('প্রবেশ', 'In Time') },
      { key: 'outTime', label: pick('প্রস্থান', 'Out Time') },
      { key: 'method', label: pick('পদ্ধতি', 'Method') },
      { key: 'remarks', label: pick('মন্তব্য', 'Remarks') },
    ]);
  };

  return (
    <div className="space-y-5">
      {/* 4-Column Hairline-Divided KPI Strip */}
      <Card className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden p-0">
        <div className="p-4 sm:p-5 bg-surface flex flex-col justify-between gap-1.5">
          <p className="text-base font-bold text-foreground">
            {pick('শাখার উপস্থিতির হার', 'Section Attendance Rate')}
          </p>
          <p className={cn('text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight', attendanceRateTone(sectionRate))}>
            {sectionRate !== null ? `${formatNumber(sectionRate, locale)}%` : '—'}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {pick(
              `উপস্থিত ${formatNumber(tally.present, 'bn')} · দেরি ${formatNumber(tally.late, 'bn')}`,
              `Present ${tally.present} · Late ${tally.late}`
            )}
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-surface flex flex-col justify-between gap-1.5">
          <p className="text-base font-bold text-foreground">
            {pick('অনুপস্থিত ও ছুটি', 'Absent & Leave')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-destructive">
            {formatNumber(tally.absent + tally.leave, locale)}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {pick(
              `অনুপস্থিত ${formatNumber(tally.absent, 'bn')} · ছুটি ${formatNumber(tally.leave, 'bn')}`,
              `Absent ${tally.absent} · Leave ${tally.leave}`
            )}
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-surface flex flex-col justify-between gap-1.5">
          <p className="text-base font-bold text-foreground">
            {pick('অচিহ্নিত / অপেক্ষমাণ', 'Unmarked / Pending')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
            {formatNumber(tally.open, locale)}
          </p>
          <p className="text-sm text-muted-foreground">
            {manual
              ? pick('মোট শিক্ষার্থী: ' + formatNumber(enrollments.length, 'bn'), `Total students: ${enrollments.length}`)
              : pick('গেট স্ক্যান হয়নি', 'Not scanned at gate')}
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-surface flex flex-col justify-between gap-1.5">
          <p className="text-base font-bold text-foreground">
            {pick('বিদ্যালয়ব্যাপী সম্পন্ন শাখা', 'School Sections Marked')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
            {formatNumber(sectionMatrix.completedCount, locale)} / {formatNumber(sectionMatrix.totalSections, locale)}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {sectionMatrix.schoolRate !== null
              ? pick(
                  `সর্বমোট উপস্থিতি ${formatNumber(sectionMatrix.schoolRate, 'bn')}% (${formatNumber(sectionMatrix.totalMarked, 'bn')}/${formatNumber(sectionMatrix.totalStudents, 'bn')})`,
                  `School-wide ${sectionMatrix.schoolRate}% (${sectionMatrix.totalMarked}/${sectionMatrix.totalStudents})`
                )
              : pick('এই তারিখে এখনো হাজিরা নেই', 'No attendance recorded on this date')}
          </p>
        </div>
      </Card>

      {/* School-Wide Section Completion Matrix */}
      <Card className="p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMatrix((v) => !v)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-surface-muted/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold text-foreground">
              {pick('সকল শ্রেণি ও শাখার আজকের অবস্থা', 'School-Wide Section Progress')}
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {pick(
                `(${formatNumber(sectionMatrix.completedCount, 'bn')}/${formatNumber(sectionMatrix.totalSections, 'bn')} শাখা সম্পূর্ণ)`,
                `(${sectionMatrix.completedCount}/${sectionMatrix.totalSections} sections complete)`
              )}
            </span>
          </div>
          {showMatrix ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showMatrix && (
          <div className="px-4 pb-3 pt-1 border-t border-border flex flex-wrap gap-2">
            {sectionMatrix.rows.map((item) => {
              const selected = item.classId === classId && item.sectionId === activeSectionId;
              const dotClass = item.complete
                ? 'bg-success'
                : item.marked > 0
                  ? 'bg-warning'
                  : 'bg-border';
              return (
                <button
                  key={`${item.classId}-${item.sectionId}`}
                  type="button"
                  onClick={() => {
                    setClassId(item.classId);
                    setSectionId(item.sectionId);
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] border text-xs transition-colors cursor-pointer',
                    selected
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background hover:bg-surface-muted text-foreground'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', dotClass)} />
                  <span>
                    {item.classLabel} ({item.sectionLabel})
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatNumber(item.marked, locale)}/{formatNumber(item.total, locale)}
                  </span>
                  {item.method === AttendanceMethod.RFID && (
                    <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-surface-muted text-muted-foreground">
                      RFID
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Controls Toolbar */}
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Date Stepper */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground block">
              {pick('তারিখ', 'Date')}
            </label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-2.5"
                disabled={!prevOpen}
                onClick={() => prevOpen && setDate(prevOpen)}
                title={pick('আগের খোলা দিন', 'Previous open day')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Input
                type="date"
                value={date}
                max={today}
                onChange={(event) => setDate(event.target.value)}
                className="w-40 h-10 text-sm sm:text-base tabular-nums"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-2.5"
                disabled={!nextOpen}
                onClick={() => nextOpen && setDate(nextOpen)}
                title={pick('পরের খোলা দিন', 'Next open day')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              {date !== defaultOpenDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 text-sm font-medium"
                  onClick={() => setDate(defaultOpenDate)}
                >
                  {pick('সর্বশেষ দিন', 'Latest')}
                </Button>
              )}
            </div>
          </div>

          {/* Class Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground block">
              {pick('শ্রেণি', 'Class')}
            </label>
            <Select
              value={classId}
              onChange={(event) => {
                const nextClassId = event.target.value;
                setClassId(nextClassId);
                const firstSec = db.sections.find((s) => s.classId === nextClassId)?.id ?? '';
                setSectionId(firstSec);
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

          {/* Section Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground block">
              {pick('শাখা', 'Section')}
            </label>
            <Select
              value={activeSectionId}
              onChange={(event) => setSectionId(event.target.value)}
              className="w-32 h-10 text-sm sm:text-base font-semibold"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-sm font-semibold text-foreground block">
              {pick('শিক্ষার্থী খুঁজুন', 'Search student')}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={pick('রোল, নাম, আইডি বা RFID...', 'Roll, name, ID or RFID...')}
                className="pl-9 h-10 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground block">
              {pick('অবস্থা ফিল্টার', 'Filter status')}
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-36 h-10 text-sm sm:text-base font-semibold"
            >
              <option value="ALL">{pick('সব অবস্থা', 'All statuses')}</option>
              <option value={AttendanceStatus.PRESENT}>{pick('উপস্থিত', 'Present')}</option>
              <option value={AttendanceStatus.ABSENT}>{pick('অনুপস্থিত', 'Absent')}</option>
              <option value={AttendanceStatus.LATE}>{pick('দেরি', 'Late')}</option>
              <option value={AttendanceStatus.LEAVE}>{pick('ছুটি', 'Leave')}</option>
              <option value="UNMARKED">{pick('অচিহ্নিত', 'Unmarked')}</option>
            </Select>
          </div>
        </div>

        {/* Method Context & Action Bar */}
        <div className="pt-3.5 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-sm">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold shadow-2xs',
                manual
                  ? 'border-border bg-surface-muted text-foreground'
                  : 'border-primary/30 bg-primary/10 text-primary'
              )}
            >
              {manual ? <Calendar className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
              {manual ? pick('পদ্ধতি: হাতে রেজিস্টার', 'Method: Manual Register') : pick('পদ্ধতি: RFID গেট স্ক্যান', 'Method: RFID Gate')}
            </span>
            {classConfig && (
              <span className="text-muted-foreground font-medium tabular-nums">
                {pick(`দেরির সীমা: ${classConfig.lateThresholdTime}`, `Late after: ${classConfig.lateThresholdTime}`)}
              </span>
            )}
            <Link
              href="/admin/attendance/settings"
              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
            >
              <Settings className="w-4 h-4" />
              {pick('পদ্ধতি বদলান', 'Configure')}
            </Link>
            {dirtyCount > 0 && (
              <span className="text-warning font-bold tabular-nums">
                · {pick(`${formatNumber(dirtyCount, 'bn')} টি অসংরক্ষিত পরিবর্তন`, `${dirtyCount} unsaved change(s)`)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {manual && !blocked && (
              <Button variant="outline" size="sm" className="h-10 text-sm font-semibold" onClick={handleMarkAllPresent}>
                <CheckCheck className="w-4 h-4" />
                {pick('সবাই উপস্থিত', 'Mark all present')}
              </Button>
            )}
            {!manual && !blocked && tally.open > 0 && (
              <Button variant="outline" size="sm" className="h-10 text-sm font-semibold" onClick={handleMarkUnmarkedAbsent}>
                <UserX className="w-4 h-4" />
                {pick('বাকিদের অনুপস্থিত', 'Mark unscanned absent')}
              </Button>
            )}
            {dirtyCount > 0 && (
              <Button variant="ghost" size="sm" className="h-10 text-sm font-semibold" onClick={handleResetDraft}>
                <RotateCcw className="w-4 h-4" />
                {pick('রিসেট', 'Reset')}
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-10 text-sm font-semibold" onClick={handleExportCsv} disabled={!enrollments.length}>
              <Download className="w-4 h-4" />
              {pick('CSV', 'CSV')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-10 text-sm font-semibold shadow-xs"
              disabled={Boolean(blocked) || !enrollments.length || isLoading}
              onClick={handleSave}
            >
              <Save className="w-4 h-4" />
              {isLoading ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('হাজিরা সংরক্ষণ', 'Save register')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Closed Day Alert Banner */}
      {blocked && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm sm:text-base text-foreground">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <span>
              <strong>{blocked}</strong>{' '}
              {pick(
                'বন্ধ দিনে হাজিরা সংরক্ষণ করা যায় না। শুধু পূর্বের রেকর্ড দেখা যাচ্ছে।',
                'Attendance cannot be recorded on a closed day.'
              )}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 text-sm font-semibold"
            onClick={() => setDate(latestOpenDay(db, yearId, today))}
          >
            {pick('সর্বশেষ খোলা দিনে যান', 'Jump to latest open day')}
          </Button>
        </div>
      )}

      {/* RFID Auto-SMS Info Hint */}
      {!blocked && autoSmsOnAbsent && (
        <p className="text-sm text-muted-foreground">
          {manual
            ? pick(
                'নোট: অনুপস্থিত চিহ্নিত শিক্ষার্থীদের নিবন্ধিত অভিভাবকের কাছে সংরক্ষণের সাথে সাথে স্বয়ংক্রিয় SMS পাঠানো হবে।',
                'Note: Guardians of students marked Absent receive an automatic SMS alert on save.'
              )
            : pick(
                'RFID শ্রেণি: গেট স্ক্যানের তথ্য এখানে স্বয়ংক্রিয়ভাবে আসে। প্রয়োজনে সংশোধন করে বা বাকিদের অনুপস্থিত চিহ্নিত করে সংরক্ষণ করুন।',
                'RFID class: Gate scans populate automatically. Adjust rows or mark unscanned students absent, then save.'
              )}
        </p>
      )}

      {/* High-Density Register Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16">{pick('রোল', 'Roll')}</th>
                <th className="py-3.5 px-4">{pick('শিক্ষার্থী', 'Student')}</th>
                <th className="py-3.5 px-4 w-44">{pick('প্রবেশ / প্রস্থান', 'In / Out')}</th>
                <th className="py-3.5 px-4">{pick('হাজিরা অবস্থা', 'Attendance Status')}</th>
                <th className="py-3.5 px-4 w-60">{pick('মন্তব্য (ঐচ্ছিক)', 'Remarks')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center text-base text-muted-foreground">
                    {enrollments.length === 0
                      ? pick('এই শাখায় কোনো সক্রিয় শিক্ষার্থী ভর্তি নেই।', 'No active students enrolled in this section.')
                      : pick('ফিল্টারের সাথে মিলে এমন কোনো শিক্ষার্থী পাওয়া যায়নি।', 'No students match your current search or filter.')}
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enrollment) => {
                  const student = studentById.get(enrollment.studentId);
                  const saved = attendanceByEnrollment.get(enrollment.id);
                  const currentStatus = statusOf(enrollment.id);
                  const dirty = isRowDirty(enrollment.id);
                  const cardNo = activeCardByStudent.get(enrollment.studentId);

                  return (
                    <tr
                      key={enrollment.id}
                      className={cn(
                        'transition-colors hover:bg-surface-muted/30',
                        dirty && 'bg-primary/[0.04]'
                      )}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-base tabular-nums text-foreground">
                        {formatNumber(enrollment.roll, locale)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/admin/students/${enrollment.studentId}#attendance`}
                            className="font-semibold text-base text-foreground hover:text-primary transition-colors"
                          >
                            {locale === 'bn'
                              ? student?.nameBn || student?.nameEn
                              : student?.nameEn || student?.nameBn}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono mt-0.5">
                            <span>{student?.studentId}</span>
                            {!manual && (
                              <span>
                                ·{' '}
                                {cardNo ? (
                                  <span className="text-foreground/80">{cardNo}</span>
                                ) : (
                                  <span className="text-warning font-semibold">{pick('কার্ড নেই', 'No card')}</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm tabular-nums text-muted-foreground">
                        {saved?.inTime || saved?.outTime ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-foreground font-semibold">
                              {pick('প্রবেশ:', 'In:')} {formatClockTime(saved?.inTime)}
                            </span>
                            {saved?.outTime && (
                              <span>
                                {pick('প্রস্থান:', 'Out:')} {formatClockTime(saved.outTime)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {STATUS_OPTIONS.map((opt) => {
                            const active = currentStatus === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                disabled={Boolean(blocked)}
                                onClick={() =>
                                  setDraftStatus((prev) => ({
                                    ...prev,
                                    [enrollment.id]: opt.value,
                                  }))
                                }
                                className={cn(
                                  'px-3 py-1.5 rounded-xl text-sm font-bold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                  active
                                    ? opt.on
                                    : 'bg-background border-border text-foreground/80 hover:bg-surface-muted'
                                )}
                              >
                                {locale === 'bn' ? opt.bn : opt.en}
                              </button>
                            );
                          })}
                          {!currentStatus && (
                            <span className="text-sm text-muted-foreground ml-1">
                              {manual ? pick('অচিহ্নিত', 'Unmarked') : pick('স্ক্যান হয়নি', 'Not scanned')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          value={remarksOf(enrollment.id)}
                          disabled={Boolean(blocked)}
                          onChange={(e) =>
                            setDraftRemarks((prev) => ({
                              ...prev,
                              [enrollment.id]: e.target.value,
                            }))
                          }
                          placeholder={pick('কারণ বা নোট...', 'Reason or note...')}
                          className="h-10 text-sm sm:text-base"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
