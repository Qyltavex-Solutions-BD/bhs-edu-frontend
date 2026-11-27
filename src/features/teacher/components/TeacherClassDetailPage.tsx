'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import {
  useGetSchoolClassesQuery,
  useGetSectionByIdQuery,
} from '@/src/services/academic';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import {
  useGetExamsQuery,
  useGetTabulationSheetQuery,
} from '@/src/features/examinations/api/examinations.api';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { Button, Card } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';
import { EnrollmentStatus, ResultPublicationStatus } from '@/src/types/enums';

export function TeacherClassDetailPage() {
  const params = useParams();
  const sectionId = typeof params?.id === 'string' ? params.id : '';

  const { data: section, isLoading: loadingSection } = useGetSectionByIdQuery(
    sectionId,
    { skip: !sectionId }
  );
  const { data: allClasses = [] } = useGetSchoolClassesQuery();
  const { data: enrollments = [], isLoading: loadingEnrollments } =
    useGetEnrollmentsQuery();

  const { data: publishedExamsRes } = useGetExamsQuery(
    {
      classId: section?.classId,
      resultStatus: ResultPublicationStatus.PUBLISHED,
      limit: 10,
      isDeleted: false,
    },
    { skip: !section?.classId }
  );

  const publishedExam = publishedExamsRes?.items?.[0] ?? null;

  const { data: tabulationRes } = useGetTabulationSheetQuery(
    { examId: publishedExam?.id ?? '', sectionId },
    { skip: !publishedExam?.id || !sectionId }
  );

  const sectionEnrollments = useMemo(
    () =>
      enrollments
        .filter(
          (e) =>
            e.sectionId === sectionId && e.status === EnrollmentStatus.ACTIVE
        )
        .sort((a, b) => a.roll - b.roll),
    [enrollments, sectionId]
  );

  const tabulationByEnrollment = useMemo(() => {
    const map = new Map<string, { gpa: number | null; meritPosition: number | null }>();
    for (const row of tabulationRes?.tabulation ?? []) {
      map.set(row.enrollmentId, {
        gpa: row.gpa ?? null,
        meritPosition: row.meritPosition ?? null,
      });
    }
    return map;
  }, [tabulationRes?.tabulation]);

  if (loadingSection || loadingEnrollments) {
    return <LoadingSkeleton rows={6} />;
  }

  if (!section) {
    return (
      <div className="space-y-4">
        <EmptyState
          title={'শাখা পাওয়া যায়নি'}
          action={
            <Link href="/teacher/classes">
              <Button variant="outline" size="sm">
                {'সব শ্রেণিতে ফিরে যান'}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const cls = allClasses.find((c) => c.id === section.classId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${cls?.nameBn || cls?.name || 'শ্রেণি'} — ${'শাখা'} ${section.name}`}
        description={'সক্রিয় শিক্ষার্থী তালিকা ও প্রকাশিত পরীক্ষার মেধাক্রম'}
        actions={
          <Link href="/teacher/classes">
            <Button variant="outline" size="sm">
              {'সব শ্রেণি'}
            </Button>
          </Link>
        }
      />

      <Card className="overflow-hidden">
        {sectionEnrollments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={'এই শাখায় কোনো সক্রিয় শিক্ষার্থী নেই'}
              description={'বর্তমান শিক্ষাবর্ষে এই শাখায় এখনো কোনো শিক্ষার্থী ভর্তি হয়নি।'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left">{'রোল'}</th>
                  <th className="px-4 py-3 text-left">{'শিক্ষার্থী'}</th>
                  <th className="px-4 py-3 text-left">{'অভিভাবক ও ফোন'}</th>
                  <th className="px-4 py-3 text-right">{'সর্বশেষ জিপিএ'}</th>
                  <th className="px-4 py-3 text-right">{'মেধা স্থান'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {sectionEnrollments.map((enr) => {
                  const stu = (
                    enr as typeof enr & {
                      student?: {
                        studentId?: string;
                        nameEn?: string;
                        nameBn?: string | null;
                        parents?: Array<{
                          isPrimary?: boolean;
                          parent?: {
                            name?: string;
                            nameBn?: string | null;
                            phone?: string | null;
                          };
                        }>;
                      };
                    }
                  ).student;
                  const primaryLink =
                    stu?.parents?.find((p) => p.isPrimary) ?? stu?.parents?.[0];
                  const guardian = primaryLink?.parent;
                  const result = tabulationByEnrollment.get(enr.id);
                  return (
                    <tr key={enr.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="px-4 py-3 font-semibold">
                        {formatNumber(enr.roll, 'bn')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {stu?.nameBn || stu?.nameEn || '—'}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {stu?.studentId ?? '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">
                          {guardian?.nameBn || guardian?.name || '—'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {guardian?.phone || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">
                        {result?.gpa !== null && result?.gpa !== undefined
                          ? formatNumber(result.gpa, 'bn', 2)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {result?.meritPosition
                          ? `#${formatNumber(result.meritPosition, 'bn')}`
                          : '—'}
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
  );
}
