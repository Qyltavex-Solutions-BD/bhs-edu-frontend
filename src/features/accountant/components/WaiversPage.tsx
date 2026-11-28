'use client';

import React, { useMemo, useState } from 'react';
import { Award, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import {
  useDeleteWaiverMutation,
  useGetFeeHeadsQuery,
  useGetFinanceContextQuery,
  useGetWaiversQuery,
  useSaveWaiverMutation,
  type WaiverType,
} from '../api/finance.api';
import { formatTaka, WAIVER_TYPE_LABELS } from './finance-ui';

export function WaiversPage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const activeYearId = ctx?.activeAcademicYear?.id;

  const { data: waivers = [], isLoading } = useGetWaiversQuery(
    activeYearId ? { academicYearId: activeYearId } : undefined
  );
  const { data: enrollments = [] } = useGetEnrollmentsQuery(
    activeYearId ? { academicYearId: activeYearId } : undefined
  );
  const { data: feeHeads = [] } = useGetFeeHeadsQuery();

  const [saveWaiver, { isLoading: saving }] = useSaveWaiverMutation();
  const [deleteWaiver] = useDeleteWaiverMutation();

  const [studentSearch, setStudentSearch] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [feeHeadId, setFeeHeadId] = useState('');
  const [type, setType] = useState<WaiverType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  const filteredEnrollments = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return enrollments.slice(0, 100);
    return enrollments
      .filter((en: any) => {
        const name = `${en.student?.nameBn ?? ''} ${en.student?.nameEn ?? ''} ${en.student?.name ?? ''}`.toLowerCase();
        const code = String(en.student?.studentId ?? en.student?.studentIdCode ?? '').toLowerCase();
        return name.includes(q) || code.includes(q);
      })
      .slice(0, 100);
  }, [enrollments, studentSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollmentId || !value || Number(value) <= 0) {
      toast.error('শিক্ষার্থী এবং ছাড়ের সঠিক পরিমাণ দিন।');
      return;
    }
    try {
      await saveWaiver({
        academicYearId: activeYearId,
        studentEnrollmentId: enrollmentId,
        feeHeadId: feeHeadId || undefined,
        waiverType: type,
        value: Number(value),
        reason: reason.trim() || undefined,
      }).unwrap();
      toast.success('বৃত্তি / ফি ছাড় সফলভাবে সংরক্ষিত হয়েছে।');
      setEnrollmentId('');
      setValue('');
      setReason('');
    } catch (err: any) {
      toast.error(err?.message || 'বৃত্তি সংরক্ষণ করা যায়নি।');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'বৃত্তি ও ফি ছাড় ব্যবস্থাপনা'}
        description={'মেধাবী, দরিদ্র ও বিশেষ কোটার শিক্ষার্থীদের জন্য শতাংশ বা নির্দিষ্ট টাকার ফি ছাড় নির্ধারণ করুন'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-primary" />
            {'নতুন বৃত্তি / ছাড় যোগ করুন'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                {'শিক্ষার্থী খুঁজুন'}
              </label>
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="নাম বা আইডি লিখুন..."
                className="mb-2"
              />
              <Select
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
              >
                <option value="">{'— শিক্ষার্থী নির্বাচন করুন —'}</option>
                {filteredEnrollments.map((en: any) => (
                  <option key={en.id} value={en.id}>
                    {`${en.student?.nameBn || en.student?.nameEn || en.student?.name} (${en.schoolClass?.nameBn ?? en.schoolClass?.name}, রোল ${en.roll ?? en.rollNumber ?? '—'})`}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {'প্রযোজ্য ফি খাত'}
              </label>
              <Select
                value={feeHeadId}
                onChange={(e) => setFeeHeadId(e.target.value)}
              >
                <option value="">{'সকল ফি খাতের জন্য প্রযোজ্য'}</option>
                {feeHeads.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{'ছাড়ের ধরন'}</label>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as WaiverType)}
                >
                  <option value="PERCENTAGE">{'শতাংশ (%)'}</option>
                  <option value="FIXED">{'নির্দিষ্ট টাকা (৳)'}</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{'পরিমাণ'}</label>
                <Input
                  type="number"
                  min={1}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === 'PERCENTAGE' ? 'যেমন: ৫০' : 'যেমন: ৩০০'}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {'কারণ / মন্তব্য (ঐচ্ছিক)'}
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="যেমন: মেধা বৃত্তি বা এতিম কোটা"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={saving}>
              <Plus className="w-4 h-4" />
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'ছাড় সংরক্ষণ করুন'}
            </Button>
          </form>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground mb-4">
            {'সক্রিয় বৃত্তি ও ছাড় তালিকা'}
          </h2>
          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : waivers.length === 0 ? (
            <EmptyState
              title={'কোনো বৃত্তি বা ছাড় নির্ধারিত নেই'}
              description={'বাম পাশের ফর্ম ব্যবহার করে শিক্ষার্থীর ফি ছাড় নির্ধারণ করুন।'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="py-2 pr-4">{'শিক্ষার্থী'}</th>
                    <th className="py-2 pr-4">{'ফি খাত'}</th>
                    <th className="py-2 pr-4">{'ছাড়'}</th>
                    <th className="py-2 pr-4">{'কারণ'}</th>
                    <th className="py-2 text-right">{'মুছুন'}</th>
                  </tr>
                </thead>
                <tbody>
                  {waivers.map((w) => (
                    <tr key={w.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium">
                          {w.enrollment?.student.nameBn || w.enrollment?.student.nameEn || '—'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {w.enrollment?.schoolClass.nameBn} · {'রোল'}{' '}
                          {w.enrollment?.roll ?? '—'}
                        </p>
                      </td>
                      <td className="py-2.5 pr-4 text-sm">
                        {w.feeHead?.name ?? 'সকল ফি খাত'}
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-primary tabular-nums">
                        {w.waiverType === 'PERCENTAGE'
                          ? `${w.value}%`
                          : formatTaka(w.value)}
                        <span className="block text-sm font-normal text-muted-foreground">
                          {WAIVER_TYPE_LABELS[w.waiverType]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-sm text-muted-foreground">
                        {w.reason || '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await deleteWaiver(w.id).unwrap();
                              toast.success('ছাড় বাতিল করা হয়েছে।');
                            } catch (err: any) {
                              toast.error(err?.message || 'বাতিল করা যায়নি।');
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
