'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Download,
  Radio,
  Search,
  Settings,
  UserX,
} from 'lucide-react';
import { useSaveAttendanceBatchMutation } from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import { closedDay, latestOpenDay, localToday } from '@/src/lib/schoolDay';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv } from '@/src/lib/utils/cn';
import { DataTable, type DataColumn } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
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

export function GateMonitor({
  db,
  yearId,
  embedded = false,
}: {
  db: MockDatabase;
  yearId: string;
  embedded?: boolean;
}) {
  const { locale, pick } = useI18n();
  const auth = useAppSelector((state) => state.auth);
  const [saveBatch, { isLoading: savingBatch }] = useSaveAttendanceBatchMutation();

  const today = useMemo(() => localToday(), []);
  const defaultOpenDate = useMemo(
    () => (closedDay(db, today, yearId) ? latestOpenDay(db, yearId, today) : today),
    [db, today, yearId]
  );

  const [date, setDate] = useState(defaultOpenDate);
  const [confirmAbsentOpen, setConfirmAbsentOpen] = useState(false);
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

  const handleMarkSinglePresent = async (enrollmentId: string) => {
    if (blocked) {
      toast.error(blocked);
      return;
    }
    try {
      await saveBatch({
        date,
        academicYearId: yearId,
        markedBy: auth.user?.id || 'user-admin',
        entries: [
          {
            studentEnrollmentId: enrollmentId,
            status: AttendanceStatus.PRESENT,
            method: AttendanceMethod.MANUAL,
            remarks: pick('ম্যানুয়াল উপস্থিতি (গেট ফল্ট/কার্ড অনুপস্থিত)', 'Manual present (device fault / no card)'),
          },
        ],
      }).unwrap();
      toast.success(pick('ম্যানুয়ালি উপস্থিত চিহ্নিত করা হয়েছে।', 'Marked present manually.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('উপস্থিত চিহ্নিত করা যায়নি।', 'Could not mark present.')));
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
      {/* 4-Column KPI Strip (hidden when embedded in DailyRegister) */}
      {!embedded && (
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
      )}

      {/* Production RFID Gate Device Status Bar */}
      <Card className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
              <Radio className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {pick('লাইভ RFID গেট রিডার মনিটর', 'Live RFID Gate Reader Monitor')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {pick(
                  'গেটে কার্ড পাঞ্চ করলে স্বয়ংক্রিয়ভাবে উপস্থিতি ও বিলম্ব নথিভুক্ত হয়। ডিভাইস ত্রুটি হলে নিচ থেকে ম্যানুয়ালি মার্ক করুন।',
                  'Gate card punches automatically record Present or Late status. Use manual override below if a device faults.'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{pick('তারিখ:', 'Date:')}</span>
              <Input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-40 h-9 text-sm tabular-nums"
              />
            </div>
            <Link
              href="/admin/students/rfid-cards"
              className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
            >
              <CreditCard className="w-4 h-4" />
              {pick('কার্ড তালিকা', 'Manage cards')}
            </Link>
            <Link
              href="/admin/attendance/settings"
              className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
            >
              <Settings className="w-4 h-4" />
              {pick('সময় ও SMS নিয়ম', 'Time & SMS rules')}
            </Link>
          </div>
        </div>

        {blocked && (
          <div className="rounded-[var(--radius)] border border-warning/40 bg-warning/10 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
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
            disabled={savingBatch}
            onClick={() => setConfirmAbsentOpen(true)}
          >
            <UserX className="w-4 h-4" />
            {pick('বাকি সবাইকে অনুপস্থিত চিহ্নিত করুন ও SMS পাঠান', 'Mark pending absent & send SMS')}
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
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[720px] lg:min-w-full text-base">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/60 text-left text-sm font-semibold text-muted-foreground">
                    <th className="py-3 px-4 w-16 whitespace-nowrap">{pick('রোল', 'Roll')}</th>
                    <th className="py-3 px-4 whitespace-nowrap">{pick('শিক্ষার্থী', 'Student')}</th>
                    <th className="py-3 px-4 whitespace-nowrap">{pick('শ্রেণি ও শাখা', 'Class & Section')}</th>
                    <th className="py-3 px-4 whitespace-nowrap">{pick('RFID কার্ড', 'RFID Card')}</th>
                    <th className="py-3 px-4 whitespace-nowrap">{pick('অবস্থা', 'Status')}</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">{pick('দ্রুত কার্যক্রম', 'Quick Actions')}</th>
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
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={Boolean(blocked) || savingBatch}
                              onClick={() => handleMarkSinglePresent(row.enrollment.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 text-success" />
                              {pick('উপস্থিত (ম্যানুয়াল)', 'Present (Manual)')}
                            </Button>
                            {!row.isMarkedAbsent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={Boolean(blocked) || savingBatch}
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

      {/* Centered Confirmation Modal for Batch Absent + SMS */}
      <Modal
        open={confirmAbsentOpen}
        onClose={() => !savingBatch && setConfirmAbsentOpen(false)}
        title={pick('অনুপস্থিত নিশ্চিত ও SMS পাঠান', 'Confirm Pending Absent & Send SMS')}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-warning/40 bg-warning/10">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {pick(
                  `অপেক্ষমাণ ${formatNumber(missingRows.filter((r) => !r.isMarkedAbsent).length, 'bn')} জন শিক্ষার্থীকে অনুপস্থিত চিহ্নিত করতে চান?`,
                  `Mark ${missingRows.filter((r) => !r.isMarkedAbsent).length} pending student(s) as absent?`
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {pick(
                  'নিশ্চিত করলে তাদের অভিভাবকের নম্বরে স্বয়ংক্রিয় অনুপস্থিতির SMS পাঠানো হবে। গেটের RFID ডিভাইস সচল ছিল কিনা নিশ্চিত হয়ে নিন।',
                  'Guardian absent SMS alerts will be sent immediately. Make sure the gate RFID reader was working properly.'
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={savingBatch}
              onClick={() => setConfirmAbsentOpen(false)}
            >
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={savingBatch}
              onClick={async () => {
                await handleMarkAllPendingAbsent();
                setConfirmAbsentOpen(false);
              }}
            >
              {savingBatch
                ? pick('সংরক্ষণ হচ্ছে...', 'Processing...')
                : pick('নিশ্চিত ও SMS পাঠান', 'Confirm & Send SMS')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
