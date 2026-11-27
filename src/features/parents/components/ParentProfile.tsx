'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber } from '@/src/lib/formatters';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { Button, Card, Modal } from '@/src/components/ui/primitives';
import { RelationshipType } from '@/src/types/enums';
import {
  useCreateParentPortalAccountMutation,
  useGetParentByIdQuery,
  useRemoveParentMutation,
  useToggleParentPortalAccessMutation,
  type ParentChildLink,
} from '../api/parents.api';
import { shownPhone, ParentFormModal } from './ParentFormModal';
import { ParentLinkEditModal } from './ParentLinkModal';

function relationLabel(value: string) {
  if (value === RelationshipType.FATHER) return 'পিতা';
  if (value === RelationshipType.MOTHER) return 'মাতা';
  if (value === RelationshipType.GUARDIAN) return 'অভিভাবক';
  return 'অন্যান্য';
}

function errorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { message?: string }; message?: string };
  return e?.data?.message || e?.message || fallback;
}

export function ParentProfile({ parentId }: { parentId: string }) {
  const router = useRouter();
  const { data: parent, isLoading } = useGetParentByIdQuery(parentId, {
    skip: !parentId,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [portalConfirmOpen, setPortalConfirmOpen] = useState(false);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ParentChildLink | null>(null);

  const [removeParent, { isLoading: removing }] = useRemoveParentMutation();
  const [createPortalAccount, { isLoading: provisioning }] =
    useCreateParentPortalAccountMutation();
  const [togglePortalAccess, { isLoading: toggling }] =
    useToggleParentPortalAccessMutation();

  if (isLoading) return <LoadingSkeleton />;
  if (!parent) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-base font-medium text-muted-foreground">
          {'অভিভাবক পাওয়া যায়নি।'}
        </p>
        <Link href="/admin/parents">
          <Button size="sm" variant="outline">
            <ArrowLeft className="w-4 h-4" />
            <span>{'অভিভাবক তালিকায় ফিরুন'}</span>
          </Button>
        </Link>
      </Card>
    );
  }

  const children = parent.children ?? [];
  const hasContact = Boolean(shownPhone(parent.phone) || parent.email);
  const numLocale = 'bn';
  const portalIsActive = Boolean(parent.user?.isActive);

  const confirmDelete = async () => {
    try {
      await removeParent({ id: parent.id }).unwrap();
      toast.success('অভিভাবক প্রোফাইল মুছে ফেলা হয়েছে।');
      setDeleteConfirmOpen(false);
      router.push('/admin/parents');
    } catch (err) {
      toast.error(errorMessage(err, 'মুছা যায়নি।'));
    }
  };

  const confirmGrantPortal = async () => {
    try {
      await createPortalAccount(parent.id).unwrap();
      toast.success(
        'অভিভাবকের পোর্টাল লগইন অ্যাকাউন্ট তৈরি হয়েছে।'
      );
      setPortalConfirmOpen(false);
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          'পোর্টাল অ্যাকাউন্ট তৈরি করা যায়নি।'
        )
      );
    }
  };

  const confirmTogglePortal = async () => {
    try {
      const nextState = !portalIsActive;
      await togglePortalAccess({ id: parent.id, isActive: nextState }).unwrap();
      toast.success(
        nextState
          ? 'পোর্টাল অ্যাক্সেস চালু করা হয়েছে।'
          : 'পোর্টাল অ্যাক্সেস বন্ধ করা হয়েছে।'
      );
      setToggleConfirmOpen(false);
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          'পোর্টাল অ্যাক্সেস পরিবর্তন করা যায়নি।'
        )
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Subtle Top Back Navigation */}
      <div>
        <Link
          href="/admin/parents"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{'অভিভাবক তালিকায় ফিরুন'}</span>
        </Link>
      </div>

      {/* Header Card with Clear Actions */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {parent.nameBn || parent.name}
              </h2>
              {parent.user ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    !parent.user.isActive
                      ? 'bg-destructive/10 text-destructive border border-destructive/25'
                      : parent.user.mustSetPassword
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                  }`}
                >
                  {parent.user.isActive ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldOff className="w-3.5 h-3.5" />
                  )}
                  {!parent.user.isActive
                    ? 'পোর্টাল: বন্ধ রয়েছে'
                    : parent.user.mustSetPassword
                      ? 'পোর্টাল: পাসওয়ার্ড সেট বাকি'
                      : 'পোর্টাল: সক্রিয়'}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border">
                  {'পোর্টাল অ্যাকাউন্ট নেই'}
                </span>
              )}
            </div>
            <p className="text-base text-muted-foreground">
              {parent.name}
              {shownPhone(parent.phone) ? ` · ${shownPhone(parent.phone)}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!parent.userId && hasContact && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPortalConfirmOpen(true)}
              >
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>{'পোর্টাল অ্যাক্সেস দিন'}</span>
              </Button>
            )}
            {parent.user && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setToggleConfirmOpen(true)}
                className={
                  portalIsActive
                    ? 'text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/5'
                    : 'text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/5'
                }
              >
                {portalIsActive ? (
                  <>
                    <ShieldOff className="w-4 h-4" />
                    <span>{'পোর্টাল বন্ধ করুন'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{'পোর্টাল চালু করুন'}</span>
                  </>
                )}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4" />
              <span>{'তথ্য সম্পাদনা'}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={children.length > 0}
              onClick={() => setDeleteConfirmOpen(true)}
              className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5 disabled:opacity-50"
              title={
                children.length > 0
                  ? 'সন্তান যুক্ত থাকা অবস্থায় প্রোফাইল মুছা যাবে না'
                  : 'অভিভাবক প্রোফাইল মুছুন'
              }
            >
              <Trash2 className="w-4 h-4" />
              <span>{'প্রোফাইল মুছুন'}</span>
            </Button>
          </div>
        </div>

        {/* Structured Info Grid (16px values, 14px labels) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-5 mt-5 border-t border-border">
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{'মোবাইল নম্বর'}</p>
              <p className="text-base font-medium font-mono tabular-nums text-foreground">
                {shownPhone(parent.phone) || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{'ইমেইল'}</p>
              <p className="text-base font-medium break-all text-foreground">{parent.email || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{'জাতীয় পরিচয়পত্র (NID)'}</p>
              <p className="text-base font-medium font-mono tabular-nums text-foreground">{parent.nid || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Briefcase className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{'পেশা ও মাসিক আয়'}</p>
              <p className="text-base font-medium text-foreground">
                {parent.occupation || '—'}
                {parent.monthlyIncome != null
                  ? ` (${formatNumber(parent.monthlyIncome, numLocale)} ৳)`
                  : ''}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:col-span-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{'ঠিকানা'}</p>
              <p className="text-base font-medium text-foreground">{parent.address || '—'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Linked Children & Roles Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {'যুক্ত শিক্ষার্থী ও যোগাযোগের ভূমিকা'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {'কোন সন্তানের জন্য প্রাথমিক অভিভাবক, জরুরি যোগাযোগ বা SMS প্রাপক হবেন তা এখান থেকে নির্ধারণ করুন।'}
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            {`মোট ${formatNumber(children.length, numLocale)} জন`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-surface-muted/60 text-muted-foreground text-sm font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">{'সন্তান'}</th>
                <th className="px-4 py-3 text-left">{'শ্রেণি / শাখা'}</th>
                <th className="px-4 py-3 text-left">{'সম্পর্ক'}</th>
                <th className="px-4 py-3 text-center">{'প্রাথমিক'}</th>
                <th className="px-4 py-3 text-center">{'জরুরি'}</th>
                <th className="px-4 py-3 text-center">SMS</th>
                <th className="px-4 py-3 text-right">{'অ্যাকশন'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-base">
              {children.map((link) => (
                <tr key={link.mappingId} className="hover:bg-surface-muted/30">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/students/${link.studentId}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {link.studentNameBn || link.studentNameEn}
                    </Link>
                    <span className="block text-sm text-muted-foreground font-mono">
                      {link.studentCustomId || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {link.currentClass
                      ? `${link.currentClass}${link.currentSection ? ` (${link.currentSection})` : ''}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3.5 font-medium">
                    {relationLabel(link.relationship)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {link.isPrimary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {'হ্যাঁ'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {link.isEmergencyContact ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {'হ্যাঁ'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {link.isSmsReceiver ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {'হ্যাঁ'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingLink(link)}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{'ভূমিকা পরিবর্তন'}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!children.length && (
            <p className="p-6 text-center text-base text-muted-foreground">
              {'এখনো কোনো সন্তান যুক্ত নেই।'}
            </p>
          )}
        </div>
      </Card>

      {/* Edit Profile Modal */}
      <ParentFormModal open={editOpen} onClose={() => setEditOpen(false)} parent={parent} />

      {/* Edit Child Link Roles Modal */}
      <ParentLinkEditModal link={editingLink} onClose={() => setEditingLink(null)} />

      {/* Portal Access Grant Confirmation Modal */}
      <Modal
        open={portalConfirmOpen}
        onClose={() => setPortalConfirmOpen(false)}
        title={'পোর্টাল অ্যাক্সেস নিশ্চিতকরণ'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm">
            <KeyRound className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {`"${parent.nameBn || parent.name}"-এর জন্য পোর্টাল লগইন চালু করবেন?`}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {'কোনো পাসওয়ার্ড দিতে হবে না। প্রথমবার মোবাইল নম্বর বা ইমেইল দিয়ে লগইন করার সময় অভিভাবক নিজেই ওটিপি যাচাই করে পাসওয়ার্ড সেট করতে পারবেন।'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPortalConfirmOpen(false)}
            >
              {'বাতিল'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={provisioning}
              onClick={confirmGrantPortal}
            >
              {provisioning
                ? 'তৈরি হচ্ছে...'
                : 'হ্যাঁ, অ্যাক্সেস দিন'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Portal Access Enable/Disable Confirmation Modal */}
      <Modal
        open={toggleConfirmOpen}
        onClose={() => setToggleConfirmOpen(false)}
        title={
          portalIsActive
            ? 'পোর্টাল অ্যাক্সেস বন্ধ করুন'
            : 'পোর্টাল অ্যাক্সেস চালু করুন'
        }
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              portalIsActive
                ? 'border-amber-500/25 bg-amber-500/5'
                : 'border-emerald-500/25 bg-emerald-500/5'
            }`}
          >
            {portalIsActive ? (
              <ShieldOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {portalIsActive
                  ? `"${parent.nameBn || parent.name}"-এর পোর্টাল অ্যাক্সেস বন্ধ করবেন?`
                  : `"${parent.nameBn || parent.name}"-এর পোর্টাল অ্যাক্সেস পুনরায় চালু করবেন?`}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {portalIsActive
                  ? 'বন্ধ করলে তিনি আর পোর্টালে লগইন করতে পারবেন না এবং বর্তমান সব সক্রিয় সেশন বাতিল হয়ে যাবে।'
                  : 'চালু করলে তিনি আবার পোর্টালে লগইন করে সন্তানের তথ্য দেখতে পারবেন।'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setToggleConfirmOpen(false)}
            >
              {'বাতিল'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={toggling}
              onClick={confirmTogglePortal}
            >
              {toggling
                ? 'হালনাগাদ হচ্ছে...'
                : portalIsActive
                  ? 'হ্যাঁ, বন্ধ করুন'
                  : 'হ্যাঁ, চালু করুন'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={'অভিভাবক প্রোফাইল মুছে ফেলা'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {`আপনি কি নিশ্চিত যে "${parent.nameBn || parent.name}"-এর প্রোফাইল স্থায়ীভাবে মুছে ফেলতে চান?`}
              </p>
              <p className="text-sm text-muted-foreground">
                {'মুছে ফেলার পর এই তথ্য আর পুনরুদ্ধার করা যাবে না।'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              {'বাতিল'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={removing}
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {removing
                ? 'মুছে ফেলা হচ্ছে...'
                : 'হ্যাঁ, মুছে ফেলুন'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
