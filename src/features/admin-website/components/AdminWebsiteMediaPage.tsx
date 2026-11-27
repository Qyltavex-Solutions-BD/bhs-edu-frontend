'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  FileText,
  Film,
  FolderCog,
  GripVertical,
  Image as ImageIcon,
  Images,
  Link2,
  Pencil,
  Plus,
  Save,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  useDeleteCmsItemMutation,
  useGetBootstrapQuery,
  useReorderCmsItemsMutation,
  useToggleCmsItemMutation,
  useUpdateAdmissionContentMutation,
  useUpdateContactInfoMutation,
  useUpdateSchoolProfileMutation,
  useUpsertCmsItemMutation,
} from '@/src/store/api';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import {
  getCampusPhoto,
  getCommitteePortrait,
  LoadingSkeleton,
  PageHeader,
  SchoolEmblem,
} from '@/src/components/shared/Feedback';
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
import {
  AchievementType,
  FacilityType,
  InstitutionContentType,
  LeadershipType,
  MediaType,
  PublicationType,
} from '@/src/types/enums';
import type {
  Achievement,
  Gallery,
  GalleryCategory,
  GalleryMedia,
  InstitutionContent,
  LeadershipMessage,
  ManagingCommitteeMember,
  Publication,
  QuickLink,
  SchoolFacility,
  WebsiteBanner,
} from '@/src/types/entities';

function readImageAsDataUrl(file: File, onLoaded: (url: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') onLoaded(reader.result);
  };
  reader.readAsDataURL(file);
}

const MAX_VIDEO_DATA_URL_BYTES = 10 * 1024 * 1024; // 10 MB

function readVideoSource(file: File, onLoaded: (url: string, isBlob: boolean) => void) {
  if (file.size <= MAX_VIDEO_DATA_URL_BYTES) {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onLoaded(reader.result, false);
    };
    reader.readAsDataURL(file);
  } else {
    const objectUrl = URL.createObjectURL(file);
    onLoaded(objectUrl, true);
  }
}

function isValidMediaUrl(value: string, allowRelative = false): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (allowRelative && trimmed.startsWith('/') && trimmed.length > 1) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const BANNER_PRESET_IMAGES = [
  { value: 'campus-heritage', labelBn: 'বিদ্যালয় মূল ভবন (ক্যাম্পাস)', labelEn: 'Campus Heritage Building' },
  { value: 'digital-classroom', labelBn: 'ডিজিটাল স্মার্ট শ্রেণিকক্ষ', labelEn: 'Smart Classroom' },
  { value: 'science-lab', labelBn: 'বিজ্ঞান ও আইসিটি ল্যাব', labelEn: 'Science & ICT Lab' },
  { value: 'library-room', labelBn: 'বিদ্যালয় পাঠাগার', labelEn: 'School Library' },
];

const GALLERY_PRESET_IMAGES = [
  ...BANNER_PRESET_IMAGES,
  { value: 'sports-day', labelBn: 'বার্ষিক ক্রীড়া ও খেলার মাঠ', labelEn: 'Annual Sports & Field' },
  { value: 'heritage-building', labelBn: 'ঐতিহ্যবাহী মূল গেট ও ভবন', labelEn: 'Historic Main Gate & Building' },
  { value: 'morning-assembly', labelBn: 'প্রাত্যহিক সমাবেশ', labelEn: 'Morning Assembly' },
  { value: 'debate-hall', labelBn: 'বিতর্ক ও সাংস্কৃতিক অনুষ্ঠান', labelEn: 'Debate & Cultural Hall' },
];

const DEFAULT_ADMISSION_DOCUMENTS = [
  'শিক্ষার্থীর ১৭ ডিজিটের ডিজিটাল জন্ম নিবন্ধন সনদের সত্যায়িত ফটোকপি',
  'পিতা ও মাতার জাতীয় পরিচয়পত্রের (NID) ফটোকপি',
  'শিক্ষার্থীর সদ্য তোলা ২ কপি পাসপোর্ট সাইজ ও ২ কপি স্ট্যাম্প সাইজ রঙিন ছবি',
  'পূর্ববর্তী বিদ্যালয়ের ছাড়পত্র (TC) ও সর্বশেষ পরীক্ষার নম্বরপত্র (৭ম–৯ম শ্রেণির জন্য)',
  'অভিভাবকের সচল বাংলাদেশি মোবাইল নম্বর (SMS নোটিফিকেশনের জন্য)',
];

/* ============================================================================
 * 1. WEBSITE CMS — HOME & BRANDING (`/admin/website/home`)
 * Tabs: branding | banners | quick-links | contact
 * ============================================================================ */

export function AdminWebsiteMediaPage({
  defaultTab = 'gallery',
}: {
  defaultTab?: 'gallery' | 'admission' | 'publications' | 'achievements';
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [upsertCms, { isLoading: saving }] = useUpsertCmsItemMutation();
  const [deleteCms] = useDeleteCmsItemMutation();
  const [toggleCms] = useToggleCmsItemMutation();
  const [reorderCms] = useReorderCmsItemsMutation();
  const [updateAdmission, { isLoading: savingAdmission }] = useUpdateAdmissionContentMutation();
  const [tab, setTab] = useState(defaultTab);

  // Admin Search & Filter States (aligned with public website filters)
  const [galleryQuery, setGalleryQuery] = useState('');
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState('ALL');
  const [pubQuery, setPubQuery] = useState('');
  const [pubTypeFilter, setPubTypeFilter] = useState('ALL');
  const [achQuery, setAchQuery] = useState('');
  const [achTypeFilter, setAchTypeFilter] = useState('ALL');

  // Admission Campaign & 13-Point Form CMS State
  const [admForm, setAdmForm] = useState({
    title: '',
    isPublished: true,
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
    formPdfUrl: '',
    schoolNameBn: '',
    schoolNameEn: '',
    schoolCode: '',
    districtCode: '',
    thanaCode: '',
    eiin: '',
    schoolAddress: '',
    studentNameNotice: '',
    fatherInfoNotice: '',
    motherInfoNotice: '',
    addressInfoNotice: '',
    dobNotice: '',
    birthCertificateNotice: '',
    religionNotice: '',
    prevExamNotice: '',
    prevSchoolNotice: '',
    admissionTypeNotice: '',
    classesAndSections: '',
    availableGroups: '',
    optionalSubjects: '',
    admitCardNotice: '',
    declarationText: '',
    requiredDocuments: DEFAULT_ADMISSION_DOCUMENTS,
  });
  const [newDocItem, setNewDocItem] = useState('');

  // Gallery Category Manager Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({
    id: '',
    name: '',
    description: '',
    isActive: true,
  });
  const [catError, setCatError] = useState('');

  // Gallery Album Modal State
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [inlineCatOpen, setInlineCatOpen] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');
  const [galleryForm, setGalleryForm] = useState({
    id: '',
    title: '',
    category: '',
    description: '',
    photoUrl: '',
    photoCaption: '',
    isPublished: true,
  });

  // Gallery Media Manager Modal State (per-album photos/videos, captions & ordering)
  const [mediaGalleryId, setMediaGalleryId] = useState<string | null>(null);
  const [mediaSourceMode, setMediaSourceMode] = useState<'upload' | 'link' | 'preset'>('upload');
  const [mediaFileName, setMediaFileName] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [mediaForm, setMediaForm] = useState({
    id: '',
    mediaType: MediaType.IMAGE,
    mediaUrl: '',
    caption: '',
  });

  // Publication Modal State
  const [pubModalOpen, setPubModalOpen] = useState(false);
  const [pubForm, setPubForm] = useState({
    id: '',
    title: '',
    type: PublicationType.SCHOOL_MAGAZINE,
    publishYear: '2026',
    description: '',
    coverImage: '',
    fileUrl: '',
    isPublished: true,
  });

  // Achievement Modal State
  const [achModalOpen, setAchModalOpen] = useState(false);
  const [achForm, setAchForm] = useState({
    id: '',
    title: '',
    type: AchievementType.INSTITUTION_ACHIEVEMENT,
    personName: '',
    batch: '2026',
    achievedAt: '',
    image: '',
    description: '',
    isPublished: true,
  });

  useEffect(() => {
    if (!db?.admissionContent) return;
    const a = db.admissionContent;
    setAdmForm({
      title: a.title ?? '',
      isPublished: a.isPublished ?? true,
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
      formPdfUrl: a.formPdfUrl ?? '',
      schoolNameBn: a.schoolNameBn ?? '',
      schoolNameEn: a.schoolNameEn ?? '',
      schoolCode: a.schoolCode ?? '',
      districtCode: a.districtCode ?? '',
      thanaCode: a.thanaCode ?? '',
      eiin: a.eiin ?? '',
      schoolAddress: a.schoolAddress ?? '',
      studentNameNotice: a.studentNameNotice ?? '',
      fatherInfoNotice: a.fatherInfoNotice ?? '',
      motherInfoNotice: a.motherInfoNotice ?? '',
      addressInfoNotice: a.addressInfoNotice ?? '',
      dobNotice: a.dobNotice ?? '',
      birthCertificateNotice: a.birthCertificateNotice ?? '',
      religionNotice: a.religionNotice ?? '',
      prevExamNotice: a.prevExamNotice ?? '',
      prevSchoolNotice: a.prevSchoolNotice ?? '',
      admissionTypeNotice: a.admissionTypeNotice ?? '',
      classesAndSections: a.classesAndSections ?? '',
      availableGroups: a.availableGroups ?? '',
      optionalSubjects: a.optionalSubjects ?? '',
      admitCardNotice: a.admitCardNotice ?? '',
      declarationText: a.declarationText ?? '',
      requiredDocuments:
        a.requiredDocuments && a.requiredDocuments.length > 0
          ? a.requiredDocuments
          : DEFAULT_ADMISSION_DOCUMENTS,
    });
  }, [db?.admissionContent]);

  if (isLoading || !db) return <LoadingSkeleton />;

  const livePreviewMap = {
    gallery: { href: '/gallery', label: 'পাবলিক গ্যালারি দেখুন' },
    admission: { href: '/admission', label: 'পাবলিক ভর্তি পেজ দেখুন' },
    publications: { href: '/publications', label: 'পাবলিক প্রকাশনা দেখুন' },
    achievements: { href: '/achievements', label: 'পাবলিক অর্জন পেজ দেখুন' },
  } as const;

  const sortedGalleryCategories: GalleryCategory[] = [...(db.galleryCategories ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  const activeGalleryCategories = sortedGalleryCategories.filter((c) => c.isActive);
  const galleryCategories = Array.from(
    new Set([
      ...sortedGalleryCategories.map((c) => c.name.trim()).filter(Boolean),
      ...db.galleries.map((g) => (g.category ?? '').trim()).filter(Boolean),
    ])
  );
  const albumCategoryOptions = Array.from(
    new Set([
      ...activeGalleryCategories.map((c) => c.name.trim()).filter(Boolean),
      ...(galleryForm.category.trim() ? [galleryForm.category.trim()] : []),
    ])
  );

  const filteredGalleries = db.galleries.filter((g) => {
    const q = galleryQuery.trim().toLowerCase();
    const matchCat = galleryCategoryFilter === 'ALL' || (g.category ?? '') === galleryCategoryFilter;
    if (!matchCat) return false;
    if (!q) return true;
    const childCaptions = db.galleryMedia
      .filter((m) => m.galleryId === g.id)
      .map((m) => m.caption ?? '')
      .join(' ');
    return `${g.title} ${g.category ?? ''} ${g.description ?? ''} ${childCaptions}`
      .toLowerCase()
      .includes(q);
  });

  const filteredPublications = db.publications.filter((p) => {
    const q = pubQuery.trim().toLowerCase();
    if (pubTypeFilter !== 'ALL' && p.type !== pubTypeFilter) return false;
    if (!q) return true;
    return `${p.title} ${p.description ?? ''} ${p.publishYear ?? ''}`.toLowerCase().includes(q);
  });

  const filteredAchievements = db.achievements.filter((a) => {
    const q = achQuery.trim().toLowerCase();
    if (achTypeFilter !== 'ALL' && a.type !== achTypeFilter) return false;
    if (!q) return true;
    return `${a.title} ${a.personName ?? ''} ${a.batch ?? ''} ${a.description ?? ''}`
      .toLowerCase()
      .includes(q);
  });

  const activeMediaGallery = mediaGalleryId
    ? db.galleries.find((g) => g.id === mediaGalleryId) ?? null
    : null;
  const activeGalleryMediaItems = activeMediaGallery
    ? [...db.galleryMedia.filter((m) => m.galleryId === activeMediaGallery.id)].sort(
        (a, b) => a.sortOrder - b.sortOrder
      )
    : [];

  const handleSaveAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAdmission({
      title: admForm.title.trim() || 'ভর্তির আবেদন ফরম ও নির্দেশিকা',
      isPublished: admForm.isPublished,
      admissionStatus: admForm.admissionStatus,
      showOnHomepage: admForm.showOnHomepage,
      academicSession: admForm.academicSession.trim() || '২০২৭',
      bannerTitle: admForm.bannerTitle.trim(),
      bannerSubtitle: admForm.bannerSubtitle.trim(),
      eligibleClasses: admForm.eligibleClasses.trim() || null,
      startDate: admForm.startDate || null,
      endDate: admForm.endDate || null,
      admissionTestDate: admForm.admissionTestDate || null,
      applicationFee: Number(admForm.applicationFee) || 0,
      helplinePhone: admForm.helplinePhone.trim() || null,
      formPdfUrl: admForm.formPdfUrl.trim() || null,
      schoolNameBn: admForm.schoolNameBn.trim() || null,
      schoolNameEn: admForm.schoolNameEn.trim() || null,
      schoolCode: admForm.schoolCode.trim() || null,
      districtCode: admForm.districtCode.trim() || null,
      thanaCode: admForm.thanaCode.trim() || null,
      eiin: admForm.eiin.trim() || null,
      schoolAddress: admForm.schoolAddress.trim() || null,
      studentNameNotice: admForm.studentNameNotice.trim() || null,
      fatherInfoNotice: admForm.fatherInfoNotice.trim() || null,
      motherInfoNotice: admForm.motherInfoNotice.trim() || null,
      addressInfoNotice: admForm.addressInfoNotice.trim() || null,
      dobNotice: admForm.dobNotice.trim() || null,
      birthCertificateNotice: admForm.birthCertificateNotice.trim() || null,
      religionNotice: admForm.religionNotice.trim() || null,
      prevExamNotice: admForm.prevExamNotice.trim() || null,
      prevSchoolNotice: admForm.prevSchoolNotice.trim() || null,
      admissionTypeNotice: admForm.admissionTypeNotice.trim() || null,
      classesAndSections: admForm.classesAndSections.trim() || null,
      availableGroups: admForm.availableGroups.trim() || null,
      optionalSubjects: admForm.optionalSubjects.trim() || null,
      admitCardNotice: admForm.admitCardNotice.trim() || null,
      declarationText: admForm.declarationText.trim() || null,
      requiredDocuments: admForm.requiredDocuments.map((d) => d.trim()).filter(Boolean),
    }).unwrap();
    toast.success(
      'ভর্তি ক্যাম্পেইন, ১৩-দফা ফরম ও নির্দেশিকা সংরক্ষিত হয়েছে।'
    );
  };

  const openCategoryManager = () => {
    setCatForm({ id: '', name: '', description: '', isActive: true });
    setCatError('');
    setCatModalOpen(true);
  };

  const moveGalleryCategory = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sortedGalleryCategories.length || fromIdx === toIdx) return;
    const next = [...sortedGalleryCategories];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await reorderCms({ collection: 'galleryCategories', orderedIds: next.map((x) => x.id) }).unwrap();
    toast.success('ক্যাটাগরির ক্রম হালনাগাদ হয়েছে।');
  };

  const openGalleryEditor = (g?: Gallery) => {
    const defaultCat = activeGalleryCategories[0]?.name ?? sortedGalleryCategories[0]?.name ?? 'ক্যাম্পাস';
    setGalleryForm({
      id: g?.id ?? '',
      title: g?.title ?? '',
      category: g?.category?.trim() || defaultCat,
      description: g?.description ?? '',
      photoUrl: '',
      photoCaption: '',
      isPublished: g?.isPublished ?? true,
    });
    setInlineCatOpen(false);
    setInlineCatName('');
    setGalleryModalOpen(true);
  };

  const resetMediaForm = (nextType: MediaType = MediaType.IMAGE) => {
    setMediaForm({
      id: '',
      mediaType: nextType,
      mediaUrl: '',
      caption: '',
    });
    setMediaSourceMode('upload');
    setMediaFileName('');
    setMediaError('');
  };

  const openMediaManager = (g: Gallery) => {
    setMediaGalleryId(g.id);
    resetMediaForm(MediaType.IMAGE);
  };

  const openMediaItemEdit = (m: GalleryMedia) => {
    const isPreset =
      m.mediaType === MediaType.IMAGE && GALLERY_PRESET_IMAGES.some((p) => p.value === m.mediaUrl);
    const isUploaded = m.mediaUrl.startsWith('data:') || m.mediaUrl.startsWith('blob:');
    setMediaSourceMode(isPreset ? 'preset' : isUploaded ? 'upload' : 'link');
    setMediaFileName(
      isUploaded
        ? m.mediaType === MediaType.VIDEO
          ? 'বিদ্যমান আপলোডকৃত ভিডিও'
          : 'বিদ্যমান আপলোডকৃত ছবি'
        : ''
    );
    setMediaError('');
    setMediaForm({
      id: m.id,
      mediaType: m.mediaType,
      mediaUrl: m.mediaUrl,
      caption: m.caption ?? '',
    });
  };

  const moveGalleryMedia = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= activeGalleryMediaItems.length || fromIdx === toIdx) return;
    const next = [...activeGalleryMediaItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await reorderCms({ collection: 'galleryMedia', orderedIds: next.map((x) => x.id) }).unwrap();
    toast.success('মিডিয়ার ক্রম হালনাগাদ হয়েছে।');
  };

  const openPubEditor = (p?: Publication) => {
    setPubForm({
      id: p?.id ?? '',
      title: p?.title ?? '',
      type: p?.type ?? PublicationType.SCHOOL_MAGAZINE,
      publishYear: String(p?.publishYear ?? 2026),
      description: p?.description ?? '',
      coverImage: p?.coverImage ?? '',
      fileUrl: p?.fileUrl ?? '',
      isPublished: p?.isPublished ?? true,
    });
    setPubModalOpen(true);
  };

  const openAchEditor = (a?: Achievement) => {
    setAchForm({
      id: a?.id ?? '',
      title: a?.title ?? '',
      type: a?.type ?? AchievementType.INSTITUTION_ACHIEVEMENT,
      personName: a?.personName ?? '',
      batch: a?.batch ?? '',
      achievedAt: a?.achievedAt ?? '',
      image: a?.image ?? '',
      description: a?.description ?? '',
      isPublished: a?.isPublished ?? true,
    });
    setAchModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={'মিডিয়া, ভর্তি ও প্রকাশনা CMS'}
        description={'ফটো ও ভিডিও গ্যালারি অ্যালবাম, অনলাইন ভর্তি ক্যাম্পেইন ও ১৩-দফা ফরম, প্রকাশনা এবং অর্জনের তালিকা পাবলিক ওয়েবসাইটের সাথে সামঞ্জস্য রেখে পরিচালনা করুন।'}
        actions={
          <Link href={livePreviewMap[tab].href} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <ExternalLink className="w-4 h-4" />
              {livePreviewMap[tab].label}
            </Button>
          </Link>
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'gallery', label: 'ছবি ও ভিডিও গ্যালারি', count: db.galleries.length },
          { value: 'admission', label: 'ভর্তি ক্যাম্পেইন ও ফরম' },
          { value: 'publications', label: 'প্রকাশনা ও ম্যাগাজিন', count: db.publications.length },
          { value: 'achievements', label: 'অর্জন ও কৃতি শিক্ষার্থী', count: db.achievements.length },
        ]}
      />

      {/* ==================== TAB 1: GALLERY ==================== */}
      {tab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2.5 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={galleryQuery}
                  onChange={(e) => setGalleryQuery(e.target.value)}
                  placeholder={'অ্যালবাম, ক্যাটাগরি বা ক্যাপশন খুঁজুন...'}
                  className="pl-9"
                />
              </div>
              <Select
                value={galleryCategoryFilter}
                onChange={(e) => setGalleryCategoryFilter(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="ALL">{'সব ক্যাটাগরি'}</option>
                {galleryCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={openCategoryManager} className="whitespace-nowrap">
                <FolderCog className="w-4 h-4" />
                {`ক্যাটাগরি পরিচালনা (${formatNumber(sortedGalleryCategories.length, 'bn')})`}
              </Button>
              <Button variant="primary" size="sm" onClick={() => openGalleryEditor()} className="whitespace-nowrap">
                <Plus className="w-4 h-4" />
                {'নতুন অ্যালবাম যুক্ত করুন'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGalleries.map((g) => {
              const items = [...db.galleryMedia.filter((m) => m.galleryId === g.id)].sort(
                (a, b) => a.sortOrder - b.sortOrder
              );
              const firstImage = items.find((m) => m.mediaType === MediaType.IMAGE) ?? items[0];
              const imageCount = items.filter((m) => m.mediaType === MediaType.IMAGE).length;
              const videoCount = items.filter((m) => m.mediaType === MediaType.VIDEO).length;
              const coverSrc =
                firstImage && firstImage.mediaType === MediaType.IMAGE
                  ? getCampusPhoto(firstImage.mediaUrl).src
                  : null;

              return (
                <Card key={g.id} className="overflow-hidden flex flex-col">
                  {coverSrc ? (
                    <div className="relative h-40 border-b border-border bg-surface-muted/40">
                      <img
                        src={coverSrc}
                        alt={g.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {videoCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
                          <Film className="w-3 h-3" />
                          {formatNumber(videoCount, 'bn')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-surface-muted/60 border-b border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                      {videoCount > 0 ? <Film className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                      <span className="text-sm">
                        {videoCount > 0
                          ? 'ভিডিও অ্যালবাম'
                          : 'কোনো ছবি যুক্ত হয়নি'}
                      </span>
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {g.category ?? 'সাধারণ'} · {formatNumber(imageCount, 'bn')}{' '}
                        {'টি ছবি'}
                        {videoCount > 0
                          ? ` · ${formatNumber(videoCount, 'bn')} ${'টি ভিডিও'}`
                          : ''}
                      </p>
                      <h3 className="text-base font-bold text-foreground">{g.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{g.description}</p>
                    </div>
                    <div className="space-y-2.5 pt-3 border-t border-border">
                      <div className="flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMediaManager(g)}
                          className="flex-1 justify-center"
                        >
                          <Images className="w-3.5 h-3.5" />
                          {`মিডিয়া পরিচালনা (${formatNumber(items.length, 'bn')})`}
                        </Button>
                        <Link
                          href={`/gallery/${g.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={'পাবলিক অ্যালবাম দেখুন'}
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                      <div className="flex items-center justify-between">
                        <Switch
                          checked={g.isPublished}
                          onChange={() => toggleCms({ collection: 'galleries', id: g.id, field: 'isPublished' })}
                          label={g.isPublished ? 'প্রকাশিত' : 'খসড়া'}
                        />
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => openGalleryEditor(g)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              await deleteCms({ collection: 'galleries', id: g.id }).unwrap();
                              toast.success('অ্যালবাম ও এর মিডিয়া মুছে ফেলা হয়েছে।');
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: ADMISSION CAMPAIGN & FORM CMS ==================== */}
      {tab === 'admission' && (
        <form onSubmit={handleSaveAdmission} className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {'ভর্তি ক্যাম্পেইন ও হোমপেজ ব্যানার নিয়ন্ত্রণ'}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {'ভর্তি কার্যক্রম চালু/বন্ধ করুন, যোগ্য শ্রেণি, তারিখ ও ফি হালনাগাদ করুন — হোমপেজ ও সকল ভর্তি পেজে সাথে সাথে প্রতিফলিত হবে।'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Switch
                  checked={admForm.isPublished}
                  onChange={(v) => setAdmForm({ ...admForm, isPublished: v })}
                  label={'ভর্তি পাতা সক্রিয়'}
                />
                <Switch
                  checked={admForm.showOnHomepage}
                  onChange={(v) => setAdmForm({ ...admForm, showOnHomepage: v })}
                  label={'হোমপেজে ব্যানার দেখান'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label={'ভর্তি কার্যক্রম অবস্থা'}>
                <Select
                  value={admForm.admissionStatus}
                  onChange={(e) =>
                    setAdmForm({ ...admForm, admissionStatus: e.target.value as 'OPEN' | 'UPCOMING' | 'CLOSED' })
                  }
                >
                  <option value="OPEN">{'ভর্তি চলছে (Open)'}</option>
                  <option value="UPCOMING">{'শীঘ্রই শুরু (Upcoming)'}</option>
                  <option value="CLOSED">{'ভর্তি বন্ধ (Closed)'}</option>
                </Select>
              </FormField>
              <FormField label={'শিক্ষাবর্ষ'}>
                <Input placeholder="শিক্ষাবর্ষ লিখুন" value={admForm.academicSession} onChange={(e) => setAdmForm({ ...admForm, academicSession: e.target.value })} />
              </FormField>
              <FormField label={'আবেদন ফি (টাকা)'}>
                <Input placeholder="আবেদন ফি (টাকা) লিখুন" type="number" value={admForm.applicationFee} onChange={(e) => setAdmForm({ ...admForm, applicationFee: Number(e.target.value) })} />
              </FormField>
              <FormField label={'আবেদন শুরু'}>
                <Input type="date" value={admForm.startDate} onChange={(e) => setAdmForm({ ...admForm, startDate: e.target.value })} />
              </FormField>
              <FormField label={'আবেদনের শেষ তারিখ'}>
                <Input type="date" value={admForm.endDate} onChange={(e) => setAdmForm({ ...admForm, endDate: e.target.value })} />
              </FormField>
              <FormField label={'ভর্তি পরীক্ষার তারিখ'}>
                <Input type="date" value={admForm.admissionTestDate} onChange={(e) => setAdmForm({ ...admForm, admissionTestDate: e.target.value })} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={'হোমপেজ ও ভর্তি ব্যানার শিরোনাম'}>
                <Input placeholder="হোমপেজ ও ভর্তি ব্যানার শিরোনাম লিখুন" value={admForm.bannerTitle} onChange={(e) => setAdmForm({ ...admForm, bannerTitle: e.target.value })} />
              </FormField>
              <FormField label={'ভর্তিযোগ্য শ্রেণি (Eligible Classes)'}>
                <Input
                  value={admForm.eligibleClasses}
                  onChange={(e) => setAdmForm({ ...admForm, eligibleClasses: e.target.value })}
                  placeholder={'যেমন: ৬ষ্ঠ–৯ম শ্রেণি (বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা)'}
                />
              </FormField>
              <FormField label={'মুদ্রণযোগ্য ফরমের শিরোনাম (/admission/download-form)'}>
                <Input placeholder="তথ্য লিখুন" value={admForm.title} onChange={(e) => setAdmForm({ ...admForm, title: e.target.value })} />
              </FormField>
              <FormField label={'ভর্তি হেল্পলাইন নম্বর'}>
                <Input placeholder="মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)" value={admForm.helplinePhone} onChange={(e) => setAdmForm({ ...admForm, helplinePhone: e.target.value })} />
              </FormField>
              <div className="md:col-span-2">
                <FormField label={'ব্যানার উপ-শিরোনাম / বিবরণ'}>
                  <Textarea placeholder="ব্যানার উপ-শিরোনাম / বিবরণ লিখুন..." rows={2} value={admForm.bannerSubtitle} onChange={(e) => setAdmForm({ ...admForm, bannerSubtitle: e.target.value })} />
                </FormField>
              </div>
              <div className="md:col-span-2">
                <FormField label={'অফিসিয়াল ফরম পিডিএফ URL (ঐচ্ছিক)'}>
                  <Input
                    value={admForm.formPdfUrl}
                    onChange={(e) => setAdmForm({ ...admForm, formPdfUrl: e.target.value })}
                    placeholder="https://... বা #official-admission-form"
                  />
                </FormField>
              </div>
            </div>
          </Card>

          {/* Required Documents & Guidelines CMS */}
          <Card className="p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {'প্রয়োজনীয় কাগজপত্র, নির্দেশিকা ও ১৩-দফা ভর্তি ফরম'}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {'পাবলিক /admission, /admission/requirements, /admission/guidelines এবং /admission/download-form পেজের সব তথ্য এখান থেকে নিয়ন্ত্রণ করুন।'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                <Link href="/admission/requirements" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {'কাগজপত্র পেজ ↗'}
                </Link>
                <Link href="/admission/guidelines" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {'নির্দেশিকা ↗'}
                </Link>
                <Link href="/admission/download-form" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {'মুদ্রণযোগ্য ফরম ↗'}
                </Link>
              </div>
            </div>

            {/* Required Documents List */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                {'ভর্তির প্রয়োজনীয় কাগজপত্রের তালিকা (/admission/requirements)'}
              </p>
              <div className="space-y-2">
                {admForm.requiredDocuments.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input placeholder="তথ্য লিখুন"
                      value={doc}
                      onChange={(e) => {
                        const next = [...admForm.requiredDocuments];
                        next[idx] = e.target.value;
                        setAdmForm({ ...admForm, requiredDocuments: next });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setAdmForm({
                          ...admForm,
                          requiredDocuments: admForm.requiredDocuments.filter((_, i) => i !== idx),
                        })
                      }
                      aria-label="Remove document item"
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newDocItem}
                  onChange={(e) => setNewDocItem(e.target.value)}
                  placeholder={'নতুন প্রয়োজনীয় কাগজপত্র যুক্ত করুন...'}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!newDocItem.trim()) return;
                    setAdmForm({
                      ...admForm,
                      requiredDocuments: [...admForm.requiredDocuments, newDocItem.trim()],
                    });
                    setNewDocItem('');
                  }}
                  className="whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  {'যুক্ত করুন'}
                </Button>
              </div>
            </div>

            {/* Guidelines & Declaration */}
            <div className="grid grid-cols-1 gap-4 pt-3 border-t border-border">
              <FormField label={'প্রবেশপত্র নির্দেশনা (/admission/guidelines)'}>
                <Input placeholder="প্রবেশপত্র নির্দেশনা (/admission/guidelines) লিখুন"
                  value={admForm.admitCardNotice}
                  onChange={(e) => setAdmForm({ ...admForm, admitCardNotice: e.target.value })}
                />
              </FormField>
              <FormField label={'অভিভাবকের অঙ্গীকারনামা (/admission/guidelines, /admission/apply ও প্রিন্ট ফরম)'}>
                <Textarea placeholder="অভিভাবকের অঙ্গীকারনামা (/admission/guidelines, /admission/apply ও প্রিন্ট ফরম) লিখুন..."
                  rows={3}
                  value={admForm.declarationText}
                  onChange={(e) => setAdmForm({ ...admForm, declarationText: e.target.value })}
                />
              </FormField>
            </div>

            {/* Collapsible 13-Point Form & Institutional Codes */}
            <details className="rounded-[var(--radius)] border border-border bg-surface-muted/30 p-4">
              <summary className="cursor-pointer text-sm font-bold text-foreground select-none">
                {'১৩-দফা ভর্তি ফরমের দফাসমূহ ও প্রাতিষ্ঠানিক কোড সম্পাদনা করুন (ঐচ্ছিক)'}
              </summary>
              <div className="mt-4 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <FormField label={'বিদ্যালয়ের নাম (বাংলা)'}>
                    <Input placeholder="বিদ্যালয়ের নাম (বাংলা) লিখুন" value={admForm.schoolNameBn} onChange={(e) => setAdmForm({ ...admForm, schoolNameBn: e.target.value })} />
                  </FormField>
                  <FormField label={'বিদ্যালয়ের নাম (ইংরেজি)'}>
                    <Input placeholder="বিদ্যালয়ের নাম (ইংরেজি) লিখুন" value={admForm.schoolNameEn} onChange={(e) => setAdmForm({ ...admForm, schoolNameEn: e.target.value })} />
                  </FormField>
                  <FormField label="EIIN">
                    <Input placeholder="EIIN লিখুন" value={admForm.eiin} onChange={(e) => setAdmForm({ ...admForm, eiin: e.target.value })} />
                  </FormField>
                  <FormField label={'বিদ্যালয় কোড'}>
                    <Input placeholder="বিদ্যালয় কোড লিখুন" value={admForm.schoolCode} onChange={(e) => setAdmForm({ ...admForm, schoolCode: e.target.value })} />
                  </FormField>
                  <FormField label={'জেলা কোড'}>
                    <Input placeholder="জেলা কোড লিখুন" value={admForm.districtCode} onChange={(e) => setAdmForm({ ...admForm, districtCode: e.target.value })} />
                  </FormField>
                  <FormField label={'থানা কোড'}>
                    <Input placeholder="থানা কোড লিখুন" value={admForm.thanaCode} onChange={(e) => setAdmForm({ ...admForm, thanaCode: e.target.value })} />
                  </FormField>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FormField label={'ফরমের ঠিকানা লাইন'}>
                      <Input placeholder="ফরমের ঠিকানা লাইন লিখুন" value={admForm.schoolAddress} onChange={(e) => setAdmForm({ ...admForm, schoolAddress: e.target.value })} />
                    </FormField>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border">
                  {(
                    [
                      ['studentNameNotice', '০১. শিক্ষার্থীর নাম'],
                      ['fatherInfoNotice', '০২. পিতার তথ্য'],
                      ['motherInfoNotice', '০৩. মাতার তথ্য'],
                      ['addressInfoNotice', '০৪. ঠিকানা'],
                      ['dobNotice', '০৫. জন্ম তারিখ'],
                      ['birthCertificateNotice', '০৬. জন্ম নিবন্ধন'],
                      ['religionNotice', '০৭. ধর্ম'],
                      ['prevExamNotice', '০৮. পূর্ববর্তী পরীক্ষা'],
                      ['prevSchoolNotice', '০৯. পূর্ববর্তী বিদ্যালয়'],
                      ['admissionTypeNotice', '১০. ভর্তির ধরন'],
                      ['classesAndSections', '১১. শ্রেণি ও শাখা'],
                      ['availableGroups', '১২. ৯ম শ্রেণির বিভাগ'],
                      ['optionalSubjects', '১৩. ৪র্থ বিষয়'],
                    ] as const
                  ).map(([fieldKey, label]) => (
                    <FormField key={fieldKey} label={label}>
                      <Input placeholder="{label} লিখুন"
                        value={admForm[fieldKey]}
                        onChange={(e) => setAdmForm({ ...admForm, [fieldKey]: e.target.value })}
                      />
                    </FormField>
                  ))}
                </div>
              </div>
            </details>

            <div className="pt-2">
              <Button type="submit" variant="primary" disabled={savingAdmission}>
                <Save className="w-4 h-4" />
                {savingAdmission
                  ? 'সংরক্ষণ হচ্ছে...'
                  : 'ভর্তি ক্যাম্পেইন ও কনটেন্ট সংরক্ষণ করুন'}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ==================== TAB 3: PUBLICATIONS ==================== */}
      {tab === 'publications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2.5 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={pubQuery}
                  onChange={(e) => setPubQuery(e.target.value)}
                  placeholder={'প্রকাশনার শিরোনাম বা বছর খুঁজুন...'}
                  className="pl-9"
                />
              </div>
              <Select
                value={pubTypeFilter}
                onChange={(e) => setPubTypeFilter(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="ALL">{'সব ধরন'}</option>
                <option value={PublicationType.SCHOOL_MAGAZINE}>{'বিদ্যালয় ম্যাগাজিন'}</option>
                <option value={PublicationType.WALL_MAGAZINE}>{'দেয়াল পত্রিকা'}</option>
                <option value={PublicationType.JOURNAL}>{'বার্ষিকী / জার্নাল'}</option>
                <option value={PublicationType.OTHER}>{'অন্যান্য'}</option>
              </Select>
            </div>
            <Button variant="primary" size="sm" onClick={() => openPubEditor()} className="whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" />
              {'নতুন প্রকাশনা যুক্ত করুন'}
            </Button>
          </div>
          <Card className="divide-y divide-border">
            {filteredPublications.map((p) => (
              <div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {p.coverImage ? (
                    <img
                      src={getCampusPhoto(p.coverImage).src}
                      alt={p.title}
                      referrerPolicy="no-referrer"
                      className="w-14 h-16 rounded object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-16 rounded bg-surface-muted border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge enumName="PublicationType" value={p.type} />
                      {p.publishYear && <span className="text-sm text-muted-foreground tabular-nums">{p.publishYear}</span>}
                      {p.fileUrl && (
                        <span className="text-sm text-primary font-medium inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {'ফাইল সংযুক্ত'}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-bold text-foreground">{p.title}</p>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={p.isPublished}
                    onChange={() => toggleCms({ collection: 'publications', id: p.id, field: 'isPublished' })}
                    label={p.isPublished ? 'প্রকাশিত' : 'খসড়া'}
                  />
                  <Button variant="outline" size="sm" onClick={() => openPubEditor(p)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await deleteCms({ collection: 'publications', id: p.id }).unwrap();
                      toast.success('প্রকাশনা মুছে ফেলা হয়েছে।');
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ==================== TAB 4: ACHIEVEMENTS ==================== */}
      {tab === 'achievements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2.5 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={achQuery}
                  onChange={(e) => setAchQuery(e.target.value)}
                  placeholder={'অর্জন, শিক্ষার্থী বা ব্যাচ খুঁজুন...'}
                  className="pl-9"
                />
              </div>
              <Select
                value={achTypeFilter}
                onChange={(e) => setAchTypeFilter(e.target.value)}
                className="w-full sm:w-52"
              >
                <option value="ALL">{'সব ক্যাটাগরি'}</option>
                <option value={AchievementType.INSTITUTION_ACHIEVEMENT}>{'প্রাতিষ্ঠানিক অর্জন'}</option>
                <option value={AchievementType.STUDENT_STAR}>{'কৃতি শিক্ষার্থী'}</option>
                <option value={AchievementType.NOTABLE_ALUMNI}>{'কৃতি প্রাক্তন শিক্ষার্থী'}</option>
              </Select>
            </div>
            <Button variant="primary" size="sm" onClick={() => openAchEditor()} className="whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" />
              {'নতুন অর্জন যুক্ত করুন'}
            </Button>
          </div>
          <Card className="divide-y divide-border">
            {filteredAchievements.map((a) => (
              <div key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {a.image && (
                    <img
                      src={getCampusPhoto(a.image).src}
                      alt={a.title}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded object-cover border border-border shrink-0"
                    />
                  )}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge enumName="AchievementType" value={a.type} />
                      {a.batch && (
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {'ব্যাচ:'} {a.batch}
                        </span>
                      )}
                      {a.achievedAt && (
                        <span className="text-sm text-muted-foreground tabular-nums">
                          · {formatDateShort(a.achievedAt, 'bn')}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-bold text-foreground">{a.title}</p>
                    {a.personName && <p className="text-sm text-primary font-medium">{a.personName}</p>}
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={a.isPublished}
                    onChange={() => toggleCms({ collection: 'achievements', id: a.id, field: 'isPublished' })}
                    label={a.isPublished ? 'প্রকাশিত' : 'খসড়া'}
                  />
                  <Button variant="outline" size="sm" onClick={() => openAchEditor(a)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await deleteCms({ collection: 'achievements', id: a.id }).unwrap();
                      toast.success('অর্জন মুছে ফেলা হয়েছে।');
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ==================== MODAL: GALLERY CATEGORIES MANAGER ==================== */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={'গ্যালারি ক্যাটাগরি পরিচালনা'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {'এখানে তৈরি ও সক্রিয় করা ক্যাটাগরিগুলো নতুন অ্যালবাম তৈরির ড্রপডাউনে এবং পাবলিক গ্যালারির ফিল্টারে প্রদর্শিত হবে। কোনো ক্যাটাগরির নাম পরিবর্তন করলে সংশ্লিষ্ট সব অ্যালবামেও তা স্বয়ংক্রিয়ভাবে হালনাগাদ হবে।'}
          </p>

          {/* Existing Categories List */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              {'বিদ্যমান ক্যাটাগরিসমূহ'} (
              {formatNumber(sortedGalleryCategories.length, 'bn')})
            </p>
            {sortedGalleryCategories.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground border border-dashed border-border rounded-[var(--radius)]">
                {'এখনো কোনো ক্যাটাগরি তৈরি করা হয়নি। নিচ থেকে নতুন ক্যাটাগরি যুক্ত করুন।'}
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-[var(--radius)] max-h-64 overflow-y-auto">
                {sortedGalleryCategories.map((cat, idx) => {
                  const albumCount = db.galleries.filter((g) => (g.category ?? '').trim() === cat.name).length;
                  return (
                    <div key={cat.id} className="p-3 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                          <span className="text-sm text-muted-foreground tabular-nums">
                            ({formatNumber(albumCount, 'bn')} {'টি অ্যালবাম'})
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          checked={cat.isActive}
                          onChange={() =>
                            toggleCms({ collection: 'galleryCategories', id: cat.id, field: 'isActive' })
                          }
                          label={cat.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        />
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveGalleryCategory(idx, idx - 1)}
                          className="h-7 w-7 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                          aria-label="Move category up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sortedGalleryCategories.length - 1}
                          onClick={() => moveGalleryCategory(idx, idx + 1)}
                          className="h-7 w-7 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                          aria-label="Move category down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCatForm({
                              id: cat.id,
                              name: cat.name,
                              description: cat.description ?? '',
                              isActive: cat.isActive,
                            });
                            setCatError('');
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (albumCount > 0) {
                              toast.error(
                                `এই ক্যাটাগরিতে ${formatNumber(albumCount, 'bn')} টি অ্যালবাম রয়েছে। মুছতে চাইলে আগে অ্যালবামগুলোর ক্যাটাগরি পরিবর্তন করুন অথবা ক্যাটাগরিটি নিষ্ক্রিয় রাখুন।`
                              );
                              return;
                            }
                            await deleteCms({ collection: 'galleryCategories', id: cat.id }).unwrap();
                            if (catForm.id === cat.id) {
                              setCatForm({ id: '', name: '', description: '', isActive: true });
                            }
                            toast.success('ক্যাটাগরি মুছে ফেলা হয়েছে।');
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add / Edit Category Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setCatError('');
              const cleanName = catForm.name.trim();
              if (!cleanName) {
                setCatError('ক্যাটাগরির নাম লিখুন।');
                return;
              }
              const duplicate = sortedGalleryCategories.some(
                (c) => c.id !== catForm.id && c.name.trim().toLowerCase() === cleanName.toLowerCase()
              );
              if (duplicate) {
                setCatError('এই নামে একটি ক্যাটাগরি ইতিমধ্যেই রয়েছে।');
                return;
              }
              await upsertCms({
                collection: 'galleryCategories',
                item: {
                  ...(catForm.id ? { id: catForm.id } : {}),
                  name: cleanName,
                  description: catForm.description.trim() || null,
                  isActive: catForm.isActive,
                },
              }).unwrap();
              toast.success(
                catForm.id
                  ? 'ক্যাটাগরি হালনাগাদ হয়েছে।'
                  : 'নতুন ক্যাটাগরি যুক্ত হয়েছে।'
              );
              setCatForm({ id: '', name: '', description: '', isActive: true });
            }}
            className="p-4 rounded-[var(--radius)] border border-border bg-surface-muted/30 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">
                {catForm.id ? 'ক্যাটাগরি সম্পাদনা করুন' : 'নতুন ক্যাটাগরি যুক্ত করুন'}
              </p>
              {catForm.id && (
                <button
                  type="button"
                  onClick={() => {
                    setCatForm({ id: '', name: '', description: '', isActive: true });
                    setCatError('');
                  }}
                  className="text-sm font-semibold text-primary hover:underline cursor-pointer"
                >
                  {'বাতিল'}
                </button>
              )}
            </div>
            <FormField label={'ক্যাটাগরির নাম'} required>
              <Input
                value={catForm.name}
                onChange={(e) => {
                  setCatForm({ ...catForm, name: e.target.value });
                  if (catError) setCatError('');
                }}
                placeholder={'যেমন: বার্ষিক ক্রীড়া, পুরস্কার বিতরণী, শিক্ষা সফর'}
              />
            </FormField>
            <FormField label={'সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)'}>
              <Input
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                placeholder={'এই ক্যাটাগরিতে কোন ধরনের ছবি/ভিডিও থাকবে'}
              />
            </FormField>
            {catError && (
              <p className="text-sm font-medium text-destructive inline-flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {catError}
              </p>
            )}
            <div className="flex items-center justify-between pt-1">
              <Switch
                checked={catForm.isActive}
                onChange={(v) => setCatForm({ ...catForm, isActive: v })}
                label={'সক্রিয় রাখুন'}
              />
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                <Save className="w-4 h-4" />
                {catForm.id ? 'ক্যাটাগরি হালনাগাদ করুন' : 'ক্যাটাগরি যুক্ত করুন'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ==================== MODAL: GALLERY ALBUM ADD/EDIT ==================== */}
      <Modal
        open={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        title={galleryForm.id ? 'অ্যালবাম সম্পাদনা' : 'নতুন ফটো অ্যালবাম'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!galleryForm.title.trim()) {
              toast.error('অ্যালবামের শিরোনাম লিখুন।');
              return;
            }
            if (!galleryForm.category.trim()) {
              toast.error('অনুগ্রহ করে একটি ক্যাটাগরি নির্বাচন করুন।');
              return;
            }
            const coverUrl = galleryForm.photoUrl.trim();
            if (
              coverUrl &&
              !coverUrl.startsWith('data:image/') &&
              !coverUrl.startsWith('blob:') &&
              !isValidMediaUrl(coverUrl, true)
            ) {
              toast.error(
                'কভার ছবির লিংকটি সঠিক নয় (https://... বা /images/... দিন অথবা ছবি আপলোড করুন)।'
              );
              return;
            }
            const saved = (await upsertCms({
              collection: 'galleries',
              item: {
                ...(galleryForm.id ? { id: galleryForm.id } : {}),
                title: galleryForm.title.trim(),
                category: galleryForm.category.trim(),
                description: galleryForm.description.trim(),
                isPublished: galleryForm.isPublished,
              },
            }).unwrap()) as { id: string };
            if (coverUrl && saved?.id) {
              await upsertCms({
                collection: 'galleryMedia',
                item: {
                  galleryId: saved.id,
                  mediaUrl: coverUrl,
                  mediaType: MediaType.IMAGE,
                  caption: galleryForm.photoCaption.trim() || galleryForm.title.trim(),
                },
              }).unwrap();
            }
            toast.success('গ্যালারি অ্যালবাম সংরক্ষিত হয়েছে।');
            setGalleryModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={'অ্যালবামের শিরোনাম'} required>
            <Input
              value={galleryForm.title}
              onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
              placeholder={'যেমন: বার্ষিক বিজ্ঞান মেলা ও প্রদর্শনী ২০২৬'}
            />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-semibold text-foreground">
                {'ক্যাটাগরি (পাবলিক ফিল্টারের জন্য)'}{' '}
                <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setInlineCatOpen((prev) => !prev);
                    setInlineCatName('');
                  }}
                  className="text-sm font-semibold text-primary hover:underline cursor-pointer"
                >
                  {inlineCatOpen ? 'বাতিল' : '+ নতুন ক্যাটাগরি'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGalleryModalOpen(false);
                    openCategoryManager();
                  }}
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                >
                  {'সব পরিচালনা'}
                </button>
              </div>
            </div>

            <Select
              value={galleryForm.category}
              onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
            >
              {albumCategoryOptions.length === 0 ? (
                <option value="">{'— আগে একটি ক্যাটাগরি তৈরি করুন —'}</option>
              ) : (
                albumCategoryOptions.map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))
              )}
            </Select>

            {inlineCatOpen && (
              <div className="p-2.5 rounded-[var(--radius)] border border-border bg-surface-muted/40 flex items-center gap-2">
                <Input
                  value={inlineCatName}
                  onChange={(e) => setInlineCatName(e.target.value)}
                  placeholder={'নতুন ক্যাটাগরির নাম লিখুন...'}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  className="whitespace-nowrap shrink-0"
                  onClick={async () => {
                    const clean = inlineCatName.trim();
                    if (!clean) {
                      toast.error('ক্যাটাগরির নাম লিখুন।');
                      return;
                    }
                    const existing = sortedGalleryCategories.find(
                      (c) => c.name.trim().toLowerCase() === clean.toLowerCase()
                    );
                    if (existing) {
                      setGalleryForm((prev) => ({ ...prev, category: existing.name }));
                      setInlineCatOpen(false);
                      setInlineCatName('');
                      toast.info('বিদ্যমান ক্যাটাগরি নির্বাচন করা হয়েছে।');
                      return;
                    }
                    await upsertCms({
                      collection: 'galleryCategories',
                      item: { name: clean, isActive: true },
                    }).unwrap();
                    setGalleryForm((prev) => ({ ...prev, category: clean }));
                    setInlineCatOpen(false);
                    setInlineCatName('');
                    toast.success('নতুন ক্যাটাগরি তৈরি ও নির্বাচিত হয়েছে।');
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {'যুক্ত করুন'}
                </Button>
              </div>
            )}
          </div>

          <FormField label={'বিবরণ'}>
            <Textarea placeholder="বিবরণ লিখুন..."
              rows={2}
              value={galleryForm.description}
              onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
            />
          </FormField>

          <FormField label={'কভার ছবি আপলোড বা লিংক (ঐচ্ছিক)'}>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readImageAsDataUrl(file, (url) => setGalleryForm((prev) => ({ ...prev, photoUrl: url })));
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface-muted file:text-foreground cursor-pointer"
              />
              <Input
                value={galleryForm.photoUrl.startsWith('data:') ? '' : galleryForm.photoUrl}
                onChange={(e) => setGalleryForm({ ...galleryForm, photoUrl: e.target.value })}
                placeholder={'অথবা ছবির লিংক দিন (https://... বা /images/...)'}
              />
              {galleryForm.photoUrl && (
                <div className="flex items-center gap-3 p-2 rounded-[var(--radius)] border border-border bg-surface-muted/30">
                  <img
                    src={getCampusPhoto(galleryForm.photoUrl).src}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 rounded object-cover border border-border shrink-0"
                  />
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {galleryForm.photoUrl.startsWith('data:')
                      ? 'আপলোডকৃত ছবি প্রস্তুত'
                      : galleryForm.photoUrl}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setGalleryForm((prev) => ({ ...prev, photoUrl: '', photoCaption: '' }))}
                    aria-label="Clear cover photo"
                  >
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </FormField>

          {galleryForm.photoUrl && (
            <FormField label={'ছবির ক্যাপশন'}>
              <Input
                value={galleryForm.photoCaption}
                onChange={(e) => setGalleryForm({ ...galleryForm, photoCaption: e.target.value })}
                placeholder={'ছবিটির সংক্ষিপ্ত বিবরণ লিখুন'}
              />
            </FormField>
          )}
          <div className="flex items-center justify-between pt-2">
            <Switch
              checked={galleryForm.isPublished}
              onChange={(v) => setGalleryForm({ ...galleryForm, isPublished: v })}
              label={'পাবলিক গ্যালারিতে প্রকাশ করুন'}
            />
            <Button type="submit" variant="primary" disabled={saving}>
              <Upload className="w-4 h-4" /> {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: ALBUM MEDIA MANAGER (PHOTOS/VIDEOS, CAPTIONS & ORDER) ==================== */}
      <Modal
        open={Boolean(activeMediaGallery)}
        onClose={() => setMediaGalleryId(null)}
        title={
          activeMediaGallery
            ? `${'মিডিয়া পরিচালনা:'} ${activeMediaGallery.title}`
            : ''
        }
        maxWidth="max-w-3xl"
      >
        {activeMediaGallery && (
          <div className="space-y-5">
            {/* Existing Media List */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-foreground">
                {'অ্যালবামের বর্তমান ছবি ও ভিডিওসমূহ'} (
                {formatNumber(activeGalleryMediaItems.length, 'bn')})
              </p>
              {activeGalleryMediaItems.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-[var(--radius)]">
                  {'এই অ্যালবামে এখনো কোনো ছবি বা ভিডিও নেই। নিচ থেকে যুক্ত করুন।'}
                </div>
              ) : (
                <div className="divide-y divide-border border border-border rounded-[var(--radius)] max-h-72 overflow-y-auto">
                  {activeGalleryMediaItems.map((m, idx) => {
                    const isUploaded = m.mediaUrl.startsWith('data:') || m.mediaUrl.startsWith('blob:');
                    return (
                      <div key={m.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {m.mediaType === MediaType.IMAGE ? (
                            <img
                              src={getCampusPhoto(m.mediaUrl).src}
                              alt={m.caption ?? ''}
                              referrerPolicy="no-referrer"
                              className="w-16 h-12 rounded object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-12 rounded bg-surface-muted border border-border flex items-center justify-center shrink-0 text-primary">
                              <Film className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {m.caption || '(ক্যাপশন নেই)'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {m.mediaType === MediaType.VIDEO ? 'VIDEO' : 'IMAGE'} ·{' '}
                              {isUploaded
                                ? m.mediaType === MediaType.VIDEO
                                  ? 'আপলোডকৃত ভিডিও'
                                  : 'আপলোডকৃত ছবি'
                                : m.mediaUrl}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveGalleryMedia(idx, idx - 1)}
                            className="h-7 w-7 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                            aria-label="Move media up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === activeGalleryMediaItems.length - 1}
                            onClick={() => moveGalleryMedia(idx, idx + 1)}
                            className="h-7 w-7 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                            aria-label="Move media down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <Button variant="outline" size="sm" onClick={() => openMediaItemEdit(m)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              await deleteCms({ collection: 'galleryMedia', id: m.id }).unwrap();
                              if (mediaForm.id === m.id) resetMediaForm(MediaType.IMAGE);
                              toast.success('মিডিয়া মুছে ফেলা হয়েছে।');
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add / Edit Media Item Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setMediaError('');
                const url = mediaForm.mediaUrl.trim();

                if (mediaForm.mediaType === MediaType.IMAGE) {
                  if (mediaSourceMode === 'upload') {
                    if (!url || (!url.startsWith('data:image/') && !url.startsWith('blob:'))) {
                      const msg = 'ছবি যুক্ত করা বাধ্যতামূলক — ডিভাইস থেকে একটি ছবি আপলোড করুন অথবা ছবির লিংক/প্রিসেট নির্বাচন করুন।';
                      setMediaError(msg);
                      toast.error(msg);
                      return;
                    }
                  } else if (mediaSourceMode === 'link') {
                    if (!isValidMediaUrl(url, true)) {
                      const msg = 'সঠিক ছবির লিংক (https://... বা /images/...) দিন অথবা ছবি আপলোড করুন।';
                      setMediaError(msg);
                      toast.error(msg);
                      return;
                    }
                  } else if (mediaSourceMode === 'preset') {
                    if (!GALLERY_PRESET_IMAGES.some((p) => p.value === url)) {
                      const msg = 'একটি ক্যাম্পাস প্রিসেট ছবি নির্বাচন করুন অথবা ছবি আপলোড/লিংক দিন।';
                      setMediaError(msg);
                      toast.error(msg);
                      return;
                    }
                  }
                } else {
                  if (mediaSourceMode === 'upload') {
                    if (!url || (!url.startsWith('data:video/') && !url.startsWith('blob:'))) {
                      const msg = 'ভিডিও যুক্ত করা বাধ্যতামূলক — ডিভাইস থেকে একটি ভিডিও ফাইল আপলোড করুন অথবা ভিডিও লিংক দিন।';
                      setMediaError(msg);
                      toast.error(msg);
                      return;
                    }
                  } else {
                    if (!isValidMediaUrl(url, false)) {
                      const msg = 'সঠিক ভিডিও লিংক (https://...) দিন অথবা ভিডিও ফাইল আপলোড করুন।';
                      setMediaError(msg);
                      toast.error(msg);
                      return;
                    }
                  }
                }

                await upsertCms({
                  collection: 'galleryMedia',
                  item: {
                    ...(mediaForm.id ? { id: mediaForm.id } : {}),
                    galleryId: activeMediaGallery.id,
                    mediaType: mediaForm.mediaType,
                    mediaUrl: url,
                    caption: mediaForm.caption.trim() || activeMediaGallery.title,
                  },
                }).unwrap();
                toast.success(
                  mediaForm.id
                    ? 'মিডিয়া হালনাগাদ হয়েছে।'
                    : 'অ্যালবামে নতুন মিডিয়া যুক্ত হয়েছে।'
                );
                resetMediaForm(mediaForm.mediaType);
              }}
              className="p-4 rounded-[var(--radius)] border border-border bg-surface-muted/30 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">
                  {mediaForm.id
                    ? 'মিডিয়া সম্পাদনা করুন'
                    : 'নতুন ছবি / ভিডিও যুক্ত করুন'}
                </p>
                {mediaForm.id && (
                  <button
                    type="button"
                    onClick={() => resetMediaForm(MediaType.IMAGE)}
                    className="text-sm font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {'বাতিল'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <FormField label={'মিডিয়ার ধরন'} required>
                  <Select
                    value={mediaForm.mediaType}
                    onChange={(e) => {
                      const nextType = e.target.value as MediaType;
                      setMediaForm((prev) => ({
                        ...prev,
                        mediaType: nextType,
                        mediaUrl: '',
                      }));
                      setMediaSourceMode('upload');
                      setMediaFileName('');
                      setMediaError('');
                    }}
                  >
                    <option value={MediaType.IMAGE}>{'ছবি (Image)'}</option>
                    <option value={MediaType.VIDEO}>{'ভিডিও (Video)'}</option>
                  </Select>
                </FormField>

                {/* Source Mode Switcher (Upload OR Link, plus Preset for Image) */}
                <FormField label={'মিডিয়ার উৎস নির্বাচন করুন (যেকোনো একটি বাধ্যতামূলক)'} required>
                  <div className="inline-flex w-full rounded-[var(--radius)] border border-border bg-surface p-0.5 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (mediaSourceMode !== 'upload') {
                          setMediaSourceMode('upload');
                          setMediaForm((prev) => ({ ...prev, mediaUrl: '' }));
                          setMediaFileName('');
                          setMediaError('');
                        }
                      }}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-[calc(var(--radius)-2px)] text-xs font-semibold transition-colors cursor-pointer ${
                        mediaSourceMode === 'upload'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {'আপলোড'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (mediaSourceMode !== 'link') {
                          setMediaSourceMode('link');
                          setMediaForm((prev) => ({ ...prev, mediaUrl: '' }));
                          setMediaFileName('');
                          setMediaError('');
                        }
                      }}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-[calc(var(--radius)-2px)] text-xs font-semibold transition-colors cursor-pointer ${
                        mediaSourceMode === 'link'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {'লিংক শেয়ার'}
                    </button>
                    {mediaForm.mediaType === MediaType.IMAGE && (
                      <button
                        type="button"
                        onClick={() => {
                          if (mediaSourceMode !== 'preset') {
                            setMediaSourceMode('preset');
                            setMediaForm((prev) => ({ ...prev, mediaUrl: '' }));
                            setMediaFileName('');
                            setMediaError('');
                          }
                        }}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-[calc(var(--radius)-2px)] text-xs font-semibold transition-colors cursor-pointer ${
                          mediaSourceMode === 'preset'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        {'প্রিসেট'}
                      </button>
                    )}
                  </div>
                </FormField>
              </div>

              {/* Dynamic Source Input based on MediaType & SourceMode */}
              {mediaForm.mediaType === MediaType.IMAGE && mediaSourceMode === 'upload' && (
                <FormField label={'ডিভাইস থেকে ছবি আপলোড করুন'} required>
                  <input
                    key={`img-upload-${mediaForm.id}-${mediaFileName ? 'filled' : 'empty'}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        setMediaError('শুধুমাত্র ছবির ফাইল (JPG, PNG, WebP) নির্বাচন করুন।');
                        return;
                      }
                      setMediaFileName(file.name);
                      setMediaError('');
                      readImageAsDataUrl(file, (url) => setMediaForm((prev) => ({ ...prev, mediaUrl: url })));
                    }}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface file:text-foreground cursor-pointer"
                  />
                  {mediaForm.mediaUrl && (
                    <div className="mt-2 flex items-center gap-3 p-2 rounded-[var(--radius)] border border-border bg-surface">
                      <img
                        src={getCampusPhoto(mediaForm.mediaUrl).src}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-16 h-12 rounded object-cover border border-border shrink-0"
                      />
                      <span className="text-sm text-foreground truncate flex-1">
                        {mediaFileName || 'ছবি নির্বাচিত হয়েছে'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMediaForm((prev) => ({ ...prev, mediaUrl: '' }));
                          setMediaFileName('');
                        }}
                      >
                        <X className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </FormField>
              )}

              {mediaForm.mediaType === MediaType.IMAGE && mediaSourceMode === 'link' && (
                <FormField label={'ছবির সরাসরি লিংক (URL)'} required>
                  <Input
                    value={mediaForm.mediaUrl}
                    onChange={(e) => {
                      setMediaForm({ ...mediaForm, mediaUrl: e.target.value });
                      if (mediaError) setMediaError('');
                    }}
                    placeholder="https://example.com/photo.jpg বা /images/campus.jpg"
                  />
                  {isValidMediaUrl(mediaForm.mediaUrl, true) && (
                    <div className="mt-2 flex items-center gap-3 p-2 rounded-[var(--radius)] border border-border bg-surface">
                      <img
                        src={getCampusPhoto(mediaForm.mediaUrl.trim()).src}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-16 h-12 rounded object-cover border border-border shrink-0"
                      />
                      <span className="text-sm text-muted-foreground truncate flex-1">{mediaForm.mediaUrl.trim()}</span>
                    </div>
                  )}
                </FormField>
              )}

              {mediaForm.mediaType === MediaType.IMAGE && mediaSourceMode === 'preset' && (
                <FormField label={'ক্যাম্পাস প্রিসেট ছবি নির্বাচন করুন'} required>
                  <Select
                    value={mediaForm.mediaUrl}
                    onChange={(e) => {
                      setMediaForm({ ...mediaForm, mediaUrl: e.target.value });
                      if (mediaError) setMediaError('');
                    }}
                  >
                    <option value="">{'— একটি প্রিসেট ছবি নির্বাচন করুন —'}</option>
                    {GALLERY_PRESET_IMAGES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.labelBn}
                      </option>
                    ))}
                  </Select>
                  {GALLERY_PRESET_IMAGES.some((p) => p.value === mediaForm.mediaUrl) && (
                    <div className="mt-2 flex items-center gap-3 p-2 rounded-[var(--radius)] border border-border bg-surface">
                      <img
                        src={getCampusPhoto(mediaForm.mediaUrl).src}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-16 h-12 rounded object-cover border border-border shrink-0"
                      />
                      <span className="text-sm text-muted-foreground">
                        {'প্রিসেট ছবি প্রিভিউ'}
                      </span>
                    </div>
                  )}
                </FormField>
              )}

              {mediaForm.mediaType === MediaType.VIDEO && mediaSourceMode === 'upload' && (
                <FormField
                  label={'ডিভাইস থেকে ভিডিও আপলোড করুন (MP4 / WebM / MOV)'}
                  required
                >
                  <input
                    key={`vid-upload-${mediaForm.id}-${mediaFileName ? 'filled' : 'empty'}`}
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith('video/')) {
                        setMediaError('শুধুমাত্র ভিডিও ফাইল (MP4, WebM, MOV) নির্বাচন করুন।');
                        return;
                      }
                      setMediaFileName(file.name);
                      setMediaError('');
                      readVideoSource(file, (url, isBlob) => {
                        setMediaForm((prev) => ({ ...prev, mediaUrl: url }));
                        if (isBlob) {
                          toast.info(
                            'বড় ভিডিও ফাইল বর্তমান সেশনের জন্য সংযুক্ত হয়েছে। ব্যাকএন্ড যুক্ত হলে এটি ক্লাউডে আপলোড হবে।'
                          );
                        }
                      });
                    }}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface file:text-foreground cursor-pointer"
                  />
                  {mediaForm.mediaUrl && (
                    <div className="mt-2 p-2.5 rounded-[var(--radius)] border border-border bg-surface space-y-2">
                      <video
                        src={mediaForm.mediaUrl}
                        controls
                        playsInline
                        className="w-full max-h-44 rounded bg-black object-contain"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-foreground truncate">
                          {mediaFileName || 'ভিডিও নির্বাচিত হয়েছে'}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setMediaForm((prev) => ({ ...prev, mediaUrl: '' }));
                            setMediaFileName('');
                          }}
                        >
                          <X className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </FormField>
              )}

              {mediaForm.mediaType === MediaType.VIDEO && mediaSourceMode === 'link' && (
                <FormField label={'ভিডিও লিংক শেয়ার করুন (YouTube / Shorts / Vimeo / MP4 URL)'} required>
                  <Input
                    value={mediaForm.mediaUrl}
                    onChange={(e) => {
                      setMediaForm({ ...mediaForm, mediaUrl: e.target.value });
                      if (mediaError) setMediaError('');
                    }}
                    placeholder="https://www.youtube.com/watch?v=... বা https://.../video.mp4"
                  />
                </FormField>
              )}

              {mediaError && (
                <div className="flex items-start gap-2 p-2.5 rounded-[var(--radius)] bg-destructive/10 border border-destructive/25 text-sm font-medium text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{mediaError}</span>
                </div>
              )}

              <FormField label={'ক্যাপশন (সার্চ ও প্রদর্শনের জন্য)'}>
                <Input
                  value={mediaForm.caption}
                  onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })}
                  placeholder={'যেমন: বার্ষিক বিজ্ঞান মেলায় শিক্ষার্থীদের প্রজেক্ট প্রদর্শনী'}
                />
              </FormField>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  <Save className="w-4 h-4" />
                  {mediaForm.id ? 'হালনাগাদ করুন' : 'অ্যালবামে যুক্ত করুন'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ==================== MODAL: PUBLICATION ADD/EDIT ==================== */}
      <Modal
        open={pubModalOpen}
        onClose={() => setPubModalOpen(false)}
        title={pubForm.id ? 'প্রকাশনা সম্পাদনা' : 'নতুন প্রকাশনা'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!pubForm.title.trim()) return;
            await upsertCms({
              collection: 'publications',
              item: {
                ...(pubForm.id ? { id: pubForm.id } : {}),
                title: pubForm.title.trim(),
                type: pubForm.type,
                publishYear: Number(pubForm.publishYear) || 2026,
                description: pubForm.description.trim(),
                coverImage: pubForm.coverImage.trim() || null,
                fileUrl: pubForm.fileUrl.trim() || null,
                isPublished: pubForm.isPublished,
              },
            }).unwrap();
            toast.success('প্রকাশনা সংরক্ষিত হয়েছে।');
            setPubModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={'শিরোনাম'} required>
            <Input placeholder="শিরোনাম লিখুন" value={pubForm.title} onChange={(e) => setPubForm({ ...pubForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={'ধরন'}>
              <Select value={pubForm.type} onChange={(e) => setPubForm({ ...pubForm, type: e.target.value as PublicationType })}>
                <option value={PublicationType.SCHOOL_MAGAZINE}>{'বিদ্যালয় ম্যাগাজিন'}</option>
                <option value={PublicationType.WALL_MAGAZINE}>{'দেয়াল পত্রিকা'}</option>
                <option value={PublicationType.JOURNAL}>{'বার্ষিকী / জার্নাল'}</option>
                <option value={PublicationType.OTHER}>{'অন্যান্য'}</option>
              </Select>
            </FormField>
            <FormField label={'প্রকাশের বছর'}>
              <Input placeholder="প্রকাশের বছর লিখুন" type="number" value={pubForm.publishYear} onChange={(e) => setPubForm({ ...pubForm, publishYear: e.target.value })} />
            </FormField>
          </div>
          <FormField label={'সংক্ষিপ্ত বিবরণ'}>
            <Textarea placeholder="সংক্ষিপ্ত বিবরণ লিখুন..." rows={3} value={pubForm.description} onChange={(e) => setPubForm({ ...pubForm, description: e.target.value })} />
          </FormField>
          <FormField label={'পিডিএফ / ডকুমেন্ট লিংক বা ফাইল আপলোড (ঐচ্ছিক)'}>
            <div className="space-y-2">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readImageAsDataUrl(file, (url) => setPubForm((prev) => ({ ...prev, fileUrl: url })));
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface-muted file:text-foreground cursor-pointer"
              />
              <Input
                value={pubForm.fileUrl.startsWith('data:') ? '' : pubForm.fileUrl}
                onChange={(e) => setPubForm({ ...pubForm, fileUrl: e.target.value })}
                placeholder="https://... বা পিডিএফ ফাইল লিংক"
              />
              {pubForm.fileUrl && (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[var(--radius)] border border-border bg-surface-muted/30 text-sm">
                  <span className="truncate text-foreground">
                    {pubForm.fileUrl.startsWith('data:') ? 'পিডিএফ ফাইল সংযুক্ত হয়েছে' : pubForm.fileUrl}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPubForm((prev) => ({ ...prev, fileUrl: '' }))}
                  >
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </FormField>
          <FormField label={'কভার ছবি আপলোড বা লিংক (ঐচ্ছিক)'}>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readImageAsDataUrl(file, (url) => setPubForm((prev) => ({ ...prev, coverImage: url })));
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface-muted file:text-foreground cursor-pointer"
              />
              <Input
                value={pubForm.coverImage.startsWith('data:') ? '' : pubForm.coverImage}
                onChange={(e) => setPubForm({ ...pubForm, coverImage: e.target.value })}
                placeholder="https://... বা /images/..."
              />
              {pubForm.coverImage && (
                <div className="flex items-center gap-3 p-2 rounded-[var(--radius)] border border-border bg-surface-muted/30">
                  <img
                    src={getCampusPhoto(pubForm.coverImage).src}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-12 h-14 rounded object-cover border border-border shrink-0"
                  />
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {pubForm.coverImage.startsWith('data:') ? 'কভার ছবি সংযুক্ত' : pubForm.coverImage}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPubForm((prev) => ({ ...prev, coverImage: '' }))}
                  >
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch
              checked={pubForm.isPublished}
              onChange={(v) => setPubForm({ ...pubForm, isPublished: v })}
              label={'ওয়েবসাইটে প্রকাশ করুন'}
            />
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: ACHIEVEMENT ADD/EDIT ==================== */}
      <Modal
        open={achModalOpen}
        onClose={() => setAchModalOpen(false)}
        title={achForm.id ? 'অর্জন সম্পাদনা' : 'নতুন অর্জন যুক্ত করুন'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!achForm.title.trim()) return;
            await upsertCms({
              collection: 'achievements',
              item: {
                ...(achForm.id ? { id: achForm.id } : {}),
                title: achForm.title.trim(),
                type: achForm.type,
                personName: achForm.personName.trim() || null,
                batch: achForm.batch.trim() || null,
                achievedAt: achForm.achievedAt || null,
                image: achForm.image.trim() || null,
                description: achForm.description.trim(),
                isPublished: achForm.isPublished,
              },
            }).unwrap();
            toast.success('অর্জন সংরক্ষিত হয়েছে।');
            setAchModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={'অর্জনের শিরোনাম'} required>
            <Input placeholder="অর্জনের শিরোনাম লিখুন" value={achForm.title} onChange={(e) => setAchForm({ ...achForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={'ধরন'}>
              <Select value={achForm.type} onChange={(e) => setAchForm({ ...achForm, type: e.target.value as AchievementType })}>
                <option value={AchievementType.INSTITUTION_ACHIEVEMENT}>{'প্রাতিষ্ঠানিক অর্জন'}</option>
                <option value={AchievementType.STUDENT_STAR}>{'কৃতি শিক্ষার্থী'}</option>
                <option value={AchievementType.NOTABLE_ALUMNI}>{'কৃতি প্রাক্তন শিক্ষার্থী'}</option>
              </Select>
            </FormField>
            <FormField label={'অর্জনের তারিখ (ঐচ্ছিক)'}>
              <Input type="date" value={achForm.achievedAt} onChange={(e) => setAchForm({ ...achForm, achievedAt: e.target.value })} />
            </FormField>
            <FormField label={'ব্যক্তি / শিক্ষার্থীর নাম (ঐচ্ছিক)'}>
              <Input placeholder="ব্যক্তি / শিক্ষার্থীর নাম (ঐচ্ছিক) লিখুন" value={achForm.personName} onChange={(e) => setAchForm({ ...achForm, personName: e.target.value })} />
            </FormField>
            <FormField label={'ব্যাচ / সন (ঐচ্ছিক)'}>
              <Input value={achForm.batch} onChange={(e) => setAchForm({ ...achForm, batch: e.target.value })} placeholder="যেমন: ব্যাচ ২০২৬" />
            </FormField>
          </div>
          <FormField label={'বিস্তারিত'}>
            <Textarea placeholder="বিস্তারিত লিখুন..." rows={3} value={achForm.description} onChange={(e) => setAchForm({ ...achForm, description: e.target.value })} />
          </FormField>
          <FormField label={'ছবি আপলোড বা লিংক (ঐচ্ছিক)'}>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readImageAsDataUrl(file, (url) => setAchForm((prev) => ({ ...prev, image: url })));
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface-muted file:text-foreground cursor-pointer"
              />
              <Input
                value={achForm.image.startsWith('data:') ? '' : achForm.image}
                onChange={(e) => setAchForm({ ...achForm, image: e.target.value })}
                placeholder="https://... বা /images/..."
              />
              {achForm.image && (
                <div className="flex items-center gap-3 p-2 rounded-[var(--radius)] border border-border bg-surface-muted/30">
                  <img
                    src={getCampusPhoto(achForm.image).src}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded object-cover border border-border shrink-0"
                  />
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {achForm.image.startsWith('data:') ? 'ছবি সংযুক্ত' : achForm.image}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAchForm((prev) => ({ ...prev, image: '' }))}
                  >
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch
              checked={achForm.isPublished}
              onChange={(v) => setAchForm({ ...achForm, isPublished: v })}
              label={'ওয়েবসাইটে প্রকাশ করুন'}
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

