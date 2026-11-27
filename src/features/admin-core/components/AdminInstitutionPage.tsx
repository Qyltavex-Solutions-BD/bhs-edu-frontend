'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from '@/src/lib/navigation';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  GripVertical,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  useAddSyllabusEntryMutation,
  useGetBootstrapQuery,
  useRemoveSyllabusEntryMutation,
  useRemoveSyllabusFileMutation,
  useReorderCmsItemsMutation,
  useSaveSyllabusFileMutation,
  useToggleCmsItemMutation,
  useUpdateSchoolProfileMutation,
} from '@/src/store/api';
import { PrintableIdCardSheet } from '@/src/components/print/PrintDocuments';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import {
  getCommitteePortrait,
  LoadingSkeleton,
  PageHeader,
  SchoolEmblem,
} from '@/src/components/shared/Feedback';
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
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { DataTable } from '@/src/components/shared/DataTable';
import type { SyllabusExamTerm } from '@/src/types/entities';
import {
  AcademicFoundation,
  useAcademicYearSelection,
} from '@/src/views/admin/AcademicFoundation';
import { AcademicShell } from '@/src/views/admin/AcademicShell';
import { AcademicCalendar } from '@/src/views/admin/AcademicCalendar';
import { AcademicCurriculum } from '@/src/views/admin/AcademicCurriculum';
import { AcademicPolicies } from '@/src/views/admin/AcademicPolicies';
import { AcademicRoutine } from '@/src/views/admin/AcademicRoutine';
import { AcademicStaffing } from '@/src/views/admin/AcademicStaffing';

type AcademicTab =
  | 'years'
  | 'groups'
  | 'classes'
  | 'sections'
  | 'subjects'
  | 'catalog'
  | 'books'
  | 'class-teachers'
  | 'assignments'
  | 'routines'
  | 'events'
  | 'documents'
  | 'policies';

// ============================================================================
// 7.2 INSTITUTION MANAGEMENT
// ============================================================================

export function AdminInstitutionPage({
  defaultTab = 'profile',
}: {
  defaultTab?: 'profile' | 'content' | 'facilities' | 'administrators' | 'committee' | 'quick-links';
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateSchoolProfileMutation();
  const [toggleCms] = useToggleCmsItemMutation();
  const [reorderCms] = useReorderCmsItemsMutation();
  const [tab, setTab] = useState(defaultTab);
  const [dragQuickLinkId, setDragQuickLinkId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [eiin, setEiin] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (isLoading || !db) return <LoadingSkeleton />;

  if (!initialized) {
    setName(db.schoolProfile.name);
    setEiin(db.schoolProfile.eiin ?? '');
    setSchoolCode(db.schoolProfile.schoolCode ?? '');
    setPhone(db.schoolProfile.phone ?? '');
    setEmail(db.schoolProfile.email ?? '');
    setAddress(db.schoolProfile.address);
    setMission(db.schoolProfile.mission ?? '');
    setVision(db.schoolProfile.vision ?? '');
    setInitialized(true);
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, eiin, schoolCode, phone, email, address, mission, vision }).unwrap();
      toast.success('প্রতিষ্ঠানের তথ্য সফলভাবে সংরক্ষিত হয়েছে।');
    } catch {
      toast.error('তথ্য সংরক্ষণে ত্রুটি হয়েছে।');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={'প্রতিষ্ঠান ব্যবস্থাপনা'}
        description={'বিদ্যালয়ের অফিসিয়াল প্রোফাইল, ইতিহাস, সুবিধা, কমিটি ও দ্রুত লিংক।'}
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'profile', label: 'প্রোফাইল' },
          { value: 'content', label: 'ইতিহাস ও কনটেন্ট' },
          { value: 'facilities', label: 'সুবিধাসমূহ' },
          { value: 'administrators', label: 'প্রশাসকবৃন্দ' },
          { value: 'committee', label: 'ম্যানেজিং কমিটি' },
          { value: 'quick-links', label: 'দ্রুত লিংক' },
        ]}
      />

      {tab === 'profile' && (
        <Card className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <SchoolEmblem size={64} />
              <div>
                <p className="font-bold text-base text-foreground">{db.schoolProfile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {'অফিসিয়াল BHS মনোগ্রাম (হেডার, পোর্টাল ও সকল A4 প্রিন্ট ডকুমেন্টে ব্যবহৃত)'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={'বিদ্যালয়ের নাম'} required>
                <Input placeholder="বিদ্যালয়ের নাম লিখুন" value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label="EIIN">
                <Input placeholder="EIIN লিখুন" value={eiin} onChange={(e) => setEiin(e.target.value)} />
              </FormField>
              <FormField label={'বিদ্যালয় কোড'}>
                <Input placeholder="বিদ্যালয় কোড লিখুন" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} />
              </FormField>
              <FormField label={'ফোন নম্বর'}>
                <Input placeholder="মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormField>
              <FormField label={'ইমেইল'}>
                <Input placeholder="ইমেইল ঠিকানা লিখুন" value={email} onChange={(e) => setEmail(e.target.value)} />
              </FormField>
              <FormField label={'ঠিকানা'} required>
                <Input placeholder="ঠিকানা লিখুন" value={address} onChange={(e) => setAddress(e.target.value)} />
              </FormField>
              <FormField label={'লক্ষ্য (Mission)'}>
                <Textarea placeholder="লক্ষ্য (Mission) লিখুন..." value={mission} onChange={(e) => setMission(e.target.value)} />
              </FormField>
              <FormField label={'দৃষ্টিভঙ্গি (Vision)'}>
                <Textarea placeholder="দৃষ্টিভঙ্গি (Vision) লিখুন..." value={vision} onChange={(e) => setVision(e.target.value)} />
              </FormField>
            </div>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
            </Button>
          </form>
        </Card>
      )}

      {tab === 'content' && (
        <div className="grid gap-4">
          {db.institutionContents.map((c) => (
            <Card key={c.id} className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">{c.title}</h3>
                <StatusBadge enumName="InstitutionContentType" value={c.type} />
              </div>
              <p className="text-sm text-muted-foreground">{c.description}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.facilities.map((f) => (
            <Card key={f.id} className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">{f.name}</h3>
                <StatusBadge enumName="FacilityType" value={f.type} />
              </div>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'administrators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.administrators.map((a) => (
            <Card key={a.id} className="p-5 space-y-1.5">
              <h3 className="text-base font-bold text-foreground">{a.name}</h3>
              <p className="text-sm text-primary">{a.designation}</p>
              <p className="text-sm text-muted-foreground">{a.message}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'committee' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-surface-muted text-sm text-muted-foreground">
              <tr>
                <th className="p-3 text-left">{'নাম'}</th>
                <th className="p-3 text-left">{'পদবি'}</th>
                <th className="p-3 text-left">{'ফোন'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {db.managingCommittee.map((m) => (
                <tr key={m.id}>
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-3">
                      <img
                        src={getCommitteePortrait(m.photo, m.id, m.designation)}
                        alt={m.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover object-top border border-border shrink-0"
                      />
                      <span>{m.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{m.designation}</td>
                  <td className="p-3 tabular-nums">{m.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'quick-links' && (() => {
        const sortedLinks = [...db.quickLinks].sort((a, b) => a.sortOrder - b.sortOrder);
        const moveLink = async (fromIdx: number, toIdx: number) => {
          if (toIdx < 0 || toIdx >= sortedLinks.length || fromIdx === toIdx) return;
          const next = [...sortedLinks];
          const [moved] = next.splice(fromIdx, 1);
          next.splice(toIdx, 0, moved);
          await reorderCms({ collection: 'quickLinks', orderedIds: next.map((x) => x.id) }).unwrap();
          toast.success('দ্রুত লিংকের ক্রম হালনাগাদ হয়েছে।');
        };
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {'ড্র্যাগ-অ্যান্ড-ড্রপ অথবা তীর বাটন ব্যবহার করে হোমপেজ দ্রুত লিংকের ক্রম পরিবর্তন করুন।'}
            </p>
            <Card className="divide-y divide-border">
              {sortedLinks.map((ql, idx) => (
                <div
                  key={ql.id}
                  draggable
                  onDragStart={() => setDragQuickLinkId(ql.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragQuickLinkId || dragQuickLinkId === ql.id) return;
                    const fromIdx = sortedLinks.findIndex((x) => x.id === dragQuickLinkId);
                    moveLink(fromIdx, idx);
                    setDragQuickLinkId(null);
                  }}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-surface-muted/40 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{ql.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{ql.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={idx === 0}
                      onClick={() => moveLink(idx, idx - 1)}
                      className="h-7 w-7 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={idx === sortedLinks.length - 1}
                      onClick={() => moveLink(idx, idx + 1)}
                      className="h-7 w-7 rounded border border-border inline-flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <Switch
                      checked={ql.isActive}
                      onChange={() =>
                        toggleCms({ collection: 'quickLinks', id: ql.id, field: 'isActive' })
                      }
                      label={ql.isActive ? 'সক্রিয়' : 'বন্ধ'}
                    />
                  </div>
                </div>
              ))}
            </Card>
          </div>
        );
      })()}
    </div>
  );
}

// ============================================================================
// 7.3 USERS, ROLES, PERMISSION MATRIX & AUDIT LOGS
// ============================================================================

