'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Bold,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GripVertical,
  Heading2,
  Image as ImageIcon,
  Italic,
  List,
  Pencil,
  Plus,
  Printer,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  useCreateNoticeMutation,
  useDeleteCmsItemMutation,
  useGetBootstrapQuery,
  useReorderCmsItemsMutation,
  useToggleCmsItemMutation,
  useUpdateAdmissionContentMutation,
  useUpsertCmsItemMutation,
} from '@/src/store/api';
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
import { LibraryDistributionType, NoticeStatus, ResourceType } from '@/src/types/enums';
import type { Notice, NoticeAttachmentType } from '@/src/types/entities';

// 7.11 Library
export function AdminLibraryPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [upsertCms, { isLoading: saving }] = useUpsertCmsItemMutation();
  const [deleteCms] = useDeleteCmsItemMutation();
  const [toggleCms] = useToggleCmsItemMutation();
  const [tab, setTab] = useState<'catalog' | 'distributions'>('catalog');
  const [bookSearch, setBookSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    id: '',
    title: '',
    author: '',
    publisher: '',
    category: 'সাহিত্য',
    description: '',
  });
  const [distModalOpen, setDistModalOpen] = useState(false);
  const [distForm, setDistForm] = useState({
    id: '',
    type: LibraryDistributionType.TEXTBOOK_DISTRIBUTION as LibraryDistributionType,
    title: '',
    description: '',
    distributionDate: '2026-01-01',
    isPublished: true,
  });

  if (isLoading || !db) return <LoadingSkeleton />;

  const categories = Array.from(
    new Set(db.libraryBooks.map((b) => b.category).filter(Boolean))
  ) as string[];

  const filteredBooks = db.libraryBooks.filter((b) => {
    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;
    if (bookSearch.trim()) {
      const q = bookSearch.trim().toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        (b.author ?? '').toLowerCase().includes(q) ||
        (b.publisher ?? '').toLowerCase().includes(q) ||
        (b.category ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const publishedDistributions = db.libraryDistributions.filter((d) => d.isPublished).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={'গ্রন্থাগার ব্যবস্থাপনা'}
        description={
          db.libraryProfile.description ??
          'বিদ্যালয় গ্রন্থাগারের বইয়ের তালিকা, বিভাগ ও বিনামূল্যে পাঠ্যপুস্তক বিতরণ রেকর্ড।'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/academics/library" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                {'পাবলিক গ্রন্থাগার'}
              </Button>
            </Link>
            {tab === 'catalog' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setBookForm({
                    id: '',
                    title: '',
                    author: '',
                    publisher: '',
                    category: categories[0] ?? 'সাহিত্য',
                    description: '',
                  });
                  setBookModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> {'নতুন বই যুক্ত করুন'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDistForm({
                    id: '',
                    type: LibraryDistributionType.TEXTBOOK_DISTRIBUTION,
                    title: '',
                    description: '',
                    distributionDate: new Date().toISOString().slice(0, 10),
                    isPublished: true,
                  });
                  setDistModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> {'নতুন বিতরণ রেকর্ড'}
              </Button>
            )}
          </div>
        }
      />

      {/* 4-Column Institutional KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'মোট তালিকাভুক্ত বই'}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(db.libraryBooks.length, 'bn')}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'বিষয়শ্রেণি / বিভাগ'}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">
            {formatNumber(categories.length, 'bn')}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'বিতরণ কার্যক্রম'}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(db.libraryDistributions.length, 'bn')}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'পাবলিক সাইটে প্রকাশিত'}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">
            {formatNumber(publishedDistributions, 'bn')}
          </p>
        </Card>
      </div>

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'catalog', label: 'বইয়ের তালিকা', count: db.libraryBooks.length },
          { value: 'distributions', label: 'পাঠ্যপুস্তক ও বই বিতরণ', count: db.libraryDistributions.length },
        ]}
      />

      {tab === 'catalog' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <Input
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder={'বইয়ের নাম, লেখক বা প্রকাশনী খুঁজুন...'}
                className="max-w-sm h-9"
              />
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-44 h-9"
              >
                <option value="ALL">{'সকল বিভাগ'}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!filteredBooks.length}
              onClick={() =>
                exportToCsv(
                  filteredBooks.map((b) => ({
                    Title: b.title,
                    Author: b.author ?? '',
                    Publisher: b.publisher ?? '',
                    Category: b.category ?? '',
                    Description: b.description ?? '',
                  })),
                  'library-catalog.csv'
                )
              }
            >
              <Download className="w-4 h-4" /> CSV
            </Button>
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-surface-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">{'বইয়ের শিরোনাম'}</th>
                  <th className="p-3 text-left">{'লেখক'}</th>
                  <th className="p-3 text-left">{'প্রকাশনী'}</th>
                  <th className="p-3 text-left">{'বিভাগ'}</th>
                  <th className="p-3 text-right">{'ব্যবস্থাপনা'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBooks.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3">
                      <span className="font-semibold text-foreground block">{b.title}</span>
                      {b.description && (
                        <span className="text-sm text-muted-foreground line-clamp-1">{b.description}</span>
                      )}
                    </td>
                    <td className="p-3">{b.author || '—'}</td>
                    <td className="p-3 text-muted-foreground">{b.publisher || '—'}</td>
                    <td className="p-3 font-medium text-primary">{b.category || '—'}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBookForm({
                              id: b.id,
                              title: b.title,
                              author: b.author ?? '',
                              publisher: b.publisher ?? '',
                              category: b.category ?? '',
                              description: b.description ?? '',
                            });
                            setBookModalOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await deleteCms({ collection: 'libraryBooks', id: b.id }).unwrap();
                            toast.success('বই তালিকা থেকে মুছে ফেলা হয়েছে।');
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredBooks.length && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {'কোনো বই পাওয়া যায়নি।'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'distributions' && (
        <Card className="divide-y divide-border">
          {db.libraryDistributions.map((d) => (
            <div key={d.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-[240px]">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge enumName="LibraryDistributionType" value={d.type} />
                  {d.distributionDate && (
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {formatDateShort(d.distributionDate, 'bn')}
                    </span>
                  )}
                </div>
                <p className="text-base font-bold text-foreground">{d.title}</p>
                <p className="text-sm text-muted-foreground">{d.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={d.isPublished}
                  onChange={() =>
                    toggleCms({ collection: 'libraryDistributions', id: d.id, field: 'isPublished' })
                  }
                  label={d.isPublished ? 'প্রকাশিত' : 'খসড়া'}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDistForm({
                      id: d.id,
                      type: d.type,
                      title: d.title,
                      description: d.description ?? '',
                      distributionDate: d.distributionDate ?? '',
                      isPublished: d.isPublished,
                    });
                    setDistModalOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await deleteCms({ collection: 'libraryDistributions', id: d.id }).unwrap();
                    toast.success('বিতরণ রেকর্ড মুছে ফেলা হয়েছে।');
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Book CRUD Modal */}
      <Modal
        open={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title={bookForm.id ? 'বইয়ের তথ্য সম্পাদনা' : 'নতুন বই যুক্ত করুন'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!bookForm.title.trim()) return;
            await upsertCms({
              collection: 'libraryBooks',
              item: {
                ...(bookForm.id ? { id: bookForm.id } : {}),
                title: bookForm.title.trim(),
                author: bookForm.author.trim() || null,
                publisher: bookForm.publisher.trim() || null,
                category: bookForm.category.trim() || null,
                description: bookForm.description.trim() || null,
              },
            }).unwrap();
            toast.success('বইয়ের তথ্য সংরক্ষিত হয়েছে।');
            setBookModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={'বইয়ের নাম'} required>
            <Input placeholder="বইয়ের নাম লিখুন" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={'লেখক'}>
              <Input placeholder="লেখক লিখুন" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
            </FormField>
            <FormField label={'প্রকাশনী'}>
              <Input placeholder="প্রকাশনী লিখুন" value={bookForm.publisher} onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })} />
            </FormField>
          </div>
          <FormField label={'বিভাগ / শ্রেণি'}>
            <Input
              value={bookForm.category}
              onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
              placeholder={'যেমন: সাহিত্য, বিজ্ঞান, ইতিহাস, রেফারেন্স'}
            />
          </FormField>
          <FormField label={'সংক্ষিপ্ত বিবরণ'}>
            <Textarea placeholder="সংক্ষিপ্ত বিবরণ লিখুন..." rows={3} value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBookModalOpen(false)}>{'বাতিল'}</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Distribution CRUD Modal */}
      <Modal
        open={distModalOpen}
        onClose={() => setDistModalOpen(false)}
        title={distForm.id ? 'বিতরণ রেকর্ড সম্পাদনা' : 'নতুন বিতরণ রেকর্ড'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!distForm.title.trim()) return;
            await upsertCms({
              collection: 'libraryDistributions',
              item: {
                ...(distForm.id ? { id: distForm.id } : {}),
                type: distForm.type,
                title: distForm.title.trim(),
                description: distForm.description.trim() || null,
                distributionDate: distForm.distributionDate || null,
                isPublished: distForm.isPublished,
              },
            }).unwrap();
            toast.success('বিতরণ তথ্য সংরক্ষিত হয়েছে।');
            setDistModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={'শিরোনাম'} required>
            <Input placeholder="শিরোনাম লিখুন" value={distForm.title} onChange={(e) => setDistForm({ ...distForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={'ধরন'}>
              <Select
                value={distForm.type}
                onChange={(e) => setDistForm({ ...distForm, type: e.target.value as LibraryDistributionType })}
              >
                <option value={LibraryDistributionType.TEXTBOOK_DISTRIBUTION}>{'বিনামূল্যে পাঠ্যপুস্তক বিতরণ'}</option>
                <option value={LibraryDistributionType.BOOK_DISTRIBUTION}>{'বই বিতরণ / পুরস্কার'}</option>
                <option value={LibraryDistributionType.OTHER}>{'অন্যান্য'}</option>
              </Select>
            </FormField>
            <FormField label={'বিতরণের তারিখ'}>
              <Input
                type="date"
                value={distForm.distributionDate}
                onChange={(e) => setDistForm({ ...distForm, distributionDate: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label={'বিবরণ'}>
            <Textarea placeholder="বিবরণ লিখুন..." rows={3} value={distForm.description} onChange={(e) => setDistForm({ ...distForm, description: e.target.value })} />
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch
              checked={distForm.isPublished}
              onChange={(v) => setDistForm({ ...distForm, isPublished: v })}
              label={'পাবলিক সাইটে প্রকাশ করুন'}
            />
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// 7.12 Digital Education

