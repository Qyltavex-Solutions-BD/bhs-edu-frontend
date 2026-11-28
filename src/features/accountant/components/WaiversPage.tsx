'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Award, Check, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Input, Select } from '@/src/components/ui/primitives';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import { formatNumber } from '@/src/lib/formatters';
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

  const {
    data: waivers = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetWaiversQuery(
    activeYearId ? { academicYearId: activeYearId } : undefined
  );
  const { data: enrollments = [] } = useGetEnrollmentsQuery(
    activeYearId ? { academicYearId: activeYearId } : undefined
  );
  const { data: feeHeads = [] } = useGetFeeHeadsQuery();

  const [saveWaiver, { isLoading: saving }] = useSaveWaiverMutation();
  const [deleteWaiver] = useDeleteWaiverMutation();

  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [feeHeadId, setFeeHeadId] = useState('');
  const [type, setType] = useState<WaiverType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  const availableSections = useMemo(() => {
    const map = new Map<string, string>();
    for (const en of enrollments as any[]) {
      if (classFilter && en.classId !== classFilter) continue;
      if (en.sectionId && en.section?.name && !map.has(en.sectionId)) {
        map.set(en.sectionId, en.section.name);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrollments, classFilter]);

  const filteredEnrollments = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return (enrollments as any[])
      .filter((en) => {
        if (classFilter && en.classId !== classFilter) return false;
        if (sectionFilter && en.sectionId !== sectionFilter) return false;
        if (!q) return true;
        const name = `${en.student?.nameBn ?? ''} ${en.student?.nameEn ?? ''} ${en.student?.name ?? ''}`.toLowerCase();
        const roll = String(en.roll ?? en.rollNumber ?? '').toLowerCase();
        return name.includes(q) || roll.includes(q);
      })
      .slice(0, 80);
  }, [enrollments, classFilter, sectionFilter, studentSearch]);

  const selectedEnrollment = useMemo(
    () => (enrollments as any[]).find((en) => en.id === enrollmentId) ?? null,
    [enrollments, enrollmentId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollmentId) {
      toast.error('তালিকা থেকে একজন শিক্ষার্থী নির্বাচন করুন।');
      return;
    }
    if (!value || Number(value) <= 0) {
      toast.error('ছাড়ের সঠিক পরিমাণ দিন।');
      return;
    }
    if (type === 'PERCENTAGE' && Number(value) > 100) {
      toast.error('শতাংশ ১০০-এর বেশি হতে পারবে না।');
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
      setStudentSearch('');
      setValue('');
      setReason('');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'বৃত্তি সংরক্ষণ করা যায়নি।');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'বৃত্তি ও ফি ছাড় ব্যবস্থাপনা'}
        description={'মেধাবী, দরিদ্র ও বিশেষ কোটার শিক্ষার্থীদের জন্য শতাংশ বা নির্দিষ্ট টাকার ফি ছাড় নির্ধারণ করুন'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="p-5">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-primary" />
            {'নতুন বৃত্তি / ছাড় যোগ করুন'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {selectedEnrollment ? (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-primary">{'নির্বাচিত শিক্ষার্থী'}</p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {selectedEnrollment.student?.nameBn ||
                      selectedEnrollment.student?.nameEn ||
                      selectedEnrollment.student?.name}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {(selectedEnrollment.schoolClass?.nameBn ??
                      selectedEnrollment.schoolClass?.name ??
                      ''
                    )
                      .replace(/\s*শ্রেণি\s*/g, '')
                      .trim()}
                    {selectedEnrollment.section?.name
                      ? ` (${selectedEnrollment.section.name})`
                      : ''}{' '}
                    -{' '}
                    {selectedEnrollment.roll != null
                      ? formatNumber(selectedEnrollment.roll, 'bn')
                      : '—'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEnrollmentId('')}
                >
                  <X className="w-3.5 h-3.5" />
                  {'পরিবর্তন'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <FormField label={'শ্রেণি'}>
                    <Select
                      id="waiver-class-filter"
                      name="classId"
                      value={classFilter}
                      onChange={(e) => {
                        setClassFilter(e.target.value);
                        setSectionFilter('');
                      }}
                    >
                      <option value="">{'সকল শ্রেণি'}</option>
                      {(ctx?.classes ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameBn || c.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label={'শাখা'}>
                    <Select
                      id="waiver-section-filter"
                      name="sectionId"
                      value={sectionFilter}
                      onChange={(e) => setSectionFilter(e.target.value)}
                    >
                      <option value="">{'সকল শাখা'}</option>
                      {availableSections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <FormField label={'শিক্ষার্থী নির্বাচন করুন (ক্লিক করুন)'}>
                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="waiver-student-search"
                      name="studentSearch"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="নাম বা রোল লিখে খুঁজুন..."
                      className="pl-9"
                    />
                  </div>
                </FormField>

                <div className="max-h-48 overflow-y-auto divide-y divide-border border border-border rounded-lg">
                  {filteredEnrollments.length === 0 ? (
                    <p className="p-4 text-xs text-muted-foreground text-center">
                      {'কোনো শিক্ষার্থী পাওয়া যায়নি'}
                    </p>
                  ) : (
                    filteredEnrollments.map((en: any) => {
                      const clsShort = (
                        en.schoolClass?.nameBn ??
                        en.schoolClass?.name ??
                        ''
                      )
                        .replace(/\s*শ্রেণি\s*/g, '')
                        .trim();
                      const rollVal = en.roll ?? en.rollNumber;
                      return (
                        <button
                          key={en.id}
                          type="button"
                          onClick={() => setEnrollmentId(en.id)}
                          className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {en.student?.nameBn || en.student?.nameEn || en.student?.name}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {clsShort}
                              {en.section?.name ? ` (${en.section.name})` : ''} -{' '}
                              {rollVal != null ? formatNumber(Number(rollVal), 'bn') : '—'}
                            </p>
                          </div>
                          <Check className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <FormField label={'প্রযোজ্য ফি খাত'}>
              <Select
                id="waiver-fee-head"
                name="feeHeadId"
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
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label={'ছাড়ের ধরন'}>
                <Select
                  id="waiver-type"
                  name="waiverType"
                  value={type}
                  onChange={(e) => setType(e.target.value as WaiverType)}
                >
                  <option value="PERCENTAGE">{'শতাংশ (%)'}</option>
                  <option value="FIXED">{'নির্দিষ্ট টাকা (৳)'}</option>
                </Select>
              </FormField>
              <FormField label={'পরিমাণ'}>
                <Input
                  id="waiver-value"
                  name="value"
                  type="text"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder={type === 'PERCENTAGE' ? 'যেমন: 50' : 'যেমন: 300'}
                />
              </FormField>
            </div>

            <FormField label={'কারণ / মন্তব্য (ঐচ্ছিক)'}>
              <Input
                id="waiver-reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="যেমন: মেধা বৃত্তি বা এতিম কোটা"
              />
            </FormField>

            <Button type="submit" variant="primary" className="w-full" disabled={saving}>
              <Plus className="w-4 h-4" />
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'ছাড় সংরক্ষণ করুন'}
            </Button>
          </form>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-bold text-foreground">
              {'সক্রিয় বৃত্তি ও ছাড় তালিকা'}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
              {`${formatNumber(waivers.length, 'bn')}টি`}
            </span>
          </div>

          {isLoading || isFetching ? (
            <LoadingSkeleton rows={5} />
          ) : isError ? (
            <div className="p-4 rounded-lg border border-destructive/40 bg-destructive/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm text-destructive font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{'বৃত্তি ও ছাড়ের তালিকা লোড করা যায়নি।'}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
                {'পুনরায় চেষ্টা করুন'}
              </Button>
            </div>
          ) : waivers.length === 0 ? (
            <EmptyState
              title={'কোনো বৃত্তি বা ছাড় নির্ধারিত নেই'}
              description={'বাম পাশের ফর্ম ব্যবহার করে শিক্ষার্থীর ফি ছাড় নির্ধারণ করুন।'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-3">{'শিক্ষার্থী'}</th>
                    <th className="py-3 px-3">{'শ্রেণি ও রোল'}</th>
                    <th className="py-3 px-3">{'ফি খাত'}</th>
                    <th className="py-3 px-3">{'ছাড়'}</th>
                    <th className="py-3 px-3">{'কারণ'}</th>
                    <th className="py-3 px-3 text-right">{'মুছুন'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {waivers.map((w) => {
                    const shortClass = (w.enrollment?.schoolClass.nameBn || '—')
                      .replace(/\s*শ্রেণি\s*/g, '')
                      .trim();
                    const rollText =
                      w.enrollment?.roll != null
                        ? formatNumber(w.enrollment.roll, 'bn')
                        : '—';
                    return (
                      <tr key={w.id} className="hover:bg-muted/20">
                        <td className="py-3 px-3 font-medium">
                          {w.enrollment?.student.nameBn || w.enrollment?.student.nameEn || '—'}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap tabular-nums">
                          {shortClass} - {rollText}
                        </td>
                        <td className="py-3 px-3">{w.feeHead?.name ?? 'সকল ফি খাত'}</td>
                        <td className="py-3 px-3 font-semibold text-primary tabular-nums whitespace-nowrap">
                          {w.waiverType === 'PERCENTAGE'
                            ? `${formatNumber(w.value, 'bn')}%`
                            : formatTaka(w.value)}
                          <span className="block text-xs font-normal text-muted-foreground">
                            {WAIVER_TYPE_LABELS[w.waiverType]}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">{w.reason || '—'}</td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await deleteWaiver(w.id).unwrap();
                                toast.success('ছাড় বাতিল করা হয়েছে।');
                              } catch (err: any) {
                                const msg = err?.data?.message || err?.message;
                                toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'বাতিল করা যায়নি।');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
