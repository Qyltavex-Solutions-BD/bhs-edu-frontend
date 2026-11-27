'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  ClipboardCheck,
  FileEdit,
  Layers,
  Users,
} from 'lucide-react';
import {
  useGetClassTeachersQuery,
  useGetMyTeacherAssignmentsQuery,
  useGetSchoolClassesQuery,
} from '@/src/services/academic';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Select } from '@/src/components/ui/primitives';
import { formatNumber, getSubjectCode } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
import { EnrollmentStatus } from '@/src/types/enums';

export function TeacherClassesPage() {
  const auth = useAppSelector((s) => s.auth);
  const { data: myAssignments = [], isLoading: loadingAssignments } =
    useGetMyTeacherAssignmentsQuery();
  const { data: allClasses = [], isLoading: loadingClasses } =
    useGetSchoolClassesQuery();
  const { data: classTeachers = [] } = useGetClassTeachersQuery();
  const { data: enrollments = [] } = useGetEnrollmentsQuery();

  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [onlyClassTeacher, setOnlyClassTeacher] = useState(false);

  const activeAssignments = useMemo(
    () => myAssignments.filter((a) => a.isActive),
    [myAssignments]
  );

  const teacherStaffId = auth.user?.staffId || activeAssignments[0]?.staffId || '';

  const sectionGroups = useMemo(() => {
    const grouped = new Map<
      string,
      {
        sectionId: string;
        classId: string;
        className: string;
        shortBadge: string;
        numericValue: number;
        sectionName: string;
        assignments: typeof activeAssignments;
      }
    >();

    for (const a of activeAssignments) {
      const cls = allClasses.find((c) => c.id === a.classId);
      const className = cls?.nameBn || a.schoolClass?.name || 'শ্রেণি';
      const numericValue = cls?.numericValue ?? a.schoolClass?.numericValue ?? 99;
      const shortBadge =
        className.split(' ')[0] || formatNumber(numericValue, 'bn');

      const existing = grouped.get(a.sectionId);
      if (existing) {
        existing.assignments.push(a);
      } else {
        grouped.set(a.sectionId, {
          sectionId: a.sectionId,
          classId: a.classId,
          className,
          shortBadge,
          numericValue,
          sectionName: a.section?.name || '—',
          assignments: [a],
        });
      }
    }

    return Array.from(grouped.values())
      .map((group) => {
        const studentCount = enrollments.filter(
          (e) =>
            e.sectionId === group.sectionId &&
            e.status === EnrollmentStatus.ACTIVE
        ).length;
        const isClassTeacher = classTeachers.some(
          (ct) =>
            ct.sectionId === group.sectionId &&
            (!teacherStaffId || ct.staffId === teacherStaffId)
        );
        const canEnterAnyMarks = group.assignments.some((a) => a.canEnterMarks);
        return {
          ...group,
          studentCount,
          isClassTeacher,
          canEnterAnyMarks,
        };
      })
      .sort(
        (a, b) =>
          a.numericValue - b.numericValue ||
          a.sectionName.localeCompare(b.sectionName)
      );
  }, [activeAssignments, allClasses, enrollments, classTeachers, teacherStaffId]);

  const classOptions = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; numericValue: number }>();
    for (const g of sectionGroups) {
      if (!seen.has(g.classId)) {
        seen.set(g.classId, {
          id: g.classId,
          name: g.className,
          numericValue: g.numericValue,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.numericValue - b.numericValue);
  }, [sectionGroups]);

  const sectionOptions = useMemo(() => {
    const names = new Set<string>();
    for (const g of sectionGroups) {
      if (classFilter === 'ALL' || g.classId === classFilter) {
        names.add(g.sectionName);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [sectionGroups, classFilter]);

  const filteredGroups = useMemo(() => {
    return sectionGroups.filter((g) => {
      if (classFilter !== 'ALL' && g.classId !== classFilter) return false;
      if (sectionFilter !== 'ALL' && g.sectionName !== sectionFilter) return false;
      if (onlyClassTeacher && !g.isClassTeacher) return false;
      return true;
    });
  }, [sectionGroups, classFilter, sectionFilter, onlyClassTeacher]);

  const stats = useMemo(() => {
    const totalSections = sectionGroups.length;
    const totalStudents = sectionGroups.reduce((s, g) => s + g.studentCount, 0);
    const classTeacherCount = sectionGroups.filter((g) => g.isClassTeacher).length;
    const totalSubjects = activeAssignments.length;
    const marksEntryCount = activeAssignments.filter((a) => a.canEnterMarks).length;
    return {
      totalSections,
      totalStudents,
      classTeacherCount,
      totalSubjects,
      marksEntryCount,
    };
  }, [sectionGroups, activeAssignments]);

  if (loadingAssignments || loadingClasses) {
    return <LoadingSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আমার নির্ধারিত শ্রেণিসমূহ'}
        description={'আপনার নির্ধারিত শ্রেণি, শাখা, শ্রেণি শিক্ষক দায়িত্ব ও পাঠদানকৃত বিষয়সমূহের সারসংক্ষেপ'}
      />

      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {'মোট নির্ধারিত শাখা'}
            </p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(stats.totalSections, 'bn')}{' '}
              <span className="text-sm font-semibold text-muted-foreground">{'টি'}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {`${formatNumber(classOptions.length, 'bn')}টি শ্রেণিতে`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {'মোট শিক্ষার্থী'}
            </p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(stats.totalStudents, 'bn')}{' '}
              <span className="text-sm font-semibold text-muted-foreground">{'জন'}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {'সক্রিয় ভর্তি তালিকা অনুযায়ী'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {'শ্রেণি শিক্ষক দায়িত্ব'}
            </p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(stats.classTeacherCount, 'bn')}{' '}
              <span className="text-sm font-semibold text-muted-foreground">{'টি শাখা'}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.classTeacherCount > 0
                ? 'দায়িত্বপ্রাপ্ত শাখা'
                : 'কোনো শাখায় দায়িত্ব নেই'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {'নির্ধারিত বিষয়'}
            </p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(stats.totalSubjects, 'bn')}{' '}
              <span className="text-sm font-semibold text-muted-foreground">{'টি'}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {`${formatNumber(stats.marksEntryCount, 'bn')}টিতে নম্বর এন্ট্রি সক্রিয়`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      {sectionGroups.length > 0 && (
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-1 lg:col-span-4">
              <FormField label={'শ্রেণি ফিল্টার'}>
                <Select
                  id="teacher-classes-filter"
                  name="classId"
                  aria-label="শ্রেণি ফিল্টার"
                  value={classFilter}
                  onChange={(e) => {
                    setClassFilter(e.target.value);
                    setSectionFilter('ALL');
                  }}
                >
                  <option value="ALL">{'সকল শ্রেণি'}</option>
                  {classOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="sm:col-span-1 lg:col-span-4">
              <FormField label={'শাখা ফিল্টার'}>
                <Select
                  id="teacher-classes-section-filter"
                  name="sectionName"
                  aria-label="শাখা ফিল্টার"
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                >
                  <option value="ALL">{'সকল শাখা'}</option>
                  {sectionOptions.map((secName) => (
                    <option key={secName} value={secName}>
                      {`শাখা ${secName}`}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setOnlyClassTeacher((prev) => !prev)}
                className={cn(
                  'w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors cursor-pointer',
                  onlyClassTeacher
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-surface text-foreground border-border hover:bg-surface-muted/60'
                )}
              >
                <Award className="w-4 h-4" />
                {'শুধু শ্রেণি শিক্ষক'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Class/Section Cards */}
      {sectionGroups.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title={'কোনো নির্ধারিত শ্রেণি পাওয়া যায়নি'}
            description={
              'প্রশাসন থেকে আপনার নামে শ্রেণি ও বিষয় নির্ধারণ করা হলে এখানে দেখতে পাবেন।'
            }
          />
        </Card>
      ) : filteredGroups.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title={'ফিল্টারের সাথে কোনো শ্রেণি মেলেনি'}
            description={'অনুগ্রহ করে শ্রেণি ফিল্টার বা অনুসন্ধান শব্দ পরিবর্তন করুন।'}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <Card
              key={group.sectionId}
              className="p-5 flex flex-col justify-between gap-4 hover:border-primary/40 transition-colors"
            >
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-extrabold text-sm shrink-0">
                      {group.shortBadge}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate">
                        {group.className} — {'শাখা'} {group.sectionName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5 tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {formatNumber(group.studentCount, 'bn')} {'জন শিক্ষার্থী'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {group.isClassTeacher && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning bg-warning/10 border border-warning/30 px-2.5 py-1 rounded-full shrink-0">
                      <Award className="w-3 h-3" />
                      {'শ্রেণি শিক্ষক'}
                    </span>
                  )}
                </div>

                {/* Assigned Subjects Box */}
                <div className="rounded-lg bg-surface-muted/40 border border-border/70 p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {'নির্ধারিত বিষয়সমূহ'}
                  </p>
                  <div className="space-y-2">
                    {group.assignments.map((a) => {
                      const sub = a.classSubject?.subject;
                      const subjectCode = getSubjectCode(
                        sub?.officialCode,
                        group.numericValue
                      );
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {subjectCode && (
                              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface border border-border text-muted-foreground shrink-0">
                                {subjectCode}
                              </span>
                            )}
                            <span className="font-medium text-foreground truncate">
                              {sub?.nameBn || sub?.name || 'বিষয়'}
                            </span>
                          </div>
                          <span
                            className={cn(
                              'text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0',
                              a.canEnterMarks
                                ? 'bg-success/10 text-success border-success/25'
                                : 'bg-surface text-muted-foreground border-border'
                            )}
                          >
                            {a.canEnterMarks ? 'নম্বর এন্ট্রি সক্রিয়' : 'শুধু দেখুন'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Link
                  href={`/teacher/classes/${group.sectionId}`}
                  className="flex-1"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    {'শাখা বিস্তারিত'}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href="/teacher/attendance">
                  <Button variant="outline" size="sm" title="হাজিরা গ্রহণ">
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    {'হাজিরা'}
                  </Button>
                </Link>
                {group.canEnterAnyMarks && (
                  <Link href="/teacher/marks-entry">
                    <Button variant="outline" size="sm" title="নম্বর এন্ট্রি">
                      <FileEdit className="w-3.5 h-3.5" />
                      {'নম্বর'}
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
