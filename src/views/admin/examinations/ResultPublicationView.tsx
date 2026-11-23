'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Lock,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  Unlock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetBootstrapQuery,
  useProcessExamResultsMutation,
  useUpsertResultScrutinyMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { ResultPublicationStatus, ResultStatus } from '@/src/types/enums';
import type { ResultScrutinyRequest, ScrutinyStatus } from '@/src/types/entities';
import { buildExamCompleteness, getExamEnrolledStudents } from './ExamShared';

export function ResultPublicationView() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [processResults, { isLoading: processing }] = useProcessExamResultsMutation();
  const [upsertScrutiny, { isLoading: savingScrutiny }] = useUpsertResultScrutinyMutation();

  const [selectedExamId, setSelectedExamId] = useState('exam-ann-10');

  // Publish Guard Modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [sendResultSms, setSendResultSms] = useState(true);

  // Unlock & Extend Deadline Modal
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState(() => {
    const next = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return next.toISOString().slice(0, 10);
  });

  // Scrutiny / Re-evaluation Modal (New or Resolve)
  const [newScrutinyOpen, setNewScrutinyOpen] = useState(false);
  const [newScrutinyForm, setNewScrutinyForm] = useState({
    studentEnrollmentId: '',
    examSubjectId: '',
    reason: '',
  });

  const [resolvingReq, setResolvingReq] = useState<ResultScrutinyRequest | null>(null);
  const [resolveForm, setResolveForm] = useState({
    status: 'UPDATED' as ScrutinyStatus,
    written: 0,
    mcq: 0,
    practical: 0,
    ca: 0,
    reviewerNote: '',
  });

  const activeExams = useMemo(
    () => (db ? db.exams.filter((e) => !e.isDeleted) : []),
    [db]
  );

  const resolvedExamId =
    selectedExamId && activeExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : activeExams[0]?.id ?? '';

  const activeExam = activeExams.find((e) => e.id === resolvedExamId) ?? null;

  const completeness = useMemo(
    () => (db && activeExam ? buildExamCompleteness(db, activeExam) : null),
    [db, activeExam]
  );

  const examSummaries = useMemo(
    () => (db && activeExam ? db.resultSummaries.filter((r) => r.examId === activeExam.id) : []),
    [db, activeExam]
  );

  // Subject-wise Performance Analytics
  const subjectAnalytics = useMemo(() => {
    if (!db || !activeExam) return [];
    const examSubs = db.examSubjects
      .filter((es) => es.examId === activeExam.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    return examSubs.map((es) => {
      const sub = db.subjects.find((s) => s.id === es.subjectId);
      const ssr = db.studentSubjectResults.filter(
        (r) => r.examId === activeExam.id && r.examSubjectId === es.id
      );
      const marks = db.marks.filter((m) => m.examSubjectId === es.id);
      const present = ssr.filter((r) => !r.isAbsent);
      const passed = ssr.filter((r) => r.isPassed);
      const totals = present.map((r) => r.totalMarks);
      const avg = totals.length > 0 ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 10) / 10 : 0;
      const highest = totals.length > 0 ? Math.max(...totals) : 0;
      const lowest = totals.length > 0 ? Math.min(...totals) : 0;
      const passRate = ssr.length > 0 ? Math.round((passed.length / ssr.length) * 100) : 0;
      return {
        es,
        sub,
        evaluatedCount: ssr.length,
        marksEntered: marks.length,
        passedCount: passed.length,
        failedCount: ssr.length - passed.length,
        passRate,
        avg,
        highest,
        lowest,
      };
    });
  }, [db, activeExam]);

  // Grade Distribution across ResultSummaries
  const gradeDistribution = useMemo(() => {
    const order = ['A+', 'A', 'A-', 'B', 'C', 'D', 'F'];
    const map = new Map<string, number>();
    order.forEach((g) => map.set(g, 0));
    examSummaries.forEach((s) => {
      const lg = s.letterGrade ?? 'F';
      map.set(lg, (map.get(lg) ?? 0) + 1);
    });
    return order.map((grade) => ({
      grade,
      count: map.get(grade) ?? 0,
      pct: examSummaries.length > 0 ? Math.round(((map.get(grade) ?? 0) / examSummaries.length) * 100) : 0,
    }));
  }, [examSummaries]);

  const scrutinyList = useMemo(
    () =>
      db && activeExam
        ? db.resultScrutinyRequests.filter((r) => r.examId === activeExam.id)
        : [],
    [db, activeExam]
  );

  if (isLoading || !db || !activeExam || !completeness) return <LoadingSkeleton rows={6} />;

  const classEnrollments = getExamEnrolledStudents(db, activeExam);
  const examSubjects = db.examSubjects
    .filter((es) => es.examId === activeExam.id)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const handleAction = async (action: 'LOCK' | 'CALCULATE' | 'WITHHOLD') => {
    const res = await processResults({ examId: activeExam.id, action });
    if ('error' in res) {
      toast.error(pick('প্রক্রিয়াকরণ ব্যর্থ হয়েছে।', 'Action failed.'));
      return;
    }
    if (action === 'LOCK') toast.success(pick('পরীক্ষার নম্বর লক করা হয়েছে।', 'Exam marks locked.'));
    if (action === 'CALCULATE') {
      toast.success(
        pick(
          'এনসিটিবি উপাংশ-পাশ ও ৪র্থ বিষয় নীতি অনুযায়ী ফলাফল ও মেধাক্রম গণনা সম্পন্ন হয়েছে।',
          'GPA and merit positions calculated using NCTB component-pass rules.'
        )
      );
    }
    if (action === 'WITHHOLD') {
      toast.success(pick('ফলাফল স্থগিত (Withheld) করা হয়েছে।', 'Exam results withheld.'));
    }
  };

  const handleUnlockWithDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await processResults({
      examId: activeExam.id,
      action: 'UNLOCK',
      extendDeadline: newDeadline ? `${newDeadline}T23:59:00.000Z` : undefined,
    });
    if ('error' in res) {
      toast.error(pick('আনলক করা যায়নি।', 'Failed to unlock exam.'));
      return;
    }
    toast.success(pick('পরীক্ষা আনলক ও নম্বর এন্ট্রির সময়সীমা হালনাগাদ হয়েছে।', 'Exam unlocked and deadline updated.'));
    setUnlockModalOpen(false);
  };

  const handlePublishConfirm = async () => {
    const res = await processResults({
      examId: activeExam.id,
      action: 'PUBLISH',
      sendSms: sendResultSms,
    });
    if ('error' in res) {
      toast.error(pick('ফলাফল প্রকাশ ব্যর্থ হয়েছে।', 'Failed to publish results.'));
      return;
    }
    const smsCount = 'data' in res ? res.data?.smsSentCount ?? 0 : 0;
    toast.success(
      smsCount > 0
        ? pick(
            `ফলাফল প্রকাশিত হয়েছে এবং ${formatNumber(smsCount, locale)} জন অভিভাবককে SMS পাঠানো হয়েছে।`,
            `Results published and ${smsCount} guardian SMS notifications dispatched.`
          )
        : pick('ফলাফল সফলভাবে প্রকাশিত হয়েছে।', 'Results published successfully.')
    );
    setPublishModalOpen(false);
  };

  const openNewScrutiny = () => {
    setNewScrutinyForm({
      studentEnrollmentId: classEnrollments[0]?.id ?? '',
      examSubjectId: examSubjects[0]?.id ?? '',
      reason: '',
    });
    setNewScrutinyOpen(true);
  };

  const handleCreateScrutiny = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScrutinyForm.studentEnrollmentId || !newScrutinyForm.examSubjectId) return;
    const res = await upsertScrutiny({
      examId: activeExam.id,
      studentEnrollmentId: newScrutinyForm.studentEnrollmentId,
      examSubjectId: newScrutinyForm.examSubjectId,
      reason: newScrutinyForm.reason,
    });
    if ('error' in res) {
      toast.error(pick('আবেদন যুক্ত করা যায়নি।', 'Failed to create scrutiny request.'));
      return;
    }
    toast.success(pick('পুনঃনিরীক্ষণ আবেদন নথিভুক্ত হয়েছে।', 'Scrutiny request recorded.'));
    setNewScrutinyOpen(false);
  };

  const openResolveScrutiny = (req: ResultScrutinyRequest) => {
    const mk = db.marks.find(
      (m) => m.studentEnrollmentId === req.studentEnrollmentId && m.examSubjectId === req.examSubjectId
    );
    setResolvingReq(req);
    setResolveForm({
      status: 'UPDATED',
      written: mk?.writtenMarks ?? 0,
      mcq: mk?.mcqMarks ?? 0,
      practical: mk?.practicalMarks ?? 0,
      ca: mk?.continuousAssessmentMarks ?? 0,
      reviewerNote: req.reviewerNote ?? '',
    });
  };

  const handleResolveScrutiny = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingReq) return;
    const res = await upsertScrutiny({
      id: resolvingReq.id,
      examId: resolvingReq.examId,
      studentEnrollmentId: resolvingReq.studentEnrollmentId,
      examSubjectId: resolvingReq.examSubjectId,
      status: resolveForm.status,
      revisedWrittenMarks: Number(resolveForm.written),
      revisedMcqMarks: Number(resolveForm.mcq),
      revisedPracticalMarks: Number(resolveForm.practical),
      revisedCaMarks: Number(resolveForm.ca),
      reviewerNote: resolveForm.reviewerNote,
    });
    if ('error' in res) {
      const msg = (res.error as { message?: string })?.message;
      toast.error(msg || pick('পুনঃনিরীক্ষণ নিষ্পত্তি ব্যর্থ হয়েছে।', 'Failed to resolve scrutiny request.'));
      return;
    }
    toast.success(
      resolveForm.status === 'UPDATED'
        ? pick(
            'সংশোধিত নম্বর সংরক্ষিত এবং মেধাতালিকা স্বয়ংক্রিয়ভাবে পুনর্গণনা হয়েছে।',
            'Revised marks saved and merit positions recalculated automatically.'
          )
        : pick('পুনঃনিরীক্ষণ সিদ্ধান্ত সংরক্ষিত হয়েছে।', 'Scrutiny decision recorded.')
    );
    setResolvingReq(null);
  };

  const resolvingEs = resolvingReq
    ? db.examSubjects.find((es) => es.id === resolvingReq.examSubjectId)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="ফলাফল প্রক্রিয়াকরণ, প্রকাশ ও পুনঃনিরীক্ষণ"
        titleEn="Result Processing, Publication & Scrutiny"
        subtitleBn="নম্বর এন্ট্রি সম্পূর্ণতা যাচাই, লক/আনলক, এনসিটিবি জিপিএ গণনা, অভিভাবক SMS সহ প্রকাশ এবং উত্তরপত্র পুনঃনিরীক্ষণ পরিচালনা করুন।"
        subtitleEn="Verify completeness, lock marks, compute NCTB GPAs, publish with guardian SMS, and resolve re-evaluation requests."
        actions={
          <Link href="/admin/results/merit-list">
            <Button variant="outline" className="whitespace-nowrap shrink-0">
              {pick('মেধাতালিকা ও মার্কশিট দেখুন', 'Open Merit & Marksheets')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        }
      />

      {/* Exam Selector & Status */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px] max-w-md">
          <label className="block text-xs text-muted-foreground mb-1">{pick('পরীক্ষা নির্বাচন করুন', 'Examination')}</label>
          <Select value={resolvedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
            {activeExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums">
          <span className="text-muted-foreground">
            {pick('নম্বর অগ্রগতি:', 'Marks Complete:')}{' '}
            <strong className={completeness.totalMissing === 0 ? 'text-success' : 'text-warning'}>
              {formatNumber(completeness.overallPct, locale)}% ({formatNumber(completeness.totalEntered, locale)}/
              {formatNumber(completeness.totalExpected, locale)})
            </strong>
          </span>
          <StatusBadge enumName="ResultPublicationStatus" value={activeExam.resultStatus} />
        </div>
      </Card>

      {/* 4-Step Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{pick('ধাপ ১', 'Step 1')}</p>
            <h3 className="font-bold text-foreground mt-0.5">{pick('নম্বর এন্ট্রি যাচাই', 'Verify Marks Entry')}</h3>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {completeness.totalMissing === 0
                ? pick('সকল বিষয়ের নম্বর শতভাগ এন্ট্রি সম্পন্ন হয়েছে।', 'All subject marks are 100% entered.')
                : pick(
                    `${formatNumber(completeness.totalMissing, locale)}টি নম্বর এখনো বাকি আছে।`,
                    `${completeness.totalMissing} mark entries still pending.`
                  )}
            </p>
          </div>
          <Link href={`/admin/examinations/marks-entry?examId=${activeExam.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              {pick('নম্বর এন্ট্রি শিট খুলুন', 'Open Marks Grid')}
            </Button>
          </Link>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{pick('ধাপ ২', 'Step 2')}</p>
            <h3 className="font-bold text-foreground mt-0.5">{pick('নম্বর লক / আনলক', 'Lock / Unlock Marks')}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {activeExam.isLocked
                ? pick('বর্তমানে লক করা আছে। আনলক করলে ডেডলাইন বাড়ানো যাবে।', 'Marks are locked. Unlock to edit or extend deadline.')
                : pick('ফলাফল গণনার আগে নম্বর লক করা নিরাপদ।', 'Lock marks before final calculation.')}
            </p>
          </div>
          {activeExam.isLocked ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={processing}
              onClick={() => setUnlockModalOpen(true)}
            >
              <Unlock className="w-3.5 h-3.5" />
              {pick('আনলক ও সময়সীমা বাড়ান', 'Unlock & Extend')}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={processing}
              onClick={() => handleAction('LOCK')}
            >
              <Lock className="w-3.5 h-3.5" />
              {pick('নম্বর লক করুন', 'Lock Marks')}
            </Button>
          )}
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{pick('ধাপ ৩', 'Step 3')}</p>
            <h3 className="font-bold text-foreground mt-0.5">{pick('জিপিএ ও মেধাক্রম গণনা', 'Calculate GPA & Merit')}</h3>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {pick('প্রক্রিয়াকৃত ফলাফল:', 'Computed results:')}{' '}
              <strong>{formatNumber(examSummaries.length, locale)}</strong>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={processing}
            onClick={() => handleAction('CALCULATE')}
          >
            <Calculator className="w-3.5 h-3.5" />
            {pick('ফলাফল গণনা (Preview)', 'Calculate Results')}
          </Button>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{pick('ধাপ ৪', 'Step 4')}</p>
            <h3 className="font-bold text-foreground mt-0.5">{pick('প্রকাশ / স্থগিত', 'Publish / Withhold')}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {activeExam.resultStatus === ResultPublicationStatus.PUBLISHED
                ? pick('পাবলিক ও পোর্টালে ফলাফল লাইভ আছে।', 'Results are live on public search and portals.')
                : pick('যাচাই শেষে পাবলিক ও অভিভাবক পোর্টালে প্রকাশ করুন।', 'Publish to make marksheets live across portals.')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={processing}
              onClick={() => setPublishModalOpen(true)}
            >
              <Send className="w-3.5 h-3.5" />
              {pick('প্রকাশ করুন', 'Publish')}
            </Button>
            {activeExam.resultStatus === ResultPublicationStatus.PUBLISHED && (
              <Button
                variant="outline"
                size="sm"
                disabled={processing}
                onClick={() => handleAction('WITHHOLD')}
                title={pick('ফলাফল স্থগিত করুন', 'Withhold Results')}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Subject Completeness Matrix */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            {pick('বিষয়ভিত্তিক নম্বর এন্ট্রি সম্পূর্ণতা ম্যাট্রিক্স', 'Subject-wise Marks Entry Completeness')}
          </h3>
          <span className="text-xs text-muted-foreground">
            {pick('যেকোনো বিষয়ে ক্লিক করে নম্বর এন্ট্রি খুলুন', 'Click any subject to open its marks sheet')}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          {completeness.items.map((item) => (
            <Link
              key={item.examSubject.id}
              href={`/admin/examinations/marks-entry?examId=${activeExam.id}&subjectId=${item.examSubject.id}`}
              className="block p-3 rounded-[var(--radius)] border border-border hover:border-primary/50 hover:bg-surface-muted/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-foreground truncate">
                  {locale === 'bn' ? item.subject?.nameBn || item.subject?.name : item.subject?.name}
                </span>
                <span
                  className={`font-bold tabular-nums shrink-0 ${
                    item.pct === 100 ? 'text-success' : 'text-warning'
                  }`}
                >
                  {formatNumber(item.pct, locale)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface-muted overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${item.pct === 100 ? 'bg-success' : 'bg-warning'}`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                {formatNumber(item.entered, locale)} / {formatNumber(item.expected, locale)}{' '}
                {pick('শিক্ষার্থী', 'students')}
                {item.group ? ` · ${locale === 'bn' ? item.group.nameBn : item.group.name}` : ''}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      {/* Subject-wise Performance & Grade Distribution Analytics */}
      {examSummaries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card className="lg:col-span-8 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">
                {pick('বিষয়ভিত্তিক ফলাফল বিশ্লেষণ', 'Subject-wise Performance Analytics')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-3 py-2.5 text-left">{pick('বিষয়', 'Subject')}</th>
                    <th className="px-2.5 py-2.5 text-center">{pick('উত্তীর্ণ / ফেল', 'Pass / Fail')}</th>
                    <th className="px-2.5 py-2.5 text-right">{pick('পাসের হার', 'Pass %')}</th>
                    <th className="px-2.5 py-2.5 text-right">{pick('গড় নম্বর', 'Avg')}</th>
                    <th className="px-2.5 py-2.5 text-right">{pick('সর্বোচ্চ / সর্বনিম্ন', 'High / Low')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border tabular-nums">
                  {subjectAnalytics.map((row) => (
                    <tr key={row.es.id}>
                      <td className="px-3 py-2 font-medium text-foreground">
                        {locale === 'bn' ? row.sub?.nameBn || row.sub?.name : row.sub?.name}
                      </td>
                      <td className="px-2.5 py-2 text-center">
                        <span className="text-success font-semibold">{formatNumber(row.passedCount, locale)}</span> /{' '}
                        <span className="text-destructive font-semibold">{formatNumber(row.failedCount, locale)}</span>
                      </td>
                      <td className="px-2.5 py-2 text-right font-semibold">
                        {formatNumber(row.passRate, locale)}%
                      </td>
                      <td className="px-2.5 py-2 text-right">{formatNumber(row.avg, locale, 1)}</td>
                      <td className="px-2.5 py-2 text-right">
                        {formatNumber(row.highest, locale)} / {formatNumber(row.lowest, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="lg:col-span-4 p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">
              {pick('গ্রেড বণ্টন (Grade Distribution)', 'Grade Distribution')}
            </h3>
            <div className="space-y-2.5 tabular-nums">
              {gradeDistribution.map((g) => (
                <div key={g.grade} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${g.grade === 'F' ? 'text-destructive' : 'text-foreground'}`}>
                      {g.grade}
                    </span>
                    <span className="text-muted-foreground">
                      {formatNumber(g.count, locale)} ({formatNumber(g.pct, locale)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${g.grade === 'F' ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Re-evaluation / Scrutiny Requests Panel */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {pick('উত্তরপত্র পুনঃনিরীক্ষণ ও চ্যালেঞ্জ (Scrutiny)', 'Re-evaluation & Scrutiny Requests')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {pick(
                  'প্রকাশিত ফলাফলের পর খাতা পুনঃযাচাই করে নম্বর সংশোধন করলে মেধাতালিকা স্বয়ংক্রিয়ভাবে হালনাগাদ হবে।',
                  'Resolve script re-check requests; updating a mark automatically recalculates GPA and merit order.'
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openNewScrutiny}>
            <Plus className="w-3.5 h-3.5" />
            {pick('পুনঃনিরীক্ষণ আবেদন যুক্ত', 'Log Scrutiny Request')}
          </Button>
        </div>

        {scrutinyList.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {pick('এই পরীক্ষার জন্য কোনো পুনঃনিরীক্ষণ আবেদন নেই।', 'No scrutiny requests filed for this exam.')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border text-xs">
                <tr>
                  <th className="px-4 py-2.5 text-left">{pick('শিক্ষার্থী ও রোল', 'Student & Roll')}</th>
                  <th className="px-3 py-2.5 text-left">{pick('বিষয় ও কারণ', 'Subject & Reason')}</th>
                  <th className="px-3 py-2.5 text-center">{pick('পূর্বের → সংশোধিত নম্বর', 'Old → Revised')}</th>
                  <th className="px-3 py-2.5 text-center">{pick('অবস্থা', 'Status')}</th>
                  <th className="px-4 py-2.5 text-right">{pick('অ্যাকশন', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums text-xs">
                {scrutinyList.map((req) => {
                  const enr = db.enrollments.find((e) => e.id === req.studentEnrollmentId);
                  const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
                  const es = db.examSubjects.find((x) => x.id === req.examSubjectId);
                  const sub = es ? db.subjects.find((s) => s.id === es.subjectId) : null;

                  return (
                    <tr key={req.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {locale === 'bn' ? stu?.nameBn || stu?.nameEn : stu?.nameEn}
                        </div>
                        <div className="text-muted-foreground">
                          {pick('রোল:', 'Roll:')} {enr ? formatNumber(enr.roll, locale) : '—'} ·{' '}
                          {formatDateShort(req.requestedAt, locale)}
                        </div>
                      </td>
                      <td className="px-3 py-3 max-w-[280px]">
                        <div className="font-medium text-foreground">
                          {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}
                        </div>
                        <div className="text-muted-foreground">{req.reason}</div>
                        {req.reviewerNote && (
                          <div className="text-xs text-primary mt-0.5">
                            {pick('মন্তব্য:', 'Note:')} {req.reviewerNote}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold">
                        {formatNumber(req.previousTotalMarks, locale)} →{' '}
                        {req.revisedTotalMarks !== null && req.revisedTotalMarks !== undefined
                          ? formatNumber(req.revisedTotalMarks, locale)
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold">
                        <span
                          className={
                            req.status === 'UPDATED'
                              ? 'text-success'
                              : req.status === 'PENDING'
                                ? 'text-warning'
                                : 'text-muted-foreground'
                          }
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openResolveScrutiny(req)}
                        >
                          {req.status === 'PENDING' || req.status === 'UNDER_REVIEW'
                            ? pick('যাচাই ও নিষ্পত্তি', 'Review & Resolve')
                            : pick('আপডেট', 'Update')}
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

      {/* Pre-Publish Completeness Guard Modal + Guardian Result SMS */}
      <Modal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title={pick('ফলাফল প্রকাশ নিশ্চিতকরণ', 'Confirm Result Publication')}
        size="md"
      >
        <div className="space-y-4">
          {completeness.totalMissing > 0 ? (
            <div className="p-3.5 rounded-[var(--radius)] border border-warning/40 bg-warning/10 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">
                  {pick(
                    `সতর্কতা: ${formatNumber(completeness.totalMissing, locale)}টি বিষয়ের নম্বর এখনো এন্ট্রি করা হয়নি!`,
                    `Warning: ${completeness.totalMissing} subject mark entries are still missing!`
                  )}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {pick(
                    'অসম্পূর্ণ নম্বরসহ প্রকাশ করলে সংশ্লিষ্ট শিক্ষার্থীর ফলাফল অসম্পূর্ণ বা ভুল হতে পারে।',
                    'Publishing with missing marks may produce incomplete student results.'
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-[var(--radius)] border border-success/40 bg-success/10 flex items-center gap-2 text-xs text-foreground">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span>
                {pick(
                  'সকল বিষয়ের ১০০% নম্বর এন্ট্রি সম্পন্ন হয়েছে। ফলাফল প্রকাশের জন্য প্রস্তুত।',
                  '100% of marks are entered. Ready for official publication.'
                )}
              </span>
            </div>
          )}

          <label className="flex items-start gap-2.5 p-3 rounded-[var(--radius)] border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={sendResultSms}
              onChange={(e) => setSendResultSms(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              <strong className="text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                {pick('অভিভাবকদের ফলাফল SMS পাঠান', 'Dispatch Result SMS to Guardians')}
              </strong>
              <span className="block text-xs text-muted-foreground mt-0.5">
                {pick(
                  'প্রকাশের সাথে সাথে নিবন্ধিত অভিভাবকদের মোবাইলে শিক্ষার্থীর GPA ও মোট নম্বরসহ SMS পাঠানো হবে।',
                  'Automatically sends GPA and total marks SMS to registered SMS-receiver parents upon publication.'
                )}
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setPublishModalOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button onClick={handlePublishConfirm} disabled={processing}>
              <Send className="w-4 h-4" />
              {pick('এখনই ফলাফল প্রকাশ করুন', 'Publish Results Now')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unlock & Extend Deadline Modal */}
      <Modal
        open={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        title={pick('পরীক্ষা আনলক ও সময়সীমা বর্ধিতকরণ', 'Unlock Exam & Extend Deadline')}
        size="sm"
      >
        <form onSubmit={handleUnlockWithDeadline} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {pick(
              'নম্বর এন্ট্রির জন্য পরীক্ষাটি আনলক করা হবে এবং নিচের তারিখ পর্যন্ত নম্বর এন্ট্রি উন্মুক্ত থাকবে।',
              'Unlocking will re-open marks entry until the specified deadline.'
            )}
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">
              {pick('নতুন নম্বর এন্ট্রি শেষ তারিখ *', 'New Marks Entry Deadline *')}
            </label>
            <Input
              type="date"
              required
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setUnlockModalOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" disabled={processing}>
              <Unlock className="w-4 h-4" />
              {pick('আনলক করুন', 'Unlock Exam')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Scrutiny Request Modal */}
      <Modal
        open={newScrutinyOpen}
        onClose={() => setNewScrutinyOpen(false)}
        title={pick('পুনঃনিরীক্ষণ আবেদন নথিভুক্ত করুন', 'Log Re-evaluation / Scrutiny Request')}
        size="md"
      >
        <form onSubmit={handleCreateScrutiny} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{pick('শিক্ষার্থী *', 'Student *')}</label>
            <Select
              value={newScrutinyForm.studentEnrollmentId}
              onChange={(e) => setNewScrutinyForm({ ...newScrutinyForm, studentEnrollmentId: e.target.value })}
            >
              {classEnrollments.map((enr) => {
                const stu = db.students.find((s) => s.id === enr.studentId);
                return (
                  <option key={enr.id} value={enr.id}>
                    {pick('রোল', 'Roll')} {formatNumber(enr.roll, locale)} —{' '}
                    {locale === 'bn' ? stu?.nameBn || stu?.nameEn : stu?.nameEn}
                  </option>
                );
              })}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{pick('বিষয় *', 'Subject *')}</label>
            <Select
              value={newScrutinyForm.examSubjectId}
              onChange={(e) => setNewScrutinyForm({ ...newScrutinyForm, examSubjectId: e.target.value })}
            >
              {examSubjects.map((es) => {
                const sub = db.subjects.find((s) => s.id === es.subjectId);
                return (
                  <option key={es.id} value={es.id}>
                    {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name} ({sub?.officialCode})
                  </option>
                );
              })}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{pick('আবেদনের কারণ *', 'Reason *')}</label>
            <Textarea
              rows={3}
              required
              value={newScrutinyForm.reason}
              onChange={(e) => setNewScrutinyForm({ ...newScrutinyForm, reason: e.target.value })}
              placeholder={pick('যেমন: সৃজনশীল অংশে নম্বর যোগফল পুনঃযাচাই।', 'e.g. Request re-totaling of written section.')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setNewScrutinyOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" disabled={savingScrutiny}>
              {pick('নথিভুক্ত করুন', 'Submit Request')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Resolve Scrutiny Modal */}
      <Modal
        open={Boolean(resolvingReq)}
        onClose={() => setResolvingReq(null)}
        title={pick('পুনঃনিরীক্ষণ যাচাই ও নিষ্পত্তি', 'Review & Resolve Scrutiny Request')}
        size="md"
      >
        <form onSubmit={handleResolveScrutiny} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{pick('সিদ্ধান্ত *', 'Resolution Status *')}</label>
            <Select
              value={resolveForm.status}
              onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value as ScrutinyStatus })}
            >
              <option value="UPDATED">{pick('নম্বর সংশোধিত (UPDATED — ফলাফল পুনর্গণনা হবে)', 'Marks Updated (Recalculates GPA)')}</option>
              <option value="NO_CHANGE">{pick('অপরিবর্তিত (NO_CHANGE)', 'No Change')}</option>
              <option value="UNDER_REVIEW">{pick('পর্যালোচনাধীন (UNDER_REVIEW)', 'Under Review')}</option>
            </Select>
          </div>

          {resolveForm.status === 'UPDATED' && resolvingEs && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {resolvingEs.hasWritten && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {pick('লিখিত', 'Written')} (/{resolvingEs.writtenFullMarks})
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={resolvingEs.writtenFullMarks ?? 100}
                    value={resolveForm.written}
                    onChange={(e) => setResolveForm({ ...resolveForm, written: Number(e.target.value) || 0 })}
                  />
                </div>
              )}
              {resolvingEs.hasMcq && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    MCQ (/{resolvingEs.mcqFullMarks})
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={resolvingEs.mcqFullMarks ?? 50}
                    value={resolveForm.mcq}
                    onChange={(e) => setResolveForm({ ...resolveForm, mcq: Number(e.target.value) || 0 })}
                  />
                </div>
              )}
              {resolvingEs.hasPractical && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {pick('ব্যবহারিক', 'Prac')} (/{resolvingEs.practicalFullMarks})
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={resolvingEs.practicalFullMarks ?? 50}
                    value={resolveForm.practical}
                    onChange={(e) => setResolveForm({ ...resolveForm, practical: Number(e.target.value) || 0 })}
                  />
                </div>
              )}
              {resolvingEs.hasContinuousAssessment && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    CA (/{resolvingEs.continuousAssessmentFullMarks})
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={resolvingEs.continuousAssessmentFullMarks ?? 50}
                    value={resolveForm.ca}
                    onChange={(e) => setResolveForm({ ...resolveForm, ca: Number(e.target.value) || 0 })}
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{pick('পরীক্ষকের মন্তব্য', 'Reviewer Remarks')}</label>
            <Textarea
              rows={2}
              value={resolveForm.reviewerNote}
              onChange={(e) => setResolveForm({ ...resolveForm, reviewerNote: e.target.value })}
              placeholder={pick('পুনঃযাচাইয়ের সংক্ষিপ্ত বিবরণ লিখুন...', 'Enter re-evaluation notes...')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setResolvingReq(null)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" disabled={savingScrutiny}>
              {pick('সিদ্ধান্ত সংরক্ষণ করুন', 'Save Decision')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
