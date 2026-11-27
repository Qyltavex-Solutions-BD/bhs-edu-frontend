'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
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
          ? `${parent.nameBn || parent.name}-এর পোর্টাল অ্যাক্সেস চালু হয়েছে।`
          : `${parent.nameBn || parent.name}-এর পোর্টাল অ্যাক্সেস বন্ধ করা হয়েছে।`
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
        `${parent.nameBn || parent.name}-এর জন্য পোর্টাল লগইন অ্যাকাউন্ট তৈরি হয়েছে।`
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
  const numLocale = 'bn';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'মোট নিবন্ধিত অভিভাবক'}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(stats.totalParents, numLocale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'সংযুক্ত সক্রিয় শিক্ষার্থী'}
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
            {'সক্রিয় SMS প্রাপক সংযোগ'}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">
            {formatNumber(stats.activeSmsLinks, numLocale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {'অসম্পূর্ণ কভারেজ'}
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
        searchPlaceholder={'নাম, মোবাইল বা এনআইডি দিয়ে খুঁজুন...'}
        emptyTitle={'কোনো অভিভাবক পাওয়া যায়নি'}
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
            aria-label={'পোর্টাল স্ট্যাটাস ফিল্টার'}
            value={portalStatus}
            onChange={(e) => {
              setPortalStatus(e.target.value as 'ALL' | 'ACTIVE' | 'PENDING' | 'NONE');
              setPage(1);
            }}
            className="h-9 text-sm w-44"
          >
            <option value="ALL">{'সকল পোর্টাল স্ট্যাটাস'}</option>
            <option value="ACTIVE">{'পোর্টাল: সক্রিয়'}</option>
            <option value="PENDING">{'পাসওয়ার্ড বাকি'}</option>
            <option value="NONE">{'অ্যাকাউন্ট নেই'}</option>
          </Select>
        }
        columns={[
          {
            accessorKey: 'name',
            header: 'নাম',
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
            header: 'মোবাইল',
            cell: ({ row }) => (
              <span className="font-mono text-sm tabular-nums">
                {shownPhone(row.original.phone) || '—'}
              </span>
            ),
          },
          {
            accessorKey: 'occupation',
            header: 'পেশা',
            cell: ({ row }) => row.original.occupation || '—',
          },
          {
            accessorKey: 'childrenSummary',
            header: 'সন্তান',
            enableSorting: false,
            cell: ({ row }) => row.original.childrenSummary || '—',
          },
          {
            accessorKey: 'smsCount',
            header: 'SMS সংযোগ',
            enableSorting: false,
            cell: ({ row }) => (
              <span className="tabular-nums font-medium">
                {formatNumber(row.original.smsCount, numLocale)}
              </span>
            ),
          },
          {
            id: 'portal',
            header: 'পোর্টাল অ্যাক্সেস',
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
                        ? 'বন্ধ রয়েছে'
                        : p.user.mustSetPassword
                          ? 'পাসওয়ার্ড বাকি'
                          : 'সক্রিয়'}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={togglingPortal || isFetching}
                      onClick={() => handleTogglePortal(p)}
                      title={
                        p.user.isActive
                          ? 'পোর্টাল অ্যাক্সেস বন্ধ করুন'
                          : 'পোর্টাল অ্যাক্সেস চালু করুন'
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
                    {'নম্বর/ইমেইল নেই'}
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
                  <span>{'অ্যাক্সেস দিন'}</span>
                </Button>
              );
            },
          },
        ]}
      />
    </div>
  );
}
