'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Printer,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetBootstrapQuery } from '@/src/store/api';
import {
  useGetExamsQuery,
  useGetTabulationSheetQuery,
  type TabulationRow,
} from '@/src/features/examinations/api/examinations.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { cn, exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { ExamType, ResultStatus } from '@/src/types/enums';
import type { SchoolProfile } from '@/src/types/entities';
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
  Select,
  Modal,
} from '@/src/components/ui/primitives';
import {
  PrintableBulkMarksheets,
  PrintableMarksheet,
  PrintableTabulationSheet,
  type PrintableMarksheetProps,
} from '@/src/components/print/ExamPrintDocuments';

const FALLBACK_SCHOOL_PROFILE: SchoolProfile = {
  id: 'school-default',
  name: 'ভোজেশ্বর উচ্চ বিদ্যালয়',
  nameEn: 'Vojesshor High School',
  eiin: '112233',
  establishedYear: 1965,
  address: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
  phone: '',
  email: '',
  createdAt: '',
  updatedAt: '',
};

export function MeritAndMarksheetsView({ initialExamId }: { initialExamId?: string }) {
  const { locale, pick } = useI18n();
  const { data: db } = useGetBootstrapQuery();
  const { data: examsRes, isLoading: loadingExams } = useGetExamsQuery({
    limit: 100,
    isDeleted: false,
  });
  const { data: allClasses = [] } = useGetSchoolClassesQuery();

  const standardExams = useMemo(
    () =>
      (examsRes?.items ?? [])
        .filter((e) => e.examType !== ExamType.CONSOLIDATED)
        .sort(
          (a, b) =>
            (a.schoolClass?.numericValue ?? 99) - (b.schoolClass?.numericValue ?? 99)
        ),
    [examsRes?.items]
  );

  const activeClasses = useMemo(
    () =>
      [...allClasses]
        .filter((c) => c.isActive)
        .sort((a, b) => a.numericValue - b.numericValue),
    [allClasses]
  );

  const initialExam = useMemo(
    () => (initialExamId ? standardExams.find((e) => e.id === initialExamId) ?? null : null),
    [initialExamId, standardExams]
  );

  const [selectedExamName, setSelectedExamName] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'INCOMPLETE'>('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [previewMarksheet, setPreviewMarksheet] = useState<PrintableMarksheetProps | null>(null);
  const [showBulkMarksheets, setShowBulkMarksheets] = useState(false);
  const [showTabulation, setShowTabulation] = useState(false);

  const examNames = useMemo(
    () => Array.from(new Set(standardExams.map((e) => e.name))),
    [standardExams]
  );

  const resolvedExamName =
    selectedExamName && examNames.includes(selectedExamName)
      ? selectedExamName
      : initialExam?.name ?? examNames[0] ?? '';

  const resolvedClassId =
    selectedClassId && activeClasses.some((c) => c.id === selectedClassId)
      ? selectedClassId
      : initialExam?.classId ?? activeClasses[0]?.id ?? '';

  const activeExam = useMemo(
    () =>
      standardExams.find(
        (e) => e.name === resolvedExamName && e.classId === resolvedClassId
      ) ?? null,
    [standardExams, resolvedExamName, resolvedClassId]
  );

  const activeClass = useMemo(
    () => activeClasses.find((c) => c.id === resolvedClassId) ?? null,
    [activeClasses, resolvedClassId]
  );

  const { data: sectionsData = [] } = useGetSectionsQuery(
    { classId: activeExam?.classId },
    { skip: !activeExam?.classId }
  );

  const {
    data: tabulationRes,
    isLoading: loadingTabulation,
    isFetching: fetchingTabulation,
  } = useGetTabulationSheetQuery(
    { examId: activeExam?.id ?? '' },
    { skip: !activeExam?.id }
  );

  const schoolProfile: SchoolProfile = db?.schoolProfile ?? FALLBACK_SCHOOL_PROFILE;

  const sectionOptions = useMemo(() => {
    const fromApi = sectionsData.filter((s) => s.isActive).map((s) => s.name);
    const fromTabulation = (tabulationRes?.tabulation ?? []).map((r) => r.section);
    return Array.from(new Set([...fromApi, ...fromTabulation])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [sectionsData, tabulationRes?.tabulation]);

  const sortedRows = useMemo(() => {
    const rows = [...(tabulationRes?.tabulation ?? [])];
    return rows.sort((a, b) => {
      const aPass = a.resultStatus === ResultStatus.PASS ? 0 : a.resultStatus === ResultStatus.FAIL ? 1 : 2;
      const bPass = b.resultStatus === ResultStatus.PASS ? 0 : b.resultStatus === ResultStatus.FAIL ? 1 : 2;
      if (aPass !== bPass) return aPass - bPass;
      const aMerit = a.meritPosition ?? 9999;
      const bMerit = b.meritPosition ?? 9999;
      if (aMerit !== bMerit) return aMerit - bMerit;
      return b.totalMarks - a.totalMarks || a.roll - b.roll;
    });
  }, [tabulationRes?.tabulation]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedRows.filter((row) => {
      if (sectionFilter !== 'ALL' && row.section !== sectionFilter) return false;
      if (statusFilter === 'PASS' && row.resultStatus !== ResultStatus.PASS) return false;
      if (statusFilter === 'FAIL' && row.resultStatus !== ResultStatus.FAIL) return false;
      if (statusFilter === 'INCOMPLETE' && row.resultStatus !== ResultStatus.INCOMPLETE) return false;
      if (q) {
        const hay = `${row.name} ${row.nameBn ?? ''} ${row.studentId} ${row.roll}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sortedRows, sectionFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const total = filteredRows.length;
    const passed = filteredRows.filter((r) => r.resultStatus === ResultStatus.PASS).length;
    const failed = filteredRows.filter((r) => r.resultStatus === ResultStatus.FAIL).length;
    const maxGpa = tabulationRes?.examination?.maxGpa ?? 5.0;
    const gpa5 = filteredRows.filter(
      (r) => r.resultStatus === ResultStatus.PASS && (r.gpa ?? 0) >= maxGpa
    ).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, failed, gpa5, passRate };
  }, [filteredRows, tabulationRes?.examination?.maxGpa]);

  const subjectFullMarksMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of tabulationRes?.subjectsList ?? []) {
      map.set(s.id, s.fullMarks);
    }
    return map;
  }, [tabulationRes?.subjectsList]);

  const buildRowMarksheetProps = useMemo(() => {
    return (row: TabulationRow): PrintableMarksheetProps | null => {
      if (!activeExam || !tabulationRes) return null;
      return {
        school: schoolProfile,
        examName: tabulationRes.examination.name,
        student: {
          studentId: row.studentId,
          nameEn: row.name,
          nameBn: row.nameBn,
          roll: row.roll,
          className: tabulationRes.examination.class,
          classNameBn: activeClass?.nameBn || tabulationRes.examination.class,
          sectionName: row.section,
          academicYear: tabulationRes.examination.academicYear,
        },
        summary: {
          totalFullMarks: row.totalFullMarks,
          totalMarks: row.totalMarks,
          gpa: row.gpa,
          gpaWithoutOptional: row.gpaWithoutOptional,
          letterGrade: row.letterGrade,
          meritPosition: row.meritPosition,
          sectionMeritPosition: row.sectionMeritPosition,
          failedSubjectCount: row.failedSubjectCount,
          resultStatus: row.resultStatus,
          publishedAt: tabulationRes.examination.publishedAt,
        },
        subjects: row.subjects.map((sub) => ({
          subjectCode: sub.code ?? '—',
          subjectName: sub.subjectName,
          subjectNameBn: sub.subjectName,
          fullMarks: subjectFullMarksMap.get(sub.examSubjectId) ?? 100,
          writtenMarks: 0,
          mcqMarks: 0,
          practicalMarks: 0,
          totalMarks: sub.totalMarks,
          letterGrade: sub.letterGrade,
          gradePoint: sub.gradePoint,
          isPassed: sub.isPassed,
          isOptional: sub.isOptional,
          bonusGradePoint: 0,
          isAbsent: sub.isAbsent,
        })),
      };
    };
  }, [activeExam, tabulationRes, schoolProfile, activeClass, subjectFullMarksMap]);

  const tabulationData = useMemo(() => {
    if (!tabulationRes) return { subjects: [], rows: [] };
    const subjects = tabulationRes.subjectsList.map((s) => ({
      id: s.id,
      code: s.code ?? '—',
      nameBn: s.name,
      nameEn: s.name,
      fullMarks: s.fullMarks,
    }));

    const rows = filteredRows.map((row) => {
      const subjectMarks: Record<
        string,
        { total: number; grade: string; isAbsent?: boolean; isPassed?: boolean }
      > = {};
      for (const sr of row.subjects) {
        subjectMarks[sr.examSubjectId] = {
          total: sr.totalMarks,
          grade: sr.letterGrade ?? 'F',
          isAbsent: sr.isAbsent,
          isPassed: sr.isPassed,
        };
      }
      return {
        roll: row.roll,
        studentId: row.studentId,
        studentName: locale === 'bn' ? row.nameBn || row.name : row.name,
        sectionName: row.section,
        groupName: null,
        subjectMarks,
        totalMarks: row.totalMarks,
        totalFullMarks: row.totalFullMarks,
        gpa: row.gpa ?? null,
        gpaWithoutOptional: row.gpaWithoutOptional ?? null,
        letterGrade: row.letterGrade ?? null,
        meritPosition: row.meritPosition ?? null,
        resultStatus: row.resultStatus,
      };
    });

    return { subjects, rows };
  }, [tabulationRes, filteredRows, locale]);

  const bulkMarksheetItems = useMemo(() => {
    if (!showBulkMarksheets) return [];
    return filteredRows
      .map((r) => buildRowMarksheetProps(r))
      .filter((item): item is PrintableMarksheetProps => item !== null);
  }, [showBulkMarksheets, filteredRows, buildRowMarksheetProps]);

  const activeSectionLabel = useMemo(() => {
    return sectionFilter !== 'ALL'
      ? `${pick('শাখা', 'Sec')}: ${sectionFilter}`
      : pick('সকল শাখা', 'All Sections');
  }, [sectionFilter, pick]);

  const handleExportCsv = () => {
    if (!activeExam || filteredRows.length === 0) return;
    const csvRows = filteredRows.map((r) => ({
      ClassMerit: r.meritPosition ?? '—',
      SectionMerit: r.sectionMeritPosition ?? '—',
      Roll: r.roll,
      StudentID: r.studentId,
      StudentName: r.name,
      StudentNameBn: r.nameBn ?? '',
      Section: r.section,
      TotalMarks: r.totalMarks,
      FullMarks: r.totalFullMarks,
      GPA: r.gpa !== null && r.gpa !== undefined ? r.gpa.toFixed(2) : '0.00',
      GPAWithout4th:
        r.gpaWithoutOptional !== null && r.gpaWithoutOptional !== undefined
          ? r.gpaWithoutOptional.toFixed(2)
          : '',
      Grade: r.letterGrade ?? 'F',
      FailedSubjects: r.failedSubjectCount,
      Status: r.resultStatus,
    }));
    exportToCsv(csvRows, `merit-list-${activeExam.id}.csv`);
    toast.success(pick('মেধাতালিকা CSV ডাউনলোড হয়েছে।', 'Merit list CSV exported.'));
  };

  if (loadingExams) return <LoadingSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('মেধাতালিকা, মার্কশিট ও ট্যাবুলেশন শিট', 'Merit List, Marksheets & Tabulation Sheet')}
        description={pick(
          'শ্রেণি ও শাখাভিত্তিক মেধাক্রম, বাল্ক একাডেমিক ট্রান্সক্রিপ্ট এবং ল্যান্ডস্কেপ A4 ট্যাবুলেশন শিট।',
          'Class & section merit rankings, bulk academic transcripts, and landscape A4 tabulation sheets.'
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
          <div className="sm:col-span-2 lg:col-span-3">
            <FormField label={pick('পরীক্ষা নির্বাচন করুন', 'Select Examination')}>
              <Select
                value={resolvedExamName}
                onChange={(e) => {
                  setSelectedExamName(e.target.value);
                  setSectionFilter('ALL');
                }}
              >
                {examNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <FormField label={pick('শ্রেণি', 'Class')}>
              <Select
                value={resolvedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSectionFilter('ALL');
                }}
              >
                {activeClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {locale === 'bn' ? cls.nameBn || cls.name : cls.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <FormField label={pick('শাখা', 'Section')}>
              <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                <option value="ALL">{pick('সকল শাখা', 'All Sections')}</option>
                {sectionOptions.map((secName) => (
                  <option key={secName} value={secName}>
                    {secName}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <FormField label={pick('ফলাফলের অবস্থা', 'Result Status')}>
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | 'PASS' | 'FAIL' | 'INCOMPLETE')
                }
              >
                <option value="ALL">{pick('সকল শিক্ষার্থী', 'All Students')}</option>
                <option value="PASS">{pick('শুধুমাত্র উত্তীর্ণ', 'Passed Only')}</option>
                <option value="FAIL">{pick('শুধুমাত্র অনুত্তীর্ণ', 'Failed Only')}</option>
                <option value="INCOMPLETE">{pick('অসম্পূর্ণ নম্বর', 'Incomplete')}</option>
              </Select>
            </FormField>
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
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
            <span className="text-sm font-semibold text-muted-foreground">
              ({formatNumber(stats.passRate, locale)}%)
            </span>
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
              : stats.total > 0 && stats.passed === stats.total
                ? pick('শতভাগ পাস অর্জিত', '100% pass achieved')
                : pick('কোনো অনুত্তীর্ণ নেই', 'No failed examinees')}
          </p>
        </Card>
      </div>

      {/* Main Merit List Table */}
      <Card className="overflow-hidden">
        {loadingTabulation || fetchingTabulation ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : !activeExam ? (
          <div className="p-6">
            <EmptyState
              title={pick('এই শ্রেণির কোনো পরীক্ষা পাওয়া যায়নি', 'No Exam Found for This Class')}
              description={pick(
                'অনুগ্রহ করে অন্য পরীক্ষা বা শ্রেণি নির্বাচন করুন।',
                'Please select another examination or class.'
              )}
            />
          </div>
        ) : sortedRows.length === 0 ? (
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
                'অনুগ্রহ করে শাখা, অবস্থা বা অনুসন্ধান শর্ত পরিবর্তন করে চেষ্টা করুন।',
                'Try adjusting your section, status, or search filter.'
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
                  const isPass = row.resultStatus === ResultStatus.PASS;
                  const isIncomplete = row.resultStatus === ResultStatus.INCOMPLETE;
                  const studentName = locale === 'bn' ? row.nameBn || row.name : row.name;
                  const pct =
                    row.totalFullMarks > 0
                      ? ((row.totalMarks / row.totalFullMarks) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <tr key={row.enrollmentId} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="px-4 py-3 text-center">
                        {row.meritPosition ? (
                          <span
                            className={`inline-flex items-center justify-center min-w-[2.2rem] px-2 py-0.5 rounded text-xs font-semibold ${
                              row.meritPosition <= 3
                                ? 'bg-warning/15 text-warning border border-warning/30'
                                : 'bg-surface-muted text-foreground'
                            }`}
                          >
                            #{formatNumber(row.meritPosition, locale)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-muted-foreground font-medium">
                        {row.sectionMeritPosition
                          ? `#${formatNumber(row.sectionMeritPosition, locale)}`
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-foreground">
                        {formatNumber(row.roll, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{studentName}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{row.studentId}</span>
                          <span>·</span>
                          <span>
                            {pick('শাখা', 'Sec')}: {row.section}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="font-medium text-foreground">
                          {formatNumber(row.totalMarks, locale)}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{formatNumber(row.totalFullMarks, locale)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(Number(pct), locale, 1)}%
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="font-semibold text-foreground">
                          {row.gpa !== null && row.gpa !== undefined
                            ? formatNumber(row.gpa, locale, 2)
                            : '—'}
                        </div>
                        {row.gpaWithoutOptional !== null &&
                          row.gpaWithoutOptional !== undefined &&
                          row.gpaWithoutOptional !== row.gpa && (
                            <div className="text-xs text-muted-foreground">
                              {pick('৪র্থ ছাড়া:', 'w/o 4th:')}{' '}
                              {formatNumber(row.gpaWithoutOptional, locale, 2)}
                            </div>
                          )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold border ${
                            isPass
                              ? row.letterGrade === 'A+'
                                ? 'bg-success/10 text-success border-success/25'
                                : 'bg-primary/10 text-primary border-primary/25'
                              : isIncomplete
                                ? 'bg-warning/10 text-warning border-warning/25'
                                : 'bg-destructive/10 text-destructive border-destructive/25'
                          }`}
                        >
                          {row.letterGrade ?? 'F'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge
                          value={row.resultStatus}
                          customTone={isPass ? 'success' : isIncomplete ? 'warning' : 'destructive'}
                          customLabel={
                            isPass
                              ? pick('উত্তীর্ণ', 'PASS')
                              : isIncomplete
                                ? pick('অসম্পূর্ণ', 'INCOMPLETE')
                                : pick(
                                    `অনুত্তীর্ণ (${formatNumber(row.failedSubjectCount, locale)})`,
                                    `FAIL (${row.failedSubjectCount})`
                                  )
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const props = buildRowMarksheetProps(row);
                            if (props) setPreviewMarksheet(props);
                          }}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {pick('মার্কশিট', 'Marksheet')}
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
        description={`${activeExam?.name ?? ''} · ${activeSectionLabel}`}
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
        description={`${activeExam?.name ?? ''} · ${locale === 'bn' ? activeClass?.nameBn : activeClass?.name} · ${activeSectionLabel}`}
        maxWidth="max-w-6xl"
      >
        {activeExam && tabulationRes && (
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
                school={schoolProfile}
                examName={tabulationRes.examination.name}
                className={
                  locale === 'bn'
                    ? activeClass?.nameBn || tabulationRes.examination.class
                    : tabulationRes.examination.class
                }
                sectionLabel={activeSectionLabel}
                academicYear={tabulationRes.examination.academicYear}
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
