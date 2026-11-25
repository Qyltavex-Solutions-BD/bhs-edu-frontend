'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Search,
  Upload,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Save,
  SearchX,
  Trash2,
  X,
} from 'lucide-react';
import {
  useDeleteCmsItemMutation,
  useGetBootstrapQuery,
  useReorderCmsItemsMutation,
  useToggleCmsItemMutation,
  useUpdateAdmissionContentMutation,
  useUpsertCmsItemMutation,
} from '@/src/store/api';
import { useCreateNoticeMutation, useGetAdminNoticesQuery, useGetAdminNoticeDocumentMutation, useUpdateNoticeMutation, useDeleteNoticeMutation } from '@/src/features/notices/api/notices.api';
import { noticeSchema } from '@/src/features/notices/schemas';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import {
  NoticeDocumentModal,
  NoticeFormatBadge,
} from '@/src/components/shared/NoticeDocumentViewer';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  SegmentedTabs,
  Select,
  Switch,
  Textarea,
} from '@/src/components/ui/primitives';
import { LibraryDistributionType, NoticeAudience, NoticeStatus, ResourceType } from '@/src/types/enums';
import type { Notice } from '@/src/types/entities';

// 7.11 Library
export function AdminNoticesAndEventsPage({
  defaultTab = 'notices',
  openComposer = false,
}: {
  defaultTab?: 'notices' | 'news' | 'events' | 'careers';
  openComposer?: boolean;
}) {

  const [createNotice, { isLoading: saving }] = useCreateNoticeMutation();
  const [toggleCms] = useToggleCmsItemMutation();
  const [upsertCms, { isLoading: savingCms }] = useUpsertCmsItemMutation();
  const [deleteCms] = useDeleteCmsItemMutation();
  const { locale, pick } = useI18n();
  const [tab, setTab] = useState(defaultTab);
  const { data: db, isLoading } = useGetBootstrapQuery(undefined, { skip: tab === 'notices' });
  const [composerOpen, setComposerOpen] = useState(openComposer);
  const [viewerNotice, setViewerNotice] = useState<Notice | null>(null);

  // News / Event / Career CRUD modal state
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [newsForm, setNewsForm] = useState({ id: '', title: '', description: '', image: '', isPublished: true });
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ id: '', title: '', description: '', startDate: '2026-12-16', categoryId: '', isPublished: true });
  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [careerForm, setCareerForm] = useState({ id: '', title: '', description: '', deadline: '2026-12-31', isPublished: true });

  const [statusFilter, setStatusFilter] = useState<NoticeStatus | ''>('');
  const [audienceFilter, setAudienceFilter] = useState<NoticeAudience | ''>('');
  const [noticeSearch, setNoticeSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [noticePage, setNoticePage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(noticeSearch.trim());
      setNoticePage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [noticeSearch]);

  const { currentData: noticeList, isFetching: loadingNotices, isError: noticesError } =
    useGetAdminNoticesQuery(
      {
        status: statusFilter || undefined,
        audience: audienceFilter || undefined,
        page: noticePage,
        search: debouncedSearch || undefined,
      },
      { skip: tab !== 'notices' }
    );
  const [getDocument] = useGetAdminNoticeDocumentMutation({ selectFromResult: () => ({}) });
  useEffect(() => {
    const url = viewerNotice?.attachmentUrl;
    return () => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [viewerNotice]);

  const openPreview = async (notice: Notice) => {
    if (notice.status === NoticeStatus.PUBLISHED || !notice.attachmentSize) {
      setViewerNotice(notice);
      return;
    }
    try {
      const attachmentUrl = await getDocument(notice.id).unwrap();
      setViewerNotice({ ...notice, attachmentUrl });
    } catch (error) {
      toast.error((error as { message?: string }).message ?? 'Could not open the document.');
    }
  };

  const [deleteNotice, { isLoading: deletingNotice }] = useDeleteNoticeMutation();
  const [updateNotice, { isLoading: updatingNotice }] = useUpdateNoticeMutation();
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const editingNoticeId = editingNotice?.id;
  const [form, setForm] = useState<{
    memoNo: string;
    title: string;
    status: NoticeStatus;
    isUrgent: boolean;
    audiences: NoticeAudience[];
  }>({
    memoNo: '',
    title: '',
    status: NoticeStatus.DRAFT,
    isUrgent: false,
    audiences: [NoticeAudience.PUBLIC],
  });
  const [document, setDocument] = useState<File | null>(null);

  const AUDIENCE_OPTIONS: Array<{
    value: NoticeAudience;
    labelBn: string;
    labelEn: string;
  }> = [
    { value: NoticeAudience.PUBLIC, labelBn: 'সবার জন্য (পাবলিক)', labelEn: 'Public (All)' },
    { value: NoticeAudience.TEACHER, labelBn: 'শিক্ষক', labelEn: 'Teacher' },
    { value: NoticeAudience.PARENT, labelBn: 'অভিভাবক', labelEn: 'Parent' },
    { value: NoticeAudience.ACCOUNTANT, labelBn: 'অ্যাকাউন্ট্যান্ট', labelEn: 'Accountant' },
  ];

  const toggleFormAudience = (target: NoticeAudience) => {
    setForm((prev) => {
      const exists = prev.audiences.includes(target);
      if (exists && prev.audiences.length === 1) return prev;
      const next = exists
        ? prev.audiences.filter((a) => a !== target)
        : [...prev.audiences, target];
      return { ...prev, audiences: next };
    });
  };

  const closeComposer = () => {
    setComposerOpen(false);
    setEditingNotice(null);
    setDocument(null);
    setForm({
      memoNo: '',
      title: '',
      status: NoticeStatus.DRAFT,
      isUrgent: false,
      audiences: [NoticeAudience.PUBLIC],
    });
  };

  const openEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title,
      memoNo: notice.memoNo ?? '',
      status: notice.status,
      isUrgent: notice.isUrgent ?? false,
      audiences: notice.audiences?.length ? notice.audiences : [NoticeAudience.PUBLIC],
    });
    setComposerOpen(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const fields = noticeSchema.safeParse(form);
    if (!fields.success) {
      toast.error('Enter a valid notice title and memo number.');
      return;
    }

    if (document && document.size > 25 * 1024 * 1024) {
      toast.error(pick('সর্বোচ্চ ২৫ MB পর্যন্ত ফাইল নির্বাচন করুন।', 'Select a file up to 25 MB.'));
      return;
    }
    const targetAudiences = fields.data.audiences ?? [NoticeAudience.PUBLIC];

    try {
      if (editingNoticeId) {
        await updateNotice({
          id: editingNoticeId,
          title: fields.data.title,
          memoNo: fields.data.memoNo ?? '',
          status: fields.data.status,
          isUrgent: fields.data.isUrgent ?? false,
          audiences: targetAudiences,
          file: document ?? undefined,
        }).unwrap();
      } else {
        if (!document) return;
        const body = new FormData();
        body.set('title', fields.data.title);
        if (fields.data.memoNo) body.set('memoNo', fields.data.memoNo);
        body.set('status', fields.data.status);
        body.set('isUrgent', String(fields.data.isUrgent ?? false));
        body.set('audiences', JSON.stringify(targetAudiences));
        body.set('file', document);
        await createNotice(body).unwrap();
        setStatusFilter('');
        setAudienceFilter('');
        setNoticeSearch('');
        setNoticePage(1);
      }
      toast.success(editingNoticeId ? 'Notice updated.' : 'Notice saved.');
      closeComposer();
    } catch (error) {
      toast.error((error as { message?: string }).message ?? 'Could not save the notice.');
    }
  };

  if (tab !== 'notices' && (isLoading || !db)) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('নোটিশ, সংবাদ, অনুষ্ঠান ও নিয়োগ', 'Notices, News, Events & Careers')}
        description={pick(
          'পাবলিক ওয়েবসাইটের নোটিশ বোর্ড, বিদ্যালয় সংবাদ, অনুষ্ঠান সূচি এবং নিয়োগ বিজ্ঞপ্তি এখান থেকে প্রকাশ ও সম্পাদনা করুন।',
          'Publish and edit official notices, campus news, events, and career circulars for the public website.'
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/notices" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <ExternalLink className="w-4 h-4" />
                {pick('পাবলিক নোটিশ বোর্ড', 'Public Notices')}
              </Button>
            </Link>
            {tab === 'notices' && (
              <Button variant="primary" size="sm" onClick={() => setComposerOpen(true)} className="whitespace-nowrap">
                <Plus className="w-4 h-4" /> {pick('নতুন নোটিশ প্রকাশ', 'Publish Notice')}
              </Button>
            )}
            {tab === 'news' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setNewsForm({ id: '', title: '', description: '', image: '', isPublished: true });
                  setNewsModalOpen(true);
                }}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> {pick('নতুন সংবাদ যুক্ত', 'Add News')}
              </Button>
            )}
            {tab === 'events' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEventForm({
                    id: '',
                    title: '',
                    description: '',
                    startDate: '2026-12-16',
                    categoryId: db?.eventCategories[0]?.id ?? 'ec-1',
                    isPublished: true,
                  });
                  setEventModalOpen(true);
                }}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> {pick('নতুন অনুষ্ঠান যুক্ত', 'Add Event')}
              </Button>
            )}
            {tab === 'careers' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCareerForm({ id: '', title: '', description: '', deadline: '2026-12-31', isPublished: true });
                  setCareerModalOpen(true);
                }}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> {pick('নতুন নিয়োগ বিজ্ঞপ্তি', 'Add Career Post')}
              </Button>
            )}
          </div>
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'notices', label: pick('নোটিশ', 'Notices'), count: noticeList?.meta.total },
          { value: 'news', label: pick('সংবাদ', 'News'), count: db?.news?.length },
          { value: 'events', label: pick('অনুষ্ঠান', 'Events'), count: db?.events?.length },
          { value: 'careers', label: pick('নিয়োগ', 'Careers'), count: db?.careers?.length },
        ]}
      />

      {tab === 'notices' && (
        <Card className="divide-y divide-border">
          <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_12rem_13rem]">
            <FormField label={pick('বিজ্ঞপ্তি খুঁজুন', 'Search notices')}>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" value={noticeSearch} className="pl-9"
                  placeholder={pick('শিরোনাম বা স্মারক নম্বর', 'Title or memo number')}
                  onChange={(event) => { setNoticeSearch(event.target.value); setNoticePage(1); }} />
              </div>
            </FormField>
            <FormField label={pick('প্রাপক / অডিয়েন্স', 'Audience')}>
              <Select
                aria-label={pick('প্রাপক', 'Filter by audience')}
                value={audienceFilter}
                onChange={(e) => {
                  setAudienceFilter(e.target.value as NoticeAudience | '');
                  setNoticePage(1);
                }}
              >
                <option value="">{pick('সকল প্রাপক', 'All audiences')}</option>
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {pick(opt.labelBn, opt.labelEn)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={pick('\u0985\u09ac\u09b8\u09cd\u09a5\u09be', 'Filter by status')}>
              <Select aria-label={pick('অবস্থা', 'Filter by status')} value={statusFilter} onChange={(e) => {
                setStatusFilter(e.target.value as NoticeStatus | '');
                setNoticePage(1);
              }}>
                <option value="">{pick('সকল অবস্থা', 'All statuses')}</option>
                {Object.values(NoticeStatus).map((status) => <option key={status} value={status}>{status}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-surface-muted text-sm text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3.5 text-left font-semibold">{pick('বিষয়', 'Notice')}</th>
                  <th scope="col" className="p-3.5 text-left font-semibold">{pick('স্মারক নং', 'Memo No.')}</th>
                  <th scope="col" className="p-3.5 text-left font-semibold">{pick('তারিখ', 'Date')}</th>
                  <th scope="col" className="p-3.5 text-left font-semibold">{pick('অবস্থা', 'Status')}</th>
                  <th scope="col" className="p-3.5 text-right font-semibold">{pick('ব্যবস্থাপনা', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingNotices &&
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={`notice-skeleton-${idx}`} className="animate-pulse">
                      <td className="p-3">
                        <div className="h-4 w-3/4 max-w-sm rounded bg-surface-muted" />
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-4 w-14 rounded bg-surface-muted" />
                          <div className="h-3 w-12 rounded bg-surface-muted" />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="h-4 w-24 rounded bg-surface-muted" />
                      </td>
                      <td className="p-3">
                        <div className="h-4 w-20 rounded bg-surface-muted" />
                      </td>
                      <td className="p-3">
                        <div className="h-6 w-20 rounded-full bg-surface-muted" />
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="h-7 w-14 rounded bg-surface-muted" />
                          <div className="h-7 w-14 rounded bg-surface-muted" />
                          <div className="h-7 w-14 rounded bg-surface-muted" />
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loadingNotices && noticesError && (
                  <tr>
                    <td colSpan={5} className="py-12 px-4 text-center">
                      <div className="mx-auto max-w-sm space-y-2">
                        <p role="alert" className="text-base font-semibold text-destructive">
                          {pick('নোটিশ লোড করা যায়নি', 'Could not load notices')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pick(
                            'সার্ভারের সাথে সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
                            'There was a problem connecting to the server. Please try again.'
                          )}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loadingNotices && !noticesError && !noticeList?.items.length && (
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
                            {noticeSearch || statusFilter
                              ? pick(
                                  'আপনার অনুসন্ধান বা নির্বাচিত ফিল্টারের সাথে কোনো নোটিশ মেলেনি।',
                                  'No notices match your current search or status filter.'
                                )
                              : pick(
                                  'এখনো কোনো নোটিশ প্রকাশ বা সংরক্ষণ করা হয়নি।',
                                  'No notices have been published or saved yet.'
                                )}
                          </p>
                        </div>
                        {(noticeSearch || statusFilter || audienceFilter) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNoticeSearch('');
                              setDebouncedSearch('');
                              setStatusFilter('');
                              setAudienceFilter('');
                              setNoticePage(1);
                            }}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {pick('ফিল্টার রিসেট করুন', 'Reset Filters')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {!loadingNotices && !noticesError && noticeList?.items.map((n) => (
                  <tr key={n.id}>
                    <td className="p-3.5">
                      <span className="block text-base font-semibold text-foreground">{n.title}</span>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <NoticeFormatBadge notice={n} showSize />
                        {(n.audiences?.length ? n.audiences : [NoticeAudience.PUBLIC]).map((aud) => {
                          const opt = AUDIENCE_OPTIONS.find((o) => o.value === aud);
                          return (
                            <span
                              key={aud}
                              className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-muted text-muted-foreground border border-border"
                            >
                              {opt ? pick(opt.labelBn, opt.labelEn) : aud}
                            </span>
                          );
                        })}
                        {n.isUrgent && <span className="text-xs font-semibold text-destructive">{pick('জরুরি', 'Urgent')}</span>}
                      </div>
                    </td>
                    <td className="p-3.5 text-sm text-muted-foreground">
                      <span className="tabular-nums">{n.memoNo || '—'}</span>
                    </td>
                    <td className="whitespace-nowrap p-3.5 text-sm text-muted-foreground">
                      <span className="tabular-nums">{formatDateShort(n.createdAt, locale)}</span>
                    </td>
                    <td className="whitespace-nowrap p-3.5">
                      {n.deletionPending
                        ? <span className="text-sm font-medium text-destructive">{pick('মুছে ফেলা হচ্ছে', 'Deletion pending')}</span>
                        : <StatusBadge enumName="NoticeStatus" value={n.status} />}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Button type="button" variant="ghost" size="sm" disabled={n.deletionPending} onClick={() => void openPreview(n)}>
                          <Eye className="h-3.5 w-3.5" />
                          {pick('দেখুন', 'View')}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" disabled={n.deletionPending} onClick={() => openEdit(n)}>
                          <Pencil className="h-3.5 w-3.5" />
                          {pick('সম্পাদনা', 'Edit')}
                        </Button>
                          <Button type="button" variant="ghost" size="sm" disabled={deletingNotice}
                            onClick={async () => {
                              if (!n.deletionPending && !window.confirm(pick('নোটিস ও সংযুক্ত ফাইল মুছে ফেলবেন?', 'Delete this notice and its document?'))) return;
                              try {
                                await deleteNotice(n.id).unwrap();
                                toast.success(pick('নোটিস মুছে ফেলা হয়েছে।', 'Notice deleted.'));
                              } catch (error) {
                                toast.error((error as { message?: string }).message ?? 'Could not delete the notice.');
                              }
                            }}>
                            <Trash2 className="h-4 w-4" />
                            {n.deletionPending ? pick('আবার চেষ্টা করুন', 'Retry deletion') : pick('মুছুন', 'Delete')}
                          </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {noticeList && (noticePage > 1 || noticeList.meta.totalPages > 1) && (
            <div className="flex gap-2 p-4">
              <Button type="button" disabled={noticePage === 1} onClick={() => setNoticePage(noticePage - 1)}>Previous</Button>
              <span>{noticePage} / {Math.max(1, noticeList.meta.totalPages)}</span>
              <Button type="button" disabled={noticePage >= noticeList.meta.totalPages} onClick={() => setNoticePage(noticePage + 1)}>Next</Button>
            </div>
          )}
        </Card>
      )}

      {tab === 'news' && (
        <Card className="divide-y divide-border">
          {db?.news?.map((item) => (
            <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-12 rounded-[var(--radius)] object-cover border border-border shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-base font-bold text-foreground truncate">{item.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={item.isPublished}
                  onChange={() => toggleCms({ collection: 'news', id: item.id, field: 'isPublished' })}
                  label={item.isPublished ? pick('প্রকাশিত', 'Published') : pick('খসড়া', 'Draft')}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewsForm({
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      image: item.image ?? '',
                      isPublished: item.isPublished,
                    });
                    setNewsModalOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await deleteCms({ collection: 'news', id: item.id }).unwrap();
                    toast.success(pick('সংবাদ মুছে ফেলা হয়েছে।', 'News removed.'));
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'events' && (
        <Card className="divide-y divide-border">
          {db?.events?.map((ev) => (
            <div key={ev.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-foreground">{ev.title}</p>
                <p className="text-sm text-muted-foreground tabular-nums">{ev.startDate}</p>
                {ev.description && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{ev.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={ev.isPublished}
                  onChange={() => toggleCms({ collection: 'events', id: ev.id, field: 'isPublished' })}
                  label={ev.isPublished ? pick('প্রকাশিত', 'Published') : pick('খসড়া', 'Draft')}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEventForm({
                      id: ev.id,
                      title: ev.title,
                      description: ev.description ?? '',
                      startDate: ev.startDate,
                      categoryId: ev.categoryId,
                      isPublished: ev.isPublished,
                    });
                    setEventModalOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await deleteCms({ collection: 'events', id: ev.id }).unwrap();
                    toast.success(pick('অনুষ্ঠান মুছে ফেলা হয়েছে।', 'Event removed.'));
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'careers' && (
        <Card className="divide-y divide-border">
          {db?.careers?.map((car) => (
            <div key={car.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-foreground">{car.title}</p>
                <p className="text-sm text-destructive tabular-nums">{pick('শেষ তারিখ:', 'Deadline:')} {car.deadline}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{car.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={car.isPublished}
                  onChange={() => toggleCms({ collection: 'careers', id: car.id, field: 'isPublished' })}
                  label={car.isPublished ? pick('প্রকাশিত', 'Published') : pick('বন্ধ', 'Closed')}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCareerForm({
                      id: car.id,
                      title: car.title,
                      description: car.description,
                      deadline: car.deadline,
                      isPublished: car.isPublished,
                    });
                    setCareerModalOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await deleteCms({ collection: 'careers', id: car.id }).unwrap();
                    toast.success(pick('নিয়োগ বিজ্ঞপ্তি মুছে ফেলা হয়েছে।', 'Career post removed.'));
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* News CRUD Modal */}
      <Modal
        open={newsModalOpen}
        onClose={() => setNewsModalOpen(false)}
        title={newsForm.id ? pick('সংবাদ সম্পাদনা', 'Edit News') : pick('নতুন সংবাদ প্রকাশ', 'Publish News')}
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newsForm.title.trim() || !newsForm.description.trim()) return;
            await upsertCms({
              collection: 'news',
              item: {
                ...(newsForm.id ? { id: newsForm.id } : {}),
                title: newsForm.title.trim(),
                description: newsForm.description.trim(),
                image: newsForm.image || null,
                publishedAt: new Date().toISOString(),
                isPublished: newsForm.isPublished,
              },
            }).unwrap();
            toast.success(pick('সংবাদ সংরক্ষিত হয়েছে।', 'News saved.'));
            setNewsModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('সংবাদের শিরোনাম', 'News Title')} required>
            <Input value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} />
          </FormField>
          <FormField label={pick('বিস্তারিত সংবাদ', 'News Details')} required>
            <Textarea rows={4} value={newsForm.description} onChange={(e) => setNewsForm({ ...newsForm, description: e.target.value })} />
          </FormField>
          <FormField label={pick('ফিচার ছবি আপলোড (ঐচ্ছিক)', 'Upload Feature Photo (Optional)')}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') setNewsForm((prev) => ({ ...prev, image: reader.result as string }));
                };
                reader.readAsDataURL(file);
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface-muted file:text-foreground cursor-pointer"
            />
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch checked={newsForm.isPublished} onChange={(v) => setNewsForm({ ...newsForm, isPublished: v })} label={pick('প্রকাশিত', 'Published')} />
            <Button type="submit" variant="primary" disabled={savingCms}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save News')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Event CRUD Modal */}
      <Modal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={eventForm.id ? pick('অনুষ্ঠান সম্পাদনা', 'Edit Event') : pick('নতুন অনুষ্ঠান যুক্ত করুন', 'Add Event')}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!eventForm.title.trim()) return;
            await upsertCms({
              collection: 'events',
              item: {
                ...(eventForm.id ? { id: eventForm.id } : {}),
                title: eventForm.title.trim(),
                description: eventForm.description.trim(),
                startDate: eventForm.startDate,
                categoryId: eventForm.categoryId || db?.eventCategories[0]?.id || 'ec-1',
                isPublished: eventForm.isPublished,
              },
            }).unwrap();
            toast.success(pick('অনুষ্ঠান সংরক্ষিত হয়েছে।', 'Event saved.'));
            setEventModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('অনুষ্ঠানের শিরোনাম', 'Event Title')} required>
            <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={pick('তারিখ', 'Date')} required>
              <Input type="date" value={eventForm.startDate} onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })} />
            </FormField>
            <FormField label={pick('ক্যাটাগরি', 'Category')}>
              <Select value={eventForm.categoryId} onChange={(e) => setEventForm({ ...eventForm, categoryId: e.target.value })}>
                {db?.eventCategories?.map((ec) => (
                  <option key={ec.id} value={ec.id}>{ec.name}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label={pick('বিবরণ', 'Description')}>
            <Textarea rows={3} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={savingCms}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save Event')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Career CRUD Modal */}
      <Modal
        open={careerModalOpen}
        onClose={() => setCareerModalOpen(false)}
        title={careerForm.id ? pick('নিয়োগ বিজ্ঞপ্তি সম্পাদনা', 'Edit Career Post') : pick('নতুন নিয়োগ বিজ্ঞপ্তি', 'New Career Circular')}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!careerForm.title.trim()) return;
            await upsertCms({
              collection: 'careers',
              item: {
                ...(careerForm.id ? { id: careerForm.id } : {}),
                title: careerForm.title.trim(),
                description: careerForm.description.trim(),
                deadline: careerForm.deadline,
                isPublished: careerForm.isPublished,
              },
            }).unwrap();
            toast.success(pick('নিয়োগ বিজ্ঞপ্তি সংরক্ষিত হয়েছে।', 'Career circular saved.'));
            setCareerModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('পদের নাম / শিরোনাম', 'Position Title')} required>
            <Input value={careerForm.title} onChange={(e) => setCareerForm({ ...careerForm, title: e.target.value })} />
          </FormField>
          <FormField label={pick('আবেদনের শেষ তারিখ', 'Application Deadline')} required>
            <Input type="date" value={careerForm.deadline} onChange={(e) => setCareerForm({ ...careerForm, deadline: e.target.value })} />
          </FormField>
          <FormField label={pick('যোগ্যতা ও বিবরণ', 'Requirements & Details')} required>
            <Textarea rows={4} value={careerForm.description} onChange={(e) => setCareerForm({ ...careerForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={savingCms}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save Career')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={composerOpen} onClose={closeComposer} title={editingNoticeId ? pick('নোটিস সম্পাদনা', 'Edit Notice') : pick('নতুন নোটিশ / সার্কুলার প্রকাশ', 'Publish Notice / Circular')} maxWidth="max-w-2xl">
        <form onSubmit={handleSaveNotice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <FormField label={pick('বিজ্ঞপ্তির শিরোনাম', 'Notice Title')} required>
                <Input
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={pick('যেমন: অর্ধবার্ষিক পরীক্ষার সময়সূচি সংক্রান্ত বিজ্ঞপ্তি', 'e.g., Half-Yearly Exam Schedule Circular')}
                />
              </FormField>
            </div>
            <FormField label={pick('স্মারক নং', 'Memo No.')}>
              <Input
                value={form.memoNo}
                onChange={(e) => setForm({ ...form, memoNo: e.target.value })}
                placeholder={pick('যেমন: BHS/২০২৬/০৪২', 'e.g. BHS/2026/042')}
                maxLength={100}
              />
            </FormField>
          </div>

          <FormField
            label={pick('মূল বিজ্ঞপ্তি ফাইল আপলোড (PDF অথবা স্ক্যান করা ছবি)', 'Upload Official Circular (PDF or Scanned Image)')}
          >
            {editingNotice?.attachment && (
              <p className="mb-2 break-all text-sm text-muted-foreground">
                {pick('বর্তমান ফাইল', 'Current file')} {editingNotice.attachment}
              </p>
            )}
            {document ? (
              <div className="p-3 rounded-lg bg-surface-muted/70 border border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {document.name.toLowerCase().endsWith('.pdf') ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{document.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {Math.ceil(document.size / 1024)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDocument(null)}
                  className="h-7 w-7 rounded inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-surface cursor-pointer shrink-0"
                  aria-label={pick('ফাইল সরান', 'Remove file')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 px-4 py-5 border border-dashed border-border hover:border-primary/55 rounded-lg bg-surface-muted/30 hover:bg-surface-muted/60 transition-colors cursor-pointer text-center">
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {editingNoticeId
                    ? pick('নতুন ফাইল বাছুন (ঐচ্ছিক)', 'Select a replacement file (optional)')
                    : pick('PDF ডকুমেন্ট বা স্ক্যান করা নোটিশ ছবি নির্বাচন করুন', 'Select Official PDF or Scanned Notice Image')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {pick('PDF / JPG / PNG / WebP · সর্বোচ্চ ২৫ MB', 'PDF / JPG / PNG / WebP · Max 25 MB')}
                </span>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  required={!editingNoticeId}
                  onChange={(event) => setDocument(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
            )}
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('অবস্থা', 'Status')}>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as NoticeStatus })}>
                <option value={NoticeStatus.PUBLISHED}>{pick('প্রকাশিত', 'Published')}</option>
                <option value={NoticeStatus.DRAFT}>{pick('খসড়া', 'Draft')}</option>
                <option value={NoticeStatus.ARCHIVED}>{pick('আর্কাইভ', 'Archived')}</option>
              </Select>
            </FormField>
            <FormField label={pick('প্রাপক / কাদের জন্য', 'Target Audience')} required>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {AUDIENCE_OPTIONS.map((opt) => {
                  const selected = form.audiences.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleFormAudience(opt.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-surface text-muted-foreground border-border hover:border-primary/40'
                      }`}
                    >
                      {pick(opt.labelBn, opt.labelEn)}
                    </button>
                  );
                })}
              </div>
            </FormField>
          </div>
          <Switch checked={form.isUrgent} onChange={(v) => setForm({ ...form, isUrgent: v })} label={pick('জরুরি নোটিশ হিসেবে চিহ্নিত করুন', 'Mark as urgent notice')} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={saving || updatingNotice} onClick={closeComposer}>
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={saving || updatingNotice}>
              {(saving || updatingNotice) && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving || updatingNotice
                ? editingNoticeId
                  ? pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                  : pick('প্রকাশ হচ্ছে...', 'Publishing...')
                : editingNoticeId
                  ? pick('পরিবর্তন সংরক্ষণ', 'Save changes')
                  : pick('প্রকাশ করুন', 'Save Notice')}
            </Button>
          </div>
        </form>
      </Modal>

      <NoticeDocumentModal
        notice={viewerNotice}
        onClose={() => setViewerNotice(null)}
      />
    </div>
  );
}

// 7.14 Website CMS

