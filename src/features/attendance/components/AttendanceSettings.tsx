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
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import {
  useGetAttendanceConfigsQuery,
  useUpdateAttendanceConfigMutation,
  type AttendanceConfigItem,
} from '../api/attendance.api';
import { errorMessage, ToneBadge } from './attendanceShared';

export function AttendanceSettings({ yearId }: { yearId: string }) {
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
      toast.success('হাজিরা নিয়ম সংরক্ষিত হয়েছে');
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err, 'সংরক্ষণ ব্যর্থ হয়েছে'));
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'RFID শ্রেণি'}</span>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {kpis.rfidClasses} / {kpis.totalClasses}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {'অটোমেটেড গেট রিডার সক্রিয়'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'সক্রিয় RFID কার্ড'}</span>
            <CreditCard className="h-4 w-4 text-success" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {kpis.studentsWithCard} / {kpis.totalActiveStudents}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {kpis.totalActiveStudents > 0
              ? `${Math.round((kpis.studentsWithCard / kpis.totalActiveStudents) * 100)}%`
              : '0%'}{' '}
            {'শিক্ষার্থী কভার্ড'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'কার্ডবিহীন শিক্ষার্থী'}</span>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {kpis.studentsWithoutCard}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {'ম্যানুয়াল হাজিরা প্রয়োজন হতে পারে'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{'SMS নীতি (খরচ সাশ্রয়)'}</span>
            <MessageSquare className="h-4 w-4 text-info" />
          </div>
          <div className="mt-1 text-lg font-bold text-foreground">
            {'অনুপস্থিতি ডিফল্ট'}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {'প্রবেশ/প্রস্থান ঐচ্ছিক'}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border/70 px-5 py-4">
          <h3 className="text-lg font-semibold text-foreground">
            {'শ্রেণিভিত্তিক হাজিরা ও SMS নিয়ম'}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isFetching
              ? 'লোড হচ্ছে...'
              : 'প্রতিটি শ্রেণির দেরির সময়সীমা (Cutoff) ও অভিভাবক SMS টগল কনফিগার করুন'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{'শ্রেণি'}</th>
                <th className="px-4 py-3">{'মোড'}</th>
                <th className="px-4 py-3">{'দেরির সময়সীমা'}</th>
                <th className="px-4 py-3">{'RFID কার্ড প্রস্তুতি'}</th>
                <th className="px-4 py-3">{'SMS ট্রিগার'}</th>
                <th className="px-4 py-3 text-right">{'অ্যাকশন'}</th>
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
                        ({row.totalStudents - row.studentsWithCard} {'বাকি'})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <ToneBadge tone={row.autoSmsOnAbsent ? 'danger' : 'neutral'}>
                        {'অনুপস্থিত'}: {row.autoSmsOnAbsent ? 'ON' : 'OFF'}
                      </ToneBadge>
                      {row.autoSmsOnEntry && (
                        <ToneBadge tone="success">{'প্রবেশ'}</ToneBadge>
                      )}
                      {row.autoSmsOnExit && (
                        <ToneBadge tone="info">{'প্রস্থান'}</ToneBadge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                      <Edit3 className="h-3.5 w-3.5" />
                      {'সম্পাদনা'}
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
            ? `${editing.className} — ${'হাজিরা নিয়ম সম্পাদনা'}`
            : ''
        }
        size="md"
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {'ডিফল্ট হাজিরা পদ্ধতি'}
                </label>
                <Select
                  value={editing.method}
                  onChange={(e) =>
                    setEditing({ ...editing, method: e.target.value as AttendanceMethod })
                  }
                >
                  <option value={AttendanceMethod.RFID}>RFID (স্বয়ংক্রিয় গেট)</option>
                  <option value={AttendanceMethod.MANUAL}>ম্যানুয়াল (রোল কল)</option>
                  <option value={AttendanceMethod.BIOMETRIC}>বায়োমেট্রিক (ভবিষ্যৎ)</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {'দেরির সময়সীমা (HH:mm)'}
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
                {`সতর্কতা: এই শ্রেণির ${editing.totalStudents - editing.studentsWithCard} জন শিক্ষার্থীর সক্রিয় RFID কার্ড নেই।`}
              </div>
            )}

            <div className="space-y-2 rounded-lg border border-border p-3">
              <label className="flex items-center justify-between gap-3 text-base">
                <span>
                  <strong className="block">{'অনুপস্থিতিতে অটো SMS'}</strong>
                  <span className="text-sm text-muted-foreground">
                    {'প্রস্তাবিত: অনুপস্থিত চিহ্নিত হলে অভিভাবককে SMS পাঠাবে'}
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
                  <strong className="block">{'প্রবেশে অটো SMS'}</strong>
                  <span className="text-sm text-muted-foreground">
                    {'প্রতিদিন প্রতি শিক্ষার্থীর জন্য অতিরিক্ত SMS খরচ হবে'}
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
                  <strong className="block">{'প্রস্থানে অটো SMS'}</strong>
                  <span className="text-sm text-muted-foreground">
                    {'গেট দিয়ে বের হওয়ার সময় SMS পাঠাবে'}
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
                {'বাতিল'}
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
