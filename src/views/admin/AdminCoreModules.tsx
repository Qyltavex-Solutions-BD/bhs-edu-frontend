'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from '@/src/lib/navigation';
import { toast } from 'sonner';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  GripVertical,
  Plus,
  Printer,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  useAddClassRoutineMutation,
  useAddSyllabusEntryMutation,
  useCreateStaffMutation,
  useGetBootstrapQuery,
  useMoveClassRoutineSlotMutation,
  useReorderCmsItemsMutation,
  useSaveSyllabusFileMutation,
  useToggleArchiveMutation,
  useToggleCmsItemMutation,
  useToggleRolePermissionMutation,
  useUpdateSchoolProfileMutation,
} from '@/src/store/api';
import { PrintableIdCardSheet } from '@/src/components/print/PrintDocuments';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber, formatTime12h } from '@/src/lib/formatters';
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
import { EmploymentType, StaffType, WeekDay } from '@/src/types/enums';
import type { Staff, SyllabusExamTerm } from '@/src/types/entities';
import {
  AcademicFoundation,
  AcademicYearBar,
  useAcademicYearSelection,
} from '@/src/views/admin/AcademicFoundation';

type AcademicTab =
  | 'years'
  | 'groups'
  | 'classes'
  | 'sections'
  | 'subjects'
  | 'assignments'
  | 'routines'
  | 'documents';

const ACADEMIC_TAB_PATH: Record<AcademicTab, string> = {
  years: '/admin/academic/years',
  groups: '/admin/academic/groups',
  classes: '/admin/academic/classes',
  sections: '/admin/academic/sections',
  subjects: '/admin/academic/subjects',
  assignments: '/admin/academic/teacher-assignments',
  routines: '/admin/academic/class-routines',
  documents: '/admin/academic/documents',
};

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

// ============================================================================
// 7.4 STAFF MANAGEMENT (Directory, Departments, Structures, Create & Profile)
// ============================================================================

export function AdminStaffPage({
  defaultTab = 'all',
}: {
  defaultTab?: 'all' | 'teachers' | 'employees' | 'departments' | 'structures' | 'create';
}) {
  const { id: staffIdParam } = useParams();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [toggleArchive] = useToggleArchiveMutation();
  const { locale, pick } = useI18n();
  const [tab, setTab] = useState(defaultTab);
  const [createOpen, setCreateOpen] = useState(defaultTab === 'create');
  const [staffIdPrintOpen, setStaffIdPrintOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    employeeId: 'T-015',
    name: '',
    designation: 'সহকারী শিক্ষক',
    qualification: '',
    staffType: StaffType.TEACHER,
    departmentId: 'dept-sci',
    employmentType: EmploymentType.PERMANENT,
    phone: '01711200999',
    email: '',
  });

  if (isLoading || !db) return <LoadingSkeleton />;

  const profileStaff = staffIdParam ? db.staff.find((s) => s.id === staffIdParam) : null;

  const filteredStaff = db.staff.filter((s) => {
    if (tab === 'teachers') return s.staffType === StaffType.TEACHER;
    if (tab === 'employees') return s.staffType !== StaffType.TEACHER;
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim()) {
      toast.error(pick('স্টাফের নাম আবশ্যক', 'Staff name is required'));
      return;
    }
    try {
      await createStaff(newStaff).unwrap();
      toast.success(pick('নতুন শিক্ষক/কর্মচারী যুক্ত হয়েছে।', 'Staff member added successfully.'));
      setCreateOpen(false);
      setNewStaff((s) => ({ ...s, name: '', employeeId: `T-0${db.staff.length + 12}` }));
    } catch {
      toast.error(pick('সংরক্ষণে সমস্যা হয়েছে।', 'Failed to create staff.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('শিক্ষক ও কর্মচারী ব্যবস্থাপনা', 'Staff & Faculty Management')}
        description={pick('ডিরেক্টরি, বিভাগ, পদ-কাঠামো (Staff Structure) এবং আইডি কার্ড প্রিন্ট।', 'Directory, departments, sanctioned vs filled staff structures, and ID cards.')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setStaffIdPrintOpen(true)}>
              <Printer className="w-4 h-4" /> {pick('স্টাফ আইডি কার্ড', 'Staff ID Cards')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" /> {pick('নতুন স্টাফ যুক্ত করুন', 'Add Staff')}
            </Button>
          </div>
        }
      />

      {profileStaff && (
        <Card className="p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{profileStaff.name}</h2>
              <p className="text-sm text-primary">{profileStaff.designation} · {profileStaff.employeeId}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setStaffIdPrintOpen(true)}>
                <Printer className="w-3.5 h-3.5" /> {pick('আইডি কার্ড প্রিন্ট', 'Print ID Card')}
              </Button>
              <Link href="/admin/staff"><Button variant="ghost" size="sm">{pick('বন্ধ করুন', 'Close')}</Button></Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground pt-2 border-t border-border">
            <p><strong>{pick('যোগ্যতা:', 'Qualification:')}</strong> {profileStaff.qualification ?? '—'}</p>
            <p className="tabular-nums"><strong>{pick('ফোন:', 'Phone:')}</strong> {profileStaff.phone ?? '—'}</p>
            <p><strong>{pick('ইমেইল:', 'Email:')}</strong> {profileStaff.email ?? '—'}</p>
          </div>
        </Card>
      )}

      <SegmentedTabs
        value={tab === 'create' ? 'all' : tab}
        onChange={(v) => setTab(v)}
        items={[
          { value: 'all', label: pick('সকল স্টাফ', 'All Staff'), count: db.staff.length },
          { value: 'teachers', label: pick('শিক্ষক', 'Teachers') },
          { value: 'employees', label: pick('কর্মকর্তা ও কর্মচারী', 'Officers & Employees') },
          { value: 'departments', label: pick('বিভাগসমূহ', 'Departments'), count: db.departments.length },
          { value: 'structures', label: pick('পদ-কাঠামো', 'Staff Structure'), count: db.staffStructures.length },
        ]}
      />

      {(tab === 'all' || tab === 'teachers' || tab === 'employees' || tab === 'create') && (
        <DataTable<Staff>
          data={filteredStaff}
          exportFilename="staff-directory.csv"
          columns={[
            { accessorKey: 'employeeId', header: pick('আইডি', 'ID'), cell: ({ row }) => <span className="font-mono text-sm">{row.original.employeeId}</span> },
            {
              accessorKey: 'name',
              header: pick('নাম', 'Name'),
              cell: ({ row }) => (
                <Link href={`/admin/staff/${row.original.id}`} className="font-semibold text-primary hover:underline">
                  {row.original.name}
                </Link>
              ),
            },
            { accessorKey: 'designation', header: pick('পদবি', 'Designation') },
            { accessorKey: 'staffType', header: pick('ধরন', 'Type'), cell: ({ row }) => <StatusBadge enumName="StaffType" value={row.original.staffType} /> },
            { accessorKey: 'employmentType', header: pick('চাকরি', 'Employment'), cell: ({ row }) => <StatusBadge enumName="EmploymentType" value={row.original.employmentType} /> },
            { accessorKey: 'status', header: pick('অবস্থা', 'Status'), cell: ({ row }) => <StatusBadge enumName="StaffStatus" value={row.original.status} /> },
          ]}
        />
      )}

      {tab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {db.departments.map((d) => (
            <Card key={d.id} className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">{d.name}</h3>
                <span className="font-mono text-xs text-primary">{d.code}</span>
              </div>
              <p className="text-sm text-muted-foreground">{d.description}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'structures' && (
        <div className="space-y-3">
          {db.staffStructures.map((st) => {
            const pct = Math.min(100, Math.round((st.filledPositions / Math.max(1, st.totalPositions)) * 100));
            return (
              <Card key={st.id} className={`p-5 space-y-3 ${st.isDeleted ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{st.designation}</h3>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {pick('পূরণকৃত পদ:', 'Filled:')} {formatNumber(st.filledPositions, locale)} / {formatNumber(st.totalPositions, locale)} ({pct}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge enumName="StaffType" value={st.staffType} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleArchive({ collection: 'staffStructures', id: st.id })}
                    >
                      {st.isDeleted ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                      {st.isDeleted ? pick('পুনরুদ্ধার', 'Restore') : pick('আর্কাইভ', 'Archive')}
                    </Button>
                  </div>
                </div>
                <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={pick('নতুন শিক্ষক / কর্মচারী নিবন্ধন', 'Add Staff Member')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={pick('স্টাফ আইডি', 'Employee ID')} required>
              <Input value={newStaff.employeeId} onChange={(e) => setNewStaff({ ...newStaff, employeeId: e.target.value })} />
            </FormField>
            <FormField label={pick('পূর্ণ নাম', 'Full Name')} required>
              <Input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
            </FormField>
            <FormField label={pick('পদবি', 'Designation')} required>
              <Input value={newStaff.designation} onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })} />
            </FormField>
            <FormField label={pick('শিক্ষাগত যোগ্যতা', 'Qualification')}>
              <Input value={newStaff.qualification} onChange={(e) => setNewStaff({ ...newStaff, qualification: e.target.value })} />
            </FormField>
            <FormField label={pick('ধরন', 'Staff Type')}>
              <Select value={newStaff.staffType} onChange={(e) => setNewStaff({ ...newStaff, staffType: e.target.value as StaffType })}>
                <option value={StaffType.TEACHER}>{pick('শিক্ষক', 'Teacher')}</option>
                <option value={StaffType.OFFICER}>{pick('কর্মকর্তা', 'Officer')}</option>
                <option value={StaffType.EMPLOYEE}>{pick('কর্মচারী', 'Employee')}</option>
              </Select>
            </FormField>
            <FormField label={pick('ফোন নম্বর', 'Phone')}>
              <Input value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{pick('বাতিল', 'Cancel')}</Button>
            <Button type="submit" variant="primary" disabled={creating}>{pick('সংরক্ষণ করুন', 'Save Staff')}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={staffIdPrintOpen}
        onClose={() => setStaffIdPrintOpen(false)}
        title={pick('শিক্ষক ও কর্মচারী পরিচয়পত্র (Staff ID Cards)', 'Staff ID Card Print Sheet')}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end no-print">
            <Button variant="primary" size="sm" onClick={triggerPrint}>
              <Printer className="w-4 h-4" /> {pick('প্রিন্ট করুন', 'Print ID Cards')}
            </Button>
          </div>
          <PrintableIdCardSheet
            school={db.schoolProfile}
            holderType="STAFF"
            cards={(profileStaff ? [profileStaff] : filteredStaff).map((st) => ({
              code: st.employeeId ?? st.id,
              name: st.name,
              subline: st.designation,
              secondaryLine: st.qualification ?? undefined,
              phone: st.phone,
              validUntil: '2026–2027',
            }))}
          />
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// 7.5 ACADEMIC SETUP + VISUAL CLASS ROUTINE BUILDER WITH CONFLICT DETECTION
// ============================================================================

export function AdminAcademicPage({
  defaultTab = 'years',
}: {
  defaultTab?: AcademicTab;
}) {
  const router = useRouter();
  const { data: db, isLoading } = useGetBootstrapQuery();
  const selectedYear = useAcademicYearSelection(db?.academicYears);
  const [addRoutine, { isLoading: addingRoutine }] = useAddClassRoutineMutation();
  const [moveRoutine] = useMoveClassRoutineSlotMutation();
  const [saveSyllabusFile, { isLoading: savingSyllabusFile }] = useSaveSyllabusFileMutation();
  const [addSyllabusEntry, { isLoading: addingSyllabusEntry }] = useAddSyllabusEntryMutation();
  const { locale, pick } = useI18n();
  const [tab, setTab] = useState(defaultTab);
  const [selectedSectionId, setSelectedSectionId] = useState('sec-10-ka');
  const [dragRoutineId, setDragRoutineId] = useState<string | null>(null);
  const [slotForm, setSlotForm] = useState({
    teacherAssignmentId: 'ta-1',
    day: WeekDay.THURSDAY,
    periodNumber: 1,
    startTime: '10:00',
    endTime: '10:45',
    room: 'রুম ২০১',
  });
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

  if (isLoading || !db) return <LoadingSkeleton />;

  const days = [WeekDay.SUNDAY, WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY, WeekDay.THURSDAY];
  const periods = [1, 2, 3, 4];

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
      setSyllabusFileForm((prev) => ({
        ...prev,
        title: '',
        fileName: '',
        fileSize: '',
        fileUrl: '',
      }));
    } catch {
      toast.error(pick('সিলেবাস ফাইল সংরক্ষণে সমস্যা হয়েছে।', 'Failed to save syllabus file.'));
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
      setSyllabusEntryForm((prev) => ({ ...prev, chaptersBn: '' }));
    } catch {
      toast.error(pick('সিলেবাস এন্ট্রি যুক্ত করতে ব্যর্থ হয়েছে।', 'Failed to add syllabus entry.'));
    }
  };

  const handleAddRoutineSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) {
      toast.error(pick('আগে একটি শিক্ষাবর্ষ নির্বাচন করুন।', 'Select an academic year first.'));
      return;
    }
    const ta = db.teacherAssignments.find((x) => x.id === slotForm.teacherAssignmentId);
    if (!ta) return;
    try {
      await addRoutine({
        academicYearId: selectedYear?.id ?? '',
        teacherAssignmentId: ta.id,
        staffId: ta.staffId,
        sectionId: selectedSectionId,
        day: slotForm.day,
        periodNumber: Number(slotForm.periodNumber),
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        room: slotForm.room,
      }).unwrap();
      toast.success(pick('ক্লাস রুটিনে পিরিয়ড সফলভাবে যুক্ত হয়েছে।', 'Routine period added successfully.'));
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Conflict detected';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('একাডেমিক সেটআপ', 'Academic setup')}
        description={pick(
          'আগে শিক্ষাবর্ষ ঠিক করুন। তারপর বিভাগ, শ্রেণি ও শাখা। রুটিন ও সিলেবাস উপরের নির্বাচিত বছর ব্যবহার করে।',
          'Set the academic year first, then groups, classes, and sections. Routines and syllabus use the year selected above.'
        )}
      />

      {selectedYear && <AcademicYearBar years={db.academicYears} selected={selectedYear} />}

      <SegmentedTabs
        value={tab}
        onChange={(value) => router.push(ACADEMIC_TAB_PATH[value])}
        items={[
          { value: 'years', label: pick('শিক্ষাবর্ষ', 'Years') },
          { value: 'groups', label: pick('বিভাগ', 'Groups') },
          { value: 'classes', label: pick('শ্রেণি', 'Classes') },
          { value: 'sections', label: pick('শাখা', 'Sections') },
          { value: 'subjects', label: pick('বিষয় ও পাঠ্যবই', 'Subjects & Books') },
          { value: 'assignments', label: pick('শিক্ষক বণ্টন', 'Teacher Assignments') },
          { value: 'routines', label: pick('ক্লাস রুটিন', 'Routine') },
          { value: 'documents', label: pick('সিলেবাস', 'Syllabus') },
        ]}
      />

      {(tab === 'years' || tab === 'groups' || tab === 'classes' || tab === 'sections') && (
        <AcademicFoundation tab={tab} db={db} />
      )}

      {tab === 'subjects' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-sm text-muted-foreground">
              <tr>
                <th className="p-3 text-left">{pick('কোড', 'Code')}</th>
                <th className="p-3 text-left">{pick('বিষয়', 'Subject')}</th>
                <th className="p-3 text-left">{pick('ক্যাটাগরি', 'Category')}</th>
                <th className="p-3 text-left">{pick('ম্যাপকৃত শ্রেণি', 'Mapped Classes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {db.subjects.map((sub) => {
                const count = db.classSubjects.filter(
                  (cs) => cs.subjectId === sub.id && cs.academicYearId === selectedYear?.id
                ).length;
                return (
                  <tr key={sub.id}>
                    <td className="p-3 font-mono text-sm">{sub.officialCode}</td>
                    <td className="p-3 font-medium">{locale === 'bn' ? sub.nameBn : sub.name}</td>
                    <td className="p-3"><StatusBadge enumName="SubjectCategory" value={sub.category} /></td>
                    <td className="p-3 tabular-nums text-sm">{formatNumber(count, locale)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'assignments' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-sm text-muted-foreground">
              <tr>
                <th className="p-3 text-left">{pick('শিক্ষক', 'Teacher')}</th>
                <th className="p-3 text-left">{pick('শ্রেণি ও শাখা', 'Class & Section')}</th>
                <th className="p-3 text-left">{pick('বিষয়', 'Subject')}</th>
                <th className="p-3 text-left">{pick('নম্বর এন্ট্রি অনুমতি', 'Can Enter Marks')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {db.teacherAssignments
                .filter((ta) => ta.academicYearId === selectedYear?.id)
                .map((ta) => {
                const staff = db.staff.find((s) => s.id === ta.staffId);
                const cls = db.classes.find((c) => c.id === ta.classId);
                const sec = db.sections.find((s) => s.id === ta.sectionId);
                const cs = db.classSubjects.find((x) => x.id === ta.classSubjectId);
                const sub = cs ? db.subjects.find((x) => x.id === cs.subjectId) : null;
                return (
                  <tr key={ta.id}>
                    <td className="p-3 font-medium">{staff?.name}</td>
                    <td className="p-3">{locale === 'bn' ? cls?.nameBn : cls?.name} ({sec?.name})</td>
                    <td className="p-3">{locale === 'bn' ? sub?.nameBn : sub?.name}</td>
                    <td className="p-3">
                      <StatusBadge
                        value={ta.canEnterMarks ? 'YES' : 'NO'}
                        customLabel={ta.canEnterMarks ? pick('অনুমোদিত', 'Allowed') : pick('সীমাবদ্ধ', 'Restricted')}
                        customTone={ta.canEnterMarks ? 'success' : 'warning'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'routines' && (
        <div className="space-y-5">
          <Card className="p-5 no-print">
            <form onSubmit={handleAddRoutineSlot} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              <FormField label={pick('শাখা', 'Section')}>
                <Select value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)}>
                  {db.sections.map((s) => {
                    const cls = db.classes.find((c) => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {locale === 'bn' ? cls?.nameBn : cls?.name} — {s.name}
                      </option>
                    );
                  })}
                </Select>
              </FormField>
              <FormField label={pick('শিক্ষক ও বিষয়', 'Teacher & Subject')}>
                <Select
                  value={slotForm.teacherAssignmentId}
                  onChange={(e) => setSlotForm({ ...slotForm, teacherAssignmentId: e.target.value })}
                >
                  {db.teacherAssignments
                    .filter((ta) => ta.academicYearId === selectedYear?.id && ta.sectionId === selectedSectionId)
                    .map((ta) => {
                    const st = db.staff.find((s) => s.id === ta.staffId);
                    const cs = db.classSubjects.find((x) => x.id === ta.classSubjectId);
                    const sub = cs ? db.subjects.find((x) => x.id === cs.subjectId) : null;
                    return (
                      <option key={ta.id} value={ta.id}>
                        {sub?.nameBn} — {st?.name}
                      </option>
                    );
                  })}
                </Select>
              </FormField>
              <FormField label={pick('বার', 'Day')}>
                <Select value={slotForm.day} onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value as WeekDay })}>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label={pick('পিরিয়ড', 'Period')}>
                <Select value={slotForm.periodNumber} onChange={(e) => setSlotForm({ ...slotForm, periodNumber: Number(e.target.value) })}>
                  {periods.map((p) => (
                    <option key={p} value={p}>{pick(`${p}ম পিরিয়ড`, `Period ${p}`)}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label={pick('কক্ষ নং', 'Room')}>
                <Input value={slotForm.room} onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })} />
              </FormField>
              <Button type="submit" variant="primary" disabled={addingRoutine}>
                {pick('পিরিয়ড যুক্ত করুন', 'Add Slot')}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground mt-2">
              {pick(
                'স্বয়ংক্রিয় কনফ্লিক্ট চেক সক্রিয়: একই পিরিয়ডে একই শিক্ষক, শাখা বা রুম বরাদ্দ করা হলে সাথে সাথে সতর্কতা দেখাবে।',
                'Automatic conflict detection prevents double-booking the same teacher, section, or room in any period.'
              )}
            </p>
          </Card>

          <div className="flex justify-end no-print">
            <Button variant="outline" size="sm" onClick={triggerPrint}>
              <Printer className="w-4 h-4" /> {pick('রুটিন প্রিন্ট করুন', 'Print Timetable')}
            </Button>
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-surface-muted text-muted-foreground">
                <tr>
                  <th className="p-3 border-r border-border text-left">{pick('বার', 'Day')}</th>
                  {periods.map((p) => (
                    <th key={p} className="p-3 text-left">{pick(`${formatNumber(p, 'bn')}ম পিরিয়ড`, `Period ${p}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {days.map((day) => (
                  <tr key={day}>
                    <td className="p-3 border-r border-border font-semibold">
                      <StatusBadge enumName="WeekDay" value={day} />
                    </td>
                    {periods.map((p) => {
                      const slot = db.classRoutines.find(
                        (r) =>
                          r.academicYearId === selectedYear?.id &&
                          r.sectionId === selectedSectionId &&
                          r.day === day &&
                          r.periodNumber === p
                      );
                      const handleDrop = async (e: React.DragEvent) => {
                        e.preventDefault();
                        if (!dragRoutineId) return;
                        try {
                          await moveRoutine({
                            routineId: dragRoutineId,
                            targetDay: day,
                            targetPeriodNumber: p,
                          }).unwrap();
                          toast.success(pick('রুটিন পিরিয়ড সফলভাবে স্থানান্তরিত হয়েছে।', 'Period moved successfully.'));
                        } catch (err) {
                          toast.error((err as { message?: string })?.message ?? 'Conflict detected');
                        } finally {
                          setDragRoutineId(null);
                        }
                      };
                      if (!slot) {
                        return (
                          <td
                            key={p}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="p-3 text-muted-foreground border border-dashed border-transparent hover:border-primary/40 transition-colors"
                          >
                            —
                          </td>
                        );
                      }
                      const ta = db.teacherAssignments.find((x) => x.id === slot.teacherAssignmentId);
                      const cs = ta ? db.classSubjects.find((x) => x.id === ta.classSubjectId) : null;
                      const sub = cs ? db.subjects.find((x) => x.id === cs.subjectId) : null;
                      const st = db.staff.find((x) => x.id === slot.staffId);
                      return (
                        <td
                          key={p}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          className="p-2"
                        >
                          <div
                            draggable
                            onDragStart={() => setDragRoutineId(slot.id)}
                            className="p-2 rounded-lg bg-surface-muted/50 border border-border hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <p className="font-semibold text-foreground">{locale === 'bn' ? sub?.nameBn : sub?.name}</p>
                              <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 no-print" />
                            </div>
                            <p className="text-sm text-muted-foreground">{st?.name}</p>
                            <p className="text-xs text-primary tabular-nums">{formatTime12h(slot.startTime, locale)} · {slot.room}</p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-6">
          {/* Syllabus Upload & Chapter-wise Entry Forms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  {pick('অফিসিয়াল সিলেবাস ফাইল আপলোড (PDF / ছবি)', 'Upload Official Syllabus File (PDF / Image)')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {pick(
                    'আপলোডকৃত ফাইল সাথে সাথে পাবলিক সিলেবাস পেজে ডাউনলোড ও প্রিভিউর জন্য উন্মুক্ত হবে।',
                    'Uploaded PDF or image files become immediately available on the public syllabus page.'
                  )}
                </p>
              </div>
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
                      {db.academicGroups.map((g) => (
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
            </Card>

            <Card className="p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  {pick('অধ্যায়ভিত্তিক সিলেবাস এন্ট্রি যুক্ত করুন', 'Add Chapter-wise Syllabus Row')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {pick(
                    'ওয়েব টেবিলে বিষয়ভিত্তিক নির্ধারিত অধ্যায় ও মানবণ্টন সরাসরি যুক্ত করুন।',
                    'Add subject-wise chapters and marks breakdown directly to the online syllabus table.'
                  )}
                </p>
              </div>
              <form onSubmit={handleAddSyllabusEntry} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={pick('শ্রেণি', 'Class')}>
                    <Select
                      value={syllabusEntryForm.classId}
                      onChange={(e) =>
                        setSyllabusEntryForm({ ...syllabusEntryForm, classId: e.target.value, groupId: '' })
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
                  <FormField label={pick('বিষয়', 'Subject')}>
                    <Select
                      value={syllabusEntryForm.subjectId}
                      onChange={(e) => setSyllabusEntryForm({ ...syllabusEntryForm, subjectId: e.target.value })}
                    >
                      {db.subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.officialCode ? `[${s.officialCode}] ` : ''}
                          {locale === 'bn' ? s.nameBn ?? s.name : s.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  {(db.classes.find((c) => c.id === syllabusEntryForm.classId)?.numericValue ?? 0) >= 9 && (
                    <FormField label={pick('বিভাগ (ঐচ্ছিক)', 'Stream (Optional)')}>
                      <Select
                        value={syllabusEntryForm.groupId}
                        onChange={(e) => setSyllabusEntryForm({ ...syllabusEntryForm, groupId: e.target.value })}
                      >
                        <option value="">{pick('আবশ্যিক (সকল বিভাগ)', 'Compulsory (All)')}</option>
                        {db.academicGroups.map((g) => (
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
            </Card>
          </div>

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
                          <span className="text-xs text-muted-foreground">
                            {pick('ওয়েব সিলেবাস (প্রিন্টযোগ্য)', 'Web Printable')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Existing Academic Policy Documents & Calendar Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3">
              <h3 className="text-base font-bold">{pick('বিদ্যালয় নীতিমালা ও ডকুমেন্ট', 'School Policies & Documents')}</h3>
              {db.academicDocuments.map((d) => (
                <div key={d.id} className="p-3 border border-border rounded space-y-1">
                  <StatusBadge enumName="AcademicDocumentType" value={d.type} />
                  <p className="text-sm font-semibold">{d.title}</p>
                </div>
              ))}
            </Card>
            <Card className="p-5 space-y-3">
              <h3 className="text-base font-bold">{pick('একাডেমিক ক্যালেন্ডার ইভেন্ট', 'Academic Calendar Events')}</h3>
              {db.academicEvents.map((ev) => (
                <div key={ev.id} className="p-3 border border-border rounded flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{ev.title}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">{ev.startDate}</p>
                  </div>
                  <StatusBadge enumName="AcademicEventType" value={ev.eventType} />
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
