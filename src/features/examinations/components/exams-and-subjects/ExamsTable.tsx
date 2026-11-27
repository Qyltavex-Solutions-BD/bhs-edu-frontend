'use client';

import React from 'react';
import Link from 'next/link';
import {
  Edit3,
  Lock,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Select } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { getEnumMeta } from '@/src/lib/constants/enums';
import { ExamStatus } from '@/src/types/enums';
import type { AcademicYear, Exam, SchoolClass } from '@/src/types/entities';

export function resolveDynamicExamStatus(
  exam: Pick<Exam, 'startDate' | 'endDate'>
): ExamStatus {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const startKey = exam.startDate.slice(0, 10);
  const endKey = exam.endDate.slice(0, 10);

  if (todayKey < startKey) return ExamStatus.UPCOMING;
  if (todayKey <= endKey) return ExamStatus.ONGOING;
  return ExamStatus.COMPLETED;
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBnYearText = (val?: string) =>
  val ? val.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : '—';

interface ExamsTableProps {
  exams: Exam[];
  classesList: SchoolClass[];
  academicYearsList: AcademicYear[];
  classFilter: string;
  setClassFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onCreateClick: () => void;
  onEditClick: (exam: Exam) => void;
  onDeleteClick: (exam: Exam) => void;
}

export function ExamsTable({
  exams,
  classesList,
  academicYearsList,
  classFilter,
  setClassFilter,
  statusFilter,
  setStatusFilter,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}: ExamsTableProps) {
  return (
    <DataTable
      data={exams.map((exam) => {
        const cls = exam.schoolClass || classesList.find((c) => c.id === exam.classId);
        const year = exam.academicYear || academicYearsList.find((y) => y.id === exam.academicYearId);
        const typeMeta = getEnumMeta('ExamType', exam.examType);
        const effectiveStatus = resolveDynamicExamStatus(exam);
        const deadlineExpired =
          Boolean(exam.marksEntryDeadline) &&
          new Date(exam.marksEntryDeadline!) < new Date() &&
          effectiveStatus !== ExamStatus.COMPLETED;

        return {
          exam,
          id: exam.id,
          name: exam.name,
          classLabel: cls?.nameBn || cls?.name || '—',
          yearLabel: toBnYearText(year?.name),
          typeLabel: typeMeta.bn,
          startDate: exam.startDate,
          endDate: exam.endDate,
          deadlineExpired,
          status: effectiveStatus,
        };
      })}
      searchPlaceholder="পরীক্ষার নাম, শ্রেণি বা ধরন খুঁজুন..."
      emptyTitle="কোনো পরীক্ষা পাওয়া যায়নি"
      emptyAction={
        <Button onClick={onCreateClick}>
          <Plus className="w-4 h-4" />
          নতুন পরীক্ষা তৈরি করুন
        </Button>
      }
      toolbarExtra={
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-36 sm:w-40">
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              aria-label="শ্রেণি ফিল্টার"
            >
              <option value="ALL">সকল শ্রেণি</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn || c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-36 sm:w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="পরীক্ষার অবস্থা ফিল্টার"
            >
              <option value="ALL">সকল অবস্থা</option>
              {[ExamStatus.UPCOMING, ExamStatus.ONGOING, ExamStatus.COMPLETED].map((st) => {
                const meta = getEnumMeta('ExamStatus', st);
                return (
                  <option key={st} value={st}>
                    {meta.bn}
                  </option>
                );
              })}
            </Select>
          </div>
        </div>
      }
      columns={[
        {
          accessorKey: 'name',
          header: 'পরীক্ষার নাম',
          cell: ({ row }) => {
            const { exam } = row.original;
            return (
              <div className={`min-w-[180px] ${exam.isDeleted ? 'opacity-60' : ''}`}>
                <div className="font-semibold text-foreground flex items-center gap-1.5 leading-snug">
                  <span>{exam.name}</span>
                  {exam.isLocked && (
                    <Lock
                      className="w-3.5 h-3.5 text-muted-foreground shrink-0"
                      aria-label="লক করা"
                    />
                  )}
                </div>
              </div>
            );
          },
        },
        {
          accessorKey: 'classLabel',
          header: 'শ্রেণি',
          cell: ({ row }) => (
            <div className="whitespace-nowrap font-medium text-foreground">
              {row.original.classLabel}
            </div>
          ),
        },
        {
          accessorKey: 'startDate',
          header: 'সময়সূচি',
          cell: ({ row }) => {
            const { exam, deadlineExpired } = row.original;
            return (
              <div className="whitespace-nowrap text-sm tabular-nums space-y-0.5">
                <div className="text-foreground font-medium">
                  শুরু: {formatDateShort(exam.startDate, 'bn')}
                </div>
                <div className="text-muted-foreground">
                  শেষ: {formatDateShort(exam.endDate, 'bn')}
                </div>
                {exam.marksEntryDeadline && (
                  <div className={deadlineExpired ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                    নম্বর জমা: {formatDateShort(exam.marksEntryDeadline, 'bn')}
                  </div>
                )}
              </div>
            );
          },
        },
        {
          accessorKey: 'status',
          header: 'অবস্থা',
          cell: ({ row }) => (
            <StatusBadge enumName="ExamStatus" value={row.original.status} />
          ),
        },
        {
          id: 'actions',
          header: () => <div className="text-right">ব্যবস্থাপনা</div>,
          enableSorting: false,
          cell: ({ row }) => {
            const { exam } = row.original;
            return (
              <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                <Link
                  href={`/admin/examinations/${exam.id}`}
                  className="inline-flex h-8 px-2.5 items-center gap-1.5 rounded-md border border-border bg-surface text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                  title="বিষয় ও নম্বর বণ্টন কনফিগার"
                >
                  <Settings2 className="w-3.5 h-3.5 text-primary" />
                  <span>বিষয়</span>
                </Link>
                <button
                  type="button"
                  onClick={() => onEditClick(exam)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
                  title="সম্পাদনা করুন"
                  aria-label="সম্পাদনা করুন"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteClick(exam)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title="মুছে ফেলুন"
                  aria-label="মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          },
        },
      ]}
      renderMobileCard={(row) => {
        const { exam, classLabel, typeLabel, deadlineExpired, status } = row;
        return (
          <div className={`space-y-3 ${exam.isDeleted ? 'opacity-65' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="truncate">{exam.name}</span>
                  {exam.isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {classLabel} · {typeLabel}
                </p>
              </div>
              <StatusBadge enumName="ExamStatus" value={status} />
            </div>

            <div className="text-sm tabular-nums bg-surface-muted/50 rounded-md p-2.5">
              <span className="text-muted-foreground block">সময়সূচি</span>
              <span className="font-medium text-foreground">
                শুরু: {formatDateShort(exam.startDate, 'bn')} · শেষ: {formatDateShort(exam.endDate, 'bn')}
              </span>
              {exam.marksEntryDeadline && (
                <span
                  className={`block mt-0.5 ${
                    deadlineExpired ? 'text-destructive font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  নম্বর জমা: {formatDateShort(exam.marksEntryDeadline, 'bn')}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <Link href={`/admin/examinations/${exam.id}`}>
                  <Button variant="outline" size="sm">
                    <Settings2 className="w-3.5 h-3.5" />
                    বিষয় ও মান
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditClick(exam)}
                  aria-label="সম্পাদনা করুন"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteClick(exam)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}
