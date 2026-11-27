'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Plus,
  Search,
  ShieldBan,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from '@/src/lib/navigation';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
} from '@/src/components/ui/primitives';
import {
  useCreateUserMutation,
  useGetUserByIdQuery,
  useGetUsersQuery,
  useResetUserPasswordMutation,
  useUpdateUserStatusMutation,
  type PortalUserItem,
} from '../api/access-control.api';
import { AdminAuditLogsPage } from './AdminAuditLogsPage';

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'অ্যাডমিন (ADMIN)',
  TEACHER: 'শিক্ষক (TEACHER)',
  PARENT: 'অভিভাবক (PARENT)',
  ACCOUNTANT: 'হিসাবরক্ষক (ACCOUNTANT)',
};

function apiError(err: unknown, fallback: string): string {
  const e = err as { message?: string; data?: { message?: string } } | null | undefined;
  return e?.data?.message || e?.message || fallback;
}

export function AdminUsersPage({
  defaultTab = 'users',
}: {
  defaultTab?: 'users' | 'roles' | 'permissions' | 'audit';
}) {
  if (defaultTab === 'audit') {
    return <AdminAuditLogsPage />;
  }

  const { id: userIdParam } = useParams<{ id?: string }>();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    roleName: 'ACCOUNTANT' as 'ADMIN' | 'ACCOUNTANT',
  });

  const [resetTarget, setResetTarget] = useState<PortalUserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data: selectedUser } = useGetUserByIdQuery(userIdParam ?? '', {
    skip: !userIdParam,
  });

  const { data, isLoading, isFetching } = useGetUsersQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    role: roleFilter || undefined,
    status: statusFilter,
  });

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateStatus, { isLoading: toggling }] = useUpdateUserStatusMutation();
  const [resetPassword, { isLoading: resetting }] = useResetUserPasswordMutation();

  if (isLoading) return <LoadingSkeleton />;

  const items = data?.items ?? [];
  const meta = data?.meta;

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.phone.trim() || createForm.password.length < 6) {
      toast.error('নাম, মোবাইল নম্বর এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।');
      return;
    }
    try {
      await createUser({
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        email: createForm.email.trim() || undefined,
        password: createForm.password,
        roleName: createForm.roleName,
      }).unwrap();
      toast.success('নতুন ব্যবহারকারী তৈরি হয়েছে।');
      setCreateOpen(false);
      setCreateForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        roleName: 'ACCOUNTANT',
      });
    } catch (err) {
      toast.error(apiError(err, 'ব্যবহারকারী তৈরি ব্যর্থ হয়েছে।'));
    }
  }

  async function handleToggleStatus(user: PortalUserItem) {
    try {
      await updateStatus({ id: user.id, isActive: !user.isActive }).unwrap();
      toast.success(
        !user.isActive ? 'ব্যবহারকারী সক্রিয় করা হয়েছে।' : 'ব্যবহারকারী ব্লক করা হয়েছে।'
      );
    } catch (err) {
      toast.error(apiError(err, 'স্ট্যাটাস পরিবর্তন করা যায়নি।'));
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget || newPassword.length < 6) {
      toast.error('কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড দিন।');
      return;
    }
    try {
      await resetPassword({ id: resetTarget.id, newPassword }).unwrap();
      toast.success('পাসওয়ার্ড সফলভাবে রিসেট হয়েছে।');
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      toast.error(apiError(err, 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।'));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ব্যবহারকারী ও অ্যাক্সেস নিয়ন্ত্রণ"
        description="পোর্টাল ব্যবহারকারীদের লগইন সক্রিয়/ব্লক করা, পাসওয়ার্ড রিসেট এবং অ্যাডমিন বা হিসাবরক্ষক অ্যাকাউন্ট তৈরি করুন।"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {'নতুন ব্যবহারকারী'}
          </Button>
        }
      />

      {selectedUser && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-base font-bold text-foreground">{selectedUser.name}</p>
            <p className="text-sm text-muted-foreground">
              {selectedUser.email ?? '—'} · {selectedUser.phone} ·{' '}
              {selectedUser.roles.map((r) => r.name).join(', ')}
            </p>
          </div>
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              {'সব ব্যবহারকারী'}
            </Button>
          </Link>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-1 gap-3 border-b border-border/70 px-5 py-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="নাম, ইমেইল বা ফোন খুঁজুন..."
              className="pl-9"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{'সকল রোল'}</option>
            <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
            <option value="TEACHER">{ROLE_LABELS.TEACHER}</option>
            <option value="PARENT">{ROLE_LABELS.PARENT}</option>
            <option value="ACCOUNTANT">{ROLE_LABELS.ACCOUNTANT}</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
          >
            <option value="ALL">{'সকল অবস্থা'}</option>
            <option value="ACTIVE">{'সক্রিয় (Active)'}</option>
            <option value="INACTIVE">{'ব্লক / নিষ্ক্রিয় (Blocked)'}</option>
          </Select>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="কোনো ব্যবহারকারী পাওয়া যায়নি"
            description="ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{'নাম'}</th>
                  <th className="px-4 py-3">{'মোবাইল ও ইমেইল'}</th>
                  <th className="px-4 py-3">{'রোল'}</th>
                  <th className="px-4 py-3">{'অবস্থা'}</th>
                  <th className="px-4 py-3 text-right">{'অ্যাকশন'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {u.name}
                      </Link>
                      {u.mustSetPassword && (
                        <div className="mt-0.5 text-xs text-warning">
                          {'প্রথম লগইনে পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                      <div className="font-mono text-foreground">{u.phone}</div>
                      <div>{u.email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.map((r) => (
                          <span
                            key={r.id}
                            className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
                          u.isActive
                            ? 'border-success/20 bg-success/10 text-success'
                            : 'border-destructive/20 bg-destructive/10 text-destructive'
                        }`}
                      >
                        {u.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setResetTarget(u);
                            setNewPassword('');
                          }}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          {'পাসওয়ার্ড'}
                        </Button>
                        <Button
                          size="sm"
                          variant={u.isActive ? 'destructive' : 'outline'}
                          disabled={toggling}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.isActive ? (
                            <>
                              <ShieldBan className="h-3.5 w-3.5" />
                              {'ব্লক'}
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5 text-success" />
                              {'সক্রিয়'}
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-4 py-3 text-sm text-muted-foreground">
            <span>
              {isFetching
                ? 'লোড হচ্ছে...'
                : `মোট ${meta.total}টির মধ্যে ${(meta.page - 1) * meta.limit + 1}–${Math.min(
                    meta.page * meta.limit,
                    meta.total
                  )} প্রদর্শিত হচ্ছে`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                {'পূর্ববর্তী'}
              </Button>
              <span className="px-2 font-medium text-foreground">
                {meta.page} / {Math.max(1, meta.totalPages)}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                {'পরবর্তী'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="নতুন পোর্টাল ব্যবহারকারী তৈরি করুন"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{'নাম *'}</label>
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="যেমন: মোঃ করিম উদ্দিন"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{'মোবাইল নম্বর *'}</label>
              <Input
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="01711000099"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{'ইমেইল (ঐচ্ছিক)'}</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="accountant@bhs.edu.bd"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{'রোল *'}</label>
              <Select
                value={createForm.roleName}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    roleName: e.target.value as typeof createForm.roleName,
                  })
                }
              >
                <option value="ACCOUNTANT">{ROLE_LABELS.ACCOUNTANT}</option>
                <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                {'শিক্ষক (TEACHER) স্টাফ মডিউল থেকে এবং অভিভাবক (PARENT) শিক্ষার্থী ভর্তি মডিউল থেকে তৈরি হবে।'}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{'প্রাথমিক পাসওয়ার্ড *'}</label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="কমপক্ষে ৬ অক্ষর"
                minLength={6}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/70 pt-3">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={resetTarget ? `${resetTarget.name} — পাসওয়ার্ড রিসেট` : ''}
        size="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{'নতুন অস্থায়ী পাসওয়ার্ড *'}</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="কমপক্ষে ৬ অক্ষর"
              minLength={6}
              required
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/70 pt-3">
            <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>
              {'বাতিল'}
            </Button>
            <Button type="submit" disabled={resetting}>
              {resetting ? 'রিসেট হচ্ছে...' : 'রিসেট করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
