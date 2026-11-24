'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Clock,
  Download,
  GripVertical,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  useGetSchoolClassesQuery,
  useGetSectionsQuery,
  useGetClassSubjectsQuery,
  useGetClassRoutinesQuery,
  useCreateClassRoutineMutation,
  useUpdateClassRoutineMutation,
  useDeleteClassRoutineMutation,
  useGetTeacherAssignmentsQuery,
  type ClassRoutineSlot,
} from '@/src/services/academic';
import { useGetStaffQuery } from '@/src/features/staff/api/staff.api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { getTodayWeekDay, PERIOD_META, periodClock, SCHOOL_DAYS } from '@/src/lib/classRoutine';
import { cn, exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, FormField, Input, Modal, Select } from '@/src/components/ui/primitives';
import type { AcademicYear, SchoolClass, Section } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { StaffStatus, StaffType, WeekDay } from '@/src/types/enums';

const DAY_LABEL = {
  [WeekDay.SUNDAY]: ['রবিবার', 'Sunday'],
  [WeekDay.MONDAY]: ['সোমবার', 'Monday'],
  [WeekDay.TUESDAY]: ['মঙ্গলবার', 'Tuesday'],
  [WeekDay.WEDNESDAY]: ['বুধবার', 'Wednesday'],
  [WeekDay.THURSDAY]: ['বৃহস্পতিবার', 'Thursday'],
} as const;

type RoutineViewMode = 'section' | 'teacher';

export function AcademicRoutine({
  db,
  year,
}: {
  db?: MockDatabase;
  year: AcademicYear;
}) {
  const { locale, pick } = useI18n();

  // API Mutations
  const [createRoutine, { isLoading: adding }] = useCreateClassRoutineMutation();
  const [updateRoutine] = useUpdateClassRoutineMutation();
  const [deleteRoutine] = useDeleteClassRoutineMutation();

  const [viewMode, setViewMode] = useState<RoutineViewMode>('section');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // 1. Fetch real Classes
  const { data: realClasses } = useGetSchoolClassesQuery();
  const classList: SchoolClass[] = useMemo(() => {
    if (realClasses && realClasses.length > 0) return realClasses;
    return db?.classes ?? [];
  }, [realClasses, db?.classes]);

  // Keep classId synchronized with real classes
  useEffect(() => {
    if (classList.length > 0 && (!classId || !classList.some((c) => c.id === classId))) {
      setClassId(classList[0].id);
    }
  }, [classList, classId]);

  const schoolClass = classList.find((item) => item.id === classId) ?? classList[0];

  // 2. Fetch real Sections for selected class
  const { data: realSections } = useGetSectionsQuery(
    schoolClass?.id ? { classId: schoolClass.id } : undefined,
    { skip: !schoolClass?.id }
  );
  const sections: Section[] = useMemo(() => {
    if (realSections && realSections.length > 0) {
      return realSections.filter((s) => s.isActive);
    }
    return (db?.sections ?? []).filter((s) => s.isActive && s.classId === schoolClass?.id);
  }, [realSections, db?.sections, schoolClass?.id]);

  // Keep sectionId synchronized
  useEffect(() => {
    if (sections.length > 0 && (!sectionId || !sections.some((s) => s.id === sectionId))) {
      setSectionId(sections[0].id);
    }
  }, [sections, sectionId]);

  const effectiveSectionId = sections.some((s) => s.id === sectionId)
    ? sectionId
    : sections[0]?.id ?? '';
  const section = sections.find((item) => item.id === effectiveSectionId);

  // 3. Fetch real Teachers
  const { data: realStaff } = useGetStaffQuery({
    staffType: StaffType.TEACHER,
    status: StaffStatus.ACTIVE,
    limit: 100,
  });
  const teachers = useMemo(() => {
    if (realStaff && realStaff.length > 0) return realStaff;
    return (db?.staff ?? []).filter(
      (s) => s.staffType === StaffType.TEACHER && s.status === StaffStatus.ACTIVE
    );
  }, [realStaff, db?.staff]);

  // Keep selected teacher synchronized
  useEffect(() => {
    if (teachers.length > 0 && (!selectedTeacherId || !teachers.some((t) => t.id === selectedTeacherId))) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  const effectiveTeacherId = teachers.some((t) => t.id === selectedTeacherId)
    ? selectedTeacherId
    : teachers[0]?.id ?? '';
  const selectedTeacher = teachers.find((t) => t.id === effectiveTeacherId) ?? null;

  // 4. Fetch real Class Subjects for selected class
  const { data: realClassSubjects } = useGetClassSubjectsQuery(
    schoolClass?.id ? { academicYearId: year.id, classId: schoolClass.id } : undefined,
    { skip: !schoolClass?.id }
  );
  const classSubjects = useMemo(() => {
    if (realClassSubjects && realClassSubjects.length > 0) return realClassSubjects;
    return (db?.classSubjects ?? []).filter(
      (cs) => cs.academicYearId === year.id && cs.classId === schoolClass?.id
    );
  }, [realClassSubjects, db?.classSubjects, year.id, schoolClass?.id]);

  // 5. Fetch real Teacher Assignments
  const { data: realAssignments } = useGetTeacherAssignmentsQuery(
    effectiveSectionId ? { academicYearId: year.id, sectionId: effectiveSectionId } : undefined,
    { skip: !effectiveSectionId }
  );
  const assignments = useMemo(() => {
    if (realAssignments && realAssignments.length > 0) return realAssignments;
    return (db?.teacherAssignments ?? []).filter(
      (item) => item.isActive && item.academicYearId === year.id && item.sectionId === effectiveSectionId
    );
  }, [realAssignments, db?.teacherAssignments, year.id, effectiveSectionId]);

  // 6. Fetch real Class Routines for academic year
  const {
    data: realRoutines,
    isFetching: fetchingRoutines,
    refetch: refetchRoutines,
  } = useGetClassRoutinesQuery({
    academicYearId: year.id,
  });

  const yearRoutines = useMemo(() => {
    if (realRoutines && realRoutines.length > 0) return realRoutines;
    return (db?.classRoutines ?? []).filter((slot) => slot.academicYearId === year.id) as any[];
  }, [realRoutines, db?.classRoutines, year.id]);

  // Slots for the active section
  const slots = useMemo(
    () =>
      yearRoutines.filter((slot) => {
        const secId = slot.section?.id || slot.sectionId;
        return secId === effectiveSectionId;
      }),
    [yearRoutines, effectiveSectionId]
  );

  // Slots for the active teacher
  const teacherSlots = useMemo(
    () =>
      yearRoutines.filter((slot) => {
        const stId = slot.teacher?.id || slot.staffId;
        return stId === effectiveTeacherId;
      }),
    [yearRoutines, effectiveTeacherId]
  );

  // Class Teacher
  const classTeacherRow = (db?.sectionClassTeachers ?? []).find(
    (row) => row.sectionId === effectiveSectionId && row.academicYearId === year.id
  );
  const classTeacher = classTeacherRow
    ? teachers.find((member) => member.id === classTeacherRow.staffId)
    : null;

  const today = getTodayWeekDay();

  // Drag and Drop & Form State
  const [dragRoutineId, setDragRoutineId] = useState<string | null>(null);
  const [form, setForm] = useState({
    classSubjectId: '',
    staffId: '',
    teacherAssignmentId: '',
    day: WeekDay.SUNDAY,
    periodNumber: 1,
    room: 'রুম ২০১',
    isBreak: false,
  });
  const [composerOpen, setComposerOpen] = useState(false);

  const schoolName =
    locale === 'bn'
      ? db?.schoolProfile?.name || 'বজ্রেশ্বর উচ্চ বিদ্যালয়'
      : db?.schoolProfile?.nameEn || 'Vojesshor High School';

  // Metrics
  const uniqueTeachersInSection = new Set(
    slots.map((s) => s.teacher?.id || s.staffId).filter(Boolean)
  ).size;
  const maxWeeklySlots = SCHOOL_DAYS.length * PERIOD_META.length; // 5 * 6 = 30
  const teacherFreeSlots = Math.max(0, maxWeeklySlots - teacherSlots.length);

  const chooseClass = (nextClassId: string) => {
    setClassId(nextClassId);
    setForm((prev) => ({ ...prev, classSubjectId: '', teacherAssignmentId: '' }));
  };

  const chooseSection = (nextSectionId: string) => {
    setSectionId(nextSectionId);
    setForm((prev) => ({ ...prev, teacherAssignmentId: '' }));
  };

  const openQuickAdd = (day: WeekDay, periodNumber: number) => {
    const existingRoom = slots[0]?.room || 'রুম ২০১';
    setForm({
      classSubjectId: classSubjects[0]?.id ?? '',
      staffId: teachers[0]?.id ?? '',
      teacherAssignmentId: assignments[0]?.id ?? '',
      day,
      periodNumber,
      room: existingRoom,
      isBreak: false,
    });
    setComposerOpen(true);
  };

  // Helper to resolve Subject display title
  const resolveSubjectName = (slot: any) => {
    if (slot.subject?.name) return slot.subject.name;
    if (slot.classSubjectId) {
      const cs = classSubjects.find((x) => x.id === slot.classSubjectId);
      if (cs) {
        return (
          cs.subject?.name ||
          (db?.subjects ?? []).find((s) => s.id === cs.subjectId)?.name ||
          '—'
        );
      }
    }
    if (slot.teacherAssignmentId) {
      const ta = assignments.find((x) => x.id === slot.teacherAssignmentId);
      if (ta) {
        const cs = classSubjects.find((x) => x.id === ta.classSubjectId);
        return (
          cs?.subject?.name ||
          (db?.subjects ?? []).find((s) => s.id === (cs?.subjectId || cs?.subject?.id))?.name ||
          '—'
        );
      }
    }
    return '—';
  };

  // Helper to resolve Teacher name
  const resolveTeacherName = (slot: any) => {
    if (slot.teacher?.name) return slot.teacher.name;
    const stId = slot.staffId || slot.teacher?.id;
    if (stId) {
      const t = teachers.find((x) => x.id === stId);
      if (t) return t.name;
    }
    return '—';
  };

  const onAdd = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!schoolClass || !effectiveSectionId) {
      toast.error(pick('শ্রেণি ও শাখা নির্বাচন করুন।', 'Please select class and section.'));
      return;
    }

    if (!form.isBreak && !form.classSubjectId) {
      toast.error(pick('পাঠদানের বিষয় নির্বাচন করুন।', 'Please select a subject.'));
      return;
    }

    const clock = periodClock(form.periodNumber);

    try {
      // Find matching teacher assignment if any
      const matchedAssignment = assignments.find(
        (a) =>
          a.classSubjectId === form.classSubjectId &&
          (!form.staffId || a.staffId === form.staffId)
      );

      await createRoutine({
        academicYearId: year.id,
        classId: schoolClass.id,
        sectionId: effectiveSectionId,
        classSubjectId: form.isBreak ? undefined : form.classSubjectId || undefined,
        staffId: form.isBreak ? undefined : form.staffId || undefined,
        teacherAssignmentId: form.isBreak
          ? undefined
          : matchedAssignment?.id || form.teacherAssignmentId || undefined,
        day: form.day,
        periodNumber: form.periodNumber,
        periodName: form.isBreak
          ? pick('টিফিন / বিরতি', 'Tiffin / Break')
          : pick(clock.labelBn, clock.labelEn),
        startTime: clock.startTime,
        endTime: clock.endTime,
        room: form.room.trim() || undefined,
        isBreak: form.isBreak,
      }).unwrap();

      toast.success(
        pick('ক্লাস রুটিনে পিরিয়ড সফলভাবে যুক্ত হয়েছে।', 'Routine period added successfully.')
      );
      setComposerOpen(false);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        pick('পিরিয়ড বসানো যায়নি।', 'Could not add the period.');
      toast.error(msg);
    }
  };

  const onRemove = async (id: string) => {
    try {
      await deleteRoutine(id).unwrap();
      toast.success(pick('পিরিয়ড মুছে ফেলা হয়েছে।', 'Period removed.'));
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        pick('পিরিয়ড মোছা যায়নি।', 'Could not remove the period.');
      toast.error(msg);
    }
  };

  const onDrop = async (day: WeekDay, periodNumber: number) => {
    if (!dragRoutineId) return;
    const clock = periodClock(periodNumber);
    try {
      await updateRoutine({
        id: dragRoutineId,
        day,
        periodNumber,
        startTime: clock.startTime,
        endTime: clock.endTime,
      }).unwrap();
      toast.success(
        pick('রুটিন পিরিয়ড সফলভাবে স্থানান্তরিত হয়েছে।', 'Period moved successfully.')
      );
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        pick('এই ঘরে পিরিয়ড সরানো যায়নি।', 'Could not move the period.');
      toast.error(msg);
    } finally {
      setDragRoutineId(null);
    }
  };

  const handleExportCsv = () => {
    const activeSlots = viewMode === 'section' ? slots : teacherSlots;
    if (!activeSlots.length) return;
    const rows = activeSlots
      .slice()
      .sort((a, b) => {
        const da = SCHOOL_DAYS.indexOf(a.day as (typeof SCHOOL_DAYS)[number]);
        const dbIdx = SCHOOL_DAYS.indexOf(b.day as (typeof SCHOOL_DAYS)[number]);
        return da !== dbIdx ? da - dbIdx : a.periodNumber - b.periodNumber;
      })
      .map((slot) => {
        const pm = periodClock(slot.periodNumber);
        const subName = resolveSubjectName(slot);
        const tName = resolveTeacherName(slot);
        const secName = slot.section?.name || section?.name || '';
        const clsName = slot.class?.name || (locale === 'bn' ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name) || '';

        return {
          day: pick(
            DAY_LABEL[slot.day as keyof typeof DAY_LABEL]?.[0] ?? slot.day,
            DAY_LABEL[slot.day as keyof typeof DAY_LABEL]?.[1] ?? slot.day
          ),
          period: pick(pm.labelBn, pm.labelEn),
          time: pick(pm.timeBn, pm.timeEn),
          classSection: `${clsName} (${secName})`,
          subject: slot.isBreak ? pick('টিফিন / বিরতি', 'Break') : subName,
          teacher: slot.isBreak ? '—' : tName,
          room: slot.room ?? '—',
        };
      });

    exportToCsv(
      rows,
      viewMode === 'section'
        ? `class-routine-${schoolClass?.numericValue ?? 'cls'}-${section?.name ?? 'sec'}.csv`
        : `teacher-schedule-${selectedTeacher?.name ?? 'teacher'}.csv`,
      [
        { key: 'day', label: pick('বার', 'Day') },
        { key: 'period', label: pick('পিরিয়ড', 'Period') },
        { key: 'time', label: pick('সময়', 'Time') },
        { key: 'classSection', label: pick('শ্রেণি ও শাখা', 'Class & Section') },
        { key: 'subject', label: pick('বিষয়', 'Subject') },
        { key: 'teacher', label: pick('শিক্ষক', 'Teacher') },
        { key: 'room', label: pick('কক্ষ', 'Room') },
      ]
    );
  };

  const renderSectionCell = (day: WeekDay, period: number) => {
    const slot = slots.find((item) => item.day === day && item.periodNumber === period);

    if (!slot) {
      return (
        <td
          key={period}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void onDrop(day, period);
          }}
          className="p-2.5 align-top border-r border-border/50 last:border-r-0 group"
        >
          <button
            type="button"
            onClick={() => openQuickAdd(day, period)}
            className="w-full min-h-[68px] rounded-[var(--radius)] border border-dashed border-transparent group-hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center text-xs text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer no-print"
            title={pick('এই পিরিয়ডে ক্লাস যুক্ত করুন', 'Add period here')}
          >
            <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="group-hover:hidden">—</span>
          </button>
          <span className="hidden print:inline text-muted-foreground">—</span>
        </td>
      );
    }

    if (slot.isBreak) {
      return (
        <td
          key={period}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void onDrop(day, period);
          }}
          className="p-2.5 align-top border-r border-border/50 last:border-r-0"
        >
          <div
            draggable
            onDragStart={() => setDragRoutineId(slot.id)}
            className="rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/10 p-2.5 cursor-grab active:cursor-grabbing hover:border-amber-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-1">
              <p className="font-semibold text-amber-700 dark:text-amber-300 text-xs leading-snug">
                {slot.periodName || pick('বিরতি / টিফিন', 'Break / Tiffin')}
              </p>
              <button
                type="button"
                className="p-0.5 rounded text-muted-foreground hover:text-destructive cursor-pointer no-print"
                aria-label={pick('পিরিয়ড মুছুন', 'Remove period')}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onRemove(slot.id)}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {periodClock(slot.periodNumber).timeBn}
            </p>
          </div>
        </td>
      );
    }

    const subjectName = resolveSubjectName(slot);
    const teacherName = resolveTeacherName(slot);

    return (
      <td
        key={period}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void onDrop(day, period);
        }}
        className="p-2.5 align-top border-r border-border/50 last:border-r-0"
      >
        <div
          draggable
          onDragStart={() => setDragRoutineId(slot.id)}
          className="rounded-[var(--radius)] border border-border/70 bg-background p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors shadow-xs"
        >
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-foreground text-xs leading-snug line-clamp-1">
              {subjectName}
            </p>
            <span className="inline-flex items-center gap-0.5 shrink-0 no-print">
              <button
                type="button"
                className="p-0.5 rounded text-muted-foreground hover:text-destructive cursor-pointer"
                aria-label={pick('পিরিয়ড মুছুন', 'Remove period')}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onRemove(slot.id)}
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{teacherName}</p>
          <p className="text-xs text-primary font-medium tabular-nums mt-0.5">{slot.room || '—'}</p>
        </div>
      </td>
    );
  };

  const renderTeacherCell = (day: WeekDay, period: number) => {
    const slot = teacherSlots.find((item) => item.day === day && item.periodNumber === period);

    if (!slot) {
      return (
        <td
          key={period}
          className="p-2.5 align-top border-r border-border/50 last:border-r-0 text-xs text-muted-foreground/60"
        >
          {pick('বিরতি / অবসর', 'Free')}
        </td>
      );
    }

    const subName = resolveSubjectName(slot);
    const clsName = slot.class?.name || (locale === 'bn' ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name) || '';
    const secName = slot.section?.name || section?.name || '';

    return (
      <td key={period} className="p-2.5 align-top border-r border-border/50 last:border-r-0">
        <div className="rounded-[var(--radius)] border border-primary/25 bg-primary/[0.04] p-2.5 shadow-xs">
          <p className="font-semibold text-foreground text-xs leading-snug line-clamp-1">
            {slot.isBreak ? pick('বিরতি', 'Break') : subName}
          </p>
          <p className="text-xs text-primary font-medium mt-1 truncate">
            {clsName} ({secName})
          </p>
          <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{slot.room || '—'}</p>
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-5">
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {viewMode === 'section'
              ? pick('নির্ধারিত সাপ্তাহিক পিরিয়ড', 'Scheduled Weekly Periods')
              : pick('শিক্ষকের সাপ্তাহিক ক্লাস', 'Teacher Weekly Load')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(viewMode === 'section' ? slots.length : teacherSlots.length, locale)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">
              / {formatNumber(maxWeeklySlots, locale)}
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pick('রবি–বৃহস্পতিবার · দৈনিক ৬ পিরিয়ড', 'Sun–Thu · 6 periods/day')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {viewMode === 'section'
              ? pick('শ্রেণিশিক্ষক', 'Class Teacher')
              : pick('অবসর পিরিয়ড', 'Free Periods / Week')}
          </p>
          <p className="mt-1 text-xl font-bold text-foreground truncate pt-0.5">
            {viewMode === 'section'
              ? classTeacher?.name || pick('নির্ধারিত হয়নি', 'Not assigned')
              : `${formatNumber(teacherFreeSlots, locale)} ${pick('টি পিরিয়ড', 'periods')}`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {viewMode === 'section'
              ? pick(
                  `${formatNumber(uniqueTeachersInSection, 'bn')} জন বিষয় শিক্ষক যুক্ত`,
                  `${uniqueTeachersInSection} subject teachers`
                )
              : selectedTeacher?.designation || '—'}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('বিদ্যালয়ের সময়সূচি', 'School Bell Hours')}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground pt-0.5">
            {pick('সকাল ১০:০০ – বিকাল ৩:০০', '10:00 AM – 3:00 PM')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick('সমাবেশ ৯:৪৫ · টিফিন ১২:১৫–১২:৪৫', 'Assembly 9:45 · Tiffin 12:15–12:45')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('মোট সক্রিয় পিরিয়ড (বিদ্যালয়)', 'Total School Slots')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            {formatNumber(yearRoutines.length, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pick('কনফ্লিক্ট-মুক্ত (পাবলিক সাইটে সিঙ্কড)', 'Conflict-free · synced with public site')}
          </p>
        </Card>
      </div>

      {/* Controls Bar */}
      <Card className="p-4 space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-[var(--radius)] border border-border bg-background p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('section')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[calc(var(--radius)-2px)] text-sm font-medium transition-colors cursor-pointer',
                viewMode === 'section'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Users className="w-4 h-4" />
              {pick('শাখাভিত্তিক রুটিন', 'Section Timetable')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('teacher')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[calc(var(--radius)-2px)] text-sm font-medium transition-colors cursor-pointer',
                viewMode === 'teacher'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <UserCheck className="w-4 h-4" />
              {pick('শিক্ষকভিত্তিক সময়সূচি', 'Teacher Schedule')}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewMode === 'section' && (
              <Button variant="primary" size="sm" onClick={() => setComposerOpen(true)}>
                <Plus className="w-4 h-4" />
                {pick('পিরিয়ড যুক্ত করুন', 'Add period')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={fetchingRoutines}
              onClick={() => refetchRoutines()}
              title={pick('রিফ্রেশ', 'Refresh')}
            >
              <RefreshCw className={cn('w-4 h-4', fetchingRoutines && 'animate-spin')} />
              <span>{pick('রিফ্রেশ', 'Refresh')}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="w-4 h-4" />
              {pick('CSV', 'CSV')}
            </Button>
            <Button variant="outline" size="sm" onClick={triggerPrint}>
              <Printer className="w-4 h-4" />
              {pick('রুটিন প্রিন্ট', 'Print Routine')}
            </Button>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
          {viewMode === 'section' ? (
            <div className="flex flex-wrap items-center gap-3">
              <FormField label={pick('শ্রেণি', 'Class')}>
                <Select
                  value={schoolClass?.id ?? ''}
                  onChange={(event) => chooseClass(event.target.value)}
                  className="w-44 h-9 font-semibold"
                >
                  {classList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {locale === 'bn' ? item.nameBn || item.name : item.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label={pick('শাখা', 'Section')}>
                <Select
                  value={effectiveSectionId}
                  onChange={(event) => chooseSection(event.target.value)}
                  className="w-36 h-9 font-semibold"
                >
                  {sections.map((item) => (
                    <option key={item.id} value={item.id}>
                      {pick('শাখা:', 'Section:')} {item.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          ) : (
            <FormField label={pick('শিক্ষক নির্বাচন করুন', 'Select Teacher')}>
              <Select
                value={effectiveTeacherId}
                onChange={(event) => setSelectedTeacherId(event.target.value)}
                className="w-80 h-9 font-semibold"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.designation || pick('শিক্ষক', 'Teacher')}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <p className="text-xs text-muted-foreground">
            {viewMode === 'section'
              ? pick(
                  'টিপস: যেকোনো পিরিয়ড ড্র্যাগ করে অন্য ঘরে সরানো যাবে অথবা খালি ঘরে ক্লিক করে সরাসরি ক্লাস বসানো যাবে।',
                  'Tip: Drag any period card to reschedule, or click an empty cell to add a class.'
                )
              : pick(
                  'প্রতিটি শিক্ষকের সাপ্তাহিক পাঠদান ও অবসর সময়সূচি (শূন্য কনফ্লিক্ট)।',
                  'Weekly class load and free periods per teacher (zero double-booking).'
                )}
          </p>
        </div>
      </Card>

      {/* Add Period Modal */}
      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title={pick('রুটিনে নতুন পিরিয়ড বসান', 'Schedule Routine Period')}
        description={pick(
          'একই সময়ে একই শিক্ষক, শাখা বা কক্ষ দুবার বরাদ্দ করা যাবে না (স্বয়ংক্রিয় কনফ্লিক্ট যাচাই)।',
          'Automatic conflict protection blocks double-booking the same teacher, section, or classroom.'
        )}
      >
        <form onSubmit={onAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Break Toggle */}
          <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-lg bg-surface-muted/60 border border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {pick('টিফিন বা সাধারণ বিরতি?', 'Break or Tiffin Slot?')}
              </p>
              <p className="text-xs text-muted-foreground">
                {pick('বিরতি নির্বাচন করলে বিষয় ও শিক্ষক নির্বাচনের প্রয়োজন নেই।', 'Break periods do not require subject or teacher.')}
              </p>
            </div>
            <input
              type="checkbox"
              id="isBreakToggle"
              checked={form.isBreak}
              onChange={(e) => setForm({ ...form, isBreak: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          {!form.isBreak && (
            <>
              {/* Subject */}
              <FormField label={pick('বিষয়', 'Subject')} required>
                <Select
                  value={form.classSubjectId}
                  onChange={(event) => {
                    const nextCsId = event.target.value;
                    const matchAssignment = assignments.find((a) => a.classSubjectId === nextCsId);
                    setForm({
                      ...form,
                      classSubjectId: nextCsId,
                      staffId: matchAssignment?.staffId || form.staffId,
                    });
                  }}
                >
                  <option value="">{pick('বিষয় বাছাই করুন', 'Select Subject')}</option>
                  {classSubjects.map((cs) => {
                    const subName = cs.subject?.name || (db?.subjects ?? []).find((s) => s.id === cs.subjectId)?.name || '—';
                    return (
                      <option key={cs.id} value={cs.id}>
                        {subName} {cs.isOptional ? `(${pick('ঐচ্ছিক', 'Optional')})` : ''}
                      </option>
                    );
                  })}
                </Select>
              </FormField>

              {/* Teacher */}
              <FormField label={pick('শিক্ষক', 'Teacher')}>
                <Select
                  value={form.staffId}
                  onChange={(event) => setForm({ ...form, staffId: event.target.value })}
                >
                  <option value="">{pick('শিক্ষক বাছাই করুন', 'Select Teacher')}</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.designation || pick('শিক্ষক', 'Teacher')})
                    </option>
                  ))}
                </Select>
              </FormField>
            </>
          )}

          {/* Room */}
          <FormField label={pick('কক্ষ নম্বর', 'Room')}>
            <Input
              value={form.room}
              onChange={(event) => setForm({ ...form, room: event.target.value })}
              placeholder={pick('রুম ২০১', 'Room 201')}
            />
          </FormField>

          {/* Day */}
          <FormField label={pick('বার', 'Day')} required>
            <Select
              value={form.day}
              onChange={(event) => setForm({ ...form, day: event.target.value as WeekDay })}
            >
              {SCHOOL_DAYS.map((day) => (
                <option key={day} value={day}>
                  {pick(DAY_LABEL[day][0], DAY_LABEL[day][1])}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Period */}
          <FormField label={pick('পিরিয়ড', 'Period')} required>
            <Select
              value={form.periodNumber}
              onChange={(event) => setForm({ ...form, periodNumber: Number(event.target.value) })}
            >
              {PERIOD_META.map((period) => (
                <option key={period.period} value={period.period}>
                  {pick(period.labelBn, period.labelEn)} · {pick(period.timeBn, period.timeEn)}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setComposerOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={adding}>
              {adding ? pick('যুক্ত হচ্ছে...', 'Saving...') : pick('পিরিয়ড যুক্ত করুন', 'Add period')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Print Letterhead */}
      <div className="hidden print:flex items-center justify-between border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <SchoolEmblem size={44} />
          <div>
            <h1 className="text-lg font-bold text-foreground">{schoolName}</h1>
            <p className="text-xs text-muted-foreground">
              {viewMode === 'section'
                ? pick(
                    `সাপ্তাহিক ক্লাস রুটিন ${year.name} · ${schoolClass?.nameBn ?? schoolClass?.name ?? ''} (শাখা: ${section?.name ?? ''})`,
                    `Weekly Class Routine ${year.name} · ${schoolClass?.name ?? ''} (Section: ${section?.name ?? ''})`
                  )
                : pick(
                    `শিক্ষকের সাপ্তাহিক রুটিন ${year.name} · ${selectedTeacher?.name ?? ''}`,
                    `Teacher Weekly Schedule ${year.name} · ${selectedTeacher?.name ?? ''}`
                  )}
            </p>
          </div>
        </div>
        {viewMode === 'section' && classTeacher && (
          <p className="text-xs text-muted-foreground">
            {pick('শ্রেণিশিক্ষক:', 'Class Teacher:')} {classTeacher.name}
          </p>
        )}
      </div>

      {/* 6-Period Weekly Grid */}
      <Card className="p-0 overflow-x-auto print-landscape">
        <table className="w-full text-sm border-collapse min-w-[1040px]">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              <th className="p-3 border-b border-r border-border text-left font-semibold w-28">
                {pick('বার', 'Day')}
              </th>
              {PERIOD_META.slice(0, 3).map((period) => (
                <th key={period.period} className="p-3 border-b border-r border-border/50 text-left">
                  <div className="font-semibold text-foreground text-xs">{pick(period.labelBn, period.labelEn)}</div>
                  <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    {pick(period.timeBn, period.timeEn)}
                  </div>
                </th>
              ))}
              <th className="p-2.5 border-b border-x border-border text-center bg-surface-muted/80 w-24">
                <div className="text-xs font-semibold text-primary">{pick('টিফিন', 'Tiffin')}</div>
                <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  {pick('১২:১৫–১২:৪৫', '12:15–12:45')}
                </div>
              </th>
              {PERIOD_META.slice(3).map((period) => (
                <th key={period.period} className="p-3 border-b border-r border-border/50 last:border-r-0 text-left">
                  <div className="font-semibold text-foreground text-xs">{pick(period.labelBn, period.labelEn)}</div>
                  <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    {pick(period.timeBn, period.timeEn)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {SCHOOL_DAYS.map((day, dayIndex) => (
              <tr key={day} className={today === day ? 'bg-primary/[0.03]' : undefined}>
                <td className="p-3 font-semibold border-r border-border bg-surface-muted/30 whitespace-nowrap align-top">
                  <div className="flex flex-col gap-1">
                    <StatusBadge enumName="WeekDay" value={day} />
                    {today === day && (
                      <span className="text-xs font-semibold text-primary">
                        {pick('আজকের দিন', 'Today')}
                      </span>
                    )}
                  </div>
                </td>
                {[1, 2, 3].map((p) =>
                  viewMode === 'section' ? renderSectionCell(day, p) : renderTeacherCell(day, p)
                )}
                {dayIndex === 0 && (
                  <td
                    rowSpan={SCHOOL_DAYS.length}
                    className="p-2.5 border-x border-border bg-surface-muted/40 text-center align-middle"
                  >
                    <div className="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{pick('টিফিন', 'Tiffin')}</span>
                      <span className="tabular-nums">{pick('৩০ মি.', '30m')}</span>
                    </div>
                  </td>
                )}
                {[4, 5, 6].map((p) =>
                  viewMode === 'section' ? renderSectionCell(day, p) : renderTeacherCell(day, p)
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
