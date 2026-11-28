'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { useLiveSchoolProfile } from '@/src/features/institution/hooks/useSchoolProfile';
import {
  useGetAcademicYearsQuery,
  useGetCurrentAcademicYearQuery,
  useGetMyTeacherAssignmentsQuery,
  useGetSchoolClassesQuery,
  useGetSectionsQuery,
} from '@/src/services/academic';
import {
  useGetExamsQuery,
  useGetTabulationSheetQuery,
  type TabulationRow,
} from '@/src/features/examinations/api/examinations.api';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  FormalExamDocumentShell,
  PrintableMarksheet,
  type PrintableMarksheetProps,
} from '@/src/components/print/PrintDocuments';
import { Button, Card, FormField, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';
import { cn, triggerPrint } from '@/src/lib/utils/cn';
import type { Exam } from '@/src/types/entities';
import { ExamStatus } from '@/src/types/enums';

export function TeacherResultsPage() {
  const schoolProfile = useLiveSchoolProfile();
  const { data: myAssignments = [], isLoading: loadingAssignments } =
    useGetMyTeacherAssignmentsQuery();
  const { data: allClasses = [], isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const { data: academicYears = [], isLoading: loadingYears } = useGetAcademicYearsQuery();
  const { data: currentAcademicYear } = useGetCurrentAcademicYearQuery();
  const { data: examsData, isLoading: loadingExams } = useGetExamsQuery({ limit: 100 });

  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const effectiveYearId = selectedYearId ?? currentAcademicYear?.id ?? 'ALL';

  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('ALL');
  const [selectedResultStatus, setSelectedResultStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewRow, setPreviewRow] = useState<TabulationRow | null>(null);
  const [showMeritPrintModal, setShowMeritPrintModal] = useState(false);

  const myClassIds = useMemo(
    () => Array.from(new Set(myAssignments.map((a) => a.classId).filter(Boolean))),
    [myAssignments]
  );

  const classMap = useMemo(() => {
    const map = new Map<string, (typeof allClasses)[number]>();
    for (const c of allClasses) map.set(c.id, c);
    return map;
  }, [allClasses]);

  const yearMap = useMemo(() => {
    const map = new Map<string, (typeof academicYears)[number]>();
    for (const y of academicYears) map.set(y.id, y);
    return map;
  }, [academicYears]);

  const myExams = useMemo(() => {
    const allExams = (examsData?.items ?? []).filter((e) => !e.isDeleted);
    const assigned = allExams.filter((e) => myClassIds.includes(e.classId));
    return assigned.sort((a, b) => {
      const rank = (s: ExamStatus) =>
        s === ExamStatus.COMPLETED ? 0 : s === ExamStatus.ONGOING ? 1 : s === ExamStatus.UPCOMING ? 2 : 3;
      const diff = rank(a.status) - rank(b.status);
      if (diff !== 0) return diff;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [examsData, myClassIds]);

  const filteredExams = useMemo(() => {
    if (effectiveYearId === 'ALL') return myExams;
    return myExams.filter((e) => e.academicYearId === effectiveYearId);
  }, [myExams, effectiveYearId]);

  const activeExam: Exam | null = useMemo(() => {
    if (filteredExams.length === 0) return null;
    if (selectedExamId) {
      const found = filteredExams.find((e) => e.id === selectedExamId);
      if (found) return found;
    }
    return filteredExams[0] ?? null;
  }, [filteredExams, selectedExamId]);

  const activeExamId = activeExam?.id ?? '';

  const { data: classSections = [] } = useGetSectionsQuery(
    { classId: activeExam?.classId },
    { skip: !activeExam?.classId }
  );

  const {
    data: tabulationData,
    isLoading: loadingTabulation,
    isFetching: fetchingTabulation,
  } = useGetTabulationSheetQuery(
    {
      examId: activeExamId,
      sectionId: selectedSectionId !== 'ALL' ? selectedSectionId : undefined,
      resultStatus: selectedResultStatus !== 'ALL' ? selectedResultStatus : undefined,
      search: searchQuery.trim() || undefined,
    },
    { skip: !activeExamId }
  );

  const tabulationRows = useMemo(() => {
    const rows = tabulationData?.tabulation ?? [];
    return [...rows].sort((a, b) => {
      const ma = a.meritPosition ?? Number.MAX_SAFE_INTEGER;
      const mb = b.meritPosition ?? Number.MAX_SAFE_INTEGER;
      if (ma !== mb) return ma - mb;
      return a.roll - b.roll;
    });
  }, [tabulationData]);

  const marksheetProps: PrintableMarksheetProps | null = useMemo(() => {
    if (!previewRow || !activeExam || !tabulationData) return null;
    const clsMeta = classMap.get(activeExam.classId);
    const yearName =
      tabulationData.examination?.academicYear ||
      yearMap.get(activeExam.academicYearId)?.name ||
      '';
    const subjectMetaMap = new Map(
      (tabulationData.subjectsList ?? []).map((s) => [s.id, s])
    );

    return {
      school: schoolProfile,
      examName: tabulationData.examination?.name || activeExam.name,
      student: {
        studentId: previewRow.studentId,
        nameEn: previewRow.name,
        nameBn: previewRow.nameBn,
        roll: previewRow.roll,
        className: clsMeta?.name || tabulationData.examination?.class || '',
        classNameBn: clsMeta?.nameBn || clsMeta?.name || tabulationData.examination?.class || '',
        sectionName: previewRow.section,
        academicYear: yearName,
      },
      summary: {
        totalFullMarks: previewRow.totalFullMarks,
        totalMarks: previewRow.totalMarks,
        gpa: previewRow.gpa,
        gpaWithoutOptional: previewRow.gpaWithoutOptional,
        letterGrade: previewRow.letterGrade,
        meritPosition: previewRow.meritPosition,
        sectionMeritPosition: previewRow.sectionMeritPosition,
        failedSubjectCount: previewRow.failedSubjectCount,
        resultStatus: previewRow.resultStatus,
        publishedAt: tabulationData.examination?.publishedAt ?? null,
      },
      subjects: previewRow.subjects.map((sub) => {
        const meta = subjectMetaMap.get(sub.examSubjectId);
        return {
          subjectCode: sub.code ?? meta?.code ?? '—',
          subjectName: sub.subjectName,
          subjectNameBn: sub.subjectName,
          fullMarks: meta?.fullMarks ?? 100,
          writtenMarks: sub.totalMarks,
          mcqMarks: 0,
          practicalMarks: 0,
          totalMarks: sub.totalMarks,
          letterGrade: sub.letterGrade,
          gradePoint: sub.gradePoint,
          isPassed: sub.isPassed,
          isOptional: sub.isOptional,
          bonusGradePoint: 0,
          isAbsent: sub.isAbsent,
        };
      }),
    };
  }, [previewRow, activeExam, tabulationData, classMap, yearMap, schoolProfile]);

  if (loadingAssignments || loadingClasses || loadingYears || loadingExams) {
    return <LoadingSkeleton />;
  }

  const summary = tabulationData?.summary;
  const activeClassMeta = activeExam ? classMap.get(activeExam.classId) : undefined;
  const activeClassName =
    activeClassMeta?.nameBn ||
    activeClassMeta?.name ||
    tabulationData?.examination?.class ||
    '';
  const activeYearName = activeExam
    ? yearMap.get(activeExam.academicYearId)?.name ||
      tabulationData?.examination?.academicYear ||
      ''
    : '';

  return (
    <div className="space-y-6">
      <PageHeader
        title={'শ্রেণির ফলাফল ও মেধাতালিকা'}
        description={'আপনার নির্ধারিত শ্রেণিসমূহের ফলাফল বিশ্লেষণ, মেধাক্রম ও মার্কশিট'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!activeExam || tabulationRows.length === 0}
              onClick={() => setShowMeritPrintModal(true)}
            >
              <Printer className="w-4 h-4" />
              {'প্রিন্ট / PDF (A4)'}
            </Button>
            <Link href="/teacher/marks-entry">
              <Button variant="primary" size="sm">
                <FileSpreadsheet className="w-4 h-4" />
                {'নম্বর এন্ট্রি করুন'}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={'মোট পরীক্ষার্থী'}
          value={formatNumber(summary?.totalStudents ?? 0, 'bn')}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label={'উত্তীর্ণ'}
          value={formatNumber(summary?.passedCount ?? 0, 'bn')}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          label={'অনুত্তীর্ণ'}
          value={formatNumber(summary?.failedCount ?? 0, 'bn')}
          icon={<XCircle className="w-5 h-5" />}
        />
        <StatCard
          label={'পাসের হার'}
          value={`${formatNumber(summary?.passPercentage ?? 0, 'bn', 1)}%`}
          icon={<Award className="w-5 h-5" />}
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <FormField label={'শিক্ষাবর্ষ'}>
            <Select
              value={effectiveYearId}
              onChange={(e) => {
                setSelectedYearId(e.target.value);
                setSelectedExamId('');
                setSelectedSectionId('ALL');
              }}
            >
              <option value="ALL">{'সকল শিক্ষাবর্ষ'}</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {currentAcademicYear?.id === y.id ? ' (চলমান)' : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={'পরীক্ষা নির্বাচন করুন'}>
            <Select
              value={activeExam?.id ?? ''}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setSelectedSectionId('ALL');
              }}
              disabled={filteredExams.length === 0}
            >
              {filteredExams.length === 0 ? (
                <option value="">{'কোনো পরীক্ষা নেই'}</option>
              ) : (
                filteredExams.map((e) => {
                  const cls = classMap.get(e.classId);
                  const clsName = cls?.nameBn || cls?.name || '';
                  return (
                    <option key={e.id} value={e.id}>
                      {e.name}
                      {clsName ? ` (${clsName})` : ''}
                    </option>
                  );
                })
              )}
            </Select>
          </FormField>

          <FormField label={'শাখা'}>
            <Select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={!activeExam}
            >
              <option value="ALL">{'সকল শাখা'}</option>
              {classSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={'ফলাফল'}>
            <Select
              value={selectedResultStatus}
              onChange={(e) => setSelectedResultStatus(e.target.value)}
              disabled={!activeExam}
            >
              <option value="ALL">{'সকল শিক্ষার্থী'}</option>
              <option value="PASSED">{'উত্তীর্ণ'}</option>
              <option value="FAILED">{'অনুত্তীর্ণ'}</option>
            </Select>
          </FormField>

          <FormField label={'খুঁজুন'}>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={'নাম বা রোল...'}
                className="pl-9"
                disabled={!activeExam}
              />
            </div>
          </FormField>
        </div>

        {activeExam && (
          <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{activeExam.name}</span>
              {activeClassName && <span>· {activeClassName}</span>}
              {activeYearName && <span>· শিক্ষাবর্ষ {activeYearName}</span>}
              {tabulationData?.examination?.gradingScale && (
                <span>· গ্রেডিং: {tabulationData.examination.gradingScale}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>{'ফলাফল অবস্থা:'}</span>
              <StatusBadge
                enumName="ResultPublicationStatus"
                value={tabulationData?.examination?.resultStatus ?? activeExam.resultStatus}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Content */}
      {myClassIds.length === 0 ? (
        <EmptyState
          title={'কোনো শ্রেণি নির্ধারিত নেই'}
          description={'আপনাকে এখনো কোনো শ্রেণি বা বিষয়ে দায়িত্ব দেওয়া হয়নি।'}
        />
      ) : !activeExam ? (
        <EmptyState
          title={'কোনো পরীক্ষা পাওয়া যায়নি'}
          description={'নির্বাচিত শিক্ষাবর্ষে আপনার শ্রেণিসমূহের জন্য এখনো কোনো পরীক্ষা তৈরি করা হয়নি।'}
        />
      ) : loadingTabulation || fetchingTabulation ? (
        <LoadingSkeleton />
      ) : tabulationRows.length === 0 ? (
        <EmptyState
          title={'ফলাফল এখনো প্রক্রিয়াজাত করা হয়নি'}
          description={'এই পরীক্ষার নম্বর এন্ট্রি শেষ করে অ্যাডমিন প্যানেল থেকে ফলাফল প্রসেস করলে এখানে পূর্ণাঙ্গ মেধাতালিকা ও মার্কশিট দেখতে পাবেন।'}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left whitespace-nowrap">{'মেধা'}</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">{'রোল'}</th>
                  <th className="px-4 py-3 text-left">{'শিক্ষার্থী'}</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">{'শাখা'}</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">{'মোট নম্বর'}</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">GPA</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">{'গ্রেড'}</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">{'অবস্থা'}</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">{'মার্কশিট'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {tabulationRows.map((row) => {
                  const isPassed = row.resultStatus === 'PASSED' || row.failedSubjectCount === 0;
                  return (
                    <tr key={row.enrollmentId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-bold whitespace-nowrap">
                        {row.meritPosition ? `#${formatNumber(row.meritPosition, 'bn')}` : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-muted font-bold text-foreground text-sm">
                          {formatNumber(row.roll, 'bn')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {row.nameBn || row.name}
                        </div>
                        {row.nameBn && row.name && (
                          <div className="text-xs text-muted-foreground">{row.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {row.section || '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-foreground">
                          {formatNumber(row.totalMarks, 'bn')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {' '}
                          / {formatNumber(row.totalFullMarks, 'bn')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary whitespace-nowrap">
                        {row.gpa != null ? formatNumber(row.gpa, 'bn', 2) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold whitespace-nowrap">
                        {row.letterGrade ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
                            isPassed
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                          )}
                        >
                          {isPassed
                            ? 'উত্তীর্ণ'
                            : `অনুত্তীর্ণ (${formatNumber(row.failedSubjectCount, 'bn')})`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewRow(row)}
                        >
                          {'দেখুন'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Individual Student Marksheet Modal */}
      <Modal
        open={Boolean(marksheetProps)}
        onClose={() => setPreviewRow(null)}
        title={'শিক্ষার্থীর মার্কশিট'}
        maxWidth="max-w-4xl"
      >
        {marksheetProps && (
          <div className="space-y-4">
            <div className="flex justify-end no-print">
              <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {'প্রিন্ট করুন'}
              </Button>
            </div>
            <PrintableMarksheet {...marksheetProps} />
          </div>
        )}
      </Modal>

      {/* Merit List Print Preview Modal (A4) */}
      <Modal
        open={showMeritPrintModal && Boolean(activeExam) && tabulationRows.length > 0}
        onClose={() => setShowMeritPrintModal(false)}
        title={'মেধাতালিকা ও ফলাফল প্রিন্ট প্রিভিউ (A4)'}
        size="xl"
      >
        {activeExam && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2 print:hidden">
              <Button variant="outline" onClick={() => setShowMeritPrintModal(false)}>
                {'বন্ধ করুন'}
              </Button>
              <Button variant="primary" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {'প্রিন্ট / PDF সেভ করুন'}
              </Button>
            </div>

            <FormalExamDocumentShell
              school={schoolProfile}
              titleBn={'শ্রেণিভিত্তিক ফলাফল ও মেধাতালিকা'}
              titleEn={'Class Result & Merit List'}
              subtitleBn={`${activeExam.name}${activeClassName ? ` · ${activeClassName}` : ''}${activeYearName ? ` · শিক্ষাবর্ষ ${activeYearName}` : ''}`}
              dateLabel={formatDateLong(new Date().toISOString(), 'bn')}
              orientation="portrait"
              allowFlow
              signatures={[
                { titleBn: 'শ্রেণি শিক্ষক', titleEn: 'Class Teacher' },
                { titleBn: 'পরীক্ষা নিয়ন্ত্রক', titleEn: 'Controller of Examinations' },
                { titleBn: 'প্রধান শিক্ষক', titleEn: 'Head Teacher' },
              ]}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs border border-[#D4D4D8] bg-[#FAFAFA] px-3 py-2">
                  <span>
                    <strong>{'মোট পরীক্ষার্থী:'}</strong> {formatNumber(summary?.totalStudents ?? 0, 'bn')}
                  </span>
                  <span>
                    <strong>{'উত্তীর্ণ:'}</strong> {formatNumber(summary?.passedCount ?? 0, 'bn')}
                  </span>
                  <span>
                    <strong>{'অনুত্তীর্ণ:'}</strong> {formatNumber(summary?.failedCount ?? 0, 'bn')}
                  </span>
                  <span>
                    <strong>{'পাসের হার:'}</strong> {formatNumber(summary?.passPercentage ?? 0, 'bn', 1)}%
                  </span>
                </div>

                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F4F4F5] text-[#111111]">
                      <th className="border border-[#52525B] px-2 py-1.5 text-center">{'মেধা'}</th>
                      <th className="border border-[#52525B] px-2 py-1.5 text-center">{'রোল'}</th>
                      <th className="border border-[#52525B] px-2 py-1.5 text-left">{'শিক্ষার্থীর নাম'}</th>
                      <th className="border border-[#52525B] px-2 py-1.5 text-center">{'শাখা'}</th>
                      <th className="border border-[#52525B] px-2 py-1.5 text-right">{'মোট নম্বর'}</th>
                      <th className="border border-[#52525B] px-2 py-1.5 text-right">GPA</th>
                      <th className="border border-[#52525B] px-2 py-1.5 text-center">{'গ্রেড'}</th>
                      <th className="border border-[#52525B] px-2 py-1.5 text-center">{'অবস্থা'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabulationRows.map((row) => {
                      const isPassed = row.resultStatus === 'PASSED' || row.failedSubjectCount === 0;
                      return (
                        <tr key={`print-${row.enrollmentId}`}>
                          <td className="border border-[#52525B] px-2 py-1.5 text-center font-semibold">
                            {row.meritPosition ? formatNumber(row.meritPosition, 'bn') : '—'}
                          </td>
                          <td className="border border-[#52525B] px-2 py-1.5 text-center">
                            {formatNumber(row.roll, 'bn')}
                          </td>
                          <td className="border border-[#52525B] px-2 py-1.5 font-medium">
                            {row.nameBn || row.name}
                          </td>
                          <td className="border border-[#52525B] px-2 py-1.5 text-center">
                            {row.section || '—'}
                          </td>
                          <td className="border border-[#52525B] px-2 py-1.5 text-right">
                            {formatNumber(row.totalMarks, 'bn')} / {formatNumber(row.totalFullMarks, 'bn')}
                          </td>
                          <td className="border border-[#52525B] px-2 py-1.5 text-right font-semibold">
                            {row.gpa != null ? formatNumber(row.gpa, 'bn', 2) : '—'}
                          </td>
                          <td className="border border-[#52525B] px-2 py-1.5 text-center">
                            {row.letterGrade ?? '—'}
                          </td>
                          <td className="border border-[#52525B] px-2 py-1.5 text-center">
                            {isPassed ? 'উত্তীর্ণ' : 'অনুত্তীর্ণ'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </FormalExamDocumentShell>
          </div>
        )}
      </Modal>
    </div>
  );
}
