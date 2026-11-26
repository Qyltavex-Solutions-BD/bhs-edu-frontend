'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CreditCard,
  Edit3,
  MessageSquare,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceMethod } from '@/src/types/enums';
import { useI18n } from '@/src/lib/i18n';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import {
  useGetAttendanceConfigsQuery,
  useUpdateAttendanceConfigMutation,
  type AttendanceConfigItem,
} from '../api/attendance.api';
import { errorMessage, ToneBadge } from './attendanceShared';

export function AttendanceSettings({ yearId }: { yearId: string }) {
  const { pick } = useI18n();
  const { data, isFetching } = useGetAttendanceConfigsQuery({ academicYearId: yearId });
  const [updateConfig, { isLoading: saving }] = useUpdateAttendanceConfigMutation();
  const [editing, setEditing] = useState<AttendanceConfigItem | null>(null);

  const items = data?.items ?? [];
  const kpis = data?.kpis ?? {
    totalClasses: 0,
    rfidClasses: 0,
    totalActiveStudents: 0,
    studentsWithCard: 0,
    studentsWithoutCard: 0,
  };

  async function saveEdit() {
    if (!editing) return;
    try {
      await updateConfig({
        classId: editing.classId,
        method: editing.method,
        lateThresholdTime: editing.lateThresholdTime,
        autoSmsOnAbsent: editing.autoSmsOnAbsent,
        autoSmsOnEntry: editing.autoSmsOnEntry,
        autoSmsOnExit: editing.autoSmsOnExit,
      }).unwrap();
      toast.success(pick('হাজিরা নিয়ম সংরক্ষিত হয়েছে', 'Attendance rules saved'));
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('সংরক্ষণ ব্যর্থ হয়েছে', 'Save failed')));
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{pick('RFID শ্রেণি', 'RFID Classes')}</span>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {kpis.rfidClasses} / {kpis.totalClasses}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {pick('অটোমেটেড গেট রিডার সক্রিয়', 'Automated gate reader active')}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{pick('সক্রিয় RFID কার্ড', 'Active RFID Cards')}</span>
            <CreditCard className="h-4 w-4 text-success" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {kpis.studentsWithCard} / {kpis.totalActiveStudents}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {kpis.totalActiveStudents > 0
              ? `${Math.round((kpis.studentsWithCard / kpis.totalActiveStudents) * 100)}%`
              : '0%'}{' '}
            {pick('শিক্ষার্থী কভার্ড', 'students covered')}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{pick('কার্ডবিহীন শিক্ষার্থী', 'Missing RFID Cards')}</span>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {kpis.studentsWithoutCard}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {pick('ম্যানুয়াল হাজিরা প্রয়োজন হতে পারে', 'May require manual marking')}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{pick('SMS নীতি (খরচ সাশ্রয়)', 'SMS Policy')}</span>
            <MessageSquare className="h-4 w-4 text-info" />
          </div>
          <div className="mt-1 text-lg font-bold text-foreground">
            {pick('অনুপস্থিতি ডিফল্ট', 'Absent-Only Default')}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {pick('প্রবেশ/প্রস্থান ঐচ্ছিক', 'Entry/Exit optional per class')}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border/70 px-5 py-4">
          <h3 className="text-lg font-semibold text-foreground">
            {pick('শ্রেণিভিত্তিক হাজিরা ও SMS নিয়ম', 'Class Attendance & SMS Rules')}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isFetching
              ? pick('লোড হচ্ছে...', 'Loading...')
              : pick(
                  'প্রতিটি শ্রেণির দেরির সময়সীমা (Cutoff) ও অভিভাবক SMS টগল কনফিগার করুন',
                  'Configure late arrival cutoff and guardian SMS triggers per class'
                )}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{pick('শ্রেণি', 'Class')}</th>
                <th className="px-4 py-3">{pick('মোড', 'Mode')}</th>
                <th className="px-4 py-3">{pick('দেরির সময়সীমা', 'Late Cutoff')}</th>
                <th className="px-4 py-3">{pick('RFID কার্ড প্রস্তুতি', 'RFID Readiness')}</th>
                <th className="px-4 py-3">{pick('SMS ট্রিগার', 'SMS Triggers')}</th>
                <th className="px-4 py-3 text-right">{pick('অ্যাকশন', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((row) => (
                <tr key={row.classId} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{row.className}</td>
                  <td className="px-4 py-3">
                    <ToneBadge tone={row.method === AttendanceMethod.RFID ? 'primary' : 'neutral'}>
                      {row.method}
                    </ToneBadge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {row.lateThresholdTime}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">
                      {row.studentsWithCard} / {row.totalStudents}
                    </span>
                    {row.totalStudents > row.studentsWithCard && (
                      <span className="ml-2 text-sm text-warning">
                        ({row.totalStudents - row.studentsWithCard} {pick('বাকি', 'missing')})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <ToneBadge tone={row.autoSmsOnAbsent ? 'danger' : 'neutral'}>
                        {pick('অনুপস্থিত', 'Absent')}: {row.autoSmsOnAbsent ? 'ON' : 'OFF'}
                      </ToneBadge>
                      {row.autoSmsOnEntry && (
                        <ToneBadge tone="success">{pick('প্রবেশ', 'Entry')}</ToneBadge>
                      )}
                      {row.autoSmsOnExit && (
                        <ToneBadge tone="info">{pick('প্রস্থান', 'Exit')}</ToneBadge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                      <Edit3 className="h-3.5 w-3.5" />
                      {pick('সম্পাদনা', 'Edit')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={
          editing
            ? `${editing.className} — ${pick('হাজিরা নিয়ম সম্পাদনা', 'Edit Attendance Rules')}`
            : ''
        }
        size="md"
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {pick('ডিফল্ট হাজিরা পদ্ধতি', 'Default Method')}
                </label>
                <Select
                  value={editing.method}
                  onChange={(e) =>
                    setEditing({ ...editing, method: e.target.value as AttendanceMethod })
                  }
                >
                  <option value={AttendanceMethod.RFID}>RFID (Gate Automated)</option>
                  <option value={AttendanceMethod.MANUAL}>MANUAL (Roll Call)</option>
                  <option value={AttendanceMethod.BIOMETRIC}>BIOMETRIC (Future)</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {pick('দেরির সময়সীমা (HH:mm)', 'Late Cutoff Time (HH:mm)')}
                </label>
                <Input
                  type="time"
                  value={editing.lateThresholdTime}
                  onChange={(e) =>
                    setEditing({ ...editing, lateThresholdTime: e.target.value })
                  }
                />
              </div>
            </div>

            {editing.totalStudents > editing.studentsWithCard && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
                {pick(
                  `সতর্কতা: এই শ্রেণির ${editing.totalStudents - editing.studentsWithCard} জন শিক্ষার্থীর সক্রিয় RFID কার্ড নেই।`,
                  `Warning: ${editing.totalStudents - editing.studentsWithCard} students in this class have no active RFID card.`
                )}
              </div>
            )}

            <div className="space-y-2 rounded-lg border border-border p-3">
              <label className="flex items-center justify-between gap-3 text-base">
                <span>
                  <strong className="block">{pick('অনুপস্থিতিতে অটো SMS', 'Auto SMS on Absent')}</strong>
                  <span className="text-sm text-muted-foreground">
                    {pick(
                      'প্রস্তাবিত: অনুপস্থিত চিহ্নিত হলে অভিভাবককে SMS পাঠাবে',
                      'Recommended: Alert guardians when marked absent'
                    )}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={editing.autoSmsOnAbsent}
                  onChange={(e) =>
                    setEditing({ ...editing, autoSmsOnAbsent: e.target.checked })
                  }
                  className="h-4 w-4 accent-primary"
                />
              </label>

              <label className="flex items-center justify-between gap-3 border-t border-border/60 pt-2 text-base">
                <span>
                  <strong className="block">{pick('প্রবেশে অটো SMS', 'Auto SMS on Gate Entry')}</strong>
                  <span className="text-sm text-muted-foreground">
                    {pick(
                      'প্রতিদিন প্রতি শিক্ষার্থীর জন্য অতিরিক্ত SMS খরচ হবে',
                      'Incurs daily SMS cost per student'
                    )}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={editing.autoSmsOnEntry}
                  onChange={(e) =>
                    setEditing({ ...editing, autoSmsOnEntry: e.target.checked })
                  }
                  className="h-4 w-4 accent-primary"
                />
              </label>

              <label className="flex items-center justify-between gap-3 border-t border-border/60 pt-2 text-base">
                <span>
                  <strong className="block">{pick('প্রস্থানে অটো SMS', 'Auto SMS on Gate Exit')}</strong>
                  <span className="text-sm text-muted-foreground">
                    {pick('গেট দিয়ে বের হওয়ার সময় SMS পাঠাবে', 'Send SMS when student scans out')}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={editing.autoSmsOnExit}
                  onChange={(e) =>
                    setEditing({ ...editing, autoSmsOnExit: e.target.checked })
                  }
                  className="h-4 w-4 accent-primary"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-border/70 pt-3">
              <Button variant="outline" onClick={() => setEditing(null)}>
                {pick('বাতিল', 'Cancel')}
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save Rules')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
