'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRemoveParentMutation } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { Button, Card } from '@/src/components/ui/primitives';
import { RelationshipType } from '@/src/types/enums';
import { shownPhone, ParentFormModal } from './ParentFormModal';
import { ParentLinkModal, ParentLinkEditModal } from './ParentLinkModal';
import type { MockDatabase } from '@/src/mocks/seed';
import type { ParentStudent } from '@/src/types/entities';

function relationLabel(value: string, pick: (bn: string, en: string) => string) {
  if (value === RelationshipType.FATHER) return pick('পিতা', 'Father');
  if (value === RelationshipType.MOTHER) return pick('মাতা', 'Mother');
  if (value === RelationshipType.GUARDIAN) return pick('অভিভাবক', 'Guardian');
  return pick('অন্যান্য', 'Other');
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message || fallback;
}

export function ParentProfile({ db, parentId }: { db: MockDatabase; parentId: string }) {
  const { pick } = useI18n();
  const parent = db.parents.find((item) => item.id === parentId);
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ParentStudent | null>(null);
  const [removeParent, { isLoading: removing }] = useRemoveParentMutation();
  if (!parent) return <p className="text-sm text-muted-foreground">{pick('অভিভাবক পাওয়া যায়নি।', 'Guardian was not found.')}</p>;

  const links = db.parentStudents.filter((link) => link.parentId === parent.id);

  const remove = async () => {
    try {
      await removeParent({ id: parent.id }).unwrap();
      toast.success(pick('প্রোফাইল মুছে ফেলা হয়েছে।', 'Profile removed.'));
    } catch (err) {
      toast.error(errorMessage(err, pick('মুছা যায়নি।', 'Could not remove the profile.')));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{parent.nameBn || parent.name}</h2>
          <p className="text-sm text-muted-foreground">{parent.name}{shownPhone(parent.phone) ? ` · ${shownPhone(parent.phone)}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>{pick('সম্পাদনা', 'Edit')}</Button>
          <Button size="sm" variant="primary" onClick={() => setLinkOpen(true)}>{pick('সন্তান যোগ', 'Link a child')}</Button>
          <Button size="sm" variant="ghost" disabled={removing || links.length > 0} onClick={remove}>{pick('মুছুন', 'Remove')}</Button>
          <Link href="/admin/parents"><Button size="sm" variant="ghost">{pick('তালিকায়', 'Back to list')}</Button></Link>
        </div>
      </div>
      <Card className="p-4 text-sm space-y-1">
        <p>{pick('এনআইডি', 'NID')}: {parent.nid || '—'}</p>
        <p>{pick('ইমেইল', 'Email')}: {parent.email || '—'}</p>
        <p>{pick('পেশা', 'Occupation')}: {parent.occupation || '—'}</p>
        <p>{pick('ঠিকানা', 'Address')}: {parent.address || '—'}</p>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="p-3 text-left">{pick('সন্তান', 'Child')}</th>
              <th className="p-3 text-left">{pick('সম্পর্ক', 'Relationship')}</th>
              <th className="p-3 text-left">{pick('প্রাথমিক', 'Primary')}</th>
              <th className="p-3 text-left">{pick('জরুরি', 'Emergency')}</th>
              <th className="p-3 text-left">SMS</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {links.map((link) => {
              const student = db.students.find((item) => item.id === link.studentId);
              return (
                <tr key={link.id}>
                  <td className="p-3">
                    <Link href={`/admin/students/${link.studentId}`} className="font-medium text-primary hover:underline">
                      {student?.nameBn || student?.nameEn}
                    </Link>
                    <span className="block text-xs text-muted-foreground font-mono">{student?.studentId}</span>
                  </td>
                  <td className="p-3">{relationLabel(link.relationship, pick)}</td>
                  <td className="p-3">{link.isPrimary ? pick('হ্যাঁ', 'Yes') : '—'}</td>
                  <td className="p-3">{link.isEmergencyContact ? pick('হ্যাঁ', 'Yes') : '—'}</td>
                  <td className="p-3">{link.isSmsReceiver ? pick('হ্যাঁ', 'Yes') : '—'}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditingLink(link)}>{pick('সম্পাদনা', 'Edit')}</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!links.length && <p className="p-4 text-sm text-muted-foreground">{pick('এখনো কোনো সন্তান যুক্ত নেই।', 'No child is linked yet.')}</p>}
      </Card>
      <ParentFormModal open={editOpen} onClose={() => setEditOpen(false)} parent={parent} />
      <ParentLinkModal db={db} open={linkOpen} onClose={() => setLinkOpen(false)} parentId={parent.id} />
      <ParentLinkEditModal link={editingLink} onClose={() => setEditingLink(null)} />
    </div>
  );
}
