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

