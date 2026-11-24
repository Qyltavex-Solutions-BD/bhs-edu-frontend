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
import { useI18n } from '@/src/lib/i18n';
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
  const { locale, pick } = useI18n();
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
    gallery: { href: '/gallery', label: pick('পাবলিক গ্যালারি দেখুন', 'View Public Gallery') },
    admission: { href: '/admission', label: pick('পাবলিক ভর্তি পেজ দেখুন', 'View Admission Page') },
    publications: { href: '/publications', label: pick('পাবলিক প্রকাশনা দেখুন', 'View Publications') },
    achievements: { href: '/achievements', label: pick('পাবলিক অর্জন পেজ দেখুন', 'View Achievements') },
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
      pick(
        'ভর্তি ক্যাম্পেইন, ১৩-দফা ফরম ও নির্দেশিকা সংরক্ষিত হয়েছে।',
        'Admission campaign, form & guidelines saved.'
      )
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
    toast.success(pick('ক্যাটাগরির ক্রম হালনাগাদ হয়েছে।', 'Category order updated.'));
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
          ? pick('বিদ্যমান আপলোডকৃত ভিডিও', 'Existing uploaded video')
          : pick('বিদ্যমান আপলোডকৃত ছবি', 'Existing uploaded image')
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
    toast.success(pick('মিডিয়ার ক্রম হালনাগাদ হয়েছে।', 'Media order updated.'));
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
        title={pick('মিডিয়া, ভর্তি ও প্রকাশনা CMS', 'Media, Admission & Publications CMS')}
        description={pick(
          'ফটো ও ভিডিও গ্যালারি অ্যালবাম, অনলাইন ভর্তি ক্যাম্পেইন ও ১৩-দফা ফরম, প্রকাশনা এবং অর্জনের তালিকা পাবলিক ওয়েবসাইটের সাথে সামঞ্জস্য রেখে পরিচালনা করুন।',
          'Manage photo/video gallery albums, admission campaign & 13-point form, publications, and achievements aligned with the public website.'
        )}
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
          { value: 'gallery', label: pick('ছবি ও ভিডিও গ্যালারি', 'Photo & Video Gallery'), count: db.galleries.length },
          { value: 'admission', label: pick('ভর্তি ক্যাম্পেইন ও ফরম', 'Admission & Form') },
          { value: 'publications', label: pick('প্রকাশনা ও ম্যাগাজিন', 'Publications'), count: db.publications.length },
          { value: 'achievements', label: pick('অর্জন ও কৃতি শিক্ষার্থী', 'Achievements'), count: db.achievements.length },
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
                  placeholder={pick('অ্যালবাম, ক্যাটাগরি বা ক্যাপশন খুঁজুন...', 'Search albums, category, or caption...')}
                  className="pl-9"
                />
              </div>
              <Select
                value={galleryCategoryFilter}
                onChange={(e) => setGalleryCategoryFilter(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="ALL">{pick('সব ক্যাটাগরি', 'All Categories')}</option>
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
                {pick(
                  `ক্যাটাগরি পরিচালনা (${formatNumber(sortedGalleryCategories.length, locale)})`,
                  `Manage Categories (${sortedGalleryCategories.length})`
                )}
              </Button>
              <Button variant="primary" size="sm" onClick={() => openGalleryEditor()} className="whitespace-nowrap">
                <Plus className="w-4 h-4" />
                {pick('নতুন অ্যালবাম যুক্ত করুন', 'Add Album')}
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
                          {formatNumber(videoCount, locale)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-surface-muted/60 border-b border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                      {videoCount > 0 ? <Film className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                      <span className="text-xs">
                        {videoCount > 0
                          ? pick('ভিডিও অ্যালবাম', 'Video Album')
                          : pick('কোনো ছবি যুক্ত হয়নি', 'No media uploaded yet')}
                      </span>
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {g.category ?? pick('সাধারণ', 'General')} · {formatNumber(imageCount, locale)}{' '}
                        {pick('টি ছবি', 'photos')}
                        {videoCount > 0
                          ? ` · ${formatNumber(videoCount, locale)} ${pick('টি ভিডিও', 'videos')}`
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
                          {pick(`মিডিয়া পরিচালনা (${formatNumber(items.length, locale)})`, `Manage Media (${items.length})`)}
                        </Button>
                        <Link
                          href={`/gallery/${g.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={pick('পাবলিক অ্যালবাম দেখুন', 'View Live Album')}
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
                          label={g.isPublished ? pick('প্রকাশিত', 'Published') : pick('খসড়া', 'Draft')}
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
                              toast.success(pick('অ্যালবাম ও এর মিডিয়া মুছে ফেলা হয়েছে।', 'Album and its media deleted.'));
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
                  {pick('ভর্তি ক্যাম্পেইন ও হোমপেজ ব্যানার নিয়ন্ত্রণ', 'Admission Campaign & Homepage Banner Control')}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {pick(
                    'ভর্তি কার্যক্রম চালু/বন্ধ করুন, যোগ্য শ্রেণি, তারিখ ও ফি হালনাগাদ করুন — হোমপেজ ও সকল ভর্তি পেজে সাথে সাথে প্রতিফলিত হবে।',
                    'Control admission cycle status, eligible classes, schedule & fee across homepage and all public admission routes.'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Switch
                  checked={admForm.isPublished}
                  onChange={(v) => setAdmForm({ ...admForm, isPublished: v })}
                  label={pick('ভর্তি পাতা সক্রিয়', 'Published')}
                />
                <Switch
                  checked={admForm.showOnHomepage}
                  onChange={(v) => setAdmForm({ ...admForm, showOnHomepage: v })}
                  label={pick('হোমপেজে ব্যানার দেখান', 'Show on Homepage')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label={pick('ভর্তি কার্যক্রম অবস্থা', 'Admission Cycle Status')}>
                <Select
                  value={admForm.admissionStatus}
                  onChange={(e) =>
                    setAdmForm({ ...admForm, admissionStatus: e.target.value as 'OPEN' | 'UPCOMING' | 'CLOSED' })
                  }
                >
                  <option value="OPEN">{pick('ভর্তি চলছে (Open)', 'Admissions Open')}</option>
                  <option value="UPCOMING">{pick('শীঘ্রই শুরু (Upcoming)', 'Opening Soon')}</option>
                  <option value="CLOSED">{pick('ভর্তি বন্ধ (Closed)', 'Admissions Closed')}</option>
                </Select>
              </FormField>
              <FormField label={pick('শিক্ষাবর্ষ', 'Academic Session')}>
                <Input value={admForm.academicSession} onChange={(e) => setAdmForm({ ...admForm, academicSession: e.target.value })} />
              </FormField>
              <FormField label={pick('আবেদন ফি (টাকা)', 'Application Fee (BDT)')}>
                <Input type="number" value={admForm.applicationFee} onChange={(e) => setAdmForm({ ...admForm, applicationFee: Number(e.target.value) })} />
              </FormField>
              <FormField label={pick('আবেদন শুরু', 'Start Date')}>
                <Input type="date" value={admForm.startDate} onChange={(e) => setAdmForm({ ...admForm, startDate: e.target.value })} />
              </FormField>
              <FormField label={pick('আবেদনের শেষ তারিখ', 'Deadline')}>
                <Input type="date" value={admForm.endDate} onChange={(e) => setAdmForm({ ...admForm, endDate: e.target.value })} />
              </FormField>
              <FormField label={pick('ভর্তি পরীক্ষার তারিখ', 'Admission Test Date')}>
                <Input type="date" value={admForm.admissionTestDate} onChange={(e) => setAdmForm({ ...admForm, admissionTestDate: e.target.value })} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={pick('হোমপেজ ও ভর্তি ব্যানার শিরোনাম', 'Homepage & Banner Title')}>
                <Input value={admForm.bannerTitle} onChange={(e) => setAdmForm({ ...admForm, bannerTitle: e.target.value })} />
              </FormField>
              <FormField label={pick('ভর্তিযোগ্য শ্রেণি (Eligible Classes)', 'Eligible Classes')}>
                <Input
                  value={admForm.eligibleClasses}
                  onChange={(e) => setAdmForm({ ...admForm, eligibleClasses: e.target.value })}
                  placeholder={pick('যেমন: ৬ষ্ঠ–৯ম শ্রেণি (বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা)', 'e.g. Class 6–9 (Science, Humanities, Business)')}
                />
              </FormField>
              <FormField label={pick('মুদ্রণযোগ্য ফরমের শিরোনাম (/admission/download-form)', 'Printable Form Title')}>
                <Input value={admForm.title} onChange={(e) => setAdmForm({ ...admForm, title: e.target.value })} />
              </FormField>
              <FormField label={pick('ভর্তি হেল্পলাইন নম্বর', 'Admission Helpline')}>
                <Input value={admForm.helplinePhone} onChange={(e) => setAdmForm({ ...admForm, helplinePhone: e.target.value })} />
              </FormField>
              <div className="md:col-span-2">
                <FormField label={pick('ব্যানার উপ-শিরোনাম / বিবরণ', 'Banner Subtitle')}>
                  <Textarea rows={2} value={admForm.bannerSubtitle} onChange={(e) => setAdmForm({ ...admForm, bannerSubtitle: e.target.value })} />
                </FormField>
              </div>
              <div className="md:col-span-2">
                <FormField label={pick('অফিসিয়াল ফরম পিডিএফ URL (ঐচ্ছিক)', 'Official Form PDF URL (Optional)')}>
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
                  {pick('প্রয়োজনীয় কাগজপত্র, নির্দেশিকা ও ১৩-দফা ভর্তি ফরম', 'Required Documents, Guidelines & 13-Point Form')}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {pick(
                    'পাবলিক /admission, /admission/requirements, /admission/guidelines এবং /admission/download-form পেজের সব তথ্য এখান থেকে নিয়ন্ত্রণ করুন।',
                    'Configure content displayed across /admission, /admission/requirements, /admission/guidelines, and /admission/download-form.'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <Link href="/admission/requirements" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {pick('কাগজপত্র পেজ ↗', 'Requirements ↗')}
                </Link>
                <Link href="/admission/guidelines" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {pick('নির্দেশিকা ↗', 'Guidelines ↗')}
                </Link>
                <Link href="/admission/download-form" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {pick('মুদ্রণযোগ্য ফরম ↗', 'Printable Form ↗')}
                </Link>
              </div>
            </div>

            {/* Required Documents List */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                {pick('ভর্তির প্রয়োজনীয় কাগজপত্রের তালিকা (/admission/requirements)', 'Required Documents List (/admission/requirements)')}
              </p>
              <div className="space-y-2">
                {admForm.requiredDocuments.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
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
                  placeholder={pick('নতুন প্রয়োজনীয় কাগজপত্র যুক্ত করুন...', 'Add another required document...')}
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
                  {pick('যুক্ত করুন', 'Add')}
                </Button>
              </div>
            </div>

            {/* Guidelines & Declaration */}
            <div className="grid grid-cols-1 gap-4 pt-3 border-t border-border">
              <FormField label={pick('প্রবেশপত্র নির্দেশনা (/admission/guidelines)', 'Admit Card Notice')}>
                <Input
                  value={admForm.admitCardNotice}
                  onChange={(e) => setAdmForm({ ...admForm, admitCardNotice: e.target.value })}
                />
              </FormField>
              <FormField label={pick('অভিভাবকের অঙ্গীকারনামা (/admission/guidelines, /admission/apply ও প্রিন্ট ফরম)', 'Guardian Declaration Text')}>
                <Textarea
                  rows={3}
                  value={admForm.declarationText}
                  onChange={(e) => setAdmForm({ ...admForm, declarationText: e.target.value })}
                />
              </FormField>
            </div>

            {/* Collapsible 13-Point Form & Institutional Codes */}
            <details className="rounded-[var(--radius)] border border-border bg-surface-muted/30 p-4">
              <summary className="cursor-pointer text-sm font-bold text-foreground select-none">
                {pick(
                  '১৩-দফা ভর্তি ফরমের দফাসমূহ ও প্রাতিষ্ঠানিক কোড সম্পাদনা করুন (ঐচ্ছিক)',
                  'Edit 13-Point Admission Checklist & Institutional Form Header (Optional)'
                )}
              </summary>
              <div className="mt-4 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <FormField label={pick('বিদ্যালয়ের নাম (বাংলা)', 'School Name (BN)')}>
                    <Input value={admForm.schoolNameBn} onChange={(e) => setAdmForm({ ...admForm, schoolNameBn: e.target.value })} />
                  </FormField>
                  <FormField label={pick('বিদ্যালয়ের নাম (ইংরেজি)', 'School Name (EN)')}>
                    <Input value={admForm.schoolNameEn} onChange={(e) => setAdmForm({ ...admForm, schoolNameEn: e.target.value })} />
                  </FormField>
                  <FormField label="EIIN">
                    <Input value={admForm.eiin} onChange={(e) => setAdmForm({ ...admForm, eiin: e.target.value })} />
                  </FormField>
                  <FormField label={pick('বিদ্যালয় কোড', 'School Code')}>
                    <Input value={admForm.schoolCode} onChange={(e) => setAdmForm({ ...admForm, schoolCode: e.target.value })} />
                  </FormField>
                  <FormField label={pick('জেলা কোড', 'District Code')}>
                    <Input value={admForm.districtCode} onChange={(e) => setAdmForm({ ...admForm, districtCode: e.target.value })} />
                  </FormField>
                  <FormField label={pick('থানা কোড', 'Thana Code')}>
                    <Input value={admForm.thanaCode} onChange={(e) => setAdmForm({ ...admForm, thanaCode: e.target.value })} />
                  </FormField>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FormField label={pick('ফরমের ঠিকানা লাইন', 'Form Header Address')}>
                      <Input value={admForm.schoolAddress} onChange={(e) => setAdmForm({ ...admForm, schoolAddress: e.target.value })} />
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
                      <Input
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
                  ? pick('সংরক্ষণ হচ্ছে...', 'Saving...')
                  : pick('ভর্তি ক্যাম্পেইন ও কনটেন্ট সংরক্ষণ করুন', 'Save Admission Settings & Content')}
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
                  placeholder={pick('প্রকাশনার শিরোনাম বা বছর খুঁজুন...', 'Search publication title or year...')}
                  className="pl-9"
                />
              </div>
              <Select
                value={pubTypeFilter}
                onChange={(e) => setPubTypeFilter(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="ALL">{pick('সব ধরন', 'All Types')}</option>
                <option value={PublicationType.SCHOOL_MAGAZINE}>{pick('বিদ্যালয় ম্যাগাজিন', 'School Magazine')}</option>
                <option value={PublicationType.WALL_MAGAZINE}>{pick('দেয়াল পত্রিকা', 'Wall Magazine')}</option>
                <option value={PublicationType.JOURNAL}>{pick('বার্ষিকী / জার্নাল', 'Journal')}</option>
                <option value={PublicationType.OTHER}>{pick('অন্যান্য', 'Other')}</option>
              </Select>
            </div>
            <Button variant="primary" size="sm" onClick={() => openPubEditor()} className="whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" />
              {pick('নতুন প্রকাশনা যুক্ত করুন', 'Add Publication')}
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
                      {p.publishYear && <span className="text-xs text-muted-foreground tabular-nums">{p.publishYear}</span>}
                      {p.fileUrl && (
                        <span className="text-xs text-primary font-medium inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {pick('ফাইল সংযুক্ত', 'File attached')}
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
                    label={p.isPublished ? pick('প্রকাশিত', 'Published') : pick('খসড়া', 'Draft')}
                  />
                  <Button variant="outline" size="sm" onClick={() => openPubEditor(p)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await deleteCms({ collection: 'publications', id: p.id }).unwrap();
                      toast.success(pick('প্রকাশনা মুছে ফেলা হয়েছে।', 'Publication removed.'));
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
                  placeholder={pick('অর্জন, শিক্ষার্থী বা ব্যাচ খুঁজুন...', 'Search title, person, or batch...')}
                  className="pl-9"
                />
              </div>
              <Select
                value={achTypeFilter}
                onChange={(e) => setAchTypeFilter(e.target.value)}
                className="w-full sm:w-52"
              >
                <option value="ALL">{pick('সব ক্যাটাগরি', 'All Categories')}</option>
                <option value={AchievementType.INSTITUTION_ACHIEVEMENT}>{pick('প্রাতিষ্ঠানিক অর্জন', 'Institution Award')}</option>
                <option value={AchievementType.STUDENT_STAR}>{pick('কৃতি শিক্ষার্থী', 'Student Star')}</option>
                <option value={AchievementType.NOTABLE_ALUMNI}>{pick('কৃতি প্রাক্তন শিক্ষার্থী', 'Notable Alumni')}</option>
              </Select>
            </div>
            <Button variant="primary" size="sm" onClick={() => openAchEditor()} className="whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" />
              {pick('নতুন অর্জন যুক্ত করুন', 'Add Achievement')}
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
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {pick('ব্যাচ:', 'Batch:')} {a.batch}
                        </span>
                      )}
                      {a.achievedAt && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          · {formatDateShort(a.achievedAt, locale)}
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
                    label={a.isPublished ? pick('প্রকাশিত', 'Published') : pick('খসড়া', 'Draft')}
                  />
                  <Button variant="outline" size="sm" onClick={() => openAchEditor(a)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await deleteCms({ collection: 'achievements', id: a.id }).unwrap();
                      toast.success(pick('অর্জন মুছে ফেলা হয়েছে।', 'Achievement removed.'));
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
        title={pick('গ্যালারি ক্যাটাগরি পরিচালনা', 'Manage Gallery Categories')}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {pick(
              'এখানে তৈরি ও সক্রিয় করা ক্যাটাগরিগুলো নতুন অ্যালবাম তৈরির ড্রপডাউনে এবং পাবলিক গ্যালারির ফিল্টারে প্রদর্শিত হবে। কোনো ক্যাটাগরির নাম পরিবর্তন করলে সংশ্লিষ্ট সব অ্যালবামেও তা স্বয়ংক্রিয়ভাবে হালনাগাদ হবে।',
              'Categories managed here populate both the Album Category selector and the public /gallery filter. Renaming a category automatically updates all albums using it.'
            )}
          </p>

          {/* Existing Categories List */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              {pick('বিদ্যমান ক্যাটাগরিসমূহ', 'Existing Categories')} (
              {formatNumber(sortedGalleryCategories.length, locale)})
            </p>
            {sortedGalleryCategories.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground border border-dashed border-border rounded-[var(--radius)]">
                {pick('এখনো কোনো ক্যাটাগরি তৈরি করা হয়নি। নিচ থেকে নতুন ক্যাটাগরি যুক্ত করুন।', 'No categories yet. Create one below.')}
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
                          <span className="text-xs text-muted-foreground tabular-nums">
                            ({formatNumber(albumCount, locale)} {pick('টি অ্যালবাম', 'albums')})
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          checked={cat.isActive}
                          onChange={() =>
                            toggleCms({ collection: 'galleryCategories', id: cat.id, field: 'isActive' })
                          }
                          label={cat.isActive ? pick('সক্রিয়', 'Active') : pick('নিষ্ক্রিয়', 'Inactive')}
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
                                pick(
                                  `এই ক্যাটাগরিতে ${formatNumber(albumCount, locale)} টি অ্যালবাম রয়েছে। মুছতে চাইলে আগে অ্যালবামগুলোর ক্যাটাগরি পরিবর্তন করুন অথবা ক্যাটাগরিটি নিষ্ক্রিয় রাখুন।`,
                                  `This category is used by ${albumCount} album(s). Reassign those albums first or deactivate it.`
                                )
                              );
                              return;
                            }
                            await deleteCms({ collection: 'galleryCategories', id: cat.id }).unwrap();
                            if (catForm.id === cat.id) {
                              setCatForm({ id: '', name: '', description: '', isActive: true });
                            }
                            toast.success(pick('ক্যাটাগরি মুছে ফেলা হয়েছে।', 'Category deleted.'));
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
                setCatError(pick('ক্যাটাগরির নাম লিখুন।', 'Category name is required.'));
                return;
              }
              const duplicate = sortedGalleryCategories.some(
                (c) => c.id !== catForm.id && c.name.trim().toLowerCase() === cleanName.toLowerCase()
              );
              if (duplicate) {
                setCatError(pick('এই নামে একটি ক্যাটাগরি ইতিমধ্যেই রয়েছে।', 'A category with this name already exists.'));
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
                  ? pick('ক্যাটাগরি হালনাগাদ হয়েছে।', 'Category updated.')
                  : pick('নতুন ক্যাটাগরি যুক্ত হয়েছে।', 'Category created.')
              );
              setCatForm({ id: '', name: '', description: '', isActive: true });
            }}
            className="p-4 rounded-[var(--radius)] border border-border bg-surface-muted/30 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">
                {catForm.id ? pick('ক্যাটাগরি সম্পাদনা করুন', 'Edit Category') : pick('নতুন ক্যাটাগরি যুক্ত করুন', 'Add New Category')}
              </p>
              {catForm.id && (
                <button
                  type="button"
                  onClick={() => {
                    setCatForm({ id: '', name: '', description: '', isActive: true });
                    setCatError('');
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  {pick('বাতিল', 'Cancel Edit')}
                </button>
              )}
            </div>
            <FormField label={pick('ক্যাটাগরির নাম', 'Category Name')} required>
              <Input
                value={catForm.name}
                onChange={(e) => {
                  setCatForm({ ...catForm, name: e.target.value });
                  if (catError) setCatError('');
                }}
                placeholder={pick('যেমন: বার্ষিক ক্রীড়া, পুরস্কার বিতরণী, শিক্ষা সফর', 'e.g. Annual Sports, Study Tour')}
              />
            </FormField>
            <FormField label={pick('সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)', 'Short Description (Optional)')}>
              <Input
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                placeholder={pick('এই ক্যাটাগরিতে কোন ধরনের ছবি/ভিডিও থাকবে', 'What albums belong in this category')}
              />
            </FormField>
            {catError && (
              <p className="text-xs font-medium text-destructive inline-flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {catError}
              </p>
            )}
            <div className="flex items-center justify-between pt-1">
              <Switch
                checked={catForm.isActive}
                onChange={(v) => setCatForm({ ...catForm, isActive: v })}
                label={pick('সক্রিয় রাখুন', 'Active')}
              />
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                <Save className="w-4 h-4" />
                {catForm.id ? pick('ক্যাটাগরি হালনাগাদ করুন', 'Update Category') : pick('ক্যাটাগরি যুক্ত করুন', 'Add Category')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ==================== MODAL: GALLERY ALBUM ADD/EDIT ==================== */}
      <Modal
        open={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        title={galleryForm.id ? pick('অ্যালবাম সম্পাদনা', 'Edit Album') : pick('নতুন ফটো অ্যালবাম', 'New Photo Album')}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!galleryForm.title.trim()) {
              toast.error(pick('অ্যালবামের শিরোনাম লিখুন।', 'Album title is required.'));
              return;
            }
            if (!galleryForm.category.trim()) {
              toast.error(pick('অনুগ্রহ করে একটি ক্যাটাগরি নির্বাচন করুন।', 'Please select a category.'));
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
                pick(
                  'কভার ছবির লিংকটি সঠিক নয় (https://... বা /images/... দিন অথবা ছবি আপলোড করুন)।',
                  'Cover photo URL is invalid (enter https://... or /... or upload an image).'
                )
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
            toast.success(pick('গ্যালারি অ্যালবাম সংরক্ষিত হয়েছে।', 'Gallery album saved.'));
            setGalleryModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('অ্যালবামের শিরোনাম', 'Album Title')} required>
            <Input
              value={galleryForm.title}
              onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
              placeholder={pick('যেমন: বার্ষিক বিজ্ঞান মেলা ও প্রদর্শনী ২০২৬', 'e.g. Annual Science Fair 2026')}
            />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-semibold text-foreground">
                {pick('ক্যাটাগরি (পাবলিক ফিল্টারের জন্য)', 'Category (Used in Public Filters)')}{' '}
                <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setInlineCatOpen((prev) => !prev);
                    setInlineCatName('');
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  {inlineCatOpen ? pick('বাতিল', 'Cancel') : pick('+ নতুন ক্যাটাগরি', '+ New Category')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGalleryModalOpen(false);
                    openCategoryManager();
                  }}
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                >
                  {pick('সব পরিচালনা', 'Manage All')}
                </button>
              </div>
            </div>

            <Select
              value={galleryForm.category}
              onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
            >
              {albumCategoryOptions.length === 0 ? (
                <option value="">{pick('— আগে একটি ক্যাটাগরি তৈরি করুন —', '— Create a category first —')}</option>
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
                  placeholder={pick('নতুন ক্যাটাগরির নাম লিখুন...', 'Enter new category name...')}
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
                      toast.error(pick('ক্যাটাগরির নাম লিখুন।', 'Category name is required.'));
                      return;
                    }
                    const existing = sortedGalleryCategories.find(
                      (c) => c.name.trim().toLowerCase() === clean.toLowerCase()
                    );
                    if (existing) {
                      setGalleryForm((prev) => ({ ...prev, category: existing.name }));
                      setInlineCatOpen(false);
                      setInlineCatName('');
                      toast.info(pick('বিদ্যমান ক্যাটাগরি নির্বাচন করা হয়েছে।', 'Selected existing category.'));
                      return;
                    }
                    await upsertCms({
                      collection: 'galleryCategories',
                      item: { name: clean, isActive: true },
                    }).unwrap();
                    setGalleryForm((prev) => ({ ...prev, category: clean }));
                    setInlineCatOpen(false);
                    setInlineCatName('');
                    toast.success(pick('নতুন ক্যাটাগরি তৈরি ও নির্বাচিত হয়েছে।', 'Category created and selected.'));
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {pick('যুক্ত করুন', 'Add')}
                </Button>
              </div>
            )}
          </div>

          <FormField label={pick('বিবরণ', 'Description')}>
            <Textarea
              rows={2}
              value={galleryForm.description}
              onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
            />
          </FormField>

          <FormField label={pick('কভার ছবি আপলোড বা লিংক (ঐচ্ছিক)', 'Cover Photo Upload or Link (Optional)')}>
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
                placeholder={pick('অথবা ছবির লিংক দিন (https://... বা /images/...)', 'Or paste image URL (https://... or /images/...)')}
              />
              {galleryForm.photoUrl && (
                <div className="flex items-center gap-3 p-2 rounded-[var(--radius)] border border-border bg-surface-muted/30">
                  <img
                    src={getCampusPhoto(galleryForm.photoUrl).src}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 rounded object-cover border border-border shrink-0"
                  />
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {galleryForm.photoUrl.startsWith('data:')
                      ? pick('আপলোডকৃত ছবি প্রস্তুত', 'Uploaded image ready')
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
            <FormField label={pick('ছবির ক্যাপশন', 'Photo Caption')}>
              <Input
                value={galleryForm.photoCaption}
                onChange={(e) => setGalleryForm({ ...galleryForm, photoCaption: e.target.value })}
                placeholder={pick('ছবিটির সংক্ষিপ্ত বিবরণ লিখুন', 'Short photo caption')}
              />
            </FormField>
          )}
          <div className="flex items-center justify-between pt-2">
            <Switch
              checked={galleryForm.isPublished}
              onChange={(v) => setGalleryForm({ ...galleryForm, isPublished: v })}
              label={pick('পাবলিক গ্যালারিতে প্রকাশ করুন', 'Publish on Website')}
            />
            <Button type="submit" variant="primary" disabled={saving}>
              <Upload className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save Album')}
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
            ? `${pick('মিডিয়া পরিচালনা:', 'Manage Media:')} ${activeMediaGallery.title}`
            : ''
        }
        maxWidth="max-w-3xl"
      >
        {activeMediaGallery && (
          <div className="space-y-5">
            {/* Existing Media List */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-foreground">
                {pick('অ্যালবামের বর্তমান ছবি ও ভিডিওসমূহ', 'Current Photos & Videos in Album')} (
                {formatNumber(activeGalleryMediaItems.length, locale)})
              </p>
              {activeGalleryMediaItems.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-[var(--radius)]">
                  {pick('এই অ্যালবামে এখনো কোনো ছবি বা ভিডিও নেই। নিচ থেকে যুক্ত করুন।', 'No media items yet. Add one below.')}
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
                              {m.caption || pick('(ক্যাপশন নেই)', '(No caption)')}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {m.mediaType === MediaType.VIDEO ? 'VIDEO' : 'IMAGE'} ·{' '}
                              {isUploaded
                                ? m.mediaType === MediaType.VIDEO
                                  ? pick('আপলোডকৃত ভিডিও', 'Uploaded video')
                                  : pick('আপলোডকৃত ছবি', 'Uploaded image')
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
                              toast.success(pick('মিডিয়া মুছে ফেলা হয়েছে।', 'Media item removed.'));
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
                      const msg = pick(
                        'ছবি যুক্ত করা বাধ্যতামূলক — ডিভাইস থেকে একটি ছবি আপলোড করুন অথবা ছবির লিংক/প্রিসেট নির্বাচন করুন।',
                        'Image is required — upload an image file or switch to Link / Preset.'
                      );
                      setMediaError(msg);
                      toast.error(msg);
                      return;
                    }
                  } else if (mediaSourceMode === 'link') {
                    if (!isValidMediaUrl(url, true)) {
                      const msg = pick(
                        'সঠিক ছবির লিংক (https://... বা /images/...) দিন অথবা ছবি আপলোড করুন।',
                        'Provide a valid image URL (https://... or /...) or upload an image.'
                      );
                      setMediaError(msg);
                      toast.error(msg);
                      return;
                    }
                  } else if (mediaSourceMode === 'preset') {
                    if (!GALLERY_PRESET_IMAGES.some((p) => p.value === url)) {
                      const msg = pick(
                        'একটি ক্যাম্পাস প্রিসেট ছবি নির্বাচন করুন অথবা ছবি আপলোড/লিংক দিন।',
                        'Select a campus preset photo or switch to Upload / Link.'
                      );
                      setMediaError(msg);
                      toast.error(msg);
                      return;
                    }
                  }
                } else {
                  if (mediaSourceMode === 'upload') {
                    if (!url || (!url.startsWith('data:video/') && !url.startsWith('blob:'))) {
                      const msg = pick(
                        'ভিডিও যুক্ত করা বাধ্যতামূলক — ডিভাইস থেকে একটি ভিডিও ফাইল আপলোড করুন অথবা ভিডিও লিংক দিন।',
                        'Video is required — upload a video file or provide a video link.'
                      );
                      setMediaError(msg);
                      toast.error(msg);
                      return;
                    }
                  } else {
                    if (!isValidMediaUrl(url, false)) {
                      const msg = pick(
                        'সঠিক ভিডিও লিংক (https://...) দিন অথবা ভিডিও ফাইল আপলোড করুন।',
                        'Provide a valid video URL (https://...) or upload a video file.'
                      );
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
                    ? pick('মিডিয়া হালনাগাদ হয়েছে।', 'Media updated.')
                    : pick('অ্যালবামে নতুন মিডিয়া যুক্ত হয়েছে।', 'Media added to album.')
                );
                resetMediaForm(mediaForm.mediaType);
              }}
              className="p-4 rounded-[var(--radius)] border border-border bg-surface-muted/30 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">
                  {mediaForm.id
                    ? pick('মিডিয়া সম্পাদনা করুন', 'Edit Media Item')
                    : pick('নতুন ছবি / ভিডিও যুক্ত করুন', 'Add Photo or Video')}
                </p>
                {mediaForm.id && (
                  <button
                    type="button"
                    onClick={() => resetMediaForm(MediaType.IMAGE)}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {pick('বাতিল', 'Cancel Edit')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <FormField label={pick('মিডিয়ার ধরন', 'Media Type')} required>
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
                    <option value={MediaType.IMAGE}>{pick('ছবি (Image)', 'Photo (Image)')}</option>
                    <option value={MediaType.VIDEO}>{pick('ভিডিও (Video)', 'Video')}</option>
                  </Select>
                </FormField>

                {/* Source Mode Switcher (Upload OR Link, plus Preset for Image) */}
                <FormField label={pick('মিডিয়ার উৎস নির্বাচন করুন (যেকোনো একটি বাধ্যতামূলক)', 'Choose Source (Required)')} required>
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
                      {pick('আপলোড', 'Upload')}
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
                      {pick('লিংক শেয়ার', 'Share Link')}
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
                        {pick('প্রিসেট', 'Preset')}
                      </button>
                    )}
                  </div>
                </FormField>
              </div>

              {/* Dynamic Source Input based on MediaType & SourceMode */}
              {mediaForm.mediaType === MediaType.IMAGE && mediaSourceMode === 'upload' && (
                <FormField label={pick('ডিভাইস থেকে ছবি আপলোড করুন', 'Upload Image File')} required>
                  <input
                    key={`img-upload-${mediaForm.id}-${mediaFileName ? 'filled' : 'empty'}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        setMediaError(pick('শুধুমাত্র ছবির ফাইল (JPG, PNG, WebP) নির্বাচন করুন।', 'Please select a valid image file.'));
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
                      <span className="text-xs text-foreground truncate flex-1">
                        {mediaFileName || pick('ছবি নির্বাচিত হয়েছে', 'Image selected')}
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
                <FormField label={pick('ছবির সরাসরি লিংক (URL)', 'Direct Image Link (URL)')} required>
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
                      <span className="text-xs text-muted-foreground truncate flex-1">{mediaForm.mediaUrl.trim()}</span>
                    </div>
                  )}
                </FormField>
              )}

              {mediaForm.mediaType === MediaType.IMAGE && mediaSourceMode === 'preset' && (
                <FormField label={pick('ক্যাম্পাস প্রিসেট ছবি নির্বাচন করুন', 'Select Campus Preset Photo')} required>
                  <Select
                    value={mediaForm.mediaUrl}
                    onChange={(e) => {
                      setMediaForm({ ...mediaForm, mediaUrl: e.target.value });
                      if (mediaError) setMediaError('');
                    }}
                  >
                    <option value="">{pick('— একটি প্রিসেট ছবি নির্বাচন করুন —', '— Select a preset photo —')}</option>
                    {GALLERY_PRESET_IMAGES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {locale === 'bn' ? p.labelBn : p.labelEn}
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
                      <span className="text-xs text-muted-foreground">
                        {pick('প্রিসেট ছবি প্রিভিউ', 'Preset photo preview')}
                      </span>
                    </div>
                  )}
                </FormField>
              )}

              {mediaForm.mediaType === MediaType.VIDEO && mediaSourceMode === 'upload' && (
                <FormField
                  label={pick('ডিভাইস থেকে ভিডিও আপলোড করুন (MP4 / WebM / MOV)', 'Upload Video File (MP4 / WebM / MOV)')}
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
                        setMediaError(pick('শুধুমাত্র ভিডিও ফাইল (MP4, WebM, MOV) নির্বাচন করুন।', 'Please select a valid video file.'));
                        return;
                      }
                      setMediaFileName(file.name);
                      setMediaError('');
                      readVideoSource(file, (url, isBlob) => {
                        setMediaForm((prev) => ({ ...prev, mediaUrl: url }));
                        if (isBlob) {
                          toast.info(
                            pick(
                              'বড় ভিডিও ফাইল বর্তমান সেশনের জন্য সংযুক্ত হয়েছে। ব্যাকএন্ড যুক্ত হলে এটি ক্লাউডে আপলোড হবে।',
                              'Large video attached for this session. Will upload to storage once backend is connected.'
                            )
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
                        <span className="text-xs text-foreground truncate">
                          {mediaFileName || pick('ভিডিও নির্বাচিত হয়েছে', 'Video selected')}
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
                <FormField label={pick('ভিডিও লিংক শেয়ার করুন (YouTube / Shorts / Vimeo / MP4 URL)', 'Share Video Link (YouTube / Vimeo / MP4 URL)')} required>
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
                <div className="flex items-start gap-2 p-2.5 rounded-[var(--radius)] bg-destructive/10 border border-destructive/25 text-xs font-medium text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{mediaError}</span>
                </div>
              )}

              <FormField label={pick('ক্যাপশন (সার্চ ও প্রদর্শনের জন্য)', 'Caption (Searchable on Public Site)')}>
                <Input
                  value={mediaForm.caption}
                  onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })}
                  placeholder={pick('যেমন: বার্ষিক বিজ্ঞান মেলায় শিক্ষার্থীদের প্রজেক্ট প্রদর্শনী', 'e.g. Science fair student project exhibition')}
                />
              </FormField>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  <Save className="w-4 h-4" />
                  {mediaForm.id ? pick('হালনাগাদ করুন', 'Update Media') : pick('অ্যালবামে যুক্ত করুন', 'Add to Album')}
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
        title={pubForm.id ? pick('প্রকাশনা সম্পাদনা', 'Edit Publication') : pick('নতুন প্রকাশনা', 'New Publication')}
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
            toast.success(pick('প্রকাশনা সংরক্ষিত হয়েছে।', 'Publication saved.'));
            setPubModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('শিরোনাম', 'Title')} required>
            <Input value={pubForm.title} onChange={(e) => setPubForm({ ...pubForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={pick('ধরন', 'Type')}>
              <Select value={pubForm.type} onChange={(e) => setPubForm({ ...pubForm, type: e.target.value as PublicationType })}>
                <option value={PublicationType.SCHOOL_MAGAZINE}>{pick('বিদ্যালয় ম্যাগাজিন', 'School Magazine')}</option>
                <option value={PublicationType.WALL_MAGAZINE}>{pick('দেয়াল পত্রিকা', 'Wall Magazine')}</option>
                <option value={PublicationType.JOURNAL}>{pick('বার্ষিকী / জার্নাল', 'Journal')}</option>
                <option value={PublicationType.OTHER}>{pick('অন্যান্য', 'Other')}</option>
              </Select>
            </FormField>
            <FormField label={pick('প্রকাশের বছর', 'Year')}>
              <Input type="number" value={pubForm.publishYear} onChange={(e) => setPubForm({ ...pubForm, publishYear: e.target.value })} />
            </FormField>
          </div>
          <FormField label={pick('সংক্ষিপ্ত বিবরণ', 'Description')}>
            <Textarea rows={3} value={pubForm.description} onChange={(e) => setPubForm({ ...pubForm, description: e.target.value })} />
          </FormField>
          <FormField label={pick('পিডিএফ / ডকুমেন্ট লিংক বা ফাইল আপলোড (ঐচ্ছিক)', 'PDF / Document URL or File Upload (Optional)')}>
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
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[var(--radius)] border border-border bg-surface-muted/30 text-xs">
                  <span className="truncate text-foreground">
                    {pubForm.fileUrl.startsWith('data:') ? pick('পিডিএফ ফাইল সংযুক্ত হয়েছে', 'PDF file attached') : pubForm.fileUrl}
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
          <FormField label={pick('কভার ছবি আপলোড বা লিংক (ঐচ্ছিক)', 'Cover Image Upload or URL (Optional)')}>
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
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {pubForm.coverImage.startsWith('data:') ? pick('কভার ছবি সংযুক্ত', 'Cover image attached') : pubForm.coverImage}
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
              label={pick('ওয়েবসাইটে প্রকাশ করুন', 'Publish on Website')}
            />
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: ACHIEVEMENT ADD/EDIT ==================== */}
      <Modal
        open={achModalOpen}
        onClose={() => setAchModalOpen(false)}
        title={achForm.id ? pick('অর্জন সম্পাদনা', 'Edit Achievement') : pick('নতুন অর্জন যুক্ত করুন', 'New Achievement')}
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
            toast.success(pick('অর্জন সংরক্ষিত হয়েছে।', 'Achievement saved.'));
            setAchModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('অর্জনের শিরোনাম', 'Achievement Title')} required>
            <Input value={achForm.title} onChange={(e) => setAchForm({ ...achForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={pick('ধরন', 'Category')}>
              <Select value={achForm.type} onChange={(e) => setAchForm({ ...achForm, type: e.target.value as AchievementType })}>
                <option value={AchievementType.INSTITUTION_ACHIEVEMENT}>{pick('প্রাতিষ্ঠানিক অর্জন', 'Institution Award')}</option>
                <option value={AchievementType.STUDENT_STAR}>{pick('কৃতি শিক্ষার্থী', 'Student Star')}</option>
                <option value={AchievementType.NOTABLE_ALUMNI}>{pick('কৃতি প্রাক্তন শিক্ষার্থী', 'Notable Alumni')}</option>
              </Select>
            </FormField>
            <FormField label={pick('অর্জনের তারিখ (ঐচ্ছিক)', 'Achieved Date (Optional)')}>
              <Input type="date" value={achForm.achievedAt} onChange={(e) => setAchForm({ ...achForm, achievedAt: e.target.value })} />
            </FormField>
            <FormField label={pick('ব্যক্তি / শিক্ষার্থীর নাম (ঐচ্ছিক)', 'Person / Student Name (Optional)')}>
              <Input value={achForm.personName} onChange={(e) => setAchForm({ ...achForm, personName: e.target.value })} />
            </FormField>
            <FormField label={pick('ব্যাচ / সন (ঐচ্ছিক)', 'Batch / Year (Optional)')}>
              <Input value={achForm.batch} onChange={(e) => setAchForm({ ...achForm, batch: e.target.value })} placeholder="যেমন: ব্যাচ ২০২৬" />
            </FormField>
          </div>
          <FormField label={pick('বিস্তারিত', 'Description')}>
            <Textarea rows={3} value={achForm.description} onChange={(e) => setAchForm({ ...achForm, description: e.target.value })} />
          </FormField>
          <FormField label={pick('ছবি আপলোড বা লিংক (ঐচ্ছিক)', 'Upload Photo or URL (Optional)')}>
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
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {achForm.image.startsWith('data:') ? pick('ছবি সংযুক্ত', 'Image attached') : achForm.image}
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
              label={pick('ওয়েবসাইটে প্রকাশ করুন', 'Publish on Website')}
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

