'use client';

import React from 'react';
import { Button, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';
import { getEnumMeta } from '@/src/lib/constants/enums';
import { ExamStatus, ExamType } from '@/src/types/enums';
import type { AcademicYear, Exam, GradingScale, SchoolClass } from '@/src/types/entities';
import { ALLOWED_EXAM_TYPES } from '../../schemas';

export interface ExamFormState {
  name: string;
  classIds: string[];
  classEndDates: Record<string, string>;
  academicYearId: string;
  examType: ExamType;
  gradingScaleId: string;
  startDate: string;
  endDate: string;
  marksEntryDeadline: string;
  status: ExamStatus;
  allowCombinedPass: boolean;
}

interface ExamFormModalProps {
  open: boolean;
  onClose: () => void;
  editingExam: Exam | null;
  form: ExamFormState;
  setForm: React.Dispatch<React.SetStateAction<ExamFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  classesList: SchoolClass[];
  gradingScalesList: GradingScale[];
  activeYearObj?: AcademicYear;
}

export function buildExamOptionName(examType: ExamType, activeYear?: AcademicYear): string {
  const base =
    examType === ExamType.HALF_YEARLY
      ? 'অর্ধবার্ষিক পরীক্ষা'
      : examType === ExamType.ANNUAL
        ? 'বার্ষিক পরীক্ষা'
        : 'নির্বাচনী পরীক্ষা';
  const yearMatch = activeYear?.name?.match(/\d{4}/)?.[0];
  return yearMatch ? `${base} ${formatNumber(yearMatch, 'bn')}` : base;
}

export function ExamFormModal({
  open,
  onClose,
  editingExam,
  form,
  setForm,
  onSubmit,
  submitting,
  classesList,
  gradingScalesList,
  activeYearObj,
}: ExamFormModalProps) {
  const isSelectionExam = form.examType === ExamType.SELECTION;
  const class10 = classesList.find((c) => c.numericValue === 10);

  const handleExamTypeChange = (nextType: ExamType) => {
    const nextName = buildExamOptionName(nextType, activeYearObj);
    if (!editingExam && nextType === ExamType.SELECTION) {
      setForm({
        ...form,
        examType: nextType,
        name: nextName,
        classIds: class10 ? [class10.id] : [],
      });
    } else if (!editingExam) {
      setForm({
        ...form,
        examType: nextType,
        name: nextName,
        classIds:
          form.classIds.length <= 1 && classesList.length > 1
            ? classesList.map((c) => c.id)
            : form.classIds,
      });
    } else {
      setForm({ ...form, examType: nextType, name: nextName });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingExam ? 'পরীক্ষার তথ্য সম্পাদনা করুন' : 'নতুন পরীক্ষা তৈরি করুন'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">পরীক্ষার নাম *</label>
            <Select
              value={form.examType}
              onChange={(e) => handleExamTypeChange(e.target.value as ExamType)}
            >
              {ALLOWED_EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {buildExamOptionName(t, activeYearObj)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">গ্রেডিং স্কেল *</label>
            <Select
              value={form.gradingScaleId}
              onChange={(e) => setForm({ ...form, gradingScaleId: e.target.value })}
            >
              {gradingScalesList
                .filter((g) => !g.isDeleted)
                .map((gs) => (
                  <option key={gs.id} value={gs.id}>
                    {gs.name.replace(/\s*\([^)]*\)/g, '').trim()}
                  </option>
                ))}
            </Select>
          </div>

          {!editingExam && (
            <>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium">শ্রেণি নির্বাচন করুন *</label>
                  {!isSelectionExam && (
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected =
                          classesList.length > 0 && form.classIds.length === classesList.length;
                        setForm({
                          ...form,
                          classIds: allSelected ? [] : classesList.map((c) => c.id),
                        });
                      }}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {classesList.length > 0 && form.classIds.length === classesList.length
                        ? 'সবগুলো বাদ দিন'
                        : 'সকল শ্রেণি নির্বাচন করুন'}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {classesList.map((c) => {
                    const disabled = isSelectionExam && c.numericValue !== 10;
                    const checked = form.classIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius)] border text-xs sm:text-sm font-medium transition-colors select-none ${
                          disabled
                            ? 'border-border/50 bg-surface-muted/50 text-muted-foreground/50 cursor-not-allowed opacity-60'
                            : checked
                              ? 'border-primary bg-primary/10 text-primary cursor-pointer'
                              : 'border-border bg-surface text-muted-foreground hover:text-foreground cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={checked}
                          onChange={(e) => {
                            if (disabled) return;
                            const next = e.target.checked
                              ? [...form.classIds, c.id]
                              : form.classIds.filter((id) => id !== c.id);
                            setForm({ ...form, classIds: next });
                          }}
                          className="rounded border-border accent-primary disabled:cursor-not-allowed"
                        />
                        <span>{c.nameBn || c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">চলতি শিক্ষাবর্ষ *</label>
                <Input
                  readOnly
                  disabled
                  value={
                    activeYearObj
                      ? `${formatNumber(activeYearObj.name, 'bn')} (চলতি)`
                      : 'কোনো চলতি শিক্ষাবর্ষ নেই'
                  }
                  className="bg-surface-muted/70 text-foreground font-medium cursor-not-allowed opacity-90"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">শুরুর তারিখ *</label>
            <Input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>

          {(editingExam || isSelectionExam) && (
            <div>
              <label className="block text-sm font-medium mb-1">শেষের তারিখ *</label>
              <Input
                type="date"
                required
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          )}

          {!editingExam && !isSelectionExam && form.classIds.length > 0 && (
            <div className="sm:col-span-2 rounded-[var(--radius)] border border-border bg-surface-muted/40 p-3 space-y-2">
              <span className="block text-xs font-semibold text-foreground">
                শ্রেণিভিত্তিক শেষের তারিখ *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {classesList
                  .filter((c) => form.classIds.includes(c.id))
                  .map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background px-2.5 py-1.5"
                    >
                      <span className="text-xs font-medium text-foreground truncate">
                        {c.nameBn || c.name}
                      </span>
                      <Input
                        type="date"
                        required
                        value={form.classEndDates[c.id] || form.endDate}
                        min={form.startDate}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            classEndDates: {
                              ...form.classEndDates,
                              [c.id]: e.target.value,
                            },
                          })
                        }
                        className="h-8 w-36 text-xs"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">নম্বর এন্ট্রির শেষ তারিখ</label>
            <Input
              type="date"
              value={form.marksEntryDeadline}
              onChange={(e) => setForm({ ...form, marksEntryDeadline: e.target.value })}
            />
          </div>

          {editingExam && (
            <div>
              <label className="block text-sm font-medium mb-1">পরীক্ষার অবস্থা</label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ExamStatus })}
              >
                {Object.values(ExamStatus).map((st) => {
                  const meta = getEnumMeta('ExamStatus', st);
                  return (
                    <option key={st} value={st}>
                      {meta.bn}
                    </option>
                  );
                })}
              </Select>
            </div>
          )}

          <div className="sm:col-span-2 pt-1">
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowCombinedPass}
                onChange={(e) => setForm({ ...form, allowCombinedPass: e.target.checked })}
                className="mt-1 rounded border-border"
              />
              <span>
                <strong className="text-foreground">
                  এনসিটিবি যৌথ পত্র পাশ নীতি (Combined Pass)
                </strong>
                <span className="block text-xs text-muted-foreground">
                  বাংলা ১ম/২য় ও ইংরেজি ১ম/২য় পত্রের মতো জোড়া বিষয়ে বোর্ডের যৌথ পাশ নীতি প্রয়োগ হবে।
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            বাতিল
          </Button>
          <Button type="submit" disabled={submitting}>
            {editingExam ? 'পরিবর্তন সংরক্ষণ করুন' : 'পরীক্ষা তৈরি করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
