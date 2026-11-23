'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  MessageSquareText,
  Printer,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetBootstrapQuery, useSaveResultRemarkMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { ExamType, ResultStatus } from '@/src/types/enums';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/src/components/ui/primitives';
import {
  PrintableBulkMarksheets,
  PrintableMarksheet,
  PrintableTabulationSheet,
  type PrintableMarksheetProps,
} from '@/src/components/print/ExamPrintDocuments';
import { buildStudentMarksheetProps } from './ExamShared';

const REMARK_PRESETS = [
  {
    bn: 'অসাধারণ ফলাফল। তোমার মেধা ও অধ্যবসায় প্রশংসনীয়; এই ধারাবাহিকতা বজায় রাখো।',
    en: 'Outstanding performance. Commendable dedication and academic excellence; keep it up.',
  },
  {
    bn: 'সন্তোষজনক অগ্রগতি। নিয়মিত অনুশীলন করলে পরবর্তী পরীক্ষায় আরও ভালো ফলাফল সম্ভব।',
    en: 'Satisfactory progress. Consistent practice will lead to even stronger results next term.',
  },
  {
    bn: 'মোটামুটি ফলাফল। গণিত ও ইংরেজিতে অতিরিক্ত মনোযোগ ও নিয়মিত ক্লাস উপস্থিতি প্রয়োজন।',
    en: 'Moderate performance. Additional focus on Mathematics and English with regular attendance is advised.',
  },
  {
    bn: 'অনুত্তীর্ণ বিষয়ে বিশেষ প্রস্তুতি ও অভিভাবকের নিবিড় তদারকি একান্ত প্রয়োজন।',
    en: 'Requires focused remedial preparation in failed subjects and close guardian supervision.',
  },
];

export function MeritAndMarksheetsView({ initialExamId }: { initialExamId?: string }) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [saveRemark, { isLoading: savingRemark }] = useSaveResultRemarkMutation();

  const standardExams = useMemo(
    () => (db?.exams ?? []).filter((e) => e.examType !== ExamType.CONSOLIDATED),
    [db]
  );

  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId ?? '');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [previewMarksheet, setPreviewMarksheet] = useState<PrintableMarksheetProps | null>(null);
  const [showBulkMarksheets, setShowBulkMarksheets] = useState(false);
  const [showTabulation, setShowTabulation] = useState(false);
  const [remarkTarget, setRemarkTarget] = useState<{
    resultSummaryId: string;
    studentName: string;
    roll: number;
    currentRemark: string;
  } | null>(null);
  const [remarkDraft, setRemarkDraft] = useState('');

  const activeExamId = useMemo(() => {
    if (selectedExamId && standardExams.some((e) => e.id === selectedExamId)) return selectedExamId;
    if (initialExamId && standardExams.some((e) => e.id === initialExamId)) return initialExamId;
    const withResults = standardExams.find((e) =>
      (db?.resultSummaries ?? []).some((r) => r.examId === e.id)
    );
    return withResults?.id ?? standardExams[0]?.id ?? '';
  }, [selectedExamId, initialExamId, standardExams, db]);

  const selectedExam = useMemo(
    () => standardExams.find((e) => e.id === activeExamId) ?? null,
    [standardExams, activeExamId]
  );

  const selectedClass = useMemo(
    () => (db && selectedExam ? db.classes.find((c) => c.id === selectedExam.classId) ?? null : null),
    [db, selectedExam]
  );

  const selectedYear = useMemo(
    () => (db && selectedExam ? db.academicYears.find((y) => y.id === selectedExam.academicYearId) ?? null : null),
    [db, selectedExam]
  );

  const classSections = useMemo(
    () =>
      db && selectedExam
        ? db.sections
            .filter((s) => s.classId === selectedExam.classId && s.isActive)
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [db, selectedExam]
  );

  const classGroups = useMemo(() => {
    if (!db || !selectedExam) return [];
    const groupIds = new Set(
      db.enrollments
        .filter((e) => e.classId === selectedExam.classId && e.academicYearId === selectedExam.academicYearId && e.groupId)
        .map((e) => e.groupId as string)
    );
    return db.academicGroups.filter((g) => groupIds.has(g.id));
  }, [db, selectedExam]);

  const enrichedRows = useMemo(() => {
    if (!db || !selectedExam) return [];
    return db.resultSummaries
      .filter((r) => r.examId === selectedExam.id)
      .map((summary) => {
        const enr = db.enrollments.find((e) => e.id === summary.studentEnrollmentId);
        const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
        const sec = enr ? db.sections.find((s) => s.id === enr.sectionId) : null;
        const grp = enr?.groupId ? db.academicGroups.find((g) => g.id === enr.groupId) : null;
        return {
          summary,
          enrollment: enr ?? null,
          student: stu ?? null,
          section: sec ?? null,
          group: grp ?? null,
          roll: enr?.roll ?? 0,
          studentId: stu?.studentId ?? '',
          studentName: locale === 'bn' ? stu?.nameBn || stu?.nameEn || '—' : stu?.nameEn || '—',
          studentNameEn: stu?.nameEn ?? '',
          studentNameBn: stu?.nameBn ?? '',
          sectionName: sec?.name ?? '—',
          groupName: grp ? (locale === 'bn' ? grp.nameBn : grp.name) : null,
        };
      })
      .sort((a, b) => {
        const aPass = a.summary.resultStatus === ResultStatus.PASS ? 0 : 1;
        const bPass = b.summary.resultStatus === ResultStatus.PASS ? 0 : 1;
        if (aPass !== bPass) return aPass - bPass;
        const aMerit = a.summary.meritPosition ?? 9999;
        const bMerit = b.summary.meritPosition ?? 9999;
        if (aMerit !== bMerit) return aMerit - bMerit;
        return b.summary.totalMarks - a.summary.totalMarks || a.roll - b.roll;
      });
  }, [db, selectedExam, locale]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedRows.filter((row) => {
      if (sectionFilter !== 'ALL' && row.enrollment?.sectionId !== sectionFilter) return false;
      if (groupFilter !== 'ALL' && row.enrollment?.groupId !== groupFilter) return false;
      if (statusFilter === 'PASS' && row.summary.resultStatus !== ResultStatus.PASS) return false;
      if (statusFilter === 'FAIL' && row.summary.resultStatus !== ResultStatus.FAIL) return false;
      if (q) {
        const hay = `${row.studentNameEn} ${row.studentNameBn} ${row.studentId} ${row.roll}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedRows, sectionFilter, groupFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const total = filteredRows.length;
    const passed = filteredRows.filter((r) => r.summary.resultStatus === ResultStatus.PASS).length;
    const failed = filteredRows.filter((r) => r.summary.resultStatus === ResultStatus.FAIL).length;
    const gpa5 = filteredRows.filter(
      (r) => r.summary.resultStatus === ResultStatus.PASS && (r.summary.gpa ?? 0) >= 5.0
    ).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, failed, gpa5, passRate };
  }, [filteredRows]);

  const tabulationData = useMemo(() => {
    if (!db || !selectedExam) return { subjects: [], rows: [] };
    const examSubs = db.examSubjects
      .filter((es) => es.examId === selectedExam.id)
      .filter((es) => groupFilter === 'ALL' || !es.groupId || es.groupId === groupFilter)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const subjects = examSubs.map((es) => {
      const sub = db.subjects.find((s) => s.id === es.subjectId);
      return {
        id: es.id,
        code: sub?.officialCode ?? '—',
        nameBn: sub?.nameBn ?? sub?.name ?? 'বিষয়',
        nameEn: sub?.name ?? 'Subject',
        fullMarks: es.fullMarks,
      };
    });

    const rows = filteredRows.map((row) => {
      const subjectMarks: Record<
        string,
        { total: number; grade: string; isAbsent?: boolean; isPassed?: boolean }
      > = {};
      if (row.enrollment) {
        const ssrList = db.studentSubjectResults.filter(
          (r) => r.examId === selectedExam.id && r.studentEnrollmentId === row.enrollment!.id
        );
        ssrList.forEach((ssr) => {
          subjectMarks[ssr.examSubjectId] = {
            total: ssr.totalMarks,
            grade: ssr.letterGrade ?? 'F',
            isAbsent: ssr.isAbsent,
            isPassed: ssr.isPassed,
          };
        });
      }
      return {
        roll: row.roll,
        studentId: row.studentId,
        studentName: row.studentName,
        sectionName: row.sectionName,
        groupName: row.groupName,
        subjectMarks,
        totalMarks: row.summary.totalMarks,
        totalFullMarks: row.summary.totalFullMarks,
        gpa: row.summary.gpa ?? null,
        gpaWithoutOptional: row.summary.gpaWithoutOptional ?? null,
        letterGrade: row.summary.letterGrade ?? null,
        meritPosition: row.summary.meritPosition ?? null,
        resultStatus: row.summary.resultStatus,
      };
    });

    return { subjects, rows };
  }, [db, selectedExam, filteredRows, groupFilter]);

  const bulkMarksheetItems = useMemo(() => {
    if (!db || !selectedExam || !showBulkMarksheets) return [];
    return filteredRows
      .map((r) => buildStudentMarksheetProps(db, selectedExam, r.summary, locale))
      .filter((item): item is PrintableMarksheetProps => item !== null);
  }, [db, selectedExam, filteredRows, locale, showBulkMarksheets]);

  const activeSectionLabel = useMemo(() => {
    const parts: string[] = [];
    if (sectionFilter !== 'ALL') {
      const sec = classSections.find((s) => s.id === sectionFilter);
      if (sec) parts.push(`${pick('শাখা', 'Sec')}: ${sec.name}`);
    }
    if (groupFilter !== 'ALL') {
      const grp = classGroups.find((g) => g.id === groupFilter);
      if (grp) parts.push(locale === 'bn' ? grp.nameBn : grp.name);
    }
    return parts.length > 0 ? parts.join(' · ') : pick('সকল শাখা', 'All Sections');
  }, [sectionFilter, groupFilter, classSections, classGroups, locale, pick]);

  const handleOpenRemark = (row: (typeof enrichedRows)[number]) => {
    setRemarkTarget({
      resultSummaryId: row.summary.id,
      studentName: row.studentName,
      roll: row.roll,
      currentRemark: row.summary.teacherRemarks ?? '',
    });
    setRemarkDraft(row.summary.teacherRemarks ?? '');
  };

  const handleSaveRemark = async () => {
    if (!remarkTarget) return;
    try {
      await saveRemark({
        resultSummaryId: remarkTarget.resultSummaryId,
        teacherRemarks: remarkDraft.trim(),
      }).unwrap();
      toast.success(pick('শ্রেণি শিক্ষকের মন্তব্য সংরক্ষিত হয়েছে।', 'Class teacher remarks saved.'));
      setRemarkTarget(null);
    } catch {
      toast.error(pick('মন্তব্য সংরক্ষণ করা যায়নি।', 'Failed to save remarks.'));
    }
  };

  const handleExportCsv = () => {
    if (!selectedExam || filteredRows.length === 0) return;
    const csvRows = filteredRows.map((r) => ({
      ClassMerit: r.summary.meritPosition ?? '—',
      SectionMerit: r.summary.sectionMeritPosition ?? '—',
      Roll: r.roll,
      StudentID: r.studentId,
      StudentName: r.studentNameEn,
      StudentNameBn: r.studentNameBn,
      Section: r.sectionName,
      Group: r.groupName ?? '',
      TotalMarks: r.summary.totalMarks,
      FullMarks: r.summary.totalFullMarks,
      GPA: r.summary.gpa !== null && r.summary.gpa !== undefined ? r.summary.gpa.toFixed(2) : '0.00',
      GPAWithout4th:
        r.summary.gpaWithoutOptional !== null && r.summary.gpaWithoutOptional !== undefined
          ? r.summary.gpaWithoutOptional.toFixed(2)
          : '',
      Grade: r.summary.letterGrade ?? 'F',
      FailedSubjects: r.summary.failedSubjectCount,
      Status: r.summary.resultStatus,
      TeacherRemarks: r.summary.teacherRemarks ?? '',
    }));
    exportToCsv(csvRows, `merit-list-${selectedExam.id}.csv`);
    toast.success(pick('মেধাতালিকা CSV ডাউনলোড হয়েছে।', 'Merit list CSV exported.'));
  };

  if (isLoading || !db) return <LoadingSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('মেধাতালিকা, মার্কশিট ও ট্যাবুলেশন শিট', 'Merit List, Marksheets & Tabulation Sheet')}
        description={pick(
          'শ্রেণি ও শাখাভিত্তিক মেধাক্রম, শ্রেণি শিক্ষকের মন্তব্য, বাল্ক একাডেমিক ট্রান্সক্রিপ্ট এবং ল্যান্ডস্কেপ A4 ট্যাবুলেশন শিট।',
          'Class & section merit rankings, editable class teacher remarks, bulk academic transcripts, and landscape A4 tabulation sheets.'
        )}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={filteredRows.length === 0}
              onClick={handleExportCsv}
            >
              <Download className="w-4 h-4" />
              {pick('CSV এক্সপোর্ট', 'Export CSV')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filteredRows.length === 0}
              onClick={() => setShowTabulation(true)}
            >
              <FileSpreadsheet className="w-4 h-4" />
              {pick('ট্যাবুলেশন শিট (A4)', 'Tabulation Sheet (A4)')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={filteredRows.length === 0}
              onClick={() => setShowBulkMarksheets(true)}
            >
              <Layers className="w-4 h-4" />
              {pick(
                `বাল্ক মার্কশিট (${formatNumber(filteredRows.length, locale)})`,
                `Bulk Marksheets (${formatNumber(filteredRows.length, locale)})`
              )}
            </Button>
          </>
        }
      />

      {/* Exam & Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-2 lg:col-span-4">
            <FormField label={pick('পরীক্ষা নির্বাচন করুন', 'Select Examination')}>
              <Select
                value={activeExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  setSectionFilter('ALL');
                  setGroupFilter('ALL');
                }}
              >
                {standardExams.map((ex) => {
                  const cls = db.classes.find((c) => c.id === ex.classId);
                  return (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} — {locale === 'bn' ? cls?.nameBn || cls?.name : cls?.name}
                    </option>
                  );
                })}
              </Select>
            </FormField>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <FormField label={pick('শাখা', 'Section')}>
              <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                <option value="ALL">{pick('সকল শাখা', 'All Sections')}</option>
                {classSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {classGroups.length > 0 && (
            <div className="sm:col-span-1 lg:col-span-2">
              <FormField label={pick('বিভাগ (Group)', 'Academic Group')}>
                <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
                  <option value="ALL">{pick('সকল বিভাগ', 'All Groups')}</option>
                  {classGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {locale === 'bn' ? g.nameBn : g.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          )}

          <div className="sm:col-span-1 lg:col-span-2">
            <FormField label={pick('ফলাফলের অবস্থা', 'Result Status')}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PASS' | 'FAIL')}
              >
                <option value="ALL">{pick('সকল শিক্ষার্থী', 'All Students')}</option>
                <option value="PASS">{pick('শুধুমাত্র উত্তীর্ণ', 'Passed Only')}</option>
                <option value="FAIL">{pick('শুধুমাত্র অনুত্তীর্ণ', 'Failed Only')}</option>
              </Select>
            </FormField>
          </div>

          <div className={classGroups.length > 0 ? 'sm:col-span-1 lg:col-span-2' : 'sm:col-span-2 lg:col-span-4'}>
            <FormField label={pick('খুঁজুন (নাম / রোল / আইডি)', 'Search (Name / Roll / ID)')}>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  className="pl-9"
                  placeholder={pick('নাম বা রোল...', 'Name or roll...')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </FormField>
          </div>
        </div>
      </Card>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('মোট ফলাফল (ফিল্টারকৃত)', 'Filtered Examinees')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(stats.total, locale)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">{pick('জন', '')}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums truncate">
            {activeSectionLabel}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('উত্তীর্ণ ও পাসের হার', 'Passed & Pass Rate')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-success">
            {formatNumber(stats.passed, locale)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">({formatNumber(stats.passRate, locale)}%)</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `উত্তীর্ণ ${formatNumber(stats.passed, 'bn')} · অনুত্তীর্ণ ${formatNumber(stats.failed, 'bn')}`,
              `Passed ${stats.passed} · Failed ${stats.failed}`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('জিপিএ ৫.০০ (A+)', 'GPA 5.00 (A+)')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            {formatNumber(stats.gpa5, locale)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">{pick('জন', '')}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {stats.total > 0
              ? pick(
                  `মোট পরীক্ষার্থীর ${formatNumber(Math.round((stats.gpa5 / stats.total) * 100), locale)}%`,
                  `${Math.round((stats.gpa5 / stats.total) * 100)}% of total`
                )
              : pick('কোনো ফলাফল নেই', 'No results')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('অনুত্তীর্ণ শিক্ষার্থী', 'Failed Examinees')}
          </p>
          <p
            className={cn(
              'mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums',
              stats.failed > 0 ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatNumber(stats.failed, locale)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">{pick('জন', '')}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {stats.failed > 0
              ? pick(
                  `ফেলের হার: ${formatNumber(stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0, locale)}%`,
                  `Failure rate: ${stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}%`
                )
              : pick('শতভাগ পাস অর্জিত', '100% pass achieved')}
          </p>
        </Card>
      </div>

      {/* Main Merit List Table */}
      <Card className="overflow-hidden">
        {enrichedRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={pick('এই পরীক্ষার ফলাফল এখনো হিসাব করা হয়নি', 'No Processed Results Yet')}
              description={pick(
                'মেধাতালিকা, মার্কশিট ও ট্যাবুলেশন শিট দেখতে প্রথমে ফলাফল প্রক্রিয়াকরণ পাতা থেকে জিপিএ ও মেধাক্রম গণনা করুন।',
                'Compute GPA and merit rankings from the Result Publication pipeline before viewing merit lists and marksheets.'
              )}
              action={
                <Link href="/admin/results/publication">
                  <Button size="sm" variant="primary">
                    {pick('ফলাফল প্রক্রিয়াকরণে যান', 'Go to Result Processing')}
                  </Button>
                </Link>
              }
            />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={pick('ফিল্টারের সাথে কোনো ফলাফল মেলেনি', 'No Matching Results')}
              description={pick(
                'অনুগ্রহ করে শাখা, বিভাগ বা অনুসন্ধান শর্ত পরিবর্তন করে চেষ্টা করুন।',
                'Try adjusting your section, academic group, status, or search filter.'
              )}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-base">
              <thead>
                <tr className="border-b border-border bg-surface-muted/70 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-20">{pick('শ্রেণি মেধা', 'Class Merit')}</th>
                  <th className="px-3 py-3 text-center w-20">{pick('শাখা মেধা', 'Sec. Merit')}</th>
                  <th className="px-3 py-3 text-center w-16">{pick('রোল', 'Roll')}</th>
                  <th className="px-4 py-3 text-left">{pick('শিক্ষার্থী ও শাখা', 'Student & Section')}</th>
                  <th className="px-3 py-3 text-right">{pick('মোট নম্বর', 'Total Marks')}</th>
                  <th className="px-3 py-3 text-right">{pick('জিপিএ', 'GPA')}</th>
                  <th className="px-3 py-3 text-center">{pick('গ্রেড', 'Grade')}</th>
                  <th className="px-3 py-3 text-center">{pick('অবস্থা', 'Status')}</th>
                  <th className="px-4 py-3 text-right">{pick('কার্যক্রম', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {filteredRows.map((row) => {
                  const isPass = row.summary.resultStatus === ResultStatus.PASS;
                  const pct =
                    row.summary.totalFullMarks > 0
                      ? ((row.summary.totalMarks / row.summary.totalFullMarks) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <tr key={row.summary.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="px-4 py-3 text-center">
                        {row.summary.meritPosition ? (
                          <span
                            className={`inline-flex items-center justify-center min-w-[2.2rem] px-2 py-0.5 rounded text-xs font-semibold ${
                              row.summary.meritPosition <= 3
                                ? 'bg-warning/15 text-warning border border-warning/30'
                                : 'bg-surface-muted text-foreground'
                            }`}
                          >
                            #{formatNumber(row.summary.meritPosition, locale)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-muted-foreground font-medium">
                        {row.summary.sectionMeritPosition
                          ? `#${formatNumber(row.summary.sectionMeritPosition, locale)}`
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-foreground">
                        {formatNumber(row.roll, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{row.studentName}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{row.studentId}</span>
                          <span>·</span>
                          <span>
                            {pick('শাখা', 'Sec')}: {row.sectionName}
                          </span>
                          {row.groupName && (
                            <>
                              <span>·</span>
                              <span className="text-primary font-medium">{row.groupName}</span>
                            </>
                          )}
                        </div>
                        {row.summary.teacherRemarks && (
                          <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">
                            “{row.summary.teacherRemarks}”
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="font-medium text-foreground">
                          {formatNumber(row.summary.totalMarks, locale)}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{formatNumber(row.summary.totalFullMarks, locale)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(Number(pct), locale, 1)}%
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="font-semibold text-foreground">
                          {row.summary.gpa !== null && row.summary.gpa !== undefined
                            ? formatNumber(row.summary.gpa, locale, 2)
                            : '—'}
                        </div>
                        {row.summary.gpaWithoutOptional !== null &&
                          row.summary.gpaWithoutOptional !== undefined &&
                          row.summary.gpaWithoutOptional !== row.summary.gpa && (
                            <div className="text-xs text-muted-foreground">
                              {pick('৪র্থ ছাড়া:', 'w/o 4th:')}{' '}
                              {formatNumber(row.summary.gpaWithoutOptional, locale, 2)}
                            </div>
                          )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold border ${
                            isPass
                              ? row.summary.letterGrade === 'A+'
                                ? 'bg-success/10 text-success border-success/25'
                                : 'bg-primary/10 text-primary border-primary/25'
                              : 'bg-destructive/10 text-destructive border-destructive/25'
                          }`}
                        >
                          {row.summary.letterGrade ?? 'F'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge
                          value={row.summary.resultStatus}
                          customTone={isPass ? 'success' : 'destructive'}
                          customLabel={
                            isPass
                              ? pick('উত্তীর্ণ', 'PASS')
                              : pick(
                                  `অনুত্তীর্ণ (${formatNumber(row.summary.failedSubjectCount, locale)})`,
                                  `FAIL (${row.summary.failedSubjectCount})`
                                )
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenRemark(row)}
                            title={pick('শ্রেণি শিক্ষকের মন্তব্য সম্পাদনা', 'Edit Class Teacher Remarks')}
                          >
                            <MessageSquareText className="w-3.5 h-3.5" />
                            {pick('মন্তব্য', 'Remark')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (!selectedExam) return;
                              const props = buildStudentMarksheetProps(db, selectedExam, row.summary, locale);
                              if (props) setPreviewMarksheet(props);
                            }}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {pick('মার্কশিট', 'Marksheet')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Class Teacher Remarks Modal */}
      <Modal
        open={!!remarkTarget}
        onClose={() => setRemarkTarget(null)}
        title={pick('শ্রেণি শিক্ষকের মন্তব্য সংরক্ষণ', 'Class Teacher Remarks')}
        description={
          remarkTarget
            ? `${remarkTarget.studentName} · ${pick('রোল', 'Roll')}: ${formatNumber(remarkTarget.roll, locale)}`
            : undefined
        }
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <FormField label={pick('মার্কশিটে প্রদর্শিত মন্তব্য', 'Remarks Printed on Official Marksheet')}>
            <Textarea
              rows={3}
              placeholder={pick(
                'শিক্ষার্থীর একাডেমিক অগ্রগতি ও পরামর্শ লিখুন...',
                'Write personalized academic feedback for the student transcript...'
              )}
              value={remarkDraft}
              onChange={(e) => setRemarkDraft(e.target.value)}
            />
          </FormField>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {pick('দ্রুত মন্তব্য টেমপ্লেট:', 'Quick Preset Remarks:')}
            </p>
            <div className="space-y-1.5">
              {REMARK_PRESETS.map((preset, idx) => {
                const text = locale === 'bn' ? preset.bn : preset.en;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRemarkDraft(text)}
                    className="w-full text-left text-xs px-3 py-2 rounded-md border border-border hover:border-primary hover:bg-primary/5 text-foreground transition-colors cursor-pointer"
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setRemarkTarget(null)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button variant="primary" disabled={savingRemark} onClick={handleSaveRemark}>
              {pick('মন্তব্য সংরক্ষণ করুন', 'Save Remarks')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Single Institutional Marksheet Preview & Print Modal */}
      <Modal
        open={!!previewMarksheet}
        onClose={() => setPreviewMarksheet(null)}
        title={pick('প্রাতিষ্ঠানিক একাডেমিক ট্রান্সক্রিপ্ট / মার্কশিট', 'Institutional Academic Transcript / Marksheet')}
        maxWidth="max-w-4xl"
      >
        {previewMarksheet && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewMarksheet(null)}>
                {pick('বন্ধ করুন', 'Close')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {pick('প্রিন্ট / PDF সংরক্ষণ', 'Print / Save PDF')}
              </Button>
            </div>
            <div className="overflow-x-auto pb-2">
              <PrintableMarksheet {...previewMarksheet} />
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Filtered Marksheets Print Modal */}
      <Modal
        open={showBulkMarksheets}
        onClose={() => setShowBulkMarksheets(false)}
        title={pick(
          `বাল্ক মার্কশিট প্রিন্ট (${formatNumber(bulkMarksheetItems.length, locale)}টি)`,
          `Bulk Marksheets Print (${formatNumber(bulkMarksheetItems.length, locale)} transcripts)`
        )}
        description={`${selectedExam?.name ?? ''} · ${activeSectionLabel}`}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkMarksheets(false)}>
              {pick('বন্ধ করুন', 'Close')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {pick('সব মার্কশিট একসাথে প্রিন্ট করুন', 'Print All Filtered Marksheets')}
            </Button>
          </div>
          <div className="overflow-x-auto pb-2">
            <PrintableBulkMarksheets items={bulkMarksheetItems} />
          </div>
        </div>
      </Modal>

      {/* Landscape A4 Institutional Tabulation Sheet Modal */}
      <Modal
        open={showTabulation}
        onClose={() => setShowTabulation(false)}
        title={pick('শ্রেণিভিত্তিক ট্যাবুলেশন শিট (ল্যান্ডস্কেপ A4)', 'Official Class Tabulation Sheet (Landscape A4)')}
        description={`${selectedExam?.name ?? ''} · ${locale === 'bn' ? selectedClass?.nameBn : selectedClass?.name} · ${activeSectionLabel}`}
        maxWidth="max-w-6xl"
      >
        {selectedExam && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowTabulation(false)}>
                {pick('বন্ধ করুন', 'Close')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {pick('ল্যান্ডস্কেপ A4 প্রিন্ট করুন', 'Print Landscape A4')}
              </Button>
            </div>
            <div className="overflow-x-auto pb-2">
              <PrintableTabulationSheet
                school={db.schoolProfile}
                examName={selectedExam.name}
                className={locale === 'bn' ? selectedClass?.nameBn || selectedClass?.name || '' : selectedClass?.name || ''}
                sectionLabel={activeSectionLabel}
                academicYear={selectedYear?.name ?? '2026'}
                subjects={tabulationData.subjects}
                rows={tabulationData.rows}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
