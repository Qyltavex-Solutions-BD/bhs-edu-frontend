'use client';

import React, { useMemo } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import {
  useGetMyTeacherAssignmentsQuery,
  useGetSchoolClassesQuery,
} from '@/src/services/academic';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { Card } from '@/src/components/ui/primitives';
import { formatDateLong, formatNumber } from '@/src/lib/formatters';

export function TeacherProfilePage() {
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();
  const { data: myAssignments = [], isLoading: loadingAssignments } =
    useGetMyTeacherAssignmentsQuery();
  const { data: allClasses = [], isLoading: loadingClasses } = useGetSchoolClassesQuery();

  const classMap = useMemo(() => {
    const map = new Map<string, (typeof allClasses)[number]>();
    for (const c of allClasses) map.set(c.id, c);
    return map;
  }, [allClasses]);

  const sortedAssignments = useMemo(() => {
    return myAssignments
      .filter((a) => a.isActive)
      .slice()
      .sort((a, b) => {
        const na = classMap.get(a.classId)?.numericValue ?? a.schoolClass?.numericValue ?? 99;
        const nb = classMap.get(b.classId)?.numericValue ?? b.schoolClass?.numericValue ?? 99;
        if (na !== nb) return na - nb;
        const sa = a.section?.name ?? '';
        const sb = b.section?.name ?? '';
        if (sa !== sb) return sa.localeCompare(sb);
        const subA = a.classSubject?.subject?.nameBn || a.classSubject?.subject?.name || '';
        const subB = b.classSubject?.subject?.nameBn || b.classSubject?.subject?.name || '';
        return subA.localeCompare(subB);
      });
  }, [myAssignments, classMap]);

  if (loadingMe || loadingAssignments || loadingClasses) {
    return <LoadingSkeleton />;
  }

  if (!meData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'আমার প্রোফাইল'}
          description={'শিক্ষক পরিচিতি ও নির্ধারিত বিষয়ের বিবরণ'}
        />
        <EmptyState
          title={'প্রোফাইল তথ্য পাওয়া যায়নি'}
          description={'অনুগ্রহ করে পুনরায় লগইন করুন।'}
        />
      </div>
    );
  }

  const staff = meData.staff;
  const fullName = staff?.name || meData.name || 'শিক্ষক';
  const designation = staff?.designation || 'শিক্ষক';
  const departmentName = staff?.department?.name || '—';
  const employeeId = staff?.employeeId || '—';
  const phone = staff?.phone || meData.phone || '—';
  const email = staff?.email || meData.email || '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আমার প্রোফাইল'}
        description={'শিক্ষক পরিচিতি ও নির্ধারিত বিষয়ের বিবরণ'}
      />

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-sm text-muted-foreground">{'পূর্ণ নাম'}</p>
            <p className="font-semibold mt-0.5">{fullName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'পদবি ও বিভাগ'}</p>
            <p className="font-medium mt-0.5">
              {designation} · {departmentName}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'কর্মচারী আইডি'}</p>
            <p className="font-mono mt-0.5">{employeeId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'যোগদানের তারিখ'}</p>
            <p className="tabular-nums mt-0.5">
              {staff?.joiningDate ? formatDateLong(staff.joiningDate, 'bn') : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'শিক্ষাগত যোগ্যতা'}</p>
            <p className="mt-0.5">{staff?.qualification || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'যোগাযোগ'}</p>
            <p className="tabular-nums mt-0.5">
              {phone} · {email}
            </p>
          </div>
        </div>
      </Card>

      <CommonProfilePanel
        roleLabel={`${designation}${departmentName !== '—' ? ` · ${departmentName}` : ''}`}
        extraMeta={`ID: ${employeeId}`}
      />

      <Card className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-semibold">
            {'নির্ধারিত বিষয় ও নম্বর এন্ট্রি অনুমতি'}
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary tabular-nums">
            {`মোট ${formatNumber(sortedAssignments.length, 'bn')}টি`}
          </span>
        </div>

        {sortedAssignments.length === 0 ? (
          <EmptyState
            title={'কোনো বিষয় নির্ধারিত নেই'}
            description={'অ্যাডমিন প্যানেল থেকে বিষয়-শিক্ষক বণ্টন করা হলে আপনার নির্ধারিত শ্রেণি, শাখা ও বিষয়সমূহ এখানে দেখতে পাবেন।'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                  <th className="py-3 px-4">{'শ্রেণি'}</th>
                  <th className="py-3 px-4">{'শাখা'}</th>
                  <th className="py-3 px-4">{'বিষয়'}</th>
                  <th className="py-3 px-4">{'নম্বর এন্ট্রি অনুমতি'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedAssignments.map((a) => {
                  const clsMeta = classMap.get(a.classId);
                  const clsName = clsMeta?.nameBn || a.schoolClass?.name || 'শ্রেণি';
                  const secName = a.section?.name ?? '—';
                  const subName =
                    a.classSubject?.subject?.nameBn || a.classSubject?.subject?.name || 'বিষয়';
                  return (
                    <tr key={a.id} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium">{clsName}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-muted font-semibold text-foreground text-xs">
                          {secName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{subName}</td>
                      <td className="py-3 px-4">
                        {a.canEnterMarks ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                            <CheckCircle2 className="w-4 h-4" />
                            {'অনুমোদিত'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                            <Lock className="w-4 h-4" />
                            {'শুধুমাত্র পাঠদান (নম্বর এন্ট্রি সীমিত)'}
                          </span>
                        )}
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
