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

