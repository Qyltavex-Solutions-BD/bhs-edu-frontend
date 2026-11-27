'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Lock,
  Send,
  ShieldAlert,
  Unlock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetExamsQuery,
  useGetExamSubjectsQuery,
  useGetTabulationSheetQuery,
  useProcessExamResultsLiveMutation,
  usePublishExamResultsMutation,
  useUpdateExamMutation,
  useWithholdExamResultsMutation,
} from '@/src/features/examinations/api/examinations.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { ResultPublicationStatus } from '@/src/types/enums';

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const data = (err as { data?: { message?: unknown } }).data;
    if (data && typeof data.message === 'string') return data.message;
    if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
  }
  return fallback;
}

export function ResultPublicationView() {
  const { data: examsRes, isLoading: loadingExams } = useGetExamsQuery({
    limit: 100,
    isDeleted: false,
  });
  const { data: allClasses = [] } = useGetSchoolClassesQuery();

  const [updateExam, { isLoading: updatingExam }] = useUpdateExamMutation();
  const [processResults, { isLoading: processing }] = useProcessExamResultsLiveMutation();
  const [publishResults, { isLoading: publishing }] = usePublishExamResultsMutation();
  const [withholdResults, { isLoading: withholding }] = useWithholdExamResultsMutation();

  const [selectedExamName, setSelectedExamName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState(() => {
    const next = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return next.toISOString().slice(0, 10);
  });

  const activeClasses = useMemo(
    () =>
      [...allClasses]
        .filter((c) => c.isActive)
        .sort((a, b) => a.numericValue - b.numericValue),
    [allClasses]
  );

  const activeExams = useMemo(() => {
    const items = [...(examsRes?.items ?? [])];
    return items.sort(
      (a, b) =>
        (a.schoolClass?.numericValue ?? 99) - (b.schoolClass?.numericValue ?? 99)
    );
  }, [examsRes?.items]);

  const examNames = useMemo(
    () => Array.from(new Set(activeExams.map((e) => e.name))),
    [activeExams]
  );

  const resolvedExamName =
    selectedExamName && examNames.includes(selectedExamName)
      ? selectedExamName
      : examNames[0] ?? '';

  const resolvedClassId =
    selectedClassId && activeClasses.some((c) => c.id === selectedClassId)
      ? selectedClassId
      : activeClasses[0]?.id ?? '';

  const activeExam =
    activeExams.find(
      (e) => e.name === resolvedExamName && e.classId === resolvedClassId
    ) ?? null;

  const resolvedExamId = activeExam?.id ?? '';

  const { data: examSubjects = [] } =
    useGetExamSubjectsQuery(resolvedExamId, { skip: !resolvedExamId });

  const { data: yearEnrollments = [] } = useGetEnrollmentsQuery(
    { academicYearId: activeExam?.academicYearId },
    { skip: !activeExam }
  );

  const enrollments = useMemo(
    () =>
      yearEnrollments.filter(
        (e) => e.classId === activeExam?.classId && e.status === 'ACTIVE'
      ),
    [yearEnrollments, activeExam?.classId]
  );

  const { data: tabulationData, isFetching: loadingTabulation } =
    useGetTabulationSheetQuery(
      { examId: resolvedExamId },
      { skip: !resolvedExamId }
    );

  const tabulationRows = tabulationData?.tabulation ?? [];
  const totalStudents = enrollments.length;

  // Subject-wise performance from processed tabulation
  const subjectAnalytics = useMemo(() => {
    return examSubjects.map((es) => {
      const subjectScores = tabulationRows
        .map((r) => r.subjects.find((s) => s.examSubjectId === es.id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s));

      const present = subjectScores.filter((s) => !s.isAbsent);
      const passed = subjectScores.filter((s) => s.isPassed);
      const totals = present.map((s) => s.totalMarks);
      const avg =
        totals.length > 0
          ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 10) / 10
          : 0;
      const highest = totals.length > 0 ? Math.max(...totals) : 0;
      const lowest = totals.length > 0 ? Math.min(...totals) : 0;
      const passRate =
        subjectScores.length > 0
          ? Math.round((passed.length / subjectScores.length) * 100)
          : 0;

      return {
        es,
        evaluatedCount: subjectScores.length,
        passedCount: passed.length,
        failedCount: subjectScores.length - passed.length,
        passRate,
        avg,
        highest,
        lowest,
      };
    });
  }, [examSubjects, tabulationRows]);

  // Grade Distribution across processed students
  const gradeDistribution = useMemo(() => {
    const order = ['A+', 'A', 'A-', 'B', 'C', 'D', 'F'];
    const map = new Map<string, number>();
    order.forEach((g) => map.set(g, 0));
    tabulationRows.forEach((r) => {
      const lg = r.letterGrade || 'F';
      map.set(lg, (map.get(lg) ?? 0) + 1);
    });
    return order.map((grade) => ({
      grade,
      count: map.get(grade) ?? 0,
      pct:
        tabulationRows.length > 0
          ? Math.round(((map.get(grade) ?? 0) / tabulationRows.length) * 100)
          : 0,
    }));
  }, [tabulationRows]);

  const busy = updatingExam || processing || publishing || withholding;

  const deadlineExpired = Boolean(
    activeExam?.marksEntryDeadline &&
      new Date(activeExam.marksEntryDeadline) < new Date()
  );
  const canLockExam = Boolean(!activeExam?.marksEntryDeadline || deadlineExpired);

  const handleToggleExamLock = async (lockState: boolean) => {
    if (!activeExam) return;
    if (lockState && !canLockExam) {
      toast.info(
        `নম্বর এন্ট্রির শেষ তারিখ (${formatDateShort(activeExam.marksEntryDeadline!, 'bn')}) পার হওয়ার পর পরীক্ষা লক করা যাবে।`
      );
      return;
    }
    try {
      await updateExam({ id: activeExam.id, isLocked: lockState }).unwrap();
      toast.success(
        lockState
          ? 'পরীক্ষার নম্বর লক করা হয়েছে।'
          : 'পরীক্ষা আনলক করা হয়েছে।'
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'অবস্থা পরিবর্তন করা যায়নি।'));
    }
  };

  const handleUnlockWithDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam) return;
    try {
      await updateExam({
        id: activeExam.id,
        isLocked: false,
        marksEntryDeadline: newDeadline || undefined,
      }).unwrap();
      toast.success(
        'পরীক্ষা আনলক ও নম্বর এন্ট্রির সময়সীমা হালনাগাদ হয়েছে।'
      );
      setUnlockModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'আনলক করা যায়নি।'));
    }
  };

  const handleCalculateResults = async (allowIncomplete = false) => {
    if (!activeExam) return;
    try {
      await processResults({
        examId: activeExam.id,
        forceRecalculate: true,
        lockExamOnProcess: false,
        allowIncomplete,
      }).unwrap();
      toast.success(
        'এনসিটিবি নীতি অনুযায়ী ফলাফল, জিপিএ ও মেধাক্রম গণনা সম্পন্ন হয়েছে।'
      );
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          'ফলাফল প্রক্রিয়াকরণ ব্যর্থ হয়েছে।'
        )
      );
    }
  };

  const handlePublishConfirm = async () => {
    if (!activeExam) return;
    try {
      await publishResults(activeExam.id).unwrap();
      toast.success(
        'ফলাফল আনুষ্ঠানিকভাবে প্রকাশিত হয়েছে এবং নম্বরগুলো লক করা হয়েছে।'
      );
      setPublishModalOpen(false);
    } catch (err) {
      toast.error(
        getErrorMessage(err, 'ফলাফল প্রকাশ ব্যর্থ হয়েছে।')
      );
    }
  };

  const handleWithhold = async () => {
    if (!activeExam) return;
    try {
      await withholdResults(activeExam.id).unwrap();
      toast.success('ফলাফল স্থগিত (Withheld) করা হয়েছে।');
    } catch (err) {
      toast.error(
        getErrorMessage(err, 'ফলাফল স্থগিত করা যায়নি।')
      );
    }
  };

  if (loadingExams) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="ফলাফল প্রক্রিয়াকরণ ও প্রকাশ"
        titleEn="Result Processing & Publication"
        subtitleBn="নম্বর এন্ট্রি যাচাই, লক/আনলক, এনসিটিবি জিপিএ ও মেধাক্রম গণনা এবং আনুষ্ঠানিক ফলাফল প্রকাশ করুন।"
        subtitleEn="Verify marks, lock/unlock exam, calculate NCTB GPAs & merit positions, and publish results."
        actions={
          <Link href="/admin/results/merit-list">
            <Button variant="outline" className="whitespace-nowrap shrink-0">
              {'মেধাতালিকা ও মার্কশিট দেখুন'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        }
      />

      {/* Exam & Class Selector */}
      <Card className="p-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-56">
            <label className="block text-sm text-muted-foreground mb-1">
              {'পরীক্ষা নির্বাচন করুন'}
            </label>
            <Select
              value={resolvedExamName}
              disabled={examNames.length === 0}
              onChange={(e) => setSelectedExamName(e.target.value)}
              className="h-9 text-sm"
            >
              {examNames.length === 0 && (
                <option value="">{'কোনো পরীক্ষা নেই'}</option>
              )}
              {examNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:w-40">
            <label className="block text-sm text-muted-foreground mb-1">
              {'শ্রেণি'}
            </label>
            <Select
              value={resolvedClassId}
              disabled={activeClasses.length === 0}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-9 text-sm"
            >
              {activeClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBn || cls.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {activeExam && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {'মোট শিক্ষার্থী:'}{' '}
              <strong className="text-foreground">{formatNumber(totalStudents, 'bn')}</strong>
            </span>
            <span className="text-muted-foreground">
              {'মোট বিষয়:'}{' '}
              <strong className="text-foreground">{formatNumber(examSubjects.length, 'bn')}</strong>
            </span>
            <StatusBadge
              enumName="ResultPublicationStatus"
              value={activeExam.resultStatus as ResultPublicationStatus}
            />
          </div>
        )}
      </Card>

      {!activeExam ? (
        <EmptyState
          title={'এই শ্রেণির জন্য পরীক্ষা পাওয়া যায়নি'}
          description={'নির্বাচিত পরীক্ষা ও শ্রেণির জন্য কোনো পরীক্ষা তৈরি করা হয়নি।'}
        />
      ) : (
        <>
          {/* 4-Step Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{'ধাপ ১'}</p>
                <h3 className="font-bold text-foreground mt-0.5">
                  {'নম্বর এন্ট্রি যাচাই'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {`${formatNumber(examSubjects.length, 'bn')}টি বিষয়ের নম্বর রিভিউ ও লক যাচাই করুন।`}
                </p>
              </div>
              <Link href={`/admin/examinations/marks-entry?examId=${activeExam.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  {'নম্বর এন্ট্রি শিট খুলুন'}
                </Button>
              </Link>
            </Card>

            <Card className="p-4 flex flex-col justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{'ধাপ ২'}</p>
                <h3 className="font-bold text-foreground mt-0.5">
                  {'পরীক্ষা লক / আনলক'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeExam.isLocked
                    ? 'বর্তমানে লক করা আছে। আনলক করলে সময়সীমা বাড়ানো যাবে।'
                    : 'ফলাফল গণনার আগে পরীক্ষা লক করা নিরাপদ।'}
                </p>
              </div>
              {activeExam.isLocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={busy || activeExam.resultStatus === ResultPublicationStatus.PUBLISHED}
                  onClick={() => setUnlockModalOpen(true)}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  {'আনলক ও সময়সীমা বাড়ান'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={busy || !canLockExam}
                  onClick={() => handleToggleExamLock(true)}
                  title={
                    !canLockExam && activeExam.marksEntryDeadline
                      ? `শেষ তারিখ (${formatDateShort(activeExam.marksEntryDeadline, 'bn')}) পার হলে লক করা যাবে`
                      : undefined
                  }
                >
                  <Lock className="w-3.5 h-3.5" />
                  {'পরীক্ষা লক করুন'}
                </Button>
              )}
            </Card>

            <Card className="p-4 flex flex-col justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{'ধাপ ৩'}</p>
                <h3 className="font-bold text-foreground mt-0.5">
                  {'জিপিএ ও মেধাক্রম গণনা'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {'প্রক্রিয়াকৃত ফলাফল:'}{' '}
                  <strong>{formatNumber(tabulationRows.length, 'bn')}</strong>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={busy}
                onClick={() => handleCalculateResults(true)}
              >
                <Calculator className="w-3.5 h-3.5" />
                {processing
                  ? 'গণনা হচ্ছে...'
                  : 'ফলাফল প্রক্রিয়াকরণ'}
              </Button>
            </Card>

            <Card className="p-4 flex flex-col justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{'ধাপ ৪'}</p>
                <h3 className="font-bold text-foreground mt-0.5">
                  {'প্রকাশ / স্থগিত'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
                    ? 'শিক্ষার্থী ও অভিভাবক পোর্টালে ফলাফল লাইভ আছে।'
                    : 'যাচাই শেষে শিক্ষার্থী ও অভিভাবকদের জন্য প্রকাশ করুন।'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={busy || tabulationRows.length === 0}
                  onClick={() => setPublishModalOpen(true)}
                >
                  <Send className="w-3.5 h-3.5" />
                  {'প্রকাশ করুন'}
                </Button>
                {activeExam.resultStatus === ResultPublicationStatus.PUBLISHED && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={handleWithhold}
                    title={'ফলাফল স্থগিত করুন'}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Subject-wise Performance & Grade Distribution Analytics */}
          {loadingTabulation ? (
            <LoadingSkeleton rows={4} />
          ) : tabulationRows.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <Card className="lg:col-span-8 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">
                      {'বিষয়ভিত্তিক ফলাফল বিশ্লেষণ'}
                    </h3>
                  </div>
                  {tabulationData?.summary && (
                    <span className="text-sm text-muted-foreground">
                      {`মোট পাস: ${formatNumber(tabulationData.summary.passedCount, 'bn')} / ${formatNumber(tabulationData.summary.totalStudents, 'bn')} (${formatNumber(tabulationData.summary.passPercentage, 'bn')}%)`}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-base">
                    <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border text-sm font-semibold">
                      <tr>
                        <th className="px-3 py-2.5 text-left">{'বিষয়'}</th>
                        <th className="px-2.5 py-2.5 text-center">{'উত্তীর্ণ / ফেল'}</th>
                        <th className="px-2.5 py-2.5 text-right">{'পাসের হার'}</th>
                        <th className="px-2.5 py-2.5 text-right">{'গড় নম্বর'}</th>
                        <th className="px-2.5 py-2.5 text-right">{'সর্বোচ্চ / সর্বনিম্ন'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {subjectAnalytics.map((row) => (
                        <tr key={row.es.id}>
                          <td className="px-3 py-2 font-medium text-foreground">
                            {row.es.subject?.nameBn || row.es.subject?.name}
                          </td>
                          <td className="px-2.5 py-2 text-center">
                            <span className="text-success font-semibold">
                              {formatNumber(row.passedCount, 'bn')}
                            </span>{' '}
                            /{' '}
                            <span className="text-destructive font-semibold">
                              {formatNumber(row.failedCount, 'bn')}
                            </span>
                          </td>
                          <td className="px-2.5 py-2 text-right font-semibold">
                            {formatNumber(row.passRate, 'bn')}%
                          </td>
                          <td className="px-2.5 py-2 text-right">
                            {formatNumber(row.avg, 'bn', 1)}
                          </td>
                          <td className="px-2.5 py-2 text-right">
                            {formatNumber(row.highest, 'bn')} / {formatNumber(row.lowest, 'bn')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="lg:col-span-4 p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground">
                  {'গ্রেড বণ্টন (Grade Distribution)'}
                </h3>
                <div className="space-y-2.5">
                  {gradeDistribution.map((g) => (
                    <div key={g.grade} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`font-bold ${
                            g.grade === 'F' ? 'text-destructive' : 'text-foreground'
                          }`}
                        >
                          {g.grade}
                        </span>
                        <span className="text-muted-foreground">
                          {formatNumber(g.count, 'bn')} ({formatNumber(g.pct, 'bn')}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            g.grade === 'F' ? 'bg-destructive' : 'bg-primary'
                          }`}
                          style={{ width: `${g.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              {'এখনো ফলাফল প্রক্রিয়াকরণ করা হয়নি। ধাপ ৩ থেকে "ফলাফল প্রক্রিয়াকরণ" বাটনে ক্লিক করে GPA ও মেধাক্রম তৈরি করুন।'}
            </Card>
          )}
        </>
      )}

      {/* Publish Confirmation Modal */}
      <Modal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title={'ফলাফল প্রকাশ নিশ্চিতকরণ'}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {`আপনি কি নিশ্চিতভাবে "${activeExam?.name ?? ''}" পরীক্ষার ফলাফল আনুষ্ঠানিকভাবে প্রকাশ করতে চান? প্রকাশ করলে সব নম্বর স্থায়ীভাবে লক হয়ে যাবে এবং শিক্ষার্থী-অভিভাবকরা ফলাফল দেখতে পাবেন।`}
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setPublishModalOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button onClick={handlePublishConfirm} disabled={publishing}>
              <Send className="w-4 h-4 mr-1.5" />
              {publishing
                ? 'প্রকাশ হচ্ছে...'
                : 'নিশ্চিত ও প্রকাশ করুন'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unlock & Extend Deadline Modal */}
      <Modal
        open={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        title={'পরীক্ষা আনলক ও সময়সীমা বর্ধিতকরণ'}
      >
        <form onSubmit={handleUnlockWithDeadline} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {'নম্বর এন্ট্রি পুনরায় চালু করতে পরীক্ষার লক খুলুন এবং নতুন শেষ তারিখ নির্ধারণ করুন।'}
          </p>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {'নতুন সময়সীমা (তারিখ)'}
            </label>
            <Input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setUnlockModalOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" disabled={updatingExam}>
              <Unlock className="w-4 h-4 mr-1.5" />
              {updatingExam
                ? 'হালনাগাদ হচ্ছে...'
                : 'আনলক করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
