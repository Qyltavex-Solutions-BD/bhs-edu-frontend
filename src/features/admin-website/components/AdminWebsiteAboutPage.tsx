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

