'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye, KeyRound, Pencil, Plus, Search, ShieldCheck, ShieldOff, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
import { StaffStatus, StaffType } from '@/src/types/enums';
import type { Staff } from '@/src/types/entities';
import { StaffFormModal } from './StaffFormModal';
import { StaffViewModal } from './StaffViewModal';
import {
  useCreateStaffPortalAccountMutation,
  useDeleteStaffMutation,
  useGetStaffPageQuery,
  useGetStaffStatisticsQuery,
  useToggleStaffPortalAccessMutation,
  type StaffQueryParams,
} from '../api/staff.api';

export type StaffDirectoryKind =
  | 'all'
  | 'teachers'
  | 'officers'
  | 'employees'
  | 'former-teachers';

const PAGE_SIZE = 15;

export function StaffDirectory({
  kind = 'all',
  createOpen = false,
}: {
  kind?: StaffDirectoryKind;
  createOpen?: boolean;
}) {
  const [formOpen, setFormOpen] = useState(createOpen);
  const [editingMember, setEditingMember] = useState<Staff | null>(null);
  const [viewingMember, setViewingMember] = useState<Staff | null>(null);
  const [deletingMember, setDeletingMember] = useState<Staff | null>(null);
  const [filter, setFilter] = useState<StaffDirectoryKind>(kind);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setFilter(kind);
    setPage(1);
  }, [kind]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams: StaffQueryParams = {
    page,
    limit: PAGE_SIZE,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  if (filter === 'teachers') {
    queryParams.staffType = StaffType.TEACHER;
    queryParams.status = StaffStatus.ACTIVE;
  } else if (filter === 'officers') {
    queryParams.staffType = StaffType.OFFICER;
    queryParams.status = StaffStatus.ACTIVE;
  } else if (filter === 'employees') {
    queryParams.staffType = StaffType.EMPLOYEE;
    queryParams.status = StaffStatus.ACTIVE;
  } else if (filter === 'former-teachers') {
    queryParams.staffType = StaffType.TEACHER;
    queryParams.isFormer = true;
  } else if (statusFilter !== 'ALL') {
    queryParams.status = statusFilter;
  }

  const {
    data: pageResult,
    isLoading,
    isFetching,
  } = useGetStaffPageQuery(queryParams);
  const { data: stats } = useGetStaffStatisticsQuery();
  const [deleteStaff, { isLoading: deleting }] = useDeleteStaffMutation();
  const [createPortalAccount, { isLoading: creatingPortal }] = useCreateStaffPortalAccountMutation();
  const [togglePortalAccess, { isLoading: togglingPortal }] = useToggleStaffPortalAccessMutation();

  const handleTogglePortalAccess = async (member: Staff) => {
    const user = (member as any).user as { isActive: boolean } | undefined;
    if (!user) return;
    const nextState = !user.isActive;
    try {
      await togglePortalAccess({ id: member.id, isActive: nextState }).unwrap();
      toast.success(
        nextState
          ? `${member.name}-এর পোর্টাল অ্যাক্সেস চালু হয়েছে।`
          : `${member.name}-এর পোর্টাল অ্যাক্সেস বন্ধ করা হয়েছে।`
      );
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string };
      toast.error(
        e?.data?.message ||
          e?.message ||
          'পোর্টাল অ্যাক্সেস পরিবর্তন করা যায়নি।'
      );
    }
  };

  const handleGrantPortalAccess = async (member: Staff) => {
    try {
      await createPortalAccount({
        id: member.id,
        portalRole: member.staffType === StaffType.OFFICER ? 'ACCOUNTANT' : 'TEACHER',
      }).unwrap();
      toast.success(
        `${member.name}-এর জন্য পোর্টাল লগইন অ্যাকাউন্ট তৈরি হয়েছে।`
      );
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string };
      toast.error(
        e?.data?.message ||
          e?.message ||
          'পোর্টাল অ্যাকাউন্ট তৈরি করা যায়নি।'
      );
    }
  };

  const confirmDelete = async () => {
    if (!deletingMember) return;
    try {
      await deleteStaff(deletingMember.id).unwrap();
      toast.success('স্টাফ সদস্য সফলভাবে মুছে ফেলা হয়েছে।');
      setDeletingMember(null);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string };
      toast.error(e?.data?.message || e?.message || 'মুছে ফেলা যায়নি।');
    }
  };

  const rows = pageResult?.items ?? [];
  const meta = pageResult?.meta;

  const activeTeachers = stats?.activeTeachers ?? 0;
  const activeOfficers = stats?.activeOfficers ?? 0;
  const activeEmployees = stats?.activeEmployees ?? 0;
  const formerTeachers = stats?.formerTeachers ?? 0;
  const tabs: Array<{ key: StaffDirectoryKind; label: string }> = [
    { key: 'all', label: 'সকল স্টাফ' },
    { key: 'teachers', label: 'শিক্ষক' },
    { key: 'officers', label: 'কর্মকর্তা' },
    { key: 'employees', label: 'কর্মচারী' },
    { key: 'former-teachers', label: 'প্রাক্তন শিক্ষকবৃন্দ' },
  ];

  const defaultCreateType =
    filter === 'officers'
      ? StaffType.OFFICER
      : filter === 'employees'
        ? StaffType.EMPLOYEE
        : StaffType.TEACHER;

  const openCreate = () => {
    setEditingMember(null);
    setFormOpen(true);
  };

  const openEdit = (member: Staff) => {
    setEditingMember(member);
    setFormOpen(true);
  };

  const numLocale = 'bn';

  return (
    <div className="space-y-5">
      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'বর্তমান শিক্ষক'}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">
            {formatNumber(activeTeachers, numLocale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'কর্মকর্তা'}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(activeOfficers, numLocale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'কর্মচারী'}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(activeEmployees, numLocale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'প্রাক্তন শিক্ষকবৃন্দ'}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums mt-1">
            {formatNumber(formerTeachers, numLocale)}
          </p>
        </Card>
      </div>

      {/* Category Filter Tabs + Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-surface p-1.5">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilter(tab.key);
                  setPage(1);
                }}
                className={`inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted/60'
                }`}
              >
                <span className="leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span>{'নতুন স্টাফ'}</span>
        </Button>
      </div>

      {/* Backend Search & Status Filter Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={'নাম, আইডি, পদবি বা মোবাইল দিয়ে খুঁজুন...'}
            className="pl-10 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {filter === 'all' && (
          <Select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48"
          >
            <option value="ALL">{'সকল অবস্থা'}</option>
            <option value={StaffStatus.ACTIVE}>{'কর্মরত'}</option>
            <option value={StaffStatus.RETIRED}>{'অবসরপ্রাপ্ত'}</option>
            <option value={StaffStatus.RESIGNED}>{'পদত্যাগকৃত'}</option>
            <option value={StaffStatus.TRANSFERRED}>{'বদলিজনিত'}</option>
            <option value={StaffStatus.TERMINATED}>{'অব্যাহতিপ্রাপ্ত'}</option>
          </Select>
        )}
      </Card>

      {/* Responsive Horizontally Scrollable Table */}
      <Card className="overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[700px] lg:min-w-full text-base">
            <thead className="bg-surface-muted text-sm text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3.5 text-left whitespace-nowrap">{'আইডি'}</th>
                <th className="p-3.5 text-left whitespace-nowrap">{'নাম ও পদবি'}</th>
                <th className="p-3.5 text-left whitespace-nowrap">{'মোবাইল'}</th>
                <th className="p-3.5 text-left whitespace-nowrap">{'ধরন'}</th>
                <th className="p-3.5 text-left whitespace-nowrap">
                  {filter === 'former-teachers'
                    ? 'বিদায় / অবসরের তারিখ'
                    : 'নিয়োগ'}
                </th>
                <th className="p-3.5 text-left whitespace-nowrap">{'অবস্থা'}</th>
                <th className="p-3.5 text-right whitespace-nowrap">{'কার্যক্রম'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-border ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-base text-muted-foreground">
                    {'তথ্য লোড হচ্ছে...'}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="w-8 h-8 opacity-50" />
                      <p className="text-base font-medium text-foreground">
                        {'কোনো স্টাফ পাওয়া যায়নি'}
                      </p>
                      <p className="text-sm">
                        {debouncedSearch
                          ? 'অনুসন্ধানের শব্দ পরিবর্তন করে আবার চেষ্টা করুন।'
                          : 'নতুন স্টাফ যুক্ত করতে "নতুন স্টাফ" বাটনে ক্লিক করুন।'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="p-3.5 font-mono text-sm text-muted-foreground whitespace-nowrap">
                      {member.employeeId || '—'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewingMember(member)}
                        className="group text-left cursor-pointer"
                      >
                        <span className="text-base font-semibold text-primary group-hover:underline block">
                          {member.nameBn || member.name}
                        </span>
                        <span className="block text-sm font-normal text-muted-foreground">
                          {member.designation}
                        </span>
                      </button>
                    </td>
                    <td className="p-3.5 text-base text-muted-foreground whitespace-nowrap">
                      <span className="tabular-nums">{member.phone || '—'}</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <StatusBadge enumName="StaffType" value={member.staffType} />
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {filter === 'former-teachers' ? (
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {member.leavingDate
                            ? formatDateShort(member.leavingDate, numLocale)
                            : '—'}
                        </span>
                      ) : (
                        <StatusBadge enumName="EmploymentType" value={member.employmentType} />
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge enumName="StaffStatus" value={member.status} />
                        {(member as any).user ? (
                          <span
                            className={`text-sm font-medium ${
                              !(member as any).user.isActive
                                ? 'text-destructive'
                                : (member as any).user.mustSetPassword
                                  ? 'text-amber-700 dark:text-amber-300'
                                  : 'text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {!(member as any).user.isActive
                              ? 'পোর্টাল: বন্ধ রয়েছে'
                              : (member as any).user.mustSetPassword
                                ? 'পোর্টাল: পাসওয়ার্ড বাকি'
                                : 'পোর্টাল: সক্রিয়'}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {(member as any).user ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={togglingPortal}
                            onClick={() => handleTogglePortalAccess(member)}
                            title={
                              (member as any).user.isActive
                                ? 'পোর্টাল অ্যাক্সেস বন্ধ করুন'
                                : 'পোর্টাল অ্যাক্সেস চালু করুন'
                            }
                          >
                            {(member as any).user.isActive ? (
                              <ShieldOff className="w-4 h-4 text-amber-600" />
                            ) : (
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            )}
                          </Button>
                        ) : (
                          !(member as any).userId &&
                          member.status === StaffStatus.ACTIVE &&
                          (member.email || member.phone) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={creatingPortal}
                              onClick={() => handleGrantPortalAccess(member)}
                              title={'পোর্টাল অ্যাক্সেস দিন'}
                            >
                              <KeyRound className="w-4 h-4 text-emerald-600" />
                            </Button>
                          )
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingMember(member)}
                          title={'বিস্তারিত দেখুন'}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(member)}
                          title={'সম্পাদনা করুন'}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={deleting}
                          onClick={() => setDeletingMember(member)}
                          className="text-destructive hover:text-destructive"
                          title={'মুছে ফেলুন'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Backend Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border bg-surface-muted/30">
            <p className="text-sm text-muted-foreground">
              {`মোট ${formatNumber(meta.total, 'bn')} জনের মধ্যে পৃষ্ঠা ${formatNumber(meta.page, 'bn')} / ${formatNumber(meta.totalPages, 'bn')}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!meta.hasPreviousPage || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {'পূর্ববর্তী'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!meta.hasNextPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                {'পরবর্তী'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Staff Details Modal */}
      <StaffViewModal
        open={Boolean(viewingMember)}
        onClose={() => setViewingMember(null)}
        member={viewingMember}
        onEdit={(m) => openEdit(m)}
      />

      {/* Create / Edit Staff Modal */}
      <StaffFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMember(null);
        }}
        member={editingMember}
        defaultType={defaultCreateType}
      />

      {/* Centered Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingMember)}
        onClose={() => !deleting && setDeletingMember(null)}
        title={'স্টাফ সদস্য মুছে ফেলুন'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-destructive/25 bg-destructive/5">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {`আপনি কি নিশ্চিতভাবে "${deletingMember?.nameBn || deletingMember?.name || ''}"-কে মুছে ফেলতে চান?`}
              </p>
              <p className="text-sm text-muted-foreground">
                {'এই স্টাফের প্রোফাইল এবং আপলোডকৃত প্রোফাইল ছবি স্টোরেজ থেকে স্থায়ীভাবে মুছে যাবে। (ক্লাস রুটিন বা বিষয় বণ্টন থাকলে ডিলিট হবে না; তখন স্ট্যাটাস পরিবর্তন করুন।)'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeletingMember(null)}
            >
              {'বাতিল'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? 'মুছে ফেলা হচ্ছে...' : 'মুছে ফেলুন'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
