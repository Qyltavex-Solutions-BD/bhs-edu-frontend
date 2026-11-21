'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Check,
  CreditCard,
  Edit3,
  Minus,
} from 'lucide-react';
import { useUpdateAttendanceConfigMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
import { Button, Card, FormField, Input, Modal, Select, Switch } from '@/src/components/ui/primitives';
import {
  AttendanceMethod,
  CardStatus,
  EnrollmentStatus,
  StudentStatus,
} from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';
import type { ClassAttendanceMethodConfig } from '@/src/types/proposed/future';
import { errorMessage } from './attendanceShared';

export function AttendanceSettings({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const { locale, pick } = useI18n();
  const [updateConfig, { isLoading }] = useUpdateAttendanceConfigMutation();
  const [editing, setEditing] = useState<ClassAttendanceMethodConfig | null>(null);

  const activeStudentsById = useMemo(
    () =>
      new Set(
        db.students.filter((s) => s.status === StudentStatus.ACTIVE).map((s) => s.id)
      ),
    [db.students]
  );

  const activeCardStudentIds = useMemo(
    () =>
      new Set(
        db.rfidCards.filter((c) => c.status === CardStatus.ACTIVE).map((c) => c.studentId)
      ),
    [db.rfidCards]
  );

  const classRows = useMemo(() => {
    return db.classes
      .slice()
      .sort((a, b) => a.numericValue - b.numericValue)
      .map((cls) => {
        const config: ClassAttendanceMethodConfig = db.classAttendanceConfigs.find(
          (item) => item.classId === cls.id
        ) ?? {
          classId: cls.id,
          method: AttendanceMethod.MANUAL,
          autoSmsOnEntry: false,
          autoSmsOnExit: false,
          autoSmsOnAbsent: true,
          lateThresholdTime: '10:15',
        };
        const classEnrollments = db.enrollments.filter(
          (e) =>
            e.academicYearId === yearId &&
            e.classId === cls.id &&
            e.status === EnrollmentStatus.ACTIVE &&
            activeStudentsById.has(e.studentId)
        );
        const totalStudents = classEnrollments.length;
        const studentsWithCards = classEnrollments.filter((e) =>
          activeCardStudentIds.has(e.studentId)
        ).length;

        return {
          cls,
          classLabel: locale === 'bn' ? cls.nameBn || cls.name : cls.name,
          config,
          totalStudents,
          studentsWithCards,
          missingCards: Math.max(0, totalStudents - studentsWithCards),
        };
      });
  }, [db.classes, db.classAttendanceConfigs, db.enrollments, yearId, activeStudentsById, activeCardStudentIds, locale]);

  const summary = useMemo(() => {
    const manualCount = classRows.filter((r) => r.config.method === AttendanceMethod.MANUAL).length;
    const rfidCount = classRows.filter((r) => r.config.method === AttendanceMethod.RFID).length;
    const totalStudents = classRows.reduce((s, r) => s + r.totalStudents, 0);
    const totalCards = classRows.reduce((s, r) => s + r.studentsWithCards, 0);
    const coverage = totalStudents > 0 ? Math.round((totalCards / totalStudents) * 100) : 0;
    const autoAbsentCount = classRows.filter((r) => r.config.autoSmsOnAbsent).length;
    return { manualCount, rfidCount, totalStudents, totalCards, coverage, autoAbsentCount };
  }, [classRows]);

  const editingRow = editing ? classRows.find((r) => r.cls.id === editing.classId) : null;

  const handleSave = async () => {
    if (!editing) return;
    try {
      await updateConfig(editing).unwrap();
      toast.success(pick('শ্রেণির হাজিরা নিয়ম সংরক্ষিত হয়েছে।', 'Attendance rules updated.'));
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err, pick('নিয়ম সংরক্ষণ করা যায়নি।', 'Could not update rules.')));
    }
  };

  return (
    <div className="space-y-5">
      {/* 4-Column Hairline-Divided KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border border border-border rounded-[var(--radius)] bg-surface">
        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {pick('হাতে রেজিস্টার শ্রেণি', 'Manual Register Classes')}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.manualCount, locale)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pick('শ্রেণি শিক্ষক দৈনিক হাজিরা নেবেন', 'Marked daily by class teacher')}
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {pick('RFID গেট শ্রেণি', 'RFID Gate Classes')}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
            {formatNumber(summary.rfidCount, locale)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pick('গেট রিডার স্ক্যানে স্বয়ংক্রিয় হাজিরা', 'Auto-marked on gate card scan')}
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {pick('RFID কার্ড কাভারেজ', 'RFID Card Coverage')}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.coverage, locale)}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {pick(
              `${formatNumber(summary.totalCards, 'bn')}/${formatNumber(summary.totalStudents, 'bn')} শিক্ষার্থীর সক্রিয় কার্ড`,
              `${summary.totalCards}/${summary.totalStudents} students have active cards`
            )}
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {pick('স্বয়ংক্রিয় অনুপস্থিতি SMS', 'Auto-Absent SMS Active')}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-success">
            {formatNumber(summary.autoAbsentCount, locale)} / {formatNumber(classRows.length, locale)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pick('অনুপস্থিত হলে অভিভাবককে SMS', 'Notifies guardian when absent')}
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {pick('শ্রেণিভিত্তিক হাজিরা পদ্ধতি ও এসএমএস নীতিমালা', 'Class-Wise Attendance Method & SMS Policies')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {pick(
                'প্রতিটি শ্রেণির জন্য হাতে বা RFID পদ্ধতি, দেরির সময়সীমা ও স্বয়ংক্রিয় SMS নিয়ম নির্ধারণ করুন।',
                'Configure manual vs RFID attendance, late cutoff time, and guardian SMS triggers per class.'
              )}
            </p>
          </div>
          <Link
            href="/admin/students/rfid-cards"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <CreditCard className="w-3.5 h-3.5" />
            {pick('RFID কার্ড ব্যবস্থাপনা', 'Manage RFID cards')}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60 text-left text-xs font-semibold text-muted-foreground">
                <th className="py-3 px-4">{pick('শ্রেণি', 'Class')}</th>
                <th className="py-3 px-4">{pick('RFID কার্ড প্রস্তুতি', 'RFID Readiness')}</th>
                <th className="py-3 px-4">{pick('পদ্ধতি', 'Method')}</th>
                <th className="py-3 px-4">{pick('দেরির সীমা', 'Late After')}</th>
                <th className="py-3 px-4 text-center">{pick('অনুপস্থিতি SMS', 'Absent SMS')}</th>
                <th className="py-3 px-4 text-center">{pick('প্রবেশ SMS', 'Entry SMS')}</th>
                <th className="py-3 px-4 text-center">{pick('প্রস্থান SMS', 'Exit SMS')}</th>
                <th className="py-3 px-4 text-right">{pick('সম্পাদনা', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classRows.map((row) => {
                const isRfid = row.config.method === AttendanceMethod.RFID;
                const hasCardGap = isRfid && row.missingCards > 0;
                return (
                  <tr key={row.cls.id} className="hover:bg-surface-muted/30">
                    <td className="py-3 px-4 font-semibold text-foreground">{row.classLabel}</td>
                    <td className="py-3 px-4 text-xs tabular-nums">
                      <span className={cn('font-medium', hasCardGap ? 'text-warning' : 'text-foreground')}>
                        {formatNumber(row.studentsWithCards, locale)} /{' '}
                        {formatNumber(row.totalStudents, locale)}
                      </span>{' '}
                      <span className="text-muted-foreground">{pick('কার্ড', 'cards')}</span>
                      {hasCardGap && (
                        <span className="block text-[11px] text-warning">
                          {pick(
                            `${formatNumber(row.missingCards, 'bn')} জনের কার্ড নেই`,
                            `${row.missingCards} student(s) missing card`
                          )}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium border',
                          isRfid
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-border bg-surface-muted text-foreground'
                        )}
                      >
                        {isRfid ? pick('RFID গেট', 'RFID Gate') : pick('হাতে রেজিস্টার', 'Manual')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-medium tabular-nums text-foreground">
                      {row.config.lateThresholdTime}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <SmsToggleIndicator enabled={row.config.autoSmsOnAbsent} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <SmsToggleIndicator enabled={row.config.autoSmsOnEntry} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <SmsToggleIndicator enabled={row.config.autoSmsOnExit} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing({ ...row.config })}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {pick('পরিবর্তন', 'Edit')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={
          editingRow
            ? pick(`${editingRow.classLabel} — হাজিরা নিয়ম`, `${editingRow.classLabel} — Attendance Rules`)
            : pick('হাজিরা নিয়ম পরিবর্তন', 'Edit Attendance Rules')
        }
        maxWidth="max-w-md"
      >
        {editing && (
          <div className="space-y-4">
            <FormField label={pick('হাজিরা গ্রহণ পদ্ধতি', 'Attendance Method')} required>
              <Select
                value={editing.method}
                onChange={(e) => {
                  const nextMethod = e.target.value as AttendanceMethod;
                  setEditing({
                    ...editing,
                    method: nextMethod,
                    autoSmsOnEntry:
                      nextMethod === AttendanceMethod.RFID ? editing.autoSmsOnEntry : false,
                    autoSmsOnExit:
                      nextMethod === AttendanceMethod.RFID ? editing.autoSmsOnExit : false,
                  });
                }}
              >
                <option value={AttendanceMethod.MANUAL}>
                  {pick('হাতে রেজিস্টার (Manual)', 'Manual Register')}
                </option>
                <option value={AttendanceMethod.RFID}>
                  {pick('RFID গেট কার্ড স্ক্যান (RFID)', 'RFID Gate Card Scan')}
                </option>
              </Select>
            </FormField>

            {editing.method === AttendanceMethod.RFID &&
              editingRow &&
              editingRow.missingCards > 0 && (
                <div className="rounded-[var(--radius)] border border-warning/40 bg-warning/10 p-3 text-xs text-foreground flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p>
                      {pick(
                        `এই শ্রেণির ${formatNumber(editingRow.missingCards, 'bn')} জন সক্রিয় শিক্ষার্থীর এখনো সক্রিয় RFID কার্ড নেই (${formatNumber(editingRow.studentsWithCards, 'bn')}/${formatNumber(editingRow.totalStudents, 'bn')})।`,
                        `${editingRow.missingCards} active student(s) in this class do not have an active RFID card yet (${editingRow.studentsWithCards}/${editingRow.totalStudents}).`
                      )}
                    </p>
                    <Link
                      href="/admin/students/rfid-cards"
                      className="text-primary font-medium hover:underline inline-block"
                    >
                      {pick('কার্ড ইস্যু পৃষ্ঠায় যান →', 'Go to RFID Card Management →')}
                    </Link>
                  </div>
                </div>
              )}

            <FormField
              label={pick('দেরির সময়সীমা (Late Cutoff)', 'Late Threshold Time')}
              hint={pick('এই সময়ের পর প্রবেশ করলে "দেরি" হিসেবে গণ্য হবে।', 'Arrivals after this time are automatically marked Late.')}
              required
            >
              <Input
                type="time"
                value={editing.lateThresholdTime}
                onChange={(e) => setEditing({ ...editing, lateThresholdTime: e.target.value })}
                className="tabular-nums"
              />
            </FormField>

            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground">
                {pick('অভিভাবক এসএমএস ট্রিগার', 'Guardian SMS Triggers')}
              </p>
              <Switch
                checked={editing.autoSmsOnAbsent}
                onChange={(checked) => setEditing({ ...editing, autoSmsOnAbsent: checked })}
                label={pick('অনুপস্থিত হলে স্বয়ংক্রিয় SMS পাঠান', 'Auto-SMS when marked Absent')}
              />
              <Switch
                checked={editing.autoSmsOnEntry}
                disabled={editing.method !== AttendanceMethod.RFID}
                onChange={(checked) => setEditing({ ...editing, autoSmsOnEntry: checked })}
                label={pick('RFID গেটে প্রবেশের সময় SMS পাঠান', 'Auto-SMS on RFID Gate Entry')}
              />
              <Switch
                checked={editing.autoSmsOnExit}
                disabled={editing.method !== AttendanceMethod.RFID}
                onChange={(checked) => setEditing({ ...editing, autoSmsOnExit: checked })}
                label={pick('RFID গেট থেকে প্রস্থানের সময় SMS পাঠান', 'Auto-SMS on RFID Gate Exit')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setEditing(null)}>
                {pick('বাতিল', 'Cancel')}
              </Button>
              <Button variant="primary" disabled={isLoading} onClick={handleSave}>
                {isLoading ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save Rules')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SmsToggleIndicator({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/10 text-success">
      <Check className="w-3.5 h-3.5" />
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-muted text-muted-foreground">
      <Minus className="w-3.5 h-3.5" />
    </span>
  );
}
