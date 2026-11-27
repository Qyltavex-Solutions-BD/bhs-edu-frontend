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
    toast.success('লক্ষ্য ও দৃষ্টিভঙ্গি সফলভাবে সংরক্ষিত হয়েছে।');
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
        title={'পরিচিতি ও নেতৃত্ব ব্যবস্থাপনা (About CMS)'}
        description={'বিদ্যালয়ের ইতিহাস, লক্ষ্য ও দৃষ্টিভঙ্গি, প্রধান শিক্ষক ও সভাপতির বাণী, ম্যানেজিং কমিটি এবং ক্যাম্পাস সুবিধাসমূহ সম্পাদনা করুন।'}
        actions={
          <Link href="/about" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <ExternalLink className="w-4 h-4" />
              {'পরিচিতি পেজ দেখুন'}
            </Button>
          </Link>
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'history', label: 'ইতিহাস ও পরিচিতি', count: db.institutionContents.length },
          { value: 'mission', label: 'লক্ষ্য ও দৃষ্টিভঙ্গি' },
          { value: 'leadership', label: 'নেতৃত্বের বাণী', count: db.leadershipMessages.length },
          { value: 'committee', label: 'ম্যানেজিং কমিটি', count: db.managingCommittee.length },
          { value: 'facilities', label: 'অবকাঠামো ও সুবিধা', count: db.facilities.length },
        ]}
      />

      {tab === 'history' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => openContentEditor()}>
              <Plus className="w-4 h-4" />
              {'নতুন অনুচ্ছেদ যুক্ত করুন'}
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
                      label={c.isPublished ? 'প্রকাশিত' : 'খসড়া'}
                    />
                    <Button variant="outline" size="sm" onClick={() => openContentEditor(c)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteCms({ collection: 'institutionContents', id: c.id }).unwrap();
                        toast.success('কনটেন্ট মুছে ফেলা হয়েছে।');
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
            <FormField label={'বিদ্যালয় পরিচিতি সারসংক্ষেপ'}>
              <Textarea placeholder="বিদ্যালয় পরিচিতি সারসংক্ষেপ লিখুন..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </FormField>
            <FormField label={'আমাদের লক্ষ্য (Mission)'} required>
              <Textarea placeholder="আমাদের লক্ষ্য (Mission) লিখুন..." rows={4} value={mission} onChange={(e) => setMission(e.target.value)} />
            </FormField>
            <FormField label={'আমাদের দৃষ্টিভঙ্গি (Vision)'} required>
              <Textarea placeholder="আমাদের দৃষ্টিভঙ্গি (Vision) লিখুন..." rows={4} value={vision} onChange={(e) => setVision(e.target.value)} />
            </FormField>
            <Button type="submit" variant="primary" disabled={savingMission}>
              <Save className="w-4 h-4" />
              {savingMission ? 'সংরক্ষণ হচ্ছে...' : 'লক্ষ্য ও দৃষ্টিভঙ্গি সংরক্ষণ করুন'}
            </Button>
          </form>
        </Card>
      )}

      {tab === 'leadership' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => openLeaderEditor()}>
              <Plus className="w-4 h-4" />
              {'নতুন বাণী যুক্ত করুন'}
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
                      {'সম্পাদনা'}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-line">{m.message}</p>
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <Switch
                    checked={m.isPublished}
                    onChange={() => toggleCms({ collection: 'leadershipMessages', id: m.id, field: 'isPublished' })}
                    label={m.isPublished ? 'ওয়েবসাইটে প্রকাশিত' : 'খসড়া'}
                  />
                  <Link
                    href={m.type === LeadershipType.PRINCIPAL ? '/about/principal-message' : '/about/president-message'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {'পাবলিক পেজে দেখুন ↗'}
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
              {'ম্যানেজিং কমিটির সদস্যদের ছবি, পদবি ও যোগাযোগ নম্বর এখান থেকে যোগ বা পরিবর্তন করুন।'}
            </p>
            <Button variant="primary" size="sm" onClick={() => openCommitteeEditor()}>
              <Plus className="w-4 h-4" />
              {'নতুন সদস্য যুক্ত করুন'}
            </Button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 text-left">{'সদস্যের নাম'}</th>
                  <th className="p-3 text-left">{'পদবি'}</th>
                  <th className="p-3 text-left">{'ফোন'}</th>
                  <th className="p-3 text-right">{'অ্যাকশন'}</th>
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
                            toast.success('সদস্য তালিকা থেকে সরানো হয়েছে।');
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
              {'নতুন সুবিধা যুক্ত করুন'}
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
                        toast.success('সুবিধা মুছে ফেলা হয়েছে।');
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
        title={contentForm.id ? 'পরিচিতি অনুচ্ছেদ সম্পাদনা' : 'নতুন অনুচ্ছেদ'}
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
            toast.success('পরিচিতি কনটেন্ট সংরক্ষিত হয়েছে।');
            setContentModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={'ধরন'}>
            <Select
              value={contentForm.type}
              onChange={(e) => setContentForm({ ...contentForm, type: e.target.value as InstitutionContentType })}
            >
              <option value={InstitutionContentType.HISTORY}>{'ইতিহাস'}</option>
              <option value={InstitutionContentType.TRADITION}>{'ঐতিহ্য'}</option>
              <option value={InstitutionContentType.INFRASTRUCTURE}>{'অবকাঠামো'}</option>
              <option value={InstitutionContentType.INTRODUCTION}>{'পরিচিতি'}</option>
            </Select>
          </FormField>
          <FormField label={'শিরোনাম'} required>
            <Input placeholder="শিরোনাম লিখুন" value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} />
          </FormField>
          <FormField label={'বিস্তারিত বিবরণ'} required>
            <Textarea placeholder="বিস্তারিত বিবরণ লিখুন..." rows={5} value={contentForm.description} onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })} />
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch checked={contentForm.isPublished} onChange={(v) => setContentForm({ ...contentForm, isPublished: v })} label={'প্রকাশিত'} />
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Leadership Message Modal */}
      <Modal
        open={leaderModalOpen}
        onClose={() => setLeaderModalOpen(false)}
        title={'নেতৃত্বের বাণী সম্পাদনা'}
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
            toast.success('বাণী সফলভাবে সংরক্ষিত হয়েছে।');
            setLeaderModalOpen(false);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={'নাম'} required>
              <Input placeholder="নাম লিখুন" value={leaderForm.personName} onChange={(e) => setLeaderForm({ ...leaderForm, personName: e.target.value })} />
            </FormField>
            <FormField label={'পদবি'} required>
              <Input placeholder="পদবি লিখুন" value={leaderForm.designation} onChange={(e) => setLeaderForm({ ...leaderForm, designation: e.target.value })} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <FormField label={'ভূমিকা'}>
              <Select value={leaderForm.type} onChange={(e) => setLeaderForm({ ...leaderForm, type: e.target.value as LeadershipType })}>
                <option value={LeadershipType.PRINCIPAL}>{'প্রধান শিক্ষক'}</option>
                <option value={LeadershipType.CHAIRMAN}>{'সভাপতি (ম্যানেজিং কমিটি)'}</option>
              </Select>
            </FormField>
            <FormField label={'পোর্ট্রেট ছবি আপলোড'}>
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
          <FormField label={'সম্পূর্ণ বাণী'} required>
            <Textarea placeholder="সম্পূর্ণ বাণী লিখুন..." rows={6} value={leaderForm.message} onChange={(e) => setLeaderForm({ ...leaderForm, message: e.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {'বাণী সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Committee Member Modal */}
      <Modal
        open={committeeModalOpen}
        onClose={() => setCommitteeModalOpen(false)}
        title={committeeForm.id ? 'কমিটি সদস্য সম্পাদনা' : 'নতুন কমিটি সদস্য'}
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
            toast.success('কমিটি সদস্য সংরক্ষিত হয়েছে।');
            setCommitteeModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={'নাম'} required>
            <Input placeholder="নাম লিখুন" value={committeeForm.name} onChange={(e) => setCommitteeForm({ ...committeeForm, name: e.target.value })} />
          </FormField>
          <FormField label={'পদবি'} required>
            <Input placeholder="পদবি লিখুন" value={committeeForm.designation} onChange={(e) => setCommitteeForm({ ...committeeForm, designation: e.target.value })} />
          </FormField>
          <FormField label={'ফোন নম্বর'}>
            <Input placeholder="মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)" value={committeeForm.phone} onChange={(e) => setCommitteeForm({ ...committeeForm, phone: e.target.value })} />
          </FormField>
          <FormField label={'সদস্যের ছবি আপলোড'}>
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
              <Save className="w-4 h-4" /> {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Facility Modal */}
      <Modal
        open={facilityModalOpen}
        onClose={() => setFacilityModalOpen(false)}
        title={facilityForm.id ? 'সুবিধা সম্পাদনা' : 'নতুন সুবিধা যুক্ত করুন'}
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
            toast.success('ক্যাম্পাস সুবিধা সংরক্ষিত হয়েছে।');
            setFacilityModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={'সুবিধার নাম'} required>
            <Input placeholder="সুবিধার নাম লিখুন" value={facilityForm.name} onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} />
          </FormField>
          <FormField label={'ধরন'}>
            <Select value={facilityForm.type} onChange={(e) => setFacilityForm({ ...facilityForm, type: e.target.value as FacilityType })}>
              <option value={FacilityType.LAB}>{'গবেষণাগার / ল্যাব'}</option>
              <option value={FacilityType.MULTIMEDIA}>{'মাল্টিমিডিয়া ও আইসিটি'}</option>
              <option value={FacilityType.LIBRARY}>{'গ্রন্থাগার'}</option>
              <option value={FacilityType.PLAYGROUND}>{'খেলার মাঠ'}</option>
              <option value={FacilityType.OTHER}>{'অন্যান্য'}</option>
            </Select>
          </FormField>
          <FormField label={'বিবরণ'}>
            <Textarea placeholder="বিবরণ লিখুন..." rows={3} value={facilityForm.description} onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {'সংরক্ষণ করুন'}
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

