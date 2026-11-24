'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Download,
  LogIn,
  LogOut,
  Radio,
  Search,
  Settings,
  UserX,
} from 'lucide-react';
import {
  useSaveAttendanceBatchMutation,
  useSimulateRfidScanMutation,
} from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import { closedDay, latestOpenDay, localToday } from '@/src/lib/schoolDay';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv } from '@/src/lib/utils/cn';
import { DataTable, type DataColumn } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import {
  AttendanceMethod,
  AttendanceStatus,
  CardStatus,
  EnrollmentStatus,
  StudentStatus,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage, formatScanDateTime } from './attendanceShared';

type GateTab = 'missing' | 'scans';

export function GateMonitor({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const auth = useAppSelector((state) => state.auth);
  const [simulate, { isLoading: scanning }] = useSimulateRfidScanMutation();
  const [saveBatch, { isLoading: savingAbsent }] = useSaveAttendanceBatchMutation();

  const today = useMemo(() => localToday(), []);
  const defaultOpenDate = useMemo(
    () => (closedDay(db, today, yearId) ? latestOpenDay(db, yearId, today) : today),
    [db, today, yearId]
  );

  const [date, setDate] = useState(defaultOpenDate);
  const [cardNumber, setCardNumber] = useState('');
  const [lastFeedback, setLastFeedback] = useState<{
    message: string;
    recorded: boolean;
    cardNumber: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<GateTab>('missing');
  const [classFilter, setClassFilter] = useState('ALL');
  const [missingSearch, setMissingSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');
  const [knownFilter, setKnownFilter] = useState<'ALL' | 'KNOWN' | 'UNKNOWN'>('ALL');

  const blocked = closedDay(db, date, yearId);

  const rfidClassIds = useMemo(
    () =>
      new Set(
        db.classAttendanceConfigs
          .filter((item) => item.method === AttendanceMethod.RFID)
          .map((item) => item.classId)
      ),
    [db.classAttendanceConfigs]
  );

  const studentById = useMemo(
    () => new Map(db.students.map((s) => [s.id, s])),
    [db.students]
  );

  const classById = useMemo(
    () => new Map(db.classes.map((c) => [c.id, c])),
    [db.classes]
  );

  const sectionById = useMemo(
    () => new Map(db.sections.map((s) => [s.id, s])),
    [db.sections]
  );

  const activeCardByStudent = useMemo(() => {
    const map = new Map<string, string>();
    db.rfidCards.forEach((c) => {
      if (c.status === CardStatus.ACTIVE) map.set(c.studentId, c.cardNumber);
    });
    return map;
  }, [db.rfidCards]);

  // All active enrollments in RFID-enabled classes
  const rfidEnrollments = useMemo(
    () =>
      db.enrollments
        .filter(
          (enr) =>
            enr.academicYearId === yearId &&
            enr.status === EnrollmentStatus.ACTIVE &&
            rfidClassIds.has(enr.classId) &&
            studentById.get(enr.studentId)?.status === StudentStatus.ACTIVE
        )
        .sort((a, b) => {
          const ca = classById.get(a.classId)?.numericValue ?? 0;
          const cb = classById.get(b.classId)?.numericValue ?? 0;
          if (ca !== cb) return ca - cb;
          return a.roll - b.roll;
        }),
    [db.enrollments, yearId, rfidClassIds, studentById, classById]
  );

  const attendanceByEnrollment = useMemo(() => {
    const map = new Map<string, MockDatabase['attendances'][number]>();
    db.attendances.forEach((att) => {
      if (att.date === date) map.set(att.studentEnrollmentId, att);
    });
    return map;
  }, [db.attendances, date]);

  // Quick-select active cards across the school (RFID classes listed first)
  const selectableCards = useMemo(() => {
    return db.rfidCards
      .filter((c) => c.status === CardStatus.ACTIVE)
      .map((card) => {
        const student = studentById.get(card.studentId);
        const enr = db.enrollments.find(
          (e) =>
            e.studentId === card.studentId &&
            e.academicYearId === yearId &&
            e.status === EnrollmentStatus.ACTIVE
        );
        const cls = enr ? classById.get(enr.classId) : undefined;
        const sec = enr ? sectionById.get(enr.sectionId) : undefined;
        const isRfidClass = enr ? rfidClassIds.has(enr.classId) : false;
        return {
          cardNumber: card.cardNumber,
          studentName:
            locale === 'bn'
              ? student?.nameBn || student?.nameEn || card.studentId
              : student?.nameEn || student?.nameBn || card.studentId,
          classLabel: cls
            ? `${locale === 'bn' ? cls.nameBn || cls.name : cls.name}${sec ? ` (${sec.name})` : ''}`
            : pick('ভর্তি নেই', 'No enrollment'),
          isRfidClass,
        };
      })
      .sort((a, b) => Number(b.isRfidClass) - Number(a.isRfidClass));
  }, [db.rfidCards, db.enrollments, yearId, studentById, classById, sectionById, rfidClassIds, locale, pick]);

  // Metrics for KPI strip
  const stats = useMemo(() => {
    let entered = 0;
    let late = 0;
    let absent = 0;
    let leave = 0;
    let pending = 0;
    let cardsAssigned = 0;

    rfidEnrollments.forEach((enr) => {
      if (activeCardByStudent.has(enr.studentId)) cardsAssigned += 1;
      const att = attendanceByEnrollment.get(enr.id);
      if (!att) pending += 1;
      else if (att.status === AttendanceStatus.PRESENT) entered += 1;
      else if (att.status === AttendanceStatus.LATE) {
        entered += 1;
        late += 1;
      } else if (att.status === AttendanceStatus.ABSENT) absent += 1;
      else if (att.status === AttendanceStatus.LEAVE) leave += 1;
    });

    const entryRate =
      rfidEnrollments.length > 0 ? Math.round((entered / rfidEnrollments.length) * 100) : 0;

    return {
      total: rfidEnrollments.length,
      cardsAssigned,
      entered,
      late,
      absent,
      leave,
      pending,
      entryRate,
    };
  }, [rfidEnrollments, activeCardByStudent, attendanceByEnrollment]);

  // Students who have NOT entered (neither PRESENT, LATE, nor LEAVE)
  const missingRows = useMemo(() => {
    const q = missingSearch.trim().toLowerCase();
    return rfidEnrollments
      .filter((enr) => {
        const att = attendanceByEnrollment.get(enr.id);
        if (
          att &&
          (att.status === AttendanceStatus.PRESENT ||
            att.status === AttendanceStatus.LATE ||
            att.status === AttendanceStatus.LEAVE)
        ) {
          return false;
        }
        if (classFilter !== 'ALL' && enr.classId !== classFilter) return false;
        if (!q) return true;
        const stu = studentById.get(enr.studentId);
        const card = activeCardByStudent.get(enr.studentId) ?? '';
        return (
          String(enr.roll).includes(q) ||
          (stu?.nameBn ?? '').toLowerCase().includes(q) ||
          (stu?.nameEn ?? '').toLowerCase().includes(q) ||
          (stu?.studentId ?? '').toLowerCase().includes(q) ||
          card.toLowerCase().includes(q)
        );
      })
      .map((enr) => {
        const stu = studentById.get(enr.studentId);
        const cls = classById.get(enr.classId);
        const sec = sectionById.get(enr.sectionId);
        const att = attendanceByEnrollment.get(enr.id);
        return {
          enrollment: enr,
          student: stu,
          classLabel: `${locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name} (${sec?.name ?? ''})`,
          cardNumber: activeCardByStudent.get(enr.studentId) ?? null,
          isMarkedAbsent: att?.status === AttendanceStatus.ABSENT,
        };
      });
  }, [
    rfidEnrollments,
    attendanceByEnrollment,
    classFilter,
    missingSearch,
    studentById,
    classById,
    sectionById,
    activeCardByStudent,
    locale,
  ]);

  const filteredScans = useMemo(() => {
    return db.rfidScans.filter((scan) => {
      if (directionFilter !== 'ALL' && scan.direction !== directionFilter) return false;
      if (knownFilter === 'KNOWN' && !scan.isKnownCard) return false;
      if (knownFilter === 'UNKNOWN' && scan.isKnownCard) return false;
      return true;
    });
  }, [db.rfidScans, directionFilter, knownFilter]);

  const handleScan = async (direction: 'ENTRY' | 'EXIT', overrideCard?: string) => {
    const code = (overrideCard ?? cardNumber).trim();
    if (!code) {
      toast.error(pick('কার্ড নম্বর লিখুন বা নির্বাচন করুন।', 'Enter or select an RFID card number.'));
      return;
    }
    try {
      const res = await simulate({ cardNumber: code, direction, date }).unwrap();
      const msg = res.message || pick('স্ক্যান সম্পন্ন।', 'Scan processed.');
      setLastFeedback({ message: msg, recorded: Boolean(res.recorded), cardNumber: code });
      if (res.recorded) {
        toast.success(msg);
      } else {
        toast.warning(msg);
      }
      if (!overrideCard) setCardNumber('');
    } catch (err) {
      toast.error(errorMessage(err, pick('কার্ড স্ক্যান করা যায়নি।', 'Scan failed.')));
    }
  };

  const handleMarkSingleAbsent = async (enrollmentId: string) => {
    if (blocked) {
      toast.error(blocked);
      return;
    }
    try {
      const res = await saveBatch({
        date,
        academicYearId: yearId,
        markedBy: auth.user?.id || 'user-admin',
        entries: [
          {
            studentEnrollmentId: enrollmentId,
            status: AttendanceStatus.ABSENT,
            method: AttendanceMethod.RFID,
            remarks: pick('গেটে স্ক্যান পাওয়া যায়নি', 'No gate scan detected'),
          },
        ],
      }).unwrap();
      toast.success(
        pick(
          `অনুপস্থিত চিহ্নিত করা হয়েছে${res.smsQueued ? ' · অভিভাবককে SMS পাঠানো হয়েছে' : ''}।`,
          `Marked absent${res.smsQueued ? ' · Guardian SMS sent' : ''}.`
        )
      );
    } catch (err) {
      toast.error(errorMessage(err, pick('অনুপস্থিত চিহ্নিত করা যায়নি।', 'Could not mark absent.')));
    }
  };

  const handleMarkAllPendingAbsent = async () => {
    if (blocked) {
      toast.error(blocked);
      return;
    }
    const pending = missingRows.filter((r) => !r.isMarkedAbsent);
    if (!pending.length) {
      toast.info(pick('অপেক্ষমাণ কোনো শিক্ষার্থী বাকি নেই।', 'No pending students left to mark absent.'));
      return;
    }
    try {
      const res = await saveBatch({
        date,
        academicYearId: yearId,
        markedBy: auth.user?.id || 'user-admin',
        entries: pending.map((row) => ({
          studentEnrollmentId: row.enrollment.id,
          status: AttendanceStatus.ABSENT,
          method: AttendanceMethod.RFID,
          remarks: pick('গেটে স্ক্যান পাওয়া যায়নি', 'No gate scan detected'),
        })),
      }).unwrap();
      toast.success(
        pick(
          `${formatNumber(res.saved, 'bn')} জনকে অনুপস্থিত চিহ্নিত করা হয়েছে · ${formatNumber(res.smsQueued, 'bn')} টি SMS পাঠানো হয়েছে।`,
          `Marked ${res.saved} students absent · ${res.smsQueued} SMS alerts sent.`
        )
      );
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ করা যায়নি।', 'Batch absent update failed.')));
    }
  };

  const handleExportScans = () => {
    if (!filteredScans.length) return;
    exportToCsv(
      filteredScans.map((s) => ({
        time: formatScanDateTime(s.scannedAt),
        cardNumber: s.cardNumber,
        studentName: s.studentName ?? pick('অপরিচিত কার্ড', 'Unknown card'),
        className: s.className ?? '—',
        direction: s.direction,
        status: s.isKnownCard ? pick('পরিচিত', 'Recognized') : pick('অপরিচিত', 'Unknown'),
        device: s.deviceLocation,
      })),
      `rfid-gate-scans-${date}.csv`,
      [
        { key: 'time', label: pick('সময়', 'Timestamp') },
        { key: 'cardNumber', label: pick('কার্ড নম্বর', 'Card Number') },
        { key: 'studentName', label: pick('শিক্ষার্থী', 'Student') },
        { key: 'className', label: pick('শ্রেণি ও শাখা', 'Class & Section') },
        { key: 'direction', label: pick('দিক', 'Direction') },
        { key: 'status', label: pick('যাচাই', 'Status') },
        { key: 'device', label: pick('ডিভাইস', 'Reader') },
      ]
    );
  };

  const scanColumns: DataColumn<MockDatabase['rfidScans'][number]>[] = [
    {
      id: 'scannedAt',
      accessorKey: 'scannedAt',
      header: pick('সময়', 'Time'),
      cell: ({ row }) => (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {formatScanDateTime(row.original.scannedAt)}
        </span>
      ),
    },
    {
      id: 'cardNumber',
      accessorKey: 'cardNumber',
      header: pick('কার্ড নম্বর', 'Card Number'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-foreground">
          {row.original.cardNumber}
        </span>
      ),
    },
    {
      id: 'student',
      accessorKey: 'studentName',
      header: pick('শিক্ষার্থী', 'Student'),
      cell: ({ row }) =>
        row.original.studentId ? (
          <Link
            href={`/admin/students/${row.original.studentId}#attendance`}
            className="font-medium text-foreground hover:text-primary"
          >
            {row.original.studentName}
          </Link>
        ) : (
          <span className="text-destructive font-medium">
            {pick('অপরিচিত কার্ড', 'Unregistered card')}
          </span>
        ),
    },
    {
      id: 'className',
      accessorKey: 'className',
      header: pick('শ্রেণি', 'Class'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.className || '—'}</span>
      ),
    },
    {
      id: 'direction',
      accessorKey: 'direction',
      header: pick('দিক', 'Direction'),
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium',
            row.original.direction === 'ENTRY'
              ? 'bg-success/10 text-success'
              : 'bg-info/10 text-info'
          )}
        >
          {row.original.direction === 'ENTRY' ? (
            <ArrowDownLeft className="w-3 h-3" />
          ) : (
            <ArrowUpRight className="w-3 h-3" />
          )}
          {row.original.direction === 'ENTRY'
            ? pick('প্রবেশ', 'Entry')
            : pick('প্রস্থান', 'Exit')}
        </span>
      ),
    },
    {
      id: 'device',
      accessorKey: 'deviceLocation',
      header: pick('ডিভাইস', 'Reader'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.deviceLocation}</span>
      ),
    },
    {
      id: 'known',
      header: pick('অবস্থা', 'Verification'),
      cell: ({ row }) => (
        <StatusBadge
          value={row.original.isKnownCard ? 'ACTIVE' : 'REJECTED'}
          customLabel={
            row.original.isKnownCard
              ? pick('পরিচিত কার্ড', 'Recognized')
              : pick('অপরিচিত', 'Unregistered')
          }
          customTone={row.original.isKnownCard ? 'success' : 'destructive'}
        />
      ),
    },
  ];

  const rfidClasses = useMemo(
    () => db.classes.filter((c) => rfidClassIds.has(c.id)),
    [db.classes, rfidClassIds]
  );

  return (
    <div className="space-y-5">
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('RFID শ্রেণির শিক্ষার্থী', 'RFID-Enabled Students')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(stats.total, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `সক্রিয় কার্ড ${formatNumber(stats.cardsAssigned, 'bn')}/${formatNumber(stats.total, 'bn')} · ${formatNumber(rfidClasses.length, 'bn')} টি শ্রেণি`,
              `${stats.cardsAssigned}/${stats.total} active cards · ${rfidClasses.length} class(es)`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('প্রবেশ নথিভুক্ত', 'Entered Today')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-success">
            {formatNumber(stats.entered, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `উপস্থিতির হার ${formatNumber(stats.entryRate, 'bn')}%`,
              `Entry rate ${stats.entryRate}%`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('দেরিতে প্রবেশ', 'Late Arrivals')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-warning">
            {formatNumber(stats.late, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pick('নির্ধারিত সময়ের পর স্ক্যান', 'Scanned after late threshold')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('প্রবেশ বাকি / অনুপস্থিত', 'Not Entered / Absent')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-destructive">
            {formatNumber(stats.pending + stats.absent, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `অপেক্ষমাণ ${formatNumber(stats.pending, 'bn')} · অনুপস্থিত ${formatNumber(stats.absent, 'bn')}`,
              `Pending ${stats.pending} · Absent ${stats.absent}`
            )}
          </p>
        </Card>
      </div>

      {/* RFID Gate Reader & Simulator Workstation */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              {pick('গেট রিডার ও কার্ড স্ক্যানার', 'Gate Reader & Card Scanner')}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{pick('তারিখ:', 'Date:')}</span>
              <Input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-36 h-8 text-xs tabular-nums"
              />
            </div>
            <Link
              href="/admin/students/rfid-cards"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {pick('কার্ড তালিকা', 'Manage cards')}
            </Link>
            <Link
              href="/admin/attendance/settings"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              {pick('RFID শ্রেণি সেটিংস', 'RFID classes')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-sm font-bold text-foreground block">
              {pick('কার্ড নম্বর স্ক্যান / টাইপ করুন (Enter = প্রবেশ)', 'Scan or type card number (Enter = Entry)')}
            </label>
            <Input
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleScan('ENTRY');
                }
              }}
              placeholder="RFID-10-8841"
              className="font-mono h-10 text-base"
            />
          </div>

          <div className="md:col-span-5 space-y-1.5">
            <label className="text-sm font-bold text-foreground block">
              {pick('অথবা তালিকা থেকে সক্রিয় কার্ড বাছাই করুন', 'Or pick an active student card')}
            </label>
            <Select
              value={selectableCards.some((c) => c.cardNumber === cardNumber) ? cardNumber : ''}
              onChange={(e) => setCardNumber(e.target.value)}
              className="h-10 text-base font-semibold"
            >
              <option value="">{pick('সক্রিয় কার্ড নির্বাচন করুন...', 'Select active RFID card...')}</option>
              {selectableCards.map((c) => (
                <option key={c.cardNumber} value={c.cardNumber}>
                  {c.cardNumber} — {c.studentName} · {c.classLabel}{' '}
                  {c.isRfidClass ? '[RFID]' : pick('[হাতে]', '[Manual]')}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1 h-9"
              disabled={scanning}
              onClick={() => handleScan('ENTRY')}
            >
              <LogIn className="w-4 h-4" />
              {pick('প্রবেশ', 'Entry')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9"
              disabled={scanning}
              onClick={() => handleScan('EXIT')}
            >
              <LogOut className="w-4 h-4" />
              {pick('প্রস্থান', 'Exit')}
            </Button>
          </div>
        </div>

        {lastFeedback && (
          <div
            className={cn(
              'rounded-[var(--radius)] border px-3.5 py-2.5 text-sm flex items-center justify-between gap-3',
              lastFeedback.recorded
                ? 'border-success/30 bg-success/10 text-foreground'
                : 'border-warning/40 bg-warning/10 text-foreground'
            )}
          >
            <div>
              <span className="font-mono text-xs font-semibold mr-2">{lastFeedback.cardNumber}</span>
              <span>{lastFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setLastFeedback(null)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {pick('বন্ধ', 'Dismiss')}
            </button>
          </div>
        )}

        {blocked && (
          <div className="rounded-[var(--radius)] border border-warning/40 bg-warning/10 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <strong>{blocked}</strong>{' '}
              {pick('বন্ধ তারিখে স্ক্যান শুধু লগ হবে, হাজিরা নথিভুক্ত হবে না।', 'Scans on a closed day are logged but do not mark attendance.')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDate(latestOpenDay(db, yearId, today))}
            >
              {pick('সর্বশেষ খোলা দিন', 'Latest open day')}
            </Button>
          </div>
        )}
      </Card>

      {/* Workspace Tabs: Not Entered Yet vs Live Gate Scan Log */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="inline-flex rounded-[var(--radius)] border border-border bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('missing')}
            className={cn(
              'px-3.5 py-1.5 rounded-[calc(var(--radius)-2px)] text-sm font-medium transition-colors cursor-pointer',
              activeTab === 'missing'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {pick('প্রবেশ বাকি / অনুপস্থিত', 'Not Entered / Absent')} (
            {formatNumber(missingRows.length, locale)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scans')}
            className={cn(
              'px-3.5 py-1.5 rounded-[calc(var(--radius)-2px)] text-sm font-medium transition-colors cursor-pointer',
              activeTab === 'scans'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {pick('গেট স্ক্যান লগ', 'Gate Scan Feed')} ({formatNumber(db.rfidScans.length, locale)})
          </button>
        </div>

        {activeTab === 'missing' && missingRows.some((r) => !r.isMarkedAbsent) && !blocked && (
          <Button
            variant="outline"
            size="sm"
            disabled={savingAbsent}
            onClick={handleMarkAllPendingAbsent}
          >
            <UserX className="w-4 h-4" />
            {pick('বাকি সবাইকে অনুপস্থিত চিহ্নিত করুন', 'Mark all pending absent')}
          </Button>
        )}

        {activeTab === 'scans' && (
          <Button variant="outline" size="sm" onClick={handleExportScans} disabled={!filteredScans.length}>
            <Download className="w-4 h-4" />
            {pick('CSV ডাউনলোড', 'Export CSV')}
          </Button>
        )}
      </div>

      {/* Tab 1: Missing / Pending RFID Students */}
      {activeTab === 'missing' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={missingSearch}
                onChange={(e) => setMissingSearch(e.target.value)}
                placeholder={pick('রোল, নাম বা কার্ড খুঁজুন...', 'Search roll, name, or card...')}
                className="pl-9 h-9"
              />
            </div>
            {rfidClasses.length > 1 && (
              <Select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-44 h-9"
              >
                <option value="ALL">{pick('সব RFID শ্রেণি', 'All RFID classes')}</option>
                {rfidClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {locale === 'bn' ? cls.nameBn || cls.name : cls.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/60 text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4 w-16">{pick('রোল', 'Roll')}</th>
                    <th className="py-3 px-4">{pick('শিক্ষার্থী', 'Student')}</th>
                    <th className="py-3 px-4">{pick('শ্রেণি ও শাখা', 'Class & Section')}</th>
                    <th className="py-3 px-4">{pick('RFID কার্ড', 'RFID Card')}</th>
                    <th className="py-3 px-4">{pick('অবস্থা', 'Status')}</th>
                    <th className="py-3 px-4 text-right">{pick('দ্রুত কার্যক্রম', 'Quick Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rfidEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center text-muted-foreground">
                        {pick(
                          'কোনো শ্রেণিতে RFID পদ্ধতি চালু নেই। পদ্ধতি ও নিয়ম থেকে RFID চালু করুন।',
                          'No classes are configured for RFID attendance yet. Enable RFID in Method & Rules.'
                        )}
                      </td>
                    </tr>
                  ) : missingRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center text-success font-medium">
                        {pick(
                          'RFID শ্রেণির সকল শিক্ষার্থী প্রবেশ করেছে বা ছুটি নথিভুক্ত আছে।',
                          'All RFID-class students have entered or are on approved leave.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    missingRows.map((row) => (
                      <tr key={row.enrollment.id} className="hover:bg-surface-muted/30">
                        <td className="py-2.5 px-4 font-mono font-semibold tabular-nums">
                          {formatNumber(row.enrollment.roll, locale)}
                        </td>
                        <td className="py-2.5 px-4">
                          <Link
                            href={`/admin/students/${row.enrollment.studentId}#attendance`}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {locale === 'bn'
                              ? row.student?.nameBn || row.student?.nameEn
                              : row.student?.nameEn || row.student?.nameBn}
                          </Link>
                          <p className="text-xs text-muted-foreground font-mono">
                            {row.student?.studentId}
                          </p>
                        </td>
                        <td className="py-2.5 px-4 text-muted-foreground">{row.classLabel}</td>
                        <td className="py-2.5 px-4 font-mono text-xs">
                          {row.cardNumber ? (
                            <span className="text-foreground">{row.cardNumber}</span>
                          ) : (
                            <Link
                              href="/admin/students/rfid-cards"
                              className="text-warning hover:underline"
                            >
                              {pick('কার্ড ইস্যু নেই', 'Unassigned')}
                            </Link>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {row.isMarkedAbsent ? (
                            <StatusBadge enumName="AttendanceStatus" value={AttendanceStatus.ABSENT} />
                          ) : (
                            <span className="text-sm font-semibold text-muted-foreground">
                              {pick('স্ক্যান অপেক্ষমাণ', 'Awaiting scan')}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {row.cardNumber && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={Boolean(blocked) || scanning}
                                onClick={() => handleScan('ENTRY', row.cardNumber!)}
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                {pick('প্রবেশ', 'Punch in')}
                              </Button>
                            )}
                            {!row.isMarkedAbsent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={Boolean(blocked) || savingAbsent}
                                onClick={() => handleMarkSingleAbsent(row.enrollment.id)}
                              >
                                {pick('অনুপস্থিত', 'Absent')}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* Tab 2: Live Gate Scan Log */
        <DataTable
          data={filteredScans}
          columns={scanColumns}
          searchPlaceholder={pick('কার্ড, শিক্ষার্থী বা শ্রেণি খুঁজুন...', 'Search card, student, or class...')}
          pageSize={15}
          emptyTitle={pick('এখনো কোনো RFID গেট স্ক্যান নেই', 'No RFID gate scans recorded')}
          toolbarExtra={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value as 'ALL' | 'ENTRY' | 'EXIT')}
                className="w-32 h-9"
              >
                <option value="ALL">{pick('সব দিক', 'All directions')}</option>
                <option value="ENTRY">{pick('প্রবেশ', 'Entry')}</option>
                <option value="EXIT">{pick('প্রস্থান', 'Exit')}</option>
              </Select>
              <Select
                value={knownFilter}
                onChange={(e) => setKnownFilter(e.target.value as 'ALL' | 'KNOWN' | 'UNKNOWN')}
                className="w-36 h-9"
              >
                <option value="ALL">{pick('সব কার্ড', 'All cards')}</option>
                <option value="KNOWN">{pick('পরিচিত কার্ড', 'Recognized')}</option>
                <option value="UNKNOWN">{pick('অপরিচিত কার্ড', 'Unregistered')}</option>
              </Select>
            </div>
          }
        />
      )}
    </div>
  );
}
