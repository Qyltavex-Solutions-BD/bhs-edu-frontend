'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { exportToCsv } from '@/src/lib/utils/cn';
import { DataTable } from '@/src/components/shared/DataTable';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { Button, Card, Select } from '@/src/components/ui/primitives';
import {
  useCreateParentPortalAccountMutation,
  useGetParentsQuery,
  useToggleParentPortalAccessMutation,
  type ParentListItem,
} from '../api/parents.api';
import { shownPhone } from './ParentFormModal';

const PAGE_SIZE = 10;
const SORTABLE_FIELDS = new Set(['name', 'phone', 'occupation']);

export function ParentDirectory() {
  const { locale, pick } = useI18n();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [portalStatus, setPortalStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'NONE'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'phone' | 'occupation'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: pageResult, isLoading, isFetching } = useGetParentsQuery({
    page,
    limit: PAGE_SIZE,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(portalStatus !== 'ALL' ? { portalStatus } : {}),
    sortBy,
    sortOrder,
  });

  const [createPortalAccount, { isLoading: provisioning }] =
    useCreateParentPortalAccountMutation();
  const [togglePortalAccess, { isLoading: togglingPortal }] =
    useToggleParentPortalAccessMutation();

  const handleTogglePortal = async (parent: ParentListItem) => {
    if (!parent.user) return;
    const nextState = !parent.user.isActive;
    try {
      await togglePortalAccess({ id: parent.id, isActive: nextState }).unwrap();
      toast.success(
        nextState
          ? pick(
              `${parent.nameBn || parent.name}-এর পোর্টাল অ্যাক্সেস চালু হয়েছে।`,
              `Portal access enabled for ${parent.name}.`
            )
          : pick(
              `${parent.nameBn || parent.name}-এর পোর্টাল অ্যাক্সেস বন্ধ করা হয়েছে।`,
              `Portal access disabled for ${parent.name}.`
            )
      );
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string };
      toast.error(
        e?.data?.message ||
          e?.message ||
          pick('পোর্টাল অ্যাক্সেস পরিবর্তন করা যায়নি।', 'Could not update portal access.')
      );
    }
  };

  const handleSort = (key: string) => {
    if (!SORTABLE_FIELDS.has(key)) return;
    const typedKey = key as 'name' | 'phone' | 'occupation';
    if (sortBy === typedKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(typedKey);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleGrantPortal = async (parent: ParentListItem) => {
    try {
      await createPortalAccount(parent.id).unwrap();
      toast.success(
        pick(
          `${parent.nameBn || parent.name}-এর জন্য পোর্টাল লগইন অ্যাকাউন্ট তৈরি হয়েছে।`,
          `Portal account created for ${parent.name}.`
        )
      );
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string };
      toast.error(
        e?.data?.message ||
          e?.message ||
          pick('পোর্টাল অ্যাকাউন্ট তৈরি করা যায়নি।', 'Could not create portal account.')
      );
    }
  };

  if (isLoading && !pageResult) {
    return <LoadingSkeleton />;
  }

  const rows = pageResult?.items ?? [];
  const meta = pageResult?.meta;
  const stats = meta?.stats ?? {
    totalParents: meta?.total ?? rows.length,
    linkedActiveStudents: 0,
    totalActiveStudents: 0,
    activeSmsLinks: 0,
    coverageGapCount: 0,
  };
  const numLocale = locale === 'bn' ? 'bn' : 'en';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('মোট নিবন্ধিত অভিভাবক', 'Registered Guardians')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(stats.totalParents, numLocale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('সংযুক্ত সক্রিয় শিক্ষার্থী', 'Linked Active Students')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">
            {formatNumber(stats.linkedActiveStudents, numLocale)}
            <span className="text-sm font-semibold text-muted-foreground">
              {' '}
              / {formatNumber(stats.totalActiveStudents, numLocale)}
            </span>
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('সক্রিয় SMS প্রাপক সংযোগ', 'Active SMS Links')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">
            {formatNumber(stats.activeSmsLinks, numLocale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('অসম্পূর্ণ কভারেজ', 'Coverage Gaps')}
          </p>
          <p
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums mt-1 ${
              stats.coverageGapCount > 0 ? 'text-warning' : 'text-success'
            }`}
          >
            {formatNumber(stats.coverageGapCount, numLocale)}
          </p>
        </Card>
      </div>

      <DataTable
        data={rows}
        isLoading={isFetching && !rows.length}
        exportFilename="guardians.csv"
        searchPlaceholder={pick('নাম, মোবাইল বা এনআইডি দিয়ে খুঁজুন...', 'Search by name, phone, or NID...')}
        emptyTitle={pick('কোনো অভিভাবক পাওয়া যায়নি', 'No guardians found')}
        server={{
          search,
          onSearch: setSearch,
          meta,
          onPage: setPage,
          sortBy,
          sortOrder,
          onSort: handleSort,
          onExport: () =>
            exportToCsv(
              rows.map((r) => ({
                name: r.nameBn || r.name,
                nameEn: r.name,
                phone: shownPhone(r.phone) || '',
                occupation: r.occupation || '',
                children: r.childrenSummary || '',
                smsLinks: r.smsCount,
              })),
              'guardians.csv'
            ),
        }}
        toolbarExtra={
          <Select
            aria-label={pick('পোর্টাল স্ট্যাটাস ফিল্টার', 'Filter by portal status')}
            value={portalStatus}
            onChange={(e) => {
              setPortalStatus(e.target.value as 'ALL' | 'ACTIVE' | 'PENDING' | 'NONE');
              setPage(1);
            }}
            className="h-9 text-sm w-44"
          >
            <option value="ALL">{pick('সকল পোর্টাল স্ট্যাটাস', 'All Portal Status')}</option>
            <option value="ACTIVE">{pick('পোর্টাল: সক্রিয়', 'Portal: Active')}</option>
            <option value="PENDING">{pick('পাসওয়ার্ড বাকি', 'Pending Setup')}</option>
            <option value="NONE">{pick('অ্যাকাউন্ট নেই', 'No Account')}</option>
          </Select>
        }
        columns={[
          {
            accessorKey: 'name',
            header: pick('নাম', 'Name'),
            cell: ({ row }) => (
              <Link
                href={`/admin/parents/${row.original.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {row.original.nameBn || row.original.name}
                <span className="block text-xs font-normal text-muted-foreground">
                  {row.original.name}
                </span>
              </Link>
            ),
          },
          {
            accessorKey: 'phone',
            header: pick('মোবাইল', 'Phone'),
            cell: ({ row }) => (
              <span className="font-mono text-sm tabular-nums">
                {shownPhone(row.original.phone) || '—'}
              </span>
            ),
          },
          {
            accessorKey: 'occupation',
            header: pick('পেশা', 'Occupation'),
            cell: ({ row }) => row.original.occupation || '—',
          },
          {
            accessorKey: 'childrenSummary',
            header: pick('সন্তান', 'Children'),
            enableSorting: false,
            cell: ({ row }) => row.original.childrenSummary || '—',
          },
          {
            accessorKey: 'smsCount',
            header: pick('SMS সংযোগ', 'SMS Links'),
            enableSorting: false,
            cell: ({ row }) => (
              <span className="tabular-nums font-medium">
                {formatNumber(row.original.smsCount, numLocale)}
              </span>
            ),
          },
          {
            id: 'portal',
            header: pick('পোর্টাল অ্যাক্সেস', 'Portal Access'),
            enableSorting: false,
            cell: ({ row }) => {
              const p = row.original;
              if (p.user) {
                return (
                  <div className="inline-flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        !p.user.isActive
                          ? 'text-destructive'
                          : p.user.mustSetPassword
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {!p.user.isActive
                        ? pick('বন্ধ রয়েছে', 'Disabled')
                        : p.user.mustSetPassword
                          ? pick('পাসওয়ার্ড বাকি', 'Pending Setup')
                          : pick('সক্রিয়', 'Active')}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={togglingPortal || isFetching}
                      onClick={() => handleTogglePortal(p)}
                      title={
                        p.user.isActive
                          ? pick('পোর্টাল অ্যাক্সেস বন্ধ করুন', 'Disable Portal Access')
                          : pick('পোর্টাল অ্যাক্সেস চালু করুন', 'Enable Portal Access')
                      }
                    >
                      {p.user.isActive ? (
                        <ShieldOff className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </Button>
                  </div>
                );
              }
              const hasContact = Boolean(shownPhone(p.phone) || p.email);
              if (!hasContact) {
                return (
                  <span className="text-xs text-muted-foreground">
                    {pick('নম্বর/ইমেইল নেই', 'No contact')}
                  </span>
                );
              }
              return (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={provisioning || isFetching}
                  onClick={() => handleGrantPortal(p)}
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{pick('অ্যাক্সেস দিন', 'Grant Access')}</span>
                </Button>
              );
            },
          },
        ]}
      />
    </div>
  );
}
