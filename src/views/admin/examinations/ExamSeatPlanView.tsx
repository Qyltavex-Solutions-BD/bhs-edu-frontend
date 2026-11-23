'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Edit3,
  LayoutGrid,
  Plus,
  Printer,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useDeleteExamHallRoomMutation,
  useGetBootstrapQuery,
  useUpsertExamHallRoomMutation,
} from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import {
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import {
  PrintableExamAttendanceSheet,
  PrintableExamSeatPlan,
} from '@/src/components/print/PrintDocuments';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber, formatTime } from '@/src/lib/formatters';
import { cn, triggerPrint } from '@/src/lib/utils/cn';
import { StaffType } from '@/src/types/enums';
import type { ExamHallRoom } from '@/src/types/entities';
import { buildSeatPlanRooms, getExamEnrolledStudents } from './ExamShared';

export function ExamSeatPlanView() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { locale, pick } = useI18n();
  const [upsertRoom, { isLoading: saving }] = useUpsertExamHallRoomMutation();
  const [deleteRoom] = useDeleteExamHallRoomMutation();

  const [selectedExamId, setSelectedExamId] = useState('exam-ann-10');
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ExamHallRoom | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamHallRoom | null>(null);

  const [seatPlanPrintOpen, setSeatPlanPrintOpen] = useState(false);
  const [selectedPrintRoomNo, setSelectedPrintRoomNo] = useState<string>('ALL');

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceSubjectId, setAttendanceSubjectId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('2026-11-22');

  const [form, setForm] = useState({
    roomNo: '',
    buildingName: 'মূল একাডেমিক ভবন',
    capacity: 30,
    invigilatorStaffId: '',
    assistantInvigilatorStaffId: '',
    notes: '',
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

  const activeExamClass = useMemo(
    () => (db && activeExam ? db.classes.find((c) => c.id === activeExam.classId) : null),
    [db, activeExam]
  );

  const teachers = useMemo(
    () => (db ? db.staff.filter((s) => s.staffType === StaffType.TEACHER) : []),
    [db]
  );

  const configuredRooms = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.examHallRooms
      .filter((r) => r.examId === activeExam.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [db, activeExam]);

  const examSubjects = useMemo(() => {
    if (!db || !activeExam) return [];
    return db.examSubjects
      .filter((es) => es.examId === activeExam.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [db, activeExam]);

  const enrolledCount = useMemo(
    () => (db && activeExam ? getExamEnrolledStudents(db, activeExam).length : 0),
    [db, activeExam]
  );

  const allocation = useMemo(() => {
    if (!db || !activeExam) {
      return { rooms: [], seatLookup: new Map(), unallocatedCount: 0, totalCapacity: 0 };
    }
    return buildSeatPlanRooms(db, activeExam, locale);
  }, [db, activeExam, locale]);

  const assignedInvigilatorsCount = useMemo(
    () => configuredRooms.filter((r) => Boolean(r.invigilatorStaffId)).length,
    [configuredRooms]
  );

  if (isLoading || !db) return <LoadingSkeleton rows={6} />;

  const activeYear = activeExam ? db.academicYears.find((y) => y.id === activeExam.academicYearId) : null;

  const openAddRoom = () => {
    setEditingRoom(null);
    setForm({
      roomNo: '',
      buildingName: 'মূল একাডেমিক ভবন (২য় তলা)',
      capacity: 24,
      invigilatorStaffId: teachers[0]?.id ?? '',
      assistantInvigilatorStaffId: '',
      notes: '',
    });
    setRoomModalOpen(true);
  };

  const openEditRoom = (room: ExamHallRoom) => {
    setEditingRoom(room);
    setForm({
      roomNo: room.roomNo,
      buildingName: room.buildingName ?? '',
      capacity: room.capacity,
      invigilatorStaffId: room.invigilatorStaffId ?? '',
      assistantInvigilatorStaffId: room.assistantInvigilatorStaffId ?? '',
      notes: room.notes ?? '',
    });
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam) return;
    if (!form.roomNo.trim() || form.capacity <= 0) {
      toast.error(pick('কক্ষ নম্বর ও সঠিক আসন সংখ্যা দিন।', 'Enter a room name and valid capacity.'));
      return;
    }
    const res = await upsertRoom({
      id: editingRoom?.id,
      examId: activeExam.id,
      roomNo: form.roomNo.trim(),
      buildingName: form.buildingName.trim() || null,
      capacity: Number(form.capacity),
      invigilatorStaffId: form.invigilatorStaffId || null,
      assistantInvigilatorStaffId: form.assistantInvigilatorStaffId || null,
      notes: form.notes.trim() || null,
    });
    if ('error' in res) {
      toast.error(pick('কক্ষ সংরক্ষণ ব্যর্থ হয়েছে।', 'Failed to save hall room.'));
      return;
    }
    toast.success(pick('পরীক্ষার কক্ষ ও পরিদর্শক সংরক্ষিত হয়েছে।', 'Hall room and invigilator saved.'));
    setRoomModalOpen(false);
  };

  const handleDeleteRoom = async () => {
    if (!deleteTarget) return;
    await deleteRoom({ id: deleteTarget.id });
    toast.success(pick('কক্ষটি অপসারণ করা হয়েছে।', 'Hall room removed.'));
    setDeleteTarget(null);
  };

  const openAttendancePrint = () => {
    const firstSubId = examSubjects[0]?.id ?? '';
    setAttendanceSubjectId(firstSubId);
    const matchingRoutine = db.examRoutines.find(
      (r) => !r.isDeleted && r.examId === activeExam?.id && r.examSubjectId === firstSubId
    );
    setAttendanceDate(matchingRoutine?.examDate ?? activeExam?.startDate.slice(0, 10) ?? '2026-11-22');
    setAttendanceModalOpen(true);
  };

  const selectedEs = examSubjects.find((es) => es.id === attendanceSubjectId) ?? examSubjects[0];
  const selectedSub = selectedEs ? db.subjects.find((s) => s.id === selectedEs.subjectId) : null;
  const matchingRoutine = selectedEs
    ? db.examRoutines.find((r) => !r.isDeleted && r.examId === activeExam?.id && r.examSubjectId === selectedEs.id)
    : null;

  const roomsForPrint =
    selectedPrintRoomNo === 'ALL'
      ? allocation.rooms
      : allocation.rooms.filter((r) => r.roomNo === selectedPrintRoomNo);

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="আসন বিন্যাস, পরিদর্শক ও হল হাজিরা শিট"
        titleEn="Multi-Room Seat Plan, Invigilators & Hall Attendance"
        subtitleBn="পরীক্ষা কেন্দ্রের কক্ষ, আসন ধারণক্ষমতা ও কক্ষ পরিদর্শক নির্ধারণ করে প্রাতিষ্ঠানিক আসন বিন্যাস এবং উত্তরপত্র স্বাক্ষর শিট প্রিন্ট করুন।"
        subtitleEn="Configure exam rooms, capacities, and invigilators to generate formal multi-room seat plans and hall attendance sheets."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={openAttendancePrint}
              disabled={allocation.rooms.length === 0}
              className="whitespace-nowrap shrink-0"
            >
              <ClipboardCheck className="w-4 h-4" />
              {pick('হল হাজিরা শিট প্রিন্ট', 'Hall Attendance Sheet')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPrintRoomNo('ALL');
                setSeatPlanPrintOpen(true);
              }}
              disabled={allocation.rooms.length === 0}
              className="whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              {pick('আসন বিন্যাস প্রিন্ট', 'Print Seat Plan')}
            </Button>
            <Button onClick={openAddRoom} disabled={!activeExam} className="whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" />
              {pick('নতুন কক্ষ যুক্ত করুন', 'Add Hall Room')}
            </Button>
          </div>
        }
      />

      {/* Exam Picker */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px] max-w-md">
          <label className="block text-xs text-muted-foreground mb-1">
            {pick('পরীক্ষা নির্বাচন করুন', 'Select Examination')}
          </label>
          <Select value={resolvedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
            {activeExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
          <span>
            {pick('শ্রেণি:', 'Class:')} <strong className="text-foreground font-semibold">{locale === 'bn' ? activeExamClass?.nameBn || activeExamClass?.name || '—' : activeExamClass?.name || '—'}</strong>
          </span>
          <span>·</span>
          <span>
            {pick('শিক্ষাবর্ষ:', 'Year:')} <strong className="text-foreground font-semibold">{formatNumber('2026', locale)}</strong>
          </span>
        </div>
      </Card>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('মোট আসন ধারণক্ষমতা', 'Total Seating Capacity')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(allocation.totalCapacity, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `মোট পরীক্ষার্থী ${formatNumber(enrolledCount, 'bn')} জন`,
              `Total examinees: ${enrolledCount}`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('কনফিগারকৃত হল ও কক্ষ', 'Configured Hall Rooms')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
            {formatNumber(configuredRooms.length, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `সক্রিয় পরীক্ষা কক্ষ · ভবনভিত্তিক বিন্যাস`,
              `Active examination rooms`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('হল পরিদর্শক শিক্ষক', 'Assigned Invigilators')}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {formatNumber(assignedInvigilatorsCount, locale)} / {formatNumber(configuredRooms.length, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {pick(
              `নিযুক্ত শিক্ষক · কক্ষের অনুপাত ${formatNumber(configuredRooms.length > 0 ? Math.round((assignedInvigilatorsCount / configuredRooms.length) * 100) : 0, 'bn')}%`,
              `Invigilation coverage ${configuredRooms.length > 0 ? Math.round((assignedInvigilatorsCount / configuredRooms.length) * 100) : 0}%`
            )}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('আসন বরাদ্দের স্থিতি', 'Seat Allocation Status')}
          </p>
          <p className={cn('mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums', allocation.unallocatedCount > 0 ? 'text-destructive' : 'text-success')}>
            {allocation.unallocatedCount > 0
              ? pick(`ঘাটতি ${formatNumber(allocation.unallocatedCount, locale)}`, `Deficit ${allocation.unallocatedCount}`)
              : pick('১০০% সম্পন্ন', '100% Allocated')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {allocation.unallocatedCount > 0
              ? pick('অতিরিক্ত আসন প্রয়োজন', 'More seats required')
              : pick(`উদ্বৃত্ত আসন ${formatNumber(Math.max(0, allocation.totalCapacity - enrolledCount), 'bn')}টি`, `Surplus ${Math.max(0, allocation.totalCapacity - enrolledCount)} seats`)}
          </p>
        </Card>
      </div>

      {/* Insufficient Capacity Warning */}
      {allocation.unallocatedCount > 0 && (
        <div className="p-4 rounded-[var(--radius)] border border-warning/50 bg-warning/10 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">
              {pick(
                `${formatNumber(allocation.unallocatedCount, locale)} জন শিক্ষার্থীর জন্য আসন কম রয়েছে!`,
                `${allocation.unallocatedCount} student(s) exceed configured room capacity!`
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pick(
                'নতুন কক্ষ যুক্ত করুন অথবা বিদ্যমান কক্ষের আসন সংখ্যা বাড়ান যাতে সকল পরীক্ষার্থীর আসন নিশ্চিত হয়।',
                'Add another hall room or increase existing room capacities to seat all examinees.'
              )}
            </p>
          </div>
        </div>
      )}

      {/* Room Cards & Live Allocation Breakdown */}
      {configuredRooms.length === 0 ? (
        <EmptyState
          title={pick('কোনো পরীক্ষা কক্ষ নির্ধারণ করা হয়নি', 'No exam hall rooms configured')}
          description={pick(
            'পরীক্ষা কেন্দ্রের কক্ষ, আসন সংখ্যা এবং কক্ষ পরিদর্শক যুক্ত করুন।',
            'Add rooms with seat capacity and invigilator assignments to build the official seat plan.'
          )}
          action={
            <Button onClick={openAddRoom}>
              <Plus className="w-4 h-4" />
              {pick('প্রথম কক্ষ যুক্ত করুন', 'Add First Room')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {configuredRooms.map((room, idx) => {
            const allocBlock = allocation.rooms[idx];
            const seated = allocBlock?.seats ?? [];
            const rolls = seated.map((s) => s.roll);
            const inv = teachers.find((t) => t.id === room.invigilatorStaffId);
            const asst = teachers.find((t) => t.id === room.assistantInvigilatorStaffId);

            return (
              <Card key={room.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{room.roomNo}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {room.buildingName || pick('একাডেমিক ভবন', 'Academic Building')}
                      {room.notes ? ` · ${room.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPrintRoomNo(room.roomNo);
                        setSeatPlanPrintOpen(true);
                      }}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {pick('প্রিন্ট', 'Print')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditRoom(room)}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(room)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-y border-border py-2.5 tabular-nums">
                  <div>
                    <span className="text-muted-foreground block">{pick('আসন বরাদ্দ', 'Allocated Seats')}</span>
                    <strong className="text-foreground text-sm">
                      {formatNumber(seated.length, locale)} / {formatNumber(room.capacity, locale)}
                    </strong>
                    {rolls.length > 0 && (
                      <span className="block text-muted-foreground">
                        {pick('রোল:', 'Roll:')} {formatNumber(Math.min(...rolls), locale)} –{' '}
                        {formatNumber(Math.max(...rolls), locale)}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{pick('কক্ষ পরিদর্শক (Invigilator)', 'Invigilators')}</span>
                    <strong className="text-foreground">
                      {inv ? (locale === 'bn' ? inv.nameBn || inv.name : inv.name) : pick('নির্ধারিত নয়', 'Unassigned')}
                    </strong>
                    {asst && (
                      <span className="block text-muted-foreground">
                        {pick('সহকারী:', 'Asst:')} {locale === 'bn' ? asst.nameBn || asst.name : asst.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Seated Students Compact List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs tabular-nums">
                  {seated.length === 0 ? (
                    <p className="text-muted-foreground italic">
                      {pick('এই কক্ষে কোনো পরীক্ষার্থী অবশিষ্ট নেই।', 'No examinees assigned to this room.')}
                    </p>
                  ) : (
                    seated.map((seat) => (
                      <div
                        key={seat.studentId}
                        className="flex items-center justify-between py-1 px-2 rounded bg-surface-muted/50"
                      >
                        <span className="font-medium text-foreground truncate">
                          #{formatNumber(seat.seatNo, locale)} · {seat.studentName}
                        </span>
                        <span className="text-muted-foreground shrink-0 ml-2">
                          {pick('রোল', 'Roll')} {formatNumber(seat.roll, locale)} ({seat.sectionName})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Hall Room Modal */}
      <Modal
        open={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        title={
          editingRoom
            ? pick('কক্ষ ও পরিদর্শক সম্পাদনা', 'Edit Hall Room & Invigilators')
            : pick('নতুন পরীক্ষা কক্ষ যুক্ত করুন', 'Add Exam Hall Room')
        }
        size="md"
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{pick('কক্ষ নম্বর / নাম *', 'Room No. / Name *')}</label>
              <Input
                required
                value={form.roomNo}
                onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
                placeholder={pick('যেমন: হল রুম ১০১', 'e.g. Hall Room 101')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{pick('আসন ধারণক্ষমতা *', 'Seat Capacity *')}</label>
              <Input
                type="number"
                min={1}
                max={200}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{pick('ভবন ও তলা', 'Building & Floor')}</label>
              <Input
                value={form.buildingName}
                onChange={(e) => setForm({ ...form, buildingName: e.target.value })}
                placeholder={pick('যেমন: মূল একাডেমিক ভবন (২য় তলা)', 'e.g. Main Academic Building (2nd Floor)')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{pick('প্রধান পরিদর্শক', 'Chief Invigilator')}</label>
              <Select
                value={form.invigilatorStaffId}
                onChange={(e) => setForm({ ...form, invigilatorStaffId: e.target.value })}
              >
                <option value="">{pick('নির্বাচন করুন', 'Select teacher')}</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {locale === 'bn' ? t.nameBn || t.name : t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{pick('সহকারী পরিদর্শক', 'Asst. Invigilator')}</label>
              <Select
                value={form.assistantInvigilatorStaffId}
                onChange={(e) => setForm({ ...form, assistantInvigilatorStaffId: e.target.value })}
              >
                <option value="">{pick('কোনোটি নয়', 'None')}</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {locale === 'bn' ? t.nameBn || t.name : t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{pick('নোট / মন্তব্য', 'Room Note')}</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={pick('যেমন: বিজ্ঞান ও মানবিক বিভাগ', 'e.g. Science & Humanities examinees')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setRoomModalOpen(false)}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {pick('সংরক্ষণ করুন', 'Save Room')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Formal Multi-Room Seat Plan Print Modal */}
      <Modal
        open={seatPlanPrintOpen}
        onClose={() => setSeatPlanPrintOpen(false)}
        title={pick('প্রাতিষ্ঠানিক আসন বিন্যাস প্রিভিউ', 'Official Multi-Room Seat Plan Preview')}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              <Select
                value={selectedPrintRoomNo}
                onChange={(e) => setSelectedPrintRoomNo(e.target.value)}
                className="w-56"
              >
                <option value="ALL">
                  {pick(`সকল কক্ষ (${formatNumber(allocation.rooms.length, locale)}টি)`, `All Rooms (${allocation.rooms.length})`)}
                </option>
                {allocation.rooms.map((r) => (
                  <option key={r.roomNo} value={r.roomNo}>
                    {r.roomNo} ({formatNumber(r.seats.length, locale)})
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {pick('আসন বিন্যাস প্রিন্ট করুন', 'Print Seat Plan')}
            </Button>
          </div>

          {activeExam && (
            <PrintableExamSeatPlan
              school={db.schoolProfile}
              examName={activeExam.name}
              academicYear={activeYear?.name ?? '2026'}
              rooms={roomsForPrint}
            />
          )}
        </div>
      </Modal>

      {/* Formal Room-Wise Hall Attendance & Answer Script Register Print Modal */}
      <Modal
        open={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        title={pick('হল হাজিরা ও উত্তরপত্র স্বাক্ষর শিট', 'Exam Hall Attendance & Answer Script Register')}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 no-print border-b border-border pb-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-56">
                <label className="block text-xs text-muted-foreground mb-1">{pick('বিষয় নির্বাচন করুন', 'Subject')}</label>
                <Select
                  value={attendanceSubjectId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setAttendanceSubjectId(nextId);
                    const rt = db.examRoutines.find(
                      (r) => !r.isDeleted && r.examId === activeExam?.id && r.examSubjectId === nextId
                    );
                    if (rt) setAttendanceDate(rt.examDate);
                  }}
                >
                  {examSubjects.map((es) => {
                    const sub = db.subjects.find((s) => s.id === es.subjectId);
                    return (
                      <option key={es.id} value={es.id}>
                        {locale === 'bn' ? sub?.nameBn || sub?.name : sub?.name} ({sub?.officialCode})
                      </option>
                    );
                  })}
                </Select>
              </div>
              <div className="w-44">
                <label className="block text-xs text-muted-foreground mb-1">{pick('পরীক্ষার তারিখ', 'Exam Date')}</label>
                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {pick('হাজিরা শিট প্রিন্ট করুন', 'Print Attendance Register')}
            </Button>
          </div>

          {activeExam && (
            <PrintableExamAttendanceSheet
              school={db.schoolProfile}
              examName={activeExam.name}
              academicYear={activeYear?.name ?? '2026'}
              subjectLabel={
                selectedSub
                  ? `${locale === 'bn' ? selectedSub.nameBn : selectedSub.name} (${selectedSub.officialCode ?? ''})`
                  : pick('সাধারণ পরীক্ষা', 'General Examination')
              }
              examDate={attendanceDate}
              examTime={
                matchingRoutine
                  ? `${formatTime(matchingRoutine.startTime, locale)} – ${formatTime(matchingRoutine.endTime, locale)}`
                  : null
              }
              rooms={allocation.rooms}
            />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRoom}
        title={pick('পরীক্ষা কক্ষ অপসারণ', 'Remove Hall Room')}
        description={pick(
          'এই কক্ষটি মুছে ফেললে পরীক্ষার্থীরা অবশিষ্ট কক্ষগুলোতে পুনর্বণ্টিত হবে।',
          'Deleting this room will re-distribute examinees across the remaining rooms.'
        )}
        confirmLabel={pick('মুছে ফেলুন', 'Remove')}
        destructive
      />
    </div>
  );
}
