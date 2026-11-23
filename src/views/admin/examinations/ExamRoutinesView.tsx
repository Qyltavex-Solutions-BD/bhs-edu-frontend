'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Download,
  Edit3,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useDeleteCmsItemMutation,
  useGetBootstrapQuery,
  useUpsertCmsItemMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import {
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { PrintableExamRoutine } from '@/src/components/print/PrintDocuments';
import { Button, Card, Input, Modal, Select, Textarea } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber, formatTime } from '@/src/lib/formatters';
import { cn, exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { ExamRoutineStatus } from '@/src/types/enums';
import type { ExamRoutine } from '@/src/types/entities';
import { getEnumMeta } from '@/src/lib/constants/enums';

function timesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

export function ExamRoutinesView() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [upsertCmsItem, { isLoading: saving }] = useUpsertCmsItemMutation();
  const [deleteCmsItem] = useDeleteCmsItemMutation();

  const [selectedExamId, setSelectedExamId] = useState('exam-ann-10');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<ExamRoutine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamRoutine | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

  const [form, setForm] = useState({
    examSubjectId: '',
    sectionId: '',
    examDate: '2026-11-22',
    startTime: '10:00',
    endTime: '13:00',
    roomNo: 'হল রুম ১০১',
    status: ExamRoutineStatus.SCHEDULED as ExamRoutineStatus,
    instructions: '',
  });

  const activeExams = useMemo(
    () => (db ? db.exams.filter((e) => !e.isDeleted) : []),
    [db]
  );

  const resolvedExamId =
    selectedExamId && activeExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : activeExams[0]?.id ?? '';

  const activeExam = activeExams.find((e) => e.id === resolvedExamId) ?? null;

  const examSubjects = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.examSubjects
      .filter((es) => es.examId === activeExam.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [db, activeExam]);

  const classSections = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.sections.filter((s) => s.classId === activeExam.classId);
  }, [db, activeExam]);

  const routines = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.examRoutines
      .filter((r) => !r.isDeleted && r.examId === activeExam.id)
      .filter((r) => sectionFilter === 'ALL' || !r.sectionId || r.sectionId === sectionFilter)
      .sort((a, b) => a.examDate.localeCompare(b.examDate) || a.startTime.localeCompare(b.startTime));
  }, [db, activeExam, sectionFilter]);

  // Live Schedule Conflict Detection (Same Date + Overlapping Time in same Room OR same Exam/Section)
  const conflicts = useMemo(() => {
    if (!db) return [];
    const allRoutines = db.examRoutines.filter((r) => !r.isDeleted && r.status !== ExamRoutineStatus.CANCELLED);
    const issues: Array<{ idA: string; idB: string; reasonBn: string; reasonEn: string }> = [];

    for (let i = 0; i < routines.length; i++) {
      const a = routines[i];
      if (a.status === ExamRoutineStatus.CANCELLED) continue;

      for (const b of allRoutines) {
        if (a.id >= b.id) continue;
        if (a.examDate !== b.examDate) continue;
        if (!timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

        const sameRoom = Boolean(a.roomNo?.trim() && b.roomNo?.trim() && a.roomNo.trim() === b.roomNo.trim());
        const sameExamSameSection =
          a.examId === b.examId && (!a.sectionId || !b.sectionId || a.sectionId === b.sectionId);

        if (sameRoom && a.examId !== b.examId) {
          issues.push({
            idA: a.id,
            idB: b.id,
            reasonBn: `${formatDateShort(a.examDate, 'bn')} তারিখে "${a.roomNo}" কক্ষে একাধিক পরীক্ষার সময় সাংঘর্ষিক।`,
            reasonEn: `Room "${a.roomNo}" has overlapping exams on ${formatDateShort(a.examDate, 'en')}.`,
          });
        } else if (sameExamSameSection) {
          const esA = db.examSubjects.find((x) => x.id === a.examSubjectId);
          const esB = db.examSubjects.find((x) => x.id === b.examSubjectId);
          // Different groups on the same slot (e.g., Physics vs History) are valid in NCTB!
          const differentGroups = esA?.groupId && esB?.groupId && esA.groupId !== esB.groupId;
          if (!differentGroups) {
            issues.push({
              idA: a.id,
              idB: b.id,
              reasonBn: `${formatDateShort(a.examDate, 'bn')} তারিখে একই শ্রেণিতে একাধিক বিষয়ের সময়সূচি সাংঘর্ষিক (${a.startTime}–${a.endTime})।`,
              reasonEn: `Overlapping subjects for the same class on ${formatDateShort(a.examDate, 'en')} (${a.startTime}–${a.endTime}).`,
            });
          }
        }
      }
    }
    return issues;
  }, [db, routines]);

  if (isLoading || !db) return <LoadingSkeleton rows={6} />;

  const activeClass = activeExam ? db.classes.find((c) => c.id === activeExam.classId) : null;
  const activeYear = activeExam ? db.academicYears.find((y) => y.id === activeExam.academicYearId) : null;

  const uniqueDates = useMemo(() => new Set(routines.map((r) => r.examDate)).size, [routines]);
  const coveredSubjectIds = useMemo(() => new Set(routines.map((r) => r.examSubjectId)).size, [routines]);
  const uniqueRooms = useMemo(
    () => new Set(routines.map((r) => r.roomNo?.trim()).filter(Boolean)).size,
    [routines]
  );
  const hasConflict = conflicts.length > 0;

  const openCreate = () => {
    setEditingRoutine(null);
    setForm({
      examSubjectId: examSubjects[0]?.id ?? '',
      sectionId: '',
      examDate: activeExam?.startDate.slice(0, 10) ?? '2026-11-22',
      startTime: '10:00',
      endTime: '13:00',
      roomNo: 'হল রুম ১০১',
      status: ExamRoutineStatus.SCHEDULED,
      instructions: '',
    });
    setModalOpen(true);
  };

  const openEdit = (rt: ExamRoutine) => {
    setEditingRoutine(rt);
    setForm({
      examSubjectId: rt.examSubjectId,
      sectionId: rt.sectionId ?? '',
      examDate: rt.examDate.slice(0, 10),
      startTime: rt.startTime,
      endTime: rt.endTime,
      roomNo: rt.roomNo ?? '',
      status: rt.status,
      instructions: rt.instructions ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam || !form.examSubjectId) {
      toast.error(pick('বিষয় নির্বাচন করুন।', 'Select a subject.'));
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error(pick('শেষের সময় শুরুর সময়ের পরে হতে হবে।', 'End time must be after start time.'));
      return;
    }

    await upsertCmsItem({
      collection: 'examRoutines',
      item: {
        id: editingRoutine?.id,
        examId: activeExam.id,
        examSubjectId: form.examSubjectId,
        sectionId: form.sectionId || null,
        examDate: form.examDate,
        startTime: form.startTime,
        endTime: form.endTime,
        roomNo: form.roomNo.trim() || null,
        status: form.status,
        instructions: form.instructions.trim() || null,
        isDeleted: false,
      },
    });
    toast.success(pick('পরীক্ষার রুটিন সংরক্ষিত হয়েছে।', 'Exam routine saved.'));
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCmsItem({ collection: 'examRoutines', id: deleteTarget.id });
    toast.success(pick('রুটিন এন্ট্রি মুছে ফেলা হয়েছে।', 'Routine entry deleted.'));
    setDeleteTarget(null);
  };

  const printableRows = routines.map((rt) => {
    const es = db.examSubjects.find((x) => x.id === rt.examSubjectId);
    const sub = es ? db.subjects.find((s) => s.id === es.subjectId) : null;
    const sec = rt.sectionId ? db.sections.find((s) => s.id === rt.sectionId) : null;
    return {
      id: rt.id,
      examDate: rt.examDate,
      startTime: rt.startTime,
      endTime: rt.endTime,
      subjectCode: sub?.officialCode ?? '—',
      subjectName: locale === 'bn' ? sub?.nameBn || sub?.name || '—' : sub?.name || '—',
      fullMarks: es?.fullMarks ?? 100,
      roomNo: rt.roomNo,
      sectionName: sec?.name ?? null,
      instructions: rt.instructions,
    };
  });

  const handleExportCsv = () => {
    exportToCsv(
      printableRows.map((r, i) => ({
        sl: i + 1,
        date: r.examDate,
        code: r.subjectCode,
        subject: r.subjectName,
        fullMarks: r.fullMarks,
        time: `${r.startTime} - ${r.endTime}`,
        room: r.roomNo ?? '',
      })),
      `exam-routine-${activeExam?.id ?? 'sheet'}.csv`,
      [
        { key: 'sl', label: 'Sl' },
        { key: 'date', label: 'Exam Date' },
        { key: 'code', label: 'Subject Code' },
        { key: 'subject', label: 'Subject' },
        { key: 'fullMarks', label: 'Full Marks' },
        { key: 'time', label: 'Time' },
        { key: 'room', label: 'Room / Hall' },
      ]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="পরীক্ষার রুটিন ও সময়সূচি"
        titleEn="Examination Routine & Schedule"
        subtitleBn="বিষয়ভিত্তিক তারিখ, সময় ও কক্ষ নির্ধারণ করুন। স্বয়ংক্রিয়ভাবে কক্ষ ও সময় সংঘর্ষ শনাক্ত হবে এবং প্রাতিষ্ঠানিক রুটিন প্রিন্ট করা যাবে।"
        subtitleEn="Schedule subject exam dates, rooms, and instructions with automatic clash detection and official A4 routine printing."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={routines.length === 0}
              className="whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => setPrintOpen(true)}
              disabled={routines.length === 0}
              className="whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              {pick('অফিশিয়াল রুটিন প্রিন্ট', 'Print Official Routine')}
            </Button>
            <Button onClick={openCreate} disabled={!activeExam || examSubjects.length === 0} className="whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" />
              {pick('নতুন সময়সূচি যুক্ত করুন', 'Add Schedule')}
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs text-muted-foreground mb-1">{pick('পরীক্ষা নির্বাচন করুন', 'Select Examination')}</label>
          <Select value={resolvedExamId} onChange={(e) => { setSelectedExamId(e.target.value); setSectionFilter('ALL'); }}>
            {activeExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-48">
          <label className="block text-xs text-muted-foreground mb-1">{pick('শাখা ফিল্টার', 'Section Filter')}</label>
          <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="ALL">{pick('সকল শাখা', 'All Sections')}</option>
            {classSections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {pick('শাখা', 'Section')} {sec.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('নির্ধারিত পরীক্ষার দিন', 'Scheduled Exam Days')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(uniqueDates, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {routines.length > 0
              ? pick(
                  `প্রথম পরীক্ষা ${formatDateShort(routines[0].examDate, 'bn')}`,
                  `First exam ${formatDateShort(routines[0].examDate, 'en')}`
                )
              : pick('রুটিন এন্ট্রি নেই', 'No routines entered')}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('বিষয় কভারেজ', 'Subject Coverage')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            {formatNumber(coveredSubjectIds, locale)} / {formatNumber(examSubjects.length, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `রুটিনভুক্ত ${formatNumber(coveredSubjectIds, 'bn')} · বাকি ${formatNumber(Math.max(0, examSubjects.length - coveredSubjectIds), 'bn')}`,
              `Scheduled ${coveredSubjectIds} · Remaining ${Math.max(0, examSubjects.length - coveredSubjectIds)}`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('ব্যবহৃত হল ও কক্ষ', 'Assigned Rooms & Halls')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(uniqueRooms, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `মোট রুম সংখ্যা · শাখা ${sectionFilter === 'ALL' ? 'সকল শাখা' : 'শাখা ভিত্তিক'}`,
              `Total rooms · Section: ${sectionFilter}`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('সময়সূচি ও কনফ্লিক্ট স্থিতি', 'Schedule Conflict Status')}
          </p>
          <p className={cn('mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums', hasConflict ? 'text-destructive' : 'text-success')}>
            {hasConflict ? pick('সংঘর্ষ আছে', 'Clash Detected') : pick('কনফ্লিক্ট-মুক্ত', 'Clash-Free')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {hasConflict
              ? pick(`${formatNumber(conflicts.length, 'bn')}টি সময়/কক্ষ সংঘর্ষ চিহ্নিত`, `${conflicts.length} schedule conflict(s)`)
              : pick('সব রুম ও সময় ওভারল্যাপ-মুক্ত', 'All slots verified clash-free')}
          </p>
        </Card>
      </div>

      {/* Live Conflict Detection Alert */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 text-sm space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {pick(
                `${formatNumber(conflicts.length, locale)}টি সময় বা কক্ষ সংঘর্ষ শনাক্ত হয়েছে`,
                `${conflicts.length} schedule or room conflict(s) detected`
              )}
            </span>
          </div>
          <ul className="list-disc list-inside text-xs text-foreground space-y-0.5">
            {conflicts.map((c, idx) => (
              <li key={idx}>{locale === 'bn' ? c.reasonBn : c.reasonEn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Routine Table */}
      {routines.length === 0 ? (
        <EmptyState
          title={pick('কোনো রুটিন যুক্ত করা হয়নি', 'No exam routine scheduled yet')}
          description={pick(
            'এই পরীক্ষার বিষয়গুলোর তারিখ ও সময় নির্ধারণ করতে "নতুন সময়সূচি যুক্ত করুন" বাটনে ক্লিক করুন।',
            'Add subject dates and times to publish the official exam timetable.'
          )}
          action={
            <Button onClick={openCreate} disabled={!activeExam || examSubjects.length === 0}>
              <Plus className="w-4 h-4" />
              {pick('প্রথম সময়সূচি যুক্ত করুন', 'Add First Schedule')}
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">{pick('তারিখ ও সময়', 'Date & Time')}</th>
                  <th className="px-4 py-3 text-left">{pick('বিষয় ও কোড', 'Subject & Code')}</th>
                  <th className="px-4 py-3 text-left">{pick('কক্ষ ও শাখা', 'Room & Section')}</th>
                  <th className="px-4 py-3 text-left">{pick('নির্দেশনা', 'Instructions')}</th>
                  <th className="px-4 py-3 text-center">{pick('অবস্থা', 'Status')}</th>
                  <th className="px-4 py-3 text-right">{pick('অ্যাকশন', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {routines.map((rt) => {
                  const es = db.examSubjects.find((x) => x.id === rt.examSubjectId);
                  const sub = es ? db.subjects.find((s) => s.id === es.subjectId) : null;
                  const grp = es?.groupId ? db.academicGroups.find((g) => g.id === es.groupId) : null;
                  const sec = rt.sectionId ? db.sections.find((s) => s.id === rt.sectionId) : null;
                  const hasConflict = conflicts.some((c) => c.idA === rt.id || c.idB === rt.id);

                  return (
                    <tr
                      key={rt.id}
                      className={`hover:bg-surface-muted/40 ${hasConflict ? 'bg-destructive/5' : ''}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {formatDateShort(rt.examDate, locale)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTime(rt.startTime, locale)} – {formatTime(rt.endTime, locale)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {pick('কোড:', 'Code:')} {sub?.officialCode ?? '—'} · {pick('পূর্ণমান:', 'Full:')}{' '}
                          {formatNumber(es?.fullMarks ?? 100, locale)}
                          {grp ? ` · ${locale === 'bn' ? grp.nameBn : grp.name}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <div className="font-medium text-foreground">{rt.roomNo || '—'}</div>
                        <div className="text-muted-foreground">
                          {sec ? `${pick('শাখা', 'Section')} ${sec.name}` : pick('সকল শাখা', 'All Sections')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[260px] truncate">
                        {rt.instructions || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge enumName="ExamRoutineStatus" value={rt.status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(rt)}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(rt)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
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

      {/* Upsert Routine Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingRoutine
            ? pick('রুটিন সম্পাদনা করুন', 'Edit Exam Routine Entry')
            : pick('নতুন পরীক্ষার সময়সূচি যুক্ত করুন', 'Add Exam Schedule')
        }
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{pick('বিষয় *', 'Exam Subject *')}</label>
              <Select
                value={form.examSubjectId}
                onChange={(e) => setForm({ ...form, examSubjectId: e.target.value })}
              >
                {examSubjects.map((es) => {
                  const sub = db.subjects.find((s) => s.id === es.subjectId);
                  const grp = es.groupId ? db.academicGroups.find((g) => g.id === es.groupId) : null;
                  return (
                    <option key={es.id} value={es.id}>
                      {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name} ({sub?.officialCode})
                      {grp ? ` — ${locale === 'bn' ? grp.nameBn : grp.name}` : ''}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{pick('পরীক্ষার তারিখ *', 'Exam Date *')}</label>
              <Input
                type="date"
                required
                value={form.examDate}
                onChange={(e) => setForm({ ...form, examDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{pick('শাখা (ঐচ্ছিক)', 'Section (Optional)')}</label>
              <Select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
                <option value="">{pick('সকল শাখার জন্য প্রযোজ্য', 'All Sections')}</option>
                {classSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {pick('শাখা', 'Section')} {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{pick('শুরুর সময় *', 'Start Time *')}</label>
              <Input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{pick('শেষের সময় *', 'End Time *')}</label>
              <Input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{pick('পরীক্ষার কক্ষ / হল', 'Room / Hall No.')}</label>
              <Input
                value={form.roomNo}
                onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
                placeholder={pick('যেমন: হল রুম ১০১', 'e.g. Hall Room 101')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{pick('অবস্থা', 'Status')}</label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ExamRoutineStatus })}
              >
                {Object.values(ExamRoutineStatus).map((st) => {
                  const meta = getEnumMeta('ExamRoutineStatus', st);
                  return (
                    <option key={st} value={st}>
                      {locale === 'bn' ? meta.bn : meta.en}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{pick('বিশেষ নির্দেশনা', 'Instructions')}</label>
              <Textarea
                rows={2}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder={pick('যেমন: নন-প্রোগ্রামেবল ক্যালকুলেটর অনুমোদিত।', 'e.g. Non-programmable calculators permitted.')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {pick('রুটিন সংরক্ষণ করুন', 'Save Routine')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Institutional Official Routine Print Modal */}
      <Modal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        title={pick('অফিশিয়াল পরীক্ষার রুটিন প্রিভিউ', 'Official Examination Routine Preview')}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end no-print">
            <Button onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {pick('A4 প্রিন্ট করুন', 'Print A4 Sheet')}
            </Button>
          </div>
          {activeExam && (
            <PrintableExamRoutine
              school={db.schoolProfile}
              examName={activeExam.name}
              className={locale === 'bn' ? activeClass?.nameBn || '' : activeClass?.name || ''}
              academicYear={activeYear?.name ?? '2026'}
              routines={printableRows}
            />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={pick('রুটিন এন্ট্রি মুছুন', 'Delete Routine Entry')}
        description={pick('আপনি কি নিশ্চিত যে এই সময়সূচিটি মুছে ফেলতে চান?', 'Are you sure you want to delete this schedule entry?')}
        confirmLabel={pick('মুছে ফেলুন', 'Delete')}
        destructive
      />
    </div>
  );
}
