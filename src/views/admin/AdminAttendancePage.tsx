'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCheck, Printer, Radio, RefreshCw, Send } from 'lucide-react';
import {
  useGetBootstrapQuery,
  useRetryAttendanceSmsMutation,
  useSaveAttendanceBatchMutation,
  useSimulateRfidScanMutation,
  useUpdateAttendanceConfigMutation,
} from '@/src/store/api';
import { useAppSelector } from '@/src/store/hooks';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { triggerPrint } from '@/src/lib/utils/cn';
import { LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  SegmentedTabs,
  Select,
  Switch,
} from '@/src/components/ui/primitives';
import { AttendanceMethod, AttendanceStatus, SmsStatus } from '@/src/types/enums';

export function AdminAttendancePage({
  defaultTab = 'daily',
}: {
  defaultTab?: 'daily' | 'reports' | 'sms' | 'settings';
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [saveBatch, { isLoading: saving }] = useSaveAttendanceBatchMutation();
  const [retrySms] = useRetryAttendanceSmsMutation();
  const [updateConfig] = useUpdateAttendanceConfigMutation();
  const [simulateScan, { isLoading: scanning }] = useSimulateRfidScanMutation();
  const auth = useAppSelector((s) => s.auth);
  const { locale, pick } = useI18n();

  const [tab, setTab] = useState(defaultTab);
  const [date, setDate] = useState('2026-11-19');
  const [classId, setClassId] = useState('cls-9');
  const [sectionId, setSectionId] = useState('sec-9-ka');
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [simCard, setSimCard] = useState('RFID-10-8841');

  const classSections = useMemo(
    () => (db ? db.sections.filter((s) => s.classId === classId) : []),
    [db, classId]
  );
  const effectiveSecId = classSections.some((s) => s.id === sectionId)
    ? sectionId
    : classSections[0]?.id ?? '';

  const sectionEnrollments = useMemo(
    () =>
      db
        ? db.enrollments
            .filter((e) => e.classId === classId && e.sectionId === effectiveSecId && e.academicYearId === 'ay-2026')
            .sort((a, b) => a.roll - b.roll)
        : [],
    [db, classId, effectiveSecId]
  );

  if (isLoading || !db) return <LoadingSkeleton />;

  const classConfig = db.classAttendanceConfigs.find((c) => c.classId === classId);
  const activeMethod = classConfig?.method ?? AttendanceMethod.MANUAL;

  const getStatus = (enrId: string): AttendanceStatus => {
    if (draftStatuses[enrId]) return draftStatuses[enrId];
    const existing = db.attendances.find((a) => a.studentEnrollmentId === enrId && a.date === date);
    return existing?.status ?? AttendanceStatus.PRESENT;
  };

  const handleMarkAllPresent = () => {
    const next: Record<string, AttendanceStatus> = { ...draftStatuses };
    sectionEnrollments.forEach((e) => {
      next[e.id] = AttendanceStatus.PRESENT;
    });
    setDraftStatuses(next);
  };

  const handleSaveDaily = async () => {
    try {
      const res = await saveBatch({
        date,
        markedBy: auth.user?.id ?? 'user-admin',
        entries: sectionEnrollments.map((e) => ({
          studentEnrollmentId: e.id,
          status: getStatus(e.id),
          method: activeMethod,
        })),
      }).unwrap();
      toast.success(
        pick(
          `${formatNumber(res.saved, 'bn')} জন শিক্ষার্থীর হাজিরা সংরক্ষিত হয়েছে (অনুপস্থিতির SMS: ${formatNumber(res.smsQueued, 'bn')})।`,
          `Saved attendance for ${res.saved} students (${res.smsQueued} absent SMS dispatched).`
        )
      );
    } catch {
      toast.error(pick('হাজিরা সংরক্ষণে সমস্যা হয়েছে।', 'Failed to save attendance.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('হাজিরা, RFID ও SMS ব্যবস্থাপনা', 'Attendance, RFID & SMS Center')}
        description={pick(
          'কনফিগারযোগ্য হাজিরা পদ্ধতি: বর্তমানে ১০ম শ্রেণি (SSC ব্যাচ) RFID ডিজিটাল এবং ৬ষ্ঠ–৯ম শ্রেণি ম্যানুয়াল হাজিরা হিসেবে নির্ধারিত।',
          'Configurable per-class method: Class 10 (SSC Batch) uses RFID digital attendance while Classes 6–9 use manual attendance.'
        )}
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'daily', label: pick('দৈনিক হাজিরা', 'Daily Attendance') },
          { value: 'reports', label: pick('মাসিক রিপোর্ট ম্যাট্রিক্স', 'Monthly Matrix') },
          { value: 'sms', label: pick('SMS লগ', 'SMS Logs'), count: db.attendanceSmsLogs.length },
          { value: 'settings', label: pick('RFID ও ক্লাস সেটিংস', 'RFID & Method Settings') },
        ]}
      />

      {tab === 'daily' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <FormField label={pick('তারিখ', 'Date')}>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
              </FormField>
              <FormField label={pick('শ্রেণি', 'Class')}>
                <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-44">
                  {db.classes.map((c) => (
                    <option key={c.id} value={c.id}>{locale === 'bn' ? c.nameBn : c.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label={pick('শাখা', 'Section')}>
                <Select value={effectiveSecId} onChange={(e) => setSectionId(e.target.value)} className="w-32">
                  {classSections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </FormField>
              <div className="pb-1.5">
                <StatusBadge enumName="AttendanceMethod" value={activeMethod} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
                <CheckCheck className="w-4 h-4" /> {pick('সবাইকে উপস্থিত দিন', 'Mark All Present')}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveDaily} disabled={saving}>
                {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('হাজিরা সংরক্ষণ করুন', 'Save Attendance')}
              </Button>
            </div>
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-sm text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">{pick('রোল', 'Roll')}</th>
                  <th className="p-3 text-left">{pick('শিক্ষার্থীর নাম', 'Student')}</th>
                  <th className="p-3 text-left">{pick('পদ্ধতি', 'Method')}</th>
                  <th className="p-3 text-left">{pick('উপস্থিতি নির্বাচন (P / A / L / V)', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sectionEnrollments.map((enr) => {
                  const stu = db.students.find((s) => s.id === enr.studentId);
                  const status = getStatus(enr.id);
                  return (
                    <tr key={enr.id}>
                      <td className="p-3 font-bold tabular-nums">{formatNumber(enr.roll, locale)}</td>
                      <td className="p-3 font-medium">
                        {stu?.nameBn ?? stu?.nameEn}
                        <span className="block text-xs text-muted-foreground font-mono">{stu?.studentId}</span>
                      </td>
                      <td className="p-3"><StatusBadge enumName="AttendanceMethod" value={activeMethod} /></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { st: AttendanceStatus.PRESENT, label: pick('উপস্থিত (P)', 'Present') },
                            { st: AttendanceStatus.ABSENT, label: pick('অনুপস্থিত (A)', 'Absent') },
                            { st: AttendanceStatus.LATE, label: pick('বিলম্ব (L)', 'Late') },
                            { st: AttendanceStatus.LEAVE, label: pick('ছুটি (V)', 'Leave') },
                          ].map((opt) => (
                            <button
                              key={opt.st}
                              type="button"
                              onClick={() => setDraftStatuses((prev) => ({ ...prev, [enr.id]: opt.st }))}
                              className={`px-2.5 py-1 text-xs font-medium rounded border cursor-pointer transition-colors ${
                                status === opt.st
                                  ? opt.st === AttendanceStatus.PRESENT
                                    ? 'bg-success text-white border-success'
                                    : opt.st === AttendanceStatus.ABSENT
                                      ? 'bg-destructive text-white border-destructive'
                                      : opt.st === AttendanceStatus.LATE
                                        ? 'bg-warning text-white border-warning'
                                        : 'bg-info text-white border-info'
                                  : 'bg-surface border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center no-print">
            <p className="text-sm text-muted-foreground">
              {pick('নভেম্বর ২০২৬ — শিক্ষার্থীভিত্তিক উপস্থিতির হার (প্রিন্টযোগ্য)', 'November 2026 — Student Attendance Summary (Printable)')}
            </p>
            <Button variant="outline" size="sm" onClick={triggerPrint}>
              <Printer className="w-4 h-4" /> {pick('রিপোর্ট প্রিন্ট করুন', 'Print Report')}
            </Button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-sm text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                  <th className="p-3 text-left">{pick('শ্রেণি', 'Class')}</th>
                  <th className="p-3 text-right">{pick('উপস্থিত', 'Present')}</th>
                  <th className="p-3 text-right">{pick('বিলম্ব', 'Late')}</th>
                  <th className="p-3 text-right">{pick('অনুপস্থিত', 'Absent')}</th>
                  <th className="p-3 text-right">{pick('উপস্থিতি %', 'Rate %')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {db.enrollments.map((enr) => {
                  const stu = db.students.find((s) => s.id === enr.studentId);
                  const cls = db.classes.find((c) => c.id === enr.classId);
                  const rows = db.attendances.filter((a) => a.studentEnrollmentId === enr.id);
                  const p = rows.filter((r) => r.status === AttendanceStatus.PRESENT).length;
                  const l = rows.filter((r) => r.status === AttendanceStatus.LATE).length;
                  const ab = rows.filter((r) => r.status === AttendanceStatus.ABSENT).length;
                  const pct = rows.length ? Math.round(((p + l) / rows.length) * 100) : 0;
                  return (
                    <tr key={enr.id}>
                      <td className="p-3 font-medium">{stu?.nameBn ?? stu?.nameEn}</td>
                      <td className="p-3 text-sm">{locale === 'bn' ? cls?.nameBn : cls?.name}</td>
                      <td className="p-3 text-right text-success font-medium">{formatNumber(p, locale)}</td>
                      <td className="p-3 text-right text-warning font-medium">{formatNumber(l, locale)}</td>
                      <td className="p-3 text-right text-destructive font-medium">{formatNumber(ab, locale)}</td>
                      <td className="p-3 text-right font-bold">{formatNumber(pct, locale)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'sms' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-sm text-muted-foreground">
              <tr>
                <th className="p-3 text-left">{pick('তারিখ', 'Date')}</th>
                <th className="p-3 text-left">{pick('ধরন', 'Type')}</th>
                <th className="p-3 text-left">{pick('অভিভাবকের ফোন', 'Parent Phone')}</th>
                <th className="p-3 text-left">{pick('বার্তা', 'Message')}</th>
                <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
                <th className="p-3 text-left">{pick('অ্যাকশন', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {db.attendanceSmsLogs.map((sms) => (
                <tr key={sms.id}>
                  <td className="p-3 tabular-nums whitespace-nowrap">{formatDateShort(sms.createdAt, locale)}</td>
                  <td className="p-3"><StatusBadge enumName="AttendanceSmsType" value={sms.smsType} /></td>
                  <td className="p-3 tabular-nums font-mono">{sms.phone}</td>
                  <td className="p-3 max-w-md text-muted-foreground">{sms.message}</td>
                  <td className="p-3"><StatusBadge enumName="SmsStatus" value={sms.status} /></td>
                  <td className="p-3">
                    {sms.status === SmsStatus.FAILED && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          retrySms({ id: sms.id });
                          toast.success(pick('SMS পুনরায় প্রেরণ করা হয়েছে।', 'SMS retried successfully.'));
                        }}
                      >
                        <RefreshCw className="w-3 h-3" /> {pick('পুনরায় পাঠান', 'Retry')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Configurable RFID vs Manual per Class */}
          <Card className="lg:col-span-7 p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                {pick('শ্রেণিভিত্তিক হাজিরা পদ্ধতি কনফিগারেশন', 'Configurable Attendance Method by Class')}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pick(
                  'কোন শ্রেণিতে RFID এবং কোন শ্রেণিতে ম্যানুয়াল হাজিরা চলবে তা এখান থেকে পরিবর্তন করা যায় (হার্ডকোডেড নয়)।',
                  'Switch any class between MANUAL, RFID, or BIOMETRIC without code changes.'
                )}
              </p>
            </div>
            <div className="divide-y divide-border">
              {db.classes.map((cls) => {
                const cfg = db.classAttendanceConfigs.find((c) => c.classId === cls.id) ?? {
                  classId: cls.id,
                  method: AttendanceMethod.MANUAL,
                  autoSmsOnEntry: false,
                  autoSmsOnExit: false,
                  autoSmsOnAbsent: true,
                  lateThresholdTime: '10:15',
                };
                return (
                  <div key={cls.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{locale === 'bn' ? cls.nameBn : cls.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pick('অনুপস্থিতি SMS:', 'Absent SMS:')} {cfg.autoSmsOnAbsent ? 'ON' : 'OFF'} ·{' '}
                        {pick('প্রবেশ SMS:', 'Entry SMS:')} {cfg.autoSmsOnEntry ? 'ON' : 'OFF'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={cfg.method}
                        onChange={(e) => {
                          updateConfig({ ...cfg, method: e.target.value as AttendanceMethod });
                          toast.success(pick('হাজিরা পদ্ধতি আপডেট হয়েছে', 'Attendance method updated'));
                        }}
                        className="w-36 h-9"
                      >
                        <option value={AttendanceMethod.MANUAL}>MANUAL</option>
                        <option value={AttendanceMethod.RFID}>RFID</option>
                        <option value={AttendanceMethod.BIOMETRIC}>BIOMETRIC</option>
                      </Select>
                      <Switch
                        checked={cfg.autoSmsOnEntry}
                        onChange={(val) => updateConfig({ ...cfg, autoSmsOnEntry: val })}
                        label="Entry SMS"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Live RFID Reader Integration-Ready Feed */}
          <Card className="lg:col-span-5 p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Radio className="w-4 h-4 text-info" />
                {pick('RFID লাইভ স্ক্যান ফিড (ইন্টিগ্রেশন ইন্টারফেস)', 'Live RFID Scan Feed (Integration Interface)')}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pick(
                  'হার্ডওয়্যার ওয়েবহুক / WebSocket সংযোগের জন্য প্রস্তুত। নিচ থেকে একটি টেস্ট কার্ড পাঞ্চ সিমুলেট করুন।',
                  'WebSocket/polling-ready feed showing known cards and unknown-card alerts.'
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={simCard} onChange={(e) => setSimCard(e.target.value)} className="flex-1 h-9">
                <option value="RFID-10-8841">RFID-10-8841 (তানভীর আহমেদ)</option>
                <option value="RFID-10-8842">RFID-10-8842 (নুসরাত জাহান)</option>
                <option value="RFID-UNK-4040">RFID-UNK-4040 (অপরিচিত কার্ড)</option>
              </Select>
              <Button
                variant="secondary"
                size="sm"
                disabled={scanning}
                onClick={() => {
                  simulateScan({ cardNumber: simCard, direction: 'ENTRY' });
                  toast.success(pick('RFID স্ক্যান ইভেন্ট রেকর্ড হয়েছে', 'Simulated RFID scan logged'));
                }}
              >
                <Send className="w-3.5 h-3.5" /> {pick('টেস্ট পাঞ্চ', 'Simulate')}
              </Button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {db.rfidScans.map((sc) => (
                <div
                  key={sc.id}
                  className={`p-3 rounded border text-sm ${
                    sc.isKnownCard
                      ? 'border-border bg-surface-muted/30'
                      : 'border-destructive/40 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">{sc.cardNumber}</span>
                    <StatusBadge
                      value={sc.isKnownCard ? sc.direction : 'UNKNOWN'}
                      customLabel={sc.isKnownCard ? sc.direction : pick('অপরিচিত কার্ড!', 'Unknown Card')}
                      customTone={sc.isKnownCard ? 'success' : 'destructive'}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {sc.isKnownCard ? `${sc.studentName} · ${sc.className}` : pick('কোনো শিক্ষার্থীর সাথে যুক্ত নয়', 'Not assigned to any active student')}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
