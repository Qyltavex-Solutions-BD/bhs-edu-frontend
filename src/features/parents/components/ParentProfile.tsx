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
import { useI18n } from '@/src/lib/i18n';
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

function relationLabel(value: string, pick: (bn: string, en: string) => string) {
  if (value === RelationshipType.FATHER) return pick('পিতা', 'Father');
  if (value === RelationshipType.MOTHER) return pick('মাতা', 'Mother');
  if (value === RelationshipType.GUARDIAN) return pick('অভিভাবক', 'Guardian');
  return pick('অন্যান্য', 'Other');
}

function errorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { message?: string }; message?: string };
  return e?.data?.message || e?.message || fallback;
}

export function ParentProfile({ parentId }: { parentId: string }) {
  const { locale, pick } = useI18n();
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
          {pick('অভিভাবক পাওয়া যায়নি।', 'Guardian was not found.')}
        </p>
        <Link href="/admin/parents">
          <Button size="sm" variant="outline">
            <ArrowLeft className="w-4 h-4" />
            <span>{pick('অভিভাবক তালিকায় ফিরুন', 'Back to Guardian List')}</span>
          </Button>
        </Link>
      </Card>
    );
  }

  const children = parent.children ?? [];
  const hasContact = Boolean(shownPhone(parent.phone) || parent.email);
  const numLocale = locale === 'bn' ? 'bn' : 'en';
  const portalIsActive = Boolean(parent.user?.isActive);

  const confirmDelete = async () => {
    try {
      await removeParent({ id: parent.id }).unwrap();
      toast.success(pick('অভিভাবক প্রোফাইল মুছে ফেলা হয়েছে।', 'Profile removed.'));
      setDeleteConfirmOpen(false);
      router.push('/admin/parents');
    } catch (err) {
      toast.error(errorMessage(err, pick('মুছা যায়নি।', 'Could not remove the profile.')));
    }
  };

  const confirmGrantPortal = async () => {
    try {
      await createPortalAccount(parent.id).unwrap();
      toast.success(
        pick(
          'অভিভাবকের পোর্টাল লগইন অ্যাকাউন্ট তৈরি হয়েছে।',
          'Guardian portal account created.'
        )
      );
      setPortalConfirmOpen(false);
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          pick('পোর্টাল অ্যাকাউন্ট তৈরি করা যায়নি।', 'Failed to create portal account.')
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
          ? pick('পোর্টাল অ্যাক্সেস চালু করা হয়েছে।', 'Portal access enabled.')
          : pick('পোর্টাল অ্যাক্সেস বন্ধ করা হয়েছে।', 'Portal access disabled.')
      );
      setToggleConfirmOpen(false);
    } catch (err) {
      toast.error(
        errorMessage(
          err,
          pick('পোর্টাল অ্যাক্সেস পরিবর্তন করা যায়নি।', 'Failed to update portal access.')
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
          <span>{pick('অভিভাবক তালিকায় ফিরুন', 'Back to Guardian List')}</span>
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
                    ? pick('পোর্টাল: বন্ধ রয়েছে', 'Portal: Disabled')
                    : parent.user.mustSetPassword
                      ? pick('পোর্টাল: পাসওয়ার্ড সেট বাকি', 'Portal: Pending Setup')
                      : pick('পোর্টাল: সক্রিয়', 'Portal: Active')}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border">
                  {pick('পোর্টাল অ্যাকাউন্ট নেই', 'No Portal Account')}
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
                <span>{pick('পোর্টাল অ্যাক্সেস দিন', 'Grant Portal Access')}</span>
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
                    <span>{pick('পোর্টাল বন্ধ করুন', 'Disable Portal')}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{pick('পোর্টাল চালু করুন', 'Enable Portal')}</span>
                  </>
                )}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4" />
              <span>{pick('তথ্য সম্পাদনা', 'Edit Info')}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={children.length > 0}
              onClick={() => setDeleteConfirmOpen(true)}
              className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5 disabled:opacity-50"
              title={
                children.length > 0
                  ? pick(
                      'সন্তান যুক্ত থাকা অবস্থায় প্রোফাইল মুছা যাবে না',
                      'Cannot delete while children are linked'
                    )
                  : pick('অভিভাবক প্রোফাইল মুছুন', 'Delete Guardian Profile')
              }
            >
              <Trash2 className="w-4 h-4" />
              <span>{pick('প্রোফাইল মুছুন', 'Delete Profile')}</span>
            </Button>
          </div>
        </div>

        {/* Structured Info Grid (16px values, 14px labels) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-5 mt-5 border-t border-border">
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{pick('মোবাইল নম্বর', 'Mobile Number')}</p>
              <p className="text-base font-medium font-mono tabular-nums text-foreground">
                {shownPhone(parent.phone) || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{pick('ইমেইল', 'Email')}</p>
              <p className="text-base font-medium break-all text-foreground">{parent.email || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{pick('জাতীয় পরিচয়পত্র (NID)', 'NID Number')}</p>
              <p className="text-base font-medium font-mono tabular-nums text-foreground">{parent.nid || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Briefcase className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">{pick('পেশা ও মাসিক আয়', 'Occupation & Income')}</p>
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
              <p className="text-sm text-muted-foreground">{pick('ঠিকানা', 'Address')}</p>
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
                {pick('যুক্ত শিক্ষার্থী ও যোগাযোগের ভূমিকা', 'Linked Students & Contact Roles')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {pick(
                  'কোন সন্তানের জন্য প্রাথমিক অভিভাবক, জরুরি যোগাযোগ বা SMS প্রাপক হবেন তা এখান থেকে নির্ধারণ করুন।',
                  'Manage primary guardian, emergency contact, and SMS receiver roles for each linked student.'
                )}
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            {pick(`মোট ${formatNumber(children.length, numLocale)} জন`, `Total ${children.length}`)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-surface-muted/60 text-muted-foreground text-sm font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">{pick('সন্তান', 'Student')}</th>
                <th className="px-4 py-3 text-left">{pick('শ্রেণি / শাখা', 'Class / Section')}</th>
                <th className="px-4 py-3 text-left">{pick('সম্পর্ক', 'Relationship')}</th>
                <th className="px-4 py-3 text-center">{pick('প্রাথমিক', 'Primary')}</th>
                <th className="px-4 py-3 text-center">{pick('জরুরি', 'Emergency')}</th>
                <th className="px-4 py-3 text-center">SMS</th>
                <th className="px-4 py-3 text-right">{pick('অ্যাকশন', 'Action')}</th>
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
                    {relationLabel(link.relationship, pick)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {link.isPrimary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {pick('হ্যাঁ', 'Yes')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {link.isEmergencyContact ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {pick('হ্যাঁ', 'Yes')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {link.isSmsReceiver ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {pick('হ্যাঁ', 'Yes')}
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
                      <span>{pick('ভূমিকা পরিবর্তন', 'Edit Roles')}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!children.length && (
            <p className="p-6 text-center text-base text-muted-foreground">
              {pick('এখনো কোনো সন্তান যুক্ত নেই।', 'No child is linked yet.')}
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
        title={pick('পোর্টাল অ্যাক্সেস নিশ্চিতকরণ', 'Confirm Portal Access')}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm">
            <KeyRound className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {pick(
                  `"${parent.nameBn || parent.name}"-এর জন্য পোর্টাল লগইন চালু করবেন?`,
                  `Enable portal login for "${parent.name}"?`
                )}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pick(
                  'কোনো পাসওয়ার্ড দিতে হবে না। প্রথমবার মোবাইল নম্বর বা ইমেইল দিয়ে লগইন করার সময় অভিভাবক নিজেই ওটিপি যাচাই করে পাসওয়ার্ড সেট করতে পারবেন।',
                  'No temporary password is needed. The guardian will verify an OTP and set their own password on first login.'
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPortalConfirmOpen(false)}
            >
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={provisioning}
              onClick={confirmGrantPortal}
            >
              {provisioning
                ? pick('তৈরি হচ্ছে...', 'Creating...')
                : pick('হ্যাঁ, অ্যাক্সেস দিন', 'Yes, Grant Access')}
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
            ? pick('পোর্টাল অ্যাক্সেস বন্ধ করুন', 'Disable Portal Access')
            : pick('পোর্টাল অ্যাক্সেস চালু করুন', 'Enable Portal Access')
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
                  ? pick(
                      `"${parent.nameBn || parent.name}"-এর পোর্টাল অ্যাক্সেস বন্ধ করবেন?`,
                      `Disable portal access for "${parent.name}"?`
                    )
                  : pick(
                      `"${parent.nameBn || parent.name}"-এর পোর্টাল অ্যাক্সেস পুনরায় চালু করবেন?`,
                      `Re-enable portal access for "${parent.name}"?`
                    )}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {portalIsActive
                  ? pick(
                      'বন্ধ করলে তিনি আর পোর্টালে লগইন করতে পারবেন না এবং বর্তমান সব সক্রিয় সেশন বাতিল হয়ে যাবে।',
                      'They will no longer be able to log in and all active sessions will be revoked.'
                    )
                  : pick(
                      'চালু করলে তিনি আবার পোর্টালে লগইন করে সন্তানের তথ্য দেখতে পারবেন।',
                      'They will be able to log in to the parent portal again.'
                    )}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setToggleConfirmOpen(false)}
            >
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={toggling}
              onClick={confirmTogglePortal}
            >
              {toggling
                ? pick('হালনাগাদ হচ্ছে...', 'Updating...')
                : portalIsActive
                  ? pick('হ্যাঁ, বন্ধ করুন', 'Yes, Disable')
                  : pick('হ্যাঁ, চালু করুন', 'Yes, Enable')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={pick('অভিভাবক প্রোফাইল মুছে ফেলা', 'Delete Guardian Profile')}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {pick(
                  `আপনি কি নিশ্চিত যে "${parent.nameBn || parent.name}"-এর প্রোফাইল স্থায়ীভাবে মুছে ফেলতে চান?`,
                  `Are you sure you want to permanently delete "${parent.name}"?`
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {pick(
                  'মুছে ফেলার পর এই তথ্য আর পুনরুদ্ধার করা যাবে না।',
                  'This action cannot be undone.'
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              {pick('বাতিল', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={removing}
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {removing
                ? pick('মুছে ফেলা হচ্ছে...', 'Deleting...')
                : pick('হ্যাঁ, মুছে ফেলুন', 'Yes, Delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
