'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/src/components/ui/primitives';
import type { PaginationMeta } from '../api/attendance.api';

export function AttendancePagination({
  meta,
  onPageChange,
}: {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  if (!meta || meta.total <= 0) return null;

  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-4 py-3 text-sm text-muted-foreground">
      <span>
        {`মোট ${meta.total}টির মধ্যে ${from}–${to} প্রদর্শিত হচ্ছে`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          {'পূর্ববর্তী'}
        </Button>
        <span className="px-2 font-medium text-foreground">
          {meta.page} / {Math.max(1, meta.totalPages)}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          {'পরবর্তী'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
