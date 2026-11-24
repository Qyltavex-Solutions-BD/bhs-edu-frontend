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

