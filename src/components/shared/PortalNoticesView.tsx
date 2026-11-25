'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Eye, RotateCcw, Search, SearchX } from 'lucide-react';
import {
  useGetPortalNoticeDocumentMutation,
  useGetPortalNoticesQuery,
} from '@/src/features/notices/api/notices.api';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { PageHeader } from '@/src/components/shared/Feedback';
import {
  NoticeDocumentModal,
  NoticeFormatBadge,
} from '@/src/components/shared/NoticeDocumentViewer';
import { Button, Card, FormField, Input, Select } from '@/src/components/ui/primitives';
import { NoticeAudience } from '@/src/types/enums';
import type { Notice } from '@/src/types/entities';

interface PortalNoticesViewProps {
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
}

const AUDIENCE_LABELS: Record<NoticeAudience, { bn: string; en: string }> = {
  [NoticeAudience.PUBLIC]: { bn: 'সবার জন্য', en: 'Public' },
  [NoticeAudience.ADMIN]: { bn: 'অ্যাডমিন', en: 'Admin' },
  [NoticeAudience.TEACHER]: { bn: 'শিক্ষক', en: 'Teacher' },
  [NoticeAudience.PARENT]: { bn: 'অভিভাবক', en: 'Parent' },
  [NoticeAudience.ACCOUNTANT]: { bn: 'অ্যাকাউন্ট্যান্ট', en: 'Accountant' },
};

export function PortalNoticesView({
  titleBn,
  titleEn,
  descriptionBn,
  descriptionEn,
}: PortalNoticesViewProps) {
  const { locale, pick } = useI18n();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [urgentFilter, setUrgentFilter] = useState<'all' | 'urgent'>('all');
  const [page, setPage] = useState(1);
  const [viewerNotice, setViewerNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const url = viewerNotice?.attachmentUrl;
    return () => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [viewerNotice]);

  const {
    currentData: noticeList,
    isFetching: loadingNotices,
    isError: noticesError,
  } = useGetPortalNoticesQuery({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    urgent: urgentFilter === 'urgent' ? true : undefined,
  });

  const [getPortalDocument] = useGetPortalNoticeDocumentMutation();

  const openPreview = async (notice: Notice) => {
    const isPublicNotice =
      !notice.audiences?.length || notice.audiences.includes(NoticeAudience.PUBLIC);
    if (isPublicNotice || !notice.attachmentSize) {
      setViewerNotice(notice);
      return;
    }

    try {
      const attachmentUrl = await getPortalDocument(notice.id).unwrap();
      setViewerNotice({ ...notice, attachmentUrl });
    } catch (error) {
      toast.error(
        (error as { message?: string }).message ??
          pick('ডকুমেন্ট খোলা যায়নি।', 'Could not open the document.')
      );
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setUrgentFilter('all');
    setPage(1);
  };

  const hasFilters = Boolean(search || urgentFilter !== 'all');
  const totalPages = noticeList?.meta?.totalPages ?? 1;
  const items = noticeList?.items ?? [];

  const renderAudienceBadges = (notice: Notice) =>
    (notice.audiences?.length ? notice.audiences : [NoticeAudience.PUBLIC]).map((aud) => {
      const lbl = AUDIENCE_LABELS[aud];
      return (
        <span
          key={aud}
          className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-muted text-muted-foreground border border-border"
        >
          {lbl ? pick(lbl.bn, lbl.en) : aud}
        </span>
      );
    });

  return (
    <div className="space-y-6">
      <PageHeader title={pick(titleBn, titleEn)} description={pick(descriptionBn, descriptionEn)} />

      <Card className="divide-y divide-border overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <FormField label={pick('বিজ্ঞপ্তি খুঁজুন', 'Search notices')}>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={search}
                className="pl-9 text-base"
                placeholder={pick('শিরোনাম বা স্মারক নম্বর', 'Title or memo number')}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </FormField>
          <FormField label={pick('ধরন', 'Priority')}>
            <Select
              value={urgentFilter}
              className="text-base"
              onChange={(e) => {
                setUrgentFilter(e.target.value as 'all' | 'urgent');
                setPage(1);
              }}
            >
              <option value="all">{pick('সকল নোটিশ', 'All Notices')}</option>
              <option value="urgent">{pick('শুধুমাত্র জরুরি', 'Urgent Only')}</option>
            </Select>
          </FormField>
        </div>

        {/* Mobile Card View (< md) */}
        <div className="md:hidden divide-y divide-border">
          {loadingNotices &&
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`portal-mobile-skel-${idx}`} className="p-4 space-y-3 animate-pulse">
                <div className="h-5 w-4/5 rounded bg-surface-muted" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded bg-surface-muted" />
                  <div className="h-5 w-20 rounded-full bg-surface-muted" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="h-4 w-28 rounded bg-surface-muted" />
                  <div className="h-8 w-20 rounded bg-surface-muted" />
                </div>
              </div>
            ))}

          {!loadingNotices && noticesError && (
            <div className="py-12 px-4 text-center">
              <p role="alert" className="text-base font-semibold text-destructive">
                {pick('নোটিশ লোড করা যায়নি।', 'Could not load notices.')}
              </p>
            </div>
          )}

          {!loadingNotices && !noticesError && !items.length && (
            <div className="py-12 px-4 text-center">
              <div className="mx-auto max-w-sm flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center text-muted-foreground">
                  <SearchX className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    {pick('কোনো নোটিশ পাওয়া যায়নি', 'No matching notices found')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasFilters
                      ? pick(
                          'আপনার অনুসন্ধান বা ফিল্টারের সাথে কোনো নোটিশ মেলেনি।',
                          'No notices match your current search or filter.'
                        )
                      : pick(
                          'আপনার পোর্টালের জন্য এখনো কোনো নোটিশ প্রকাশিত হয়নি।',
                          'No notices have been published for your portal yet.'
                        )}
                  </p>
                </div>
                {hasFilters && (
                  <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                    <RotateCcw className="w-3.5 h-3.5" />
                    {pick('ফিল্টার রিসেট করুন', 'Reset Filters')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {!loadingNotices &&
            !noticesError &&
            items.map((n) => (
              <div key={n.id} className="p-4 space-y-2.5">
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground leading-snug">{n.title}</h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <NoticeFormatBadge notice={n} showSize />
                    {renderAudienceBadges(n)}
                    {n.isUrgent && (
                      <span className="text-xs font-semibold text-destructive">
                        {pick('জরুরি', 'Urgent')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="text-sm text-muted-foreground tabular-nums">
                    {n.memoNo ? `${pick('স্মারক:', 'Memo:')} ${n.memoNo} · ` : ''}
                    {formatDateShort(n.publishedAt ?? n.createdAt, locale)}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void openPreview(n)}
                    className="shrink-0"
                  >
                    <Eye className="h-4 w-4" />
                    {pick('দেখুন', 'View')}
                  </Button>
                </div>
              </div>
            ))}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-surface-muted text-sm text-muted-foreground">
              <tr>
                <th scope="col" className="p-3.5 text-left font-semibold">
                  {pick('বিষয়', 'Notice')}
                </th>
                <th scope="col" className="p-3.5 text-left font-semibold">
                  {pick('স্মারক নং', 'Memo No.')}
                </th>
                <th scope="col" className="p-3.5 text-left font-semibold">
                  {pick('প্রাপক', 'Audience')}
                </th>
                <th scope="col" className="p-3.5 text-left font-semibold">
                  {pick('তারিখ', 'Published')}
                </th>
                <th scope="col" className="p-3.5 text-right font-semibold">
                  {pick('ডকুমেন্ট', 'Document')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingNotices &&
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`portal-notice-skel-${idx}`} className="animate-pulse">
                    <td className="p-3.5">
                      <div className="h-5 w-3/4 max-w-sm rounded bg-surface-muted" />
                      <div className="mt-2 h-4 w-24 rounded bg-surface-muted" />
                    </td>
                    <td className="p-3.5">
                      <div className="h-4 w-20 rounded bg-surface-muted" />
                    </td>
                    <td className="p-3.5">
                      <div className="h-5 w-20 rounded-full bg-surface-muted" />
                    </td>
                    <td className="p-3.5">
                      <div className="h-4 w-24 rounded bg-surface-muted" />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-block h-8 w-18 rounded bg-surface-muted" />
                    </td>
                  </tr>
                ))}

              {!loadingNotices && noticesError && (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center">
                    <p role="alert" className="text-base font-semibold text-destructive">
                      {pick('নোটিশ লোড করা যায়নি।', 'Could not load notices.')}
                    </p>
                  </td>
                </tr>
              )}

              {!loadingNotices && !noticesError && !items.length && (
                <tr>
                  <td colSpan={5} className="py-14 px-4 text-center">
                    <div className="mx-auto max-w-md flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center text-muted-foreground">
                        <SearchX className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-foreground">
                          {pick('কোনো নোটিশ পাওয়া যায়নি', 'No matching notices found')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {hasFilters
                            ? pick(
                                'আপনার অনুসন্ধান বা ফিল্টারের সাথে কোনো নোটিশ মেলেনি।',
                                'No notices match your current search or filter.'
                              )
                            : pick(
                                'আপনার পোর্টালের জন্য এখনো কোনো নোটিশ প্রকাশিত হয়নি।',
                                'No notices have been published for your portal yet.'
                              )}
                        </p>
                      </div>
                      {hasFilters && (
                        <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                          <RotateCcw className="w-3.5 h-3.5" />
                          {pick('ফিল্টার রিসেট করুন', 'Reset Filters')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!loadingNotices &&
                !noticesError &&
                items.map((n) => (
                  <tr key={n.id}>
                    <td className="p-3.5">
                      <span className="block text-base font-semibold text-foreground">{n.title}</span>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <NoticeFormatBadge notice={n} showSize />
                        {n.isUrgent && (
                          <span className="text-xs font-semibold text-destructive">
                            {pick('জরুরি', 'Urgent')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-sm text-muted-foreground tabular-nums">
                      {n.memoNo || '—'}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1.5">{renderAudienceBadges(n)}</div>
                    </td>
                    <td className="whitespace-nowrap p-3.5 text-sm text-muted-foreground tabular-nums">
                      {formatDateShort(n.publishedAt ?? n.createdAt, locale)}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void openPreview(n)}
                      >
                        <Eye className="h-4 w-4" />
                        {pick('দেখুন', 'View')}
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-muted-foreground">
            <span className="tabular-nums">
              {pick('পৃষ্ঠা', 'Page')} {formatNumber(page, locale)} / {formatNumber(totalPages, locale)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loadingNotices}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {pick('পূর্ববর্তী', 'Previous')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loadingNotices}
                onClick={() => setPage((p) => p + 1)}
              >
                {pick('পরবর্তী', 'Next')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <NoticeDocumentModal notice={viewerNotice} onClose={() => setViewerNotice(null)} />
    </div>
  );
}
