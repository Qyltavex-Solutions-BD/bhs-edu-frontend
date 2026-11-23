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
import { LibraryDistributionType, NoticeStatus, ResourceType } from '@/src/types/enums';
import type { Notice, NoticeAttachmentType } from '@/src/types/entities';

// 7.11 Library
export function AdminLibraryPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [upsertCms, { isLoading: saving }] = useUpsertCmsItemMutation();
  const [deleteCms] = useDeleteCmsItemMutation();
  const [toggleCms] = useToggleCmsItemMutation();
  const { locale, pick } = useI18n();

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
        title={pick('গ্রন্থাগার ব্যবস্থাপনা', 'Library Management')}
        description={
          db.libraryProfile.description ??
          pick(
            'বিদ্যালয় গ্রন্থাগারের বইয়ের তালিকা, বিভাগ ও বিনামূল্যে পাঠ্যপুস্তক বিতরণ রেকর্ড।',
            'Manage school library book catalog, categories, and textbook distribution records.'
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/academics/library" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                {pick('পাবলিক গ্রন্থাগার', 'Public Library')}
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
                <Plus className="w-4 h-4" /> {pick('নতুন বই যুক্ত করুন', 'Add Book')}
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
                <Plus className="w-4 h-4" /> {pick('নতুন বিতরণ রেকর্ড', 'Add Distribution')}
              </Button>
            )}
          </div>
        }
      />

      {/* 4-Column Institutional KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('মোট তালিকাভুক্ত বই', 'Catalog Titles')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(db.libraryBooks.length, locale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('বিষয়শ্রেণি / বিভাগ', 'Book Categories')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">
            {formatNumber(categories.length, locale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('বিতরণ কার্যক্রম', 'Distribution Records')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(db.libraryDistributions.length, locale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('পাবলিক সাইটে প্রকাশিত', 'Published Notices')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">
            {formatNumber(publishedDistributions, locale)}
          </p>
        </Card>
      </div>

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'catalog', label: pick('বইয়ের তালিকা', 'Book Catalog'), count: db.libraryBooks.length },
          { value: 'distributions', label: pick('পাঠ্যপুস্তক ও বই বিতরণ', 'Distributions'), count: db.libraryDistributions.length },
        ]}
      />

      {tab === 'catalog' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <Input
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder={pick('বইয়ের নাম, লেখক বা প্রকাশনী খুঁজুন...', 'Search title, author, publisher...')}
                className="max-w-sm h-9"
              />
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-44 h-9"
              >
                <option value="ALL">{pick('সকল বিভাগ', 'All Categories')}</option>
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
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">{pick('বইয়ের শিরোনাম', 'Book Title')}</th>
                  <th className="p-3 text-left">{pick('লেখক', 'Author')}</th>
                  <th className="p-3 text-left">{pick('প্রকাশনী', 'Publisher')}</th>
                  <th className="p-3 text-left">{pick('বিভাগ', 'Category')}</th>
                  <th className="p-3 text-right">{pick('ব্যবস্থাপনা', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBooks.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3">
                      <span className="font-semibold text-foreground block">{b.title}</span>
                      {b.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">{b.description}</span>
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
                            toast.success(pick('বই তালিকা থেকে মুছে ফেলা হয়েছে।', 'Book removed from catalog.'));
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
                      {pick('কোনো বই পাওয়া যায়নি।', 'No books found.')}
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
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDateShort(d.distributionDate, locale)}
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
                  label={d.isPublished ? pick('প্রকাশিত', 'Published') : pick('খসড়া', 'Draft')}
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
                    toast.success(pick('বিতরণ রেকর্ড মুছে ফেলা হয়েছে।', 'Distribution record removed.'));
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
        title={bookForm.id ? pick('বইয়ের তথ্য সম্পাদনা', 'Edit Book') : pick('নতুন বই যুক্ত করুন', 'Add New Book')}
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
            toast.success(pick('বইয়ের তথ্য সংরক্ষিত হয়েছে।', 'Book saved to catalog.'));
            setBookModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('বইয়ের নাম', 'Book Title')} required>
            <Input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={pick('লেখক', 'Author')}>
              <Input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
            </FormField>
            <FormField label={pick('প্রকাশনী', 'Publisher')}>
              <Input value={bookForm.publisher} onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })} />
            </FormField>
          </div>
          <FormField label={pick('বিভাগ / শ্রেণি', 'Category')}>
            <Input
              value={bookForm.category}
              onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
              placeholder={pick('যেমন: সাহিত্য, বিজ্ঞান, ইতিহাস, রেফারেন্স', 'e.g., Literature, Science, History')}
            />
          </FormField>
          <FormField label={pick('সংক্ষিপ্ত বিবরণ', 'Description')}>
            <Textarea rows={3} value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBookModalOpen(false)}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save Book')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Distribution CRUD Modal */}
      <Modal
        open={distModalOpen}
        onClose={() => setDistModalOpen(false)}
        title={distForm.id ? pick('বিতরণ রেকর্ড সম্পাদনা', 'Edit Distribution') : pick('নতুন বিতরণ রেকর্ড', 'Add Distribution Record')}
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
            toast.success(pick('বিতরণ তথ্য সংরক্ষিত হয়েছে।', 'Distribution record saved.'));
            setDistModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('শিরোনাম', 'Title')} required>
            <Input value={distForm.title} onChange={(e) => setDistForm({ ...distForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={pick('ধরন', 'Type')}>
              <Select
                value={distForm.type}
                onChange={(e) => setDistForm({ ...distForm, type: e.target.value as LibraryDistributionType })}
              >
                <option value={LibraryDistributionType.TEXTBOOK_DISTRIBUTION}>{pick('বিনামূল্যে পাঠ্যপুস্তক বিতরণ', 'Textbook Distribution')}</option>
                <option value={LibraryDistributionType.BOOK_DISTRIBUTION}>{pick('বই বিতরণ / পুরস্কার', 'Book Distribution')}</option>
                <option value={LibraryDistributionType.OTHER}>{pick('অন্যান্য', 'Other')}</option>
              </Select>
            </FormField>
            <FormField label={pick('বিতরণের তারিখ', 'Distribution Date')}>
              <Input
                type="date"
                value={distForm.distributionDate}
                onChange={(e) => setDistForm({ ...distForm, distributionDate: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label={pick('বিবরণ', 'Description')}>
            <Textarea rows={3} value={distForm.description} onChange={(e) => setDistForm({ ...distForm, description: e.target.value })} />
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch
              checked={distForm.isPublished}
              onChange={(v) => setDistForm({ ...distForm, isPublished: v })}
              label={pick('পাবলিক সাইটে প্রকাশ করুন', 'Publish publicly')}
            />
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// 7.12 Digital Education
export function AdminDigitalEducationPage({
  defaultTab = 'resources',
}: {
  defaultTab?: 'resources' | 'classrooms';
} = {}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [toggleCms] = useToggleCmsItemMutation();
  const [upsertCms, { isLoading: saving }] = useUpsertCmsItemMutation();
  const [deleteCms] = useDeleteCmsItemMutation();
  const { locale, pick } = useI18n();

  const [tab, setTab] = useState<'resources' | 'classrooms'>(defaultTab);
  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);
  const [resSearch, setResSearch] = useState('');
  const [resClassFilter, setResClassFilter] = useState('ALL');
  const [classroomModalOpen, setClassroomModalOpen] = useState(false);
  const [classroomForm, setClassroomForm] = useState({
    id: '',
    name: '',
    location: '',
    description: '',
    isActive: true,
  });
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    id: '',
    title: '',
    description: '',
    resourceType: ResourceType.SMART_CLASS_VIDEO as ResourceType,
    classId: '',
    subjectId: '',
    url: '',
    isPublished: true,
  });

  if (isLoading || !db) return <LoadingSkeleton />;

  const publishedResources = db.digitalResources.filter((r) => r.isPublished).length;
  const draftResources = db.digitalResources.length - publishedResources;
  const filteredResources = db.digitalResources.filter((r) => {
    if (resClassFilter !== 'ALL' && r.classId !== resClassFilter) return false;
    if (resSearch.trim()) {
      const q = resSearch.trim().toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('ডিজিটাল শিক্ষা ও স্মার্ট ক্লাসরুম', 'Digital Education & Smart Classrooms')}
        description={pick(
          'স্মার্ট ক্লাসরুম সুবিধা এবং শ্রেণিভিত্তিক ডিজিটাল পাঠসামগ্রী ও ভিডিও লেকচার ব্যবস্থাপনা।',
          'Manage smart classroom facilities and class-wise digital learning resources.'
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/academics/resources" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                {pick('পাবলিক রিসোর্স পেজ', 'Public Resources')}
              </Button>
            </Link>
            {tab === 'resources' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setResourceForm({
                    id: '',
                    title: '',
                    description: '',
                    resourceType: ResourceType.SMART_CLASS_VIDEO,
                    classId: db.classes[0]?.id ?? '',
                    subjectId: db.subjects[0]?.id ?? '',
                    url: '',
                    isPublished: true,
                  });
                  setResourceModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> {pick('নতুন ডিজিটাল রিসোর্স', 'Add Resource')}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setClassroomForm({
                    id: '',
                    name: '',
                    location: '',
                    description: '',
                    isActive: true,
                  });
                  setClassroomModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> {pick('নতুন স্মার্ট ক্লাসরুম', 'Add Classroom')}
              </Button>
            )}
          </div>
        }
      />

      {/* 4-Column Institutional KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('স্মার্ট ক্লাসরুম', 'Smart Classrooms')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(db.digitalClassrooms.length, locale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('মোট ডিজিটাল রিসোর্স', 'Digital Resources')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">
            {formatNumber(db.digitalResources.length, locale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('পাবলিক সাইটে প্রকাশিত', 'Published')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">
            {formatNumber(publishedResources, locale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{pick('খসড়া রিসোর্স', 'Drafts')}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-muted-foreground tabular-nums mt-1">
            {formatNumber(draftResources, locale)}
          </p>
        </Card>
      </div>

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'resources', label: pick('ডিজিটাল রিসোর্স ও পাঠসামগ্রী', 'Digital Resources'), count: db.digitalResources.length },
          { value: 'classrooms', label: pick('স্মার্ট ক্লাসরুমসমূহ', 'Smart Classrooms'), count: db.digitalClassrooms.length },
        ]}
      />

      {tab === 'resources' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-center gap-3">
            <Input
              value={resSearch}
              onChange={(e) => setResSearch(e.target.value)}
              placeholder={pick('রিসোর্সের শিরোনাম খুঁজুন...', 'Search resource title...')}
              className="max-w-sm h-9"
            />
            <Select
              value={resClassFilter}
              onChange={(e) => setResClassFilter(e.target.value)}
              className="w-44 h-9"
            >
              <option value="ALL">{pick('সকল শ্রেণি', 'All Classes')}</option>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'bn' ? c.nameBn : c.name}
                </option>
              ))}
            </Select>
          </Card>

          <Card className="divide-y divide-border">
            {filteredResources.map((r) => {
              const cls = db.classes.find((c) => c.id === r.classId);
              const sub = db.subjects.find((s) => s.id === r.subjectId);
              return (
                <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-[240px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge enumName="ResourceType" value={r.resourceType} />
                      {cls && (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {locale === 'bn' ? cls.nameBn : cls.name}
                        </span>
                      )}
                      {sub && (
                        <span className="text-sm font-semibold text-primary">
                          · {locale === 'bn' ? sub.nameBn : sub.name}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-bold text-foreground">{r.title}</p>
                    {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={r.isPublished}
                      onChange={() => toggleCms({ collection: 'digitalResources', id: r.id, field: 'isPublished' })}
                      label={r.isPublished ? pick('প্রকাশিত', 'Published') : pick('খসড়া', 'Draft')}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResourceForm({
                          id: r.id,
                          title: r.title,
                          description: r.description ?? '',
                          resourceType: r.resourceType,
                          classId: r.classId ?? '',
                          subjectId: r.subjectId ?? '',
                          url: r.url,
                          isPublished: r.isPublished,
                        });
                        setResourceModalOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteCms({ collection: 'digitalResources', id: r.id }).unwrap();
                        toast.success(pick('ডিজিটাল রিসোর্স মুছে ফেলা হয়েছে।', 'Digital resource removed.'));
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {!filteredResources.length && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {pick('কোনো ডিজিটাল রিসোর্স পাওয়া যায়নি।', 'No digital resources found.')}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'classrooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.digitalClassrooms.map((dc) => (
            <Card key={dc.id} className="p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-foreground">{dc.name}</h3>
                  <Switch
                    checked={dc.isActive}
                    onChange={() => toggleCms({ collection: 'digitalClassrooms', id: dc.id, field: 'isActive' })}
                    label={dc.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Inactive')}
                  />
                </div>
                <p className="text-sm font-medium text-primary">{dc.location || '—'}</p>
                <p className="text-sm text-muted-foreground">{dc.description}</p>
              </div>
              <div className="pt-3 border-t border-border flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setClassroomForm({
                      id: dc.id,
                      name: dc.name,
                      location: dc.location ?? '',
                      description: dc.description ?? '',
                      isActive: dc.isActive,
                    });
                    setClassroomModalOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" /> {pick('সম্পাদনা', 'Edit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await deleteCms({ collection: 'digitalClassrooms', id: dc.id }).unwrap();
                    toast.success(pick('স্মার্ট ক্লাসরুম মুছে ফেলা হয়েছে।', 'Classroom removed.'));
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Smart Classroom CRUD Modal */}
      <Modal
        open={classroomModalOpen}
        onClose={() => setClassroomModalOpen(false)}
        title={classroomForm.id ? pick('স্মার্ট ক্লাসরুম সম্পাদনা', 'Edit Smart Classroom') : pick('নতুন স্মার্ট ক্লাসরুম', 'Add Smart Classroom')}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!classroomForm.name.trim()) return;
            await upsertCms({
              collection: 'digitalClassrooms',
              item: {
                ...(classroomForm.id ? { id: classroomForm.id } : {}),
                name: classroomForm.name.trim(),
                location: classroomForm.location.trim() || null,
                description: classroomForm.description.trim() || null,
                isActive: classroomForm.isActive,
              },
            }).unwrap();
            toast.success(pick('স্মার্ট ক্লাসরুম সংরক্ষিত হয়েছে।', 'Smart classroom saved.'));
            setClassroomModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('ক্লাসরুমের নাম', 'Classroom Name')} required>
            <Input value={classroomForm.name} onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })} />
          </FormField>
          <FormField label={pick('অবস্থান / ভবন ও কক্ষ', 'Location / Room')}>
            <Input value={classroomForm.location} onChange={(e) => setClassroomForm({ ...classroomForm, location: e.target.value })} />
          </FormField>
          <FormField label={pick('সুবিধাদি ও বিবরণ', 'Facilities & Description')}>
            <Textarea rows={3} value={classroomForm.description} onChange={(e) => setClassroomForm({ ...classroomForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setClassroomModalOpen(false)}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Digital Resource CRUD Modal */}
      <Modal
        open={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        title={resourceForm.id ? pick('ডিজিটাল রিসোর্স সম্পাদনা', 'Edit Digital Resource') : pick('নতুন ডিজিটাল রিসোর্স', 'Add Digital Resource')}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!resourceForm.title.trim()) return;
            await upsertCms({
              collection: 'digitalResources',
              item: {
                ...(resourceForm.id ? { id: resourceForm.id } : {}),
                academicYearId: db.academicYears.find((y) => y.isActive)?.id ?? 'ay-2026',
                title: resourceForm.title.trim(),
                description: resourceForm.description.trim() || null,
                resourceType: resourceForm.resourceType,
                classId: resourceForm.classId || null,
                subjectId: resourceForm.subjectId || null,
                url: resourceForm.url.trim() || '#',
                isPublished: resourceForm.isPublished,
              },
            }).unwrap();
            toast.success(pick('ডিজিটাল রিসোর্স সংরক্ষিত হয়েছে।', 'Digital resource saved.'));
            setResourceModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('শিরোনাম', 'Title')} required>
            <Input value={resourceForm.title} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label={pick('ধরন', 'Type')}>
              <Select
                value={resourceForm.resourceType}
                onChange={(e) => setResourceForm({ ...resourceForm, resourceType: e.target.value as ResourceType })}
              >
                <option value={ResourceType.SMART_CLASS_VIDEO}>{pick('স্মার্ট ক্লাস ভিডিও', 'Smart Class Video')}</option>
                <option value={ResourceType.EDUCATIONAL_VIDEO}>{pick('শিক্ষামূলক ভিডিও', 'Educational Video')}</option>
                <option value={ResourceType.MULTIMEDIA_CONTENT}>{pick('মাল্টিমিডিয়া কনটেন্ট', 'Multimedia Content')}</option>
                <option value={ResourceType.ONLINE_CLASS_LINK}>{pick('অনলাইন ক্লাস লিংক', 'Online Class Link')}</option>
              </Select>
            </FormField>
            <FormField label={pick('শ্রেণি', 'Class')}>
              <Select value={resourceForm.classId} onChange={(e) => setResourceForm({ ...resourceForm, classId: e.target.value })}>
                <option value="">{pick('সকল শ্রেণি', 'All Classes')}</option>
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>{locale === 'bn' ? c.nameBn : c.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label={pick('বিষয়', 'Subject')}>
              <Select value={resourceForm.subjectId} onChange={(e) => setResourceForm({ ...resourceForm, subjectId: e.target.value })}>
                <option value="">{pick('সাধারণ', 'General')}</option>
                {db.subjects.map((s) => (
                  <option key={s.id} value={s.id}>{locale === 'bn' ? s.nameBn : s.name}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label={pick('রিসোর্স লিংক (URL)', 'Resource URL')} required>
            <Input
              value={resourceForm.url}
              onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
              placeholder="https://..."
            />
          </FormField>
          <FormField label={pick('বিবরণ', 'Description')}>
            <Textarea rows={3} value={resourceForm.description} onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })} />
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch
              checked={resourceForm.isPublished}
              onChange={(v) => setResourceForm({ ...resourceForm, isPublished: v })}
              label={pick('পাবলিক সাইটে প্রকাশ করুন', 'Publish publicly')}
            />
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save Resource')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// 7.13 Notices, News, Events, Careers
export function AdminNoticesAndEventsPage({
  defaultTab = 'notices',
}: {
  defaultTab?: 'notices' | 'news' | 'events' | 'careers';
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [createNotice, { isLoading: saving }] = useCreateNoticeMutation();
  const [toggleCms] = useToggleCmsItemMutation();
  const [upsertCms, { isLoading: savingCms }] = useUpsertCmsItemMutation();
  const [deleteCms] = useDeleteCmsItemMutation();
  const { locale, pick } = useI18n();
  const [tab, setTab] = useState(defaultTab);
  const [composerOpen, setComposerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [viewerNotice, setViewerNotice] = useState<Notice | null>(null);

  // News / Event / Career CRUD modal state
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [newsForm, setNewsForm] = useState({ id: '', title: '', description: '', image: '', isPublished: true });
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ id: '', title: '', description: '', startDate: '2026-12-16', categoryId: '', isPublished: true });
  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [careerForm, setCareerForm] = useState({ id: '', title: '', description: '', deadline: '2026-12-31', isPublished: true });

  const [form, setForm] = useState({
    memoNo: 'ভউবি/নোটিশ/২০২৬/০৮৬',
    title: '',
    description: '',
    attachment: null as string | null,
    attachmentType: 'OFFICIAL_PAD' as NoticeAttachmentType,
    attachmentUrl: null as string | null,
    attachmentSize: null as string | null,
    status: NoticeStatus.PUBLISHED,
    isUrgent: false,
    audience: 'ALL' as 'ALL' | 'PARENTS' | 'TEACHERS' | 'STUDENTS',
  });

  const appendFormat = (snippet: string) => {
    setForm((prev) => ({
      ...prev,
      description: prev.description ? `${prev.description}\n${snippet}` : snippet,
    }));
  };

  const handleNoticeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      toast.error(pick('শুধুমাত্র PDF অথবা ছবি (JPG/PNG/WEBP) আপলোড করা যাবে।', 'Only PDF or Image files are supported.'));
      return;
    }
    const sizeText =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        attachment: file.name,
        attachmentType: isPdf ? 'PDF' : 'IMAGE',
        attachmentUrl: typeof reader.result === 'string' ? reader.result : null,
        attachmentSize: sizeText,
      }));
      toast.success(pick(`${file.name} সংযুক্ত হয়েছে।`, `${file.name} attached.`));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (isLoading || !db) return <LoadingSkeleton />;

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.description.trim() && !form.attachmentUrl) {
      toast.error(pick('বিজ্ঞপ্তির বিবরণ লিখুন অথবা PDF/ছবি আপলোড করুন।', 'Enter notice text or upload a PDF/Image circular.'));
      return;
    }
    await createNotice({
      ...form,
      description:
        form.description.trim() ||
        pick(
          'সংযুক্ত মূল বিজ্ঞপ্তিটি (PDF/স্ক্যান কপি) দেখুন অথবা ডাউনলোড করুন।',
          'Please view or download the attached official circular document.'
        ),
    }).unwrap();
    toast.success(pick('নোটিশ সফলভাবে সংরক্ষিত হয়েছে।', 'Notice saved successfully.'));
    setComposerOpen(false);
    setForm({
      memoNo: `ভউবি/নোটিশ/২০২৬/${String(db.notices.length + 87).padStart(3, '0')}`,
      title: '',
      description: '',
      attachment: null,
      attachmentType: 'OFFICIAL_PAD',
      attachmentUrl: null,
      attachmentSize: null,
      status: NoticeStatus.PUBLISHED,
      isUrgent: false,
      audience: 'ALL',
    });
  };

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
                    categoryId: db.eventCategories[0]?.id ?? 'ec-1',
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
          { value: 'notices', label: pick('নোটিশ', 'Notices'), count: db.notices.length },
          { value: 'news', label: pick('সংবাদ', 'News'), count: db.news.length },
          { value: 'events', label: pick('অনুষ্ঠান', 'Events'), count: db.events.length },
          { value: 'careers', label: pick('নিয়োগ', 'Careers'), count: db.careers.length },
        ]}
      />

      {tab === 'notices' && (
        <Card className="divide-y divide-border">
          {db.notices.map((n) => (
            <div key={n.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge enumName="NoticeStatus" value={n.status} />
                  <NoticeFormatBadge notice={n} showSize />
                  {n.memoNo && <span className="text-xs font-mono text-muted-foreground">{n.memoNo}</span>}
                  <span className="text-xs text-muted-foreground tabular-nums">{formatDateShort(n.createdAt, locale)}</span>
                  {n.isUrgent && <span className="text-xs text-destructive font-semibold">· {pick('জরুরি', 'Urgent')}</span>}
                </div>
                <p className="text-base font-bold text-foreground">{n.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{n.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewerNotice(n)}>
                <Eye className="w-3.5 h-3.5" />
                {pick('ডকুমেন্ট দেখুন', 'Preview')}
              </Button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'news' && (
        <Card className="divide-y divide-border">
          {db.news.map((item) => (
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
          {db.events.map((ev) => (
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
          {db.careers.map((car) => (
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
                categoryId: eventForm.categoryId || db.eventCategories[0]?.id || 'ec-1',
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
                {db.eventCategories.map((ec) => (
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

      <Modal open={composerOpen} onClose={() => setComposerOpen(false)} title={pick('নতুন নোটিশ / সার্কুলার প্রকাশ', 'Publish Notice / Circular')} maxWidth="max-w-2xl">
        <form onSubmit={handlePublishNotice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <FormField label={pick('বিজ্ঞপ্তির শিরোনাম', 'Notice Title')} required>
                <Input
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
                placeholder="ভউবি/নোটিশ/২০২৬/০৮৬"
              />
            </FormField>
          </div>

          {/* Real PDF / Scanned Notice Image Upload */}
          <FormField
            label={pick('মূল বিজ্ঞপ্তি ফাইল আপলোড (PDF অথবা স্ক্যান করা ছবি)', 'Upload Official Circular (PDF or Scanned Image)')}
          >
            {form.attachment ? (
              <div className="p-3 rounded-lg bg-surface-muted/70 border border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {form.attachmentType === 'PDF' ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{form.attachment}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {form.attachmentType} {form.attachmentSize ? `· ${form.attachmentSize}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      attachment: null,
                      attachmentType: 'OFFICIAL_PAD',
                      attachmentUrl: null,
                      attachmentSize: null,
                    }))
                  }
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
                  {pick('PDF ডকুমেন্ট বা স্ক্যান করা নোটিশ ছবি নির্বাচন করুন', 'Select Official PDF or Scanned Notice Image')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {pick('সাপোর্টেড ফরম্যাট: .PDF, .JPG, .PNG, .WEBP (ঐচ্ছিক — না দিলে অফিসিয়াল ডিজিটাল প্যাড তৈরি হবে)', 'Supported: PDF, JPG, PNG, WEBP (Optional — generates official letterhead pad if empty)')}
                </span>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleNoticeFileUpload}
                  className="sr-only"
                />
              </label>
            )}
          </FormField>

          <FormField label={pick('বিস্তারিত বিবরণ / সংক্ষিপ্ত সারসংক্ষেপ', 'Notice Content / Summary')}>
            <div className="border border-border rounded-[var(--radius)] overflow-hidden bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-1 px-2 py-1.5 bg-surface-muted/70 border-b border-border">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title={pick('বোল্ড', 'Bold')}
                    onClick={() => appendFormat('**গুরুত্বপূর্ণ নির্দেশনা:** ')}
                    className="h-7 w-7 rounded hover:bg-surface inline-flex items-center justify-center text-foreground cursor-pointer"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title={pick('ইটালিক', 'Italic')}
                    onClick={() => appendFormat('*বিশেষ দ্রষ্টব্য:* ')}
                    className="h-7 w-7 rounded hover:bg-surface inline-flex items-center justify-center text-foreground cursor-pointer"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title={pick('উপ-শিরোনাম', 'Heading')}
                    onClick={() => appendFormat('## বিজ্ঞপ্তির মূল অংশ')}
                    className="h-7 w-7 rounded hover:bg-surface inline-flex items-center justify-center text-foreground cursor-pointer"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title={pick('তালিকা', 'Bullet list')}
                    onClick={() => appendFormat('• নির্দেশনা ১\n• নির্দেশনা ২')}
                    className="h-7 w-7 rounded hover:bg-surface inline-flex items-center justify-center text-foreground cursor-pointer"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => appendFormat('\nআদেশক্রমে,\nপ্রধান শিক্ষক\nভোজেশ্বর উচ্চ বিদ্যালয়')}
                    className="px-2 h-7 rounded hover:bg-surface text-xs font-medium text-primary cursor-pointer"
                  >
                    {pick('+ স্বাক্ষর যুক্ত', '+ Official Sign-off')}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewMode((p) => !p)}
                  className="px-2 h-7 rounded hover:bg-surface text-xs font-medium inline-flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {previewMode ? pick('সম্পাদনা', 'Edit') : pick('প্রিভিউ', 'Preview')}
                </button>
              </div>
              {previewMode ? (
                <div className="p-3 min-h-[100px] text-sm whitespace-pre-line text-foreground">
                  {form.description || pick('কোনো বিবরণ লেখা হয়নি।', 'No content written yet.')}
                </div>
              ) : (
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="border-none rounded-none focus:ring-0"
                />
              )}
            </div>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={pick('অবস্থা', 'Status')}>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as NoticeStatus })}>
                <option value={NoticeStatus.PUBLISHED}>{pick('প্রকাশিত', 'Published')}</option>
                <option value={NoticeStatus.DRAFT}>{pick('খসড়া', 'Draft')}</option>
                <option value={NoticeStatus.ARCHIVED}>{pick('আর্কাইভ', 'Archived')}</option>
              </Select>
            </FormField>
            <FormField label={pick('দর্শক শ্রেণি', 'Target Audience')}>
              <Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as typeof form.audience })}>
                <option value="ALL">{pick('সকলের জন্য', 'Everyone')}</option>
                <option value="PARENTS">{pick('অভিভাবক', 'Parents')}</option>
                <option value="TEACHERS">{pick('শিক্ষক', 'Teachers')}</option>
              </Select>
            </FormField>
          </div>
          <Switch checked={form.isUrgent} onChange={(v) => setForm({ ...form, isUrgent: v })} label={pick('জরুরি নোটিশ হিসেবে চিহ্নিত করুন', 'Mark as urgent notice')} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setComposerOpen(false)}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={saving}>{pick('প্রকাশ করুন', 'Save Notice')}</Button>
          </div>
        </form>
      </Modal>

      <NoticeDocumentModal
        notice={viewerNotice}
        school={db.schoolProfile}
        onClose={() => setViewerNotice(null)}
      />
    </div>
  );
}

// 7.14 Website CMS
export function AdminWebsiteCmsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [toggleCms] = useToggleCmsItemMutation();
  const [reorderCms] = useReorderCmsItemsMutation();
  const [updateAdmission, { isLoading: savingAdmission }] = useUpdateAdmissionContentMutation();
  const { pick } = useI18n();
  const [tab, setTab] = useState<'banners' | 'leadership' | 'gallery' | 'admission' | 'publications'>('banners');
  const [dragBannerId, setDragBannerId] = useState<string | null>(null);

  const [admForm, setAdmForm] = useState({
    admissionStatus: 'OPEN' as 'OPEN' | 'UPCOMING' | 'CLOSED',
    showOnHomepage: true,
    academicSession: '২০২৭',
    bannerTitle: '',
    bannerSubtitle: '',
    eligibleClasses: '',
    startDate: '',
    endDate: '',
    admissionTestDate: '',
    applicationFee: 200,
    helplinePhone: '',
  });

  useEffect(() => {
    if (!db?.admissionContent) return;
    const a = db.admissionContent;
    setAdmForm({
      admissionStatus: a.admissionStatus ?? 'OPEN',
      showOnHomepage: a.showOnHomepage ?? true,
      academicSession: a.academicSession ?? '২০২৭',
      bannerTitle: a.bannerTitle ?? a.title,
      bannerSubtitle: a.bannerSubtitle ?? '',
      eligibleClasses: a.eligibleClasses ?? '',
      startDate: a.startDate ?? '',
      endDate: a.endDate ?? '',
      admissionTestDate: a.admissionTestDate ?? '',
      applicationFee: a.applicationFee ?? 200,
      helplinePhone: a.helplinePhone ?? '',
    });
  }, [db?.admissionContent]);

  if (isLoading || !db) return <LoadingSkeleton />;

  const handleSaveAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAdmission({
      admissionStatus: admForm.admissionStatus,
      showOnHomepage: admForm.showOnHomepage,
      academicSession: admForm.academicSession.trim() || '২০২৭',
      bannerTitle: admForm.bannerTitle.trim(),
      bannerSubtitle: admForm.bannerSubtitle.trim(),
      eligibleClasses: admForm.eligibleClasses.trim(),
      startDate: admForm.startDate || null,
      endDate: admForm.endDate || null,
      admissionTestDate: admForm.admissionTestDate || null,
      applicationFee: Number(admForm.applicationFee) || 0,
      helplinePhone: admForm.helplinePhone.trim() || null,
      isPublished: true,
    }).unwrap();
    toast.success(
      pick(
        'ভর্তি ক্যাম্পেইন ও হোমপেজ ব্যানার সেটিংস সংরক্ষিত হয়েছে।',
        'Admission campaign & homepage banner settings saved.'
      )
    );
  };

  const sortedBanners = [...db.banners].sort((a, b) => a.sortOrder - b.sortOrder);
  const moveBanner = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sortedBanners.length || fromIdx === toIdx) return;
    const next = [...sortedBanners];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await reorderCms({ collection: 'banners', orderedIds: next.map((x) => x.id) }).unwrap();
    toast.success(pick('হোমপেজ ব্যানারের ক্রম হালনাগাদ হয়েছে।', 'Banner slide order updated.'));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('ওয়েবসাইট কনটেন্ট ম্যানেজমেন্ট (CMS)', 'Website Content Management (CMS)')}
        description={pick('হোমপেজ ব্যানার স্লাইডার (ড্র্যাগ-অ্যান্ড-ড্রপ), নেতৃত্বের বাণী, গ্যালারি, ভর্তি কনটেন্ট ও প্রকাশনা নিয়ন্ত্রণ।', 'Manage homepage banners (drag-and-drop), leadership messages, gallery, admission copy, and publications.')}
      />
      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'banners', label: pick('ব্যানার স্লাইডার', 'Banners') },
          { value: 'leadership', label: pick('নেতৃত্বের বাণী', 'Leadership') },
          { value: 'gallery', label: pick('গ্যালারি', 'Gallery') },
          { value: 'admission', label: pick('ভর্তি কনটেন্ট', 'Admission Copy') },
          { value: 'publications', label: pick('প্রকাশনা ও অর্জন', 'Publications & Achievements') },
        ]}
      />

      {tab === 'banners' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {pick(
              'স্লাইডগুলো ড্র্যাগ-অ্যান্ড-ড্রপ বা তীর বাটন দিয়ে সাজান — হোমপেজ হিরো স্লাইডার তাৎক্ষণিক আপডেট হবে।',
              'Drag and drop banners or use arrow buttons to change homepage hero slide order.'
            )}
          </p>
          <Card className="divide-y divide-border">
            {sortedBanners.map((b, idx) => (
              <div
                key={b.id}
                draggable
                onDragStart={() => setDragBannerId(b.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!dragBannerId || dragBannerId === b.id) return;
                  const fromIdx = sortedBanners.findIndex((x) => x.id === dragBannerId);
                  moveBanner(fromIdx, idx);
                  setDragBannerId(null);
                }}
                className="p-4 flex items-center justify-between gap-4 hover:bg-surface-muted/40 transition-colors cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-base font-bold text-foreground truncate">{b.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{b.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    aria-label="Move banner up"
                    disabled={idx === 0}
                    onClick={() => moveBanner(idx, idx - 1)}
                    className="h-7 w-7 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move banner down"
                    disabled={idx === sortedBanners.length - 1}
                    onClick={() => moveBanner(idx, idx + 1)}
                    className="h-7 w-7 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <Switch
                    checked={b.isActive}
                    onChange={() => toggleCms({ collection: 'banners', id: b.id, field: 'isActive' })}
                    label={b.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Hidden')}
                  />
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'leadership' && (
        <div className="grid gap-4">
          {db.leadershipMessages.map((m) => (
            <Card key={m.id} className="p-5 space-y-1.5">
              <p className="font-bold text-base">{m.personName} · <span className="text-primary">{m.designation}</span></p>
              <p className="text-sm text-muted-foreground">{m.message}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {db.galleries.map((g) => (
            <Card key={g.id} className="p-4 space-y-1">
              <p className="font-bold text-base">{g.title}</p>
              <p className="text-sm text-muted-foreground">{g.description}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'admission' && (
        <div className="space-y-5">
          <Card className="p-6">
            <form onSubmit={handleSaveAdmission} className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {pick('ভর্তি ক্যাম্পেইন ও হোমপেজ ব্যানার নিয়ন্ত্রণ', 'Admission Campaign & Homepage Banner Control')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {pick(
                      'ভর্তি কার্যক্রম চালু/বন্ধ করুন, তারিখ ও ফি হালনাগাদ করুন এবং হোমপেজ ব্যানারের লেখা পরিবর্তন করুন।',
                      'Toggle admission cycle status, update schedule & fee, and customize the homepage banner copy.'
                    )}
                  </p>
                </div>
                <Switch
                  checked={admForm.showOnHomepage}
                  onChange={(v) => setAdmForm({ ...admForm, showOnHomepage: v })}
                  label={pick('হোমপেজে ব্যানার দেখান', 'Show Banner on Homepage')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={pick('ভর্তি কার্যক্রম অবস্থা', 'Admission Cycle Status')}>
                  <Select
                    value={admForm.admissionStatus}
                    onChange={(e) =>
                      setAdmForm({
                        ...admForm,
                        admissionStatus: e.target.value as 'OPEN' | 'UPCOMING' | 'CLOSED',
                      })
                    }
                  >
                    <option value="OPEN">{pick('ভর্তি চলছে (Open)', 'Admissions Open')}</option>
                    <option value="UPCOMING">{pick('শীঘ্রই শুরু (Upcoming)', 'Opening Soon')}</option>
                    <option value="CLOSED">{pick('ভর্তি বন্ধ (Closed)', 'Admissions Closed')}</option>
                  </Select>
                </FormField>

                <FormField label={pick('শিক্ষাবর্ষ', 'Academic Session')}>
                  <Input
                    value={admForm.academicSession}
                    onChange={(e) => setAdmForm({ ...admForm, academicSession: e.target.value })}
                    placeholder="২০২৭"
                  />
                </FormField>

                <FormField label={pick('ভর্তিযোগ্য শ্রেণি ও বিভাগ', 'Eligible Classes & Streams')}>
                  <Input
                    value={admForm.eligibleClasses}
                    onChange={(e) => setAdmForm({ ...admForm, eligibleClasses: e.target.value })}
                    placeholder={pick('৬ষ্ঠ–৯ম শ্রেণি (বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা)', 'Classes 6–9 (Science, Humanities, Business)')}
                  />
                </FormField>
              </div>

              <FormField label={pick('হোমপেজ ব্যানারের শিরোনাম', 'Homepage Banner Headline')}>
                <Input
                  value={admForm.bannerTitle}
                  onChange={(e) => setAdmForm({ ...admForm, bannerTitle: e.target.value })}
                  placeholder={pick('২০২৭ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি চলছে', 'Session 2027 Admissions Open (Classes 6–9)')}
                />
              </FormField>

              <FormField label={pick('ব্যানারের সংক্ষিপ্ত বিবরণ', 'Homepage Banner Summary')}>
                <Textarea
                  rows={3}
                  value={admForm.bannerSubtitle}
                  onChange={(e) => setAdmForm({ ...admForm, bannerSubtitle: e.target.value })}
                  placeholder={pick('অভিভাবকদের জন্য পরিষ্কার সংক্ষিপ্ত বিবরণ লিখুন...', 'Write a concise summary for parents and applicants...')}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <FormField label={pick('আবেদন শুরু', 'Start Date')}>
                  <Input
                    type="date"
                    value={admForm.startDate}
                    onChange={(e) => setAdmForm({ ...admForm, startDate: e.target.value })}
                  />
                </FormField>
                <FormField label={pick('আবেদনের শেষ তারিখ', 'Deadline')}>
                  <Input
                    type="date"
                    value={admForm.endDate}
                    onChange={(e) => setAdmForm({ ...admForm, endDate: e.target.value })}
                  />
                </FormField>
                <FormField label={pick('ভর্তি পরীক্ষার তারিখ', 'Admission Test Date')}>
                  <Input
                    type="date"
                    value={admForm.admissionTestDate}
                    onChange={(e) => setAdmForm({ ...admForm, admissionTestDate: e.target.value })}
                  />
                </FormField>
                <FormField label={pick('আবেদন ফি (টাকা)', 'Application Fee (BDT)')}>
                  <Input
                    type="number"
                    min={0}
                    value={admForm.applicationFee}
                    onChange={(e) => setAdmForm({ ...admForm, applicationFee: Number(e.target.value) })}
                  />
                </FormField>
                <FormField label={pick('ভর্তি হেল্পলাইন', 'Admission Helpline')}>
                  <Input
                    value={admForm.helplinePhone}
                    onChange={(e) => setAdmForm({ ...admForm, helplinePhone: e.target.value })}
                    placeholder="01711-200201"
                  />
                </FormField>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {pick(
                    'টিপস: ভর্তি মৌসুম শেষ হলে স্ট্যাটাস "ভর্তি বন্ধ" করে "হোমপেজে ব্যানার দেখান" সুইচটি অফ করে রাখুন।',
                    'Tip: During off-season, set status to Closed and turn off "Show Banner on Homepage".'
                  )}
                </p>
                <Button type="submit" variant="primary" disabled={savingAdmission}>
                  <Save className="w-4 h-4" />
                  <span>{pick('পরিবর্তন সংরক্ষণ করুন', 'Save Admission Settings')}</span>
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-5 space-y-2 text-sm text-muted-foreground">
            <h4 className="text-base font-bold text-foreground">
              {pick('প্রিন্টেড ভর্তি ফরমের অফিসিয়াল ১৩-দফা ফিল্ড রেফারেন্স', 'Official Printed Admission Form Checklist Reference')}
            </h4>
            <p>{db.admissionContent.studentNameNotice}</p>
            <p>{db.admissionContent.fatherInfoNotice}</p>
            <p>{db.admissionContent.motherInfoNotice}</p>
            <p>{db.admissionContent.classesAndSections}</p>
            <p>{db.admissionContent.availableGroups}</p>
            <p>{db.admissionContent.optionalSubjects}</p>
          </Card>
        </div>
      )}

      {tab === 'publications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.publications.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-base">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </div>
              <Switch
                checked={p.isPublished}
                onChange={() => toggleCms({ collection: 'publications', id: p.id, field: 'isPublished' })}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// 7.15 Reports
export function AdminReportsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  const reportCards = [
    { titleBn: 'শিক্ষার্থী পরিসংখ্যান ও তালিকা', titleEn: 'Student Enrollment Report', rows: db.students, file: 'students-report.csv' },
    { titleBn: 'হাজিরা সারসংক্ষেপ রিপোর্ট', titleEn: 'Attendance Summary Report', rows: db.attendances.slice(0, 60), file: 'attendance-report.csv' },
    { titleBn: 'পরীক্ষা ও ফলাফল সারসংক্ষেপ', titleEn: 'Examination Results Summary', rows: db.resultSummaries, file: 'results-report.csv' },
    { titleBn: 'শিক্ষক ও কর্মচারী ডিরেক্টরি', titleEn: 'Staff & Faculty Report', rows: db.staff, file: 'staff-report.csv' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('রিপোর্ট ও বিশ্লেষণ কেন্দ্র', 'Reports & Analytics Center')}
        actions={
          <Button variant="outline" size="sm" onClick={triggerPrint}>
            <Printer className="w-4 h-4" /> {pick('প্রিন্ট রিপোর্ট', 'Print View')}
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportCards.map((r) => (
          <Card key={r.file} className="p-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">{pick(r.titleBn, r.titleEn)}</h3>
              <p className="text-sm text-muted-foreground tabular-nums mt-1">
                {r.rows.length} {pick('টি রেকর্ড প্রস্তুত', 'records ready')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCsv(r.rows as unknown as Record<string, unknown>[], r.file)}
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 7.16 Settings & Profile
export function AdminSettingsPage() {
  const { pick } = useI18n();

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('সিস্টেম সেটিংস ও প্রোফাইল', 'System Settings & Profile')}
        description={pick(
          'প্রোফাইল, পাসওয়ার্ড, সক্রিয় সেশন, থিম ও ভাষা কনফিগার করুন।',
          'Configure profile, password policy, active sessions, appearance, and language.'
        )}
      />

      <CommonProfilePanel
        roleLabel={pick('প্রধান প্রশাসক (Admin / Head Teacher)', 'School Administrator / Head Teacher')}
      />
    </div>
  );
}
