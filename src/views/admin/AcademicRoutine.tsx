'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Clock, GripVertical, Printer, Trash2, Users } from 'lucide-react';
import {
  useAddClassRoutineMutation,
  useMoveClassRoutineSlotMutation,
  useRemoveClassRoutineMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { getTodayWeekDay, PERIOD_META, periodClock, SCHOOL_DAYS } from '@/src/lib/classRoutine';
import { triggerPrint } from '@/src/lib/utils/cn';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, FormField, Input, Modal, Select } from '@/src/components/ui/primitives';
import type { AcademicYear } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { WeekDay } from '@/src/types/enums';

const DAY_LABEL = {
  [WeekDay.SUNDAY]: ['রবিবার', 'Sunday'],
  [WeekDay.MONDAY]: ['সোমবার', 'Monday'],
  [WeekDay.TUESDAY]: ['মঙ্গলবার', 'Tuesday'],
  [WeekDay.WEDNESDAY]: ['বুধবার', 'Wednesday'],
  [WeekDay.THURSDAY]: ['বৃহস্পতিবার', 'Thursday'],
} as const;

export function AcademicRoutine({ db, year }: { db: MockDatabase; year: AcademicYear }) {
  const { locale, pick } = useI18n();
  const [addRoutine, { isLoading: adding }] = useAddClassRoutineMutation();
  const [moveRoutine] = useMoveClassRoutineSlotMutation();
  const [removeRoutine] = useRemoveClassRoutineMutation();
  const [classId, setClassId] = useState('cls-10');
  const [sectionId, setSectionId] = useState('sec-10-ka');
  const [dragRoutineId, setDragRoutineId] = useState<string | null>(null);
  const [form, setForm] = useState({
    teacherAssignmentId: '',
    day: WeekDay.SUNDAY,
    periodNumber: 1,
    room: 'রুম ২০১',
  });
  const [composerOpen, setComposerOpen] = useState(false);

  const schoolClass = db.classes.find((item) => item.id === classId) ?? db.classes[0];
  const sections = db.sections.filter((section) => section.isActive && section.classId === schoolClass?.id);
  const effectiveSectionId = sections.some((section) => section.id === sectionId) ? sectionId : sections[0]?.id ?? '';
  const section = sections.find((item) => item.id === effectiveSectionId);
  const classTeacherRow = db.sectionClassTeachers.find(
    (row) => row.sectionId === effectiveSectionId && row.academicYearId === year.id
  );
  const classTeacher = classTeacherRow ? db.staff.find((member) => member.id === classTeacherRow.staffId) : null;
  const today = getTodayWeekDay();
  const slots = db.classRoutines.filter(
    (slot) => slot.academicYearId === year.id && slot.sectionId === effectiveSectionId
  );
  const assignments = db.teacherAssignments.filter(
    (item) => item.isActive && item.academicYearId === year.id && item.sectionId === effectiveSectionId
  );
  const selectedAssignment = assignments.some((item) => item.id === form.teacherAssignmentId)
    ? form.teacherAssignmentId
    : '';

  const className = locale === 'bn' ? schoolClass?.nameBn || schoolClass?.name : schoolClass?.name;
  const schoolName = locale === 'bn' ? db.schoolProfile.name : db.schoolProfile.nameEn;

  const assignmentLabel = (id: string) => {
    const assignment = db.teacherAssignments.find((item) => item.id === id);
    const classSubject = assignment ? db.classSubjects.find((item) => item.id === assignment.classSubjectId) : null;
    const subject = classSubject ? db.subjects.find((item) => item.id === classSubject.subjectId) : null;
    const teacher = assignment ? db.staff.find((item) => item.id === assignment.staffId) : null;
    const subjectName = locale === 'bn' ? subject?.nameBn || subject?.name : subject?.name;
    return `${subjectName ?? '—'} — ${teacher?.name ?? '—'}`;
  };

  const chooseClass = (nextClassId: string) => {
    const nextSection = db.sections.find((section) => section.isActive && section.classId === nextClassId);
    setClassId(nextClassId);
    setSectionId(nextSection?.id ?? '');
    setForm((prev) => ({ ...prev, teacherAssignmentId: '' }));
  };

  const chooseSection = (nextSectionId: string) => {
    const nextAssignment = db.teacherAssignments.find(
      (item) => item.isActive && item.academicYearId === year.id && item.sectionId === nextSectionId
    );
    setSectionId(nextSectionId);
    setForm((prev) => ({ ...prev, teacherAssignmentId: nextAssignment?.id ?? '' }));
  };

  const onAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const assignment = assignments.find((item) => item.id === selectedAssignment);
    if (!assignment || !effectiveSectionId) {
      toast.error(pick('এই শাখায় আগে বিষয় শিক্ষক বসান।', 'Assign a subject teacher for this section first.'));
      return;
    }
    const clock = periodClock(form.periodNumber);
    try {
      await addRoutine({
        academicYearId: year.id,
        teacherAssignmentId: assignment.id,
        staffId: assignment.staffId,
        sectionId: effectiveSectionId,
        day: form.day,
        periodNumber: form.periodNumber,
        startTime: clock.startTime,
        endTime: clock.endTime,
        room: form.room.trim() || '—',
      }).unwrap();
      toast.success(pick('ক্লাস রুটিনে পিরিয়ড সফলভাবে যুক্ত হয়েছে।', 'Routine period added successfully.'));
      setComposerOpen(false);
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? pick('পিরিয়ড বসানো যায়নি।', 'Could not add the period.'));
    }
  };

  const onRemove = async (id: string) => {
    try {
      await removeRoutine({ id }).unwrap();
      toast.success(pick('পিরিয়ড মুছে ফেলা হয়েছে।', 'Period removed.'));
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? pick('পিরিয়ড মোছা যায়নি।', 'Could not remove the period.'));
    }
  };

  const onDrop = async (day: WeekDay, periodNumber: number) => {
    if (!dragRoutineId) return;
    try {
      await moveRoutine({ routineId: dragRoutineId, targetDay: day, targetPeriodNumber: periodNumber }).unwrap();
      toast.success(pick('রুটিন পিরিয়ড সফলভাবে স্থানান্তরিত হয়েছে।', 'Period moved successfully.'));
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? pick('এই ঘরে পিরিয়ড সরানো যায়নি।', 'Could not move the period.'));
    } finally {
      setDragRoutineId(null);
    }
  };

  const renderCell = (day: WeekDay, period: number) => {
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
          className="p-3.5 text-sm text-muted-foreground/60 align-top border border-dashed border-transparent hover:border-primary/40"
        >
          —
        </td>
      );
    }
    const assignment = db.teacherAssignments.find((item) => item.id === slot.teacherAssignmentId);
    const classSubject = assignment ? db.classSubjects.find((item) => item.id === assignment.classSubjectId) : null;
    const subject = classSubject ? db.subjects.find((item) => item.id === classSubject.subjectId) : null;
    const teacher = db.staff.find((item) => item.id === slot.staffId);
    return (
      <td
        key={period}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void onDrop(day, period);
        }}
        className="p-3.5 align-top"
      >
        <div draggable onDragStart={() => setDragRoutineId(slot.id)} className="cursor-grab active:cursor-grabbing">
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-foreground text-sm">
              {locale === 'bn' ? subject?.nameBn || subject?.name : subject?.name}
            </p>
            <span className="inline-flex items-center gap-0.5 no-print">
              <button
                type="button"
                className="p-0.5 rounded text-muted-foreground hover:text-destructive"
                aria-label={pick('পিরিয়ড মুছুন', 'Remove period')}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onRemove(slot.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{teacher?.name}</p>
          <p className="text-xs text-primary font-medium tabular-nums mt-1">{slot.room}</p>
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-md">
          <Select value={schoolClass?.id ?? ''} onChange={(event) => chooseClass(event.target.value)}>
            {db.classes.map((item) => (
              <option key={item.id} value={item.id}>
                {locale === 'bn' ? item.nameBn || item.name : item.name}
              </option>
            ))}
          </Select>
          <Select value={effectiveSectionId} onChange={(event) => chooseSection(event.target.value)}>
            {sections.map((item) => (
              <option key={item.id} value={item.id}>
                {pick('শাখা:', 'Section:')} {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">{pick('শ্রেণিশিক্ষক:', 'Class Teacher:')}</span>
            <span className="font-semibold text-foreground">
              {classTeacher ? classTeacher.name : pick('নির্ধারিত হয়নি', 'Not assigned')}
            </span>
          </div>
          <div className="flex items-center gap-2 tabular-nums">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">{pick('সমাবেশ:', 'Assembly:')}</span>
            <span className="font-semibold text-foreground">{pick('সকাল ৯:৪৫', '9:45 AM')}</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setComposerOpen(true)}>
            {pick('পিরিয়ড যুক্ত করুন', 'Add period')}
          </Button>
          <Button variant="outline" size="sm" onClick={triggerPrint}>
            <Printer className="w-4 h-4" />
            {pick('রুটিন প্রিন্ট করুন', 'Print Routine')}
          </Button>
        </div>
      </Card>

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title={pick('পিরিয়ড বসান', 'Add a period')}
        description={pick(
          'সময় পাবলিক রুটিনের ঘণ্টার সাথে মিলবে। একই সময়ে একই শিক্ষক, শাখা বা রুম দুবার বসবে না।',
          'The time matches the public timetable bells. The same teacher, section, or room cannot be booked twice.'
        )}
      >
        <form onSubmit={onAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={pick('শিক্ষক ও বিষয়', 'Teacher & Subject')}>
            <Select value={selectedAssignment} onChange={(event) => setForm({ ...form, teacherAssignmentId: event.target.value })}>
              <option value="">{pick('বণ্টন বাছুন', 'Choose an assignment')}</option>
              {assignments.map((item) => (
                <option key={item.id} value={item.id}>
                  {assignmentLabel(item.id)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('কক্ষ নং', 'Room')}>
            <Input value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} />
          </FormField>
          <FormField label={pick('বার', 'Day')}>
            <Select value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value as WeekDay })}>
              {SCHOOL_DAYS.map((day) => (
                <option key={day} value={day}>
                  {pick(DAY_LABEL[day][0], DAY_LABEL[day][1])}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={pick('পিরিয়ড', 'Period')}>
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
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setComposerOpen(false)}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={adding}>
              {pick('পিরিয়ড যুক্ত করুন', 'Add period')}
            </Button>
          </div>
        </form>
      </Modal>

      <div className="hidden print:flex items-center justify-between border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <SchoolEmblem size={44} />
          <div>
            <h1 className="text-lg font-bold text-foreground">{schoolName}</h1>
            <p className="text-xs text-muted-foreground">
              {pick(
                `সাপ্তাহিক ক্লাস রুটিন ${year.name} · ${schoolClass?.nameBn ?? ''} (শাখা: ${section?.name ?? ''})`,
                `Weekly Class Routine ${year.name} · ${schoolClass?.name ?? ''} (Section: ${section?.name ?? ''})`
              )}
            </p>
          </div>
        </div>
        {classTeacher && (
          <p className="text-xs text-muted-foreground">
            {pick('শ্রেণিশিক্ষক:', 'Class Teacher:')} {classTeacher.name}
          </p>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[780px]">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              <th className="p-3.5 border-b border-r border-border text-left font-semibold w-32">
                {pick('বার / পিরিয়ড', 'Day / Period')}
              </th>
              {PERIOD_META.slice(0, 3).map((period) => (
                <th key={period.period} className="p-3.5 border-b border-border text-left">
                  <div className="font-semibold text-foreground">{pick(period.labelBn, period.labelEn)}</div>
                  <div className="text-xs text-muted-foreground tabular-nums mt-0.5">{pick(period.timeBn, period.timeEn)}</div>
                </th>
              ))}
              <th className="p-3 border-b border-x border-border text-center bg-surface-muted/80 w-24">
                <div className="text-xs font-semibold text-primary">{pick('টিফিন বিরতি', 'Tiffin')}</div>
                <div className="text-xs text-muted-foreground tabular-nums mt-0.5">{pick('১২:১৫–১২:৪৫', '12:15–12:45')}</div>
              </th>
              <th className="p-3.5 border-b border-border text-left">
                <div className="font-semibold text-foreground">{pick(PERIOD_META[3].labelBn, PERIOD_META[3].labelEn)}</div>
                <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  {pick(PERIOD_META[3].timeBn, PERIOD_META[3].timeEn)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {SCHOOL_DAYS.map((day, dayIndex) => (
              <tr key={day} className={today === day ? 'bg-primary/5' : undefined}>
                <td className="p-3.5 font-semibold border-r border-border bg-surface-muted/30 whitespace-nowrap align-top">
                  <div className="flex flex-col gap-1">
                    <StatusBadge enumName="WeekDay" value={day} />
                    {today === day && <span className="text-xs font-semibold text-primary">{pick('আজকের দিন', 'Today')}</span>}
                  </div>
                </td>
                {renderCell(day, 1)}
                {renderCell(day, 2)}
                {renderCell(day, 3)}
                {dayIndex === 0 && (
                  <td rowSpan={SCHOOL_DAYS.length} className="p-3 border-x border-border bg-surface-muted/40 text-center align-middle">
                    <div className="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{pick('টিফিন', 'Tiffin')}</span>
                      <span className="tabular-nums">{pick('৩০ মি.', '30m')}</span>
                    </div>
                  </td>
                )}
                {renderCell(day, 4)}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
