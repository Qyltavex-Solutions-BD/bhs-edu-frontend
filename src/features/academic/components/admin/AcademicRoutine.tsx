'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  BookOpen,
  Check,
  CheckCircle,
  Clock,
  FileText,
  GripVertical,
  Layers,
  Lightbulb,
  Pencil,
  Plus,
  Printer,
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
  useGetAcademicGroupsQuery,
  type ClassRoutineSlot,
} from '@/src/services/academic';
import { useGetStaffQuery } from '@/src/features/staff/api/staff.api';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { getTodayWeekDay, PERIOD_META, periodClock, SCHOOL_DAYS } from '@/src/lib/classRoutine';
import { cn, triggerPrint } from '@/src/lib/utils/cn';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, FormField, Input, Modal, Select } from '@/src/components/ui/primitives';
import type { AcademicGroup, AcademicYear, SchoolClass, Section } from '@/src/types/entities';
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
  const usesGroup = Boolean(schoolClass && schoolClass.numericValue >= 9);

  // 2. Fetch Groups (Science, Humanities, Business Studies)
  const { data: realGroups } = useGetAcademicGroupsQuery();
  const groupList: AcademicGroup[] = useMemo(() => {
    if (realGroups && realGroups.length > 0) return realGroups;
    return db?.academicGroups ?? [];
  }, [realGroups, db?.academicGroups]);

  // 3. Fetch real Sections for selected class
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

  // 4. Fetch real Teachers
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

  // 5. Fetch real Class Subjects for selected class
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

  // 6. Fetch real Teacher Assignments
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

  // 7. Fetch real Class Routines for academic year
  const { data: realRoutines } = useGetClassRoutinesQuery({
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
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [routineStatus, setRoutineStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [routineType, setRoutineType] = useState<'single' | 'group'>('single');
  const [form, setForm] = useState({
    groupId: '',
    classSubjectId: '',
    staffId: '',
    teacherAssignmentId: '',
    day: WeekDay.SUNDAY,
    periodNumber: 1,
    room: 'রুম ২০১',
    isBreak: false,
  });

  const [groupForm, setGroupForm] = useState({
    science: {
      classSubjectId: '',
      staffId: '',
      room: 'রুম ২০৫ (ল্যাব)',
    },
    humanities: {
      classSubjectId: '',
      staffId: '',
      room: 'রুম ২০৮',
    },
    business: {
      classSubjectId: '',
      staffId: '',
      room: 'রুম ২০৯',
    },
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
  const maxWeeklySlots = SCHOOL_DAYS.length * PERIOD_META.length; // 5 * 5 = 25
  const teacherFreeSlots = Math.max(0, maxWeeklySlots - teacherSlots.length);

  // Group Entities
  const scienceGroup = groupList.find((g) => g.name === 'Science');
  const humanitiesGroup = groupList.find((g) => g.name === 'Humanities');
  const businessGroup = groupList.find((g) => g.name === 'Business Studies');

  // Filtered Subject Lists
  const scienceSubjects = useMemo(() => {
    if (!scienceGroup) return [];
    return classSubjects.filter((cs) => cs.groupId === scienceGroup.id);
  }, [classSubjects, scienceGroup]);

  const humanitiesSubjects = useMemo(() => {
    if (!humanitiesGroup) return [];
    return classSubjects.filter((cs) => cs.groupId === humanitiesGroup.id);
  }, [classSubjects, humanitiesGroup]);

  const businessSubjects = useMemo(() => {
    if (!businessGroup) return [];
    return classSubjects.filter((cs) => cs.groupId === businessGroup.id);
  }, [classSubjects, businessGroup]);

  const commonSubjects = useMemo(() => {
    if (!usesGroup) return classSubjects;
    return classSubjects.filter((cs) => !cs.groupId);
  }, [classSubjects, usesGroup]);

  const selectableSubjects = useMemo(() => {
    let list: any[] = classSubjects;
    if (!usesGroup) {
      list = classSubjects;
    } else if (editingRoutineId) {
      if (form.groupId) {
        list = classSubjects.filter((cs) => cs.groupId === form.groupId);
      } else {
        list = classSubjects;
      }
    } else {
      list = commonSubjects;
    }

    // CRITICAL: Ensure currently selected classSubjectId is ALWAYS present in the options list
    if (form.classSubjectId && !list.some((cs) => cs.id === form.classSubjectId)) {
      const matchInAll = classSubjects.find((cs) => cs.id === form.classSubjectId);
      if (matchInAll) {
        list = [matchInAll, ...list];
      } else {
        const subName =
          editingSlot?.subject?.name ||
          (db?.subjects ?? []).find((s) => s.id === form.classSubjectId)?.name ||
          resolveSubjectName(editingSlot) ||
          pick('নির্বাচিত বিষয়', 'Selected Subject');
        const fallbackCs = {
          id: form.classSubjectId,
          subjectId: editingSlot?.subject?.id || form.classSubjectId,
          subject: {
            id: editingSlot?.subject?.id || form.classSubjectId,
            name: subName,
          },
          groupId: form.groupId || null,
        };
        list = [fallbackCs, ...list];
      }
    }
    return list;
  }, [classSubjects, usesGroup, editingRoutineId, form.groupId, form.classSubjectId, commonSubjects, editingSlot]);

  // Smart subject-wise teacher matcher & sorter
  const getTeachersForSubject = (classSubjectId: string) => {
    if (!classSubjectId) return teachers;
    const targetCs = classSubjects.find((cs) => cs.id === classSubjectId);
    const subName =
      targetCs?.subject?.name ||
      (db?.subjects ?? []).find((s) => s.id === targetCs?.subjectId)?.name ||
      '';

    const assigned = assignments.find((a) => a.classSubjectId === classSubjectId);
    const assignedStaffId = assigned?.staffId;

    const subLower = subName.toLowerCase();
    const keywords: string[] = [];
    if (subLower.includes('বাংলা') || subLower.includes('bangla')) keywords.push('bangla', 'বাংলা', 'bengali');
    if (subLower.includes('english') || subLower.includes('ইংরেজি')) keywords.push('english', 'ইংরেজি');
    if (subLower.includes('গণিত') || subLower.includes('math')) keywords.push('math', 'গণিত');
    if (subLower.includes('পদার্থ') || subLower.includes('physics')) keywords.push('physic', 'পদার্থ', 'science');
    if (subLower.includes('রসায়ন') || subLower.includes('chemistry')) keywords.push('chem', 'রসায়ন', 'science');
    if (subLower.includes('জীব') || subLower.includes('biology')) keywords.push('bio', 'জীব', 'science');
    if (subLower.includes('ইতিহাস') || subLower.includes('history')) keywords.push('history', 'ইতিহাস', 'social');
    if (subLower.includes('ভূগোল') || subLower.includes('geography')) keywords.push('geog', 'ভূগোল', 'social');
    if (subLower.includes('পৌরনীতি') || subLower.includes('civics')) keywords.push('civic', 'পৌরনীতি');
    if (subLower.includes('অর্থনীতি') || subLower.includes('economics')) keywords.push('econ', 'অর্থনীতি');
    if (subLower.includes('হিসাব') || subLower.includes('accounting')) keywords.push('account', 'হিসাব', 'commerce', 'business');
    if (subLower.includes('ব্যবসায়') || subLower.includes('business')) keywords.push('business', 'ব্যবসায়', 'commerce');
    if (subLower.includes('ফিন্যান্স') || subLower.includes('finance')) keywords.push('finance', 'ফিন্যান্স', 'commerce');
    if (subLower.includes('তথ্য') || subLower.includes('ict')) keywords.push('ict', 'computer', 'তথ্য');
    if (subLower.includes('ধর্ম') || subLower.includes('ইসলাম') || subLower.includes('religion')) keywords.push('islam', 'religion', 'ধর্ম');

    const scoreTeacher = (t: any) => {
      if (assignedStaffId && t.id === assignedStaffId) return 3;
      const des = (t.designation || '').toLowerCase();
      const qual = (t.qualification || '').toLowerCase();
      const n = (t.name || '').toLowerCase();
      if (keywords.some((kw) => des.includes(kw) || qual.includes(kw) || n.includes(kw))) {
        return 2;
      }
      return 1;
    };

    return [...teachers].sort((a, b) => scoreTeacher(b) - scoreTeacher(a));
  };

  const chooseClass = (nextClassId: string) => {
    setClassId(nextClassId);
    setForm((prev) => ({ ...prev, groupId: '', classSubjectId: '', teacherAssignmentId: '' }));
  };

  const chooseSection = (nextSectionId: string) => {
    setSectionId(nextSectionId);
    setForm((prev) => ({ ...prev, teacherAssignmentId: '' }));
  };

  const handleToggleStatus = (newStatus: 'DRAFT' | 'PUBLISHED') => {
    setRoutineStatus(newStatus);
    if (newStatus === 'PUBLISHED') {
      toast.success(
        pick('রুটিন সফলভাবে প্রকাশিত হয়েছে। শিক্ষক ও শিক্ষার্থীরা দেখতে পাবেন।', 'Routine published successfully.')
      );
    } else {
      toast.info(pick('রুটিন ড্রাফট মোডে রাখা হয়েছে।', 'Routine set to draft mode.'));
    }
  };

  // Helper to get clean, short room number without section/group brackets
  const cleanRoom = (roomStr?: string | null) => {
    if (!roomStr) return '';
    return roomStr.replace(/\s*\([^)]*\)/gi, '').trim();
  };

  const openEditModal = (slot: any) => {
    if (!slot) return;
    const routineId = slot.id || slot.routineId || '';
    setEditingRoutineId(routineId);
    setEditingSlot(slot);
    setRoutineType('single');

    // 1. Resolve ClassSubject ID:
    let csId =
      slot.classSubjectId ||
      slot.classSubject?.id ||
      slot.subject?.classSubjectId ||
      '';

    if (!csId && slot.subject) {
      const match = classSubjects.find(
        (cs) =>
          cs.id === slot.subject?.id ||
          cs.subjectId === slot.subject?.id ||
          cs.subject?.id === slot.subject?.id ||
          (cs.subject?.name &&
            slot.subject?.name &&
            cs.subject.name.trim().toLowerCase() === slot.subject.name.trim().toLowerCase())
      );
      if (match) csId = match.id;
    }

    if (!csId && slot.teacherAssignmentId) {
      const ta = assignments.find((a) => a.id === slot.teacherAssignmentId);
      if (ta?.classSubjectId) csId = ta.classSubjectId;
    }

    if (!csId && slot.subject?.id) {
      csId = slot.subject.id;
    }

    // 2. Resolve Group ID:
    let targetGroupId =
      slot.groupId ||
      slot.group?.id ||
      slot.classSubject?.groupId ||
      '';

    if (!targetGroupId && csId) {
      const cs = classSubjects.find((x) => x.id === csId);
      if (cs?.groupId) targetGroupId = cs.groupId;
    }
    if (!targetGroupId && slot.group?.name) {
      const matchedGroup = groupList.find(
        (g) =>
          g.name.trim().toLowerCase() === slot.group.name.trim().toLowerCase() ||
          (g.nameBn && slot.group.name && g.nameBn.trim() === slot.group.name.trim())
      );
      if (matchedGroup) targetGroupId = matchedGroup.id;
    }

    // 3. Resolve Staff / Teacher ID:
    const matchedAssignment = csId ? assignments.find((a) => a.classSubjectId === csId) : undefined;
    let staffId =
      slot.staffId ||
      slot.teacher?.id ||
      slot.staff?.id ||
      slot.teacherId ||
      '';

    if (!staffId && slot.teacher?.name) {
      const matchedTeacher = teachers.find(
        (t) =>
          t.name.trim().toLowerCase() === slot.teacher.name.trim().toLowerCase() ||
          (t.nameBn && slot.teacher.name && t.nameBn.trim() === slot.teacher.name.trim())
      );
      if (matchedTeacher) staffId = matchedTeacher.id;
    }

    if (!staffId && matchedAssignment?.staffId) {
      staffId = matchedAssignment.staffId;
    }

    // 4. Resolve Room:
    const room = cleanRoom(slot.room) || 'রুম ২০১';

    // 5. Resolve Day, Period, Break:
    const day = slot.day || WeekDay.SUNDAY;
    const periodNumber = slot.periodNumber || 1;
    const isBreak = Boolean(slot.isBreak);

    setForm({
      groupId: targetGroupId,
      classSubjectId: csId,
      staffId,
      teacherAssignmentId: slot.teacherAssignmentId || matchedAssignment?.id || '',
      day,
      periodNumber,
      room,
      isBreak,
    });

    setComposerOpen(true);
  };

  const openQuickAdd = (day: WeekDay, periodNumber: number, targetGroupId?: string) => {
    setEditingRoutineId(null);
    setEditingSlot(null);
    const defaultRoom = cleanRoom(slots[0]?.room) || 'রুম ২০১';
    const initCsId = commonSubjects[0]?.id || classSubjects[0]?.id || '';
    const assignedStaff = assignments.find((a) => a.classSubjectId === initCsId)?.staffId;
    const initStaff = assignedStaff || getTeachersForSubject(initCsId)[0]?.id || teachers[0]?.id || '';

    setForm({
      groupId: targetGroupId !== undefined ? targetGroupId : '',
      classSubjectId: initCsId,
      staffId: initStaff,
      teacherAssignmentId: '',
      day,
      periodNumber,
      room: defaultRoom,
      isBreak: false,
    });

    if (usesGroup) {
      const sciCs = scienceSubjects[0]?.id || '';
      const sciAssigned = assignments.find((a) => a.classSubjectId === sciCs);
      const sciStaff = sciAssigned?.staffId || getTeachersForSubject(sciCs)[0]?.id || '';

      const humCs = humanitiesSubjects[0]?.id || '';
      const humAssigned = assignments.find((a) => a.classSubjectId === humCs);
      const humStaff = humAssigned?.staffId || getTeachersForSubject(humCs)[0]?.id || '';

      const busCs = businessSubjects[0]?.id || '';
      const busAssigned = assignments.find((a) => a.classSubjectId === busCs);
      const busStaff = busAssigned?.staffId || getTeachersForSubject(busCs)[0]?.id || '';

      setGroupForm({
        science: {
          classSubjectId: sciCs,
          staffId: sciStaff,
          room: 'রুম ২০৫',
        },
        humanities: {
          classSubjectId: humCs,
          staffId: humStaff,
          room: 'রুম ২০৬',
        },
        business: {
          classSubjectId: busCs,
          staffId: busStaff,
          room: 'রুম ২০৭',
        },
      });

      setRoutineType(targetGroupId ? 'group' : 'single');
    } else {
      setRoutineType('single');
    }

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
    const stId = slot.staffId || slot.teacher?.id || slot.staff?.id;
    if (stId) {
      const t = teachers.find((x) => x.id === stId);
      if (t) return t.name;
    }
    const csId = slot.classSubjectId || slot.classSubject?.id || slot.subject?.classSubjectId;
    if (csId) {
      const assigned = assignments.find((a) => a.classSubjectId === csId);
      if (assigned?.staffId) {
        const t = teachers.find((x) => x.id === assigned.staffId);
        if (t) return t.name;
      }
    }
    return '—';
  };

  const onAdd = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!schoolClass || !effectiveSectionId) {
      toast.error(pick('শ্রেণি ও শাখা নির্বাচন করুন।', 'Please select class and section.'));
      return;
    }

    const clock = periodClock(form.periodNumber);

    // 3-Group Electives submission for Class 9/10
    if (usesGroup && routineType === 'group') {
      const entries = [
        { group: scienceGroup, data: groupForm.science, label: pick('বিজ্ঞান', 'Science') },
        { group: humanitiesGroup, data: groupForm.humanities, label: pick('মানবিক', 'Humanities') },
        { group: businessGroup, data: groupForm.business, label: pick('ব্যবসায় শিক্ষা', 'Business Studies') },
      ].filter((item) => Boolean(item.group?.id && item.data.classSubjectId));

      if (entries.length === 0) {
        toast.error(pick('কমপক্ষে একটি বিভাগের বিষয় নির্বাচন করুন।', 'Please select at least one department subject.'));
        return;
      }

      try {
        await Promise.all(
          entries.map((item) => {
            const matchedAssignment = assignments.find(
              (a) =>
                a.classSubjectId === item.data.classSubjectId &&
                (!item.data.staffId || a.staffId === item.data.staffId)
            );

            return createRoutine({
              academicYearId: year.id,
              classId: schoolClass.id,
              sectionId: effectiveSectionId,
              groupId: item.group?.id,
              classSubjectId: item.data.classSubjectId,
              staffId: item.data.staffId || undefined,
              teacherAssignmentId: matchedAssignment?.id || undefined,
              day: form.day,
              periodNumber: form.periodNumber,
              periodName: pick(clock.labelBn, clock.labelEn),
              startTime: clock.startTime,
              endTime: clock.endTime,
              room: item.data.room.trim() || undefined,
              isBreak: false,
            }).unwrap();
          })
        );

        toast.success(
          pick('বিভাগভিত্তিক পিরিয়ডগুলো সফলভাবে রুটিনে যুক্ত হয়েছে।', 'Departmental periods added to routine successfully.')
        );
        setComposerOpen(false);
      } catch (err: any) {
        const msg =
          err?.data?.message ||
          err?.message ||
          pick('পিরিয়ড বসানো যায়নি। শিক্ষক বা রুম কনফ্লিক্ট হতে পারে।', 'Could not add departmental periods due to conflict.');
        toast.error(msg);
      }
      return;
    }

    // Edit / Update existing routine slot
    if (editingRoutineId) {
      if (!form.isBreak && !form.classSubjectId) {
        toast.error(pick('পাঠদানের বিষয় নির্বাচন করুন।', 'Please select a subject.'));
        return;
      }

      try {
        const matchedAssignment = assignments.find(
          (a) =>
            a.classSubjectId === form.classSubjectId &&
            (!form.staffId || a.staffId === form.staffId)
        );

        await updateRoutine({
          id: editingRoutineId,
          academicYearId: year.id,
          classId: editingSlot?.class?.id || editingSlot?.classId || schoolClass.id,
          sectionId: editingSlot?.section?.id || editingSlot?.sectionId || effectiveSectionId,
          groupId: usesGroup && form.groupId ? form.groupId : undefined,
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
          pick('ক্লাস রুটিন পিরিয়ড সফলভাবে আপডেট করা হয়েছে।', 'Routine period updated successfully.')
        );
        setComposerOpen(false);
        setEditingRoutineId(null);
        setEditingSlot(null);
      } catch (err: any) {
        const msg =
          err?.data?.message ||
          err?.message ||
          pick('রুটিন আপডেট করা যায়নি।', 'Could not update the period.');
        toast.error(msg);
      }
      return;
    }

    // Single / Common Slot Submission
    if (!form.isBreak && !form.classSubjectId) {
      toast.error(pick('পাঠদানের বিষয় নির্বাচন করুন।', 'Please select a subject.'));
      return;
    }

    try {
      const matchedAssignment = assignments.find(
        (a) =>
          a.classSubjectId === form.classSubjectId &&
          (!form.staffId || a.staffId === form.staffId)
      );

      await createRoutine({
        academicYearId: year.id,
        classId: schoolClass.id,
        sectionId: effectiveSectionId,
        groupId: undefined,
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

  // Helper for group short tag
  const getGroupShortTag = (slot: any) => {
    const grp = slot.group || (slot.groupId ? groupList.find((g) => g.id === slot.groupId) : null);
    if (!grp) return null;

    const gName = grp.name || '';
    if (gName === 'Science') {
      return (
        <span className="font-bold text-[11px] text-sky-600 dark:text-sky-400 shrink-0" title="বিজ্ঞান বিভাগ">
          [বি]
        </span>
      );
    }
    if (gName === 'Humanities') {
      return (
        <span className="font-bold text-[11px] text-purple-600 dark:text-purple-400 shrink-0" title="মানবিক বিভাগ">
          [মা]
        </span>
      );
    }
    if (gName === 'Business Studies') {
      return (
        <span className="font-bold text-[11px] text-amber-600 dark:text-amber-400 shrink-0" title="ব্যবসায় শিক্ষা বিভাগ">
          [বা]
        </span>
      );
    }

    const initial = (grp.nameBn || grp.name || '').charAt(0);
    return (
      <span className="font-bold text-[11px] text-muted-foreground shrink-0">
        [{initial}]
      </span>
    );
  };

  const renderSectionCell = (day: WeekDay, period: number) => {
    const cellSlots = slots.filter((item) => item.day === day && item.periodNumber === period);

    if (cellSlots.length === 0) {
      return (
        <td
          key={period}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void onDrop(day, period);
          }}
          className="p-2 align-top border-r border-border/50 last:border-r-0 group"
        >
          <button
            type="button"
            onClick={() => openQuickAdd(day, period)}
            className="w-full min-h-[72px] rounded-[var(--radius)] border border-dashed border-transparent group-hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center text-xs text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer no-print"
            title={pick('এই পিরিয়ডে ক্লাস যুক্ত করুন', 'Add period here')}
          >
            <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="group-hover:hidden">—</span>
          </button>
          <span className="hidden print:inline text-muted-foreground">—</span>
        </td>
      );
    }

    // Break slot
    if (cellSlots.length === 1 && cellSlots[0].isBreak) {
      const slot = cellSlots[0];
      return (
        <td
          key={period}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void onDrop(day, period);
          }}
          className="p-2 align-top border-r border-border/50 last:border-r-0"
        >
          <div
            onClick={() => openEditModal(slot)}
            className="rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/10 p-2.5 cursor-pointer hover:border-amber-500/70 hover:shadow-xs transition-all"
            title={pick('বিরতি / টিফিন সম্পাদনা করতে ক্লিক করুন', 'Click to edit break / tiffin')}
          >
            <div className="flex items-start justify-between gap-1">
              <p className="font-semibold text-amber-700 dark:text-amber-300 text-xs leading-snug">
                {slot.periodName || pick('বিরতি / টিফিন', 'Break / Tiffin')}
              </p>
              <div className="inline-flex items-center gap-0.5 shrink-0 no-print">
                <button
                  type="button"
                  className="p-1 rounded text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                  aria-label={pick('পিরিয়ড সম্পাদনা করুন', 'Edit period')}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(slot);
                  }}
                  title={pick('সম্পাদনা / পরিবর্তন', 'Edit period')}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <span
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setDragRoutineId(slot.id);
                  }}
                  className="cursor-grab active:cursor-grabbing p-0.5 rounded text-amber-700/60 dark:text-amber-300/60 hover:bg-amber-500/20"
                  title={pick('স্থান পরিবর্তন করতে ড্র্যাগ করুন', 'Drag to reschedule')}
                >
                  <GripVertical className="w-3 h-3" />
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {periodClock(slot.periodNumber).timeBn}
            </p>
          </div>
        </td>
      );
    }

    // MULTI-GROUP PARALLEL SLOTS OR SINGLE GROUP SLOT
    const hasGroup = cellSlots.some((s) => s.group || s.groupId);

    if (hasGroup || cellSlots.length > 1) {
      return (
        <td
          key={period}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void onDrop(day, period);
          }}
          className="p-2 align-top border-r border-border/50 last:border-r-0"
        >
          <div
            onClick={() => openEditModal(cellSlots[0])}
            className="rounded-[var(--radius)] border border-border/70 bg-background p-1.5 transition-colors shadow-xs cursor-pointer hover:border-primary/50"
            title={pick('পিরিয়ড সম্পাদনা করতে ক্লিক করুন', 'Click to edit period')}
          >
            <div className="divide-y divide-border/40">
              {cellSlots.map((slot) => {
                const subjectName = resolveSubjectName(slot);
                const teacherName = resolveTeacherName(slot);
                const roomDisplay = cleanRoom(slot.room);

                return (
                  <div
                    key={slot.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(slot);
                    }}
                    className="group/item flex items-center justify-between gap-1 py-1 px-1 rounded-sm cursor-pointer hover:bg-primary/10 transition-colors"
                    title={pick(
                      `${subjectName} — শিক্ষক: ${teacherName}${roomDisplay ? ` (${roomDisplay})` : ''} [ক্লিক করে সম্পাদনা করুন]`,
                      `${subjectName} — Teacher: ${teacherName}${roomDisplay ? ` (${roomDisplay})` : ''} [Click to edit]`
                    )}
                  >
                    {/* Left: Group Tag + Subject Name + (Teacher Name) beside it */}
                    <div className="flex items-center gap-1 min-w-0">
                      {getGroupShortTag(slot)}
                      <span
                        className="font-semibold text-foreground text-xs leading-none truncate group-hover/item:text-primary transition-colors"
                        title={subjectName}
                      >
                        {subjectName}
                      </span>
                      {teacherName && teacherName !== '—' && (
                        <span
                          className="text-[11px] text-muted-foreground leading-none truncate shrink-0 max-w-[100px]"
                          title={teacherName}
                        >
                          ({teacherName})
                        </span>
                      )}
                    </div>

                    {/* Right: Clean Short Room Number */}
                    {roomDisplay && (
                      <span className="text-[10px] font-medium text-muted-foreground shrink-0 tabular-nums">
                        {roomDisplay}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick action to add missing department to this period */}
            {usesGroup && cellSlots.length < 3 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openQuickAdd(day, period);
                }}
                className="mt-1 w-full py-0.5 text-[9px] text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 border-t border-dashed border-border/40 cursor-pointer no-print"
                title={pick('অন্য বিভাগ যুক্ত করুন', 'Add another department')}
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{pick('বিভাগ যোগ', '+ Add')}</span>
              </button>
            )}
          </div>
        </td>
      );
    }

    // SINGLE COMMON CLASS SLOT (No groups involved)
    const slot = cellSlots[0];
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
        className="p-2 align-top border-r border-border/50 last:border-r-0"
      >
        <div
          onClick={() => openEditModal(slot)}
          className="rounded-[var(--radius)] border border-border/70 bg-background p-2.5 cursor-pointer hover:border-primary hover:bg-primary/[0.03] hover:shadow-xs transition-all group"
          title={pick('রুটিন পিরিয়ড সম্পাদনা করতে ক্লিক করুন', 'Click to edit routine period')}
        >
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-foreground text-xs leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {subjectName}
            </p>
            <span className="inline-flex items-center gap-0.5 shrink-0 no-print">
              <button
                type="button"
                className="p-0.5 rounded text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                aria-label={pick('পিরিয়ড সম্পাদনা করুন', 'Edit period')}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(slot);
                }}
                title={pick('সম্পাদনা / পরিবর্তন', 'Edit period')}
              >
                <Pencil className="w-3 h-3" />
              </button>
              <span
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDragRoutineId(slot.id);
                }}
                className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-surface-muted"
                title={pick('স্থান পরিবর্তন করতে ড্র্যাগ করুন', 'Drag to reschedule')}
              >
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{teacherName}</p>
          <p className="text-xs text-primary font-medium tabular-nums mt-0.5">{cleanRoom(slot.room) || '—'}</p>
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
    const grp = slot.group || (slot.groupId ? groupList.find((g) => g.id === slot.groupId) : null);
    const grpLabel = grp ? (locale === 'bn' ? grp.nameBn || grp.name : grp.name) : null;

    return (
      <td key={period} className="p-2.5 align-top border-r border-border/50 last:border-r-0">
        <div
          onClick={() => openEditModal(slot)}
          className="rounded-[var(--radius)] border border-primary/25 bg-primary/[0.04] p-2.5 shadow-xs cursor-pointer hover:border-primary hover:bg-primary/[0.08] hover:shadow-xs transition-all"
          title={pick('রুটিন সম্পাদনা করতে ক্লিক করুন', 'Click to edit routine')}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="font-semibold text-foreground text-xs leading-snug line-clamp-1">
              {slot.isBreak ? pick('বিরতি', 'Break') : subName}
            </p>
            {grpLabel && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                {grpLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-primary font-medium truncate">
            {clsName} ({secName})
          </p>
          <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{cleanRoom(slot.room) || '—'}</p>
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-5">
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
            {/* Draft / Publish Toggle Pill (matching user design with primary green active color) */}
            <div className="inline-flex items-center p-0.5 rounded-full border border-border bg-surface-muted/80 shadow-xs no-print">
              <button
                type="button"
                onClick={() => handleToggleStatus('DRAFT')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer',
                  routineStatus === 'DRAFT'
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={pick('ড্রাফট মোডে রাখুন', 'Set routine to draft mode')}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{pick('ড্রাফট', 'Draft')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus('PUBLISHED')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer',
                  routineStatus === 'PUBLISHED'
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={pick('সবার জন্য প্রকাশ করুন', 'Publish routine for everyone')}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{pick('প্রকাশিত', 'Publish')}</span>
              </button>
            </div>

            {viewMode === 'section' && (
              <Button variant="primary" size="sm" onClick={() => openQuickAdd(WeekDay.SUNDAY, 1)}>
                <Plus className="w-4 h-4" />
                {pick('পিরিয়ড যুক্ত করুন', 'Add period')}
              </Button>
            )}
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
                  usesGroup
                    ? 'ক্লাস ৯–১০ এর ক্ষেত্রে বিভাগভিত্তিক পিরিয়ডে বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা একই বক্সে আলাদা কার্ডে প্রদর্শিত হয়।'
                    : 'টিপস: যেকোনো পিরিয়ড ড্র্যাগ করে অন্য ঘরে সরানো যাবে অথবা খালি ঘরে ক্লিক করে সরাসরি ক্লাস বসানো যাবে।',
                  usesGroup
                    ? 'For Classes 9–10, departmental periods (Science, Humanities, Business) are neatly shown together in the same period box.'
                    : 'Tip: Drag any period card to reschedule, or click an empty cell to add a class.'
                )
              : pick(
                  'প্রতিটি শিক্ষকের সাপ্তাহিক পাঠদান ও অবসর সময়সূচি (শূন্য কনফ্লিক্ট)।',
                  'Weekly class load and free periods per teacher (zero double-booking).'
                )}
          </p>
        </div>
      </Card>

      {/* Add / Update Period Modal */}
      <Modal
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setEditingRoutineId(null);
          setEditingSlot(null);
        }}
        title={
          editingRoutineId
            ? pick('রুটিন পিরিয়ড আপডেট করুন', 'Update Routine Period')
            : pick('রুটিনে নতুন পিরিয়ড বসান', 'Schedule Routine Period')
        }
        description={
          editingRoutineId
            ? pick(
                'নির্বাচিত পিরিয়ডের বিষয়, শিক্ষক, কক্ষ বা সময় পরিবর্তন করুন।',
                'Update subject, teacher, room, or timing for this period.'
              )
            : pick(
                'সরাসরি নির্বাচিত শ্রেণির রুটিনে নতুন পিরিয়ড যুক্ত করুন।',
                'Add a subject period directly to the active section routine.'
              )
        }
        size="lg"
      >
        <form onSubmit={onAdd} className="space-y-4">
          {/* Selected Section Header Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shadow-xs uppercase">
                {section?.name || 'ক'}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {pick('নির্বাচিত শ্রেণি ও শাখা', 'SELECTED SECTION')}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {locale === 'bn' ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name} · {pick('শাখা', 'Section')} {section?.name || 'ক'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                {pick('ডিফল্ট কক্ষ', 'Default Room')}
              </p>
              <p className="text-xs font-semibold text-foreground">
                {cleanRoom(form.room) || 'রুম ২০১'}
              </p>
            </div>
          </div>

          {/* Mode Tabs for Classes 9 & 10 (Only shown when creating a new routine slot) */}
          {usesGroup && !editingRoutineId && (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-muted/80 border border-border">
              <button
                type="button"
                onClick={() => setRoutineType('single')}
                className={cn(
                  'py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center',
                  routineType === 'single'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {pick('একক / সাধারণ বিষয়', 'Single / Common Subject')}
              </button>
              <button
                type="button"
                onClick={() => setRoutineType('group')}
                className={cn(
                  'py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5',
                  routineType === 'group'
                    ? 'bg-background text-primary shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                {pick('বিভাগভিত্তিক (বিজ্ঞান + মানবিক + ব্যবসায়)', '3-Group Elective (Sci + Arts + Com)')}
              </button>
            </div>
          )}

          {/* Department Selector when editing a Class 9/10 slot */}
          {usesGroup && editingRoutineId && (
            <FormField label={pick('বিভাগ (গ্রুপ)', 'Department / Group')}>
              <Select
                value={form.groupId}
                onChange={(event) => {
                  const nextGId = event.target.value;
                  setForm({ ...form, groupId: nextGId, classSubjectId: '' });
                }}
              >
                <option value="">{pick('সাধারণ (সকলের জন্য সমবেত)', 'General / Common for All')}</option>
                {groupList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {locale === 'bn' ? g.nameBn || g.name : g.name}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {/* Schedule Timing (Day & Period) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={pick('সপ্তাহের বার *', 'Day of Week *')} required>
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

            <FormField label={pick('সময় / পিরিয়ড *', 'Time / Period *')} required>
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
          </div>

          {/* SINGLE / COMMON SUBJECT VIEW */}
          {(routineType === 'single' || !usesGroup) && (
            <div className="space-y-3">
              {/* Break Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted/60 border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {pick('টিফিন বা সাধারণ বিরতি?', 'Break or Tiffin Slot?')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Subject */}
                  <FormField label={pick('বিষয় *', 'Subject *')} required>
                    <Select
                      value={form.classSubjectId}
                      onChange={(event) => {
                        const nextCsId = event.target.value;
                        const matchAssignment = assignments.find((a) => a.classSubjectId === nextCsId);
                        const rankedTeachers = getTeachersForSubject(nextCsId);
                        setForm({
                          ...form,
                          classSubjectId: nextCsId,
                          staffId: matchAssignment?.staffId || rankedTeachers[0]?.id || form.staffId,
                        });
                      }}
                    >
                      <option value="">{pick('বিষয় বাছাই করুন', 'Select Subject')}</option>
                      {selectableSubjects.map((cs) => {
                        const subName = cs.subject?.name || (db?.subjects ?? []).find((s) => s.id === cs.subjectId)?.name || '—';
                        const grp = cs.group || (cs.groupId ? groupList.find((g) => g.id === cs.groupId) : null);
                        const grpTag = grp ? ` [${locale === 'bn' ? grp.nameBn || grp.name : grp.name}]` : '';

                        return (
                          <option key={cs.id} value={cs.id}>
                            {subName}{grpTag} {cs.isOptional ? `(${pick('ঐচ্ছিক', 'Optional')})` : ''}
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
                      {(() => {
                        const list = getTeachersForSubject(form.classSubjectId);
                        if (form.staffId && !list.some((t) => t.id === form.staffId)) {
                          const matchedTeacher = teachers.find((t) => t.id === form.staffId) || {
                            id: form.staffId,
                            name: editingSlot?.teacher?.name || 'নির্ধারিত শিক্ষক',
                            designation: editingSlot?.teacher?.designation || pick('শিক্ষক', 'Teacher'),
                          };
                          return [matchedTeacher as any, ...list];
                        }
                        return list;
                      })().map((t) => {
                        const isAssigned = assignments.some(
                          (a) => a.classSubjectId === form.classSubjectId && a.staffId === t.id
                        );
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} {isAssigned ? '★ [নির্ধারিত শিক্ষক]' : ''} ({t.designation || pick('শিক্ষক', 'Teacher')})
                          </option>
                        );
                      })}
                    </Select>
                  </FormField>

                  {/* Room */}
                  <FormField label={pick('কক্ষ নম্বর *', 'Room / Lab *')}>
                    <Input
                      value={form.room}
                      onChange={(event) => setForm({ ...form, room: event.target.value })}
                      placeholder={pick('রুম ২০১', 'Room 201')}
                    />
                  </FormField>
                </div>
              )}
            </div>
          )}

          {/* 3-GROUP ELECTIVE VIEW (Classes 9 & 10) */}
          {usesGroup && routineType === 'group' && (
            <div className="space-y-3.5">
              {/* Info Alert */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                <Lightbulb className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p>
                  {pick(
                    'বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা বিভাগের শিক্ষার্থীরা একই সময়ে নিজ নিজ কক্ষে আলাদা বিষয়ে ক্লাসে অংশ নেবে।',
                    'Science, Arts, and Commerce students will attend their respective elective subjects simultaneously in separate rooms.'
                  )}
                </p>
              </div>

              {/* 1. Science Group Card */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white tracking-wide">
                    {pick('বিজ্ঞান বিভাগ (SCIENCE GROUP)', 'SCIENCE GROUP')}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {scienceSubjects.length} {pick('টি বিষয় উপলব্ধ', 'Subjects Available')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <FormField label={pick('বিষয় *', 'Subject *')} required>
                    <Select
                      value={groupForm.science.classSubjectId}
                      onChange={(e) => {
                        const nextCs = e.target.value;
                        const matchAssigned = assignments.find((a) => a.classSubjectId === nextCs);
                        const rankedTeachers = getTeachersForSubject(nextCs);
                        setGroupForm({
                          ...groupForm,
                          science: {
                            ...groupForm.science,
                            classSubjectId: nextCs,
                            staffId: matchAssigned?.staffId || rankedTeachers[0]?.id || groupForm.science.staffId,
                          },
                        });
                      }}
                    >
                      <option value="">{pick('বিষয় নির্বাচন করুন', 'Select Subject')}</option>
                      {scienceSubjects.map((cs) => {
                        const subName = cs.subject?.name || (db?.subjects ?? []).find((s) => s.id === cs.subjectId)?.name || '—';
                        return (
                          <option key={cs.id} value={cs.id}>
                            {subName} {cs.isOptional ? `(${pick('ঐচ্ছিক', 'Optional')})` : ''}
                          </option>
                        );
                      })}
                    </Select>
                  </FormField>

                  <FormField label={pick('শিক্ষক', 'Teacher')}>
                    <Select
                      value={groupForm.science.staffId}
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          science: { ...groupForm.science, staffId: e.target.value },
                        })
                      }
                    >
                      <option value="">{pick('শিক্ষক বাছাই করুন', 'Select Teacher')}</option>
                      {getTeachersForSubject(groupForm.science.classSubjectId).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.designation || pick('শিক্ষক', 'Teacher')})
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label={pick('কক্ষ / ল্যাব *', 'Room / Lab *')}>
                    <Input
                      value={groupForm.science.room}
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          science: { ...groupForm.science, room: e.target.value },
                        })
                      }
                      placeholder={pick('পদার্থবিজ্ঞান ল্যাব', 'Physics Lab')}
                    />
                  </FormField>
                </div>
              </div>

              {/* 2. Humanities / Arts Group Card */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.03] dark:bg-amber-500/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white tracking-wide">
                    {pick('মানবিক বিভাগ (HUMANITIES / ARTS GROUP)', 'ARTS / HUMANITIES GROUP')}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {humanitiesSubjects.length} {pick('টি বিষয় উপলব্ধ', 'Subjects Available')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <FormField label={pick('বিষয় *', 'Subject *')} required>
                    <Select
                      value={groupForm.humanities.classSubjectId}
                      onChange={(e) => {
                        const nextCs = e.target.value;
                        const matchAssigned = assignments.find((a) => a.classSubjectId === nextCs);
                        const rankedTeachers = getTeachersForSubject(nextCs);
                        setGroupForm({
                          ...groupForm,
                          humanities: {
                            ...groupForm.humanities,
                            classSubjectId: nextCs,
                            staffId: matchAssigned?.staffId || rankedTeachers[0]?.id || groupForm.humanities.staffId,
                          },
                        });
                      }}
                    >
                      <option value="">{pick('বিষয় নির্বাচন করুন', 'Select Subject')}</option>
                      {humanitiesSubjects.map((cs) => {
                        const subName = cs.subject?.name || (db?.subjects ?? []).find((s) => s.id === cs.subjectId)?.name || '—';
                        return (
                          <option key={cs.id} value={cs.id}>
                            {subName} {cs.isOptional ? `(${pick('ঐচ্ছিক', 'Optional')})` : ''}
                          </option>
                        );
                      })}
                    </Select>
                  </FormField>

                  <FormField label={pick('শিক্ষক', 'Teacher')}>
                    <Select
                      value={groupForm.humanities.staffId}
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          humanities: { ...groupForm.humanities, staffId: e.target.value },
                        })
                      }
                    >
                      <option value="">{pick('শিক্ষক বাছাই করুন', 'Select Teacher')}</option>
                      {getTeachersForSubject(groupForm.humanities.classSubjectId).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.designation || pick('শিক্ষক', 'Teacher')})
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label={pick('কক্ষ / ল্যাব *', 'Room / Lab *')}>
                    <Input
                      value={groupForm.humanities.room}
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          humanities: { ...groupForm.humanities, room: e.target.value },
                        })
                      }
                      placeholder={pick('রুম ২০৮', 'Room 208')}
                    />
                  </FormField>
                </div>
              </div>

              {/* 3. Commerce / Business Studies Group Card */}
              <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/[0.03] dark:bg-sky-500/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-sky-600 text-white tracking-wide">
                    {pick('ব্যবসায় শিক্ষা বিভাগ (COMMERCE / BUSINESS STUDIES GROUP)', 'COMMERCE / BUSINESS STUDIES GROUP')}
                  </span>
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {businessSubjects.length} {pick('টি বিষয় উপলব্ধ', 'Subjects Available')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <FormField label={pick('বিষয় *', 'Subject *')} required>
                    <Select
                      value={groupForm.business.classSubjectId}
                      onChange={(e) => {
                        const nextCs = e.target.value;
                        const matchAssigned = assignments.find((a) => a.classSubjectId === nextCs);
                        const rankedTeachers = getTeachersForSubject(nextCs);
                        setGroupForm({
                          ...groupForm,
                          business: {
                            ...groupForm.business,
                            classSubjectId: nextCs,
                            staffId: matchAssigned?.staffId || rankedTeachers[0]?.id || groupForm.business.staffId,
                          },
                        });
                      }}
                    >
                      <option value="">{pick('বিষয় নির্বাচন করুন', 'Select Subject')}</option>
                      {businessSubjects.map((cs) => {
                        const subName = cs.subject?.name || (db?.subjects ?? []).find((s) => s.id === cs.subjectId)?.name || '—';
                        return (
                          <option key={cs.id} value={cs.id}>
                            {subName} {cs.isOptional ? `(${pick('ঐচ্ছিক', 'Optional')})` : ''}
                          </option>
                        );
                      })}
                    </Select>
                  </FormField>

                  <FormField label={pick('শিক্ষক', 'Teacher')}>
                    <Select
                      value={groupForm.business.staffId}
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          business: { ...groupForm.business, staffId: e.target.value },
                        })
                      }
                    >
                      <option value="">{pick('শিক্ষক বাছাই করুন', 'Select Teacher')}</option>
                      {getTeachersForSubject(groupForm.business.classSubjectId).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.designation || pick('শিক্ষক', 'Teacher')})
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label={pick('কক্ষ / ল্যাব *', 'Room / Lab *')}>
                    <Input
                      value={groupForm.business.room}
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          business: { ...groupForm.business, room: e.target.value },
                        })
                      }
                      placeholder={pick('রুম ২০৯', 'Room 209')}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-border">
            {editingRoutineId ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm(pick('আপনি কি নিশ্চিত যে এই পিরিয়ডটি মুছে ফেলতে চান?', 'Are you sure you want to delete this period?'))) {
                    void onRemove(editingRoutineId);
                    setComposerOpen(false);
                    setEditingRoutineId(null);
                    setEditingSlot(null);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {pick('পিরিয়ড মুছুন', 'Delete')}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setComposerOpen(false);
                  setEditingRoutineId(null);
                  setEditingSlot(null);
                }}
              >
                {pick('বাতিল', 'Cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={adding}>
                <Check className="w-4 h-4 mr-1" />
                {adding
                  ? pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                  : editingRoutineId
                  ? pick('আপডেট সংরক্ষণ করুন', 'Update Period')
                  : pick('রুটিনে যুক্ত করুন', 'Save to Routine')}
              </Button>
            </div>
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

      {/* Weekly Grid */}
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
                  {pick('০১:০০–০২:০০', '01:00–02:00')}
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
                      <span className="tabular-nums">{pick('১ ঘণ্টা', '60m')}</span>
                    </div>
                  </td>
                )}
                {[4, 5].map((p) =>
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
