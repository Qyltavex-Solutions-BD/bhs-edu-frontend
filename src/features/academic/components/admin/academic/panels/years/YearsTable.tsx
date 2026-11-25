'use client';

import React from 'react';
import { Calendar, CheckCircle2, Pencil } from 'lucide-react';
import { DataTable } from '@/src/components/shared/DataTable';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button } from '@/src/components/ui';
import { formatDateShort } from '@/src/lib/formatters';
import type { AcademicYear } from '@/src/types/entities';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBnYearText = (val?: string) =>
  val ? val.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : '—';

interface YearsTableProps {
  yearList: AcademicYear[];
  activating: boolean;
  onActivate: (id: string) => void;
  onEdit: (year: AcademicYear) => void;
}

export function YearsTable({
  yearList,
  activating,
  onActivate,
  onEdit,
}: YearsTableProps) {
  return (
    <DataTable
      data={yearList}
      hideToolbar
      emptyTitle="কোনো শিক্ষাবর্ষ পাওয়া যায়নি"
      columns={[
        {
          accessorKey: 'name',
          header: 'শিক্ষাবর্ষ',
          cell: ({ row }) => {
            const year = row.original;
            return (
              <div className="flex items-center gap-2 font-semibold text-foreground tabular-nums whitespace-nowrap">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span>{toBnYearText(year.name)}</span>
              </div>
            );
          },
        },
        {
          accessorKey: 'startDate',
          header: 'সময়সীমা',
          cell: ({ row }) => {
            const year = row.original;
            return (
              <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                {formatDateShort(year.startDate, 'bn')} — {formatDateShort(year.endDate, 'bn')}
              </span>
            );
          },
        },
        {
          accessorKey: 'isActive',
          header: 'অবস্থা',
          cell: ({ row }) => {
            const year = row.original;
            return (
              <StatusBadge
                value={year.isActive ? 'ACTIVE' : 'INACTIVE'}
                customLabel={year.isActive ? 'চলতি' : 'নিষ্ক্রিয়'}
                customTone={year.isActive ? 'success' : 'neutral'}
              />
            );
          },
        },
        {
          id: 'actions',
          header: () => <div className="text-right">ব্যবস্থাপনা</div>,
          enableSorting: false,
          cell: ({ row }) => {
            const year = row.original;
            return (
              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                {!year.isActive && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activating}
                    onClick={() => onActivate(year.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    চলতি করুন
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(year)}
                  aria-label="সম্পাদনা করুন"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  সম্পাদনা
                </Button>
              </div>
            );
          },
        },
      ]}
      renderMobileCard={(year) => (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-foreground tabular-nums">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span>{toBnYearText(year.name)}</span>
            </div>
            <StatusBadge
              value={year.isActive ? 'ACTIVE' : 'INACTIVE'}
              customLabel={year.isActive ? 'চলতি' : 'নিষ্ক্রিয়'}
              customTone={year.isActive ? 'success' : 'neutral'}
            />
          </div>

          <div className="text-xs text-muted-foreground tabular-nums bg-surface-muted/50 rounded-md px-3 py-2">
            <span className="block font-medium text-foreground/80 mb-0.5">সময়সীমা</span>
            <span>
              {formatDateShort(year.startDate, 'bn')} — {formatDateShort(year.endDate, 'bn')}
            </span>
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border">
            {!year.isActive && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activating}
                onClick={() => onActivate(year.id)}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                চলতি করুন
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(year)}
              aria-label="সম্পাদনা করুন"
            >
              <Pencil className="w-3.5 h-3.5" />
              সম্পাদনা
            </Button>
          </div>
        </div>
      )}
    />
  );
}
