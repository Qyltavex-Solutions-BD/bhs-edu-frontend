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

export function AdminWebsiteHomePage({
  defaultTab = 'branding',
}: {
  defaultTab?: 'branding' | 'banners' | 'quick-links' | 'contact';
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [updateProfile, { isLoading: savingProfile }] = useUpdateSchoolProfileMutation();
  const [updateContact, { isLoading: savingContact }] = useUpdateContactInfoMutation();
  const [upsertCms, { isLoading: savingItem }] = useUpsertCmsItemMutation();
  const [deleteCms] = useDeleteCmsItemMutation();
  const [toggleCms] = useToggleCmsItemMutation();
  const [reorderCms] = useReorderCmsItemsMutation();
  const { locale, pick } = useI18n();
  const [tab, setTab] = useState(defaultTab);

  // Branding Profile State
  const [profileForm, setProfileForm] = useState({
    name: '',
    nameEn: '',
    motto: '',
    eiin: '',
    schoolCode: '',
    establishedYear: '1978',
    phone: '',
    email: '',
    address: '',
  });

  // Contact & Map State
  const [contactForm, setContactForm] = useState({
    address: '',
    phone: '',
    email: '',
    mapUrl: '',
  });

  // Banner Modal State
  const [dragBannerId, setDragBannerId] = useState<string | null>(null);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    id: '',
    title: '',
    subtitle: '',
    image: 'campus-heritage',
    link: '/about',
    isActive: true,
  });

  // Quick Link Modal State
  const [dragLinkId, setDragLinkId] = useState<string | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({
    id: '',
    title: '',
    url: '/about',
    isButton: false,
    isActive: true,
  });

  useEffect(() => {
    if (!db) return;
    setProfileForm({
      name: db.schoolProfile.name,
      nameEn: db.schoolProfile.nameEn ?? 'Bhojeshwar High School',
      motto: db.schoolProfile.motto ?? '',
      eiin: db.schoolProfile.eiin ?? '',
      schoolCode: db.schoolProfile.schoolCode ?? '',
      establishedYear: String(db.schoolProfile.establishedYear ?? 1978),
      phone: db.schoolProfile.phone ?? '',
      email: db.schoolProfile.email ?? '',
      address: db.schoolProfile.address,
    });
    setContactForm({
      address: db.contactInfo.address,
      phone: db.contactInfo.phone ?? '',
      email: db.contactInfo.email ?? '',
      mapUrl: db.contactInfo.mapUrl ?? '',
    });
  }, [db]);

  if (isLoading || !db) return <LoadingSkeleton />;

  const sortedBanners = [...db.banners].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedLinks = [...db.quickLinks].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: profileForm.name.trim(),
      nameEn: profileForm.nameEn.trim(),
      motto: profileForm.motto.trim(),
      eiin: profileForm.eiin.trim(),
      schoolCode: profileForm.schoolCode.trim(),
      establishedYear: Number(profileForm.establishedYear) || 1978,
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
      address: profileForm.address.trim(),
    }).unwrap();
    toast.success(pick('প্রতিষ্ঠানের ব্র্যান্ডিং ও প্রোফাইল সংরক্ষিত হয়েছে।', 'School branding & profile saved.'));
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateContact({
      address: contactForm.address.trim(),
      phone: contactForm.phone.trim(),
      email: contactForm.email.trim(),
      mapUrl: contactForm.mapUrl.trim(),
    }).unwrap();
    toast.success(pick('যোগাযোগ ও ম্যাপ তথ্য হালনাগাদ হয়েছে।', 'Contact info & map link updated.'));
  };

  const openBannerEditor = (b?: WebsiteBanner) => {
    setBannerForm({
      id: b?.id ?? '',
      title: b?.title ?? '',
      subtitle: b?.subtitle ?? '',
      image: b?.image ?? 'campus-heritage',
      link: b?.link ?? '/about',
      isActive: b?.isActive ?? true,
    });
    setBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      toast.error(pick('ব্যানারের শিরোনাম লিখুন।', 'Enter a banner title.'));
      return;
    }
    await upsertCms({
      collection: 'banners',
      item: {
        ...(bannerForm.id ? { id: bannerForm.id } : {}),
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim(),
        image: bannerForm.image,
        link: bannerForm.link.trim() || '/about',
        isActive: bannerForm.isActive,
      },
    }).unwrap();
    toast.success(pick('হিরো ব্যানার সংরক্ষিত হয়েছে।', 'Hero banner saved.'));
    setBannerModalOpen(false);
  };

  const moveBanner = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sortedBanners.length || fromIdx === toIdx) return;
    const next = [...sortedBanners];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await reorderCms({ collection: 'banners', orderedIds: next.map((x) => x.id) }).unwrap();
    toast.success(pick('ব্যানারের ক্রম হালনাগাদ হয়েছে।', 'Banner order updated.'));
  };

  const openLinkEditor = (ql?: QuickLink) => {
    setLinkForm({
      id: ql?.id ?? '',
      title: ql?.title ?? '',
      url: ql?.url ?? '/about',
      isButton: ql?.isButton ?? false,
      isActive: ql?.isActive ?? true,
    });
    setLinkModalOpen(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.title.trim() || !linkForm.url.trim()) {
      toast.error(pick('লিংকের শিরোনাম ও URL লিখুন।', 'Enter link title and URL.'));
      return;
    }
    await upsertCms({
      collection: 'quickLinks',
      item: {
        ...(linkForm.id ? { id: linkForm.id } : {}),
        title: linkForm.title.trim(),
        url: linkForm.url.trim(),
        isButton: linkForm.isButton,
        isActive: linkForm.isActive,
      },
    }).unwrap();
    toast.success(pick('দ্রুত লিংক সংরক্ষিত হয়েছে।', 'Quick link saved.'));
    setLinkModalOpen(false);
  };

  const moveLink = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sortedLinks.length || fromIdx === toIdx) return;
    const next = [...sortedLinks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await reorderCms({ collection: 'quickLinks', orderedIds: next.map((x) => x.id) }).unwrap();
    toast.success(pick('দ্রুত লিংকের ক্রম হালনাগাদ হয়েছে।', 'Quick link order updated.'));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('ওয়েবসাইট হোম ও ব্র্যান্ডিং', 'Website Home & Branding')}
        description={pick(
          'পাবলিক ওয়েবসাইটের ব্র্যান্ডিং প্রোফাইল, হিরো ব্যানার স্লাইডার, দ্রুত লিংক এবং যোগাযোগের তথ্য এক জায়গা থেকে নিয়ন্ত্রণ করুন।',
          'Manage school branding profile, homepage hero banners, quick links, and public contact info in one place.'
        )}
        actions={
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <ExternalLink className="w-4 h-4" />
              {pick('পাবলিক হোমপেজ দেখুন', 'View Homepage')}
            </Button>
          </Link>
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'branding', label: pick('বিদ্যালয় প্রোফাইল ও ব্র্যান্ডিং', 'School Branding') },
          { value: 'banners', label: pick('হিরো ব্যানার স্লাইডার', 'Hero Banners'), count: db.banners.length },
          { value: 'quick-links', label: pick('দ্রুত লিংক', 'Quick Links'), count: db.quickLinks.length },
          { value: 'contact', label: pick('যোগাযোগ ও ম্যাপ', 'Contact & Map') },
        ]}
      />

      {tab === 'branding' && (
        <Card className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <SchoolEmblem size={64} />
              <div>
                <p className="font-bold text-base text-foreground">{db.schoolProfile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {pick(
                    'অফিসিয়াল BHS মনোগ্রাম ও ব্র্যান্ডিং — হেডার, ফুটার, লগইন পেজ এবং প্রিন্টযোগ্য সকল ডকুমেন্টে প্রদর্শিত হয়।',
                    'Official BHS monogram & identity — reflected across header, footer, login, and A4 print sheets.'
                  )}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={pick('বিদ্যালয়ের নাম', 'বিদ্যালয়ের নাম')} required>
                <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </FormField>
              <FormField label={pick('বিদ্যালয়ের মূলমন্ত্র (Motto)', 'School Motto')}>
                <Input value={profileForm.motto} onChange={(e) => setProfileForm({ ...profileForm, motto: e.target.value })} />
              </FormField>
              <FormField label={pick('স্থাপিত সন', 'Established Year')}>
                <Input value={profileForm.establishedYear} onChange={(e) => setProfileForm({ ...profileForm, establishedYear: e.target.value })} />
              </FormField>
              <FormField label="EIIN">
                <Input value={profileForm.eiin} onChange={(e) => setProfileForm({ ...profileForm, eiin: e.target.value })} />
              </FormField>
              <FormField label={pick('বিদ্যালয় কোড', 'School Code')}>
                <Input value={profileForm.schoolCode} onChange={(e) => setProfileForm({ ...profileForm, schoolCode: e.target.value })} />
              </FormField>
              <FormField label={pick('অফিস ফোন', 'Office Phone')}>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </FormField>
              <FormField label={pick('অফিস ইমেইল', 'Office Email')}>
                <Input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label={pick('সম্পূর্ণ ঠিকানা', 'Full Address')} required>
                  <Input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                </FormField>
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={savingProfile}>
              <Save className="w-4 h-4" />
              {savingProfile ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('ব্র্যান্ডিং সংরক্ষণ করুন', 'Save Branding')}
            </Button>
          </form>
        </Card>
      )}

      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {pick(
                'ড্র্যাগ-অ্যান্ড-ড্রপ বা তীর বাটন দিয়ে স্লাইডের ক্রম সাজান। নতুন ব্যানার যুক্ত করলে হোমপেজে সাথে সাথে দেখাবে।',
                'Drag and drop or use arrows to reorder homepage hero slides.'
              )}
            </p>
            <Button variant="primary" size="sm" onClick={() => openBannerEditor()} className="whitespace-nowrap">
              <Plus className="w-4 h-4" />
              {pick('নতুন ব্যানার যুক্ত করুন', 'Add Banner Slide')}
            </Button>
          </div>

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
                className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-surface-muted/40 transition-colors cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-base font-bold text-foreground truncate">{b.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{b.subtitle}</p>
                    <p className="text-xs font-mono text-primary mt-0.5">{b.link ?? '/about'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    aria-label="Move banner up"
                    disabled={idx === 0}
                    onClick={() => moveBanner(idx, idx - 1)}
                    className="h-8 w-8 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move banner down"
                    disabled={idx === sortedBanners.length - 1}
                    onClick={() => moveBanner(idx, idx + 1)}
                    className="h-8 w-8 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <Switch
                    checked={b.isActive}
                    onChange={() => toggleCms({ collection: 'banners', id: b.id, field: 'isActive' })}
                    label={b.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Hidden')}
                  />
                  <Button variant="outline" size="sm" onClick={() => openBannerEditor(b)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await deleteCms({ collection: 'banners', id: b.id }).unwrap();
                      toast.success(pick('ব্যানার মুছে ফেলা হয়েছে।', 'Banner removed.'));
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

      {tab === 'quick-links' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {pick(
                'হোমপেজ ও ফুটারের গুরুত্বপূর্ণ দ্রুত লিংকগুলোর ক্রম ও অবস্থা এখান থেকে নিয়ন্ত্রণ করুন।',
                'Control homepage and footer quick links order and visibility.'
              )}
            </p>
            <Button variant="primary" size="sm" onClick={() => openLinkEditor()} className="whitespace-nowrap">
              <Plus className="w-4 h-4" />
              {pick('নতুন লিংক যুক্ত করুন', 'Add Quick Link')}
            </Button>
          </div>

          <Card className="divide-y divide-border">
            {sortedLinks.map((ql, idx) => (
              <div
                key={ql.id}
                draggable
                onDragStart={() => setDragLinkId(ql.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!dragLinkId || dragLinkId === ql.id) return;
                  const fromIdx = sortedLinks.findIndex((x) => x.id === dragLinkId);
                  moveLink(fromIdx, idx);
                  setDragLinkId(null);
                }}
                className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-surface-muted/40 transition-colors cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground">{ql.title}</p>
                    <p className="text-xs font-mono text-muted-foreground">{ql.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveLink(idx, idx - 1)}
                    className="h-8 w-8 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sortedLinks.length - 1}
                    onClick={() => moveLink(idx, idx + 1)}
                    className="h-8 w-8 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <Switch
                    checked={ql.isActive}
                    onChange={() => toggleCms({ collection: 'quickLinks', id: ql.id, field: 'isActive' })}
                    label={ql.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Hidden')}
                  />
                  <Button variant="outline" size="sm" onClick={() => openLinkEditor(ql)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await deleteCms({ collection: 'quickLinks', id: ql.id }).unwrap();
                      toast.success(pick('লিংক মুছে ফেলা হয়েছে।', 'Quick link removed.'));
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

      {tab === 'contact' && (
        <Card className="p-6">
          <form onSubmit={handleSaveContact} className="space-y-5 max-w-2xl">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {pick('যোগাযোগ ও ক্যাম্পাস ম্যাপ তথ্য', 'Contact & Campus Map Information')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {pick(
                    'এখানে আপডেট করলে যোগাযোগ পেজ এবং ওয়েবসাইট ফুটারে সাথে সাথে পরিবর্তন হবে।',
                    'Updates here appear immediately on the public Contact page and website footer.'
                  )}
                </p>
              </div>
              <Link href="/contact" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline whitespace-nowrap">
                {pick('যোগাযোগ পেজ ↗', 'Contact Page ↗')}
              </Link>
            </div>
            <FormField label={pick('বিদ্যালয়ের ঠিকানা', 'School Address')} required>
              <Textarea rows={2} value={contactForm.address} onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={pick('অফিস হেল্পলাইন নম্বর', 'Office Helpline Phone')}>
                <Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
              </FormField>
              <FormField label={pick('অফিসিয়াল ইমেইল', 'Official Email')}>
                <Input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
              </FormField>
            </div>
            <FormField label={pick('Google Maps ডিরেকশন লিংক', 'Google Maps Direction URL')}>
              <Input value={contactForm.mapUrl} onChange={(e) => setContactForm({ ...contactForm, mapUrl: e.target.value })} />
            </FormField>
            <Button type="submit" variant="primary" disabled={savingContact}>
              <Save className="w-4 h-4" />
              {savingContact ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('যোগাযোগ তথ্য সংরক্ষণ করুন', 'Save Contact Info')}
            </Button>
          </form>
        </Card>
      )}

      {/* Banner Add/Edit Modal */}
      <Modal
        open={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        title={bannerForm.id ? pick('হিরো ব্যানার সম্পাদনা', 'Edit Hero Banner') : pick('নতুন হিরো ব্যানার', 'New Hero Banner')}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveBanner} className="space-y-4">
          <FormField label={pick('ব্যানারের শিরোনাম', 'Banner Title')} required>
            <Input value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} />
          </FormField>
          <FormField label={pick('উপ-শিরোনাম / বিবরণ', 'Subtitle / Description')}>
            <Textarea rows={2} value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={pick('বাটনের গন্তব্য লিংক', 'Destination Route')}>
              <Select value={bannerForm.link} onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}>
                <option value="/about">{pick('/about — বিদ্যালয় পরিচিতি', '/about — About School')}</option>
                <option value="/results">{pick('/results — অনলাইন ফলাফল', '/results — Online Results')}</option>
                <option value="/academics/resources">{pick('/academics/resources — ডিজিটাল রিসোর্স', '/academics/resources — Digital Resources')}</option>
                <option value="/about/facilities">{pick('/about/facilities — ল্যাব ও সুবিধা', '/about/facilities — Facilities')}</option>
                <option value="/academics/library">{pick('/academics/library — পাঠাগার', '/academics/library — Library')}</option>
                <option value="/admission">{pick('/admission — ভর্তি তথ্য', '/admission — Admission Info')}</option>
              </Select>
            </FormField>
            <FormField label={pick('ক্যাম্পাস ছবি (প্রিসেট)', 'Campus Photo Preset')}>
              <Select
                value={BANNER_PRESET_IMAGES.some((p) => p.value === bannerForm.image) ? bannerForm.image : 'campus-heritage'}
                onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
              >
                {BANNER_PRESET_IMAGES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {locale === 'bn' ? p.labelBn : p.labelEn}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label={pick('অথবা নিজস্ব ব্যানার ছবি আপলোড করুন', 'Or Upload Custom Banner Photo')}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readImageAsDataUrl(file, (url) => setBannerForm((prev) => ({ ...prev, image: url })));
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface-muted file:text-foreground cursor-pointer"
            />
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch
              checked={bannerForm.isActive}
              onChange={(v) => setBannerForm({ ...bannerForm, isActive: v })}
              label={pick('হোমপেজে সক্রিয় রাখুন', 'Active on Homepage')}
            />
            <Button type="submit" variant="primary" disabled={savingItem}>
              <Save className="w-4 h-4" />
              {pick('সংরক্ষণ করুন', 'Save Banner')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Link Modal */}
      <Modal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title={linkForm.id ? pick('দ্রুত লিংক সম্পাদনা', 'Edit Quick Link') : pick('নতুন দ্রুত লিংক', 'New Quick Link')}
      >
        <form onSubmit={handleSaveLink} className="space-y-4">
          <FormField label={pick('লিংকের শিরোনাম', 'Link Title')} required>
            <Input value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} />
          </FormField>
          <FormField label={pick('লিংক পাথ / URL', 'URL Path')} required>
            <Input value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="/academics/syllabus" />
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch
              checked={linkForm.isActive}
              onChange={(v) => setLinkForm({ ...linkForm, isActive: v })}
              label={pick('সক্রিয়', 'Active')}
            />
            <Button type="submit" variant="primary" disabled={savingItem}>
              <Save className="w-4 h-4" />
              {pick('সংরক্ষণ করুন', 'Save Link')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================================
 * 2. WEBSITE CMS — ABOUT & LEADERSHIP (`/admin/website/about`)
 * Tabs: history | mission | leadership | committee | facilities
 * ============================================================================ */

