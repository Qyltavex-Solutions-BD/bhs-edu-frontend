'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Save, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAuthProfileQuery } from '@/src/features/auth/api/auth.api';
import {
  useGetClassTeachersQuery,
  useGetCurrentAcademicYearQuery,
  useGetMyTeacherAssignmentsQuery,
  useGetSchoolClassesQuery,
} from '@/src/services/academic';
import {
  useGetAttendanceConfigsQuery,
  useGetDailyAttendanceQuery,
  useSaveAttendanceBatchMutation,
} from '@/src/features/attendance/api/attendance.api';
import { useAppSelector } from '@/src/store/hooks';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Input, Select } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';
import { ENUM_LABELS } from '@/src/lib/constants/enums';
import { AttendanceMethod, AttendanceStatus } from '@/src/types/enums';

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function TeacherAttendancePage() {
  const auth = useAppSelector((s) => s.auth);
  const { data: meData, isLoading: loadingMe } = useGetAuthProfileQuery();
  const { data: currentYear, isLoading: loadingYear } = useGetCurrentAcademicYearQuery();
  const { data: myAssignments = [], isLoading: loadingAssignments } =
    useGetMyTeacherAssignmentsQuery();
  const { data: allClasses = [], isLoading: loadingClasses } = useGetSchoolClassesQuery();
  const { data: classTeachers = [] } = useGetClassTeachersQuery();
  const [saveBatch, { isLoading: saving }] = useSaveAttendanceBatchMutation();

  const staffId = meData?.staff?.id || auth.user?.staffId || myAssignments[0]?.staffId || '';
  const academicYearId = currentYear?.id ?? '';

  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [date, setDate] = useState<string>(getTodayDateString);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AttendanceStatus>>({});

  const classMap = useMemo(() => {
    const map = new Map<string, (typeof allClasses)[number]>();
    for (const c of allClasses) map.set(c.id, c);
    return map;
  }, [allClasses]);

  const mySections = useMemo(() => {
    const map = new Map<
      string,
      { sectionId: string; sectionName: string; classId: string; className: string; numericValue: number }
    >();

    for (const a of myAssignments) {
      if (!a.isActive || !a.sectionId) continue;
      if (!map.has(a.sectionId)) {
        const clsMeta = classMap.get(a.classId);
        map.set(a.sectionId, {
          sectionId: a.sectionId,
          sectionName: a.section?.name ?? '—',
          classId: a.classId,
          className: clsMeta?.nameBn || a.schoolClass?.name || 'শ্রেণি',
          numericValue: clsMeta?.numericValue ?? a.schoolClass?.numericValue ?? 99,
        });
      }
    }

    for (const ct of classTeachers) {
      if (ct.staffId !== staffId) continue;
      const secId = ct.section?.id ?? ct.sectionId;
      if (!secId || map.has(secId)) continue;
      const clsId = ct.section?.classId ?? '';
      const clsMeta = classMap.get(clsId);
      map.set(secId, {
        sectionId: secId,
        sectionName: ct.section?.name ?? '—',
        classId: clsId,
        className: clsMeta?.nameBn || ct.section?.schoolClass?.name || 'শ্রেণি',
        numericValue: clsMeta?.numericValue ?? ct.section?.schoolClass?.numericValue ?? 99,
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.numericValue !== b.numericValue) return a.numericValue - b.numericValue;
      return a.sectionName.localeCompare(b.sectionName);
    });
  }, [myAssignments, classTeachers, staffId, classMap]);

  const activeSection = useMemo(() => {
    if (mySections.length === 0) return null;
    if (selectedSectionId) {
      const found = mySections.find((s) => s.sectionId === selectedSectionId);
      if (found) return found;
    }
    return mySections[0] ?? null;
  }, [mySections, selectedSectionId]);

  const activeSectionId = activeSection?.sectionId ?? '';
  const activeClassId = activeSection?.classId ?? '';

  const { data: configsData } = useGetAttendanceConfigsQuery(
    { academicYearId },
    { skip: !academicYearId }
  );

  const {
    data: dailyData,
    isLoading: loadingDaily,
    isFetching: fetchingDaily,
  } = useGetDailyAttendanceQuery(
    {
      academicYearId,
      date,
      classId: activeClassId || undefined,
      sectionId: activeSectionId || undefined,
      limit: 100,
    },
    { skip: !academicYearId || !activeSectionId || !date }
  );

  const isRfidPrimary = useMemo(() => {
    const cfg = configsData?.items?.find((c) => c.classId === activeClassId);
    return cfg?.method === AttendanceMethod.RFID;
  }, [configsData, activeClassId]);

  const students = useMemo(
    () => [...(dailyData?.items ?? [])].sort((a, b) => a.roll - b.roll),
    [dailyData]
  );

  const getStatus = (item: (typeof students)[number]): AttendanceStatus => {
    if (draftStatuses[item.studentEnrollmentId]) {
      return draftStatuses[item.studentEnrollmentId];
    }
    return item.attendance?.status ?? AttendanceStatus.PRESENT;
  };

  const liveCounts = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    for (const s of students) {
      const st = getStatus(s);
      if (st === AttendanceStatus.PRESENT) present += 1;
      else if (st === AttendanceStatus.LATE) late += 1;
      else if (st === AttendanceStatus.ABSENT) absent += 1;
    }
    return { total: students.length, present, late, absent };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, draftStatuses]);

  const handleSave = async () => {
    if (!academicYearId || students.length === 0) return;
    try {
      const res = await saveBatch({
        date,
        academicYearId,
        entries: students.map((s) => ({
          studentEnrollmentId: s.studentEnrollmentId,
          status: getStatus(s),
          method: isRfidPrimary ? AttendanceMethod.RFID : AttendanceMethod.MANUAL,
        })),
      }).unwrap();
      setDraftStatuses({});
      toast.success(
        `${formatNumber(res.saved, 'bn')} জন শিক্ষার্থীর হাজিরা সংরক্ষিত হয়েছে। অনুপস্থিত SMS কিউ: ${formatNumber(res.smsQueued, 'bn')}`
      );
    } catch (err: any) {
      const msg = err?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'হাজিরা সংরক্ষণ করা যায়নি');
    }
  };

  if (loadingMe || loadingYear || loadingAssignments || loadingClasses) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'দৈনিক হাজিরা গ্রহণ'}
        description={'নির্ধারিত শাখার হাজিরা নথিভুক্ত করুন; অনুপস্থিতিতে অভিভাবকের কাছে স্বয়ংক্রিয় SMS কিউ হবে'}
      />

      {mySections.length === 0 ? (
        <EmptyState
          title={'কোনো শাখা নির্ধারিত নেই'}
          description={'আপনাকে এখনো কোনো শ্রেণি বা শাখায় দায়িত্ব দেওয়া হয়নি।'}
        />
      ) : (
        <>
          <Card className="p-4 flex flex-wrap items-end gap-4">
            <div className="w-64">
              <FormField label={'শাখা নির্বাচন'}>
                <Select
                  id="teacher-attendance-section"
                  name="sectionId"
                  aria-label="শাখা নির্বাচন"
                  value={activeSectionId}
                  onChange={(e) => {
                    setSelectedSectionId(e.target.value);
                    setDraftStatuses({});
                  }}
                >
                  {mySections.map((sec) => (
                    <option key={sec.sectionId} value={sec.sectionId}>
                      {sec.className} ({sec.sectionName})
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="w-48">
              <FormField label={'তারিখ'}>
                <Input
                  id="teacher-attendance-date"
                  name="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setDraftStatuses({});
                  }}
                />
              </FormField>
            </div>
            <div className="flex-1 flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={students.length === 0}
                onClick={() => {
                  const all: Record<string, AttendanceStatus> = {};
                  students.forEach((s) => {
                    all[s.studentEnrollmentId] = AttendanceStatus.PRESENT;
                  });
                  setDraftStatuses(all);
                }}
              >
                {'সবাইকে উপস্থিত করুন'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saving || students.length === 0}
                onClick={handleSave}
              >
                <Save className="w-4 h-4" />
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'হাজিরা সংরক্ষণ'}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={'মোট শিক্ষার্থী'}
              value={formatNumber(liveCounts.total, 'bn')}
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              label={'উপস্থিত'}
              value={formatNumber(liveCounts.present, 'bn')}
              icon={<CheckCircle2 className="w-5 h-5" />}
              accent="success"
            />
            <StatCard
              label={'বিলম্ব'}
              value={formatNumber(liveCounts.late, 'bn')}
              icon={<Clock className="w-5 h-5" />}
              accent="warning"
            />
            <StatCard
              label={'অনুপস্থিত'}
              value={formatNumber(liveCounts.absent, 'bn')}
              icon={<XCircle className="w-5 h-5" />}
              accent="destructive"
            />
          </div>

          {dailyData?.isClosedDay && (
            <div className="p-3.5 rounded-[var(--radius)] border border-warning/40 bg-warning/10 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p>
                {`নির্বাচিত তারিখটি বিদ্যালয়ের ছুটির দিন / বন্ধ দিবস (${dailyData.closedReason || 'বন্ধ'})।`}
              </p>
            </div>
          )}

          {isRfidPrimary && (
            <div className="p-3.5 rounded-[var(--radius)] border border-info/40 bg-info/10 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-info shrink-0 mt-0.5" />
              <p>
                {'এই শ্রেণির জন্য প্রাথমিক হাজিরা পদ্ধতি RFID নির্ধারিত আছে। আপনি প্রয়োজনে ম্যানুয়াল ফলোব্যাক হিসেবে অনুপস্থিতি বা ছুটি হালনাগাদ করতে পারেন।'}
              </p>
            </div>
          )}

          {loadingDaily || fetchingDaily ? (
            <LoadingSkeleton />
          ) : students.length === 0 ? (
            <EmptyState
              title={'এই শাখায় কোনো সক্রিয় শিক্ষার্থী নেই'}
              description={'নির্বাচিত শাখায় চলমান শিক্ষাবর্ষের কোনো ভর্তি করা শিক্ষার্থী পাওয়া যায়নি।'}
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-base">
                  <thead className="bg-muted/40 text-sm text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left">{'রোল'}</th>
                      <th className="px-4 py-3 text-left">{'শিক্ষার্থী'}</th>
                      <th className="px-4 py-3 text-left">{'হাজিরার অবস্থা'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {students.map((stu) => {
                      const status = getStatus(stu);
                      return (
                        <tr key={stu.studentEnrollmentId} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-bold">
                            {formatNumber(stu.roll, 'bn')}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{stu.nameBn || stu.nameEn}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {stu.studentCode}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                AttendanceStatus.PRESENT,
                                AttendanceStatus.ABSENT,
                                AttendanceStatus.LATE,
                                AttendanceStatus.LEAVE,
                              ].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setDraftStatuses((prev) => ({
                                      ...prev,
                                      [stu.studentEnrollmentId]: st,
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded text-sm font-medium border cursor-pointer transition-colors ${
                                    status === st
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-background border-border hover:bg-muted/50'
                                  }`}
                                >
                                  {ENUM_LABELS.AttendanceStatus[st]?.bn ?? st}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
