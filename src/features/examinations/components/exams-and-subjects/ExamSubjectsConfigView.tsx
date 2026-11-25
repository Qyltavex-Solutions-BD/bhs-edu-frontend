'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Copy,
  Edit3,
  Link2,
  Lock,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateExamSubjectMutation,
  useGetExamsQuery,
  useGetExamSubjectsQuery,
  useRemoveExamSubjectMutation,
  useUpdateExamSubjectMutation,
} from '@/src/store/api';
import {
  useGetAcademicGroupsQuery,
  useGetClassSubjectsQuery,
  useGetSchoolClassesQuery,
  useGetSubjectsQuery,
} from '@/src/services/academic';
import {
  ConfirmDialog,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { DataTable } from '@/src/components/shared/DataTable';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils/cn';
import { getEnumMeta } from '@/src/lib/constants/enums';
import type { ExamSubject } from '@/src/types/entities';

export function ExamSubjectsConfigView({ initialExamId }: { initialExamId?: string }) {
  const { data: examsData, isLoading: examsLoading } = useGetExamsQuery({ limit: 100 });
  const { data: classesList = [], isLoading: classesLoading } = useGetSchoolClassesQuery();
  const { data: subjectsList = [], isLoading: subjectsLoading } = useGetSubjectsQuery();
  const { data: groupsList = [] } = useGetAcademicGroupsQuery();

  const [createExamSubject, { isLoading: creating }] = useCreateExamSubjectMutation();
  const [updateExamSubject, { isLoading: updating }] = useUpdateExamSubjectMutation();
  const [removeExamSubject] = useRemoveExamSubjectMutation();
  const saving = creating || updating;

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState(initialExamId ?? '');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copySourceExamId, setCopySourceExamId] = useState('');
  const [copying, setCopying] = useState(false);
  const [bulkDrafts, setBulkDrafts] = useState<
    Record<
      string,
      {
        fullMarks: number | '';
        passMarks: number | '';
        writtenFull: number | '';
        writtenPass: number | '';
        mcqFull: number | '';
        mcqPass: number | '';
        practicalFull: number | '';
        practicalPass: number | '';
        caFull: number | '';
        caPass: number | '';
        dirty: boolean;
      }
    >
  >({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEs, setEditingEs] = useState<ExamSubject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamSubject | null>(null);

  const [form, setForm] = useState<{
    subjectId: string;
    groupId: string;
    fullMarks: number | '';
    passMarks: number | '';
    hasWritten: boolean;
    writtenFullMarks: number | '';
    writtenPassMarks: number | '';
    hasMcq: boolean;
    mcqFullMarks: number | '';
    mcqPassMarks: number | '';
    hasPractical: boolean;
    practicalFullMarks: number | '';
    practicalPassMarks: number | '';
    hasContinuousAssessment: boolean;
    continuousAssessmentFullMarks: number | '';
    continuousAssessmentPassMarks: number | '';
    isOptional: boolean;
  }>({
    subjectId: '',
    groupId: '',
    fullMarks: 100,
    passMarks: 33,
    hasWritten: true,
    writtenFullMarks: 70,
    writtenPassMarks: 23,
    hasMcq: true,
    mcqFullMarks: 30,
    mcqPassMarks: 10,
    hasPractical: false,
    practicalFullMarks: 0,
    practicalPassMarks: 0,
    hasContinuousAssessment: false,
    continuousAssessmentFullMarks: 0,
    continuousAssessmentPassMarks: 0,
    isOptional: false,
  });

  const parseNumInput = (raw: string): number | '' => (raw === '' ? '' : Number(raw));

  const activeExams = useMemo(
    () => (examsData?.items ?? []).filter((e) => !e.isDeleted),
    [examsData]
  );

  const sortedClasses = useMemo(
    () => [...classesList].sort((a, b) => a.numericValue - b.numericValue),
    [classesList]
  );

  const initialExam = initialExamId
    ? activeExams.find((e) => e.id === initialExamId)
    : undefined;

  const resolvedClassId =
    selectedClassId ||
    initialExam?.classId ||
    activeExams[0]?.classId ||
    sortedClasses[0]?.id ||
    '';

  const filteredExams = useMemo(
    () =>
      resolvedClassId
        ? activeExams.filter((e) => e.classId === resolvedClassId)
        : activeExams,
    [activeExams, resolvedClassId]
  );

  const resolvedExamId =
    selectedExamId && filteredExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : filteredExams[0]?.id ?? '';

  const activeExam = filteredExams.find((e) => e.id === resolvedExamId) ?? null;

  const copySourceExams = useMemo(
    () => activeExams.filter((e) => e.id !== activeExam?.id),
    [activeExams, activeExam?.id]
  );

  const resolvedCopySourceExamId =
    copySourceExamId && copySourceExams.some((e) => e.id === copySourceExamId)
      ? copySourceExamId
      : copySourceExams[0]?.id ?? '';

  const { data: copySourceSubjects = [], isLoading: copySourceLoading } =
    useGetExamSubjectsQuery(resolvedCopySourceExamId, {
      skip: !copyModalOpen || !resolvedCopySourceExamId,
    });

  const { data: examSubjectsRaw = [], isLoading: subjectsConfigLoading } =
    useGetExamSubjectsQuery(activeExam?.id ?? '', { skip: !activeExam?.id });

  const { data: classSubjectsByYear = [] } = useGetClassSubjectsQuery(
    {
      classId: activeExam?.classId || resolvedClassId || undefined,
      academicYearId: activeExam?.academicYearId || undefined,
    },
    { skip: !(activeExam?.classId || resolvedClassId) }
  );

  const { data: classSubjectsAnyYear = [] } = useGetClassSubjectsQuery(
    {
      classId: activeExam?.classId || resolvedClassId || undefined,
    },
    { skip: !(activeExam?.classId || resolvedClassId) || classSubjectsByYear.length > 0 }
  );

  const classSubjects = useMemo(() => {
    const raw = classSubjectsByYear.length > 0 ? classSubjectsByYear : classSubjectsAnyYear;
    return raw.filter((cs) => cs.isActive !== false);
  }, [classSubjectsByYear, classSubjectsAnyYear]);

  const availableSubjects = useMemo(() => {
    if (classSubjects.length === 0) {
      return subjectsList.map((s) => ({
        id: s.id,
        name: s.name,
        nameBn: s.nameBn,
        officialCode: s.officialCode,
        defaultGroupId: '',
        defaultIsOptional: false,
      }));
    }

    const seen = new Set<string>();
    const list: Array<{
      id: string;
      name: string;
      nameBn?: string | null;
      officialCode?: string | null;
      defaultGroupId: string;
      defaultIsOptional: boolean;
    }> = [];

    const sortedCs = [...classSubjects].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );

    for (const cs of sortedCs) {
      if (seen.has(cs.subjectId)) continue;
      seen.add(cs.subjectId);
      const sub = cs.subject ?? subjectsList.find((s) => s.id === cs.subjectId);
      if (!sub) continue;
      list.push({
        id: sub.id,
        name: sub.name,
        nameBn: sub.nameBn,
        officialCode: sub.officialCode,
        defaultGroupId: cs.groupId ?? '',
        defaultIsOptional: Boolean(cs.isOptional),
      });
    }

    return list;
  }, [classSubjects, subjectsList]);

  const examSubjects = useMemo(() => {
    return [...examSubjectsRaw].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [examSubjectsRaw]);

  const missingClassSubjects = useMemo(() => {
    if (classSubjects.length === 0) return [];
    const usedIds = new Set(examSubjects.map((es) => es.subjectId));
    return availableSubjects.filter((s) => !usedIds.has(s.id));
  }, [classSubjects, availableSubjects, examSubjects]);

  const activeClass = activeExam
    ? activeExam.schoolClass ?? classesList.find((c) => c.id === activeExam.classId) ?? null
    : classesList.find((c) => c.id === resolvedClassId) ?? null;
  const isClassNineTen = (activeClass?.numericValue ?? 0) >= 9;

  const displayedExamSubjects = useMemo(() => {
    if (!isClassNineTen || !selectedGroupId) return examSubjects;
    if (selectedGroupId === '__common__') {
      return examSubjects.filter((es) => !es.groupId);
    }
    return examSubjects.filter((es) => !es.groupId || es.groupId === selectedGroupId);
  }, [examSubjects, isClassNineTen, selectedGroupId]);

  const pairedCount = useMemo(() => {
    if (!activeExam?.allowCombinedPass) return 0;
    return displayedExamSubjects.filter((es) => {
      const sub = es.subject ?? subjectsList.find((s) => s.id === es.subjectId);
      const name = sub?.nameBn || sub?.name || '';
      return (
        sub?.paperNumber === 1 ||
        sub?.paperNumber === 2 ||
        /১ম\s*পত্র|২য়\s*পত্র|২য়\s*পত্র|1st\s*Paper|2nd\s*Paper/i.test(name)
      );
    }).length;
  }, [activeExam?.allowCombinedPass, displayedExamSubjects, subjectsList]);

  const { realTotalFullMarks, configuredCount, unconfiguredCount } = useMemo(() => {
    let total = 0;
    let configured = 0;
    let unconfigured = 0;

    for (const es of displayedExamSubjects) {
      const val =
        bulkEditMode && bulkDrafts[es.id]
          ? Number(bulkDrafts[es.id].fullMarks) || 0
          : es.fullMarks;
      total += val;
      if (val > 0) configured += 1;
      else unconfigured += 1;
    }

    return {
      realTotalFullMarks: total,
      configuredCount: configured,
      unconfiguredCount: unconfigured,
    };
  }, [displayedExamSubjects, bulkEditMode, bulkDrafts]);

  if (examsLoading || classesLoading || subjectsLoading || (activeExam && subjectsConfigLoading)) {
    return <LoadingSkeleton rows={6} />;
  }

  const componentSum =
    (form.hasWritten ? Number(form.writtenFullMarks) || 0 : 0) +
    (form.hasMcq ? Number(form.mcqFullMarks) || 0 : 0) +
    (form.hasPractical ? Number(form.practicalFullMarks) || 0 : 0) +
    (form.hasContinuousAssessment ? Number(form.continuousAssessmentFullMarks) || 0 : 0);

  const openEditModal = (es: ExamSubject) => {
    setEditingEs(es);
    setForm({
      subjectId: es.subjectId,
      groupId: es.groupId ?? '',
      fullMarks: es.fullMarks,
      passMarks: es.passMarks,
      hasWritten: es.hasWritten,
      writtenFullMarks: es.writtenFullMarks ?? 0,
      writtenPassMarks: es.writtenPassMarks ?? 0,
      hasMcq: es.hasMcq,
      mcqFullMarks: es.mcqFullMarks ?? 0,
      mcqPassMarks: es.mcqPassMarks ?? 0,
      hasPractical: es.hasPractical,
      practicalFullMarks: es.practicalFullMarks ?? 0,
      practicalPassMarks: es.practicalPassMarks ?? 0,
      hasContinuousAssessment: es.hasContinuousAssessment,
      continuousAssessmentFullMarks: es.continuousAssessmentFullMarks ?? 0,
      continuousAssessmentPassMarks: es.continuousAssessmentPassMarks ?? 0,
      isOptional: es.isOptional,
    });
    setModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam) return;
    if (componentSum !== Number(form.fullMarks)) {
      toast.error(
        `উপাংশগুলোর যোগফল (${componentSum}) এবং মোট পূর্ণমান (${form.fullMarks}) সমান হতে হবে।`
      );
      return;
    }

    const commonPayload = {
      groupId: isClassNineTen && form.groupId ? form.groupId : undefined,
      fullMarks: Number(form.fullMarks),
      passMarks: Number(form.passMarks),
      hasWritten: form.hasWritten,
      writtenFullMarks: form.hasWritten ? Number(form.writtenFullMarks) : 0,
      writtenPassMarks: form.hasWritten ? Number(form.writtenPassMarks) : 0,
      hasMcq: form.hasMcq,
      mcqFullMarks: form.hasMcq ? Number(form.mcqFullMarks) : 0,
      mcqPassMarks: form.hasMcq ? Number(form.mcqPassMarks) : 0,
      hasPractical: form.hasPractical,
      practicalFullMarks: form.hasPractical ? Number(form.practicalFullMarks) : 0,
      practicalPassMarks: form.hasPractical ? Number(form.practicalPassMarks) : 0,
      hasContinuousAssessment: form.hasContinuousAssessment,
      continuousAssessmentFullMarks: form.hasContinuousAssessment
        ? Number(form.continuousAssessmentFullMarks)
        : 0,
      continuousAssessmentPassMarks: form.hasContinuousAssessment
        ? Number(form.continuousAssessmentPassMarks)
        : 0,
      isOptional: form.isOptional,
    };

    try {
      if (editingEs) {
        await updateExamSubject({
          examId: activeExam.id,
          subjectConfigId: editingEs.id,
          body: commonPayload,
        }).unwrap();
      } else {
        await createExamSubject({
          examId: activeExam.id,
          body: {
            subjectId: form.subjectId,
            ...commonPayload,
          },
        }).unwrap();
      }
      toast.success('পরীক্ষার বিষয় কাঠামো সংরক্ষিত হয়েছে।');
      setModalOpen(false);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'বিষয় সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !activeExam) return;
    try {
      await removeExamSubject({
        examId: activeExam.id,
        subjectConfigId: deleteTarget.id,
      }).unwrap();
      toast.success('বিষয়টি পরীক্ষা থেকে অপসারণ করা হয়েছে।');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'মুছা সম্ভব হয়নি।');
    }
    setDeleteTarget(null);
  };

  const handleBulkAddClassSubjects = async () => {
    if (!activeExam) return;
    if (classSubjects.length === 0) {
      toast.info('এই শ্রেণির জন্য একাডেমিক "শ্রেণি ও বিষয়" অংশে কোনো বিষয় নির্ধারিত নেই।');
      return;
    }
    if (missingClassSubjects.length === 0) {
      toast.info('এই শ্রেণির সব বিষয় ইতিমধ্যেই পরীক্ষায় যুক্ত করা হয়েছে।');
      return;
    }
    setBulkAdding(true);
    let addedCount = 0;
    let failCount = 0;

    for (const sub of missingClassSubjects) {
      try {
        await createExamSubject({
          examId: activeExam.id,
          body: {
            subjectId: sub.id,
            groupId: isClassNineTen && sub.defaultGroupId ? sub.defaultGroupId : undefined,
            fullMarks: 0,
            passMarks: 0,
            hasWritten: false,
            writtenFullMarks: 0,
            writtenPassMarks: 0,
            hasMcq: false,
            mcqFullMarks: 0,
            mcqPassMarks: 0,
            hasPractical: false,
            practicalFullMarks: 0,
            practicalPassMarks: 0,
            hasContinuousAssessment: false,
            continuousAssessmentFullMarks: 0,
            continuousAssessmentPassMarks: 0,
            isOptional: sub.defaultIsOptional,
          },
        }).unwrap();
        addedCount += 1;
      } catch {
        failCount += 1;
      }
    }

    setBulkAdding(false);
    if (addedCount > 0) {
      toast.success(
        `${formatNumber(addedCount, 'bn')}টি বিষয় খালি অবস্থায় লোড হয়েছে। "নম্বর বণ্টন" ক্লিক করে নম্বর বসিয়ে নিন।`
      );
    }
    if (failCount > 0 && addedCount === 0) {
      toast.error('বিষয়গুলো যুক্ত করা সম্ভব হয়নি।');
    }
  };

  const startBulkEdit = () => {
    const drafts: typeof bulkDrafts = {};
    for (const es of examSubjects) {
      drafts[es.id] = {
        fullMarks: es.fullMarks > 0 ? es.fullMarks : '',
        passMarks: es.fullMarks > 0 ? es.passMarks : '',
        writtenFull: es.hasWritten ? (es.writtenFullMarks ?? '') : '',
        writtenPass: es.hasWritten ? (es.writtenPassMarks ?? '') : '',
        mcqFull: es.hasMcq ? (es.mcqFullMarks ?? '') : '',
        mcqPass: es.hasMcq ? (es.mcqPassMarks ?? '') : '',
        practicalFull: es.hasPractical ? (es.practicalFullMarks ?? '') : '',
        practicalPass: es.hasPractical ? (es.practicalPassMarks ?? '') : '',
        caFull: es.hasContinuousAssessment ? (es.continuousAssessmentFullMarks ?? '') : '',
        caPass: es.hasContinuousAssessment ? (es.continuousAssessmentPassMarks ?? '') : '',
        dirty: false,
      };
    }
    setBulkDrafts(drafts);
    setBulkEditMode(true);
  };

  const updateBulkCell = (
    id: string,
    field:
      | 'fullMarks'
      | 'passMarks'
      | 'writtenFull'
      | 'writtenPass'
      | 'mcqFull'
      | 'mcqPass'
      | 'practicalFull'
      | 'practicalPass'
      | 'caFull'
      | 'caPass',
    raw: string
  ) => {
    const val = parseNumInput(raw);
    setBulkDrafts((prev) => {
      const curr = prev[id];
      if (!curr) return prev;
      const next = { ...curr, [field]: val, dirty: true };

      const calcPass = (n: number | '') => (n === '' ? '' : Math.round(n * 0.33));

      if (field === 'fullMarks') {
        next.passMarks = calcPass(val);
      } else if (field === 'writtenFull') {
        next.writtenPass = calcPass(val);
      } else if (field === 'mcqFull') {
        next.mcqPass = calcPass(val);
      } else if (field === 'practicalFull') {
        next.practicalPass = calcPass(val);
      } else if (field === 'caFull') {
        next.caPass = calcPass(val);
      }

      return { ...prev, [id]: next };
    });
  };

  const handleBulkSaveAll = async () => {
    if (!activeExam) return;
    const dirtyItems = examSubjects.filter((es) => bulkDrafts[es.id]?.dirty);
    if (dirtyItems.length === 0) {
      setBulkEditMode(false);
      toast.info('কোনো পরিবর্তন করা হয়নি।');
      return;
    }

    for (const es of dirtyItems) {
      const d = bulkDrafts[es.id];
      const full = Number(d.fullMarks) || 0;
      const compSum =
        (Number(d.writtenFull) || 0) +
        (Number(d.mcqFull) || 0) +
        (Number(d.practicalFull) || 0) +
        (Number(d.caFull) || 0);
      if (full <= 0 || compSum !== full) {
        const subName = es.subject?.nameBn || es.subject?.name || 'বিষয়';
        toast.error(
          `"${subName}" এর উপাংশের যোগফল (${compSum}) ও মোট পূর্ণমান (${full}) সমান হতে হবে।`
        );
        return;
      }
    }

    setBulkSaving(true);
    let savedCount = 0;
    let failCount = 0;

    for (const es of dirtyItems) {
      const d = bulkDrafts[es.id];
      const wFull = Number(d.writtenFull) || 0;
      const mFull = Number(d.mcqFull) || 0;
      const pFull = Number(d.practicalFull) || 0;
      const cFull = Number(d.caFull) || 0;
      try {
        await updateExamSubject({
          examId: activeExam.id,
          subjectConfigId: es.id,
          body: {
            fullMarks: Number(d.fullMarks) || 0,
            passMarks: Number(d.passMarks) || 0,
            hasWritten: wFull > 0,
            writtenFullMarks: wFull,
            writtenPassMarks: wFull > 0 ? Number(d.writtenPass) || 0 : 0,
            hasMcq: mFull > 0,
            mcqFullMarks: mFull,
            mcqPassMarks: mFull > 0 ? Number(d.mcqPass) || 0 : 0,
            hasPractical: pFull > 0,
            practicalFullMarks: pFull,
            practicalPassMarks: pFull > 0 ? Number(d.practicalPass) || 0 : 0,
            hasContinuousAssessment: cFull > 0,
            continuousAssessmentFullMarks: cFull,
            continuousAssessmentPassMarks: cFull > 0 ? Number(d.caPass) || 0 : 0,
          },
        }).unwrap();
        savedCount += 1;
      } catch {
        failCount += 1;
      }
    }

    setBulkSaving(false);
    if (savedCount > 0) {
      toast.success(`${formatNumber(savedCount, 'bn')}টি বিষয়ের নম্বর সংরক্ষিত হয়েছে।`);
      setBulkEditMode(false);
      setBulkDrafts({});
    }
    if (failCount > 0 && savedCount === 0) {
      toast.error('পরিবর্তনগুলো সংরক্ষণ করা সম্ভব হয়নি।');
    }
  };

  const handleCopyFromExam = async () => {
    if (!activeExam || copySourceSubjects.length === 0) return;
    const usedIds = new Set(examSubjects.map((es) => es.subjectId));
    const toCopy = copySourceSubjects.filter((src) => !usedIds.has(src.subjectId));
    if (toCopy.length === 0) {
      toast.info('উৎস পরীক্ষার সব বিষয় ইতিমধ্যেই এই পরীক্ষায় আছে।');
      setCopyModalOpen(false);
      return;
    }

    setCopying(true);
    let copied = 0;
    for (const src of toCopy) {
      try {
        await createExamSubject({
          examId: activeExam.id,
          body: {
            subjectId: src.subjectId,
            groupId: isClassNineTen && src.groupId ? src.groupId : undefined,
            fullMarks: src.fullMarks,
            passMarks: src.passMarks,
            hasWritten: src.hasWritten,
            writtenFullMarks: src.hasWritten ? src.writtenFullMarks ?? 0 : 0,
            writtenPassMarks: src.hasWritten ? src.writtenPassMarks ?? 0 : 0,
            hasMcq: src.hasMcq,
            mcqFullMarks: src.hasMcq ? src.mcqFullMarks ?? 0 : 0,
            mcqPassMarks: src.hasMcq ? src.mcqPassMarks ?? 0 : 0,
            hasPractical: src.hasPractical,
            practicalFullMarks: src.hasPractical ? src.practicalFullMarks ?? 0 : 0,
            practicalPassMarks: src.hasPractical ? src.practicalPassMarks ?? 0 : 0,
            hasContinuousAssessment: src.hasContinuousAssessment,
            continuousAssessmentFullMarks: src.hasContinuousAssessment
              ? src.continuousAssessmentFullMarks ?? 0
              : 0,
            continuousAssessmentPassMarks: src.hasContinuousAssessment
              ? src.continuousAssessmentPassMarks ?? 0
              : 0,
            isOptional: src.isOptional,
          },
        }).unwrap();
        copied += 1;
      } catch {
        // skip individual conflict
      }
    }
    setCopying(false);
    setCopyModalOpen(false);
    if (copied > 0) {
      toast.success(`${formatNumber(copied, 'bn')}টি বিষয় ও নম্বর বণ্টন কপি করা হয়েছে।`);
    } else {
      toast.error('বিষয়গুলো কপি করা সম্ভব হয়নি।');
    }
  };

  const renderInlinePair = (
    esId: string,
    fullField: 'writtenFull' | 'mcqFull' | 'practicalFull' | 'caFull' | 'fullMarks',
    passField: 'writtenPass' | 'mcqPass' | 'practicalPass' | 'caPass' | 'passMarks'
  ) => {
    const d = bulkDrafts[esId];
    if (!d) return null;
    return (
      <div className="flex items-center gap-1 min-w-[96px]">
        <input
          type="number"
          min={0}
          max={200}
          value={d[fullField]}
          onChange={(e) => updateBulkCell(esId, fullField, e.target.value)}
          className="w-12 px-1.5 py-1 text-xs text-center rounded border border-border bg-background tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="পূর্ণমান"
        />
        <span className="text-muted-foreground text-xs">/</span>
        <input
          type="number"
          min={0}
          max={200}
          value={d[passField]}
          onChange={(e) => updateBulkCell(esId, passField, e.target.value)}
          className="w-11 px-1.5 py-1 text-xs text-center rounded border border-border bg-background tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="পাশ"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titleBn="পরীক্ষাভিত্তিক বিষয় ও নম্বর বণ্টন"
        subtitleBn="প্রতিটি বিষয়ের সৃজনশীল/লিখিত, MCQ, ব্যবহারিক ও ধারাবাহিক মূল্যায়নের (CA) পূর্ণমান ও পৃথক পাশ নম্বর নির্ধারণ করুন।"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/examinations">
              <Button variant="outline" className="whitespace-nowrap shrink-0">
                <ArrowLeft className="w-4 h-4" />
                {'পরীক্ষা তালিকা'}
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4-Column KPI Cards (Top) */}
      {activeExam && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex flex-col justify-between gap-2">
            <p className="text-base font-bold text-foreground">{'মোট বিষয়'}</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
              {formatNumber(displayedExamSubjects.length, 'bn')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {`${activeClass?.nameBn || activeClass?.name || ''} · পরীক্ষায় নির্ধারিত`}
            </p>
          </Card>

          <Card className="p-5 flex flex-col justify-between gap-2">
            <p className="text-base font-bold text-foreground">{'নম্বর বণ্টন সম্পন্ন'}</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-success">
              {formatNumber(configuredCount, 'bn')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {'পূর্ণমান ও পাশ নম্বর নির্ধারিত হয়েছে'}
            </p>
          </Card>

          <Card className="p-5 flex flex-col justify-between gap-2">
            <p className="text-base font-bold text-foreground">{'নম্বর বণ্টন বাকি'}</p>
            <p
              className={cn(
                'mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums',
                unconfiguredCount > 0 ? 'text-warning' : 'text-success'
              )}
            >
              {formatNumber(unconfiguredCount, 'bn')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {unconfiguredCount > 0
                ? 'এগুলোতে এখনো নম্বর বসানো হয়নি'
                : 'সব বিষয়ের নম্বর বণ্টন সম্পন্ন'}
            </p>
          </Card>

          <Card className="p-5 flex flex-col justify-between gap-2">
            <p className="text-base font-bold text-foreground">{'মোট পূর্ণমান'}</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-primary">
              {formatNumber(realTotalFullMarks, 'bn')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {activeExam.allowCombinedPass
                ? `যৌথ পাশ চালু · ${formatNumber(pairedCount, 'bn')}টি পত্র`
                : 'সব বিষয়ের সম্মিলিত পূর্ণমান'}
            </p>
          </Card>
        </div>
      )}

      {/* Top Filter & Action Bar */}
      <div className="space-y-3">
        <Card className="p-3 flex flex-wrap lg:flex-nowrap items-end justify-between gap-2">
          <div className="flex flex-wrap lg:flex-nowrap items-end gap-2 flex-1 min-w-0">
            <div className="w-36 shrink-0">
              <label className="block text-[11px] font-medium text-muted-foreground mb-0.5">
                {'শ্রেণি'}
              </label>
              <Select
                value={resolvedClassId}
                className="h-9 text-xs px-2"
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedExamId('');
                  setSelectedGroupId('');
                  setBulkEditMode(false);
                }}
              >
                {sortedClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.nameBn || cls.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-48 min-w-[160px] flex-1 max-w-[230px]">
              <label className="block text-[11px] font-medium text-muted-foreground mb-0.5">
                {'পরীক্ষা'}
              </label>
              <Select
                value={resolvedExamId}
                className="h-9 text-xs px-2"
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  setBulkEditMode(false);
                }}
                disabled={filteredExams.length === 0}
              >
                {filteredExams.length === 0 ? (
                  <option value="">{'এই শ্রেণির কোনো পরীক্ষা নেই'}</option>
                ) : (
                  filteredExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))
                )}
              </Select>
            </div>

            {isClassNineTen && (
              <div className="w-36 shrink-0">
                <label className="block text-[11px] font-medium text-muted-foreground mb-0.5">
                  {'বিভাগ'}
                </label>
                <Select
                  value={selectedGroupId}
                  className="h-9 text-xs px-2"
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">{'সকল বিভাগ'}</option>
                  <option value="__common__">{'শুধু কমন বিষয়'}</option>
                  {groupsList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nameBn || g.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {activeExam && !activeExam.isLocked && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={handleBulkAddClassSubjects}
                disabled={bulkAdding || saving || bulkEditMode}
                className="h-9 text-xs whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                {bulkAdding ? 'লোড হচ্ছে...' : 'ক্লাসের সব বিষয় লোড করুন'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCopyModalOpen(true)}
                disabled={copySourceExams.length === 0 || bulkEditMode}
                className="h-9 text-xs whitespace-nowrap shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                {'আগের পরীক্ষা থেকে কপি করুন'}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {activeExam?.isLocked && (
        <div className="p-3.5 rounded-[var(--radius)] border border-warning/40 bg-warning/10 flex items-center gap-2.5 text-sm">
          <Lock className="w-4 h-4 text-warning shrink-0" />
          <span>
            {'এই পরীক্ষাটি লক করা অবস্থায় আছে। বিষয় বা নম্বর বণ্টন পরিবর্তন করতে হলে আগে ফলাফল প্রক্রিয়াকরণ পেজ থেকে পরীক্ষাটি আনলক করুন।'}
          </span>
        </div>
      )}

      <DataTable
        data={displayedExamSubjects.map((es) => {
          const sub = es.subject ?? subjectsList.find((s) => s.id === es.subjectId);
          const grp = es.group ?? (es.groupId ? groupsList.find((g) => g.id === es.groupId) : null);
          const subjectName = sub?.nameBn || sub?.name || '—';
          const isPairedPaper = Boolean(
            activeExam?.allowCombinedPass &&
              (sub?.paperNumber === 1 ||
                sub?.paperNumber === 2 ||
                /১ম\s*পত্র|২য়\s*পত্র|২য়\s*পত্র|1st\s*Paper|2nd\s*Paper/i.test(subjectName))
          );
          return {
            es,
            id: es.id,
            subjectName,
            subjectCode: isClassNineTen ? (sub?.officialCode?.trim() || '') : '',
            groupLabel: grp ? (grp.nameBn || grp.name) : 'কমন (সকল বিভাগ)',
            fullMarks: es.fullMarks,
            isPairedPaper,
          };
        })}
        pageSize={20}
        searchPlaceholder={'বিষয় বা কোড খুঁজুন...'}
        toolbarExtra={
          activeExam && !activeExam.isLocked && displayedExamSubjects.length > 0 ? (
            <div className="flex items-center gap-2">
              {bulkEditMode ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBulkEditMode(false);
                      setBulkDrafts({});
                    }}
                    disabled={bulkSaving}
                    className="whitespace-nowrap shrink-0"
                  >
                    <X className="w-4 h-4" />
                    {'বাতিল'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkSaveAll}
                    disabled={bulkSaving}
                    className="whitespace-nowrap shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    {bulkSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startBulkEdit}
                  disabled={bulkSaving || bulkAdding}
                  className="whitespace-nowrap shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                  {'নম্বর বণ্টন'}
                </Button>
              )}
            </div>
          ) : undefined
        }
        emptyTitle={'কোনো বিষয় যুক্ত নেই'}
        emptyAction={
          activeExam && !activeExam.isLocked ? (
            <Button onClick={handleBulkAddClassSubjects} disabled={bulkAdding}>
              <Plus className="w-4 h-4" />
              {'ক্লাসের সব বিষয় লোড করুন'}
            </Button>
          ) : undefined
        }
        columns={[
          {
            accessorKey: 'subjectName',
            header: 'বিষয়',
            cell: ({ row }) => (
              <div className="min-w-[150px]">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{row.original.subjectName}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  {row.original.subjectCode && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {'কোড:'} {row.original.subjectCode}
                    </span>
                  )}
                  {row.original.isPairedPaper && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                      <Link2 className="w-2.5 h-2.5" />
                      {'যৌথ পাশ'}
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          {
            accessorKey: 'groupLabel',
            header: isClassNineTen ? 'বিভাগ / ধরন' : 'ধরন',
            cell: ({ row }) =>
              isClassNineTen ? (
                <div className="text-xs whitespace-nowrap">
                  <div className="text-foreground font-medium">{row.original.groupLabel}</div>
                  <div className="text-muted-foreground">
                    {row.original.es.isOptional ? 'ঐচ্ছিক / ৪র্থ বিষয়' : 'আবশ্যিক'}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {row.original.es.isOptional ? 'ঐচ্ছিক' : 'আবশ্যিক'}
                </span>
              ),
          },
          {
            accessorKey: 'fullMarks',
            header: 'পূর্ণ / পাশ',
            cell: ({ row }) =>
              bulkEditMode ? (
                renderInlinePair(row.original.es.id, 'fullMarks', 'passMarks')
              ) : row.original.es.fullMarks > 0 ? (
                <span className="font-semibold tabular-nums whitespace-nowrap">
                  {formatNumber(row.original.es.fullMarks, 'bn')} /{' '}
                  {formatNumber(row.original.es.passMarks, 'bn')}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
          {
            id: 'written',
            header: 'লিখিত',
            enableSorting: false,
            cell: ({ row }) =>
              bulkEditMode ? (
                renderInlinePair(row.original.es.id, 'writtenFull', 'writtenPass')
              ) : (
                <span className="text-xs tabular-nums whitespace-nowrap">
                  {row.original.es.hasWritten
                    ? `${formatNumber(row.original.es.writtenFullMarks ?? 0, 'bn')} / ${formatNumber(row.original.es.writtenPassMarks ?? 0, 'bn')}`
                    : '—'}
                </span>
              ),
          },
          {
            id: 'mcq',
            header: 'MCQ',
            enableSorting: false,
            cell: ({ row }) =>
              bulkEditMode ? (
                renderInlinePair(row.original.es.id, 'mcqFull', 'mcqPass')
              ) : (
                <span className="text-xs tabular-nums whitespace-nowrap">
                  {row.original.es.hasMcq
                    ? `${formatNumber(row.original.es.mcqFullMarks ?? 0, 'bn')} / ${formatNumber(row.original.es.mcqPassMarks ?? 0, 'bn')}`
                    : '—'}
                </span>
              ),
          },
          {
            id: 'practical',
            header: 'ব্যবহারিক',
            enableSorting: false,
            cell: ({ row }) =>
              bulkEditMode ? (
                renderInlinePair(row.original.es.id, 'practicalFull', 'practicalPass')
              ) : (
                <span className="text-xs tabular-nums whitespace-nowrap">
                  {row.original.es.hasPractical
                    ? `${formatNumber(row.original.es.practicalFullMarks ?? 0, 'bn')} / ${formatNumber(row.original.es.practicalPassMarks ?? 0, 'bn')}`
                    : '—'}
                </span>
              ),
          },
          {
            id: 'ca',
            header: 'ধারাবাহিক',
            enableSorting: false,
            cell: ({ row }) =>
              bulkEditMode ? (
                renderInlinePair(row.original.es.id, 'caFull', 'caPass')
              ) : (
                <span className="text-xs tabular-nums whitespace-nowrap">
                  {row.original.es.hasContinuousAssessment
                    ? `${formatNumber(row.original.es.continuousAssessmentFullMarks ?? 0, 'bn')} / ${formatNumber(row.original.es.continuousAssessmentPassMarks ?? 0, 'bn')}`
                    : '—'}
                </span>
              ),
          },
          {
            id: 'actions',
            header: 'অ্যাকশন',
            enableSorting: false,
            cell: ({ row }) => (
              <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeExam?.isLocked}
                  onClick={() => openEditModal(row.original.es)}
                  aria-label={'সম্পাদনা'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeExam?.isLocked}
                  onClick={() => setDeleteTarget(row.original.es)}
                  aria-label={'মুছে ফেলুন'}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]}
        renderMobileCard={(row) => {
          const { es, subjectName, subjectCode, groupLabel } = row;
          return (
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-foreground">{subjectName}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono">{subjectCode}</span> · {groupLabel} ·{' '}
                    {es.isOptional ? 'ঐচ্ছিক (৪র্থ)' : 'আবশ্যিক'}
                  </p>
                </div>
                <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded bg-surface-muted border border-border">
                  {formatNumber(es.fullMarks, 'bn')} / {formatNumber(es.passMarks, 'bn')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs tabular-nums bg-surface-muted/50 rounded-md p-2">
                <div>
                  <span className="text-xs text-muted-foreground block">{'লিখিত'}</span>
                  <span className="font-semibold">
                    {es.hasWritten ? `${formatNumber(es.writtenFullMarks ?? 0, 'bn')}/${formatNumber(es.writtenPassMarks ?? 0, 'bn')}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">MCQ</span>
                  <span className="font-semibold">
                    {es.hasMcq ? `${formatNumber(es.mcqFullMarks ?? 0, 'bn')}/${formatNumber(es.mcqPassMarks ?? 0, 'bn')}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{'ব্যবহারিক'}</span>
                  <span className="font-semibold">
                    {es.hasPractical ? `${formatNumber(es.practicalFullMarks ?? 0, 'bn')}/${formatNumber(es.practicalPassMarks ?? 0, 'bn')}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{'ধারাবাহিক'}</span>
                  <span className="font-semibold">
                    {es.hasContinuousAssessment
                      ? `${formatNumber(es.continuousAssessmentFullMarks ?? 0, 'bn')}/${formatNumber(es.continuousAssessmentPassMarks ?? 0, 'bn')}`
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeExam?.isLocked}
                  onClick={() => openEditModal(es)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {'সম্পাদনা'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeExam?.isLocked}
                  onClick={() => setDeleteTarget(es)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          );
        }}
      />

      {/* Upsert ExamSubject Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingEs
            ? 'বিষয়ের নম্বর বণ্টন সম্পাদনা করুন'
            : 'পরীক্ষায় নতুন বিষয় যুক্ত করুন'
        }
        size="lg"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{'বিষয় *'}</label>
              <Select
                value={form.subjectId}
                disabled={Boolean(editingEs)}
                onChange={(e) => {
                  const chosen = availableSubjects.find((s) => s.id === e.target.value);
                  setForm({
                    ...form,
                    subjectId: e.target.value,
                    groupId: chosen?.defaultGroupId ?? form.groupId,
                    isOptional: chosen?.defaultIsOptional ?? form.isOptional,
                  });
                }}
              >
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameBn || s.name}{' '}
                    {isClassNineTen && s.officialCode ? `(${s.officialCode})` : ''}
                  </option>
                ))}
              </Select>
            </div>

            {isClassNineTen && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {'একাডেমিক বিভাগ (ঐচ্ছিক)'}
                </label>
                <Select
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                >
                  <option value="">{'সকল বিভাগের জন্য (কমন)'}</option>
                  {groupsList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nameBn || g.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">{'মোট পূর্ণমান *'}</label>
              <Input
                type="number"
                min={10}
                max={200}
                required
                value={form.fullMarks}
                onChange={(e) => {
                  const full = parseNumInput(e.target.value);
                  setForm({
                    ...form,
                    fullMarks: full,
                    passMarks: full === '' ? '' : Math.ceil(full * 0.33),
                  });
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{'মোট পাশ নম্বর *'}</label>
              <Input
                type="number"
                min={1}
                max={Number(form.fullMarks) || 200}
                required
                value={form.passMarks}
                onChange={(e) => setForm({ ...form, passMarks: parseNumInput(e.target.value) })}
              />
            </div>
          </div>

          {/* Marking Components */}
          <div className="border border-border rounded-[var(--radius)] divide-y divide-border">
            {[
              {
                key: 'written',
                label: 'সৃজনশীল / লিখিত (CQ / Written)',
                enabled: form.hasWritten,
                full: form.writtenFullMarks,
                pass: form.writtenPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasWritten: v, writtenFullMarks: v ? form.writtenFullMarks || 70 : 0, writtenPassMarks: v ? form.writtenPassMarks || 23 : 0 }),
                setFull: (v: number | '') => setForm({ ...form, writtenFullMarks: v, writtenPassMarks: v === '' ? '' : Math.ceil(v * 0.33) }),
                setPass: (v: number | '') => setForm({ ...form, writtenPassMarks: v }),
              },
              {
                key: 'mcq',
                label: 'বহুনির্বাচনি (MCQ)',
                enabled: form.hasMcq,
                full: form.mcqFullMarks,
                pass: form.mcqPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasMcq: v, mcqFullMarks: v ? form.mcqFullMarks || 30 : 0, mcqPassMarks: v ? form.mcqPassMarks || 10 : 0 }),
                setFull: (v: number | '') => setForm({ ...form, mcqFullMarks: v, mcqPassMarks: v === '' ? '' : Math.ceil(v * 0.33) }),
                setPass: (v: number | '') => setForm({ ...form, mcqPassMarks: v }),
              },
              {
                key: 'practical',
                label: 'ব্যবহারিক (Practical)',
                enabled: form.hasPractical,
                full: form.practicalFullMarks,
                pass: form.practicalPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasPractical: v, practicalFullMarks: v ? form.practicalFullMarks || 25 : 0, practicalPassMarks: v ? form.practicalPassMarks || 8 : 0 }),
                setFull: (v: number | '') => setForm({ ...form, practicalFullMarks: v, practicalPassMarks: v === '' ? '' : Math.ceil(v * 0.33) }),
                setPass: (v: number | '') => setForm({ ...form, practicalPassMarks: v }),
              },
              {
                key: 'ca',
                label: 'ধারাবাহিক মূল্যায়ন (CA / Class Test)',
                enabled: form.hasContinuousAssessment,
                full: form.continuousAssessmentFullMarks,
                pass: form.continuousAssessmentPassMarks,
                toggle: (v: boolean) => setForm({ ...form, hasContinuousAssessment: v, continuousAssessmentFullMarks: v ? form.continuousAssessmentFullMarks || 20 : 0, continuousAssessmentPassMarks: v ? form.continuousAssessmentPassMarks || 7 : 0 }),
                setFull: (v: number | '') => setForm({ ...form, continuousAssessmentFullMarks: v, continuousAssessmentPassMarks: v === '' ? '' : Math.ceil(v * 0.33) }),
                setPass: (v: number | '') => setForm({ ...form, continuousAssessmentPassMarks: v }),
              },
            ].map((comp) => (
              <div key={comp.key} className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <label className="sm:col-span-6 flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={comp.enabled}
                    onChange={(e) => comp.toggle(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>{comp.label}</span>
                </label>
                <div className="sm:col-span-3">
                  <Input
                    type="number"
                    min={0}
                    max={200}
                    disabled={!comp.enabled}
                    value={comp.full}
                    onChange={(e) => comp.setFull(parseNumInput(e.target.value))}
                    placeholder={'পূর্ণমান'}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    type="number"
                    min={0}
                    max={Number(comp.full) || 200}
                    disabled={!comp.enabled}
                    value={comp.pass}
                    onChange={(e) => comp.setPass(parseNumInput(e.target.value))}
                    placeholder={'পাশ নম্বর'}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isOptional}
                onChange={(e) => setForm({ ...form, isOptional: e.target.checked })}
                className="rounded border-border"
              />
              <span>{'ঐচ্ছিক / ৪র্থ বিষয় হিসেবে গণ্য হবে'}</span>
            </label>
            <span
              className={`font-semibold ${
                componentSum === (Number(form.fullMarks) || 0) ? 'text-success' : 'text-destructive'
              }`}
            >
              {'উপাংশের যোগফল:'} {formatNumber(componentSum, 'bn')} /{' '}
              {formatNumber(Number(form.fullMarks) || 0, 'bn')}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" disabled={saving || componentSum !== (Number(form.fullMarks) || 0)}>
              {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={'বিষয় অপসারণ নিশ্চিত করুন'}
        description={'এই বিষয়টি পরীক্ষা থেকে সরিয়ে ফেললে সংশ্লিষ্ট নম্বর ও রুটিনও মুছে যাবে। আপনি কি নিশ্চিত?'}
        confirmLabel={'অপসারণ করুন'}
        destructive
      />

      <Modal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        title={'আগের পরীক্ষা থেকে বিষয় ও নম্বর বণ্টন কপি করুন'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {'কোন পরীক্ষা থেকে কপি করবেন?'}
            </label>
            <Select
              value={resolvedCopySourceExamId}
              onChange={(e) => setCopySourceExamId(e.target.value)}
            >
              {copySourceExams.map((ex) => {
                const cls = classesList.find((c) => c.id === ex.classId);
                return (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} {cls ? `(${cls.nameBn || cls.name})` : ''}
                  </option>
                );
              })}
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            {copySourceLoading
              ? 'উৎস পরীক্ষার বিষয়গুলো লোড হচ্ছে...'
              : `নির্বাচিত পরীক্ষায় ${formatNumber(copySourceSubjects.length, 'bn')}টি বিষয় পাওয়া গেছে। যেগুলো বর্তমান পরীক্ষায় নেই, সেগুলো পূর্ণমান ও পাশ নম্বরসহ কপি হবে।`}
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyModalOpen(false)}
              disabled={copying}
            >
              {'বাতিল'}
            </Button>
            <Button
              type="button"
              onClick={handleCopyFromExam}
              disabled={copying || copySourceLoading || copySourceSubjects.length === 0}
            >
              <Copy className="w-4 h-4" />
              {copying ? 'কপি হচ্ছে...' : 'কপি করুন'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
