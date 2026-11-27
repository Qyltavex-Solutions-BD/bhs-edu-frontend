'use client';

import React, { useMemo, useState } from 'react';
import { Printer, Users } from 'lucide-react';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import {
  useGetParentByIdQuery,
  useGetSchoolClassesQuery,
  type ParentChildItem,
} from '@/src/services/academic';
import {
  useGetExamsQuery,
  useGetStudentTranscriptQuery,
} from '@/src/features/examinations/api/examinations.api';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  PrintableMarksheet,
  type PrintableMarksheetProps,
} from '@/src/components/print/PrintDocuments';
import { Button, Card, Select } from '@/src/components/ui/primitives';
import { triggerPrint } from '@/src/lib/utils/cn';
import type { SchoolProfile } from '@/src/types/entities';
import { ResultPublicationStatus } from '@/src/types/enums';

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

function ChildSwitcherBar({
  childrenList,
  selectedStudentId,
  classNameMap,
  onChange,
}: {
  childrenList: ParentChildItem[];
  selectedStudentId: string;
  classNameMap: Map<string, string>;
  onChange: (id: string) => void;
}) {
  if (childrenList.length <= 1) return null;
  return (
    <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Users className="w-4 h-4 text-primary" />
        <span>{'সন্তান নির্বাচন করুন:'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {childrenList.map((c) => {
          const active = c.studentId === selectedStudentId;
          const clsLabel = c.currentClass
            ? classNameMap.get(c.currentClass) ?? c.currentClass
            : '';
          return (
            <button
              key={c.mappingId}
              type="button"
              onClick={() => onChange(c.studentId)}
              className={`px-3 py-1.5 rounded-[var(--radius)] text-sm font-semibold border transition-colors cursor-pointer ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-muted/50'
              }`}
            >
              {c.studentNameBn || c.studentNameEn}
              {clsLabel ? ` · ${clsLabel}` : ''}
              {c.currentSection ? ` (${c.currentSection})` : ''}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function ParentResultsPage() {
  const auth = useAppSelector((s) => s.auth);
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();
  const { data: allClasses = [] } = useGetSchoolClassesQuery();

  const parentId = meData?.parent?.id || auth.user?.parentId || '';

  const {
    data: parentDetail,
    isLoading: loadingParent,
  } = useGetParentByIdQuery(parentId, { skip: !parentId });

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');

  const schoolProfile: SchoolProfile = FALLBACK_SCHOOL_PROFILE;

  const classNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cls of allClasses) {
      map.set(cls.name, cls.nameBn || cls.name);
    }
    return map;
  }, [allClasses]);

  const children = parentDetail?.children ?? [];
  const activeChild = useMemo(() => {
    if (children.length === 0) return null;
    if (selectedStudentId) {
      const found = children.find((c) => c.studentId === selectedStudentId);
      if (found) return found;
    }
    return children[0] ?? null;
  }, [children, selectedStudentId]);

  const {
    data: examsData,
    isLoading: loadingExams,
  } = useGetExamsQuery(
    {
      classId: activeChild?.classId ?? undefined,
      resultStatus: ResultPublicationStatus.PUBLISHED,
      limit: 100,
    },
    { skip: !activeChild?.classId }
  );

  const publishedExams = useMemo(
    () =>
      (examsData?.items ?? []).filter(
        (e) => !e.isDeleted && e.resultStatus === ResultPublicationStatus.PUBLISHED
      ),
    [examsData]
  );

  const activeExam = useMemo(() => {
    if (publishedExams.length === 0) return null;
    if (selectedExamId) {
      const found = publishedExams.find((e) => e.id === selectedExamId);
      if (found) return found;
    }
    return publishedExams[0] ?? null;
  }, [publishedExams, selectedExamId]);

  const enrollmentId = activeChild?.enrollmentId ?? '';
  const examId = activeExam?.id ?? '';

  const {
    data: transcript,
    isLoading: loadingTranscript,
    isFetching: fetchingTranscript,
    isError: transcriptError,
  } = useGetStudentTranscriptQuery(
    { enrollmentId, examId },
    { skip: !enrollmentId || !examId }
  );

  const marksheetProps: PrintableMarksheetProps | null = useMemo(() => {
    if (!transcript || !activeExam) return null;
    const clsName = transcript.student.class;
    const clsNameBn = classNameMap.get(clsName) ?? clsName;

    return {
      school: schoolProfile,
      examName: transcript.examination.name || activeExam.name,
      student: {
        studentId: transcript.student.studentId,
        nameEn: transcript.student.name,
        nameBn: transcript.student.nameBn,
        roll: transcript.student.roll,
        className: clsName,
        classNameBn: clsNameBn,
        sectionName: transcript.student.section,
        academicYear: transcript.student.academicYear,
      },
      summary: {
        totalFullMarks: transcript.resultSummary.totalFullMarks,
        totalMarks: transcript.resultSummary.totalMarks,
        gpa: transcript.resultSummary.gpa,
        gpaWithoutOptional: transcript.resultSummary.gpaWithoutOptional,
        letterGrade: transcript.resultSummary.letterGrade,
        meritPosition: transcript.resultSummary.meritPosition,
        sectionMeritPosition: transcript.resultSummary.sectionMeritPosition,
        failedSubjectCount: transcript.resultSummary.failedSubjectCount,
        resultStatus: transcript.resultSummary.resultStatus,
        publishedAt: transcript.resultSummary.publishedAt,
      },
      subjects: transcript.subjects.map((s) => ({
        subjectCode: s.officialCode ?? '—',
        subjectName: s.subjectName,
        subjectNameBn: s.subjectName,
        fullMarks: s.fullMarks,
        writtenMarks: s.obtainedMarks,
        mcqMarks: 0,
        practicalMarks: 0,
        totalMarks: s.obtainedMarks,
        letterGrade: s.letterGrade,
        gradePoint: s.gradePoint,
        isPassed: s.isPassed,
        isOptional: s.isOptional,
        bonusGradePoint: s.bonusGradePoint,
        isAbsent: s.isAbsent,
      })),
    };
  }, [transcript, activeExam, classNameMap, schoolProfile]);

  if (loadingMe || (Boolean(parentId) && loadingParent)) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'প্রকাশিত ফলাফল ও মার্কশিট'}
        description={'শুধুমাত্র প্রকাশিত পরীক্ষার ফলাফল ও প্রিন্টযোগ্য একাডেমিক ট্রান্সক্রিপ্ট'}
        actions={
          marksheetProps ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => triggerPrint()}
              className="no-print"
            >
              <Printer className="w-4 h-4" />
              {'মার্কশিট প্রিন্ট করুন'}
            </Button>
          ) : undefined
        }
      />

      {!parentId ? (
        <EmptyState
          title={'অভিভাবক প্রোফাইল যুক্ত নেই'}
          description={'আপনার অ্যাকাউন্টের সাথে এখনো কোনো অভিভাবক প্রোফাইল লিংক করা হয়নি।'}
        />
      ) : !activeChild ? (
        <EmptyState
          title={'কোনো সন্তান লিংক করা নেই'}
          description={'আপনার অভিভাবক প্রোফাইলের সাথে কোনো শিক্ষার্থীর তথ্য যুক্ত করা হলে এখানে ফলাফল ও মার্কশিট দেখতে পাবেন।'}
        />
      ) : (
        <>
          <div className="no-print space-y-4">
            <ChildSwitcherBar
              childrenList={children}
              selectedStudentId={activeChild.studentId}
              classNameMap={classNameMap}
              onChange={(id) => {
                setSelectedStudentId(id);
                setSelectedExamId('');
              }}
            />

            {publishedExams.length > 0 && (
              <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
                <Select
                  value={activeExam?.id ?? ''}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="max-w-sm"
                >
                  {publishedExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </Select>
                {activeExam && (
                  <StatusBadge
                    enumName="ResultPublicationStatus"
                    value={activeExam.resultStatus}
                  />
                )}
              </Card>
            )}
          </div>

          {!activeChild.classId || !activeChild.enrollmentId ? (
            <EmptyState
              title={'চলমান ভর্তি তথ্য পাওয়া যায়নি'}
              description={'এই শিক্ষার্থীর চলমান শিক্ষাবর্ষের ভর্তি তথ্য এখনো সক্রিয় নেই।'}
            />
          ) : loadingExams || loadingTranscript || fetchingTranscript ? (
            <LoadingSkeleton />
          ) : !activeExam ? (
            <EmptyState
              title={'কোনো প্রকাশিত ফলাফল পাওয়া যায়নি'}
              description={'খসড়া বা স্থগিত ফলাফল এখানে প্রদর্শিত হয় না। বিদ্যালয় থেকে ফলাফল প্রকাশিত হলে এখানে দেখতে পাবেন।'}
            />
          ) : transcriptError || !marksheetProps ? (
            <EmptyState
              title={'এই পরীক্ষার ফলাফল পাওয়া যায়নি'}
              description={'নির্বাচিত পরীক্ষার জন্য এই শিক্ষার্থীর ফলাফল এখনো তৈরি বা প্রকাশিত হয়নি।'}
            />
          ) : (
            <PrintableMarksheet {...marksheetProps} />
          )}
        </>
      )}
    </div>
  );
}
