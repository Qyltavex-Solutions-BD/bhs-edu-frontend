'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateExamMutation,
  useDeleteExamMutation,
  useGetExamsQuery,
  useGetGradingScalesQuery,
  useUpdateExamMutation,
} from '@/src/store/api';
import {
  useGetAcademicYearsQuery,
  useGetSchoolClassesQuery,
} from '@/src/services/academic';
import { examCreateSchema, examUpdateSchema } from '../../schemas';
import { ConfirmDialog, LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { Button } from '@/src/components/ui/primitives';
import { ExamStatus, ExamType } from '@/src/types/enums';
import type { Exam } from '@/src/types/entities';
import { ExamFormModal, buildExamOptionName, type ExamFormState } from './ExamFormModal';
import { ExamsTable } from './ExamsTable';

export function ExamsDirectoryView({ openCreateOnMount = false }: { openCreateOnMount?: boolean }) {
  const [createExam, { isLoading: creating }] = useCreateExamMutation();
  const [updateExam, { isLoading: updating }] = useUpdateExamMutation();
  const [deleteExam, { isLoading: deleting }] = useDeleteExamMutation();

  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);

  const {
    data: liveExamsData,
    isLoading: examsLoading,
    refetch: refetchExams,
  } = useGetExamsQuery({
    classId: classFilter !== 'ALL' ? classFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  });

  const { data: classesData, isLoading: classesLoading } = useGetSchoolClassesQuery();
  const { data: yearsData, isLoading: yearsLoading } = useGetAcademicYearsQuery();
  const { data: liveScalesData, isLoading: scalesLoading } = useGetGradingScalesQuery();

  const classesList = useMemo(
    () => [...(classesData ?? [])].sort((a, b) => a.numericValue - b.numericValue),
    [classesData]
  );
  const academicYearsList = useMemo(() => yearsData ?? [], [yearsData]);
  const gradingScalesList = useMemo(() => liveScalesData?.items ?? [], [liveScalesData]);
  const rawExams = useMemo(() => liveExamsData?.items ?? [], [liveExamsData]);

  const [createOpen, setCreateOpen] = useState(openCreateOnMount);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [form, setForm] = useState<ExamFormState>({
    name: '',
    classIds: [],
    classEndDates: {},
    academicYearId: '',
    examType: ExamType.HALF_YEARLY,
    gradingScaleId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    marksEntryDeadline: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    status: ExamStatus.UPCOMING,
    allowCombinedPass: true,
  });

  const activeYearObj = academicYearsList.find((y) => y.isActive) ?? academicYearsList[0];

  useEffect(() => {
    if (createOpen && !editingExam) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || buildExamOptionName(prev.examType, activeYearObj),
        classIds: prev.classIds.length > 0 ? prev.classIds : classesList.map((c) => c.id),
        academicYearId: prev.academicYearId || (activeYearObj?.id ?? ''),
        gradingScaleId:
          prev.gradingScaleId ||
          (gradingScalesList.find((g) => g.isDefault && !g.isDeleted)?.id ?? gradingScalesList[0]?.id ?? ''),
      }));
    }
  }, [createOpen, editingExam, classesList, activeYearObj, gradingScalesList]);

  const filteredExams = useMemo(() => {
    const classOrder = new Map(classesList.map((c) => [c.id, c.numericValue]));
    return rawExams
      .filter((e) => {
        if (e.isDeleted) return false;
        if (classFilter !== 'ALL' && e.classId !== classFilter) return false;
        if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const numA = a.schoolClass?.numericValue ?? classOrder.get(a.classId) ?? 999;
        const numB = b.schoolClass?.numericValue ?? classOrder.get(b.classId) ?? 999;
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
      });
  }, [rawExams, classesList, classFilter, statusFilter]);

  if (examsLoading || classesLoading || yearsLoading || scalesLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  const openCreateModal = () => {
    const defaultScale = gradingScalesList.find((g) => g.isDefault && !g.isDeleted) ?? gradingScalesList[0];
    setEditingExam(null);
    setForm({
      name: buildExamOptionName(ExamType.HALF_YEARLY, activeYearObj),
      classIds: classesList.map((c) => c.id),
      classEndDates: {},
      academicYearId: activeYearObj?.id ?? '',
      examType: ExamType.HALF_YEARLY,
      gradingScaleId: defaultScale?.id ?? '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      marksEntryDeadline: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
      status: ExamStatus.UPCOMING,
      allowCombinedPass: true,
    });
    setCreateOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setForm({
      name: exam.name,
      classIds: [exam.classId],
      classEndDates: {},
      academicYearId: exam.academicYearId,
      examType: exam.examType,
      gradingScaleId: exam.gradingScaleId,
      startDate: exam.startDate.slice(0, 10),
      endDate: exam.endDate.slice(0, 10),
      marksEntryDeadline: exam.marksEntryDeadline ? exam.marksEntryDeadline.slice(0, 10) : '',
      status: exam.status,
      allowCombinedPass: exam.allowCombinedPass,
    });
    setCreateOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const deadlineIso = form.marksEntryDeadline
      ? `${form.marksEntryDeadline}T23:59:00.000Z`
      : null;

    try {
      if (editingExam) {
        const validation = examUpdateSchema.safeParse({
          name: form.name.trim(),
          examType: form.examType,
          gradingScaleId: form.gradingScaleId,
          startDate: form.startDate,
          endDate: form.endDate,
          marksEntryDeadline: deadlineIso,
          status: form.status,
          allowCombinedPass: form.allowCombinedPass,
        });

        if (!validation.success) {
          toast.error(validation.error.issues[0]?.message || 'তথ্য সঠিক নয়।');
          return;
        }

        await updateExam({
          id: editingExam.id,
          name: form.name.trim(),
          examType: form.examType,
          gradingScaleId: form.gradingScaleId,
          startDate: form.startDate,
          endDate: form.endDate,
          marksEntryDeadline: deadlineIso,
          status: form.status,
          allowCombinedPass: form.allowCombinedPass,
        }).unwrap();

        toast.success('পরীক্ষার তথ্য সফলভাবে হালনাগাদ হয়েছে।');
      } else {
        const resolvedName = buildExamOptionName(form.examType, activeYearObj);
        const isSelection = form.examType === ExamType.SELECTION;
        const resolvedEndDate = isSelection
          ? form.endDate
          : form.classIds.reduce((maxDate, cid) => {
              const d = form.classEndDates[cid] || form.endDate;
              return d > maxDate ? d : maxDate;
            }, form.startDate);

        const validation = examCreateSchema.safeParse({
          name: resolvedName,
          classIds: form.classIds,
          academicYearId: form.academicYearId,
          examType: form.examType,
          gradingScaleId: form.gradingScaleId,
          startDate: form.startDate,
          endDate: resolvedEndDate,
          marksEntryDeadline: deadlineIso,
          allowCombinedPass: form.allowCombinedPass,
          autoAttachSubjects: true,
        });

        if (!validation.success) {
          toast.error(validation.error.issues[0]?.message || 'তথ্য সঠিক নয়।');
          return;
        }

        const invalidClassEnd = form.classIds.find(
          (cid) => (isSelection ? form.endDate : form.classEndDates[cid] || form.endDate) < form.startDate
        );
        if (invalidClassEnd) {
          toast.error('কোনো শ্রেণির শেষের তারিখ শুরুর তারিখের আগে হতে পারে না।');
          return;
        }

        await createExam({
          name: resolvedName,
          classIds: form.classIds,
          classSchedules: form.classIds.map((cid) => ({
            classId: cid,
            startDate: form.startDate,
            endDate: isSelection ? form.endDate : form.classEndDates[cid] || form.endDate,
          })),
          academicYearId: form.academicYearId,
          examType: form.examType,
          gradingScaleId: form.gradingScaleId,
          startDate: form.startDate,
          endDate: resolvedEndDate,
          marksEntryDeadline: deadlineIso,
          allowCombinedPass: form.allowCombinedPass,
          autoAttachSubjects: true,
        }).unwrap();

        toast.success('নতুন পরীক্ষা তৈরি হয়েছে এবং শ্রেণির এনসিটিবি বিষয়সমূহ স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে।');
      }
      setCreateOpen(false);
      refetchExams?.();
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'অপারেশন ব্যর্থ হয়েছে।';
      toast.error(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExam(deleteTarget.id).unwrap();
      toast.success('পরীক্ষাটি সফলভাবে মুছে ফেলা হয়েছে।');
      setDeleteTarget(null);
      refetchExams?.();
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'অপারেশন ব্যর্থ হয়েছে।';
      toast.error(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="পরীক্ষা তালিকা ও বিষয় কনফিগারেশন"
        subtitleBn="ষষ্ঠ থেকে দশম শ্রেণির পরীক্ষা তৈরি, সময়সীমা ব্যবস্থাপনা এবং প্রতিটি পরীক্ষার বিষয়ভিত্তিক পূর্ণমান ও পাশ নম্বর কনফিগার করুন।"
        actions={
          <Button onClick={openCreateModal} className="whitespace-nowrap shrink-0">
            <Plus className="w-4 h-4" />
            নতুন পরীক্ষা তৈরি করুন
          </Button>
        }
      />

      <ExamsTable
        exams={filteredExams}
        classesList={classesList}
        academicYearsList={academicYearsList}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onCreateClick={openCreateModal}
        onEditClick={openEditModal}
        onDeleteClick={(exam) => setDeleteTarget(exam)}
      />

      <ExamFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        editingExam={editingExam}
        form={form}
        setForm={setForm}
        onSubmit={handleSaveExam}
        submitting={creating || updating}
        classesList={classesList}
        gradingScalesList={gradingScalesList}
        activeYearObj={activeYearObj}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="পরীক্ষা মুছে ফেলুন"
        description={
          deleteTarget
            ? `আপনি কি নিশ্চিত যে "${deleteTarget.name}" পরীক্ষাটি মুছে ফেলতে চান?`
            : ''
        }
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        destructive
      />
    </div>
  );
}
