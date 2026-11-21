'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
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
import { formatNumber } from '@/src/lib/formatters';
import {
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

const BANNER_PRESET_IMAGES = [
  { value: 'campus-heritage', labelBn: 'বিদ্যালয় মূল ভবন (ক্যাম্পাস)', labelEn: 'Campus Heritage Building' },
  { value: 'digital-classroom', labelBn: 'ডিজিটাল স্মার্ট শ্রেণিকক্ষ', labelEn: 'Smart Classroom' },
  { value: 'science-lab', labelBn: 'বিজ্ঞান ও আইসিটি ল্যাব', labelEn: 'Science & ICT Lab' },
  { value: 'library-room', labelBn: 'বিদ্যালয় পাঠাগার', labelEn: 'School Library' },
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

export function AdminWebsiteAboutPage({
  defaultTab = 'history',
}: {
  defaultTab?: 'history' | 'mission' | 'leadership' | 'committee' | 'facilities';
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [updateProfile, { isLoading: savingMission }] = useUpdateSchoolProfileMutation();
  const [upsertCms, { isLoading: saving }] = useUpsertCmsItemMutation();
  const [deleteCms] = useDeleteCmsItemMutation();
  const [toggleCms] = useToggleCmsItemMutation();
  const { pick } = useI18n();
  const [tab, setTab] = useState(defaultTab);

  // Mission & Vision State
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [description, setDescription] = useState('');

  // History / Content Modal
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentForm, setContentForm] = useState({
    id: '',
    type: InstitutionContentType.HISTORY,
    title: '',
    description: '',
    isPublished: true,
  });

  // Leadership Modal
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [leaderForm, setLeaderForm] = useState({
    id: '',
    personName: '',
    designation: '',
    type: LeadershipType.PRINCIPAL,
    photo: '',
    message: '',
    isPublished: true,
  });

  // Committee Modal
  const [committeeModalOpen, setCommitteeModalOpen] = useState(false);
  const [committeeForm, setCommitteeForm] = useState({
    id: '',
    name: '',
    designation: '',
    phone: '',
    photo: '',
  });

  // Facility Modal
  const [facilityModalOpen, setFacilityModalOpen] = useState(false);
  const [facilityForm, setFacilityForm] = useState({
    id: '',
    name: '',
    type: FacilityType.LAB,
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (!db) return;
    setMission(db.schoolProfile.mission ?? '');
    setVision(db.schoolProfile.vision ?? '');
    setDescription(db.schoolProfile.description ?? '');
  }, [db]);

  if (isLoading || !db) return <LoadingSkeleton />;

  const handleSaveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ mission: mission.trim(), vision: vision.trim(), description: description.trim() }).unwrap();
    toast.success(pick('লক্ষ্য ও দৃষ্টিভঙ্গি সফলভাবে সংরক্ষিত হয়েছে।', 'Mission & Vision updated successfully.'));
  };

  const openContentEditor = (c?: InstitutionContent) => {
    setContentForm({
      id: c?.id ?? '',
      type: c?.type ?? InstitutionContentType.HISTORY,
      title: c?.title ?? '',
      description: c?.description ?? '',
      isPublished: c?.isPublished ?? true,
    });
    setContentModalOpen(true);
  };

  const openLeaderEditor = (m?: LeadershipMessage) => {
    setLeaderForm({
      id: m?.id ?? '',
      personName: m?.personName ?? '',
      designation: m?.designation ?? '',
      type: m?.type ?? LeadershipType.PRINCIPAL,
      photo: m?.photo ?? '',
      message: m?.message ?? '',
      isPublished: m?.isPublished ?? true,
    });
    setLeaderModalOpen(true);
  };

  const openCommitteeEditor = (m?: ManagingCommitteeMember) => {
    setCommitteeForm({
      id: m?.id ?? '',
      name: m?.name ?? '',
      designation: m?.designation ?? '',
      phone: m?.phone ?? '',
      photo: m?.photo ?? '',
    });
    setCommitteeModalOpen(true);
  };

  const openFacilityEditor = (f?: SchoolFacility) => {
    setFacilityForm({
      id: f?.id ?? '',
      name: f?.name ?? '',
      type: f?.type ?? FacilityType.LAB,
      description: f?.description ?? '',
      isActive: f?.isActive ?? true,
    });
    setFacilityModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('পরিচিতি ও নেতৃত্ব ব্যবস্থাপনা (About CMS)', 'About & Leadership CMS')}
        description={pick(
          'বিদ্যালয়ের ইতিহাস, লক্ষ্য ও দৃষ্টিভঙ্গি, প্রধান শিক্ষক ও সভাপতির বাণী, ম্যানেজিং কমিটি এবং ক্যাম্পাস সুবিধাসমূহ সম্পাদনা করুন।',
          'Manage school history, mission & vision, leadership messages, managing committee, and campus facilities.'
        )}
        actions={
          <Link href="/about" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <ExternalLink className="w-4 h-4" />
              {pick('পরিচিতি পেজ দেখুন', 'View About Page')}
            </Button>
          </Link>
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'history', label: pick('ইতিহাস ও পরিচিতি', 'History & Profile'), count: db.institutionContents.length },
          { value: 'mission', label: pick('লক্ষ্য ও দৃষ্টিভঙ্গি', 'Mission & Vision') },
          { value: 'leadership', label: pick('নেতৃত্বের বাণী', 'Leadership Messages'), count: db.leadershipMessages.length },
          { value: 'committee', label: pick('ম্যানেজিং কমিটি', 'Managing Committee'), count: db.managingCommittee.length },
          { value: 'facilities', label: pick('অবকাঠামো ও সুবিধা', 'Campus Facilities'), count: db.facilities.length },
        ]}
      />

      {tab === 'history' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => openContentEditor()}>
              <Plus className="w-4 h-4" />
              {pick('নতুন অনুচ্ছেদ যুক্ত করুন', 'Add Content Block')}
            </Button>
          </div>
          <div className="grid gap-4">
            {db.institutionContents.map((c) => (
              <Card key={c.id} className="p-5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <StatusBadge enumName="InstitutionContentType" value={c.type} />
                    <h3 className="text-base font-bold text-foreground">{c.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={c.isPublished}
                      onChange={() => toggleCms({ collection: 'institutionContents', id: c.id, field: 'isPublished' })}
                      label={c.isPublished ? pick('প্রকাশিত', 'Published') : pick('খসড়া', 'Draft')}
                    />
                    <Button variant="outline" size="sm" onClick={() => openContentEditor(c)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteCms({ collection: 'institutionContents', id: c.id }).unwrap();
                        toast.success(pick('কনটেন্ট মুছে ফেলা হয়েছে।', 'Content block removed.'));
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'mission' && (
        <Card className="p-6">
          <form onSubmit={handleSaveMission} className="space-y-5 max-w-3xl">
            <FormField label={pick('বিদ্যালয় পরিচিতি সারসংক্ষেপ', 'Institutional Overview Summary')}>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </FormField>
            <FormField label={pick('আমাদের লক্ষ্য (Mission)', 'Our Mission')} required>
              <Textarea rows={4} value={mission} onChange={(e) => setMission(e.target.value)} />
            </FormField>
            <FormField label={pick('আমাদের দৃষ্টিভঙ্গি (Vision)', 'Our Vision')} required>
              <Textarea rows={4} value={vision} onChange={(e) => setVision(e.target.value)} />
            </FormField>
            <Button type="submit" variant="primary" disabled={savingMission}>
              <Save className="w-4 h-4" />
              {savingMission ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('লক্ষ্য ও দৃষ্টিভঙ্গি সংরক্ষণ করুন', 'Save Mission & Vision')}
            </Button>
          </form>
        </Card>
      )}

      {tab === 'leadership' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => openLeaderEditor()}>
              <Plus className="w-4 h-4" />
              {pick('নতুন বাণী যুক্ত করুন', 'Add Leadership Message')}
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {db.leadershipMessages.map((m) => (
              <Card key={m.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {m.photo ? (
                      <img
                        src={m.photo}
                        alt={m.personName}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover object-top border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-surface-muted border border-border flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-base font-bold text-foreground">{m.personName}</p>
                      <p className="text-sm text-primary font-medium">{m.designation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openLeaderEditor(m)}>
                      <Pencil className="w-3.5 h-3.5" />
                      {pick('সম্পাদনা', 'Edit')}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-line">{m.message}</p>
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <Switch
                    checked={m.isPublished}
                    onChange={() => toggleCms({ collection: 'leadershipMessages', id: m.id, field: 'isPublished' })}
                    label={m.isPublished ? pick('ওয়েবসাইটে প্রকাশিত', 'Published') : pick('খসড়া', 'Draft')}
                  />
                  <Link
                    href={m.type === LeadershipType.PRINCIPAL ? '/about/principal-message' : '/about/president-message'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {pick('পাবলিক পেজে দেখুন ↗', 'View Live ↗')}
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'committee' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {pick(
                'ম্যানেজিং কমিটির সদস্যদের ছবি, পদবি ও যোগাযোগ নম্বর এখান থেকে যোগ বা পরিবর্তন করুন।',
                'Add, edit, or upload portraits for Managing Committee members.'
              )}
            </p>
            <Button variant="primary" size="sm" onClick={() => openCommitteeEditor()}>
              <Plus className="w-4 h-4" />
              {pick('নতুন সদস্য যুক্ত করুন', 'Add Committee Member')}
            </Button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 text-left">{pick('সদস্যের নাম', 'Member Name')}</th>
                  <th className="p-3 text-left">{pick('পদবি', 'Designation')}</th>
                  <th className="p-3 text-left">{pick('ফোন', 'Phone')}</th>
                  <th className="p-3 text-right">{pick('অ্যাকশন', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {db.managingCommittee.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-muted/30">
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-3">
                        <img
                          src={getCommitteePortrait(m.photo, m.id, m.designation)}
                          alt={m.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover object-top border border-border shrink-0"
                        />
                        <span className="font-semibold text-foreground">{m.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{m.designation}</td>
                    <td className="p-3 tabular-nums">{m.phone ?? '—'}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => openCommitteeEditor(m)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await deleteCms({ collection: 'managingCommittee', id: m.id }).unwrap();
                            toast.success(pick('সদস্য তালিকা থেকে সরানো হয়েছে।', 'Member removed.'));
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'facilities' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => openFacilityEditor()}>
              <Plus className="w-4 h-4" />
              {pick('নতুন সুবিধা যুক্ত করুন', 'Add Facility')}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.facilities.map((f) => (
              <Card key={f.id} className="p-5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <StatusBadge enumName="FacilityType" value={f.type} />
                    <h3 className="text-base font-bold text-foreground mt-1.5">{f.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openFacilityEditor(f)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteCms({ collection: 'facilities', id: f.id }).unwrap();
                        toast.success(pick('সুবিধা মুছে ফেলা হয়েছে।', 'Facility removed.'));
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History Content Modal */}
      <Modal
        open={contentModalOpen}
        onClose={() => setContentModalOpen(false)}
        title={contentForm.id ? pick('পরিচিতি অনুচ্ছেদ সম্পাদনা', 'Edit Content Block') : pick('নতুন অনুচ্ছেদ', 'New Content Block')}
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!contentForm.title.trim() || !contentForm.description.trim()) return;
            await upsertCms({
              collection: 'institutionContents',
              item: {
                ...(contentForm.id ? { id: contentForm.id } : {}),
                type: contentForm.type,
                title: contentForm.title.trim(),
                description: contentForm.description.trim(),
                isPublished: contentForm.isPublished,
              },
            }).unwrap();
            toast.success(pick('পরিচিতি কনটেন্ট সংরক্ষিত হয়েছে।', 'Content block saved.'));
            setContentModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('ধরন', 'Content Type')}>
            <Select
              value={contentForm.type}
              onChange={(e) => setContentForm({ ...contentForm, type: e.target.value as InstitutionContentType })}
            >
              <option value={InstitutionContentType.HISTORY}>{pick('ইতিহাস', 'History')}</option>
              <option value={InstitutionContentType.TRADITION}>{pick('ঐতিহ্য', 'Tradition')}</option>
              <option value={InstitutionContentType.INFRASTRUCTURE}>{pick('অবকাঠামো', 'Infrastructure')}</option>
              <option value={InstitutionContentType.INTRODUCTION}>{pick('পরিচিতি', 'Introduction')}</option>
            </Select>
          </FormField>
          <FormField label={pick('শিরোনাম', 'Title')} required>
            <Input value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} />
          </FormField>
          <FormField label={pick('বিস্তারিত বিবরণ', 'Description')} required>
            <Textarea rows={5} value={contentForm.description} onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })} />
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch checked={contentForm.isPublished} onChange={(v) => setContentForm({ ...contentForm, isPublished: v })} label={pick('প্রকাশিত', 'Published')} />
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Leadership Message Modal */}
      <Modal
        open={leaderModalOpen}
        onClose={() => setLeaderModalOpen(false)}
        title={pick('নেতৃত্বের বাণী সম্পাদনা', 'Edit Leadership Message')}
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!leaderForm.personName.trim() || !leaderForm.message.trim()) return;
            await upsertCms({
              collection: 'leadershipMessages',
              item: {
                ...(leaderForm.id ? { id: leaderForm.id } : {}),
                personName: leaderForm.personName.trim(),
                designation: leaderForm.designation.trim(),
                type: leaderForm.type,
                photo: leaderForm.photo || null,
                message: leaderForm.message.trim(),
                isPublished: leaderForm.isPublished,
              },
            }).unwrap();
            toast.success(pick('বাণী সফলভাবে সংরক্ষিত হয়েছে।', 'Leadership message saved.'));
            setLeaderModalOpen(false);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={pick('নাম', 'Full Name')} required>
              <Input value={leaderForm.personName} onChange={(e) => setLeaderForm({ ...leaderForm, personName: e.target.value })} />
            </FormField>
            <FormField label={pick('পদবি', 'Designation')} required>
              <Input value={leaderForm.designation} onChange={(e) => setLeaderForm({ ...leaderForm, designation: e.target.value })} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <FormField label={pick('ভূমিকা', 'Role Type')}>
              <Select value={leaderForm.type} onChange={(e) => setLeaderForm({ ...leaderForm, type: e.target.value as LeadershipType })}>
                <option value={LeadershipType.PRINCIPAL}>{pick('প্রধান শিক্ষক', 'Head Teacher / Principal')}</option>
                <option value={LeadershipType.CHAIRMAN}>{pick('সভাপতি (ম্যানেজিং কমিটি)', 'Chairman / President')}</option>
              </Select>
            </FormField>
            <FormField label={pick('পোর্ট্রেট ছবি আপলোড', 'Upload Portrait Photo')}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readImageAsDataUrl(file, (url) => setLeaderForm((prev) => ({ ...prev, photo: url })));
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface-muted file:text-foreground cursor-pointer"
              />
            </FormField>
          </div>
          <FormField label={pick('সম্পূর্ণ বাণী', 'Full Message')} required>
            <Textarea rows={6} value={leaderForm.message} onChange={(e) => setLeaderForm({ ...leaderForm, message: e.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('বাণী সংরক্ষণ করুন', 'Save Message')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Committee Member Modal */}
      <Modal
        open={committeeModalOpen}
        onClose={() => setCommitteeModalOpen(false)}
        title={committeeForm.id ? pick('কমিটি সদস্য সম্পাদনা', 'Edit Committee Member') : pick('নতুন কমিটি সদস্য', 'Add Committee Member')}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!committeeForm.name.trim() || !committeeForm.designation.trim()) return;
            await upsertCms({
              collection: 'managingCommittee',
              item: {
                ...(committeeForm.id ? { id: committeeForm.id } : {}),
                name: committeeForm.name.trim(),
                designation: committeeForm.designation.trim(),
                phone: committeeForm.phone.trim() || null,
                photo: committeeForm.photo || null,
              },
            }).unwrap();
            toast.success(pick('কমিটি সদস্য সংরক্ষিত হয়েছে।', 'Committee member saved.'));
            setCommitteeModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('নাম', 'Full Name')} required>
            <Input value={committeeForm.name} onChange={(e) => setCommitteeForm({ ...committeeForm, name: e.target.value })} />
          </FormField>
          <FormField label={pick('পদবি', 'Designation')} required>
            <Input value={committeeForm.designation} onChange={(e) => setCommitteeForm({ ...committeeForm, designation: e.target.value })} />
          </FormField>
          <FormField label={pick('ফোন নম্বর', 'Phone Number')}>
            <Input value={committeeForm.phone} onChange={(e) => setCommitteeForm({ ...committeeForm, phone: e.target.value })} />
          </FormField>
          <FormField label={pick('সদস্যের ছবি আপলোড', 'Upload Portrait Photo')}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readImageAsDataUrl(file, (url) => setCommitteeForm((prev) => ({ ...prev, photo: url })));
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface-muted file:text-foreground cursor-pointer"
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save Member')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Facility Modal */}
      <Modal
        open={facilityModalOpen}
        onClose={() => setFacilityModalOpen(false)}
        title={facilityForm.id ? pick('সুবিধা সম্পাদনা', 'Edit Facility') : pick('নতুন সুবিধা যুক্ত করুন', 'Add Campus Facility')}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!facilityForm.name.trim()) return;
            await upsertCms({
              collection: 'facilities',
              item: {
                ...(facilityForm.id ? { id: facilityForm.id } : {}),
                name: facilityForm.name.trim(),
                type: facilityForm.type,
                description: facilityForm.description.trim(),
                isActive: facilityForm.isActive,
              },
            }).unwrap();
            toast.success(pick('ক্যাম্পাস সুবিধা সংরক্ষিত হয়েছে।', 'Facility saved.'));
            setFacilityModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('সুবিধার নাম', 'Facility Name')} required>
            <Input value={facilityForm.name} onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} />
          </FormField>
          <FormField label={pick('ধরন', 'Category')}>
            <Select value={facilityForm.type} onChange={(e) => setFacilityForm({ ...facilityForm, type: e.target.value as FacilityType })}>
              <option value={FacilityType.LAB}>{pick('গবেষণাগার / ল্যাব', 'Laboratory')}</option>
              <option value={FacilityType.MULTIMEDIA}>{pick('মাল্টিমিডিয়া ও আইসিটি', 'Multimedia / ICT')}</option>
              <option value={FacilityType.LIBRARY}>{pick('গ্রন্থাগার', 'Library')}</option>
              <option value={FacilityType.PLAYGROUND}>{pick('খেলার মাঠ', 'Playground')}</option>
              <option value={FacilityType.OTHER}>{pick('অন্যান্য', 'Other')}</option>
            </Select>
          </FormField>
          <FormField label={pick('বিবরণ', 'Description')}>
            <Textarea rows={3} value={facilityForm.description} onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save Facility')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================================
 * 3. WEBSITE CMS — MEDIA, ADMISSION & PUBLICATIONS (`/admin/website/media`)
 * Tabs: gallery | admission | publications | achievements
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
  const [updateAdmission, { isLoading: savingAdmission }] = useUpdateAdmissionContentMutation();
  const { locale, pick } = useI18n();
  const [tab, setTab] = useState(defaultTab);

  // Admission Campaign State
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

  // Gallery Modal State
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    id: '',
    title: '',
    category: 'ক্যাম্পাস',
    description: '',
    photoUrl: '',
    isPublished: true,
  });

  // Publication Modal State
  const [pubModalOpen, setPubModalOpen] = useState(false);
  const [pubForm, setPubForm] = useState({
    id: '',
    title: '',
    type: PublicationType.SCHOOL_MAGAZINE,
    publishYear: '2026',
    description: '',
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
    description: '',
    isPublished: true,
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
    toast.success(pick('ভর্তি ক্যাম্পেইন ও হোমপেজ ব্যানার সংরক্ষিত হয়েছে।', 'Admission campaign saved.'));
  };

  const openGalleryEditor = (g?: Gallery) => {
    setGalleryForm({
      id: g?.id ?? '',
      title: g?.title ?? '',
      category: g?.category ?? 'ক্যাম্পাস',
      description: g?.description ?? '',
      photoUrl: '',
      isPublished: g?.isPublished ?? true,
    });
    setGalleryModalOpen(true);
  };

  const openPubEditor = (p?: Publication) => {
    setPubForm({
      id: p?.id ?? '',
      title: p?.title ?? '',
      type: p?.type ?? PublicationType.SCHOOL_MAGAZINE,
      publishYear: String(p?.publishYear ?? 2026),
      description: p?.description ?? '',
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
      batch: a?.batch ?? '2026',
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
          'ফটো গ্যালারি অ্যালবাম, অনলাইন ভর্তি ক্যাম্পেইন সেটিংস, বিদ্যালয় ম্যাগাজিন ও অর্জনের তালিকা পরিচালনা করুন।',
          'Manage photo gallery albums, admission campaign banner settings, publications, and institutional achievements.'
        )}
        actions={
          <Link href="/gallery" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <ExternalLink className="w-4 h-4" />
              {pick('পাবলিক গ্যালারি দেখুন', 'View Gallery')}
            </Button>
          </Link>
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'gallery', label: pick('ফটো গ্যালারি', 'Photo Gallery'), count: db.galleries.length },
          { value: 'admission', label: pick('ভর্তি ক্যাম্পেইন', 'Admission Campaign') },
          { value: 'publications', label: pick('প্রকাশনা ও ম্যাগাজিন', 'Publications'), count: db.publications.length },
          { value: 'achievements', label: pick('অর্জন ও কৃতি শিক্ষার্থী', 'Achievements'), count: db.achievements.length },
        ]}
      />

      {tab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {pick('নতুন গ্যালারি অ্যালবাম তৈরি করুন বা ছবি আপলোড করে পাবলিক গ্যালারিতে যুক্ত করুন।', 'Create albums and upload photos for the public campus gallery.')}
            </p>
            <Button variant="primary" size="sm" onClick={() => openGalleryEditor()}>
              <Plus className="w-4 h-4" />
              {pick('নতুন অ্যালবাম / ছবি যুক্ত করুন', 'Add Album / Photo')}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.galleries.map((g) => {
              const items = db.galleryMedia.filter((m) => m.galleryId === g.id);
              const cover = items[0]?.mediaUrl;
              return (
                <Card key={g.id} className="overflow-hidden flex flex-col">
                  {cover ? (
                    <img
                      src={cover}
                      alt={g.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-40 object-cover border-b border-border"
                    />
                  ) : (
                    <div className="w-full h-40 bg-surface-muted/60 border-b border-border flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {g.category ?? pick('সাধারণ', 'General')} · {formatNumber(items.length, locale)} {pick('টি ছবি', 'photos')}
                      </p>
                      <h3 className="text-base font-bold text-foreground">{g.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{g.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
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
                            toast.success(pick('অ্যালবাম মুছে ফেলা হয়েছে।', 'Album deleted.'));
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'admission' && (
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
              <FormField label={pick('হোমপেজ ব্যানার শিরোনাম', 'Homepage Banner Title')}>
                <Input value={admForm.bannerTitle} onChange={(e) => setAdmForm({ ...admForm, bannerTitle: e.target.value })} />
              </FormField>
              <FormField label={pick('ভর্তি হেল্পলাইন নম্বর', 'Admission Helpline')}>
                <Input value={admForm.helplinePhone} onChange={(e) => setAdmForm({ ...admForm, helplinePhone: e.target.value })} />
              </FormField>
              <div className="md:col-span-2">
                <FormField label={pick('ব্যানার উপ-শিরোনাম', 'Banner Subtitle')}>
                  <Textarea rows={2} value={admForm.bannerSubtitle} onChange={(e) => setAdmForm({ ...admForm, bannerSubtitle: e.target.value })} />
                </FormField>
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={savingAdmission}>
              <Save className="w-4 h-4" />
              {savingAdmission ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('ভর্তি সেটিংস সংরক্ষণ করুন', 'Save Admission Settings')}
            </Button>
          </form>
        </Card>
      )}

      {tab === 'publications' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => openPubEditor()}>
              <Plus className="w-4 h-4" />
              {pick('নতুন প্রকাশনা যুক্ত করুন', 'Add Publication')}
            </Button>
          </div>
          <Card className="divide-y divide-border">
            {db.publications.map((p) => (
              <div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge enumName="PublicationType" value={p.type} />
                    {p.publishYear && <span className="text-xs text-muted-foreground tabular-nums">{p.publishYear}</span>}
                  </div>
                  <p className="text-base font-bold text-foreground">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
                <div className="flex items-center gap-2">
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

      {tab === 'achievements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => openAchEditor()}>
              <Plus className="w-4 h-4" />
              {pick('নতুন অর্জন যুক্ত করুন', 'Add Achievement')}
            </Button>
          </div>
          <Card className="divide-y divide-border">
            {db.achievements.map((a) => (
              <div key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge enumName="AchievementType" value={a.type} />
                    {a.batch && <span className="text-xs text-muted-foreground tabular-nums">{pick('ব্যাচ:', 'Batch:')} {a.batch}</span>}
                  </div>
                  <p className="text-base font-bold text-foreground">{a.title}</p>
                  {a.personName && <p className="text-sm text-primary font-medium">{a.personName}</p>}
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </div>
                <div className="flex items-center gap-2">
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

      {/* Gallery Modal */}
      <Modal
        open={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        title={galleryForm.id ? pick('অ্যালবাম সম্পাদনা', 'Edit Album') : pick('নতুন ফটো অ্যালবাম', 'New Photo Album')}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!galleryForm.title.trim()) return;
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
            if (galleryForm.photoUrl && saved?.id) {
              await upsertCms({
                collection: 'galleryMedia',
                item: {
                  galleryId: saved.id,
                  mediaUrl: galleryForm.photoUrl,
                  mediaType: MediaType.IMAGE,
                  caption: galleryForm.title.trim(),
                },
              }).unwrap();
            }
            toast.success(pick('গ্যালারি অ্যালবাম সংরক্ষিত হয়েছে।', 'Gallery album saved.'));
            setGalleryModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={pick('অ্যালবামের শিরোনাম', 'Album Title')} required>
            <Input value={galleryForm.title} onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })} />
          </FormField>
          <FormField label={pick('ক্যাটাগরি', 'Category')}>
            <Input value={galleryForm.category} onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })} />
          </FormField>
          <FormField label={pick('বিবরণ', 'Description')}>
            <Textarea rows={2} value={galleryForm.description} onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })} />
          </FormField>
          <FormField label={pick('নতুন ছবি আপলোড করুন (ঐচ্ছিক)', 'Upload Photo to Album (Optional)')}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readImageAsDataUrl(file, (url) => setGalleryForm((prev) => ({ ...prev, photoUrl: url })));
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface-muted file:text-foreground cursor-pointer"
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              <Upload className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save Album')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Publication Modal */}
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
              </Select>
            </FormField>
            <FormField label={pick('প্রকাশের বছর', 'Year')}>
              <Input value={pubForm.publishYear} onChange={(e) => setPubForm({ ...pubForm, publishYear: e.target.value })} />
            </FormField>
          </div>
          <FormField label={pick('সংক্ষিপ্ত বিবরণ', 'Description')}>
            <Textarea rows={3} value={pubForm.description} onChange={(e) => setPubForm({ ...pubForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Achievement Modal */}
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
            <FormField label={pick('ব্যাচ / সন', 'Batch / Year')}>
              <Input value={achForm.batch} onChange={(e) => setAchForm({ ...achForm, batch: e.target.value })} />
            </FormField>
          </div>
          <FormField label={pick('ব্যক্তি / শিক্ষার্থীর নাম (ঐচ্ছিক)', 'Person / Student Name (Optional)')}>
            <Input value={achForm.personName} onChange={(e) => setAchForm({ ...achForm, personName: e.target.value })} />
          </FormField>
          <FormField label={pick('বিস্তারিত', 'Description')}>
            <Textarea rows={3} value={achForm.description} onChange={(e) => setAchForm({ ...achForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {pick('সংরক্ষণ করুন', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
