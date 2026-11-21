'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Archive,
  Calculator,
  CheckCircle2,
  Globe,
  Lock,
  Plus,
  Printer,
  RotateCcw,
  ShieldAlert,
  Unlock,
} from 'lucide-react';
import {
  useCreateExamMutation,
  useGetBootstrapQuery,
  useProcessExamResultsMutation,
  useSaveMarksBatchMutation,
  useToggleArchiveMutation,
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
  Modal,
  SegmentedTabs,
  Select,
} from '@/src/components/ui/primitives';
import {
  PrintableExamSeatPlan,
  PrintableMarksheet,
  PrintableTabulationSheet,
} from '@/src/components/print/PrintDocuments';
import { ExamType, ResultPublicationStatus } from '@/src/types/enums';

export function AdminExamsAndResultsPage({
  defaultTab = 'exams',
}: {
  defaultTab?:
    | 'exams'
    | 'grading'
    | 'marks'
    | 'publication'
    | 'merit'
    | 'consolidated';
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [createExam, { isLoading: creatingExam }] = useCreateExamMutation();
  const [saveMarks, { isLoading: savingMarks }] = useSaveMarksBatchMutation();
  const [processResults, { isLoading: processing }] = useProcessExamResultsMutation();
  const [toggleArchive] = useToggleArchiveMutation();
  const auth = useAppSelector((s) => s.auth);
  const { locale, pick } = useI18n();

  const [tab, setTab] = useState(defaultTab);
  const [selectedExamId, setSelectedExamId] = useState('exam-ann-10');
  const [selectedSubjectId, setSelectedSubjectId] = useState('es-exam-ann-10-math');
  const [draftMarks, setDraftMarks] = useState<
    Record<string, { written: number; mcq: number; practical: number; isAbsent: boolean }>
  >({});
  const [previewStudentEnrId, setPreviewStudentEnrId] = useState<string | null>(null);
  const [tabulationOpen, setTabulationOpen] = useState(false);
  const [seatPlanOpen, setSeatPlanOpen] = useState(false);
  const [newExamOpen, setNewExamOpen] = useState(false);
  const [newExamForm, setNewExamForm] = useState({
    name: '',
    classId: 'cls-10',
    examType: ExamType.MODEL_TEST,
    startDate: '2026-12-05',
    endDate: '2026-12-12',
  });

  const activeExam = db?.exams.find((e) => e.id === selectedExamId) ?? db?.exams[0];
  const examSubs = useMemo(
    () => (db && activeExam ? db.examSubjects.filter((es) => es.examId === activeExam.id) : []),
    [db, activeExam]
  );
  const currentExamSub =
    examSubs.find((es) => es.id === selectedSubjectId) ?? examSubs[0] ?? null;

  const targetEnrollments = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.enrollments
      .filter((e) => e.classId === activeExam.classId && e.academicYearId === activeExam.academicYearId)
      .filter((e) => !currentExamSub?.groupId || currentExamSub.groupId === e.groupId)
      .sort((a, b) => a.roll - b.roll);
  }, [db, activeExam, currentExamSub]);

  if (isLoading || !db) return <LoadingSkeleton />;

  const getMarkState = (enrId: string) => {
    if (draftMarks[enrId]) return draftMarks[enrId];
    const existing = currentExamSub
      ? db.marks.find(
          (m) => m.studentEnrollmentId === enrId && m.examSubjectId === currentExamSub.id
        )
      : null;
    return {
      written: existing?.writtenMarks ?? 0,
      mcq: existing?.mcqMarks ?? 0,
      practical: existing?.practicalMarks ?? 0,
      isAbsent: existing?.isAbsent ?? false,
    };
  };

  const isMarksLocked = Boolean(
    activeExam?.isLocked ||
      (activeExam?.marksEntryDeadline && new Date(activeExam.marksEntryDeadline) < new Date())
  );

  const handleSaveMarksSheet = async () => {
    if (!activeExam || !currentExamSub) return;
    // Validate against component full marks
    for (const enr of targetEnrollments) {
      const m = getMarkState(enr.id);
      if (m.isAbsent) continue;
      if (currentExamSub.hasWritten && m.written > (currentExamSub.writtenFullMarks ?? 100)) {
        toast.error(pick(`রোল ${enr.roll}: লিখিত নম্বর পূর্ণমানের চেয়ে বেশি!`, `Roll ${enr.roll}: Written exceeds full marks!`));
        return;
      }
      if (currentExamSub.hasMcq && m.mcq > (currentExamSub.mcqFullMarks ?? 100)) {
        toast.error(pick(`রোল ${enr.roll}: MCQ নম্বর পূর্ণমানের চেয়ে বেশি!`, `Roll ${enr.roll}: MCQ exceeds full marks!`));
        return;
      }
      if (currentExamSub.hasPractical && m.practical > (currentExamSub.practicalFullMarks ?? 100)) {
        toast.error(pick(`রোল ${enr.roll}: ব্যবহারিক নম্বর পূর্ণমানের চেয়ে বেশি!`, `Roll ${enr.roll}: Practical exceeds full marks!`));
        return;
      }
    }
    try {
      const res = await saveMarks({
        examId: activeExam.id,
        examSubjectId: currentExamSub.id,
        enteredBy: auth.user?.id ?? 'user-admin',
        entries: targetEnrollments.map((enr) => {
          const m = getMarkState(enr.id);
          return {
            studentEnrollmentId: enr.id,
            writtenMarks: Number(m.written),
            mcqMarks: Number(m.mcq),
            practicalMarks: Number(m.practical),
            continuousAssessmentMarks: 0,
            isAbsent: m.isAbsent,
          };
        }),
      }).unwrap();
      toast.success(
        pick(
          `${formatNumber(res.savedCount, 'bn')} জন শিক্ষার্থীর নম্বর সংরক্ষিত হয়েছে।`,
          `Saved marks for ${res.savedCount} students.`
        )
      );
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Failed to save marks');
    }
  };

  const handleProcessAction = async (
    examId: string,
    action: 'CALCULATE' | 'PUBLISH' | 'WITHHOLD' | 'LOCK' | 'UNLOCK'
  ) => {
    try {
      await processResults({ examId, action }).unwrap();
      const msgs: Record<typeof action, string> = {
        CALCULATE: pick('ফলাফল ও মেধাক্রম গণনা সম্পন্ন হয়েছে (প্রিভিউ প্রস্তুত)।', 'Results & merit positions calculated.'),
        PUBLISH: pick('ফলাফল প্রকাশিত হয়েছে! এখন পাবলিক ফলাফল পৃষ্ঠা (/results) থেকে দেখা যাবে।', 'Results published! Now searchable on /results.'),
        WITHHOLD: pick('ফলাফল স্থগিত (Withheld) করা হয়েছে।', 'Results marked Withheld.'),
        LOCK: pick('নম্বর এন্ট্রি লক করা হয়েছে।', 'Marks locked.'),
        UNLOCK: pick('নম্বর এন্ট্রি আনলক করা হয়েছে।', 'Marks unlocked.'),
      };
      toast.success(msgs[action]);
    } catch {
      toast.error(pick('প্রক্রিয়াকরণে ত্রুটি হয়েছে।', 'Operation failed.'));
    }
  };

  const examSummaries = activeExam
    ? db.resultSummaries
        .filter((r) => r.examId === activeExam.id)
        .sort((a, b) => (a.meritPosition ?? 999) - (b.meritPosition ?? 999))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('পরীক্ষা, নম্বর এন্ট্রি ও ফলাফল প্রকাশনা', 'Examinations, Marks Entry & Result Publication')}
        description={pick(
          'সম্পূর্ণ ফলাফল প্রবাহ: নম্বর এন্ট্রি → লক → ফলাফল গণনা → প্রকাশনা → পাবলিক রেজাল্ট অনুসন্ধান।',
          'End-to-end result pipeline: Enter Marks → Lock → Process GPA/Merit → Publish → Public Search.'
        )}
        actions={
          <Button variant="primary" size="sm" onClick={() => setNewExamOpen(true)}>
            <Plus className="w-4 h-4" /> {pick('নতুন পরীক্ষা তৈরি', 'Create Exam')}
          </Button>
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'exams', label: pick('পরীক্ষা তালিকা', 'Exams'), count: db.exams.length },
          { value: 'marks', label: pick('নম্বর এন্ট্রি শিট', 'Marks Entry') },
          { value: 'publication', label: pick('ফলাফল প্রক্রিয়াকরণ ও প্রকাশ', 'Process & Publish') },
          { value: 'merit', label: pick('মেধাতালিকা ও মার্কশিট', 'Merit & Marksheets') },
          { value: 'grading', label: pick('গ্রেডিং স্কেল', 'Grading Scales') },
          { value: 'consolidated', label: pick('সমন্বিত পরীক্ষা', 'Consolidated') },
        ]}
      />

      {/* 1. EXAMS LIST */}
      {tab === 'exams' && (
        <div className="space-y-3">
          {db.exams.map((ex) => {
            const cls = db.classes.find((c) => c.id === ex.classId);
            return (
              <Card key={ex.id} className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${ex.isDeleted ? 'opacity-55' : ''}`}>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge enumName="ExamType" value={ex.examType} />
                    <StatusBadge enumName="ExamStatus" value={ex.status} />
                    <StatusBadge enumName="ResultPublicationStatus" value={ex.resultStatus} />
                    {ex.isLocked && (
                      <span className="text-xs font-medium text-warning inline-flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> {pick('লককৃত', 'Locked')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{ex.name}</h3>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {locale === 'bn' ? cls?.nameBn : cls?.name} · {formatDateShort(ex.startDate, locale)} – {formatDateShort(ex.endDate, locale)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedExamId(ex.id);
                      setTab('marks');
                    }}
                  >
                    {pick('নম্বর এন্ট্রি', 'Marks')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedExamId(ex.id);
                      setTab('publication');
                    }}
                  >
                    {pick('ফলাফল পরিচালনা', 'Manage Results')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleArchive({ collection: 'exams', id: ex.id })}
                  >
                    {ex.isDeleted ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 2. SPREADSHEET-STYLE MARKS ENTRY GRID */}
      {tab === 'marks' && activeExam && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <FormField label={pick('পরীক্ষা নির্বাচন', 'Select Exam')}>
                <Select
                  value={activeExam.id}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    setDraftMarks({});
                  }}
                  className="w-72"
                >
                  {db.exams.filter((e) => !e.isDeleted).map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label={pick('বিষয়', 'Subject')}>
                <Select
                  value={currentExamSub?.id ?? ''}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setDraftMarks({});
                  }}
                  className="w-56"
                >
                  {examSubs.map((es) => {
                    const sub = db.subjects.find((s) => s.id === es.subjectId);
                    return (
                      <option key={es.id} value={es.id}>
                        {locale === 'bn' ? sub?.nameBn : sub?.name} ({es.fullMarks})
                      </option>
                    );
                  })}
                </Select>
              </FormField>
            </div>
            <div className="flex items-center gap-2">
              {activeExam.isLocked ? (
                <Button variant="outline" size="sm" onClick={() => handleProcessAction(activeExam.id, 'UNLOCK')}>
                  <Unlock className="w-3.5 h-3.5" /> {pick('আনলক করুন', 'Unlock Marks')}
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleSaveMarksSheet} disabled={savingMarks}>
                  {savingMarks ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('নম্বর সংরক্ষণ করুন', 'Save Marks')}
                </Button>
              )}
            </div>
          </Card>

          {isMarksLocked && (
            <Card className="p-4 border-warning/40 bg-warning/5 flex items-center gap-2 text-sm text-foreground">
              <ShieldAlert className="w-4 h-4 text-warning shrink-0" />
              <span>
                {pick(
                  'এই পরীক্ষার নম্বর এন্ট্রি লক করা আছে অথবা সময়সীমা অতিক্রান্ত হয়েছে। পরিবর্তন করতে হলে অ্যাডমিন কর্তৃক আনলক করতে হবে।',
                  'Marks entry is locked or deadline has passed. Admin must unlock before editing.'
                )}
              </span>
            </Card>
          )}

          {currentExamSub && (
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted text-sm text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">{pick('রোল', 'Roll')}</th>
                    <th className="p-3 text-left">{pick('শিক্ষার্থীর নাম', 'Student')}</th>
                    {currentExamSub.hasWritten && (
                      <th className="p-3 text-right">
                        {pick('লিখিত', 'Written')} ({currentExamSub.writtenFullMarks})
                      </th>
                    )}
                    {currentExamSub.hasMcq && (
                      <th className="p-3 text-right">
                        MCQ ({currentExamSub.mcqFullMarks})
                      </th>
                    )}
                    {currentExamSub.hasPractical && (
                      <th className="p-3 text-right">
                        {pick('ব্যবহারিক', 'Practical')} ({currentExamSub.practicalFullMarks})
                      </th>
                    )}
                    <th className="p-3 text-center">{pick('অনুপস্থিত', 'Absent')}</th>
                    <th className="p-3 text-right">{pick('মোট', 'Total')} ({currentExamSub.fullMarks})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border tabular-nums">
                  {targetEnrollments.map((enr) => {
                    const stu = db.students.find((s) => s.id === enr.studentId);
                    const m = getMarkState(enr.id);
                    const total = m.isAbsent ? 0 : Number(m.written) + Number(m.mcq) + Number(m.practical);
                    return (
                      <tr key={enr.id}>
                        <td className="p-3 font-bold">{formatNumber(enr.roll, locale)}</td>
                        <td className="p-3 font-medium">{stu?.nameBn ?? stu?.nameEn}</td>
                        {currentExamSub.hasWritten && (
                          <td className="p-3 text-right">
                            <Input
                              type="number"
                              min={0}
                              max={currentExamSub.writtenFullMarks ?? 100}
                              disabled={isMarksLocked || m.isAbsent}
                              value={m.written}
                              onChange={(e) =>
                                setDraftMarks((prev) => ({
                                  ...prev,
                                  [enr.id]: { ...m, written: Number(e.target.value) },
                                }))
                              }
                              className="w-20 ml-auto text-right h-8"
                            />
                          </td>
                        )}
                        {currentExamSub.hasMcq && (
                          <td className="p-3 text-right">
                            <Input
                              type="number"
                              min={0}
                              max={currentExamSub.mcqFullMarks ?? 100}
                              disabled={isMarksLocked || m.isAbsent}
                              value={m.mcq}
                              onChange={(e) =>
                                setDraftMarks((prev) => ({
                                  ...prev,
                                  [enr.id]: { ...m, mcq: Number(e.target.value) },
                                }))
                              }
                              className="w-20 ml-auto text-right h-8"
                            />
                          </td>
                        )}
                        {currentExamSub.hasPractical && (
                          <td className="p-3 text-right">
                            <Input
                              type="number"
                              min={0}
                              max={currentExamSub.practicalFullMarks ?? 100}
                              disabled={isMarksLocked || m.isAbsent}
                              value={m.practical}
                              onChange={(e) =>
                                setDraftMarks((prev) => ({
                                  ...prev,
                                  [enr.id]: { ...m, practical: Number(e.target.value) },
                                }))
                              }
                              className="w-20 ml-auto text-right h-8"
                            />
                          </td>
                        )}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            disabled={isMarksLocked}
                            checked={m.isAbsent}
                            onChange={(e) =>
                              setDraftMarks((prev) => ({
                                ...prev,
                                [enr.id]: { ...m, isAbsent: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 accent-destructive"
                          />
                        </td>
                        <td className="p-3 text-right font-bold text-primary">
                          {m.isAbsent ? 'AB' : formatNumber(total, locale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* 3. RESULT PROCESSING & PUBLICATION WIZARD */}
      {tab === 'publication' && activeExam && (
        <div className="space-y-5">
          <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <FormField label={pick('পরীক্ষা নির্বাচন করুন', 'Select Examination')}>
                <Select
                  value={activeExam.id}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-80"
                >
                  {db.exams.filter((e) => !e.isDeleted).map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge enumName="ResultPublicationStatus" value={activeExam.resultStatus} />
              <Button
                variant="outline"
                size="sm"
                disabled={processing}
                onClick={() => handleProcessAction(activeExam.id, 'CALCULATE')}
              >
                <Calculator className="w-4 h-4" /> {pick('১. ফলাফল গণনা (Preview)', '1. Calculate GPA')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={processing}
                onClick={() => handleProcessAction(activeExam.id, 'PUBLISH')}
              >
                <Globe className="w-4 h-4" /> {pick('২. ফলাফল প্রকাশ করুন (Publish)', '2. Publish to Public')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={processing}
                onClick={() => handleProcessAction(activeExam.id, 'WITHHOLD')}
              >
                {pick('স্থগিত (Withhold)', 'Withhold')}
              </Button>
            </div>
          </Card>

          {activeExam.resultStatus === ResultPublicationStatus.PUBLISHED && (
            <Card className="p-4 border-success/40 bg-success/5 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {pick(
                  'এই পরীক্ষার ফলাফল বর্তমানে পাবলিক রেজাল্ট পেজে উন্মুক্ত রয়েছে।',
                  'Results for this exam are live on Public Result Search.'
                )}
              </span>
              <Link href={`/results?examId=${activeExam.id}&classId=${activeExam.classId}`}>
                <Button variant="outline" size="sm">{pick('পাবলিক পেজে দেখুন', 'Verify on /results')}</Button>
              </Link>
            </Card>
          )}

          {/* Completeness Matrix */}
          <Card className="p-5 space-y-3">
            <h3 className="text-base font-bold">{pick('বিষয়ভিত্তিক নম্বর এন্ট্রি সম্পূর্ণতা', 'Subject Marks Completeness Matrix')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {examSubs.map((es) => {
                const sub = db.subjects.find((s) => s.id === es.subjectId);
                const entered = db.marks.filter((m) => m.examSubjectId === es.id).length;
                return (
                  <div key={es.id} className="p-3 border border-border rounded text-sm flex justify-between items-center">
                    <span className="font-semibold">{locale === 'bn' ? sub?.nameBn : sub?.name}</span>
                    <span className="tabular-nums text-primary font-bold">{formatNumber(entered, locale)} {pick('এন্ট্রি', 'entries')}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* 4. MERIT LIST, TABULATION & PRINTABLE MARKSHEETS */}
      {tab === 'merit' && activeExam && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <Select value={activeExam.id} onChange={(e) => setSelectedExamId(e.target.value)} className="w-80">
              {db.exams.filter((e) => !e.isDeleted).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSeatPlanOpen(true)}>
                <Printer className="w-4 h-4" /> {pick('আসন বিন্যাস (Seat Plan)', 'Exam Seat Plan')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setTabulationOpen(true)}>
                <Printer className="w-4 h-4" /> {pick('ট্যাবুলেশন শিট (A4)', 'Tabulation Sheet (A4)')}
              </Button>
            </div>
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-sm text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">{pick('মেধা', 'Merit')}</th>
                  <th className="p-3 text-left">{pick('রোল', 'Roll')}</th>
                  <th className="p-3 text-left">{pick('শিক্ষার্থী', 'Student')}</th>
                  <th className="p-3 text-right">{pick('মোট নম্বর', 'Total')}</th>
                  <th className="p-3 text-right">GPA</th>
                  <th className="p-3 text-right">{pick('৪র্থ ছাড়া', 'No 4th')}</th>
                  <th className="p-3 text-center">{pick('গ্রেড', 'Grade')}</th>
                  <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
                  <th className="p-3 text-right no-print">{pick('মার্কশিট', 'Marksheet')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {examSummaries.map((res) => {
                  const enr = db.enrollments.find((e) => e.id === res.studentEnrollmentId);
                  const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
                  return (
                    <tr key={res.id}>
                      <td className="p-3 font-bold text-primary">{res.meritPosition ? `#${formatNumber(res.meritPosition, locale)}` : '—'}</td>
                      <td className="p-3">{enr ? formatNumber(enr.roll, locale) : '—'}</td>
                      <td className="p-3 font-medium">{stu?.nameBn ?? stu?.nameEn}</td>
                      <td className="p-3 text-right">{formatNumber(res.totalMarks, locale)} / {formatNumber(res.totalFullMarks, locale)}</td>
                      <td className="p-3 text-right font-bold">{res.gpa !== null ? formatNumber(res.gpa, locale, 2) : '—'}</td>
                      <td className="p-3 text-right text-muted-foreground">{res.gpaWithoutOptional !== null ? formatNumber(res.gpaWithoutOptional, locale, 2) : '—'}</td>
                      <td className="p-3 text-center font-bold">{res.letterGrade ?? '—'}</td>
                      <td className="p-3"><StatusBadge enumName="ResultStatus" value={res.resultStatus} /></td>
                      <td className="p-3 text-right no-print">
                        <Button variant="outline" size="sm" onClick={() => setPreviewStudentEnrId(res.studentEnrollmentId)}>
                          {pick('মার্কশিট', 'View')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* 5. GRADING SCALES */}
      {tab === 'grading' && (
        <div className="space-y-4">
          {db.gradingScales.map((scale) => {
            const ranges = db.gradeRanges.filter((r) => r.gradingScaleId === scale.id && !r.isDeleted);
            return (
              <Card key={scale.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{scale.name}</h3>
                    <p className="text-sm text-muted-foreground">{scale.description}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleArchive({ collection: 'gradingScales', id: scale.id })}>
                    {scale.isDeleted ? pick('পুনরুদ্ধার', 'Restore') : pick('আর্কাইভ', 'Archive')}
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 tabular-nums">
                  {ranges.map((r) => (
                    <div key={r.id} className="p-3 border border-border rounded text-center">
                      <p className="text-lg font-bold text-primary">{r.letterGrade}</p>
                      <p className="text-sm font-semibold">{formatNumber(r.gradePoint, locale, 2)}</p>
                      <p className="text-xs text-muted-foreground">{r.minPercentage}–{r.maxPercentage}%</p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 6. CONSOLIDATED EXAM CONFIG */}
      {tab === 'consolidated' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold">{pick('সমন্বিত চূড়ান্ত ফলাফল কনফিগারেশন (মোট ১০০%)', 'Consolidated Exam Weightage Configuration (Total 100%)')}</h3>
          <div className="divide-y divide-border">
            {db.consolidatedConfigs.map((cc) => {
              const src = db.exams.find((e) => e.id === cc.sourceExamId);
              return (
                <div key={cc.id} className="py-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{src?.name}</span>
                  <span className="font-mono font-bold text-primary">{cc.weightagePercentage}%</span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-success font-semibold tabular-nums">
            {pick('মোট ওজন:', 'Total Weightage:')}{' '}
            {db.consolidatedConfigs.reduce((s, c) => s + c.weightagePercentage, 0)}%
          </p>
        </Card>
      )}

      {/* Marksheet Print Modal */}
      <Modal
        open={Boolean(previewStudentEnrId)}
        onClose={() => setPreviewStudentEnrId(null)}
        title={pick('মার্কশিট প্রিভিউ ও প্রিন্ট', 'Marksheet Preview & Print')}
        maxWidth="max-w-4xl"
      >
        {previewStudentEnrId && activeExam && (() => {
          const summary = db.resultSummaries.find(
            (r) => r.examId === activeExam.id && r.studentEnrollmentId === previewStudentEnrId
          );
          const enr = db.enrollments.find((e) => e.id === previewStudentEnrId);
          const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
          const cls = enr ? db.classes.find((c) => c.id === enr.classId) : null;
          const sec = enr ? db.sections.find((s) => s.id === enr.sectionId) : null;
          if (!summary || !enr || !stu || !cls || !sec) return null;
          const subs = db.studentSubjectResults
            .filter((r) => r.examId === activeExam.id && r.studentEnrollmentId === enr.id)
            .map((r) => {
              const es = db.examSubjects.find((x) => x.id === r.examSubjectId)!;
              const sub = db.subjects.find((x) => x.id === es.subjectId)!;
              const mk = db.marks.find((m) => m.examSubjectId === es.id && m.studentEnrollmentId === enr.id);
              return {
                subjectCode: sub.officialCode ?? '',
                subjectName: sub.name,
                subjectNameBn: sub.nameBn ?? sub.name,
                fullMarks: es.fullMarks,
                writtenMarks: mk?.writtenMarks ?? 0,
                mcqMarks: mk?.mcqMarks ?? 0,
                practicalMarks: mk?.practicalMarks ?? 0,
                totalMarks: r.totalMarks,
                letterGrade: r.letterGrade,
                gradePoint: r.gradePoint,
                isPassed: r.isPassed,
                isOptional: r.isOptional,
                bonusGradePoint: r.bonusGradePoint ?? 0,
                isAbsent: r.isAbsent,
              };
            });
          return (
            <div className="space-y-4">
              <div className="flex justify-end no-print">
                <Button variant="primary" size="sm" onClick={triggerPrint}>
                  <Printer className="w-4 h-4" /> {pick('প্রিন্ট করুন', 'Print Marksheet')}
                </Button>
              </div>
              <PrintableMarksheet
                school={db.schoolProfile}
                examName={activeExam.name}
                student={{
                  studentId: stu.studentId,
                  nameEn: stu.nameEn,
                  nameBn: stu.nameBn,
                  roll: enr.roll,
                  className: cls.name,
                  classNameBn: cls.nameBn ?? cls.name,
                  sectionName: sec.name,
                  academicYear: '2026',
                }}
                summary={summary}
                subjects={subs}
              />
            </div>
          );
        })()}
      </Modal>

      {/* Create Exam Modal */}
      <Modal open={newExamOpen} onClose={() => setNewExamOpen(false)} title={pick('নতুন পরীক্ষা তৈরি করুন', 'Create New Examination')}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newExamForm.name.trim()) return;
            await createExam(newExamForm).unwrap();
            toast.success(pick('নতুন পরীক্ষা তৈরি হয়েছে।', 'Exam created.'));
            setNewExamOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('পরীক্ষার নাম', 'Exam Name')} required>
            <Input value={newExamForm.name} onChange={(e) => setNewExamForm({ ...newExamForm, name: e.target.value })} placeholder="যেমন: মডেল টেস্ট ২০২৬ (৯ম শ্রেণি)" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={pick('শ্রেণি', 'Class')}>
              <Select value={newExamForm.classId} onChange={(e) => setNewExamForm({ ...newExamForm, classId: e.target.value })}>
                {db.classes.map((c) => <option key={c.id} value={c.id}>{locale === 'bn' ? c.nameBn : c.name}</option>)}
              </Select>
            </FormField>
            <FormField label={pick('ধরন', 'Type')}>
              <Select value={newExamForm.examType} onChange={(e) => setNewExamForm({ ...newExamForm, examType: e.target.value as ExamType })}>
                {Object.values(ExamType).map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNewExamOpen(false)}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={creatingExam}>{pick('তৈরি করুন', 'Create')}</Button>
          </div>
        </form>
      </Modal>

      {/* Landscape A4 Tabulation Sheet Modal */}
      <Modal
        open={tabulationOpen}
        onClose={() => setTabulationOpen(false)}
        title={pick('শ্রেণিভিত্তিক ট্যাবুলেশন শিট (A4 ল্যান্ডস্কেপ)', 'Class Tabulation Sheet (A4 Landscape)')}
        maxWidth="max-w-6xl"
      >
        {activeExam && (() => {
          const cls = db.classes.find((c) => c.id === activeExam.classId);
          const tabSubjects = examSubs.map((es) => {
            const sub = db.subjects.find((s) => s.id === es.subjectId);
            return {
              id: es.id,
              code: sub?.officialCode ?? '',
              nameBn: sub?.nameBn ?? sub?.name ?? '',
              nameEn: sub?.name ?? '',
              fullMarks: es.fullMarks,
            };
          });
          const tabRows = examSummaries.map((res) => {
            const enr = db.enrollments.find((e) => e.id === res.studentEnrollmentId);
            const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
            const sec = enr ? db.sections.find((s) => s.id === enr.sectionId) : null;
            const subjectMarks: Record<string, { total: number; grade: string; isAbsent?: boolean }> = {};
            db.studentSubjectResults
              .filter((r) => r.examId === activeExam.id && r.studentEnrollmentId === res.studentEnrollmentId)
              .forEach((r) => {
                subjectMarks[r.examSubjectId] = {
                  total: r.totalMarks,
                  grade: r.letterGrade ?? '—',
                  isAbsent: r.isAbsent,
                };
              });
            return {
              roll: enr?.roll ?? 0,
              studentId: stu?.studentId ?? res.studentEnrollmentId,
              studentName: locale === 'bn' ? stu?.nameBn || stu?.nameEn || '—' : stu?.nameEn || '—',
              sectionName: sec?.name ?? '—',
              subjectMarks,
              totalMarks: res.totalMarks,
              totalFullMarks: res.totalFullMarks,
              gpa: res.gpa ?? null,
              letterGrade: res.letterGrade ?? null,
              meritPosition: res.meritPosition ?? null,
              resultStatus: res.resultStatus,
            };
          });
          return (
            <div className="space-y-4">
              <div className="flex justify-end no-print">
                <Button variant="primary" size="sm" onClick={triggerPrint}>
                  <Printer className="w-4 h-4" /> {pick('ল্যান্ডস্কেপ প্রিন্ট করুন', 'Print Landscape Sheet')}
                </Button>
              </div>
              <PrintableTabulationSheet
                school={db.schoolProfile}
                examName={activeExam.name}
                className={locale === 'bn' ? cls?.nameBn ?? cls?.name ?? '' : cls?.name ?? ''}
                academicYear="2026"
                subjects={tabSubjects}
                rows={tabRows}
              />
            </div>
          );
        })()}
      </Modal>

      {/* Exam Seat Plan Print Modal */}
      <Modal
        open={seatPlanOpen}
        onClose={() => setSeatPlanOpen(false)}
        title={pick('পরীক্ষার আসন বিন্যাস (Exam Seat Plan)', 'Exam Seat Plan Print')}
        maxWidth="max-w-4xl"
      >
        {activeExam && (() => {
          const cls = db.classes.find((c) => c.id === activeExam.classId);
          const classEnrollments = db.enrollments
            .filter((e) => e.classId === activeExam.classId && e.academicYearId === activeExam.academicYearId)
            .sort((a, b) => a.roll - b.roll);
          const seats = classEnrollments.map((enr, idx) => {
            const stu = db.students.find((s) => s.id === enr.studentId);
            const sec = db.sections.find((s) => s.id === enr.sectionId);
            return {
              seatNo: idx + 1,
              roll: enr.roll,
              studentId: stu?.studentId ?? enr.studentId,
              studentName: locale === 'bn' ? stu?.nameBn || stu?.nameEn || '—' : stu?.nameEn || '—',
              className: locale === 'bn' ? cls?.nameBn ?? cls?.name ?? '' : cls?.name ?? '',
              sectionName: sec?.name ?? '—',
            };
          });
          return (
            <div className="space-y-4">
              <div className="flex justify-end no-print">
                <Button variant="primary" size="sm" onClick={triggerPrint}>
                  <Printer className="w-4 h-4" /> {pick('আসন বিন্যাস প্রিন্ট করুন', 'Print Seat Plan')}
                </Button>
              </div>
              <PrintableExamSeatPlan
                school={db.schoolProfile}
                examName={activeExam.name}
                roomName={pick('ভবন ১ — হল রুম ২০১', 'Building 1 — Exam Hall 201')}
                seats={seats}
              />
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
