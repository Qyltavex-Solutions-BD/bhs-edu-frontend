'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from '@/src/lib/navigation';
import { Search, Printer, ShieldAlert, Info, RotateCcw, Award } from 'lucide-react';
import { useGetBootstrapQuery } from '@/src/features/bootstrap';
import { useSearchPublicResultMutation } from '../api/public-results.api';
import { formatNumber } from '@/src/lib/formatters';
import { Button, Card, FormField, Input, Select } from '@/src/components/ui/primitives';
import { LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableMarksheet } from '@/src/components/print/PrintDocuments';
import { triggerPrint } from '@/src/lib/utils/cn';
import { ResultPublicationStatus } from '@/src/types/enums';

export function PublicResultSearchPage() {
  const { id: directResultId } = useParams();
  const [params] = useSearchParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [searchResult, { data: resData, isLoading: searching, reset: resetMutation }] =
    useSearchPublicResultMutation();
  const [examId, setExamId] = useState(params.get('examId') ?? 'exam-hy-10');
  const [classId, setClassId] = useState(params.get('classId') ?? 'cls-10');
  const [roll, setRoll] = useState('1');
  const [studentIdOrReg, setStudentIdOrReg] = useState('');

  if (isLoading || !db) return <div className="max-w-[1440px] mx-auto p-6"><LoadingSkeleton /></div>;

  const visibleExams = db.exams.filter((e) => !e.isDeleted);
  const publishedExams = visibleExams.filter(
    (e) => e.resultStatus === ResultPublicationStatus.PUBLISHED
  );

  // Support direct link `/results/:id` for already published summaries
  const directSummary = directResultId
    ? db.resultSummaries.find((r) => r.id === directResultId)
    : null;
  const directExam = directSummary ? db.exams.find((e) => e.id === directSummary.examId) : null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await searchResult({
      examId,
      classId,
      roll: roll.trim() || undefined,
      studentIdOrReg: studentIdOrReg.trim() || undefined,
    });
  };

  const handleReset = () => {
    setExamId('exam-hy-10');
    setClassId('cls-10');
    setRoll('');
    setStudentIdOrReg('');
    resetMutation();
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="no-print">
        <PageHeader
          title={'অনলাইন ফলাফল অনুসন্ধান'}
          description={'লগইন ছাড়াই প্রকাশিত পরীক্ষার ফলাফল ও প্রিন্টযোগ্য মার্কশিট যাচাই করুন। শিক্ষার্থীর ব্যক্তিগত তথ্য (ঠিকানা, জন্ম সনদ, অভিভাবকের ফোন) সর্বদা সুরক্ষিত রাখা হয়।'}
          actions={
            <Link href="/academics/examination">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                {'পরীক্ষার রুটিন ও গ্রেডিং'}
              </Button>
            </Link>
          }
        />
      </div>

      {/* Board-Style Search Form */}
      <Card className="p-6 no-print space-y-5">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <FormField label={'পরীক্ষা নির্বাচন করুন'} required>
            <Select
              value={examId}
              onChange={(e) => {
                setExamId(e.target.value);
                const ex = db.exams.find((x) => x.id === e.target.value);
                if (ex) setClassId(ex.classId);
              }}
            >
              {visibleExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={'শ্রেণি'} required>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={'রোল নম্বর'}>
            <Input
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder={'যেমন: 1, 2, 3'}
            />
          </FormField>

          <FormField label={'অথবা শিক্ষার্থী আইডি / রেজি. নং'}>
            <Input
              value={studentIdOrReg}
              onChange={(e) => setStudentIdOrReg(e.target.value)}
              placeholder="BHS-2026-1001"
            />
          </FormField>

          <div className="sm:col-span-2 lg:col-span-4 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                {publishedExams.length > 0
                  ? `বর্তমানে প্রকাশিত ফলাফল: ${publishedExams.map((e) => e.name).join(' ও ')}। রোল নম্বর বা শিক্ষার্থী আইডি দিয়ে অনুসন্ধান করুন।`
                  : 'রোল নম্বর অথবা শিক্ষার্থী আইডি প্রদান করে ফলাফল অনুসন্ধান করুন।'}
              </span>
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Button type="button" variant="outline" onClick={handleReset} className="whitespace-nowrap">
                <RotateCcw className="w-4 h-4" />
                {'রিসেট'}
              </Button>
              <Button type="submit" variant="primary" disabled={searching} className="whitespace-nowrap">
                <Search className="w-4 h-4" />
                {searching ? 'অনুসন্ধান চলছে...' : 'ফলাফল দেখুন'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Withheld / Not Published / Not Found States */}
      {resData && resData.status !== 'FOUND' && (
        <Card className="p-6 border-warning/40 bg-warning/5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-foreground">
              {resData.status === 'WITHHELD'
                ? 'ফলাফল স্থগিত (Withheld)'
                : resData.status === 'NOT_PUBLISHED'
                  ? 'ফলাফল এখনো প্রকাশিত হয়নি'
                  : 'কোনো ফলাফল পাওয়া যায়নি'}
            </h3>
            <p className="text-base text-muted-foreground mt-1">
              {resData.messageBn}
            </p>
          </div>
        </Card>
      )}

      {/* Found Published Result Card */}
      {resData?.status === 'FOUND' && resData.student && resData.summary && resData.subjects && (
        <div className="space-y-4">
          <Card className="p-4 no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-muted/40">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary shrink-0" />
                <span className="font-bold text-foreground text-base">
                  {resData.student.nameBn}
                </span>
              </div>
              <StatusBadge enumName="ResultStatus" value={resData.summary.resultStatus} />
              <span className="text-muted-foreground tabular-nums">
                {'জিপিএ:'}{' '}
                <strong className="text-foreground">
                  {formatNumber(resData.summary.gpa ?? 0, 'bn', 2)} ({resData.summary.letterGrade})
                </strong>
              </span>
              {resData.summary.meritPosition && (
                <span className="text-muted-foreground tabular-nums">
                  {'মেধাক্রম:'}{' '}
                  <strong className="text-primary">
                    {formatNumber(resData.summary.meritPosition, 'bn')}
                  </strong>
                </span>
              )}
            </div>
            <Button variant="primary" size="sm" onClick={triggerPrint} className="whitespace-nowrap shrink-0">
              <Printer className="w-4 h-4" />
              {'মার্কশিট প্রিন্ট / পিডিএফ'}
            </Button>
          </Card>

          <PrintableMarksheet
            school={db.schoolProfile}
            examName={resData.exam?.name ?? ''}
            student={resData.student}
            summary={resData.summary}
            subjects={resData.subjects}
          />
        </div>
      )}

      {/* Direct `/results/:id` Published Result */}
      {!resData && directSummary && directExam?.resultStatus === 'PUBLISHED' && (() => {
        const enr = db.enrollments.find((e) => e.id === directSummary.studentEnrollmentId);
        const stu = enr ? db.students.find((s) => s.id === enr.studentId) : null;
        const cls = enr ? db.classes.find((c) => c.id === enr.classId) : null;
        const sec = enr ? db.sections.find((s) => s.id === enr.sectionId) : null;
        if (!enr || !stu || !cls || !sec) return null;
        const subs = db.studentSubjectResults
          .filter((r) => r.examId === directExam.id && r.studentEnrollmentId === enr.id)
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
          <PrintableMarksheet
            school={db.schoolProfile}
            examName={directExam.name}
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
            summary={directSummary}
            subjects={subs}
          />
        );
      })()}
    </div>
  );
}
