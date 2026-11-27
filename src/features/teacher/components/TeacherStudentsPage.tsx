'use client';

import React, { useMemo, useState } from 'react';
import {
  Eye,
  GraduationCap,
  Layers,
  Phone,
  Search,
  Users,
} from 'lucide-react';
import {
  useGetMyTeacherAssignmentsQuery,
  useGetSchoolClassesQuery,
} from '@/src/services/academic';
import {
  useGetEnrollmentsQuery,
  useGetStudentByIdQuery,
} from '@/src/features/students/api/students.api';
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
} from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';
import { EnrollmentStatus } from '@/src/types/enums';
import { studentInitials } from '@/src/features/students/components/admin/studentShared';

type EnrichedEnrollmentStudent = {
  id: string;
  studentId: string;
  nameEn: string;
  nameBn?: string | null;
  gender?: string;
  status: string;
  parents?: Array<{
    isPrimary?: boolean;
    relationship?: string;
    parent?: {
      name?: string;
      nameBn?: string | null;
      phone?: string | null;
    };
  }>;
};

type TeacherStudentRow = {
  enrollmentId: string;
  studentUuid: string;
  classId: string;
  sectionId: string;
  roll: number;
  numericValue: number;
  className: string;
  sectionName: string;
  groupName: string | null;
  optionalSubjectName: string | null;
  studentId: string;
  nameEn: string;
  nameBn: string | null;
  status: string;
  guardianName: string | null;
  guardianPhone: string | null;
};

export function TeacherStudentsPage() {
  const { data: myAssignments = [], isLoading: loadingAssignments } =
    useGetMyTeacherAssignmentsQuery();
  const { data: allClasses = [], isLoading: loadingClasses } =
    useGetSchoolClassesQuery();
  const { data: enrollments = [], isLoading: loadingEnrollments } =
    useGetEnrollmentsQuery();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [selectedRow, setSelectedRow] = useState<TeacherStudentRow | null>(null);

  const { data: studentDetail, isFetching: loadingDetail } =
    useGetStudentByIdQuery(selectedRow?.studentUuid ?? '', {
      skip: !selectedRow?.studentUuid,
    });

  const activeAssignments = useMemo(
    () => myAssignments.filter((a) => a.isActive),
    [myAssignments]
  );

  const mySections = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        classId: string;
        className: string;
        numericValue: number;
      }
    >();
    for (const a of activeAssignments) {
      if (!map.has(a.sectionId)) {
        const cls = allClasses.find((c) => c.id === a.classId);
        map.set(a.sectionId, {
          id: a.sectionId,
          name: a.section?.name || '—',
          classId: a.classId,
          className: cls?.nameBn || a.schoolClass?.name || 'শ্রেণি',
          numericValue: cls?.numericValue ?? a.schoolClass?.numericValue ?? 99,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => a.numericValue - b.numericValue || a.name.localeCompare(b.name)
    );
  }, [activeAssignments, allClasses]);

  const classOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; numericValue: number }>();
    for (const s of mySections) {
      if (!map.has(s.classId)) {
        map.set(s.classId, {
          id: s.classId,
          name: s.className,
          numericValue: s.numericValue,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.numericValue - b.numericValue);
  }, [mySections]);

  const sectionOptions = useMemo(() => {
    const names = new Set<string>();
    for (const s of mySections) {
      if (classFilter === 'ALL' || s.classId === classFilter) {
        names.add(s.name);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [mySections, classFilter]);

  const mySectionIds = useMemo(
    () => new Set(mySections.map((s) => s.id)),
    [mySections]
  );

  const myRows = useMemo<TeacherStudentRow[]>(() => {
    return enrollments
      .filter(
        (e) =>
          e.status === EnrollmentStatus.ACTIVE && mySectionIds.has(e.sectionId)
      )
      .map((e) => {
        const ext = e as typeof e & {
          student?: EnrichedEnrollmentStudent;
          schoolClass?: { name?: string; nameBn?: string | null; numericValue?: number };
          section?: { name?: string };
          group?: { name?: string; nameBn?: string | null } | null;
          optionalClassSubject?: {
            subject?: { name?: string; nameBn?: string | null } | null;
          } | null;
        };
        const stu = ext.student;
        const secMeta = mySections.find((s) => s.id === e.sectionId);
        const primaryLink =
          stu?.parents?.find((p) => p.isPrimary) ?? stu?.parents?.[0];
        return {
          enrollmentId: e.id,
          studentUuid: stu?.id ?? e.studentId,
          classId: e.classId,
          sectionId: e.sectionId,
          roll: e.roll,
          numericValue:
            ext.schoolClass?.numericValue ?? secMeta?.numericValue ?? 99,
          className:
            ext.schoolClass?.nameBn ||
            ext.schoolClass?.name ||
            secMeta?.className ||
            'শ্রেণি',
          sectionName: ext.section?.name || secMeta?.name || '—',
          groupName: ext.group ? ext.group.nameBn || ext.group.name || null : null,
          optionalSubjectName: ext.optionalClassSubject?.subject
            ? ext.optionalClassSubject.subject.nameBn ||
              ext.optionalClassSubject.subject.name ||
              null
            : null,
          studentId: stu?.studentId ?? '—',
          nameEn: stu?.nameEn ?? '—',
          nameBn: stu?.nameBn ?? null,
          status: stu?.status ?? 'ACTIVE',
          guardianName:
            primaryLink?.parent?.nameBn || primaryLink?.parent?.name || null,
          guardianPhone: primaryLink?.parent?.phone || null,
        };
      })
      .sort(
        (a, b) =>
          a.numericValue - b.numericValue ||
          a.sectionName.localeCompare(b.sectionName) ||
          a.roll - b.roll
      );
  }, [enrollments, mySectionIds, mySections]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return myRows.filter((r) => {
      if (classFilter !== 'ALL' && r.classId !== classFilter) return false;
      if (sectionFilter !== 'ALL' && r.sectionName !== sectionFilter) return false;
      if (q) {
        const hay = `${r.nameEn} ${r.nameBn ?? ''} ${r.studentId} ${r.roll}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [myRows, classFilter, sectionFilter, search]);

  const guardianConnectedCount = useMemo(
    () => myRows.filter((r) => !!r.guardianPhone || !!r.guardianName).length,
    [myRows]
  );

  if (loadingAssignments || loadingClasses || loadingEnrollments) {
    return <LoadingSkeleton rows={6} />;
  }

  const detailStu = studentDetail as
    | (typeof studentDetail & {
        fatherName?: string | null;
        motherName?: string | null;
        bloodGroup?: string | null;
        dateOfBirth?: string | null;
        gender?: string | null;
        presentAddress?: string | null;
      })
    | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আমার নির্ধারিত শিক্ষার্থী'}
        description={'শুধুমাত্র আপনার পাঠদানকৃত শাখাসমূহের সক্রিয় শিক্ষার্থীদের তালিকা'}
      />

      {/* 3-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {'মোট নির্ধারিত শিক্ষার্থী'}
            </p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(myRows.length, 'bn')}{' '}
              <span className="text-sm font-semibold text-muted-foreground">{'জন'}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {'নির্ধারিত শাখা'}
            </p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(mySections.length, 'bn')}{' '}
              <span className="text-sm font-semibold text-muted-foreground">{'টি'}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {'অভিভাবক তথ্য যুক্ত'}
            </p>
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(guardianConnectedCount, 'bn')}{' '}
              <span className="text-sm font-semibold text-muted-foreground">{'জন'}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter Card */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-2 lg:col-span-5">
            <FormField label={'শিক্ষার্থী খুঁজুন (নাম বা রোল)'}>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="teacher-students-search"
                  name="search"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={'শিক্ষার্থীর নাম বা রোল লিখুন...'}
                />
              </div>
            </FormField>
          </div>

          <div className="sm:col-span-1 lg:col-span-4">
            <FormField label={'শ্রেণি'}>
              <Select
                id="teacher-students-class"
                name="classId"
                aria-label="শ্রেণি"
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

          <div className="sm:col-span-1 lg:col-span-3">
            <FormField label={'শাখা'}>
              <Select
                id="teacher-students-section"
                name="sectionName"
                aria-label="শাখা"
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
        </div>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden">
        {myRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={'কোনো শিক্ষার্থী পাওয়া যায়নি'}
              description={'আপনার নির্ধারিত শাখাসমূহে এখনো কোনো সক্রিয় শিক্ষার্থী ভর্তি নেই।'}
            />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={'ফিল্টারের সাথে কোনো শিক্ষার্থী মেলেনি'}
              description={'অনুগ্রহ করে শ্রেণি, শাখা বা অনুসন্ধান শব্দ পরিবর্তন করে চেষ্টা করুন।'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-base">
              <thead className="bg-surface-muted/70 text-sm text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-center w-20">{'রোল'}</th>
                  <th className="px-4 py-3 text-left">{'শিক্ষার্থীর নাম'}</th>
                  <th className="px-4 py-3 text-left">{'শ্রেণি ও শাখা'}</th>
                  <th className="px-4 py-3 text-left">{'অভিভাবক ও ফোন'}</th>
                  <th className="px-4 py-3 text-center">{'অবস্থা'}</th>
                  <th className="px-4 py-3 text-right">{'কার্যক্রম'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {filteredRows.map((row) => {
                  const displayName = row.nameBn || row.nameEn;
                  return (
                    <tr
                      key={row.enrollmentId}
                      className="hover:bg-surface-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2.2rem] px-2 py-0.5 rounded-md bg-surface-muted font-bold text-sm text-foreground">
                          {formatNumber(row.roll, 'bn')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {studentInitials(row.nameEn)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{displayName}</p>
                            {row.groupName && (
                              <span className="inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {row.groupName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {`${row.className} (${row.sectionName})`}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium text-foreground">
                          {row.guardianName || '—'}
                        </p>
                        {row.guardianPhone ? (
                          <a
                            href={`tel:${row.guardianPhone}`}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            {row.guardianPhone}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge enumName="StudentStatus" value={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRow(row)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {'বিস্তারিত'}
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

      {/* Read-only Student Profile Modal */}
      <Modal
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        title={'শিক্ষার্থীর বিস্তারিত তথ্য'}
        description={
          selectedRow
            ? `${selectedRow.nameBn || selectedRow.nameEn} · ${selectedRow.studentId}`
            : undefined
        }
        maxWidth="max-w-lg"
      >
        {selectedRow && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-surface-muted/50 border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center shrink-0">
                {studentInitials(selectedRow.nameEn)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-foreground truncate">
                  {selectedRow.nameBn || selectedRow.nameEn}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {`${selectedRow.className} (শাখা ${selectedRow.sectionName}) · রোল ${formatNumber(
                    selectedRow.roll,
                    'bn'
                  )}`}
                </p>
              </div>
              <StatusBadge enumName="StudentStatus" value={selectedRow.status} />
            </div>

            {loadingDetail ? (
              <LoadingSkeleton rows={4} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">{'অভিভাবকের নাম'}</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedRow.guardianName || '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">{'অভিভাবকের ফোন'}</p>
                  {selectedRow.guardianPhone ? (
                    <a
                      href={`tel:${selectedRow.guardianPhone}`}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {selectedRow.guardianPhone}
                    </a>
                  ) : (
                    <p className="font-semibold text-foreground mt-0.5">—</p>
                  )}
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">{'বিভাগ ও ৪র্থ বিষয়'}</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedRow.groupName || 'সাধারণ'}
                    {selectedRow.optionalSubjectName
                      ? ` · ${selectedRow.optionalSubjectName}`
                      : ''}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">{'রক্তের গ্রুপ ও লিঙ্গ'}</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {detailStu?.bloodGroup || '—'} ·{' '}
                    {detailStu?.gender
                      ? ENUM_LABELS.Gender?.[
                          detailStu.gender as keyof typeof ENUM_LABELS.Gender
                        ]?.bn ?? detailStu.gender
                      : '—'}
                  </p>
                </div>
                {detailStu?.dateOfBirth && (
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">{'জন্ম তারিখ'}</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatDateShort(detailStu.dateOfBirth, 'bn')}
                    </p>
                  </div>
                )}
                {detailStu?.presentAddress && (
                  <div className="p-3 rounded-lg border border-border sm:col-span-2">
                    <p className="text-xs text-muted-foreground">{'বর্তমান ঠিকানা'}</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {detailStu.presentAddress}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setSelectedRow(null)}>
                {'বন্ধ করুন'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
