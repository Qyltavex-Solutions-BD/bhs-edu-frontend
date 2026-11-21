'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';
import {
  useGetBootstrapQuery,
  useRetryAttendanceSmsMutation,
  useSaveAttendanceBatchMutation,
  useSimulateRfidScanMutation,
  useUpdateAttendanceConfigMutation,
} from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import { useAcademicYearSelection } from '@/src/views/admin/AcademicFoundation';
import { AttendanceShell } from '@/src/views/admin/AttendanceShell';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { triggerPrint } from '@/src/lib/utils/cn';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, FormField, Input, Modal, Select, Switch } from '@/src/components/ui/primitives';
import { AcademicEventType, AttendanceMethod, AttendanceStatus, EnrollmentStatus, SmsStatus, StudentStatus } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { ClassAttendanceMethodConfig } from '@/src/types/proposed/future';

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

function closedDay(db: MockDatabase, date: string, yearId: string) {
  if (!date) return '';
  if (date > new Date().toISOString().slice(0, 10)) return 'আগামী তারিখে হাজিরা হয় না।';
  const weekday = new Date(`${date}T12:00:00`).getDay();
  if (weekday === 5 || weekday === 6) return 'শুক্র ও শনিবার বিদ্যালয় বন্ধ।';
  const holiday = db.academicEvents.find(
    (event) =>
      event.academicYearId === yearId &&
      event.eventType === AcademicEventType.HOLIDAY &&
      event.startDate.slice(0, 10) <= date &&
      event.endDate.slice(0, 10) >= date
  );
  return holiday ? `ছুটি: ${holiday.title}` : '';
}

const STATUS_OPTIONS = [
  { value: AttendanceStatus.PRESENT, bn: 'উপস্থিত', en: 'Present', on: 'bg-success text-white border-success' },
  { value: AttendanceStatus.ABSENT, bn: 'অনুপস্থিত', en: 'Absent', on: 'bg-destructive text-white border-destructive' },
  { value: AttendanceStatus.LATE, bn: 'দেরি', en: 'Late', on: 'bg-warning text-white border-warning' },
  { value: AttendanceStatus.LEAVE, bn: 'ছুটি', en: 'Leave', on: 'bg-info text-white border-info' },
];

export function AdminAttendancePage({
  defaultTab = 'daily',
}: {
  defaultTab?: 'daily' | 'reports' | 'sms' | 'settings' | 'gate';
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  const year = useAcademicYearSelection(db?.academicYears);
  if (isLoading || !db || !year) return <LoadingSkeleton />;

  const copy = {
    daily: {
      title: pick('দৈনিক হাজিরা', 'Daily register'),
      description: pick('এক শাখা, এক তারিখ। হাতের শ্রেণিতে সবাইকে চিহ্নিত করে সংরক্ষণ। RFID শ্রেণিতে শুধু সংশোধন।', 'One section, one date. Mark a manual class, or correct an RFID class.'),
    },
    gate: {
      title: pick('গেট', 'Gate'),
      description: pick('সক্রিয় RFID কার্ড দিয়ে প্রবেশ ও প্রস্থান। হাতের শ্রেণির কার্ড এখানে হাজিরা করে না।', 'Entry and exit with an active RFID card. A manual class is not marked here.'),
    },
    reports: {
      title: pick('উপস্থিতির হিসাব', 'Attendance report'),
      description: pick('এক মাসে এক শাখার উপস্থিত, দেরি, অনুপস্থিত ও ছুটি।', 'Present, late, absent, and leave for one section in one month.'),
    },
    sms: {
      title: pick('হাজিরার এসএমএস', 'Attendance SMS'),
      description: pick('অভিভাবকের কাছে যাওয়া বার্তা। ব্যর্থ হলে আবার পাঠানো যায়।', 'Messages sent to guardians. A failed message can be sent again.'),
    },
    settings: {
      title: pick('হাজিরার পদ্ধতি', 'Attendance method'),
      description: pick('শ্রেণিভেদে হাত অথবা RFID। দেরির সময় ও কোন বার্তা যাবে।', 'Each class is manual or RFID, with a late time and which messages go out.'),
    },
  }[defaultTab];

  return (
    <AttendanceShell title={copy.title} description={copy.description} years={db.academicYears} selectedYear={year} showYear={defaultTab !== 'sms' && defaultTab !== 'settings'}>
      {defaultTab === 'daily' && <Register db={db} yearId={year.id} />}
      {defaultTab === 'gate' && <Gate db={db} />}
      {defaultTab === 'reports' && <Report db={db} yearId={year.id} />}
      {defaultTab === 'sms' && <SmsLog db={db} />}
      {defaultTab === 'settings' && <Settings db={db} />}
    </AttendanceShell>
  );
}

function Register({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const auth = useAppSelector((state) => state.auth);
  const [saveBatch, { isLoading }] = useSaveAttendanceBatchMutation();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classId, setClassId] = useState(db.classes[0]?.id ?? '');
  const [sectionId, setSectionId] = useState(db.sections.find((item) => item.classId === db.classes[0]?.id)?.id ?? '');
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const sections = db.sections.filter((item) => item.classId === classId);
  const section = sections.some((item) => item.id === sectionId) ? sectionId : sections[0]?.id ?? '';
  const method = db.classAttendanceConfigs.find((item) => item.classId === classId)?.method ?? AttendanceMethod.MANUAL;
  const manual = method !== AttendanceMethod.RFID;
  const blocked = closedDay(db, date, yearId);

  useEffect(() => {
    setDraft({});
  }, [date, section, yearId]);

  const enrollments = useMemo(
    () =>
      db.enrollments
        .filter(
          (item) =>
            item.academicYearId === yearId &&
            item.classId === classId &&
            item.sectionId === section &&
            item.status === EnrollmentStatus.ACTIVE &&
            db.students.some((student) => student.id === item.studentId && student.status === StudentStatus.ACTIVE)
        )
        .sort((a, b) => a.roll - b.roll),
    [db, yearId, classId, section]
  );

  const statusOf = (id: string) => {
    if (draft[id]) return draft[id];
    return db.attendances.find((item) => item.studentEnrollmentId === id && item.date === date)?.status;
  };

  const save = async () => {
    const entries = enrollments
      .map((enrollment) => ({ enrollment, status: statusOf(enrollment.id) }))
      .filter((row) => (manual ? true : Boolean(row.status)))
      .map((row) => ({
        studentEnrollmentId: row.enrollment.id,
        status: row.status ?? AttendanceStatus.PRESENT,
        method: manual ? AttendanceMethod.MANUAL : AttendanceMethod.RFID,
      }));
    if (!entries.length) {
      toast.error(pick('সংরক্ষণের মতো সারি নেই।', 'Nothing to save.'));
      return;
    }
    try {
      const result = await saveBatch({ date, academicYearId: yearId, markedBy: auth.user?.id ?? 'user-admin', entries }).unwrap();
      toast.success(pick(`${formatNumber(result.saved, 'bn')} জনের হাজিরা সংরক্ষিত। এসএমএস ${formatNumber(result.smsQueued, 'bn')}।`, `Saved ${result.saved}. SMS ${result.smsQueued}.`));
      setDraft({});
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ হয়নি।', 'Could not save attendance.')));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-end gap-3">
        <FormField label={pick('তারিখ', 'Date')}>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-44" />
        </FormField>
        <FormField label={pick('শ্রেণি', 'Class')}>
          <Select
            value={classId}
            onChange={(event) => {
              const nextSection = db.sections.find((item) => item.classId === event.target.value);
              setClassId(event.target.value);
              setSectionId(nextSection?.id ?? '');
            }}
            className="w-44"
          >
            {db.classes.map((item) => (
              <option key={item.id} value={item.id}>{locale === 'bn' ? item.nameBn || item.name : item.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label={pick('শাখা', 'Section')}>
          <Select value={section} onChange={(event) => setSectionId(event.target.value)} className="w-32">
            {sections.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
        </FormField>
        <StatusBadge enumName="AttendanceMethod" value={method === AttendanceMethod.BIOMETRIC ? AttendanceMethod.MANUAL : method} />
        <div className="flex gap-2 ml-auto">
          {manual && (
            <Button
              variant="outline"
              size="sm"
              disabled={Boolean(blocked)}
              onClick={() => setDraft(Object.fromEntries(enrollments.map((item) => [item.id, AttendanceStatus.PRESENT])))}
            >
              {pick('সবাই উপস্থিত', 'All present')}
            </Button>
          )}
          <Button variant="primary" size="sm" disabled={isLoading || Boolean(blocked)} onClick={save}>
            {pick('সংরক্ষণ', 'Save')}
          </Button>
        </div>
      </Card>
      {blocked && <p className="text-sm text-destructive">{blocked}</p>}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('রোল', 'Roll')}</th>
              <th className="p-3 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
              <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrollments.map((enrollment) => {
              const student = db.students.find((item) => item.id === enrollment.studentId);
              const current = statusOf(enrollment.id);
              return (
                <tr key={enrollment.id}>
                  <td className="p-3 tabular-nums">{formatNumber(enrollment.roll, locale)}</td>
                  <td className="p-3">
                    {student?.nameBn || student?.nameEn}
                    <span className="block text-xs text-muted-foreground font-mono">{student?.studentId}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          disabled={Boolean(blocked)}
                          onClick={() => setDraft((prev) => ({ ...prev, [enrollment.id]: option.value }))}
                          className={`px-2.5 py-1 text-xs rounded border cursor-pointer disabled:opacity-50 ${
                            current === option.value ? option.on : 'bg-surface border-border text-muted-foreground'
                          }`}
                        >
                          {pick(option.bn, option.en)}
                        </button>
                      ))}
                      {!current && !manual && <span className="text-xs text-muted-foreground self-center">{pick('স্ক্র্যান হয়নি', 'Not scanned')}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!enrollments.length && <p className="p-4 text-sm text-muted-foreground">{pick('এই শাখায় চলতি ভর্তি নেই।', 'No active enrollment in this section.')}</p>}
      </Card>
    </div>
  );
}

function Gate({ db }: { db: MockDatabase }) {
  const { pick } = useI18n();
  const [scan, { isLoading }] = useSimulateRfidScanMutation();
  const [cardNumber, setCardNumber] = useState('');

  const punch = async (direction: 'ENTRY' | 'EXIT') => {
    try {
      const result = await scan({ cardNumber, direction }).unwrap() as { message?: string; isKnownCard?: boolean };
      toast.success(result.message || pick('স্ক্যান হয়েছে।', 'Scan recorded.'));
      setCardNumber('');
    } catch (err) {
      toast.error(errorMessage(err, pick('স্ক্যান হয়নি।', 'Scan failed.')));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-end gap-3">
        <FormField label={pick('কার্ড নম্বর', 'Card number')}>
          <Input value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} className="w-64" />
        </FormField>
        <Button variant="primary" disabled={isLoading || !cardNumber.trim()} onClick={() => punch('ENTRY')}>{pick('প্রবেশ', 'Entry')}</Button>
        <Button variant="outline" disabled={isLoading || !cardNumber.trim()} onClick={() => punch('EXIT')}>{pick('প্রস্থান', 'Exit')}</Button>
      </Card>
      <div className="space-y-2">
        {db.rfidScans.slice(0, 12).map((item) => (
          <Card key={item.id} className="p-3 flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-mono font-semibold">{item.cardNumber}</p>
              <p className="text-muted-foreground">{item.isKnownCard ? `${item.studentName} · ${item.className}` : pick('চেনা যায়নি', 'Not recognised')}</p>
            </div>
            <span className="text-xs text-muted-foreground">{item.direction === 'ENTRY' ? pick('প্রবেশ', 'Entry') : pick('প্রস্থান', 'Exit')}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Report({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const [classId, setClassId] = useState(db.classes[0]?.id ?? '');
  const [sectionId, setSectionId] = useState(db.sections.find((item) => item.classId === db.classes[0]?.id)?.id ?? '');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const sections = db.sections.filter((item) => item.classId === classId);
  const section = sections.some((item) => item.id === sectionId) ? sectionId : sections[0]?.id ?? '';
  const rows = db.enrollments
    .filter((item) => item.academicYearId === yearId && item.classId === classId && item.sectionId === section && item.status === EnrollmentStatus.ACTIVE)
    .sort((a, b) => a.roll - b.roll)
    .map((enrollment) => {
      const marks = db.attendances.filter((item) => item.studentEnrollmentId === enrollment.id && item.date.startsWith(month));
      const present = marks.filter((item) => item.status === AttendanceStatus.PRESENT).length;
      const late = marks.filter((item) => item.status === AttendanceStatus.LATE).length;
      const absent = marks.filter((item) => item.status === AttendanceStatus.ABSENT).length;
      const leave = marks.filter((item) => item.status === AttendanceStatus.LEAVE).length;
      const student = db.students.find((item) => item.id === enrollment.studentId);
      const rate = marks.length ? Math.round(((present + late) / marks.length) * 100) : 0;
      return { id: enrollment.id, roll: enrollment.roll, name: student?.nameBn || student?.nameEn || '—', present, late, absent, leave, rate };
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <FormField label={pick('মাস', 'Month')}>
          <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="w-44" />
        </FormField>
        <FormField label={pick('শ্রেণি', 'Class')}>
          <Select value={classId} onChange={(event) => setClassId(event.target.value)} className="w-44">
            {db.classes.map((item) => (
              <option key={item.id} value={item.id}>{locale === 'bn' ? item.nameBn || item.name : item.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label={pick('শাখা', 'Section')}>
          <Select value={section} onChange={(event) => setSectionId(event.target.value)} className="w-32">
            {sections.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
        </FormField>
        <Button variant="outline" size="sm" onClick={triggerPrint}><Printer className="w-4 h-4" /> {pick('প্রিন্ট', 'Print')}</Button>
      </div>
      <DataTable
        data={rows}
        exportFilename="attendance.csv"
        columns={[
          { accessorKey: 'roll', header: pick('রোল', 'Roll') },
          { accessorKey: 'name', header: pick('শিক্ষার্থী', 'Student') },
          { accessorKey: 'present', header: pick('উপস্থিত', 'Present') },
          { accessorKey: 'late', header: pick('দেরি', 'Late') },
          { accessorKey: 'absent', header: pick('অনুপস্থিত', 'Absent') },
          { accessorKey: 'leave', header: pick('ছুটি', 'Leave') },
          { accessorKey: 'rate', header: '%', cell: ({ row }) => `${row.original.rate}%` },
        ]}
      />
    </div>
  );
}

function SmsLog({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const [retry, { isLoading }] = useRetryAttendanceSmsMutation();
  const rows = db.attendanceSmsLogs.map((item) => {
    const attendance = db.attendances.find((row) => row.id === item.attendanceId);
    const enrollment = attendance ? db.enrollments.find((row) => row.id === attendance.studentEnrollmentId) : undefined;
    const student = enrollment ? db.students.find((row) => row.id === enrollment.studentId) : undefined;
    return { ...item, student: student?.nameBn || student?.nameEn || '—', when: formatDateShort(item.createdAt, locale) };
  });

  return (
    <DataTable
      data={rows}
      exportFilename="attendance-sms.csv"
      columns={[
        { accessorKey: 'when', header: pick('সময়', 'When') },
        { accessorKey: 'student', header: pick('শিক্ষার্থী', 'Student') },
        { accessorKey: 'phone', header: pick('মোবাইল', 'Phone') },
        { accessorKey: 'smsType', header: pick('ধরন', 'Type'), cell: ({ row }) => <StatusBadge enumName="AttendanceSmsType" value={row.original.smsType} /> },
        { accessorKey: 'message', header: pick('বার্তা', 'Message') },
        { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="SmsStatus" value={row.original.status} /> },
        {
          id: 'retry',
          header: '',
          cell: ({ row }) =>
            row.original.status === SmsStatus.FAILED ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading}
                onClick={async () => {
                  try {
                    await retry({ id: row.original.id }).unwrap();
                    toast.success(pick('আবার পাঠানো হয়েছে।', 'Sent again.'));
                  } catch (err) {
                    toast.error(errorMessage(err, pick('পাঠানো যায়নি।', 'Could not send again.')));
                  }
                }}
              >
                {pick('আবার', 'Retry')}
              </Button>
            ) : null,
        },
      ]}
    />
  );
}

function Settings({ db }: { db: MockDatabase }) {
  const { locale, pick } = useI18n();
  const [updateConfig, { isLoading }] = useUpdateAttendanceConfigMutation();
  const [editing, setEditing] = useState<ClassAttendanceMethodConfig | null>(null);

  const configFor = (classId: string): ClassAttendanceMethodConfig =>
    db.classAttendanceConfigs.find((item) => item.classId === classId) ?? {
      classId,
      method: AttendanceMethod.MANUAL,
      autoSmsOnEntry: false,
      autoSmsOnExit: false,
      autoSmsOnAbsent: true,
      lateThresholdTime: '10:15',
    };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      await updateConfig(editing).unwrap();
      toast.success(pick('পদ্ধতি সংরক্ষিত হয়েছে।', 'Method saved.'));
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ হয়নি।', 'Could not save the method.')));
    }
  };

  const rows = db.classes.map((item) => ({ ...configFor(item.id), name: locale === 'bn' ? item.nameBn || item.name : item.name }));

  return (
    <>
      <DataTable
        data={rows}
        columns={[
          { accessorKey: 'name', header: pick('শ্রেণি', 'Class') },
          { accessorKey: 'method', header: pick('পদ্ধতি', 'Method'), cell: ({ row }) => <StatusBadge enumName="AttendanceMethod" value={row.original.method === AttendanceMethod.BIOMETRIC ? AttendanceMethod.MANUAL : row.original.method} /> },
          { accessorKey: 'lateThresholdTime', header: pick('দেরি', 'Late after') },
          { accessorKey: 'autoSmsOnAbsent', header: pick('অনুপস্থিতি', 'Absent SMS'), cell: ({ row }) => (row.original.autoSmsOnAbsent ? pick('চালু', 'On') : pick('বন্ধ', 'Off')) },
          {
            id: 'edit',
            header: '',
            cell: ({ row }) => (
              <Button size="sm" variant="ghost" onClick={() => setEditing(configFor(row.original.classId))}>{pick('সম্পাদনা', 'Edit')}</Button>
            ),
          },
        ]}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={pick('পদ্ধতি', 'Method')}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <FormField label={pick('পদ্ধতি', 'Method')}>
              <Select value={editing.method === AttendanceMethod.BIOMETRIC ? AttendanceMethod.MANUAL : editing.method} onChange={(event) => setEditing({ ...editing, method: event.target.value as AttendanceMethod })}>
                <option value={AttendanceMethod.MANUAL}>{pick('হাতে', 'Manual')}</option>
                <option value={AttendanceMethod.RFID}>RFID</option>
              </Select>
            </FormField>
            <FormField label={pick('এর পর দেরি', 'Late after')}>
              <Input type="time" value={editing.lateThresholdTime} onChange={(event) => setEditing({ ...editing, lateThresholdTime: event.target.value })} />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={editing.autoSmsOnAbsent} onChange={(value) => setEditing({ ...editing, autoSmsOnAbsent: value })} />
              {pick('অনুপস্থিতিতে এসএমএস', 'SMS when absent')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={editing.autoSmsOnEntry} onChange={(value) => setEditing({ ...editing, autoSmsOnEntry: value })} />
              {pick('প্রবেশে এসএমএস', 'SMS on entry')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={editing.autoSmsOnExit} onChange={(value) => setEditing({ ...editing, autoSmsOnExit: value })} />
              {pick('প্রস্থানে এসএমএস', 'SMS on exit')}
            </label>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={isLoading}>{pick('সংরক্ষণ', 'Save')}</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
