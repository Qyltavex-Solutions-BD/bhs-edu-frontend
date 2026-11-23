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
  useToggleRolePermissionMutation,
  useUpdateSchoolProfileMutation,
} from '@/src/store/api';
import { PrintableIdCardSheet } from '@/src/components/print/PrintDocuments';
import { useI18n } from '@/src/lib/i18n';
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
  const { pick } = useI18n();
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
      toast.success(pick('প্রতিষ্ঠানের তথ্য সফলভাবে সংরক্ষিত হয়েছে।', 'School profile updated successfully.'));
    } catch {
      toast.error(pick('তথ্য সংরক্ষণে ত্রুটি হয়েছে।', 'Failed to update profile.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('প্রতিষ্ঠান ব্যবস্থাপনা', 'Institution Management')}
        description={pick('বিদ্যালয়ের অফিসিয়াল প্রোফাইল, ইতিহাস, সুবিধা, কমিটি ও দ্রুত লিংক।', 'Manage school profile, facilities, administrators, managing committee, and quick links.')}
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'profile', label: pick('প্রোফাইল', 'School Profile') },
          { value: 'content', label: pick('ইতিহাস ও কনটেন্ট', 'Content') },
          { value: 'facilities', label: pick('সুবিধাসমূহ', 'Facilities') },
          { value: 'administrators', label: pick('প্রশাসকবৃন্দ', 'Administrators') },
          { value: 'committee', label: pick('ম্যানেজিং কমিটি', 'Committee') },
          { value: 'quick-links', label: pick('দ্রুত লিংক', 'Quick Links') },
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
                  {pick('অফিসিয়াল BHS মনোগ্রাম (হেডার, পোর্টাল ও সকল A4 প্রিন্ট ডকুমেন্টে ব্যবহৃত)', 'Official BHS Emblem (used across header, portals & A4 print documents)')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={pick('বিদ্যালয়ের নাম', 'School Name')} required>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label="EIIN">
                <Input value={eiin} onChange={(e) => setEiin(e.target.value)} />
              </FormField>
              <FormField label={pick('বিদ্যালয় কোড', 'School Code')}>
                <Input value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} />
              </FormField>
              <FormField label={pick('ফোন নম্বর', 'Phone')}>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormField>
              <FormField label={pick('ইমেইল', 'Email')}>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </FormField>
              <FormField label={pick('ঠিকানা', 'Address')} required>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </FormField>
              <FormField label={pick('লক্ষ্য (Mission)', 'Mission')}>
                <Textarea value={mission} onChange={(e) => setMission(e.target.value)} />
              </FormField>
              <FormField label={pick('দৃষ্টিভঙ্গি (Vision)', 'Vision')}>
                <Textarea value={vision} onChange={(e) => setVision(e.target.value)} />
              </FormField>
            </div>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('পরিবর্তন সংরক্ষণ করুন', 'Save Profile')}
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
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-sm text-muted-foreground">
              <tr>
                <th className="p-3 text-left">{pick('নাম', 'Name')}</th>
                <th className="p-3 text-left">{pick('পদবি', 'Designation')}</th>
                <th className="p-3 text-left">{pick('ফোন', 'Phone')}</th>
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
          toast.success(pick('দ্রুত লিংকের ক্রম হালনাগাদ হয়েছে।', 'Quick link order updated.'));
        };
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {pick(
                'ড্র্যাগ-অ্যান্ড-ড্রপ অথবা তীর বাটন ব্যবহার করে হোমপেজ দ্রুত লিংকের ক্রম পরিবর্তন করুন।',
                'Drag and drop rows or use arrow controls to reorder homepage quick links.'
              )}
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
                      label={ql.isActive ? pick('সক্রিয়', 'Active') : pick('বন্ধ', 'Hidden')}
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

export function AdminUsersPage({
  defaultTab = 'users',
}: {
  defaultTab?: 'users' | 'roles' | 'permissions' | 'audit';
}) {
  const { id: userIdParam } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [togglePerm] = useToggleRolePermissionMutation();
  const { locale, pick } = useI18n();
  const [tab, setTab] = useState(defaultTab);
  const [moduleFilter, setModuleFilter] = useState('ALL');

  if (isLoading || !db) return <LoadingSkeleton />;

  const selectedUser = userIdParam ? db.users.find((u) => u.id === userIdParam) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('ব্যবহারকারী, রোল ও অডিট লগ', 'Users, RBAC Permissions & Audit Logs')}
        description={pick(
          'রোল-ভিত্তিক পারমিশন ম্যাট্রিক্স এবং সিস্টেম অ্যাক্টিভিটি লগ। (দ্রষ্টব্য: চূড়ান্ত নিরাপত্তা সর্বদা ব্যাকএন্ডে যাচাই হয়)',
          'Role-based permission matrix and audit logs. (Note: Real security enforcement occurs server-side.)'
        )}
      />

      {selectedUser && (
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-base font-bold">{selectedUser.name}</p>
            <p className="text-sm text-muted-foreground">{selectedUser.email} · {selectedUser.phone}</p>
          </div>
          <Link href="/admin/users"><Button variant="outline" size="sm">{pick('সব ব্যবহারকারী', 'All Users')}</Button></Link>
        </Card>
      )}

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'users', label: pick('ব্যবহারকারী', 'Users'), count: db.users.length },
          { value: 'roles', label: pick('রোলসমূহ', 'Roles'), count: db.roles.length },
          { value: 'permissions', label: pick('পারমিশন ম্যাট্রিক্স', 'Permission Matrix') },
          { value: 'audit', label: pick('অডিট লগ', 'Audit Logs'), count: db.auditLogs.length },
        ]}
      />

      {tab === 'users' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-sm text-muted-foreground">
              <tr>
                <th className="p-3 text-left">{pick('নাম', 'Name')}</th>
                <th className="p-3 text-left">{pick('ইমেইল / ফোন', 'Contact')}</th>
                <th className="p-3 text-left">{pick('রোল', 'Assigned Role')}</th>
                <th className="p-3 text-left">{pick('অবস্থা', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {db.users.map((u) => {
                const ur = db.userRoles.find((x) => x.userId === u.id);
                const role = ur ? db.roles.find((r) => r.id === ur.roleId) : null;
                return (
                  <tr key={u.id}>
                    <td className="p-3 font-medium">
                      <Link href={`/admin/users/${u.id}`} className="text-primary hover:underline">{u.name}</Link>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground tabular-nums">{u.email} · {u.phone}</td>
                    <td className="p-3 text-sm font-mono">{role?.name ?? '—'}</td>
                    <td className="p-3">
                      <StatusBadge value={u.isActive ? 'ACTIVE' : 'INACTIVE'} customLabel={u.isActive ? pick('সক্রিয়', 'Active') : pick('নিষ্ক্রিয়', 'Inactive')} customTone={u.isActive ? 'success' : 'neutral'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'roles' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {db.roles.map((r) => {
            const count = db.rolePermissions.filter((rp) => rp.roleId === r.id).length;
            return (
              <Card key={r.id} className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-primary">{r.name}</span>
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <p className="text-sm text-foreground pt-2 border-t border-border tabular-nums">
                  {formatNumber(count, locale)} {pick('টি অনুমতি নির্ধারিত', 'permissions assigned')}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'permissions' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left sticky left-0 bg-surface-muted">{pick('পারমিশন', 'Permission')}</th>
                {db.roles.slice(0, 6).map((r) => (
                  <th key={r.id} className="p-3 text-center font-mono text-xs">{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {db.permissions.map((perm) => (
                <tr key={perm.id}>
                  <td className="p-3 font-mono text-sm font-medium sticky left-0 bg-surface">{perm.name}</td>
                  {db.roles.slice(0, 6).map((r) => {
                    const checked = db.rolePermissions.some(
                      (rp) => rp.roleId === r.id && rp.permissionId === perm.id
                    );
                    return (
                      <td key={r.id} className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            togglePerm({ roleId: r.id, permissionId: perm.id });
                            toast.success(pick('পারমিশন আপডেট হয়েছে', 'Permission updated'));
                          }}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="w-52">
              <option value="ALL">{pick('সকল মডিউল', 'All Modules')}</option>
              {Array.from(new Set(db.auditLogs.map((l) => l.module))).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCsv(db.auditLogs as unknown as Record<string, unknown>[], 'audit-logs.csv')}
            >
              {pick('CSV এক্সপোর্ট', 'Export Audit CSV')}
            </Button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-sm text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">{pick('তারিখ', 'Date')}</th>
                  <th className="p-3 text-left">{pick('মডিউল', 'Module')}</th>
                  <th className="p-3 text-left">{pick('অ্যাকশন', 'Action')}</th>
                  <th className="p-3 text-left">{pick('বিস্তারিত', 'Details')}</th>
                  <th className="p-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {db.auditLogs
                  .filter((l) => moduleFilter === 'ALL' || l.module === moduleFilter)
                  .map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 tabular-nums whitespace-nowrap">{formatDateShort(l.createdAt, locale)}</td>
                      <td className="p-3 font-medium text-primary">{l.module}</td>
                      <td className="p-3 font-mono">{l.action}</td>
                      <td className="p-3 text-muted-foreground">{l.details}</td>
                      <td className="p-3 font-mono text-muted-foreground">{l.ipAddress}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}

export { AdminStaffPage } from '@/src/views/admin/AdminStaffOps';

// ============================================================================
// 7.5 ACADEMIC SETUP + VISUAL CLASS ROUTINE BUILDER WITH CONFLICT DETECTION
// ============================================================================

// ============================================================================
// 7.5 ACADEMIC SETUP
// ============================================================================

const PAGE_COPY: Record<
  AcademicTab,
  { titleBn: string; titleEn: string; descBn: string; descEn: string; year: boolean }
> = {
  years: {
    titleBn: 'শিক্ষাবর্ষ',
    titleEn: 'Academic years',
    descBn: 'এক সময়ে একটি বছর চলতি সেশন। অন্য বছর খুলে আগের সেশনের তথ্য দেখা যায়।',
    descEn: 'One year is the current session. Open another year to review a previous session.',
    year: false,
  },
  groups: {
    titleBn: 'বিভাগ',
    titleEn: 'Streams',
    descBn: '৯ম ও ১০ম শ্রেণির বিভাগ। ৬ষ্ঠ থেকে ৮ম শ্রেণিতে বিভাগ নেই।',
    descEn: 'Streams for classes 9 and 10. Classes 6–8 have no stream.',
    year: false,
  },
  classes: {
    titleBn: 'শ্রেণি',
    titleEn: 'Classes',
    descBn: 'বিদ্যালয়ের শ্রেণি। নতুন শ্রেণির সাথে শাখার নামও দেওয়া যায়।',
    descEn: 'School classes. A new class can include its section names.',
    year: false,
  },
  sections: {
    titleBn: 'শাখা',
    titleEn: 'Sections',
    descBn: 'প্রতিটি শাখা একটি শ্রেণির অন্তর্গত। এক শ্রেণিতে শাখার নাম আলাদা হতে হয়।',
    descEn: 'Each section belongs to one class. Section names are unique within a class.',
    year: false,
  },
  catalog: {
    titleBn: 'বিষয় তালিকা',
    titleEn: 'Subject catalog',
    descBn: 'বোর্ডের বিষয় এখানে তৈরি হয়। তারপর শ্রেণির পাঠ্যক্রমে বসানো হয়।',
    descEn: 'Board subjects are created here, then placed on a class curriculum.',
    year: false,
  },
  subjects: {
    titleBn: 'শ্রেণির বিষয়',
    titleEn: 'Class subjects',
    descBn: 'এই শিক্ষাবর্ষে কোন শ্রেণি কোন বিষয় পড়বে। ৯–১০ এ বিভাগ ও ঐচ্ছিক বিষয় আলাদা।',
    descEn: 'Which subjects each class studies this year. Classes 9–10 can use streams and optional subjects.',
    year: true,
  },
  books: {
    titleBn: 'পাঠ্যবই',
    titleEn: 'Textbooks',
    descBn: 'বই শ্রেণি ও বিষয়ের সাথে থাকে। শুধু এই বছরের পাঠ্যক্রমের বিষয়ে বই যোগ হয়।',
    descEn: 'A book belongs to a class and subject, and only for a subject on this year’s curriculum.',
    year: true,
  },
  'class-teachers': {
    titleBn: 'শ্রেণি শিক্ষক',
    titleEn: 'Class teachers',
    descBn: 'এক শাখায় একজন শ্রেণি শিক্ষক। একজন শিক্ষক এক বছরে একটি শাখা ধরেন।',
    descEn: 'One class teacher per section. A teacher holds one section in a year.',
    year: true,
  },
  assignments: {
    titleBn: 'বিষয় শিক্ষক বণ্টন',
    titleEn: 'Subject teacher assignments',
    descBn: 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষক বণ্টন। ক্লাস রুটিন ও পরীক্ষার নম্বর এন্ট্রি এই বণ্টন অনুসারেই নির্ধারিত হয়।',
    descEn: 'Assign teachers to subjects and sections. Timetable and marks entry use these assignments.',
    year: true,
  },
  routines: {
    titleBn: 'ক্লাস রুটিন',
    titleEn: 'Class timetable',
    descBn: 'পাবলিক রুটিনের মতো সাপ্তাহিক সময়সূচি। পিরিয়ড যোগ, সরানো ও মুছা যায়।',
    descEn: 'The weekly timetable, in the same layout as the public page.',
    year: true,
  },
  events: {
    titleBn: 'একাডেমিক ক্যালেন্ডার',
    titleEn: 'Academic calendar',
    descBn: 'ছুটি, অনুষ্ঠান ও ভর্তির তারিখ এই শিক্ষাবর্ষে থাকে।',
    descEn: 'Holidays, events, and admission dates for this academic year.',
    year: true,
  },
  documents: {
    titleBn: 'সিলেবাস',
    titleEn: 'Syllabus',
    descBn: 'অধ্যায়ের তালিকা ও অফিসিয়াল ফাইল। বিষয় এই বছরের পাঠ্যক্রম থেকে আসে।',
    descEn: 'Chapter lists and official files. Subjects come from this year’s curriculum.',
    year: true,
  },
  policies: {
    titleBn: 'নীতিমালা',
    titleEn: 'School policies',
    descBn: 'শিক্ষার্থী বিধি, অভিভাবক নির্দেশনা ও পোশাকবিধি। প্রকাশিত হলে পাবলিক পাতায় যায়।',
    descEn: 'Student rules, parent guidelines, and dress code. Published items appear on the public page.',
    year: false,
  },
};

export function AdminAcademicPage({
  defaultTab = 'years',
}: {
  defaultTab?: AcademicTab;
}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const selectedYear = useAcademicYearSelection(db?.academicYears);
  const [saveSyllabusFile, { isLoading: savingSyllabusFile }] = useSaveSyllabusFileMutation();
  const [addSyllabusEntry, { isLoading: addingSyllabusEntry }] = useAddSyllabusEntryMutation();
  const [removeSyllabusEntry] = useRemoveSyllabusEntryMutation();
  const [removeSyllabusFile] = useRemoveSyllabusFileMutation();
  const { locale, pick } = useI18n();
  const [tab, setTab] = useState(defaultTab);
  const [syllabusFileForm, setSyllabusFileForm] = useState<{
    classId: string;
    examTerm: SyllabusExamTerm;
    groupId: string;
    title: string;
    fileName: string;
    fileSize: string;
    fileType: 'PDF' | 'IMAGE';
    fileUrl: string;
  }>({
    classId: 'cls-10',
    examTerm: 'HALF_YEARLY',
    groupId: '',
    title: '',
    fileName: '',
    fileSize: '',
    fileType: 'PDF',
    fileUrl: '',
  });
  const [syllabusEntryForm, setSyllabusEntryForm] = useState<{
    classId: string;
    examTerm: SyllabusExamTerm;
    groupId: string;
    subjectId: string;
    chaptersBn: string;
    marksBreakdownBn: string;
  }>({
    classId: 'cls-10',
    examTerm: 'HALF_YEARLY',
    groupId: '',
    subjectId: 'sub-101',
    chaptersBn: '',
    marksBreakdownBn: 'সৃজনশীল ৭০ + বহুনির্বাচনি ৩০ = ১০০',
  });
  const [syllabusModal, setSyllabusModal] = useState<null | 'file' | 'entry'>(null);

  if (isLoading || !db) return <LoadingSkeleton />;

  const curriculumSubjectsFor = (classId: string, groupId: string) => {
    const schoolClass = db.classes.find((item) => item.id === classId);
    const stream = (schoolClass?.numericValue ?? 0) >= 9 ? groupId : '';
    const seen = new Set<string>();
    return db.classSubjects.flatMap((row) => {
      if (!row.isActive || row.academicYearId !== selectedYear?.id || row.classId !== classId) return [];
      if (stream) {
        if (row.groupId !== stream && row.groupId != null) return [];
      } else if (row.groupId != null) {
        return [];
      }
      if (seen.has(row.subjectId)) return [];
      seen.add(row.subjectId);
      const subject = db.subjects.find((item) => item.id === row.subjectId);
      return subject ? [subject] : [];
    });
  };

  const groupsOnCurriculum = (classId: string) =>
    db.academicGroups.filter((group) =>
      db.classSubjects.some(
        (row) =>
          row.isActive &&
          row.academicYearId === selectedYear?.id &&
          row.classId === classId &&
          row.groupId === group.id
      )
    );

  const handleSyllabusFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const formattedSize = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const reader = new FileReader();
    reader.onload = () => {
      setSyllabusFileForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: formattedSize,
        fileType: isPdf ? 'PDF' : 'IMAGE',
        fileUrl: typeof reader.result === 'string' ? reader.result : '',
        title: prev.title.trim() ? prev.title : file.name.replace(/\.[^.]+$/, ''),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSyllabusFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) {
      toast.error(pick('আগে একটি শিক্ষাবর্ষ নির্বাচন করুন।', 'Select an academic year first.'));
      return;
    }
    if (!syllabusFileForm.title.trim() || !syllabusFileForm.fileName) {
      toast.error(pick('অনুগ্রহ করে শিরোনাম ও সিলেবাস ফাইল নির্বাচন করুন।', 'Please provide a title and select a file.'));
      return;
    }
    try {
      await saveSyllabusFile({
        academicYearId: selectedYear?.id ?? '',
        classId: syllabusFileForm.classId,
        groupId: syllabusFileForm.groupId || null,
        examTerm: syllabusFileForm.examTerm,
        title: syllabusFileForm.title.trim(),
        fileName: syllabusFileForm.fileName,
        fileSize: syllabusFileForm.fileSize || '250 KB',
        fileType: syllabusFileForm.fileType,
        fileUrl: syllabusFileForm.fileUrl || null,
        publishedAt: new Date().toISOString().slice(0, 10),
        isPublished: true,
      }).unwrap();
      toast.success(pick('সিলেবাস ফাইল সফলভাবে প্রকাশিত হয়েছে।', 'Syllabus file published successfully.'));
      setSyllabusModal(null);
      setSyllabusFileForm((prev) => ({
        ...prev,
        title: '',
        fileName: '',
        fileSize: '',
        fileUrl: '',
      }));
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ??
          pick('সিলেবাস ফাইল সংরক্ষণে সমস্যা হয়েছে।', 'Failed to save syllabus file.')
      );
    }
  };

  const handleAddSyllabusEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) {
      toast.error(pick('আগে একটি শিক্ষাবর্ষ নির্বাচন করুন।', 'Select an academic year first.'));
      return;
    }
    if (!syllabusEntryForm.chaptersBn.trim()) {
      toast.error(pick('নির্ধারিত অধ্যায়ের বিবরণ লিখুন।', 'Please enter chapter scope details.'));
      return;
    }
    const allowedSubjects = curriculumSubjectsFor(syllabusEntryForm.classId, syllabusEntryForm.groupId);
    if (!allowedSubjects.some((subject) => subject.id === syllabusEntryForm.subjectId)) {
      toast.error(
        pick(
          'এই বিষয়টি ওই শ্রেণির এই শিক্ষাবর্ষের পাঠ্যতালিকায় নেই।',
          'That subject is not on this class curriculum for the year.'
        )
      );
      return;
    }
    try {
      await addSyllabusEntry({
        academicYearId: selectedYear?.id ?? '',
        classId: syllabusEntryForm.classId,
        groupId: syllabusEntryForm.groupId || null,
        examTerm: syllabusEntryForm.examTerm,
        subjectId: syllabusEntryForm.subjectId,
        chaptersBn: syllabusEntryForm.chaptersBn.trim(),
        chaptersEn: syllabusEntryForm.chaptersBn.trim(),
        marksBreakdownBn: syllabusEntryForm.marksBreakdownBn.trim() || 'মোট নম্বর: ১০০',
        marksBreakdownEn: syllabusEntryForm.marksBreakdownBn.trim() || 'Total Marks: 100',
        displayOrder: db.syllabusEntries.length + 1,
      }).unwrap();
      toast.success(pick('অধ্যায়ভিত্তিক সিলেবাস যুক্ত হয়েছে।', 'Chapter-wise syllabus entry added.'));
      setSyllabusModal(null);
      setSyllabusEntryForm((prev) => ({ ...prev, chaptersBn: '' }));
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ??
          pick('সিলেবাস এন্ট্রি যুক্ত করতে ব্যর্থ হয়েছে।', 'Failed to add syllabus entry.')
      );
    }
  };

  const handleRemoveSyllabusFile = async (id: string) => {
    try {
      await removeSyllabusFile({ id }).unwrap();
      toast.success(pick('সিলেবাস ফাইল মুছে ফেলা হয়েছে।', 'Syllabus file removed.'));
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? pick('ফাইল মোছা যায়নি।', 'Could not remove the file.'));
    }
  };

  const handleRemoveSyllabusEntry = async (id: string) => {
    try {
      await removeSyllabusEntry({ id }).unwrap();
      toast.success(pick('অধ্যায়ের সারি মুছে ফেলা হয়েছে।', 'Chapter row removed.'));
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? pick('সারি মোছা যায়নি।', 'Could not remove the row.'));
    }
  };

  return (
    <AcademicShell
      title={pick(PAGE_COPY[tab].titleBn, PAGE_COPY[tab].titleEn)}
      description={pick(PAGE_COPY[tab].descBn, PAGE_COPY[tab].descEn)}
      years={db.academicYears}
      selectedYear={selectedYear}
      showYear={PAGE_COPY[tab].year}
    >

      {(tab === 'years' || tab === 'groups' || tab === 'classes' || tab === 'sections') && (
        <AcademicFoundation tab={tab} db={db} />
      )}

      {tab === 'subjects' && selectedYear && <AcademicCurriculum db={db} year={selectedYear} section="curriculum" />}

      {tab === 'catalog' && <AcademicCurriculum db={db} year={selectedYear ?? db.academicYears[0]} section="catalog" />}

      {tab === 'books' && selectedYear && <AcademicCurriculum db={db} year={selectedYear} section="books" />}

      {tab === 'class-teachers' && selectedYear && (
        <AcademicStaffing mode="class-teachers" db={db} year={selectedYear} />
      )}

      {tab === 'assignments' && selectedYear && (
        <AcademicStaffing mode="assignments" db={db} year={selectedYear} />
      )}

      {tab === 'events' && selectedYear && <AcademicCalendar db={db} year={selectedYear} />}

      {tab === 'routines' && selectedYear && <AcademicRoutine db={db} year={selectedYear} />}

      {tab === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={() => setSyllabusModal('file')}>
              <Upload className="w-4 h-4" />
              {pick('সিলেবাস ফাইল', 'Syllabus file')}
            </Button>
            <Button type="button" variant="outline" onClick={() => setSyllabusModal('entry')}>
              <Plus className="w-4 h-4" />
              {pick('অধ্যায় যোগ', 'Add chapters')}
            </Button>
          </div>
          <Modal
            open={syllabusModal === 'file'}
            onClose={() => setSyllabusModal(null)}
            title={pick('সিলেবাস ফাইল প্রকাশ', 'Publish a syllabus file')}
            description={pick(
              'ফাইলটি পাবলিক সিলেবাস পাতায় ডাউনলোডের জন্য উন্মুক্ত হবে।',
              'The file becomes available to download on the public syllabus page.'
            )}
          >
              <form onSubmit={handleUploadSyllabusFile} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={pick('শ্রেণি', 'Class')}>
                    <Select
                      value={syllabusFileForm.classId}
                      onChange={(e) =>
                        setSyllabusFileForm({ ...syllabusFileForm, classId: e.target.value, groupId: '' })
                      }
                    >
                      {db.classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {locale === 'bn' ? c.nameBn ?? c.name : c.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label={pick('পরীক্ষার পর্ব', 'Exam Term')}>
                    <Select
                      value={syllabusFileForm.examTerm}
                      onChange={(e) =>
                        setSyllabusFileForm({
                          ...syllabusFileForm,
                          examTerm: e.target.value as SyllabusExamTerm,
                        })
                      }
                    >
                      <option value="HALF_YEARLY">{pick('অর্ধবার্ষিক পরীক্ষা', 'Half-Yearly Exam')}</option>
                      <option value="ANNUAL">{pick('বার্ষিক পরীক্ষা', 'Annual Exam')}</option>
                      <option value="SELECTION">{pick('নির্বাচনি (এসএসসি)', 'Selection / SSC')}</option>
                    </Select>
                  </FormField>
                </div>

                {(db.classes.find((c) => c.id === syllabusFileForm.classId)?.numericValue ?? 0) >= 9 && (
                  <FormField label={pick('বিভাগ (ঐচ্ছিক)', 'Academic Stream (Optional)')}>
                    <Select
                      value={syllabusFileForm.groupId}
                      onChange={(e) => setSyllabusFileForm({ ...syllabusFileForm, groupId: e.target.value })}
                    >
                      <option value="">{pick('সকল বিভাগ (সমন্বিত ফাইল)', 'All Streams (Combined)')}</option>
                      {groupsOnCurriculum(syllabusFileForm.classId).map((g) => (
                        <option key={g.id} value={g.id}>
                          {locale === 'bn' ? g.nameBn ?? g.name : g.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                )}

                <FormField label={pick('সিলেবাসের শিরোনাম', 'Syllabus Title')}>
                  <Input
                    value={syllabusFileForm.title}
                    onChange={(e) => setSyllabusFileForm({ ...syllabusFileForm, title: e.target.value })}
                    placeholder={pick(
                      'যেমন: দশম শ্রেণি — অর্ধবার্ষিক পরীক্ষা সিলেবাস ২০২৬',
                      'e.g., Class 10 — Half-Yearly Syllabus 2026'
                    )}
                  />
                </FormField>

                <FormField label={pick('সিলেবাস ফাইল নির্বাচন (PDF / JPG / PNG)', 'Select File (PDF / Image)')}>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleSyllabusFilePick}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3.5 file:rounded-[var(--radius)] file:border file:border-border file:text-sm file:font-medium file:bg-surface-muted file:text-foreground hover:file:bg-surface-muted/80 cursor-pointer"
                  />
                  {syllabusFileForm.fileName && (
                    <p className="text-xs font-mono text-primary mt-1.5">
                      {syllabusFileForm.fileName} · {syllabusFileForm.fileSize} ({syllabusFileForm.fileType})
                    </p>
                  )}
                </FormField>

                <Button type="submit" variant="primary" disabled={savingSyllabusFile}>
                  <Upload className="w-4 h-4" />
                  {pick('সিলেবাস ফাইল প্রকাশ করুন', 'Publish Syllabus File')}
                </Button>
              </form>
          </Modal>

          <Modal
            open={syllabusModal === 'entry'}
            onClose={() => setSyllabusModal(null)}
            title={pick('অধ্যায়ভিত্তিক সিলেবাস', 'Chapter row')}
            description={pick(
              'বিষয় এই শিক্ষাবর্ষের পাঠ্যক্রম থেকে আসে। একই সারি আবার সেভ করলে আপডেট হয়।',
              'Subjects come from this year’s curriculum. Saving the same row updates it.'
            )}
          >
              <form onSubmit={handleAddSyllabusEntry} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={pick('শ্রেণি', 'Class')}>
                    <Select
                      value={syllabusEntryForm.classId}
                      onChange={(e) => {
                        const classId = e.target.value;
                        const nextSubject = curriculumSubjectsFor(classId, '')[0];
                        setSyllabusEntryForm({
                          ...syllabusEntryForm,
                          classId,
                          groupId: '',
                          subjectId: nextSubject?.id ?? '',
                        });
                      }}
                    >
                      {db.classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {locale === 'bn' ? c.nameBn ?? c.name : c.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label={pick('পরীক্ষার পর্ব', 'Exam Term')}>
                    <Select
                      value={syllabusEntryForm.examTerm}
                      onChange={(e) =>
                        setSyllabusEntryForm({
                          ...syllabusEntryForm,
                          examTerm: e.target.value as SyllabusExamTerm,
                        })
                      }
                    >
                      <option value="HALF_YEARLY">{pick('অর্ধবার্ষিক পরীক্ষা', 'Half-Yearly Exam')}</option>
                      <option value="ANNUAL">{pick('বার্ষিক পরীক্ষা', 'Annual Exam')}</option>
                      <option value="SELECTION">{pick('নির্বাচনি (এসএসসি)', 'Selection / SSC')}</option>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={pick('বিষয়', 'Subject')} hint={pick('শুধু এই শিক্ষাবর্ষের পাঠ্যতালিকার বিষয়।', 'Only subjects on this year’s curriculum.')}>
                    <Select
                      value={
                        curriculumSubjectsFor(syllabusEntryForm.classId, syllabusEntryForm.groupId).some(
                          (subject) => subject.id === syllabusEntryForm.subjectId
                        )
                          ? syllabusEntryForm.subjectId
                          : ''
                      }
                      onChange={(e) => setSyllabusEntryForm({ ...syllabusEntryForm, subjectId: e.target.value })}
                    >
                      <option value="">{pick('বিষয় বাছুন', 'Choose a subject')}</option>
                      {curriculumSubjectsFor(syllabusEntryForm.classId, syllabusEntryForm.groupId).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.officialCode ? `[${s.officialCode}] ` : ''}
                          {locale === 'bn' ? s.nameBn ?? s.name : s.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  {(db.classes.find((c) => c.id === syllabusEntryForm.classId)?.numericValue ?? 0) >= 9 && (
                    <FormField label={pick('বিভাগ', 'Stream')}>
                      <Select
                        value={syllabusEntryForm.groupId}
                        onChange={(e) => {
                          const groupId = e.target.value;
                          const nextSubject = curriculumSubjectsFor(syllabusEntryForm.classId, groupId)[0];
                          setSyllabusEntryForm({
                            ...syllabusEntryForm,
                            groupId,
                            subjectId: nextSubject?.id ?? '',
                          });
                        }}
                      >
                        <option value="">{pick('আবশ্যিক (সকল বিভাগ)', 'Compulsory (All)')}</option>
                        {groupsOnCurriculum(syllabusEntryForm.classId).map((g) => (
                          <option key={g.id} value={g.id}>
                            {locale === 'bn' ? g.nameBn ?? g.name : g.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  )}
                </div>

                <FormField label={pick('নির্ধারিত অধ্যায় ও পাঠ্যসীমা', 'Chapters & Scope')}>
                  <Textarea
                    rows={2}
                    value={syllabusEntryForm.chaptersBn}
                    onChange={(e) => setSyllabusEntryForm({ ...syllabusEntryForm, chaptersBn: e.target.value })}
                    placeholder={pick(
                      'যেমন: অধ্যায় ১ (ভৌত রাশি), অধ্যায় ২ (গতি), অধ্যায় ৩ (বল)',
                      'e.g., Chapters 1–4 with practicals'
                    )}
                  />
                </FormField>

                <FormField label={pick('মানবণ্টন', 'Marks Breakdown')}>
                  <Input
                    value={syllabusEntryForm.marksBreakdownBn}
                    onChange={(e) =>
                      setSyllabusEntryForm({ ...syllabusEntryForm, marksBreakdownBn: e.target.value })
                    }
                  />
                </FormField>

                <Button type="submit" variant="primary" disabled={addingSyllabusEntry}>
                  <Plus className="w-4 h-4" />
                  {pick('অধ্যায় এন্ট্রি যুক্ত করুন', 'Add Syllabus Entry')}
                </Button>
              </form>
          </Modal>

          {/* Published Syllabus Files Table */}
          <Card className="overflow-x-auto">
            <div className="p-5 pb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {pick('প্রকাশিত সিলেবাস ফাইলসমূহ', 'Published Syllabus Files')}
                </h3>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {pick(
                    `মোট ${formatNumber(db.syllabusFiles.filter((f) => f.academicYearId === selectedYear?.id).length, 'bn')}টি সিলেবাস ফাইল · ${formatNumber(db.syllabusEntries.filter((f) => f.academicYearId === selectedYear?.id).length, 'bn')}টি অধ্যায়ভিত্তিক সারি`,
                    `${db.syllabusFiles.filter((f) => f.academicYearId === selectedYear?.id).length} syllabus files · ${db.syllabusEntries.filter((f) => f.academicYearId === selectedYear?.id).length} chapter entries`
                  )}
                </p>
              </div>
              <Link href="/academics/syllabus">
                <Button variant="outline" size="sm" className="whitespace-nowrap">
                  <FileText className="w-4 h-4" />
                  {pick('পাবলিক সিলেবাস দেখুন', 'View Public Page')}
                </Button>
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 text-left">{pick('শ্রেণি', 'Class')}</th>
                  <th className="p-3 text-left">{pick('পরীক্ষা', 'Term')}</th>
                  <th className="p-3 text-left">{pick('শিরোনাম ও ফাইল', 'Title & File')}</th>
                  <th className="p-3 text-left">{pick('সাইজ', 'Size')}</th>
                  <th className="p-3 text-left">{pick('প্রকাশের তারিখ', 'Published')}</th>
                  <th className="p-3 text-right">{pick('অবস্থা', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {db.syllabusFiles.filter((f) => f.academicYearId === selectedYear?.id).map((f) => {
                  const cls = db.classes.find((c) => c.id === f.classId);
                  const termLabel =
                    f.examTerm === 'HALF_YEARLY'
                      ? pick('অর্ধবার্ষিক', 'Half-Yearly')
                      : f.examTerm === 'ANNUAL'
                        ? pick('বার্ষিক', 'Annual')
                        : pick('নির্বাচনি', 'Selection');
                  return (
                    <tr key={f.id} className="hover:bg-surface-muted/30">
                      <td className="p-3 font-medium whitespace-nowrap">
                        {locale === 'bn' ? cls?.nameBn ?? cls?.name : cls?.name}
                      </td>
                      <td className="p-3 whitespace-nowrap text-muted-foreground">{termLabel}</td>
                      <td className="p-3">
                        <p className="font-semibold text-foreground">{f.title}</p>
                        <p className="text-xs font-mono text-muted-foreground">{f.fileName}</p>
                      </td>
                      <td className="p-3 tabular-nums text-muted-foreground whitespace-nowrap">
                        {f.fileType} · {f.fileSize}
                      </td>
                      <td className="p-3 tabular-nums text-muted-foreground whitespace-nowrap">
                        {formatDateShort(f.publishedAt, locale)}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {f.fileUrl ? (
                          <a href={f.fileUrl} download={f.fileName} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                            <Download className="w-4 h-4" />
                            {pick('ডাউনলোড', 'Download')}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground mr-2">
                            {pick('ওয়েব সিলেবাস (প্রিন্টযোগ্য)', 'Web Printable')}
                          </span>
                        )}
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveSyllabusFile(f.id)}>
                          {pick('মুছুন', 'Remove')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <Card className="overflow-x-auto">
            <div className="p-5 pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                {pick('অধ্যায়ভিত্তিক সিলেবাস', 'Chapter-wise syllabus')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {pick(
                  'একই শ্রেণি, বিভাগ, পর্ব ও বিষয়ে আবার সেভ করলে সারিটি আপডেট হয়।',
                  'Saving the same class, stream, term, and subject updates that row.'
                )}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/70 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 text-left">{pick('শ্রেণি', 'Class')}</th>
                  <th className="p-3 text-left">{pick('বিষয়', 'Subject')}</th>
                  <th className="p-3 text-left">{pick('অধ্যায়', 'Chapters')}</th>
                  <th className="p-3 text-right">{pick('কাজ', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {db.syllabusEntries.filter((entry) => entry.academicYearId === selectedYear?.id).length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-muted-foreground">
                      {pick('এই শিক্ষাবর্ষে এখনো অধ্যায়ের সারি নেই।', 'No chapter rows for this academic year yet.')}
                    </td>
                  </tr>
                )}
                {db.syllabusEntries
                  .filter((entry) => entry.academicYearId === selectedYear?.id)
                  .map((entry) => {
                    const schoolClass = db.classes.find((item) => item.id === entry.classId);
                    const subject = db.subjects.find((item) => item.id === entry.subjectId);
                    const group = db.academicGroups.find((item) => item.id === entry.groupId);
                    return (
                      <tr key={entry.id} className="hover:bg-surface-muted/30">
                        <td className="p-3 whitespace-nowrap">
                          {locale === 'bn' ? schoolClass?.nameBn ?? schoolClass?.name : schoolClass?.name}
                          {group ? ` · ${locale === 'bn' ? group.nameBn ?? group.name : group.name}` : ''}
                        </td>
                        <td className="p-3 font-medium">
                          {locale === 'bn' ? subject?.nameBn ?? subject?.name : subject?.name}
                        </td>
                        <td className="p-3 text-muted-foreground">{entry.chaptersBn}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSyllabusEntryForm({
                                classId: entry.classId,
                                examTerm: entry.examTerm,
                                groupId: entry.groupId ?? '',
                                subjectId: entry.subjectId,
                                chaptersBn: entry.chaptersBn,
                                marksBreakdownBn: entry.marksBreakdownBn,
                              });
                              setSyllabusModal('entry');
                            }}
                          >
                            {pick('সম্পাদনা', 'Edit')}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveSyllabusEntry(entry.id)}>
                            <Trash2 className="w-4 h-4" />
                            {pick('মুছুন', 'Remove')}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </Card>

        </div>
      )}

      {tab === 'policies' && <AcademicPolicies db={db} />}
    </AcademicShell>
  );
}
